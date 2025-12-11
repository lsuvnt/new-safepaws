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
 * Update user profile
 * @param {Object} profileData - Profile data to update { full_name?, email?, phone?, password? }
 * @returns {Promise<Object>} Updated user profile data
 */
export async function updateUserProfile(profileData) {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/users/profile/update`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to update profile: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating user profile:', error);
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

/**
 * Create an adoption listing
 * @param {Object} listingData - Adoption listing data { cat_id, vaccinated, sterilized, notes }
 * @returns {Promise<Object>} Created adoption listing object
 */
export async function createAdoptionListing(listingData) {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/adoptions/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(listingData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to create adoption listing: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating adoption listing:', error);
    throw error;
  }
}

/**
 * Fetch activity logs for a cat (public endpoint for map pins)
 * @param {number} catId - Cat ID
 * @returns {Promise<Array>} Array of activity log objects
 */
export async function fetchCatActivityLogs(catId) {
  try {
    const response = await fetch(`${API_BASE_URL}/activity/cat/${catId}/public`);
    if (!response.ok) {
      throw new Error(`Failed to fetch activity logs: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching activity logs:', error);
    throw error;
  }
}

/**
 * Create an activity log entry
 * @param {Object} activityData - Activity data { cat_id, activity_description }
 * @returns {Promise<Object>} Created activity log object
 */
export async function createActivityLog(activityData) {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/activity/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(activityData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to create activity log: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating activity log:', error);
    throw error;
  }
}

/**
 * Update pin condition flag
 * @param {number} locationId - Location ID
 * @param {Object} conditionData - Condition data { condition, description }
 * @returns {Promise<Object>} Updated pin object
 */
export async function updatePinCondition(locationId, conditionData) {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/pins/${locationId}/condition`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(conditionData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to update condition: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating pin condition:', error);
    throw error;
  }
}

/**
 * Create a new cat
 * @param {Object} catData - Cat data { name, gender, age, notes, image_url }
 * @returns {Promise<Object>} Created cat object
 */
export async function createCat(catData) {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/cats/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(catData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to create cat: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating cat:', error);
    throw error;
  }
}

/**
 * Update a cat
 * @param {number} catId - Cat ID
 * @param {Object} catData - Cat data to update { name, gender, age, notes, image_url }
 * @returns {Promise<Object>} Updated cat object
 */
export async function updateCat(catId, catData) {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/cat/${catId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(catData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to update cat: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating cat:', error);
    throw error;
  }
}

/**
 * Update an adoption listing
 * @param {number} listingId - Listing ID
 * @param {Object} listingData - Adoption listing data to update { vaccinated, sterilized, notes, is_active }
 * @returns {Promise<Object>} Updated adoption listing object
 */
export async function updateAdoptionListing(listingId, listingData) {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/adoptions/${listingId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(listingData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to update adoption listing: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error updating adoption listing:', error);
    throw error;
  }
}

/**
 * Create a cat and pin together (cat with location)
 * @param {Object} data - { cat: { name, gender, age, notes, image_url }, location: { latitude, longitude }, condition }
 * @returns {Promise<Object>} Created pin with cat data
 */
export async function createCatWithPin(data) {
  try {
    // First create the cat
    const cat = await createCat(data.cat);
    
    // Then create the pin with the cat_id
    const pinData = {
      cat_id: cat.cat_id,
      latitude: data.location.latitude,
      longitude: data.location.longitude,
    };
    
    const pin = await createPin(pinData);
    
    // If condition is provided, update it (default is UNKNOWN, so update if user selected something else)
    if (data.condition) {
      try {
        await updatePinCondition(pin.location_id, {
          condition: data.condition,
          description: data.conditionDescription || null,
        });
        // Refetch pin to get updated condition
        const pins = await fetchPins();
        return pins.find(p => p.location_id === pin.location_id);
      } catch (conditionError) {
        console.error('Error setting initial condition:', conditionError);
        // Continue anyway, the pin was created successfully
      }
    }
    
    // Refetch to get full pin with cat data
    const pins = await fetchPins();
    return pins.find(p => p.location_id === pin.location_id) || pin;
  } catch (error) {
    console.error('Error creating cat with pin:', error);
    throw error;
  }
}

/**
 * Create an adoption request
 * @param {Object} requestData - Adoption request data
 * @returns {Promise<Object>} Created adoption request object
 */
export async function createAdoptionRequest(requestData) {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/adoption-requests/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to create adoption request: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error creating adoption request:', error);
    throw error;
  }
}

/**
 * Get a specific adoption request by ID
 * @param {number} requestId - Request ID
 * @returns {Promise<Object>} Adoption request object
 */
export async function getAdoptionRequest(requestId) {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/adoption-requests/${requestId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch adoption request: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching adoption request:', error);
    throw error;
  }
}

/**
 * Get incoming adoption requests (for the receiver) - only pending
 * @returns {Promise<Array>} Array of adoption request objects
 */
export async function getIncomingAdoptionRequests() {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/adoption-requests/incoming`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch incoming requests: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching incoming requests:', error);
    throw error;
  }
}

/**
 * Get all incoming adoption requests (including accepted/rejected)
 * @returns {Promise<Array>} Array of adoption request objects
 */
export async function getAllIncomingAdoptionRequests() {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/adoption-requests/incoming/all`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch all incoming requests: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching all incoming requests:', error);
    throw error;
  }
}

/**
 * Get sent adoption requests (requests made by current user)
 * @returns {Promise<Array>} Array of adoption request objects
 */
export async function getSentAdoptionRequests() {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/adoption-requests/sent`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch sent requests: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching sent requests:', error);
    throw error;
  }
}

/**
 * Accept or reject an adoption request
 * @param {number} requestId - Request ID
 * @param {string} action - 'Accepted' or 'Rejected'
 * @returns {Promise<Object>} Response object
 */
export async function handleAdoptionRequest(requestId, action) {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/adoption-requests/action?request_id=${requestId}&action=${action}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to handle adoption request: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error handling adoption request:', error);
    throw error;
  }
}

/**
 * Fetch all accepted outgoing adoption requests with receiver contact information
 * @returns {Promise<Array>} Array of accepted requests with contact info
 */
export async function getAcceptedOutgoingRequests() {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/adoption-requests/sent/accepted`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch accepted requests: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching accepted outgoing requests:', error);
    throw error;
  }
}

/**
 * Fetch all notifications for the current user
 * @returns {Promise<Array>} Array of notification objects
 */
export async function fetchNotifications() {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/notifications/`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to fetch notifications: ${response.statusText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
}

/**
 * Get unread notification count
 * @returns {Promise<number>} Number of unread notifications
 */
export async function getUnreadNotificationCount() {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      return 0;
    }

    const response = await fetch(`${API_BASE_URL}/notifications/unread-count`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      return 0;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}

/**
 * Mark a notification as read
 * @param {number} notificationId - Notification ID
 * @returns {Promise<void>}
 */
export async function markNotificationAsRead(notificationId) {
  try {
    const token = localStorage.getItem('access_token');
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await fetch(`${API_BASE_URL}/notifications/${notificationId}/read`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Failed to mark notification as read: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
}

