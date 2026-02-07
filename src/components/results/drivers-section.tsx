import { FiTrendingDown, FiTrendingUp } from "react-icons/fi";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type AskResponse } from "@/lib/api/types";
import { formatContribution } from "@/lib/utils/format";

type DriversSectionProps = {
  drivers: NonNullable<
    Extract<AskResponse, { needs_clarification: false }>["answer"]
  >["drivers"];
};

function formatEvidence(evidence: unknown) {
  if (typeof evidence === "string") {
    return evidence;
  }

  if (typeof evidence === "number") {
    return evidence.toString();
  }

  if (evidence === null || evidence === undefined) {
    return null;
  }

  try {
    return JSON.stringify(evidence);
  } catch {
    return "Additional evidence available";
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
      </CardHeader>
      <CardContent>
        <div className="grid gap-3 md:grid-cols-2">
          {drivers.map((driver) => {
            const evidence = formatEvidence(driver.evidence);
            const isPositive = driver.contribution >= 0;

            return (
              <div
                key={driver.name}
                className="rounded-lg border border-border bg-muted/30 p-4"
              >
                <div className="mb-2 flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold">{driver.name}</p>
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
                  <p className="line-clamp-3 text-xs text-muted-foreground">{evidence}</p>
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
