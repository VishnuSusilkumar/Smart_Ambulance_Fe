"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { io } from "socket.io-client"
import { useAuth } from "./AuthContext"

const SocketContext = createContext()

export const useSocket = () => useContext(SocketContext)

export const SocketProvider = ({ children }) => {
  const { user, userType, token } = useAuth()
  const [socket, setSocket] = useState(null)
  const [connected, setConnected] = useState(false)
  const [driverLocation, setDriverLocation] = useState(null)
  const [activeRequest, setActiveRequest] = useState(null)
  const [nearbyDrivers, setNearbyDrivers] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])

  // Initialize socket connection
  useEffect(() => {
    if (token && user) {
      const newSocket = io("http://localhost:5000", {
        auth: { token },
        withCredentials: true,
      })

      newSocket.on("connect", () => {
        console.log("Socket connected")
        setConnected(true)

        // Register user or driver
        if (userType === "user") {
          newSocket.emit("register_user", user._id)
        } else if (userType === "driver") {
          newSocket.emit("register_driver", user._id)
        }
      })

      newSocket.on("disconnect", () => {
        console.log("Socket disconnected")
        setConnected(false)
      })

      // Set up event listeners based on user type
      if (userType === "user") {
        // Driver location updates
        newSocket.on("driver_location_update", (data) => {
          setDriverLocation(data.location)
        })

        // Request accepted notification
        newSocket.on("request_accepted", (data) => {
          setActiveRequest(data)
        })

        // Request completed notification
        newSocket.on("request_completed", (data) => {
          setActiveRequest(null)
        })
      } else if (userType === "driver") {
        // New request notifications
        newSocket.on("new_request_notification", (data) => {
          setPendingRequests((prev) => [data, ...prev.filter((req) => req.requestId !== data.requestId)])
        })

        // Accept confirmed
        newSocket.on("accept_confirmed", (data) => {
          setPendingRequests((prev) => prev.filter((req) => req.requestId !== data.requestId))
        })

        // Complete confirmed
        newSocket.on("complete_confirmed", (data) => {
          setActiveRequest(null)
        })
      }

      setSocket(newSocket)

      return () => {
        newSocket.disconnect()
      }
    }
  }, [token, user, userType])

  // Create a new ambulance request
  const createRequest = (requestData) => {
    if (socket && connected) {
      socket.emit("new_request", requestData)
    }
  }

  // Update driver location
  const updateDriverLocation = (location, requestId = null) => {
    if (socket && connected && userType === "driver") {
      socket.emit("update_driver_location", {
        driverId: user._id,
        location,
        requestId,
      })
    }
  }

  // Accept a request (driver)
  const acceptRequest = (requestId, estimatedTime) => {
    if (socket && connected && userType === "driver") {
      socket.emit("accept_request", {
        requestId,
        driverId: user._id,
        estimatedTime,
      })
    }
  }

  // Complete a request (driver)
  const completeRequest = (requestId, hospitalId) => {
    if (socket && connected && userType === "driver") {
      socket.emit("complete_request", {
        requestId,
        driverId: user._id,
        hospitalId,
      })
    }
  }

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        driverLocation,
        activeRequest,
        nearbyDrivers,
        pendingRequests,
        createRequest,
        updateDriverLocation,
        acceptRequest,
        completeRequest,
        setActiveRequest,
        setNearbyDrivers,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

