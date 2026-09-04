import { test } from "node:test";
import assert from "node:assert/strict";
import { nextWakeAt, describeSchedule, type Schedule } from "./schedule.ts";

const monThuSat: Schedule = { days: ["mon", "thu", "sat"], hour: 12, minute: 0 };

// Local-time constructor, so these assertions read as wall clock — which is what
// the schedule promises.
const at = (y: number, m: number, d: number, h = 0, min = 0): Date => new Date(y, m - 1, d, h, min, 0, 0);

test("nextWakeAt picks today when the slot is still ahead", () => {
  // Mon 2026-09-07, 09:00 → today at 12:00.
  assert.deepEqual(nextWakeAt(monThuSat, at(2026, 9, 7, 9)), at(2026, 9, 7, 12));
});

test("nextWakeAt skips today once the slot has passed", () => {
  // Mon 12:06, just after a wake finished → Thu, not a second Monday run.
  assert.deepEqual(nextWakeAt(monThuSat, at(2026, 9, 7, 12, 6)), at(2026, 9, 10, 12));
});

test("nextWakeAt treats the slot itself as passed, so a wake cannot re-fire", () => {
  assert.deepEqual(nextWakeAt(monThuSat, at(2026, 9, 7, 12, 0)), at(2026, 9, 10, 12));
});

test("nextWakeAt walks the whole week: Thu→Sat, Sat→Mon across the weekend", () => {
  assert.deepEqual(nextWakeAt(monThuSat, at(2026, 9, 10, 13)), at(2026, 9, 12, 12));
  assert.deepEqual(nextWakeAt(monThuSat, at(2026, 9, 12, 13)), at(2026, 9, 14, 12));
});

test("nextWakeAt lands on the next month and year without special-casing", () => {
  // Mon 2026-09-28 13:00 → Thu 2026-10-01.
  assert.deepEqual(nextWakeAt(monThuSat, at(2026, 9, 28, 13)), at(2026, 10, 1, 12));
  // Thu 2026-12-31 13:00 → Sat 2027-01-02.
  assert.deepEqual(nextWakeAt(monThuSat, at(2026, 12, 31, 13)), at(2027, 1, 2, 12));
});

test("nextWakeAt keeps the wall-clock hour across the DST change", () => {
  // Europe/Amsterdam falls back on Sun 2026-10-25. The Thu before and the Sat
  // after must both be 12:00 local, even though the UTC offset differs.
  const before = nextWakeAt(monThuSat, at(2026, 10, 22, 13));
  const after = nextWakeAt(monThuSat, at(2026, 10, 26, 13));
  assert.equal(before.getHours(), 12);
  assert.equal(after.getHours(), 12);
});

test("nextWakeAt honours a non-zero minute", () => {
  const s: Schedule = { days: ["mon"], hour: 7, minute: 30 };
  assert.deepEqual(nextWakeAt(s, at(2026, 9, 7, 7, 29)), at(2026, 9, 7, 7, 30));
  assert.deepEqual(nextWakeAt(s, at(2026, 9, 7, 7, 31)), at(2026, 9, 14, 7, 30));
});

test("nextWakeAt with every day is never more than 24h out", () => {
  const daily: Schedule = { days: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"], hour: 12, minute: 0 };
  const now = at(2026, 9, 7, 12, 1);
  assert.ok(nextWakeAt(daily, now).getTime() - now.getTime() <= 24 * 3_600_000);
});

test("nextWakeAt rejects an empty day list rather than looping forever", () => {
  assert.throws(() => nextWakeAt({ days: [], hour: 12, minute: 0 }, at(2026, 9, 7)), /empty/);
});

test("describeSchedule renders a zero-padded wall clock for the log", () => {
  assert.equal(describeSchedule(monThuSat), "mon,thu,sat at 12:00");
  assert.equal(describeSchedule({ days: ["mon"], hour: 7, minute: 5 }), "mon at 07:05");
});
