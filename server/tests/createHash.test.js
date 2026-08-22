const createHash = require('../src/utils/createHash');

describe('createHash', () => {
  test('returns a deterministic hash for the same input', () => {
    expect(createHash('verification-token')).toBe(
      createHash('verification-token')
    );
  });

  test('returns different hashes for different inputs', () => {
    expect(createHash('token-one')).not.toBe(createHash('token-two'));
  });

  test('returns a 64-character hexadecimal string', () => {
    expect(createHash('test-token')).toMatch(/^[a-f0-9]{64}$/);
  });
});
