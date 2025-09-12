import React, { useState, useEffect } from 'react';
import { 
  UserCircleIcon, 
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout, fetchProfile } from '../redux/slices/authSlice';

const Topbar = () => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { user, isLoading } = useSelector((state) => state.auth);

  useEffect(() => {
    // Fetch profile if user data is not available
    if (!user) {
      dispatch(fetchProfile());
    }
  }, [user, dispatch]);

  const handleNavigate = (path) => {
    setShowProfileMenu(false);
    navigate(path);
  };

  const handleLogout = () => {
    setShowProfileMenu(false);
    dispatch(logout());
    navigate('/login', { replace: true });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showProfileMenu && !event.target.closest('.profile-dropdown')) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  const displayName = user ? 
    `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Admin User' 
    : 'Loading...';
    
  const displayEmail = user?.email || 'admin@daadi.com';

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center">
          <img
            src="https://res.cloudinary.com/dhezrgjf6/image/upload/v1757617940/daaid_s_logo_ai0rpl.png"
            alt="Daadi Logo"
            className="h-15 w-auto"
          />
        </div>

        {/* Profile Dropdown */}
        <div className="relative profile-dropdown">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            disabled={isLoading}
            className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <UserCircleIcon className="w-8 h-8 text-gray-400" />
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900">
                {isLoading ? (
                  <div className="h-4 bg-gray-200 rounded animate-pulse w-20"></div>
                ) : (
                  displayName
                )}
              </div>
              <div className="text-xs text-gray-500">
                {isLoading ? (
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-32 mt-1"></div>
                ) : (
                  displayEmail
                )}
              </div>
            </div>
            <ChevronDownIcon 
              className={`w-4 h-4 text-gray-400 transition-transform ${
                showProfileMenu ? 'rotate-180' : ''
              }`} 
            />
          </button>

          {/* Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
              <hr className="my-1" />
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Topbar;