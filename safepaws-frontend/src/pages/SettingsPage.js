import React, { useState, useEffect } from 'react';
import { getUserProfile, updateUserProfile } from '../services/api';

function SettingsPage() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getUserProfile();
      setProfile(data);
      setFormData({
        full_name: data.full_name || '',
        email: data.email || '',
        phone: data.phone || '',
        password: '', // Don't pre-fill password
      });
    } catch (err) {
      setError(err.message || 'Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    // Validate full_name if provided
    if (formData.full_name && (formData.full_name.length < 2 || formData.full_name.length > 50)) {
      setError('Full name must be between 2 and 50 characters');
      return false;
    }

    // Validate email format if provided
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    // Validate phone if provided (Saudi format: 05XXXXXXXX)
    if (formData.phone && !/^05\d{8}$/.test(formData.phone)) {
      setError('Phone must start with 05 and be 10 digits long (e.g., 0512345678)');
      return false;
    }

    // Validate password if provided
    if (formData.password) {
      if (formData.password.length < 8 || formData.password.length > 20) {
        setError('Password must be between 8 and 20 characters');
        return false;
      }
      if (!/[A-Za-z]/.test(formData.password)) {
        setError('Password must contain at least one letter');
        return false;
      }
      if (!/\d/.test(formData.password)) {
        setError('Password must contain at least one number');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Check if at least one field is provided
    if (!formData.full_name && !formData.email && !formData.phone && !formData.password) {
      setError('Please fill in at least one field to update');
      return;
    }

    if (!validateForm()) {
      return;
    }

    setUpdating(true);

    try {
      // Only send fields that have values
      const updateData = {};
      if (formData.full_name) updateData.full_name = formData.full_name;
      if (formData.email) updateData.email = formData.email;
      if (formData.phone) updateData.phone = formData.phone;
      if (formData.password) updateData.password = formData.password;

      const response = await updateUserProfile(updateData);
      setSuccess('Profile updated successfully!');
      
      // Update local profile state
      if (response.user) {
        setProfile({
          ...profile,
          ...response.user,
        });
        // Clear password field after successful update
        setFormData({
          ...formData,
          password: '',
        });
      }

      // Refresh profile to get latest data
      await fetchProfile();
    } catch (err) {
      setError(err.message || 'Failed to update profile. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <h1 className="text-3xl font-bold mb-6">Settings</h1>
        <div className="bg-white rounded-lg shadow-md p-6">
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Profile Management</h2>
        
        {/* Current Profile Info */}
        {profile && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium mb-3">Current Profile Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Username:</span>
                <span className="ml-2 text-gray-900">{profile.username}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Full Name:</span>
                <span className="ml-2 text-gray-900">{profile.full_name || 'Not set'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Email:</span>
                <span className="ml-2 text-gray-900">{profile.email || 'Not set'}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Phone:</span>
                <span className="ml-2 text-gray-900">{profile.phone || 'Not set'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg text-sm">
            {success}
          </div>
        )}

        {/* Update Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              minLength={2}
              maxLength={50}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={profile?.full_name || "Enter your full name"}
            />
            <p className="mt-1 text-xs text-gray-500">Leave empty to keep current value</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={profile?.email || "Enter your email"}
            />
            <p className="mt-1 text-xs text-gray-500">Leave empty to keep current value</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              pattern="05\d{8}"
              maxLength={10}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder={profile?.phone || "05XXXXXXXX"}
            />
            <p className="mt-1 text-xs text-gray-500">Saudi format: 05XXXXXXXX (10 digits). Leave empty to keep current value</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              minLength={8}
              maxLength={20}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter new password (optional)"
            />
            <p className="mt-1 text-xs text-gray-500">8-20 characters, must include letters and numbers. Leave empty to keep current password</p>
          </div>

          <button
            type="submit"
            disabled={updating}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {updating ? 'Updating Profile...' : 'Update Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default SettingsPage;

