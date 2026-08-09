const mongoose = require('mongoose');

// Profissional de demonstração — pessoa/colaborador do quadro (NÃO é conta de
// login; o registro de USUÁRIOS continua controlado pelo admin). Serve para
// atribuir tarefas, como um membro de equipe no Asana/Trello.
const professionalSchema = new mongoose.Schema(
  {
    nome: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, maxlength: 160, match: [/^\S+@\S+\.\S+$/, 'E-mail inválido'] },
    funcao: { type: String, default: '', trim: true, maxlength: 80 },
    contato: { type: String, default: '', trim: true, maxlength: 160 },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ownerName: { type: String, default: '' },
  },
  { timestamps: true }
);

professionalSchema.index({ ownerId: 1, nome: 1 });

module.exports = professionalSchema;
