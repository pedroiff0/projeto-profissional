const { z } = require('zod');

const projectCreate = z.object({
  name: z.string().min(3, 'Nome muito curto').max(120),
  description: z.string().max(1000).optional().default(''),
  status: z.enum(['planejado', 'em_andamento', 'concluido', 'pausado']).optional(),
  tags: z.array(z.string().max(30)).max(10).optional(),
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
const catalogItemUpdate = catalogItemCreate.partial().omit({ sku: true });

module.exports = { projectCreate, projectUpdate, catalogItemCreate, catalogItemUpdate };
