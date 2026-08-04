/* eslint-disable */
// Cenario de carga da plataforma — k6.
//
// Mede o caminho real de uso: login (bcrypt custo 12, deliberadamente caro)
// + navegacao autenticada + paginas SSR. NAO usa endpoint sintetico: o que
// esta sendo medido e o mesmo codigo que roda em producao.
//
// Perfis (variavel PERFIL):
//   smoke   - 1 VU, validacao de fumaca
//   carga   - rampa ate CARGA_VUS, estado estavel
//   estresse- rampa continua ate achar o ponto de saturacao
//   pico    - salto abrupto (teste de elasticidade)
//
// Uso:
//   k6 run -e BASE_URL=http://app:5000 -e PERFIL=carga -e CARGA_VUS=200 carga.js

import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Trend, Rate, Counter } from 'k6/metrics';

const BASE = __ENV.BASE_URL || 'http://localhost:4446';
const PERFIL = __ENV.PERFIL || 'carga';
const CARGA_VUS = Number(__ENV.CARGA_VUS || 200);
const DURACAO = __ENV.DURACAO || '1m';

// Usuarios pre-semeados por scripts/seed-carga.js
const TOTAL_USUARIOS = Number(__ENV.TOTAL_USUARIOS || 50);
const SENHA = __ENV.SENHA_CARGA || 'CargaTeste123ok';

const loginDur = new Trend('login_duracao', true);
const leituraDur = new Trend('leitura_duracao', true);
const paginaDur = new Trend('pagina_duracao', true);
const loginOk = new Rate('login_sucesso');
const erros429 = new Counter('respostas_429');

const perfis = {
  smoke: { executor: 'constant-vus', vus: 1, duration: '20s' },
  carga: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: CARGA_VUS },
      { duration: DURACAO, target: CARGA_VUS },
      { duration: '15s', target: 0 },
    ],
  },
  estresse: {
    executor: 'ramping-vus',
    startVUs: 0,
    stages: [
      { duration: '30s', target: 100 },
      { duration: '30s', target: 300 },
      { duration: '30s', target: 600 },
      { duration: '30s', target: 1000 },
      { duration: '20s', target: 0 },
    ],
  },
  pico: {
    executor: 'ramping-vus',
    startVUs: 10,
    stages: [
      { duration: '10s', target: 10 },
      { duration: '5s', target: CARGA_VUS },
      { duration: '40s', target: CARGA_VUS },
      { duration: '10s', target: 10 },
    ],
  },
  // Pior caso: login em toda iteracao (bcrypt custo 12, limitado por CPU).
  auth: {
    executor: 'ramping-vus',
    startVUs: 0,
    exec: 'autenticacao',
    stages: [
      { duration: '20s', target: CARGA_VUS },
      { duration: DURACAO, target: CARGA_VUS },
      { duration: '10s', target: 0 },
    ],
  },
};

// Estado por VU: cada usuario virtual mantem a propria sessao entre iteracoes.
const sessao = { token: null };

export const options = {
  scenarios: { principal: perfis[PERFIL] },
  // Criterio de aprovacao. Se estourar, o k6 sai com codigo != 0 — o CI falha.
  thresholds: {
    http_req_failed: ['rate<0.01'],
    'http_req_duration{tipo:leitura}': ['p(95)<300'],
    'http_req_duration{tipo:pagina}': ['p(95)<500'],
    'http_req_duration{tipo:login}': ['p(95)<2000'],
    login_sucesso: ['rate>0.99'],
  },
  summaryTrendStats: ['avg', 'min', 'med', 'p(90)', 'p(95)', 'p(99)', 'max'],
};

function credenciais() {
  const n = (__VU % TOTAL_USUARIOS) + 1;
  return { email: `carga${n}@example.com`, password: SENHA };
}

export default function () {
  // Sessao realista: o usuario faz login UMA vez e reutiliza o token pelas
  // requisicoes seguintes. Fazer login a cada iteracao mediria um
  // "login-storm" (bcrypt custo 12 ~ 300ms de CPU cada), que e o cenario de
  // pior caso — esse e coberto pelo perfil `auth` abaixo, separadamente.
  if (!sessao.token) {
    const res = http.post(`${BASE}/api/auth/login`, JSON.stringify(credenciais()), {
      headers: { 'Content-Type': 'application/json' },
      tags: { tipo: 'login' },
    });
    loginDur.add(res.timings.duration);
    if (res.status === 429) erros429.add(1);
    const ok = check(res, {
      'login 200': (r) => r.status === 200,
      'login devolve token': (r) => Boolean(r.json('token')),
    });
    loginOk.add(ok);
    if (!ok) {
      sleep(1);
      return;
    }
    sessao.token = res.json('token');
  }

  const auth = { headers: { Authorization: `Bearer ${sessao.token}` } };

  group('leitura autenticada', () => {
    const res = http.get(`${BASE}/api/auth/me`, { ...auth, tags: { tipo: 'leitura' } });
    leituraDur.add(res.timings.duration);
    check(res, { 'me 200': (r) => r.status === 200 });
  });

  group('pagina SSR', () => {
    const res = http.get(`${BASE}/`, { tags: { tipo: 'pagina' } });
    paginaDur.add(res.timings.duration);
    check(res, { 'landing 200': (r) => r.status === 200 });
  });

  group('health', () => {
    const res = http.get(`${BASE}/api/health/ready`, { tags: { tipo: 'leitura' } });
    check(res, { 'ready 200': (r) => r.status === 200 });
  });

  sleep(1); // tempo de reflexao do usuario
}

// Cenario dedicado de autenticacao (perfil `auth`): TODA iteracao faz login.
// Mede a capacidade de bcrypt, que e limitada por CPU por construcao.
export function autenticacao() {
  const res = http.post(`${BASE}/api/auth/login`, JSON.stringify(credenciais()), {
    headers: { 'Content-Type': 'application/json' },
    tags: { tipo: 'login' },
  });
  loginDur.add(res.timings.duration);
  if (res.status === 429) erros429.add(1);
  loginOk.add(check(res, { 'login 200': (r) => r.status === 200 }));
  sleep(1);
}
