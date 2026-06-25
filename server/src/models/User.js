const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: [true, 'Please provide first name'],
      trim: true,
      maxlength: [20, 'First name must be at most 20 characters long'],
      minlength: [2, 'First name must be at least 2 characters long'],
    },
    lastName: {
      type: String,
      required: [
        function () {
          return !this.googleId;
        },
        'Please provide last name',
      ],
      trim: true,
      maxlength: [20, 'Last name must be at most 20 characters long'],
      minlength: [2, 'Last name must be at least 2 characters long'],
    },
    email: {
      type: String,
      required: [true, 'Please provide email'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please provide a valid email',
      ],
    },
    password: {
      type: String,
      required: [
        function () {
          return !this.googleId;
        },
        'Please provide a password',
      ],
      minlength: [8, 'Password must be at least 8 characters long'],
      select: false,
      match: [
        /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).*$/,
        'Password must contain at least one number, one lowercase letter, and one uppercase letter.',
      ],
    },
    refreshToken: {
      type: String,
      default: null,
      select: false,
    },
    verificationToken: String,
    isVerified: {
      type: Boolean,
      default: false,
    },
    verifiedAt: Date,
    passwordToken: {
      type: String,
    },
    passwordTokenExpirationDate: {
      type: Date,
    },
    googleId: {
      type: String,
    },

  },
  { timestamps: true }
);

UserSchema.pre('save', async function (next) {
  if (this.isModified('password') && this.password) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

UserSchema.methods.createJWT = function () {
  return jwt.sign({ userId: this._id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_LIFETIME,
  });
};

UserSchema.methods.createRefreshToken = function () {
  return jwt.sign({ userId: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_LIFETIME,
  });
};

UserSchema.methods.comparePassword = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};

module.exports = mongoose.model('User', UserSchema);
