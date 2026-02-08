import { describe, expect, it } from "vitest";

import { formatContribution } from "@/lib/utils/format";

describe("formatContribution", () => {
  it("formats values in [-1, 1] as percentages", () => {
    expect(formatContribution(0.1234)).toBe("12.3%");
    expect(formatContribution(1)).toBe("100.0%");
    expect(formatContribution(-1)).toBe("-100.0%");
  });

  it("formats values outside [-1, 1] as plain numbers", () => {
    expect(formatContribution(1.1)).toBe("1.1");
    expect(formatContribution(-2500)).toBe("-2,500");
  });
});
