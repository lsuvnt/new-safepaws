import React, { createContext, useContext, useState } from 'react';

const MapContext = createContext();

export function MapProvider({ children }) {
  const [selectedPin, setSelectedPin] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [newCatLocation, setNewCatLocation] = useState(null); // { latitude, longitude }

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <MapContext.Provider value={{ 
      selectedPin, 
      setSelectedPin, 
      refreshTrigger, 
      triggerRefresh,
      newCatLocation,
      setNewCatLocation
    }}>
      {children}
    </MapContext.Provider>
  );
}

export function useMap() {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMap must be used within a MapProvider');
  }
  return context;
}

