import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Home.css';

const cryptoIcons = {
    BTC: 'https://cryptologos.cc/logos/bitcoin-btc-logo.png',
    ETH: 'https://cryptologos.cc/logos/ethereum-eth-logo.png',
    BNB: 'https://cryptologos.cc/logos/bnb-bnb-logo.png',
    SOL: 'https://cryptologos.cc/logos/solana-sol-logo.png',
  };

function Home() {
  const navigate = useNavigate();
  const [cryptoData, setCryptoData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchCryptoData = async () => {
    try {
      const response = await axios.get('http://localhost:8080/top-cryptos');
      setCryptoData(response.data);
      setLoading(false);
    } catch (err) {
      setError('Failed to fetch crypto data');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCryptoData();
    // Fetch data every 10 seconds
    const interval = setInterval(fetchCryptoData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="loading">Loading market data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <h1>Start and Build Your Crypto Portfolio Here</h1>
        <p>Only at CryptoCap, you can build a good portfolio and learn best practices about cryptocurrency.</p>
        <button 
          className="get-started-btn"
          onClick={() => navigate('/login')}
        >
          Get Started
        </button>
      </section>

      {/* Market Trend Section */}
      <div className="market-trend-section">
        <h2>Market Trend</h2>
        <div className="trend-grid">
          {cryptoData.map((crypto) => (
            <div className="trend-card" key={crypto.symbol}>
              <div className="trend-header">
                <div className="crypto-identity">
                  <img 
                    src={cryptoIcons[crypto.symbol]} 
                    alt={crypto.symbol}
                    className="crypto-icon"
                  />
                  <div>
                    <span className="crypto-symbol">{crypto.symbol}</span>
                    <span className="crypto-name">USDT</span>
                  </div>
                </div>
                <div className="trend-indicator">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path 
                      d="M2 20L12 4L22 20" 
                      stroke={crypto.change_24h >= 0 ? "#00DAC6" : "#FF4444"} 
                      strokeWidth="2"
                    />
                  </svg>
                </div>
              </div>
              
              <div className="trend-price">
                <h3>${Number(crypto.price).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}</h3>
                <span className={`price-change ${crypto.change_24h >= 0 ? 'positive' : 'negative'}`}>
                  {crypto.change_24h >= 0 ? '+' : ''}{Number(crypto.change_24h).toFixed(2)}%
                </span>
              </div>
              
              <div className="trend-chart">
                <div className="price-range">
                  <span>24h High: ${Number(crypto.high_24h).toLocaleString()}</span>
                  <span>24h Low: ${Number(crypto.low_24h).toLocaleString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home; 