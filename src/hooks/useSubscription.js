import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './useAuth'; // Assuming you have an auth hook
import config from '../config';

export function useSubscription() {
    const { user } = useAuth();
    const [subscription, setSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!user) {
            setSubscription(null);
            setLoading(false);
            return;
        }

        const fetchSubscription = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await axios.get(`${config.API_URL}/api/subscriptions/status`);
                setSubscription(response.data);
            } catch (err) {
                console.error('Error fetching subscription:', err);
                setError('Failed to load subscription status');
                setSubscription(null);
            } finally {
                setLoading(false);
            }
        };

        fetchSubscription();
    }, [user]);

    // Helper to check if user can access features requiring a specific plan
    const canAccess = (requiredPlan) => {
        if (!subscription || subscription.status !== 'active') {
            return false;
        }

        if (!requiredPlan) {
            return true; // Any active subscription is fine
        }

        // Plans ordered by level (free -> basic -> premium -> pro)
        const planLevels = {
            'free': 0,
            'basic': 1,
            'premium': 2,
            'pro': 3
        };

        const userPlanLevel = planLevels[subscription.plan.id] || 0;
        const requiredPlanLevel = planLevels[requiredPlan] || 0;

        return userPlanLevel >= requiredPlanLevel;
    };

    return {
        subscription,
        loading,
        error,
        canAccess,
        isSubscribed: subscription?.status === 'active'
    };
} 