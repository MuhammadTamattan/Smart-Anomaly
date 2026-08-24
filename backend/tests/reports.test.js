import request from 'supertest';
import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

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

let user, token;

beforeEach(async () => {
  await clearDatabase();
  user = await createTestUser({ email: 'reportuser@test.com' });
  token = generateToken(user._id);
});

describe('Reports', () => {
  describe('GET /api/reports/summary', () => {
    it('should return 401 without JWT', async () => {
      const res = await request(app).get('/api/reports/summary');
      expect(res.status).toBe(401);
    });

    it('should return report summary for authenticated user', async () => {
      const res = await request(app)
        .get('/api/reports/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('summary');
      expect(res.body).toHaveProperty('logSeverity');
      expect(res.body).toHaveProperty('logStatus');
      expect(res.body).toHaveProperty('threatTypes');
      expect(res.body).toHaveProperty('recentAlerts');
      expect(res.body).toHaveProperty('recentLogs');
      expect(res.body).toHaveProperty('trend');
      expect(res.body).toHaveProperty('logTrend');
      expect(res.body).toHaveProperty('generatedAt');
    });

    it('should return valid structure with empty database', async () => {
      const res = await request(app)
        .get('/api/reports/summary')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.summary.totalLogs).toBe(0);
      expect(res.body.summary.totalAlerts).toBe(0);
      expect(res.body.summary.analyzedLogs).toBe(0);
      expect(res.body.summary.anomalyLogs).toBe(0);
      expect(Array.isArray(res.body.recentAlerts)).toBe(true);
      expect(Array.isArray(res.body.recentLogs)).toBe(true);
    });
  });

  describe('GET /api/reports/export', () => {
    it('should return 401 without JWT', async () => {
      const res = await request(app).get('/api/reports/export');
      expect(res.status).toBe(401);
    });

    it('should export JSON report', async () => {
      const res = await request(app)
        .get('/api/reports/export?format=json')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/application\/json/);
      expect(res.body).toHaveProperty('reportTitle');
      expect(res.body).toHaveProperty('generatedAt');
      expect(res.body).toHaveProperty('summary');
    });

    it('should export CSV report', async () => {
      const res = await request(app)
        .get('/api/reports/export?format=csv')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/csv/);
    });
  });
});
