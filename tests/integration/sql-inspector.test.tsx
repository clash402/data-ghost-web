import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { SqlInspector } from "@/components/results/sql-inspector";
import * as copyUtils from "@/lib/utils/copy";

vi.mock("@/lib/utils/copy", () => ({
  copyToClipboard: vi.fn(),
}));

const mockedCopyToClipboard = vi.mocked(copyUtils.copyToClipboard);

describe("SqlInspector", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("toggles SQL visibility and shows copied state after successful copy", async () => {
    mockedCopyToClipboard.mockResolvedValue(undefined);

    const user = userEvent.setup();

    render(
      <SqlInspector
        statements={[
          {
            label: "Primary query",
            query: "SELECT * FROM orders;",
          },
        ]}
      />
    );

    await user.click(screen.getByRole("button", { name: "Show" }));
    expect(screen.getByText("SELECT * FROM orders;")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Copy" }));
    await waitFor(() => {
      expect(mockedCopyToClipboard).toHaveBeenCalledWith("SELECT * FROM orders;");
    });
    expect(screen.getByRole("button", { name: "Copied" })).toBeInTheDocument();

    await new Promise((resolve) => {
      setTimeout(resolve, 1300);
    });
    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
    });
  });

  it("keeps copy button unchanged when clipboard write fails", async () => {
    mockedCopyToClipboard.mockRejectedValue(new Error("Clipboard denied"));

    const user = userEvent.setup();

    render(
      <SqlInspector
        statements={[
          {
            label: "Primary query",
            query: "SELECT * FROM orders;",
          },
        ]}
      />
    );

    await user.click(screen.getByRole("button", { name: "Show" }));
    await user.click(screen.getByRole("button", { name: "Copy" }));

    await waitFor(() => {
      expect(mockedCopyToClipboard).toHaveBeenCalledWith("SELECT * FROM orders;");
    });
    expect(screen.getByRole("button", { name: "Copy" })).toBeInTheDocument();
  });
});
