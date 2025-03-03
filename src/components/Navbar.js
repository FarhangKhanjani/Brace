import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';
import './Navbar.css';
import { 
    BsCurrencyBitcoin, 
    BsList, 
    BsX 
} from 'react-icons/bs';

const Navbar = ({ session, onLogout }) => {
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    
    const handleLogout = async () => {
        await onLogout();
        setMobileMenuOpen(false);
    };
    
    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };
    
    const closeMobileMenu = () => {
        setMobileMenuOpen(false);
    };
    
    return (
        <>
            <nav className="navbar">
                <Link to="/" className="logo" onClick={closeMobileMenu}>
                    <BsCurrencyBitcoin className="logo-icon" />
                    CryptoCap
                </Link>
                
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
                
                <button className="mobile-menu-btn" onClick={toggleMobileMenu}>
                    <BsList />
                </button>
            </nav>
            
            {/* Mobile Menu */}
            <div className={`mobile-menu ${mobileMenuOpen ? 'active' : ''}`}>
                <button className="close-menu-btn" onClick={toggleMobileMenu}>
                    <BsX />
                </button>
                
                <div className="nav-links">
                    <Link to="/" onClick={closeMobileMenu}>Home</Link>
                    {session ? (
                        <>
                            <Link to="/dashboard" onClick={closeMobileMenu}>Dashboard</Link>
                            <button onClick={handleLogout}>Logout</button>
                        </>
                    ) : (
                        <Link to="/login" className="login-btn" onClick={closeMobileMenu}>
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </>
    );
};

export default Navbar; 