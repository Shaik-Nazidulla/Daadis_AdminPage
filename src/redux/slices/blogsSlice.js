import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { blogsAPI } from '../../utils/api';

export const fetchAllBlogs = createAsyncThunk(
  'blogs/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const data = await blogsAPI.getAllBlogs();
      // API returns { blogs: [...] } or array directly
      const raw = data.data || data.blogs || data || [];
      return raw.map(blog => ({
        ...blog,
        id: blog._id,   // ensure `id` exists
      }));
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const createBlogAsync = createAsyncThunk(
  'blogs/create',
  async ({ formData }, { rejectWithValue }) => {
    try {
      const response = await blogsAPI.createBlog({ formData });
      // response.blogData contains the created blog
      return response.blogData || response.data || response;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const updateBlogAsync = createAsyncThunk(
  'blogs/update',
  async ({ id, updates }, { rejectWithValue }) => {
    try {
      const response = await blogsAPI.updateBlog({ id, updates });
      return response.blogData || response.data || response;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

export const deleteBlogAsync = createAsyncThunk(
  'blogs/delete',
  async (id, { rejectWithValue }) => {
    try {
      await blogsAPI.deleteBlog(id);
      return id;
    } catch (err) {
      return rejectWithValue(err.message);
    }
  }
);

const blogsSlice = createSlice({
  name: 'blogs',
  initialState: {
    blogs: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: builder => {
    builder
      // fetchAllBlogs
      .addCase(fetchAllBlogs.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllBlogs.fulfilled, (state, action) => {
        state.loading = false;
        state.blogs = action.payload;
      })
      .addCase(fetchAllBlogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // createBlogAsync
      .addCase(createBlogAsync.pending, state => {
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
      // updateBlogAsync
      .addCase(updateBlogAsync.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateBlogAsync.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.blogs.findIndex(b => b.id === action.payload.id);
        if (idx !== -1) state.blogs[idx] = action.payload;
      })
      .addCase(updateBlogAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // deleteBlogAsync
      .addCase(deleteBlogAsync.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteBlogAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.blogs = state.blogs.filter(b => b.id !== action.payload);
      })
      .addCase(deleteBlogAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export default blogsSlice.reducer;
