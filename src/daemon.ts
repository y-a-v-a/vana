import { mkdirSync } from "node:fs";
import { join } from "node:path";
import { loadConfig } from "./config.ts";
import { runWake, type AcceptedContext } from "./loop.ts";
import { sendCandidateEmail } from "./notify.ts";
import { startDashboard } from "./dashboard.ts";
import { withLock } from "./lock.ts";
import { nextWakeAt, describeSchedule } from "./schedule.ts";

// The long-running process: serves the approval dashboard continuously AND
// wakes on the configured schedule (weekly days+time, or a plain interval) to
// generate → jury → email. Designed to run under launchd (RunAtLoad +
// KeepAlive). See ops/DAEMON.md.

const ts = (): string => new Date().toISOString();

let waking = false;

async function wake(): Promise<void> {
  if (waking) {
    console.log(`[daemon] ${ts()} wake skipped — previous still running`);
    return;
  }
  waking = true;
  const t0 = Date.now();
  console.log(`[daemon] ${ts()} wake start`);
  try {
    const result = await withLock(() =>
      runWake({
      onAccepted: async (ctx: AcceptedContext) => {
        // An email failure must not crash the wake — the candidate is already
        // safely in pending/ and committed. Log and carry on.
        try {
          await sendCandidateEmail(ctx.id, ctx.meta, ctx.verdict);
          console.log(`[daemon] ${ts()} emailed ${ctx.id}`);
        } catch (err) {
          console.error(`[daemon] ${ts()} email failed for ${ctx.id}: ${(err as Error).message}`);
        }
      },
      }),
    );
    console.log(`[daemon] ${ts()} wake done in ${((Date.now() - t0) / 1000).toFixed(0)}s: ${JSON.stringify(result)}`);
  } catch (err) {
    console.error(`[daemon] ${ts()} wake error: ${(err as Error).message}`);
  } finally {
    waking = false;
  }
}

function main(): void {
  const cfg = loadConfig();
  mkdirSync(join(cfg.abs.root, "logs"), { recursive: true });
  startDashboard();

  const intervalMs = cfg.interval.hours * 3_600_000;
  const cadence = cfg.schedule ? describeSchedule(cfg.schedule) : `every ${cfg.interval.hours}h`;
  console.log(
    `[daemon] ${ts()} up. wakes=${cadence} work-budget=${cfg.workBudget.minutes}min ` +
      `fuse=$${cfg.costFuse.perWakeUsd}/wake $${cfg.costFuse.perDayUsd}/day generator=${cfg.models.generator} jury=${cfg.models.jury}`,
  );

  // Timers are re-armed in short ticks rather than one long setTimeout: a machine
  // that sleeps (or a clock/DST change) would otherwise fire late and silently
  // drift. Each tick just re-checks the wall clock against the due moment.
  const TICK_MS = 3_600_000;

  const scheduleNext = (): void => {
    const due = cfg.schedule ? nextWakeAt(cfg.schedule, new Date()) : new Date(Date.now() + intervalMs);
    console.log(`[daemon] ${ts()} next wake at ${due.toISOString()} (${due.toString()})`);
    const tick = (): void => {
      const remaining = due.getTime() - Date.now();
      if (remaining <= 0) return void wake().finally(scheduleNext);
      setTimeout(tick, Math.min(remaining, TICK_MS));
    };
    tick();
  };

  if (process.env.VANA_WAKE_ON_START) {
    console.log(`[daemon] ${ts()} VANA_WAKE_ON_START set — waking now`);
    void wake().finally(scheduleNext);
  } else {
    scheduleNext();
  }

  for (const sig of ["SIGTERM", "SIGINT"] as const) {
    process.on(sig, () => {
      console.log(`[daemon] ${ts()} ${sig} — exiting`);
      process.exit(0);
    });
  }
}

main();
