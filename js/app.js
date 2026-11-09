(function () {
  'use strict';
  var D = document, html = D.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = window.matchMedia('(max-width: 700px)').matches;
  var hasG = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  html.classList.add('js');
  if (reduced) html.classList.add('reduced');
  if (!hasG) html.classList.add('no-gsap');
  var $ = function (s, c) { return (c || D).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || D).querySelectorAll(s)); };

  /* ---------- Descargas desde config ---------- */
  var cfg = (window.NEBULA && window.NEBULA.downloads) || {};
  $$('[data-dl]').forEach(function (a) { var d = cfg[a.getAttribute('data-dl')]; if (d && d.url) a.href = d.url; });
  $$('[data-v]').forEach(function (el) { var k = el.getAttribute('data-v').split('.'); var d = cfg[k[0]]; if (d && d[k[1]]) el.textContent = (k[1] === 'version' ? 'v' : '') + d[k[1]]; });

  /* ---------- Utilidades ---------- */
  var GLYPHS = '!<>-_\\/[]{}—=+*^?#✦01ABCDEFabcdef';
  function scramble(el, text, dur) {
    if (reduced) { el.textContent = text; return; }
    var start = performance.now(); dur = dur || 900;
    (function step(now) {
      var p = Math.min(1, (now - start) / dur), out = '';
      for (var i = 0; i < text.length; i++) {
        var reveal = i / text.length < p * 1.15 - .1;
        out += reveal || text[i] === ' ' ? text[i] : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
      if (p < 1) requestAnimationFrame(step); else el.textContent = text;
    })(start);
  }
  function typeInto(el, text, speed, done) {
    if (reduced) { el.textContent = text; if (done) done(); return; }
    var i = 0; el.textContent = '';
    (function t() { i += 1 + (Math.random() * 2 | 0); el.textContent = text.slice(0, i); if (i < text.length) setTimeout(t, speed); else if (done) done(); })();
  }
  function onView(el, cb, opts) {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { cb(); return; }
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { cb(); if (!(opts && opts.repeat)) io.disconnect(); } }); }, { threshold: (opts && opts.threshold) || .35 });
    io.observe(el);
  }

  /* ---------- Título del hero en letras ---------- */
  var title = $('#hero-title');
  if (title) {
    var txt = title.textContent; title.textContent = '';
    txt.split('').forEach(function (c, i) { var s = D.createElement('span'); s.className = 'ch' + (i >= 6 ? ' ia' : ''); s.textContent = c; s.setAttribute('aria-hidden', 'true'); title.appendChild(s); });
  }
  var chars = $$('#hero-title .ch');

  /* ---------- Intro ---------- */
  var intro = $('#intro'), bar = $('#intro-bar'), itxt = $('#intro-txt');
  var msgs = ['Alineando galaxias…', 'Encendiendo estrellas…', 'Conectando neuronas…', 'Listo ✦'];
  var introDone = false;
  function endIntro() {
    if (introDone) return; introDone = true;
    D.body.classList.remove('is-loading');
    if (hasG && !reduced) {
      gsap.to(intro, { opacity: 0, scale: 1.15, filter: 'blur(12px)', duration: .9, ease: 'power3.inOut', onComplete: function () { intro.remove(); } });
      if (window.NebulaBG) window.NebulaBG.warp(900);
      heroIn();
    } else { intro.remove(); heroIn(); }
  }
  $('#intro-skip').addEventListener('click', endIntro);
  if (reduced || !hasG) { setTimeout(endIntro, reduced ? 50 : 400); }
  else {
    var prog = { v: 0 }, mi = 0;
    gsap.to(prog, { v: 1, duration: 2.1, ease: 'power2.inOut', onUpdate: function () {
      bar.style.width = (prog.v * 100) + '%';
      var k = Math.min(msgs.length - 1, Math.floor(prog.v * msgs.length));
      if (k !== mi) { mi = k; scramble(itxt, msgs[k], 400); }
    }, onComplete: function () { setTimeout(endIntro, 250); } });
  }

  function heroIn() {
    if (!hasG || reduced) {
      $$('.reveal-up').forEach(function (e) { e.style.opacity = 1; e.style.transform = 'none'; });
      $$('.scramble').forEach(function (e) { e.textContent = e.getAttribute('data-text'); });
      return;
    }
    var tl = gsap.timeline({ delay: .15 });
    tl.from(chars, { yPercent: 120, rotateX: -90, opacity: 0, filter: 'blur(14px)', stagger: .06, duration: 1.1, ease: 'expo.out' })
      .add(function () { scramble($('.hero__tag'), $('.hero__tag').getAttribute('data-text'), 1100); }, .4)
      .to('.hero .reveal-up', { opacity: 1, y: 0, stagger: .1, duration: .9, ease: 'power3.out' }, .5);
    counters();
  }
  function counters() {
    $$('[data-count]').forEach(function (b) { var n = +b.getAttribute('data-count'), o = { v: 0 }; gsap.to(o, { v: n, duration: 1.6, delay: .9, ease: 'power2.out', onUpdate: function () { b.textContent = Math.round(o.v); } }); });
  }

  /* Letras que reaccionan al ratón */
  if (!reduced && chars.length && window.matchMedia('(pointer: fine)').matches) {
    window.addEventListener('pointermove', function (e) {
      if (window.scrollY > window.innerHeight) return;
      chars.forEach(function (c) {
        var r = c.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        var dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy), f = Math.max(0, 1 - d / 260);
        c.style.transform = 'translate(' + (-dx * f * .12) + 'px,' + (-dy * f * .18) + 'px) rotate(' + (dx * f * .03) + 'deg) scale(' + (1 + f * .08) + ')';
      });
    }, { passive: true });
  }

  /* ---------- Nav ---------- */
  var nav = $('#nav'), burger = $('#burger'), mnav = $('#mnav');
  burger.addEventListener('click', function () { var o = !mnav.classList.contains('open'); mnav.classList.toggle('open', o); burger.setAttribute('aria-expanded', o); });
  $$('#mnav a').forEach(function (a) { a.addEventListener('click', function () { mnav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); }); });

  /* ---------- Scroll suave ---------- */
  var lenis = null;
  if (hasG) gsap.registerPlugin(ScrollTrigger);
  if (hasG && !reduced && typeof window.Lenis !== 'undefined') {
    lenis = new Lenis({ duration: 1.15, smoothWheel: true });
    lenis.on('scroll', function (e) { ScrollTrigger.update(); if (window.NebulaBG) window.NebulaBG.vel = e.velocity || 0; });
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var id = a.getAttribute('href'); if (id.length < 2) id = '#top';
      var t = $(id); if (!t) return; e.preventDefault();
      if (lenis) lenis.scrollTo(t, { offset: id === '#top' ? 0 : -10, duration: 1.6 }); else t.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth' });
    });
  });
  var progEl = $('#progress');
  function onScroll() {
    var y = window.scrollY, max = D.documentElement.scrollHeight - window.innerHeight;
    progEl.style.transform = 'scaleX(' + (max > 0 ? y / max : 0) + ')';
    nav.classList.toggle('is-scrolled', y > 40);
  }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  // enlace activo
  var secs = ['dispositivos', 'funciones', 'modelos', 'demo', 'faq'];
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { $$('.nav__links a').forEach(function (a) { a.classList.toggle('on', a.getAttribute('href') === '#' + e.target.id); }); } }); }, { rootMargin: '-45% 0px -50% 0px' });
    secs.forEach(function (s) { var el = D.getElementById(s); if (el) io.observe(el); });
  }

  /* ---------- Títulos que se descifran ---------- */
  $$('section:not(.hero) .scramble').forEach(function (el) { var t = el.getAttribute('data-text'); onView(el, function () { scramble(el, t, 1000); }, { threshold: .6 }); });

  /* ---------- Dispositivos ---------- */
  var phone = $('#phone'), laptop = $('#laptop'), lid = $('#lid');
  var chapters = $$('#chapters li'), pScr = $$('#phone .scr'), lScr = $$('#laptop .scr');
  var curCh = -1;
  function setChapter(i) {
    if (i === curCh) return; curCh = i;
    chapters.forEach(function (c, k) { c.classList.toggle('is-on', k === i); });
    pScr.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
    lScr.forEach(function (s, k) { s.classList.toggle('is-on', k === i); });
  }
  if (hasG && !reduced) {
    var tl = gsap.timeline({
      scrollTrigger: { trigger: '.devices__pin', start: 'top top', end: mobile ? '+=220%' : '+=320%', pin: true, scrub: 1, anticipatePin: 1,
        onUpdate: function (st) { setChapter(Math.min(3, Math.floor(st.progress * 4))); D.querySelectorAll('.glare').forEach(function (g) { g.style.setProperty('--gx', (100 - st.progress * 100) + '%'); }); } }
    });
    tl.fromTo(lid, { rotateX: -88 }, { rotateX: 6, duration: 1.2, ease: 'power2.inOut' }, 0)
      .fromTo(laptop, { rotateX: 32, rotateY: 26, rotateZ: -4, y: 60, scale: .9 }, { rotateX: 12, rotateY: 14, rotateZ: -1, y: 0, scale: 1, duration: 1.2, ease: 'power2.out' }, 0)
      .fromTo(phone, { rotateY: -200, rotateX: 18, rotateZ: 10, y: 140, opacity: .2 }, { rotateY: -24, rotateX: 8, rotateZ: 3, y: 0, opacity: 1, duration: 1.2, ease: 'power3.out' }, 0)
      .to(phone, { rotateY: -8, rotateX: 2, rotateZ: 0, y: -20, duration: 1.4, ease: 'sine.inOut' }, 1.2)
      .to(laptop, { rotateY: 8, rotateX: 8, duration: 1.4, ease: 'sine.inOut' }, 1.2)
      .to(phone, { rotateY: -36, rotateZ: 5, y: 10, duration: 1.4, ease: 'sine.inOut' }, 2.6)
      .to(laptop, { rotateY: 20, rotateX: 14, duration: 1.4, ease: 'sine.inOut' }, 2.6);
    setChapter(0);
  } else {
    lid.style.transform = 'rotateX(4deg)';
    var k = 0; setChapter(0);
    if (!reduced) setInterval(function () { k = (k + 1) % 4; setChapter(k); }, 3500);
    chapters.forEach(function (c, i) { c.addEventListener('click', function () { setChapter(i); }); });
  }

  /* ---------- Reveals ---------- */
  if (hasG && !reduced) {
    ScrollTrigger.batch('.card, .dlcard', { start: 'top 88%', once: true, onEnter: function (b) { gsap.fromTo(b, { opacity: 0, y: 70, rotateX: -14, scale: .96 }, { opacity: 1, y: 0, rotateX: 0, scale: 1, stagger: .09, duration: 1, ease: 'expo.out', clearProps: 'transform' }); } });
    $$('section:not(.hero) .lead, section:not(.hero) .kicker').forEach(function (el) { gsap.from(el, { opacity: 0, y: 24, duration: .9, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true } }); });
    gsap.fromTo('.marquee', { xPercent: 4 }, { xPercent: -6, ease: 'none', scrollTrigger: { trigger: '.marquee', start: 'top bottom', end: 'bottom top', scrub: true } });
    gsap.to('.hero__inner', { yPercent: 22, opacity: .15, scale: .94, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.from('.final__inner', { scale: .8, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.final', start: 'top 75%', once: true } });
  }

  /* ---------- Galería horizontal ---------- */
  var track = $('#gtrack');
  if (hasG && !reduced && !mobile && track) {
    var getX = function () { return -(track.scrollWidth - window.innerWidth); };
    var shots = $$('.shot', track);
    gsap.to(track, { x: getX, ease: 'none', scrollTrigger: { trigger: '.gallery__pin', start: 'top top', end: function () { return '+=' + (track.scrollWidth - window.innerWidth); }, pin: true, scrub: 1, invalidateOnRefresh: true,
      onUpdate: function (st) { var v = gsap.utils.clamp(-25, 25, st.getVelocity() / 120); shots.forEach(function (s) { s.style.transform = 'rotateY(' + (-v) + 'deg) skewX(' + (v * .2) + 'deg)'; }); } } });
    ScrollTrigger.addEventListener('scrollEnd', function () { shots.forEach(function (s) { gsap.to(s, { rotateY: 0, skewX: 0, duration: .6, ease: 'power3.out', overwrite: true, onComplete: function () { s.style.transform = ''; } }); }); });
  }

  /* ---------- Demos de las tarjetas ---------- */
  var typed = $('#chatdemo .typed');
  onView($('#chatdemo'), function () { typeInto(typed, typed.getAttribute('data-type'), 28); });

  // Pintar la imagen
  (function () {
    var box = $('#paint'); if (!box) return; var c = $('canvas', box), lbl = $('.paint__lbl', box), x = c.getContext('2d');
    function paint() {
      var w = c.width = box.clientWidth, h = c.height = box.clientHeight; if (!w) return;
      x.fillStyle = '#0b0920'; x.fillRect(0, 0, w, h);
      if (reduced) { x.clearRect(0, 0, w, h); lbl.style.opacity = 0; return; }
      lbl.style.opacity = 1;
      var cell = 14, cols = Math.ceil(w / cell), rows = Math.ceil(h / cell), cells = [];
      for (var i = 0; i < cols; i++) for (var j = 0; j < rows; j++) cells.push([i, j, Math.hypot(i - cols / 2, j - rows / 2) + Math.random() * 6]);
      cells.sort(function (a, b) { return a[2] - b[2]; });
      var k = 0; x.globalCompositeOperation = 'destination-out';
      (function st() {
        var n = Math.ceil(cells.length / 60);
        for (var q = 0; q < n && k < cells.length; q++, k++) { var e = cells[k]; x.fillRect(e[0] * cell, e[1] * cell, cell, cell); }
        if (k < cells.length) requestAnimationFrame(st); else { x.globalCompositeOperation = 'source-over'; lbl.style.opacity = 0; setTimeout(function () { onView(box, paint); }, 5000); }
      })();
    }
    onView(box, paint);
  })();

  // Pasos del agente
  (function () {
    var lis = $$('#steps li'); if (!lis.length) return;
    function run() {
      lis.forEach(function (l) { l.classList.remove('run', 'done'); });
      if (reduced) { lis.forEach(function (l) { l.classList.add('done'); }); return; }
      var i = 0;
      (function nx() { if (i > 0) { lis[i - 1].classList.remove('run'); lis[i - 1].classList.add('done'); } if (i < lis.length) { lis[i].classList.add('run'); i++; setTimeout(nx, 650); } else setTimeout(function () { onView($('#steps'), run); }, 3500); })();
    }
    onView($('#steps'), run);
  })();

  // Código
  (function () {
    var el = $('#code .typed-code'); if (!el) return;
    var src = el.getAttribute('data-type');
    function hl(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/ ([a-z]+)=("[^"]*")/g, ' <span class="at">$1</span>=<span class="st">$2</span>').replace(/(&lt;\/?)([a-z0-9]+)/g, '$1<span class="tg">$2</span>'); }
    onView($('#code'), function () {
      if (reduced) { el.innerHTML = hl(src); return; }
      var i = 0; (function t() { i += 2; el.innerHTML = hl(src.slice(0, i)); if (i < src.length) setTimeout(t, 22); })();
    });
  })();

  // Terminal (comandos de ejemplo)
  (function () {
    var body = $('#term .term__body'); if (!body) return;
    var lines = [['$ ', 'pkg install python'], ['', 'Instalando paquetes…'], ['$ ', 'python -c "print(\'Hola, Nebula ✦\')"'], ['', 'Hola, Nebula ✦'], ['$ ', 'nano app.py']];
    function run() {
      body.innerHTML = '';
      if (reduced) { lines.forEach(function (l) { body.innerHTML += (l[0] ? '<span class="p">~ $</span> <span class="c">' + l[1].replace(/</g, '&lt;') + '</span>' : l[1]) + '\n'; }); return; }
      var li = 0;
      (function next() {
        if (li >= lines.length) { setTimeout(function () { onView(body, run); }, 4000); return; }
        var l = lines[li++], row = D.createElement('div');
        body.appendChild(row);
        if (l[0]) { row.innerHTML = '<span class="p">~ $</span> <span class="c"></span>'; typeInto($('.c', row), l[1], 45, function () { setTimeout(next, 350); }); }
        else { row.textContent = l[1]; setTimeout(next, 500); }
      })();
    }
    onView(body, run);
  })();

  // Órbita de conectores
  $$('.orbit__ring span').forEach(function (s, i) { s.style.setProperty('--i', i); s.innerHTML = '<b>' + s.textContent + '</b>'; });
  // Onda de voz
  (function () { var w = $('#wave'); if (!w) return; for (var i = 0; i < 34; i++) { var b = D.createElement('i'); b.style.setProperty('--i', i); b.style.setProperty('--h', (Math.sin(i * .5) * .5 + .5) * (.4 + Math.random() * .6)); w.appendChild(b); } })();
  // Texto cifrado
  (function () {
    var el = $('#cipher'); if (!el || reduced) return; var hex = '0123456789abcdef';
    setInterval(function () { if (el.getBoundingClientRect().top > window.innerHeight) return; var s = 'AES-GCM · '; for (var i = 0; i < 24; i++) s += hex[(Math.random() * 16) | 0]; el.textContent = s; }, 120);
  })();

  /* ---------- Modelos ---------- */
  (function () {
    var temps = ['0.3', '0.7', '0.9', '1.0'];
    var toks = [[1024, 2048, 4096], [2048, 4096, 8192], [4096, 8192, 16384], [8192, 16384, 32768]];
    var reas = [['low', 'low', 'medium'], ['low', 'medium', 'high'], ['medium', 'high', 'xhigh'], ['high', 'high', 'xhigh']];
    var mNames = ['FLASH', 'PRO', 'ULTRA'], pNames = ['Baja', 'Media', 'Alta', 'Max'];
    var m = 1, p = 1, range = $('#power'), core = $('#core'), tokEl = $('#p-tok'), lastTok = 4096;
    function upd() {
      $('#power-lbl').textContent = pNames[p];
      range.style.setProperty('--fill', (p / 3 * 100) + '%');
      $('#p-temp').textContent = temps[p];
      $('#p-rea').textContent = reas[p][m];
      var to = toks[p][m];
      if (hasG && !reduced) { var o = { v: lastTok }; gsap.to(o, { v: to, duration: .7, ease: 'power2.out', onUpdate: function () { tokEl.textContent = Math.round(o.v); } }); } else tokEl.textContent = to;
      lastTok = to;
      var lvl = (m * 4 + p) / 11;
      core.style.setProperty('--spd', (0.6 + lvl * 2.6).toFixed(2));
      core.style.setProperty('--sz', (0.75 + lvl * 0.75).toFixed(2));
      $('#core-lbl').textContent = mNames[m] + ' · ' + pNames[p].toUpperCase();
      $$('#model-seg button').forEach(function (b, i) { b.classList.toggle('on', i === m); b.setAttribute('aria-checked', i === m); });
    }
    $$('#model-seg button').forEach(function (b, i) { b.addEventListener('click', function () { m = i; upd(); if (hasG && !reduced) gsap.fromTo('.core__ball', { scale: 1.35 }, { scale: 1, duration: .8, ease: 'elastic.out(1,.4)' }); }); });
    range.addEventListener('input', function () { p = +range.value; upd(); });
    upd();
  })();

  /* ---------- Pestañas ---------- */
  $$('.tabs button').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('.tabs button').forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-selected', on); D.getElementById(x.getAttribute('aria-controls')).hidden = !on; });
      if (hasG && !reduced) gsap.from('#' + b.getAttribute('aria-controls') + ' li', { opacity: 0, x: -20, stagger: .07, duration: .5, ease: 'power2.out' });
    });
  });

  /* ---------- Salto al hiperespacio al descargar ---------- */
  var flash = $('#warp-flash');
  $$('.dl-link').forEach(function (a) {
    a.addEventListener('click', function () {
      if (reduced) return;
      if (window.NebulaBG) window.NebulaBG.warp(1300);
      if (hasG) gsap.fromTo(flash, { opacity: 0 }, { opacity: .85, duration: .5, ease: 'power2.in', yoyo: true, repeat: 1 });
    });
  });

  /* Vídeo: pausar al salir */
  var vid = $('#demo-video');
  if (vid && 'IntersectionObserver' in window) new IntersectionObserver(function (es) { es.forEach(function (e) { if (!e.isIntersecting && !vid.paused) vid.pause(); }); }, { threshold: .1 }).observe(vid);

  window.addEventListener('load', function () { if (hasG) ScrollTrigger.refresh(); });
})();
