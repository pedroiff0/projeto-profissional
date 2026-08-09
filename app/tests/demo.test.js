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

// Banco de TESTE (app_test_db) para os testes de dominio.
let models;

const app = createApp();

beforeAll(setupDb);
beforeAll(async () => { models = modelsHelper.test; });
afterAll(teardownDb);
afterEach(clearDb);

// Garante o usuario alvo (senha compartilhada do arquivo) e devolve o token.
async function login(email, { demoUsuarios = 5 } = {}) {
  if (email === 'admin@admin.com') await seedAdminIfEmpty({ populaDemo: false }, models);
  else await carregarDemo({ usuarios: demoUsuarios, projetos: 0, itens: 0 }, models);
  const res = await request(app).post('/api/test/auth/login').send({ email, password: 'AdminComum123!!' });
  return res.body.token;
}

describe('Demo — carregamento de dados', () => {
  it('carrega usuarios, projetos e itens de catalogo', async () => {
    const r = await carregarDemo({ usuarios: 5, projetos: 8, itens: 20 }, models);
    expect(r.carregado).toBe(true);
    expect(await models.User.countDocuments({ email: /@example\.com$/ })).toBe(5);
    expect(await models.Project.countDocuments({})).toBe(8);
    expect(await models.CatalogItem.countDocuments({})).toBe(20);
  });

  it('nao duplica se ja existir', async () => {
    await carregarDemo({ usuarios: 3, projetos: 3, itens: 3 }, models);
    const r = await carregarDemo({ usuarios: 3, projetos: 3, itens: 3 }, models);
    expect(r.carregado).toBe(false);
    expect(r.motivo).toBe('ja_existe');
  });

  it('endpoint POST /api/test/demo/load popula e retorna contagem (autenticado)', async () => {
    const token = await login('admin@admin.com');
    const res = await request(app).post('/api/test/demo/load').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.carregado).toBe(true);
    expect(res.body.projetos).toBeGreaterThan(0);
  });
});

describe('Projetos (API + escopo)', () => {
  it('usuario comum so ve seus proprios projetos', async () => {
    const seed = await carregarDemo({ usuarios: 4, projetos: 10, itens: 0 }, models);
    expect(seed.carregado).toBe(true);
    const dono = await models.User.findOne({ email: 'demo2@example.com' });
    const token = await login('demo2@example.com');
    const res = await request(app).get('/api/test/projects').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    res.body.items.forEach((p) => expect(String(p.ownerId)).toBe(String(dono._id)));
  });

  it('cria projeto via POST validado', async () => {
    const token = await login('admin@admin.com');
    const res = await request(app)
      .post('/api/test/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Projeto Teste', status: 'em_andamento', tags: ['feature'] });
    expect(res.status).toBe(201);
    expect(res.body.project.name).toBe('Projeto Teste');
  });

  it('rejeita projeto com nome curto (422)', async () => {
    const token = await login('admin@admin.com');
    const res = await request(app)
      .post('/api/test/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'ab' });
    expect(res.status).toBe(422);
  });
});

describe('Catalogo (API)', () => {
  it('lista itens e filtra por categoria', async () => {
    const token = await login('admin@admin.com');
    await carregarDemo({ force: true, usuarios: 2, projetos: 3, itens: 30 }, models);
    const res = await request(app).get('/api/test/catalog?category=TI&limit=5').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    res.body.items.forEach((i) => expect(i.category).toBe('TI'));
  });
});

describe('Bloqueio em producao', () => {
  it('POST /api/app/demo/load retorna 403 (production)', async () => {
    // Precisa de um token VALIDO em production: semeia admin e loga no prefixo app.
    const prodModels = modelsHelper.prod;
    await seedAdminIfEmpty({ populaDemo: false }, prodModels);
    const loginProd = await request(app).post('/api/app/auth/login')
      .send({ email: 'admin@admin.com', password: 'AdminComum123!!' });
    const token = loginProd.body.token;
    expect(token).toBeTruthy();
    const res = await request(app).post('/api/app/demo/load').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
