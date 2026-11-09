/* Red neuronal reactiva al cursor + estela de cometa + cursor propio + botones magnéticos + tarjetas holográficas */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(pointer: fine)').matches && window.matchMedia('(hover: hover)').matches;
  var mobile = window.matchMedia('(max-width: 760px)').matches;
  var cv = document.getElementById('fx'); if (!cv) return;
  var ctx = cv.getContext('2d');
  var dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
  var W, H, nodes = [], N = mobile ? 34 : 78, LINK = mobile ? 110 : 150;
  var mx = -9999, my = -9999, trail = [], pulses = [];
  function resize() {
    W = window.innerWidth; H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + 'px'; cv.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    nodes = [];
    for (var i = 0; i < N; i++) nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .25, vy: (Math.random() - .5) * .25, r: Math.random() * 1.6 + .8, c: Math.random() });
    if (reduced) drawNet(1);
  }
  window.addEventListener('resize', resize);
  window.addEventListener('pointermove', function (e) {
    mx = e.clientX; my = e.clientY;
    if (fine && !reduced) { trail.push({ x: mx, y: my, life: 1 }); if (trail.length > 40) trail.shift(); }
  }, { passive: true });
  document.addEventListener('pointerleave', function () { mx = my = -9999; });

  function col(c, a) { return c < .4 ? 'rgba(34,211,238,' + a + ')' : c < .75 ? 'rgba(167,139,250,' + a + ')' : 'rgba(236,72,153,' + a + ')'; }
  function drawNet(alpha) {
    ctx.clearRect(0, 0, W, H);
    if (alpha <= 0.01) return;
    var i, j, a, b, dx, dy, d;
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      if (!reduced) {
        dx = a.x - mx; dy = a.y - my; d = Math.sqrt(dx * dx + dy * dy);
        if (d < 180 && d > 1) { var f = (180 - d) / 180; a.vx += (-dx / d) * f * .06; a.vy += (-dy / d) * f * .06; }
        a.vx *= .985; a.vy *= .985; a.vx += (Math.random() - .5) * .01; a.vy += (Math.random() - .5) * .01;
        a.x += a.vx; a.y += a.vy;
        if (a.x < -20) a.x = W + 20; if (a.x > W + 20) a.x = -20; if (a.y < -20) a.y = H + 20; if (a.y > H + 20) a.y = -20;
      }
    }
    ctx.lineWidth = 1;
    for (i = 0; i < nodes.length; i++) {
      a = nodes[i];
      for (j = i + 1; j < nodes.length; j++) {
        b = nodes[j]; dx = a.x - b.x; dy = a.y - b.y; d = dx * dx + dy * dy;
        if (d < LINK * LINK) {
          d = Math.sqrt(d);
          var near = Math.max(0, 1 - Math.hypot((a.x + b.x) / 2 - mx, (a.y + b.y) / 2 - my) / 220);
          ctx.strokeStyle = near > 0 ? 'rgba(103,232,249,' + ((1 - d / LINK) * (.18 + near * .6) * alpha) + ')' : 'rgba(167,139,250,' + ((1 - d / LINK) * .16 * alpha) + ')';
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          if (!reduced && Math.random() < .0009) pulses.push({ a: a, b: b, t: 0 });
        }
      }
      var nr = Math.max(0, 1 - Math.hypot(a.x - mx, a.y - my) / 200);
      ctx.fillStyle = col(a.c, (.55 + nr * .45) * alpha);
      ctx.beginPath(); ctx.arc(a.x, a.y, a.r + nr * 2.2, 0, 6.283); ctx.fill();
    }
    // impulsos que viajan por las conexiones
    for (i = pulses.length - 1; i >= 0; i--) {
      var p = pulses[i]; p.t += .025;
      if (p.t >= 1) { pulses.splice(i, 1); continue; }
      var px = p.a.x + (p.b.x - p.a.x) * p.t, py = p.a.y + (p.b.y - p.a.y) * p.t;
      var g = ctx.createRadialGradient(px, py, 0, px, py, 7);
      g.addColorStop(0, 'rgba(255,255,255,' + alpha + ')'); g.addColorStop(1, 'rgba(34,211,238,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, 7, 0, 6.283); ctx.fill();
    }
    if (pulses.length > 30) pulses.splice(0, pulses.length - 30);
  }
  function drawTrail() {
    if (!trail.length) return;
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < trail.length; i++) {
      var t = trail[i]; t.life -= .035;
      var s = Math.max(0, t.life);
      var k = i / trail.length;
      ctx.fillStyle = k < .5 ? 'rgba(139,92,246,' + s * .5 + ')' : 'rgba(34,211,238,' + s * .6 + ')';
      ctx.beginPath(); ctx.arc(t.x, t.y, 1 + k * 3.5 * s, 0, 6.283); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    while (trail.length && trail[0].life <= 0) trail.shift();
  }
  var running = true;
  function loop() {
    if (!running) return;
    requestAnimationFrame(loop);
    var heroH = window.innerHeight * 1.1;
    var alpha = Math.max(0, 1 - window.scrollY / heroH) * .95 + .05 * (mobile ? 0 : 1);
    drawNet(alpha);
    drawTrail();
  }
  resize();
  document.addEventListener('visibilitychange', function () { running = !document.hidden && !reduced; if (running) requestAnimationFrame(loop); });
  if (!reduced) requestAnimationFrame(loop); else running = false;

  // Cursor propio
  if (fine && !reduced) {
    document.documentElement.classList.add('has-cursor');
    var cur = document.querySelector('.cursor'), dot = cur.querySelector('.cursor__dot'), ring = cur.querySelector('.cursor__ring');
    var rx = 0, ry = 0, cx = 0, cy = 0;
    window.addEventListener('pointermove', function (e) { cx = e.clientX; cy = e.clientY; dot.style.transform = 'translate(' + cx + 'px,' + cy + 'px) translate(-50%,-50%)'; }, { passive: true });
    (function rl() { rx += (cx - rx) * .18; ry += (cy - ry) * .18; ring.style.transform = 'translate(' + rx + 'px,' + ry + 'px) translate(-50%,-50%)'; requestAnimationFrame(rl); })();
    document.addEventListener('pointerover', function (e) { if (e.target.closest && e.target.closest('a,button,summary,input,[data-tilt]')) cur.classList.add('is-hover'); });
    document.addEventListener('pointerout', function (e) { if (e.target.closest && e.target.closest('a,button,summary,input,[data-tilt]')) cur.classList.remove('is-hover'); });
  }

  // Botones magnéticos
  if (fine && !reduced) {
    document.querySelectorAll('.magnetic').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(); var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        el.style.transform = 'translate(' + x * .25 + 'px,' + y * .35 + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  // Tarjetas holográficas con inclinación 3D
  document.querySelectorAll('[data-tilt]').forEach(function (el) {
    el.addEventListener('pointermove', function (e) {
      var r = el.getBoundingClientRect(); var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      el.style.setProperty('--mx', (px * 100) + '%'); el.style.setProperty('--my', (py * 100) + '%');
      if (fine && !reduced) el.style.transform = 'perspective(900px) rotateX(' + ((.5 - py) * 9) + 'deg) rotateY(' + ((px - .5) * 11) + 'deg) translateZ(0)';
    });
    el.addEventListener('pointerleave', function () { el.style.transform = ''; });
  });
})();
