import React, { useState } from 'react';
import './FAQ.css';

const FAQ = () => {
    const [activeIndex, setActiveIndex] = useState(null);

    const toggleAccordion = (index) => {
        setActiveIndex(activeIndex === index ? null : index);
    };

    const faqData = [
        {
            category: "General Questions",
            questions: [
                {
                    question: "What is CryptoCap and how does it work?",
                    answer: "CryptoCap is a cryptocurrency portfolio tracking platform that helps you monitor your crypto investments in one place. You can add your holdings, track their performance, and get insights into market trends without connecting to your actual wallets or exchanges."
                },
                {
                    question: "Is CryptoCap free to use?",
                    answer: "Yes, CryptoCap is currently free to use with all core features available to all users. We may introduce premium features in the future, but our basic portfolio tracking will always remain free."
                },
                {
                    question: "Do I need to create an account to use CryptoCap?",
                    answer: "Yes, you need to create an account to save your portfolio and access personalized features. However, you can browse market trends on our homepage without signing up."
                }
            ]
        },
        {
            category: "Account & Security",
            questions: [
                {
                    question: "How is my data protected on CryptoCap?",
                    answer: "We use industry-standard encryption and security practices to protect your data. Your portfolio information is stored securely in our database, and we never store your passwords in plain text. We use Supabase for authentication which implements secure token-based authentication."
                },
                {
                    question: "What happens if I forget my password?",
                    answer: "If you forget your password, you can use the 'Forgot Password' option on the login page. We'll send you an email with instructions to reset your password securely."
                },
                {
                    question: "Why am I automatically logged out after 10 minutes of inactivity?",
                    answer: "This is a security feature to protect your account. If you leave your device unattended, the automatic logout helps prevent unauthorized access to your portfolio information."
                }
            ]
        },
        {
            category: "Portfolio Management",
            questions: [
                {
                    question: "How do I add cryptocurrencies to my portfolio?",
                    answer: "After logging in, navigate to your Dashboard and use the 'Add Asset' button. You can then select a cryptocurrency, enter the amount you own, and optionally add purchase price and date information."
                },
                {
                    question: "Does CryptoCap support all cryptocurrencies?",
                    answer: "We support most major cryptocurrencies and many altcoins. Our platform regularly updates to include new coins as they gain market significance. If you can't find a specific coin, please contact us to request its addition."
                },
                {
                    question: "How often are cryptocurrency prices updated?",
                    answer: "Our prices are updated in real-time from the Binance API with a refresh rate of 30 seconds on the homepage. On the dashboard, data refreshes whenever you load the page or manually refresh it."
                },
                {
                    question: "Can I track my historical portfolio performance?",
                    answer: "Yes, once you've added assets to your portfolio, CryptoCap automatically tracks their performance over time. You can view historical charts and performance metrics on your dashboard."
                }
            ]
        },
        {
            category: "Technical Questions",
            questions: [
                {
                    question: "Where does CryptoCap get its price data from?",
                    answer: "CryptoCap sources its price data primarily from the Binance API, which provides reliable and up-to-date cryptocurrency market information."
                },
                {
                    question: "Why might there be discrepancies between prices on CryptoCap and other platforms?",
                    answer: "Price discrepancies can occur due to differences in data sources, slight delays in API updates, or variations in how exchanges calculate prices. Different exchanges may have slightly different prices for the same cryptocurrency."
                },
                {
                    question: "Is there an API available for developers?",
                    answer: "We're currently developing a public API for developers. If you're interested in integrating with CryptoCap, please contact us for more information about our upcoming API release."
                }
            ]
        },
        {
            category: "Troubleshooting",
            questions: [
                {
                    question: "Why can't I see my portfolio data?",
                    answer: "This could be due to several reasons: you might not be logged in, there might be a temporary service disruption, or you haven't added any assets yet. Try refreshing the page or logging out and back in. If the problem persists, please contact support."
                },
                {
                    question: "What should I do if I encounter an error while using CryptoCap?",
                    answer: "If you encounter an error, try refreshing the page first. If the issue persists, you can contact our support team through the 'Contact' link in the footer or by emailing support@cryptocap.com."
                },
                {
                    question: "Why is the real-time data not loading?",
                    answer: "Real-time data might not load due to internet connectivity issues, temporary API outages, or high server load. We provide fallback data when real-time sources are unavailable. Try refreshing the page after a few minutes."
                }
            ]
        }
    ];

    return (
        <div className="faq-container">
            <div className="faq-header">
                <h1>Frequently Asked Questions</h1>
                <p>Find answers to common questions about CryptoCap and cryptocurrency portfolio tracking.</p>
            </div>

            <div className="faq-content">
                {faqData.map((category, categoryIndex) => (
                    <div key={categoryIndex} className="faq-category">
                        <h2>{category.category}</h2>
                        <div className="faq-questions">
                            {category.questions.map((item, questionIndex) => {
                                const index = `${categoryIndex}-${questionIndex}`;
                                return (
                                    <div 
                                        key={index} 
                                        className={`faq-item ${activeIndex === index ? 'active' : ''}`}
                                    >
                                        <div 
                                            className="faq-question"
                                            onClick={() => toggleAccordion(index)}
                                        >
                                            <h3>{item.question}</h3>
                                            <span className="faq-icon">
                                                {activeIndex === index ? '−' : '+'}
                                            </span>
                                        </div>
                                        <div className={`faq-answer ${activeIndex === index ? 'active' : ''}`}>
                                            <p>{item.answer}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default FAQ; 