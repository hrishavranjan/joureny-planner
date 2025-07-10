import React from 'react';
import { Link } from 'react-router-dom';
import '../css/navbar.css';

const Navbar = () => {
  return (
    <div className="navbar">
      <div className="nav-left">
        <Link to="/" className="logo-name">
          <img src="/images/jplogo.png" alt="Logo" className="logo" />
          <span className="site-name">Journey Planner</span>
        </Link>
      </div>

      <div className="nav-center">
        <Link to="/">Home</Link>
        <Link to="/contact">Contact Us</Link>
        <Link to="/about">About</Link>
        <Link to="/faq">FAQ</Link>
      </div>

      <div className="nav-right">
        {}
        <Link to="/login" className="login-link">
          Login
        </Link>
      </div>
    </div>
  );
};

export default Navbar;
