const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../src/models/User');

describe('User model', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-access-secret';
    process.env.JWT_LIFETIME = '5m';
    process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
    process.env.REFRESH_TOKEN_LIFETIME = '1d';
  });

  test('validates a correctly shaped user', () => {
    const user = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'TEST@EXAMPLE.COM',
      password: 'Password1',
    });

    expect(user.validateSync()).toBeUndefined();
    expect(user.email).toBe('test@example.com');
  });

  test('rejects a password without uppercase, lowercase, and number', () => {
    const user = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'passwordonly',
    });

    expect(user.validateSync().errors.password).toBeDefined();
  });

  test('hashes the password before saving', async () => {
    const user = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'Password1',
    });

    await new Promise((resolve, reject) => {
      User.schema.s.hooks.execPre('save', user, (error) =>
        error ? reject(error) : resolve()
      );
    });

    expect(user.password).not.toBe('Password1');
    await expect(bcrypt.compare('Password1', user.password)).resolves.toBe(true);
  });

  test('creates verifiable access and refresh tokens', () => {
    const user = new User({ _id: '507f1f77bcf86cd799439011' });
    const accessPayload = jwt.verify(user.createJWT(), process.env.JWT_SECRET);
    const refreshPayload = jwt.verify(
      user.createRefreshToken(),
      process.env.REFRESH_TOKEN_SECRET
    );

    expect(accessPayload.userId).toBe('507f1f77bcf86cd799439011');
    expect(refreshPayload.userId).toBe('507f1f77bcf86cd799439011');
  });
});
