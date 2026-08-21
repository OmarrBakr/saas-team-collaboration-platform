const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const User = require('../src/models/User');
const Workspace = require('../src/models/Workspace');
require('./setup');

const testUser = {
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  password: 'Password1',
};

describe('API integration', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-access-secret';
  });

  test('rejects unauthenticated requests to protected routes', async () => {
    const response = await request(app).get('/api/v1/users/me');

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('msg', 'Authentication invalid');
  });

  test('rejects requests with an invalid access token', async () => {
    const response = await request(app)
      .get('/api/v1/workspaces')
      .set('Cookie', 'accessToken=not-a-valid-token');

    expect(response.statusCode).toBe(401);
    expect(response.body).toHaveProperty('msg', 'Authentication invalid');
  });

  test('accepts a valid access token at the authentication middleware', async () => {
    const token = jwt.sign(
      { userId: '507f1f77bcf86cd799439011' },
      process.env.JWT_SECRET,
      { expiresIn: '5m' }
    );

    const response = await request(app)
      .get('/api/v1/users/unknown-endpoint')
      .set('Cookie', `accessToken=${token}`);

    expect(response.statusCode).toBe(404);
  });

  test('returns 404 for an unknown API route', async () => {
    const response = await request(app).get('/api/v1/does-not-exist');

    expect(response.statusCode).toBe(404);
    expect(response.text).toBe('Route does not exist');
  });

  test('logs in an existing user and returns authentication cookies', async () => {
    await User.create(testUser);

    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: testUser.email, password: testUser.password });

    expect(response.statusCode).toBe(200);
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('accessToken='),
        expect.stringContaining('refreshToken='),
      ])
    );
  });

  test('creates a workspace for an authenticated user', async () => {
    const user = await User.create(testUser);
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '5m',
    });

    const response = await request(app)
      .post('/api/v1/workspaces')
      .set('Cookie', `accessToken=${token}`)
      .send({ name: 'Test Workspace', description: 'Integration test workspace' });

    expect(response.statusCode).toBe(201);
    expect(response.body.workspace.name).toBe('Test Workspace');
    expect(response.body.workspace.members[0].user).toBe(String(user._id));
  });

  test('returns only workspaces belonging to the authenticated user', async () => {
    const user = await User.create(testUser);
    const otherUser = await User.create({
      ...testUser,
      email: 'other@example.com',
    });

    await Workspace.create({
      name: 'Visible Workspace',
      members: [{ user: user._id, role: 'admin' }],
    });
    await Workspace.create({
      name: 'Hidden Workspace',
      members: [{ user: otherUser._id, role: 'admin' }],
    });

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '5m',
    });
    const response = await request(app)
      .get('/api/v1/workspaces')
      .set('Cookie', `accessToken=${token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.count).toBe(1);
    expect(response.body.workspaces[0].name).toBe('Visible Workspace');
  });
});
