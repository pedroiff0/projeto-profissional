const mongoose = require('mongoose');

// Tarefa do task manager. Pertence a um dono (ownerId); o usuário logado vê as
// suas, o admin vê todas. assigneeId é opcional (quem vai executar).
const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    status: {
      type: String,
      enum: ['todo', 'doing', 'done'],
      default: 'todo',
    },
    dueDate: { type: Date, default: null },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ownerName: { type: String, default: '' },
    assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assigneeName: { type: String, default: '' },
    // Dificuldade estimada na sequencia Fibonacci (pontos de esforco).
    dificuldade: { type: Number, enum: [1, 2, 3, 5, 8, 13, 21], default: null },
    // Minutos de foco (Pomodoro) registrados nesta tarefa especifica.
    minutosFoco: { type: Number, default: 0, min: 0 },
    // Data/hora em que a tarefa foi marcada como concluida (done).
    entregueEm: { type: Date, default: null },
  },
  { timestamps: true }
);

taskSchema.index({ ownerId: 1, status: 1 });
taskSchema.index({ ownerId: 1, dueDate: 1 });

module.exports = taskSchema;
