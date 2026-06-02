const jwt = require('jsonwebtoken');
const { UnauthenticatedError } = require('../errors');

const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = req.cookies?.accessToken || (authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null);

  if (!token) {
    throw new UnauthenticatedError('Authentication invalid');
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { userId: payload.userId };
    next();
  } catch (error) {
    throw new UnauthenticatedError('Authentication invalid');
  }
};

module.exports = authenticateUser;
