"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FiActivity } from "react-icons/fi";

import { QuestionPanel } from "@/components/question/question-panel";
import { ResultsPanel } from "@/components/results/results-panel";
import { ContextPanel } from "@/components/upload/context-panel";
import { DatasetPanel } from "@/components/upload/dataset-panel";
import { ApiClientError } from "@/lib/api/client";
import {
  askQuestion,
  getDatasetSummary,
  uploadContextDocument,
  uploadDataset,
} from "@/lib/api/endpoints";
import {
  type AskRequest,
  type AskResponse,
  type ClarificationQuestion,
  type ContextUpload,
} from "@/lib/api/types";
import { queryKeys } from "@/lib/state/queryClient";
import { createRequestId } from "@/lib/utils/request-id";

type FinalAskResponse = Extract<AskResponse, { needs_clarification: false }>;

type UploadProgress = {
  completed: number;
  total: number;
};

function toErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Unexpected error";
}

function toRequestId(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.requestId;
  }

  return null;
}

export function WorkspacePage() {
  const queryClient = useQueryClient();
  const [question, setQuestion] = useState("");
  const [pendingQuestion, setPendingQuestion] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [clarificationQuestions, setClarificationQuestions] = useState<
    ClarificationQuestion[]
  >([]);
  const [response, setResponse] = useState<FinalAskResponse | null>(null);
  const [contextDocs, setContextDocs] = useState<ContextUpload[]>([]);
  const [contextProgress, setContextProgress] = useState<UploadProgress | null>(null);
  const [lastAskRequestId, setLastAskRequestId] = useState<string | null>(null);

  const datasetSummaryQuery = useQuery({
    queryKey: queryKeys.datasetSummary,
    queryFn: async () => {
      try {
        const result = await getDatasetSummary(createRequestId("dataset-summary"));
        return result.data;
      } catch (error) {
        if (error instanceof ApiClientError && error.status === 404) {
          return null;
        }

        throw error;
      }
    },
  });

  const datasetUploadMutation = useMutation({
    mutationFn: (file: File) => uploadDataset(file, createRequestId("upload-dataset")),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.datasetSummary });
    },
  });

  const contextUploadMutation = useMutation({
    mutationFn: (file: File) =>
      uploadContextDocument(file, createRequestId("upload-context")),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.datasetSummary });
    },
  });

  const askMutation = useMutation({
    mutationFn: (payload: AskRequest) => askQuestion(payload, createRequestId("ask")),
    onSuccess: (result) => {
      setLastAskRequestId(result.requestId);
      setConversationId(result.data.conversation_id);

      if (result.data.needs_clarification) {
        setClarificationQuestions(result.data.clarification_questions);
        return;
      }

      setClarificationQuestions([]);
      setResponse(result.data);
    },
  });

  const askErrorRequestId = useMemo(() => {
    if (askMutation.error instanceof ApiClientError) {
      return askMutation.error.requestId;
    }

    return null;
  }, [askMutation.error]);

  async function handleDatasetUpload(file: File) {
    await datasetUploadMutation.mutateAsync(file);
  }

  async function handleContextUpload(files: File[]) {
    const uploadedDocs: ContextUpload[] = [];
    setContextProgress({ completed: 0, total: files.length });

    try {
      for (let index = 0; index < files.length; index += 1) {
        const result = await contextUploadMutation.mutateAsync(files[index]);
        uploadedDocs.push(result.data);
        setContextProgress({ completed: index + 1, total: files.length });
      }

      setContextDocs((currentDocs) => [...uploadedDocs, ...currentDocs]);
    } finally {
      setContextProgress(null);
    }
  }

  async function handleAsk() {
    const trimmed = question.trim();

    if (!trimmed) {
      return;
    }

    setResponse(null);
    setPendingQuestion(trimmed);
    setConversationId(undefined);
    setClarificationQuestions([]);

    await askMutation.mutateAsync({
      question: trimmed,
    });
  }

  async function handleClarificationSubmit(clarifications: Record<string, string>) {
    if (!pendingQuestion || !conversationId) {
      return;
    }

    await askMutation.mutateAsync({
      question: pendingQuestion,
      conversation_id: conversationId,
      clarifications,
    });
  }

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(13,148,136,0.13),_transparent_40%),linear-gradient(180deg,#f8fafc_0%,#ffffff_50%,#f8fafc_100%)] px-4 py-8 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="rounded-2xl border border-border/70 bg-white/90 p-6 shadow-sm backdrop-blur">
          <p className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            <FiActivity />
            Data Ghost v1
          </p>
          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900">
            Analytics Copilot Workspace
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Upload a dataset, add optional context docs, and ask a question in plain
            English. Data Ghost explains what happened, shows supporting numbers, and
            reports confidence.
          </p>
        </header>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr]">
          <div className="space-y-6">
            <DatasetPanel
              summary={datasetSummaryQuery.data ?? null}
              isSummaryLoading={datasetSummaryQuery.isLoading}
              summaryError={
                datasetSummaryQuery.isError
                  ? toErrorMessage(datasetSummaryQuery.error)
                  : null
              }
              summaryErrorRequestId={
                datasetSummaryQuery.isError
                  ? toRequestId(datasetSummaryQuery.error)
                  : null
              }
              onUpload={handleDatasetUpload}
              isUploading={datasetUploadMutation.isPending}
              uploadError={
                datasetUploadMutation.isError
                  ? toErrorMessage(datasetUploadMutation.error)
                  : null
              }
              uploadErrorRequestId={
                datasetUploadMutation.isError
                  ? toRequestId(datasetUploadMutation.error)
                  : null
              }
            />
            <ContextPanel
              docs={contextDocs}
              onUpload={handleContextUpload}
              isUploading={contextUploadMutation.isPending}
              progress={contextProgress}
              uploadError={
                contextUploadMutation.isError
                  ? toErrorMessage(contextUploadMutation.error)
                  : null
              }
              uploadErrorRequestId={
                contextUploadMutation.isError
                  ? toRequestId(contextUploadMutation.error)
                  : null
              }
            />
          </div>

          <div className="space-y-6">
            <QuestionPanel
              question={question}
              setQuestion={setQuestion}
              onAsk={handleAsk}
              onSubmitClarifications={handleClarificationSubmit}
              clarificationQuestions={clarificationQuestions}
              canAsk={Boolean(datasetSummaryQuery.data)}
              isAsking={askMutation.isPending}
              askError={askMutation.isError ? toErrorMessage(askMutation.error) : null}
              askErrorRequestId={askMutation.isError ? askErrorRequestId : null}
            />
            <ResultsPanel
              response={response}
              isRunning={askMutation.isPending}
              requestId={lastAskRequestId}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
