import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdoptionProvider } from './contexts/AdoptionContext';
import { MapProvider } from './contexts/MapContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import AdoptionPage from './pages/AdoptionPage';
import MapPage from './pages/MapPage';
import SettingsPage from './pages/SettingsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

function App() {
  return (
    <AdoptionProvider>
      <MapProvider>
        <Router>
          <Routes>
            {/* Public routes without sidebar */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            
            {/* Protected routes with sidebar layout */}
            <Route path="/" element={<Layout><HomePage /></Layout>} />
            <Route path="/adoption" element={<Layout><AdoptionPage /></Layout>} />
            <Route path="/map" element={<Layout><MapPage /></Layout>} />
            <Route path="/settings" element={<Layout><SettingsPage /></Layout>} />
            
            {/* Redirect unknown routes to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </MapProvider>
    </AdoptionProvider>
  );
}

export default App;

