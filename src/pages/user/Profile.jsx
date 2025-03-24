"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaPlus,
  FaTrash,
  FaSave,
} from "react-icons/fa";
import toast from "react-hot-toast";

const UserProfile = () => {
  const { user, updateProfile } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    emergencyContacts: [],
    medicalInfo: {
      bloodType: "",
      allergies: [],
      medicalConditions: [],
      medications: [],
    },
  });

  // Load user data when component mounts
  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        emergencyContacts: user.emergencyContacts || [],
        medicalInfo: {
          bloodType: user.medicalInfo?.bloodType || "",
          allergies: user.medicalInfo?.allergies || [],
          medicalConditions: user.medicalInfo?.medicalConditions || [],
          medications: user.medicalInfo?.medications || [],
        },
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name.includes(".")) {
      const [parent, child] = name.split(".");
      setFormData({
        ...formData,
        [parent]: {
          ...formData[parent],
          [child]: value,
        },
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  const handleArrayChange = (e, field) => {
    const { value } = e.target;
    const items = value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    setFormData({
      ...formData,
      medicalInfo: {
        ...formData.medicalInfo,
        [field]: items,
      },
    });
  };

  const handleContactChange = (index, field, value) => {
    const updatedContacts = [...formData.emergencyContacts];
    updatedContacts[index] = {
      ...updatedContacts[index],
      [field]: value,
    };

    setFormData({
      ...formData,
      emergencyContacts: updatedContacts,
    });
  };

  const addEmergencyContact = () => {
    setFormData({
      ...formData,
      emergencyContacts: [
        ...formData.emergencyContacts,
        { name: "", phone: "", relationship: "" },
      ],
    });
  };

  const removeEmergencyContact = (index) => {
    const updatedContacts = [...formData.emergencyContacts];
    updatedContacts.splice(index, 1);

    setFormData({
      ...formData,
      emergencyContacts: updatedContacts,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateProfile(formData);
      toast.success("Profile updated successfully");
    } catch (err) {
      console.error("Error updating profile:", err);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Personal Information
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Update your personal information and emergency contacts.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="px-4 py-5 sm:p-6">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div>
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Full Name
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaUser className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="name"
                  id="name"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Your full name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                Email Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaEnvelope className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  name="email"
                  id="email"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md bg-gray-50"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  readOnly
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Email cannot be changed.
              </p>
            </div>

            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Phone Number
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaPhone className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="address"
                className="block text-sm font-medium text-gray-700"
              >
                Address
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="address"
                  id="address"
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Your address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-lg font-medium text-gray-900">
              Medical Information
            </h4>
            <p className="mt-1 text-sm text-gray-500">
              This information will be shared with emergency responders.
            </p>

            <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="bloodType"
                  className="block text-sm font-medium text-gray-700"
                >
                  Blood Type
                </label>
                <select
                  id="bloodType"
                  name="medicalInfo.bloodType"
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                  value={formData.medicalInfo.bloodType}
                  onChange={handleChange}
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
                <label
                  htmlFor="allergies"
                  className="block text-sm font-medium text-gray-700"
                >
                  Allergies (comma separated)
                </label>
                <input
                  type="text"
                  id="allergies"
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="e.g. Penicillin, Peanuts, Latex"
                  value={formData.medicalInfo.allergies.join(", ")}
                  onChange={(e) => handleArrayChange(e, "allergies")}
                />
              </div>

              <div>
                <label
                  htmlFor="medicalConditions"
                  className="block text-sm font-medium text-gray-700"
                >
                  Medical Conditions (comma separated)
                </label>
                <input
                  type="text"
                  id="medicalConditions"
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="e.g. Diabetes, Asthma, Hypertension"
                  value={formData.medicalInfo.medicalConditions.join(", ")}
                  onChange={(e) => handleArrayChange(e, "medicalConditions")}
                />
              </div>

              <div>
                <label
                  htmlFor="medications"
                  className="block text-sm font-medium text-gray-700"
                >
                  Current Medications (comma separated)
                </label>
                <input
                  type="text"
                  id="medications"
                  className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="e.g. Insulin, Ventolin, Lisinopril"
                  value={formData.medicalInfo.medications.join(", ")}
                  onChange={(e) => handleArrayChange(e, "medications")}
                />
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-lg font-medium text-gray-900">
              Emergency Contacts
            </h4>
            <p className="mt-1 text-sm text-gray-500">
              People who should be contacted in case of an emergency.
            </p>

            <div className="mt-4 space-y-4">
              {formData.emergencyContacts.map((contact, index) => (
                <div
                  key={index}
                  className="border border-gray-200 rounded-md p-4"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h5 className="text-sm font-medium text-gray-700">
                      Contact #{index + 1}
                    </h5>
                    <button
                      type="button"
                      onClick={() => removeEmergencyContact(index)}
                      className="text-red-600 hover:text-red-800 focus:outline-none"
                    >
                      <FaTrash className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        Name
                      </label>
                      <input
                        type="text"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={contact.name}
                        onChange={(e) =>
                          handleContactChange(index, "name", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        Phone
                      </label>
                      <input
                        type="tel"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={contact.phone}
                        onChange={(e) =>
                          handleContactChange(index, "phone", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-700">
                        Relationship
                      </label>
                      <input
                        type="text"
                        className="mt-1 focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={contact.relationship}
                        onChange={(e) =>
                          handleContactChange(
                            index,
                            "relationship",
                            e.target.value
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={addEmergencyContact}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaPlus className="h-4 w-4 mr-2" />
                Add Emergency Contact
              </button>
            </div>
          </div>

          <div className="mt-8 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                  Saving...
                </span>
              ) : (
                <>
                  <FaSave className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserProfile;
