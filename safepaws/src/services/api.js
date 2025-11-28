// API service for backend communication
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Fetch all pins from the backend
 * @returns {Promise<Array>} Array of pin objects
 */
export async function fetchPins() {
  try {
    const response = await fetch(`${API_BASE_URL}/pins/`);
    if (!response.ok) {
      // If it's a 500 error, it's a server/database issue, not a connection issue
      if (response.status === 500) {
        const errorText = await response.text().catch(() => '');
        throw new Error(`SERVER_ERROR: Database connection issue. ${errorText}`);
      }
      throw new Error(`Failed to fetch pins: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching pins:', error);
    // Check if it's a CORS error (which happens when backend returns 500 without CORS headers)
    // or a network error
    if (error instanceof TypeError && (error.message.includes('fetch') || error.message.includes('Failed to fetch') || error.message.includes('NetworkError'))) {
      // Try to check if backend is actually reachable by hitting a simple endpoint
      try {
        const healthCheck = await fetch(`${API_BASE_URL}/`, { method: 'GET' });
        if (healthCheck.ok) {
          // Backend is reachable, so the error is likely a 500 with missing CORS headers
          throw new Error('SERVER_ERROR: Backend database connection issue. Check if MySQL is running and database is set up.');
        }
      } catch (healthError) {
        // Can't reach backend at all
        throw new Error('CONNECTION_ERROR: Backend is not reachable. Make sure it is running on ' + API_BASE_URL);
      }
      // If we get here, backend is reachable but /pins/ failed
      throw new Error('SERVER_ERROR: Backend database connection issue. Check if MySQL is running and database is set up.');
    }
    throw error;
  }
}

/**
 * Create a new pin
 * @param {Object} pinData - Pin data { cat_id, latitude, longitude }
 * @returns {Promise<Object>} Created pin object
 */
export async function createPin(pinData) {
  try {
    const response = await fetch(`${API_BASE_URL}/pins/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pinData),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to create pin: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating pin:', error);
    throw error;
  }
}

/**
 * Delete a pin by ID
 * @param {number} pinId - Pin ID to delete
 * @returns {Promise<void>}
 */
export async function deletePin(pinId) {
  try {
    const response = await fetch(`${API_BASE_URL}/pins/${pinId}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete pin: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error deleting pin:', error);
    throw error;
  }
}

/**
 * Check if the backend is healthy
 * @returns {Promise<boolean>}
 */
export async function checkBackendHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/healthz`);
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
}

/**
 * Register a new user
 * @param {Object} userData - User data { username, password, full_name, email, phone }
 * @returns {Promise<Object>} Registration response
 */
export async function registerUser(userData) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Registration failed: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error registering user:', error);
    throw error;
  }
}

/**
 * Login a user
 * @param {Object} credentials - Login credentials { username, password }
 * @returns {Promise<Object>} Login response with access_token
 */
export async function loginUser(credentials) {
  try {
    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Login failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    // Store token in localStorage for future requests
    if (data.access_token) {
      localStorage.setItem('access_token', data.access_token);
    }
    
    return data;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
}

/**
 * Get user profile
 * @returns {Promise<Object>} User profile data
 */
export async function getUserProfile() {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/users/profile`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch profile: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw error;
  }
}

/**
 * Fetch all adoption listings (includes cat data)
 * @returns {Promise<Array>} Array of adoption listing objects with cat information
 */
export async function fetchAdoptionListings() {
  try {
    const response = await fetch(`${API_BASE_URL}/adoptions/`);
    if (!response.ok) {
      throw new Error(`Failed to fetch adoption listings: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching adoption listings:', error);
    throw error;
  }
}

