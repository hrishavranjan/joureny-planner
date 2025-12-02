import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../css/navbar.css';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  return (
    <div className="navbar">
      {/* LEFT */}
      <div className="nav-left">
        <Link to="/" className="logo-name" onClick={closeMenu}>
          <img src="/images/jplogo.png" alt="Logo" className="logo" />
          <span className="site-name">Journey Planner</span>
        </Link>
      </div>

      {/* LOGIN ALWAYS OUTSIDE */}
      <div className="nav-right">
        <Link to="/login" className="login-link" onClick={closeMenu}>
          Login
        </Link>
      </div>

      {/* HAMBURGER */}
      <div className={`hamburger ${isOpen ? "open" : ""}`} onClick={toggleMenu}>
        <span className="bar"></span>
        <span className="bar"></span>
        <span className="bar"></span>
      </div>

      {/* DROPDOWN LINKS */}
      <div className={`nav-center ${isOpen ? "open" : ""}`}>
        <Link to="/" onClick={closeMenu}>Home</Link>
        <Link to="/contact" onClick={closeMenu}>Contact Us</Link>
        <Link to="/about" onClick={closeMenu}>About</Link>
        <Link to="/faq" onClick={closeMenu}>FAQ</Link>
      </div>
    </div>
  );
};

export default Navbar;
