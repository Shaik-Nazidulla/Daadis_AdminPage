// components/Navbar.jsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  HomeIcon, 
  ShoppingBagIcon, 
  TagIcon, 
  ReceiptPercentIcon,
  DocumentTextIcon,
  ShoppingCartIcon,
  CogIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: HomeIcon },
    { name: 'Products', path: '/products', icon: ShoppingBagIcon },
    { name: 'Categories', path: '/categories', icon: TagIcon },
    { name: 'Manufacturers', path: '/manufacturers', icon: BuildingOfficeIcon },
    { name: 'Discounts', path: '/discounts', icon: ReceiptPercentIcon },
    { name: 'Blogs', path: '/blogs', icon: DocumentTextIcon },
    { name: 'Orders', path: '/orders', icon: ShoppingCartIcon },
    { name: 'Settings', path: '/settings', icon: CogIcon },
  ];

  return (
    <nav className={`bg-gray-900 text-white h-full flex flex-col transition-all duration-300 ${
      collapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        {!collapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold">D</span>
            </div>
            <h1 className="text-xl font-bold">Daadi's Admin</h1>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-gray-700 rounded-lg transition-colors"
        >
          {collapsed ? (
            <ChevronRightIcon className="w-5 h-5" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Menu Items */}
      <div className="flex-1 py-4">
        <ul className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            
            return (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 mx-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-orange-500 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                  title={collapsed ? item.name : ''}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <span className="ml-3 font-medium">{item.name}</span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-700">
        {!collapsed && (
          <div className="text-xs text-gray-400 text-center">
            © 2024 Daadi's Sweets & Snacks
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;