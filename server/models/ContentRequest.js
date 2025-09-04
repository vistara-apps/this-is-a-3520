import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const ContentRequest = sequelize.define('ContentRequest', {
  requestId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'users',
      key: 'userId'
    }
  },
  type: {
    type: DataTypes.ENUM(
      'social-post', 
      'blog-outline', 
      'email-subject', 
      'product-description', 
      'video-script',
      'repurpose-video',
      'repurpose-audio',
      'repurpose-text'
    ),
    allowNull: false
  },
  inputContent: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [1, 10000]
    }
  },
  generatedContent: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled'),
    defaultValue: 'pending',
    allowNull: false
  },
  errorMessage: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  processingStartedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  processingCompletedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  processingDuration: {
    type: DataTypes.INTEGER, // in milliseconds
    allowNull: true
  },
  tokensUsed: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 0
  },
  cost: {
    type: DataTypes.DECIMAL(10, 4), // Store cost in dollars
    allowNull: true,
    defaultValue: 0.0000
  },
  model: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'gpt-3.5-turbo'
  },
  temperature: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0.7,
    validate: {
      min: 0,
      max: 2
    }
  },
  maxTokens: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1000
  },
  metadata: {
    type: DataTypes.JSONB, // Store additional metadata like file info, settings, etc.
    allowNull: true,
    defaultValue: {}
  },
  isBookmarked: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 5
    }
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'content_requests',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['status']
    },
    {
      fields: ['type']
    },
    {
      fields: ['createdAt']
    },
    {
      fields: ['userId', 'createdAt']
    }
  ]
});

// Instance methods
ContentRequest.prototype.markAsProcessing = function() {
  this.status = 'processing';
  this.processingStartedAt = new Date();
  return this.save();
};

ContentRequest.prototype.markAsCompleted = function(generatedContent, tokensUsed = 0, cost = 0) {
  this.status = 'completed';
  this.generatedContent = generatedContent;
  this.processingCompletedAt = new Date();
  this.tokensUsed = tokensUsed;
  this.cost = cost;
  
  if (this.processingStartedAt) {
    this.processingDuration = new Date() - this.processingStartedAt;
  }
  
  return this.save();
};

ContentRequest.prototype.markAsFailed = function(errorMessage) {
  this.status = 'failed';
  this.errorMessage = errorMessage;
  this.processingCompletedAt = new Date();
  
  if (this.processingStartedAt) {
    this.processingDuration = new Date() - this.processingStartedAt;
  }
  
  return this.save();
};

ContentRequest.prototype.getProcessingTime = function() {
  if (this.processingDuration) {
    return this.processingDuration;
  }
  
  if (this.processingStartedAt && this.processingCompletedAt) {
    return this.processingCompletedAt - this.processingStartedAt;
  }
  
  return null;
};

// Class methods
ContentRequest.findByUser = function(userId, options = {}) {
  return this.findAll({
    where: { userId },
    order: [['createdAt', 'DESC']],
    ...options
  });
};

ContentRequest.findByStatus = function(status, options = {}) {
  return this.findAll({
    where: { status },
    order: [['createdAt', 'ASC']],
    ...options
  });
};

ContentRequest.getUserStats = async function(userId, timeframe = '30d') {
  const startDate = new Date();
  
  switch (timeframe) {
    case '24h':
      startDate.setHours(startDate.getHours() - 24);
      break;
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    default:
      startDate.setDate(startDate.getDate() - 30);
  }
  
  const stats = await this.findAll({
    where: {
      userId,
      createdAt: {
        [sequelize.Sequelize.Op.gte]: startDate
      }
    },
    attributes: [
      'type',
      'status',
      [sequelize.fn('COUNT', '*'), 'count'],
      [sequelize.fn('SUM', sequelize.col('tokensUsed')), 'totalTokens'],
      [sequelize.fn('SUM', sequelize.col('cost')), 'totalCost']
    ],
    group: ['type', 'status'],
    raw: true
  });
  
  return stats;
};

export default ContentRequest;
