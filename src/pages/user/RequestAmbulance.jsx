"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import axios from "axios";
import MapComponent from "../../components/maps/MapComponent";
import {
  FaExclamationTriangle,
  FaMapMarkerAlt,
  FaAmbulance,
} from "react-icons/fa";
import toast from "react-hot-toast";

// Default location (Bangalore) in case geolocation fails
const DEFAULT_LOCATION = { lat: 12.9716, lng: 77.5946 };

const RequestAmbulance = () => {
  const { user } = useAuth();
  const { createRequest, activeRequest } = useSocket();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [emergencyType, setEmergencyType] = useState("General");
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [step, setStep] = useState(1);
  const [requestId, setRequestId] = useState(null);

  // Check for active request on load
  useEffect(() => {
    const checkActiveRequest = async () => {
      try {
        const res = await axios.get("/request/active");
        if (
          res.data &&
          (res.data.status === "pending" || res.data.status === "accepted")
        ) {
          navigate(`/user/track/${res.data._id}`);
        }
      } catch (err) {
        // No active request, continue
        console.log("No active request found");
      }
    };

    checkActiveRequest();
  }, [navigate]);

  // Get user's current location with improved error handling
  useEffect(() => {
    setLocationLoading(true);
    
    const setDefaultLocation = () => {
      setUserLocation(DEFAULT_LOCATION);
      setSelectedLocation({
        latitude: DEFAULT_LOCATION.lat,
        longitude: DEFAULT_LOCATION.lng,
      });
      toast.error(
        "Failed to get your exact location. Please select your position on the map."
      );
      setLocationLoading(false);
    };
    
    // Set a timeout for location request
    const locationTimeout = setTimeout(() => {
      if (locationLoading) {
        setDefaultLocation();
      }
    }, 10000); // 10 seconds timeout
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          clearTimeout(locationTimeout);
          
          // Validate coordinates
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          
          if (isNaN(lat) || isNaN(lng) || !isFinite(lat) || !isFinite(lng)) {
            console.error("Invalid coordinates:", lat, lng);
            setDefaultLocation();
            return;
          }
          
          const location = { lat, lng };
          setUserLocation(location);
          setSelectedLocation({
            latitude: lat,
            longitude: lng,
          });
          setLocationLoading(false);
        },
        (error) => {
          clearTimeout(locationTimeout);
          console.error("Error getting location:", error);
          setDefaultLocation();
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      clearTimeout(locationTimeout);
      setDefaultLocation();
    }
    
    return () => clearTimeout(locationTimeout);
  }, []);

  const handleLocationSelect = (location) => {
    // Validate the selected location
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      toast.error("Invalid location selected");
      return;
    }
    
    setSelectedLocation(location);
  };

  const handleNextStep = () => {
    if (!selectedLocation) {
      toast.error("Please select your location on the map");
      return;
    }
    setStep(2);
  };

  const handlePrevStep = () => {
    setStep(1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedLocation) {
      toast.error("Please select your location on the map");
      return;
    }

    setLoading(true);

    try {
      // Create request via API first
      const res = await axios.post("/request", {
        location: selectedLocation,
        emergencyType,
        additionalInfo,
      });

      // Then emit socket event with the request ID
      createRequest({
        userId: user._id,
        location: selectedLocation,
        emergencyType,
        requestId: res.data._id,
      });

      setRequestId(res.data._id);
      toast.success("Ambulance request sent successfully!");

      // Navigate to tracking page
      navigate(`/user/track/${res.data._id}`);
    } catch (err) {
      console.error("Error creating request:", err);
      toast.error(
        err.response?.data?.msg || "Failed to send ambulance request"
      );
    } finally {
      setLoading(false);
    }
  };

  const emergencyTypes = [
    {
      id: "general",
      label: "General",
      description: "Non-life threatening situation",
    },
    {
      id: "cardiac",
      label: "Cardiac",
      description: "Chest pain, heart attack symptoms",
    },
    { id: "trauma", label: "Trauma", description: "Injuries from accidents" },
    {
      id: "respiratory",
      label: "Respiratory",
      description: "Difficulty breathing",
    },
    {
      id: "pediatric",
      label: "Pediatric",
      description: "Emergency involving children",
    },
    {
      id: "obstetric",
      label: "Obstetric",
      description: "Pregnancy related emergency",
    },
  ];

  if (activeRequest) {
    return (
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <FaExclamationTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              You have an active request
            </h2>
            <p className="text-gray-500 mb-4">
              You already have an ambulance request in progress. You cannot
              create a new request until the current one is completed or
              cancelled.
            </p>
            <button
              onClick={() => navigate(`/user/track/${activeRequest.requestId}`)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaMapMarkerAlt className="mr-2 h-4 w-4" />
              Track Current Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Request Ambulance</h1>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium leading-6 text-gray-900">
              {step === 1 ? "Select Your Location" : "Emergency Details"}
            </h3>
            <div className="flex items-center">
              <div className="flex items-center space-x-2">
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    step >= 1 ? "bg-blue-600" : "bg-gray-300"
                  }`}
                ></div>
                <div
                  className={`w-2.5 h-2.5 rounded-full ${
                    step >= 2 ? "bg-blue-600" : "bg-gray-300"
                  }`}
                ></div>
              </div>
              <span className="ml-2 text-sm text-gray-500">
                Step {step} of 2
              </span>
            </div>
          </div>
        </div>

        <div className="px-4 py-5 sm:p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">
                Select your exact location on the map. This will help the
                ambulance reach you quickly.
              </p>

              {locationLoading ? (
                <div className="h-96 flex items-center justify-center bg-gray-100 rounded-lg">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-2"></div>
                    <p className="text-gray-600">Getting your location...</p>
                  </div>
                </div>
              ) : (
                <div className="h-96">
                  <MapComponent
                    userLocation={userLocation}
                    onLocationSelect={handleLocationSelect}
                    height="100%"
                  />
                </div>
              )}

              {selectedLocation && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <div className="flex items-start">
                    <FaMapMarkerAlt className="h-5 w-5 text-blue-500 mt-0.5" />
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-800">
                        Selected Location
                      </h3>
                      <p className="mt-1 text-sm text-blue-700">
                        Latitude: {selectedLocation.latitude.toFixed(6)},
                        Longitude: {selectedLocation.longitude.toFixed(6)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={locationLoading || !selectedLocation}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Emergency Type
                </label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {emergencyTypes.map((type) => (
                    <div
                      key={type.id}
                      className={`border rounded-lg p-3 cursor-pointer ${
                        emergencyType === type.label
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => setEmergencyType(type.label)}
                    >
                      <div className="flex items-center">
                        <input
                          type="radio"
                          name="emergencyType"
                          checked={emergencyType === type.label}
                          onChange={() => setEmergencyType(type.label)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                        />
                        <label className="ml-3">
                          <span className="block text-sm font-medium text-gray-900">
                            {type.label}
                          </span>
                          <span className="block text-sm text-gray-500">
                            {type.description}
                          </span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label
                  htmlFor="additionalInfo"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Additional Information (Optional)
                </label>
                <textarea
                  id="additionalInfo"
                  name="additionalInfo"
                  rows="3"
                  className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Describe the emergency situation, any specific medical conditions, or other details that might help the ambulance team."
                  value={additionalInfo}
                  onChange={(e) => setAdditionalInfo(e.target.value)}
                ></textarea>
              </div>

              <div className="flex justify-between">
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-rose-600 hover:bg-rose-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
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
                      Requesting...
                    </span>
                  ) : (
                    <>
                      <FaAmbulance className="mr-2 h-4 w-4" />
                      Request Ambulance
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default RequestAmbulance;