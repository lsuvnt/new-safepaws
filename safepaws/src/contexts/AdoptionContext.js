import React, { createContext, useContext, useState } from 'react';

const AdoptionContext = createContext();

export function AdoptionProvider({ children }) {
  const [selectedListing, setSelectedListing] = useState(null);

  return (
    <AdoptionContext.Provider value={{ selectedListing, setSelectedListing }}>
      {children}
    </AdoptionContext.Provider>
  );
}

export function useAdoption() {
  const context = useContext(AdoptionContext);
  if (!context) {
    throw new Error('useAdoption must be used within an AdoptionProvider');
  }
  return context;
}

