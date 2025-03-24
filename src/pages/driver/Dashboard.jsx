"use client";

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import axios from "axios";
import MapComponent from "../../components/maps/MapComponent";
import {
  FaMapMarkerAlt,
  FaClock,
  FaExclamationTriangle,
  FaCheckCircle,
  FaToggleOff,
  FaToggleOn,
} from "react-icons/fa";
import toast from "react-hot-toast";

const DriverDashboard = () => {
  const { user } = useAuth();
  const { updateDriverLocation, activeRequest } = useSocket();

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRequests: 0,
    completedRequests: 0,
    cancelledRequests: 0,
  });
  const [currentLocation, setCurrentLocation] = useState(null);
  const [available, setAvailable] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [locationInterval, setLocationInterval] = useState(null);

  // Fetch driver stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get("/request/driver");

        // Calculate stats
        const total = res.data.length;
        const completed = res.data.filter(
          (req) => req.status === "completed"
        ).length;
        const cancelled = res.data.filter(
          (req) => req.status === "cancelled"
        ).length;

        setStats({
          totalRequests: total,
          completedRequests: completed,
          cancelledRequests: cancelled,
        });

        // Get driver availability
        const driverRes = await axios.get("/auth/driver");
        setAvailable(driverRes.data.available);
      } catch (err) {
        console.error("Error fetching driver stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Get and update driver location
  useEffect(() => {
    const getLocation = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const location = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            };

            setCurrentLocation({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });

            // Update location via API
            axios
              .put("/ambulance/location", {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              })
              .catch((err) => {
                console.error("Error updating location:", err);
              });

            // Update location via socket if there's an active request
            if (activeRequest) {
              updateDriverLocation(location, activeRequest.requestId);
            } else {
              updateDriverLocation(location);
            }
          },
          (error) => {
            console.error("Error getting location:", error);
            toast.error(
              "Failed to get your location. Location tracking is required."
            );
          }
        );
      } else {
        toast.error("Geolocation is not supported by your browser");
      }
    };

    // Get location immediately
    getLocation();

    // Set up interval to update location
    const interval = setInterval(getLocation, 10000); // Every 10 seconds
    setLocationInterval(interval);

    return () => {
      if (locationInterval) {
        clearInterval(locationInterval);
      }
    };
  }, [updateDriverLocation, activeRequest]);

  // Toggle availability
  const toggleAvailability = async () => {
    if (activeRequest) {
      toast.error("Cannot change availability with an active request");
      return;
    }

    setUpdatingStatus(true);

    try {
      const res = await axios.put("/ambulance/availability", {
        available: !available,
      });

      setAvailable(res.data.available);
      toast.success(
        `You are now ${
          res.data.available ? "available" : "unavailable"
        } for new requests`
      );
    } catch (err) {
      console.error("Error updating availability:", err);
      toast.error(err.response?.data?.msg || "Failed to update availability");
    } finally {
      setUpdatingStatus(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
        <button
          onClick={toggleAvailability}
          disabled={updatingStatus || !!activeRequest}
          className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
            available
              ? "text-emerald-700 bg-emerald-100 hover:bg-emerald-200"
              : "text-gray-700 bg-gray-100 hover:bg-gray-200"
          } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {updatingStatus ? (
            <span className="flex items-center">
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Updating...
            </span>
          ) : (
            <>
              {available ? (
                <>
                  <FaToggleOn className="mr-2 h-4 w-4" />
                  Available
                </>
              ) : (
                <>
                  <FaToggleOff className="mr-2 h-4 w-4" />
                  Unavailable
                </>
              )}
            </>
          )}
        </button>
      </div>

      {activeRequest && (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <FaExclamationTriangle className="h-5 w-5 text-blue-500" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                Active Request
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p>You have an active ambulance request in progress.</p>
              </div>
              <div className="mt-3">
                <Link
                  to={`/driver/requests`}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <FaMapMarkerAlt className="mr-1 h-4 w-4" />
                  View Active Request
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-blue-100 rounded-md p-3">
                <FaMapMarkerAlt className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Requests
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats.totalRequests}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-emerald-100 rounded-md p-3">
                <FaCheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Completed
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats.completedRequests}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0 bg-amber-100 rounded-md p-3">
                <FaClock className="h-6 w-6 text-amber-600" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Response Rate
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stats.totalRequests > 0
                        ? `${Math.round(
                            (stats.completedRequests / stats.totalRequests) *
                              100
                          )}%`
                        : "N/A"}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Your Current Location
          </h3>
        </div>
        <div className="px-4 py-5 sm:p-6">
          <div className="h-64">
            <MapComponent userLocation={currentLocation} height="100%" />
          </div>
          <div className="mt-4 text-sm text-gray-500">
            {currentLocation ? (
              <div className="flex items-center justify-center">
                <FaMapMarkerAlt className="h-4 w-4 mr-1 text-blue-500" />
                <span>
                  Location: {currentLocation.lat.toFixed(6)},{" "}
                  {currentLocation.lng.toFixed(6)}
                </span>
              </div>
            ) : (
              <div className="text-center">Acquiring your location...</div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Quick Actions
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 gap-4">
              <Link
                to="/driver/requests"
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View Pending Requests
              </Link>
              <Link
                to="/driver/history"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                View Request History
              </Link>
              <Link
                to="/driver/profile"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Update Profile
              </Link>
            </div>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Driver Information
            </h3>
          </div>
          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="text-gray-500">Name:</div>
              <div className="font-medium">{user?.name || "N/A"}</div>

              <div className="text-gray-500">Vehicle Type:</div>
              <div className="font-medium">{user?.vehicleType || "N/A"}</div>

              <div className="text-gray-500">Vehicle Number:</div>
              <div className="font-medium">{user?.vehicleNumber || "N/A"}</div>

              <div className="text-gray-500">Status:</div>
              <div className="font-medium">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    available
                      ? "bg-emerald-100 text-emerald-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {available ? "Available" : "Unavailable"}
                </span>
              </div>

              <div className="text-gray-500">Phone:</div>
              <div className="font-medium">{user?.phone || "N/A"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
