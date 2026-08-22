import { beforeEach, describe, expect, it } from 'vitest';
import { login } from './auth';

describe('auth API service', () => {
  beforeEach(() => {
    document.cookie = 'csrfToken=test-csrf-token';
  });

  it('returns the user after a successful login', async () => {
    const result = await login({
      email: 'test@example.com',
      password: 'Password1',
    });

    expect(result.user).toEqual({
      _id: 'user-1',
      email: 'test@example.com',
    });
  });

  it('throws the API error when login fails', async () => {
    await expect(
      login({ email: 'wrong@example.com', password: 'wrong-password' })
    ).rejects.toThrow('Invalid credentials');
  });
});
