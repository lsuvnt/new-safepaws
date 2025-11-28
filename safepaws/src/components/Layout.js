import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAdoption } from '../contexts/AdoptionContext';
import Sidebar from './Sidebar';

function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const location = useLocation();
  const { selectedListing } = useAdoption();

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  // Hide right section on homepage and settings
  const hideRightSection = location.pathname === '/' || location.pathname === '/settings';
  const isAdoptionPage = location.pathname === '/adoption';

  return (
    <div className="h-screen w-screen">
      <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
      
      {/* Right side container - hidden on homepage and settings */}
      {!hideRightSection && (
        <div className="fixed right-0 top-0 h-screen w-1/4 bg-gray-200 border-l border-gray-300 overflow-y-auto">
          {isAdoptionPage ? (
            <div className="p-6 h-full">
              {!selectedListing ? (
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
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500 text-center px-4">
                Placeholder Text
              </p>
            </div>
          )}
        </div>
      )}

      <main className={`h-screen bg-gray-50 overflow-y-auto transition-all duration-300 ${
        hideRightSection ? 'mr-0' : 'mr-[25%]'
      } ${isSidebarOpen ? 'ml-[20%]' : 'ml-16'}`}>
        {children}
      </main>
    </div>
  );
}

export default Layout;

