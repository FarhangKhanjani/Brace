import React from 'react';
import { BsCupHot } from 'react-icons/bs';
import './BuyMeCoffee.css';

const BuyMeCoffee = () => {
    return (
        <a 
            href="https://buymeacoffee.com/farhang" 
            target="_blank" 
            rel="noopener noreferrer"
            className="buy-me-coffee"
            aria-label="Buy me a coffee"
            title="Support this project"
        >
            <BsCupHot className="coffee-icon" />
        </a>
    );
};

export default BuyMeCoffee; 