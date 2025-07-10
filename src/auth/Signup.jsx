import React, { useState } from 'react';
import { createUserWithEmailAndPassword, sendEmailVerification, signInWithPopup } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { FcGoogle } from 'react-icons/fc';
import { toast } from 'react-toastify';
import { auth, db, googleProvider } from '../firebase';
import '../css/login.css';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    const allowedDomains = ['gmail.com', 'yahoo.com', 'kiit.ac.in'];
    const domain = email.split('@')[1];
    if (!allowedDomains.includes(domain)) {
      toast.error('❌ Email domain not allowed');
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      await sendEmailVerification(userCred.user);
      await setDoc(doc(db, 'users', userCred.user.uid), {
        name: name,
        email: email,
      });

      toast.success(
        '📩 A verification email has been sent. Please check your inbox and spam folder.',
        { autoClose: 5000 }
      );

      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      toast.error(`❌ ${err.message}`);
    }
  };

  const handleGoogleSignup = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      await setDoc(doc(db, 'users', user.uid), {
        name: user.displayName,
        email: user.email,
        photo: user.photoURL
      }, { merge: true });

      toast.success(`👋 Welcome ${user.displayName}`);
      navigate('/admin-feed');
    } catch (err) {
      toast.error('❌ Google Sign-Up failed');
      console.error(err);
    }
  };

  return (
    <div>
      {/* 🔙 Top-left fixed back button */}
      <div style={{
        position: 'absolute', top: '20px', left: '20px', zIndex: 1000
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
          ⬅️ Back to Home
        </Link>
      </div>

      <div className="login-container">
        <form onSubmit={handleSignup}>
          <h2>🚀 Sign Up</h2>
          <input
            type="text"
            placeholder="Your Name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div style={{ position: 'relative' }}>
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <span
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              {showPassword ? '🙈' : '👁️'}
            </span>
          </div>

          <button type="submit">Sign Up</button>

          <button type="button" onClick={handleGoogleSignup} style={{
            marginTop: '10px',
            fontWeight: 'bold',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            justifyContent: 'center',
            backgroundColor: '#fff',
            border: '1px solid #ccc',
            padding: '8px',
            borderRadius: '6px',
            cursor: 'pointer'
          }}>
            <FcGoogle size={20} />
            Sign up with Google
          </button>

          <p>Already have an account? <Link to="/login">Login</Link></p>
        </form>
      </div>
    </div>
  );
};

export default Signup;
