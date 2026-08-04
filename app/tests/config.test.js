// Guards de configuracao. Sao invariantes de SEGURANCA, nao conveniencia:
// desligar o limitador de forca bruta em producao, ou semear carga sintetica
// no banco de producao, nunca pode acontecer por acidente de ambiente.
const path = require('path');
const { execFileSync } = require('child_process');

const APP = path.join(__dirname, '..');
const SECRET = 'x'.repeat(48);

// Subprocesso porque config/env.js valida no `require` e o Jest cacheia modulo.
// cwd em /tmp: dotenv carregaria o .env do projeto e sobreporia o ambiente.
function carregarEnv(env) {
  execFileSync(process.execPath, ['-e', `require(${JSON.stringify(`${APP}/src/config/env`)})`], {
    cwd: '/tmp',
    env: { PATH: process.env.PATH, ...env },
    stdio: 'pipe',
  });
}

describe('config/env — guards de producao', () => {
  it('recusa o boot com RATE_LIMIT_DISABLED=true em producao', () => {
    expect(() => carregarEnv({
      NODE_ENV: 'production', JWT_SECRET: SECRET, RATE_LIMIT_DISABLED: 'true',
    })).toThrow(/nao e permitido com NODE_ENV=production/);
  });

  it('aceita o flag em staging (usado pelo teste de carga)', () => {
    expect(() => carregarEnv({
      NODE_ENV: 'staging', JWT_SECRET: SECRET, RATE_LIMIT_DISABLED: 'true',
    })).not.toThrow();
  });

  it('mantem o limitador ativo em producao quando o flag nao e passado', () => {
    expect(() => carregarEnv({ NODE_ENV: 'production', JWT_SECRET: SECRET })).not.toThrow();
  });

  it('recusa JWT_SECRET curto em producao', () => {
    expect(() => carregarEnv({ NODE_ENV: 'production', JWT_SECRET: 'curto' }))
      .toThrow(/JWT_SECRET deve ter no minimo 32 caracteres/);
  });
});

describe('seed de carga — guard de banco', () => {
  it('recusa rodar contra um banco que nao seja de teste', () => {
    expect(() => execFileSync(process.execPath, [`${APP}/scripts/seed-carga.js`, '1'], {
      cwd: '/tmp',
      env: { PATH: process.env.PATH, MONGO_URI: 'mongodb://localhost:27017/app_db' },
      stdio: 'pipe',
    })).toThrow(/RECUSADO/);
  });
});
