import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';

const Usage = sequelize.define('Usage', {
  usageId: {
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
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 12
    }
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 2023
    }
  },
  contentGenerations: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  contentRepurposing: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  totalTokensUsed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  totalCost: {
    type: DataTypes.DECIMAL(10, 4),
    defaultValue: 0.0000,
    allowNull: false,
    validate: {
      min: 0
    }
  },
  lastResetAt: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'usage',
  timestamps: true,
  indexes: [
    {
      fields: ['userId']
    },
    {
      fields: ['month', 'year']
    },
    {
      unique: true,
      fields: ['userId', 'month', 'year']
    }
  ]
});

// Instance methods
Usage.prototype.incrementGenerations = function(count = 1) {
  this.contentGenerations += count;
  return this.save();
};

Usage.prototype.incrementRepurposing = function(count = 1) {
  this.contentRepurposing += count;
  return this.save();
};

Usage.prototype.addTokenUsage = function(tokens, cost = 0) {
  this.totalTokensUsed += tokens;
  this.totalCost = parseFloat(this.totalCost) + parseFloat(cost);
  return this.save();
};

Usage.prototype.resetUsage = function() {
  this.contentGenerations = 0;
  this.contentRepurposing = 0;
  this.totalTokensUsed = 0;
  this.totalCost = 0.0000;
  this.lastResetAt = new Date();
  return this.save();
};

// Class methods
Usage.findOrCreateCurrent = async function(userId) {
  const now = new Date();
  const month = now.getMonth() + 1; // JavaScript months are 0-indexed
  const year = now.getFullYear();
  
  const [usage, created] = await this.findOrCreate({
    where: {
      userId,
      month,
      year
    },
    defaults: {
      userId,
      month,
      year,
      contentGenerations: 0,
      contentRepurposing: 0,
      totalTokensUsed: 0,
      totalCost: 0.0000
    }
  });
  
  return usage;
};

Usage.getCurrentUsage = async function(userId) {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  
  return this.findOne({
    where: {
      userId,
      month,
      year
    }
  });
};

Usage.getUserHistory = function(userId, limit = 12) {
  return this.findAll({
    where: { userId },
    order: [['year', 'DESC'], ['month', 'DESC']],
    limit
  });
};

Usage.getMonthlyStats = function(month, year) {
  return this.findAll({
    where: { month, year },
    attributes: [
      [sequelize.fn('COUNT', '*'), 'totalUsers'],
      [sequelize.fn('SUM', sequelize.col('contentGenerations')), 'totalGenerations'],
      [sequelize.fn('SUM', sequelize.col('contentRepurposing')), 'totalRepurposing'],
      [sequelize.fn('SUM', sequelize.col('totalTokensUsed')), 'totalTokens'],
      [sequelize.fn('SUM', sequelize.col('totalCost')), 'totalCost'],
      [sequelize.fn('AVG', sequelize.col('contentGenerations')), 'avgGenerations'],
      [sequelize.fn('AVG', sequelize.col('contentRepurposing')), 'avgRepurposing']
    ],
    raw: true
  });
};

Usage.resetAllUsage = async function() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  
  return this.update(
    {
      contentGenerations: 0,
      contentRepurposing: 0,
      totalTokensUsed: 0,
      totalCost: 0.0000,
      lastResetAt: new Date()
    },
    {
      where: {
        month,
        year
      }
    }
  );
};

export default Usage;
