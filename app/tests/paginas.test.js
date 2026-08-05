process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-com-mais-de-32-caracteres-ok!!';

// Fixture de senha compartilhada (mesmo formato do ~/Documentos/comum/...),
// para o admin@admin.com poder logar nestes testes.
const fs = require('fs');
const os = require('os');
const path = require('path');
const ARQ_SENHA = path.join(os.tmpdir(), `paginas-senha-${process.pid}.md`);
fs.writeFileSync(ARQ_SENHA, 'Senha:   `AdminComum123!!`\n');
process.env.SEED_PASSWORD_FILE = ARQ_SENHA;

const express = require('express');
const request = require('supertest');
const { seedAdminIfEmpty } = require('../src/seeds/admin.seed');
const { carregarDemo } = require('../src/services/demoService');
const { createApp } = require('../src/app');
const { setupDb, teardownDb, clearDb } = require('./helpers/db');
const { HTTP_CATALOG } = require('../src/routes/status.routes');
const { catalogFor, ERROR_CATALOG } = require('../src/middleware/errorHandler');
const { notFoundHandler, errorHandler } = require('../src/middleware/errorHandler');
const AppError = require('../src/utils/AppError');

const app = createApp();

// Mini-app isolado para exercitar cada variante do errorHandler de forma
// determinística: a rota que FORÇA o erro é registrada ANTES dos handlers,
// senão o notFoundHandler (404) a interceptaria. Reusa a mesma view EJS.
const errApp = express();
errApp.set('view engine', 'ejs');
errApp.set('views', path.join(__dirname, '../views'));
errApp.get('/_forcar_erro_:code', (req, res, next) => {
  next(new AppError('Erro forçado para teste', Number(req.params.code)));
});
errApp.use(notFoundHandler);
errApp.use(errorHandler);

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearDb);

describe('Página /status (mapeamento HTTP)', () => {
  it('lista todos os códigos mapeados', async () => {
    const res = await request(app).get('/status');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/404/);
    expect(res.text).toMatch(/Not Found/);
    // Botões de voltar/início presentes (link âncora, sem onclick inline).
    expect(res.text).toMatch(/href="\/"|href="\//);
  });

  it('filtra por busca via query string', async () => {
    const res = await request(app).get('/status?q=timeout');
    expect(res.status).toBe(200);
    expect(res.text).toMatch(/Gateway Timeout/);
    expect(res.text).not.toMatch(/Not Found/);
  });

  it('expõe o catálogo por JSON', async () => {
    const res = await request(app).get('/api/status/404');
    expect(res.status).toBe(200);
    expect(res.body.name).toBe('Not Found');
    expect(res.body.retryable).toBe(true);
  });

  it('404 em código não mapeado', async () => {
    const res = await request(app).get('/api/status/799');
    expect(res.status).toBe(404);
  });

  it('não possui script inline (CSP)', async () => {
    const res = await request(app).get('/status');
    expect(res.text).not.toMatch(/<script(?![^>]*src=)[^>]*>[^<]/);
  });
});

describe('Páginas de erro por status', () => {
  const codigos = [400, 401, 403, 404, 422, 429, 500, 503];

  it.each(codigos)('renderiza %i com título, mensagem e botão Voltar', async (code) => {
    const res = await request(errApp).get(`/_forcar_erro_${code}`);
    expect(res.status).toBe(code);
    expect(res.text).toMatch(new RegExp(String(code)));
    expect(res.text).toMatch(/Voltar/);
    // Nunca vaza stack.
    expect(res.text).not.toMatch(/at .*\(.*:\d+:\d+\)/);
  });

  it.each(codigos)('catálogo de %i traz título e ação de recuperação', (code) => {
    const cat = catalogFor(code);
    expect(cat.title).toBeTruthy();
    if (code >= 400) expect(cat.action).toBeTruthy();
  });

  it('mensagens de erro não vazam stack no JSON', async () => {
    const res = await request(errApp)
      .get('/_forcar_erro_500')
      .set('Accept', 'application/json');
    expect(res.status).toBe(500);
    expect(res.body.error).toBeTruthy();
    expect(JSON.stringify(res.body)).not.toMatch(/node_modules|at \w+/);
  });
});

describe('Consistência do catálogo HTTP', () => {
  it('ERROR_CATALOG cobre todo 4xx/5xx de HTTP_CATALOG', () => {
    for (const code of Object.keys(HTTP_CATALOG)) {
      const n = Number(code);
      if (n >= 400) expect(ERROR_CATALOG[n]).toBeDefined();
    }
  });
});

describe('Páginas de domínio (autenticadas)', () => {
  const models = require('./helpers/models');
  let pm;
  beforeAll(async () => { pm = models.prod; });
  it('login via cookie e render de /projetos e /catalogo', async () => {
    await seedAdminIfEmpty({ populaDemo: false }, pm);
    // Tira o mustChangePassword para poder acessar areas logadas no teste.
    await pm.User.updateOne(
      { email: 'admin@admin.com' }, { $set: { mustChangePassword: false } }
    );
    await carregarDemo({ usuarios: 4, projetos: 10, itens: 20 }, pm);
    const login = await request(app).post('/api/auth/login')
      .send({ email: 'admin@admin.com', password: 'AdminComum123!!' });
    const cookie = login.headers['set-cookie'][0].split(';')[0]; // token=...

    const projetos = await request(app).get('/projetos').set('Cookie', cookie);
    expect(projetos.status).toBe(200);
    expect(projetos.text).toMatch(/proj-list/);

    const catalogo = await request(app).get('/catalogo').set('Cookie', cookie);
    expect(catalogo.status).toBe(200);
    expect(catalogo.text).toMatch(/cat-body/);

    const dash = await request(app).get('/app').set('Cookie', cookie);
    expect(dash.status).toBe(200);
    // Botão de demo só aparece fora de produção (NODE_ENV=test aqui).
    expect(dash.text).toMatch(/btn-demo/);
  });

  it('página autenticada redireciona para /login sem cookie', async () => {
    const res = await request(app).get('/projetos');
    expect(res.status).toBe(302);
    expect(res.headers.location).toBe('/login');
  });
});
