import request from 'supertest';
import { jest, describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';

process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = '';

let connectTestDB, disconnectTestDB, clearDatabase, createTestUser, generateToken;
let app;

beforeAll(async () => {
  const setup = await import('./setup.js');
  connectTestDB = setup.connectTestDB;
  disconnectTestDB = setup.disconnectTestDB;
  clearDatabase = setup.clearDatabase;
  createTestUser = setup.createTestUser;
  generateToken = setup.generateToken;
  await connectTestDB();

  const appModule = await import('../src/app.js');
  app = appModule.default;
});

afterAll(async () => {
  if (disconnectTestDB) await disconnectTestDB();
});

afterEach(async () => {
  if (clearDatabase) await clearDatabase();
});

describe('Authorization', () => {
  describe('Protected routes', () => {
    it('should return 401 without JWT on protected route', async () => {
      const res = await request(app).get('/api/auth/profile');
      expect(res.status).toBe(401);
    });

    it('should return 401 with invalid JWT', async () => {
      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalidtoken123');

      expect(res.status).toBe(401);
    });

    it('should return 200 with valid JWT', async () => {
      const user = await createTestUser({ email: 'auth@test.com' });
      const token = generateToken(user._id);

      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.email).toBe('auth@test.com');
    });

    it('should return 401 with expired JWT', async () => {
      const jwt = await import('jsonwebtoken');
      const user = await createTestUser({ email: 'expired@test.com' });
      const expiredToken = jwt.default.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: '0s' }
      );

      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(res.status).toBe(401);
    });
  });
});
