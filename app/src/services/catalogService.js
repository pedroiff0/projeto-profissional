const CatalogItem = require('../models/catalogItem.model');
const NotFoundError = require('../utils/AppError');

// Catalogo e publico para usuarios autenticados (sem escopo de dono).
async function listar({ filtro = {}, page = 1, limit = 24 }) {
  const q = { ...filtro };
  const skip = (Math.max(1, page) - 1) * limit;
  const [items, total] = await Promise.all([
    CatalogItem.find(q).sort({ sku: 1 }).skip(skip).limit(limit),
    CatalogItem.countDocuments(q),
  ]);
  return { items, total, page, limit, pages: Math.ceil(total / limit) };
}

async function obter(id) {
  const item = await CatalogItem.findById(id);
  if (!item) throw new NotFoundError('Item nao encontrado', 404);
  return item;
}

async function criar(dados) {
  return CatalogItem.create(dados);
}

async function atualizar(id, dados) {
  const item = await CatalogItem.findById(id);
  if (!item) throw new NotFoundError('Item nao encontrado', 404);
  Object.assign(item, dados);
  await item.save();
  return item;
}

async function remover(id) {
  const item = await CatalogItem.findById(id);
  if (!item) throw new NotFoundError('Item nao encontrado', 404);
  await item.deleteOne();
  return true;
}

module.exports = { listar, obter, criar, atualizar, remover };
