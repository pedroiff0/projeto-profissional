process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-com-mais-de-32-caracteres-ok!!';

const request = require('supertest');
const { createApp } = require('../src/app');
const { setupDb, teardownDb, clearDb } = require('./helpers/db');
const User = require('../src/models/user.model');
const authService = require('../src/services/authService');

const app = createApp();
const SENHA = 'SenhaForte123ok';

async function criarUser(over = {}) {
  return User.create({
    name: 'Fulano',
    email: 'user@example.com',
    role: 'user',
    passwordHash: await authService.hashPassword(SENHA),
    ...over,
  });
}

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearDb);

describe('POST /api/auth/login', () => {
  it('autentica com credenciais validas e devolve cookie httpOnly', async () => {
    await criarUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: SENHA });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('user@example.com');
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/i);
  });

  it('rejeita senha errada com mensagem generica', async () => {
    await criarUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: 'ErradaTotal123' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciais invalidas');
  });

  it('nao revela se o e-mail existe (mesma resposta)', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'naoexiste@example.com', password: SENHA });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('Credenciais invalidas');
  });

  it('bloqueia a conta apos 5 tentativas falhas', async () => {
    await criarUser();
    for (let i = 0; i < 5; i += 1) {
      await request(app).post('/api/auth/login').send({ email: 'user@example.com', password: 'x'.repeat(12) });
    }
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: SENHA });
    expect(res.status).toBe(429);
  });

  it('resiste a injecao NoSQL no corpo', async () => {
    await criarUser();
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: { $gt: '' }, password: { $gt: '' } });
    expect([401, 422]).toContain(res.status);
  });

  it('recusa conta inativa', async () => {
    await criarUser({ isActive: false });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@example.com', password: SENHA });
    expect(res.status).toBe(401);
  });
});

describe('GET /api/auth/me', () => {
  it('exige autenticacao', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('devolve o usuario com Bearer valido', async () => {
    const user = await criarUser();
    const token = authService.generateToken(user);
    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user.id).toBe(user._id.toString());
  });
});
