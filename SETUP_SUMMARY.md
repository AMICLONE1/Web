# BMS Application - Running with Fake Data Injection

## ✅ Status: All Services Running

### 1. **Node.js Server** 
- **Status**: ✅ Running
- **Port**: 5000
- **URL**: http://localhost:5000
- **Endpoints**:
  - `GET /api/current-data` - Get latest BMS data
  - `POST /api/bms-data` - Receive BMS data
  - `ws://localhost:5000` - WebSocket connection

### 2. **React Client**
- **Status**: ✅ Running
- **Port**: 3001 (fallback from 3000, which is already in use)
- **URL**: http://localhost:3001
- **Features**: Dashboard, Cell Grid, Temperature Grid, Time Series Charts

### 3. **Python Data Injector**
- **Status**: ✅ Running
- **Script**: `bms_data_injector.py`
- **Interval**: 2 seconds between data injections
- **Sample Data Being Generated**:
  - State of Charge (SOC): 20-100%
  - State of Health (SOH): 90-100%
  - Pack Voltage: 24-28.5V (8S battery simulation)
  - Current: -50 to +50A (Charging/Discharging)
  - Temperature: 20-45°C
  - Cell Voltages: 3.0-3.5V per cell
  - System Status Flags: Overvoltage, Overcurrent, Overtemp, ShortCircuit

## 📊 How It Works

1. **Data Generation**: Python script generates realistic BMS data every 2 seconds
2. **HTTP POST**: Data is sent to server via `/api/bms-data` endpoint
3. **Broadcasting**: Server broadcasts updates to connected browsers via WebSocket
4. **Real-time Display**: React client displays updated values in real-time

## 🚀 Running the Application

The application is already running! No additional commands needed.

To see the BMS Dashboard:
- Open browser and navigate to: **http://localhost:3001**
- Watch the real-time data updates from the Python injector

## 🎮 Control the Data Injector

To modify the injection interval or server URL, you can edit `bms_data_injector.py` or use command-line arguments:

```bash
python bms_data_injector.py --server http://localhost:5000 --interval 2
```

### Options:
- `--server`: Server URL (default: http://localhost:5000)
- `--interval`: Data injection interval in seconds (default: 2)

## 📁 Project Structure

```
CAPSTONE/Web/
├── server/           # Node.js BMS server
│   ├── server.js
│   └── package.json
├── client/           # React BMS dashboard
│   ├── src/
│   │   ├── App.js
│   │   ├── components/
│   │   └── index.js
│   └── package.json
└── bms_data_injector.py  # Python fake data generator
```

## 🛠️ Technologies Used

- **Backend**: Node.js + Express + WebSocket
- **Frontend**: React + Firebase
- **Data Injection**: Python 3 + Requests
- **Communication**: HTTP POST + WebSocket

## 📝 Notes

- The Python injector generates random but realistic BMS parameters
- Temperature history is maintained for trend visualization
- Cycle count increments randomly to simulate battery aging
- All data includes timestamps for proper time-series visualization

---

**Setup completed on**: April 10, 2026
**All systems operational and ready for testing!** 🎉
