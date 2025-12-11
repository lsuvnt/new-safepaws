import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAdoption } from '../contexts/AdoptionContext';
import { useMap } from '../contexts/MapContext';
import { fetchCatActivityLogs, createActivityLog, updatePinCondition, getUserProfile, createCatWithPin, getSentAdoptionRequests } from '../services/api';
import Sidebar from './Sidebar';
import AdoptionForm from './AdoptionForm';
import AdoptionRequestReview from './AdoptionRequestReview';
import AdoptionListingForm from './AdoptionListingForm';

function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const { selectedListing, setSelectedListing, reviewRequestId, setReviewRequestId, showAdoptionListingForm, setShowAdoptionListingForm } = useAdoption();
  const { selectedPin, setSelectedPin, triggerRefresh, newCatLocation, setNewCatLocation } = useMap();
  const [activityLogs, setActivityLogs] = useState([]);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [activityDescription, setActivityDescription] = useState('');
  const [submittingActivity, setSubmittingActivity] = useState(false);
  const [conditionValue, setConditionValue] = useState('');
  const [conditionDescription, setConditionDescription] = useState('');
  const [submittingCondition, setSubmittingCondition] = useState(false);
  
  // New cat form state
  const [newCatName, setNewCatName] = useState('');
  const [newCatAge, setNewCatAge] = useState('');
  const [newCatGender, setNewCatGender] = useState('UNKNOWN');
  const [newCatNotes, setNewCatNotes] = useState('');
  const [newCatImageUrl, setNewCatImageUrl] = useState('');
  const [newCatCondition, setNewCatCondition] = useState('NORMAL');
  const [newCatConditionDesc, setNewCatConditionDesc] = useState('');
  const [submittingNewCat, setSubmittingNewCat] = useState(false);
  
  // Adoption form state
  const [showAdoptionForm, setShowAdoptionForm] = useState(false);
  const [sentAdoptionRequests, setSentAdoptionRequests] = useState([]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const isAdoptionPage = location.pathname === '/adoption';
  const isMapPage = location.pathname === '/map';
  const isNotificationsPage = location.pathname === '/notifications';
  
  // Determine if right section should be shown
  // Show on: adoption page (only if not showing adoption listing form), map page, or on notifications page when reviewing an adoption request
  const shouldShowRightSection = (isAdoptionPage && !showAdoptionListingForm) || isMapPage || (isNotificationsPage && reviewRequestId !== null);
  
  // Clear reviewRequestId when navigating away from notifications page (no need for it anymore)
  useEffect(() => {
    if (reviewRequestId && !isNotificationsPage) {
      setReviewRequestId(null);
    }
  }, [location.pathname, reviewRequestId, isNotificationsPage, setReviewRequestId]);
  
  // Also clear selectedListing when navigating away from adoption page
  useEffect(() => {
    if (!isAdoptionPage && selectedListing) {
      setSelectedListing(null);
      setShowAdoptionForm(false);
    }
    if (!isAdoptionPage && showAdoptionListingForm) {
      setShowAdoptionListingForm(false);
    }
  }, [location.pathname, isAdoptionPage, selectedListing, setSelectedListing, showAdoptionListingForm, setShowAdoptionListingForm]);
  
  // Get current user ID
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const profile = await getUserProfile();
        setCurrentUserId(profile.user_id);
      } catch (error) {
        console.error('Error loading user profile:', error);
      }
    };
    loadUserProfile();
  }, []);

  // Fetch sent adoption requests when on adoption page
  useEffect(() => {
    if (isAdoptionPage && currentUserId) {
      const loadSentRequests = async () => {
        try {
          const requests = await getSentAdoptionRequests();
          setSentAdoptionRequests(requests || []);
        } catch (error) {
          console.error('Error loading sent adoption requests:', error);
          setSentAdoptionRequests([]);
        }
      };
      loadSentRequests();
    }
  }, [isAdoptionPage, currentUserId]);

  // Fetch activity logs when a pin is selected
  useEffect(() => {
    if (isMapPage && selectedPin && selectedPin.cat_id) {
      setLoadingActivity(true);
      fetchCatActivityLogs(selectedPin.cat_id)
        .then(logs => {
          setActivityLogs(logs || []);
        })
        .catch(error => {
          console.error('Error loading activity logs:', error);
          setActivityLogs([]);
        })
        .finally(() => {
          setLoadingActivity(false);
        });
    } else {
      setActivityLogs([]);
    }
  }, [selectedPin, isMapPage]);

  // Reset forms when pin changes
  useEffect(() => {
    if (selectedPin) {
      setShowActivityForm(false);
      setActivityDescription('');
      setConditionValue(selectedPin.condition || 'NORMAL');
      setConditionDescription('');
    }
  }, [selectedPin]);

  // Reset adoption form when listing changes
  useEffect(() => {
    if (selectedListing) {
      setShowAdoptionForm(false);
    }
  }, [selectedListing]);

  // Helper function to get condition color and description
  const getConditionInfo = (condition) => {
    if (!condition) {
      return { color: '#9CA3AF', description: 'Unknown' };
    }
    
    const conditionUpper = condition.toUpperCase();
    switch (conditionUpper) {
      case 'NORMAL':
        return { color: '#10B981', description: 'Normal' };
      case 'URGENT':
        return { color: '#EF4444', description: 'Urgent' };
      case 'AT_VET':
      case 'AT VET':
        return { color: '#3B82F6', description: 'At Vet' };
      case 'ADOPTED':
        return { color: '#9CA3AF', description: 'Adopted' };
      case 'PASSED':
        return { color: '#9CA3AF', description: 'Passed' };
      case 'UNKNOWN':
        return { color: '#9CA3AF', description: 'Unknown' };
      default:
        return { color: '#9CA3AF', description: condition };
    }
  };

  // Handle activity contribution submission
  const handleSubmitActivity = async () => {
    if (!activityDescription.trim() || !selectedPin) return;

    try {
      setSubmittingActivity(true);
      await createActivityLog({
        cat_id: selectedPin.cat_id,
        activity_description: activityDescription.trim(),
      });

      // Refresh activity logs
      const logs = await fetchCatActivityLogs(selectedPin.cat_id);
      setActivityLogs(logs || []);

      // Reset form
      setActivityDescription('');
      setShowActivityForm(false);
    } catch (error) {
      console.error('Error submitting activity:', error);
      alert(error.message || 'Failed to submit activity. Please try again.');
    } finally {
      setSubmittingActivity(false);
    }
  };

  // Handle condition update
  const handleUpdateCondition = async () => {
    if (!selectedPin || !conditionValue) return;

    // Validate required descriptions
    if ((conditionValue === 'URGENT' || conditionValue === 'AT VET') && !conditionDescription.trim()) {
      alert('Please provide a description for this condition change.');
      return;
    }

    try {
      setSubmittingCondition(true);
      const updatedPin = await updatePinCondition(selectedPin.location_id, {
        condition: conditionValue,
        description: conditionDescription.trim() || null,
      });

      // Update selected pin with new data
      setSelectedPin(updatedPin);

      // Trigger refresh of pins list in MapPage
      triggerRefresh();

      // Refresh activity logs
      const logs = await fetchCatActivityLogs(selectedPin.cat_id);
      setActivityLogs(logs || []);

      // Reset condition form - sync conditionValue with updated pin to hide description field
      setConditionValue(updatedPin.condition || 'NORMAL');
      setConditionDescription('');
    } catch (error) {
      console.error('Error updating condition:', error);
      alert(error.message || 'Failed to update condition. Please try again.');
    } finally {
      setSubmittingCondition(false);
    }
  };

  // Check if user can change condition to ADOPTED or PASSED
  const canChangeToAdoptedOrPassed = selectedPin && currentUserId && selectedPin.adding_user_id === currentUserId;
  
  // Check if cat is at vet, adopted, or passed (cannot add contributions)
  const cannotAddContributions = selectedPin && ['AT VET', 'ADOPTED', 'PASSED'].includes(selectedPin.condition);

  // Reset new cat form when location changes
  useEffect(() => {
    if (newCatLocation) {
      setNewCatName('');
      setNewCatAge('');
      setNewCatGender('UNKNOWN');
      setNewCatNotes('');
      setNewCatImageUrl('');
      setNewCatCondition('NORMAL');
      setNewCatConditionDesc('');
      // Clear selected pin when adding new cat
      setSelectedPin(null);
    }
  }, [newCatLocation, setSelectedPin]);

  // Clear new cat location when pin is selected
  useEffect(() => {
    if (selectedPin && newCatLocation) {
      setNewCatLocation(null);
    }
  }, [selectedPin, newCatLocation, setNewCatLocation]);

  // Handle new cat form submission
  const handleSubmitNewCat = async () => {
    if (!newCatName.trim() || !newCatLocation) {
      alert('Please provide a name for the cat.');
      return;
    }

    // Validate condition description if needed
    if ((newCatCondition === 'URGENT' || newCatCondition === 'AT VET') && !newCatConditionDesc.trim()) {
      alert('Please provide a description for this condition.');
      return;
    }

    try {
      setSubmittingNewCat(true);
      
      const catData = {
        name: newCatName.trim(),
        gender: newCatGender,
        age: newCatAge ? parseInt(newCatAge) : null,
        notes: newCatNotes.trim() || null,
        image_url: newCatImageUrl.trim() || null,
      };

      const result = await createCatWithPin({
        cat: catData,
        location: newCatLocation,
        condition: newCatCondition,
        conditionDescription: newCatConditionDesc.trim() || null,
      });

      // Clear the form and location
      setNewCatLocation(null);
      
      // Select the newly created pin
      setSelectedPin(result);
      
      // Trigger refresh of pins list
      triggerRefresh();
      
      // Show success message
      alert('Cat added successfully!');
    } catch (error) {
      console.error('Error creating cat:', error);
      alert(error.message || 'Failed to create cat. Please try again.');
    } finally {
      setSubmittingNewCat(false);
    }
  };

  return (
    <div className="h-screen w-screen">
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      
      {/* Right side container - shown on adoption/map pages, or when reviewing adoption request */}
      {shouldShowRightSection && (
        <div className="fixed right-0 top-0 h-screen w-1/4 bg-gray-200 border-l border-gray-300 overflow-y-auto">
          {reviewRequestId && isNotificationsPage ? (
            <AdoptionRequestReview
              requestId={reviewRequestId}
              onBack={() => setReviewRequestId(null)}
              onSuccess={() => {
                setReviewRequestId(null);
              }}
            />
          ) : isAdoptionPage ? (
            <div className="p-6 h-full">
              {showAdoptionForm ? (
                <AdoptionForm
                  listing={selectedListing}
                  currentUserId={currentUserId}
                  onBack={() => setShowAdoptionForm(false)}
                  onSuccess={async (catName) => {
                    setShowAdoptionForm(false);
                    // Refresh sent requests to update button state
                    try {
                      const requests = await getSentAdoptionRequests();
                      setSentAdoptionRequests(requests || []);
                    } catch (error) {
                      console.error('Error refreshing sent adoption requests:', error);
                    }
                    // Notification will be created by backend
                  }}
                />
              ) : !selectedListing ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 text-center">(Select 'View Details' on a listing)</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Image */}
                  <div className="h-64 bg-gray-200 flex items-center justify-center overflow-hidden relative">
                    {selectedListing.image_url ? (
                      <>
                        <img 
                          src={selectedListing.image_url} 
                          alt={selectedListing.name || 'Pet'} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fallback = e.target.nextElementSibling;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <div className="hidden absolute inset-0 items-center justify-center bg-gray-200">
                          <span className="text-gray-400">No Image</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900">{selectedListing.name || 'Unnamed'}</h2>
                    {selectedListing.cat_notes && (
                      <p className="text-sm text-gray-600 mt-1">{selectedListing.cat_notes}</p>
                    )}

                    <div className="mt-4 space-y-3">
                      <div>
                        <span className="text-sm font-medium text-gray-700">Age:</span>
                        <span className="ml-2 text-gray-600">
                          {selectedListing.age ? `${selectedListing.age} ${selectedListing.age === 1 ? 'year' : 'years'}` : 'Unknown'}
                        </span>
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-700">Gender:</span>
                        <span className="ml-2 text-gray-600">
                          {selectedListing.gender === 'M' ? 'Male' : 
                           selectedListing.gender === 'F' ? 'Female' : 
                           'Unknown'}
                        </span>
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-700">Sterilized:</span>
                        <span className={`ml-2 ${selectedListing.sterilized ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedListing.sterilized ? 'Yes' : 'No'}
                        </span>
                      </div>

                      <div>
                        <span className="text-sm font-medium text-gray-700">Vaccinated:</span>
                        <span className={`ml-2 ${selectedListing.vaccinated ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedListing.vaccinated ? 'Yes' : 'No'}
                        </span>
                      </div>

                      {selectedListing.notes && (
                        <div>
                          <span className="text-sm font-medium text-gray-700 block mb-1">Uploader's notes:</span>
                          <p className="text-gray-600 text-sm">{selectedListing.notes}</p>
                        </div>
                      )}
                    </div>

                    {/* Apply for Adoption or Edit Listing Button */}
                    {currentUserId && (() => {
                      // Check if user is the uploader
                      const isUploader = selectedListing.uploader_id === currentUserId;
                      
                      // Check if user has a pending request for this listing
                      const hasPendingRequest = sentAdoptionRequests.some(
                        req => req.listing_id === selectedListing.listing_id && req.status === 'Pending'
                      );
                      
                      // If user is uploader, show Edit Listing button
                      if (isUploader) {
                        return (
                          <div className="mt-6">
                            <button
                              onClick={() => setShowAdoptionListingForm(true)}
                              className="w-full px-4 py-2 text-white rounded-lg transition-colors"
                              style={{ backgroundColor: '#D05A57' }}
                              onMouseEnter={(e) => {
                                e.target.style.backgroundColor = '#b94643';
                              }}
                              onMouseLeave={(e) => {
                                e.target.style.backgroundColor = '#D05A57';
                              }}
                            >
                              Edit Listing
                            </button>
                          </div>
                        );
                      }
                      
                      // If user has pending request, disable button
                      if (hasPendingRequest) {
                        return (
                          <div className="mt-6">
                            <button
                              disabled
                              className="w-full px-4 py-2 text-gray-500 bg-gray-200 rounded-lg cursor-not-allowed"
                            >
                              You have a pending request for this cat
                            </button>
                          </div>
                        );
                      }
                      
                      // Otherwise, show Apply button
                      return (
                        <div className="mt-6">
                          <button
                            onClick={() => setShowAdoptionForm(true)}
                            className="w-full px-4 py-2 text-white rounded-lg transition-colors"
                            style={{ backgroundColor: '#D05A57' }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#b94643';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = '#D05A57';
                            }}
                          >
                            Apply for Adoption
                          </button>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
          ) : isMapPage ? (
            <div className="p-6 h-full">
              {newCatLocation ? (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-6">Add new cat to map</h2>
                    
                    <div className="space-y-4">
                      {/* Name (required) */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="Enter cat name"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          required
                        />
                      </div>

                      {/* Photo URL */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Photo URL
                        </label>
                        <input
                          type="url"
                          value={newCatImageUrl}
                          onChange={(e) => setNewCatImageUrl(e.target.value)}
                          placeholder="Enter image URL"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        {/* Image Preview */}
                        {newCatImageUrl && (
                          <div className="mt-3">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Preview
                            </label>
                            <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-100" style={{ maxHeight: '200px' }}>
                              <img
                                src={newCatImageUrl}
                                alt="Preview"
                                className="w-full h-auto object-contain"
                                style={{ maxHeight: '200px' }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  const errorDiv = e.target.nextElementSibling;
                                  if (errorDiv) errorDiv.style.display = 'flex';
                                }}
                              />
                              <div className="hidden items-center justify-center p-4 text-gray-500 text-sm">
                                Failed to load image. Please check the URL.
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Age and Gender in a row */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Age (years)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={newCatAge}
                            onChange={(e) => setNewCatAge(e.target.value)}
                            placeholder="Optional"
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Gender
                          </label>
                          <select
                            value={newCatGender}
                            onChange={(e) => setNewCatGender(e.target.value)}
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          >
                            <option value="UNKNOWN">Unknown</option>
                            <option value="M">Male</option>
                            <option value="F">Female</option>
                          </select>
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Notes
                        </label>
                        <textarea
                          value={newCatNotes}
                          onChange={(e) => setNewCatNotes(e.target.value)}
                          placeholder="Optional notes about the cat"
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          rows="3"
                        />
                      </div>

                      {/* Initial Condition Flag */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Initial Condition Flag
                        </label>
                        <select
                          value={newCatCondition}
                          onChange={(e) => setNewCatCondition(e.target.value)}
                          className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value="NORMAL">Normal</option>
                          <option value="URGENT">Urgent</option>
                          <option value="AT VET">At Vet</option>
                          <option value="UNKNOWN">Unknown</option>
                        </select>
                      </div>

                      {/* Condition description fields */}
                      {newCatCondition === 'URGENT' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Why is this urgent? <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={newCatConditionDesc}
                            onChange={(e) => setNewCatConditionDesc(e.target.value)}
                            placeholder="Describe why this is urgent..."
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows="3"
                            required
                          />
                        </div>
                      )}

                      {newCatCondition === 'AT VET' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Treatment Description <span className="text-red-500">*</span>
                          </label>
                          <textarea
                            value={newCatConditionDesc}
                            onChange={(e) => setNewCatConditionDesc(e.target.value)}
                            placeholder="Describe the treatment..."
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows="3"
                            required
                          />
                        </div>
                      )}

                      {/* Action buttons */}
                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={handleSubmitNewCat}
                          disabled={submittingNewCat || !newCatName.trim() || ((newCatCondition === 'URGENT' || newCatCondition === 'AT VET') && !newCatConditionDesc.trim())}
                          className="flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                          {submittingNewCat ? 'Adding...' : 'Add Cat'}
                        </button>
                        <button
                          onClick={() => {
                            setNewCatLocation(null);
                            setNewCatName('');
                            setNewCatAge('');
                            setNewCatGender('UNKNOWN');
                            setNewCatNotes('');
                            setNewCatImageUrl('');
                            setNewCatCondition('NORMAL');
                            setNewCatConditionDesc('');
                          }}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : !selectedPin ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500 text-center">(Select or add a pin to get started)</p>
                </div>
              ) : (
                <div className="bg-white rounded-lg shadow-md overflow-hidden">
                  {/* Image */}
                  <div className="h-64 bg-gray-200 flex items-center justify-center overflow-hidden relative">
                    {selectedPin.image_url ? (
                      <>
                        <img 
                          src={selectedPin.image_url} 
                          alt={selectedPin.name || 'Cat'} 
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fallback = e.target.nextElementSibling;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                        <div className="hidden absolute inset-0 items-center justify-center bg-gray-200">
                          <span className="text-gray-400">No Image</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-center w-full h-full">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-2xl font-bold text-gray-900">{selectedPin.name || 'Unnamed'}</h2>
                      {selectedPin.condition && (() => {
                        const conditionInfo = getConditionInfo(selectedPin.condition);
                        return (
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 rounded-full flex-shrink-0"
                              style={{ backgroundColor: conditionInfo.color }}
                            />
                            <span className="text-sm text-gray-600">{conditionInfo.description}</span>
                          </div>
                        );
                      })()}
                    </div>
                    {/* Age and Gender */}
                    {(selectedPin.age !== null && selectedPin.age !== undefined) || selectedPin.gender ? (
                      <div className="flex gap-3 mt-2 text-sm text-gray-600">
                        {selectedPin.age !== null && selectedPin.age !== undefined && (
                          <span>Age: {selectedPin.age} {selectedPin.age === 1 ? 'year' : 'years'}</span>
                        )}
                        {selectedPin.gender && (
                          <span>Gender: {selectedPin.gender === 'M' ? 'Male' : selectedPin.gender === 'F' ? 'Female' : 'Unknown'}</span>
                        )}
                      </div>
                    ) : null}
                    {selectedPin.notes && (
                      <p className="text-sm text-gray-600 mt-1">{selectedPin.notes}</p>
                    )}

                    {/* Condition Flag Selector */}
                    <div className="mt-6">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Condition Flag
                      </label>
                      <select
                        value={conditionValue}
                        onChange={(e) => setConditionValue(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="NORMAL">Normal</option>
                        <option value="URGENT">Urgent</option>
                        <option value="AT VET">At Vet</option>
                        {canChangeToAdoptedOrPassed && (
                          <>
                            <option value="ADOPTED">Adopted</option>
                            <option value="PASSED">Passed</option>
                          </>
                        )}
                      </select>

                      {/* Description field for URGENT - only show when condition is being changed */}
                      {conditionValue === 'URGENT' && conditionValue !== selectedPin.condition && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Why is this urgent?
                          </label>
                          <textarea
                            value={conditionDescription}
                            onChange={(e) => setConditionDescription(e.target.value)}
                            placeholder="Describe why this is urgent..."
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows="3"
                          />
                        </div>
                      )}

                      {/* Description field for AT VET - only show when condition is being changed */}
                      {conditionValue === 'AT VET' && conditionValue !== selectedPin.condition && (
                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Treatment Description
                          </label>
                          <textarea
                            value={conditionDescription}
                            onChange={(e) => setConditionDescription(e.target.value)}
                            placeholder="Describe the treatment..."
                            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows="3"
                          />
                        </div>
                      )}

                      {/* Update condition button */}
                      {conditionValue !== selectedPin.condition && (
                        <button
                          onClick={handleUpdateCondition}
                          disabled={submittingCondition || ((conditionValue === 'URGENT' || conditionValue === 'AT VET') && !conditionDescription.trim())}
                          className="mt-3 w-full px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                          {submittingCondition ? 'Updating...' : 'Update Condition'}
                        </button>
                      )}
                    </div>

                    {/* Activity Contribution */}
                    {!cannotAddContributions && (
                      <div className="mt-6">
                        {!showActivityForm ? (
                          <button
                            onClick={() => setShowActivityForm(true)}
                            className="w-full px-4 py-2 text-white rounded-lg transition-colors"
                            style={{ backgroundColor: '#D05A57' }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = '#b94643';
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = '#D05A57';
                            }}
                          >
                            Add Contribution
                          </button>
                        ) : (
                          <div className="space-y-3">
                            <label className="block text-sm font-medium text-gray-700">
                              Activity Description
                            </label>
                            <textarea
                              value={activityDescription}
                              onChange={(e) => setActivityDescription(e.target.value)}
                              placeholder="Describe the activity or contribution..."
                              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              rows="3"
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={handleSubmitActivity}
                                disabled={submittingActivity || !activityDescription.trim()}
                                className="flex-1 px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                                {submittingActivity ? 'Submitting...' : 'Submit'}
                              </button>
                              <button
                                onClick={() => {
                                  setShowActivityForm(false);
                                  setActivityDescription('');
                                }}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Activity Timeline */}
                    <div className="mt-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Timeline</h3>
                      {loadingActivity ? (
                        <p className="text-sm text-gray-500">Loading activity...</p>
                      ) : (
                        <div className="relative">
                          {/* Timeline line */}
                          <div className="absolute left-3 top-0 bottom-0 w-0.5 bg-gray-300"></div>
                          
                          <div className="space-y-4">
                            {/* First entry: Cat creation */}
                            {selectedPin.created_at && (
                              <div className="relative pl-8">
                                <div className="absolute left-0 top-1.5 w-6 h-6 bg-blue-500 rounded-full border-2 border-white"></div>
                                <div className="text-sm">
                                  <span className="text-gray-600">
                                    {new Date(selectedPin.created_at).toLocaleString()}: 
                                  </span>
                                  <span className="text-gray-900 ml-1">
                                    {selectedPin.name || 'Cat'} added by {selectedPin.adding_user_username || 'Unknown'}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Activity log entries */}
                            {activityLogs.map((log, index) => {
                              // Determine dot color based on activity type
                              let dotColor = '#6B7280'; // default gray
                              if (log.activity_type === 'condition_change_urgent') {
                                dotColor = '#EF4444'; // red
                              } else if (log.activity_type === 'condition_change_at_vet') {
                                dotColor = '#3B82F6'; // blue
                              }

                              // Check if it's a condition change or regular contribution
                              const isConditionChange = log.activity_type && log.activity_type.startsWith('condition_change');
                              
                              return (
                                <div key={log.log_id} className="relative pl-8">
                                  <div 
                                    className="absolute left-0 top-1.5 w-6 h-6 rounded-full border-2 border-white"
                                    style={{ backgroundColor: dotColor }}
                                  ></div>
                                  <div className="text-sm">
                                    <span className="text-gray-600">
                                      {new Date(log.activity_time).toLocaleString()}: 
                                    </span>
                                    <span className="text-gray-900 ml-1">
                                      {isConditionChange 
                                        ? log.activity_description
                                        : `${log.username || 'Unknown'} contributed: ${log.activity_description}`
                                      }
                                    </span>
                                  </div>
                                </div>
                              );
                            })}

                            {!loadingActivity && (!selectedPin.created_at) && activityLogs.length === 0 && (
                              <p className="text-sm text-gray-500 pl-8">No activity recorded yet.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}

      <main className={`h-screen bg-gray-50 overflow-y-auto transition-all duration-300 ${
        shouldShowRightSection ? 'mr-[25%]' : 'mr-0'
      } ${isSidebarOpen ? 'ml-[20%]' : 'ml-16'}`}>
        {children}
      </main>

      {/* Adoption Listing Form Modal */}
      {showAdoptionListingForm && isAdoptionPage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => {
          setShowAdoptionListingForm(false);
          // Don't clear selectedListing here - it might be needed for viewing the listing details
        }}>
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <AdoptionListingForm
              listing={selectedListing && selectedListing.uploader_id === currentUserId ? selectedListing : null}
              onBack={() => setShowAdoptionListingForm(false)}
              onSuccess={() => {
                setShowAdoptionListingForm(false);
                // Refresh the page to show updated listing
                window.location.reload();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Layout;

