const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Create a Supabase client with admin key
const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Define your subscription plans
const plans = [
    {
        id: 'free',
        name: 'Free',
        description: 'Basic access with limited features',
        price_monthly: 0,
        price_yearly: 0,
        features: [
            'Track up to 5 positions',
            'Basic market data',
            'Standard portfolio view'
        ],
        stripe_price_id_monthly: '',
        stripe_price_id_yearly: ''
    },
    {
        id: 'basic',
        name: 'Basic',
        description: 'Enhanced trading experience for beginners',
        price_monthly: 599, // $5.99
        price_yearly: 5990, // $59.90 (save ~16%)
        features: [
            'Track up to 20 positions',
            'Real-time market data',
            'Portfolio analytics',
            'Position alerts',
            'Email support'
        ],
        stripe_price_id_monthly: 'price_1OhX2XKFjMOFGbT7YsKlJvN4',
        stripe_price_id_yearly: 'price_1OhX2XKFjMOFGbT7zBklMn2d'
    },
    {
        id: 'premium',
        name: 'Premium',
        description: 'Professional features for serious traders',
        price_monthly: 1499, // $14.99
        price_yearly: 14990, // $149.90 (save ~17%)
        features: [
            'Unlimited positions',
            'Advanced analytics',
            'Trading strategies',
            'API access',
            'Priority support',
            'Trade signals'
        ],
        stripe_price_id_monthly: 'price_1OhX3eKFjMOFGbT7ZfPEJcN2',
        stripe_price_id_yearly: 'price_1OhX3eKFjMOFGbT7vKlnMkN3'
    }
];

async function initPlans() {
    try {
        // Insert or update plans
        const { data, error } = await supabase
            .from('subscription_plans')
            .upsert(plans, { onConflict: 'id' });
            
        if (error) throw error;
        
        console.log('Successfully initialized subscription plans!');
    } catch (error) {
        console.error('Error initializing plans:', error);
    }
}

initPlans(); 