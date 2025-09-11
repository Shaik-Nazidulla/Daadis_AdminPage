// slices/discountsSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { discountsAPI } from '../../utils/api';

// Async thunks
export const fetchDiscounts = createAsyncThunk(
  'discounts/fetchDiscounts',
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await discountsAPI.getAllDiscounts(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const createDiscount = createAsyncThunk(
  'discounts/createDiscount',
  async (discountData, { rejectWithValue }) => {
    try {
      const response = await discountsAPI.createDiscount(discountData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const updateDiscount = createAsyncThunk(
  'discounts/updateDiscount',
  async ({ id, ...discountData }, { rejectWithValue }) => {
    try {
      const response = await discountsAPI.updateDiscount(id, discountData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const deleteDiscount = createAsyncThunk(
  'discounts/deleteDiscount',
  async (discountId, { rejectWithValue }) => {
    try {
      await discountsAPI.deleteDiscount(discountId);
      return discountId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

export const fetchExpiredDiscounts = createAsyncThunk(
  'discounts/fetchExpiredDiscounts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await discountsAPI.getExpiredDiscounts();
      return response.data;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Helper function to transform backend data to frontend format
const transformDiscountData = (backendData) => ({
  id: backendData._id,
  code: backendData.code,
  title: backendData.title || `${backendData.code} Discount`, // Fallback title
  description: backendData.description || '', // Add description if available
  type: backendData.discountType, // "percentage" or "fixed"
  value: backendData.value,
  minOrderAmount: backendData.minPurchase,
  maxDiscount: backendData.maxDiscount || null,
  validFrom: backendData.validFrom,
  validTo: backendData.validUntil,
  usageLimit: backendData.usageLimit,
  usageCount: backendData.usedCount,
  status: backendData.isActive ? 'active' : 'inactive',
  applicableCategories: backendData.applicableCategories || [],
  excludedProducts: backendData.excludedProducts || [],
  createdAt: backendData.createdAt,
  updatedAt: backendData.updatedAt
});

const initialState = {
  discounts: [],
  expiredDiscounts: [],
  loading: false,
  error: null,
  pagination: {
    total: 0,
    totalPages: 1,
    currentPage: 1,
    limit: 10
  }
};

const discountsSlice = createSlice({
  name: 'discounts',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    // Local toggle for optimistic updates
    toggleDiscountStatusLocal: (state, action) => {
      const discount = state.discounts.find(d => d.id === action.payload);
      if (discount) {
        discount.status = discount.status === 'active' ? 'inactive' : 'active';
      }
    },
    // Local increment for optimistic updates
    incrementUsageLocal: (state, action) => {
      const discount = state.discounts.find(d => d.id === action.payload);
      if (discount) {
        discount.usageCount += 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Discounts
      .addCase(fetchDiscounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDiscounts.fulfilled, (state, action) => {
        state.loading = false;
        state.discounts = action.payload.discounts.map(transformDiscountData);
        state.pagination = {
          total: action.payload.total,
          totalPages: action.payload.totalPages,
          currentPage: action.payload.currentPage,
          limit: action.payload.limit
        };
      })
      .addCase(fetchDiscounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Create Discount
      .addCase(createDiscount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createDiscount.fulfilled, (state, action) => {
        state.loading = false;
        const newDiscount = transformDiscountData(action.payload);
        state.discounts.unshift(newDiscount); // Add to beginning
      })
      .addCase(createDiscount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Update Discount
      .addCase(updateDiscount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateDiscount.fulfilled, (state, action) => {
        state.loading = false;
        const updatedDiscount = transformDiscountData(action.payload);
        const index = state.discounts.findIndex(d => d.id === updatedDiscount.id);
        if (index !== -1) {
          state.discounts[index] = updatedDiscount;
        }
      })
      .addCase(updateDiscount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Delete Discount
      .addCase(deleteDiscount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteDiscount.fulfilled, (state, action) => {
        state.loading = false;
        state.discounts = state.discounts.filter(d => d.id !== action.payload);
      })
      .addCase(deleteDiscount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Fetch Expired Discounts
      .addCase(fetchExpiredDiscounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpiredDiscounts.fulfilled, (state, action) => {
        state.loading = false;
        state.expiredDiscounts = action.payload.map(transformDiscountData);
      })
      .addCase(fetchExpiredDiscounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  clearError,
  setLoading,
  toggleDiscountStatusLocal,
  incrementUsageLocal
} = discountsSlice.actions;

export default discountsSlice.reducer;