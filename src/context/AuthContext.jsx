"use client"

import { createContext, useState, useEffect, useContext } from "react"
import axios from "axios"
import { useNavigate } from "react-router-dom"
import toast from "react-hot-toast"

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem("token"))
  const [userType, setUserType] = useState(localStorage.getItem("userType"))
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  // Set axios defaults
  axios.defaults.baseURL = "https://smartambulance.onrender.com/api"
  if (token) {
    axios.defaults.headers.common["x-auth-token"] = token
  }

  // Load user on initial render
  useEffect(() => {
    const loadUser = async () => {
      if (token) {
        try {
          console.log("usertype", userType);
          
          const endpoint = userType === "user" ? "/auth/user" : "/auth/driver"
          const res = await axios.get(endpoint)
          setUser(res.data)
        } catch (err) {
          console.error("Error loading user:", err)
          localStorage.removeItem("token")
          localStorage.removeItem("userType")
          setToken(null)
          setUserType(null)
        }
      }
      setLoading(false)
    }

    loadUser()
  }, [token, userType])

  // Register user
  const register = async (formData, type) => {
    try {
      const endpoint = type === "user" ? "/auth/register-user" : "/auth/register-driver"
      const res = await axios.post(endpoint, formData)

      setToken(res.data.token)
      setUserType(type)
      localStorage.setItem("token", res.data.token)
      localStorage.setItem("userType", type)

      // Load user data
      const userRes = await axios.get(type === "user" ? "/auth/user" : "/auth/driver")
      setUser(userRes.data)

      toast.success(`${type === "user" ? "User" : "Driver"} registered successfully!`)
      navigate(type === "user" ? "/user/dashboard" : "/driver/dashboard")

      return true
    } catch (err) {
      console.error("Registration error:", err)
      toast.error(err.response?.data?.msg || "Registration failed")
      window.location.reload();
      return false
    }
  }

  // Login user
  const login = async (email, password, type) => {
    try {
      const endpoint = type === "user" ? "/auth/login-user" : "/auth/login-driver"
      const res = await axios.post(endpoint, { email, password })

      setToken(res.data.token)
      setUserType(type)
      localStorage.setItem("token", res.data.token)
      localStorage.setItem("userType", type)

      // Load user data
      const userRes = await axios.get(type === "user" ? "/auth/user" : "/auth/driver")
      setUser(userRes.data)

      toast.success("Logged in successfully!")
      navigate(type === "user" ? "/user/dashboard" : "/driver/dashboard")

      return true
    } catch (err) {
      console.error("Login error:", err)
      toast.error(err.response?.data?.msg || "Invalid credentials")
      return false
    }
  }

  // Logout
  const logout = () => {
    localStorage.removeItem("token")
    localStorage.removeItem("userType")
    setToken(null)
    setUserType(null)
    setUser(null)
    delete axios.defaults.headers.common["x-auth-token"]
    navigate("/login")
    toast.success("Logged out successfully")
  }

  // Update user profile
  const updateProfile = async (formData) => {
    try {
      const endpoint = userType === "user" ? "/auth/user" : "/auth/driver"
      const res = await axios.put(endpoint, formData)
      setUser(res.data)
      toast.success("Profile updated successfully")
      return true
    } catch (err) {
      console.error("Update profile error:", err)
      toast.error(err.response?.data?.msg || "Failed to update profile")
      return false
    }
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        userType,
        loading,
        register,
        login,
        logout,
        updateProfile,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

