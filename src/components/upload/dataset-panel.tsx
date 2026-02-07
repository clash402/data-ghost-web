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
import { type DatasetSummary } from "@/lib/api/types";
import { formatDateTime, formatNumber } from "@/lib/utils/format";

type DatasetPanelProps = {
  summary: DatasetSummary | null;
  isSummaryLoading: boolean;
  summaryError: string | null;
  summaryErrorRequestId?: string | null;
  onUpload: (file: File) => Promise<void>;
  isUploading: boolean;
  uploadError: string | null;
  uploadErrorRequestId?: string | null;
};

export function DatasetPanel({
  summary,
  isSummaryLoading,
  summaryError,
  summaryErrorRequestId,
  onUpload,
  isUploading,
  uploadError,
  uploadErrorRequestId,
}: DatasetPanelProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const columnsPreview = useMemo(() => summary?.columns.slice(0, 6) ?? [], [summary]);

  async function handleUpload() {
    if (!selectedFile) {
      return;
    }

    await onUpload(selectedFile);
    setSelectedFile(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FiDatabase />
          Dataset Workspace
        </CardTitle>
        <CardDescription>
          Upload one CSV dataset for analysis in this v1 workspace.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg border border-border bg-muted/25 p-4">
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
              setSelectedFile(file || null);
            }}
          />
          <div className="flex items-center gap-3">
            <Button
              onClick={() => void handleUpload()}
              disabled={!selectedFile || isUploading}
            >
              <FiUploadCloud className="mr-2" />
              {isUploading ? "Uploading..." : "Upload Dataset"}
            </Button>
            {selectedFile ? (
              <p className="text-xs text-muted-foreground">{selectedFile.name}</p>
            ) : null}
          </div>
        </div>

        {uploadError ? (
          <Alert variant="destructive">
            <AlertTitle>Dataset upload failed</AlertTitle>
            <AlertDescription>
              {uploadError}
              {uploadErrorRequestId ? ` (Request ID: ${uploadErrorRequestId})` : ""}
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
