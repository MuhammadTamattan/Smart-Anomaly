import request from 'supertest';
import { jest, describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';

process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = '';

let connectTestDB, disconnectTestDB, clearDatabase, createTestUser, generateToken;
let app;
let Alert, Log, WebsiteScan;

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

  const websiteScanModule = await import('../src/models/WebsiteScan.js');
  WebsiteScan = websiteScanModule.default;
});

afterAll(async () => {
  if (disconnectTestDB) await disconnectTestDB();
});

let adminUser, adminToken, normalUser, userToken;

beforeEach(async () => {
  await clearDatabase();

  adminUser = await createTestUser({
    name: 'Admin SOC Lead',
    email: 'admin@soc.test',
    role: 'admin',
  });
  adminToken = generateToken(adminUser._id);

  normalUser = await createTestUser({
    name: 'Regular Analyst',
    email: 'user@soc.test',
    role: 'user',
  });
  userToken = generateToken(normalUser._id);

  // Populate sample telemetry data
  await Alert.create({
    title: 'Repeated Failed Logins (Brute Force)',
    description: 'Multiple failed authentication attempts detected from IP 192.168.1.105',
    severity: 'critical',
    type: 'brute_force',
    status: 'new',
    user: adminUser._id,
    anomalyScore: 0.92,
    indicators: ['401 Unauthorized Spike', 'Rapid Request Burst'],
  });

  await Log.create({
    originalName: 'auth-audit.log',
    storedName: 'auth-audit-123.log',
    filePath: '/tmp/auth-audit.log',
    fileType: '.log',
    fileSize: 2048,
    uploadedBy: adminUser._id,
    status: 'completed',
    analysisStatus: 'analyzed',
    isAnomaly: true,
    anomalyScore: 0.88,
    severity: 'critical',
  });

  await WebsiteScan.create({
    url: 'https://security-portal.internal',
    hostname: 'security-portal.internal',
    ipAddress: '10.0.0.5',
    scannedBy: adminUser._id,
    riskScore: 78,
    riskLevel: 'high',
    httpStatus: 200,
    findings: [
      {
        category: 'headers',
        level: 'danger',
        title: 'Missing Content-Security-Policy',
        description: 'No CSP header found',
      },
    ],
  });
});

describe('AI Security Assistant - POST /api/ai-assistant/chat', () => {
  // Test 1: Unauthenticated request -> rejected (401)
  it('1. should reject unauthenticated request with 401', async () => {
    const res = await request(app)
      .post('/api/ai-assistant/chat')
      .send({ message: 'What are the latest security threats?' });

    expect(res.status).toBe(401);
    expect(res.body.message).toMatch(/not authorized/i);
  });

  // Test 2: Normal user request -> rejected (403)
  it('2. should reject normal user with 403 (admin only)', async () => {
    const res = await request(app)
      .post('/api/ai-assistant/chat')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ message: 'What are the latest security threats?' });

    expect(res.status).toBe(403);
    expect(res.body.message).toMatch(/access denied, admin only/i);
  });

  // Test 3: Admin request -> accepted (200)
  it('3. should accept valid admin request with 200', async () => {
    const res = await request(app)
      .post('/api/ai-assistant/chat')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ message: 'What are the latest security threats?' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reply).toBeDefined();
    expect(typeof res.body.reply).toBe('string');
  });

  // Test 4: Empty message -> validation error (400)
  it('4. should reject empty or whitespace message with 400', async () => {
    const resEmpty = await request(app)
      .post('/api/ai-assistant/chat')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ message: '' });

    expect(resEmpty.status).toBe(400);
    expect(resEmpty.body.success).toBe(false);

    const resWhitespace = await request(app)
      .post('/api/ai-assistant/chat')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ message: '     ' });

    expect(resWhitespace.status).toBe(400);
    expect(resWhitespace.body.success).toBe(false);
  });

  // Test 5: AI provider failure -> handled gracefully
  it('5. should handle AI provider failure gracefully without crashing', async () => {
    // Set a dummy invalid API key to trigger external provider call failure
    const prevKey = process.env.AI_API_KEY;
    process.env.AI_API_KEY = 'invalid_mock_api_key_12345';

    const res = await request(app)
      .post('/api/ai-assistant/chat')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ message: 'Summarize today security activity' });

    // Should gracefully fallback and return 200 with grounded synthesis
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reply).toBeDefined();
    expect(res.body.metadata.provider).toMatch(/telemetry_engine/i);

    process.env.AI_API_KEY = prevKey;
  });

  // Test 6: AI response is returned correctly grounded in MongoDB data
  it('6. should return clean response grounded in actual database alerts and scans', async () => {
    const res = await request(app)
      .post('/api/ai-assistant/chat')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ message: 'Which alerts need immediate attention?' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.reply).toContain('Repeated Failed Logins');
    expect(res.body.reply).toContain('CRITICAL');
    expect(res.body.metadata).toBeDefined();
    expect(res.body.metadata.groundedContextSummary).toBeDefined();
    expect(res.body.metadata.groundedContextSummary.activeAlerts).toBe(1);
  });

  // Test 7: Existing functionality continues to work
  it('7. should ensure existing alert routes continue to function normally', async () => {
    const resAlerts = await request(app)
      .get('/api/alerts')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(resAlerts.status).toBe(200);
    expect(Array.isArray(resAlerts.body)).toBe(true);
    expect(resAlerts.body.length).toBe(1);

    const resDashboard = await request(app)
      .get('/api/dashboard/stats')
      .set('Authorization', `Bearer ${adminToken}`);

    expect(resDashboard.status).toBe(200);
    expect(resDashboard.body.totalAlerts).toBeDefined();
  });
});
