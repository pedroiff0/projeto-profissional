const mongoose = require('mongoose');

// Item de catalogo simples — exercita listagem, busca, paginacao e filtro.
const catalogItemSchema = new mongoose.Schema(
  {
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    stock: { type: Number, default: 0, min: 0 },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

catalogItemSchema.index({ category: 1, active: 1 });
catalogItemSchema.index({ name: 'text', sku: 'text', category: 'text' });

module.exports = catalogItemSchema;
