"use client";

import { useMemo, useState } from "react";
import { FiDatabase, FiUploadCloud } from "react-icons/fi";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { type ContextUpload, type DatasetSummary } from "@/lib/api/types";
import { formatDateTime, formatNumber } from "@/lib/utils/format";

type UploadProgress = {
  completed: number;
  total: number;
};

type DataSetupPanelProps = {
  summary: DatasetSummary | null;
  isSummaryLoading: boolean;
  summaryError: string | null;
  summaryErrorRequestId?: string | null;
  onDatasetUpload: (file: File) => Promise<void>;
  isDatasetUploading: boolean;
  datasetUploadError: string | null;
  datasetUploadErrorRequestId?: string | null;
  docs: ContextUpload[];
  onContextUpload: (files: File[]) => Promise<void>;
  isContextUploading: boolean;
  contextProgress: UploadProgress | null;
  contextUploadError: string | null;
  contextUploadErrorRequestId?: string | null;
};

export function DataSetupPanel({
  summary,
  isSummaryLoading,
  summaryError,
  summaryErrorRequestId,
  onDatasetUpload,
  isDatasetUploading,
  datasetUploadError,
  datasetUploadErrorRequestId,
  docs,
  onContextUpload,
  isContextUploading,
  contextProgress,
  contextUploadError,
  contextUploadErrorRequestId,
}: DataSetupPanelProps) {
  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const [contextFiles, setContextFiles] = useState<File[]>([]);
  const columnsPreview = useMemo(() => summary?.columns.slice(0, 6) ?? [], [summary]);

  async function handleDatasetUpload() {
    if (!datasetFile) {
      return;
    }

    await onDatasetUpload(datasetFile);
    setDatasetFile(null);
  }

  async function handleContextUpload() {
    if (contextFiles.length === 0) {
      return;
    }

    await onContextUpload(contextFiles);
    setContextFiles([]);
  }

  return (
    <Card className="border-border/60 bg-slate-50/75 shadow-none">
      <CardHeader className="space-y-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FiDatabase />
          Data Setup
        </CardTitle>
        <CardDescription>
          Upload a dataset and optional context docs before analysis.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Dataset</h3>
            <p className="text-xs text-muted-foreground">
              Upload one CSV dataset for analysis in this v1 workspace.
            </p>
          </div>

          <div className="rounded-lg border border-border bg-background/80 p-4">
            {isSummaryLoading ? (
              <p className="text-sm text-muted-foreground">Loading dataset summary...</p>
            ) : summary ? (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Dataset
                    </p>
                    <p className="text-sm font-semibold">{summary.name}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Rows
                    </p>
                    <p className="text-sm font-semibold">{formatNumber(summary.rows)}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      Columns
                    </p>
                    <p className="text-sm font-semibold">
                      {formatNumber(summary.columns.length)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                    Inferred Types
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {columnsPreview.map((column) => (
                      <Badge key={column.name} variant="secondary">
                        {column.name}: {column.type}
                      </Badge>
                    ))}
                    {summary.columns.length > columnsPreview.length ? (
                      <Badge variant="outline">
                        +{summary.columns.length - columnsPreview.length} more
                      </Badge>
                    ) : null}
                  </div>
                </div>

                {summary.created_at ? (
                  <p className="text-xs text-muted-foreground">
                    Last upload: {formatDateTime(summary.created_at)}
                  </p>
                ) : null}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No dataset uploaded.</p>
            )}
          </div>

          {summaryError ? (
            <Alert variant="destructive">
              <AlertTitle>Could not load dataset summary</AlertTitle>
              <AlertDescription>
                {summaryError}
                {summaryErrorRequestId ? ` (Request ID: ${summaryErrorRequestId})` : ""}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-3">
            <Input
              type="file"
              accept=".csv,text/csv"
              onChange={(event) => {
                const file = event.target.files?.[0];
                setDatasetFile(file || null);
              }}
            />
            <div className="flex items-center gap-3">
              <Button
                onClick={() => {
                  void handleDatasetUpload();
                }}
                disabled={!datasetFile || isDatasetUploading}
              >
                <FiUploadCloud className="mr-2" />
                {isDatasetUploading ? "Uploading..." : "Upload Dataset"}
              </Button>
              {datasetFile ? (
                <p className="text-xs text-muted-foreground">{datasetFile.name}</p>
              ) : null}
            </div>
          </div>

          {datasetUploadError ? (
            <Alert variant="destructive">
              <AlertTitle>Dataset upload failed</AlertTitle>
              <AlertDescription>
                {datasetUploadError}
                {datasetUploadErrorRequestId
                  ? ` (Request ID: ${datasetUploadErrorRequestId})`
                  : ""}
              </AlertDescription>
            </Alert>
          ) : null}
        </section>

        <div className="h-px w-full bg-border/70" />

        <section className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Context Documents</h3>
            <p className="text-xs text-muted-foreground">
              Optional docs (PDF/TXT/MD) for metric definitions and business rules.
            </p>
          </div>

          <Input
            type="file"
            accept=".pdf,.txt,.md,text/plain,text/markdown,application/pdf"
            multiple
            onChange={(event) => {
              const selectedFiles = event.target.files
                ? Array.from(event.target.files)
                : [];
              setContextFiles(selectedFiles);
            }}
          />
          <div className="flex items-center gap-3">
            <Button
              onClick={() => {
                void handleContextUpload();
              }}
              disabled={contextFiles.length === 0 || isContextUploading}
            >
              <FiUploadCloud className="mr-2" />
              {isContextUploading ? "Uploading..." : "Upload Context Docs"}
            </Button>
            {contextFiles.length > 0 ? (
              <p className="text-xs text-muted-foreground">
                {contextFiles.length} file(s) selected
              </p>
            ) : null}
          </div>

          {contextProgress ? (
            <p className="text-xs text-muted-foreground">
              Progress: {contextProgress.completed}/{contextProgress.total}
            </p>
          ) : null}

          {contextUploadError ? (
            <Alert variant="destructive">
              <AlertTitle>Context upload failed</AlertTitle>
              <AlertDescription>
                {contextUploadError}
                {contextUploadErrorRequestId
                  ? ` (Request ID: ${contextUploadErrorRequestId})`
                  : ""}
              </AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2 rounded-lg border border-border bg-background/80 p-3">
            <p className="text-sm font-semibold">Uploaded Documents</p>
            {docs.length === 0 ? (
              <p className="text-xs text-muted-foreground">No context docs uploaded yet.</p>
            ) : (
              <ul className="space-y-2">
                {docs.map((doc) => (
                  <li
                    key={doc.doc_id}
                    className="rounded-md border border-border bg-background p-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{doc.filename}</p>
                      <Badge variant="outline">{formatDateTime(doc.created_at)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {typeof doc.pages === "number" ? `Pages: ${doc.pages}` : null}
                      {typeof doc.pages === "number" && typeof doc.chunks === "number"
                        ? " · "
                        : null}
                      {typeof doc.chunks === "number" ? `Chunks: ${doc.chunks}` : null}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
      </CardContent>
    </Card>
  );
}
