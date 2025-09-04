import React, { useState } from 'react';
import { Crown, Check, Star, Zap, CreditCard, Shield } from 'lucide-react';

const Subscription = () => {
  const [selectedPlan, setSelectedPlan] = useState('pro');
  const [isAnnual, setIsAnnual] = useState(true);

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      description: 'Perfect for getting started',
      price: { monthly: 15, annual: 150 },
      features: [
        '10 content generations per month',
        '5 content repurposing tasks',
        'Basic templates',
        'Email support',
        'Standard processing speed'
      ],
      color: 'from-blue-500 to-purple-600',
      popular: false
    },
    {
      id: 'pro',
      name: 'Pro',
      description: 'Best for content creators',
      price: { monthly: 45, annual: 450 },
      features: [
        'Unlimited content generations',
        'Unlimited repurposing tasks',
        'Premium templates',
        'Priority support',
        'Fast processing speed',
        'Advanced AI models',
        'Custom output formats',
        'Team collaboration'
      ],
      color: 'from-purple-500 to-pink-600',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      description: 'For large teams and agencies',
      price: { monthly: 99, annual: 990 },
      features: [
        'Everything in Pro',
        'White-label solution',
        'API access',
        'Custom integrations',
        'Dedicated account manager',
        'SLA guarantees',
        'Advanced analytics',
        'Custom training'
      ],
      color: 'from-green-500 to-blue-600',
      popular: false
    }
  ];

  const currentPlan = plans.find(plan => plan.id === 'basic'); // Mock current plan

  const handleUpgrade = (planId) => {
    console.log(`Upgrading to ${planId} plan`);
    // In a real app, this would integrate with Stripe
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="glass-card p-6 lg:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
            <Crown className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">Subscription Plans</h1>
            <p className="text-white/80">Choose the perfect plan for your content creation needs</p>
          </div>
        </div>
      </div>

      {/* Current Plan Status */}
      <div className="glass-card p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Current Plan</h2>
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 bg-gradient-to-r ${currentPlan.color} rounded-lg flex items-center justify-center`}>
                <Crown className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="font-medium text-white">{currentPlan.name} Plan</p>
                <p className="text-sm text-white/60">
                  ${isAnnual ? currentPlan.price.annual : currentPlan.price.monthly}/{isAnnual ? 'year' : 'month'}
                </p>
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button className="btn-secondary">
              Manage Billing
            </button>
            <button className="btn-primary">
              <Star className="w-4 h-4 mr-2" />
              Upgrade Plan
            </button>
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="glass-card p-2 inline-flex rounded-lg">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              !isAnnual ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 relative ${
              isAnnual ? 'bg-white/20 text-white' : 'text-white/70 hover:text-white'
            }`}
          >
            Annual
            <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`glass-card p-6 lg:p-8 transition-all duration-200 hover:bg-white/15 relative ${
              plan.popular ? 'ring-2 ring-purple-400' : ''
            }`}
          >
            {plan.popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              </div>
            )}

            <div className="text-center mb-6">
              <div className={`w-16 h-16 bg-gradient-to-r ${plan.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                <Crown className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
              <p className="text-white/70 mb-4">{plan.description}</p>
              <div className="text-4xl font-bold text-white mb-1">
                ${isAnnual ? plan.price.annual : plan.price.monthly}
              </div>
              <p className="text-white/60 text-sm">
                per {isAnnual ? 'year' : 'month'}
                {isAnnual && <span className="text-green-400 ml-1">(Save 17%)</span>}
              </p>
            </div>

            <ul className="space-y-3 mb-8">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-start gap-3">
                  <Check className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <span className="text-white/90 text-sm">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleUpgrade(plan.id)}
              className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
                plan.id === currentPlan.id
                  ? 'bg-white/10 text-white/60 cursor-not-allowed'
                  : plan.popular
                  ? 'btn-primary hover:shadow-xl'
                  : 'btn-secondary hover:bg-white/30'
              }`}
              disabled={plan.id === currentPlan.id}
            >
              {plan.id === currentPlan.id ? (
                'Current Plan'
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  {plan.id === 'basic' ? 'Downgrade' : 'Upgrade'} to {plan.name}
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Features Comparison */}
      <div className="glass-card p-6 lg:p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Why Choose ContentSpark?</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Lightning Fast</h3>
            <p className="text-white/70 text-sm">Generate and repurpose content in seconds, not hours</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Secure & Reliable</h3>
            <p className="text-white/70 text-sm">Enterprise-grade security with 99.9% uptime guarantee</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Flexible Billing</h3>
            <p className="text-white/70 text-sm">Cancel anytime, no hidden fees, transparent pricing</p>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div className="glass-card p-6 lg:p-8">
        <h2 className="text-2xl font-bold text-white mb-6">Frequently Asked Questions</h2>
        <div className="space-y-4">
          <div>
            <h3 className="font-semibold text-white mb-2">Can I change my plan anytime?</h3>
            <p className="text-white/70 text-sm">Yes, you can upgrade or downgrade your plan at any time. Changes will be reflected in your next billing cycle.</p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">What happens if I exceed my usage limits?</h3>
            <p className="text-white/70 text-sm">You'll receive notifications when approaching your limits. You can upgrade your plan or wait for the next billing cycle to reset.</p>
          </div>
          <div>
            <h3 className="font-semibold text-white mb-2">Is there a free trial?</h3>
            <p className="text-white/70 text-sm">New users get 3 free content generations to try our platform. No credit card required for the trial.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Subscription;