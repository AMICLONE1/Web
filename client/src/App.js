// src/App.js
import React, { useEffect, useRef, useState } from "react";
import Dashboard from "./components/Dashboard";
import CellGrid from "./components/CellGrid";
import TemperatureGrid from "./components/TemperatureGrid";
import TimeSeriesCharts from "./components/TimeSeriesCharts";
import Footer from "./components/Footer";

const MAX_HISTORY = 90;

// Flash BMS Logo SVG
const FlashLogo = () => (
  <svg
    width="154"
    height="84"
    viewBox="0 0 270 140"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="Flash BMS logo"
  >
    <defs>
      <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: "#72a8ff", stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: "#2bd48a", stopOpacity: 1 }} />
      </linearGradient>
      <linearGradient id="boltGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{ stopColor: "#ffd08a", stopOpacity: 1 }} />
        <stop offset="100%" style={{ stopColor: "#ff9b3d", stopOpacity: 1 }} />
      </linearGradient>
    </defs>
    <rect
      x="3"
      y="3"
      width="264"
      height="134"
      rx="32"
      fill="rgba(255,255,255,0.04)"
      stroke="rgba(255,255,255,0.08)"
      strokeWidth="1.5"
    />
    <circle cx="54" cy="70" r="33" fill="url(#textGrad)" opacity="0.15" />
    <path
      d="M67 22L44 66H60L41 116L97 55H77L92 22Z"
      fill="url(#boltGrad)"
    />
    <text
      x="114"
      y="56"
      style={{
        fill: "url(#textGrad)",
        fontFamily: '"Space Grotesk", sans-serif',
        fontWeight: 700,
        fontSize: 36,
        letterSpacing: 2,
      }}
    >
      FLASH
    </text>
    <text
      x="114"
      y="92"
      style={{
        fill: "rgba(231,240,255,0.84)",
        fontFamily: '"Space Grotesk", sans-serif',
        fontWeight: 600,
        fontSize: 26,
        letterSpacing: 6,
      }}
    >
      BMS
    </text>
  </svg>
);

function parseNum(s) {
  if (s == null) return null;
  if (typeof s === "number") return s;
  const m = String(s).match(/-?[\d.]+/);
  return m ? parseFloat(m[0]) : null;
}

function normalizePayload(raw) {
  if (!raw || typeof raw !== "object") return raw;
  const p = { ...raw };

  if (p.timestamp != null) {
    const ts =
      typeof p.timestamp === "string" ? parseInt(p.timestamp, 10) : p.timestamp;
    p.timestamp = Number.isFinite(ts) ? ts : Date.now();
  } else {
    p.timestamp = Date.now();
  }

  if (!p.dashboard) {
    p.dashboard = {};

    if (p.totalPackVoltage != null) {
      const pack = parseFloat(p.totalPackVoltage);
      p.dashboard.PackVoltage = Number.isFinite(pack)
        ? `${pack.toFixed(2)}V`
        : String(p.totalPackVoltage);
    }

    if (p.SOC != null) p.dashboard.SOC = Math.round(Number(p.SOC));
    if (p.SOH != null) p.dashboard.SOH = Math.round(Number(p.SOH));
    else p.dashboard.SOH = 100;

    if (p.current != null) {
      const curr = parseFloat(p.current);
      p.dashboard.CurrentAmps = Number.isFinite(curr)
        ? `${curr.toFixed(2)}A`
        : String(p.current);
    }
  }

  if (!p.systemStatus && p.faults) {
    p.systemStatus = {
      Overvoltage: !p.faults.voltage,
      Overcurrent: !p.faults.current,
      Overtemp: !p.faults.temperature,
      DeltaVoltage: !p.faults.deltaVoltage,
    };
  }

  if (
    !Array.isArray(p.cellVoltages) &&
    p.voltages &&
    typeof p.voltages === "object"
  ) {
    const voltArray = [];
    for (let i = 1; i <= 32; i++) {
      const key = `V${i}`;
      if (Object.prototype.hasOwnProperty.call(p.voltages, key)) {
        const v = parseFloat(p.voltages[key]);
        if (Number.isFinite(v)) voltArray.push(v);
      } else if (i > 8) break;
    }
    if (voltArray.length > 0) p.cellVoltages = voltArray;
  }

  if (
    !Array.isArray(p.temperatures) &&
    p.temperatures &&
    typeof p.temperatures === "object"
  ) {
    const temps = [];
    for (let i = 1; i <= 32; i++) {
      const key = `T${i}`;
      if (Object.prototype.hasOwnProperty.call(p.temperatures, key)) {
        const v = parseFloat(p.temperatures[key]);
        if (Number.isFinite(v)) temps.push({ time: i - 1, value: v });
      } else if (i > 8) break;
    }
    if (temps.length > 0) p.temperatures = temps;
  }

  return p;
}

function formatTimestamp(timestamp) {
  if (!timestamp) return "Awaiting first frame";
  const parsed = new Date(timestamp);
  return Number.isNaN(parsed.getTime())
    ? "Awaiting first frame"
    : parsed.toLocaleString();
}

function MetricCard({ label, value, note, tone = "neutral" }) {
  return (
    <article className={`metric-card metric-card--${tone}`} aria-label={label}>
      <span className="metric-label">{label}</span>
      <span className="metric-value">{value}</span>
      {note ? <span className="metric-note">{note}</span> : null}
    </article>
  );
}

export default function App() {
  const [latest, setLatest] = useState(null);
  const [connected, setConnected] = useState(false);

  const historyRef = useRef({
    times: [],
    pack: [],
    avgCell: [],
    temp: [],
    soc: [],
    current: [],
  });

  const pushHistory = (sample) => {
    const h = historyRef.current;
    h.times.push(sample.time);
    h.pack.push(sample.pack ?? null);
    h.avgCell.push(sample.avgCell ?? null);
    h.temp.push(sample.temp ?? null);
    h.soc.push(sample.soc ?? null);
    h.current.push(sample.current ?? null);
    while (h.times.length > MAX_HISTORY) {
      h.times.shift();
      h.pack.shift();
      h.avgCell.shift();
      h.temp.shift();
      h.soc.shift();
      h.current.shift();
    }
  };

  const handlePayload = (payloadRaw) => {
    if (!payloadRaw) return;
    const payload = normalizePayload(payloadRaw);
    if (!payload) return;

    setLatest(payload);

    const now = payload.timestamp || Date.now();
    const packParsed = parseNum(payload.dashboard?.PackVoltage);
    const cells = Array.isArray(payload.cellVoltages)
      ? payload.cellVoltages.map(parseNum).filter(Number.isFinite)
      : [];
    const avgCell = cells.length
      ? cells.reduce((a, b) => a + b, 0) / cells.length
      : null;
    const temps = Array.isArray(payload.temperatures)
      ? payload.temperatures
          .map((t) => parseNum(t?.value))
          .filter(Number.isFinite)
      : [];
    const avgTemp = temps.length
      ? temps.reduce((a, b) => a + b, 0) / temps.length
      : null;
    const soc = parseNum(payload.dashboard?.SOC);
    const current = parseNum(payload.dashboard?.CurrentAmps);

    pushHistory({
      time: now,
      pack: packParsed,
      avgCell,
      temp: avgTemp,
      soc,
      current,
    });
  };

  const fetchNow = async () => {
    try {
      const url = "http://localhost:5000/api/current-data";
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return;
      const json = await res.json();
      handlePayload(json);
      console.info("✅ Data refreshed");
    } catch (e) {
      console.warn("Fetch failed:", e);
    }
  };

  useEffect(() => {
    // Connect to WebSocket server
    const protocol = window.location.protocol === "https:" ? "wss" : "ws";
    const host = window.location.hostname;
    const port = 5000;
    const wsUrl = `${protocol}://${host}:${port}`;
    
    let ws = null;
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 10;
    const reconnectDelay = 3000;
    
    const connectWebSocket = () => {
      try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
          console.log("✅ WebSocket connected");
          setConnected(true);
          reconnectAttempts = 0;
          // Register as browser client
          ws.send(JSON.stringify({ type: "register", client: "browser" }));
        };
        
        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "update" && msg.data) {
              handlePayload(msg.data);
            }
          } catch (e) {
            console.error("Failed to parse WebSocket message:", e);
          }
        };
        
        ws.onerror = (error) => {
          console.error("WebSocket error:", error);
          setConnected(false);
        };
        
        ws.onclose = () => {
          console.warn("WebSocket disconnected");
          setConnected(false);
          // Attempt to reconnect
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            console.log(`Reconnecting... (attempt ${reconnectAttempts}/${maxReconnectAttempts})`);
            setTimeout(connectWebSocket, reconnectDelay);
          }
        };
      } catch (e) {
        console.error("Failed to create WebSocket:", e);
        setConnected(false);
      }
    };
    
    connectWebSocket();
    
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, []);

  const historyForUI = {
    timestamps: historyRef.current.times,
    pack: historyRef.current.pack,
    avgCell: historyRef.current.avgCell,
    temp: historyRef.current.temp,
    soc: historyRef.current.soc,
    current: historyRef.current.current,
  };

  const cellVoltages = Array.isArray(latest?.cellVoltages)
    ? latest.cellVoltages
    : [];
  const temperatures = Array.isArray(latest?.temperatures)
    ? latest.temperatures
    : [];
  const statusValues = Object.values(latest?.systemStatus ?? {});
  const safeCount = statusValues.filter(Boolean).length;
  const totalStatusCount = statusValues.length;
  const safetyValue = totalStatusCount
    ? `${safeCount}/${totalStatusCount} clear`
    : "Awaiting telemetry";
  const safetyNote = totalStatusCount
    ? safeCount === totalStatusCount
      ? "No active faults"
      : `${totalStatusCount - safeCount} alarm${
          totalStatusCount - safeCount === 1 ? "" : "s"
        } active`
    : "Fault flags will appear here";
  const connectionState = connected ? "Online" : "Offline";
  const packValue = latest?.dashboard?.PackVoltage ?? "—";
  const currentValue = latest?.dashboard?.CurrentAmps ?? "—";
  const historyCount = historyRef.current.times.length;
  const liveTimestamp = formatTimestamp(latest?.timestamp);

  return (
    <div className="app-shell">
      <div className="app-aurora" aria-hidden="true" />
      <div className="app-grid-overlay" aria-hidden="true" />

      <div className="app-content">
        <header className="hero-shell">
          <div className="hero-top">
            <div className="brand-lockup">
              <div className="brand-mark">
                <FlashLogo />
              </div>
              <div className="brand-copy">
                <p className="eyebrow">Battery intelligence dashboard</p>
                <h1>Flash BMS Monitor</h1>
                <p className="hero-description">
                  A focused control room for pack health, thermal drift, and
                  live safety states.
                </p>
              </div>
            </div>

            <div className="hero-status">
              <div
                className={`connection-badge ${
                  connected ? "connected" : "disconnected"
                }`}
              >
                <span className="connection-dot"></span>
                <span className="connection-text">
                  {connected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <div className="timestamp-display">Updated {liveTimestamp}</div>
            </div>
          </div>

          <div className="metric-grid">
            <MetricCard
              label="Connection"
              value={connectionState}
              note="Live telemetry stream"
              tone={connected ? "positive" : "warning"}
            />
            <MetricCard
              label="Safety"
              value={safetyValue}
              note={safetyNote}
              tone={
                totalStatusCount > 0 && safeCount === totalStatusCount
                  ? "positive"
                  : "warning"
              }
            />
            <MetricCard
              label="Pack Voltage"
              value={packValue}
              note="Snapshot of the pack bus"
            />
            <MetricCard
              label="Current"
              value={currentValue}
              note="Positive means charging"
            />
            <MetricCard
              label="Cells"
              value={`${cellVoltages.length} sensed`}
              note="Voltage samples in this frame"
            />
            <MetricCard
              label="Temperatures"
              value={`${temperatures.length} sensed`}
              note="Thermal samples in this frame"
            />
            <MetricCard
              label="History"
              value={`${historyCount} points`}
              note="Rolling window of telemetry"
            />
          </div>
        </header>

        <main className="dashboard-stack">
          <section className="section-shell">
            <div className="section-header">
              <div>
                <p className="section-kicker">System overview</p>
                <h2 className="section-title">Live pack state</h2>
                <p className="section-copy">
                  Primary indicators, safety flags, and the latest refresh
                  action live here.
                </p>
              </div>
            </div>

            <Dashboard
              dashboard={latest?.dashboard}
              systemStatus={latest?.systemStatus}
              fans={latest?.fans}
              vMax={latest?.vMax}
              vMin={latest?.vMin}
              vDelta={latest?.vDelta}
              tMax={latest?.tMax}
              tMin={latest?.tMin}
              onRefresh={fetchNow}
            />
          </section>

          <div className="insight-grid">
            <section className="section-shell">
              <div className="section-header">
                <div>
                  <p className="section-kicker">Cell balance</p>
                  <h2 className="section-title">Voltage distribution</h2>
                  <p className="section-copy">
                    Spot imbalance patterns before they become a problem.
                  </p>
                </div>
              </div>

              <CellGrid voltages={cellVoltages} />

              <div className="legend-row">
                <div className="legend-item">
                  <span className="legend-dot green"></span>
                  <span>≥3.20V Optimal</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot yellow"></span>
                  <span>3.00-3.19V Warning</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot red"></span>
                  <span>&lt;3.00V Critical</span>
                </div>
              </div>
            </section>

            <section className="section-shell">
              <div className="section-header">
                <div>
                  <p className="section-kicker">Thermal monitoring</p>
                  <h2 className="section-title">Temperature sensors</h2>
                  <p className="section-copy">
                    Monitor hot spots and thermal spread across the pack.
                  </p>
                </div>
              </div>

              <TemperatureGrid temperatures={temperatures} />

              <div className="legend-row legend-row--wrap">
                <div className="legend-item">
                  <span className="legend-dot temp-critical"></span>
                  <span>≥40°C Critical</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot temp-high"></span>
                  <span>30-39°C High</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot temp-normal"></span>
                  <span>20-29°C Normal</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot temp-cool"></span>
                  <span>10-19°C Cool</span>
                </div>
                <div className="legend-item">
                  <span className="legend-dot temp-cold"></span>
                  <span>&lt;10°C Cold</span>
                </div>
              </div>
            </section>
          </div>

          <section className="section-shell section-shell--full">
            <div className="section-header">
              <div>
                <p className="section-kicker">Performance history</p>
                <h2 className="section-title">Trends over time</h2>
                <p className="section-copy">
                  Voltage, temperature, SOC, and current over the latest
                  samples.
                </p>
              </div>
              <div className="section-meta">{historyCount} samples tracked</div>
            </div>

            <TimeSeriesCharts history={historyForUI} />
          </section>
        </main>

        <Footer />
      </div>
    </div>
  );
}
