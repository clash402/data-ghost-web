import { apiBinaryRequest, apiRequest } from "@/lib/api/client";
import {
  askRequestSchema,
  askResponseSchema,
  contextUploadSchema,
  datasetSummaryCompatibleSchema,
  datasetUploadCompatibleSchema,
  type AskRequest,
  type VoiceSpeakRequest,
  voiceSpeakRequestSchema,
  voiceTranscribeResponseSchema,
} from "@/lib/api/types";

export function uploadDataset(file: File, requestId: string) {
  const formData = new FormData();
  formData.set("file", file);

  return apiRequest({
    method: "POST",
    path: "/upload/dataset",
    body: formData,
    schema: datasetUploadCompatibleSchema,
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
    schema: datasetSummaryCompatibleSchema,
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

export function transcribeVoice(file: File, requestId: string) {
  const formData = new FormData();
  formData.set("file", file);

  return apiRequest({
    method: "POST",
    path: "/voice/transcribe",
    body: formData,
    schema: voiceTranscribeResponseSchema,
    requestId,
  });
}

export function speakText(payload: VoiceSpeakRequest, requestId: string) {
  const parsedPayload = voiceSpeakRequestSchema.parse(payload);

  return apiBinaryRequest({
    method: "POST",
    path: "/voice/speak",
    body: parsedPayload,
    requestId,
  });
}
