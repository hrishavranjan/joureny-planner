import React, { useState, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { getDoc, doc } from 'firebase/firestore';
import { FcGoogle } from 'react-icons/fc';
import { toast } from 'react-toastify';
import { auth, db, googleProvider } from '../firebase';
import { UserContext } from '../context/UserContext'; // ✅ Context for user
import '../css/login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useContext(UserContext); // ✅ Pull setUser from context

  const handleLogin = async (e) => {
    e.preventDefault();

    const allowedDomains = ['gmail.com', 'yahoo.com', 'kiit.ac.in'];
    const domain = email.split('@')[1];
    if (!allowedDomains.includes(domain)) {
      toast.error('❌ Email domain not allowed');
      return;
    }

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, password);
      const userSnap = await getDoc(doc(db, 'users', userCred.user.uid));
      const name = userSnap.exists() ? userSnap.data().name : 'User';
      toast.success(`👋 Hi ${name}`, { autoClose: 2000 });

      setUser(userCred.user); // ✅ Update context
      navigate('/admin-feed');

    } catch (err) {
      toast.error(`❌ ${err.message}`);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      toast.success(`👋 Welcome ${user.displayName}`);
      setUser(user); // ✅ Update context
      navigate('/admin-feed');
    } catch (err) {
      console.error(err);
      toast.error('❌ Google Sign-In failed');
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
        <form onSubmit={handleLogin}>
          <h2>🔐 Login</h2>
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

          <button type="submit">Login</button>

          <button type="button" onClick={handleGoogleLogin} style={{
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
            Sign in with Google
          </button>

          <p><Link to="/reset">Forgot Password?</Link></p>
          <p>Don't have an account? <Link to="/signup">Sign Up</Link></p>
        </form>
      </div>
    </div>
  );
};

export default Login;
