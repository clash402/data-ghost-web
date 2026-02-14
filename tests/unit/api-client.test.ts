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

  it("uses Fly backend in production when localhost is configured", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { ok: true } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "http://localhost:8000");
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest({
      path: "/health",
      requestId: "req_from_client",
      schema: successSchema,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://data-ghost-backend.fly.dev/health",
      expect.anything()
    );
  });

  it("keeps localhost in production when NEXT_PUBLIC_USE_LOCAL_API_IN_PROD=true", async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: { ok: true } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      })
    );

    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.com");
    vi.stubEnv("NEXT_PUBLIC_USE_LOCAL_API_IN_PROD", "true");
    vi.stubGlobal("fetch", fetchMock);

    await apiRequest({
      path: "/health",
      requestId: "req_from_client",
      schema: successSchema,
    });

    expect(fetchMock).toHaveBeenCalledWith("http://localhost:8000/health", expect.anything());
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
