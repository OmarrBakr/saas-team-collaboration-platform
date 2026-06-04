const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');

const User = require('../models/User');
const { BadRequestError, UnauthenticatedError } = require('../errors');
const attachCookies = require('../utils/cookies');
const sendVerificationEmail = require('../utils/sendVerficationEmail');
const crypto = require('crypto');

const register = async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  if (!firstName || !lastName || !email || !password) {
    throw new BadRequestError('Please provide first name, last name, email, and password');
  }

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new BadRequestError('Email already in use');
  }

  const verificationToken = crypto.randomBytes(40).toString('hex')

  const user = await User.create({
    firstName,
    lastName,
    email,
    password,
    verificationToken
  });

  const accessToken = user.createJWT();
  const refreshToken = user.createRefreshToken();

  user.refreshToken = refreshToken;
  await user.save();

  attachCookies(res, accessToken, refreshToken);

  const origin = 'http://localhost:3000';
  await sendVerificationEmail({
    name: user.firstName,
    email: user.email,
    verificationToken: user.verificationToken,
    origin,
  });

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

const verifyEmail = async (req, res) => {
  const { token: verificationToken, email } = req.body;
  console.log(email, verificationToken)
  const user = await User.findOne({ email });
  if (!user) {
    throw new UnauthenticatedError('Verification Failed');
  }
  if (user.verificationToken !== verificationToken) {
    throw new UnauthenticatedError('Verification Failed');
  }
  (user.isVerified = true), (user.verifiedAt = Date.now());
  user.verificationToken = '';
  await user.save();
  res.status(StatusCodes.OK).json({ msg: 'Email Verified' });
}

module.exports = {
  register,
  login,
  refresh,
  verifyEmail,
};
