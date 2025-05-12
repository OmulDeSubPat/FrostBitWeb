import React, { useRef, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

const GraphCombined = ({
  temperatureData = [],
  magnetometerData = [],
  gyroscopeData = [],
  accelerometerData = [],
  tempGraphData = [],
  magGraphData = [],
  gyroGraphData = [],
  accelGraphData = [],
  goBack,
  resetGraphData,
}) => {
  const tempChartRef = useRef(null);
  const magChartRef = useRef(null);
  const gyroChartRef = useRef(null);
  const accelChartRef = useRef(null);

  // Update charts when graph data changes
  useEffect(() => {
    if (tempChartRef.current) {
      tempChartRef.current.update();
    }
  }, [tempGraphData]);

  useEffect(() => {
    if (magChartRef.current) {
      magChartRef.current.update();
    }
  }, [magGraphData]);

  useEffect(() => {
    if (gyroChartRef.current) {
      gyroChartRef.current.update();
    }
  }, [gyroGraphData]);

  useEffect(() => {
    if (accelChartRef.current) {
      accelChartRef.current.update();
    }
  }, [accelGraphData]);

  // Define window size and x-axis range for the charts
  const windowSize = 30;

  // Temperature
  const tempLastTime = tempGraphData.length ? tempGraphData[tempGraphData.length - 1].x : 0;
  const tempXMin = tempLastTime > windowSize ? tempLastTime - windowSize : 0;
  const tempXMax = tempLastTime > windowSize ? tempLastTime : windowSize;

  // Magnetometer
  const magLastTime = magGraphData.length ? magGraphData[magGraphData.length - 1].x : 0;
  const magXMin = magLastTime > windowSize ? magLastTime - windowSize : 0;
  const magXMax = magLastTime > windowSize ? magLastTime : windowSize;

  // Gyroscope
  const gyroLastTime = gyroGraphData.length ? gyroGraphData[gyroGraphData.length - 1].x : 0;
  const gyroXMin = gyroLastTime > windowSize ? gyroLastTime - windowSize : 0;
  const gyroXMax = gyroLastTime > windowSize ? gyroLastTime : windowSize;

  // Accelerometer
  const accelLastTime = accelGraphData.length ? accelGraphData[accelGraphData.length - 1].x : 0;
  const accelXMin = accelLastTime > windowSize ? accelLastTime - windowSize : 0;
  const accelXMax = accelLastTime > windowSize ? accelLastTime : windowSize;

  // Temperature chart configuration
  const tempChartData = {
    datasets: [
      {
        label: 'Temperature (°C)',
        data: tempGraphData,
        borderColor: '#2980b9',
        backgroundColor: 'rgba(41, 128, 185, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const tempChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Temperature Over Time' },
    },
    scales: {
      x: {
        type: 'linear',
        title: { display: true, text: 'Time (s)' },
        min: tempXMin,
        max: tempXMax,
      },
      y: {
        title: { display: true, text: 'Temperature (°C)' },
        min: 0,
        max: 50,
      },
    },
    animation: true,
  };

  // Magnetometer chart configuration
  const magChartData = {
    datasets: [
      {
        label: 'Magnetometer (μT)',
        data: magGraphData,
        borderColor: '#8e44ad',
        backgroundColor: 'rgba(142, 68, 173, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const magChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Magnetometer Resultant Over Time' },
    },
    scales: {
      x: {
        type: 'linear',
        title: { display: true, text: 'Time (s)' },
        min: magXMin,
        max: magXMax,
      },
      y: {
        title: { display: true, text: 'Magnetometer (μT)' },
        min: 0,
        max: 300, // Adjusted based on typical magnetometer values (e.g., Earth's field ~25-65 μT, but simulated data is higher)
      },
    },
    animation: true,
  };

  // Gyroscope chart configuration
  const gyroChartData = {
    datasets: [
      {
        label: 'Gyroscope (°/s)',
        data: gyroGraphData,
        borderColor: '#f39c12',
        backgroundColor: 'rgba(243, 156, 18, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const gyroChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Gyroscope Resultant Over Time' },
    },
    scales: {
      x: {
        type: 'linear',
        title: { display: true, text: 'Time (s)' },
        min: gyroXMin,
        max: gyroXMax,
      },
      y: {
        title: { display: true, text: 'Gyroscope (°/s)' },
        min: 0,
        max: 1, // Adjusted based on simulated data (e.g., 0.1 °/s)
      },
    },
    animation: true,
  };

  // Accelerometer chart configuration
  const accelChartData = {
    datasets: [
      {
        label: 'Accelerometer (m/s²)',
        data: accelGraphData,
        borderColor: '#e74c3c',
        backgroundColor: 'rgba(231, 76, 60, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const accelChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Accelerometer Resultant Over Time' },
    },
    scales: {
      x: {
        type: 'linear',
        title: { display: true, text: 'Time (s)' },
        min: accelXMin,
        max: accelXMax,
      },
      y: {
        title: { display: true, text: 'Accelerometer (m/s²)' },
        min: 0,
        max: 25, // Adjusted based on simulated data (e.g., 20.2 m/s²)
      },
    },
    animation: true,
  };

  return (
    <div className="main-container" style={{ minHeight: '100vh' }}>
      <div className="page" style={{ padding: '20px' }}>
        <div className="hero-section" style={{ marginBottom: '20px' }}>
          <h1 className="title">Combined Graphs</h1>
          <p className="description">
            Live BLE Temperature, Magnetometer, Gyroscope, and Accelerometer Data with Simulated Time
          </p>
        </div>
        {/* Temperature Graph Container */}
        <div className="graph-container-temperature" style={{ height: '40vh', marginBottom: '40px', backgroundColor: '#eee', padding: '10px' }}>
          {tempGraphData.length > 0 ? (
            <Line ref={tempChartRef} data={tempChartData} options={tempChartOptions} />
          ) : (
            <p>Waiting for temperature data...</p>
          )}
        </div>
        {/* Magnetometer Graph Container */}
        <div className="graph-container-magnetometer" style={{ height: '40vh', marginBottom: '40px', backgroundColor: '#eee', padding: '10px' }}>
          {magGraphData.length > 0 ? (
            <Line ref={magChartRef} data={magChartData} options={magChartOptions} />
          ) : (
            <p>Waiting for magnetometer data...</p>
          )}
        </div>
        {/* Gyroscope Graph Container */}
        <div className="graph-container-gyroscope" style={{ height: '40vh', marginBottom: '40px', backgroundColor: '#eee', padding: '10px' }}>
          {gyroGraphData.length > 0 ? (
            <Line ref={gyroChartRef} data={gyroChartData} options={gyroChartOptions} />
          ) : (
            <p>Waiting for gyroscope data...</p>
          )}
        </div>
        {/* Accelerometer Graph Container */}
        <div className="graph-container-acceleration" style={{ height: '40vh', backgroundColor: '#eee', padding: '10px' }}>
          {accelGraphData.length > 0 ? (
            <Line ref={accelChartRef} data={accelChartData} options={accelChartOptions} />
          ) : (
            <p>Waiting for accelerometer data...</p>
          )}
        </div>
        <div style={{ marginTop: '20px' }}>
          <button className="swipe-button" onClick={goBack}>
            ← Go Back to Main Page
          </button>
          <button className="swipe-button" onClick={resetGraphData} style={{ marginLeft: '10px' }}>
            Reset Graphs
          </button>
        </div>
      </div>
    </div>
  );
};

export default GraphCombined;