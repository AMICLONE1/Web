import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function TempChart({ temps }) {
  const data = (temps || []).map((t) => ({ x: t.time, y: t.value }));
  return (
    <div style={{ width: "100%", height: 240 }}>
      <ResponsiveContainer>
        <LineChart data={data}>
          <CartesianGrid stroke="#172033" />
          <XAxis dataKey="x" tick={{ fill: "#9fb0d4" }} />
          <YAxis tick={{ fill: "#9fb0d4" }} />
          <Tooltip />
          <Line
            type="monotone"
            dataKey="y"
            stroke="#ffb86b"
            strokeWidth={2}
            dot={{ r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
