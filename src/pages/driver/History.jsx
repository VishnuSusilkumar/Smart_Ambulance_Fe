"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import axios from "axios";
import {
  FaClock,
  FaMapMarkerAlt,
  FaExclamationTriangle,
  FaCheckCircle,
  FaTimes,
} from "react-icons/fa";

const DriverHistory = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const res = await axios.get("/request/driver");
        setRequests(res.data);
      } catch (err) {
        console.error("Error fetching requests:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-amber-100 text-amber-800";
      case "accepted":
        return "bg-blue-100 text-blue-800";
      case "completed":
        return "bg-emerald-100 text-emerald-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "pending":
        return <FaClock className="h-5 w-5" />;
      case "accepted":
        return <FaMapMarkerAlt className="h-5 w-5" />;
      case "completed":
        return <FaCheckCircle className="h-5 w-5" />;
      case "cancelled":
        return <FaTimes className="h-5 w-5" />;
      default:
        return <FaExclamationTriangle className="h-5 w-5" />;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const calculateDuration = (startDate, endDate) => {
    if (!startDate || !endDate) return "N/A";

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end - start;
    const diffMins = Math.round(diffMs / 60000);

    if (diffMins < 60) {
      return `${diffMins} min${diffMins !== 1 ? "s" : ""}`;
    }

    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours} hr${hours !== 1 ? "s" : ""} ${mins} min${
      mins !== 1 ? "s" : ""
    }`;
  };

  const filteredRequests =
    filter === "all"
      ? requests
      : requests.filter((request) => request.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Request History</h1>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Your Completed Requests
            </h3>
            <div className="mt-3 sm:mt-0">
              <div className="flex rounded-md shadow-sm">
                <button
                  type="button"
                  onClick={() => setFilter("all")}
                  className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 text-sm font-medium ${
                    filter === "all"
                      ? "bg-blue-50 text-blue-600 border-blue-500 z-10"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("completed")}
                  className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium ${
                    filter === "completed"
                      ? "bg-emerald-50 text-emerald-600 border-emerald-500 z-10"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Completed
                </button>
                <button
                  type="button"
                  onClick={() => setFilter("cancelled")}
                  className={`relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 text-sm font-medium ${
                    filter === "cancelled"
                      ? "bg-red-50 text-red-600 border-red-500 z-10"
                      : "bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  Cancelled
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-4 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No requests found with the selected filter.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Date
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Patient
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Emergency Type
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Status
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    Duration
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <tr key={request._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(request.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.patientName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.emergencyType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(
                          request.status
                        )}`}
                      >
                        {getStatusIcon(request.status)}
                        <span className="ml-1.5">
                          {request.status.charAt(0).toUpperCase() +
                            request.status.slice(1)}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {request.status === "completed"
                        ? calculateDuration(
                            request.acceptedAt,
                            request.completedAt
                          )
                        : "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default DriverHistory;
