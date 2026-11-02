import request from 'supertest';
import { jest, describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';

process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = '';

let connectTestDB, disconnectTestDB, clearDatabase, createTestUser, generateToken;
let app;
let User;

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

  const userModule = await import('../src/models/User.js');
  User = userModule.default;
});

afterAll(async () => {
  if (disconnectTestDB) await disconnectTestDB();
});

afterEach(async () => {
  if (clearDatabase) await clearDatabase();
});

describe('Auth & Admin-Controlled Registration Approval', () => {
  describe('POST /api/auth/register', () => {
    it('should save account with status "pending", return approval message, and NOT auto-login or return token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'John Doe', email: 'john@test.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Registration submitted. Waiting for administrator approval.');
      expect(res.body).not.toHaveProperty('token');
      expect(res.body.user).toHaveProperty('_id');
      expect(res.body.user.email).toBe('john@test.com');
      expect(res.body.user.status).toBe('pending');
      expect(res.body.user.role).toBe('user');

      // Verify directly in DB
      const dbUser = await User.findOne({ email: 'john@test.com' });
      expect(dbUser).toBeTruthy();
      expect(dbUser.status).toBe('pending');
      expect(dbUser.role).toBe('user');
    });

    it('should prevent privilege escalation: ignore role or status sent in request body', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Hacker User',
          email: 'hacker@test.com',
          password: 'password123',
          role: 'admin',
          status: 'approved',
        });

      expect(res.status).toBe(201);
      const dbUser = await User.findOne({ email: 'hacker@test.com' });
      expect(dbUser.role).toBe('user');
      expect(dbUser.status).toBe('pending');
    });

    it('should reject registration without name', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'john@test.com', password: 'password123' });

      expect(res.status).toBe(400);
    });

    it('should reject registration without email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'John', password: 'password123' });

      expect(res.status).toBe(400);
    });

    it('should reject registration without password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'John', email: 'john@test.com' });

      expect(res.status).toBe(400);
    });

    it('should reject duplicate email', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ name: 'John', email: 'john@test.com', password: 'password123' });

      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Jane', email: 'john@test.com', password: 'password456' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/already exists/i);
    });
  });

  describe('POST /api/auth/login Security', () => {
    it('should reject login for pending accounts with specific message', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ name: 'Pending User', email: 'pending@test.com', password: 'password123' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'pending@test.com', password: 'password123' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Your account is awaiting administrator approval.');
      expect(res.body).not.toHaveProperty('token');
    });

    it('should reject login for rejected accounts with specific message', async () => {
      await createTestUser({
        name: 'Rejected User',
        email: 'rejected@test.com',
        password: 'password123',
        status: 'rejected',
        role: 'user',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'rejected@test.com', password: 'password123' });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Your registration was rejected.');
      expect(res.body).not.toHaveProperty('token');
    });

    it('should allow login for approved accounts and return token', async () => {
      await createTestUser({
        name: 'Approved User',
        email: 'approved@test.com',
        password: 'password123',
        status: 'approved',
        role: 'user',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'approved@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe('approved@test.com');
      expect(res.body.status).toBe('approved');
    });

    it('should preserve existing admin login without modification', async () => {
      const admin = await createTestUser({
        name: 'Main Admin',
        email: 'mainadmin@soc.io',
        password: 'adminsecret123',
        role: 'admin',
        status: 'approved',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'mainadmin@soc.io', password: 'adminsecret123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.role).toBe('admin');
      expect(res.body.email).toBe('mainadmin@soc.io');
    });

    it('should reject invalid password', async () => {
      await createTestUser({
        email: 'user@test.com',
        password: 'password123',
        status: 'approved',
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@test.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'password123' });

      expect(res.status).toBe(401);
    });
  });

  describe('Admin Registration Approval Workflow', () => {
    it('should allow Admin to list, approve, and reject registration requests', async () => {
      // 1. Create Main Admin
      const admin = await createTestUser({
        name: 'Admin Boss',
        email: 'admin@soc.io',
        role: 'admin',
        status: 'approved',
      });
      const adminToken = generateToken(admin._id);

      // 2. Submit new user registration
      const regRes = await request(app)
        .post('/api/auth/register')
        .send({ name: 'Alice Analyst', email: 'alice@test.com', password: 'alicepassword123' });
      expect(regRes.status).toBe(201);
      const aliceId = regRes.body.user._id;

      // 3. Admin lists registration requests
      const listRes = await request(app)
        .get('/api/auth/registration-requests')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(listRes.status).toBe(200);
      expect(Array.isArray(listRes.body)).toBe(true);
      const found = listRes.body.find((u) => u.email === 'alice@test.com');
      expect(found).toBeTruthy();
      expect(found.status).toBe('pending');

      // 4. Admin approves Alice
      const approveRes = await request(app)
        .patch(`/api/auth/registration-requests/${aliceId}/approve`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(approveRes.status).toBe(200);
      expect(approveRes.body.user.status).toBe('approved');

      // 5. Now Alice can log in
      const aliceLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alice@test.com', password: 'alicepassword123' });
      expect(aliceLogin.status).toBe(200);
      expect(aliceLogin.body).toHaveProperty('token');

      // 6. Admin rejects Alice afterwards
      const rejectRes = await request(app)
        .patch(`/api/auth/registration-requests/${aliceId}/reject`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(rejectRes.status).toBe(200);
      expect(rejectRes.body.user.status).toBe('rejected');

      // 7. Alice is now rejected and cannot log in
      const aliceLoginAgain = await request(app)
        .post('/api/auth/login')
        .send({ email: 'alice@test.com', password: 'alicepassword123' });
      expect(aliceLoginAgain.status).toBe(403);
      expect(aliceLoginAgain.body.message).toBe('Your registration was rejected.');
    });

    it('should reject unauthenticated and non-admin users from accessing registration approval endpoints', async () => {
      const regularUser = await createTestUser({
        name: 'Regular User',
        email: 'regular@test.com',
        role: 'user',
        status: 'approved',
      });
      const userToken = generateToken(regularUser._id);

      // Unauthenticated
      const res1 = await request(app).get('/api/auth/registration-requests');
      expect(res1.status).toBe(401);

      // Non-admin user
      const res2 = await request(app)
        .get('/api/auth/registration-requests')
        .set('Authorization', `Bearer ${userToken}`);
      expect(res2.status).toBe(403);

      // Non-admin attempting to approve
      const res3 = await request(app)
        .patch(`/api/auth/registration-requests/${regularUser._id}/approve`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(res3.status).toBe(403);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password successfully for approved user', async () => {
      const user = await createTestUser({
        name: 'Admin User',
        email: 'admin-pw@test.com',
        password: 'oldpassword123',
        status: 'approved',
      });
      const token = generateToken(user._id);

      const changeRes = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'oldpassword123', newPassword: 'newpassword456' });

      expect(changeRes.status).toBe(200);
      expect(changeRes.body.message).toMatch(/password updated/i);

      // Verify login with new password works
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin-pw@test.com', password: 'newpassword456' });

      expect(loginRes.status).toBe(200);
    });

    it('should reject incorrect current password', async () => {
      const user = await createTestUser({
        name: 'Admin User',
        email: 'admin-pw2@test.com',
        password: 'oldpassword123',
        status: 'approved',
      });
      const token = generateToken(user._id);

      const changeRes = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({ currentPassword: 'wrongpassword', newPassword: 'newpassword456' });

      expect(changeRes.status).toBe(400);
    });
  });
});
