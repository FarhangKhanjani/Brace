import React from 'react';
import './PremiumFeatureComponent.css';

const PremiumFeatureComponent = () => {
  return (
    <div className="premium-feature-container">
      <div className="premium-feature-header">
        <h1>Premium Feature</h1>
        <p>Thank you for subscribing to our premium plan!</p>
      </div>
      
      <div className="premium-feature-content">
        <div className="feature-card">
          <h3>Advanced Analytics</h3>
          <p>Access detailed performance metrics and comprehensive trading reports.</p>
        </div>
        
        <div className="feature-card">
          <h3>Trading Signals</h3>
          <p>Receive AI-powered trading signals based on market trends and technical analysis.</p>
        </div>
        
        <div className="feature-card">
          <h3>API Access</h3>
          <p>Connect your own tools and services using our developer API.</p>
        </div>
        
        <div className="feature-card">
          <h3>Priority Support</h3>
          <p>Get priority access to our support team for faster issue resolution.</p>
        </div>
      </div>
    </div>
  );
};

export default PremiumFeatureComponent; 