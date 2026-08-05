const mongoose = require('mongoose');

// Projeto de demonstrativo — exercita CRUD, listagem, filtro e dono/escopo.
const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['planejado', 'em_andamento', 'concluido', 'pausado'],
      default: 'planejado',
    },
    tags: { type: [String], default: [] },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    // Snapshot do dono para exibir sem join caro em listagens demo.
    ownerName: { type: String, default: '' },
  },
  { timestamps: true }
);

projectSchema.index({ ownerId: 1, status: 1 });
projectSchema.index({ name: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Project', projectSchema);
