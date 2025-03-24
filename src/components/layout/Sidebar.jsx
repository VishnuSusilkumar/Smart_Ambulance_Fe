"use client";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { FaHome, FaAmbulance, FaUser, FaClock, FaList } from "react-icons/fa";

const Sidebar = () => {
  const { userType } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const userLinks = [
    { to: "/user/dashboard", icon: <FaHome size={20} />, label: "Dashboard" },
    {
      to: "/user/request",
      icon: <FaAmbulance size={20} />,
      label: "Request Ambulance",
    },
    { to: "/user/history", icon: <FaClock size={20} />, label: "History" },
    { to: "/user/profile", icon: <FaUser size={20} />, label: "Profile" },
  ];

  const driverLinks = [
    { to: "/driver/dashboard", icon: <FaHome size={20} />, label: "Dashboard" },
    { to: "/driver/requests", icon: <FaList size={20} />, label: "Requests" },
    { to: "/driver/history", icon: <FaClock size={20} />, label: "History" },
    { to: "/driver/profile", icon: <FaUser size={20} />, label: "Profile" },
  ];

  const links = userType === "user" ? userLinks : driverLinks;

  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-white border-r border-gray-200">
      <div className="flex items-center justify-center h-16 border-b border-gray-200">
        <h1 className="text-xl font-bold text-blue-600">
          Smart<span className="text-rose-500">Ambulance</span>
        </h1>
      </div>
      <div className="flex flex-col flex-1 overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {links.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center px-4 py-3 text-sm font-medium rounded-lg ${
                isActive(link.to)
                  ? "bg-blue-50 text-blue-600"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="mr-3">{link.icon}</span>
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white">
              {userType === "user" ? "U" : "D"}
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-700">
                {userType === "user" ? "Patient" : "Driver"} Mode
              </p>
              <p className="text-xs text-gray-500">
                {userType === "user" ? "Request help" : "Provide help"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
