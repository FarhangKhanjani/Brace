import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
// Make reportWebVitals optional
// import reportWebVitals from './reportWebVitals';

console.log('Starting application...');

const root = createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
