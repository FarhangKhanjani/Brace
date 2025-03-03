import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import { FaBitcoin, FaTwitter, FaGithub, FaLinkedin } from 'react-icons/fa';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-section">
                    <Link to="/" className="footer-logo">
                        <FaBitcoin className="footer-logo-icon" />
                        CryptoCap
                    </Link>
                    <p className="footer-description">
                        Track, analyze, and optimize your cryptocurrency investments with our powerful tools.
                    </p>
                </div>
                
                <div className="footer-section">
                    <h3>Quick Links</h3>
                    <ul className="footer-links">
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/dashboard">Dashboard</Link></li>
                        <li><Link to="/login">Login</Link></li>
                        <li><Link to="/signup">Sign Up</Link></li>
                    </ul>
                </div>
                
                <div className="footer-section">
                    <h3>Resources</h3>
                    <ul className="footer-links">
                        <li><a href="#">API Documentation</a></li>
                        <li><a href="#">Help Center</a></li>
                        <li><a href="#">Privacy Policy</a></li>
                        <li><a href="#">Terms of Service</a></li>
                    </ul>
                </div>
                
                <div className="footer-section">
                    <h3>Connect With Us</h3>
                    <div className="social-links">
                        <a href="#" aria-label="Twitter"><FaTwitter /></a>
                        <a href="#" aria-label="GitHub"><FaGithub /></a>
                        <a href="#" aria-label="LinkedIn"><FaLinkedin /></a>
                    </div>
                </div>
            </div>
            
            <div className="footer-bottom">
                <p>&copy; {new Date().getFullYear()} CryptoCap. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer; 