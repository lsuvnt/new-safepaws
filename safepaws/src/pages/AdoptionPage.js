import React, { useState, useEffect } from 'react';
import { fetchAdoptionListings, getUserProfile } from '../services/api';
import { useAdoption } from '../contexts/AdoptionContext';

function AdoptionPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterSterilized, setFilterSterilized] = useState(false);
  const [filterVaccinated, setFilterVaccinated] = useState(false);
  const [adoptionListings, setAdoptionListings] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const { setSelectedListing } = useAdoption();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch current user ID and adoption listings on component mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        
        // Get current user ID
        try {
          const userProfile = await getUserProfile();
          setCurrentUserId(userProfile.user_id);
        } catch (err) {
          console.error('Error loading user profile:', err);
          // User might not be logged in, continue without filtering
        }
        
        const listingsData = await fetchAdoptionListings();
        
        // Filter only active listings
        const activeListings = listingsData.filter(listing => listing.is_active);
        setAdoptionListings(activeListings);
      } catch (err) {
        console.error('Error loading adoption data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    
    // Clear selected listing when component unmounts
    return () => {
      setSelectedListing(null);
    };
  }, [setSelectedListing]);

  // Filter and sort pets
  const filteredPets = adoptionListings
    .filter(pet => {
      // Don't show listings where the uploader is the current user
      if (currentUserId && pet.uploader_id === currentUserId) {
        return false;
      }
      const matchesSearch = pet.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
      const matchesSterilized = !filterSterilized || pet.sterilized === true;
      const matchesVaccinated = !filterVaccinated || pet.vaccinated === true;
      return matchesSearch && matchesSterilized && matchesVaccinated;
    })
    .sort((a, b) => {
      if (sortBy === 'name') {
        return (a.name || '').localeCompare(b.name || '');
      } else if (sortBy === 'age') {
        const ageA = a.age || 0;
        const ageB = b.age || 0;
        return ageA - ageB;
      }
      return 0;
    });

  return (
    <div className="min-h-full">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 px-8 py-6">
          <h1 className="text-3xl font-bold text-gray-900">Adoption</h1>
          <p className="text-gray-600 mt-2">Find your perfect companion</p>
        </header>

      {/* Search and Filter Section */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Sort and Filter Options */}
        <div className="flex flex-wrap gap-4">
          {/* Sort Dropdown */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sort By
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name">Name (A-Z)</option>
              <option value="age">Age</option>
            </select>
          </div>

          {/* Filter by Sterilized */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="filterSterilized"
              checked={filterSterilized}
              onChange={(e) => setFilterSterilized(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="filterSterilized" className="ml-2 block text-sm font-medium text-gray-700">
              Sterilized Only
            </label>
          </div>

          {/* Filter by Vaccinated */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="filterVaccinated"
              checked={filterVaccinated}
              onChange={(e) => setFilterVaccinated(e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="filterVaccinated" className="ml-2 block text-sm font-medium text-gray-700">
              Vaccinated Only
            </label>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="px-8 py-6">
        {loading && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Loading adoption listings...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-500 text-lg">Error: {error}</p>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="mb-4">
              <p className="text-gray-600">
                Found <span className="font-semibold">{filteredPets.length}</span> {filteredPets.length === 1 ? 'pet' : 'pets'}
              </p>
            </div>

            {/* Pet Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPets.map(pet => (
                <div key={pet.listing_id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gray-200 flex items-center justify-center overflow-hidden relative">
                    {pet.image_url ? (
                      <>
                        <img 
                          src={pet.image_url} 
                          alt={pet.name || 'Pet'} 
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
                  <div className="p-4">
                    <h3 className="text-xl font-semibold text-gray-900">{pet.name || 'Unnamed'}</h3>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p><span className="font-medium">Age:</span> {pet.age ? `${pet.age} ${pet.age === 1 ? 'year' : 'years'}` : 'Unknown'}</p>
                      <p><span className="font-medium">Gender:</span> {
                        pet.gender === 'M' ? 'Male' : 
                        pet.gender === 'F' ? 'Female' : 
                        'Unknown'
                      }</p>
                    </div>
                    <button 
                      className="mt-4 w-full text-white py-2 rounded-lg transition-colors"
                      style={{ backgroundColor: '#D05A57' }}
                      onMouseEnter={(e) => {
                        e.target.style.backgroundColor = '#b94643';
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.backgroundColor = '#D05A57';
                      }}
                      onClick={() => setSelectedListing(pet)}
                    >
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {filteredPets.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No pets found matching your criteria.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default AdoptionPage;

