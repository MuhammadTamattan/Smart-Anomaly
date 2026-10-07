import request from 'supertest';
import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = '';

let connectTestDB, disconnectTestDB, clearDatabase, createTestUser, generateToken;
let app;
let Incident, Alert;

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

  const incidentModule = await import('../src/models/Incident.js');
  Incident = incidentModule.default;

  const alertModule = await import('../src/models/Alert.js');
  Alert = alertModule.default;
});

afterAll(async () => {
  if (disconnectTestDB) await disconnectTestDB();
});

let adminUser, adminToken, normalUser, userToken, testAlert;

beforeEach(async () => {
  await clearDatabase();

  adminUser = await createTestUser({
    name: 'Admin Lead',
    email: 'admin-inc@soc.test',
    role: 'admin',
  });
  adminToken = generateToken(adminUser._id);

  normalUser = await createTestUser({
    name: 'Regular User',
    email: 'user-inc@soc.test',
    role: 'user',
  });
  userToken = generateToken(normalUser._id);

  testAlert = await Alert.create({
    title: 'SQL Injection Detected',
    description: 'Suspicious SELECT union query pattern in API stream',
    severity: 'critical',
    type: 'sql_injection',
    status: 'new',
    user: adminUser._id,
    anomalyScore: 0.94,
    indicators: ['UNION SELECT match', 'High latency anomaly'],
  });
});

describe('Incident Management API (/api/incidents)', () => {
  describe('Authentication & Authorization', () => {
    it('should reject unauthenticated request with 401', async () => {
      const res = await request(app).get('/api/incidents');
      expect(res.status).toBe(401);
    });

    it('should reject non-admin user with 403', async () => {
      const res = await request(app)
        .get('/api/incidents')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res.status).toBe(403);
    });

    it('should accept admin user with 200', async () => {
      const res = await request(app)
        .get('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('Incident Creation & Alert Escalation', () => {
    it('should create an incident from an existing alert and carry over details', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          alertId: testAlert._id,
          note: 'Initial triage started on database firewall.',
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('SQL Injection Detected');
      expect(res.body.severity).toBe('critical');
      expect(res.body.type).toBe('sql_injection');
      expect(res.body.status).toBe('open');
      expect(res.body.incidentId).toMatch(/^INC-/);
      expect(res.body.notes.length).toBeGreaterThanOrEqual(1);

      // Verify the originating alert status transitioned to 'investigating'
      const updatedAlert = await Alert.findById(testAlert._id);
      expect(updatedAlert.status).toBe('investigating');
    });

    it('should create a manual incident without an alert', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Unauthorized Network Scan on Gateway',
          description: 'Port sweep detected targeting ports 22, 80, 443',
          severity: 'high',
          type: 'port_scan',
          source: 'Perimeter Firewall',
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Unauthorized Network Scan on Gateway');
      expect(res.body.severity).toBe('high');
      expect(res.body.status).toBe('open');
      expect(res.body.incidentId).toBeDefined();
    });

    it('should reject manual creation without title with 400', async () => {
      const res = await request(app)
        .post('/api/incidents')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ title: '' });

      expect(res.status).toBe(400);
    });
  });

  describe('Status Management & Investigation Notes', () => {
    let incident;

    beforeEach(async () => {
      incident = await Incident.create({
        title: 'DDoS Traffic Spike',
        description: 'Volumetric HTTP flood',
        severity: 'high',
        type: 'ddos',
        status: 'open',
        createdBy: adminUser._id,
      });
    });

    it('should update incident status to investigating then resolved', async () => {
      const res1 = await request(app)
        .patch(`/api/incidents/${incident._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'investigating' });

      expect(res1.status).toBe(200);
      expect(res1.body.status).toBe('investigating');

      const res2 = await request(app)
        .patch(`/api/incidents/${incident._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'resolved' });

      expect(res2.status).toBe(200);
      expect(res2.body.status).toBe('resolved');
      expect(res2.body.resolvedAt).toBeDefined();
    });

    it('should reject invalid status value with 400', async () => {
      const res = await request(app)
        .patch(`/api/incidents/${incident._id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'invalid_status' });

      expect(res.status).toBe(400);
    });

    it('should add investigation notes to the incident', async () => {
      const res = await request(app)
        .post(`/api/incidents/${incident._id}/notes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ text: 'Cloudflare rate limiting rule enabled.' });

      expect(res.status).toBe(200);
      expect(res.body.notes.length).toBe(1);
      expect(res.body.notes[0].text).toBe('Cloudflare rate limiting rule enabled.');
      expect(res.body.notes[0].authorName).toBeDefined();
    });

    it('should get incident stats breakdown', async () => {
      const res = await request(app)
        .get('/api/incidents/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.total).toBe(1);
      expect(res.body.open).toBe(1);
      expect(res.body.investigating).toBe(0);
      expect(res.body.resolved).toBe(0);
    });

    it('should delete an incident', async () => {
      const res = await request(app)
        .delete(`/api/incidents/${incident._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      const check = await Incident.findById(incident._id);
      expect(check).toBeNull();
    });
  });
});
