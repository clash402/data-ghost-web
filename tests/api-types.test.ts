import { describe, expect, it } from "vitest";

import {
  apiEnvelopeSchema,
  askResponseSchema,
  datasetSummarySchema,
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
});
