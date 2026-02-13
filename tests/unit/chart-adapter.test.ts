// @vitest-environment node
import { describe, expect, it } from "vitest";

import { adaptAnswerChart } from "@/components/results/chart-adapter";

describe("adaptAnswerChart", () => {
  it("adapts line chart data with string x-axis key", () => {
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

  it("falls back to first key when no clear non-metric key exists", () => {
    const adapted = adaptAnswerChart({
      kind: "bar",
      title: "All numeric dimensions",
      data: [
        { week: 1, revenue: 100 },
        { week: 2, revenue: 120 },
      ],
    });

    expect(adapted).not.toBeNull();

    if (adapted) {
      expect(adapted.xKey).toBe("week");
      expect(adapted.yKeys).toEqual(["week", "revenue"]);
    }
  });

  it("returns null when no numeric series exists", () => {
    const adapted = adaptAnswerChart({
      kind: "bar",
      title: "No metrics",
      data: [
        { bucket: "a", label: "Segment A" },
        { bucket: "b", label: "Segment B" },
      ],
    });

    expect(adapted).toBeNull();
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
