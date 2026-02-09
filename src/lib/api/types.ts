import { z } from "zod";

const apiErrorSchema = z
  .object({
    message: z.string().optional(),
    code: z.string().optional(),
    details: z.unknown().optional(),
  })
  .passthrough();

export const apiEnvelopeSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z
    .object({
      data: dataSchema,
      error: apiErrorSchema.optional(),
      request_id: z.string().optional(),
    })
    .passthrough();

export const datasetColumnSchema = z.object({
  name: z.string(),
  type: z.string(),
});

export const datasetUploadSchema = z.object({
  dataset_id: z.string(),
  name: z.string(),
  rows: z.number(),
  columns: z.array(datasetColumnSchema),
  created_at: z.string().optional(),
});

const datasetUploadLegacySchema = z.object({
  dataset_id: z.string(),
  table_name: z.string(),
  rows: z.number(),
  columns: z.array(z.string()),
  schema: z.record(z.string(), z.string()).optional(),
});

function isLegacyDatasetUpload(
  payload: z.infer<typeof datasetUploadSchema> | z.infer<typeof datasetUploadLegacySchema>
): payload is z.infer<typeof datasetUploadLegacySchema> {
  return "table_name" in payload;
}

export const datasetUploadCompatibleSchema = z
  .union([datasetUploadSchema, datasetUploadLegacySchema])
  .transform((payload) => {
    if (!isLegacyDatasetUpload(payload)) {
      return payload;
    }

    const inferredSchema = payload.schema || {};

    return {
      dataset_id: payload.dataset_id,
      name: payload.table_name,
      rows: payload.rows,
      columns: payload.columns.map((column) => ({
        name: column,
        type: inferredSchema[column] || "unknown",
      })),
      created_at: undefined,
    };
  });

export const contextUploadSchema = z.object({
  doc_id: z.string(),
  filename: z.string(),
  pages: z.number().optional(),
  chunks: z.number().optional(),
  created_at: z.string(),
});

export const datasetSummarySchema = z.object({
  dataset_id: z.string(),
  name: z.string(),
  rows: z.number(),
  columns: z.array(datasetColumnSchema),
  sample_rows: z.array(z.record(z.string(), z.unknown())),
  stats: z.record(z.string(), z.unknown()).optional(),
  created_at: z.string().optional(),
});

const datasetSummaryLegacySchema = z.object({
  dataset_id: z.string(),
  name: z.string(),
  table_name: z.string().optional(),
  rows: z.number(),
  columns: z.array(z.string()),
  schema: z.record(z.string(), z.string()).optional(),
  sample_rows: z.array(z.record(z.string(), z.unknown())).default([]),
  created_at: z.string().optional(),
});

function isLegacyDatasetSummary(
  payload:
    | z.infer<typeof datasetSummarySchema>
    | z.infer<typeof datasetSummaryLegacySchema>
): payload is z.infer<typeof datasetSummaryLegacySchema> {
  return payload.columns.length === 0 || typeof payload.columns[0] === "string";
}

export const datasetSummaryCompatibleSchema = z
  .union([datasetSummarySchema, datasetSummaryLegacySchema])
  .transform((payload) => {
    if (!isLegacyDatasetSummary(payload)) {
      return payload;
    }

    const inferredSchema = payload.schema || {};

    return {
      dataset_id: payload.dataset_id,
      name: payload.name,
      rows: payload.rows,
      columns: payload.columns.map((column) => ({
        name: column,
        type: inferredSchema[column] || "unknown",
      })),
      sample_rows: payload.sample_rows,
      created_at: payload.created_at,
      stats: undefined,
    };
  });

export const clarificationQuestionSchema = z.object({
  key: z.string(),
  type: z.string(),
  prompt: z.string(),
  options: z.array(z.string()).optional(),
});

const answerDriverSchema = z.object({
  name: z.string(),
  contribution: z.number(),
  evidence: z.unknown().optional(),
});

export const answerChartSchema = z.object({
  kind: z.enum(["line", "bar"]),
  title: z.string(),
  data: z.unknown(),
});

const answerSqlSchema = z.object({
  label: z.string(),
  query: z.string(),
});

const confidenceSchema = z.object({
  level: z.enum(["high", "medium", "low", "insufficient"]),
  reasons: z.array(z.string()).default([]),
});

const costSchema = z.object({
  model: z.string(),
  prompt_tokens: z.number(),
  completion_tokens: z.number(),
  usd: z.number(),
});

const answerSchema = z.object({
  headline: z.string(),
  narrative: z.string(),
  drivers: z.array(answerDriverSchema).default([]),
  charts: z.array(answerChartSchema).default([]),
  sql: z.array(answerSqlSchema).default([]),
  confidence: confidenceSchema,
  cost: costSchema.optional(),
});

const askFinalResponseSchema = z.object({
  conversation_id: z.string(),
  needs_clarification: z.literal(false),
  clarification_questions: z.array(clarificationQuestionSchema).optional().default([]),
  answer: answerSchema,
});

const askClarificationResponseSchema = z.object({
  conversation_id: z.string(),
  needs_clarification: z.literal(true),
  clarification_questions: z.array(clarificationQuestionSchema),
});

export const askResponseSchema = z.union([
  askFinalResponseSchema,
  askClarificationResponseSchema,
]);

export const askRequestSchema = z.object({
  question: z.string().min(1),
  conversation_id: z.string().optional(),
  clarifications: z.record(z.string(), z.unknown()).optional(),
});

export const voiceTranscribeResponseSchema = z.object({
  text: z.string(),
  provider: z.string().optional(),
  model: z.string().optional(),
});

export const voiceSpeakRequestSchema = z.object({
  text: z.string().min(1),
  voice_id: z.string().nullable().optional(),
});

export type DatasetColumn = z.infer<typeof datasetColumnSchema>;
export type DatasetUpload = z.infer<typeof datasetUploadSchema>;
export type ContextUpload = z.infer<typeof contextUploadSchema>;
export type DatasetSummary = z.infer<typeof datasetSummarySchema>;
export type ClarificationQuestion = z.infer<typeof clarificationQuestionSchema>;
export type AskResponse = z.infer<typeof askResponseSchema>;
export type AskRequest = z.infer<typeof askRequestSchema>;
export type AnswerChart = z.infer<typeof answerChartSchema>;
export type VoiceTranscribeResponse = z.infer<typeof voiceTranscribeResponseSchema>;
export type VoiceSpeakRequest = z.infer<typeof voiceSpeakRequestSchema>;
