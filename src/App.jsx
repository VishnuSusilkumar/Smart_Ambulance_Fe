import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import PrivateRoute from "./components/routing/PrivateRoute";
import Login from "./pages/Login";
import Register from "./pages/Register";
import UserDashboard from "./pages/user/Dashboard";
import RequestAmbulance from "./pages/user/RequestAmbulance";
import TrackAmbulance from "./pages/user/TrackAmbulance";
import UserProfile from "./pages/user/Profile";
import UserHistory from "./pages/user/History";
import DriverDashboard from "./pages/driver/Dashboard";
import DriverRequests from "./pages/driver/Requests";
import DriverProfile from "./pages/driver/Profile";
import DriverHistory from "./pages/driver/History";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <Toaster position="top-right" />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* User Routes */}
            <Route path="/user" element={<PrivateRoute userType="user" />}>
              <Route path="dashboard" element={<UserDashboard />} />
              <Route path="request" element={<RequestAmbulance />} />
              <Route path="track/:requestId" element={<TrackAmbulance />} />
              <Route path="profile" element={<UserProfile />} />
              <Route path="history" element={<UserHistory />} />
            </Route>

            {/* Driver Routes */}
            <Route path="/driver" element={<PrivateRoute userType="driver" />}>
              <Route path="dashboard" element={<DriverDashboard />} />
              <Route path="requests" element={<DriverRequests />} />
              <Route path="profile" element={<DriverProfile />} />
              <Route path="history" element={<DriverHistory />} />
            </Route>

            {/* Redirect and 404 */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
