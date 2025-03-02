import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import { getCurrentPrice } from '../services/priceService';

const cryptoIcons = {
    BTC: 'https://assets.coingecko.com/coins/images/1/small/bitcoin.png',
    ETH: 'https://assets.coingecko.com/coins/images/279/small/ethereum.png',
    BNB: 'https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png',
    SOL: 'https://assets.coingecko.com/coins/images/4128/small/solana.png',
    DOGE: 'https://assets.coingecko.com/coins/images/5/small/dogecoin.png',
    XRP: 'https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png',
    ADA: 'https://assets.coingecko.com/coins/images/975/small/cardano.png',
    DOT: 'https://assets.coingecko.com/coins/images/12171/small/polkadot.png',
    AVAX: 'https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png',
    MATIC: 'https://assets.coingecko.com/coins/images/4713/small/matic-token-icon.png'
};

const Home = () => {
    const [marketData, setMarketData] = useState([]);
    const [loading, setLoading] = useState(true);
    
    useEffect(() => {
        const fetchMarketData = async () => {
            try {
                setLoading(true);
                
                // Top cryptocurrencies to display
                const symbols = ['BTC', 'ETH', 'BNB', 'SOL'];
                
                // Fetch prices for each symbol
                const data = await Promise.all(
                    symbols.map(async (symbol) => {
                        const price = await getCurrentPrice(symbol);
                        
                        // Generate random 24h change for demo (in a real app, you'd fetch this)
                        const change = (Math.random() * 10 - 3).toFixed(2);
                        
                        // Generate random 24h high/low for demo
                        const highLowPercent = Math.random() * 0.05; // 0-5% range
                        const high = price * (1 + highLowPercent);
                        const low = price * (1 - highLowPercent);
                        
                        return {
                            symbol,
                            price,
                            change,
                            high,
                            low,
                            isPositive: parseFloat(change) > 0
                        };
                    })
                );
                
                setMarketData(data);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching market data:', error);
                setLoading(false);
            }
        };
        
        fetchMarketData();
        
        // Refresh data every 30 seconds
        const intervalId = setInterval(fetchMarketData, 30000);
        
        return () => clearInterval(intervalId);
    }, []);
    
    return (
        <div className="home-container">
            <div className="hero-section">
                <h1>Start and Build Your Crypto Portfolio Here</h1>
                <p>Only at CryptoCap, you can build a good portfolio and learn best practices about cryptocurrency.</p>
                <Link to="/login" className="get-started-btn">Get Started</Link>
            </div>
            
            <div className="market-section">
                <h2>Market Trend</h2>
                
                <div className="market-grid">
                    {loading ? (
                        <div className="loading">Loading market data...</div>
                    ) : (
                        marketData.map((coin) => (
                            <div className="coin-card" key={coin.symbol}>
                                <div className="coin-header">
                                    <div className="coin-icon">
                                        <img 
                                            src={cryptoIcons[coin.symbol] || `https://via.placeholder.com/32/1a1825/ffffff?text=${coin.symbol}`}
                                            alt={coin.symbol}
                                            onError={(e) => {
                                                e.target.src = `https://via.placeholder.com/32/1a1825/ffffff?text=${coin.symbol}`;
                                            }}
                                        />
                                    </div>
                                    <div className="coin-name">
                                        <h3>{coin.symbol}</h3>
                                        <span>USDT</span>
                                    </div>
                                    <div className="coin-change">
                                        <span className={coin.isPositive ? 'positive' : 'negative'}>
                                            <i className={`fa fa-arrow-${coin.isPositive ? 'up' : 'down'}`}></i>
                                        </span>
                                    </div>
                                </div>
                                
                                <div className="coin-price">
                                    ${coin.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                
                                <div className="coin-change-percent">
                                    <span className={coin.isPositive ? 'positive' : 'negative'}>
                                        {coin.isPositive ? '+' : ''}{coin.change}%
                                    </span>
                                </div>
                                
                                <div className="coin-range">
                                    <div className="range-label">
                                        <span>24h High:</span>
                                        <span>${coin.high.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="range-label">
                                        <span>24h Low:</span>
                                        <span>${coin.low.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default Home; 
