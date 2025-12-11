import React, { useState, useEffect } from 'react';
import { getAdoptionRequest, handleAdoptionRequest, fetchAdoptionListings } from '../services/api';
import { getUserProfile } from '../services/api';

function AdoptionRequestReview({ requestId, onBack, onSuccess }) {
  const [request, setRequest] = useState(null);
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [decision, setDecision] = useState(null); // 'Accepted' or 'Rejected'
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    loadRequestData();
    loadUserProfile();
  }, [requestId]);

  const loadUserProfile = async () => {
    try {
      const profile = await getUserProfile();
      setCurrentUser(profile);
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadRequestData = async () => {
    try {
      setLoading(true);
      const requestData = await getAdoptionRequest(requestId);
      setRequest(requestData);
      
      // Fetch listing to get cat info
      const listings = await fetchAdoptionListings();
      const matchingListing = listings.find(l => l.listing_id === requestData.listing_id);
      setListing(matchingListing);
    } catch (error) {
      console.error('Error loading request:', error);
      alert('Failed to load adoption request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!decision) {
      alert('Please select Accept or Reject');
      return;
    }

    try {
      setSubmitting(true);
      await handleAdoptionRequest(requestId, decision);
      
      alert(`Request ${decision.toLowerCase()} successfully!`);
      
      if (onSuccess) {
        onSuccess();
      }
      
      if (onBack) {
        onBack();
      }
    } catch (error) {
      alert(error.message || 'Failed to process request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <p className="text-gray-500">Loading adoption request...</p>
      </div>
    );
  }

  if (!request || !listing) {
    return (
      <div className="p-6 h-full flex items-center justify-center">
        <p className="text-red-500">Failed to load adoption request</p>
      </div>
    );
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <button
        onClick={onBack}
        className="mb-4 text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Adoption Request Review</h2>
          
          {/* Cat Info */}
          {listing && (
            <div className="mb-6 pb-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{listing.name || 'Unnamed Cat'}</h3>
              {listing.image_url && (
                <div className="mt-3">
                  <img 
                    src={listing.image_url} 
                    alt={listing.name || 'Cat'} 
                    className="w-full max-w-sm h-48 object-cover rounded-lg"
                  />
                </div>
              )}
            </div>
          )}

          {/* Application Details */}
          <div className="space-y-4 mb-6">
            <div>
              <span className="text-sm font-medium text-gray-700">Full Name:</span>
              <p className="text-gray-900 mt-1">{request.full_name}</p>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-700">Age:</span>
              <p className="text-gray-900 mt-1">{request.age} years old</p>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-700">City:</span>
              <p className="text-gray-900 mt-1">{request.city}</p>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-700">Reason for Adoption:</span>
              <p className="text-gray-900 mt-1">{request.reason_for_adoption}</p>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-700">Living Situation:</span>
              <p className="text-gray-900 mt-1">{request.living_situation}</p>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-700">Experience Level:</span>
              <p className="text-gray-900 mt-1">{request.experience_level}</p>
            </div>

            <div>
              <span className="text-sm font-medium text-gray-700">Has Other Pets:</span>
              <p className="text-gray-900 mt-1">{request.has_other_pets ? 'Yes' : 'No'}</p>
            </div>
          </div>

          {/* Accept/Reject Section */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Decision</h3>
            
            <div className="space-y-3 mb-6">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="decision"
                  value="Accepted"
                  checked={decision === 'Accepted'}
                  onChange={(e) => setDecision(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-gray-900 font-medium">Accept</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="decision"
                  value="Rejected"
                  checked={decision === 'Rejected'}
                  onChange={(e) => setDecision(e.target.value)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                />
                <span className="text-gray-900 font-medium">Reject</span>
              </label>
            </div>

            {decision === 'Accepted' && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  Accepting the request will share your phone number and email to {request.full_name} for further arrangements.
                </p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={!decision || submitting}
              className="w-full px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#D05A57' }}
              onMouseEnter={(e) => {
                if (!e.target.disabled) {
                  e.target.style.backgroundColor = '#b94643';
                }
              }}
              onMouseLeave={(e) => {
                if (!e.target.disabled) {
                  e.target.style.backgroundColor = '#D05A57';
                }
              }}
            >
              {submitting ? 'Processing...' : 'Submit Decision'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdoptionRequestReview;

