import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { manufacturerAPI } from '../../utils/api';

// Initial state
const initialState = {
  manufacturers: [],
  currentManufacturer: null,
  loading: false,
  error: null,
  success: false,
};

// Async thunks

// Get all manufacturers
export const fetchManufacturers = createAsyncThunk(
  'manufacturer/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await manufacturerAPI.getAllManufacturers();
      return response.data.response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch manufacturers');
    }
  }
);

// Get manufacturer by ID
export const fetchManufacturerById = createAsyncThunk(
  'manufacturer/fetchById',
  async (id, { rejectWithValue }) => {
    try {
      const response = await manufacturerAPI.getManufacturerById(id);
      return response.data.response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch manufacturer');
    }
  }
);

// Create manufacturer
export const createManufacturer = createAsyncThunk(
  'manufacturer/create',
  async (manufacturerData, { rejectWithValue }) => {
    try {
      const response = await manufacturerAPI.createManufacturer(manufacturerData);
      return response.data.response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to create manufacturer');
    }
  }
);

// Update manufacturer
export const updateManufacturer = createAsyncThunk(
  'manufacturer/update',
  async ({ id, manufacturerData }, { rejectWithValue }) => {
    try {
      const response = await manufacturerAPI.updateManufacturer(id, manufacturerData);
      return response.data.response;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to update manufacturer');
    }
  }
);

// Delete manufacturer
export const deleteManufacturer = createAsyncThunk(
  'manufacturer/delete',
  async (id, { rejectWithValue }) => {
    try {
      const response = await manufacturerAPI.deleteManufacturer(id);
      return { id, response: response.data.response };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to delete manufacturer');
    }
  }
);

// Slice
const manufacturerSlice = createSlice({
  name: 'manufacturer',
  initialState,
  reducers: {
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
    // Clear success
    clearSuccess: (state) => {
      state.success = false;
    },
    // Clear current manufacturer
    clearCurrentManufacturer: (state) => {
      state.currentManufacturer = null;
    },
    // Reset state
    resetManufacturerState: (state) => {
      state.loading = false;
      state.error = null;
      state.success = false;
      state.currentManufacturer = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch all manufacturers
    builder
      .addCase(fetchManufacturers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchManufacturers.fulfilled, (state, action) => {
        state.loading = false;
        state.manufacturers = action.payload;
        state.error = null;
      })
      .addCase(fetchManufacturers.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Fetch manufacturer by ID
    builder
      .addCase(fetchManufacturerById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchManufacturerById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentManufacturer = action.payload;
        state.error = null;
      })
      .addCase(fetchManufacturerById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Create manufacturer
    builder
      .addCase(createManufacturer.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(createManufacturer.fulfilled, (state, action) => {
        state.loading = false;
        state.manufacturers.push(action.payload);
        state.success = true;
        state.error = null;
      })
      .addCase(createManufacturer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });

    // Update manufacturer
    builder
      .addCase(updateManufacturer.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(updateManufacturer.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.manufacturers.findIndex(
          (manufacturer) => manufacturer._id === action.payload._id
        );
        if (index !== -1) {
          state.manufacturers[index] = action.payload;
        }
        state.currentManufacturer = action.payload;
        state.success = true;
        state.error = null;
      })
      .addCase(updateManufacturer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });

    // Delete manufacturer
    builder
      .addCase(deleteManufacturer.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.success = false;
      })
      .addCase(deleteManufacturer.fulfilled, (state, action) => {
        state.loading = false;
        state.manufacturers = state.manufacturers.filter(
          (manufacturer) => manufacturer._id !== action.payload.id
        );
        state.success = true;
        state.error = null;
      })
      .addCase(deleteManufacturer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.success = false;
      });
  },
});

// Export actions
export const {
  clearError,
  clearSuccess,
  clearCurrentManufacturer,
  resetManufacturerState,
} = manufacturerSlice.actions;

// Export reducer
export default manufacturerSlice.reducer;