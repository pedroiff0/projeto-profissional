process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-com-mais-de-32-caracteres-ok!!';

const fs = require('fs');
const os = require('os');
const path = require('path');

// Fixture de senha compartilhada FORA do repo (igual ao ~/Documentos/comum/...),
// mas criado por este teste para nao depender do HD do dono no CI.
const ARQ_SENHA = path.join(os.tmpdir(), `seed-senha-${process.pid}.md`);
fs.writeFileSync(ARQ_SENHA, '# Teste\nSenha:   `AdminComum123!!`\n');
process.env.SEED_PASSWORD_FILE = ARQ_SENHA;

const request = require('supertest');
const { createApp } = require('../src/app');
const { setupDb, teardownDb, clearDb } = require('./helpers/db');
const User = require('../src/models/user.model');
const { seedAdminIfEmpty, resolverSenhaAdmin } = require('../src/seeds/admin.seed');

const app = createApp();

afterAll(() => { try { fs.unlinkSync(ARQ_SENHA); } catch {} });
beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearDb);

describe('seed de admin — admin@admin.com + demo', () => {
  it('cria admin@admin.com a partir do SEED_PASSWORD_FILE', async () => {
    const seed = await seedAdminIfEmpty({ populaDemo: true });
    expect(seed.created).toBe(true);
    expect(seed.email).toBe('admin@admin.com');
    expect(seed.doArquivo).toBe(true);

    const admin = await User.findOne({ email: 'admin@admin.com' });
    expect(admin).toBeTruthy();
    expect(admin.role).toBe('admin');
    // passwordHash e select:false: confirmamos a senha via login.
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@admin.com', password: 'AdminComum123!!' });
    expect(login.status).toBe(200);
  });

  it('popula usuarios demo no banco de teste', async () => {
    await seedAdminIfEmpty({ populaDemo: true });
    const users = await User.find({});
    expect(users.length).toBe(5); // 1 admin + 4 demo
    const emails = users.map((u) => u.email).sort();
    expect(emails).toContain('ana@example.com');
    expect(emails).toContain('carla@example.com');
  });

  it('nao duplica o admin se ja existir', async () => {
    await seedAdminIfEmpty({ populaDemo: true });
    const segunda = await seedAdminIfEmpty({ populaDemo: true });
    expect(segunda.created).toBe(false);
    const admins = await User.find({ role: 'admin' });
    expect(admins.length).toBe(2); // admin@admin.com + carla@example.com (demo admin)
  });

  it('producao (sem POPULA_DEMO) cria so o admin, sem demo', async () => {
    const seed = await seedAdminIfEmpty({ populaDemo: false });
    expect(seed.created).toBe(true);
    const users = await User.find({});
    expect(users.length).toBe(1);
    expect(users[0].email).toBe('admin@admin.com');
  });

  it('login com admin@admin.com e senha do arquivo compartilhado funciona', async () => {
    await seedAdminIfEmpty({ populaDemo: true });
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@admin.com', password: 'AdminComum123!!' });
    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe('admin@admin.com');
    expect(res.body.user.passwordHash).toBeUndefined();
  });

  it('SEED_PASSWORD_FILE ausente gera senha aleatoria (sem quebrar)', async () => {
    const prev = process.env.SEED_PASSWORD_FILE;
    delete process.env.SEED_PASSWORD_FILE;
    const r = resolverSenhaAdmin();
    expect(r.senha.length).toBeGreaterThan(8);
    expect(r.doArquivo).toBe(false);
    process.env.SEED_PASSWORD_FILE = prev;
  });
});
