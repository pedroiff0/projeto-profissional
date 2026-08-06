const TITLES = [
  ['Esboçar proposta de arquitetura', 'doing', 0],
  ['Revisar PR de autenticação', 'todo', 2],
  ['Atualizar documentação da API', 'todo', 5],
  ['Corrigir bug no relatório mensal', 'doing', -1],
  ['Preparar demo para o cliente', 'done', -3],
  ['Levantar requisitos do módulo de pagamento', 'todo', 7],
  ['Refatorar camada de serviços', 'doing', 1],
  ['Escrever testes de integração', 'todo', 9],
  ['Configurar pipeline de CI', 'done', -6],
  ['Reunião de planejamento semanal', 'todo', 3],
];

// Popula o banco com tarefas de exemplo para o usuario dono informado.
// dueDate relativo a hoje (offset dias). Idempotente por titulo+ownerId.
async function seedTasks(models, ownerId, ownerName) {
  const Task = models.Task;
  const hoje = new Date();
  for (const [title, status, offset] of TITLES) {
    const existe = await Task.findOne({ title, ownerId });
    if (existe) continue;
    const due = new Date(hoje);
    due.setDate(due.getDate() + offset);
    await Task.create({
      title,
      description: '',
      status,
      dueDate: due,
      ownerId,
      ownerName: ownerName || '',
    });
  }
}

module.exports = { seedTasks, TITLES };
