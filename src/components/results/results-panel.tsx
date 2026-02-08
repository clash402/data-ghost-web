import { FiBarChart2 } from "react-icons/fi";

import { ChartRenderer } from "@/components/results/chart-renderer";
import { ConfidenceBanner } from "@/components/results/confidence-banner";
import { DriversSection } from "@/components/results/drivers-section";
import { ExecutionStatus } from "@/components/results/execution-status";
import { SqlInspector } from "@/components/results/sql-inspector";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { type AskResponse } from "@/lib/api/types";
import { formatNumber, formatUsd } from "@/lib/utils/format";

type FinalAskResponse = Extract<AskResponse, { needs_clarification: false }>;

type ResultsPanelProps = {
  response: FinalAskResponse | null;
  isRunning: boolean;
  requestId?: string | null;
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

export function ResultsPanel({ response, isRunning, requestId }: ResultsPanelProps) {
  if (!response) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
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
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle className="text-xl">
            {toTitleCase(response.answer.headline || "Analysis summary")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-0">
          <NarrativeContent narrative={response.answer.narrative} />
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
