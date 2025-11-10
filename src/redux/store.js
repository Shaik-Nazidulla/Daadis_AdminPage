//store.ts
import { configureStore } from '@reduxjs/toolkit';
import productsReducer from './slices/productsSlice';
import categoriesReducer from './slices/categoriesSlice';
import discountsReducer from './slices/discountsSlice';
import blogsReducer from './slices/blogsSlice';
import ordersReducer from './slices/ordersSlice';
import authReducer from './slices/authSlice';
import manufacturerReducer from './slices/manufacturerSlice';
export const store = configureStore({
  reducer: {
    auth: authReducer,
    products: productsReducer,
    categories: categoriesReducer,
    discounts: discountsReducer,
    blogs: blogsReducer,
    orders: ordersReducer,
    manufacturer: manufacturerReducer
  },
});

export default store;