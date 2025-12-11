import React, { useState, useEffect } from 'react';
import { fetchNotifications, markNotificationAsRead, getUnreadNotificationCount, getAllIncomingAdoptionRequests, fetchAdoptionListings, getAcceptedOutgoingRequests } from '../services/api';
import { useAdoption } from '../contexts/AdoptionContext';
import { useLocation } from 'react-router-dom';

function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hideRead, setHideRead] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { reviewRequestId, setReviewRequestId } = useAdoption();
  const location = useLocation();
  
  // Adoption requests state
  const [adoptionRequests, setAdoptionRequests] = useState([]);
  const [listings, setListings] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
  const [requestFilter, setRequestFilter] = useState('All'); // All, Pending, Accepted, Rejected
  
  // Accepted outgoing requests with contact info
  const [acceptedRequests, setAcceptedRequests] = useState([]);
  const [loadingAccepted, setLoadingAccepted] = useState(true);

  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
    loadAdoptionRequests();
    loadAcceptedRequests();
  }, []);
  
  // Refresh notifications periodically without showing loading state
  useEffect(() => {
    const interval = setInterval(() => {
      if (location.pathname === '/notifications') {
        // Refresh without showing loading state to prevent flicker
        loadNotifications(false).catch(error => {
          console.error('Error refreshing notifications:', error);
        });
        loadUnreadCount().catch(error => {
          console.error('Error refreshing unread count:', error);
        });
        loadAdoptionRequests(false).catch(error => {
          console.error('Error refreshing adoption requests:', error);
        });
        loadAcceptedRequests(false).catch(error => {
          console.error('Error refreshing accepted requests:', error);
        });
      }
    }, 10000); // Refresh every 10 seconds
    
    return () => clearInterval(interval);
  }, [location.pathname]);
  
  // Refresh when reviewRequestId changes (after reviewing a request)
  useEffect(() => {
    if (!reviewRequestId) {
      loadNotifications();
      loadUnreadCount();
      loadAdoptionRequests();
      loadAcceptedRequests();
    }
  }, [reviewRequestId]);

  const loadNotifications = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const loadUnreadCount = async () => {
    const count = await getUnreadNotificationCount();
    setUnreadCount(count);
  };

  const loadAdoptionRequests = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoadingRequests(true);
      }
      const [requests, listingsData] = await Promise.all([
        getAllIncomingAdoptionRequests(),
        fetchAdoptionListings()
      ]);
      setAdoptionRequests(requests);
      setListings(listingsData);
    } catch (error) {
      console.error('Error loading adoption requests:', error);
    } finally {
      if (showLoading) {
        setLoadingRequests(false);
      }
    }
  };

  const loadAcceptedRequests = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoadingAccepted(true);
      }
      const data = await getAcceptedOutgoingRequests();
      setAcceptedRequests(data);
    } catch (error) {
      console.error('Error loading accepted requests:', error);
    } finally {
      if (showLoading) {
        setLoadingAccepted(false);
      }
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      // Update local state immediately for better UX
      setNotifications(prev => 
        prev.map(n => n.notification_id === notificationId ? { ...n, is_read: true } : n)
      );
      // Update unread count
      setUnreadCount(prev => Math.max(0, prev - 1));
      // Refresh from server to ensure consistency (without showing loading)
      const updatedNotifications = await fetchNotifications();
      setNotifications(updatedNotifications);
      const updatedCount = await getUnreadNotificationCount();
      setUnreadCount(updatedCount);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      alert('Failed to mark notification as read. Please try again.');
    }
  };

  const handleViewRequest = (requestId) => {
    setReviewRequestId(requestId);
  };

  // Filter adoption requests by status
  const filteredAdoptionRequests = adoptionRequests.filter(req => {
    if (requestFilter === 'All') return true;
    return req.status === requestFilter;
  });

  // Get counts for each status
  const pendingCount = adoptionRequests.filter(r => r.status === 'Pending').length;
  const acceptedCount = adoptionRequests.filter(r => r.status === 'Accepted').length;
  const rejectedCount = adoptionRequests.filter(r => r.status === 'Rejected').length;
  const totalCount = adoptionRequests.length;

  // Get cat name for a request
  const getCatName = (request) => {
    const listing = listings.find(l => l.listing_id === request.listing_id);
    return listing?.name || 'Unknown Cat';
  };

  const displayedNotifications = hideRead 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  return (
    <div className="min-h-full">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notifications</h1>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={hideRead}
                onChange={(e) => setHideRead(e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-sm font-medium text-gray-700">Hide read notifications</span>
            </label>
          </div>
        </div>
      </header>

      {/* Adoption Requests Card */}
      <div className="px-8 py-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-gray-900">View Adoption Requests</h2>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-semibold">
                {totalCount}
              </span>
            </div>
            <select
              value={requestFilter}
              onChange={(e) => setRequestFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="All">All ({totalCount})</option>
              <option value="Pending">Pending ({pendingCount})</option>
              <option value="Accepted">Accepted ({acceptedCount})</option>
              <option value="Rejected">Rejected ({rejectedCount})</option>
            </select>
          </div>

          {loadingRequests ? (
            <p className="text-gray-500">Loading adoption requests...</p>
          ) : filteredAdoptionRequests.length === 0 ? (
            <p className="text-gray-500">
              {requestFilter === 'All' 
                ? 'No adoption requests yet'
                : `No ${requestFilter.toLowerCase()} adoption requests`}
            </p>
          ) : (
            <div className="space-y-3">
              {filteredAdoptionRequests.map((request) => {
                const catName = getCatName(request);
                const senderName = request.sender_name || request.full_name || 'Unknown';
                
                return (
                  <div
                    key={request.request_id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => handleViewRequest(request.request_id)}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="font-semibold text-gray-900">{catName}</p>
                        <span className={`px-2 py-1 text-xs font-medium rounded ${
                          request.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'Accepted' ? 'bg-green-100 text-green-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        From: {senderName}
                      </p>
                      {request.submitted_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(request.submitted_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Accepted Requests with Contact Info Card */}
      <div className="px-8 py-6">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-xl font-bold text-gray-900">Accepted Requests - Contact Information</h2>
            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
              {acceptedRequests.length}
            </span>
          </div>

          {loadingAccepted ? (
            <p className="text-gray-500">Loading accepted requests...</p>
          ) : acceptedRequests.length === 0 ? (
            <p className="text-gray-500">No accepted requests yet. Contact information will appear here once your requests are accepted.</p>
          ) : (
            <div className="space-y-4">
              {acceptedRequests.map((request) => (
                <div
                  key={request.request_id}
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {request.cat_name || 'Unknown Cat'}
                        </h3>
                        <span className="px-2 py-1 text-xs font-medium rounded bg-green-100 text-green-800">
                          Accepted
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">
                        Contact: <span className="font-medium">{request.receiver_name || 'Unknown'}</span>
                      </p>
                      {request.submitted_at && (
                        <p className="text-xs text-gray-500 mt-1">
                          Accepted on {new Date(request.submitted_at).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Contact Information:</h4>
                    <div className="space-y-2">
                      {request.receiver_email && (
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <a 
                            href={`mailto:${request.receiver_email}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {request.receiver_email}
                          </a>
                        </div>
                      )}
                      {request.receiver_phone && (
                        <div className="flex items-center gap-3">
                          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                          </svg>
                          <a 
                            href={`tel:${request.receiver_phone}`}
                            className="text-blue-600 hover:text-blue-800 hover:underline"
                          >
                            {request.receiver_phone}
                          </a>
                        </div>
                      )}
                      {!request.receiver_email && !request.receiver_phone && (
                        <p className="text-sm text-gray-500 italic">Contact information not available</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-8 py-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Notifications</h2>
        
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Loading notifications...</p>
          </div>
        )}

        {!loading && displayedNotifications.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {hideRead ? 'No unread notifications' : 'No notifications yet'}
            </p>
          </div>
        )}

        {!loading && displayedNotifications.length > 0 && (
          <div className="space-y-4">
            {displayedNotifications.map((notification) => (
              <div
                key={notification.notification_id}
                className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${
                  notification.is_read 
                    ? 'border-gray-300 opacity-75' 
                    : 'border-blue-500'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className={`text-gray-900 ${notification.is_read ? '' : 'font-semibold'}`}>
                      {notification.message.replace(/ \[REQUEST_ID:\d+\]/g, '')}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-4">
                    {!notification.is_read && (
                      <button
                        onClick={() => handleMarkAsRead(notification.notification_id)}
                        className="text-sm text-blue-600 hover:text-blue-800 transition-colors whitespace-nowrap"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;