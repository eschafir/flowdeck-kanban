export type DeadlineLevel = "overdue" | "today" | "soon" | "week" | "later";

export type DeadlineStatus = {
  level: DeadlineLevel;
  daysLeft: number;
  label: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

/** Local `YYYY-MM-DD` for a date. */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function todayKey(now: Date = new Date()): string {
  return toDateKey(now);
}

/** Local-midnight date; `new Date("YYYY-MM-DD")` would be UTC and can shift the day. */
export function parseLocalDate(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function daysBetween(fromKey: string, toKey: string): number {
  const diff = parseLocalDate(toKey).getTime() - parseLocalDate(fromKey).getTime();
  return Math.round(diff / MS_PER_DAY);
}

export function formatDeadline(key: string): string {
  return parseLocalDate(key).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function getDeadlineStatus(
  deadline: string,
  today: string = todayKey()
): DeadlineStatus {
  const daysLeft = daysBetween(today, deadline);

  if (daysLeft < 0) {
    return { level: "overdue", daysLeft, label: `Overdue ${-daysLeft}d` };
  }
  if (daysLeft === 0) {
    return { level: "today", daysLeft, label: "Due today" };
  }
  if (daysLeft <= 2) {
    return {
      level: "soon",
      daysLeft,
      label: daysLeft === 1 ? "Due tomorrow" : `Due in ${daysLeft} days`,
    };
  }
  if (daysLeft <= 7) {
    return { level: "week", daysLeft, label: `Due in ${daysLeft} days` };
  }
  return { level: "later", daysLeft, label: formatDeadline(deadline) };
}
