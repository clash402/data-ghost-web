import { FiAlertCircle, FiCheckCircle } from "react-icons/fi";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { type AskResponse } from "@/lib/api/types";

type Confidence = Extract<
  AskResponse,
  { needs_clarification: false }
>["answer"]["confidence"];

type ConfidenceBannerProps = {
  confidence: Confidence;
};

function titleForLevel(level: Confidence["level"]) {
  if (level === "insufficient") {
    return "Cannot answer confidently";
  }

  if (level === "low") {
    return "Insufficient confidence";
  }

  if (level === "medium") {
    return "Moderate confidence";
  }

  return "High confidence";
}

function variantForLevel(level: Confidence["level"]) {
  if (level === "insufficient") {
    return "destructive" as const;
  }

  if (level === "low") {
    return "warning" as const;
  }

  return "default" as const;
}

export function ConfidenceBanner({ confidence }: ConfidenceBannerProps) {
  const title = titleForLevel(confidence.level);
  const variant = variantForLevel(confidence.level);

  return (
    <Alert variant={variant}>
      {confidence.level === "high" || confidence.level === "medium" ? (
        <FiCheckCircle className="absolute left-4 top-4" />
      ) : (
        <FiAlertCircle className="absolute left-4 top-4" />
      )}
      <AlertTitle className="flex items-center gap-2 pl-4">
        {title}
        <Badge
          variant={confidence.level === "insufficient" ? "destructive" : "secondary"}
        >
          {confidence.level}
        </Badge>
      </AlertTitle>
      <AlertDescription className="pl-4">
        {confidence.reasons.length > 0 ? (
          <ul className="list-disc space-y-1 pl-5">
            {confidence.reasons.map((reason) => (
              <li key={reason}>{reason}</li>
            ))}
          </ul>
        ) : (
          <p>No diagnostics were returned by the API.</p>
        )}
      </AlertDescription>
    </Alert>
  );
}
