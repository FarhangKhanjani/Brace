// Base URLs for different environments
const config = {
    // API URL - fallback to local if not specified
    API_URL: process.env.REACT_APP_API_URL || 
             (window.location.hostname === 'localhost' 
                ? 'http://localhost:8080' 
                : 'https://brace-api.onrender.com'),  // Replace with your Render backend URL
    
    // Supabase URLs are already handled by environment variables
    SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
    SUPABASE_KEY: process.env.REACT_APP_SUPABASE_KEY,
};

export default config; 