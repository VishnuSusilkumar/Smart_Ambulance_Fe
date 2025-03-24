"use client"

import { useState } from "react"
import { Link } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { FaUser, FaAmbulance, FaPlus } from "react-icons/fa"

const Register = () => {
  const [userType, setUserType] = useState("user")
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    address: "",
    // User specific fields
    emergencyContacts: [{ name: "", phone: "", relationship: "" }],
    medicalInfo: {
      bloodType: "",
      allergies: "",
      medicalConditions: "",
      medications: "",
    },
    // Driver specific fields
    licenseNumber: "",
    vehicleNumber: "",
    vehicleType: "Basic",
    location: {
      latitude: "",
      longitude: "",
    },
  })

  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [errors, setErrors] = useState({})
  const { register } = useAuth()

  const handleChange = (e) => {
    const { name, value } = e.target

    if (name.includes(".")) {
      const [parent, child] = name.split(".")
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleEmergencyContactChange = (index, field, value) => {
    const updatedContacts = [...formData.emergencyContacts]
    updatedContacts[index] = {
      ...updatedContacts[index],
      [field]: value,
    }

    setFormData({
      ...formData,
      emergencyContacts: updatedContacts,
    })
  }

  const addEmergencyContact = () => {
    setFormData({
      ...formData,
      emergencyContacts: [...formData.emergencyContacts, { name: "", phone: "", relationship: "" }],
    })
  }

  const removeEmergencyContact = (index) => {
    const updatedContacts = [...formData.emergencyContacts]
    updatedContacts.splice(index, 1)

    setFormData({
      ...formData,
      emergencyContacts: updatedContacts,
    })
  }

  const validateStep = () => {
    const newErrors = {}

    if (step === 1) {
      if (!formData.name.trim()) newErrors.name = "Name is required"
      if (!formData.email.trim()) newErrors.email = "Email is required"
      if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid"
      if (!formData.password) newErrors.password = "Password is required"
      if (formData.password.length < 6) newErrors.password = "Password must be at least 6 characters"
      if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords do not match"
      if (!formData.phone.trim()) newErrors.phone = "Phone number is required"
    }

    if (step === 2 && userType === "user") {
      // Validate user specific fields if needed
      if (!formData.address.trim()) newErrors.address = "Address is required"
    }

    if (step === 2 && userType === "driver") {
      // Validate driver specific fields
      if (!formData.licenseNumber.trim()) newErrors.licenseNumber = "License number is required"
      if (!formData.vehicleNumber.trim()) newErrors.vehicleNumber = "Vehicle number is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep()) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    setStep(step - 1)
  }

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setFormData({
            ...formData,
            location: {
              latitude: position.coords.latitude.toString(),
              longitude: position.coords.longitude.toString(),
            },
          })
        },
        (error) => {
          console.error("Error getting location:", error)
          setErrors({
            ...errors,
            location: "Failed to get your location. Please enter manually.",
          })
        },
      )
    } else {
      setErrors({
        ...errors,
        location: "Geolocation is not supported by your browser",
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateStep()) return

    setLoading(true)

    try {
      // Format data for API
      const apiData = { ...formData }

      if (userType === "user") {
        // Format allergies, conditions, medications as arrays
        apiData.medicalInfo.allergies = formData.medicalInfo.allergies
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)

        apiData.medicalInfo.medicalConditions = formData.medicalInfo.medicalConditions
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)

        apiData.medicalInfo.medications = formData.medicalInfo.medications
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      }

      await register(apiData, userType)
    } catch (error) {
      console.error("Registration error:", error)
    } finally {
      setLoading(false)
    }
  }

  const renderStep1 = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Full Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
            errors.name ? "border-red-500" : ""
          }`}
        />
        {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email Address
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
            errors.email ? "border-red-500" : ""
          }`}
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
          Phone Number
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
            errors.phone ? "border-red-500" : ""
          }`}
        />
        {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone}</p>}
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
            errors.password ? "border-red-500" : ""
          }`}
        />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
            errors.confirmPassword ? "border-red-500" : ""
          }`}
        />
        {errors.confirmPassword && <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>}
      </div>
    </div>
  )

  const renderUserStep2 = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="address" className="block text-sm font-medium text-gray-700">
          Address
        </label>
        <textarea
          id="address"
          name="address"
          rows="3"
          value={formData.address}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
            errors.address ? "border-red-500" : ""
          }`}
        />
        {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Emergency Contacts</label>

        {formData.emergencyContacts.map((contact, index) => (
          <div key={index} className="border border-gray-200 rounded-md p-3 mb-3">
            <div className="flex justify-between items-center mb-2">
              <h4 className="text-sm font-medium">Contact #{index + 1}</h4>
              {formData.emergencyContacts.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEmergencyContact(index)}
                  className="text-red-500 hover:text-red-700 text-sm"
                >
                  Remove
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={contact.name}
                  onChange={(e) => handleEmergencyContactChange(index, "name", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={contact.phone}
                  onChange={(e) => handleEmergencyContactChange(index, "phone", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700">Relationship</label>
                <input
                  type="text"
                  value={contact.relationship}
                  onChange={(e) => handleEmergencyContactChange(index, "relationship", e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-xs"
                />
              </div>
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addEmergencyContact}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
        >
          <FaPlus className="mr-1" size={12} /> Add another contact
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Medical Information</label>

        <div className="grid grid-cols-1 gap-3">
          <div>
            <label htmlFor="bloodType" className="block text-xs font-medium text-gray-700">
              Blood Type
            </label>
            <select
              id="bloodType"
              name="medicalInfo.bloodType"
              value={formData.medicalInfo.bloodType}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            >
              <option value="">Select Blood Type</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
            </select>
          </div>

          <div>
            <label htmlFor="allergies" className="block text-xs font-medium text-gray-700">
              Allergies (comma separated)
            </label>
            <input
              type="text"
              id="allergies"
              name="medicalInfo.allergies"
              value={formData.medicalInfo.allergies}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="e.g. Penicillin, Peanuts, Latex"
            />
          </div>

          <div>
            <label htmlFor="medicalConditions" className="block text-xs font-medium text-gray-700">
              Medical Conditions (comma separated)
            </label>
            <input
              type="text"
              id="medicalConditions"
              name="medicalInfo.medicalConditions"
              value={formData.medicalInfo.medicalConditions}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="e.g. Diabetes, Asthma, Hypertension"
            />
          </div>

          <div>
            <label htmlFor="medications" className="block text-xs font-medium text-gray-700">
              Current Medications (comma separated)
            </label>
            <input
              type="text"
              id="medications"
              name="medicalInfo.medications"
              value={formData.medicalInfo.medications}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="e.g. Insulin, Ventolin, Lisinopril"
            />
          </div>
        </div>
      </div>
    </div>
  )

  const renderDriverStep2 = () => (
    <div className="space-y-4">
      <div>
        <label htmlFor="licenseNumber" className="block text-sm font-medium text-gray-700">
          Driver License Number
        </label>
        <input
          type="text"
          id="licenseNumber"
          name="licenseNumber"
          value={formData.licenseNumber}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
            errors.licenseNumber ? "border-red-500" : ""
          }`}
        />
        {errors.licenseNumber && <p className="mt-1 text-sm text-red-600">{errors.licenseNumber}</p>}
      </div>

      <div>
        <label htmlFor="vehicleNumber" className="block text-sm font-medium text-gray-700">
          Vehicle Number
        </label>
        <input
          type="text"
          id="vehicleNumber"
          name="vehicleNumber"
          value={formData.vehicleNumber}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm ${
            errors.vehicleNumber ? "border-red-500" : ""
          }`}
        />
        {errors.vehicleNumber && <p className="mt-1 text-sm text-red-600">{errors.vehicleNumber}</p>}
      </div>

      <div>
        <label htmlFor="vehicleType" className="block text-sm font-medium text-gray-700">
          Vehicle Type
        </label>
        <select
          id="vehicleType"
          name="vehicleType"
          value={formData.vehicleType}
          onChange={handleChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
        >
          <option value="Basic">Basic Ambulance</option>
          <option value="Advanced">Advanced Life Support</option>
          <option value="Critical Care">Critical Care Transport</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Current Location</label>

        <div className="grid grid-cols-2 gap-3 mb-2">
          <div>
            <label htmlFor="latitude" className="block text-xs font-medium text-gray-700">
              Latitude
            </label>
            <input
              type="text"
              id="latitude"
              name="location.latitude"
              value={formData.location.latitude}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="e.g. 12.9716"
            />
          </div>

          <div>
            <label htmlFor="longitude" className="block text-xs font-medium text-gray-700">
              Longitude
            </label>
            <input
              type="text"
              id="longitude"
              name="location.longitude"
              value={formData.location.longitude}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              placeholder="e.g. 77.5946"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={getCurrentLocation}
          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
        >
          Get Current Location
        </button>

        {errors.location && <p className="mt-1 text-sm text-red-600">{errors.location}</p>}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-blue-600">
            Smart<span className="text-rose-500">Ambulance</span>
          </h1>
          <h2 className="mt-6 text-2xl font-bold text-gray-900">Create your account</h2>
        </div>

        <div className="flex justify-center space-x-4 mt-4">
          <button
            type="button"
            onClick={() => setUserType("user")}
            className={`flex items-center px-4 py-2 rounded-lg ${
              userType === "user"
                ? "bg-blue-100 text-blue-700 border border-blue-300"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            <FaUser className="w-5 h-5 mr-2" />
            Patient
          </button>
          <button
            type="button"
            onClick={() => setUserType("driver")}
            className={`flex items-center px-4 py-2 rounded-lg ${
              userType === "driver"
                ? "bg-rose-100 text-rose-700 border border-rose-300"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50"
            }`}
          >
            <FaAmbulance className="w-5 h-5 mr-2" />
            Driver
          </button>
        </div>

        <div className="mt-8">
          <div className="flex items-center justify-between mb-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className={`bg-blue-600 h-2 rounded-full ${step === 1 ? "w-1/2" : "w-full"}`}></div>
            </div>
            <div className="ml-4 text-sm font-medium text-gray-500">Step {step} of 2</div>
          </div>

          <form onSubmit={handleSubmit}>
            {step === 1 && renderStep1()}
            {step === 2 && userType === "user" && renderUserStep2()}
            {step === 2 && userType === "driver" && renderDriverStep2()}

            <div className="flex justify-between mt-6">
              {step > 1 && (
                <button
                  type="button"
                  onClick={prevStep}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Back
                </button>
              )}

              {step < 2 ? (
                <button
                  type="button"
                  onClick={nextStep}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Next
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      Registering...
                    </span>
                  ) : (
                    "Register"
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Already have an account?{" "}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default Register

