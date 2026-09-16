import { test } from "node:test";
import assert from "node:assert/strict";
import { histogram, modeShare } from "./jury-stats.ts";

test("histogram counts and sorts by value", () => {
  assert.deepEqual([...histogram([40, 38, 40, 43, 40])], [[38, 1], [40, 3], [43, 1]]);
});

test("modeShare reports the dominant total and its share", () => {
  assert.deepEqual(modeShare([40, 38, 40, 43]), { mode: 40, share: 0.5 });
  assert.deepEqual(modeShare([]), { mode: 0, share: 0 });
});
