import express from 'express';
import { body, validationResult } from 'express-validator';
import { ContentRequest } from '../models/index.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { checkUsageLimit, incrementUsage, trackTokenUsage } from '../middleware/usageLimit.js';
import { openaiService } from '../services/openai.js';

const router = express.Router();

// @desc    Repurpose text content
// @route   POST /api/repurpose/text
// @access  Private
router.post('/text',
  checkUsageLimit('repurposing'),
  [
    body('content')
      .notEmpty()
      .withMessage('Content is required')
      .isLength({ min: 100, max: 10000 })
      .withMessage('Content must be between 100 and 10000 characters'),
    body('outputFormat')
      .notEmpty()
      .withMessage('Output format is required')
      .isIn(['social-posts', 'email-series', 'twitter-thread', 'infographic-points', 'faq'])
      .withMessage('Invalid output format'),
    body('targetPlatforms')
      .optional()
      .isArray()
      .withMessage('Target platforms must be an array'),
    body('tone')
      .optional()
      .isIn(['professional', 'casual', 'friendly', 'authoritative', 'conversational'])
      .withMessage('Invalid tone specified')
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
    const { content, outputFormat, targetPlatforms = [], tone = 'professional' } = req.body;

    // Create content request record
    const contentRequest = await ContentRequest.create({
      userId: user.userId,
      type: 'repurpose-text',
      inputContent: content,
      metadata: {
        outputFormat,
        targetPlatforms,
        tone
      },
      status: 'pending'
    });

    try {
      // Mark as processing
      await contentRequest.markAsProcessing();

      // Create repurposing prompt
      const prompt = createRepurposingPrompt(content, outputFormat, targetPlatforms, tone);

      // Generate repurposed content
      const result = await openaiService.generateContent({
        type: 'repurpose-text',
        prompt,
        model: openaiService.getRecommendedModel('repurpose-text', user.subscriptionPlan),
        temperature: 0.7,
        maxTokens: 1500,
        stream: false
      });

      // Mark as completed
      await contentRequest.markAsCompleted(
        result.content,
        result.usage.totalTokens,
        result.cost
      );

      // Track token usage
      req.tokensUsed = result.usage.totalTokens;
      req.cost = result.cost;

      res.json({
        success: true,
        data: {
          requestId: contentRequest.requestId,
          repurposedContent: result.content,
          originalLength: content.length,
          outputFormat,
          usage: result.usage,
          cost: result.cost,
          processingTime: contentRequest.getProcessingTime()
        }
      });

    } catch (error) {
      // Mark as failed
      await contentRequest.markAsFailed(error.message);
      throw error;
    }
  }),
  incrementUsage('repurposing'),
  trackTokenUsage
);

// @desc    Repurpose video content (transcript-based)
// @route   POST /api/repurpose/video
// @access  Private
router.post('/video',
  checkUsageLimit('repurposing'),
  [
    body('transcript')
      .notEmpty()
      .withMessage('Video transcript is required')
      .isLength({ min: 200, max: 15000 })
      .withMessage('Transcript must be between 200 and 15000 characters'),
    body('videoLength')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Video length must be a positive integer (in seconds)'),
    body('clipCount')
      .optional()
      .isInt({ min: 1, max: 10 })
      .withMessage('Clip count must be between 1 and 10'),
    body('clipDuration')
      .optional()
      .isInt({ min: 15, max: 180 })
      .withMessage('Clip duration must be between 15 and 180 seconds'),
    body('targetPlatforms')
      .optional()
      .isArray()
      .withMessage('Target platforms must be an array')
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
    const { 
      transcript, 
      videoLength, 
      clipCount = 3, 
      clipDuration = 60, 
      targetPlatforms = ['tiktok', 'instagram-reels', 'youtube-shorts'] 
    } = req.body;

    // Create content request record
    const contentRequest = await ContentRequest.create({
      userId: user.userId,
      type: 'repurpose-video',
      inputContent: transcript,
      metadata: {
        videoLength,
        clipCount,
        clipDuration,
        targetPlatforms
      },
      status: 'pending'
    });

    try {
      // Mark as processing
      await contentRequest.markAsProcessing();

      // Create video repurposing prompt
      const prompt = createVideoRepurposingPrompt(transcript, clipCount, clipDuration, targetPlatforms);

      // Generate repurposed content
      const result = await openaiService.generateContent({
        type: 'repurpose-video',
        prompt,
        model: openaiService.getRecommendedModel('repurpose-video', user.subscriptionPlan),
        temperature: 0.8,
        maxTokens: 2000,
        stream: false
      });

      // Mark as completed
      await contentRequest.markAsCompleted(
        result.content,
        result.usage.totalTokens,
        result.cost
      );

      // Track token usage
      req.tokensUsed = result.usage.totalTokens;
      req.cost = result.cost;

      res.json({
        success: true,
        data: {
          requestId: contentRequest.requestId,
          clips: parseVideoClips(result.content),
          originalTranscriptLength: transcript.length,
          clipCount,
          targetPlatforms,
          usage: result.usage,
          cost: result.cost,
          processingTime: contentRequest.getProcessingTime()
        }
      });

    } catch (error) {
      // Mark as failed
      await contentRequest.markAsFailed(error.message);
      throw error;
    }
  }),
  incrementUsage('repurposing'),
  trackTokenUsage
);

// @desc    Repurpose audio content (podcast/audio transcript)
// @route   POST /api/repurpose/audio
// @access  Private
router.post('/audio',
  checkUsageLimit('repurposing'),
  [
    body('transcript')
      .notEmpty()
      .withMessage('Audio transcript is required')
      .isLength({ min: 200, max: 15000 })
      .withMessage('Transcript must be between 200 and 15000 characters'),
    body('audioLength')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Audio length must be a positive integer (in seconds)'),
    body('outputTypes')
      .optional()
      .isArray()
      .withMessage('Output types must be an array'),
    body('segmentLength')
      .optional()
      .isInt({ min: 30, max: 120 })
      .withMessage('Segment length must be between 30 and 120 seconds')
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
    const { 
      transcript, 
      audioLength, 
      outputTypes = ['audiograms', 'quotes', 'social-posts', 'key-takeaways'], 
      segmentLength = 60 
    } = req.body;

    // Create content request record
    const contentRequest = await ContentRequest.create({
      userId: user.userId,
      type: 'repurpose-audio',
      inputContent: transcript,
      metadata: {
        audioLength,
        outputTypes,
        segmentLength
      },
      status: 'pending'
    });

    try {
      // Mark as processing
      await contentRequest.markAsProcessing();

      // Create audio repurposing prompt
      const prompt = createAudioRepurposingPrompt(transcript, outputTypes, segmentLength);

      // Generate repurposed content
      const result = await openaiService.generateContent({
        type: 'repurpose-audio',
        prompt,
        model: openaiService.getRecommendedModel('repurpose-audio', user.subscriptionPlan),
        temperature: 0.7,
        maxTokens: 1800,
        stream: false
      });

      // Mark as completed
      await contentRequest.markAsCompleted(
        result.content,
        result.usage.totalTokens,
        result.cost
      );

      // Track token usage
      req.tokensUsed = result.usage.totalTokens;
      req.cost = result.cost;

      res.json({
        success: true,
        data: {
          requestId: contentRequest.requestId,
          repurposedContent: parseAudioContent(result.content, outputTypes),
          originalTranscriptLength: transcript.length,
          outputTypes,
          usage: result.usage,
          cost: result.cost,
          processingTime: contentRequest.getProcessingTime()
        }
      });

    } catch (error) {
      // Mark as failed
      await contentRequest.markAsFailed(error.message);
      throw error;
    }
  }),
  incrementUsage('repurposing'),
  trackTokenUsage
);

// @desc    Get repurposing history
// @route   GET /api/repurpose/history
// @access  Private
router.get('/history', asyncHandler(async (req, res) => {
  const user = req.user;
  const { page = 1, limit = 20, type } = req.query;

  const whereClause = { 
    userId: user.userId,
    type: {
      [ContentRequest.sequelize.Sequelize.Op.in]: ['repurpose-text', 'repurpose-video', 'repurpose-audio']
    }
  };
  
  if (type && ['repurpose-text', 'repurpose-video', 'repurpose-audio'].includes(type)) {
    whereClause.type = type;
  }

  const offset = (page - 1) * limit;

  const { count, rows: repurposeRequests } = await ContentRequest.findAndCountAll({
    where: whereClause,
    order: [['createdAt', 'DESC']],
    limit: parseInt(limit),
    offset: parseInt(offset),
    attributes: { exclude: ['inputContent', 'generatedContent'] }
  });

  res.json({
    success: true,
    data: {
      repurposeRequests,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(count / limit),
        totalItems: count,
        itemsPerPage: parseInt(limit)
      }
    }
  });
}));

// Helper functions
function createRepurposingPrompt(content, outputFormat, targetPlatforms, tone) {
  const platformText = targetPlatforms.length > 0 ? ` for ${targetPlatforms.join(', ')}` : '';
  
  return `Please repurpose the following content into ${outputFormat}${platformText} with a ${tone} tone:

Original Content:
${content}

Requirements:
- Maintain the core message and key insights
- Adapt the format and length for the specified output type
- Use appropriate language and style for the target platforms
- Ensure each piece can stand alone while being part of a cohesive series
- Include relevant hashtags or formatting as appropriate

Please provide the repurposed content in a clear, organized format.`;
}

function createVideoRepurposingPrompt(transcript, clipCount, clipDuration, targetPlatforms) {
  const platformText = targetPlatforms.join(', ');
  
  return `Please analyze this video transcript and create ${clipCount} short-form video clips (${clipDuration} seconds each) optimized for ${platformText}:

Video Transcript:
${transcript}

For each clip, provide:
1. A compelling hook/title
2. The specific content/script for the clip
3. Suggested visual elements or text overlays
4. Relevant hashtags
5. Estimated timestamp range from the original video (if identifiable)

Focus on the most engaging, valuable, and shareable moments that can stand alone as complete thoughts.`;
}

function createAudioRepurposingPrompt(transcript, outputTypes, segmentLength) {
  const typesText = outputTypes.join(', ');
  
  return `Please repurpose this audio transcript into ${typesText} with segments of approximately ${segmentLength} seconds:

Audio Transcript:
${transcript}

For each output type, provide:
- Audiograms: Key quotes with speaker attribution and context
- Quotes: Standalone quotable moments with proper formatting
- Social Posts: Engaging posts that highlight key insights
- Key Takeaways: Main points and actionable insights

Ensure each piece is optimized for social media sharing and provides clear value to the audience.`;
}

function parseVideoClips(content) {
  // Parse the AI-generated content into structured clip data
  // This is a simplified parser - in production, you'd want more robust parsing
  const clips = [];
  const sections = content.split(/Clip \d+:|CLIP \d+:/i);
  
  sections.slice(1).forEach((section, index) => {
    const lines = section.trim().split('\n').filter(line => line.trim());
    
    clips.push({
      id: index + 1,
      title: lines[0] || `Clip ${index + 1}`,
      content: section.trim(),
      estimatedDuration: 60, // Default duration
      hashtags: extractHashtags(section),
      platform: 'universal'
    });
  });
  
  return clips;
}

function parseAudioContent(content, outputTypes) {
  const parsed = {};
  
  outputTypes.forEach(type => {
    const regex = new RegExp(`${type.replace('-', '\\s*')}:?([\\s\\S]*?)(?=${outputTypes.map(t => t.replace('-', '\\s*')).join('|')}|$)`, 'i');
    const match = content.match(regex);
    
    if (match) {
      parsed[type] = match[1].trim();
    }
  });
  
  return parsed;
}

function extractHashtags(text) {
  const hashtagRegex = /#[\w]+/g;
  const matches = text.match(hashtagRegex);
  return matches || [];
}

export default router;
