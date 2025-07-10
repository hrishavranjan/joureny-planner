import React, { useContext } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from 'react-router-dom';
import { UserContext } from './context/UserContext';

import NavigationBar from './components/NavigationBar';
import Navbar from './components/Navbar';

import Home from './components/Home';
import About from './components/About';
import Contact from './components/Contact';
import FAQ from './components/FAQ';
import Signup from './auth/Signup';
import Login from './auth/Login';
import ResetPassword from './auth/ResetPassword';
import Dashboard from './components/Dashboard';
import AiMoodTrips from './components/AiMoodTrips';
import Profile from './components/Profile';
import AdminFeed from './components/AdminFeed';
import AdminPanel from './components/AdminPanel';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// ✅ Split AppContent to separate logic, including loading fallback
const AppContent = () => {
  const { user, loading } = useContext(UserContext);
  const location = useLocation();

  const hideNavPaths = ['/login', '/signup', '/reset'];

  if (loading) {
    return (
      <p style={{ textAlign: 'center', color: 'white', fontSize: '1.2rem' }}>
        ⏳ Loading user session...
      </p>
    );
  }

  return (
    <>
      {!hideNavPaths.includes(location.pathname) &&
        (user ? <NavigationBar /> : <Navbar />)}

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/login" element={<Login />} />
        <Route path="/reset" element={<ResetPassword />} />

        {/* Private Routes (require login) */}
        <Route
          path="/dashboard"
          element={
            user ? (
              <Dashboard />
            ) : (
              <Navigate to="/login" state={{ from: location }} replace />
            )
          }
        />
        <Route
          path="/ai-trips"
          element={
            user ? (
              <AiMoodTrips />
            ) : (
              <Navigate to="/login" state={{ from: location }} replace />
            )
          }
        />
        <Route
          path="/profile"
          element={
            user ? (
              <Profile />
            ) : (
              <Navigate to="/login" state={{ from: location }} replace />
            )
          }
        />
        <Route
          path="/admin-feed"
          element={
            user ? (
              <AdminFeed />
            ) : (
              <Navigate to="/login" state={{ from: location }} replace />
            )
          }
        />
        <Route
          path="/admin-panel"
          element={
            user ? (
              <AdminPanel />
            ) : (
              <Navigate to="/login" state={{ from: location }} replace />
            )
          }
        />
      </Routes>

      <ToastContainer position="bottom-right" />
    </>
  );
};

// ✅ Wrap AppContent inside <Router>
const App = () => (
  <Router>
    <AppContent />
  </Router>
);

export default App;
