"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
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

type ChartContainerProps = {
  chart: AdaptedChart;
};

function isAdaptedChart(chart: AdaptedChart | null): chart is AdaptedChart {
  return chart !== null;
}

function renderLineChart(chart: AdaptedChart, width: number, height: number) {
  return (
    <LineChart
      data={chart.data}
      width={width}
      height={height}
      margin={{ top: 8, right: 8, left: -16, bottom: 8 }}
    >
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

function renderBarChart(chart: AdaptedChart, width: number, height: number) {
  return (
    <BarChart
      data={chart.data}
      width={width}
      height={height}
      margin={{ top: 8, right: 8, left: -16, bottom: 8 }}
    >
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

function ChartContainer({ chart }: ChartContainerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const node = containerRef.current;

    if (!node) {
      return;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];

      if (!entry) {
        return;
      }

      const width = Math.floor(entry.contentRect.width);
      const height = Math.floor(entry.contentRect.height);

      setSize((current) => {
        if (current.width === width && current.height === height) {
          return current;
        }

        return { width, height };
      });
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  const hasPositiveSize = size.width > 10 && size.height > 10;
  const chartWidth = Math.max(size.width, 320);
  const chartHeight = Math.max(size.height, 240);

  return (
    <div ref={containerRef} className="h-80 w-full min-w-0">
      {hasPositiveSize ? (
        chart.kind === "line" ? (
          renderLineChart(chart, chartWidth, chartHeight)
        ) : (
          renderBarChart(chart, chartWidth, chartHeight)
        )
      ) : (
        <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
          Preparing chart...
        </div>
      )}
    </div>
  );
}

export function ChartRenderer({ charts }: ChartRendererProps) {
  const adaptedCharts = charts.map(adaptAnswerChart).filter(isAdaptedChart);

  if (adaptedCharts.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {adaptedCharts.map((chart) => (
        <Card key={chart.title} className="min-w-0">
          <CardHeader>
            <CardTitle className="text-base">{chart.title}</CardTitle>
          </CardHeader>
          <CardContent className="min-w-0">
            <ChartContainer chart={chart} />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
