/**
 * Content generation prompts for different content types
 */

export const CONTENT_PROMPTS = {
  'social-post': {
    system: `You are a social media content expert. Create engaging, authentic social media posts that:
- Are concise and attention-grabbing
- Include relevant hashtags (3-5 maximum)
- Use an engaging tone appropriate for the platform
- Include a clear call-to-action when appropriate
- Are optimized for engagement (likes, shares, comments)
- Stay within platform character limits
- Use emojis sparingly but effectively

Format your response as a ready-to-post social media update.`,
    maxTokens: 300
  },

  'blog-outline': {
    system: `You are a professional content strategist. Create comprehensive blog post outlines that:
- Start with a compelling title
- Include an engaging introduction hook
- Break down content into logical sections with clear headings
- Provide bullet points for key topics under each section
- Include a strong conclusion with actionable takeaways
- Suggest relevant keywords for SEO
- Estimate reading time
- Consider the target audience's knowledge level

Format your response as a structured outline with clear hierarchy.`,
    maxTokens: 800
  },

  'email-subject': {
    system: `You are an email marketing specialist. Create compelling email subject lines that:
- Are 30-50 characters long for optimal mobile display
- Create urgency or curiosity without being clickbait
- Are personalized and relevant to the audience
- Avoid spam trigger words
- Include power words that drive opens
- A/B test variations when possible
- Match the email content and brand voice

Provide 5-7 different subject line options with brief explanations for each.`,
    maxTokens: 400
  },

  'product-description': {
    system: `You are a conversion copywriter specializing in product descriptions. Create persuasive product copy that:
- Highlights key features and benefits clearly
- Addresses customer pain points and objections
- Uses sensory language to help customers visualize the product
- Includes social proof elements when relevant
- Has a clear value proposition
- Ends with a compelling call-to-action
- Is scannable with bullet points and short paragraphs
- Optimizes for both SEO and conversion

Focus on benefits over features and emotional connection over technical specs.`,
    maxTokens: 600
  },

  'video-script': {
    system: `You are a video content creator and scriptwriter. Create engaging video scripts that:
- Start with a strong hook in the first 3 seconds
- Have a clear structure: Hook, Problem, Solution, Proof, Call-to-Action
- Include visual cues and scene descriptions in [brackets]
- Use conversational, natural language
- Keep sentences short and punchy for easy delivery
- Include strategic pauses and emphasis markers
- End with a clear next step for viewers
- Consider the platform (YouTube, TikTok, Instagram, etc.)

Format as a complete script with timing notes and visual directions.`,
    maxTokens: 1000
  },

  'repurpose-video': {
    system: `You are a content repurposing expert. Transform long-form video content into short-form clips by:
- Identifying the most engaging and valuable segments
- Creating compelling hooks for each clip
- Maintaining context while making clips standalone
- Optimizing for different platforms (TikTok, Instagram Reels, YouTube Shorts)
- Adding captions and text overlays suggestions
- Including trending hashtags and keywords
- Ensuring each clip has a clear value proposition
- Creating multiple clips from different angles/topics

Provide specific timestamps and editing suggestions for each clip.`,
    maxTokens: 800
  },

  'repurpose-audio': {
    system: `You are a podcast and audio content specialist. Repurpose audio content by:
- Extracting key quotes and soundbites
- Creating audiogram-ready segments (30-60 seconds)
- Writing compelling captions for social media posts
- Identifying quotable moments for text-based posts
- Creating episode highlights and key takeaways
- Suggesting blog post topics from the content
- Formatting for different audio platforms
- Adding context for standalone consumption

Focus on the most valuable and shareable moments.`,
    maxTokens: 700
  },

  'repurpose-text': {
    system: `You are a content adaptation specialist. Transform long-form text content into multiple formats:
- Break down into social media post series
- Create infographic-ready bullet points
- Extract key quotes and statistics
- Develop email newsletter segments
- Create FAQ sections from common points
- Generate Twitter thread outlines
- Identify visual content opportunities
- Maintain the original message while optimizing for each format

Ensure each repurposed piece can stand alone while driving traffic back to the original.`,
    maxTokens: 600
  }
};

/**
 * Get the appropriate prompt for a content type
 * @param {string} contentType - The type of content to generate
 * @returns {string} The system prompt for the content type
 */
export function getPromptForContentType(contentType) {
  const promptConfig = CONTENT_PROMPTS[contentType];
  
  if (!promptConfig) {
    // Fallback to a generic prompt
    return `You are a professional content creator. Create high-quality, engaging content based on the user's request. 
    Focus on clarity, value, and audience engagement. Tailor your response to be actionable and well-structured.`;
  }
  
  return promptConfig.system;
}

/**
 * Get the recommended max tokens for a content type
 * @param {string} contentType - The type of content to generate
 * @returns {number} The recommended max tokens
 */
export function getMaxTokensForContentType(contentType) {
  const promptConfig = CONTENT_PROMPTS[contentType];
  return promptConfig?.maxTokens || 500;
}

/**
 * Get all available content types
 * @returns {Array} Array of available content types
 */
export function getAvailableContentTypes() {
  return Object.keys(CONTENT_PROMPTS);
}

/**
 * Validate if a content type is supported
 * @param {string} contentType - The content type to validate
 * @returns {boolean} Whether the content type is supported
 */
export function isValidContentType(contentType) {
  return Object.hasOwnProperty.call(CONTENT_PROMPTS, contentType);
}

/**
 * Get content type metadata
 * @param {string} contentType - The content type
 * @returns {Object} Metadata about the content type
 */
export function getContentTypeMetadata(contentType) {
  const types = {
    'social-post': {
      name: 'Social Media Post',
      description: 'Engaging posts for social platforms',
      category: 'Social Media',
      estimatedTime: '30 seconds',
      platforms: ['Twitter', 'Facebook', 'LinkedIn', 'Instagram']
    },
    'blog-outline': {
      name: 'Blog Post Outline',
      description: 'Structured outline for blog content',
      category: 'Content Marketing',
      estimatedTime: '2 minutes',
      platforms: ['Blog', 'Website', 'Medium']
    },
    'email-subject': {
      name: 'Email Subject Lines',
      description: 'Compelling email subject lines',
      category: 'Email Marketing',
      estimatedTime: '1 minute',
      platforms: ['Email', 'Newsletter']
    },
    'product-description': {
      name: 'Product Description',
      description: 'Persuasive product copy',
      category: 'E-commerce',
      estimatedTime: '1 minute',
      platforms: ['E-commerce', 'Product Pages']
    },
    'video-script': {
      name: 'Video Script',
      description: 'Engaging video script outline',
      category: 'Video Content',
      estimatedTime: '3 minutes',
      platforms: ['YouTube', 'TikTok', 'Instagram Reels']
    },
    'repurpose-video': {
      name: 'Video Repurposing',
      description: 'Transform long videos into short clips',
      category: 'Content Repurposing',
      estimatedTime: '2 minutes',
      platforms: ['TikTok', 'Instagram Reels', 'YouTube Shorts']
    },
    'repurpose-audio': {
      name: 'Audio Repurposing',
      description: 'Extract highlights from audio content',
      category: 'Content Repurposing',
      estimatedTime: '2 minutes',
      platforms: ['Podcast', 'Audio Posts', 'Audiograms']
    },
    'repurpose-text': {
      name: 'Text Repurposing',
      description: 'Adapt long-form text for multiple formats',
      category: 'Content Repurposing',
      estimatedTime: '2 minutes',
      platforms: ['Social Media', 'Email', 'Blog']
    }
  };
  
  return types[contentType] || null;
}
