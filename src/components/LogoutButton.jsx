//components/LogoutButton.jsx
import React from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../redux/slices/authSlice';

const LogoutButton = ({ className = "", children = "Logout" }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear Redux state and localStorage
    dispatch(logout());
    
    // Redirect to login page
    navigate('/login', { replace: true });
  };

  return (
    <button
      onClick={handleLogout}
      className={`text-orange-500 hover:text-orange-600 transition-colors ${className}`}
      type="button"
    >
      {children}
    </button>
  );
};

export default LogoutButton;