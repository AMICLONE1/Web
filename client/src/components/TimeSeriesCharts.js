// src/components/TimeSeriesCharts.js
import React, { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const axisTick = { fill: "rgba(223, 232, 247, 0.78)", fontSize: 12 };
const legendStyle = { color: "rgba(223, 232, 247, 0.8)", fontSize: 12 };
const gridStroke = "rgba(255,255,255,0.08)";
const tooltipStyle = {
  background: "rgba(7, 13, 25, 0.96)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 16,
  padding: "10px 12px",
  boxShadow: "0 18px 40px rgba(0, 0, 0, 0.35)",
  color: "#f7fbff",
};

function useViewportWidth() {
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 1280
  );

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const handleResize = () => setViewportWidth(window.innerWidth);
    handleResize();
    window.addEventListener("resize", handleResize, { passive: true });

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return viewportWidth;
}

function ChartCard({ title, description, children }) {
  return (
    <article className="chart-card">
      <div className="chart-card__header">
        <div>
          <h4 className="chart-title-modern">{title}</h4>
          <p className="chart-subtitle">{description}</p>
        </div>
      </div>
      <div className="chart-card__body">{children}</div>
    </article>
  );
}

export default function TimeSeriesCharts({ history }) {
  const viewportWidth = useViewportWidth();
  const compactChart = viewportWidth < 640;
  const chartHeight = viewportWidth < 480 ? 190 : viewportWidth < 768 ? 210 : 240;
  const axisTick = { fill: "rgba(223, 232, 247, 0.78)", fontSize: compactChart ? 10 : 12 };
  const legendStyle = { color: "rgba(223, 232, 247, 0.8)", fontSize: compactChart ? 11 : 12 };
  const tooltipStyle = {
    background: "rgba(7, 13, 25, 0.96)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: compactChart ? 14 : 16,
    padding: compactChart ? "8px 10px" : "10px 12px",
    boxShadow: "0 18px 40px rgba(0, 0, 0, 0.35)",
    color: "#f7fbff",
  };
  const lineWidth = compactChart ? 2.5 : 3;
  const showLegend = viewportWidth >= 540;

  if (!history || !history.timestamps || history.timestamps.length === 0) {
    return (
      <div className="empty-state empty-state--wide">
        <div className="empty-state__title">No historical data available</div>
        <div className="empty-state__copy">
          Telemetry history will appear here once the pack begins streaming
          samples.
        </div>
      </div>
    );
  }

  const data = history.timestamps.map((t, i) => ({
    time: new Date(t).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    pack: history.pack[i],
    avgCell: history.avgCell[i],
    temp: history.temp[i],
    soc: history.soc[i],
    current: history.current[i],
  }));

  return (
    <div className="charts-container">
      <ChartCard
        title="Voltage Trends"
        description="Pack voltage and average cell voltage across the latest samples."
      >
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={data} margin={{ top: 8, right: 10, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke={gridStroke} />
            <XAxis
              dataKey="time"
              tick={axisTick}
              tickMargin={10}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={axisTick}
              tickMargin={10}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#e8eff8" }} />
            {showLegend ? <Legend wrapperStyle={legendStyle} /> : null}
            <Line
              type="monotone"
              dataKey="avgCell"
              stroke="#47d6a8"
              strokeWidth={lineWidth}
              dot={false}
              connectNulls
              name="Avg Cell V"
            />
            <Line
              type="monotone"
              dataKey="pack"
              stroke="#6ea7ff"
              strokeWidth={lineWidth}
              dot={false}
              connectNulls
              name="Pack V"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Temperature Trends"
        description="Average thermal sensor drift across the monitored pack."
      >
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={data} margin={{ top: 8, right: 10, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke={gridStroke} />
            <XAxis
              dataKey="time"
              tick={axisTick}
              tickMargin={10}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={axisTick}
              tickMargin={10}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#e8eff8" }} />
            {showLegend ? <Legend wrapperStyle={legendStyle} /> : null}
            <Line
              type="monotone"
              dataKey="temp"
              stroke="#ffb86b"
              strokeWidth={lineWidth}
              dot={false}
              connectNulls
              name="Avg Temp °C"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="State of Charge"
        description="Battery fill level over the captured history window."
      >
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={data} margin={{ top: 8, right: 10, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke={gridStroke} />
            <XAxis
              dataKey="time"
              tick={axisTick}
              tickMargin={10}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={axisTick}
              tickMargin={10}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#e8eff8" }} />
            {showLegend ? <Legend wrapperStyle={legendStyle} /> : null}
            <Line
              type="monotone"
              dataKey="soc"
              stroke="#7bb3ff"
              strokeWidth={lineWidth}
              dot={false}
              connectNulls
              name="SOC %"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard
        title="Current Flow"
        description="Charge and discharge current over time."
      >
        <ResponsiveContainer width="100%" height={chartHeight}>
          <LineChart data={data} margin={{ top: 8, right: 10, bottom: 4, left: 0 }}>
            <CartesianGrid strokeDasharray="4 4" stroke={gridStroke} />
            <XAxis
              dataKey="time"
              tick={axisTick}
              tickMargin={10}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={axisTick}
              tickMargin={10}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: "#e8eff8" }} />
            {showLegend ? <Legend wrapperStyle={legendStyle} /> : null}
            <Line
              type="monotone"
              dataKey="current"
              stroke="#ff6b6b"
              strokeWidth={lineWidth}
              dot={false}
              connectNulls
              name="Current A"
            />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
