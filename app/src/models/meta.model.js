const mongoose = require('mongoose');

// Configuração do painel por dono: meta (tarefas por semana) e minutos de foco
// acumulados (pomodoro). Um doc por usuário.
const metaSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    metaSemana: { type: Number, default: 0, min: 0 },
    focoMinutos: { type: Number, default: 0, min: 0 },
    pomodoros: { type: Number, default: 0, min: 0 },
    // Foco distribuido nos ultimos 7 dias (Seg..Dom): minutos e pomodoros.
    focoPorDia: { type: [Number], default: [0, 0, 0, 0, 0, 0, 0] },
    pomodorosPorDia: { type: [Number], default: [0, 0, 0, 0, 0, 0, 0] },
  },
  { timestamps: true }
);

module.exports = metaSchema;
