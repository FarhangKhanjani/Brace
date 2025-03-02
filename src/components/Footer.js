import React from 'react';
import './Footer.css';

const Footer = () => {
    const currentYear = new Date().getFullYear();
    
    return (
        <footer className="footer">
            <div className="footer-content">
                <div className="footer-section">
                    <h3>CryptoCap</h3>
                    <p>Track and manage your cryptocurrency portfolio with ease.</p>
                </div>
                
                <div className="footer-section">
                    <h3>Quick Links</h3>
                    <ul>
                        <li><a href="/">Home</a></li>
                        <li><a href="/dashboard">Dashboard</a></li>
                        <li><a href="/login">Login</a></li>
                        <li><a href="/register">Register</a></li>
                    </ul>
                </div>
                
                <div className="footer-section">
                    <h3>Contact</h3>
                    <p>Email: info@cryptocap.com</p>
                    <p>Support: support@cryptocap.com</p>
                </div>
            </div>
            
            <div className="footer-bottom">
                <p>&copy; {currentYear} CryptoCap. All rights reserved.</p>
                <p>Designed with ❤️ by <span className="highlight">Farhang</span> and <span className="highlight">Cursor</span></p>
            </div>
        </footer>
    );
};

export default Footer; 