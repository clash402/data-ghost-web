import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FiBarChart2, FiSquare, FiVolume2 } from "react-icons/fi";

import { ChartRenderer } from "@/components/results/chart-renderer";
import { ConfidenceBanner } from "@/components/results/confidence-banner";
import { DriversSection } from "@/components/results/drivers-section";
import { ExecutionStatus } from "@/components/results/execution-status";
import { SqlInspector } from "@/components/results/sql-inspector";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ApiClientError } from "@/lib/api/client";
import { speakText } from "@/lib/api/endpoints";
import { createRequestId } from "@/lib/utils/request-id";
import { cn } from "@/lib/utils";
import { type AskResponse } from "@/lib/api/types";
import { formatNumber, formatUsd } from "@/lib/utils/format";

type FinalAskResponse = Extract<AskResponse, { needs_clarification: false }>;

type ResultsPanelProps = {
  response: FinalAskResponse | null;
  isRunning: boolean;
  requestId?: string | null;
  className?: string;
};

type StructuredNarrative = {
  question?: string;
  summary?: string;
  top_results?: Array<{
    label?: string;
  }>;
};

function toTitleCase(value: string) {
  return value
    .replace(/[_-]+/g, " ")
    .trim()
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function parseStructuredNarrative(narrative: string): StructuredNarrative | null {
  const trimmed = narrative.trim();

  const withoutFence = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/, "")
    .trim();

  const candidates = [withoutFence];

  if (
    (withoutFence.startsWith('"') && withoutFence.endsWith('"')) ||
    (withoutFence.startsWith("'") && withoutFence.endsWith("'"))
  ) {
    candidates.push(withoutFence.slice(1, -1));
  }

  const parsedStructured = candidates
    .filter((candidate) => candidate.startsWith("{") || candidate.startsWith("["))
    .map((candidate) => {
      try {
        const parsed = JSON.parse(candidate) as unknown;

        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          return null;
        }

        return parsed as StructuredNarrative;
      } catch {
        return null;
      }
    })
    .find((parsed): parsed is StructuredNarrative => Boolean(parsed));

  if (parsedStructured) {
    return parsedStructured;
  }

  const questionMatch = withoutFence.match(/["']question["']\s*:\s*["']([^"']+)["']/i);
  const summaryMatch = withoutFence.match(/["']summary["']\s*:\s*["']([^"']+)["']/i);
  const labelMatches = Array.from(
    withoutFence.matchAll(/["']label["']\s*:\s*["']([^"']+)["']/gi)
  ).map((match) => match[1]);

  if (questionMatch || summaryMatch || labelMatches.length > 0) {
    return {
      question: questionMatch?.[1],
      summary: summaryMatch?.[1],
      top_results: labelMatches.map((label) => ({ label })),
    };
  }

  return null;
}

function NarrativeContent({ narrative }: { narrative: string }) {
  const structured = parseStructuredNarrative(narrative);

  if (!structured) {
    return <p>{narrative}</p>;
  }

  const labels = (structured.top_results || [])
    .map((result) => result.label?.trim())
    .filter((label): label is string => Boolean(label));

  return (
    <div className="space-y-2 text-sm text-muted-foreground">
      {structured.summary ? <p>{structured.summary}</p> : null}
      {structured.question ? (
        <p>
          <span className="font-medium text-foreground">Question interpreted:</span>{" "}
          {structured.question}
        </p>
      ) : null}
      {labels.length > 0 ? (
        <div>
          <p className="font-medium text-foreground">Analyses run:</p>
          <ul className="list-disc pl-5">
            {labels.slice(0, 5).map((label) => (
              <li key={label}>{toTitleCase(label)}</li>
            ))}
          </ul>
        </div>
      ) : (
        <p>
          Structured analysis payload received. Result details were normalized for
          display.
        </p>
      )}
    </div>
  );
}

function CostDetails({ response }: { response: FinalAskResponse }) {
  if (!response.answer.cost) {
    return null;
  }

  const cost = response.answer.cost;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Execution Cost</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-muted-foreground">Model</p>
          <p className="font-medium">{cost.model}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Prompt Tokens</p>
          <p className="font-medium">{formatNumber(cost.prompt_tokens)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Completion Tokens</p>
          <p className="font-medium">{formatNumber(cost.completion_tokens)}</p>
        </div>
        <div>
          <p className="text-muted-foreground">Total Cost</p>
          <p className="font-medium">{formatUsd(cost.usd)}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ResultsPanel({
  response,
  isRunning,
  requestId,
  className,
}: ResultsPanelProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [ttsError, setTtsError] = useState<string | null>(null);
  const [ttsErrorRequestId, setTtsErrorRequestId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const spokenText = useMemo(() => {
    if (!response) {
      return "";
    }

    const confidenceReason = response.answer.confidence.reasons.join(" ");

    return [
      response.answer.headline,
      response.answer.narrative,
      `Confidence level: ${response.answer.confidence.level}.`,
      confidenceReason,
    ]
      .filter(Boolean)
      .join(" ");
  }, [response]);

  const cleanupAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.onended = null;
      audioRef.current.onerror = null;
      audioRef.current.pause();
      audioRef.current = null;
    }

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current);
      audioUrlRef.current = null;
    }
  }, []);

  const stopAudioPlayback = useCallback(() => {
    cleanupAudio();
    setIsSpeaking(false);
  }, [cleanupAudio]);

  async function handleReadAloud() {
    if (!spokenText) {
      return;
    }

    if (isSpeaking) {
      stopAudioPlayback();
      return;
    }

    setTtsError(null);
    setTtsErrorRequestId(null);
    setIsGeneratingAudio(true);

    try {
      const result = await speakText(
        {
          text: spokenText,
        },
        createRequestId("voice-speak")
      );

      cleanupAudio();

      const audioUrl = URL.createObjectURL(result.audioBlob);
      const audio = new Audio(audioUrl);

      audioUrlRef.current = audioUrl;
      audioRef.current = audio;
      audio.onended = () => {
        stopAudioPlayback();
      };
      audio.onerror = () => {
        setTtsError("Could not play audio response.");
        setTtsErrorRequestId(result.requestId);
        stopAudioPlayback();
      };

      await audio.play();
      setIsSpeaking(true);
    } catch (error) {
      if (error instanceof ApiClientError) {
        setTtsError(error.message);
        setTtsErrorRequestId(error.requestId);
      } else if (error instanceof Error) {
        setTtsError(error.message);
      } else {
        setTtsError("Could not generate voice readback.");
      }
    } finally {
      setIsGeneratingAudio(false);
    }
  }

  useEffect(
    () => () => {
      cleanupAudio();
    },
    [cleanupAudio]
  );

  useEffect(() => {
    stopAudioPlayback();
  }, [response, stopAudioPlayback]);

  if (!response) {
    return (
      <Card className={cn("border-primary/35 shadow-md shadow-primary/10", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-2xl">
            <FiBarChart2 />
            Results
          </CardTitle>
          <CardDescription>
            Ask a question after uploading data to see grounded insights with charts and
            diagnostics.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExecutionStatus isVisible={isRunning} />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="min-w-0 space-y-4">
      <Card className={cn("min-w-0 border-primary/35 shadow-md shadow-primary/10", className)}>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-2xl">
              {toTitleCase(response.answer.headline || "Analysis summary")}
            </CardTitle>
            <Button
              type="button"
              variant={isSpeaking ? "secondary" : "outline"}
              onClick={() => {
                void handleReadAloud();
              }}
              disabled={isGeneratingAudio}
            >
              {isSpeaking ? <FiSquare className="mr-2" /> : <FiVolume2 className="mr-2" />}
              {isSpeaking
                ? "Stop"
                : isGeneratingAudio
                  ? "Generating audio..."
                  : "Read Aloud"}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <NarrativeContent narrative={response.answer.narrative} />
          {ttsError ? (
            <Alert variant="destructive">
              <AlertTitle>Readback failed</AlertTitle>
              <AlertDescription>
                {ttsError}
                {ttsErrorRequestId ? ` (Request ID: ${ttsErrorRequestId})` : ""}
              </AlertDescription>
            </Alert>
          ) : null}
        </CardContent>
        {requestId ? (
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">Request ID: {requestId}</p>
          </CardContent>
        ) : null}
      </Card>

      <ExecutionStatus isVisible={isRunning} />
      <ConfidenceBanner confidence={response.answer.confidence} />
      <DriversSection drivers={response.answer.drivers} />
      <ChartRenderer charts={response.answer.charts} />
      <SqlInspector statements={response.answer.sql} />
      <CostDetails response={response} />
    </div>
  );
}
