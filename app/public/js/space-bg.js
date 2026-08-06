/* ============================================================
   Fundo "deep space": starfield + galáxias + orbs com
   MOUSE REPULSION (empurra, não atrai). Reuso a estética do
   portfólio, adicionando repulsão do ponteiro.
   ============================================================ */
(function () {
  'use strict';
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var starCanvas = document.getElementById('starfield');
  var galCanvas = document.getElementById('galaxies');
  var constCanvas = document.getElementById('constel');
  if (!starCanvas) return;

  var sctx = starCanvas.getContext('2d');
  var gctx = galCanvas && galCanvas.getContext('2d');
  var cctx = constCanvas && constCanvas.getContext('2d');

  var stars = [], galaxies = [], orbs = [], constels = [];
  var sw, sh, sdpr, gw, gh, gdpr, cw, ch, cdpr;
  var mouse = { x: -9999, y: -9999, active: false };

  function rnd(a, b) { return a + Math.random() * (b - a); }

  /* ---------- Starfield (cai devagar) ---------- */
  function sizeStars() {
    sdpr = Math.min(window.devicePixelRatio || 1, 2);
    sw = starCanvas.width = window.innerWidth * sdpr;
    sh = starCanvas.height = window.innerHeight * sdpr;
    starCanvas.style.width = window.innerWidth + 'px';
    starCanvas.style.height = window.innerHeight + 'px';
    var count = Math.min(220, Math.floor((window.innerWidth * window.innerHeight) / 9000));
    stars = Array.from({ length: count }, function () {
      return {
        x: Math.random() * sw, y: Math.random() * sh, z: Math.random() * 0.8 + 0.2,
        r: (Math.random() * 1.4 + 0.3) * sdpr, tw: Math.random() * Math.PI * 2,
        hue: Math.random() < 0.2 ? 270 : (Math.random() < 0.5 ? 210 : 200)
      };
    });
  }
  function drawStars(t) {
    sctx.clearRect(0, 0, sw, sh);
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      var tw = 0.55 + 0.45 * Math.sin(s.tw + t * 0.0015 * s.z);
      sctx.beginPath();
      sctx.arc(s.x, s.y, s.r * s.z, 0, Math.PI * 2);
      sctx.fillStyle = 'hsla(' + s.hue + ',90%,' + (70 + tw * 20) + '%,' + (0.5 + tw * 0.5) + ')';
      sctx.fill();
      s.y += s.z * 0.12 * sdpr;
      if (s.y > sh) { s.y = 0; s.x = Math.random() * sw; }
      s.tw += 0.02;
    }
    requestAnimationFrame(drawStars);
  }

  /* ---------- Galáxias espirais + orbs (repulsão do mouse) ---------- */
  function buildGalaxies() {
    var palette = [['#6ea8fe','#b692ff'],['#5eead4','#6ea8fe'],['#ffd479','#b692ff'],['#ff8fb1','#6ea8fe']];
    var n = window.innerWidth < 700 ? 2 : 3;
    galaxies = Array.from({ length: n }, function (_, i) {
      var base = palette[i % palette.length];
      return {
        cx: (i + 1) / (n + 1), cy: 0.3 + (i % 2) * 0.4,
        R: Math.min(window.innerWidth, window.innerHeight) * (0.18 + Math.random() * 0.05),
        arms: 2 + (i % 2), rot: Math.random() * Math.PI * 2,
        spin: (Math.random() < 0.5 ? 1 : -1) * (0.0011 + Math.random() * 0.0008),
        hueA: base[0], hueB: base[1],
        stars: Array.from({ length: 320 }, function () {
          return { a: Math.random() * Math.PI * 2, rad: Math.pow(Math.random(), 0.55), sz: Math.random() * 1.5 + 0.35, tw: Math.random() * Math.PI * 2, dust: Math.random() < 0.35 };
        })
      };
    });
  }
  function buildOrbs() {
    var count = Math.min(26, Math.floor((window.innerWidth * window.innerHeight) / 52000));
    orbs = Array.from({ length: count }, function () {
      var r = (2 + Math.random() * 3.5) * gdpr;
      return { x: Math.random() * gw, y: Math.random() * gh, vx: (Math.random() * 2 - 1) * 0.55 * gdpr, vy: (Math.random() * 2 - 1) * 0.55 * gdpr, r: r, tw: Math.random() * Math.PI * 2, hue: Math.random() < 0.3 ? 275 : (Math.random() < 0.5 ? 210 : 175) };
    });
  }
  function sizeGalaxies() {
    gdpr = Math.min(window.devicePixelRatio || 1, 2);
    gw = galCanvas.width = window.innerWidth * gdpr;
    gh = galCanvas.height = window.innerHeight * gdpr;
    galCanvas.style.width = window.innerWidth + 'px';
    galCanvas.style.height = window.innerHeight + 'px';
    buildGalaxies(); buildOrbs();
  }
  function drawGalaxies(t) {
    gctx.clearRect(0, 0, gw, gh);
    for (var i = 0; i < galaxies.length; i++) {
      var g = galaxies[i]; g.rot += g.spin;
      var cx = g.cx * gw, cy = g.cy * gh, R = g.R;
      var halo = gctx.createRadialGradient(cx, cy, R * 0.1, cx, cy, R * 1.05);
      halo.addColorStop(0, 'rgba(180,200,255,0.12)');
      halo.addColorStop(0.5, 'rgba(120,140,255,0.06)');
      halo.addColorStop(1, 'rgba(0,0,0,0)');
      gctx.fillStyle = halo; gctx.beginPath(); gctx.arc(cx, cy, R * 1.05, 0, Math.PI * 2); gctx.fill();
      for (var j = 0; j < g.stars.length; j++) {
        var s = g.stars[j];
        var arm = Math.floor(s.a / (Math.PI * 2 / g.arms)) * (Math.PI * 2 / g.arms);
        var ang = arm + s.rad * 4.2 + g.rot;
        var rad = s.rad * R;
        var x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad * 0.45;
        var tw = 0.55 + 0.45 * Math.sin(s.tw + t * 0.0018);
        gctx.beginPath(); gctx.arc(x, y, (s.sz + 0.3) * gdpr, 0, Math.PI * 2);
        gctx.fillStyle = s.dust ? 'rgba(255,190,150,' + (0.18 + tw * 0.22) + ')' : 'rgba(225,235,255,' + (0.4 + tw * 0.55) + ')';
        gctx.fill();
      }
      var core = gctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.28);
      core.addColorStop(0, 'rgba(255,255,255,0.98)');
      core.addColorStop(0.25, g.hueA); core.addColorStop(0.7, g.hueB); core.addColorStop(1, 'rgba(0,0,0,0)');
      gctx.fillStyle = core; gctx.beginPath(); gctx.arc(cx, cy, R * 0.28, 0, Math.PI * 2); gctx.fill();
    }
    // orbs com repulsão do mouse
    var mr = 160 * gdpr; // raio de influência
    for (var k = 0; k < orbs.length; k++) {
      var o = orbs[k];
      o.x += o.vx; o.y += o.vy;
      if (o.x - o.r < 0) { o.x = o.r; o.vx = Math.abs(o.vx); }
      else if (o.x + o.r > gw) { o.x = gw - o.r; o.vx = -Math.abs(o.vx); }
      if (o.y - o.r < 0) { o.y = o.r; o.vy = Math.abs(o.vy); }
      else if (o.y + o.r > gh) { o.y = gh - o.r; o.vy = -Math.abs(o.vy); }
      if (mouse.active) {
        var dx = o.x - mouse.x, dy = o.y - mouse.y;
        var d = Math.hypot(dx, dy);
        if (d < mr && d > 0.01) {
          var f = (mr - d) / mr; // força cresce perto do cursor
          o.x += (dx / d) * f * 6 * gdpr;
          o.y += (dy / d) * f * 6 * gdpr;
        }
      }
      o.tw += 0.05;
      var otw = 0.5 + 0.5 * Math.sin(o.tw);
      var grd = gctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r * 3.2);
      grd.addColorStop(0, 'hsla(' + o.hue + ',90%,85%,' + (0.8 * otw + 0.2) + ')');
      grd.addColorStop(0.4, 'hsla(' + o.hue + ',90%,75%,' + (0.35 * otw) + ')');
      grd.addColorStop(1, 'hsla(' + o.hue + ',90%,75%,0)');
      gctx.fillStyle = grd; gctx.beginPath(); gctx.arc(o.x, o.y, o.r * 3.2, 0, Math.PI * 2); gctx.fill();
    }
    requestAnimationFrame(drawGalaxies);
  }

  /* ---------- Constelações ---------- */
  function buildConstels() {
    var C = {
      cruz: { stars: [[0.80,0.80],[0.83,0.70],[0.86,0.60],[0.84,0.50],[0.82,0.40]], lines: [[0,1],[1,2],[2,3],[3,4]] },
      ori: { stars: [[0.42,0.30],[0.46,0.38],[0.50,0.46],[0.40,0.55],[0.56,0.58],[0.36,0.70],[0.60,0.72]], lines: [[0,1],[1,2],[3,4],[0,3],[2,4],[3,5],[4,6],[5,6]] },
      escorp: { stars: [[0.12,0.55],[0.16,0.62],[0.20,0.68],[0.25,0.72],[0.30,0.74],[0.33,0.70],[0.32,0.64],[0.29,0.60]], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7]] },
      cas: { stars: [[0.10,0.18],[0.18,0.24],[0.26,0.16],[0.34,0.23],[0.42,0.15]], lines: [[0,1],[1,2],[2,3],[3,4]] },
      ursa: { stars: [[0.62,0.14],[0.70,0.17],[0.78,0.16],[0.85,0.20],[0.88,0.27],[0.82,0.30],[0.74,0.28]], lines: [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,1]] }
    };
    constels = Object.keys(C).map(function (name) {
      var c = C[name];
      return { name: name, stars: c.stars.map(function (p) { return { x: p[0], y: p[1], tw: Math.random() * Math.PI * 2, r: 1.2 + Math.random() * 1.6, ph: Math.random() * Math.PI * 2, amp: 4 + Math.random() * 6 }; }), lines: c.lines };
    });
  }
  function sizeConstel() {
    cdpr = Math.min(window.devicePixelRatio || 1, 2);
    cw = constCanvas.width = window.innerWidth * cdpr;
    ch = constCanvas.height = window.innerHeight * cdpr;
    constCanvas.style.width = window.innerWidth + 'px';
    constCanvas.style.height = window.innerHeight + 'px';
    buildConstels();
  }
  function drawConstel(t) {
    cctx.clearRect(0, 0, cw, ch);
    var time = t * 0.00018;
    for (var i = 0; i < constels.length; i++) {
      var c = constels[i];
      var pos = c.stars.map(function (s) {
        return { x: s.x * cw + Math.sin(time + s.ph) * s.amp * cdpr, y: s.y * ch + Math.cos(time * 0.8 + s.ph) * s.amp * cdpr * 0.6 };
      });
      cctx.strokeStyle = 'rgba(180,205,255,0.55)'; cctx.lineWidth = 1.6 * cdpr;
      cctx.shadowColor = 'rgba(150,180,255,0.6)'; cctx.shadowBlur = 6 * cdpr;
      cctx.beginPath();
      c.lines.forEach(function (ln) { var A = pos[ln[0]], B = pos[ln[1]]; cctx.moveTo(A.x, A.y); cctx.lineTo(B.x, B.y); });
      cctx.stroke(); cctx.shadowBlur = 0;
      c.stars.forEach(function (s, idx) {
        var tw = 0.55 + 0.45 * Math.sin(s.tw + t * 0.0012);
        var x = pos[idx].x, y = pos[idx].y, r = s.r * cdpr * (0.7 + tw * 0.6);
        var g = cctx.createRadialGradient(x, y, 0, x, y, r * 3);
        g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.4, 'rgba(190,210,255,0.55)'); g.addColorStop(1, 'rgba(190,210,255,0)');
        cctx.fillStyle = g; cctx.beginPath(); cctx.arc(x, y, r * 3, 0, Math.PI * 2); cctx.fill();
      });
    }
    requestAnimationFrame(drawConstel);
  }

  /* ---------- Mouse ---------- */
  window.addEventListener('mousemove', function (e) { mouse.x = e.clientX * gdpr; mouse.y = e.clientY * gdpr; mouse.active = true; }, { passive: true });
  window.addEventListener('mouseleave', function () { mouse.active = false; });
  window.addEventListener('touchmove', function (e) { if (e.touches[0]) { mouse.x = e.touches[0].clientX * gdpr; mouse.y = e.touches[0].clientY * gdpr; mouse.active = true; } }, { passive: true });

  /* ---------- Init ---------- */
  sizeStars();
  if (gctx) { sizeGalaxies(); window.addEventListener('resize', sizeGalaxies); }
  if (cctx) { sizeConstel(); window.addEventListener('resize', sizeConstel); }
  if (!reduceMotion) {
    requestAnimationFrame(drawStars);
    if (gctx) requestAnimationFrame(drawGalaxies);
    if (cctx) requestAnimationFrame(drawConstel);
  } else {
    drawStars(0);
    if (gctx) drawGalaxies(0);
    if (cctx) drawConstel(0);
  }
})();
