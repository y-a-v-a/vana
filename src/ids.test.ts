import { test } from "node:test";
import assert from "node:assert/strict";
import { slugify, isoDate, makeId } from "./ids.ts";

test("slugify lowercases and hyphenates", () => {
  assert.equal(slugify("But is it Art?"), "but-is-it-art");
});

test("slugify strips diacritics and punctuation", () => {
  assert.equal(slugify("la trahison des images — Magritte"), "la-trahison-des-images-magritte");
});

test("slugify trims and collapses whitespace/symbols", () => {
  assert.equal(slugify("  Hello,  World!!  "), "hello-world");
});

test("slugify returns empty for symbol-only input", () => {
  assert.equal(slugify("???"), "");
});

test("isoDate is UTC YYYY-MM-DD regardless of time", () => {
  assert.equal(isoDate(new Date("2026-06-16T23:30:00Z")), "2026-06-16");
});

test("makeId combines date and slug", () => {
  assert.equal(
    makeId("But is it Art?", new Date("2026-06-16T10:00:00Z")),
    "2026-06-16-but-is-it-art",
  );
});

test("makeId falls back to 'untitled' for empty slug", () => {
  assert.equal(makeId("???", new Date("2026-06-16T10:00:00Z")), "2026-06-16-untitled");
});
