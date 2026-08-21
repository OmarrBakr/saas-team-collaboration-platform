const mongoose = require('mongoose');

const testMongoUri =
  process.env.MONGO_TEST_URI || 'mongodb://127.0.0.1:27017/flowvia_test';

jest.setTimeout(30000);

process.env.JWT_SECRET = 'test-access-secret';
process.env.JWT_LIFETIME = '5m';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret';
process.env.REFRESH_TOKEN_LIFETIME = '1d';

beforeAll(async () => {
  await mongoose.connect(testMongoUri);
});

afterEach(async () => {
  for (const collection of Object.values(mongoose.connection.collections)) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  await mongoose.disconnect();
});
