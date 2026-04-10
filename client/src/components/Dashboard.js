// src/components/Dashboard.js
import React, { useEffect, useState } from "react";
import CircularProgress from "./CircularProgress";

function toNumber(value) {
  if (value == null) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const match = String(value).match(/-?[\d.]+/);
  return match ? parseFloat(match[0]) : null;
}

function InfoCard({ title, value, sub, tone = "neutral" }) {
  return (
    <article className={`info-card improved info-card--${tone}`} aria-label={title}>
      <div className="info-title">{title}</div>
      <div className="info-value">{value}</div>
      {sub && <div className="info-sub">{sub}</div>}
    </article>
  );
}

function StatusChip({ label, ok }) {
  return (
    <div
      className={`status-chip ${ok ? "ok" : "bad"}`}
      aria-label={`${label}: ${ok ? "clear" : "attention required"}`}
    >
      <div className="status-label">{label}</div>
      <div className="status-icon" aria-hidden>
        {ok ? "✓" : "!"}
      </div>
    </div>
  );
}

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

/* Dashboard main component
   - Accepts onRefresh prop: a function to perform an immediate refresh.
   - If onRefresh isn't provided, falls back to dispatching ui-refresh event.
*/
export default function Dashboard({
  dashboard = {},
  systemStatus = {},
  onRefresh,
}) {
  const viewportWidth = useViewportWidth();
  const ringSize = viewportWidth < 480 ? 120 : viewportWidth < 720 ? 136 : 150;
  const ringStroke = viewportWidth < 480 ? 12 : 14;
  const SOC = dashboard?.SOC ?? 0;
  const SOH = dashboard?.SOH ?? 0;
  const pack = dashboard?.PackVoltage ?? "—";
  const current = dashboard?.CurrentAmps ?? "—";
  const timestamp = dashboard?.timestamp ?? null;
  const currentValue = toNumber(current);
  const flowState =
    currentValue == null
      ? null
      : currentValue > 0
        ? "Charging"
        : currentValue < 0
          ? "Discharging"
          : "Idle";

  const handleRefreshClick = () => {
    if (typeof onRefresh === "function") {
      try {
        onRefresh();
      } catch (e) {
        // fallback to event dispatch if callback throws
        window.dispatchEvent(new CustomEvent("ui-refresh"));
      }
    } else {
      // fallback: older code path (keeps backward compatibility)
      window.dispatchEvent(new CustomEvent("ui-refresh"));
    }
  };

  return (
    <div className="top-card" aria-label="BMS dashboard">
      {/* LEFT: Large SOC / SOH rings */}
      <div className="top-left">
        <div className="rings" aria-hidden>
          <div className="ring-item">
            <CircularProgress
              size={ringSize}
              stroke={ringStroke}
              percentage={SOC}
              color1="#5da6ff"
              color2="#7bb3ff"
              label="SOC"
            />
          </div>

          <div className="ring-item">
            <CircularProgress
              size={ringSize}
              stroke={ringStroke}
              percentage={SOH}
              color1="#2bd48a"
              color2="#58f1b0"
              label="SOH"
            />
          </div>
        </div>
      </div>

      {/* MIDDLE: Pack + Current + actions */}
      <div className="top-mid">
        <div className="mid-grid" role="region" aria-label="Pack information">
          <InfoCard
            title="Pack Voltage"
            value={<span className="pack-large">{pack}</span>}
            sub="Latest measured pack voltage"
          />
          <InfoCard
            title="Current"
            value={<span className="pack-large">{current}</span>}
            sub={
              flowState ? (
                <span
                  className={`charging-pill charging-pill--${flowState.toLowerCase()}`}
                >
                  {flowState}
                </span>
              ) : (
                "Waiting for current data"
              )
            }
            tone={currentValue == null ? "neutral" : currentValue >= 0 ? "positive" : "warning"}
          />
        </div>

        <div className="mid-actions">
          <button
            className="btn-ghost"
            onClick={handleRefreshClick}
            title="Refresh telemetry"
          >
            Refresh data
          </button>

          <div className="small-note">
            Live • {timestamp ? new Date(timestamp).toLocaleString() : "—"}
          </div>
        </div>
      </div>

      {/* RIGHT: vertical status chips */}
      <div
        className="top-right"
        role="complementary"
        aria-label="System status"
      >
        <div className="chips-vertical">
          <StatusChip label="Overvoltage" ok={!systemStatus?.Overvoltage} />
          <StatusChip label="Overcurrent" ok={!systemStatus?.Overcurrent} />
          <StatusChip label="Overtemp" ok={!systemStatus?.Overtemp} />
          {/* <StatusChip label="ShortCircuit" ok={!systemStatus?.ShortCircuit} /> */}
        </div>
      </div>
    </div>
  );
}
