import request from 'supertest';
import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import axios from 'axios';

const TEST_LOG_CONTENT = '2026-01-01 10:00:00 ERROR Failed login attempt from 192.168.1.1\n2026-01-01 10:00:01 ERROR Failed login attempt from 192.168.1.1\n';
const testLogPath = path.join(__dirname, 'test-analysis-file.log');

const mockMlResult = {
  is_anomaly: true,
  anomaly_score: -0.5,
  severity: 'high',
  summary: 'Anomalous activity detected with multiple failed login attempts.',
  total_lines_analyzed: 2,
  feature_importance: {
    failed_auth: 5,
    sql_keywords: 0,
    shell_keywords: 0,
    port_scan: 0,
    error_count: 4,
    unique_ips: 1,
    rate_limit_hits: 0,
    connection_resets: 0,
    timeout_count: 0,
  },
};

let connectTestDB, disconnectTestDB, clearDatabase, createTestUser, generateToken;
let app;
let axiosPostSpy;

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

  fs.writeFileSync(testLogPath, TEST_LOG_CONTENT);
});

afterAll(async () => {
  if (disconnectTestDB) await disconnectTestDB();
  if (fs.existsSync(testLogPath)) fs.unlinkSync(testLogPath);
  if (axiosPostSpy) axiosPostSpy.mockRestore();
});

let user, token, logId;

beforeEach(async () => {
  await clearDatabase();
  user = await createTestUser({ email: 'mluser@test.com' });
  token = generateToken(user._id);

  const uploadRes = await request(app)
    .post('/api/logs/upload')
    .set('Authorization', `Bearer ${token}`)
    .attach('file', testLogPath);

  logId = uploadRes.body.log._id;

  if (axiosPostSpy) axiosPostSpy.mockRestore();
  axiosPostSpy = jest.spyOn(axios, 'post').mockResolvedValue({ data: mockMlResult });
});

describe('ML Analysis', () => {
  describe('POST /api/logs/:id/analyze', () => {
    it('should return 401 without JWT', async () => {
      const res = await request(app)
        .post(`/api/logs/${logId}/analyze`);

      expect(res.status).toBe(401);
    });

    it('should analyze a log with valid JWT', async () => {
      const res = await request(app)
        .post(`/api/logs/${logId}/analyze`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.result).toHaveProperty('is_anomaly');
      expect(res.body.result).toHaveProperty('anomaly_score');
      expect(res.body.result).toHaveProperty('severity');
    });

    it('should return 404 for nonexistent log', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .post(`/api/logs/${fakeId}/analyze`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });

    it('should return 403 when analyzing another user log', async () => {
      const otherUser = await createTestUser({ email: 'other@test.com', name: 'Other' });
      const otherToken = generateToken(otherUser._id);

      const res = await request(app)
        .post(`/api/logs/${logId}/analyze`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe('GET /api/logs/:id/result', () => {
    it('should return 401 without JWT', async () => {
      const res = await request(app)
        .get(`/api/logs/${logId}/result`);

      expect(res.status).toBe(401);
    });

    it('should get analysis result for own log', async () => {
      await request(app)
        .post(`/api/logs/${logId}/analyze`)
        .set('Authorization', `Bearer ${token}`);

      const res = await request(app)
        .get(`/api/logs/${logId}/result`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('analysisStatus');
    });

    it('should return 403 for another user log', async () => {
      const otherUser = await createTestUser({ email: 'other2@test.com', name: 'Other2' });
      const otherToken = generateToken(otherUser._id);

      const res = await request(app)
        .get(`/api/logs/${logId}/result`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
    });
  });
});
