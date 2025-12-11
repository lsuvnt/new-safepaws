import React, { useState } from 'react';
import { createAdoptionRequest } from '../services/api';

function AdoptionForm({ listing, currentUserId, onBack, onSuccess }) {
  const [formData, setFormData] = useState({
    listing_id: listing?.listing_id || null,
    city: '',
    age: '',
    full_name: '',
    reason_for_adoption: '',
    living_situation: '',
    experience_level: 'None',
    has_other_pets: false,
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    if (name === 'city' && !value.trim()) {
      newErrors.city = 'City is required';
    } else if (name === 'city') {
      delete newErrors.city;
    }

    if (name === 'age' && (!value || value <= 0)) {
      newErrors.age = 'Valid age is required';
    } else if (name === 'age') {
      delete newErrors.age;
    }

    if (name === 'full_name' && !value.trim()) {
      newErrors.full_name = 'Full name is required';
    } else if (name === 'full_name') {
      delete newErrors.full_name;
    }

    if (name === 'reason_for_adoption' && !value.trim()) {
      newErrors.reason_for_adoption = 'Reason for adoption is required';
    } else if (name === 'reason_for_adoption') {
      delete newErrors.reason_for_adoption;
    }

    if (name === 'living_situation' && !value.trim()) {
      newErrors.living_situation = 'Living situation is required';
    } else if (name === 'living_situation') {
      delete newErrors.living_situation;
    }

    setErrors(newErrors);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: fieldValue
    }));

    if (type !== 'checkbox') {
      validateField(name, fieldValue);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all fields
    const newErrors = {};
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.age || formData.age <= 0) newErrors.age = 'Valid age is required';
    if (!formData.full_name.trim()) newErrors.full_name = 'Full name is required';
    if (!formData.reason_for_adoption.trim()) newErrors.reason_for_adoption = 'Reason for adoption is required';
    if (!formData.living_situation.trim()) newErrors.living_situation = 'Living situation is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      await createAdoptionRequest({
        ...formData,
        age: parseInt(formData.age),
        experience_level: formData.experience_level
      });
      
      if (onSuccess) {
        onSuccess(listing.name);
      }
    } catch (error) {
      alert(error.message || 'Failed to submit adoption request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!listing) {
    return null;
  }

  return (
    <div className="p-6 h-full overflow-y-auto">
      <button
        onClick={onBack}
        className="mb-4 text-gray-600 hover:text-gray-900 flex items-center gap-2 transition-colors"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to adoption
      </button>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Apply for adoption</h2>
          <p className="text-gray-600 mb-6">Fill out the required fields in the form below</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.full_name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your full name"
              />
              {errors.full_name && (
                <p className="mt-1 text-sm text-red-500">{errors.full_name}</p>
              )}
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.city ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your city"
              />
              {errors.city && (
                <p className="mt-1 text-sm text-red-500">{errors.city}</p>
              )}
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="1"
                className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.age ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter your age"
              />
              {errors.age && (
                <p className="mt-1 text-sm text-red-500">{errors.age}</p>
              )}
            </div>

            {/* Reason for Adoption */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for Adoption <span className="text-red-500">*</span>
              </label>
              <textarea
                name="reason_for_adoption"
                value={formData.reason_for_adoption}
                onChange={handleChange}
                rows="4"
                className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.reason_for_adoption ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Why do you want to adopt this cat?"
              />
              {errors.reason_for_adoption && (
                <p className="mt-1 text-sm text-red-500">{errors.reason_for_adoption}</p>
              )}
            </div>

            {/* Living Situation */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Living Situation <span className="text-red-500">*</span>
              </label>
              <textarea
                name="living_situation"
                value={formData.living_situation}
                onChange={handleChange}
                rows="4"
                className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.living_situation ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Describe your living situation (house, apartment, etc.)"
              />
              {errors.living_situation && (
                <p className="mt-1 text-sm text-red-500">{errors.living_situation}</p>
              )}
            </div>

            {/* Experience Level */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Experience Level <span className="text-red-500">*</span>
              </label>
              <select
                name="experience_level"
                value={formData.experience_level}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="None">None</option>
                <option value="Minimal">Minimal</option>
                <option value="Fairly experienced">Fairly experienced</option>
                <option value="Good with cats">Good with cats</option>
              </select>
            </div>

            {/* Has Other Pets */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="has_other_pets"
                name="has_other_pets"
                checked={formData.has_other_pets}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="has_other_pets" className="ml-2 block text-sm font-medium text-gray-700">
                Do you have other pets?
              </label>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={submitting}
                className="w-full px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                {submitting ? 'Submitting...' : 'Send Adoption Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdoptionForm;

