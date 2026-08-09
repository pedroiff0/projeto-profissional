const mongoose = require('mongoose');

// Profissional de demonstração (equipe/fornecedores da demonstração).
const professionalSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    funcao: { type: String, default: '' },
    contato: { type: String, default: '' },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ownerName: { type: String, default: '' },
  },
  { timestamps: true }
);

professionalSchema.index({ ownerId: 1 });

module.exports = professionalSchema;
