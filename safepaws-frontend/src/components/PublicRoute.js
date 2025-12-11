import React from 'react';
import { Navigate } from 'react-router-dom';

/**
 * PublicRoute component that redirects authenticated users away from login/signup pages
 * Prevents logged-in users from accessing login/signup pages
 */
function PublicRoute({ children }) {
  // Check if user has a valid token in localStorage
  const token = localStorage.getItem('access_token');
  
  if (token) {
    // User is already logged in, redirect to home
    return <Navigate to="/" replace />;
  }
  
  // User is not authenticated, show login/signup page
  return children;
}

export default PublicRoute;

