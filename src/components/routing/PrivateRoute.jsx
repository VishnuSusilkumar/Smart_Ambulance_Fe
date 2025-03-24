"use client"

import { Navigate, Outlet } from "react-router-dom"
import { useAuth } from "../../context/AuthContext"
import Sidebar from "../layout/Sidebar"
import Header from "../layout/Header"

const PrivateRoute = ({ userType }) => {
  const { isAuthenticated, loading, userType: authUserType } = useAuth()

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />
  }

  if (userType !== authUserType) {
    return <Navigate to={`/${authUserType}/dashboard`} />
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

export default PrivateRoute

