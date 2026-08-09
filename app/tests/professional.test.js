process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-com-mais-de-32-caracteres-ok!!';

const request = require('supertest');
const { createApp } = require('../src/app');
const { setupDb, teardownDb, clearDb } = require('./helpers/db');
const models = require('./helpers/models');
const authService = require('../src/services/authService');

let User, Professional;
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
  Professional = models.prod.Professional;
});
afterAll(teardownDb);
afterEach(clearDb);

describe('Profissionais — CRUD autenticado', () => {
  it('cria profissional', async () => {
    const user = await criarUser();
    const t = authService.generateToken(user);
    const res = await request(app)
      .post('/api/professionals')
      .set('Authorization', `Bearer ${t}`)
      .send({ nome: 'Ana Souza', funcao: 'Designer', contato: 'ana@ex.com' });
    expect(res.status).toBe(201);
    expect(res.body.professional.nome).toBe('Ana Souza');
    expect(res.body.professional.ownerId.toString()).toBe(user._id.toString());
  });

  it('rejeita nome muito curto com 422', async () => {
    const user = await criarUser();
    const t = authService.generateToken(user);
    const res = await request(app)
      .post('/api/professionals')
      .set('Authorization', `Bearer ${t}`)
      .send({ nome: 'A' });
    expect(res.status).toBe(422);
  });

  it('atualiza e remove profissional', async () => {
    const user = await criarUser();
    const t = authService.generateToken(user);
    const p = await Professional.create({ nome: 'João', ownerId: user._id, ownerName: 'Fulano' });
    const upd = await request(app)
      .patch(`/api/professionals/${p._id}`)
      .set('Authorization', `Bearer ${t}`)
      .send({ funcao: 'Dev' });
    expect(upd.status).toBe(200);
    expect(upd.body.professional.funcao).toBe('Dev');
    const del = await request(app)
      .delete(`/api/professionals/${p._id}`)
      .set('Authorization', `Bearer ${t}`);
    expect(del.status).toBe(204);
  });

  it('exige autenticação', async () => {
    const res = await request(app).get('/api/professionals');
    expect(res.status).toBe(401);
  });
});
