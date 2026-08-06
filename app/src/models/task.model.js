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
  },
  { timestamps: true }
);

taskSchema.index({ ownerId: 1, status: 1 });
taskSchema.index({ ownerId: 1, dueDate: 1 });

module.exports = taskSchema;
