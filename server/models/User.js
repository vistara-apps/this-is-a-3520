import { DataTypes } from 'sequelize';
import { sequelize } from '../config/database.js';
import bcrypt from 'bcryptjs';

const User = sequelize.define('User', {
  userId: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [6, 100]
    }
  },
  firstName: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [1, 50]
    }
  },
  lastName: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      len: [1, 50]
    }
  },
  subscriptionPlan: {
    type: DataTypes.ENUM('free', 'basic', 'pro', 'enterprise'),
    defaultValue: 'free',
    allowNull: false
  },
  subscriptionStatus: {
    type: DataTypes.ENUM('active', 'inactive', 'cancelled', 'past_due'),
    defaultValue: 'inactive',
    allowNull: false
  },
  stripeCustomerId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  stripeSubscriptionId: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true
  },
  subscriptionStartDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  subscriptionEndDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isEmailVerified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    allowNull: false
  },
  emailVerificationToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetPasswordToken: {
    type: DataTypes.STRING,
    allowNull: true
  },
  resetPasswordExpires: {
    type: DataTypes.DATE,
    allowNull: true
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    allowNull: false
  }
}, {
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(12);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// Instance methods
User.prototype.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

User.prototype.getFullName = function() {
  return `${this.firstName || ''} ${this.lastName || ''}`.trim() || this.email;
};

User.prototype.isSubscriptionActive = function() {
  return this.subscriptionStatus === 'active' && 
         this.subscriptionEndDate && 
         new Date() < this.subscriptionEndDate;
};

User.prototype.getSubscriptionLimits = function() {
  const limits = {
    free: { generations: 3, repurposing: 1 },
    basic: { generations: 10, repurposing: 5 },
    pro: { generations: -1, repurposing: -1 }, // -1 means unlimited
    enterprise: { generations: -1, repurposing: -1 }
  };
  
  return limits[this.subscriptionPlan] || limits.free;
};

// Class methods
User.findByEmail = function(email) {
  return this.findOne({ where: { email: email.toLowerCase() } });
};

User.findActiveUsers = function() {
  return this.findAll({ where: { isActive: true } });
};

export default User;
