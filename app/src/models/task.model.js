const mongoose = require('mongoose');

// Tarefa — a unidade de trabalho do quadro (kanban), estilo Asana/Trello/
// Todoist. Pertence a um Projeto e pode ter um Profissional responsável.
const taskSchema = new mongoose.Schema(
  {
    titulo: { type: String, required: true, trim: true, maxlength: 160 },
    descricao: { type: String, default: '', maxlength: 2000 },
    status: {
      type: String,
      enum: ['planejado', 'em_andamento', 'pausado', 'concluido'],
      default: 'planejado',
    },
    projetoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    profissionalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Professional', default: null },
    tags: { type: [String], default: [], maxlength: 12 },
    dataInicio: { type: Date, default: null },
    horario: { type: String, default: '', trim: true, maxlength: 32 },
    prazo: { type: Date, default: null },
    // Dificuldade em sequencia de Fibonacci (estimativa de esforco). Opcional.
    dificuldade: { type: Number, enum: [1, 2, 3, 5, 8, 13, 21], default: null },
    // Minutos de foco (Pomodoro) registrados nesta tarefa especifica.
    minutosFoco: { type: Number, default: 0, min: 0 },
    // Data/hora em que a tarefa foi marcada como Concluído.
    entregueEm: { type: Date, default: null },
    comentarios: {
      type: [{
        autor: { type: String, default: '' },
        autorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        texto: { type: String, required: true, trim: true, maxlength: 2000 },
        criadoEm: { type: Date, default: Date.now },
      }],
      default: [],
    },
    arquivos: {
      type: [{
        nome: { type: String, required: true, trim: true, maxlength: 200 },
        url: { type: String, required: true, trim: true, maxlength: 2000 },
        tipo: { type: String, default: '', trim: true, maxlength: 40 },
      }],
      default: [],
    },
    links: {
      type: [{
        titulo: { type: String, default: '', trim: true, maxlength: 200 },
        url: { type: String, required: true, trim: true, maxlength: 2000 },
      }],
      default: [],
    },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ownerName: { type: String, default: '' },
  },
  { timestamps: true }
);

taskSchema.index({ ownerId: 1, status: 1 });
taskSchema.index({ projetoId: 1 });
taskSchema.index({ profissionalId: 1 });

module.exports = taskSchema;
