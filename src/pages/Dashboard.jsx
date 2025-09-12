// pages/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { 
  ShoppingBagIcon, 
  TagIcon, 
  ShoppingCartIcon,
  CurrencyRupeeIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  CalendarDaysIcon,
  TruckIcon,
  CheckCircleIcon,
  UserGroupIcon,
  SparklesIcon,
  GiftIcon,
  ChartBarIcon,
  BellIcon
} from '@heroicons/react/24/outline';
import { fetchProducts } from '../redux/slices/productsSlice';
import { fetchOrders } from '../redux/slices/ordersSlice';
import { fetchCategories } from '../redux/slices/categoriesSlice';
import { fetchDiscounts } from '../redux/slices/discountsSlice';

const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const products = useSelector(state => state.products.products);
  const categories = useSelector(state => state.categories.categories);
  const orders = useSelector(state => state.orders.orders);
  const discounts = useSelector(state => state.discounts.discounts);
  const [timeRange, setTimeRange] = useState('today'); // today, week, month, annual, all

  // Fetch data on component mount
  useEffect(() => {
    dispatch(fetchProducts({ page: 1, limit: 100 }));
    dispatch(fetchOrders({ page: 1, limit: 100 }));
    dispatch(fetchCategories());
    dispatch(fetchDiscounts());
  }, [dispatch]);

  // Calculate time-based metrics with expanded ranges
  const getDateRange = (range) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (range) {
      case 'today':
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
      case 'week':
        const weekStart = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { start: weekStart, end: now };
      case 'month':
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return { start: monthStart, end: now };
      case 'annual':
        const yearStart = new Date(today.getFullYear(), 0, 1);
        return { start: yearStart, end: now };
      case 'all':
        // Get the earliest order date or use a very old date
        const earliestOrder = orders.length > 0 
          ? new Date(Math.min(...orders.map(o => new Date(o.createdAt))))
          : new Date('2020-01-01');
        return { start: earliestOrder, end: now };
      default:
        return { start: today, end: new Date(today.getTime() + 24 * 60 * 60 * 1000) };
    }
  };

  const { start, end } = getDateRange(timeRange);
  const timeFilteredOrders = orders.filter(order => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= start && orderDate <= end;
  });

  // Enhanced statistics calculations
  const stats = {
    totalProducts: products.length,
    activeCategories: categories.filter(cat => cat.isActive !== false).length,
    totalOrders: orders.length,
    todaysOrders: timeFilteredOrders.length,
    pendingOrders: orders.filter(o => o.status === 'pending').length,
    processingOrders: orders.filter(o => ['processing', 'shipped'].includes(o.status)).length,
    completedOrders: orders.filter(o => o.status === 'delivered').length,
    totalRevenue: orders.filter(o => !['cancelled', 'failed', 'returned'].includes(o.status)).reduce((sum, o) => sum + o.total, 0),
    todaysRevenue: timeFilteredOrders.filter(o => !['cancelled', 'failed', 'returned'].includes(o.status)).reduce((sum, o) => sum + o.total, 0),
    lowStockProducts: products.filter(p => p.stock <= 10).length,
    outOfStockProducts: products.filter(p => p.stock === 0).length,
    activeDiscounts: discounts.filter(d => d.status === 'active').length,
    averageOrderValue: orders.length > 0 ? Math.round(orders.reduce((sum, o) => sum + o.total, 0) / orders.length) : 0
  };

  // Quick Actions handlers
  const handleQuickAction = (action) => {
    switch (action) {
      case 'add-product':
        // Navigate to products page and trigger add modal
        navigate('/products', { state: { openAddModal: true } });
        break;
      case 'new-category':
        // Navigate to categories page and trigger add modal
        navigate('/categories', { state: { openAddModal: true } });
        break;
      case 'view-orders':
        // Navigate to orders page
        navigate('/orders');
        break;
      case 'create-offer':
        // Navigate to discounts page and trigger add modal
        navigate('/discounts', { state: { openAddModal: true } });
        break;
      default:
        console.log('Unknown action:', action);
    }
  };

  // Top performing products
  const getTopProducts = () => {
    const productSales = {};
    orders.forEach(order => {
      order.items.forEach(item => {
        if (productSales[item.productId]) {
          productSales[item.productId].quantity += item.quantity;
          productSales[item.productId].revenue += item.itemTotal;
        } else {
          productSales[item.productId] = {
            name: item.productName,
            quantity: item.quantity,
            revenue: item.itemTotal,
            image: item.productImage
          };
        }
      });
    });

    return Object.entries(productSales)
      .sort(([,a], [,b]) => b.quantity - a.quantity)
      .slice(0, 5)
      .map(([id, data]) => ({ id, ...data }));
  };

  // Recent activity feed
  const getRecentActivity = () => {
    const activities = [];
    
    // Recent orders
    orders.slice(0, 3).forEach(order => {
      activities.push({
        type: 'order',
        message: `New order #${order.orderNumber} from ${order.shippingAddress.name}`,
        time: order.createdAt,
        status: order.status,
        amount: order.total
      });
    });

    // Low stock alerts
    products.filter(p => p.stock <= 5 && p.stock > 0).slice(0, 2).forEach(product => {
      activities.push({
        type: 'stock',
        message: `Low stock alert: ${product.name} (${product.stock} left)`,
        time: new Date(),
        status: 'warning'
      });
    });

    // Out of stock alerts
    products.filter(p => p.stock === 0).slice(0, 2).forEach(product => {
      activities.push({
        type: 'stock',
        message: `Out of stock: ${product.name}`,
        time: new Date(),
        status: 'error'
      });
    });

    return activities.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 8);
  };

  // Format time range display
  const getTimeRangeDisplay = () => {
    switch (timeRange) {
      case 'today': return "Today's";
      case 'week': return "This Week's";
      case 'month': return "This Month's";
      case 'annual': return "This Year's";
      case 'all': return "Overall";
      default: return "Today's";
    }
  };

  const mainStats = [
    {
      title: `${getTimeRangeDisplay()} Orders`,
      value: stats.todaysOrders,
      icon: ShoppingCartIcon,
      change: `${stats.todaysOrders > 0 ? '+' : ''}${stats.todaysOrders}`,
      changeType: stats.todaysOrders > 0 ? 'positive' : 'neutral',
      subtitle: `Total: ${stats.totalOrders}`
    },
    {
      title: `${getTimeRangeDisplay()} Revenue`,
      value: `₹${stats.todaysRevenue.toLocaleString()}`,
      icon: CurrencyRupeeIcon,
      change: `₹${stats.averageOrderValue} avg`,
      changeType: 'positive',
      subtitle: `Total: ₹${stats.totalRevenue.toLocaleString()}`
    },
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: ShoppingBagIcon,
      change: `${stats.lowStockProducts} low stock`,
      changeType: stats.lowStockProducts > 0 ? 'warning' : 'positive',
      subtitle: `${stats.outOfStockProducts} out of stock`
    },
    {
      title: 'Active Categories',
      value: stats.activeCategories,
      icon: TagIcon,
      change: `${categories.length} total`,
      changeType: 'positive',
      subtitle: `${stats.activeDiscounts} active offers`
    }
  ];

  const orderStatusCards = [
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: ClockIcon,
      color: 'yellow',
      description: 'Awaiting confirmation'
    },
    {
      title: 'Processing',
      value: stats.processingOrders,
      icon: TruckIcon,
      color: 'blue',
      description: 'Being prepared & shipped'
    },
    {
      title: 'Completed',
      value: stats.completedOrders,
      icon: CheckCircleIcon,
      color: 'green',
      description: 'Successfully delivered'
    }
  ];

  const recentOrders = orders.slice(0, 6);
  const topProducts = getTopProducts();
  const recentActivity = getRecentActivity();

  const formatTime = (timeStr) => {
    const now = new Date();
    const time = new Date(timeStr);
    const diffMinutes = Math.floor((now - time) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`;
    return `${Math.floor(diffMinutes / 1440)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-orange-500 p-6 rounded-lg shadow-sm text-white">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Welcome to Daadi's Dashboard</h1>
            <p className="mt-2 opacity-90">Sweet moments, sweeter business - Here's your {timeRange === 'all' ? 'overall' : timeRange} overview</p>
          </div>
          <div className="flex items-center space-x-4">
            <select 
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="bg-white bg-opacity-20 border border-white border-opacity-30 text-black rounded-lg px-3 py-2 text-sm"
            >
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="annual">Annual</option>
              <option value="all">All (Overall)</option>
            </select>
            <SparklesIcon className="w-8 h-8 animate-pulse" />
          </div>
        </div>
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {mainStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-orange-400">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    <span className={`text-sm ${
                      stat.changeType === 'positive' ? 'text-green-600' :
                      stat.changeType === 'warning' ? 'text-yellow-600' :
                      'text-gray-600'
                    }`}>
                      {stat.change}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
                </div>
                <div className="p-3 bg-orange-50 rounded-lg">
                  <Icon className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Order Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {orderStatusCards.map((card, index) => {
          const Icon = card.icon;
          const colorClasses = {
            yellow: 'bg-yellow-50 border-yellow-200 text-yellow-700',
            blue: 'bg-blue-50 border-blue-200 text-blue-700',
            green: 'bg-green-50 border-green-200 text-green-700'
          };

          return (
            <div key={index} className={`p-6 rounded-lg border-2 ${colorClasses[card.color]}`}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium opacity-80">{card.title}</p>
                  <p className="text-4xl font-bold mt-2">{card.value}</p>
                  <p className="text-sm opacity-70 mt-1">{card.description}</p>
                </div>
                <Icon className="w-12 h-12 opacity-60" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts and Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
          </div>
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div key={order._id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    order.status === 'delivered' ? 'bg-green-400' :
                    order.status === 'pending' ? 'bg-yellow-400' :
                    order.status === 'processing' ? 'bg-blue-400' :
                    'bg-gray-400'
                  }`}></div>
                  <div>
                    <p className="font-medium text-gray-900">#{order.orderNumber}</p>
                    <p className="text-sm text-gray-600">{order.shippingAddress?.name}</p>
                    <p className="text-xs text-gray-500">{formatTime(order.createdAt)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₹{order.total?.toLocaleString()}</p>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full capitalize ${
                    order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                    order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity Feed */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Activity Feed</h2>
            <BellIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start space-x-3">
                <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                  activity.type === 'order' ? 'bg-blue-400' :
                  activity.status === 'warning' ? 'bg-yellow-400' :
                  activity.status === 'error' ? 'bg-red-400' :
                  'bg-gray-400'
                }`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-gray-500">{formatTime(activity.time)}</p>
                    {activity.amount && (
                      <p className="text-xs font-medium text-green-600">₹{activity.amount}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Products and Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Selling Products */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Top Selling Products</h2>
          <div className="space-y-4">
            {topProducts.map((product, index) => (
              <div key={product.id} className="flex items-center space-x-4 p-3 border border-gray-100 rounded-lg">
                <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-bold text-orange-600">#{index + 1}</span>
                </div>
                {product.image && (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-12 h-12 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{product.name}</p>
                  <p className="text-sm text-gray-600">{product.quantity} units sold</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">₹{product.revenue?.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Revenue</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stock Alerts */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Stock Alerts</h2>
          <div className="space-y-4">
            {/* Critical Stock */}
            {products.filter(p => p.stock === 0).slice(0, 3).map(product => (
              <div key={product._id} className="flex items-center space-x-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-red-900">{product.name}</p>
                  <p className="text-sm text-red-700">Out of stock</p>
                </div>
                <span className="text-sm font-medium text-red-600">0</span>
              </div>
            ))}

            {/* Low Stock */}
            {products.filter(p => p.stock > 0 && p.stock <= 10).slice(0, 4).map(product => (
              <div key={product._id} className="flex items-center space-x-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <ExclamationTriangleIcon className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-900">{product.name}</p>
                  <p className="text-sm text-yellow-700">Low stock</p>
                </div>
                <span className="text-sm font-medium text-yellow-600">{product.stock}</span>
              </div>
            ))}

            {products.filter(p => p.stock <= 10).length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <CheckCircleIcon className="w-12 h-12 text-green-400 mx-auto mb-2" />
                <p className="text-sm">All products are well stocked!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => handleQuickAction('add-product')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors group"
          >
            <ShoppingBagIcon className="w-8 h-8 text-gray-400 group-hover:text-orange-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600 group-hover:text-orange-600">Add Product</p>
          </button>
          <button 
            onClick={() => handleQuickAction('new-category')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors group"
          >
            <TagIcon className="w-8 h-8 text-gray-400 group-hover:text-orange-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600 group-hover:text-orange-600">New Category</p>
          </button>
          <button 
            onClick={() => handleQuickAction('view-orders')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors group"
          >
            <ShoppingCartIcon className="w-8 h-8 text-gray-400 group-hover:text-orange-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600 group-hover:text-orange-600">View Orders</p>
          </button>
          <button 
            onClick={() => handleQuickAction('create-offer')}
            className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors group"
          >
            <GiftIcon className="w-8 h-8 text-gray-400 group-hover:text-orange-500 mx-auto mb-2" />
            <p className="text-sm font-medium text-gray-600 group-hover:text-orange-600">Create Offer</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;