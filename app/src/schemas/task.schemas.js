const { z } = require('zod');

const taskCreate = z.object({
  title: z.string().min(2, 'Título muito curto').max(140),
  description: z.string().max(2000).optional().default(''),
  status: z.enum(['todo', 'doing', 'done']).optional(),
  dueDate: z.coerce.date().nullable().optional(),
  assigneeId: z.string().regex(/^[0-9a-fA-F]{24}$/).nullable().optional(),
  dificuldade: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(5), z.literal(8), z.literal(13), z.literal(21)]).nullable().optional(),
});

const taskUpdate = taskCreate.partial();

module.exports = { taskCreate, taskUpdate };
