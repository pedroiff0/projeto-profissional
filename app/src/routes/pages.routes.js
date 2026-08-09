const express = require('express');
const {
  pageAuth,
  optionalPageAuth,
  requirePageRole,
  requirePasswordChanged,
} = require('../middleware/pageAuth');
const { HTTP_CATALOG } = require('../routes/status.routes');
const env = require('../config/env');

const router = express.Router();

router.get('/login', optionalPageAuth, (req, res) => {
  if (req.user) return res.redirect(req.user.role === 'admin' ? '/admin' : '/');
  const modo = (req.baseUrl || '').replace('/', '') || 'app';
  res.render('login', { action: `/api/${modo}/auth/login`, modo });
});

router.get('/forgot-password', (req, res) => res.render('forgot-password'));

router.get('/reset-password', (req, res) =>
  res.render('reset-password', { token: String(req.query.token || '') })
);

router.get('/primeiro-acesso', pageAuth, (req, res) =>
  res.render('primeiro-acesso', { user: req.user })
);

// Dashboard (montado sob /app, /test e /demo -> a rota interna e '/').
// Renderiza o quadro (kanban) de TAREFAS da aplicacao de exemplo — o que o
// usuario ve ao entrar, inclusive na demo, que cai direto aqui.
router.get('/', pageAuth, requirePasswordChanged, async (req, res, next) => {
  try {
    const modo = (req.baseUrl || '').replace('/', '') || 'app';
    const base = modo === 'app' ? '' : `/${modo}`;
    const apiBase = `/api/${modo}`;
    const taskService = require('../services/taskService');
    const { items: tarefas } = await taskService.listar(
      { userId: req.user.id, role: req.user.role, demoBypass: req.demoBypass, limit: 500 },
      req.models,
    );
    const [projetos, profissionais] = await Promise.all([
      require('../services/projectService').listar(
        { userId: req.user.id, role: req.user.role, demoBypass: req.demoBypass, limit: 500 }, req.models,
      ).then((r) => r.items),
      require('../services/professionalService').listar(
        { userId: req.user.id, role: req.user.role, demoBypass: req.demoBypass, limit: 500 }, req.models,
      ).then((r) => r.items),
    ]);
    const colunas = [
      { key: 'planejado', label: 'A fazer' },
      { key: 'em_andamento', label: 'Em andamento' },
      { key: 'pausado', label: 'Pausado' },
      { key: 'concluido', label: 'Concluído' },
    ];
    colunas.forEach((c) => { c.items = tarefas.filter((t) => t.status === c.key); });
    res.render('board', {
      user: req.user,
      pageScript: 'board',
      modo, base, apiBase,
      colunas, projetos, profissionais,
      isDemo: modo === 'demo',
      mostraDemo: modo !== 'production',
      demoApi: `/api/${modo}/demo/load`,
    });
  } catch (err) { next(err); }
});

router.get('/perfil', pageAuth, requirePasswordChanged, (req, res) =>
  res.render('perfil', { user: req.user })
);

router.get('/catalogo', pageAuth, requirePasswordChanged, (req, res) =>
  res.render('catalogo', { user: req.user, pageScript: 'catalogo' })
);

router.get('/painel', pageAuth, requirePasswordChanged, async (req, res, next) => {
  try {
    const modo = (req.baseUrl || '').replace('/', '') || 'app';
    const base = modo === 'app' ? '' : `/${modo}`;
    const taskService = require('../services/taskService');
    const projectService = require('../services/projectService');
    const metaService = require('../services/metaService');
    const { items: tarefas } = await taskService.listar(
      { userId: req.user.id, role: req.user.role, demoBypass: req.demoBypass, limit: 1000 }, req.models,
    );
    const { items: projetos } = await projectService.listar(
      { userId: req.user.id, role: req.user.role, demoBypass: req.demoBypass, limit: 500 }, req.models,
    );
    const { items: profissionais } = await require('../services/professionalService').listar(
      { userId: req.user.id, role: req.user.role, demoBypass: req.demoBypass, limit: 500 }, req.models,
    );
    const meta = await metaService.obter(req.user.id, req.models);
    const porStatus = {};
    ['planejado', 'em_andamento', 'pausado', 'concluido'].forEach((s) => { porStatus[s] = tarefas.filter((t) => t.status === s).length; });
    const porProjeto = projetos.map((p) => ({ nome: p.name, total: tarefas.filter((t) => String(t.projetoId) === String(p._id)).length }));
    const porProfissional = profissionais.map((p) => ({ id: String(p._id), nome: p.nome, total: tarefas.filter((t) => String(t.profissionalId) === String(p._id)).length }));
    res.render('painel', {
      user: req.user, pageScript: 'painel', modo, base, apiBase: `/api/${modo}`,
      stats: { total: tarefas.length, porStatus, porProjeto, porProfissional, concluidas: porStatus.concluido },
      profissionais: porProfissional,
      meta: { metaSemana: meta.metaSemana || 0, focoMinutos: meta.focoMinutos || 0, pomodoros: meta.pomodoros || 0 },
      isDemo: modo === 'demo',
    });
  } catch (err) { next(err); }
});

router.get('/projetos', pageAuth, requirePasswordChanged, async (req, res, next) => {
  try {
    const modo = (req.baseUrl || '').replace('/', '') || 'app';
    const base = modo === 'app' ? '' : `/${modo}`;
    const projectSvc = require('../services/projectService');
    const [proj, users] = await Promise.all([
      projectSvc.listar({ userId: req.user.id, role: req.user.role, demoBypass: req.demoBypass, limit: 500 }, req.models),
      req.models.User.find({ isActive: true }).select('_id name email').lean(),
    ]);
    res.render('projetos', { user: req.user, pageScript: 'projetos', modo, base, projetos: proj.items, usuarios: users, apiBase: `/api/${modo}` });
  } catch (err) { next(err); }
});

router.get('/profissionais', pageAuth, requirePasswordChanged, async (req, res, next) => {
  try {
    const modo = (req.baseUrl || '').replace('/', '') || 'app';
    const base = modo === 'app' ? '' : `/${modo}`;
    const { items } = await require('../services/professionalService').listar(
      { userId: req.user.id, role: req.user.role, demoBypass: req.demoBypass, limit: 500 }, req.models,
    );
    res.render('profissionais', { user: req.user, pageScript: 'profissionais', modo, base, profissionais: items, apiBase: `/api/${modo}` });
  } catch (err) { next(err); }
});

router.get('/admin', pageAuth, requirePasswordChanged, requirePageRole('admin'), (req, res) =>
  res.render('admin/usuarios', { user: req.user })
);

// Logout (POST do botao Sair). Limpa o cookie e volta para a landing.
router.post('/logout', (req, res) => {
  const secure = env.cookieSecure;
  res.clearCookie('token', { path: '/', secure, sameSite: 'lax' });
  res.redirect('/');
});

router.get('/status', (req, res) => {
  const query = String(req.query.q || '').trim();
  const rows = Object.entries(HTTP_CATALOG)
    .map(([code, meta]) => ({ code: Number(code), ...meta }))
    .filter((r) => {
      if (!query) return true;
      const hay = `${r.code} ${r.name} ${r.desc}`.toLowerCase();
      return hay.includes(query.toLowerCase());
    })
    .sort((a, b) => a.code - b.code);
  res.render('status', { rows, query });
});

module.exports = router;
