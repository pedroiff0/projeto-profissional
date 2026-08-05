const express = require('express');
const { optionalPageAuth } = require('../middleware/pageAuth');

const router = express.Router();

// Landing pública (raiz). Três entradas para os três bancos:
//   Produção (só o dono), Teste (você e o assistente), Demo (já logado).
router.get('/', optionalPageAuth, (req, res) => {
  if (req.user) return res.redirect('/app');
  res.render('landing', {
    bancos: [
      { id: 'production', titulo: 'Produção', badge: 'app_db', desc: 'Ambiente real. Só você insere dados. Banco persistente.', href: '/app/login', cta: 'Entrar na Produção', classe: 'env-prod' },
      { id: 'test', titulo: 'Teste', badge: 'app_test_db', desc: 'Banco de testes. Você e o assistente brincam à vontade (dados descartáveis).', href: '/test/login', cta: 'Entrar no Teste', classe: 'env-test' },
      { id: 'demo', titulo: 'Demo', badge: 'app_demo_db', desc: 'Banco populado e já logado. Explore tudo sem cadastrar nada.', href: '/demo/start', cta: 'Explorar Demo', classe: 'env-demo' },
    ],
  });
});

module.exports = router;
