const { CustomAPIError } = require('../errors');
const { StatusCodes } = require('http-status-codes');

const errorHandlerMiddleware = (err, req, res, next) => {
  if (err instanceof CustomAPIError) {
    return res.status(err.statusCode).json({ msg: err.message });
  }

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: messages.join(', ') });
  }

  if (err.name === 'CastError') {
    return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Invalid id format' });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ msg: `${field} already exists` });
  }

  return res
    .status(StatusCodes.INTERNAL_SERVER_ERROR)
    .json({ msg: 'Something went wrong' });
};

module.exports = errorHandlerMiddleware;
