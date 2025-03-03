// Session timeout in milliseconds (10 minutes)
const SESSION_TIMEOUT = 10 * 60 * 1000;

let timeoutId = null;
let lastActivity = Date.now();

// Function to reset the timer
const resetTimer = () => {
    lastActivity = Date.now();
    
    if (timeoutId) {
        clearTimeout(timeoutId);
    }
    
    timeoutId = setTimeout(checkInactivity, SESSION_TIMEOUT);
};

// Function to check if the user has been inactive
const checkInactivity = () => {
    const now = Date.now();
    const timeSinceLastActivity = now - lastActivity;
    
    if (timeSinceLastActivity >= SESSION_TIMEOUT) {
        // Log the user out
        console.log('User inactive for too long, logging out...');
        
        // Clear the timeout
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        
        // Perform logout
        import('../supabase').then(({ supabase }) => {
            supabase.auth.signOut().then(() => {
                // Redirect to login page
                window.location.href = '/login';
            });
        });
    } else {
        // If not inactive long enough, check again after the remaining time
        const remainingTime = SESSION_TIMEOUT - timeSinceLastActivity;
        timeoutId = setTimeout(checkInactivity, remainingTime);
    }
};

// Function to start monitoring user activity
const startActivityMonitoring = () => {
    // Reset the timer when the user interacts with the page
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
        document.addEventListener(event, resetTimer, { passive: true });
    });
    
    // Initial timer start
    resetTimer();
    
    return () => {
        // Cleanup function to remove event listeners
        events.forEach(event => {
            document.removeEventListener(event, resetTimer);
        });
        
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
    };
};

export { startActivityMonitoring }; 