export interface CalendarDay {
  date: string;
  contributionCount: number;
}

export interface RepoLang {
  primaryLanguage: { name: string } | null;
}

export function computeStreaks(days: CalendarDay[]): { longest: number; current: number } {
  let longest = 0;
  let run = 0;
  for (const d of days) {
    run = d.contributionCount > 0 ? run + 1 : 0;
    if (run > longest) longest = run;
  }
  return { longest, current: run };
}

export function busiestDay(days: CalendarDay[]): { date: string; count: number } {
  let best = { date: "", count: 0 };
  for (const d of days) {
    if (d.contributionCount > best.count) best = { date: d.date, count: d.contributionCount };
  }
  return best;
}

export function topLanguages(repos: RepoLang[]): { name: string; percent: number }[] {
  const counts = new Map<string, number>();
  for (const r of repos) {
    const name = r.primaryLanguage?.name;
    if (name) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  const total = [...counts.values()].reduce((a, b) => a + b, 0);
  if (total === 0) return [];
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, n]) => ({ name, percent: Math.round((n / total) * 100) }));
}

export function nightOwlPercent(isoTimestamps: string[]): number {
  if (isoTimestamps.length === 0) return 0;
  const night = isoTimestamps.filter((t) => {
    const h = new Date(t).getUTCHours();
    return h >= 22 || h < 4;
  }).length;
  return Math.round((night / isoTimestamps.length) * 100);
}
