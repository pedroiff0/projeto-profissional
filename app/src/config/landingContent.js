// Conteudo da landing por INSTANCIA (derivado de NODE_ENV) e por IDIOMA.
// Cada ambiente e uma instalacao separada (porta/database proprios) e recebe
// sua propria narrativa. O storytelling da demo e o foco; producao foca no dono;
// teste deixa claro que e um sandbox.
//
// Estrutura: CONTENT[modo][lang] = { eyebrow, title, lede, cta, points[], demoNote }
// Fallback para 'pt' quando o idioma nao tem aquele modo traduzido.

const CONTENT = { producao: {}, teste: {}, demo: {} };

CONTENT.producao.pt = {
  eyebrow: 'Ambiente de producao',
  title: 'Seu sistema, em ambiente real.',
  lede: 'Este e o ambiente definitivo. Aqui voce cadastra usuarios, gerencia projetos e mantem o catalogo com dados reais. Nada de demonstracao: tudo que entrar aqui e dado de verdade.',
  cta: 'Entrar',
  badge: 'app_db',
  points: [
    'Apenas voce insere dados — banco persistente e isolado.',
    'Registro de usuarios controlado pelo administrador.',
    'Auditoria de eventos sensiveis por 180 dias.',
  ],
  demoNote: '',
};
CONTENT.teste.pt = {
  eyebrow: 'Ambiente de teste',
  title: 'Um sandbox para brincar.',
  lede: 'Banco de testes, descartavel. Voce e o assistente podem popular, alterar e resetar a vontade — nenhum dado aqui afeta a producao. Use para validar fluxos antes de levar para o ambiente real.',
  cta: 'Entrar no teste',
  badge: 'app_test_db',
  points: [
    'Banco separado da producao (tmpfs, pode ser resetado).',
    'Populado com usuarios de exemplo para exploracao.',
    'Limites de taxa desligados para medir o app de verdade.',
  ],
  demoNote: '',
};
CONTENT.producao.en = {
  eyebrow: 'Production environment',
  title: 'Your system, in the real environment.',
  lede: 'This is the definitive environment. Here you register users, manage projects and keep the catalog with real data. No demos: everything that goes in here is real data.',
  cta: 'Sign in',
  badge: 'app_db',
  points: [
    'Only you enter data — persistent and isolated database.',
    'User registration controlled by the administrator.',
    'Sensitive event auditing for 180 days.',
  ],
  demoNote: '',
};
CONTENT.teste.en = {
  eyebrow: 'Test environment',
  title: 'A sandbox to play in.',
  lede: 'Disposable test database. You and the assistant can populate, change and reset freely — nothing here affects production. Use it to validate flows before going to the real environment.',
  cta: 'Sign in to test',
  badge: 'app_test_db',
  points: [
    'Database separated from production (tmpfs, can be reset).',
    'Populated with sample users for exploration.',
    'Rate limits off so you measure the real app.',
  ],
  demoNote: '',
};
CONTENT.producao.es = {
  eyebrow: 'Ambiente de produccion',
  title: 'Tu sistema, en ambiente real.',
  lede: 'Este es el ambiente definitivo. Aqui registras usuarios, gestionas proyectos y mantienes el catalogo con datos reales. Nada de demostracion: todo lo que entra aqui es dato de verdad.',
  cta: 'Iniciar sesion',
  badge: 'app_db',
  points: [
    'Solo tu ingresas datos — base aislada y persistente.',
    'Registro de usuarios controlado por el administrador.',
    'Auditoria de eventos sensibles por 180 dias.',
  ],
  demoNote: '',
};
CONTENT.teste.es = {
  eyebrow: 'Ambiente de prueba',
  title: 'Un sandbox para jugar.',
  lede: 'Base de prueba, descartable. Tu y el asistente pueden poblar, cambiar y resetear a voluntad — nada aqui afecta la produccion. Usala para validar flujos antes de ir al ambiente real.',
  cta: 'Entrar en prueba',
  badge: 'app_test_db',
  points: [
    'Base separada de produccion (tmpfs, reiniciable).',
    'Poblada con usuarios de ejemplo para explorar.',
    'Limites de tasa desactivados para medir la app de verdad.',
  ],
  demoNote: '',
};
CONTENT.producao.fr = {
  eyebrow: 'Environnement de production',
  title: 'Votre systeme, en environnement reel.',
  lede: 'Ceci est l’environnement definitif. Ici vous enregistrez des utilisateurs, gerez des projets et tenez le catalogue avec de vraies donnees. Pas de demo : tout ce qui entre ici est une vraie donnee.',
  cta: 'Se connecter',
  badge: 'app_db',
  points: [
    'Seul vous saisissez des donnees — base persistante et isolee.',
    'Inscription des utilisateurs controlee par l’administrateur.',
    'Audit des evenements sensibles pendant 180 jours.',
  ],
  demoNote: '',
};
CONTENT.teste.fr = {
  eyebrow: 'Environnement de test',
  title: 'Un bac a sable pour jouer.',
  lede: 'Base de test, jetable. Vous et l’assistant pouvez peupler, modifier et reinitialiser a volonte — rien ici n’affecte la production. Servez-vous-en pour valider des flux avant d’aller en environnement reel.',
  cta: 'Entrer en test',
  badge: 'app_test_db',
  points: [
    'Base separee de la production (tmpfs, reinitialisable).',
    'Peuplee avec des utilisateurs d’exemple pour explorer.',
    'Limites de debit desactivees pour mesurer l’app reelle.',
  ],
  demoNote: '',
};
CONTENT.demo.fr = {
  eyebrow: 'Environnement de demonstration',
  title: 'Decouvrez le systeme sans inscription.',
  lede: 'Ceci est une demo vivante du systeme. Tout est deja peuple — des dizaines d’utilisateurs, de projets et d’articles du catalogue. Entrez en un clic et explorez chaque ecran comme si vous etiez le proprietaire, sans creer de compte ni saisir de mot de passe.',
  cta: 'Entrer dans la demo',
  badge: 'app_demo_db',
  points: [
    'Entree automatique : vous etes connecte en tant qu’utilisateur demo.',
    'Base peuplee et jetable — rechargee a chaque demarrage.',
    'L’utilisateur demo n’existe que ici ; aucun croisement avec prod ou test.',
  ],
  demoNote: 'A l’entree, vous etes authentifie comme utilisateur demo — cree automatiquement dans cette base et qui n’existe pas en production ni en test. C’est un terrain sur : les donnees sont rechargees a neuf a chaque demarrage de l’instance.',
};

function landingFor(mode, lang) {
  const byMode = CONTENT[mode] || CONTENT.producao;
  return byMode[lang] || byMode.pt || CONTENT.producao.pt;
}

module.exports = { landingFor, CONTENT };
