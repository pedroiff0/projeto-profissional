const authService = require('./authService');
const { resolverSenhaAdmin } = require('../seeds/admin.seed');

// Popula o banco de DEMO (ou teste) com um conjunto completo para exploracao.
// Recebe `models` da connection do modo. `force` apaga e repopula.
async function carregarDemo({ usuarios = 200, projetos = 400, itens = 300, tarefas = 3000, profissionais = 120, force = false, skipAutoUser = false } = {}, models) {
  const { User, Project, CatalogItem, Professional, Task } = models;
  const { senha, doArquivo } = resolverSenhaAdmin();
  const passwordHash = await authService.hashPassword(senha);

  const precisaProjetos = (await Project.countDocuments({})) === 0;
  const precisaTarefas = (await Task.countDocuments({})) === 0;
  const precisaProf = (await Professional.countDocuments({})) === 0;
  const precisaItens = (await CatalogItem.countDocuments({})) === 0;

  if (!force && !precisaProjetos && !precisaTarefas && !precisaProf && !precisaItens) {
    return { carregado: false, motivo: 'ja_existe' };
  }
  if (force) {
    await Project.deleteMany({});
    await CatalogItem.deleteMany({});
    await Task.deleteMany({});
    await Professional.deleteMany({});
    await User.deleteMany({ email: /@example\.com$/ });
  }

  // Usuarios demo compartilham a senha do admin (facilita login manual).
  const inicio = skipAutoUser ? 2 : 1;
  const perfis = [];
  for (let i = inicio; i <= usuarios; i += 1) {
    perfis.push({
      name: `Demo ${i}`,
      email: `demo${i}@example.com`,
      role: i % 7 === 0 ? 'admin' : 'user',
      passwordHash,
      isActive: true,
      mustChangePassword: false,
      tokenValidAfter: new Date(Date.now() - 60_000),
    });
  }
  await User.insertMany(perfis);

  const status = ['planejado', 'em_andamento', 'pausado', 'concluido'];
  const tags = ['urgente', 'cliente', 'interno', 'beta', 'pilotis', 'design', 'backend', 'reuniao', 'docs'];
  const owners = await User.find({}).lean();

  if (precisaProjetos || force) {
    const nomesProjetos = [
      'Redesign do portal', 'API de pagamentos', 'App mobile v2', 'Migração para nuvem',
      'Onboarding de clientes', 'Painel de métricas', 'Integração CRM', 'Blog corporativo',
      'Chat interno', 'Backup automático', 'Relatórios financeiros', 'Treinamento da equipe',
      'Campanha de lançamento', 'Acessibilidade WCAG', 'Testes E2E', 'Refatoração do core',
      'Suporte multicanal', 'Marketplace B2B', 'Dashboard de vendas', 'Automação de e-mails',
      'Pesquisa de usuário', 'Design system', 'Pipeline de dados', 'Portal do parceiro',
      'App de campo', 'Gateway de notificações', 'Central de ajuda', 'Módulo de estoque',
      'Plataforma de cursos', 'App de agendamento', 'Hub de integrações', 'Sistema de BI',
    ];
    const clientes = ['Banco Aurora', 'Varejo Mix', 'Indústrias Tetra', 'Saúde Plena', 'Educa Mais', 'LogisTech', 'Agro Nova', 'Energia Viva'];
    const descricoes = [
      'Iniciativa estratégica com foco em **experiência do usuário** e performance.',
      'Entrega incremental: $v_1$ em produção, $v_2$ em revisão.',
      'Cliente externo — prazo contratual. Acompanhar riscos no *daily*.',
      'Modernização de legado; reduzir débito técnico acumulado.',
      'Expansão de produto: nova vertical de negócio.',
      'Melhoria contínua de conversão e retenção.',
    ];
    const projDocs = [];
    for (let i = 1; i <= projetos; i += 1) {
      const dono = owners[i % owners.length];
      const base = nomesProjetos[(i - 1) % nomesProjetos.length];
      const cliente = clientes[i % clientes.length];
      const nome = base + (i > nomesProjetos.length ? ` ${Math.ceil(i / nomesProjetos.length)}` : '') + ` (${cliente})`;
      projDocs.push({
        name: `Projeto: ${nome}`,
        description: `${descricoes[i % descricoes.length]}\n\nCliente: **${cliente}** · Iniciativa de demonstração #${i}.`,
        status: status[i % status.length],
        tags: [tags[i % tags.length], tags[(i + 3) % tags.length]],
        responsavelId: dono._id,
        ownerId: dono._id,
        ownerName: dono.name,
      });
    }
    await Project.insertMany(projDocs);
  }

  if (precisaProf || force) {
    const nomes = ['Ana Souza', 'Bruno Lima', 'Carla Dias', 'Diego Rocha', 'Elisa Tavares',
      'Felipe Nunes', 'Gabi Melo', 'Hugo Pires', 'Iris Cardoso', 'João Vitor',
      'Karen Alves', 'Lucas Reis', 'Marina Couto', 'Nina Bastos', 'Otávio Lemos',
      'Paula Ramos', 'Quésia Lopes', 'Rafael Antunes', 'Sofia Barros', 'Théo Martins',
      'Úrsula Pinto', 'Vitor Hugo', 'Wesley Cruz', 'Yara Nogueira', 'Caio Mendes',
      'Beatriz Costa', 'Daniel Faria', 'Helena Rios', 'Igor Teixeira', 'Juliana Castro',
      'Leo Barbosa', 'Mariana Pinto', 'Nicolas Alves', 'Olívia Moraes', 'Pedro Henrique',
      'Renata Lima', 'Samuel Afonso', 'Tatiana Dias', 'Vinícius Rocha', 'Aline Sousa',
      'Breno Carvalho', 'Clara Nunes', 'Douglas Vieira', 'Eduarda Ramos', 'Fernando Lopes',
      'Giovana Martins', 'Henrique Souza', 'Isabela Freitas', 'José Xavier', 'Larissa Duarte',
      'Murilo Aragão', 'Natália Cunha', 'Orlando Reis', 'Patrícia Gomes', 'Rodrigo Tavares',
      'Sabrina Lemos', 'Tiago Barros', 'Vanessa Antunes', 'William Couto', 'André Sá'];
    const funcoes = ['Design', 'Dev Front', 'Dev Back', 'QA', 'Conteúdo', 'Suporte', 'Gestão', 'DevOps', 'Data', 'UX', 'Arquitetura', 'Product'];
    const profDocs = nomes.slice(0, profissionais).map((nome, i) => ({
      nome,
      email: `pro${i + 1}@exemplo.com`,
      funcao: funcoes[i % funcoes.length],
      contato: `pro${i + 1}@exemplo.com`,
      ownerId: owners[0]._id,
      ownerName: owners[0].name,
    }));
    await Professional.insertMany(profDocs);
  }

  const projetosTodos = await Project.find({}).lean();
  const profTodos = await Professional.find({}).lean();

  if (precisaTarefas || force) {
    const nomesTarefas = [
      'Levantar requisitos', 'Desenhar protótipo', 'Implementar endpoint', 'Escrever testes',
      'Revisar PR', 'Configurar CI', 'Mapear dados', 'Criar componente', 'Validar acessibilidade',
      'Documentar API', 'Fazer deploy', 'Analisar métricas', 'Organizar daily', 'Levantar bug',
      'Otimizar query', 'Ajustar layout', 'Integrar gateway', 'Planejar sprint', 'Gravar demo',
      'Atualizar changelog', 'Refinar backlog', 'Fazer code review', 'Configurar ambiente',
      'Entrevistar usuário', 'Publicar release', 'Especificar contrato', 'Treinar time',
      'Auditar segurança', 'Migrar base legada', 'Modelar domínio', 'Instrumentar tracing',
    ];
    const detalhes = [
      'Critérios de aceite definidos com o PO. Validar em `staging` antes de subir.',
      'Usar componentes do **design system**; respeitar tokens de cor e espaçamento.',
      'Cobertura mínima de 80%. Incluir caso de borda de $n \\to 0$.',
      'Atenção à performance: índice em `createdAt` e paginação.',
      'Segue o padrão de error handling centralizado (`AppError`).',
      'Documentar no README e no Confluence; exportar OpenAPI.',
    ];
    const comentariosAmostra = [
      'Já deixei o branch criado, podem revisar quando quiserem.',
      'Cliente pediu para priorizar este item esta semana.',
      'Tivemos um blocker no ambiente, resolvido à tarde.',
      'Fiz pair programming com a Ana, ficou bem mais limpo.',
      'Confirmado com o time: entrega na próxima demo.',
    ];
    const nomesComentaristas = ['Ana Souza', 'Bruno Lima', 'Carla Dias', 'Diego Rocha', 'Elisa Tavares'];
    const taskDocs = [];
    // Distribui os status de forma equilibrada (nao so pela posicao do indice).
    for (let i = 1; i <= tarefas; i += 1) {
      const dono = owners[i % owners.length];
      const proj = projetosTodos[i % projetosTodos.length];
      const prof = profTodos[i % profTodos.length];
      const nomeTarefa = nomesTarefas[(i - 1) % nomesTarefas.length];
      const st = status[(i + Math.floor(i / nomesTarefas.length)) % status.length];
      const diasAtras = (i * 3) % 60;
      const inicio = new Date(Date.now() - diasAtras * 86400000);
      const prazo = new Date(inicio.getTime() + ((i % 14) + 3) * 86400000);
      const horario = `${(8 + (i % 10)).toString().padStart(2, '0')}:${(i % 2 ? '30' : '00')}`;
      const nComent = i % 3 === 0 ? (i % 5) + 1 : (i % 2);
      const comentarios = [];
      for (let c = 0; c < nComent; c += 1) {
        const autor = nomesComentaristas[(i + c) % nomesComentaristas.length];
        comentarios.push({
          autor,
          texto: comentariosAmostra[(i + c) % comentariosAmostra.length],
          criadoEm: new Date(inicio.getTime() + (c + 1) * 3600000),
        });
      }
      const arquivos = i % 4 === 0 ? [{ nome: `spec-${i}.pdf`, url: 'https://exemplo.com/spec-' + i + '.pdf', tipo: 'pdf' }] : [];
      const links = i % 3 === 0 ? [{ titulo: 'Documentação', url: 'https://exemplo.com/docs/' + i }] : [];
      // Dificuldade em Fibonacci; tarefas concluidas acumulam mais foco (horas liquidas).
      const fib = [1, 2, 3, 5, 8, 13, 21];
      const dificuldade = fib[(i + (i % fib.length)) % fib.length];
      const minutosFoco = st === 'concluido' ? dificuldade * 25 + (i % 5) * 10 : (i % 4 === 0 ? dificuldade * 10 : 0);
      taskDocs.push({
        titulo: `${nomeTarefa} — ${proj.name.replace('Projeto: ', '')}`,
        descricao: `Passo ${i} de demonstração: ${nomeTarefa}.\n\n${detalhes[i % detalhes.length]}`,
        status: st,
        projetoId: proj._id,
        profissionalId: prof._id,
        tags: [tags[i % tags.length], tags[(i + 4) % tags.length]].filter((v, idx, a) => a.indexOf(v) === idx),
        dataInicio: inicio,
        horario,
        prazo,
        dificuldade,
        minutosFoco,
        comentarios,
        arquivos,
        links,
        ownerId: dono._id,
        ownerName: dono.name,
      });
    }
    await Task.insertMany(taskDocs);
  }

  if (precisaItens || force) {
    const categorias = ['Escritório', 'TI', 'Limpeza', 'Mobiliário', 'Papelaria', 'Industrial'];
    const itensDocs = [];
    for (let i = 1; i <= itens; i += 1) {
      itensDocs.push({
        sku: `SKU-${String(i).padStart(4, '0')}`,
        name: `Item de Catálogo ${i}`,
        category: categorias[i % categorias.length],
        price: Number((10 + (i % 90) + Math.random()).toFixed(2)),
        stock: (i * 3) % 200,
        active: i % 5 !== 0,
      });
    }
    await CatalogItem.insertMany(itensDocs);
  }

  // Metas de foco semanal por dono (dados de demonstracao para os graficos do painel).
  if (owners.length) {
    const Meta = models.Meta || require('mongoose').model('Meta');
    const metas = owners.map((o, k) => {
      const base = 2 + ((k * 3) % 5);
      const focoPorDia = [0, 1, 2, 3, 4, 5, 6].map((d) => Math.max(0, Math.round(base * 25 + ((k + d) % 4) * 15)));
      const pomodorosPorDia = focoPorDia.map((m) => Math.round(m / 25));
      const focoMinutos = focoPorDia.reduce((a, b) => a + b, 0);
      return { ownerId: o._id, metaSemana: 250 + (k % 5) * 50, focoMinutos, pomodoros: pomodorosPorDia.reduce((a, b) => a + b, 0), focoPorDia, pomodorosPorDia };
    }).map((m) => m);
    await Meta.insertMany(metas);
  }

  return { carregado: true, usuarios, projetos, itens, tarefas, profissionais, senha, doArquivo };
}

module.exports = { carregarDemo };
