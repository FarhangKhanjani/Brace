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
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import ResetPassword from './components/ResetPassword';
import { startActivityMonitoring } from './utils/sessionManager';
import Navbar from './components/Navbar';

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

  useEffect(() => {
    // Start monitoring user activity when the app loads
    const cleanup = startActivityMonitoring();
    
    // Clean up when the component unmounts
    return cleanup;
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
    <ErrorBoundary showDetails={process.env.NODE_ENV === 'development'}>
      <Router>
        <div className="app">
          <Navbar session={session} onLogout={handleLogout} />

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
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <Footer />
        </div>
      </Router>
      <Toaster position="top-right" />
      <ToastContainer />
    </ErrorBoundary>
  );
}

export default App;
