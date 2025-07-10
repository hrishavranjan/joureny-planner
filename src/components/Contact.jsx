import React from 'react';
import '../css/contact.css';

const Contact = () => {
  return (
    <>
      <div className="header-section" style={{ backgroundImage: `url('/images/contact-header.webp')` }}>
        <div className="header-overlay">
          <h1>Contact Us</h1>
          <p>We’d love to hear from you!</p>
        </div>
      </div>

      <div className="box-container">
        {/* Box 1: Contact Details */}
        <div className="info-box box1">
          <div className="info-content">
            <h2>Get in Touch</h2>
            <p>Email: rishavranjan2003@gmail.com</p>
            <p>Phone: +91-9693989969</p>
            <p>Location: Bhubaneshwar, India</p>
            <p>Stay connected with us on social media!</p>
          </div>
        </div>

        {/* Box 2: AI Chat */}
        <div className="info-box box2">
          <div className="info-content">
            <h2>AI Chat Assistant</h2>
            <p>Need instant help? Try our AI Chat system.</p>
            <a href="ai-chat.html" className="chat-button">Open Chat</a>
          </div>
        </div>

        {/* Box 3: Social Media */}
        <div className="info-box box3">
          <div className="info-content">
            <h2>Connect with Us</h2>
            <div className="social-icons">
              <a href="https://www.instagram.com/rishavranjan__/" target="_blank" rel="noopener noreferrer"><i className="fab fa-instagram"></i></a>
              <a href="https://www.youtube.com/@theinfinity2001" target="_blank" rel="noopener noreferrer"><i className="fab fa-youtube"></i></a>
              <a href="https://github.com/hrishavranjan" target="_blank" rel="noopener noreferrer"><i className="fab fa-github"></i></a>
              <a href="https://www.linkedin.com/in/hrishav-ranjan-6b358a254/" target="_blank" rel="noopener noreferrer"><i className="fab fa-linkedin"></i></a>
              <a href="#"><i className="fab fa-x-twitter"></i></a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Contact;
