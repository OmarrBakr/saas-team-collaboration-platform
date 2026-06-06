const jwt = require('jsonwebtoken');
const { StatusCodes } = require('http-status-codes');

const User = require('../models/User');
const Workspace = require('../models/Workspace');
const { BadRequestError, UnauthenticatedError, NotFoundError } = require('../errors');
const attachCookies = require('../utils/cookies');
const sendVerificationEmail = require('../utils/sendVerficationEmail');
const sendResetPasswordEmail = require('../utils/sendResetPasswordEmail');
const createHash = require('../utils/createHash');
const crypto = require('crypto');

const createPersonalWorkspace = async (user) => {
  await Workspace.create({
    name: `${user.firstName}'s Workspace`,
    description: 'Your personal workspace',
    isPersonal: true,
    members: [{ user: user._id, role: 'admin', joinedAt: new Date() }],
  });
};

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

  await createPersonalWorkspace(user);

  attachCookies(res, accessToken, refreshToken);

  const origin = 'http://localhost:5000';
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
      isVerified: user.isVerified,
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
      isVerified: user.isVerified,
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

  res.status(StatusCodes.OK).json({ msg: 'Access token refreshed' });
};

const verifyEmail = async (req, res) => {
  const { token: verificationToken, email } = req.body;
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

const forgetPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) {
    throw new BadRequestError('Please provide valid email');
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new NotFoundError(`No user with email ${email}`);
  }
  const passwordToken = crypto.randomBytes(70).toString('hex');
  const origin = 'http://localhost:3000';
  await sendResetPasswordEmail({
    name: user.firstName,
    email: user.email,
    token: passwordToken,
    origin,
  });
  const tenMinutes = 1000 * 60 * 10;
  const passwordTokenExpirationDate = new Date(Date.now() + tenMinutes);
  user.passwordToken = createHash(passwordToken);
  user.passwordTokenExpirationDate = passwordTokenExpirationDate;
  await user.save();
  res
    .status(StatusCodes.OK)
    .json({ msg: 'Please check your email for reset password link' });
}

const resetPassword = async (req, res) => {
  const { token, email, password } = req.body;
  if (!token || !email || !password) {
    throw new BadRequestError('Please provide all values');
  }
  const user = await User.findOne({ email });
  if (!user) {
    throw new NotFoundError(`No user with email ${email}`);
  }
  const currentDate = new Date();
  if (
    user.passwordToken === createHash(token) &&
    user.passwordTokenExpirationDate > currentDate
  ) {
    user.password = password;
    user.passwordToken = null;
    user.passwordTokenExpirationDate = null;
    await user.save();
  } else {
    res.status(StatusCodes.GONE).json({ msg: 'Token expired/incorrect' })
  }
  res.status(StatusCodes.OK).json({ msg: 'Password reset' })
}

const initiateGoogleOAuth = async (req, res) => {
  const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
  const options = {
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,
    client_id: process.env.GOOGLE_CLIENT_ID,
    access_type: 'offline',
    response_type: 'code',
    prompt: 'consent',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '),
  };

  const qs = new URLSearchParams(options).toString();
  res.redirect(`${rootUrl}?${qs}`);
};

const googleOAuthCallback = async (req, res) => {
  const { code } = req.query;

  if (!code) {
    throw new BadRequestError('Authorization code not provided');
  }

  // Exchange code for tokens
  const tokenUrl = 'https://oauth2.googleapis.com/token';
  const tokenRes = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      redirect_uri: process.env.GOOGLE_CALLBACK_URL,
      grant_type: 'authorization_code',
    }).toString(),
  });

  if (!tokenRes.ok) {
    throw new UnauthenticatedError('Google OAuth token exchange failed');
  }

  const { access_token } = await tokenRes.json();

  // Get user info
  const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
    headers: {
      Authorization: `Bearer ${access_token}`,
    },
  });

  if (!userRes.ok) {
    throw new UnauthenticatedError('Failed to fetch user info from Google');
  }

  const googleUser = await userRes.json();
  const { id: googleId, email, given_name: firstName, family_name: lastName } = googleUser;

  if (!email) {
    throw new BadRequestError('Email not returned from Google');
  }

  // Find or create user
  let user = await User.findOne({ $or: [{ googleId }, { email }] });
  let isNewUser = false;

  if (user) {
    if (!user.googleId) {
      user.googleId = googleId;
    }
    user.isVerified = true;
    user.verificationToken = '';
    if (!user.verifiedAt) {
      user.verifiedAt = Date.now();
    }
  } else {
    isNewUser = true;
    user = new User({
      firstName: firstName || 'GoogleUser',
      lastName,
      email,
      googleId,
      isVerified: true,
      verifiedAt: Date.now(),
    });
  }

  const accessToken = user.createJWT();
  const refreshToken = user.createRefreshToken();

  user.refreshToken = refreshToken;
  await user.save();

  if (isNewUser) {
    await createPersonalWorkspace(user);
  }

  attachCookies(res, accessToken, refreshToken);

  res.redirect(process.env.CLIENT_ORIGIN);
};

module.exports = {
  register,
  login,
  refresh,
  verifyEmail,
  forgetPassword,
  resetPassword,
  initiateGoogleOAuth,
  googleOAuthCallback,
};
