"use client";

import { useState } from "react";
import { FiFileText, FiUploadCloud } from "react-icons/fi";

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
import { type ContextUpload } from "@/lib/api/types";
import { formatDateTime } from "@/lib/utils/format";

type UploadProgress = {
  completed: number;
  total: number;
};

type ContextPanelProps = {
  docs: ContextUpload[];
  onUpload: (files: File[]) => Promise<void>;
  isUploading: boolean;
  progress: UploadProgress | null;
  uploadError: string | null;
  uploadErrorRequestId?: string | null;
};

export function ContextPanel({
  docs,
  onUpload,
  isUploading,
  progress,
  uploadError,
  uploadErrorRequestId,
}: ContextPanelProps) {
  const [files, setFiles] = useState<File[]>([]);

  async function handleUpload() {
    if (files.length === 0) {
      return;
    }

    await onUpload(files);
    setFiles([]);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FiFileText />
          Context Documents
        </CardTitle>
        <CardDescription>
          Optional docs (PDF/TXT/MD) for metric definitions and business rules.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="file"
          accept=".pdf,.txt,.md,text/plain,text/markdown,application/pdf"
          multiple
          onChange={(event) => {
            const selectedFiles = event.target.files
              ? Array.from(event.target.files)
              : [];
            setFiles(selectedFiles);
          }}
        />
        <div className="flex items-center gap-3">
          <Button
            onClick={() => void handleUpload()}
            disabled={files.length === 0 || isUploading}
          >
            <FiUploadCloud className="mr-2" />
            {isUploading ? "Uploading..." : "Upload Context Docs"}
          </Button>
          {files.length > 0 ? (
            <p className="text-xs text-muted-foreground">
              {files.length} file(s) selected
            </p>
          ) : null}
        </div>

        {progress ? (
          <p className="text-xs text-muted-foreground">
            Progress: {progress.completed}/{progress.total}
          </p>
        ) : null}

        {uploadError ? (
          <Alert variant="destructive">
            <AlertTitle>Context upload failed</AlertTitle>
            <AlertDescription>
              {uploadError}
              {uploadErrorRequestId ? ` (Request ID: ${uploadErrorRequestId})` : ""}
            </AlertDescription>
          </Alert>
        ) : null}

        <div className="space-y-2 rounded-lg border border-border bg-muted/20 p-3">
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
      </CardContent>
    </Card>
  );
}
