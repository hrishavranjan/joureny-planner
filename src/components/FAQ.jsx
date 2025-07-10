import React from 'react';
import '../css/faq.css';

const FAQ = () => {
  return (
    <>
      <div className="header-section">
        <div className="header-overlay">
          <h1>Frequently Asked Questions</h1>
          <p>Answers to common questions about Journey Planner</p>
        </div>
      </div>

      <div className="faq-container">
        <div className="faq-box">
          <h2>1. Is Journey Planner free to use?</h2>
          <p>Yes, the basic version of Journey Planner is completely free to use.</p>
        </div>

        <div className="faq-box">
          <h2>2. Can I track my trips across devices?</h2>
          <p>Absolutely. Just log in to your account from any device to access your journey details.</p>
        </div>

        <div className="faq-box">
          <h2>3. How do I delete a trip?</h2>
          <p>Go to “My Trips” → select a trip → click on “Delete” to remove it permanently.</p>
        </div>

        <div className="faq-box">
          <h2>4. Will there be more features in the future?</h2>
          <p>Yes! We're working on AI recommendations, weather syncing, and real-time updates.</p>
        </div>
      </div>
    </>
  );
};

export default FAQ;
