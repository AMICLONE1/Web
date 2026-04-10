// server/server.js
const express = require("express");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const PORT = process.env.PORT || 5000;

// Allow CORS from frontend (adjust origin for production)
app.use(cors());
app.use(express.json());

// Initialize with sample payload so UI has something
let latestBmsData = {
  timestamp: new Date().toISOString(),
  dashboard: {
    SOC: 88,
    SOH: 95,
    PackVoltage: "323V Charging",
    CurrentAmps: "15A",
    Power: "5.7 kW",
    Cycles: 452,
  },
  systemStatus: {
    Overvoltage: true,
    Overcurrent: false,
    Overtemp: true,
    ShortCircuit: false,
  },
  // default to 8 cells (8s pack example)
  cellVoltages: [3.36, 3.33, 3.39, 3.2, 3.11, 3.29, 3.32, 3.31],
  temperatures: [
    { time: 0, value: 24.5 },
    { time: 1, value: 26.0 },
    { time: 2, value: 27.2 },
  ],
};

// HTTP endpoints
app.get("/", (req, res) =>
  res.send("BMS backend running. Use /api/current-data or WS.")
);
app.get("/api/current-data", (req, res) => res.json(latestBmsData));

// Accept HTTP POST from ESP as fallback (also broadcasts to WS clients)
app.post("/api/bms-data", (req, res) => {
  const payload = req.body;
  if (!payload || typeof payload !== "object") {
    return res.status(400).json({ error: "Invalid JSON" });
  }
  latestBmsData = {
    ...payload,
    timestamp: payload.timestamp || new Date().toISOString(),
  };
  broadcastToBrowsers({ type: "update", data: latestBmsData });
  console.log("[HTTP] updated latestBmsData, broadcasting to browsers");
  return res.json({ status: "ok" });
});

// create server and WS server
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Mark clients that register as browsers (so we only broadcast to them)
wss.on("connection", (ws) => {
  ws.isBrowserClient = false;
  ws.isEsp32 = false;

  ws.on("message", (message) => {
    // try parse JSON
    let parsed = null;
    try {
      parsed = JSON.parse(message.toString());
    } catch (e) {
      parsed = null;
    }

    if (parsed && parsed.type === "register") {
      if (parsed.client === "browser") {
        ws.isBrowserClient = true;
        ws.send(
          JSON.stringify({ type: "hello", message: "registered-browser" })
        );
        // send current snapshot immediately
        ws.send(JSON.stringify({ type: "update", data: latestBmsData }));
        console.log("[WS] browser registered — sent current snapshot");
        return;
      }
      if (parsed.client === "esp32") {
        ws.isEsp32 = true;
        ws.send(JSON.stringify({ type: "hello", message: "registered-esp32" }));
        console.log("[WS] esp32 registered");
        return;
      }
    }

    // If message looks like a full payload (dashboard field), treat as data
    if (parsed && parsed.dashboard) {
      latestBmsData = {
        ...parsed,
        timestamp: parsed.timestamp || new Date().toISOString(),
      };
      broadcastToBrowsers({ type: "update", data: latestBmsData });
      console.log(
        "[WS] Received data from ESP32 via WS — broadcast to browsers"
      );
      return;
    }

    // Otherwise ignore or log short
    // console.log("[WS] got unknown message:", message.toString().slice(0,200));
  });

  ws.on("close", () => {});
  ws.on("error", (err) => console.error("[WS] client error", err));
});

function broadcastToBrowsers(msg) {
  const s = JSON.stringify(msg);
  wss.clients.forEach((c) => {
    if (c.readyState === WebSocket.OPEN && c.isBrowserClient) {
      c.send(s);
    }
  });
}

server.listen(PORT, () => {
  console.log(`✅ BMS server listening on http://localhost:${PORT}`);
  console.log("WebSocket endpoint is ws://localhost:" + PORT);
});
