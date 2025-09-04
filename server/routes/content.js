import express from 'express';
import { body, validationResult } from 'express-validator';
import { ContentRequest } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { checkUsageLimit, incrementUsage, trackTokenUsage } from '../middleware/usageLimit.js';
import { openaiService } from '../services/openai.js';
import { isValidContentType, getMaxTokensForContentType, getContentTypeMetadata } from '../utils/prompts.js';

const router = express.Router();

// @desc    Generate content
// @route   POST /api/content/generate
// @access  Private
router.post('/generate', 
  checkUsageLimit('generation'),
  [
    body('type')
      .notEmpty()
      .withMessage('Content type is required')
      .custom((value) => {
        if (!isValidContentType(value)) {
          throw new Error('Invalid content type');
        }
        return true;
      }),
    body('prompt')
      .notEmpty()
      .withMessage('Prompt is required')
      .isLength({ min: 10, max: 5000 })
      .withMessage('Prompt must be between 10 and 5000 characters'),
    body('model')
      .optional()
      .isIn(['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'])
      .withMessage('Invalid model specified'),
    body('temperature')
      .optional()
      .isFloat({ min: 0, max: 2 })
      .withMessage('Temperature must be between 0 and 2'),
    body('maxTokens')
      .optional()
      .isInt({ min: 50, max: 2000 })
      .withMessage('Max tokens must be between 50 and 2000')
  ],
  asyncHandler(async (req, res) => {
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
    const { type, prompt, model, temperature, maxTokens } = req.body;

    // Get recommended model if not specified
    const selectedModel = model || openaiService.getRecommendedModel(type, user.subscriptionPlan);
    
    // Get recommended max tokens if not specified
    const selectedMaxTokens = maxTokens || getMaxTokensForContentType(type);
    
    // Validate request
    try {
      openaiService.validateRequest(prompt, selectedMaxTokens);
    } catch (error) {
      return res.status(error.statusCode || 400).json({
        success: false,
        error: { message: error.message }
      });
    }

    // Create content request record
    const contentRequest = await ContentRequest.create({
      userId: user.userId,
      type,
      inputContent: prompt,
      model: selectedModel,
      temperature: temperature || 0.7,
      maxTokens: selectedMaxTokens,
      status: 'pending'
    });

    try {
      // Mark as processing
      await contentRequest.markAsProcessing();

      // Generate content
      const result = await openaiService.generateContent({
        type,
        prompt,
        model: selectedModel,
        temperature: temperature || 0.7,
        maxTokens: selectedMaxTokens,
        stream: false
      });

      // Mark as completed and save result
      await contentRequest.markAsCompleted(
        result.content,
        result.usage.totalTokens,
        result.cost
      );

      // Track token usage for billing
      req.tokensUsed = result.usage.totalTokens;
      req.cost = result.cost;

      res.json({
        success: true,
        data: {
          requestId: contentRequest.requestId,
          content: result.content,
          usage: result.usage,
          cost: result.cost,
          model: result.model,
          processingTime: contentRequest.getProcessingTime()
        }
      });

    } catch (error) {
      // Mark as failed
      await contentRequest.markAsFailed(error.message);
      
      throw error;
    }
  }),
  incrementUsage('generation'),
  trackTokenUsage
);

// @desc    Generate streaming content
// @route   POST /api/content/generate-stream
// @access  Private
router.post('/generate-stream',
  checkUsageLimit('generation'),
  [
    body('type')
      .notEmpty()
      .withMessage('Content type is required')
      .custom((value) => {
        if (!isValidContentType(value)) {
          throw new Error('Invalid content type');
        }
        return true;
      }),
    body('prompt')
      .notEmpty()
      .withMessage('Prompt is required')
      .isLength({ min: 10, max: 5000 })
      .withMessage('Prompt must be between 10 and 5000 characters')
  ],
  asyncHandler(async (req, res) => {
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
    const { type, prompt, model, temperature, maxTokens } = req.body;

    // Get recommended settings
    const selectedModel = model || openaiService.getRecommendedModel(type, user.subscriptionPlan);
    const selectedMaxTokens = maxTokens || getMaxTokensForContentType(type);

    // Validate request
    try {
      openaiService.validateRequest(prompt, selectedMaxTokens);
    } catch (error) {
      return res.status(error.statusCode || 400).json({
        success: false,
        error: { message: error.message }
      });
    }

    // Create content request record
    const contentRequest = await ContentRequest.create({
      userId: user.userId,
      type,
      inputContent: prompt,
      model: selectedModel,
      temperature: temperature || 0.7,
      maxTokens: selectedMaxTokens,
      status: 'pending'
    });

    try {
      // Mark as processing
      await contentRequest.markAsProcessing();

      // Set up SSE headers
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control'
      });

      // Generate streaming content
      const streamResult = await openaiService.generateContent({
        type,
        prompt,
        model: selectedModel,
        temperature: temperature || 0.7,
        maxTokens: selectedMaxTokens,
        stream: true
      });

      let fullContent = '';
      let totalTokens = 0;
      let cost = 0;

      // Process the stream
      await openaiService.processStream(
        streamResult.stream,
        (chunk) => {
          // Send chunk to client
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
          fullContent += chunk;
        },
        async (result) => {
          // Stream completed
          if (result.usage) {
            totalTokens = result.usage.totalTokens;
            cost = result.cost;
          }

          // Mark as completed
          await contentRequest.markAsCompleted(fullContent, totalTokens, cost);

          // Send completion event
          res.write(`data: ${JSON.stringify({
            type: 'complete',
            requestId: contentRequest.requestId,
            usage: result.usage,
            cost: cost,
            processingTime: contentRequest.getProcessingTime()
          })}\n\n`);

          res.end();
        }
      );

      // Track usage
      req.tokensUsed = totalTokens;
      req.cost = cost;

    } catch (error) {
      // Mark as failed
      await contentRequest.markAsFailed(error.message);
      
      // Send error event
      res.write(`data: ${JSON.stringify({
        type: 'error',
        message: error.message
      })}\n\n`);
      
      res.end();
    }
  }),
  incrementUsage('generation'),
  trackTokenUsage
);

// @desc    Get content generation history
// @route   GET /api/content/history
// @access  Private
router.get('/history', asyncHandler(async (req, res) => {
  const user = req.user;
  const { page = 1, limit = 20, type, status } = req.query;

  const whereClause = { userId: user.userId };
  
  if (type) {
    whereClause.type = type;
  }
  
  if (status) {
    whereClause.status = status;
  }

  const offset = (page - 1) * limit;

  const { count, rows: contentRequests } = await ContentRequest.findAndCountAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset),
    attributes: { exclude: ['inputContent', 'generatedContent'] } // Exclude large text fields for list view
  });

  res.json({
    success: true,
    data: {
      contentRequests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    }
  });
}));

// @desc    Get specific content request
// @route   GET /api/content/:requestId
// @access  Private
router.get('/:requestId', asyncHandler(async (req, res) => {
  const user = req.user;
  const { requestId } = req.params;

  const contentRequest = await ContentRequest.findOne({
    where: {
      requestId,
      userId: user.userId
    }
  });

  if (!contentRequest) {
    return res.status(404).json({
      success: false,
      error: { message: 'Content request not found' }
    });
  }

  res.json({
    success: true,
    data: { contentRequest }
  });
}));

// @desc    Update content request (bookmark, rating, feedback)
// @route   PUT /api/content/:requestId
// @access  Private
router.put('/:requestId', [
  body('isBookmarked')
    .optional()
    .isBoolean()
    .withMessage('isBookmarked must be a boolean'),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating must be between 1 and 5'),
  body('feedback')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Feedback must be less than 1000 characters')
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
  const { requestId } = req.params;
  const { isBookmarked, rating, feedback } = req.body;

  const contentRequest = await ContentRequest.findOne({
    where: {
      requestId,
      userId: user.userId
    }
  });

  if (!contentRequest) {
    return res.status(404).json({
      success: false,
      error: { message: 'Content request not found' }
    });
  }

  // Update fields
  if (isBookmarked !== undefined) {
    contentRequest.isBookmarked = isBookmarked;
  }
  
  if (rating !== undefined) {
    contentRequest.rating = rating;
  }
  
  if (feedback !== undefined) {
    contentRequest.feedback = feedback;
  }

  await contentRequest.save();

  res.json({
    success: true,
    data: { contentRequest }
  });
}));

// @desc    Delete content request
// @route   DELETE /api/content/:requestId
// @access  Private
router.delete('/:requestId', asyncHandler(async (req, res) => {
  const user = req.user;
  const { requestId } = req.params;

  const contentRequest = await ContentRequest.findOne({
    where: {
      requestId,
      userId: user.userId
    }
  });

  if (!contentRequest) {
    return res.status(404).json({
      success: false,
      error: { message: 'Content request not found' }
    });
  }

  await contentRequest.destroy();

  res.json({
    success: true,
    data: { message: 'Content request deleted successfully' }
  });
}));

// @desc    Get content types
// @route   GET /api/content/types
// @access  Private
router.get('/types', asyncHandler(async (req, res) => {
  const contentTypes = [
    'social-post',
    'blog-outline',
    'email-subject',
    'product-description',
    'video-script'
  ].map(type => ({
    type,
    ...getContentTypeMetadata(type)
  }));

  res.json({
    success: true,
    data: { contentTypes }
  });
}));

export default router;
