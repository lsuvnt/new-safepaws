import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AdoptionProvider } from './contexts/AdoptionContext';
import { MapProvider } from './contexts/MapContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import PublicRoute from './components/PublicRoute';
import HomePage from './pages/HomePage';
import AdoptionPage from './pages/AdoptionPage';
import MapPage from './pages/MapPage';
import SettingsPage from './pages/SettingsPage';
import NotificationsPage from './pages/NotificationsPage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

function App() {
  return (
    <AdoptionProvider>
      <MapProvider>
        <Router>
          <Routes>
            {/* Public routes without sidebar - redirect if already logged in */}
            <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/signup" element={<PublicRoute><SignupPage /></PublicRoute>} />
            
            {/* Protected routes with sidebar layout - require authentication */}
            <Route path="/" element={
              <ProtectedRoute>
                <Layout><HomePage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/adoption" element={
              <ProtectedRoute>
                <Layout><AdoptionPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/map" element={
              <ProtectedRoute>
                <Layout><MapPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/notifications" element={
              <ProtectedRoute>
                <Layout><NotificationsPage /></Layout>
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout><SettingsPage /></Layout>
              </ProtectedRoute>
            } />
            
            {/* Redirect unknown routes to home (if authenticated) or login */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </MapProvider>
    </AdoptionProvider>
  );
}

export default App;

