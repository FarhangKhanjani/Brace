import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { supabase } from '../supabase';
import apiClient from '../api/apiClient';
import config from '../config';
import './SubscriptionPlans.css';
import { toast } from 'react-hot-toast';
import { FaCheck } from 'react-icons/fa';

const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || 'pk_test_51R0gchDy0zLWbRNUiukvRr00jw2vKWlxb2dYF8COWKLbxJAPlvfA4Pp2c94AZxHQhGnlEr9ckghnoP91tktzI1ls00vPtfQMed');

const SubscriptionPlans = () => {
    const [plans, setPlans] = useState([]);
    const [currentSubscription, setCurrentSubscription] = useState(null);
    const [loading, setLoading] = useState(true);
    const [billingCycle, setBillingCycle] = useState('monthly');
    
    useEffect(() => {
        fetchPlans();
        fetchCurrentSubscription();
    }, []);
    
    const fetchPlans = async () => {
        try {
            setLoading(true);
            const { data: plansData, error } = await supabase
                .from('subscription_plans')
                .select('*')
                .eq('is_active', true)
                .order('price_monthly', { ascending: true });
                
            if (error) throw error;
            
            setPlans(plansData || []);
        } catch (error) {
            console.error('Error fetching plans:', error);
            toast.error('Failed to load subscription plans');
        } finally {
            setLoading(false);
        }
    };
    
    const fetchCurrentSubscription = async () => {
        try {
            const response = await apiClient.get('/api/subscriptions/status');
            setCurrentSubscription(response.data);
        } catch (error) {
            console.error('Error fetching subscription status:', error);
            // Don't show error toast here as the user might not have a subscription yet
        }
    };
    
    const handleSubscribe = async (planId) => {
        try {
            const stripe = await stripePromise;
            
            // Create checkout session
            const response = await apiClient.post('/api/subscriptions', {
                plan_id: planId,
                billing_cycle: billingCycle
            });
            
            const { sessionId } = response.data;
            
            // Redirect to Stripe checkout
            const { error } = await stripe.redirectToCheckout({
                sessionId
            });
            
            if (error) {
                toast.error(error.message);
            }
        } catch (error) {
            console.error('Subscription error:', error);
            toast.error('Failed to process subscription. Please try again later.');
        }
    };
    
    const handleCancelSubscription = async () => {
        if (!window.confirm('Are you sure you want to cancel your subscription? You will continue to have access until the end of your billing period.')) {
            return;
        }
        
        try {
            await apiClient.post('/api/subscriptions/cancel');
            toast.success('Your subscription will be canceled at the end of the billing period');
            fetchCurrentSubscription();
        } catch (error) {
            console.error('Error canceling subscription:', error);
            toast.error('Failed to cancel subscription. Please try again.');
        }
    };
    
    if (loading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading subscription plans...</p>
            </div>
        );
    }
    
    const getCurrentPlanFeatures = () => {
        if (!currentSubscription || !currentSubscription.plan) {
            return [];
        }
        
        return currentSubscription.plan.features || [];
    };
    
    const isPlanActive = (planId) => {
        return currentSubscription && 
               currentSubscription.plan && 
               currentSubscription.plan.id === planId && 
               currentSubscription.status === 'active';
    };
    
    return (
        <div className="subscription-container">
            <div className="subscription-header">
                <h2>Choose Your Plan</h2>
                <p>Select the plan that works best for you</p>
                
                <div className="billing-toggle">
                    <button 
                        className={`toggle-btn ${billingCycle === 'monthly' ? 'active' : ''}`}
                        onClick={() => setBillingCycle('monthly')}
                    >
                        Monthly
                    </button>
                    <button 
                        className={`toggle-btn ${billingCycle === 'yearly' ? 'active' : ''}`}
                        onClick={() => setBillingCycle('yearly')}
                    >
                        Yearly <span className="discount-label">Save 20%</span>
                    </button>
                </div>
            </div>
            
            <div className="subscription-plans">
                {plans.map(plan => (
                    <div 
                        key={plan.id} 
                        className={`plan-card ${isPlanActive(plan.id) ? 'active' : ''} ${plan.id === 'premium' ? 'highlighted' : ''}`}
                    >
                        {plan.id === 'premium' && <div className="popular-tag">Popular</div>}
                        
                        <div className="plan-header">
                            <h3>{plan.name}</h3>
                            
                            <div className="plan-price">
                                <span className="currency">$</span>
                                <span className="amount">
                                    {billingCycle === 'monthly' 
                                        ? (plan.price_monthly / 100).toFixed(2) 
                                        : (plan.price_yearly / 100 / 12).toFixed(2)}
                                </span>
                                <span className="period">/ month</span>
                            </div>
                            
                            {billingCycle === 'yearly' && plan.price_yearly > 0 && (
                                <div className="yearly-price">
                                    ${(plan.price_yearly / 100).toFixed(2)} billed annually
                                </div>
                            )}
                        </div>
                        
                        <div className="plan-features">
                            <ul>
                                {Array.isArray(plan.features) && plan.features.map((feature, index) => (
                                    <li key={index}>
                                        <span className="feature-check"><FaCheck /></span>
                                        {feature}
                                    </li>
                                ))}
                            </ul>
                        </div>
                        
                        <div className="plan-footer">
                            {isPlanActive(plan.id) ? (
                                <div className="current-plan-status">
                                    <div className="current-label">Current Plan</div>
                                    {currentSubscription.cancel_at_period_end ? (
                                        <p className="cancellation-note">
                                            Your subscription will end on {new Date(currentSubscription.current_period_end).toLocaleDateString()}
                                        </p>
                                    ) : (
                                        <button 
                                            className="cancel-btn" 
                                            onClick={handleCancelSubscription}
                                        >
                                            Cancel Subscription
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <button 
                                    className="subscribe-btn"
                                    onClick={() => handleSubscribe(plan.id)}
                                    disabled={plan.id === 'free'}
                                >
                                    {plan.id === 'free' ? 'Current Plan' : 'Subscribe'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            
            {currentSubscription && currentSubscription.status === 'active' && (
                <div className="current-subscription-info">
                    <h3>Your Current Subscription</h3>
                    <p>
                        You are currently subscribed to the <strong>{currentSubscription.plan.name}</strong> plan.
                        {currentSubscription.cancel_at_period_end 
                            ? ` Your subscription will end on ${new Date(currentSubscription.current_period_end).toLocaleDateString()}.`
                            : ` Your next billing date is ${new Date(currentSubscription.current_period_end).toLocaleDateString()}.`
                        }
                    </p>
                </div>
            )}
        </div>
    );
};

export default SubscriptionPlans; 