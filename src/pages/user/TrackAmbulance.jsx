"use client";

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import axios from "axios";
import MapComponent from "../../components/maps/MapComponent";
import {
  FaPhone,
  FaExclamationTriangle,
  FaTimes,
  FaCheckCircle,
} from "react-icons/fa";
import toast from "react-hot-toast";

const TrackAmbulance = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { driverLocation, setActiveRequest } = useSocket();

  const [request, setRequest] = useState(null);
  const [driver, setDriver] = useState(null);
  const [hospital, setHospital] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLocation, setUserLocation] = useState(null);
  const [cancelConfirm, setCancelConfirm] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Fetch request details - with fallback logic
  useEffect(() => {
    const fetchRequestDetails = async () => {
      try {
        let requestRes;
        
        // Try the direct endpoint first (which we're adding to the backend)
        try {
          requestRes = await axios.get(`/request/${requestId}`);
        } catch (directError) {
          console.log("Direct request endpoint failed, trying fallback method");
          
          // Fallback to active request endpoint if the direct endpoint fails
          // (This is a temporary solution until the backend is updated)
          const activeRes = await axios.get(`/request/active`);
          
          // If the active request doesn't match our requestId, try to get it from user requests
          if (activeRes.data._id !== requestId) {
            const userRequestsRes = await axios.get(`/request/user`);
            const matchingRequest = userRequestsRes.data.find(req => req._id === requestId);
            
            if (!matchingRequest) {
              throw new Error("Request not found");
            }
            
            requestRes = { data: matchingRequest };
          } else {
            requestRes = activeRes;
          }
        }
        
        setRequest(requestRes.data);
        setActiveRequest(requestRes.data);

        // Set user location from request
        if (requestRes.data.location) {
          setUserLocation({
            lat: requestRes.data.location.latitude,
            lng: requestRes.data.location.longitude,
          });
        }

        // Fetch driver details if assigned
        if (requestRes.data.driverId) {
          try {
            const driverRes = await axios.get(
              `/ambulance/${requestRes.data.driverId}`
            );
            setDriver(driverRes.data);
          } catch (driverError) {
            console.error("Error fetching driver details:", driverError);
            toast.error("Could not load driver information");
          }
        }

        // Fetch hospital details if completed
        if (requestRes.data.hospitalId) {
          try {
            const hospitalRes = await axios.get(
              `/hospital/${requestRes.data.hospitalId}`
            );
            setHospital(hospitalRes.data);
          } catch (hospitalError) {
            console.error("Error fetching hospital details:", hospitalError);
            toast.error("Could not load hospital information");
          }
        }
      } catch (err) {
        console.error("Error fetching request details:", err);
        toast.error("Failed to load request details");
        navigate("/user/dashboard");
      } finally {
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [requestId, navigate, setActiveRequest, user]);

  // Handle request cancellation
  const handleCancelRequest = async () => {
    if (!cancelConfirm) {
      setCancelConfirm(true);
      return;
    }

    setCancelling(true);

    try {
      await axios.put(`/request/${requestId}/cancel`);
      toast.success("Request cancelled successfully");
      navigate("/user/dashboard");
    } catch (err) {
      console.error("Error cancelling request:", err);
      toast.error(err.response?.data?.msg || "Failed to cancel request");
    } finally {
      setCancelling(false);
      setCancelConfirm(false);
    }
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // Calculate time elapsed
  const getTimeElapsed = (dateString) => {
    if (!dateString) return "N/A";

    const created = new Date(dateString);
    const now = new Date();
    const diffMs = now - created;
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return "Just now";
    if (diffMins === 1) return "1 minute ago";
    if (diffMins < 60) return `${diffMins} minutes ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours === 1) return "1 hour ago";
    return `${diffHours} hours ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <FaExclamationTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              Request not found
            </h2>
            <p className="text-gray-500 mb-4">
              The ambulance request you're looking for doesn't exist or has been
              cancelled.
            </p>
            <button
              onClick={() => navigate("/user/dashboard")}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Return to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Track Ambulance</h1>
        {(request.status === "pending" || request.status === "accepted") && (
          <button
            onClick={handleCancelRequest}
            disabled={cancelling}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium ${
              cancelConfirm
                ? "text-white bg-red-600 hover:bg-red-700"
                : "text-red-700 bg-red-100 hover:bg-red-200"
            } focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {cancelling ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                Cancelling...
              </span>
            ) : (
              <>
                <FaTimes className="mr-2 h-4 w-4" />
                {cancelConfirm ? "Confirm Cancel" : "Cancel Request"}
              </>
            )}
          </button>
        )}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Request Status:
            <span
              className={`ml-2 ${
                request.status === "pending"
                  ? "text-amber-600"
                  : request.status === "accepted"
                  ? "text-blue-600"
                  : request.status === "completed"
                  ? "text-emerald-600"
                  : "text-red-600"
              }`}
            >
              {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
            </span>
          </h3>
        </div>

        <div className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Request Details
                </h4>
                <div className="mt-2 bg-gray-50 p-3 rounded-md">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="text-gray-500">Emergency Type:</div>
                    <div className="font-medium">{request.emergencyType}</div>

                    <div className="text-gray-500">Requested:</div>
                    <div className="font-medium">
                      {getTimeElapsed(request.createdAt)}
                    </div>

                    {request.status === "accepted" && (
                      <>
                        <div className="text-gray-500">Accepted:</div>
                        <div className="font-medium">
                          {getTimeElapsed(request.acceptedAt)}
                        </div>

                        <div className="text-gray-500">Est. Arrival:</div>
                        <div className="font-medium">
                          {request.estimatedTime
                            ? `${request.estimatedTime} minutes`
                            : "Unknown"}
                        </div>
                      </>
                    )}

                    {request.status === "completed" && (
                      <>
                        <div className="text-gray-500">Completed:</div>
                        <div className="font-medium">
                          {getTimeElapsed(request.completedAt)}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {driver && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Ambulance Details
                  </h4>
                  <div className="mt-2 bg-blue-50 p-3 rounded-md">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-blue-100 rounded-full p-2">
                        <svg
                          className="h-6 w-6 text-blue-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-blue-800">
                          {driver.name}
                        </h3>
                        <div className="mt-1 text-sm text-blue-700">
                          <p>Vehicle: {driver.vehicleType} Ambulance</p>
                          <p>Vehicle Number: {driver.vehicleNumber}</p>
                          <div className="mt-2">
                            <a
                              href={`tel:${driver.phone}`}
                              className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                            >
                              <FaPhone className="mr-1 h-4 w-4" />
                              Call Driver
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {hospital && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Hospital Details
                  </h4>
                  <div className="mt-2 bg-emerald-50 p-3 rounded-md">
                    <div className="flex items-start">
                      <div className="flex-shrink-0 bg-emerald-100 rounded-full p-2">
                        <svg
                          className="h-6 w-6 text-emerald-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-emerald-800">
                          {hospital.name}
                        </h3>
                        <div className="mt-1 text-sm text-emerald-700">
                          <p>{hospital.address}</p>
                          <p>Phone: {hospital.phone}</p>
                          <p>
                            Services: {hospital.emergencyServices.join(", ")}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {request.status === "completed" && (
                <div className="bg-emerald-50 border-l-4 border-emerald-500 p-4 rounded-md">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <FaCheckCircle className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-emerald-800">
                        Request Completed
                      </h3>
                      <div className="mt-2 text-sm text-emerald-700">
                        <p>
                          The ambulance has successfully transported the patient
                          to the hospital.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-500 mb-2">
                Location Tracking
              </h4>
              <div className="h-80">
                <MapComponent
                  userLocation={userLocation}
                  driverLocation={
                    driverLocation
                      ? {
                          lat: driverLocation.latitude,
                          lng: driverLocation.longitude,
                        }
                      : null
                  }
                  showDirections={true}
                  height="100%"
                />
              </div>
              <div className="mt-2 text-xs text-gray-500 text-center">
                {driverLocation
                  ? "Live tracking enabled"
                  : "Waiting for driver location updates..."}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrackAmbulance;