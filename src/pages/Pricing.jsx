import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Check, Star, Zap, Crown, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const plans = [
  {
    name: 'Free',
    price: 0,
    icon: Star,
    description: 'Get started with basic features',
    color: 'from-gray-500 to-gray-600',
    features: {
      max_services: 3,
      featured_listing: false,
      priority_support: false,
      analytics: false,
      unlimited_portfolio: false
    },
    featuresList: [
      'Up to 3 services',
      'Basic profile',
      'Standard listing',
      'Community support',
      'Up to 10 portfolio items'
    ]
  },
  {
    name: 'Basic',
    price: 50000,
    icon: Zap,
    description: 'Perfect for growing providers',
    color: 'from-blue-500 to-blue-600',
    popular: false,
    features: {
      max_services: 10,
      featured_listing: false,
      priority_support: true,
      analytics: true,
      unlimited_portfolio: false
    },
    featuresList: [
      'Up to 10 services',
      'Priority support',
      'Analytics dashboard',
      'Up to 50 portfolio items',
      'Email notifications'
    ]
  },
  {
    name: 'Premium',
    price: 100000,
    icon: Crown,
    description: 'Best for professionals',
    color: 'from-[#FF6B3D] to-[#FF5722]',
    popular: true,
    features: {
      max_services: 50,
      featured_listing: true,
      priority_support: true,
      analytics: true,
      unlimited_portfolio: true
    },
    featuresList: [
      'Up to 50 services',
      'Featured listing',
      'Priority support',
      'Advanced analytics',
      'Unlimited portfolio',
      'Custom profile badge'
    ]
  },
  {
    name: 'Enterprise',
    price: 250000,
    icon: Rocket,
    description: 'For businesses and teams',
    color: 'from-purple-500 to-purple-600',
    features: {
      max_services: -1,
      featured_listing: true,
      priority_support: true,
      analytics: true,
      unlimited_portfolio: true
    },
    featuresList: [
      'Unlimited services',
      'Top featured listing',
      'Dedicated support',
      'Advanced analytics',
      'Unlimited portfolio',
      'Custom branding',
      'API access'
    ]
  }
];

export default function Pricing() {
  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const userData = await base44.auth.me();
        setUser(userData);
        
        const subs = await base44.entities.Subscription.filter({ user_email: userData.email });
        if (subs.length > 0 && subs[0].status === 'active') {
          setSubscription(subs[0]);
        }
      }
    } catch (e) {}
    setLoading(false);
  };

  const handleSubscribe = async (plan) => {
    if (!user) {
      base44.auth.redirectToLogin();
      return;
    }

    if (plan.name === 'Free') {
      toast.info('You are already on the free plan');
      return;
    }

    setProcessing(true);
    
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 1);

    if (subscription) {
      await base44.entities.Subscription.update(subscription.id, {
        plan: plan.name.toLowerCase(),
        features: plan.features,
        end_date: endDate.toISOString()
      });
    } else {
      await base44.entities.Subscription.create({
        user_email: user.email,
        plan: plan.name.toLowerCase(),
        status: 'active',
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        features: plan.features
      });
    }

    await base44.entities.Notification.create({
      user_email: user.email,
      title: 'Subscription Updated!',
      message: `You are now subscribed to the ${plan.name} plan`,
      type: 'system',
      link: 'Dashboard'
    });

    toast.success(`Successfully subscribed to ${plan.name} plan!`);
    setProcessing(false);
    loadData();
  };

  return (
    <div className="min-h-screen py-12 lg:py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-[#FF6B3D]/10 to-[#FF5722]/10 text-[#FF6B3D] border-[#FF6B3D]/30">
            Pricing Plans
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-[#9BA3AF] max-w-2xl mx-auto">
            Simple, transparent pricing for providers. Start free and upgrade as you grow.
          </p>
        </div>

        {/* Current Plan */}
        {subscription && (
          <div className="card-dark p-4 mb-8 max-w-md mx-auto text-center">
            <p className="text-gray-400 mb-1">Current Plan</p>
            <p className="text-xl font-semibold text-white capitalize">{subscription.plan}</p>
          </div>
        )}

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isCurrentPlan = subscription?.plan === plan.name.toLowerCase();
            
            return (
              <div
                key={plan.name}
                className={`card-dark p-6 relative overflow-hidden ${
                  plan.popular ? 'ring-2 ring-[#FF6B3D] shadow-xl shadow-[#FF6B3D]/20' : ''
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute top-4 right-4 bg-gradient-to-r from-[#FF6B3D] to-[#FF5722] text-white border-0">
                    Popular
                  </Badge>
                )}

                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} bg-opacity-20 flex items-center justify-center mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{plan.description}</p>

                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">
                    {plan.price === 0 ? 'Free' : `${(plan.price / 1000).toFixed(0)}k`}
                  </span>
                  {plan.price > 0 && <span className="text-gray-400"> UGX/month</span>}
                </div>

                <Button
                  onClick={() => handleSubscribe(plan)}
                  disabled={processing || isCurrentPlan}
                  className={`w-full mb-6 ${
                    plan.popular 
                      ? 'btn-primary' 
                      : 'bg-[#151922] hover:bg-[#1E2430] text-white border border-[#1E2430]'
                  }`}
                >
                  {isCurrentPlan ? 'Current Plan' : 'Subscribe'}
                </Button>

                <div className="space-y-3">
                  {plan.featuresList.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check className="w-5 h-5 text-[#00D97E] flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="card-dark p-8 max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-white font-semibold mb-2">Can I change my plan anytime?</h3>
              <p className="text-gray-400">Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">What payment methods do you accept?</h3>
              <p className="text-gray-400">We accept MTN Mobile Money and Airtel Money for all subscription payments.</p>
            </div>
            <div>
              <h3 className="text-white font-semibold mb-2">Is there a free trial?</h3>
              <p className="text-gray-400">The Free plan is available forever with no credit card required. Upgrade when you're ready to grow.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}