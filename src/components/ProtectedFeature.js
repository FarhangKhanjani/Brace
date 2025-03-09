import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { Link } from 'react-router-dom';
import './ProtectedFeature.css';

const ProtectedFeature = ({ requiredPlan, children, featureName }) => {
    const { canAccess, loading } = useSubscription();

    if (loading) {
        return <div className="protected-feature-loading">Loading...</div>;
    }

    if (!canAccess(requiredPlan)) {
        return (
            <div className="protected-feature-upgrade">
                <div className="upgrade-message">
                    <h3>{featureName || 'Premium Feature'}</h3>
                    <p>This feature requires a {requiredPlan || 'paid'} subscription.</p>
                    <Link to="/subscription" className="upgrade-button">
                        Upgrade Now
                    </Link>
                </div>
            </div>
        );
    }

    return children;
};

export default ProtectedFeature; 