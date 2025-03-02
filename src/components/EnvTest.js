import React from 'react';

const EnvTest = () => {
    return (
        <div>
            <h2>Environment Variables Test</h2>
            <pre>
                {JSON.stringify({
                    REACT_APP_SUPABASE_URL: process.env.REACT_APP_SUPABASE_URL,
                    REACT_APP_API_URL: process.env.REACT_APP_API_URL,
                    // Don't log the actual key, just check if it exists
                    REACT_APP_SUPABASE_KEY_EXISTS: !!process.env.REACT_APP_SUPABASE_KEY
                }, null, 2)}
            </pre>
        </div>
    );
};

export default EnvTest; 