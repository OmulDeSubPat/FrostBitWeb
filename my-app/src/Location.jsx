import React, { useState, useEffect } from 'react';
import './Location.css';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet marker icon issue in React
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

// Component to update map view and marker position
const MapUpdater = ({ coordinates }) => {
  const map = useMap();

  // Update map center and marker position when coordinates change
  useEffect(() => {
    if (coordinates.lat !== null && coordinates.lng !== null && !isNaN(coordinates.lat) && !isNaN(coordinates.lng)) {
      map.setView([coordinates.lat, coordinates.lng], 15);
    }
  }, [coordinates, map]);

  return coordinates.lat !== null && coordinates.lng !== null && !isNaN(coordinates.lat) && !isNaN(coordinates.lng) ? (
    <Marker position={[coordinates.lat, coordinates.lng]}>
      <Popup>
        Your Location<br />
        Altitude: {coordinates.alt !== null && !isNaN(coordinates.alt) ? `${coordinates.alt.toFixed(1)} m` : 'N/A'}
      </Popup>
    </Marker>
  ) : null;
};

const Location = ({ coordinates = { lat: null, lng: null, alt: null }, goBack }) => {
  // State to hold the current coordinates from BLE or Serial
  const [currentCoordinates, setCurrentCoordinates] = useState({
    lat: null,
    lng: null,
    alt: null,
  });

  // Update coordinates when new BLE or Serial data is received
  useEffect(() => {
    if (
      coordinates &&
      coordinates.lat !== null &&
      coordinates.lng !== null &&
      !isNaN(coordinates.lat) &&
      !isNaN(coordinates.lng)
    ) {
      setCurrentCoordinates({
        lat: coordinates.lat,
        lng: coordinates.lng,
        alt: coordinates.alt !== null && !isNaN(coordinates.alt) ? coordinates.alt : null,
      });
    } else {
      setCurrentCoordinates({ lat: null, lng: null, alt: null });
      console.log('Invalid coordinates received:', coordinates);
    }
  }, [coordinates]);

  // Check if we have valid coordinates
  const hasValidCoordinates =
    currentCoordinates.lat !== null &&
    currentCoordinates.lng !== null &&
    !isNaN(currentCoordinates.lat) &&
    !isNaN(currentCoordinates.lng);

  return (
    <div className="main-container">
      <div className="page">
        <button onClick={goBack} className="swipe-button">
          Go Back to Dashboard
        </button>
        <div className="map-section">
          {hasValidCoordinates ? (
            <>
              <div className="map-container">
                <MapContainer
                  center={[currentCoordinates.lat, currentCoordinates.lng]}
                  zoom={15}
                  style={{ width: '100%', height: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  <MapUpdater coordinates={currentCoordinates} />
                </MapContainer>
              </div>
              <p>
                <strong>GPS:</strong>{' '}
                {currentCoordinates.lat.toFixed(4)}, {currentCoordinates.lng.toFixed(4)},{' '}
                {currentCoordinates.alt !== null && !isNaN(currentCoordinates.alt)
                  ? `${currentCoordinates.alt.toFixed(1)} m`
                  : 'N/A'}
              </p>
            </>
          ) : (
            <p>Waiting for valid GPS data (BLE or Serial)...</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Location;