const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined');
    }

    await mongoose.connect(process.env.MONGO_URI);
    logger.info('database.connected', { database: 'mongodb' });
  } catch (error) {
    logger.error('database.connection_failed', {
      database: 'mongodb',
      error: logger.serializeError(error),
    });
    process.exit(1);
  }
};

mongoose.connection.on('error', (error) => {
  logger.error('database.connection_error', {
    database: 'mongodb',
    error: logger.serializeError(error),
  });
});

mongoose.connection.on('disconnected', () => {
  logger.warn('database.disconnected', { database: 'mongodb' });
});

module.exports = connectDB;
