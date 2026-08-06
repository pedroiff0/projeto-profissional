process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-com-mais-de-32-caracteres-ok!!';
const fs = require('fs');
const os = require('os');
const path = require('path');
const ARQ = path.join(os.tmpdir(), `seed-senha-${process.pid}.md`);
fs.writeFileSync(ARQ, 'Senha:   `AdminComum123!!`\n');
process.env.SEED_PASSWORD_FILE = ARQ;

const request = require('supertest');
const { createApp } = require('../src/app');
const { setupDb, teardownDb, clearDb } = require('./helpers/db');
const modelsHelper = require('./helpers/models');
const { seedAdminIfEmpty } = require('../src/seeds/admin.seed');
const { carregarDemo } = require('../src/services/demoService');

let models;
const app = createApp();

beforeAll(setupDb);
beforeAll(async () => { models = modelsHelper.test; });
afterAll(teardownDb);
afterEach(clearDb);

async function login(email) {
  if (email === 'admin@admin.com') await seedAdminIfEmpty({ populaDemo: false }, models);
  else await carregarDemo({ usuarios: 5, projetos: 0, itens: 0 }, models);
  const res = await request(app).post('/api/test/auth/login').send({ email, password: 'AdminComum123!!' });
  return res.body.token;
}

describe('Tarefas (API)', () => {
  it('cria, lista, move status e remove', async () => {
    const token = await login('admin@admin.com');

    const criada = await request(app)
      .post('/api/test/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tarefa de teste', status: 'todo' });
    expect(criada.status).toBe(201);
    const id = criada.body.task._id;

    const lista = await request(app).get('/api/test/tasks').set('Authorization', `Bearer ${token}`);
    expect(lista.status).toBe(200);
    expect(lista.body.tasks.some((t) => t._id === id)).toBe(true);

    const movida = await request(app)
      .patch(`/api/test/tasks/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'doing' });
    expect(movida.status).toBe(200);
    expect(movida.body.task.status).toBe('doing');

    const removida = await request(app).delete(`/api/test/tasks/${id}`).set('Authorization', `Bearer ${token}`);
    expect(removida.status).toBe(204);
  });

  it('valida titulo curto (422)', async () => {
    const token = await login('admin@admin.com');
    const res = await request(app).post('/api/test/tasks').set('Authorization', `Bearer ${token}`).send({ title: 'x' });
    expect(res.status).toBe(422);
  });

  it('usuario comum so ve suas tarefas; admin ve tudo', async () => {
    // Carrega usuarios demo UMA vez (idempotente por email).
    await carregarDemo({ usuarios: 5, projetos: 0, itens: 0 }, models);
    await seedAdminIfEmpty({ populaDemo: false }, models);

    const tAdmin = await request(app).post('/api/test/auth/login').send({ email: 'admin@admin.com', password: 'AdminComum123!!' }).then((r) => r.body.token);
    const tDemo1 = await request(app).post('/api/test/auth/login').send({ email: 'demo1@example.com', password: 'AdminComum123!!' }).then((r) => r.body.token);
    const tDemo2 = await request(app).post('/api/test/auth/login').send({ email: 'demo2@example.com', password: 'AdminComum123!!' }).then((r) => r.body.token);

    await request(app).post('/api/test/tasks').set('Authorization', `Bearer ${tDemo1}`).send({ title: 'Task do demo1' });
    await request(app).post('/api/test/tasks').set('Authorization', `Bearer ${tDemo2}`).send({ title: 'Task do demo2' });

    const listaDemo1 = await request(app).get('/api/test/tasks').set('Authorization', `Bearer ${tDemo1}`);
    expect(listaDemo1.body.tasks.every((t) => t.title === 'Task do demo1')).toBe(true);

    const listaAdmin = await request(app).get('/api/test/tasks').set('Authorization', `Bearer ${tAdmin}`);
    expect(listaAdmin.body.tasks.some((t) => t.title === 'Task do demo1')).toBe(true);
    expect(listaAdmin.body.tasks.some((t) => t.title === 'Task do demo2')).toBe(true);
  });
});
