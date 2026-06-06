const { StatusCodes } = require('http-status-codes');

const User = require('../models/User');
const { BadRequestError, NotFoundError, UnauthenticatedError } = require('../errors');

/**
 * GET /api/v1/users/me
 * Return the authenticated user's profile.
 */
const getCurrentUser = async (req, res) => {
  const user = await User.findById(req.user.userId);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  res.status(StatusCodes.OK).json({
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isVerified: user.isVerified,
    },
  });
};

/**
 * PATCH /api/v1/users/me
 * Update the authenticated user's profile.
 * Body: { firstName?, lastName? }
 */
const updateCurrentUser = async (req, res) => {
  const { firstName, lastName } = req.body;

  if (firstName === undefined && lastName === undefined) {
    throw new BadRequestError('Please provide at least one field to update');
  }

  const user = await User.findById(req.user.userId);

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (firstName !== undefined) user.firstName = firstName;
  if (lastName !== undefined) user.lastName = lastName;

  await user.save();

  res.status(StatusCodes.OK).json({
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isVerified: user.isVerified,
    },
  });
};

/**
 * PATCH /api/v1/users/me/password
 * Change password for email/password accounts.
 * Body: { currentPassword, newPassword }
 */
const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw new BadRequestError('Please provide current password and new password');
  }

  const user = await User.findById(req.user.userId).select('+password');

  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (user.googleId && !user.password) {
    throw new BadRequestError('Password cannot be changed for Google OAuth accounts');
  }

  const isPasswordCorrect = await user.comparePassword(currentPassword);

  if (!isPasswordCorrect) {
    throw new UnauthenticatedError('Current password is incorrect');
  }

  user.password = newPassword;
  await user.save();

  res.status(StatusCodes.OK).json({ msg: 'Password updated successfully' });
};

module.exports = {
  getCurrentUser,
  updateCurrentUser,
  updatePassword,
};
