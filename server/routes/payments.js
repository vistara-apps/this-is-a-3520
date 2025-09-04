import express from 'express';
import { body, validationResult } from 'express-validator';
import Stripe from 'stripe';
import { User } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Basic Plan',
    price: 15,
    priceId: process.env.STRIPE_BASIC_PRICE_ID,
    features: ['10 content generations per month', '5 content repurposing tasks', 'Basic templates', 'Email support']
  },
  pro: {
    name: 'Pro Plan',
    price: 45,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    features: ['Unlimited content generations', 'Unlimited repurposing tasks', 'Premium templates', 'Priority support', 'Advanced AI models']
  },
  enterprise: {
    name: 'Enterprise Plan',
    price: 99,
    priceId: process.env.STRIPE_ENTERPRISE_PRICE_ID,
    features: ['Everything in Pro', 'White-label solution', 'API access', 'Custom integrations', 'Dedicated support']
  }
};

// @desc    Get subscription plans
// @route   GET /api/payments/plans
// @access  Private
router.get('/plans', asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: { plans: SUBSCRIPTION_PLANS }
  });
}));

// @desc    Create checkout session
// @route   POST /api/payments/create-checkout-session
// @access  Private
router.post('/create-checkout-session', [
  body('planId')
    .notEmpty()
    .withMessage('Plan ID is required')
    .isIn(['basic', 'pro', 'enterprise'])
    .withMessage('Invalid plan ID'),
  body('billingCycle')
    .optional()
    .isIn(['monthly', 'yearly'])
    .withMessage('Invalid billing cycle')
], asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        details: errors.array()
      }
    });
  }

  const user = req.user;
  const { planId, billingCycle = 'monthly' } = req.body;

  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) {
    return res.status(400).json({
      success: false,
      error: { message: 'Invalid subscription plan' }
    });
  }

  try {
    // Create or retrieve Stripe customer
    let stripeCustomer;
    
    if (user.stripeCustomerId) {
      stripeCustomer = await stripe.customers.retrieve(user.stripeCustomerId);
    } else {
      stripeCustomer = await stripe.customers.create({
        email: user.email,
        name: user.getFullName(),
        metadata: {
          userId: user.userId
        }
      });
      
      // Update user with Stripe customer ID
      user.stripeCustomerId = stripeCustomer.id;
      await user.save();
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomer.id,
      payment_method_types: ['card'],
      line_items: [
        {
          price: plan.priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
      metadata: {
        userId: user.userId,
        planId: planId,
        billingCycle: billingCycle
      },
      subscription_data: {
        metadata: {
          userId: user.userId,
          planId: planId
        }
      }
    });

    res.json({
      success: true,
      data: {
        sessionId: session.id,
        url: session.url
      }
    });

  } catch (error) {
    console.error('Stripe checkout session creation error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create checkout session' }
    });
  }
}));

// @desc    Get checkout session
// @route   GET /api/payments/checkout-session/:sessionId
// @access  Private
router.get('/checkout-session/:sessionId', asyncHandler(async (req, res) => {
  const { sessionId } = req.params;

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    res.json({
      success: true,
      data: { session }
    });

  } catch (error) {
    console.error('Stripe session retrieval error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve checkout session' }
    });
  }
}));

// @desc    Get current subscription
// @route   GET /api/payments/subscription
// @access  Private
router.get('/subscription', asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user.stripeSubscriptionId) {
    return res.json({
      success: true,
      data: {
        subscription: null,
        plan: 'free',
        status: 'inactive'
      }
    });
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
    
    res.json({
      success: true,
      data: {
        subscription: {
          id: subscription.id,
          status: subscription.status,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          plan: user.subscriptionPlan,
          amount: subscription.items.data[0]?.price?.unit_amount / 100
        }
      }
    });

  } catch (error) {
    console.error('Stripe subscription retrieval error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve subscription' }
    });
  }
}));

// @desc    Cancel subscription
// @route   POST /api/payments/cancel-subscription
// @access  Private
router.post('/cancel-subscription', asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user.stripeSubscriptionId) {
    return res.status(400).json({
      success: false,
      error: { message: 'No active subscription found' }
    });
  }

  try {
    // Cancel subscription at period end
    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: true
    });

    res.json({
      success: true,
      data: {
        message: 'Subscription will be cancelled at the end of the current billing period',
        subscription: {
          id: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        }
      }
    });

  } catch (error) {
    console.error('Stripe subscription cancellation error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to cancel subscription' }
    });
  }
}));

// @desc    Reactivate subscription
// @route   POST /api/payments/reactivate-subscription
// @access  Private
router.post('/reactivate-subscription', asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user.stripeSubscriptionId) {
    return res.status(400).json({
      success: false,
      error: { message: 'No subscription found' }
    });
  }

  try {
    // Reactivate subscription
    const subscription = await stripe.subscriptions.update(user.stripeSubscriptionId, {
      cancel_at_period_end: false
    });

    res.json({
      success: true,
      data: {
        message: 'Subscription reactivated successfully',
        subscription: {
          id: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        }
      }
    });

  } catch (error) {
    console.error('Stripe subscription reactivation error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to reactivate subscription' }
    });
  }
}));

// @desc    Update payment method
// @route   POST /api/payments/update-payment-method
// @access  Private
router.post('/update-payment-method', asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user.stripeCustomerId) {
    return res.status(400).json({
      success: false,
      error: { message: 'No customer found' }
    });
  }

  try {
    // Create setup intent for updating payment method
    const setupIntent = await stripe.setupIntents.create({
      customer: user.stripeCustomerId,
      usage: 'off_session'
    });

    res.json({
      success: true,
      data: {
        clientSecret: setupIntent.client_secret
      }
    });

  } catch (error) {
    console.error('Stripe setup intent creation error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create setup intent' }
    });
  }
}));

// @desc    Get billing history
// @route   GET /api/payments/billing-history
// @access  Private
router.get('/billing-history', asyncHandler(async (req, res) => {
  const user = req.user;

  if (!user.stripeCustomerId) {
    return res.json({
      success: true,
      data: { invoices: [] }
    });
  }

  try {
    const invoices = await stripe.invoices.list({
      customer: user.stripeCustomerId,
      limit: 20
    });

    const formattedInvoices = invoices.data.map(invoice => ({
      id: invoice.id,
      amount: invoice.amount_paid / 100,
      currency: invoice.currency,
      status: invoice.status,
      date: new Date(invoice.created * 1000),
      periodStart: new Date(invoice.period_start * 1000),
      periodEnd: new Date(invoice.period_end * 1000),
      invoiceUrl: invoice.hosted_invoice_url,
      pdfUrl: invoice.invoice_pdf
    }));

    res.json({
      success: true,
      data: { invoices: formattedInvoices }
    });

  } catch (error) {
    console.error('Stripe billing history error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to retrieve billing history' }
    });
  }
}));

export default router;
