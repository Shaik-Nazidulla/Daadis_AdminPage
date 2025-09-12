// utils/api.js    (new api.js)
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://daadis-server.onrender.com';

// Enhanced API request function with comprehensive error handling
export const apiRequest = async (endpoint, options = {}) => {
  const token = localStorage.getItem('adminToken');
  const isFormData = options.body instanceof FormData;

  const config = {
    headers: {
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(!isFormData && { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
    ...options,
  };

  // If it's FormData, ensure we don't have any Content-Type header
  if (isFormData && config.headers['Content-Type']) {
    delete config.headers['Content-Type'];
  }

  // Enhanced logging for debugging
  console.group(`🌐 API Request: ${options.method || 'GET'} ${endpoint}`);
  console.log('Config:', {
    url: `${API_BASE_URL}${endpoint}`,
    method: options.method || 'GET',
    hasAuth: !!token,
    isFormData,
    headers: config.headers
  });

  if (isFormData) {
    console.log('📦 FormData contents:');
    for (let [key, value] of options.body.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}:`, {
          type: 'File',
          name: value.name,
          size: `${(value.size / 1024).toFixed(2)}KB`,
          type: value.type,
          lastModified: new Date(value.lastModified).toISOString()
        });
      } else {
        console.log(`  ${key}:`, value);
      }
    }
  } else if (options.body && typeof options.body === 'string') {
    try {
      console.log('📝 JSON body:', JSON.parse(options.body));
    } catch {
      console.log('📝 Raw body:', options.body);
    }
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    // Log response details
    console.log('📡 Response:', {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
      type: response.type,
      url: response.url
    });

    // Log response headers
    console.log('📋 Response Headers:');
    response.headers.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    let data;
    const contentType = response.headers.get('content-type');
    
    try {
      if (contentType && contentType.includes('application/json')) {
        data = await response.json();
        console.log('✅ Parsed JSON response:', data);
      } else {
        const textResponse = await response.text();
        console.log('📄 Text response:', textResponse);
        
        // Try to parse as JSON anyway (some servers send JSON with wrong content-type)
        try {
          data = JSON.parse(textResponse);
          console.log('✅ Successfully parsed text as JSON:', data);
        } catch {
          data = textResponse ? { message: textResponse } : { success: response.ok };
        }
      }
    } catch (parseError) {
      console.error('❌ Response parsing error:', parseError);
      
      // Try to get raw text as fallback
      try {
        const fallbackText = await response.text();
        console.log('📄 Fallback raw response:', fallbackText);
        data = { 
          message: `Failed to parse response: ${parseError.message}`,
          status: response.status,
          rawResponse: fallbackText
        };
      } catch (textError) {
        console.error('❌ Could not read response as text:', textError);
        data = { 
          message: `Complete response parsing failure: ${parseError.message}`,
          status: response.status 
        };
      }
    }

    if (!response.ok) {
      // Handle authentication errors
      if (response.status === 401 && token) {
        console.warn('🔐 Authentication failed, clearing token');
        localStorage.removeItem('adminToken');
        window.location.href = '/login';
        console.groupEnd();
        return;
      }
      
      // Enhanced error message extraction
      let errorMessage = 'Request failed';
      let errorDetails = {};
      
      if (data) {
        if (typeof data === 'string') {
          errorMessage = data;
        } else if (data.message) {
          errorMessage = data.message;
          errorDetails = { ...data };
          delete errorDetails.message;
        } else if (data.error) {
          errorMessage = data.error;
          errorDetails = { ...data };
          delete errorDetails.error;
        } else if (data.errors && Array.isArray(data.errors)) {
          errorMessage = data.errors.join(', ');
          errorDetails = { ...data };
        } else if (data.details) {
          errorMessage = data.details;
          errorDetails = { ...data };
        } else {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          errorDetails = data;
        }
      } else {
        errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      }
      
      const detailedError = new Error(errorMessage);
      detailedError.status = response.status;
      detailedError.statusText = response.statusText;
      detailedError.responseData = data;
      detailedError.endpoint = endpoint;
      detailedError.requestMethod = options.method || 'GET';
      
      console.error('❌ API Error Details:', {
        endpoint,
        method: options.method || 'GET',
        status: response.status,
        statusText: response.statusText,
        errorMessage,
        responseData: data,
        errorDetails,
        requestBody: isFormData ? 'FormData (logged above)' : options.body,
        timestamp: new Date().toISOString()
      });
      
      console.groupEnd();
      throw detailedError;
    }

    console.log('✅ Request completed successfully');
    console.groupEnd();
    return data;

  } catch (error) {
    // Network or other errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('🌐 Network Error:', {
        message: 'Failed to connect to server',
        endpoint,
        baseUrl: API_BASE_URL,
        possibleCauses: [
          'Server is down',
          'Network connectivity issues',
          'CORS configuration problems',
          'Invalid API base URL'
        ]
      });
      
      const networkError = new Error('Unable to connect to server. Please check your internet connection and try again.');
      networkError.isNetworkError = true;
      networkError.originalError = error;
      console.groupEnd();
      throw networkError;
    }
    
    // If it's already our detailed error, just re-throw it
    if (error.status || error.responseData) {
      console.groupEnd();
      throw error;
    }
    
    // Unexpected error
    console.error('❌ Unexpected API Error:', {
      endpoint,
      error: error.message,
      stack: error.stack,
      requestOptions: {
        ...options,
        body: isFormData ? 'FormData (logged above)' : options.body
      },
      timestamp: new Date().toISOString()
    });
    
    const unexpectedError = new Error(`Unexpected error: ${error.message}`);
    unexpectedError.originalError = error;
    unexpectedError.endpoint = endpoint;
    console.groupEnd();
    throw unexpectedError;
  }
};

// ----------------- AUTH -----------------
export const authAPI = {
  login: (credentials) =>
    apiRequest('/admin/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    }),

  getProfile: () => apiRequest('/admin/profile'),

  updateProfile: (profileData) =>
    apiRequest('/admin/profile', {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    }),

  isAuthenticated: () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return false;
    try {
      return token.length > 0;
    } catch {
      return false;
    }
  },
};

// ----------------- PRODUCTS -----------------
export const productsAPI = {
  // Get all products with pagination, search, category
  getAllProducts: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);
    if (params.search) queryParams.append("search", params.search);
    if (params.category) queryParams.append("category", params.category);

    const queryString = queryParams.toString();
    return apiRequest(
      `/product/products${queryString ? `?${queryString}` : ""}`
    );
  },

  // Get products by category
  getProductsByCategory: (categoryId, params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append("page", params.page);
    if (params.limit) queryParams.append("limit", params.limit);

    const queryString = queryParams.toString();
    return apiRequest(
      `/product/category/${categoryId}${queryString ? `?${queryString}` : ""}`
    );
  },

  // Get single product
  getProductById: (productId) => apiRequest(`/product/${productId}`),

  // Create product with enhanced error handling and debugging
  // Create product with proper handling of optional fields
// Create product - matching the exact structure that works in Postman
createProduct: (productData) => {
    const formData = new FormData();

    // Required fields
    formData.append("name", productData.name);
    formData.append("code", productData.code);
    formData.append("category", productData.category);
    formData.append("price", Number(productData.price));
    formData.append("stock", Number(productData.stock));
    formData.append("vegetarian", productData.vegetarian ? "true" : "false");

    // Optional fields
    if (productData.description && productData.description.trim()) {
      formData.append("description", productData.description.trim());
    }

    // Tags - send as JSON string (backend expects this format)
    if (productData.tags && Array.isArray(productData.tags)) {
      const validTags = productData.tags.filter((tag) => tag && tag.trim());
      if (validTags.length > 0) {
        formData.append("tags", JSON.stringify(validTags));
      }
    }

    // Weight fields (flat structure as expected by backend)
    if (productData.weight && productData.weight.number) {
      formData.append("weightNumber", parseFloat(productData.weight.number));
      formData.append("weightUnit", productData.weight.unit || "g");
    }

    // Dimensions fields (flat structure as expected by backend)
    if (productData.dimensions) {
      if (productData.dimensions.l) formData.append("dimensionsL", parseFloat(productData.dimensions.l));
      if (productData.dimensions.b) formData.append("dimensionsB", parseFloat(productData.dimensions.b));
      if (productData.dimensions.h) formData.append("dimensionsH", parseFloat(productData.dimensions.h));
    }

    // Multiple images handling - append all images with the same field name
    if (productData.imageFiles && Array.isArray(productData.imageFiles)) {
      productData.imageFiles.forEach((file) => {
        if (file instanceof File) {
          formData.append("images", file); // Backend expects "images" field name
        }
      });
    }

    // Enhanced debugging
    console.log("CREATE PRODUCT - Processing data:");
    console.log("Image files count:", productData.imageFiles?.length || 0);
    
    console.log("FormData contents:");
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${(value.size/1024).toFixed(1)}KB, ${value.type})`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }

    return apiRequest("/product/create", {
      method: "POST",
      body: formData,
    });
  },

  // Enhanced updateProduct with proper handling of existing and new images
  updateProduct: (productId, productData) => {
    const formData = new FormData();

    // Core fields
    if (productData.name) formData.append("name", productData.name);
    if (productData.code) formData.append("code", productData.code);
    if (productData.category) formData.append("category", productData.category);
    if (productData.price !== undefined) formData.append("price", Number(productData.price));
    if (productData.stock !== undefined) formData.append("stock", Number(productData.stock));
    if (productData.vegetarian !== undefined) {
      formData.append("vegetarian", productData.vegetarian ? "true" : "false");
    }
    if (productData.description !== undefined) {
      formData.append("description", productData.description);
    }

    // Weight - using flat structure
    if (productData.weight) {
      if (productData.weight.number) formData.append("weightNumber", parseFloat(productData.weight.number));
      if (productData.weight.unit) formData.append("weightUnit", productData.weight.unit);
    }

    // Dimensions - using flat structure  
    if (productData.dimensions) {
      if (productData.dimensions.l) formData.append("dimensionsL", parseFloat(productData.dimensions.l));
      if (productData.dimensions.b) formData.append("dimensionsB", parseFloat(productData.dimensions.b));
      if (productData.dimensions.h) formData.append("dimensionsH", parseFloat(productData.dimensions.h));
    }

    // Tags - send as JSON string
    if (Array.isArray(productData.tags)) {
      const validTags = productData.tags.filter(tag => tag && tag.trim());
      if (validTags.length > 0) {
        formData.append("tags", JSON.stringify(validTags));
      }
    }

    // Existing images - send as JSON array
    if (Array.isArray(productData.existingImages)) {
      formData.append("existingImages", JSON.stringify(productData.existingImages));
    }

    // New images - append each file
    if (productData.images && Array.isArray(productData.images)) {
      productData.images.forEach((file) => {
        if (file instanceof File) {
          formData.append("images", file);
        }
      });
    }

    // Enhanced debugging
    console.log("UPDATE PRODUCT - Processing data:");
    console.log("Product ID:", productId);
    console.log("Existing images count:", productData.existingImages?.length || 0);
    console.log("New images count:", productData.images?.length || 0);
    
    console.log("FormData contents:");
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`${key}: File(${value.name}, ${(value.size/1024).toFixed(1)}KB, ${value.type})`);
      } else {
        console.log(`${key}: ${value}`);
      }
    }

    return apiRequest(`/product/update/${productId}`, {
      method: "PATCH",
      body: formData,
    });
  },

  // Delete product
  deleteProduct: (productId) =>
    apiRequest(`/product/delete/${productId}`, { method: "DELETE" }),
};

// ... (rest of the APIs remain the same - categories, discounts, orders, blogs)

// ----------------- CATEGORIES -----------------
export const categoriesAPI = {
  createCategory: (formData) => {
    // formData is already a FormData object from the component
    // Just pass it directly to the API request
    return apiRequest('/category/create', {
      method: 'POST',
      body: formData, // Pass the FormData directly
    });
  },

  updateCategory: (categoryId, formData) => {
    // formData is already a FormData object from the component
    // Just pass it directly to the API request
    return apiRequest(`/category/${categoryId}`, {
      method: 'PUT',
      body: formData, // Pass the FormData directly
    });
  },

  deleteCategory: (categoryId) =>
    apiRequest(`/category/${categoryId}`, { method: 'DELETE' }),

  getAllCategories: () => apiRequest('/category'),
  getCategoryById: (categoryId) => apiRequest(`/category/${categoryId}`),
};
// ----------------- DISCOUNTS -----------------
export const discountsAPI = {
  // Get all discounts
  getAllDiscounts: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const queryString = queryParams.toString();
    return apiRequest(`/discount/all${queryString ? `?${queryString}` : ''}`);
  },

  // Create new discount
  createDiscount: (discountData) => {
    // Transform frontend data to match backend API structure
    const payload = {
      code: discountData.code,
      type: "coupon", // Based on your API, this seems to be fixed as "coupon"
      discountType: discountData.type, // "percentage" or "fixed"
      value: parseFloat(discountData.value),
      minPurchase: parseFloat(discountData.minOrderAmount),
      maxDiscount: discountData.maxDiscount ? parseFloat(discountData.maxDiscount) : null,
      validFrom: discountData.validFrom,
      validUntil: discountData.validTo,
      usageLimit: parseInt(discountData.usageLimit),
      applicableCategories: discountData.applicableCategories.includes('all') 
        ? [] 
        : discountData.applicableCategories,
      excludedProducts: [], // Add this field if needed in the future
      isActive: discountData.status === 'active'
    };

    return apiRequest('/discount', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  // Update discount
  updateDiscount: (discountId, discountData) => {
    const payload = {
      code: discountData.code,
      type: "coupon",
      discountType: discountData.type,
      value: parseFloat(discountData.value),
      minPurchase: parseFloat(discountData.minOrderAmount),
      maxDiscount: discountData.maxDiscount ? parseFloat(discountData.maxDiscount) : null,
      validFrom: discountData.validFrom,
      validUntil: discountData.validTo,
      usageLimit: parseInt(discountData.usageLimit),
      applicableCategories: discountData.applicableCategories.includes('all') 
        ? [] 
        : discountData.applicableCategories,
      excludedProducts: [],
      isActive: discountData.status === 'active'
    };

    return apiRequest(`/discount/${discountId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  // Delete discount
  deleteDiscount: (discountId) =>
    apiRequest(`/discount/${discountId}`, { method: 'DELETE' }),

  // Get expired discounts
  getExpiredDiscounts: () => apiRequest('/discount/expired'),

  // Get single discount by ID
  getDiscountById: (discountId) => apiRequest(`/discount/${discountId}`),
};

// ----------------- ORDERS -----------------
export const ordersAPI = {
  // Get all orders
  getAllOrders: (params = {}) => {
    const queryParams = new URLSearchParams();
    if (params.page) queryParams.append('page', params.page);
    if (params.limit) queryParams.append('limit', params.limit);
    
    const queryString = queryParams.toString();
    return apiRequest(`/order/all-orders${queryString ? `?${queryString}` : ''}`);
  },

  // Get order by ID
  getOrderById: (orderId) => apiRequest(`/order/order/${orderId}`),

  // Update order status
  updateOrderStatus: (orderId, status) => 
    apiRequest(`/order/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),
};

// ----------------- BLOGS - FIXED VERSION -----------------
export const blogsAPI = {
  getAllBlogs: () => apiRequest('/blog'),
  getBlogById: (blogId) => apiRequest(`/blog/${blogId}`),

  createBlog: async (blogData) => {
    // Check if we have file upload or just URL
    if (blogData.featuredImageFile && blogData.featuredImageFile instanceof File) {
      // Use FormData for file uploads
      const formData = new FormData();
      
      // Core fields
      formData.append('title', blogData.title || '');
      formData.append('content', blogData.content || '');
      formData.append('author', blogData.author || '');
      formData.append('category', blogData.category || '');
      formData.append('status', blogData.status || 'draft');
      
      // Optional fields
      if (blogData.excerpt) formData.append('excerpt', blogData.excerpt);
      if (blogData.metaTitle) formData.append('metaTitle', blogData.metaTitle);
      if (blogData.metaDescription) formData.append('metaDescription', blogData.metaDescription);

      // Handle tags array
      if (Array.isArray(blogData.tags) && blogData.tags.length > 0) {
        blogData.tags.forEach((tag, index) => {
          if (tag && tag.trim()) {
            formData.append(`tags[${index}]`, tag.trim());
          }
        });
      }

      // Try multiple possible field names - your server might expect a different one
      // Most common options based on backend configurations:
      
      // Option 1: Try the most common field names first
      const imageFieldNames = ['image', 'file', 'featuredImage', 'blogImage', 'upload'];
      
      // For now, let's try 'image' first (most common)
      formData.append('image', blogData.featuredImageFile);
      
      console.log('Creating blog with file upload - trying field name: image');
      console.log('FormData entries:');
      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          console.log(`  ${key}: File(${value.name}, ${(value.size/1024).toFixed(2)}KB, ${value.type})`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      // First attempt with 'image' field
      try {
        return await apiRequest('/blog/create', {
          method: 'POST',
          body: formData,
        });
      } catch (error) {
        console.log('Failed with image field, trying featuredImage...');
        
        // Remove the 'image' entry and try 'featuredImage'
        formData.delete('image');
        formData.append('featuredImage', blogData.featuredImageFile);
        
        try {
          return await apiRequest('/blog/create', {
            method: 'POST',
            body: formData,
          });
        } catch (error2) {
          console.log('Failed with featuredImage field, trying file...');
          
          // Remove and try 'file'
          formData.delete('featuredImage');
          formData.append('file', blogData.featuredImageFile);
          
          try {
            return await apiRequest('/blog/create', {
              method: 'POST',
              body: formData,
            });
          } catch (error3) {
            console.log('Failed with file field, trying blogImage...');
            
            // Remove and try 'blogImage' (your original)
            formData.delete('file');
            formData.append('blogImage', blogData.featuredImageFile);
            
            // This will throw if it fails - let it bubble up
            return await apiRequest('/blog/create', {
              method: 'POST',
              body: formData,
            });
          }
        }
      }
      
    } else {
      // Use JSON for URL-based images (unchanged)
      const payload = {
        title: blogData.title,
        content: blogData.content,
        author: blogData.author,
        category: blogData.category,
        status: blogData.status,
        excerpt: blogData.excerpt,
        featuredImage: blogData.featuredImage,
        metaTitle: blogData.metaTitle,
        metaDescription: blogData.metaDescription,
        tags: blogData.tags || []
      };

      console.log('Creating blog with URL image');
      console.log('JSON payload:', payload);

      return apiRequest('/blog/create', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
    }
  },

  // Update blog - FIXED to handle both file and URL updates
  updateBlog: (blogId, blogData) => {
    // Check if we have file upload or just URL
    if (blogData.featuredImageFile && blogData.featuredImageFile instanceof File) {
      // Use FormData for file uploads
      const formData = new FormData();
      
      // Core fields
      if (blogData.title) formData.append('title', blogData.title);
      if (blogData.content) formData.append('content', blogData.content);
      if (blogData.author) formData.append('author', blogData.author);
      if (blogData.category) formData.append('category', blogData.category);
      if (blogData.status) formData.append('status', blogData.status);
      if (blogData.excerpt) formData.append('excerpt', blogData.excerpt);
      if (blogData.metaTitle) formData.append('metaTitle', blogData.metaTitle);
      if (blogData.metaDescription) formData.append('metaDescription', blogData.metaDescription);

      // Handle tags array
      if (Array.isArray(blogData.tags) && blogData.tags.length > 0) {
        blogData.tags.forEach((tag, index) => {
          if (tag && tag.trim()) {
            formData.append(`tags[${index}]`, tag.trim());
          }
        });
      }

      // The image file
      formData.append('blogImage', blogData.featuredImageFile);

      console.log('🖼️ Updating blog with file upload');

      return apiRequest(`/blog/edit/${blogId}`, {
        method: 'PUT',
        body: formData,
      });
      
    } else {
      // Use JSON for URL-based images or no image changes
      const payload = {};
      
      if (blogData.title) payload.title = blogData.title;
      if (blogData.content) payload.content = blogData.content;
      if (blogData.author) payload.author = blogData.author;
      if (blogData.category) payload.category = blogData.category;
      if (blogData.status) payload.status = blogData.status;
      if (blogData.excerpt) payload.excerpt = blogData.excerpt;
      if (blogData.featuredImage) payload.featuredImage = blogData.featuredImage;
      if (blogData.metaTitle) payload.metaTitle = blogData.metaTitle;
      if (blogData.metaDescription) payload.metaDescription = blogData.metaDescription;
      if (blogData.tags) payload.tags = blogData.tags;

      console.log('🌐 Updating blog with JSON');
      console.log('📋 JSON payload:', payload);

      return apiRequest(`/blog/edit/${blogId}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
    }
  },

  // Delete blog
  deleteBlog: (blogId) => apiRequest(`/blog/delete/${blogId}`, { method: 'DELETE' }),
};

export default apiRequest;