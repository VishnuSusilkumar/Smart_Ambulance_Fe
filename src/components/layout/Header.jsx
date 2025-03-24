"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { Link } from "react-router-dom";
import { FaBars, FaBell, FaUser, FaSignOutAlt } from "react-icons/fa";

const Header = () => {
  const { user, userType, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown);
    if (showNotifications) setShowNotifications(false);
  };

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (showDropdown) setShowDropdown(false);
  };

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center md:hidden">
          <button
            className="text-gray-500 hover:text-gray-700 focus:outline-none"
            aria-label="Toggle sidebar"
          >
            <FaBars size={24} />
          </button>
        </div>

        <div className="flex-1 flex justify-center md:justify-start">
          <h1 className="text-xl font-bold text-blue-600">
            Smart<span className="text-rose-500">Ambulance</span>
          </h1>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
              onClick={toggleNotifications}
              aria-label="Notifications"
            >
              <FaBell size={20} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-rose-500 rounded-full"></span>
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-2 z-20 border border-gray-200">
                <div className="px-4 py-2 border-b border-gray-200">
                  <h3 className="text-sm font-semibold">Notifications</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  <div className="px-4 py-3 hover:bg-gray-50 border-b border-gray-100">
                    <p className="text-sm font-medium">New ambulance request</p>
                    <p className="text-xs text-gray-500">5 minutes ago</p>
                  </div>
                  <div className="px-4 py-3 hover:bg-gray-50">
                    <p className="text-sm">No new notifications</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative">
            <button
              className="flex items-center space-x-2 focus:outline-none"
              onClick={toggleDropdown}
              aria-label="User menu"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white">
                {user?.name?.charAt(0) || <FaUser size={16} />}
              </div>
              <span className="hidden md:block text-sm font-medium">
                {user?.name || "User"}
              </span>
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-20 border border-gray-200">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                <Link
                  to={`/${userType}/profile`}
                  className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={() => setShowDropdown(false)}
                >
                  <FaUser size={16} className="mr-2" />
                  Profile
                </Link>
                <button
                  className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  onClick={logout}
                >
                  <FaSignOutAlt size={16} className="mr-2" />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
