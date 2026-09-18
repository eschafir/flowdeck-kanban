import { describe, expect, it } from "vitest";
import {
  daysBetween,
  getDeadlineStatus,
  parseLocalDate,
  toDateKey,
} from "./deadline";

const TODAY = "2026-09-18";

describe("getDeadlineStatus", () => {
  it.each([
    ["2026-09-15", "overdue", -3, "Overdue 3d"],
    ["2026-09-17", "overdue", -1, "Overdue 1d"],
    ["2026-09-18", "today", 0, "Due today"],
    ["2026-09-19", "soon", 1, "Due tomorrow"],
    ["2026-09-20", "soon", 2, "Due in 2 days"],
    ["2026-09-21", "week", 3, "Due in 3 days"],
    ["2026-09-25", "week", 7, "Due in 7 days"],
  ])("%s -> %s", (deadline, level, daysLeft, label) => {
    expect(getDeadlineStatus(deadline, TODAY)).toEqual({
      level,
      daysLeft,
      label,
    });
  });

  it("uses a neutral level beyond a week", () => {
    const status = getDeadlineStatus("2026-09-26", TODAY);
    expect(status.level).toBe("later");
    expect(status.daysLeft).toBe(8);
  });

  it("handles month and year rollover", () => {
    expect(getDeadlineStatus("2027-01-01", "2026-12-31").level).toBe("soon");
    expect(getDeadlineStatus("2026-10-01", "2026-09-30").daysLeft).toBe(1);
  });
});

describe("date helpers", () => {
  it("parses keys as local dates without shifting the day", () => {
    const date = parseLocalDate("2026-03-01");
    expect(date.getDate()).toBe(1);
    expect(date.getMonth()).toBe(2);
    expect(toDateKey(date)).toBe("2026-03-01");
  });

  it("counts whole days across a DST change", () => {
    expect(daysBetween("2026-03-01", "2026-03-15")).toBe(14);
    expect(daysBetween("2026-10-25", "2026-11-05")).toBe(11);
  });
});
