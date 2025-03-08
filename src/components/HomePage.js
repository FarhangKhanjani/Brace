import React from 'react';
import { Link } from 'react-router-dom';
import './HomePage.css';
import homepageImage from '../assets/images/homepage.jpg';

const HomePage = () => {
    return (
        <div className="homepage-container">
            <div className="homepage-content">
                <div className="homepage-text">
                    <h1>Track Your Trading Journey</h1>
                    <p>
                        CryptoCap helps you monitor your trades, track performance,
                        and make better investment decisions.
                    </p>
                    <div className="cta-buttons">
                        <Link to="/signup" className="cta-button primary">Get Started</Link>
                        <Link to="/login" className="cta-button secondary">Login</Link>
                    </div>
                </div>
                <div className="homepage-image">
                    <img src={homepageImage} alt="Trading dashboard" />
                </div>
            </div>
        </div>
    );
};

export default HomePage; 