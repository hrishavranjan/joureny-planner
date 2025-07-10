import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import '../css/login.css';
import { toast } from 'react-toastify';

const ResetPassword = () => {
  const [email, setEmail] = useState('');

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      await sendPasswordResetEmail(auth, email);
      toast.info('🔁 Reset link sent to your email');
    } catch (err) {
      toast.error(`❌ ${err.message}`);
    }
  };

  return (
    <div>
      {/* 🔙 Top-left fixed back button */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 1000
      }}>
        <Link to="/" style={{
          color: '#fff',
          textDecoration: 'none',
          fontSize: '1rem',
          background: 'linear-gradient(to right, orange, purple)',
          padding: '6px 12px',
          borderRadius: '8px',
          fontWeight: 'bold',
          boxShadow: '0 0 8px rgba(0,0,0,0.3)'
        }}>
          🔙 Back to Home
        </Link>
      </div>

      <div className="login-container">
        <form onSubmit={handleReset}>
          <h2>🔑 Reset Password</h2>
          <input
            type="email"
            placeholder="Your Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button type="submit">Send Reset Link</button>
          <p><Link to="/login">Back to Login</Link></p>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
