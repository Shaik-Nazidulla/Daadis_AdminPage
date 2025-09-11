import React, { useState, useEffect } from 'react';
import { 
  BellIcon, 
  UserCircleIcon, 
  MagnifyingGlassIcon,
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
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products, orders, customers..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Right Side - Notifications and Profile */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="relative p-2 text-gray-400 hover:text-gray-600 transition-colors">
            <BellIcon className="w-6 h-6" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              3
            </span>
          </button>

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
                <button
                  onClick={() => handleNavigate("/settings")}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Profile Settings
                </button>
                <button
                  onClick={() => handleNavigate("/settings")}
                  className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Account Settings
                </button>
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
      </div>
    </header>
  );
};

export default Topbar;