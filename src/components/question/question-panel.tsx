"use client";

import { type KeyboardEvent, useEffect, useRef, useState } from "react";
import { FiHelpCircle, FiMic, FiSend, FiSquare } from "react-icons/fi";

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
import { cn } from "@/lib/utils";
import { type ClarificationQuestion } from "@/lib/api/types";

type ClarificationValues = Record<string, string>;

type QuestionPanelProps = {
  question: string;
  setQuestion: (question: string) => void;
  onAsk: () => Promise<void>;
  onVoiceTranscribe: (audioBlob: Blob) => Promise<void>;
  onSubmitClarifications: (clarifications: ClarificationValues) => Promise<void>;
  clarificationQuestions: ClarificationQuestion[];
  canAsk: boolean;
  isAsking: boolean;
  isTranscribing: boolean;
  askError: string | null;
  askErrorRequestId?: string | null;
  transcribeError: string | null;
  transcribeErrorRequestId?: string | null;
  className?: string;
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
  onVoiceTranscribe,
  onSubmitClarifications,
  clarificationQuestions,
  canAsk,
  isAsking,
  isTranscribing,
  askError,
  askErrorRequestId,
  transcribeError,
  transcribeErrorRequestId,
  className,
}: QuestionPanelProps) {
  const [clarificationValues, setClarificationValues] = useState<ClarificationValues>({});
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const [voiceInputSupported, setVoiceInputSupported] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setClarificationValues(defaultClarificationValues(clarificationQuestions));
  }, [clarificationQuestions]);

  useEffect(() => {
    setVoiceInputSupported(
      typeof window !== "undefined" &&
        "MediaRecorder" in window &&
        Boolean(navigator.mediaDevices?.getUserMedia)
    );
  }, []);

  useEffect(
    () => () => {
      const recorder = mediaRecorderRef.current;
      if (recorder) {
        recorder.onstop = null;
        if (recorder.state !== "inactive") {
          recorder.stop();
        }
      }
      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });
    },
    []
  );

  const hasClarifications = clarificationQuestions.length > 0;
  const canSubmitQuestion =
    canAsk && !isAsking && !isRecording && !isTranscribing && question.trim().length > 0;

  function handleQuestionKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey || event.nativeEvent.isComposing) {
      return;
    }

    event.preventDefault();

    if (canSubmitQuestion) {
      void onAsk();
    }
  }

  function stopRecorder() {
    const recorder = mediaRecorderRef.current;

    if (!recorder || recorder.state === "inactive") {
      return;
    }

    recorder.stop();
  }

  async function startRecorder() {
    if (!voiceInputSupported) {
      setMicError("Voice input is not supported in this browser.");
      return;
    }

    setMicError(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);

      streamRef.current = stream;
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onerror = () => {
        setMicError("Microphone recording failed. Please try again.");
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });

        stream.getTracks().forEach((track) => {
          track.stop();
        });

        mediaRecorderRef.current = null;
        streamRef.current = null;
        audioChunksRef.current = [];
        setIsRecording(false);

        if (audioBlob.size > 0) {
          void onVoiceTranscribe(audioBlob).catch(() => {
            // Workspace mutation handles surfacing transcribe failures.
          });
        }
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      setMicError(
        "Unable to access microphone. Check browser permissions and try again."
      );
    }
  }

  function handleMicToggle() {
    if (isRecording) {
      stopRecorder();
      return;
    }

    void startRecorder();
  }

  return (
    <Card
      className={cn(
        "border-primary/45 bg-primary/5 shadow-md shadow-primary/10",
        className
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-2xl">
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
            placeholder="E.g. Why did revenue drop last week?"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            onKeyDown={handleQuestionKeyDown}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            onClick={() => {
              void onAsk();
            }}
            disabled={!canSubmitQuestion}
          >
            <FiSend className="mr-2" />
            {isAsking ? "Analyzing..." : "Ask"}
          </Button>
          <Button
            type="button"
            variant={isRecording ? "secondary" : "outline"}
            onClick={handleMicToggle}
            disabled={isTranscribing || (!voiceInputSupported && !isRecording)}
            aria-label={isRecording ? "Stop voice input" : "Start voice input"}
          >
            {isRecording ? <FiSquare className="mr-2" /> : <FiMic className="mr-2" />}
            {isRecording ? "Stop" : isTranscribing ? "Transcribing..." : "Voice"}
          </Button>
          {isRecording ? (
            <div
              className="inline-flex h-9 items-center gap-2 rounded-md border border-primary/30 bg-primary/10 px-2.5 text-xs text-primary"
              role="status"
              aria-live="polite"
            >
              <span className="flex h-3 items-end gap-0.5" aria-hidden>
                <span className="h-1 w-1 rounded-full bg-primary/70 animate-pulse" />
                <span className="h-2 w-1 rounded-full bg-primary animate-pulse [animation-delay:120ms]" />
                <span className="h-3 w-1 rounded-full bg-primary/80 animate-pulse [animation-delay:240ms]" />
              </span>
              <span className="font-medium">Recording...</span>
            </div>
          ) : null}
        </div>

        {micError ? (
          <Alert variant="destructive">
            <AlertTitle>Voice input unavailable</AlertTitle>
            <AlertDescription>{micError}</AlertDescription>
          </Alert>
        ) : null}

        {transcribeError ? (
          <Alert variant="destructive">
            <AlertTitle>Voice transcription failed</AlertTitle>
            <AlertDescription>
              {transcribeError}
              {transcribeErrorRequestId
                ? ` (Request ID: ${transcribeErrorRequestId})`
                : ""}
            </AlertDescription>
          </Alert>
        ) : null}

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
