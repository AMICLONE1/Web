// src/components/TemperatureGrid.js
import React from "react";

const parseNumber = (v) => {
  if (v === null || v === undefined) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).trim();
  if (!s) return null;
  const m = s.match(/-?[\d]+(?:\.[\d]+)?/);
  return m ? parseFloat(m[0]) : null;
};

const getTempClass = (t) => {
  if (t === null || t === undefined || Number.isNaN(t)) return "temp-none";
  if (t >= 40) return "temp-critical";
  if (t >= 30) return "temp-high";
  if (t >= 20) return "temp-normal";
  if (t >= 10) return "temp-cool";
  return "temp-cold";
};

const getTempIcon = (t) => {
  if (t === null || t === undefined || Number.isNaN(t)) return "🌡️";
  if (t >= 40) return "🔥";
  if (t >= 30) return "🌡️";
  if (t >= 20) return "✓";
  if (t >= 10) return "❄️";
  return "🧊";
};

export default function TemperatureGrid({ temperatures = [] }) {
  const temps = Array.isArray(temperatures) ? temperatures : [];
  if (!temps.length) {
    return (
      <div className="empty-state empty-state--compact">
        <div className="empty-state__title">No temperature data</div>
        <div className="empty-state__copy">
          Thermal sensors will appear here as soon as readings arrive.
        </div>
      </div>
    );
  }

  return (
    <div className="temp-grid-modern" role="list" aria-label="Temperature sensors">
      {temps.map((temp, i) => {
        const val = parseNumber(temp?.value ?? temp);
        const display =
          val !== null && !Number.isNaN(val) ? `${val.toFixed(1)}°C` : "—";
        const cls = getTempClass(val);
        const icon = getTempIcon(val);

        return (
          <article
            key={i}
            className={`temp-card-modern ${cls}`}
            role="listitem"
            aria-label={`Sensor ${i + 1}: ${display}`}
          >
            <div className="temp-icon">{icon}</div>
            <div className="temp-label">Sensor {i + 1}</div>
            <div className="temp-value">{display}</div>
            <div className="temp-bar">
              <div
                className="temp-bar-fill"
                style={{
                  width:
                    val !== null
                      ? `${Math.min(100, Math.max(0, ((val + 10) / 60) * 100))}%`
                    : "0%",
                }}
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}
