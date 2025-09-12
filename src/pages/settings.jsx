//pages/settings.jsx
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchProfile, clearError } from "../redux/slices/authSlice";
import LogoutButton from "../components/LogoutButton";

const Settings = () => {
  const dispatch = useDispatch();
  const { user, isLoading, error } = useSelector((state) => state.auth);

  useEffect(() => {
    // Fetch user profile when component mounts
    dispatch(fetchProfile());
  }, [dispatch]);

  if (isLoading && !user) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-3xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Settings</h1>
          <LogoutButton className="bg-orange-500 text-white px-4 py-2 rounded  transition-colors" />
        </div>

        {/* Global Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Profile Information Display */}
        <div className="bg-white p-6 shadow rounded-lg mb-6">
          <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                First Name
              </label>
              <div className="w-full px-3 py-2 border rounded bg-gray-50 text-gray-800 min-h-[38px] flex items-center">
                {user?.firstName || "Not provided"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Last Name
              </label>
              <div className="w-full px-3 py-2 border rounded bg-gray-50 text-gray-800 min-h-[38px] flex items-center">
                {user?.lastName || "Not provided"}
              </div>
            </div>
          </div>
          
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Email
              </label>
              <div className="w-full px-3 py-2 border rounded bg-gray-50 text-gray-800 min-h-[38px] flex items-center">
                {user?.email || "Not provided"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Phone Number
              </label>
              <div className="w-full px-3 py-2 border rounded bg-gray-50 text-gray-800 min-h-[38px] flex items-center">
                {user?.phoneNumber || "Not provided"}
              </div>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="bg-white p-6 shadow rounded-lg">
          <h2 className="text-lg font-semibold mb-4">Account Information</h2>
          
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Account Created
              </label>
              <div className="w-full px-3 py-2 border rounded bg-gray-50 text-gray-800 min-h-[38px] flex items-center">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "Not available"}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Last Updated
              </label>
              <div className="w-full px-3 py-2 border rounded bg-gray-50 text-gray-800 min-h-[38px] flex items-center">
                {user?.updatedAt ? new Date(user.updatedAt).toLocaleDateString() : "Not available"}
              </div>
            </div>
          </div>
          
          <div className="border-t pt-4">
            <p className="text-sm text-gray-600 mb-4">
              To make changes to your profile information, please contact support.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;