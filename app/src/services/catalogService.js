const AppError = require('../utils/AppError');

async function listar({ filtro = {}, page = 1, limit = 24 }, models) {
  const CatalogItem = models.CatalogItem;
  const [items, total] = await Promise.all([
    CatalogItem.find(filtro).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    CatalogItem.countDocuments(filtro),
  ]);
  return { items, total, page, limit, pages: Math.max(1, Math.ceil(total / limit)) };
}

async function obter(id, models) {
  const CatalogItem = models.CatalogItem;
  const item = await CatalogItem.findById(id);
  if (!item) throw new AppError('Item nao encontrado', 404);
  return item;
}

async function criar(data, models) {
  const CatalogItem = models.CatalogItem;
  return CatalogItem.create(data);
}

async function atualizar(id, data, models) {
  const CatalogItem = models.CatalogItem;
  const item = await CatalogItem.findById(id);
  if (!item) throw new AppError('Item nao encontrado', 404);
  if (data.name !== undefined) item.name = data.name;
  if (data.category !== undefined) item.category = data.category;
  if (data.price !== undefined) item.price = data.price;
  if (data.stock !== undefined) item.stock = data.stock;
  if (data.active !== undefined) item.active = data.active;
  await item.save();
  return item;
}

async function remover(id, models) {
  const CatalogItem = models.CatalogItem;
  const item = await CatalogItem.findById(id);
  if (!item) throw new AppError('Item nao encontrado', 404);
  await item.deleteOne();
  return true;
}

module.exports = { listar, obter, criar, atualizar, remover };
