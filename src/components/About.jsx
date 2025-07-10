import React from 'react';
import '../css/about.css';

const About = () => {
  return (
    <>
      <div className="header-section">
        <div className="header-overlay">
          <h1>About Us</h1>
          <p>Discover more about our journey planning tool and vision.</p>
        </div>
      </div>

      <div className="box-container">
        <div className="info-box" style={{ backgroundImage: `url('/images/box7.jpg')` }}>
          <div className="info-content">
            <h2>1. Our Mission</h2>
            <p>
              Journey Planner is a one-stop solution to manage your travel experiences. Whether you're heading for a vacation, business trip, or just a quick getaway, our tool helps you organize all essential details such as packing lists, places to visit, transportation modes, notes, and more. Start your adventure hassle-free with us.
            </p>
          </div>
        </div>

        <div className="info-box" style={{ backgroundImage: `url('/images/box8.jpg')` }}>
          <div className="info-content">
            <h2>2. Who We Are</h2>
            <p>
              Journey Planner is designed to simplify travel organization. We aim to provide travelers with a smart, efficient, and user-friendly platform to manage everything—from packing lists to notes, destinations, transportation modes, and more. Our team is passionate about making your trips smoother, better organized, and more enjoyable.
            </p>
          </div>
        </div>

        <div className="info-box" style={{ backgroundImage: `url('/images/box9.jpg')` }}>
          <div className="info-content">
            <h2>3. Notice / Future Updates</h2>
            <p>
              We are constantly working on exciting new features like AI-based travel suggestions, real-time flight/train tracking, and community travel stories. Stay tuned for updates and keep exploring with Journey Planner!
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default About;
