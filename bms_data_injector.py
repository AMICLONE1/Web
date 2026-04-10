#!/usr/bin/env python3
"""
BMS Data Injector - Generates and sends fake Battery Management System data
to the backend server at continuous intervals.
"""

import requests
import json
import random
import time
from datetime import datetime
from typing import Dict, List, Any

class BMSDataInjector:
    def __init__(self, server_url: str = "http://localhost:5000", interval: int = 2):
        """
        Initialize the BMS Data Injector
        
        Args:
            server_url: Base URL of the BMS server (default: http://localhost:5000)
            interval: Interval in seconds between data injections (default: 2)
        """
        self.server_url = server_url
        self.interval = interval
        self.endpoint = f"{server_url}/api/bms-data"
        self.temps_history: List[Dict[str, Any]] = []
        self.cycle_count = 0
        
        # State tracking for realistic variation
        self.current_soc = 93  # Keep at 93% constant
        self.current_temp = 25.0  # Start at 25°C
        self.base_cell_voltage = 3.25  # Base voltage per cell
        self.soh = 98  # State of Health (degrades very slowly)
        self.is_charging = False
        
    def generate_cell_voltages(self, num_cells: int = 8, soc: int = 93) -> List[float]:
        """Generate realistic cell voltages (nearly constant at 93% SOC)
        Voltages correlate with SOC"""
        # Map SOC to voltage range (3.0V @ 0%, 3.25V @ 50%, 3.5V @ 100%)
        # At 93% SOC = ~3.465V per cell
        base_voltage = 3.0 + (soc / 100.0) * 0.5
        
        # Very small variation between cells at idle (±0.01V)
        voltages = [
            round(base_voltage + random.uniform(-0.01, 0.01), 2)
            for _ in range(num_cells)
        ]
        return voltages
    
    def generate_temperature(self, ambient_temp: float, current: float) -> float:
        """Generate realistic battery temperature with minimal change
        At idle (zero current), temperature is stable"""
        # Very small change when idle (±0.1°C per cycle)
        ambient_effect = random.uniform(-0.1, 0.1)
        new_temp = self.current_temp + ambient_effect
        
        # Keep within reasonable bounds (20-30°C at idle)
        new_temp = max(20.0, min(30.0, new_temp))
        self.current_temp = new_temp
        return round(new_temp, 1)
    
    def generate_soc(self) -> int:
        """Generate State of Charge - kept constant at 93%"""
        # Keep SOC constant at 93% (minimal variation ±1%)
        variation = random.uniform(-0.5, 0.5)
        self.current_soc = 93 + variation
        # Clamp between 92-94%
        self.current_soc = max(92.0, min(94.0, self.current_soc))
        return round(self.current_soc)
    
    def generate_soh(self) -> int:
        """Generate State of Health (changes very slowly over time)
        Degrades by ~0.1% per 100 cycles"""
        # Degrade very slowly
        self.soh = max(80, self.soh - (0.0001 * random.random()))
        return round(self.soh)
    
    def generate_pack_voltage(self, soc: int) -> float:
        """Generate pack voltage correlated with SOC (8S battery)
        At 93% SOC, voltage is ~28.7V"""
        # Map SOC to voltage (realistic Li-ion discharge curve)
        base_voltage = 24.0 + (soc / 100.0) * 5.4
        
        # Very small ripple at idle (±0.1V)
        ripple = random.uniform(-0.05, 0.05)
        voltage = base_voltage + ripple
        
        return round(voltage, 1)
    
    def generate_current(self, force_mode: str = None) -> float:
        """Generate charging/discharging current - kept at ~0A (idle)"""
        # Keep current at idle (zero, with minimal ripple)
        current = random.uniform(-0.3, 0.3)
        return round(current, 1)
    
    def generate_power(self, voltage: float, current: float) -> float:
        """Generate power (kW) based on voltage and current"""
        return round((voltage * abs(current)) / 1000, 2)
    
    def generate_status_flags(self, voltage: float, current: float, temp: float) -> Dict[str, bool]:
        """Generate status flags - all safe, no faults in stable idle state"""
        return {
            "Overvoltage": False,  # 29.0V is safe (< 29.2V limit)
            "Overcurrent": False,  # 0A is safe (well below 48A limit)
            "Overtemp": False,     # 24.6-25.0°C is safe (< 45°C limit)
            "ShortCircuit": False  # No short circuit
        }
    
    def generate_bms_data(self) -> Dict[str, Any]:
        """Generate complete BMS payload with realistic correlations"""
        
        # Generate current readings with correlations
        soc = self.generate_soc()
        soh = self.generate_soh()
        pack_voltage = self.generate_pack_voltage(soc)
        current = self.generate_current()
        temp = self.generate_temperature(ambient_temp=25.0, current=current)
        power = self.generate_power(pack_voltage, current)
        
        # Update cycle count occasionally (once every ~500 cycles = ~1000 seconds)
        if random.random() < 0.001:
            self.cycle_count += 1
        
        # Add to temperature history with correlation
        self.temps_history.append({
            "time": len(self.temps_history),
            "value": temp
        })
        
        # Keep only last 90 temperature readings
        if len(self.temps_history) > 90:
            self.temps_history.pop(0)
        
        # Determine charge/discharge status
        if current > 2:
            status = "Charging"
        elif current < -2:
            status = "Discharging"
        else:
            status = "Idle"
        
        # Generate 7 temperature sensor readings
        temp_sensors = []
        for i in range(7):
            # Small variation per sensor (±0.2°C from base temp)
            sensor_temp = temp + random.uniform(-0.2, 0.2)
            temp_sensors.append({
                "time": i,
                "value": round(sensor_temp, 1)
            })
        
        payload = {
            "timestamp": datetime.now().isoformat(),
            "dashboard": {
                "SOC": soc,
                "SOH": soh,
                "PackVoltage": f"{pack_voltage}V {status}",
                "CurrentAmps": f"{current}A",
                "Power": f"{power} kW",
                "Cycles": self.cycle_count
            },
            "systemStatus": self.generate_status_flags(pack_voltage, current, temp),
            "cellVoltages": self.generate_cell_voltages(8, soc),
            "temperatures": temp_sensors  # 7 temperature sensors
        }
        
        return payload
    
    def send_data(self, payload: Dict[str, Any]) -> bool:
        """
        Send BMS data to the server
        
        Args:
            payload: BMS data payload
            
        Returns:
            True if successful, False otherwise
        """
        try:
            response = requests.post(
                self.endpoint,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=5
            )
            
            if response.status_code == 200:
                return True
            else:
                print(f"❌ Error: Server returned {response.status_code}")
                return False
                
        except requests.exceptions.ConnectionError:
            print(f"❌ Connection error: Cannot reach {self.server_url}")
            return False
        except requests.exceptions.Timeout:
            print(f"❌ Timeout: Server not responding")
            return False
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            return False
    
    def run(self):
        """Start continuous data injection"""
        print(f"🚀 BMS Data Injector Started")
        print(f"📍 Server: {self.server_url}")
        print(f"⏱️  Interval: {self.interval} seconds")
        print(f"💡 Sending fake BMS data... (Press Ctrl+C to stop)\n")
        
        sent_count = 0
        failed_count = 0
        
        try:
            while True:
                # Generate and send data
                payload = self.generate_bms_data()
                
                if self.send_data(payload):
                    sent_count += 1
                    soc = payload["dashboard"]["SOC"]
                    soh = payload["dashboard"]["SOH"]
                    voltage = payload["dashboard"]["PackVoltage"]
                    current = payload["dashboard"]["CurrentAmps"]
                    temp = payload["temperatures"][-1]["value"] if payload["temperatures"] else "N/A"
                    
                    print(f"✅ #{sent_count} Sent | SOC: {soc}% | SOH: {soh}% | V: {voltage} | I: {current} | T: {temp}°C")
                else:
                    failed_count += 1
                
                # Wait before sending next batch
                time.sleep(self.interval)
                
        except KeyboardInterrupt:
            print(f"\n\n⏹️  Injector stopped by user")
            print(f"📊 Summary: {sent_count} sent, {failed_count} failed")


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Inject fake BMS data into the server for testing"
    )
    parser.add_argument(
        "--server",
        default="http://localhost:5000",
        help="Server URL (default: http://localhost:5000)"
    )
    parser.add_argument(
        "--interval",
        type=int,
        default=2,
        help="Data injection interval in seconds (default: 2)"
    )
    
    args = parser.parse_args()
    
    injector = BMSDataInjector(
        server_url=args.server,
        interval=args.interval
    )
    
    injector.run()


if __name__ == "__main__":
    main()
