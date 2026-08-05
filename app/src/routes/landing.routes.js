const express = require('express');
const { optionalPageAuth } = require('../middleware/pageAuth');

const router = express.Router();

// Landing pública (raiz). Três entradas para os três bancos:
//   Produção (só o dono), Teste (você e o assistente), Demo (já logado).
router.get('/', optionalPageAuth, (req, res) => {
  if (req.user) return res.redirect(req.user.role === 'admin' ? '/admin' : '/');
  res.render('landing', {
    bancos: [
      { id: 'production', titulo: 'Produção', desc: 'Ambiente real. Só você insere dados.', href: '/app/login', classe: 'btn-primary' },
      { id: 'test', titulo: 'Teste', desc: 'Banco de testes. Você e o assistente brincam à vontade.', href: '/test/login', classe: 'btn-outline' },
      { id: 'demo', titulo: 'Demo', desc: 'Banco populado e já logado. Explore tudo.', href: '/demo/start', classe: 'btn-primary' },
    ],
  });
});

module.exports = router;
