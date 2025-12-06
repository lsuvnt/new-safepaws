import React, { useState } from 'react';
import { createCat, createAdoptionListing } from '../services/api';

function AdoptionListingForm({ onBack, onSuccess }) {
  const [formData, setFormData] = useState({
    // Cat fields
    name: '',
    gender: 'UNKNOWN',
    age: '',
    cat_notes: '',
    image_url: '',
    // Adoption listing fields
    vaccinated: false,
    sterilized: false,
    listing_notes: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validateField = (name, value) => {
    const newErrors = { ...errors };
    
    if (name === 'name' && !value.trim()) {
      newErrors.name = 'Cat name is required';
    } else if (name === 'name') {
      delete newErrors.name;
    }

    if (name === 'age' && value && (isNaN(value) || parseInt(value) < 0)) {
      newErrors.age = 'Age must be a valid positive number';
    } else if (name === 'age') {
      delete newErrors.age;
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
    
    // Validate required fields
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Cat name is required';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSubmitting(true);
      
      // Step 1: Create the cat
      const catData = {
        name: formData.name.trim(),
        gender: formData.gender,
        age: formData.age ? parseInt(formData.age) : null,
        notes: formData.cat_notes.trim() || null,
        image_url: formData.image_url.trim() || null,
      };
      
      const createdCat = await createCat(catData);
      
      // Step 2: Create the adoption listing
      const listingData = {
        cat_id: createdCat.cat_id,
        vaccinated: formData.vaccinated,
        sterilized: formData.sterilized,
        notes: formData.listing_notes.trim() || null,
      };
      
      await createAdoptionListing(listingData);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      alert(error.message || 'Failed to create adoption listing. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Create Adoption Listing</h2>
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <p className="text-gray-600 mb-6">Fill out all the information about the cat and adoption listing below</p>

      <form onSubmit={handleSubmit} className="space-y-4">
            {/* Cat Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cat Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter the cat's name"
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Gender */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="UNKNOWN">Unknown</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
              </select>
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Age (years)
              </label>
              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="0"
                className={`block w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.age ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Enter age in years (optional)"
              />
              {errors.age && (
                <p className="mt-1 text-sm text-red-500">{errors.age}</p>
              )}
            </div>

            {/* Cat Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cat Notes
              </label>
              <textarea
                name="cat_notes"
                value={formData.cat_notes}
                onChange={handleChange}
                rows="3"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional information about the cat (optional)"
              />
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Photo URL
              </label>
              <input
                type="url"
                name="image_url"
                value={formData.image_url}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter image URL (optional)"
              />
              {/* Image Preview */}
              {formData.image_url && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preview
                  </label>
                  <div className="border border-gray-300 rounded-lg overflow-hidden bg-gray-100" style={{ maxHeight: '200px' }}>
                    <img
                      src={formData.image_url}
                      alt="Preview"
                      className="w-full h-auto object-contain"
                      style={{ maxHeight: '200px' }}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const errorDiv = e.target.nextElementSibling;
                        if (errorDiv) errorDiv.style.display = 'flex';
                      }}
                    />
                    <div className="hidden items-center justify-center p-4 text-gray-500 text-sm">
                      Failed to load image. Please check the URL.
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="border-t border-gray-300 my-6"></div>

            {/* Vaccinated */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="vaccinated"
                name="vaccinated"
                checked={formData.vaccinated}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="vaccinated" className="ml-2 block text-sm font-medium text-gray-700">
                Vaccinated
              </label>
            </div>

            {/* Sterilized */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="sterilized"
                name="sterilized"
                checked={formData.sterilized}
                onChange={handleChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="sterilized" className="ml-2 block text-sm font-medium text-gray-700">
                Sterilized
              </label>
            </div>

            {/* Listing Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Adoption Listing Notes
              </label>
              <textarea
                name="listing_notes"
                value={formData.listing_notes}
                onChange={handleChange}
                rows="3"
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Additional information about the adoption listing (optional)"
              />
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
                {submitting ? 'Creating Listing...' : 'Create Adoption Listing'}
              </button>
            </div>
          </form>
    </div>
  );
}

export default AdoptionListingForm;

