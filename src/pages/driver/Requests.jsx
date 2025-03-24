"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import axios from "axios";
import MapComponent from "../../components/maps/MapComponent";
import {
  FaMapMarkerAlt,
  FaClock,
  FaCheckCircle,
  FaExclamationTriangle,
  FaBuilding,
} from "react-icons/fa";
import toast from "react-hot-toast";

const DriverRequests = () => {
  const { user } = useAuth();
  const { pendingRequests, acceptRequest, completeRequest, activeRequest } =
    useSocket();

  const [loading, setLoading] = useState(true);
  const [apiPendingRequests, setApiPendingRequests] = useState([]);
  const [currentRequest, setCurrentRequest] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [nearbyHospitals, setNearbyHospitals] = useState([]);
  const [selectedHospital, setSelectedHospital] = useState(null);
  const [estimatedTime, setEstimatedTime] = useState(5);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [acceptingRequest, setAcceptingRequest] = useState(false);
  const [completingRequest, setCompletingRequest] = useState(false);

  // Fetch pending requests and active request
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        // Get current location
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const location = {
                lat: position.coords.latitude,
                lng: position.coords.longitude,
              };

              setCurrentLocation(location);

              // Fetch pending requests near current location
              const pendingRes = await axios.get("/request/pending", {
                params: {
                  longitude: position.coords.longitude,
                  latitude: position.coords.latitude,
                  maxDistance: 5000, // 5km
                },
              });

              setApiPendingRequests(pendingRes.data);

              // Check for active request
              try {
                const activeRes = await axios.get("/request/active");
                if (activeRes.data) {
                  setCurrentRequest(activeRes.data);

                  // Fetch user details
                  const userRes = await axios.get(
                    `/auth/user/${activeRes.data.userId}`
                  );
                  setCurrentUser(userRes.data);

                  // Fetch nearby hospitals
                  const hospitalsRes = await axios.get("/hospital/nearby", {
                    params: {
                      longitude: position.coords.longitude,
                      latitude: position.coords.latitude,
                      maxDistance: 10000, // 10km
                    },
                  });

                  setNearbyHospitals(hospitalsRes.data);
                }
              } catch (err) {
                // No active request, continue
                console.log("No active request found");
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
      } catch (err) {
        console.error("Error fetching requests:", err);
        toast.error("Failed to load requests");
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // Handle accepting a request
  const handleAcceptRequest = async (requestId) => {
    setAcceptingRequest(true);

    try {
      // Accept via API
      await axios.put(`/request/${requestId}/accept`, {
        estimatedTime,
      });

      // Accept via socket
      acceptRequest(requestId, estimatedTime);

      toast.success("Request accepted successfully");

      // Refresh the page to get the updated request
      window.location.reload();
    } catch (err) {
      console.error("Error accepting request:", err);
      toast.error(err.response?.data?.msg || "Failed to accept request");
    } finally {
      setAcceptingRequest(false);
    }
  };

  // Handle completing a request
  const handleCompleteRequest = async (requestId) => {
    if (!selectedHospital) {
      toast.error("Please select a hospital");
      return;
    }

    setCompletingRequest(true);

    try {
      // Complete via API
      await axios.put(`/request/${requestId}/complete`, {
        hospitalId: selectedHospital,
      });

      // Complete via socket
      completeRequest(requestId, selectedHospital);

      toast.success("Request completed successfully");

      // Refresh the page
      window.location.reload();
    } catch (err) {
      console.error("Error completing request:", err);
      toast.error(err.response?.data?.msg || "Failed to complete request");
    } finally {
      setCompletingRequest(false);
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

  // Combine socket and API pending requests
  const allPendingRequests = [
    ...pendingRequests,
    ...apiPendingRequests.filter(
      (apiReq) =>
        !pendingRequests.some((socketReq) => socketReq.requestId === apiReq._id)
    ),
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Ambulance Requests</h1>
      </div>

      {currentRequest ? (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium leading-6 text-gray-900">
                Active Request
              </h3>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                In Progress
              </span>
            </div>
          </div>

          <div className="px-4 py-5 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Patient Details
                  </h4>
                  <div className="mt-2 bg-gray-50 p-3 rounded-md">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-gray-500">Name:</div>
                      <div className="font-medium">
                        {currentRequest.patientName}
                      </div>

                      <div className="text-gray-500">Phone:</div>
                      <div className="font-medium">
                        <a
                          href={`tel:${currentRequest.patientPhone}`}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          {currentRequest.patientPhone}
                        </a>
                      </div>

                      <div className="text-gray-500">Emergency Type:</div>
                      <div className="font-medium">
                        {currentRequest.emergencyType}
                      </div>

                      <div className="text-gray-500">Requested:</div>
                      <div className="font-medium">
                        {getTimeElapsed(currentRequest.createdAt)}
                      </div>

                      <div className="text-gray-500">Accepted:</div>
                      <div className="font-medium">
                        {getTimeElapsed(currentRequest.acceptedAt)}
                      </div>
                    </div>
                  </div>
                </div>

                {currentUser && currentUser.medicalInfo && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Medical Information
                    </h4>
                    <div className="mt-2 bg-blue-50 p-3 rounded-md">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div className="text-gray-500">Blood Type:</div>
                        <div className="font-medium">
                          {currentUser.medicalInfo.bloodType || "Not specified"}
                        </div>

                        <div className="text-gray-500">Allergies:</div>
                        <div className="font-medium">
                          {currentUser.medicalInfo.allergies &&
                          currentUser.medicalInfo.allergies.length > 0
                            ? currentUser.medicalInfo.allergies.join(", ")
                            : "None"}
                        </div>

                        <div className="text-gray-500">Medical Conditions:</div>
                        <div className="font-medium">
                          {currentUser.medicalInfo.medicalConditions &&
                          currentUser.medicalInfo.medicalConditions.length > 0
                            ? currentUser.medicalInfo.medicalConditions.join(
                                ", "
                              )
                            : "None"}
                        </div>

                        <div className="text-gray-500">Medications:</div>
                        <div className="font-medium">
                          {currentUser.medicalInfo.medications &&
                          currentUser.medicalInfo.medications.length > 0
                            ? currentUser.medicalInfo.medications.join(", ")
                            : "None"}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {currentUser &&
                  currentUser.emergencyContacts &&
                  currentUser.emergencyContacts.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500">
                        Emergency Contacts
                      </h4>
                      <div className="mt-2 space-y-2">
                        {currentUser.emergencyContacts.map((contact, index) => (
                          <div
                            key={index}
                            className="bg-gray-50 p-3 rounded-md"
                          >
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div className="text-gray-500">Name:</div>
                              <div className="font-medium">{contact.name}</div>

                              <div className="text-gray-500">Phone:</div>
                              <div className="font-medium">
                                <a
                                  href={`tel:${contact.phone}`}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  {contact.phone}
                                </a>
                              </div>

                              <div className="text-gray-500">Relationship:</div>
                              <div className="font-medium">
                                {contact.relationship}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {nearbyHospitals.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">
                      Nearby Hospitals
                    </h4>
                    <div className="mt-2 space-y-2">
                      {nearbyHospitals.map((hospital) => (
                        <div
                          key={hospital._id}
                          className={`border p-3 rounded-md cursor-pointer ${
                            selectedHospital === hospital._id
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200 hover:bg-gray-50"
                          }`}
                          onClick={() => setSelectedHospital(hospital._id)}
                        >
                          <div className="flex items-start">
                            <div className="flex-shrink-0">
                              <FaBuilding className="h-5 w-5 text-gray-400" />
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-gray-900">
                                {hospital.name}
                              </h3>
                              <p className="mt-1 text-xs text-gray-500">
                                {hospital.address}
                              </p>
                              <p className="mt-1 text-xs text-gray-500">
                                Services:{" "}
                                {hospital.emergencyServices.join(", ")}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-4">
                  <button
                    onClick={() => handleCompleteRequest(currentRequest._id)}
                    disabled={!selectedHospital || completingRequest}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {completingRequest ? (
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
                        Completing...
                      </span>
                    ) : (
                      <>
                        <FaCheckCircle className="mr-2 h-4 w-4" />
                        Complete Request
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-gray-500 mb-2">
                  Location
                </h4>
                <div className="h-80">
                  <MapComponent
                    // userLocation={currentLocation}
                    driverLocation={currentLocation}
                    userLocation={
                      currentRequest.location
                        ? {
                            lat: currentRequest.location.latitude,
                            lng: currentRequest.location.longitude,
                          }
                        : null
                    }
                    hospitals={nearbyHospitals.map((hospital) => ({
                      ...hospital,
                      location: {
                        coordinates: [
                          hospital.location.coordinates[0],
                          hospital.location.coordinates[1],
                        ],
                      },
                    }))}
                    showDirections={true}
                    height="100%"
                  />
                </div>
                <div className="mt-2 text-xs text-gray-500 text-center">
                  {currentLocation
                    ? "Live tracking enabled"
                    : "Waiting for location updates..."}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              Pending Requests
            </h3>
          </div>

          <div className="px-4 py-5 sm:p-6">
            {allPendingRequests.length === 0 ? (
              <div className="text-center py-8">
                <FaMapMarkerAlt className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No pending requests
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  There are no ambulance requests in your area at the moment.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {allPendingRequests.map((request) => (
                  <div
                    key={request.requestId || request._id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div className="px-4 py-4 sm:px-6 bg-gray-50 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-medium text-gray-900">
                          {request.patientName || "Patient"}
                        </h3>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                          Pending
                        </span>
                      </div>
                    </div>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-500">
                            <FaClock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <span>
                              Requested {getTimeElapsed(request.createdAt)}
                            </span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <FaExclamationTriangle className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <span>Emergency Type: {request.emergencyType}</span>
                          </div>
                          <div className="flex items-center text-sm text-gray-500">
                            <FaMapMarkerAlt className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            <span>
                              Distance: Approximately{" "}
                              {Math.round(Math.random() * 4) + 1} km away
                            </span>
                          </div>

                          <div className="pt-2">
                            <label
                              htmlFor={`estimatedTime-${
                                request.requestId || request._id
                              }`}
                              className="block text-xs font-medium text-gray-700"
                            >
                              Estimated Arrival Time (minutes)
                            </label>
                            <select
                              id={`estimatedTime-${
                                request.requestId || request._id
                              }`}
                              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                              value={estimatedTime}
                              onChange={(e) =>
                                setEstimatedTime(
                                  Number.parseInt(e.target.value)
                                )
                              }
                            >
                              <option value="5">5 minutes</option>
                              <option value="10">10 minutes</option>
                              <option value="15">15 minutes</option>
                              <option value="20">20 minutes</option>
                              <option value="30">30 minutes</option>
                            </select>
                          </div>

                          <div className="pt-2">
                            <button
                              onClick={() =>
                                handleAcceptRequest(
                                  request.requestId || request._id
                                )
                              }
                              disabled={acceptingRequest}
                              className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {acceptingRequest ? (
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
                                  Accepting...
                                </span>
                              ) : (
                                "Accept Request"
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="h-40">
                          <MapComponent
                            // userLocation={currentLocation}
                            driverLocation={currentLocation}
                            userLocation={
                              request.location
                                ? {
                                    lat: request.location.latitude,
                                    lng: request.location.longitude,
                                  }
                                : null
                            }
                            height="100%"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DriverRequests;
