// redux/slices/blogsSlice.js - Updated blogs slice with new API endpoints
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { blogsAPI } from '../../utils/api';

// Async thunks for API calls
export const fetchAllBlogs = createAsyncThunk(
  'blogs/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await blogsAPI.getAllBlogs();
      
      // Handle the case where API returns empty array or "No blogs found"
      if (!response) {
        return [];
      }
      
      // Handle different possible response structures
      let blogs = [];
      if (Array.isArray(response)) {
        blogs = response;
      } else if (response.data && Array.isArray(response.data)) {
        blogs = response.data;
      } else if (response.blogs && Array.isArray(response.blogs)) {
        blogs = response.blogs;
      }
      
      // Map old interface to consistent interface
      return blogs.map(blog => ({
        ...blog,
        id: blog._id || blog.id,
        _id: blog._id || blog.id,
        title: blog.title || blog.blogName || '',
        content: blog.content || blog.blogContent?.markup || '',
        author: blog.author || 'Admin',
        category: blog.category || 'General',
        featuredImage: blog.featuredImage || blog.blogImgUrl?.url || '',
        blogImgUrl: blog.blogImgUrl || { url: blog.featuredImage || '', publicId: '' },
        status: blog.status || 'published',
        createdAt: blog.createdAt || new Date().toISOString(),
        updatedAt: blog.updatedAt || new Date().toISOString(),
        excerpt: blog.excerpt || '',
        tags: blog.tags || [],
        views: blog.views || 0,
        likes: blog.likes || 0,
        blogContent: blog.blogContent || { markup: blog.content || '', design: {} },
        blogName: blog.blogName || blog.title || ''
      }));
      
    } catch (error) {
      console.error('fetchAllBlogs error:', error);
      
      // If it's a 404 with "No blogs found", return empty array
      if (error.status === 404 || error.message === 'No blogs found') {
        return [];
      }
      
      return rejectWithValue(error.message || 'Failed to fetch blogs');
    }
  }
);

export const fetchBlogById = createAsyncThunk(
  'blogs/fetchById',
  async (blogId, { rejectWithValue }) => {
    try {
      const response = await blogsAPI.getBlogById(blogId);
      
      let blog = response;
      if (response.data) {
        blog = response.data;
      }
      
      // Map old interface to consistent interface
      return {
        ...blog,
        id: blog._id || blog.id,
        _id: blog._id || blog.id,
        title: blog.title || blog.blogName || '',
        content: blog.content || blog.blogContent?.markup || '',
        author: blog.author || 'Admin',
        category: blog.category || 'General',
        featuredImage: blog.featuredImage || blog.blogImgUrl?.url || '',
        blogImgUrl: blog.blogImgUrl || { url: blog.featuredImage || '', publicId: '' },
        status: blog.status || 'published',
        createdAt: blog.createdAt || new Date().toISOString(),
        updatedAt: blog.updatedAt || new Date().toISOString(),
        excerpt: blog.excerpt || '',
        tags: blog.tags || [],
        views: blog.views || 0,
        likes: blog.likes || 0,
        blogContent: blog.blogContent || { markup: blog.content || '', design: {} },
        blogName: blog.blogName || blog.title || ''
      };
      
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch blog');
    }
  }
);

export const createBlogAsync = createAsyncThunk(
  'blogs/create',
  async (blogData, { rejectWithValue }) => {
    try {
      // Map interface for API compatibility
      const apiData = {
        blogName: blogData.title,
        title: blogData.title,
        content: blogData.content,
        author: blogData.author,
        category: blogData.category,
        featuredImage: blogData.featuredImage,
        featuredImageFile: blogData.featuredImageFile,
        excerpt: blogData.excerpt,
        tags: blogData.tags,
        status: blogData.status,
        metaTitle: blogData.metaTitle,
        metaDescription: blogData.metaDescription,
        blogContent: {
          markup: blogData.content,
          design: blogData.blogContent?.design || {}
        }
      };
      
      const response = await blogsAPI.createBlog(apiData);
      
      let blog = response;
      if (response.data) {
        blog = response.data;
      }
      
      return {
        ...blog,
        id: blog._id || blog.id,
        _id: blog._id || blog.id,
        title: blog.title || blog.blogName || '',
        content: blog.content || blog.blogContent?.markup || '',
        featuredImage: blog.featuredImage || blog.blogImgUrl?.url || '',
        blogImgUrl: blog.blogImgUrl || { url: blog.featuredImage || '', publicId: '' },
        blogContent: blog.blogContent || { markup: blog.content || '', design: {} },
        blogName: blog.blogName || blog.title || ''
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create blog');
    }
  }
);

export const updateBlogAsync = createAsyncThunk(
  'blogs/update',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      // Map interface for API compatibility
      const apiData = {
        blogName: updates.title,
        title: updates.title,
        content: updates.content,
        author: updates.author,
        category: updates.category,
        featuredImage: updates.featuredImage,
        featuredImageFile: updates.featuredImageFile,
        excerpt: updates.excerpt,
        tags: updates.tags,
        status: updates.status,
        metaTitle: updates.metaTitle,
        metaDescription: updates.metaDescription,
        blogContent: {
          markup: updates.content,
          design: updates.blogContent?.design || {}
        }
      };
      
      const response = await blogsAPI.updateBlog(id, apiData);
      
      let blog = response;
      if (response.data) {
        blog = response.data;
      }
      
      return {
        ...blog,
        id: blog._id || blog.id,
        _id: blog._id || blog.id,
        title: blog.title || blog.blogName || '',
        content: blog.content || blog.blogContent?.markup || '',
        featuredImage: blog.featuredImage || blog.blogImgUrl?.url || '',
        blogImgUrl: blog.blogImgUrl || { url: blog.featuredImage || '', publicId: '' },
        blogContent: blog.blogContent || { markup: blog.content || '', design: {} },
        blogName: blog.blogName || blog.title || ''
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update blog');
    }
  }
);

export const deleteBlogAsync = createAsyncThunk(
  'blogs/delete',
  async (blogId, { rejectWithValue }) => {
    try {
      await blogsAPI.deleteBlog(blogId);
      return blogId;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete blog');
    }
  }
);

const initialState = {
  blogs: [],
  categories: ['Recipes', 'Health', 'Festivals', 'Stories', 'Tips'],
  loading: false,
  error: null,
  currentBlog: null
};

const blogsSlice = createSlice({
  name: 'blogs',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentBlog: (state, action) => {
      state.currentBlog = action.payload;
    },
    clearCurrentBlog: (state) => {
      state.currentBlog = null;
    },
    // Keep local actions for immediate UI updates
    toggleBlogStatus: (state, action) => {
      const blog = state.blogs.find(blog => blog.id === action.payload || blog._id === action.payload);
      if (blog) {
        if (blog.status === 'published') {
          blog.status = 'draft';
          blog.publishedAt = null;
        } else {
          blog.status = 'published';
          blog.publishedAt = new Date().toISOString();
        }
      }
    },
    incrementBlogViews: (state, action) => {
      const blog = state.blogs.find(blog => blog.id === action.payload || blog._id === action.payload);
      if (blog) {
        blog.views = (blog.views || 0) + 1;
      }
    },
    toggleBlogLike: (state, action) => {
      const blog = state.blogs.find(blog => blog.id === action.payload || blog._id === action.payload);
      if (blog) {
        blog.likes = (blog.likes || 0) + 1;
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch all blogs
      .addCase(fetchAllBlogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllBlogs.fulfilled, (state, action) => {
        state.loading = false;
        state.blogs = action.payload;
        state.error = null;
      })
      .addCase(fetchAllBlogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Fetch blog by ID
      .addCase(fetchBlogById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBlogById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentBlog = action.payload;
      })
      .addCase(fetchBlogById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create blog
      .addCase(createBlogAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createBlogAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.blogs.unshift(action.payload);
      })
      .addCase(createBlogAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Update blog
      .addCase(updateBlogAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBlogAsync.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.blogs.findIndex(blog => 
          blog.id === action.payload.id || blog._id === action.payload._id
        );
        if (index !== -1) {
          state.blogs[index] = action.payload;
        }
      })
      .addCase(updateBlogAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Delete blog
      .addCase(deleteBlogAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBlogAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.blogs = state.blogs.filter(blog => 
          blog.id !== action.payload && blog._id !== action.payload
        );
      })
      .addCase(deleteBlogAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  clearError,
  setCurrentBlog,
  clearCurrentBlog,
  toggleBlogStatus,
  incrementBlogViews,
  toggleBlogLike
} = blogsSlice.actions;

export default blogsSlice.reducer;