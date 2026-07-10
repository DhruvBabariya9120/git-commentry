import { describe, it, expect } from "vitest";
import { computeStreaks, busiestDay, topLanguages, nightOwlPercent } from "@/lib/stats";

const day = (date: string, contributionCount: number) => ({ date, contributionCount });

describe("computeStreaks", () => {
  it("finds longest run of consecutive active days", () => {
    const days = [
      day("2026-01-01", 2), day("2026-01-02", 1), day("2026-01-03", 0),
      day("2026-01-04", 5), day("2026-01-05", 1), day("2026-01-06", 3),
    ];
    expect(computeStreaks(days)).toEqual({ longest: 3, current: 3 });
  });
  it("current streak is 0 when last day inactive", () => {
    const days = [day("2026-01-01", 4), day("2026-01-02", 0)];
    expect(computeStreaks(days)).toEqual({ longest: 1, current: 0 });
  });
  it("handles empty and all-zero input", () => {
    expect(computeStreaks([])).toEqual({ longest: 0, current: 0 });
    expect(computeStreaks([day("2026-01-01", 0)])).toEqual({ longest: 0, current: 0 });
  });
});

describe("busiestDay", () => {
  it("returns max day, first wins ties", () => {
    const days = [day("2026-02-01", 3), day("2026-02-02", 9), day("2026-02-03", 9)];
    expect(busiestDay(days)).toEqual({ date: "2026-02-02", count: 9 });
  });
  it("empty input → zero day", () => {
    expect(busiestDay([])).toEqual({ date: "", count: 0 });
  });
});

describe("topLanguages", () => {
  it("aggregates by language, percent of total, top 5, sorted desc", () => {
    const repos = [
      { primaryLanguage: { name: "TypeScript" } },
      { primaryLanguage: { name: "TypeScript" } },
      { primaryLanguage: { name: "Python" } },
      { primaryLanguage: null },
    ];
    expect(topLanguages(repos)).toEqual([
      { name: "TypeScript", percent: 67 },
      { name: "Python", percent: 33 },
    ]);
  });
  it("empty → empty array", () => {
    expect(topLanguages([])).toEqual([]);
  });
});

describe("nightOwlPercent", () => {
  it("percent of timestamps between 22:00 and 03:59 UTC", () => {
    const ts = [
      "2026-07-01T23:30:00Z",
      "2026-07-02T02:00:00Z",
      "2026-07-02T10:00:00Z",
      "2026-07-02T14:00:00Z",
    ];
    expect(nightOwlPercent(ts)).toBe(50);
  });
  it("empty → 0", () => {
    expect(nightOwlPercent([])).toBe(0);
  });
});
