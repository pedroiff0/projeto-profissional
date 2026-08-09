process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-com-mais-de-32-caracteres-ok!!';

const request = require('supertest');
const { createApp } = require('../src/app');
const { setupDb, teardownDb, clearDb } = require('./helpers/db');
const models = require('./helpers/models');
const authService = require('../src/services/authService');

let User, Project;
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
  Project = models.prod.Project;
});
afterAll(teardownDb);
afterEach(clearDb);

describe('Projetos — CRUD autenticado', () => {
  it('cria projeto com tags', async () => {
    const user = await criarUser();
    const t = authService.generateToken(user);
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${t}`)
      .send({ name: 'Portal do cliente', description: 'Descrição', tags: ['urgente'] });
    expect(res.status).toBe(201);
    expect(res.body.project.name).toBe('Portal do cliente');
    expect(res.body.project.tags).toContain('urgente');
    expect(res.body.project.ownerId.toString()).toBe(user._id.toString());
  });

  it('rejeita nome muito curto com 422', async () => {
    const user = await criarUser();
    const t = authService.generateToken(user);
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${t}`)
      .send({ name: 'ab' });
    expect(res.status).toBe(422);
  });

  it('atualiza e remove projeto', async () => {
    const user = await criarUser();
    const t = authService.generateToken(user);
    const p = await Project.create({ name: 'Projeto X', ownerId: user._id, ownerName: 'Fulano' });
    const upd = await request(app)
      .patch(`/api/projects/${p._id}`)
      .set('Authorization', `Bearer ${t}`)
      .send({ status: 'concluido' });
    expect(upd.status).toBe(200);
    expect(upd.body.project.status).toBe('concluido');
    const del = await request(app)
      .delete(`/api/projects/${p._id}`)
      .set('Authorization', `Bearer ${t}`);
    expect(del.status).toBe(204);
  });

  it('exige autenticação', async () => {
    const res = await request(app).get('/api/projects');
    expect(res.status).toBe(401);
  });
});
