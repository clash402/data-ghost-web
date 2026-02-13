// @vitest-environment node
import { describe, expect, it } from "vitest";

import {
  apiEnvelopeSchema,
  askResponseSchema,
  datasetSummaryCompatibleSchema,
  datasetSummarySchema,
  datasetUploadCompatibleSchema,
} from "@/lib/api/types";

describe("API schemas", () => {
  it("parses dataset summary envelope", () => {
    const schema = apiEnvelopeSchema(datasetSummarySchema);
    const parsed = schema.safeParse({
      data: {
        dataset_id: "ds_123",
        name: "orders.csv",
        rows: 100,
        columns: [{ name: "date", type: "date" }],
        sample_rows: [{ date: "2026-02-01" }],
      },
      request_id: "req_123",
    });

    expect(parsed.success).toBe(true);
  });

  it("parses ask response requiring clarification", () => {
    const parsed = askResponseSchema.safeParse({
      conversation_id: "conv_123",
      needs_clarification: true,
      clarification_questions: [
        {
          key: "metric",
          type: "select",
          prompt: "Which metric?",
          options: ["revenue", "orders"],
        },
      ],
    });

    expect(parsed.success).toBe(true);

    if (parsed.success) {
      expect(parsed.data.needs_clarification).toBe(true);
    }
  });

  it("normalizes legacy dataset upload payloads", () => {
    const parsed = datasetUploadCompatibleSchema.parse({
      dataset_id: "ds_legacy",
      table_name: "legacy_orders",
      rows: 12,
      columns: ["order_date", "revenue", "region"],
      schema: {
        order_date: "date",
        revenue: "number",
      },
    });

    expect(parsed.name).toBe("legacy_orders");
    expect(parsed.columns).toEqual([
      { name: "order_date", type: "date" },
      { name: "revenue", type: "number" },
      { name: "region", type: "unknown" },
    ]);
  });

  it("normalizes legacy dataset summary payloads", () => {
    const parsed = datasetSummaryCompatibleSchema.parse({
      dataset_id: "ds_legacy",
      name: "orders.csv",
      rows: 3,
      columns: ["order_date", "revenue"],
      schema: {
        order_date: "date",
      },
    });

    expect(parsed.columns).toEqual([
      { name: "order_date", type: "date" },
      { name: "revenue", type: "unknown" },
    ]);
    expect(parsed.sample_rows).toEqual([]);
  });
});
