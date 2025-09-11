// pages/categories.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { 
  fetchCategories,
  createCategory, 
  updateCategory, 
  deleteCategory, 
  clearError
} from '../redux/slices/categoriesSlice';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  EyeIcon,
  TagIcon,
} from '@heroicons/react/24/outline';

const Categories = () => {
  const dispatch = useDispatch();
  const { categories, loading, error } = useSelector(state => state.categories);
  
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    imageFile: null,   
    imagePreview: '',  
    hsn: ''
  });
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        await dispatch(fetchCategories()).unwrap();
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchData();
  }, [dispatch]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name || formData.name.trim() === '') {
      errors.name = 'Category name is required';
    }
    if (!formData.imageFile && !formData.imagePreview) {
      errors.image = 'Category image is required';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
  e.preventDefault();

  console.log("🔎 Submitting category form with data:", formData);

  // Validate before sending
  if (!validateForm()) {
    console.warn("⚠️ Validation failed:", formErrors);
    return;
  }

  const formDataObj = new FormData();
  formDataObj.append("name", formData.name);
  formDataObj.append("description", formData.description);
  formDataObj.append("hsn", formData.hsn || "");
  if (formData.imageFile) {
    formDataObj.append("image", formData.imageFile);
  }

  // Log all FormData keys/values before sending
  console.group("📦 FormData contents");
  for (let [key, value] of formDataObj.entries()) {
    if (value instanceof File) {
      console.log(`${key}: [File] name=${value.name}, type=${value.type}, size=${value.size} bytes`);
    } else {
      console.log(`${key}: ${value}`);
    }
  }
  console.groupEnd();

  try {
    if (editingCategory) {
      console.log("✏️ Updating category:", editingCategory._id);
      await dispatch(
        updateCategory({ id: editingCategory._id, categoryData: formDataObj })
      ).unwrap();
    } else {
      console.log("➕ Creating new category");
      await dispatch(createCategory(formDataObj)).unwrap();
    }

    console.log("✅ Category submitted successfully");
    closeModal();
  } catch (error) {
    console.error("❌ Category submission error:", error);
  }
};



  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      imageFile: null,
      imagePreview: category.image || '', 
      hsn: category.hsn || ''
    });
    setFormErrors({});
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await dispatch(deleteCategory(id)).unwrap();
        console.log('Category deleted successfully');
      } catch (error) {
        console.error('Failed to delete category:', error);
      }
    }
  };


const handleToggleStatus = async (category) => {
  try {
    const formData = new FormData();
    formData.append('name', category.name);
    formData.append('description', category.description || '');
    formData.append('hsn', category.hsn || '');
    formData.append('isActive', (!category.isActive).toString());
    
    await dispatch(updateCategory({ 
      id: category._id, 
      categoryData: formData
    })).unwrap();
    console.log('Category status toggled successfully');
  } catch (error) {
    console.error('Failed to toggle category status:', error);
  }
};

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', imageFile: null, imagePreview: '', hsn: '' });
    setFormErrors({});
    dispatch(clearError());
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && categories.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <p>{error}</p>
          <button 
            onClick={() => dispatch(clearError())}
            className="text-red-500 hover:text-red-700 text-sm underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600 mt-2">Organize your products into categories</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          disabled={loading}
          className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
        >
          <PlusIcon className="w-5 h-5" />
          <span>Add Category</span>
        </button>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => (
          <div key={category._id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  {category.image ? (
                    <img 
                      src={category.image} 
                      alt={category.name}
                      className="w-6 h-6 object-cover rounded"
                    />
                  ) : <TagIcon className="w-6 h-6 text-orange-500" />}
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{category.name}</h3>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                    category.isActive !== false
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {category.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <p className="text-gray-600 mb-4">{category.description || 'No description'}</p>

            <div className="space-y-2 mb-4 text-sm text-gray-500">
              {category.hsn && <div><span className="font-medium">HSN:</span> {category.hsn}</div>}
              <div><span className="font-medium">ID:</span> {category._id}</div>
              <div className="flex justify-between">
                <div>Created: {formatDate(category.createdAt)}</div>
                {category.updatedAt && category.updatedAt !== category.createdAt && (
                  <div>Updated: {formatDate(category.updatedAt)}</div>
                )}
              </div>
            </div>

            <div className="flex space-x-2">
              <button onClick={() => handleEdit(category)} className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg flex items-center justify-center">
                <PencilIcon className="w-4 h-4" /><span>Edit</span>
              </button>
              <button onClick={() => handleToggleStatus(category)} className="flex-1 bg-yellow-50 text-yellow-600 px-3 py-2 rounded-lg flex items-center justify-center">
                <EyeIcon className="w-4 h-4" /><span>{category.isActive !== false ? 'Deactivate' : 'Activate'}</span>
              </button>
              <button onClick={() => handleDelete(category._id)} className="bg-red-50 text-red-600 px-3 py-2 rounded-lg flex items-center justify-center">
                <TrashIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g. Sweets, Snacks, etc."
                  />
                  {formErrors.name && <p className="text-sm text-red-600">{formErrors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category Image *</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setFormData({
                          ...formData,
                          imageFile: file,
                          imagePreview: URL.createObjectURL(file),
                        });
                      }
                    }}
                    className="w-full"
                  />
                  {formErrors.image && <p className="text-sm text-red-600">{formErrors.image}</p>}
                  {formData.imagePreview && (
                    <div className="mt-2">
                      <img src={formData.imagePreview} alt="Preview" className="h-16 w-16 object-cover rounded-lg border" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">HSN Code</label>
                  <input
                    type="text"
                    value={formData.hsn}
                    onChange={(e) => setFormData({...formData, hsn: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="e.g. 17049030"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button type="submit" className="flex-1 bg-orange-500 text-white py-2 px-4 rounded-lg">
                    {loading ? 'Saving...' : (editingCategory ? 'Update Category' : 'Add Category')}
                  </button>
                  <button type="button" onClick={closeModal} className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg">
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
