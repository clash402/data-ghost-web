import { describe, expect, it } from "vitest";

import { adaptAnswerChart } from "@/components/results/chart-adapter";

describe("adaptAnswerChart", () => {
  it("adapts line chart data", () => {
    const adapted = adaptAnswerChart({
      kind: "line",
      title: "Revenue over time",
      data: [
        { day: "Mon", revenue: 100, orders: 5 },
        { day: "Tue", revenue: 120, orders: 7 },
      ],
    });

    expect(adapted).not.toBeNull();

    if (adapted) {
      expect(adapted.xKey).toBe("day");
      expect(adapted.yKeys).toContain("revenue");
      expect(adapted.yKeys).toContain("orders");
    }
  });

  it("returns null for unsupported chart shape", () => {
    const adapted = adaptAnswerChart({
      kind: "bar",
      title: "Broken",
      data: [{ label: "segment-a" }],
    });

    expect(adapted).toBeNull();
  });
});
