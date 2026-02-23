jest.mock("../../i18n", () => ({ __esModule: true, default: { t: (k: string) => k } }));

import { parseDateLocal } from "../dateUtils";

describe("parseDateLocal", () => {
  it("parses YYYY-MM-DD as local date", () => {
    const d = parseDateLocal("2024-02-21");
    expect(d.getFullYear()).toBe(2024);
    expect(d.getMonth()).toBe(1);
    expect(d.getDate()).toBe(21);
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it("returns correct local midnight (no UTC shift)", () => {
    const d = parseDateLocal("2024-06-15");
    expect(d.getDate()).toBe(15);
    expect(d.getMonth()).toBe(5);
  });
});
