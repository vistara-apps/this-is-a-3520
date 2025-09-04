import OpenAI from 'openai';
import { getPromptForContentType } from '../utils/prompts.js';

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Token pricing (as of 2024 - update as needed)
const TOKEN_PRICING = {
  'gpt-3.5-turbo': {
    input: 0.0015 / 1000,  // $0.0015 per 1K tokens
    output: 0.002 / 1000   // $0.002 per 1K tokens
  },
  'gpt-4': {
    input: 0.03 / 1000,    // $0.03 per 1K tokens
    output: 0.06 / 1000    // $0.06 per 1K tokens
  },
  'gpt-4-turbo': {
    input: 0.01 / 1000,    // $0.01 per 1K tokens
    output: 0.03 / 1000    // $0.03 per 1K tokens
  }
};

export class OpenAIService {
  constructor() {
    this.client = openai;
  }

  /**
   * Generate content using OpenAI
   * @param {Object} options - Generation options
   * @param {string} options.type - Content type
   * @param {string} options.prompt - User prompt
   * @param {string} options.model - Model to use
   * @param {number} options.temperature - Temperature setting
   * @param {number} options.maxTokens - Maximum tokens
   * @param {boolean} options.stream - Whether to stream response
   * @returns {Promise<Object>} Generation result
   */
  async generateContent({
    type,
    prompt,
    model = 'gpt-3.5-turbo',
    temperature = 0.7,
    maxTokens = 1000,
    stream = false
  }) {
    try {
      // Get system prompt for content type
      const systemPrompt = getPromptForContentType(type);
      
      const messages = [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const requestOptions = {
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream
      };

      if (stream) {
        return this.generateStreamingContent(requestOptions);
      } else {
        return this.generateStaticContent(requestOptions);
      }
    } catch (error) {
      console.error('OpenAI generation error:', error);
      throw this.handleOpenAIError(error);
    }
  }

  /**
   * Generate static (non-streaming) content
   */
  async generateStaticContent(requestOptions) {
    const response = await this.client.chat.completions.create(requestOptions);
    
    const content = response.choices[0]?.message?.content || '';
    const usage = response.usage;
    
    // Calculate cost
    const cost = this.calculateCost(requestOptions.model, usage);
    
    return {
      content,
      usage: {
        promptTokens: usage.prompt_tokens,
        completionTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens
      },
      cost,
      model: requestOptions.model,
      finishReason: response.choices[0]?.finish_reason
    };
  }

  /**
   * Generate streaming content
   */
  async generateStreamingContent(requestOptions) {
    const stream = await this.client.chat.completions.create(requestOptions);
    
    return {
      stream,
      model: requestOptions.model
    };
  }

  /**
   * Process streaming response
   */
  async processStream(stream, onChunk, onComplete) {
    let content = '';
    let usage = null;
    
    try {
      for await (const chunk of stream) {
        const delta = chunk.choices[0]?.delta;
        
        if (delta?.content) {
          content += delta.content;
          if (onChunk) {
            onChunk(delta.content);
          }
        }
        
        // Usage information is typically in the last chunk
        if (chunk.usage) {
          usage = chunk.usage;
        }
      }
      
      if (onComplete) {
        const cost = usage ? this.calculateCost(stream.model, usage) : 0;
        onComplete({
          content,
          usage: usage ? {
            promptTokens: usage.prompt_tokens,
            completionTokens: usage.completion_tokens,
            totalTokens: usage.total_tokens
          } : null,
          cost
        });
      }
      
      return { content, usage };
    } catch (error) {
      console.error('Stream processing error:', error);
      throw error;
    }
  }

  /**
   * Calculate cost based on token usage
   */
  calculateCost(model, usage) {
    if (!usage || !TOKEN_PRICING[model]) {
      return 0;
    }
    
    const pricing = TOKEN_PRICING[model];
    const inputCost = usage.prompt_tokens * pricing.input;
    const outputCost = usage.completion_tokens * pricing.output;
    
    return parseFloat((inputCost + outputCost).toFixed(6));
  }

  /**
   * Handle OpenAI API errors
   */
  handleOpenAIError(error) {
    if (error.code === 'insufficient_quota') {
      return {
        statusCode: 429,
        message: 'OpenAI API quota exceeded. Please try again later.',
        code: 'QUOTA_EXCEEDED'
      };
    }
    
    if (error.code === 'rate_limit_exceeded') {
      return {
        statusCode: 429,
        message: 'Rate limit exceeded. Please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
      };
    }
    
    if (error.code === 'invalid_api_key') {
      return {
        statusCode: 401,
        message: 'Invalid API key configuration.',
        code: 'INVALID_API_KEY'
      };
    }
    
    if (error.code === 'model_not_found') {
      return {
        statusCode: 400,
        message: 'Requested model is not available.',
        code: 'MODEL_NOT_FOUND'
      };
    }
    
    if (error.code === 'context_length_exceeded') {
      return {
        statusCode: 400,
        message: 'Input is too long. Please reduce the content length.',
        code: 'CONTEXT_LENGTH_EXCEEDED'
      };
    }
    
    // Generic error
    return {
      statusCode: 500,
      message: error.message || 'An error occurred while generating content.',
      code: 'OPENAI_ERROR'
    };
  }

  /**
   * Validate model availability
   */
  isModelAvailable(model) {
    const availableModels = ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'];
    return availableModels.includes(model);
  }

  /**
   * Get model recommendations based on content type
   */
  getRecommendedModel(contentType, subscriptionPlan) {
    // Pro and Enterprise users get access to better models
    if (subscriptionPlan === 'pro' || subscriptionPlan === 'enterprise') {
      switch (contentType) {
        case 'blog-outline':
        case 'video-script':
          return 'gpt-4-turbo';
        case 'social-post':
        case 'email-subject':
          return 'gpt-3.5-turbo';
        default:
          return 'gpt-3.5-turbo';
      }
    }
    
    // Basic and free users use GPT-3.5
    return 'gpt-3.5-turbo';
  }

  /**
   * Estimate token count (rough approximation)
   */
  estimateTokenCount(text) {
    // Rough approximation: 1 token ≈ 4 characters for English text
    return Math.ceil(text.length / 4);
  }

  /**
   * Check if request is within limits
   */
  validateRequest(prompt, maxTokens = 1000) {
    const estimatedPromptTokens = this.estimateTokenCount(prompt);
    const totalEstimatedTokens = estimatedPromptTokens + maxTokens;
    
    // GPT-3.5-turbo has a 4096 token limit
    // GPT-4 has 8192 tokens, GPT-4-turbo has 128k tokens
    if (totalEstimatedTokens > 4000) {
      throw {
        statusCode: 400,
        message: 'Input is too long. Please reduce the content length.',
        code: 'INPUT_TOO_LONG'
      };
    }
    
    return true;
  }
}

// Export singleton instance
export const openaiService = new OpenAIService();
export default openaiService;
