import request from 'supertest';
import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = '';

let connectTestDB, disconnectTestDB, clearDatabase, createTestUser, generateToken;
let app;
let Alert, Log;

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

  const alertModule = await import('../src/models/Alert.js');
  Alert = alertModule.default;

  const logModule = await import('../src/models/Log.js');
  Log = logModule.default;
});

afterAll(async () => {
  if (disconnectTestDB) await disconnectTestDB();
});

let user, token, testLog;

beforeEach(async () => {
  await clearDatabase();
  user = await createTestUser({ email: 'alertuser@test.com' });
  token = generateToken(user._id);

  testLog = await Log.create({
    originalName: 'test.log',
    storedName: 'test-stored.log',
    filePath: '/tmp/test.log',
    fileType: '.log',
    fileSize: 100,
    uploadedBy: user._id,
    status: 'completed',
    analysisStatus: 'analyzed',
    isAnomaly: true,
    anomalyScore: -0.5,
    severity: 'high',
  });
});

describe('Alerts', () => {
  describe('GET /api/alerts', () => {
    it('should return 401 without JWT', async () => {
      const res = await request(app).get('/api/alerts');
      expect(res.status).toBe(401);
    });

    it('should return alerts for authenticated user', async () => {
      await Alert.create({
        title: 'Test Alert',
        description: 'Test description',
        severity: 'high',
        type: 'anomaly_detected',
        sourceLog: testLog._id,
        user: user._id,
      });

      const res = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(1);
    });

    it('should not show other user alerts', async () => {
      const otherUser = await createTestUser({ email: 'other@test.com', name: 'Other' });

      await Alert.create({
        title: 'Other Alert',
        description: 'Other description',
        severity: 'low',
        type: 'anomaly_detected',
        sourceLog: testLog._id,
        user: otherUser._id,
      });

      const res = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(0);
    });
  });

  describe('PATCH /api/alerts/:id/status', () => {
    it('should update alert status', async () => {
      const alert = await Alert.create({
        title: 'Test Alert',
        description: 'Test description',
        severity: 'medium',
        type: 'anomaly_detected',
        sourceLog: testLog._id,
        user: user._id,
      });

      const res = await request(app)
        .patch(`/api/alerts/${alert._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'investigating' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('investigating');
    });

    it('should return 400 for invalid status', async () => {
      const alert = await Alert.create({
        title: 'Test Alert',
        description: 'Test description',
        severity: 'medium',
        type: 'anomaly_detected',
        sourceLog: testLog._id,
        user: user._id,
      });

      const res = await request(app)
        .patch(`/api/alerts/${alert._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'invalid_status' });

      expect(res.status).toBe(400);
    });

    it('should not allow modifying another user alert', async () => {
      const otherUser = await createTestUser({ email: 'other2@test.com', name: 'Other2' });

      const alert = await Alert.create({
        title: 'Other Alert',
        description: 'Other description',
        severity: 'low',
        type: 'anomaly_detected',
        sourceLog: testLog._id,
        user: otherUser._id,
      });

      const res = await request(app)
        .patch(`/api/alerts/${alert._id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'resolved' });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/alerts/:id', () => {
    it('should delete own alert', async () => {
      const alert = await Alert.create({
        title: 'Test Alert',
        description: 'Test description',
        severity: 'critical',
        type: 'anomaly_detected',
        sourceLog: testLog._id,
        user: user._id,
      });

      const res = await request(app)
        .delete(`/api/alerts/${alert._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
    });

    it('should not allow deleting another user alert', async () => {
      const otherUser = await createTestUser({ email: 'other3@test.com', name: 'Other3' });

      const alert = await Alert.create({
        title: 'Other Alert',
        description: 'Other description',
        severity: 'high',
        type: 'anomaly_detected',
        sourceLog: testLog._id,
        user: otherUser._id,
      });

      const res = await request(app)
        .delete(`/api/alerts/${alert._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
    });
  });
});
