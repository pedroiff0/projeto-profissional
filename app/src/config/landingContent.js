// Conteudo da landing por INSTANCIA (derivado de NODE_ENV) e por IDIOMA.
// Cada ambiente e uma instalacao separada (porta/database proprios) e recebe
// sua propria narrativa. O storytelling da demo e o foco; producao foca no dono;
// teste deixa claro que e um sandbox.
//
// Estrutura: CONTENT[modo][lang] = { eyebrow, title, lede, cta, points[], demoNote }
// Fallback para 'pt' quando o idioma nao tem aquele modo traduzido.

const CONTENT = { production: {}, test: {}, demo: {} };

CONTENT.production.pt = {
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
CONTENT.test.pt = {
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
CONTENT.production.en = {
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
CONTENT.test.en = {
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
CONTENT.production.es = {
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
CONTENT.test.es = {
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
CONTENT.production.fr = {
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
CONTENT.test.fr = {
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
CONTENT.demo.pt = {
  eyebrow: 'Ambiente de demonstracao',
  title: 'Conheca o sistema sem cadastro.',
  lede: 'Esta e uma demonstracao viva do sistema. Tudo ja vem populado — dezenas de usuarios, projetos e itens de catalogo. Entre em um clique e explore cada tela como se fosse o dono, sem criar conta nem informar senha.',
  cta: 'Entrar na demo',
  badge: 'app_demo_db',
  points: [
    'Entrada automatica: voce e autenticado como usuario demo.',
    'Banco populado e descartavel — recarregado a cada inicializacao.',
    'O usuario demo existe so aqui; nada se cruza com producao ou teste.',
  ],
  demoNote: 'Ao entrar na demonstracao, voce e autenticado como um usuario de demonstracao — criado automaticamente neste banco e que nao existe na producao nem no teste. E um playground seguro: os dados sao recarregados do zero sempre que a instancia sobe.',
};
CONTENT.demo.en = {
  eyebrow: 'Demo environment',
  title: 'Explore the system without signing up.',
  lede: 'This is a live demo of the system. Everything comes pre-populated — dozens of users, projects and catalog items. Enter in one click and explore every screen as if you owned it, with no account or password.',
  cta: 'Enter the demo',
  badge: 'app_demo_db',
  points: [
    'Automatic entry: you are authenticated as a demo user.',
    'Populated, disposable database — reloaded at every startup.',
    'The demo user exists only here; nothing crosses into prod or test.',
  ],
  demoNote: 'On entering the demo, you are authenticated as a demo user — created automatically in this database and that does not exist in production or test. It is a safe playground: data is reloaded from scratch every time the instance starts.',
};
CONTENT.demo.es = {
  eyebrow: 'Ambiente de demostracion',
  title: 'Conoce el sistema sin registrarte.',
  lede: 'Esta es una demostracion viva del sistema. Todo ya viene poblado — decenas de usuarios, proyectos e items de catalogo. Entra con un clic y explora cada pantalla como si fueras el dueno, sin crear cuenta ni poner contrasena.',
  cta: 'Entrar en la demo',
  badge: 'app_demo_db',
  points: [
    'Entrada automatica: eres autenticado como usuario demo.',
    'Base poblada y descartable — recargada en cada inicio.',
    'El usuario demo existe solo aqui; nada se cruza con produccion o prueba.',
  ],
  demoNote: 'Al entrar en la demostracion, eres autenticado como usuario demo — creado automaticamente en esta base y que no existe en produccion ni prueba. Es un entorno seguro: los datos se recargan desde cero cada vez que la instancia arranca.',
};

function landingFor(mode, lang) {
  const byMode = CONTENT[mode] || CONTENT.production;
  return byMode[lang] || byMode.pt || CONTENT.production.pt;
}

module.exports = { landingFor, CONTENT };
