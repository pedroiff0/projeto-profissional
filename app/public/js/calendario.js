(function () {
  'use strict';
  var cal = document.getElementById('calendar');
  if (!cal) return;
  var apiBase = cal.getAttribute('data-api-base') || '/api/tasks';
  var body = document.getElementById('cal-body');
  var label = document.getElementById('month-label');
  var view = new Date();
  view.setDate(1);

  var MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

  function ymd(d) {
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  function sameDay(a, b) {
    var d = new Date(a);
    return ymd(d) === ymd(b);
  }

  async function api(method, path) {
    var res = await fetch(apiBase + path, { method: method, credentials: 'same-origin' });
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || ('HTTP ' + res.status));
    return data;
  }

  function render(tasks) {
    var year = view.getFullYear();
    var month = view.getMonth();
    label.textContent = MONTHS[month] + ' ' + year;

    var first = new Date(year, month, 1);
    var startDay = first.getDay(); // 0=Dom
    var daysInMonth = new Date(year, month + 1, 0).getDate();

    body.innerHTML = '';
    // Espacos antes do dia 1
    for (var i = 0; i < startDay; i++) {
      var blank = document.createElement('div');
      blank.className = 'cal-cell empty';
      body.appendChild(blank);
    }
    for (var d = 1; d <= daysInMonth; d++) {
      var day = new Date(year, month, d);
      var cell = document.createElement('div');
      cell.className = 'cal-cell';
      var num = document.createElement('span');
      num.className = 'cal-day';
      num.textContent = d;
      cell.appendChild(num);

      tasks.forEach(function (t) {
        if (t.dueDate && sameDay(t.dueDate, day)) {
          var chip = document.createElement('a');
          chip.className = 'cal-task chip-' + (t.status || 'todo');
          chip.href = '/board';
          chip.textContent = t.title;
          chip.title = t.title;
          cell.appendChild(chip);
        }
      });
      body.appendChild(cell);
    }
  }

  async function load() {
    try {
      var data = await api('GET', '/');
      render(data.tasks || []);
    } catch (e) {
      var el = document.getElementById('cal-status');
      if (el) el.textContent = e.message;
    }
  }

  document.getElementById('prev').addEventListener('click', function () {
    view.setMonth(view.getMonth() - 1);
    load();
  });
  document.getElementById('next').addEventListener('click', function () {
    view.setMonth(view.getMonth() + 1);
    load();
  });

  load();
})();
