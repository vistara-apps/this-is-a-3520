import { sequelize } from '../config/database.js';
import User from './User.js';
import ContentRequest from './ContentRequest.js';
import Usage from './Usage.js';

// Define associations
User.hasMany(ContentRequest, {
  foreignKey: 'userId',
  as: 'contentRequests',
  onDelete: 'CASCADE'
});

ContentRequest.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

User.hasMany(Usage, {
  foreignKey: 'userId',
  as: 'usage',
  onDelete: 'CASCADE'
});

Usage.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// Export models and sequelize instance
export {
  sequelize,
  User,
  ContentRequest,
  Usage
};

export default {
  sequelize,
  User,
  ContentRequest,
  Usage
};
