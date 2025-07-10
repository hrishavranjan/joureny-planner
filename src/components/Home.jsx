import React from 'react';
// ❌ Remove the Navbar import
import '../css/home.css';

const Home = () => {
  return (
    <>
      <div className="header-section">
        <div className="header-overlay">
          <h1 className="gradient-text handwriting">Welcome to Journey Planner</h1>
          <p className="gradient-subtext subtext-font">
            Your perfect partner for planning and managing your journeys efficiently.
          </p>
        </div>
      </div>

      <div className="box-container">
        <div className="info-box" style={{ backgroundImage: `url('/images/box1.jpg')` }}>
          <div className="info-content different-handwriting">
            <h2>Plan Your Trip</h2>
            <div className="info-hover">
              <p>Create packing lists, set destinations, and manage transportation details effortlessly.</p>
            </div>
          </div>
        </div>

        <div className="info-box" style={{ backgroundImage: `url('/images/box2.webp')` }}>
          <div className="info-content different-handwriting">
            <h2>Explore More</h2>
            <div className="info-hover">
              <p>Discover places to visit, save notes, and keep contacts and expenses organized.</p>
            </div>
          </div>
        </div>

        <div className="info-box" style={{ backgroundImage: `url('/images/box3.png')` }}>
          <div className="info-content different-handwriting">
            <h2>Smart Organizer</h2>
            <div className="info-hover">
              <p>Manage every aspect of your journey in one place — smooth, simple, and smart!</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
