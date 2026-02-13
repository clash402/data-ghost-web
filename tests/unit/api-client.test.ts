// @vitest-environment node
import { z } from "zod";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ApiClientError, apiRequest } from "@/lib/api/client";

const successSchema = z.object({
  ok: z.boolean(),
});

describe("apiRequest", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.com");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("uses header request id when available", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { ok: true }, request_id: "req_from_body" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "X-Request-Id": "req_from_header",
        },
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const response = await apiRequest({
      path: "/health",
      requestId: "req_from_client",
      schema: successSchema,
    });

    expect(response).toEqual({
      data: { ok: true },
      requestId: "req_from_header",
    });
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.example.com/health",
      expect.objectContaining({
        method: "GET",
      })
    );
  });

  it("supports success payloads that are not wrapped in envelopes", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        })
      )
    );

    const response = await apiRequest({
      path: "/health",
      requestId: "req_from_client",
      schema: successSchema,
    });

    expect(response).toEqual({
      data: { ok: true },
      requestId: "req_from_client",
    });
  });

  it("throws ApiClientError with extracted detail for failed requests", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "Dataset is missing." }), {
          status: 404,
          headers: {
            "Content-Type": "application/json",
            "X-Request-Id": "req_404",
          },
        })
      )
    );

    await expect(
      apiRequest({
        path: "/dataset/summary",
        requestId: "req_from_client",
        schema: successSchema,
      })
    ).rejects.toMatchObject({
      name: "ApiClientError",
      message: "Dataset is missing.",
      status: 404,
      requestId: "req_404",
    });
  });

  it("throws a shape error when successful payload does not match schema", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: { wrong: "shape" } }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        })
      )
    );

    await expect(
      apiRequest({
        path: "/health",
        requestId: "req_from_client",
        schema: successSchema,
      })
    ).rejects.toMatchObject({
      name: "ApiClientError",
      message: "The API returned an unexpected response shape.",
      status: 200,
      requestId: "req_from_client",
    });
  });

  it("throws when NEXT_PUBLIC_API_BASE_URL is missing", async () => {
    vi.unstubAllEnvs();

    await expect(
      apiRequest({
        path: "/health",
        requestId: "req_from_client",
        schema: successSchema,
      })
    ).rejects.toBeInstanceOf(ApiClientError);
  });
});
