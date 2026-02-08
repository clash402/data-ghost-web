import { FiTrendingDown, FiTrendingUp } from "react-icons/fi";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type AskResponse } from "@/lib/api/types";
import { formatContribution, formatNumber } from "@/lib/utils/format";

type DriversSectionProps = {
  drivers: NonNullable<
    Extract<AskResponse, { needs_clarification: false }>["answer"]
  >["drivers"];
};

function toReadableDriverName(name: string) {
  const compact = name.trim();

  if (/^[a-f0-9]{10,}$/i.test(compact)) {
    return `Segment ${compact.slice(0, 8)}...`;
  }

  return compact
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function formatEvidenceValue(value: unknown) {
  if (typeof value === "number") {
    return Math.abs(value) <= 1 ? formatContribution(value) : formatNumber(value);
  }

  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  return null;
}

function formatEvidence(evidence: unknown) {
  if (typeof evidence === "string") {
    return [evidence];
  }

  if (typeof evidence === "number") {
    const formatted = formatEvidenceValue(evidence);
    return formatted ? [formatted] : null;
  }

  if (evidence === null || evidence === undefined) {
    return null;
  }

  if (typeof evidence === "object") {
    const entries = Object.entries(evidence as Record<string, unknown>)
      .map(([key, value]) => {
        const formatted = formatEvidenceValue(value);

        if (!formatted) {
          return null;
        }

        const readableKey = key
          .replace(/[_-]+/g, " ")
          .replace(/\s+/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());

        return `${readableKey}: ${formatted}`;
      })
      .filter((value): value is string => Boolean(value))
      .slice(0, 3);

    if (entries.length > 0) {
      return entries;
    }
  }

  try {
    return [JSON.stringify(evidence)];
  } catch {
    return ["Additional evidence available"];
  }
}

export function DriversSection({ drivers }: DriversSectionProps) {
  if (drivers.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Top Drivers</CardTitle>
        <p className="text-sm text-muted-foreground">
          Largest factors contributing to the answer, with supporting evidence from the
          query results.
        </p>
      </CardHeader>
      <CardContent className="min-w-0">
        <div className="grid gap-3 md:grid-cols-2">
          {drivers.map((driver) => {
            const evidence = formatEvidence(driver.evidence);
            const isPositive = driver.contribution >= 0;

            return (
              <div
                key={driver.name}
                className="min-w-0 rounded-lg border border-border bg-muted/30 p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-4">
                  <p className="truncate text-sm font-semibold">
                    {toReadableDriverName(driver.name)}
                  </p>
                  <p
                    className={`inline-flex items-center gap-1 text-sm font-semibold ${
                      isPositive ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {isPositive ? <FiTrendingUp /> : <FiTrendingDown />}
                    {formatContribution(driver.contribution)}
                  </p>
                </div>
                {evidence ? (
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    {evidence.map((line) => (
                      <li key={line} className="line-clamp-2">
                        {line}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    No additional evidence supplied.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
