const relativeFormatter = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
const dateFormatter = new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" });

const units: Array<[Intl.RelativeTimeFormatUnit, number]> = [
  ["year", 60 * 60 * 24 * 365],
  ["month", 60 * 60 * 24 * 30],
  ["week", 60 * 60 * 24 * 7],
  ["day", 60 * 60 * 24],
  ["hour", 60 * 60],
  ["minute", 60],
];

/** "3 hours ago", "yesterday", "just now". `now` is injectable for deterministic rendering. */
export function formatRelativeTime(date: Date, now: Date = new Date()) {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000);
  for (const [unit, size] of units) {
    if (Math.abs(seconds) >= size) return relativeFormatter.format(Math.round(seconds / size), unit);
  }
  return "just now";
}

export function formatDate(date: Date) {
  return dateFormatter.format(date);
}

export function hostOf(url: string) {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

export function initialsOf(nameOrEmail: string) {
  const base = nameOrEmail.split("@")[0];
  const parts = base.split(/[\s._-]+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : base.slice(0, 2)).toUpperCase();
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}
