import type { ZodTypeAny } from "zod";

import { apiEnvelopeSchema } from "@/lib/api/types";

const DEFAULT_ERROR_MESSAGE = "Something went wrong while contacting Data Ghost API.";

type JsonBody = Record<string, unknown>;

export class ApiClientError extends Error {
  public readonly requestId: string;

  public readonly status: number;

  public readonly details?: unknown;

  constructor(params: {
    message: string;
    status: number;
    requestId: string;
    details?: unknown;
  }) {
    super(params.message);
    this.name = "ApiClientError";
    this.status = params.status;
    this.requestId = params.requestId;
    this.details = params.details;
  }
}

export type ApiResponse<T> = {
  data: T;
  requestId: string;
};

type RequestParams<TSchema extends ZodTypeAny> = {
  method?: "GET" | "POST";
  body?: JsonBody | FormData;
  schema: TSchema;
  path: string;
  requestId: string;
};

type BinaryRequestParams = {
  method?: "GET" | "POST";
  body?: JsonBody | FormData;
  path: string;
  requestId: string;
  accept?: string;
};

export type ApiBinaryResponse = {
  audioBlob: Blob;
  requestId: string;
};

function getApiBaseUrl() {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!baseUrl) {
    throw new ApiClientError({
      message: "Missing NEXT_PUBLIC_API_BASE_URL environment variable.",
      status: 500,
      requestId: "missing-api-base-url",
    });
  }

  return baseUrl.replace(/\/$/, "");
}

function makeHeaders(requestId: string, body?: JsonBody | FormData, accept?: string) {
  const headers = new Headers({
    "X-Request-Id": requestId,
  });

  if (!(body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  if (accept) {
    headers.set("Accept", accept);
  }

  return headers;
}

function extractErrorMessage(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.message === "string") {
    return record.message;
  }

  if (typeof record.detail === "string") {
    return record.detail;
  }

  if (record.error && typeof record.error === "object") {
    const nestedError = record.error as Record<string, unknown>;
    if (typeof nestedError.message === "string") {
      return nestedError.message;
    }
  }

  return null;
}

async function readJson(response: Response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function extractRequestId(payload: unknown) {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const record = payload as Record<string, unknown>;

  if (typeof record.request_id === "string") {
    return record.request_id;
  }

  if (
    record.data &&
    typeof record.data === "object" &&
    typeof (record.data as Record<string, unknown>).request_id === "string"
  ) {
    return (record.data as Record<string, unknown>).request_id as string;
  }

  return null;
}

export async function apiRequest<TSchema extends ZodTypeAny>({
  method = "GET",
  body,
  schema,
  path,
  requestId,
}: RequestParams<TSchema>): Promise<ApiResponse<TSchema["_output"]>> {
  const url = `${getApiBaseUrl()}${path}`;

  const response = await fetch(url, {
    method,
    headers: makeHeaders(requestId, body),
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const json = await readJson(response);
  const envelopeParser = apiEnvelopeSchema(schema);
  const parsedEnvelope = envelopeParser.safeParse(json);
  const parsedRaw = schema.safeParse(json);
  const headerRequestId = response.headers.get("X-Request-Id");

  const responseRequestId =
    headerRequestId ||
    (parsedEnvelope.success && parsedEnvelope.data.request_id) ||
    extractRequestId(json) ||
    requestId;

  if (!response.ok) {
    const fallbackMessage = `Request failed with status ${response.status}.`;
    const message =
      (parsedEnvelope.success && parsedEnvelope.data.error?.message) ||
      extractErrorMessage(json) ||
      fallbackMessage ||
      DEFAULT_ERROR_MESSAGE;

    throw new ApiClientError({
      message,
      status: response.status,
      requestId: responseRequestId,
      details: parsedEnvelope.success ? parsedEnvelope.data.error?.details : json,
    });
  }

  if (!parsedEnvelope.success) {
    if (parsedRaw.success) {
      return {
        data: parsedRaw.data,
        requestId: responseRequestId,
      };
    }

    throw new ApiClientError({
      message: "The API returned an unexpected response shape.",
      status: response.status,
      requestId: responseRequestId,
      details: parsedEnvelope.error.flatten(),
    });
  }

  return {
    data: parsedEnvelope.data.data as TSchema["_output"],
    requestId: responseRequestId,
  };
}

export async function apiBinaryRequest({
  method = "POST",
  body,
  path,
  requestId,
  accept = "audio/mpeg",
}: BinaryRequestParams): Promise<ApiBinaryResponse> {
  const url = `${getApiBaseUrl()}${path}`;

  const response = await fetch(url, {
    method,
    headers: makeHeaders(requestId, body, accept),
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
  });

  const json = await readJson(response.clone());
  const responseRequestId =
    response.headers.get("X-Request-Id") || extractRequestId(json) || requestId;

  if (!response.ok) {
    const fallbackMessage = `Request failed with status ${response.status}.`;
    const message = extractErrorMessage(json) || fallbackMessage || DEFAULT_ERROR_MESSAGE;

    throw new ApiClientError({
      message,
      status: response.status,
      requestId: responseRequestId,
      details: json,
    });
  }

  return {
    audioBlob: await response.blob(),
    requestId: responseRequestId,
  };
}
