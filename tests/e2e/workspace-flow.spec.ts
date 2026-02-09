import { expect, test, type Page } from "@playwright/test";

const apiOrigin = "http://127.0.0.1:4010";
const appOrigin = "http://127.0.0.1:3005";

const corsHeaders = {
  "access-control-allow-origin": appOrigin,
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "Content-Type,X-Request-Id",
};

async function stubApi(page: Page, askMode: "success" | "error") {
  await page.route(`${apiOrigin}/**`, async (route) => {
    const request = route.request();
    const url = new URL(request.url());

    if (request.method() === "OPTIONS") {
      await route.fulfill({
        status: 204,
        headers: corsHeaders,
      });
      return;
    }

    if (url.pathname === "/dataset/summary" && request.method() === "GET") {
      await route.fulfill({
        status: 200,
        headers: {
          ...corsHeaders,
          "content-type": "application/json",
          "x-request-id": "req_summary",
        },
        body: JSON.stringify({
          data: {
            dataset_id: "ds_1",
            name: "orders.csv",
            rows: 100,
            columns: [
              { name: "day", type: "date" },
              { name: "revenue", type: "number" },
            ],
            sample_rows: [],
          },
        }),
      });
      return;
    }

    if (url.pathname === "/ask" && request.method() === "POST") {
      if (askMode === "error") {
        await route.fulfill({
          status: 500,
          headers: {
            ...corsHeaders,
            "content-type": "application/json",
            "x-request-id": "req_ask_failed",
          },
          body: JSON.stringify({
            detail: "LLM timeout",
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        headers: {
          ...corsHeaders,
          "content-type": "application/json",
          "x-request-id": "req_ask_1",
        },
        body: JSON.stringify({
          data: {
            conversation_id: "conv_1",
            needs_clarification: false,
            clarification_questions: [],
            answer: {
              headline: "revenue dipped",
              narrative: "Revenue declined after weekend traffic dropped.",
              drivers: [],
              charts: [],
              sql: [],
              confidence: {
                level: "high",
                reasons: ["Dataset coverage was complete."],
              },
            },
          },
        }),
      });
      return;
    }

    if (url.pathname === "/voice/transcribe" && request.method() === "POST") {
      await route.fulfill({
        status: 200,
        headers: {
          ...corsHeaders,
          "content-type": "application/json",
          "x-request-id": "req_voice_transcribe",
        },
        body: JSON.stringify({
          data: {
            text: "Why did revenue drop last week?",
          },
        }),
      });
      return;
    }

    if (url.pathname === "/voice/speak" && request.method() === "POST") {
      await route.fulfill({
        status: 200,
        headers: {
          ...corsHeaders,
          "content-type": "audio/mpeg",
          "x-request-id": "req_voice_speak",
        },
        body: "FAKE_AUDIO_BYTES",
      });
      return;
    }

    await route.fulfill({
      status: 404,
      headers: {
        ...corsHeaders,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        detail: "Not found",
      }),
    });
  });
}

test("runs a successful ask flow", async ({ page }) => {
  await stubApi(page, "success");
  await page.goto("/");

  await expect(page.getByText("orders.csv")).toBeVisible();

  await page.getByLabel("Question").fill("Why did revenue drop last week?");
  await page.getByRole("button", { name: "Ask" }).click();

  await expect(page.getByRole("heading", { name: "Revenue Dipped" })).toBeVisible();
  await expect(page.getByText(/Request ID:/)).toBeVisible();
});

test("shows request id when ask request fails", async ({ page }) => {
  await stubApi(page, "error");
  await page.goto("/");

  await expect(page.getByText("orders.csv")).toBeVisible();

  await page.getByLabel("Question").fill("Why did revenue drop last week?");
  await page.getByRole("button", { name: "Ask" }).click();

  await expect(page.getByText("Question failed")).toBeVisible();
  await expect(page.getByText(/LLM timeout/)).toBeVisible();
  await expect(page.getByText(/Request ID:/)).toBeVisible();
});

test("shows read aloud control and triggers voice speak request", async ({ page }) => {
  await stubApi(page, "success");
  await page.goto("/");

  await page.getByLabel("Question").fill("Why did revenue drop last week?");
  await page.getByRole("button", { name: "Ask" }).click();

  await expect(page.getByRole("button", { name: "Read Aloud" })).toBeVisible();

  const speakRequestPromise = page.waitForRequest(
    (request) => request.method() === "POST" && request.url().endsWith("/voice/speak")
  );

  await page.getByRole("button", { name: "Read Aloud" }).click();
  await speakRequestPromise;
});
