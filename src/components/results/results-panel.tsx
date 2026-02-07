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
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{response.answer.headline}</CardTitle>
          <CardDescription>{response.answer.narrative}</CardDescription>
        </CardHeader>
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
