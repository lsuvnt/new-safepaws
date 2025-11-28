import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { fetchPins } from '../services/api';

function MapPage() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const markersRef = useRef([]);
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch pins from backend
  useEffect(() => {
    const loadPins = async () => {
      try {
        setLoading(true);
        setError(null);
        const pinsData = await fetchPins();
        setPins(pinsData || []); // Ensure it's always an array
      } catch (err) {
        console.error('Failed to load pins:', err);
        // Show more specific error message
        if (err.message.includes('CONNECTION_ERROR')) {
          setError('Backend connection failed. Make sure the backend is running on http://localhost:8000');
        } else if (err.message.includes('SERVER_ERROR')) {
          setError('Backend database error. Check if MySQL is running and database is set up correctly.');
        } else {
          setError(`Failed to load pins: ${err.message}`);
        }
        setPins([]); // Clear pins on error
      } finally {
        setLoading(false);
      }
    };

    loadPins();
    // Refresh pins every 30 seconds
    const interval = setInterval(loadPins, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initialize map and add markers
  useEffect(() => {
    if (!mapContainerRef.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [46.6753, 24.7136], // Center on Riyadh, Saudi Arabia
      zoom: 10,
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }
    resizeObserverRef.current = new ResizeObserver(() => {
      mapRef.current?.resize();
    });
    resizeObserverRef.current.observe(mapContainerRef.current);

    return () => {
      resizeObserverRef.current?.disconnect();
      // Remove all markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      mapRef.current = null;
      map.remove();
    };
  }, [mapboxToken]);

  // Update markers when pins change
  useEffect(() => {
    if (!mapRef.current || !pins.length) return;

    // Remove existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Helper function to get color based on condition
    const getColorForCondition = (condition) => {
      if (!condition) return '#9CA3AF'; // grey default
      
      const conditionUpper = condition.toUpperCase();
      switch (conditionUpper) {
        case 'NORMAL':
          return '#10B981'; // green
        case 'URGENT':
          return '#EF4444'; // red
        case 'AT_VET':
        case 'AT VET':
          return '#3B82F6'; // blue
        case 'ADOPTED':
        case 'PASSED':
          return '#9CA3AF'; // grey
        default:
          return '#9CA3AF'; // grey default
      }
    };

    // Add new markers for each pin
    pins.forEach(pin => {
      const el = document.createElement('div');
      el.className = 'cat-marker';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = getColorForCondition(pin.condition);
      el.style.border = '2px solid white';
      el.style.cursor = 'pointer';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';

      const marker = new mapboxgl.Marker(el)
        .setLngLat([pin.longitude, pin.latitude])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div style="padding: 8px;">
                <strong>Cat ID:</strong> ${pin.cat_id}<br/>
                <strong>Location ID:</strong> ${pin.location_id}<br/>
                ${pin.condition ? `<strong>Condition:</strong> ${pin.condition}<br/>` : ''}
                ${pin.created_at ? `<small>Added: ${new Date(pin.created_at).toLocaleString()}</small>` : ''}
              </div>
            `)
        )
        .addTo(mapRef.current);

      markersRef.current.push(marker);
    });
  }, [pins]);

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Map View</h1>
        {loading && <span className="text-sm text-gray-500">Loading pins...</span>}
        {error && <span className="text-sm text-red-500">{error}</span>}
        {!loading && !error && pins.length === 0 && (
          <span className="text-sm text-gray-500">No pins found. Backend is connected.</span>
        )}
        {!loading && !error && pins.length > 0 && (
          <span className="text-sm text-gray-500">{pins.length} pin{pins.length !== 1 ? 's' : ''} on map</span>
        )}
      </div>

      <div className="mt-6 flex-1">
        <div className="bg-white rounded-lg shadow-md p-4 h-full flex">
          {mapboxToken ? (
            <div
              ref={mapContainerRef}
              className="w-full h-full rounded-md overflow-hidden"
            />
          ) : (
            <p className="text-gray-500 m-auto text-center">
              Mapbox token missing. Please add VITE_MAPBOX_TOKEN to your .env file.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default MapPage;

