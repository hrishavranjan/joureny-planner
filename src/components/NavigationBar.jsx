import React, { useState, useRef, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../css/NavigationBar.css';
import { auth } from '../firebase';
import { toast } from 'react-toastify';
import { UserContext } from '../context/UserContext';

const ADMIN_EMAIL = 'hrishavranjan2003@gmail.com';

const NavigationBar = () => {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const dropdownRef = useRef();
  const [modal, setModal] = useState({ visible: false, type: '', message: '' });

  const toggleModal = (type, message) => {
    setModal({ visible: true, type, message });
  };

  const handleModalConfirm = async () => {
    setModal({ ...modal, visible: false });

    if (modal.type === 'logout') {
      try {
        await auth.signOut();
        toast.success('🚪 Logged out successfully!');
        navigate('/login');
      } catch (error) {
        toast.error('❌ Logout failed');
      }
    } else if (modal.type === 'reset') {
      if (user?.email) {
        try {
          await auth.sendPasswordResetEmail(auth, user.email);
          toast.success('📬 Password reset email sent!');
        } catch (err) {
          toast.error('❌ Failed to send reset email');
        }
      } else {
        toast.error('⚠️ No user email found. Please re-login.');
      }
    }
  };

  const handleModalCancel = () => {
    setModal({ visible: false, type: '', message: '' });
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <nav className="navbar">
        <Link to="/admin-feed" className="nav-left logo-name" onClick={() => setMenuOpen(false)}>
  <img src="/images/jplogo.png" alt="Journey Planner Logo" className="logo" />
  <span className="site-name">Journey Planner</span>
</Link>


        <div className="hamburger" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? '✖' : '☰'}
        </div>

        <div className={`nav-menu ${menuOpen ? 'open' : ''}`}>
          <div className="nav-center">
            <Link to="/admin-feed" onClick={() => setMenuOpen(false)}>📢 Admin Updates</Link>
            <Link to="/dashboard" onClick={() => setMenuOpen(false)}>📋 Journey Manager</Link>
            <Link to="/ai-trips" onClick={() => setMenuOpen(false)}>🤖 AI Mood Trips</Link>
            {user?.email === ADMIN_EMAIL && (
              <Link
                to="/admin-panel"
                onClick={() => setMenuOpen(false)}
                className="admin-create-post-link"
              >
                📝 Create Post
              </Link>
            )}
          </div>

          <div className="nav-right" ref={dropdownRef}>
            {user ? (
              <div className="profile-dropdown" onClick={() => setShowDropdown((prev) => !prev)}>
                <span className="profile-toggle">
                  👤 {user.displayName || user.email || 'Profile'} ▾
                </span>
                <ul className={`dropdown-content ${showDropdown ? 'show' : ''}`}>
                  <li><Link to="/profile">👥 View Profile</Link></li>
                  <li>
                    <button onClick={() => toggleModal('reset', 'Send password reset email?')}>
                      🔁 Reset Account
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => toggleModal('logout', 'Are you sure you want to logout?')}
                      className="logout-btn"
                    >
                      🚪 Logout
                    </button>
                  </li>
                </ul>
              </div>
            ) : (
              <span style={{ color: 'white' }}>Loading...</span>
            )}
          </div>
        </div>
      </nav>

      {modal.visible && (
        <div className="modal-overlay">
          <div className="modal-box">
            <p>{modal.message}</p>
            <div className="modal-buttons">
              <button className="confirm" onClick={handleModalConfirm}>✅ Yes</button>
              <button className="cancel" onClick={handleModalCancel}>❌ Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NavigationBar;
