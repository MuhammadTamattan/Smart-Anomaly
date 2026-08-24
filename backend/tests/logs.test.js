import request from 'supertest';
import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import fs from 'fs';
import path from 'path';

let connectTestDB, disconnectTestDB, clearDatabase, createTestUser, generateToken;
let app;

const TEST_LOG_CONTENT = '2026-01-01 10:00:00 ERROR Something went wrong\n2026-01-01 10:00:01 INFO Recovery started\n';
const testLogPath = path.join(__dirname, 'test-file.log');

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
});

let user, token;

beforeEach(async () => {
  await clearDatabase();
  user = await createTestUser({ email: 'loguser@test.com' });
  token = generateToken(user._id);
});

describe('Logs', () => {
  describe('POST /api/logs/upload', () => {
    it('should upload a log file when authenticated', async () => {
      const res = await request(app)
        .post('/api/logs/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', testLogPath);

      expect(res.status).toBe(201);
      expect(res.body.message).toMatch(/uploaded successfully/i);
      expect(res.body.log).toHaveProperty('_id');
    });

    it('should reject upload without authentication', async () => {
      const res = await request(app)
        .post('/api/logs/upload')
        .set('Content-Type', 'multipart/form-data')
        .field('file', 'test');

      expect(res.status).toBe(401);
    });

    it('should reject upload without file', async () => {
      const res = await request(app)
        .post('/api/logs/upload')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/logs', () => {
    it('should get logs for authenticated user', async () => {
      await request(app)
        .post('/api/logs/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', testLogPath);

      const res = await request(app)
        .get('/api/logs')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/logs');
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/logs/:id', () => {
    it('should delete own log', async () => {
      const uploadRes = await request(app)
        .post('/api/logs/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', testLogPath);

      const logId = uploadRes.body.log._id;

      const res = await request(app)
        .delete(`/api/logs/${logId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should not allow deleting another user log', async () => {
      const uploadRes = await request(app)
        .post('/api/logs/upload')
        .set('Authorization', `Bearer ${token}`)
        .attach('file', testLogPath);

      const logId = uploadRes.body.log._id;

      const otherUser = await createTestUser({ email: 'other@test.com', name: 'Other' });
      const otherToken = generateToken(otherUser._id);

      const res = await request(app)
        .delete(`/api/logs/${logId}`)
        .set('Authorization', `Bearer ${otherToken}`);

      expect(res.status).toBe(403);
    });
  });
});
