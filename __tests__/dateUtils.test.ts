import {
  formatDate,
  formatDateTime,
  formatShortDate,
  parseDateOnly,
} from "@/utils/dateUtils";

describe("date utilities", () => {
  it("parses a date-only value without shifting the calendar date", () => {
    const date = parseDateOnly("2026-10-03");

    expect(date.getFullYear()).toBe(2026);
    expect(date.getMonth()).toBe(9);
    expect(date.getDate()).toBe(3);
  });

  it("formats a date for the app's en-IN locale", () => {
    expect(formatDate("2026-10-03")).toBe("03 Oct 2026");
    expect(formatShortDate("2026-10-03")).toBe("03 Oct");
  });

  it("formats an ISO date-time value", () => {
    const result = formatDateTime("2026-10-03T10:30:00.000Z");

    expect(result).toMatch(/^03 Oct 2026, \d{2}:\d{2} (am|pm)$/i);
  });
});
