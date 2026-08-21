const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');

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
});
