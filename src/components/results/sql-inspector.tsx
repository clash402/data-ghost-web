"use client";

import { useState } from "react";
import { FiCheck, FiCode, FiCopy } from "react-icons/fi";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { copyToClipboard } from "@/lib/utils/copy";

type SqlStatement = {
  label: string;
  query: string;
};

type SqlInspectorProps = {
  statements: SqlStatement[];
};

export function SqlInspector({ statements }: SqlInspectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  if (statements.length === 0) {
    return null;
  }

  async function handleCopy(label: string, query: string) {
    try {
      await copyToClipboard(query);
      setCopiedLabel(label);
      window.setTimeout(() => {
        setCopiedLabel((current) => (current === label ? null : current));
      }, 1200);
    } catch {
      setCopiedLabel(null);
    }
  }

  return (
    <Card className="min-w-0 overflow-hidden">
      <CardHeader className="flex min-w-0 flex-row items-center justify-between space-y-0">
        <CardTitle className="min-w-0 text-lg">SQL Inspector</CardTitle>
        <Button variant="outline" size="sm" onClick={() => setIsOpen((value) => !value)}>
          <FiCode className="mr-1.5" />
          {isOpen ? "Hide" : "Show"}
        </Button>
      </CardHeader>
      {isOpen ? (
        <CardContent className="min-w-0 space-y-3">
          {statements.map((statement) => (
            <div
              key={statement.label}
              className="min-w-0 overflow-hidden rounded-lg border border-border bg-muted/30 p-3"
            >
              <div className="mb-2 flex items-center justify-between gap-3">
                <p className="min-w-0 truncate text-sm font-semibold">
                  {statement.label}
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    void handleCopy(statement.label, statement.query);
                  }}
                >
                  {copiedLabel === statement.label ? (
                    <FiCheck className="mr-1.5" />
                  ) : (
                    <FiCopy className="mr-1.5" />
                  )}
                  {copiedLabel === statement.label ? "Copied" : "Copy"}
                </Button>
              </div>
              <pre className="max-w-full overflow-x-auto whitespace-pre-wrap break-all rounded-md bg-slate-900 p-3 text-xs text-slate-100">
                {statement.query}
              </pre>
            </div>
          ))}
        </CardContent>
      ) : null}
    </Card>
  );
}
