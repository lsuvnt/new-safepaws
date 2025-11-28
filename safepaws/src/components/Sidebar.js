import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getUserProfile } from '../services/api';

function Sidebar({ isOpen, onToggle }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState({
    username: '',
    profile_picture_url: null,
  });
  const [loading, setLoading] = useState(true);

  const isActive = (path) => location.pathname === path;

  // Clear hover states when route changes
  useEffect(() => {
    // This effect will run when location changes, ensuring hover states are cleared
  }, [location.pathname]);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const profile = await getUserProfile();
        setUser({
          username: profile.username || 'User',
          profile_picture_url: profile.profile_picture_url || null,
        });
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        // If profile fetch fails, user might not be logged in
        setUser({
          username: 'User',
          profile_picture_url: null,
        });
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleLogout = () => {
    // Clear the access token from localStorage
    localStorage.removeItem('access_token');
    // Redirect to login page
    navigate('/login');
  };

  // Default placeholder image if no profile picture
  const profileImageUrl = user.profile_picture_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=4F46E5&color=fff&size=40`;

  return (
    <>
      <aside className={`text-white fixed left-0 top-0 h-screen transition-all duration-300 flex flex-col ${
        isOpen ? 'w-[20%]' : 'w-16'
      }`} style={{ backgroundColor: '#121212' }}>
        <div className="flex-1 overflow-y-auto">
          <div className={`p-6 ${isOpen ? '' : 'px-0 py-6'}`}>
            {isOpen ? (
              <>
                <h2 className="text-2xl font-bold mb-6">SafePaws</h2>
                <nav className="space-y-2">
                  <Link 
                    to="/" 
                    className={`block px-4 py-2 rounded transition-colors ${
                      isActive('/') ? '' : ''
                    }`}
                    style={isActive('/') ? {
                      background: 'linear-gradient(90deg, rgba(199, 54, 97, 1) 30%, rgba(224, 159, 67, 1) 100%)',
                      backgroundColor: '#c73661'
                    } : {}}
                    onMouseEnter={(e) => {
                      if (!isActive('/')) {
                        e.currentTarget.style.backgroundColor = '#D05A57';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive('/')) {
                        e.currentTarget.style.backgroundColor = '';
                      }
                    }}
                    onClick={(e) => {
                      // Clear hover state on click
                      if (!isActive('/')) {
                        e.currentTarget.style.backgroundColor = '';
                      }
                    }}
                  >
                    Home
                  </Link>
                  <Link 
                    to="/adoption" 
                    className={`block px-4 py-2 rounded transition-colors ${
                      isActive('/adoption') ? '' : ''
                    }`}
                    style={isActive('/adoption') ? {
                      background: 'linear-gradient(90deg, rgba(199, 54, 97, 1) 30%, rgba(224, 159, 67, 1) 100%)',
                      backgroundColor: '#c73661'
                    } : {}}
                    onMouseEnter={(e) => {
                      if (!isActive('/adoption')) {
                        e.currentTarget.style.backgroundColor = '#D05A57';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive('/adoption')) {
                        e.currentTarget.style.backgroundColor = '';
                      }
                    }}
                    onClick={(e) => {
                      if (!isActive('/adoption')) {
                        e.currentTarget.style.backgroundColor = '';
                      }
                    }}
                  >
                    Adoption
                  </Link>
                  <Link 
                    to="/map" 
                    className={`block px-4 py-2 rounded transition-colors ${
                      isActive('/map') ? '' : ''
                    }`}
                    style={isActive('/map') ? {
                      background: 'linear-gradient(90deg, rgba(199, 54, 97, 1) 30%, rgba(224, 159, 67, 1) 100%)',
                      backgroundColor: '#c73661'
                    } : {}}
                    onMouseEnter={(e) => {
                      if (!isActive('/map')) {
                        e.currentTarget.style.backgroundColor = '#D05A57';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive('/map')) {
                        e.currentTarget.style.backgroundColor = '';
                      }
                    }}
                    onClick={(e) => {
                      if (!isActive('/map')) {
                        e.currentTarget.style.backgroundColor = '';
                      }
                    }}
                  >
                    Map
                  </Link>
                  <Link 
                    to="/settings" 
                    className={`block px-4 py-2 rounded transition-colors ${
                      isActive('/settings') ? '' : ''
                    }`}
                    style={isActive('/settings') ? {
                      background: 'linear-gradient(90deg, rgba(199, 54, 97, 1) 30%, rgba(224, 159, 67, 1) 100%)',
                      backgroundColor: '#c73661'
                    } : {}}
                    onMouseEnter={(e) => {
                      if (!isActive('/settings')) {
                        e.currentTarget.style.backgroundColor = '#D05A57';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive('/settings')) {
                        e.currentTarget.style.backgroundColor = '';
                      }
                    }}
                    onClick={(e) => {
                      if (!isActive('/settings')) {
                        e.currentTarget.style.backgroundColor = '';
                      }
                    }}
                  >
                    Settings
                  </Link>
                </nav>
              </>
            ) : (
              <nav className="space-y-4 flex flex-col items-center">
                <Link 
                  to="/" 
                  className={`block p-3 rounded transition-colors ${
                    isActive('/') ? '' : ''
                  }`}
                  title="Home"
                  style={isActive('/') ? {
                    background: 'linear-gradient(90deg, rgba(199, 54, 97, 1) 30%, rgba(224, 159, 67, 1) 100%)',
                    backgroundColor: '#c73661'
                  } : {}}
                  onMouseEnter={(e) => {
                    if (!isActive('/')) {
                      e.currentTarget.style.backgroundColor = '#D05A57';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive('/')) {
                      e.currentTarget.style.backgroundColor = '';
                    }
                  }}
                  onClick={(e) => {
                    if (!isActive('/')) {
                      e.currentTarget.style.backgroundColor = '';
                    }
                  }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </Link>
                <Link 
                  to="/adoption" 
                  className={`block p-3 rounded transition-colors ${
                    isActive('/adoption') ? '' : ''
                  }`}
                  title="Adoption"
                  style={isActive('/adoption') ? {
                    background: 'linear-gradient(90deg, rgba(199, 54, 97, 1) 30%, rgba(224, 159, 67, 1) 100%)',
                    backgroundColor: '#c73661'
                  } : {}}
                  onMouseEnter={(e) => {
                    if (!isActive('/adoption')) {
                      e.currentTarget.style.backgroundColor = '#D05A57';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive('/adoption')) {
                      e.currentTarget.style.backgroundColor = '';
                    }
                  }}
                  onClick={(e) => {
                    if (!isActive('/adoption')) {
                      e.currentTarget.style.backgroundColor = '';
                    }
                  }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </Link>
                <Link 
                  to="/map" 
                  className={`block p-3 rounded transition-colors ${
                    isActive('/map') ? '' : ''
                  }`}
                  title="Map"
                  style={isActive('/map') ? {
                    background: 'linear-gradient(90deg, rgba(199, 54, 97, 1) 30%, rgba(224, 159, 67, 1) 100%)',
                    backgroundColor: '#c73661'
                  } : {}}
                  onMouseEnter={(e) => {
                    if (!isActive('/map')) {
                      e.currentTarget.style.backgroundColor = '#D05A57';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive('/map')) {
                      e.currentTarget.style.backgroundColor = '';
                    }
                  }}
                  onClick={(e) => {
                    if (!isActive('/map')) {
                      e.currentTarget.style.backgroundColor = '';
                    }
                  }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                </Link>
                <Link 
                  to="/settings" 
                  className={`block p-3 rounded transition-colors ${
                    isActive('/settings') ? '' : ''
                  }`}
                  title="Settings"
                  style={isActive('/settings') ? {
                    background: 'linear-gradient(90deg, rgba(199, 54, 97, 1) 30%, rgba(224, 159, 67, 1) 100%)',
                    backgroundColor: '#c73661'
                  } : {}}
                  onMouseEnter={(e) => {
                    if (!isActive('/settings')) {
                      e.currentTarget.style.backgroundColor = '#D05A57';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive('/settings')) {
                      e.currentTarget.style.backgroundColor = '';
                    }
                  }}
                  onClick={(e) => {
                    if (!isActive('/settings')) {
                      e.currentTarget.style.backgroundColor = '';
                    }
                  }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </Link>
              </nav>
            )}
          </div>
        </div>
        
        {/* Logout Button - above footer */}
        <div className={`border-t border-gray-700 ${isOpen ? 'p-4' : 'p-2'}`}>
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded hover:bg-gray-700 transition-colors text-red-400 hover:text-red-300 ${
              !isOpen ? 'justify-center' : ''
            }`}
            title="Logout"
          >
            {isOpen ? (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                <span>Logout</span>
              </>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Footer with user profile */}
        <div className={`border-t border-gray-700 ${isOpen ? 'p-4' : 'p-2'}`}>
          {loading ? (
            <div className={`flex items-center ${isOpen ? 'gap-3' : 'justify-center'}`}>
              <div className="w-10 h-10 rounded-lg bg-gray-700 animate-pulse"></div>
              {isOpen && <div className="flex-1 min-w-0">
                <div className="h-4 bg-gray-700 rounded animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-700 rounded animate-pulse w-20"></div>
              </div>}
            </div>
          ) : isOpen ? (
            <div className="flex items-center gap-3">
              <img 
                src={profileImageUrl} 
                alt="Profile" 
                className="w-10 h-10 rounded-lg object-cover"
                onError={(e) => {
                  // Fallback to avatar API if image fails to load
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=4F46E5&color=fff&size=40`;
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user.username}</p>
                <Link 
                  to="/settings" 
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Profile Settings
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <img 
                src={profileImageUrl} 
                alt="Profile" 
                className="w-10 h-10 rounded-lg object-cover"
                title={user.username}
                onError={(e) => {
                  // Fallback to avatar API if image fails to load
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.username)}&background=4F46E5&color=fff&size=40`;
                }}
              />
            </div>
          )}
        </div>
      </aside>
      
      {/* Toggle Button - positioned outside sidebar to avoid clipping */}
      <button
        onClick={(e) => {
          // Ensure hover state is cleared when clicking
          e.currentTarget.style.backgroundColor = '#D05A57';
          onToggle();
        }}
        className={`fixed top-1/2 -translate-y-1/2 w-8 h-16 rounded-r-lg flex items-center justify-center transition-all duration-300 z-20 ${
          isOpen ? 'left-[calc(20%-16px)]' : 'left-[calc(4rem-16px)]'
        }`}
        style={{ backgroundColor: '#D05A57' }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#b94643';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#D05A57';
        }}
        aria-label="Toggle sidebar"
      >
        <svg
          className={`w-5 h-5 text-white transition-transform duration-300 ${
            isOpen ? '' : 'rotate-180'
          }`}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="2"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path d="M15 19l-7-7 7-7"></path>
        </svg>
      </button>
    </>
  );
}

export default Sidebar;

