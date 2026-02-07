import { apiRequest } from "@/lib/api/client";
import {
  askRequestSchema,
  askResponseSchema,
  contextUploadSchema,
  datasetSummarySchema,
  datasetUploadSchema,
  type AskRequest,
} from "@/lib/api/types";

export function uploadDataset(file: File, requestId: string) {
  const formData = new FormData();
  formData.set("file", file);

  return apiRequest({
    method: "POST",
    path: "/upload/dataset",
    body: formData,
    schema: datasetUploadSchema,
    requestId,
  });
}

export function uploadContextDocument(file: File, requestId: string) {
  const formData = new FormData();
  formData.set("file", file);

  return apiRequest({
    method: "POST",
    path: "/upload/context",
    body: formData,
    schema: contextUploadSchema,
    requestId,
  });
}

export function getDatasetSummary(requestId: string) {
  return apiRequest({
    path: "/dataset/summary",
    schema: datasetSummarySchema,
    requestId,
  });
}

export function askQuestion(payload: AskRequest, requestId: string) {
  const parsedPayload = askRequestSchema.parse(payload);

  return apiRequest({
    method: "POST",
    path: "/ask",
    body: parsedPayload,
    schema: askResponseSchema,
    requestId,
  });
}
