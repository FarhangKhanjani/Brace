import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import { supabase } from './supabase';
import './App.css';
import Login from './components/Login';
import SignUp from './components/SignUp';
import Home from './components/Home';
import Dashboard from './components/Dashboard';
import EnvTest from './components/EnvTest';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import config from './config';
import { Toaster } from 'react-hot-toast';

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('App mounted');
    console.log('Current URL:', window.location.href);
    console.log('Using API URL:', config.API_URL);
    
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Got session:', session);
      console.log('Session user:', session?.user);
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session);
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    window.location.href = '/';
  };

  // Show a minimal loading state
  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#13111c',
        color: '#fff'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      <Router>
        <div className="app">
          <nav className="navbar">
            <div className="logo">CryptoCap</div>
            <div className="nav-links">
              <Link to="/">Home</Link>
              {session ? (
                <>
                  <Link to="/dashboard">Dashboard</Link>
                  <button onClick={handleLogout}>Logout</button>
                </>
              ) : (
                <Link to="/login" className="login-btn">Login</Link>
              )}
            </div>
          </nav>

          <Routes>
            <Route path="/" element={<Home />} />
            <Route 
              path="/login" 
              element={session ? <Navigate to="/dashboard" /> : <Login />} 
            />
            <Route 
              path="/signup" 
              element={session ? <Navigate to="/dashboard" /> : <SignUp />} 
            />
            <Route 
              path="/dashboard" 
              element={session ? <Dashboard /> : <Navigate to="/login" />} 
            />
            <Route path="/env-test" element={<EnvTest />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </div>
      </Router>
      <Toaster position="top-right" />
      <ToastContainer />
    </>
  );
}

export default App;
