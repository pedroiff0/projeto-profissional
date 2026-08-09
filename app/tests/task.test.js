process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-com-mais-de-32-caracteres-ok!!';

const request = require('supertest');
const { createApp } = require('../src/app');
const { setupDb, teardownDb, clearDb } = require('./helpers/db');
const models = require('./helpers/models');
const authService = require('../src/services/authService');

let User, Project, Task;
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
async function token(user) { return authService.generateToken(user); }

beforeAll(setupDb);
beforeAll(async () => {
  User = models.prod.User;
  Project = models.prod.Project;
  Task = models.prod.Task;
});
afterAll(teardownDb);
afterEach(clearDb);

describe('Tarefas — CRUD autenticado', () => {
  it('cria tarefa com campos ricos (datas, horario, tags, arquivos, links, comentarios)', async () => {
    const user = await criarUser();
    const t = await token(user);
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${t}`)
      .send({
        titulo: 'Tarefa de exemplo',
        descricao: 'Descrição **markdown**',
        status: 'em_andamento',
        dataInicio: '2026-08-01T00:00:00.000Z',
        prazo: '2026-08-15T00:00:00.000Z',
        horario: '08:00',
        tags: ['beta', 'cliente'],
        arquivos: [{ nome: 'spec.pdf', url: '/files/spec.pdf', tipo: 'pdf' }],
        links: [{ titulo: 'Docs', url: 'https://example.com' }],
        comentarios: [{ autor: 'Fulano', texto: 'Primeiro comentário' }],
      });
    expect(res.status).toBe(201);
    expect(res.body.task.titulo).toBe('Tarefa de exemplo');
    expect(res.body.task.status).toBe('em_andamento');
    expect(res.body.task.horario).toBe('08:00');
    expect(res.body.task.arquivos).toHaveLength(1);
    expect(res.body.task.links).toHaveLength(1);
    expect(res.body.task.comentarios).toHaveLength(1);
    expect(res.body.task.comentarios[0].autor).toBe('Fulano');
  });

  it('rejeita título muito curto com 422', async () => {
    const user = await criarUser();
    const t = await token(user);
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${t}`)
      .send({ titulo: 'ab' });
    expect(res.status).toBe(422);
  });

  it('lista tarefas do usuario (escopo por dono)', async () => {
    const user = await criarUser();
    const t = await token(user);
    await Task.create({ titulo: 'Minha tarefa', ownerId: user._id, ownerName: 'Fulano' });
    const res = await request(app).get('/api/tasks').set('Authorization', `Bearer ${t}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.items)).toBe(true);
    expect(res.body.items.some((x) => x.titulo === 'Minha tarefa')).toBe(true);
  });

  it('atualiza status e prazo via PATCH', async () => {
    const user = await criarUser();
    const t = await token(user);
    const task = await Task.create({ titulo: 'Ajustar layout', ownerId: user._id, ownerName: 'Fulano' });
    const res = await request(app)
      .patch(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${t}`)
      .send({ status: 'concluido', prazo: '2026-09-01T00:00:00.000Z' });
    expect(res.status).toBe(200);
    expect(res.body.task.status).toBe('concluido');
    expect(res.body.task.prazo).toBeTruthy();
  });

  it('remove tarefa (204)', async () => {
    const user = await criarUser();
    const t = await token(user);
    const task = await Task.create({ titulo: 'A ser removida', ownerId: user._id, ownerName: 'Fulano' });
    const res = await request(app)
      .delete(`/api/tasks/${task._id}`)
      .set('Authorization', `Bearer ${t}`);
    expect(res.status).toBe(204);
    expect(await Task.countDocuments({ _id: task._id })).toBe(0);
  });

  it('exige autenticação', async () => {
    const res = await request(app).get('/api/tasks');
    expect(res.status).toBe(401);
  });
});
