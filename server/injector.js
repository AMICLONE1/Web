/**
 * BMS Data Injector - Node.js Version
 * Generates and sends fake Battery Management System data continuously
 */

const http = require("http");

class BMSDataInjector {
  constructor(serverUrl = "http://localhost:5000", interval = 2000) {
    this.serverUrl = serverUrl;
    this.interval = interval;
    this.endpoint = `${serverUrl}/api/bms-data`;
    this.tempsHistory = [];
    this.cycleCount = 0;
    this.currentSOC = 93;
    this.currentTemp = 25.0;
    this.baseVoltage = 3.25;
    this.soh = 98;
    this.isCharging = false;
    this.sentCount = 0;
    this.failedCount = 0;
  }

  // Generate cell voltages correlated with SOC
  generateCellVoltages(numCells = 8, soc = 93) {
    const baseVoltage = 3.0 + (soc / 100.0) * 0.5;
    const voltages = [];
    for (let i = 0; i < numCells; i++) {
      const variation = Math.random() * 0.02 - 0.01;
      voltages.push(parseFloat((baseVoltage + variation).toFixed(2)));
    }
    return voltages;
  }

  // Generate temperature with minimal change at idle
  generateTemperature(ambientTemp = 25, current = 0) {
    const ambientEffect = Math.random() * 0.2 - 0.1;
    let newTemp = this.currentTemp + ambientEffect;
    newTemp = Math.max(20.0, Math.min(30.0, newTemp));
    this.currentTemp = newTemp;
    return parseFloat(newTemp.toFixed(1));
  }

  // Generate SOC - constant at 93%
  generateSOC() {
    const variation = Math.random() - 0.5;
    this.currentSOC = 93 + variation;
    this.currentSOC = Math.max(92.0, Math.min(94.0, this.currentSOC));
    return Math.round(this.currentSOC);
  }

  // Generate SOH - changes very slowly
  generateSOH() {
    this.soh = Math.max(80, this.soh - 0.0001 * Math.random());
    return Math.round(this.soh);
  }

  // Generate pack voltage correlated with SOC
  generatePackVoltage(soc) {
    const baseVoltage = 24.0 + (soc / 100.0) * 5.4;
    const ripple = Math.random() * 0.1 - 0.05;
    const voltage = baseVoltage + ripple;
    return parseFloat(voltage.toFixed(1));
  }

  // Generate current - keep at ~0A (idle)
  generateCurrent() {
    const current = Math.random() * 0.6 - 0.3;
    return parseFloat(current.toFixed(1));
  }

  // Generate power based on voltage and current
  generatePower(voltage, current) {
    return parseFloat(((voltage * Math.abs(current)) / 1000).toFixed(2));
  }

  // Generate status flags - all safe
  generateStatusFlags(voltage, current, temp) {
    return {
      Overvoltage: false,
      Overcurrent: false,
      Overtemp: false,
      ShortCircuit: false,
    };
  }

  // Generate complete BMS payload
  generateBMSData() {
    const soc = this.generateSOC();
    const soh = this.generateSOH();
    const packVoltage = this.generatePackVoltage(soc);
    const current = this.generateCurrent();
    const temp = this.generateTemperature(25.0, current);
    const power = this.generatePower(packVoltage, current);

    // Increment cycle count occasionally
    if (Math.random() < 0.001) {
      this.cycleCount += 1;
    }

    // Add to temperature history
    this.tempsHistory.push({
      time: this.tempsHistory.length,
      value: temp,
    });

    // Keep only last 90 readings
    if (this.tempsHistory.length > 90) {
      this.tempsHistory.shift();
    }

    // Determine status
    const status = current > 2 ? "Charging" : current < -2 ? "Discharging" : "Idle";

    // Generate 7 temperature sensors
    const tempSensors = [];
    for (let i = 0; i < 7; i++) {
      const sensorTemp = temp + (Math.random() * 0.4 - 0.2);
      tempSensors.push({
        time: i,
        value: parseFloat(sensorTemp.toFixed(1)),
      });
    }

    const payload = {
      timestamp: new Date().toISOString(),
      dashboard: {
        SOC: soc,
        SOH: soh,
        PackVoltage: `${packVoltage}V ${status}`,
        CurrentAmps: `${current}A`,
        Power: `${power} kW`,
        Cycles: this.cycleCount,
      },
      systemStatus: this.generateStatusFlags(packVoltage, current, temp),
      cellVoltages: this.generateCellVoltages(8, soc),
      temperatures: tempSensors,
    };

    return payload;
  }

  // Send data to server
  sendData(payload) {
    return new Promise((resolve) => {
      const postData = JSON.stringify(payload);

      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postData),
        },
      };

      const req = http.request(this.endpoint, options, (res) => {
        if (res.statusCode === 200) {
          resolve(true);
        } else {
          console.error(`❌ Error: Server returned ${res.statusCode}`);
          resolve(false);
        }
      });

      req.on("error", (error) => {
        console.error(`❌ Error: ${error.message}`);
        resolve(false);
      });

      req.setTimeout(5000);
      req.write(postData);
      req.end();
    });
  }

  // Start continuous data injection
  async run() {
    console.log(`🚀 BMS Data Injector Started`);
    console.log(`📍 Server: ${this.serverUrl}`);
    console.log(`⏱️  Interval: ${this.interval}ms`);
    console.log(`💡 Sending fake BMS data... (Press Ctrl+C to stop)\n`);

    setInterval(async () => {
      const payload = this.generateBMSData();

      if (await this.sendData(payload)) {
        this.sentCount++;
        const soc = payload.dashboard.SOC;
        const soh = payload.dashboard.SOH;
        const voltage = payload.dashboard.PackVoltage;
        const current = payload.dashboard.CurrentAmps;
        const temp =
          payload.temperatures.length > 0
            ? payload.temperatures[0].value
            : "N/A";

        console.log(
          `✅ #${this.sentCount} Sent | SOC: ${soc}% | SOH: ${soh}% | V: ${voltage} | I: ${current} | T: ${temp}°C`
        );
      } else {
        this.failedCount++;
      }
    }, this.interval);
  }
}

// Main entry point
const serverUrl = process.env.SERVER_URL || "http://localhost:5000";
const interval = parseInt(process.env.INTERVAL) || 2000;

const injector = new BMSDataInjector(serverUrl, interval);
injector.run();

// Graceful shutdown
process.on("SIGINT", () => {
  console.log(
    `\n\n⏹️  Injector stopped\n📊 Summary: ${injector.sentCount} sent, ${injector.failedCount} failed`
  );
  process.exit(0);
});
