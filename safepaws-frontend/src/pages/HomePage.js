import React, { useState, useEffect } from 'react';
import { getUserActivityLogs, getUserMapCats, getUserAdoptionListings, getUserProfile } from '../services/api';

function HomePage() {
  const [currentUserId, setCurrentUserId] = useState(null);
  const [contributionsCount, setContributionsCount] = useState(0);
  const [loadingContributions, setLoadingContributions] = useState(true);
  const [adoptionCats, setAdoptionCats] = useState([]);
  const [mapCats, setMapCats] = useState([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [selectedCatType, setSelectedCatType] = useState(null); // 'adoption' or 'map'
  const [selectedCats, setSelectedCats] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingContributions(true);
        setLoadingCats(true);

        // Get user profile
        const userProfile = await getUserProfile();
        setCurrentUserId(userProfile.user_id);

        // Get activity logs and filter for current month
        const activityLogs = await getUserActivityLogs();
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        
        const thisMonthLogs = activityLogs.filter(log => {
          const logDate = new Date(log.activity_time);
          return logDate.getMonth() === currentMonth && logDate.getFullYear() === currentYear;
        });
        
        setContributionsCount(thisMonthLogs.length);

        // Get user's cats
        const [adoptionListings, mapPins] = await Promise.all([
          getUserAdoptionListings(),
          getUserMapCats()
        ]);

        setAdoptionCats(adoptionListings);
        setMapCats(mapPins);
      } catch (error) {
        console.error('Error loading homepage data:', error);
      } finally {
        setLoadingContributions(false);
        setLoadingCats(false);
      }
    };

    loadData();
  }, []);

  const handleCardClick = (type) => {
    if (type === 'adoption') {
      setSelectedCats(adoptionCats);
      setSelectedCatType('adoption');
    } else if (type === 'map') {
      setSelectedCats(mapCats);
      setSelectedCatType('map');
    }
  };

  const handleBack = () => {
    setSelectedCatType(null);
    setSelectedCats([]);
  };

  return (
    <div className="min-h-full flex">
      {/* Main Content Area */}
      <div className="flex-1 p-8">
        <h1 className="text-3xl font-bold mb-6">Welcome to SafePaws</h1>
        
        {!selectedCatType ? (
          <div className="max-w-4xl">
            {/* Contributions Card */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Contributions This Month</h2>
              {loadingContributions ? (
                <p className="text-gray-600">Loading...</p>
              ) : (
                <p className="text-4xl font-bold text-gray-900">{contributionsCount}</p>
              )}
            </div>

            {/* My Cats Section */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">My Cats</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Up for Adoption Card */}
                <div
                  className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleCardClick('adoption')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">Up for Adoption</h3>
                      {loadingCats ? (
                        <p className="text-gray-500 text-sm">Loading...</p>
                      ) : (
                        <p className="text-gray-600 text-sm">{adoptionCats.length} {adoptionCats.length === 1 ? 'cat' : 'cats'}</p>
                      )}
                    </div>
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>

                {/* Added to Map Card */}
                <div
                  className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => handleCardClick('map')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">Added to Map</h3>
                      {loadingCats ? (
                        <p className="text-gray-500 text-sm">Loading...</p>
                      ) : (
                        <p className="text-gray-600 text-sm">{mapCats.length} {mapCats.length === 1 ? 'cat' : 'cats'}</p>
                      )}
                    </div>
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Cat Details View */
          <div>
            <button
              onClick={handleBack}
              className="mb-4 flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>

            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {selectedCatType === 'adoption' ? 'Up for Adoption' : 'Added to Map'}
            </h2>

            {selectedCats.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No cats found</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {selectedCats.map((cat) => (
                  <div key={selectedCatType === 'adoption' ? cat.listing_id : cat.location_id} className="bg-white rounded-lg shadow-md overflow-hidden">
                    {/* Cat Image */}
                    <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden">
                      {cat.image_url ? (
                        <img
                          src={cat.image_url}
                          alt={cat.name || 'Cat'}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const fallback = e.target.nextElementSibling;
                            if (fallback) fallback.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className="hidden items-center justify-center w-full h-full">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    </div>

                    {/* Cat Name */}
                    <div className="p-4">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {cat.name || 'Unnamed Cat'}
                      </h3>
                      {cat.cat_notes && (
                        <p className="text-sm text-gray-600 mt-1">{cat.cat_notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Sidebar - Grey Layout (Empty) */}
      <div className="fixed right-0 top-0 h-screen w-1/4 bg-gray-200 border-l border-gray-300 overflow-y-auto">
      </div>
    </div>
  );
}

export default HomePage;
