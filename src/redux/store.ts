//store.ts
import { configureStore } from '@reduxjs/toolkit';
import productsReducer from './slices/productsSlice';
import categoriesReducer from './slices/categoriesSlice';
import discountsReducer from './slices/discountsSlice';
import blogsReducer from './slices/blogsSlice';
import ordersReducer from './slices/ordersSlice';
import authReducer from './slices/authSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    categories: categoriesReducer,
    discounts: discountsReducer,
    blogs: blogsReducer,
    orders: ordersReducer,
  },
});

export default store;