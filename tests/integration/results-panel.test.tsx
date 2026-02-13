import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ResultsPanel } from "@/components/results/results-panel";
import { ApiClientError } from "@/lib/api/client";
import * as endpoints from "@/lib/api/endpoints";

vi.mock("@/lib/api/endpoints", () => ({
  speakText: vi.fn(),
}));

const mockedSpeakText = vi.mocked(endpoints.speakText);

class AudioMock {
  static instances: AudioMock[] = [];

  onended: (() => void) | null = null;

  onerror: (() => void) | null = null;

  currentTime = 0;

  pause = vi.fn();

  play = vi.fn().mockResolvedValue(undefined);

  constructor() {
    AudioMock.instances.push(this);
  }
}

const finalResponse = {
  conversation_id: "conv_1",
  needs_clarification: false as const,
  clarification_questions: [],
  answer: {
    headline: "revenue dipped",
    narrative: "Revenue declined after weekend traffic dropped.",
    drivers: [],
    charts: [],
    sql: [],
    confidence: {
      level: "high" as const,
      reasons: ["Dataset coverage was complete."],
    },
  },
};

describe("ResultsPanel voice readback", () => {
  const originalCreateObjectUrl = URL.createObjectURL;
  const originalRevokeObjectUrl = URL.revokeObjectURL;
  const originalAudio = globalThis.Audio;

  beforeEach(() => {
    AudioMock.instances = [];
    vi.clearAllMocks();

    URL.createObjectURL = vi.fn(() => "blob:voice-audio");
    URL.revokeObjectURL = vi.fn();
    Object.defineProperty(globalThis, "Audio", {
      configurable: true,
      value: AudioMock,
    });
  });

  afterEach(() => {
    URL.createObjectURL = originalCreateObjectUrl;
    URL.revokeObjectURL = originalRevokeObjectUrl;
    Object.defineProperty(globalThis, "Audio", {
      configurable: true,
      value: originalAudio,
    });
  });

  it("shows read aloud control only when a final response exists", () => {
    const { rerender } = render(<ResultsPanel response={null} isRunning={false} />);

    expect(screen.queryByRole("button", { name: "Read Aloud" })).not.toBeInTheDocument();

    rerender(<ResultsPanel response={finalResponse} isRunning={false} />);

    expect(screen.getByRole("button", { name: "Read Aloud" })).toBeInTheDocument();
  });

  it("starts playback when read aloud is clicked", async () => {
    mockedSpeakText.mockResolvedValue({
      audioBlob: new Blob(["audio"], { type: "audio/mpeg" }),
      requestId: "req_tts_1",
    });

    const user = userEvent.setup();
    render(<ResultsPanel response={finalResponse} isRunning={false} />);

    await user.click(screen.getByRole("button", { name: "Read Aloud" }));

    await waitFor(() => {
      expect(mockedSpeakText).toHaveBeenCalledTimes(1);
    });
    expect(mockedSpeakText.mock.calls[0][0]).toMatchObject({
      text: expect.stringContaining("Revenue declined after weekend traffic dropped."),
    });
    expect(screen.getByRole("button", { name: "Stop" })).toBeInTheDocument();
  });

  it("stops playback and resets control state", async () => {
    mockedSpeakText.mockResolvedValue({
      audioBlob: new Blob(["audio"], { type: "audio/mpeg" }),
      requestId: "req_tts_2",
    });

    const user = userEvent.setup();
    render(<ResultsPanel response={finalResponse} isRunning={false} />);

    await user.click(screen.getByRole("button", { name: "Read Aloud" }));
    await screen.findByRole("button", { name: "Stop" });

    await user.click(screen.getByRole("button", { name: "Stop" }));

    expect(screen.getByRole("button", { name: "Read Aloud" })).toBeInTheDocument();
    expect(AudioMock.instances[0].pause).toHaveBeenCalled();
  });

  it("shows tts error and request id when readback fails", async () => {
    mockedSpeakText.mockRejectedValue(
      new ApiClientError({
        message: "TTS unavailable",
        status: 502,
        requestId: "req_tts_failed",
      })
    );

    const user = userEvent.setup();
    render(<ResultsPanel response={finalResponse} isRunning={false} />);

    await user.click(screen.getByRole("button", { name: "Read Aloud" }));

    expect(await screen.findByText("Readback failed")).toBeInTheDocument();
    expect(screen.getByText(/TTS unavailable/)).toBeInTheDocument();
    expect(screen.getByText(/req_tts_failed/)).toBeInTheDocument();
  });
});
