"use client";

import { useEffect, useState } from "react";
import { FiHelpCircle, FiSend } from "react-icons/fi";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { type ClarificationQuestion } from "@/lib/api/types";

type ClarificationValues = Record<string, string>;

type QuestionPanelProps = {
  question: string;
  setQuestion: (question: string) => void;
  onAsk: () => Promise<void>;
  onSubmitClarifications: (clarifications: ClarificationValues) => Promise<void>;
  clarificationQuestions: ClarificationQuestion[];
  canAsk: boolean;
  isAsking: boolean;
  askError: string | null;
  askErrorRequestId?: string | null;
};

function defaultClarificationValues(questions: ClarificationQuestion[]) {
  return questions.reduce<ClarificationValues>((accumulator, question) => {
    if (question.options && question.options.length > 0) {
      return {
        ...accumulator,
        [question.key]: question.options[0],
      };
    }

    return {
      ...accumulator,
      [question.key]: "",
    };
  }, {});
}

function isSelectType(question: ClarificationQuestion) {
  return question.type.toLowerCase() === "select";
}

function isRadioType(question: ClarificationQuestion) {
  return question.type.toLowerCase() === "radio";
}

export function QuestionPanel({
  question,
  setQuestion,
  onAsk,
  onSubmitClarifications,
  clarificationQuestions,
  canAsk,
  isAsking,
  askError,
  askErrorRequestId,
}: QuestionPanelProps) {
  const [clarificationValues, setClarificationValues] = useState<ClarificationValues>({});

  useEffect(() => {
    setClarificationValues(defaultClarificationValues(clarificationQuestions));
  }, [clarificationQuestions]);

  const hasClarifications = clarificationQuestions.length > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <FiHelpCircle />
          Ask Data Ghost
        </CardTitle>
        <CardDescription>
          Ask a natural-language analytics question and get evidence-backed reasoning.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="question">Question</Label>
          <Textarea
            id="question"
            placeholder="Why did revenue drop last week?"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
          />
        </div>

        <Button
          onClick={() => {
            void onAsk();
          }}
          disabled={!canAsk || isAsking || question.trim().length === 0}
        >
          <FiSend className="mr-2" />
          {isAsking ? "Analyzing..." : "Ask"}
        </Button>

        {hasClarifications ? (
          <div className="space-y-3 rounded-lg border border-dashed border-border bg-muted/25 p-4">
            <p className="text-sm font-semibold">Clarification Needed</p>
            {clarificationQuestions.map((questionItem) => {
              if (isSelectType(questionItem)) {
                return (
                  <div key={questionItem.key} className="space-y-2">
                    <Label htmlFor={questionItem.key}>{questionItem.prompt}</Label>
                    <select
                      id={questionItem.key}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      value={clarificationValues[questionItem.key] || ""}
                      onChange={(event) => {
                        setClarificationValues((current) => ({
                          ...current,
                          [questionItem.key]: event.target.value,
                        }));
                      }}
                    >
                      {(questionItem.options || []).map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              if (isRadioType(questionItem)) {
                return (
                  <div key={questionItem.key} className="space-y-2">
                    <Label>{questionItem.prompt}</Label>
                    <div className="space-y-2">
                      {(questionItem.options || []).map((option) => (
                        <label key={option} className="flex items-center gap-2 text-sm">
                          <input
                            type="radio"
                            name={questionItem.key}
                            value={option}
                            checked={clarificationValues[questionItem.key] === option}
                            onChange={(event) => {
                              setClarificationValues((current) => ({
                                ...current,
                                [questionItem.key]: event.target.value,
                              }));
                            }}
                          />
                          {option}
                        </label>
                      ))}
                    </div>
                  </div>
                );
              }

              return (
                <div key={questionItem.key} className="space-y-2">
                  <Label htmlFor={questionItem.key}>{questionItem.prompt}</Label>
                  <Input
                    id={questionItem.key}
                    value={clarificationValues[questionItem.key] || ""}
                    onChange={(event) => {
                      setClarificationValues((current) => ({
                        ...current,
                        [questionItem.key]: event.target.value,
                      }));
                    }}
                  />
                </div>
              );
            })}

            <Button
              variant="secondary"
              onClick={() => {
                void onSubmitClarifications(clarificationValues);
              }}
              disabled={isAsking}
            >
              Submit Clarifications
            </Button>
          </div>
        ) : null}

        {askError ? (
          <Alert variant="destructive">
            <AlertTitle>Question failed</AlertTitle>
            <AlertDescription>
              {askError}
              {askErrorRequestId ? ` (Request ID: ${askErrorRequestId})` : ""}
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}
