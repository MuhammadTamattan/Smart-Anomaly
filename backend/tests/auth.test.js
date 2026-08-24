import request from 'supertest';
import { jest, describe, it, expect, beforeAll, afterAll, afterEach } from '@jest/globals';

process.env.JWT_SECRET = 'test-secret';
process.env.MONGODB_URI = '';

let connectTestDB, disconnectTestDB, clearDatabase;
let app;
let User;

beforeAll(async () => {
  const setup = await import('./setup.js');
  connectTestDB = setup.connectTestDB;
  disconnectTestDB = setup.disconnectTestDB;
  clearDatabase = setup.clearDatabase;
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

describe('Auth', () => {
  describe('POST /api/auth/register', () => {
    it('should register a valid user', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ name: 'John', email: 'john@test.com', password: 'password123' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe('john@test.com');
      expect(res.body.name).toBe('John');
      expect(res.body).toHaveProperty('_id');
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

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ name: 'John', email: 'john@test.com', password: 'password123' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@test.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.email).toBe('john@test.com');
    });

    it('should reject invalid password', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({ name: 'John', email: 'john@test.com', password: 'password123' });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@test.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
    });

    it('should reject non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', password: 'password123' });

      expect(res.status).toBe(401);
    });

    it('should reject login without email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
    });

    it('should reject login without password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'john@test.com' });

      expect(res.status).toBe(400);
    });
  });
});
