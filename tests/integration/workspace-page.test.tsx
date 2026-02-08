import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { WorkspacePage } from "@/components/workspace/workspace-page";
import { ApiClientError } from "@/lib/api/client";
import * as endpoints from "@/lib/api/endpoints";

vi.mock("@/lib/api/endpoints", () => ({
  getDatasetSummary: vi.fn(),
  uploadDataset: vi.fn(),
  uploadContextDocument: vi.fn(),
  askQuestion: vi.fn(),
}));

const mockedGetDatasetSummary = vi.mocked(endpoints.getDatasetSummary);
const mockedAskQuestion = vi.mocked(endpoints.askQuestion);

function renderWorkspacePage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <WorkspacePage />
    </QueryClientProvider>
  );
}

describe("WorkspacePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("treats summary 404 as an empty state instead of an error", async () => {
    mockedGetDatasetSummary.mockRejectedValue(
      new ApiClientError({
        message: "Not found",
        status: 404,
        requestId: "req_404",
      })
    );

    renderWorkspacePage();

    expect(await screen.findByText("No dataset uploaded.")).toBeInTheDocument();
    expect(screen.queryByText("Could not load dataset summary")).not.toBeInTheDocument();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Question"), "Why did revenue drop?");
    expect(screen.getByRole("button", { name: "Ask" })).toBeDisabled();
  });

  it("handles clarification follow-up flow and renders final answer", async () => {
    mockedGetDatasetSummary.mockResolvedValue({
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
      requestId: "req_summary",
    });

    mockedAskQuestion
      .mockResolvedValueOnce({
        data: {
          conversation_id: "conv_1",
          needs_clarification: true,
          clarification_questions: [
            {
              key: "metric",
              type: "select",
              prompt: "Which metric?",
              options: ["revenue", "orders"],
            },
          ],
        },
        requestId: "req_ask_1",
      })
      .mockResolvedValueOnce({
        data: {
          conversation_id: "conv_1",
          needs_clarification: false,
          clarification_questions: [],
          answer: {
            headline: "revenue dipped",
            narrative: "Sales were lower than expected.",
            drivers: [],
            charts: [],
            sql: [],
            confidence: {
              level: "medium",
              reasons: ["Missing channel-level context"],
            },
          },
        },
        requestId: "req_ask_2",
      });

    renderWorkspacePage();

    expect(await screen.findByText("orders.csv")).toBeInTheDocument();

    const user = userEvent.setup();
    await user.type(screen.getByLabelText("Question"), "Why did revenue drop last week?");
    await user.click(screen.getByRole("button", { name: "Ask" }));

    expect(await screen.findByText("Clarification Needed")).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText("Which metric?"), "orders");
    await user.click(screen.getByRole("button", { name: "Submit Clarifications" }));

    await waitFor(() => {
      expect(mockedAskQuestion).toHaveBeenCalledTimes(2);
    });

    expect(mockedAskQuestion.mock.calls[0][0]).toEqual({
      question: "Why did revenue drop last week?",
    });
    expect(mockedAskQuestion.mock.calls[1][0]).toEqual({
      question: "Why did revenue drop last week?",
      conversation_id: "conv_1",
      clarifications: {
        metric: "orders",
      },
    });

    expect(await screen.findByRole("heading", { name: "Revenue Dipped" })).toBeInTheDocument();
    expect(screen.getByText("Request ID: req_ask_2")).toBeInTheDocument();
  });
});
