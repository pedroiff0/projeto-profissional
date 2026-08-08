const { z } = require('zod');

const projectCreate = z.object({
  name: z.string().min(3, 'Nome muito curto').max(120),
  description: z.string().max(1000).optional().default(''),
  status: z.enum(['planejado', 'em_andamento', 'concluido', 'pausado']).optional(),
  responsavelId: z.string().regex(/^[a-f\d]{24}$/, 'ID de responsável inválido'),
  tags: z.array(z.string().max(30)).max(10).optional(),
});

const professionalCreate = z.object({
  nome: z.string().min(2, 'Nome muito curto').max(120),
  email: z.string().email('E-mail inválido').max(160),
  funcao: z.string().max(80).optional().default(''),
  contato: z.string().max(160).optional().default(''),
});

const arquivoSchema = z.object({
  nome: z.string().min(1).max(200),
  url: z.string().max(500),
  tipo: z.string().max(30).optional(),
});
const linkSchema = z.object({
  titulo: z.string().min(1).max(200),
  url: z.string().max(500),
});
const comentarioSchema = z.object({
  autor: z.string().max(120).optional(),
  autorId: z.string().regex(/^[a-f\d]{24}$/).optional(),
  texto: z.string().min(1).max(2000),
  criadoEm: z.string().datetime({ offset: true }).optional(),
});

const taskCreate = z.object({
  titulo: z.string().min(3, 'Título muito curto').max(160),
  descricao: z.string().max(2000).optional().default(''),
  status: z.enum(['planejado', 'em_andamento', 'pausado', 'concluido']).optional(),
  projetoId: z.string().regex(/^[a-f\d]{24}$/, 'ID de projeto inválido').optional().nullable(),
  profissionalId: z.string().regex(/^[a-f\d]{24}$/, 'ID de profissional inválido').optional().nullable(),
  tags: z.array(z.string().max(30)).max(12).optional(),
  dataInicio: z.string().datetime({ offset: true }).optional().nullable(),
  horario: z.string().max(32).optional().default(''),
  prazo: z.string().datetime({ offset: true }).optional().nullable(),
  dificuldade: z.number().int().refine((v) => [1, 2, 3, 5, 8, 13, 21].includes(v), 'Use um valor da sequência de Fibonacci (1,2,3,5,8,13,21)').optional().nullable(),
  arquivos: z.array(arquivoSchema).max(20).optional(),
  links: z.array(linkSchema).max(20).optional(),
  comentarios: z.array(comentarioSchema).max(100).optional(),
});

const catalogItemCreate = z.object({
  sku: z.string().min(3).max(30).regex(/^[A-Za-z0-9-]+$/, 'SKU so aceita alfanumericos e hifen'),
  name: z.string().min(2).max(120),
  category: z.string().min(2).max(60),
  price: z.number().min(0).max(1_000_000),
  stock: z.number().int().min(0).max(1_000_000).optional(),
  active: z.boolean().optional(),
});

const projectUpdate = projectCreate.partial();
const professionalUpdate = professionalCreate.partial();
const taskUpdate = taskCreate.partial();
const catalogItemUpdate = catalogItemCreate.partial().omit({ sku: true });

module.exports = {
  projectCreate, projectUpdate,
  professionalCreate, professionalUpdate,
  taskCreate, taskUpdate,
  catalogItemCreate, catalogItemUpdate,
};
