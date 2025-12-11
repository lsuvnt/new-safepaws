import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { fetchPins } from '../services/api';
import { useMap } from '../contexts/MapContext';

function MapPage() {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const resizeObserverRef = useRef(null);
  const markersRef = useRef([]);
  const tempMarkerRef = useRef(null);
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;
  const [pins, setPins] = useState([]);
  const [allPins, setAllPins] = useState([]); // Store all pins before filtering
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const { selectedPin, setSelectedPin, refreshTrigger, newCatLocation, setNewCatLocation } = useMap();

  // Filter pins based on search query
  useEffect(() => {
    let filtered = [...allPins];

    // Filter by search query (cat name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(pin => {
        const catName = pin.name ? pin.name.toLowerCase() : '';
        return catName.includes(query);
      });
    }

    setPins(filtered);
  }, [allPins, searchQuery]);

  // Fetch pins from backend
  useEffect(() => {
    const loadPins = async () => {
      try {
        setLoading(true);
        setError(null);
        const pinsData = await fetchPins();
        const pinsArray = pinsData || [];
        setAllPins(pinsArray); // Store all pins
        // Filtering will be handled by the useEffect above
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
        setAllPins([]); // Clear pins on error
        setPins([]);
      } finally {
        setLoading(false);
      }
    };

    loadPins();
    // Refresh pins every 30 seconds
    const interval = setInterval(loadPins, 30000);
    
    return () => clearInterval(interval);
    return () => clearInterval(interval);
  }, [refreshTrigger]); // Also refresh when refreshTrigger changes

  // Sync selectedPin with updated pins data and clear if filtered out
  useEffect(() => {
    if (selectedPin) {
      const updatedPin = pins.find(p => p.location_id === selectedPin.location_id);
      if (updatedPin) {
        setSelectedPin(updatedPin);
      } else if (pins.length > 0) {
        // Pin was filtered out, clear selection
        setSelectedPin(null);
      }
    }
  }, [pins, selectedPin, setSelectedPin]);

  // Initialize map and add markers
  useEffect(() => {
    if (!mapContainerRef.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/streets-v12',
      center: [46.6753, 24.7136], // Center on Riyadh, Saudi Arabia
      zoom: 10,
      doubleClickZoom: false, // Disable double-click zoom
    });
    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');

    // Add double-click handler to create new cat
    let clickTimer = null;
    map.on('click', (e) => {
      // Clear any existing timer
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
      }
      
      // Set a timer to detect double-click
      clickTimer = setTimeout(() => {
        // Single click - do nothing for now
        clickTimer = null;
      }, 300);
    });

    map.on('dblclick', (e) => {
      // Clear single-click timer
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
      }
      
      // Get coordinates from the double-click event
      const { lng, lat } = e.lngLat;
      
      // Set the new cat location to show the form
      setNewCatLocation({
        latitude: lat,
        longitude: lng
      });
      
      // Clear selected pin when starting to add new cat
      setSelectedPin(null);
    });

    if (resizeObserverRef.current) {
      resizeObserverRef.current.disconnect();
    }
    resizeObserverRef.current = new ResizeObserver(() => {
      mapRef.current?.resize();
    });
    resizeObserverRef.current.observe(mapContainerRef.current);

    return () => {
      if (clickTimer) {
        clearTimeout(clickTimer);
      }
      resizeObserverRef.current?.disconnect();
      // Remove all markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      // Remove temporary marker
      if (tempMarkerRef.current) {
        tempMarkerRef.current.remove();
        tempMarkerRef.current = null;
      }
      mapRef.current = null;
      map.remove();
    };
  }, [mapboxToken, setNewCatLocation, setSelectedPin]);

  // Clear selected pin when component unmounts
  useEffect(() => {
    return () => {
      setSelectedPin(null);
    };
  }, [setSelectedPin]);

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
        .addTo(mapRef.current);

      // Add click handler to select the pin
      el.addEventListener('click', () => {
        setSelectedPin(pin);
        // Clear new cat location if one was being added
        if (newCatLocation) {
          setNewCatLocation(null);
        }
      });

      markersRef.current.push(marker);
    });
  }, [pins, newCatLocation, setNewCatLocation, setSelectedPin]);

  // Add/remove temporary white marker when newCatLocation is set
  useEffect(() => {
    if (!mapRef.current) return;

    // Remove existing temporary marker if any
    if (tempMarkerRef.current) {
      tempMarkerRef.current.remove();
      tempMarkerRef.current = null;
    }

    // Add temporary marker if newCatLocation is set
    if (newCatLocation) {
      const el = document.createElement('div');
      el.className = 'temp-cat-marker';
      el.style.width = '20px';
      el.style.height = '20px';
      el.style.borderRadius = '50%';
      el.style.backgroundColor = '#FFFFFF'; // White
      el.style.border = '2px solid #D1D5DB'; // Light gray border for visibility
      el.style.cursor = 'default';
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.3)';
      el.style.opacity = '0.9'; // Slightly transparent to distinguish from real pins

      const tempMarker = new mapboxgl.Marker(el)
        .setLngLat([newCatLocation.longitude, newCatLocation.latitude])
        .addTo(mapRef.current);

      tempMarkerRef.current = tempMarker;
    }

    // Cleanup function
    return () => {
      if (tempMarkerRef.current) {
        tempMarkerRef.current.remove();
        tempMarkerRef.current = null;
      }
    };
  }, [newCatLocation]);

  return (
    <div className="p-8 h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-3xl font-bold">Map View</h1>
        {loading && <span className="text-sm text-gray-500">Loading pins...</span>}
        {error && <span className="text-sm text-red-500">{error}</span>}
        {!loading && !error && pins.length === 0 && allPins.length === 0 && (
          <span className="text-sm text-gray-500">No pins found. Backend is connected.</span>
        )}
        {!loading && !error && pins.length === 0 && allPins.length > 0 && (
          <span className="text-sm text-gray-500">No pins match your search/filter</span>
        )}
        {!loading && !error && pins.length > 0 && (
          <span className="text-sm text-gray-500">{pins.length} pin{pins.length !== 1 ? 's' : ''} on map</span>
        )}
      </div>

      {/* Search Bar */}
      <div className="mb-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by cat name..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#D05A57] focus:border-[#D05A57]"
        />
      </div>

      <div className="mt-3 flex-1">
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

