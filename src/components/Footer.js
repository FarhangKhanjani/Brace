import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css';
import { 
    BsCurrencyBitcoin, 
    BsGithub, 
    BsLinkedin, 
    BsYoutube 
} from 'react-icons/bs';
import { SiX } from 'react-icons/si';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="footer-container">
                <div className="footer-section">
                    <Link to="/" className="footer-logo">
                        <BsCurrencyBitcoin className="footer-logo-icon" />
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
                        <li><Link to="/faq">FAQ</Link></li>
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
                        <a href="https://x.com/ghaderazim47075" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)">
                            <SiX />
                        </a>
                        <a href="https://github.com/FarhangKhanjani/Brace" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                            <BsGithub />
                        </a>
                        <a href="https://www.linkedin.com/in/farhang-khanjani/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                            <BsLinkedin />
                        </a>
                        <a href="https://www.youtube.com/@fercoding" target="_blank" rel="noopener noreferrer" aria-label="YouTube">
                            <BsYoutube />
                        </a>
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