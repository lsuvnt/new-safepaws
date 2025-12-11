import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * ProtectedRoute component that checks if user is authenticated
 * Redirects to login if not authenticated
 */
function ProtectedRoute({ children }) {
  // Check if user has a valid token in localStorage
  const token = localStorage.getItem('access_token');
  
  if (!token) {
    // Redirect to login if no token
    return <Navigate to="/login" replace />;
  }
  
  // User is authenticated, render the protected content
  return children;
}

export default ProtectedRoute;

