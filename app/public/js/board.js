(function () {
  'use strict';
  var board = document.getElementById('board');
  if (!board) return;
  var apiBase = board.getAttribute('data-api-base') || '/api/tasks';
  var STATUS_ORDER = ['todo', 'doing', 'done'];

  function fmtDate(d) {
    if (!d) return '';
    var dt = new Date(d);
    if (isNaN(dt)) return '';
    return dt.toLocaleDateString();
  }

  function esc(s) {
    return String(s == null ? '' : s);
  }

  async function api(method, path, body) {
    var opts = { method: method, credentials: 'same-origin', headers: {} };
    if (body !== undefined) {
      opts.headers['Content-Type'] = 'application/json';
      opts.body = JSON.stringify(body);
    }
    var res = await fetch(apiBase + path, opts);
    if (res.status === 204) return null;
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status));
    return data;
  }

  function statusIndex(s) { return STATUS_ORDER.indexOf(s); }

  function moveBtns(task) {
    var i = statusIndex(task.status);
    var left = document.createElement('button');
    left.type = 'button';
    left.className = 'btn-ghost';
    left.textContent = '←';
    left.title = window.t ? window.t('task.moveLeft') : 'Voltar';
    left.disabled = i <= 0;
    left.addEventListener('click', function () { setStatus(task._id, STATUS_ORDER[i - 1]); });

    var right = document.createElement('button');
    right.type = 'button';
    right.className = 'btn-ghost';
    right.textContent = '→';
    right.title = window.t ? window.t('task.moveRight') : 'Avançar';
    right.disabled = i >= STATUS_ORDER.length - 1;
    right.addEventListener('click', function () { setStatus(task._id, STATUS_ORDER[i + 1]); });
    return [left, right];
  }

  function renderCard(task) {
    var card = document.createElement('article');
    card.className = 'task-card';
    card.dataset.id = task._id;

    var h = document.createElement('h3');
    h.className = 'task-title';
    h.textContent = task.title;
    card.appendChild(h);

    if (task.description) {
      var p = document.createElement('p');
      p.className = 'muted small';
      p.textContent = task.description;
      card.appendChild(p);
    }
    if (task.dueDate) {
      var due = document.createElement('p');
      due.className = 'task-due';
      due.textContent = fmtDate(task.dueDate);
      card.appendChild(due);
    }

    var actions = document.createElement('div');
    actions.className = 'task-actions';
    moveBtns(task).forEach(function (b) { actions.appendChild(b); });

    var del = document.createElement('button');
    del.type = 'button';
    del.className = 'btn-ghost danger';
    del.textContent = '✕';
    del.title = window.t ? window.t('task.delete') : 'Excluir';
    del.addEventListener('click', function () { removeTask(task._id); });
    actions.appendChild(del);

    card.appendChild(actions);
    return card;
  }

  function render(tasks) {
    var cols = {};
    STATUS_ORDER.forEach(function (s) { cols[s] = []; });
    (tasks || []).forEach(function (t) {
      (cols[t.status] || (cols[t.status] = [])).push(t);
    });
    STATUS_ORDER.forEach(function (s) {
      var body = board.querySelector('[data-col="' + s + '"]');
      if (!body) return;
      body.innerHTML = '';
      if (!cols[s].length) {
        var empty = document.createElement('p');
        empty.className = 'muted small';
        empty.textContent = window.t ? window.t('task.empty') : 'Nenhuma tarefa ainda.';
        body.appendChild(empty);
        return;
      }
      cols[s].forEach(function (t) { body.appendChild(renderCard(t)); });
    });
  }

  async function load() {
    try {
      var data = await api('GET', '/');
      render(data.tasks);
    } catch (e) {
      setStatusMsg(e.message);
    }
  }

  async function setStatus(id, status) {
    try {
      await api('PATCH', '/' + id, { status: status });
      await load();
    } catch (e) { setStatusMsg(e.message); }
  }

  async function removeTask(id) {
    try {
      await api('DELETE', '/' + id);
      await load();
    } catch (e) { setStatusMsg(e.message); }
  }

  var form = document.getElementById('form-task');
  var btnNew = document.getElementById('btn-new');
  var btnCancel = document.getElementById('btn-cancel');
  btnNew.addEventListener('click', function () { form.hidden = !form.hidden; });
  btnCancel.addEventListener('click', function () { form.hidden = true; });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var payload = {
      title: document.getElementById('f-title').value.trim(),
      description: document.getElementById('f-desc').value.trim(),
      status: document.getElementById('f-status').value,
      dueDate: document.getElementById('f-due').value || null,
    };
    if (!payload.title) return;
    try {
      await api('POST', '/', payload);
      form.reset();
      form.hidden = true;
      await load();
    } catch (err) { setStatusMsg(err.message); }
  });

  function setStatusMsg(msg) {
    var el = document.getElementById('board-status');
    if (el) el.textContent = msg || '';
  }

  load();
})();
