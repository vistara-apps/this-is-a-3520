import { Usage } from '../models/index.js';
import { asyncHandler } from './errorHandler.js';

export const checkUsageLimit = (type) => {
  return asyncHandler(async (req, res, next) => {
    const user = req.user;
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
    }

    // Get user's subscription limits
    const limits = user.getSubscriptionLimits();
    
    // Get current usage
    const usage = await Usage.findOrCreateCurrent(user.userId);
    
    let currentUsage;
    let limit;
    
    switch (type) {
      case 'generation':
        currentUsage = usage.contentGenerations;
        limit = limits.generations;
        break;
      case 'repurposing':
        currentUsage = usage.contentRepurposing;
        limit = limits.repurposing;
        break;
      default:
        return res.status(400).json({
          success: false,
          error: { message: 'Invalid usage type' }
        });
    }
    
    // Check if user has unlimited access (-1 means unlimited)
    if (limit === -1) {
      req.usage = usage;
      return next();
    }
    
    // Check if user has exceeded their limit
    if (currentUsage >= limit) {
      return res.status(429).json({
        success: false,
        error: {
          message: `${type} limit exceeded. Current usage: ${currentUsage}/${limit}`,
          code: 'USAGE_LIMIT_EXCEEDED',
          currentUsage,
          limit,
          subscriptionPlan: user.subscriptionPlan
        }
      });
    }
    
    // Add usage to request for later increment
    req.usage = usage;
    next();
  });
};

export const incrementUsage = (type) => {
  return asyncHandler(async (req, res, next) => {
    const usage = req.usage;
    
    if (!usage) {
      return next();
    }
    
    try {
      switch (type) {
        case 'generation':
          await usage.incrementGenerations();
          break;
        case 'repurposing':
          await usage.incrementRepurposing();
          break;
        default:
          console.warn(`Unknown usage type: ${type}`);
      }
    } catch (error) {
      console.error('Error incrementing usage:', error);
      // Don't fail the request if usage tracking fails
    }
    
    next();
  });
};

export const trackTokenUsage = asyncHandler(async (req, res, next) => {
  const usage = req.usage;
  const tokens = req.tokensUsed || 0;
  const cost = req.cost || 0;
  
  if (!usage || tokens === 0) {
    return next();
  }
  
  try {
    await usage.addTokenUsage(tokens, cost);
  } catch (error) {
    console.error('Error tracking token usage:', error);
    // Don't fail the request if usage tracking fails
  }
  
  next();
});

export const getUserUsageStats = asyncHandler(async (req, res, next) => {
  const user = req.user;
  
  if (!user) {
    return res.status(401).json({
      success: false,
      error: { message: 'Authentication required' }
    });
  }
  
  try {
    const currentUsage = await Usage.getCurrentUsage(user.userId);
    const limits = user.getSubscriptionLimits();
    
    const stats = {
      subscriptionPlan: user.subscriptionPlan,
      subscriptionStatus: user.subscriptionStatus,
      limits,
      currentUsage: currentUsage ? {
        contentGenerations: currentUsage.contentGenerations,
        contentRepurposing: currentUsage.contentRepurposing,
        totalTokensUsed: currentUsage.totalTokensUsed,
        totalCost: parseFloat(currentUsage.totalCost),
        month: currentUsage.month,
        year: currentUsage.year
      } : {
        contentGenerations: 0,
        contentRepurposing: 0,
        totalTokensUsed: 0,
        totalCost: 0,
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear()
      },
      remainingUsage: {
        contentGenerations: limits.generations === -1 ? -1 : Math.max(0, limits.generations - (currentUsage?.contentGenerations || 0)),
        contentRepurposing: limits.repurposing === -1 ? -1 : Math.max(0, limits.repurposing - (currentUsage?.contentRepurposing || 0))
      }
    };
    
    req.usageStats = stats;
    next();
  } catch (error) {
    console.error('Error getting usage stats:', error);
    return res.status(500).json({
      success: false,
      error: { message: 'Error retrieving usage statistics' }
    });
  }
});
