const { CustomAPIError } = require('../errors');
const { StatusCodes } = require('http-status-codes');
const logger = require('../utils/logger');

const logError = (event, err, req, fields = {}) => {
  logger.warn(event, {
    method: req.method,
    route: req.originalUrl,
    userId: req.user?.userId,
    ...fields,
    error: logger.serializeError(err),
  });
};

const errorHandlerMiddleware = (err, req, res, next) => {
  if (err instanceof CustomAPIError) {
    logError('request.rejected', err, req, { statusCode: err.statusCode });
    return res.status(err.statusCode).json({ msg: err.message });
  }

  if (err.name === 'ValidationError') {
    logError('database.validation_failed', err, req);
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: messages.join(', ') });
  }

  if (err.name === 'CastError') {
    logError('database.invalid_query_value', err, req, { path: err.path });
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Invalid id format' });
  }

  if (err.code === 11000) {
    logError('database.duplicate_value', err, req, { fields: Object.keys(err.keyValue || {}) });
    const field = Object.keys(err.keyValue)[0];
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: `${field} already exists` });
  }

  if (err.name === 'MulterError') {
    logError('upload.validation_failed', err, req, { code: err.code });
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'File is too large'
        : err.message;
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: message });
  }

  logger.error('request.failed', {
    method: req.method,
    route: req.originalUrl,
    userId: req.user?.userId,
    error: logger.serializeError(err),
  });

  return res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ msg: 'Something went wrong' });
};

module.exports = errorHandlerMiddleware;
