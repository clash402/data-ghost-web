import { z } from "zod";

import { type AnswerChart } from "@/lib/api/types";

const chartPrimitiveSchema = z.union([z.string(), z.number(), z.null()]);
const chartRowSchema = z.record(z.string(), chartPrimitiveSchema);
const chartDataSchema = z.array(chartRowSchema);

export type ChartRow = z.infer<typeof chartRowSchema>;

export type AdaptedChart = {
  kind: "line" | "bar";
  title: string;
  data: ChartRow[];
  xKey: string;
  yKeys: string[];
};

function pickXAxisKey(data: ChartRow[], keys: string[], yKeys: string[]) {
  const stringKey = keys.find((key) => data.some((row) => typeof row[key] === "string"));

  if (stringKey) {
    return stringKey;
  }

  const nonMetricKey = keys.find((key) => !yKeys.includes(key));
  return nonMetricKey || keys[0];
}

export function adaptAnswerChart(chart: AnswerChart): AdaptedChart | null {
  const parsed = chartDataSchema.safeParse(chart.data);

  if (!parsed.success || parsed.data.length === 0) {
    return null;
  }

  const keys = Object.keys(parsed.data[0]);

  if (keys.length < 2) {
    return null;
  }

  const yKeys = keys.filter((key) =>
    parsed.data.some((row) => typeof row[key] === "number")
  );

  if (yKeys.length === 0) {
    return null;
  }

  const xKey = pickXAxisKey(parsed.data, keys, yKeys);

  return {
    kind: chart.kind,
    title: chart.title,
    data: parsed.data,
    xKey,
    yKeys,
  };
}
