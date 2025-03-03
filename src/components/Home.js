import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import { FaBitcoin, FaEthereum } from 'react-icons/fa';
import { SiBinance, SiSolana } from 'react-icons/si';

const Home = () => {
    // Sample crypto data
    const cryptoData = [
        {
            id: 'bitcoin',
            name: 'Bitcoin',
            symbol: 'BTC',
            price: 91696.64,
            change: 4.13,
            icon: <FaBitcoin size={24} color="#F7931A" />,
            high24h: 92114.22,
            low24h: 91279.06
        },
        {
            id: 'ethereum',
            name: 'Ethereum',
            symbol: 'ETH',
            price: 2338.07,
            change: 3.11,
            icon: <FaEthereum size={24} color="#627EEA" />,
            high24h: 2446.01,
            low24h: 2230.13
        },
        {
            id: 'binancecoin',
            name: 'BNB',
            symbol: 'BNB',
            price: 598.59,
            change: 4.23,
            icon: <SiBinance size={24} color="#F3BA2F" />,
            high24h: 603.71,
            low24h: 593.47
        },
        {
            id: 'solana',
            name: 'Solana',
            symbol: 'SOL',
            price: 158.38,
            change: 0.29,
            icon: <SiSolana size={24} color="#00FFA3" />,
            high24h: 163.22,
            low24h: 153.54
        }
    ];

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2
        }).format(price);
    };

    return (
        <div className="home-container">
            <section className="hero-section">
                <h1 className="hero-title">Start and Build Your Crypto Portfolio Here</h1>
                <p className="hero-subtitle">
                    Only at CryptoCap, you can build a good portfolio and learn best practices about cryptocurrency.
                </p>
                <Link to="/signup" className="get-started-btn">
                    Get Started
                </Link>
            </section>

            <section className="market-section">
                <h2 className="section-title">Market Trend</h2>
                <div className="crypto-grid">
                    {cryptoData.map((crypto) => (
                        <div key={crypto.id} className="crypto-card">
                            <div className="crypto-header">
                                <div className="crypto-icon">
                                    {crypto.icon}
                                </div>
                                <div>
                                    <div className="crypto-name">{crypto.name}</div>
                                    <div className="crypto-symbol">{crypto.symbol}/USDT</div>
                                </div>
                            </div>
                            <div className="crypto-price">{formatPrice(crypto.price)}</div>
                            <div className={`crypto-change ${crypto.change >= 0 ? 'positive' : 'negative'}`}>
                                {crypto.change >= 0 ? '+' : ''}{crypto.change}%
                            </div>
                            <div className="crypto-details">
                                <div className="detail-label">24h High:</div>
                                <div className="detail-value">{formatPrice(crypto.high24h)}</div>
                                <div className="detail-label">24h Low:</div>
                                <div className="detail-value">{formatPrice(crypto.low24h)}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>
        </div>
    );
};

export default Home; 
