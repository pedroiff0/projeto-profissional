const mongoose = require('mongoose');

// Metas de foco semanal por dono (dados de demonstração para os gráficos do painel).
const metaSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    metaSemana: { type: Number, default: 250 }, // meta de minutos de foco na semana
    focoMinutos: { type: Number, default: 0 }, // foco acumulado (Pomodoro)
    pomodoros: { type: Number, default: 0 },
    // Distribuição por dia da semana (Dom..Sáb, 7 posições).
    focoPorDia: { type: [Number], default: [0, 0, 0, 0, 0, 0, 0] },
    pomodorosPorDia: { type: [Number], default: [0, 0, 0, 0, 0, 0, 0] },
  },
  { timestamps: true }
);

metaSchema.index({ ownerId: 1 });

module.exports = metaSchema;
