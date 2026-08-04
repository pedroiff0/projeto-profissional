const { z } = require('zod');

// Politica de senha: minimo 12, com minuscula, maiuscula e digito.
const senhaForte = z
  .string()
  .min(12, 'A senha deve ter no minimo 12 caracteres')
  .max(128, 'A senha deve ter no maximo 128 caracteres')
  .regex(/[a-z]/, 'A senha deve conter letra minuscula')
  .regex(/[A-Z]/, 'A senha deve conter letra maiuscula')
  .regex(/\d/, 'A senha deve conter numero');

const email = z.string().trim().toLowerCase().email('E-mail invalido').max(254);

const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Senha e obrigatoria').max(128),
});

const forgotPasswordSchema = z.object({ email });

const resetPasswordSchema = z.object({
  token: z.string().trim().min(32, 'Token invalido').max(128),
  newPassword: senhaForte,
});

const changePasswordSchema = z.object({
  currentPassword: z.string().max(128).optional().default(''),
  newPassword: senhaForte,
});

const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Nome muito curto').max(120).optional(),
});

module.exports = {
  senhaForte,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
  updateProfileSchema,
};
