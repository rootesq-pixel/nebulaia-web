/* Fondo de nebulosa en WebGL (shader propio). Expone window.NebulaBG. */
(function () {
  'use strict';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = window.matchMedia('(max-width: 760px), (pointer: coarse)').matches;
  var canvas = document.getElementById('nebula');
  var api = { ok: false, warp: function () {}, scroll: 0, vel: 0 };
  window.NebulaBG = api;
  if (!canvas) return;
  var gl = null;
  try { gl = canvas.getContext('webgl', { antialias: false, alpha: false, powerPreference: 'high-performance', preserveDrawingBuffer: false }); } catch (e) { gl = null; }
  if (!gl) { document.documentElement.classList.add('no-webgl'); canvas.style.display = 'none'; return; }

  var vs = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var fs = [
    'precision highp float;',
    'uniform vec2 uRes;uniform float uTime;uniform vec2 uMouse;uniform float uScroll;uniform float uWarp;uniform float uOct;',
    'float h21(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}',
    'float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}',
    'float fbm(vec2 p){float v=0.,a=.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);for(int i=0;i<6;i++){if(float(i)>=uOct)break;v+=a*noise(p);p=m*p;a*=.5;}return v;}',
    'float starL(vec2 uv,float sc,float seed){vec2 g=uv*sc;vec2 id=floor(g);vec2 f=fract(g)-.5;float h=h21(id+seed);if(h<.86)return 0.;vec2 o=vec2(h21(id+seed+1.3),h21(id+seed+7.1))-.5;float d=length(f-o*.7);float tw=.55+.45*sin(uTime*(1.5+h*3.)+h*50.);return smoothstep(.09*(h-.8)*6.,0.,d)*tw;}',
    'void main(){',
    ' vec2 uv=(gl_FragCoord.xy-.5*uRes)/uRes.y;',
    ' vec2 m=(uMouse-.5)*vec2(uRes.x/uRes.y,1.);',
    ' float w=uWarp;',
    ' float r=length(uv);',
    ' vec2 p=uv*(1.-w*.35)+m*.06;',
    ' float t=uTime*.035;float s=uScroll;',
    ' p+=vec2(s*.15,-s*.35);',
    ' mat2 rot=mat2(cos(s*.25),-sin(s*.25),sin(s*.25),cos(s*.25));p=rot*p;',
    ' vec2 q=vec2(fbm(p*1.5+vec2(0.,t)),fbm(p*1.5+vec2(5.2,1.3)-t));',
    ' vec2 rr=vec2(fbm(p*1.5+3.5*q+vec2(1.7,9.2)+t*.6),fbm(p*1.5+3.5*q+vec2(8.3,2.8)-t*.4));',
    ' float f=fbm(p*1.5+3.5*rr);',
    ' vec3 col=vec3(.012,.008,.03);',
    ' col=mix(col,vec3(.42,.17,.86),clamp(f*f*2.2,0.,1.));',
    ' col=mix(col,vec3(.08,.72,.86),clamp(dot(q,q)*.55-.22,0.,1.)*.55);',
    ' col=mix(col,vec3(.93,.25,.6),clamp(rr.y*rr.y*1.4-.35,0.,1.)*.6);',
    ' col*=.25+1.25*f*f*f+.15*f;',
    ' float md=dot(uv-m,uv-m);col+=vec3(.55,.4,1.)*.10/(1.+18.*md);',
    ' col+=vec3(.6,.4,1.)*.08*exp(-r*r*2.5);',
    ' col*=smoothstep(1.55,.15,r);',
    ' float st=0.;',
    ' for(int i=0;i<8;i++){float k=float(i)/7.;vec2 su=uv*(1.-w*.18*k);st+=(starL(su,48.,0.)+starL(su*1.7+3.1,48.,11.)*.6)*(1.-k*.75)*(i==0?1.:w);}',
    ' st+=starL(uv+m*.02,120.,5.)*.5;',
    ' col+=vec3(.85,.88,1.)*st*(1.+w*1.5);',
    ' col+=vec3(.7,.6,1.)*w*w*.5*exp(-r*1.5);',
    ' col=1.-exp(-col*1.6);',
    ' gl_FragColor=vec4(col,1.);',
    '}'
  ].join('\n');

  function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.warn(gl.getShaderInfoLog(s)); return null; } return s; }
  var v = sh(gl.VERTEX_SHADER, vs), f = sh(gl.FRAGMENT_SHADER, fs);
  if (!v || !f) { document.documentElement.classList.add('no-webgl'); canvas.style.display = 'none'; return; }
  var prog = gl.createProgram(); gl.attachShader(prog, v); gl.attachShader(prog, f); gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { document.documentElement.classList.add('no-webgl'); canvas.style.display = 'none'; return; }
  gl.useProgram(prog);
  var buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  var loc = gl.getAttribLocation(prog, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  var U = {}; ['uRes', 'uTime', 'uMouse', 'uScroll', 'uWarp', 'uOct'].forEach(function (n) { U[n] = gl.getUniformLocation(prog, n); });
  api.ok = true;

  var scale = mobile ? 0.45 : Math.min(0.75, 1.1 / (window.devicePixelRatio || 1) + 0.15);
  var W = 0, H = 0;
  function resize() {
    W = Math.max(2, Math.floor(window.innerWidth * scale)); H = Math.max(2, Math.floor(window.innerHeight * scale));
    canvas.width = W; canvas.height = H; gl.viewport(0, 0, W, H);
    if (reduced || !running) draw(performance.now());
  }
  var mouse = [0.5, 0.5], tm = [0.5, 0.5], warp = 0, warpT = 0, scrollS = 0, t0 = performance.now(), running = true, last = 0;
  window.addEventListener('pointermove', function (e) { tm[0] = e.clientX / window.innerWidth; tm[1] = 1 - e.clientY / window.innerHeight; }, { passive: true });
  api.warp = function (d) { if (reduced) return; warpT = 1; setTimeout(function () { warpT = 0; }, d || 1100); };
  function draw(now) {
    var time = reduced ? 12 : (now - t0) / 1000;
    mouse[0] += (tm[0] - mouse[0]) * 0.05; mouse[1] += (tm[1] - mouse[1]) * 0.05;
    var maxS = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    var target = (window.scrollY / maxS) * 4.0;
    scrollS += (target - scrollS) * (reduced ? 1 : 0.06);
    var velWarp = Math.min(0.35, Math.abs(api.vel || 0) * 0.012);
    warp += (Math.max(warpT, velWarp) - warp) * (warpT > warp ? 0.08 : 0.05);
    gl.uniform2f(U.uRes, W, H); gl.uniform1f(U.uTime, time); gl.uniform2f(U.uMouse, mouse[0], mouse[1]);
    gl.uniform1f(U.uScroll, scrollS); gl.uniform1f(U.uWarp, warp); gl.uniform1f(U.uOct, mobile ? 4 : 6);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function loop(now) {
    if (!running) return;
    requestAnimationFrame(loop);
    if (mobile && now - last < 31) return; // ~30 fps en móvil
    last = now; draw(now);
  }
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', function () { running = !document.hidden && !reduced; if (running) requestAnimationFrame(loop); });
  canvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); running = false; document.documentElement.classList.add('no-webgl'); canvas.style.display = 'none'; });
  if (reduced) { running = false; resize(); window.addEventListener('scroll', function () { draw(performance.now()); }, { passive: true }); }
  else { resize(); requestAnimationFrame(loop); }
})();
