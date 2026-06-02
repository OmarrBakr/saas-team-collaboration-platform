const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');

const User = require('../models/User');
const { BadRequestError, UnauthenticatedError } = require('../errors');
const attachCookies = require('../utils/cookies');

const signup = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    throw new BadRequestError('Please provide first name, last name, email, and password');
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new BadRequestError('Email already in use');
  }

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
  });

  const accessToken = user.createJWT();
  const refreshToken = user.createRefreshToken();

  user.refreshToken = refreshToken;
  await user.save();

  attachCookies(res, accessToken, refreshToken);

  res.status(StatusCodes.CREATED).json({
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
  });
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new BadRequestError('Please provide email and password');
  }

  const user = await User.findOne({ email }).select('+password');

  if (!user) {
    throw new UnauthenticatedError('Invalid credentials');
  }

  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    throw new UnauthenticatedError('Invalid credentials');
  }

  const accessToken = user.createJWT();
  const refreshToken = user.createRefreshToken();

  user.refreshToken = refreshToken;
  await user.save();

  attachCookies(res, accessToken, refreshToken);

  res.status(StatusCodes.OK).json({
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
  });
};

const refresh = async (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    throw new UnauthenticatedError('Authentication invalid');
  }

  let payload;

  try {
    payload = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch (error) {
    throw new UnauthenticatedError('Authentication invalid');
  }

  const user = await User.findById(payload.userId).select('+refreshToken');

  if (!user || user.refreshToken !== refreshToken) {
    throw new UnauthenticatedError('Authentication invalid');
  }

  const accessToken = user.createJWT();
  const newRefreshToken = user.createRefreshToken();

  user.refreshToken = newRefreshToken;
  await user.save();

  attachCookies(res, accessToken, newRefreshToken);

  res.status(StatusCodes.OK).json({
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
    },
  });
};

module.exports = {
  signup,
  login,
  refresh,
};
