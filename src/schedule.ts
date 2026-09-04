/**
 * Weekly wake schedule: "Mon, Thu, Sat at 12:00" rather than "every N hours".
 *
 * All arithmetic is in the machine's local timezone (Europe/Amsterdam here), so
 * a wake stays at the same wall-clock time across DST changes. Pure and
 * dependency-free — `daemon.ts` only asks it when the next wake is due.
 */

export const DAY_NAMES = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type DayName = (typeof DAY_NAMES)[number];

export interface Schedule {
  days: DayName[];
  hour: number;
  minute: number;
}

/**
 * The first scheduled moment strictly after `now`.
 *
 * "Strictly after" is what stops a wake that finishes at 12:06 from immediately
 * re-firing for its own 12:00 slot.
 */
export function nextWakeAt(schedule: Schedule, now: Date): Date {
  const wanted = new Set(schedule.days.map((d) => DAY_NAMES.indexOf(d)));
  if (wanted.size === 0) throw new Error("schedule.days is empty");

  // At most 7 candidates: today, then each following day.
  for (let ahead = 0; ahead <= 7; ahead++) {
    const at = new Date(now.getFullYear(), now.getMonth(), now.getDate() + ahead, schedule.hour, schedule.minute, 0, 0);
    if (wanted.has(at.getDay()) && at.getTime() > now.getTime()) return at;
  }
  /* c8 ignore next */
  throw new Error("no next wake within a week — schedule is malformed");
}

/** Human-readable form for the daemon log, e.g. "mon,thu,sat at 12:00". */
export function describeSchedule(schedule: Schedule): string {
  const hh = String(schedule.hour).padStart(2, "0");
  const mm = String(schedule.minute).padStart(2, "0");
  return `${schedule.days.join(",")} at ${hh}:${mm}`;
}
