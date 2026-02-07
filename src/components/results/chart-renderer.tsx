"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { type AnswerChart } from "@/lib/api/types";

import { adaptAnswerChart, type AdaptedChart } from "./chart-adapter";

const SERIES_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
];

type ChartRendererProps = {
  charts: AnswerChart[];
};

function isAdaptedChart(chart: AdaptedChart | null): chart is AdaptedChart {
  return chart !== null;
}

function renderLineChart(chart: AdaptedChart) {
  return (
    <LineChart data={chart.data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={chart.xKey} tick={{ fontSize: 12 }} />
      <YAxis tick={{ fontSize: 12 }} />
      <Tooltip />
      <Legend />
      {chart.yKeys.slice(0, 3).map((key, index) => (
        <Line
          key={key}
          type="monotone"
          dataKey={key}
          stroke={SERIES_COLORS[index % SERIES_COLORS.length]}
          strokeWidth={2}
          dot={false}
        />
      ))}
    </LineChart>
  );
}

function renderBarChart(chart: AdaptedChart) {
  return (
    <BarChart data={chart.data} margin={{ top: 8, right: 8, left: -16, bottom: 8 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis dataKey={chart.xKey} tick={{ fontSize: 12 }} />
      <YAxis tick={{ fontSize: 12 }} />
      <Tooltip />
      <Legend />
      {chart.yKeys.slice(0, 3).map((key, index) => (
        <Bar
          key={key}
          dataKey={key}
          fill={SERIES_COLORS[index % SERIES_COLORS.length]}
          radius={[6, 6, 0, 0]}
        />
      ))}
    </BarChart>
  );
}

export function ChartRenderer({ charts }: ChartRendererProps) {
  const adaptedCharts = charts.map(adaptAnswerChart).filter(isAdaptedChart);

  if (adaptedCharts.length === 0) {
    return null;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {adaptedCharts.map((chart) => (
        <Card key={chart.title}>
          <CardHeader>
            <CardTitle className="text-base">{chart.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                {chart.kind === "line" ? renderLineChart(chart) : renderBarChart(chart)}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
