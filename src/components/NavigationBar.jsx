import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/NavigationBar.css';
import { auth } from '../firebase';
import { toast } from 'react-toastify';
import { UserContext } from '../context/UserContext';

const ADMIN_EMAIL = 'hrishavranjan2003@gmail.com';

const NavigationBar = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState({ visible: false, type: '', message: '' });

  const toggleModal = (type, message) => {
    setModal({ visible: true, type, message });
  };

  const handleModalConfirm = async () => {
    const currentType = modal.type;
    setModal((prev) => ({ ...prev, visible: false }));

    if (currentType === 'logout') {
      try {
        await auth.signOut();
        toast.success('🚪 Logged out successfully!');
        navigate('/login');
      } catch (error) {
        toast.error('❌ Logout failed');
      }
    } else if (currentType === 'reset') {
      if (user?.email) {
        try {
          await auth.sendPasswordResetEmail(user.email);
          toast.success('📬 Password reset email sent!');
        } catch (err) {
          toast.error('Logout Then click to forget password to reset it.');
        }
      } else {
        toast.error('⚠️ No user email found. Please re-login.');
      }
    }
  };

  const handleModalCancel = () => {
    setModal({ visible: false, type: '', message: '' });
  };

  return (
    <>
      <nav className="navbar">
        <Link
          to="/admin-feed"
          className="nav-left logo-name"
          onClick={() => setMenuOpen(false)}
        >
          <img
            src="/images/jplogo.png"
            alt="Journey Planner Logo"
            className="logo"
          />
          <span className="site-name">Journey Planner</span>
        </Link>

        <div className="hamburger" onClick={() => setMenuOpen((prev) => !prev)}>
          {menuOpen ? '✖' : '☰'}
        </div>

        <div className={`nav-menu ${menuOpen ? 'open' : ''}`}>
          <div className="hamburger-menu-list">
            <Link to="/admin-feed" onClick={() => setMenuOpen(false)}>
              📢 Admin Updates
            </Link>

            <Link to="/dashboard" onClick={() => setMenuOpen(false)}>
              📋 Journey Manager
            </Link>

            <Link to="/ai-trips" onClick={() => setMenuOpen(false)}>
              🤖 AI Mood Trips
            </Link>

            {user?.email === ADMIN_EMAIL && (
              <Link
                to="/admin-panel"
                onClick={() => setMenuOpen(false)}
                className="admin-create-post-link"
              >
                📝 Create Post
              </Link>
            )}

            <hr className="menu-separator" />

            <Link to="/profile" onClick={() => setMenuOpen(false)}>
              👥 {(user?.displayName || user?.email || 'User')} (View Profile)
            </Link>

            <button
              className="menu-button"
              onClick={() =>
                toggleModal('reset', 'Send password reset email?')
              }
            >
              🔁 Reset Account
            </button>

            <button
              className="menu-button logout-btn"
              onClick={() =>
                toggleModal('logout', 'Are you sure you want to logout?')
              }
            >
              🚪 Logout
            </button>
          </div>
        </div>
      </nav>

      {modal.visible && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p>{modal.message}</p>
            <div className="modal-buttons">
              <button className="confirm" onClick={handleModalConfirm}>
                ✅ Yes
              </button>
              <button className="cancel" onClick={handleModalCancel}>
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavigationBar;
