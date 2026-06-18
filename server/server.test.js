import path from 'path';
import os from 'os';
import fs from 'fs';
import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import request from 'supertest';

process.env.PRODUCTS_DATA_PATH = path.join(os.tmpdir(), `server-test-products-${Date.now()}.json`);
process.env.UPLOADS_DIR = path.join(os.tmpdir(), `server-test-uploads-${Date.now()}`);
process.env.ADMIN_PASSWORD = 'test-admin-pass';

let app;

beforeAll(async () => {
  app = (await import('./server.js')).default;
});

afterAll(() => {
  if (fs.existsSync(process.env.PRODUCTS_DATA_PATH)) fs.unlinkSync(process.env.PRODUCTS_DATA_PATH);
});

describe('GET /api/products', () => {
  it('returns the migrated product list', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.count).toBe(12);
  });
});

describe('GET /api/products/:id', () => {
  it('returns 404 for an unknown id', async () => {
    const res = await request(app).get('/api/products/does-not-exist');
    expect(res.status).toBe(404);
  });

  it('returns the product for a known id', async () => {
    const res = await request(app).get('/api/products/1');
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe('1');
  });
});

describe('POST /api/admin/login', () => {
  it('rejects the wrong password', async () => {
    const res = await request(app).post('/api/admin/login').send({ password: 'wrong' });
    expect(res.status).toBe(401);
  });

  it('accepts the correct password and returns a token', async () => {
    const res = await request(app).post('/api/admin/login').send({ password: 'test-admin-pass' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTruthy();
  });
});

describe('POST /api/products', () => {
  it('rejects requests with no admin token', async () => {
    const res = await request(app).post('/api/products').send({ name: 'X', price: 1 });
    expect(res.status).toBe(401);
  });

  it('creates a product when authenticated', async () => {
    const login = await request(app).post('/api/admin/login').send({ password: 'test-admin-pass' });
    const token = login.body.token;

    const res = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Test Product', category: 'T-Shirts', price: 10, images: ['/images/x.jpg'] });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe('Test Product');
  });
});
