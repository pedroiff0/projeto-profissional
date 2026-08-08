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

describe('Tarefa: dificuldade, foco e entregueEm', () => {
  it('aceita dificuldade Fibonacci no create e valida valor fora da sequencia (422)', async () => {
    const token = await login('admin@admin.com');

    const ok = await request(app)
      .post('/api/test/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tarefa Fibonacci', dificuldade: 8 });
    expect(ok.status).toBe(201);
    expect(ok.body.task.dificuldade).toBe(8);

    const ruim = await request(app)
      .post('/api/test/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Tarefa invalida', dificuldade: 4 });
    expect(ruim.status).toBe(422);
  });

  it('registra entregueEm automaticamente ao marcar done e limpa ao sair', async () => {
    const token = await login('admin@admin.com');
    const id = await request(app)
      .post('/api/test/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Concluir', status: 'todo' })
      .then((r) => r.body.task._id);

    const done = await request(app)
      .patch(`/api/test/tasks/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'done' });
    expect(done.status).toBe(200);
    expect(done.body.task.entregueEm).toBeTruthy();

    const reabre = await request(app)
      .patch(`/api/test/tasks/${id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'doing' });
    expect(reabre.body.task.entregueEm).toBeNull();
  });

  it('POST /:id/foco incrementa minutosFoco e rejeita valor invalido', async () => {
    const token = await login('admin@admin.com');
    const id = await request(app)
      .post('/api/test/tasks')
      .set('Authorization', `Bearer ${token}`)
      .send({ title: 'Foco', dificuldade: 3 })
      .then((r) => r.body.task._id);

    const foco = await request(app)
      .post(`/api/test/tasks/${id}/foco`)
      .set('Authorization', `Bearer ${token}`)
      .send({ minutos: 25 });
    expect(foco.status).toBe(200);
    expect(foco.body.task.minutosFoco).toBe(25);

    const foco2 = await request(app)
      .post(`/api/test/tasks/${id}/foco`)
      .set('Authorization', `Bearer ${token}`)
      .send({ minutos: 25 });
    expect(foco2.body.task.minutosFoco).toBe(50);

    const invalido = await request(app)
      .post(`/api/test/tasks/${id}/foco`)
      .set('Authorization', `Bearer ${token}`)
      .send({ minutos: -5 });
    expect(invalido.status).toBe(400);
  });
});
