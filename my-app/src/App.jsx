import React, { useState, useEffect, useCallback } from 'react';
import './App.css';
import handLeft from './hand-left.png.jpeg';
import handRight from './hand-right.png.jpeg';
import GraphCombined from './Graph';
import Location from './Location';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Define UUIDs for BLE
const SERVICE_UUID = '19b10000-e8f2-537e-4f6c-d104768a1214';
const DATA_CHAR_UUID = '19b10000-e8f2-537e-4f6c-d104768a1214';

// Helper functions for temperature visualization and frostbite risk
const getHandFilter = (temperature) => {
  if (temperature >= 10) return 'none';
  if (temperature <= -10)
    return 'brightness(1) contrast(1.2) hue-rotate(190deg) saturate(2)';
  const ratio = (10 - temperature) / 20;
  return `brightness(${1 - ratio * 0.3}) contrast(${1 + ratio * 0.2}) hue-rotate(${190 * ratio}deg) saturate(${1 + ratio})`;
};

const getFrostbiteRisk = (temperature) => {
  if (temperature >= 0) return 'Low';
  if (temperature >= -4 && temperature < 0) return 'Medium';
  if (temperature < -4) return 'High';
  return 'Low';
};

// Polynomial prediction function for wrist temperature
const predictTempIncheietura = (tempDegete) => {
  const coefficients = [
    0.00000000e+00, 6.67442699e-01, -1.61778992e-02, 4.62979185e-03,
    -2.11631073e-04, 2.87972154e-06
  ];
  const intercept = 3.870732386468518;
  let result = intercept;
  for (let i = 1; i <= 5; i++) {
    result += coefficients[i] * Math.pow(tempDegete, i);
  }
  return result.toFixed(2);
};

// Calculate resultant of a 3D vector
const calculateResultant = (x, y, z) => {
  return Math.sqrt(x * x + y * y + z * z).toFixed(2);
};

const HikeAlertDashboard = () => {
  const [temperature, setTemperature] = useState('--');
  const [tempIncheietura, setTempIncheietura] = useState('--');
  const [magnetometer, setMagnetometer] = useState({ x: null, y: null, z: null, resultant: null });
  const [gyroscope, setGyroscope] = useState({ x: null, y: null, z: null, resultant: null });
  const [accelerometer, setAccelerometer] = useState({ x: null, y: null, z: null, resultant: null });
  const [gps, setGps] = useState({ lat: null, lng: null, alt: null });
  const [satellites, setSatellites] = useState('--');
  const [temperatureData, setTemperatureData] = useState([]);
  const [magnetometerData, setMagnetometerData] = useState([]);
  const [gyroscopeData, setGyroscopeData] = useState([]);
  const [accelerometerData, setAccelerometerData] = useState([]);
  const [tempGraphData, setTempGraphData] = useState([]);
  const [magGraphData, setMagGraphData] = useState([]);
  const [gyroGraphData, setGyroGraphData] = useState([]);
  const [accelGraphData, setAccelGraphData] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [device, setDevice] = useState(null);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [mode, setMode] = useState('ble');
  const [reader, setReader] = useState(null);
  const [isBluetoothSupported, setIsBluetoothSupported] = useState(false);

  // Memoize disconnectDevice
  const disconnectDevice = useCallback(async () => {
    if (device) {
      console.log(`Disconnecting ${mode} device...`);
      if (mode === 'ble' && device.device) {
        try {
          await device.characteristics.dataChar.stopNotifications();
          device.device.gatt.disconnect();
        } catch (err) {
          console.error('BLE disconnect error:', err);
        }
      } else if (mode === 'serial') {
        if (reader) {
          try {
            await reader.cancel();
            reader.releaseLock();
          } catch (err) {
            console.error('Error canceling reader:', err);
          }
          setReader(null);
        }
        if (device.readable) {
          try {
            await device.close();
          } catch (err) {
            console.error('Error closing port:', err);
          }
        }
      }
      setDevice(null);
      setIsConnected(false);
      setMode('ble');
      setError(null);
    }
  }, [device, mode, reader]);

  // Check Bluetooth support on mount
  useEffect(() => {
    setIsBluetoothSupported(!!navigator.bluetooth);
    if (!navigator.bluetooth) {
      setError(
        'Web Bluetooth is not supported in this browser. Use Chrome, Edge, or Opera on Android or desktop.'
      );
    }
    return () => {
      disconnectDevice();
    };
  }, [disconnectDevice]);

  // Reset data on new connection
  useEffect(() => {
    if (isConnected && !device) {
      console.log('Resetting data on new connection');
      setTemperatureData([]);
      setMagnetometerData([]);
      setGyroscopeData([]);
      setAccelerometerData([]);
      setTempGraphData([]);
      setMagGraphData([]);
      setGyroGraphData([]);
      setAccelGraphData([]);
      setGps({ lat: null, lng: null, alt: null });
      setTemperature('--');
      setTempIncheietura('--');
      setMagnetometer({ x: null, y: null, z: null, resultant: null });
      setGyroscope({ x: null, y: null, z: null, resultant: null });
      setAccelerometer({ x: null, y: null, z: null, resultant: null });
      setSatellites('--');
    }
  }, [isConnected, device]);

  // Update temperature data
  useEffect(() => {
    if (temperature !== '--' && !isNaN(parseFloat(temperature))) {
      const tempValue = parseFloat(temperature);
      setTemperatureData((prevData) => {
        const newData = [
          ...prevData.slice(-50),
          { time: Date.now() / 1000, temp: tempValue },
        ];
        return newData;
      });
      setTempGraphData((prevData) => {
        const newData = [
          ...prevData,
          {
            x: prevData.length > 0 ? prevData[prevData.length - 1].x + 1 : 0,
            y: tempValue,
          },
        ];
        return newData;
      });
      const predicted = predictTempIncheietura(tempValue);
      setTempIncheietura(predicted);
    }
  }, [temperature]);

  // Update magnetometer data
  useEffect(() => {
    if (magnetometer.resultant !== null && !isNaN(parseFloat(magnetometer.resultant))) {
      setMagnetometerData((prevData) => {
        const newData = [
          ...prevData.slice(-50),
          { time: Date.now() / 1000, mag: parseFloat(magnetometer.resultant) },
        ];
        return newData;
      });
      setMagGraphData((prevData) => {
        const newData = [
          ...prevData,
          {
            x: prevData.length > 0 ? prevData[prevData.length - 1].x + 1 : 0,
            y: parseFloat(magnetometer.resultant),
          },
        ];
        return newData;
      });
    }
  }, [magnetometer]);

  // Update gyroscope data
  useEffect(() => {
    if (gyroscope.resultant !== null && !isNaN(parseFloat(gyroscope.resultant))) {
      setGyroscopeData((prevData) => {
        const newData = [
          ...prevData.slice(-50),
          { time: Date.now() / 1000, gyro: parseFloat(gyroscope.resultant) },
        ];
        return newData;
      });
      setGyroGraphData((prevData) => {
        const newData = [
          ...prevData,
          {
            x: prevData.length > 0 ? prevData[prevData.length - 1].x + 1 : 0,
            y: parseFloat(gyroscope.resultant),
          },
        ];
        return newData;
      });
    }
  }, [gyroscope]);

  // Update accelerometer data
  useEffect(() => {
    if (accelerometer.resultant !== null && !isNaN(parseFloat(accelerometer.resultant))) {
      setAccelerometerData((prevData) => {
        const newData = [
          ...prevData.slice(-50),
          { time: Date.now() / 1000, accel: parseFloat(accelerometer.resultant) },
        ];
        return newData;
      });
      setAccelGraphData((prevData) => {
        const newData = [
          ...prevData,
          {
            x: prevData.length > 0 ? prevData[prevData.length - 1].x + 1 : 0,
            y: parseFloat(accelerometer.resultant),
          },
        ];
        return newData;
      });
    }
  }, [accelerometer]);

  // Reset graph data
  const resetGraphData = () => {
    setTempGraphData([]);
    setMagGraphData([]);
    setGyroGraphData([]);
    setAccelGraphData([]);
  };

  // Connect to BLE device
  const connectToBLE = async () => {
    if (!navigator.bluetooth) {
      setError('Web Bluetooth is not supported in this browser. Use Chrome, Edge, or Opera.');
      return;
    }

    try {
      setError(null);
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [SERVICE_UUID] }],
        optionalServices: [SERVICE_UUID],
      });

      const server = await device.gatt.connect();
      const service = await server.getPrimaryService(SERVICE_UUID);
      const dataChar = await service.getCharacteristic(DATA_CHAR_UUID);
      await dataChar.startNotifications();

      dataChar.addEventListener('characteristicvaluechanged', (e) => {
        const value = new TextDecoder('utf-8').decode(e.target.value);
        let decoded;
        try {
          decoded = atob(value);
        } catch (err) {
          console.error('BLE Decode Error:', err);
          return;
        }

        const parts = decoded.split(',');
        if (parts.length < 15) {
          console.error('BLE Insufficient Data Parts:', parts);
          return;
        }

        const [magX, magY, magZ, gyroX, gyroY, gyroZ, accelX, accelY, accelZ, lat, lon, alt, sat, temp, rssi] = parts.map((value, index) =>
          index === 12 ? parseInt(value) : parseFloat(value)
        );

        const magResultant = calculateResultant(magX, magY, magZ);
        const gyroResultant = calculateResultant(gyroX, gyroY, gyroZ);
        const accelResultant = calculateResultant(accelX, accelY, accelZ);

        if (!isNaN(magX) && !isNaN(magY) && !isNaN(magZ)) {
          setMagnetometer({ x: magX, y: magY, z: magZ, resultant: magResultant });
        }
        if (!isNaN(gyroX) && !isNaN(gyroY) && !isNaN(gyroZ)) {
          setGyroscope({ x: gyroX, y: gyroY, z: gyroZ, resultant: gyroResultant });
        }
        if (!isNaN(accelX) && !isNaN(accelY) && !isNaN(accelZ)) {
          setAccelerometer({ x: accelX, y: accelY, z: accelZ, resultant: accelResultant });
        }
        if (!isNaN(lat) && !isNaN(lon) && !isNaN(alt)) {
          setGps({ lat, lng: lon, alt });
        }
        if (!isNaN(sat)) {
          setSatellites(sat);
        }
        if (!isNaN(temp)) {
          setTemperature(temp.toFixed(1));
        }
      });

      setDevice({ device, characteristics: { dataChar } });
      setIsConnected(true);
      setMode('ble');
      device.addEventListener('gattserverdisconnected', onDisconnect);
    } catch (err) {
      setError(`BLE Error: ${err.message}`);
      setIsConnected(false);
    }
  };

  // Connect to Serial port
  const connectToSerial = async () => {
    if (!navigator.serial) {
      setError('Web Serial API not supported in this browser. Use Chrome or Edge.');
      return;
    }

    try {
      setError(null);
      const port = await navigator.serial.requestPort();
      await port.open({ baudRate: 115200 });

      setDevice(port);
      setIsConnected(true);
      setMode('serial');

      if (reader) {
        await reader.cancel();
        reader.releaseLock();
        setReader(null);
      }

      const newReader = port.readable.getReader();
      setReader(newReader);

      let buffer = '';
      const readData = async () => {
        try {
          while (true) {
            const { value, done } = await newReader.read();
            if (done) {
              newReader.releaseLock();
              break;
            }
            const chunk = new TextDecoder('utf-8').decode(value);
            buffer += chunk;

            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const data of lines) {
              const trimmedData = data.trim();
              if (
                trimmedData.includes('ESP-ROM') ||
                trimmedData.includes('Starting') ||
                trimmedData.includes('Sent')
              ) {
                continue;
              }

              const parts = trimmedData.split(',');
              if (parts.length < 15) {
                continue;
              }

              const [magX, magY, magZ, gyroX, gyroY, gyroZ, accelX, accelY, accelZ, lat, lon, alt, sat, temp, rssi] = parts.map((value, index) =>
                index === 12 ? parseInt(value) : parseFloat(value)
              );

              const magResultant = calculateResultant(magX, magY, magZ);
              const gyroResultant = calculateResultant(gyroX, gyroY, gyroZ);
              const accelResultant = calculateResultant(accelX, accelY, accelZ);

              if (!isNaN(magX) && !isNaN(magY) && !isNaN(magZ)) {
                setMagnetometer({ x: magX, y: magY, z: magZ, resultant: magResultant });
              }
              if (!isNaN(gyroX) && !isNaN(gyroY) && !isNaN(gyroZ)) {
                setGyroscope({ x: gyroX, y: gyroY, z: gyroZ, resultant: gyroResultant });
              }
              if (!isNaN(accelX) && !isNaN(accelY) && !isNaN(accelZ)) {
                setAccelerometer({ x: accelX, y: accelY, z: accelZ, resultant: accelResultant });
              }
              if (!isNaN(lat) && !isNaN(lon) && !isNaN(alt)) {
                setGps({ lat, lng: lon, alt });
              }
              if (!isNaN(sat)) {
                setSatellites(sat);
              }
              if (!isNaN(temp)) {
                setTemperature(temp.toFixed(1));
              }
            }
          }
        } catch (err) {
          setError(`Serial read error: ${err.message}`);
          setIsConnected(false);
          if (port.readable) {
            await port.close();
          }
        } finally {
          newReader.releaseLock();
          setReader(null);
        }
      };
      readData();

      port.addEventListener('disconnect', onDisconnect);
    } catch (err) {
      setError(`Serial Error: ${err.message}`);
      setIsConnected(false);
    }
  };

  const onDisconnect = () => {
    setIsConnected(false);
    setTemperature('--');
    setTempIncheietura('--');
    setMagnetometer({ x: null, y: null, z: null, resultant: null });
    setGyroscope({ x: null, y: null, z: null, resultant: null });
    setAccelerometer({ x: null, y: null, z: null, resultant: null });
    setGps({ lat: null, lng: null, alt: null });
    setSatellites('--');
    setDevice(null);
    setReader(null);
  };

  const riskLevel =
    temperature === '--' ? 'Unknown' : getFrostbiteRisk(parseFloat(temperature));
  const riskClass = riskLevel.toLowerCase();

  return (
    <div className="main-container">
      <div className="page">
        <div className="hero-section">
          <h1 className="title">Hike Alert Dashboard</h1>
          <p className="description">
            Stay safe with real-time hiking condition monitoring
          </p>
        </div>
        {error && <div className="error">{error}</div>}

        {!isConnected ? (
          <div>
            <button
              className="connect-button"
              onClick={connectToBLE}
              disabled={!isBluetoothSupported || !window.isSecureContext}
              title={
                !isBluetoothSupported
                  ? 'BLE not supported. Use Chrome, Edge, or Opera.'
                  : !window.isSecureContext
                  ? 'BLE requires HTTPS'
                  : 'Connect via BLE'
              }
            >
              Connect BLE
            </button>
            <button
              className="connect-button"
              onClick={connectToSerial}
              title="Connect via Serial"
            >
              Connect Serial
            </button>
          </div>
        ) : (
          <button
            className="disconnect-button"
            onClick={disconnectDevice}
            title={`Disconnect ${mode === 'ble' ? 'BLE' : 'Serial'}`}
          >
            Disconnect {mode === 'ble' ? 'BLE' : 'Serial'}
          </button>
        )}

        {isConnected && currentPage === 'dashboard' && (
          <>
            <div className="frostbite-container">
              <p className="frostbite-text">Frostbite Risk</p>
              <p className={`frostbite-value risk-${riskClass}`}>
                <i
                  className={`fas fa-${
                    riskLevel === 'Low'
                      ? 'check-circle'
                      : riskLevel === 'Medium'
                      ? 'exclamation-circle'
                      : 'exclamation-triangle'
                  }`}
                ></i>{' '}
                {riskLevel}
              </p>
            </div>
            <div className="arms-container">
              <div className="arm-section">
                <img
                  src={handLeft}
                  className="hand-image"
                  style={{ filter: getHandFilter(parseFloat(temperature) || 0) }}
                  alt="Left Hand"
                />
                <p className="temp-label">Left Hand (Predicted)</p>
                <p className="temp-value">
                  {temperature === '--' ? 'N/A' : `${temperature}°C`}
                </p>
                <p className="temp-label">Left Wrist</p>
                <p className="temp-value">
                  {tempIncheietura === '--' ? 'N/A' : `${tempIncheietura}°C`}
                </p>
              </div>
              <div className="arm-section">
                <img
                  src={handRight}
                  className="hand-image"
                  style={{ filter: getHandFilter(parseFloat(temperature) || 0) }}
                  alt="Right Hand"
                />
                <p className="temp-label">Right Hand (Predicted)</p>
                <p className="temp-value">
                  {temperature === '--' ? 'N/A' : `${temperature}°C`}
                </p>
                <p className="temp-label">Right Wrist</p>
                <p className="temp-value">
                  {tempIncheietura === '--' ? 'N/A' : `${tempIncheietura}°C`}
                </p>
              </div>
            </div>
            <div className="info-container">
              <p className="info-item">
                <i className="fas fa-thermometer-half"></i>{' '}
                <strong>Finger Temperature:</strong>{' '}
                {temperature === '--' ? 'N/A' : `${temperature}°C`}
              </p>
              <p className="info-item">
                <i className="fas fa-thermometer-half"></i>{' '}
                <strong>Wrist Temperature:</strong>{' '}
                {tempIncheietura === '--' ? 'N/A' : `${tempIncheietura}°C`}
              </p>
              <p className="info-item">
                <i className="fas fa-magnet"></i>{' '}
                <strong>Magnetometer (μT):</strong>{' '}
                {magnetometer.resultant !== null
                  ? `${magnetometer.resultant} (X: ${magnetometer.x}, Y: ${magnetometer.y}, Z: ${magnetometer.z})`
                  : 'N/A'}
              </p>
              <p className="info-item">
                <i className="fas fa-sync-alt"></i>{' '}
                <strong>Gyroscope (°/s):</strong>{' '}
                {gyroscope.resultant !== null
                  ? `${gyroscope.resultant} (X: ${gyroscope.x}, Y: ${gyroscope.y}, Z: ${gyroscope.z})`
                  : 'N/A'}
              </p>
              <p className="info-item">
                <i className="fas fa-tachometer-alt"></i>{' '}
                <strong>Accelerometer (m/s²):</strong>{' '}
                {accelerometer.resultant !== null
                  ? `${accelerometer.resultant} (X: ${accelerometer.x}, Y: ${accelerometer.y}, Z: ${accelerometer.z})`
                  : 'N/A'}
              </p>
              <p className="info-item">
                <i className="fas fa-map-marker-alt"></i>{' '}
                <strong>GPS:</strong>{' '}
                {gps.lat !== null && gps.lng !== null && gps.alt !== null
                  ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}, ${gps.alt.toFixed(1)} m`
                  : 'N/A'}
              </p>
              <p className="info-item">
                <i className="fas fa-satellite"></i>{' '}
                <strong>Satellites:</strong>{' '}
                {satellites === '--' ? 'N/A' : satellites}
              </p>
            </div>
            <button
              className="swipe-button"
              onClick={() => setCurrentPage('graph')}
            >
              View Graphs →
            </button>
            <button
              className="swipe-button"
              onClick={() => setCurrentPage('location')}
            >
              View Location →
            </button>
          </>
        )}

        {isConnected && currentPage === 'graph' && (
          <GraphCombined
            temperatureData={temperatureData}
            magnetometerData={magnetometerData}
            gyroscopeData={gyroscopeData}
            accelerometerData={accelerometerData}
            tempGraphData={tempGraphData}
            magGraphData={magGraphData}
            gyroGraphData={gyroGraphData}
            accelGraphData={accelGraphData}
            goBack={() => setCurrentPage('dashboard')}
            resetGraphData={resetGraphData}
          />
        )}
        {isConnected && currentPage === 'location' && (
          <Location
            coordinates={gps}
            goBack={() => setCurrentPage('dashboard')}
          />
        )}
      </div>
    </div>
  );
};

export default HikeAlertDashboard;