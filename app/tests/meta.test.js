process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-com-mais-de-32-caracteres-ok!!';

const request = require('supertest');
const { createApp } = require('../src/app');
const { setupDb, teardownDb, clearDb } = require('./helpers/db');
const models = require('./helpers/models');
const authService = require('../src/services/authService');

let User, Meta;
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
beforeAll(async () => {
  User = models.prod.User;
  Meta = models.prod.Meta;
});
afterAll(teardownDb);
afterEach(clearDb);

describe('Meta / foco — autenticado', () => {
  it('obtem meta (cria implicitamente se nao existir)', async () => {
    const user = await criarUser();
    const t = authService.generateToken(user);
    const res = await request(app).get('/api/meta').set('Authorization', `Bearer ${t}`);
    expect(res.status).toBe(200);
    expect(res.body.meta).toBeTruthy();
    expect(res.body.meta.ownerId.toString()).toBe(user._id.toString());
  });

  it('salva meta semanal', async () => {
    const user = await criarUser();
    const t = authService.generateToken(user);
    const res = await request(app)
      .patch('/api/meta')
      .set('Authorization', `Bearer ${t}`)
      .send({ metaSemana: 12 });
    expect(res.status).toBe(200);
    expect(res.body.meta.metaSemana).toBe(12);
  });

  it('registra foco (pomodoro)', async () => {
    const user = await criarUser();
    const t = authService.generateToken(user);
    const res = await request(app)
      .post('/api/meta/foco')
      .set('Authorization', `Bearer ${t}`)
      .send({ minutos: 25 });
    expect(res.status).toBe(200);
    expect(res.body.meta.focoMinutos).toBeGreaterThanOrEqual(25);
    expect(res.body.meta.pomodoros).toBeGreaterThanOrEqual(1);
  });

  it('exige autenticação', async () => {
    const res = await request(app).get('/api/meta');
    expect(res.status).toBe(401);
  });
});
