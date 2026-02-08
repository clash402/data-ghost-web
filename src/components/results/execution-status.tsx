"use client";

import { useEffect, useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

const PHASES = ["Planning", "Running queries", "Validating", "Explaining"];

type ExecutionStatusProps = {
  isVisible: boolean;
};

export function ExecutionStatus({ isVisible }: ExecutionStatusProps) {
  const [phaseIndex, setPhaseIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) {
      setPhaseIndex(0);
      return;
    }

    const interval = window.setInterval(() => {
      setPhaseIndex((index) => (index + 1) % PHASES.length);
    }, 1500);

    return () => {
      window.clearInterval(interval);
    };
  }, [isVisible]);

  if (!isVisible) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Analyzing your question</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Spinner className="h-5 w-5 text-primary" />
          <p className="font-medium">{PHASES[phaseIndex]}</p>
        </div>
      </CardContent>
    </Card>
  );
}
