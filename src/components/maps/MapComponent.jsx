"use client";

import { useEffect, useRef, useState } from "react";
import { FaMapMarkerAlt } from "react-icons/fa";

// Create a global variable to track if the script is already loading or loaded
const googleMapsScriptId = "google-maps-script";

const MapComponent = ({
  userLocation,
  driverLocation,
  hospitals = [],
  onLocationSelect = null,
  showDirections = false,
  height = "400px",
}) => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [directionsRenderer, setDirectionsRenderer] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Load Google Maps API only once
  useEffect(() => {
    // Function to initialize the map
    const initializeMap = () => {
      if (!mapRef.current) return;
      
      // Double check that Google Maps is fully loaded
      if (typeof window.google !== 'object' || 
          typeof window.google.maps !== 'object' || 
          typeof window.google.maps.Map !== 'function') {
        console.warn('Google Maps not fully initialized yet');
        return;
      }
      
      setMapsLoaded(true);
    };

    // Check if Maps is already available (almost never on first render)
    if (window.google?.maps?.Map) {
      initializeMap();
      return;
    }

    // Check if script is already being loaded
    if (document.getElementById(googleMapsScriptId)) {
      // Script is loading, wait for it to complete
      const waitForGoogleMaps = setInterval(() => {
        if (window.google?.maps?.Map) {
          initializeMap();
          clearInterval(waitForGoogleMaps);
        }
      }, 100);

      return () => clearInterval(waitForGoogleMaps);
    }

    // Load the script if it's not already loading
    const script = document.createElement("script");
    script.id = googleMapsScriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=AIzaSyCdrWGG8GIjMXp1sN0-V3mAhFIMrh5Eqn0&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;

    // Define the callback function that Google Maps will call when loaded
    window.initGoogleMaps = () => {
      initializeMap();
    };

    script.onerror = (error) =>
      console.error("Error loading Google Maps:", error);

    document.head.appendChild(script);

    return () => {
      // Don't remove the script on component unmount as other components might need it
      // Just clean up any intervals and global callbacks if they exist
      if (window.initGoogleMaps) {
        window.initGoogleMaps = undefined;
      }
    };
  }, []);

  // Initialize map once Google Maps is loaded
  useEffect(() => {
    if (!mapsLoaded || !mapRef.current) return;

    // Make sure the Maps object is fully available
    if (!window.google?.maps?.Map) {
      console.warn('Google Maps not fully loaded yet');
      return;
    }

    // For demo purposes, use a default location if none provided
    const defaultLocation = { lat: 12.9716, lng: 77.5946 }; // Bangalore
    const center = userLocation || defaultLocation;

    try {
      const newMap = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: 14,
        styles: [
          {
            featureType: "poi",
            elementType: "labels",
            stylers: [{ visibility: "off" }],
          },
        ],
        disableDefaultUI: true,
        zoomControl: true,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
      });

      setMap(newMap);

      // Initialize directions renderer if needed
      if (showDirections) {
        const renderer = new window.google.maps.DirectionsRenderer({
          map: newMap,
          suppressMarkers: true,
          polylineOptions: {
            strokeColor: "#3b82f6",
            strokeWeight: 5,
            strokeOpacity: 0.7,
          },
        });
        setDirectionsRenderer(renderer);
      }

      // Add click listener for location selection
      if (onLocationSelect) {
        const clickListener = newMap.addListener("click", (e) => {
          const location = {
            latitude: e.latLng.lat(),
            longitude: e.latLng.lng(),
          };
          setSelectedLocation(location);
          onLocationSelect(location);

          // Clear existing markers and add a new one
          clearMarkers();
          addMarker(location, "selected", "Selected Location");
        });

        return () => {
          // Clean up listener when component unmounts or map changes
          if (window.google?.maps) {
            window.google.maps.event.removeListener(clickListener);
          }
        };
      }
    } catch (error) {
      console.error("Error initializing Google Maps:", error);
      setMapsLoaded(false); // Reset the loaded state to try again
    }
  }, [mapsLoaded, onLocationSelect, showDirections]);

  // Update markers when locations change
  useEffect(() => {
    if (!map) return;

    clearMarkers();

    // Add user marker
    if (userLocation) {
      addMarker(
        { latitude: userLocation.lat, longitude: userLocation.lng },
        "user",
        "Your Location"
      );
    }

    // Add driver marker
    if (driverLocation) {
      addMarker(
        { latitude: driverLocation.lat, longitude: driverLocation.lng },
        "driver",
        "Ambulance"
      );
    }

    // Add hospital markers
    hospitals.forEach((hospital) => {
      if (hospital.location && hospital.location.coordinates) {
        addMarker(
          {
            latitude: hospital.location.coordinates[1],
            longitude: hospital.location.coordinates[0],
          },
          "hospital",
          hospital.name
        );
      }
    });

    // Add selected location marker
    if (selectedLocation) {
      addMarker(selectedLocation, "selected", "Selected Location");
    }

    // Update map center if user location is provided
    if (userLocation) {
      map.setCenter({ lat: userLocation.lat, lng: userLocation.lng });
    }

    // Show directions if needed
    if (
      showDirections &&
      directionsRenderer &&
      userLocation &&
      driverLocation
    ) {
      const directionsService = new window.google.maps.DirectionsService();

      directionsService.route(
        {
          origin: { lat: driverLocation.lat, lng: driverLocation.lng },
          destination: { lat: userLocation.lat, lng: userLocation.lng },
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            directionsRenderer.setDirections(result);
          }
        }
      );
    }
  }, [
    map,
    userLocation,
    driverLocation,
    hospitals,
    selectedLocation,
    directionsRenderer,
    showDirections,
  ]);

  // Add a marker to the map
  const addMarker = (location, type, title) => {
    if (!map || !window.google) return;

    let icon;

    switch (type) {
      case "user":
        icon = {
          url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
          scaledSize: new window.google.maps.Size(40, 40),
        };
        break;
      case "driver":
        icon = {
          url: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
          scaledSize: new window.google.maps.Size(40, 40),
        };
        break;
      case "hospital":
        icon = {
          url: "https://maps.google.com/mapfiles/ms/icons/green-dot.png",
          scaledSize: new window.google.maps.Size(32, 32),
        };
        break;
      case "selected":
        icon = {
          url: "https://maps.google.com/mapfiles/ms/icons/purple-dot.png",
          scaledSize: new window.google.maps.Size(36, 36),
        };
        break;
      default:
        icon = null;
    }

    const marker = new window.google.maps.Marker({
      position: {
        lat: Number.parseFloat(location.latitude),
        lng: Number.parseFloat(location.longitude),
      },
      map,
      title,
      icon,
    });

    const infoWindow = new window.google.maps.InfoWindow({
      content: `<div class="p-2"><strong>${title}</strong></div>`,
    });

    marker.addListener("click", () => {
      infoWindow.open(map, marker);
    });

    setMarkers((prev) => [...prev, marker]);

    return marker;
  };

  // Clear all markers from the map
  const clearMarkers = () => {
    markers.forEach((marker) => marker.setMap(null));
    setMarkers([]);
  };

  return (
    <div
      ref={mapRef}
      className="rounded-lg shadow-md w-full"
      style={{ height }}
    >
      {!mapsLoaded && (
        <div className="flex items-center justify-center h-full bg-gray-100 rounded-lg">
          <div className="text-center">
            <FaMapMarkerAlt className="w-12 h-12 mx-auto text-blue-500 mb-2" />
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapComponent;