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
const User = require('../src/models/user.model');
const Project = require('../src/models/project.model');
const CatalogItem = require('../src/models/catalogItem.model');
const { seedAdminIfEmpty } = require('../src/seeds/admin.seed');
const { carregarDemo } = require('../src/services/demoService');

const app = createApp();

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearDb);

// Garante o usuario alvo (senha compartilhada do arquivo) e devolve o token.
async function login(email, { demoUsuarios = 5 } = {}) {
  if (email === 'admin@admin.com') await seedAdminIfEmpty({ populaDemo: false });
  else await carregarDemo({ usuarios: demoUsuarios, projetos: 0, itens: 0 });
  const res = await request(app).post('/api/auth/login').send({ email, password: 'AdminComum123!!' });
  return res.body.token;
}

describe('Demo — carregamento de dados', () => {
  it('carrega usuarios, projetos e itens de catalogo', async () => {
    const r = await carregarDemo({ usuarios: 5, projetos: 8, itens: 20 });
    expect(r.carregado).toBe(true);
    expect(await User.countDocuments({ email: /@example\.com$/ })).toBe(5);
    expect(await Project.countDocuments({})).toBe(8);
    expect(await CatalogItem.countDocuments({})).toBe(20);
  });

  it('nao duplica se ja existir', async () => {
    await carregarDemo({ usuarios: 3, projetos: 3, itens: 3 });
    const r = await carregarDemo({ usuarios: 3, projetos: 3, itens: 3 });
    expect(r.carregado).toBe(false);
    expect(r.motivo).toBe('ja_existe');
  });

  it('endpoint POST /api/demo/load popula e retorna contagem (autenticado)', async () => {
    const token = await login('admin@admin.com');
    const res = await request(app).post('/api/demo/load').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.carregado).toBe(true);
    expect(res.body.projetos).toBeGreaterThan(0);
  });
});

describe('Projetos (API + escopo)', () => {
  it('usuario comum so ve seus proprios projetos', async () => {
    const seed = await carregarDemo({ usuarios: 4, projetos: 10, itens: 0 });
    expect(seed.carregado).toBe(true);
    // demo2 (i=1) nao e admin (so i%7==0); garante escopo de usuario comum.
    const dono = await User.findOne({ email: 'demo2@example.com' });
    const token = await login('demo2@example.com');
    const res = await request(app).get('/api/projects').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    res.body.items.forEach((p) => expect(String(p.ownerId)).toBe(String(dono._id)));
  });

  it('cria projeto via POST validado', async () => {
    const token = await login('admin@admin.com');
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Projeto Teste', status: 'em_andamento', tags: ['feature'] });
    expect(res.status).toBe(201);
    expect(res.body.project.name).toBe('Projeto Teste');
  });

  it('rejeita projeto com nome curto (422)', async () => {
    const token = await login('admin@admin.com');
    const res = await request(app)
      .post('/api/projects')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'ab' });
    expect(res.status).toBe(422);
  });
});

describe('Catalogo (API)', () => {
  it('lista itens e filtra por categoria', async () => {
    const token = await login('admin@admin.com');
    await carregarDemo({ force: true, usuarios: 2, projetos: 0, itens: 30 });
    const res = await request(app).get('/api/catalog?category=TI&limit=5').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.items.length).toBeGreaterThan(0);
    res.body.items.forEach((i) => expect(i.category).toBe('TI'));
  });
});

describe('Bloqueio em producao', () => {
  it('POST /api/demo/load retorna 403 em app com env=production', async () => {
    const { createApp } = require('../src/app');
    const appProd = createApp();
    appProd.set('env', 'production');
    const token = await login('admin@admin.com');
    const res = await request(appProd).post('/api/demo/load').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(403);
  });
});
