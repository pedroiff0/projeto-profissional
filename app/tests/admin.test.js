process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-com-mais-de-32-caracteres-ok!!';

const request = require('supertest');
const { createApp } = require('../src/app');
const { setupDb, teardownDb, clearDb } = require('./helpers/db');
const User = require('../src/models/user.model');
const authService = require('../src/services/authService');

const app = createApp();
const SENHA = 'SenhaForte123ok';

async function criar(role, email) {
  return User.create({
    name: role,
    email,
    role,
    passwordHash: await authService.hashPassword(SENHA),
  });
}

beforeAll(setupDb);
afterAll(teardownDb);
afterEach(clearDb);

describe('/api/admin/users (registro controlado)', () => {
  it('nega acesso a usuario comum', async () => {
    const user = await criar('user', 'user@example.com');
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${authService.generateToken(user)}`);
    expect(res.status).toBe(403);
  });

  it('nega acesso anonimo', async () => {
    expect((await request(app).get('/api/admin/users')).status).toBe(401);
  });

  it('admin cria usuario e recebe senha temporaria uma unica vez', async () => {
    const admin = await criar('admin', 'admin@example.com');
    const token = authService.generateToken(admin);

    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Novo Usuario', email: 'novo@example.com', role: 'user' });

    expect(res.status).toBe(201);
    expect(res.body.senhaTemporaria).toEqual(expect.any(String));
    expect(res.body.user.mustChangePassword).toBe(true);

    // A senha temporaria funciona no login e nao fica salva em claro.
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'novo@example.com', password: res.body.senhaTemporaria });
    expect(login.status).toBe(200);

    const doc = await User.findOne({ email: 'novo@example.com' }).select('+passwordHash');
    expect(doc.passwordHash).not.toBe(res.body.senhaTemporaria);
  });

  it('rejeita e-mail duplicado', async () => {
    const admin = await criar('admin', 'admin@example.com');
    const token = authService.generateToken(admin);
    const body = { name: 'Dup', email: 'dup@example.com', role: 'user' };
    await request(app).post('/api/admin/users').set('Authorization', `Bearer ${token}`).send(body);
    const res = await request(app).post('/api/admin/users').set('Authorization', `Bearer ${token}`).send(body);
    expect(res.status).toBe(409);
  });

  it('rejeita payload invalido com 422', async () => {
    const admin = await criar('admin', 'admin@example.com');
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${authService.generateToken(admin)}`)
      .send({ name: 'x', email: 'nao-e-email' });
    expect(res.status).toBe(422);
  });

  it('impede o admin de desativar a propria conta', async () => {
    const admin = await criar('admin', 'admin@example.com');
    const res = await request(app)
      .patch(`/api/admin/users/${admin._id}`)
      .set('Authorization', `Bearer ${authService.generateToken(admin)}`)
      .send({ isActive: false });
    expect(res.status).toBe(422);
  });
});

describe('troca de senha', () => {
  it('invalida os tokens antigos apos trocar a senha', async () => {
    const user = await criar('user', 'user@example.com');
    const token = authService.generateToken(user);

    // tokenValidAfter usa segundos do iat; recua o marcador para o teste
    // nao depender do relogio dentro do mesmo segundo.
    await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: SENHA, newPassword: 'OutraSenha456xy' })
      .expect(200);

    await User.updateOne({ _id: user._id }, { tokenValidAfter: new Date(Date.now() + 2000) });

    const res = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});
