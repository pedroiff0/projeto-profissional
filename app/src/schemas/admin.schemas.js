const { z } = require('zod');

const OBJECT_ID = z.string().trim().regex(/^[0-9a-fA-F]{24}$/, 'ID invalido');

// Registro controlado pelo admin: sem senha no payload — o servidor gera uma
// senha temporaria e a devolve UMA unica vez na resposta.
const criarUsuarioSchema = z.object({
  name: z.string().trim().min(2, 'Nome muito curto').max(120),
  email: z.string().trim().toLowerCase().email('E-mail invalido').max(254),
  role: z.enum(['admin', 'user']).default('user'),
});

const atualizarUsuarioSchema = z
  .object({
    name: z.string().trim().min(2).max(120).optional(),
    role: z.enum(['admin', 'user']).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, { message: 'Nenhum campo para atualizar' });

const listarUsuariosSchema = z.object({
  q: z.string().trim().max(120).optional(),
  role: z.enum(['admin', 'user']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

const idParamSchema = z.object({ id: OBJECT_ID });

module.exports = {
  OBJECT_ID,
  criarUsuarioSchema,
  atualizarUsuarioSchema,
  listarUsuariosSchema,
  idParamSchema,
};
