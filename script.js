(() => {
  const N = 8;
  const ICE = 8, CRACK = 9;
  const RAW = [
    [2,[[0,0]]],
    [4,[[0,0],[0,1]]],[4,[[0,0],[1,0]]],
    [5,[[0,0],[0,1],[0,2]]],[5,[[0,0],[1,0],[2,0]]],
    [4,[[0,0],[0,1],[0,2],[0,3]]],[4,[[0,0],[1,0],[2,0],[3,0]]],
    [2,[[0,0],[0,1],[0,2],[0,3],[0,4]]],[2,[[0,0],[1,0],[2,0],[3,0],[4,0]]],
    [6,[[0,0],[0,1],[1,0],[1,1]]],
    [2,[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]]],
    [2,[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2]]],[2,[[0,0],[0,1],[1,0],[1,1],[2,0],[2,1]]],
    [3,[[0,0],[1,0],[1,1]]],[3,[[0,0],[0,1],[1,0]]],[3,[[0,0],[0,1],[1,1]]],[3,[[0,1],[1,0],[1,1]]],
    [2,[[0,0],[1,0],[2,0],[2,1],[2,2]]],[2,[[0,0],[0,1],[0,2],[1,0],[2,0]]],[2,[[0,0],[0,1],[0,2],[1,2],[2,2]]],[2,[[0,2],[1,2],[2,0],[2,1],[2,2]]],
    [2,[[0,0],[0,1],[0,2],[1,1]]],[2,[[0,1],[1,0],[1,1],[1,2]]],[2,[[0,0],[1,0],[2,0],[1,1]]],[2,[[0,1],[1,1],[2,1],[1,0]]],
    [2,[[0,1],[0,2],[1,0],[1,1]]],[2,[[0,0],[0,1],[1,1],[1,2]]],[2,[[0,0],[1,0],[1,1],[2,1]]],[2,[[0,1],[1,1],[1,0],[2,0]]],
    [2,[[0,0],[1,0],[2,0],[2,1]]],[2,[[0,0],[0,1],[0,2],[1,0]]],[2,[[0,0],[0,1],[1,1],[2,1]]],[2,[[0,2],[1,0],[1,1],[1,2]]]
  ];
  const SHAPES = RAW.map(([w, c]) => ({ w, c, rows: Math.max(...c.map(p => p[0])) + 1, cols: Math.max(...c.map(p => p[1])) + 1 }));
  const TOTAL_W = SHAPES.reduce((s, x) => s + x.w, 0);

  const SKINS = [
    { id: 'classic', name: 'Clásico', price: 0 },
    { id: 'jelly', name: 'Gelatina', price: 200 },
    { id: 'wood', name: 'Madera', price: 300 },
    { id: 'stone', name: 'Piedra', price: 350 },
    { id: 'metal', name: 'Metálico', price: 400 },
    { id: 'candy', name: 'Dulce', price: 450 },
    { id: 'pixel', name: 'Pixel retro', price: 500 },
    { id: 'neon', name: 'Neón', price: 650 },
    { id: 'crystal', name: 'Cristal', price: 750 }
  ];
  const BOARDS = [
    { id: 'night', name: 'Noche', price: 0 },
    { id: 'woodlight', name: 'Madera clara', price: 200 },
    { id: 'wooddark', name: 'Madera oscura', price: 250 },
    { id: 'steel', name: 'Metálico', price: 350 },
    { id: 'jungle', name: 'Jungla', price: 350 },
    { id: 'future', name: 'Futurista', price: 450 },
    { id: 'retropunk', name: 'Retropunk', price: 550 }
  ];
  const POWERS = {
    hammer: { name: 'Martillo', desc: 'Rompe un bloque del tablero, incluso el hielo.', price: 60 },
    swap: { name: 'Cambiar piezas', desc: 'Cambia las piezas que te quedan por otras nuevas.', price: 40 },
    bomb: { name: 'Bomba', desc: 'Limpia un área de 3x3 en el tablero.', price: 100 }
  };
  const DAY_REWARDS = [10, 15, 20, 25, 30, 40, 75];
  const DAILY_REWARD_COINS = 50;
  const WEEKDAYS = ['D', 'L', 'K', 'M', 'J', 'V', 'S'];

  const $ = id => document.getElementById(id);
  const root = document.documentElement;
  const boardEl = $('board'), boardWrap = $('boardWrap'), fxEl = $('fx'), scoreEl = $('score'), bestEl = $('best'), hintEl = $('hint');
  const slots = [...document.querySelectorAll('.slot')];
  const show = (id, v) => { $(id).hidden = !v; };

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  const settings = Object.assign({ sound: true, music: true, vibra: true }, store.get('bloquetico_settings', {}));
  let best = +store.get('bloquetico_best', 0) || 0;
  const STAT0 = { games: 0, lines: 0, pieces: 0, maxCombo: 0, maxMulti: 0, clean: 0, power: 0, stars: 0, ice: 0, daily: 0, bestStreak: 0 };
  const prog = Object.assign({
    coins: 0, streak: 0, lastClaim: null, daily: {}, theme: 'classic', owned: ['classic'], board: 'night', ownedBoards: ['night'],
    items: { hammer: 1, swap: 1, bomb: 1 }, adv: 1, ach: {}, missions: null, tutDone: false
  }, store.get('bloquetico_prog', {}));
  prog.stats = Object.assign({}, STAT0, prog.stats || {});
  prog.items = Object.assign({ hammer: 0, swap: 0, bomb: 0 }, prog.items);
  if (!SKINS.some(t => t.id === prog.theme)) prog.theme = 'classic';
  if (!BOARDS.some(t => t.id === prog.board)) prog.board = 'night';
  prog.owned = prog.owned.filter(id => SKINS.some(t => t.id === id));
  if (!prog.owned.includes('classic')) prog.owned.unshift('classic');
  prog.stats.bestStreak = Math.max(prog.stats.bestStreak, prog.streak || 0);
  if (prog.stats.daily < Object.keys(prog.daily).length) prog.stats.daily = Object.keys(prog.daily).length;
  const saveProg = () => store.set('bloquetico_prog', prog);

  /* ================= Fechas y azar ================= */
  const pad = n => String(n).padStart(2, '0');
  const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayKey = () => keyOf(new Date());
  const dayNum = k => { const [y, m, d] = k.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const dailyTarget = k => [800, 1000, 1200, 1500][hashStr('meta' + k) % 4];
  function seeded(seed) {
    let a = seed | 0;
    return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }

  /* ================= Estado de partida ================= */
  // mode: 'classic' | 'daily' | 'adv'
  let mode = 'classic', board, stars = new Set(), tray, score = 0, shown = 0, combo = 0, over = false, usedContinue = false, bestAtStart = 0;
  let rngState = 0, dailyKey = null, target = 0, goalHit = false, coinsGiven = 0;
  let level = 1, goal = null, piecesLeft = 0, advLines = 0, advStars = 0, iceHits = 0, usedMore = false;
  let placedCount = 0, recordShown = false, gameCounted = false, tutorial = false, targeting = null, overReason = 'stuck';

  function rnd() {
    if (mode === 'classic') return Math.random();
    rngState = (rngState + 0x6D2B79F5) | 0;
    let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /* ================= Vibración ================= */
  function vib(p) { if (!settings.vibra) return; try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} }

  /* ================= Audio original generado por código ================= */
  const Sound = (() => {
    let ctx = null, sfx, mus, noiseBuf, timer = null, nextT = 0, step = 0, mel = 4;
    const midi = m => 440 * Math.pow(2, (m - 69) / 12);
    const PENTA = [0, 2, 4, 7, 9];
    const pnote = n => 261.63 * Math.pow(2, (Math.floor(n / 5) * 12 + PENTA[((n % 5) + 5) % 5]) / 12);
    function init() {
      if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      ctx = new AC();
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -16; comp.ratio.value = 3; comp.connect(ctx.destination);
      sfx = ctx.createGain(); sfx.gain.value = settings.sound ? 1 : 0; sfx.connect(comp);
      mus = ctx.createGain(); mus.gain.value = 0; mus.connect(comp);
      noiseBuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.4), ctx.sampleRate);
      const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      if (settings.music) startMusic();
    }
    function tone(f, t, dur, o = {}) {
      const { type = 'sine', vol = .2, att = .006, dest = sfx, slide = 0 } = o;
      const osc = ctx.createOscillator(), g = ctx.createGain();
      osc.type = type; osc.frequency.setValueAtTime(f, t);
      if (slide) osc.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + dur);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol, t + att);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(g); g.connect(dest); osc.start(t); osc.stop(t + dur + .03);
    }
    function noise(t, dur, vol, freq, dest = sfx, type = 'bandpass') {
      const s = ctx.createBufferSource(); s.buffer = noiseBuf;
      const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = 1.4;
      const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(dest); s.start(t); s.stop(t + dur + .02);
    }
    const ok = () => ctx && settings.sound && ctx.state === 'running';
    const BPM = 94, E = 60 / BPM / 2;
    const ROOTS = [48, 45, 41, 43];
    const CHORDS = [[60,64,67],[57,60,64],[53,57,60],[55,59,62]];
    const SCALE = [60,62,64,67,69,72,74,76,79];
    function playStep(s, t) {
      const ci = Math.floor(s / 16) % 4, pos = s % 16;
      if (pos === 0 || pos === 8) tone(midi(ROOTS[ci]), t, E * 6, { type: 'triangle', vol: .2, dest: mus });
      if (pos === 6 || pos === 14) tone(midi(ROOTS[ci] + 7), t, E * 2, { type: 'triangle', vol: .1, dest: mus });
      if (pos % 4 === 2) CHORDS[ci].forEach(m => tone(midi(m), t, E * 1.8, { vol: .03, dest: mus }));
      if (pos % 2 === 1) noise(t, .03, .012, 9000, mus);
      const phraseEnd = (Math.floor(s / 16) % 2 === 1) && pos >= 12;
      if (!phraseEnd && Math.random() < (pos % 2 === 0 ? .55 : .2)) {
        mel += [-2, -1, -1, 0, 1, 1, 2][Math.floor(Math.random() * 7)];
        mel = Math.max(0, Math.min(SCALE.length - 1, mel));
        const m = SCALE[mel];
        tone(midi(m), t, .45, { vol: .085, dest: mus });
        tone(midi(m + 12), t, .1, { vol: .025, dest: mus });
      }
    }
    function sched() { while (nextT < ctx.currentTime + .15) { playStep(step, nextT); nextT += E; step++; } }
    function startMusic() {
      if (!ctx || timer) return;
      mus.gain.cancelScheduledValues(ctx.currentTime);
      mus.gain.setTargetAtTime(.55, ctx.currentTime, .9);
      nextT = ctx.currentTime + .1; timer = setInterval(sched, 30);
    }
    function stopMusic() {
      if (!ctx || !timer) return;
      clearInterval(timer); timer = null;
      mus.gain.cancelScheduledValues(ctx.currentTime);
      mus.gain.setTargetAtTime(0, ctx.currentTime, .15);
    }
    return {
      init,
      setSound(v) { if (sfx) sfx.gain.value = v ? 1 : 0; },
      setMusic(v) { v ? startMusic() : stopMusic(); },
      suspend() { ctx && ctx.suspend(); },
      resume() { ctx && ctx.resume(); },
      tap() { if (!ok()) return; tone(880, ctx.currentTime, .06, { vol: .05 }); },
      pick() { if (!ok()) return; tone(520, ctx.currentTime, .1, { vol: .12, slide: 1.6 }); },
      place() { if (!ok()) return; const t = ctx.currentTime; tone(190, t, .15, { type: 'triangle', vol: .38, slide: .5 }); noise(t, .05, .12, 1600); },
      back() { if (!ok()) return; tone(420, ctx.currentTime, .12, { vol: .08, slide: .6 }); },
      bad() { if (!ok()) return; const t = ctx.currentTime; tone(160, t, .09, { type: 'square', vol: .045 }); tone(130, t + .1, .12, { type: 'square', vol: .045 }); },
      clear(lines, c) {
        if (!ok()) return; const t = ctx.currentTime;
        const base = 5 + Math.min(c - 1, 6), count = 2 + lines * 2;
        for (let i = 0; i < count; i++) { const tt = t + i * .055, f = pnote(base + i); tone(f, tt, .38, { type: 'triangle', vol: .15 }); tone(f * 2, tt, .22, { vol: .05 }); }
        noise(t, .3, .06, 6000);
      },
      clean() { if (!ok()) return; const t = ctx.currentTime + .25; [10, 12, 14, 15].forEach((n, i) => tone(pnote(n), t + i * .03, 1.1, { type: 'triangle', vol: .12 })); },
      over() { if (!ok()) return; const t = ctx.currentTime; [9, 7, 5, 2].forEach((n, i) => tone(pnote(n), t + i * .2, .5, { type: 'triangle', vol: .14 })); },
      record() { if (!ok()) return; const t = ctx.currentTime + .1; [5, 7, 9, 10, 12].forEach((n, i) => tone(pnote(n), t + i * .09, .45, { type: 'triangle', vol: .14 })); },
      win() { if (!ok()) return; const t = ctx.currentTime; [5, 7, 9, 10, 12, 14, 15].forEach((n, i) => tone(pnote(n), t + i * .08, .5, { type: 'triangle', vol: .14 })); },
      coins() { if (!ok()) return; const t = ctx.currentTime; for (let i = 0; i < 5; i++) { tone(1320 + i * 90, t + i * .07, .14, { vol: .07 }); tone(1980 + i * 90, t + i * .07, .08, { vol: .03 }); } },
      reward() { if (!ok()) return; const t = ctx.currentTime; for (let i = 0; i < 9; i++) tone(pnote(10 + Math.floor(Math.random() * 6)), t + i * .06, .25, { vol: .07 }); },
      star() { if (!ok()) return; const t = ctx.currentTime; [1568, 2093, 2637].forEach((f, i) => tone(f, t + i * .05, .3, { vol: .06 })); },
      ice() { if (!ok()) return; const t = ctx.currentTime; noise(t, .12, .12, 5000, sfx, 'highpass'); tone(2400, t, .08, { vol: .04, slide: .7 }); },
      hammer() { if (!ok()) return; const t = ctx.currentTime; tone(120, t, .18, { type: 'square', vol: .12, slide: .5 }); noise(t, .12, .2, 900); },
      bomb() { if (!ok()) return; const t = ctx.currentTime; tone(90, t, .5, { type: 'sawtooth', vol: .18, slide: .3 }); noise(t, .5, .35, 400, sfx, 'lowpass'); },
      swap() { if (!ok()) return; const t = ctx.currentTime; tone(400, t, .12, { vol: .1, slide: 2 }); tone(800, t + .1, .12, { vol: .1, slide: .5 }); },
      mission() { if (!ok()) return; const t = ctx.currentTime; [7, 9, 12].forEach((n, i) => tone(pnote(n), t + i * .1, .35, { type: 'triangle', vol: .12 })); }
    };
  })();
  document.addEventListener('visibilitychange', () => document.hidden ? Sound.suspend() : Sound.resume());

  /* ================= Partículas ================= */
  const canvas = $('sparks'), g2 = canvas.getContext('2d');
  let parts = [], raf = 0;
  function sizeCanvas() {
    const r = canvas.getBoundingClientRect(), dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
    g2.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const colorOf = n => n >= ICE ? '#d8f3ff' : (getComputedStyle(root).getPropertyValue('--c' + n).trim() || '#fff');
  function burst(idx, color, count = 6) {
    const cr = cells[idx].getBoundingClientRect(), kr = canvas.getBoundingClientRect();
    const x = cr.left - kr.left + cr.width / 2, y = cr.top - kr.top + cr.height / 2;
    for (let i = 0; i < count; i++) parts.push({ x, y, vx: (Math.random() - .5) * 6, vy: -Math.random() * 4.5 - 1, s: 4 + Math.random() * 5, life: 1, rot: Math.random() * 6, vr: (Math.random() - .5) * .4, color });
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    const kr = canvas.getBoundingClientRect();
    g2.clearRect(0, 0, kr.width, kr.height);
    parts = parts.filter(p => p.life > 0);
    for (const p of parts) {
      p.vy += .2; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= .022;
      g2.save(); g2.globalAlpha = Math.max(0, p.life); g2.translate(p.x, p.y); g2.rotate(p.rot);
      g2.fillStyle = p.color; g2.fillRect(-p.s / 2, -p.s / 2, p.s, p.s); g2.restore();
    }
    raf = parts.length ? requestAnimationFrame(tick) : 0;
  }

  /* ================= Tablero y piezas ================= */
  const cells = [];
  for (let i = 0; i < N * N; i++) { const d = document.createElement('div'); d.className = 'cell'; d.dataset.i = i; boardEl.appendChild(d); cells.push(d); }

  function starChance() {
    if (tutorial) return 0;
    if (mode === 'adv' && goal && goal.type === 'stars') return .3;
    return .06;
  }
  function makePiece() {
    let r = rnd() * TOTAL_W, s = SHAPES[0];
    for (const x of SHAPES) { r -= x.w; if (r <= 0) { s = x; break; } }
    const p = { cells: s.c, rows: s.rows, cols: s.cols, color: 1 + Math.floor(rnd() * 7) };
    if (rnd() < starChance()) p.star = Math.floor(rnd() * s.c.length);
    return p;
  }
  function fits(p, r, c, b = board) {
    for (const [dr, dc] of p.cells) {
      const rr = r + dr, cc = c + dc;
      if (rr < 0 || cc < 0 || rr >= N || cc >= N || b[rr * N + cc]) return false;
    }
    return true;
  }
  function canAnywhere(p) {
    for (let r = 0; r <= N - p.rows; r++) for (let c = 0; c <= N - p.cols; c++) if (fits(p, r, c)) return true;
    return false;
  }
  function newTray() {
    for (let t = 0; t < 40; t++) { const tr = [makePiece(), makePiece(), makePiece()]; if (tr.some(canAnywhere)) return tr; }
    return [{ cells: [[0,0]], rows: 1, cols: 1, color: 2 }, makePiece(), makePiece()];
  }
  function clears(b) {
    const set = new Set(); let lines = 0;
    for (let r = 0; r < N; r++) { let full = true; for (let c = 0; c < N; c++) if (!b[r * N + c]) { full = false; break; } if (full) { lines++; for (let c = 0; c < N; c++) set.add(r * N + c); } }
    for (let c = 0; c < N; c++) { let full = true; for (let r = 0; r < N; r++) if (!b[r * N + c]) { full = false; break; } if (full) { lines++; for (let r = 0; r < N; r++) set.add(r * N + c); } }
    return { lines, set };
  }

  function renderBoard(pv) {
    for (let i = 0; i < N * N; i++) {
      const el = cells[i], v = board[i];
      let cls = 'cell', col = v;
      if (pv && pv.clear.has(i)) { cls += ' f wc'; col = v >= ICE ? v : pv.color; }
      else if (pv && pv.set.has(i)) { cls += ' f pv'; col = pv.color; if (pv.star === i) cls += ' star'; }
      else if (v) cls += ' f';
      if (col >= ICE) cls += ' ice' + (col === CRACK ? ' crack' : '');
      else if (v && stars.has(i) && !(pv && pv.set.has(i))) cls += ' star';
      el.className = cls; el.style.animationDelay = '';
      if (col && col < ICE) el.style.setProperty('--c', `var(--c${col})`); else if (col >= ICE) el.style.setProperty('--c', '#bfe9ff'); else el.style.removeProperty('--c');
    }
  }
  function preview(p, r, c) {
    const tmp = board.slice(), set = new Set(); let star = -1;
    p.cells.forEach(([dr, dc], k) => { const i = (r + dr) * N + c + dc; tmp[i] = p.color; set.add(i); if (p.star === k) star = i; });
    return { set, clear: clears(tmp).set, color: p.color, star };
  }
  function geometry() {
    const r0 = cells[0].getBoundingClientRect(), r1 = cells[1].getBoundingClientRect();
    return { r0, pitch: r1.left - r0.left, size: r0.width };
  }
  const LOCK = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M7 10V8a5 5 0 0 1 10 0v2h1a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1zm2 0h6V8a3 3 0 0 0-6 0z"/></svg>';
  function renderTray(deal) {
    const { size } = geometry();
    const slotW = slots[0].clientWidth || 100;
    const mini = Math.max(10, Math.floor(Math.min((slotW - 8) / 5.5, size * 0.62)));
    slots.forEach((s, i) => {
      s.innerHTML = ''; s.classList.remove('lifted', 'dead', 'fresh');
      const p = tray[i]; if (!p) return;
      const m = document.createElement('div'); m.className = 'mini';
      m.style.gridTemplateColumns = `repeat(${p.cols}, ${mini}px)`;
      m.style.gridTemplateRows = `repeat(${p.rows}, ${mini}px)`;
      const filled = new Map(p.cells.map(([r, c], k) => [r * 10 + c, k]));
      for (let r = 0; r < p.rows; r++) for (let c = 0; c < p.cols; c++) {
        const b = document.createElement('div');
        if (filled.has(r * 10 + c)) { b.className = 'blk' + (filled.get(r * 10 + c) === p.star ? ' star' : ''); b.style.setProperty('--c', `var(--c${p.color})`); }
        m.appendChild(b);
      }
      s.appendChild(m);
      if (!canAnywhere(p)) { s.classList.add('dead'); const l = document.createElement('div'); l.className = 'lock'; l.innerHTML = LOCK; s.appendChild(l); }
      if (deal) { s.classList.add('fresh'); s.style.setProperty('--d', (i * 70) + 'ms'); }
    });
    updateDanger();
  }
  function updateDanger() {
    const left = tray.filter(Boolean);
    const ok = left.filter(canAnywhere).length;
    const free = board.filter(v => !v).length;
    boardWrap.classList.toggle('danger', !over && left.length > 0 && (ok < left.length || free <= 12));
  }

  /* ================= Marcador y metas ================= */
  const iceRemaining = () => board.reduce((s, v) => s + (v === ICE ? 2 : v === CRACK ? 1 : 0), 0);
  function advProgress() {
    if (!goal) return 0;
    if (goal.type === 'score') return score;
    if (goal.type === 'lines') return advLines;
    if (goal.type === 'stars') return advStars;
    return iceHits - iceRemaining();
  }
  function goalText(g, prog) {
    const t = g.target;
    if (g.type === 'score') return `Haz ${t} puntos`;
    if (g.type === 'lines') return `Limpia ${t} líneas`;
    if (g.type === 'stars') return `Recoge ${t} estrellas`;
    return `Rompe todo el hielo`;
  }
  function setChip() {
    const icon = $('chipIcon');
    if (mode === 'adv') { icon.style.display = 'none'; bestEl.textContent = `${piecesLeft} piezas`; $('bestChip').title = 'Piezas que te quedan'; }
    else if (mode === 'daily') { icon.style.display = ''; bestEl.textContent = target; $('bestChip').title = 'Meta de hoy'; }
    else { icon.style.display = ''; bestEl.textContent = best; $('bestChip').title = 'Récord'; }
    $('homeBest').textContent = best;
  }
  function setBest() {
    if (mode === 'classic' && score > best) { best = score; store.set('bloquetico_best', best); }
    setChip();
  }
  function updateGoal() {
    const g = $('goal'); g.hidden = mode === 'classic';
    if (mode === 'daily') {
      const done = goalHit || prog.daily[dailyKey];
      $('goalBar').style.width = Math.min(100, score / target * 100) + '%';
      $('goalText').textContent = done ? '¡Meta cumplida!' : `Meta: ${target} · faltan ${Math.max(0, target - score)}`;
      g.classList.toggle('done', !!done);
    } else if (mode === 'adv' && goal) {
      const p = Math.min(goal.target, advProgress());
      $('goalBar').style.width = Math.min(100, p / goal.target * 100) + '%';
      $('goalText').textContent = goal.type === 'ice' ? `Rompe el hielo · ${Math.round(p / goal.target * 100)}%` : `${goalText(goal)} · ${p}/${goal.target}`;
      g.classList.toggle('done', p >= goal.target);
    }
  }
  let countRaf = 0;
  function addScore(gain) {
    score += gain; setBest(); updateGoal();
    cancelAnimationFrame(countRaf);
    const from = shown, to = score, t0 = performance.now();
    const step = now => {
      const k = Math.min(1, (now - t0) / 420);
      shown = Math.round(from + (to - from) * (1 - Math.pow(1 - k, 3)));
      scoreEl.textContent = shown;
      if (k < 1) countRaf = requestAnimationFrame(step);
    };
    countRaf = requestAnimationFrame(step);
    scoreEl.classList.remove('bump'); void scoreEl.offsetWidth; scoreEl.classList.add('bump');
    setTimeout(() => scoreEl.classList.remove('bump'), 160);
    if (mode === 'classic' && !recordShown && bestAtStart > 0 && score > bestAtStart) {
      recordShown = true;
      setTimeout(() => { floatText('¡Nuevo récord!', 'Sigue así', true); Sound.record(); vib([30, 50, 30, 50, 30]); }, 500);
    }
  }
  function setScoreNow(v) { score = shown = v; scoreEl.textContent = v; setBest(); updateGoal(); }
  function floatText(main, sub, big) {
    const d = document.createElement('div'); d.className = 'float' + (big ? ' big' : '');
    d.innerHTML = (sub ? `<i>${sub}</i>` : '') + `<b>${main}</b>`;
    fxEl.appendChild(d); setTimeout(() => d.remove(), 1050);
  }
  function toast(msg) {
    document.querySelectorAll('.toast').forEach(t => t.remove());
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2300);
  }
  function addCoins(n) { prog.coins += n; saveProg(); refreshCoins(); }
  function refreshCoins() { $('homeCoins').textContent = prog.coins; $('themeCoins').textContent = prog.coins; $('buyCoins').textContent = prog.coins; }

  const saveKey = () => mode === 'daily' ? 'bloquetico_daily' : mode === 'adv' ? 'bloquetico_adv' : 'bloquetico_save';
  function save() {
    if (over || tutorial) { if (over) store.del(saveKey()); return; }
    store.set(saveKey(), { board, stars: [...stars], tray, score, combo, usedContinue, bestAtStart, rngState, dailyKey, goalHit, coinsGiven,
      level, goal, piecesLeft, advLines, advStars, iceHits, usedMore, placedCount, recordShown, gameCounted });
  }

  /* ================= Misiones diarias ================= */
  const MISSION_POOL = [
    { id: 'lines', goals: [15, 25, 40], text: n => `Limpia ${n} líneas`, kind: 'add' },
    { id: 'combo', goals: [3, 4], text: n => `Haz un combo x${n}`, kind: 'max' },
    { id: 'games', goals: [2, 3], text: n => `Termina ${n} partidas`, kind: 'add' },
    { id: 'score', goals: [1500, 2500, 4000], text: n => `Haz ${n} puntos en una partida`, kind: 'max' },
    { id: 'power', goals: [1, 2], text: n => n === 1 ? 'Usa un power-up' : `Usa ${n} power-ups`, kind: 'add' },
    { id: 'multi', goals: [2, 4], text: n => `Limpia 2 o más líneas a la vez ${n} veces`, kind: 'add' },
    { id: 'pieces', goals: [60, 100], text: n => `Coloca ${n} piezas`, kind: 'add' },
    { id: 'daily', goals: [1], text: () => 'Cumple el reto diario', kind: 'add' },
    { id: 'adv', goals: [1, 2], text: n => n === 1 ? 'Supera un nivel de aventura' : `Supera ${n} niveles de aventura`, kind: 'add' },
    { id: 'star', goals: [3, 5], text: n => `Recoge ${n} estrellas`, kind: 'add' }
  ];
  const MISSION_REWARD = [25, 30, 40];
  function ensureMissions() {
    const k = todayKey();
    if (prog.missions && prog.missions.day === k) return;
    const rand = seeded(hashStr('misiones' + k));
    const pool = MISSION_POOL.slice();
    const list = [];
    while (list.length < 3) {
      const m = pool.splice(Math.floor(rand() * pool.length), 1)[0];
      const gi = Math.floor(rand() * m.goals.length);
      list.push({ id: m.id, goal: m.goals[gi], prog: 0, claimed: false, reward: MISSION_REWARD[Math.min(2, gi + (m.goals.length === 1 ? 1 : 0))] });
    }
    prog.missions = { day: k, list, bonus: false };
    saveProg();
  }
  function track(id, val = 1) {
    ensureMissions();
    const def = MISSION_POOL.find(m => m.id === id);
    prog.missions.list.forEach(m => {
      if (m.id !== id || m.prog >= m.goal) return;
      m.prog = def.kind === 'max' ? Math.max(m.prog, val) : m.prog + val;
      if (m.prog >= m.goal) { m.prog = m.goal; setTimeout(() => { toast(`Misión cumplida: ${def.text(m.goal)}`); Sound.mission(); }, 900); }
    });
    saveProg();
  }
  function renderMissions() {
    ensureMissions();
    const box = $('misList'); box.innerHTML = '';
    let done = 0, claimable = false;
    prog.missions.list.forEach((m, i) => {
      const def = MISSION_POOL.find(d => d.id === m.id);
      const complete = m.prog >= m.goal; if (m.claimed) done++;
      const row = document.createElement('div');
      row.className = 'mrow' + (complete ? ' done' : '') + (m.claimed ? ' claimed' : '');
      const right = m.claimed ? '<span class="mreward">✓ Cobrada</span>'
        : complete ? `<button class="claim" type="button" data-m="${i}"><span class="coin"></span>+${m.reward}</button>`
        : `<span class="mreward"><span class="coin"></span>${m.reward}</span>`;
      if (complete && !m.claimed) claimable = true;
      row.innerHTML = `<span>${def.text(m.goal)} <small style="color:var(--muted)">${m.prog}/${m.goal}</small></span>${right}<div class="mbar"><i style="width:${Math.min(100, m.prog / m.goal * 100)}%"></i></div>`;
      box.appendChild(row);
    });
    $('misCount').textContent = `${done}/3`;
    $('misBonus').hidden = !(done === 3 && !prog.missions.bonus);
    box.querySelectorAll('.claim').forEach(b => b.addEventListener('click', () => {
      const m = prog.missions.list[+b.dataset.m]; if (m.claimed) return;
      m.claimed = true; addCoins(m.reward); Sound.coins(); vib(20); toast(`+${m.reward} monedas`); renderMissions();
    }));
    return claimable;
  }
  $('misBonus').addEventListener('click', () => {
    if (prog.missions.bonus) return;
    prog.missions.bonus = true; addCoins(50); Sound.win(); vib([30, 40, 30]); toast('+50 monedas por completar las misiones'); renderMissions();
  });

  /* ================= Logros ================= */
  const ACH = [
    { id: 'lines', name: 'Limpiador', desc: n => `Limpia ${n} líneas en total`, tiers: [50, 500, 2500], rewards: [30, 80, 200], val: () => prog.stats.lines },
    { id: 'combo', name: 'Maestro del combo', desc: n => `Logra un combo x${n}`, tiers: [3, 5, 8], rewards: [20, 60, 150], val: () => prog.stats.maxCombo },
    { id: 'multi', name: 'Golpe doble', desc: n => `Limpia ${n} líneas de una sola vez`, tiers: [2, 3, 4], rewards: [20, 50, 120], val: () => prog.stats.maxMulti },
    { id: 'score', name: 'Puntaje alto', desc: n => `Haz ${n} puntos en modo clásico`, tiers: [2000, 5000, 10000], rewards: [30, 80, 200], val: () => best },
    { id: 'streak', name: 'Constancia', desc: n => `Juega ${n} días seguidos`, tiers: [3, 7, 30], rewards: [30, 100, 300], val: () => prog.stats.bestStreak },
    { id: 'daily', name: 'Retador', desc: n => `Cumple ${n} retos diarios`, tiers: [1, 10, 30], rewards: [20, 100, 250], val: () => prog.stats.daily },
    { id: 'adv', name: 'Aventurero', desc: n => `Supera el nivel ${n} de aventura`, tiers: [5, 20, 50], rewards: [30, 100, 250], val: () => prog.adv - 1 },
    { id: 'power', name: 'Bien equipado', desc: n => `Usa ${n} power-ups`, tiers: [5, 25, 100], rewards: [20, 60, 150], val: () => prog.stats.power },
    { id: 'stars', name: 'Cazaestrellas', desc: n => `Recoge ${n} estrellas`, tiers: [10, 50, 200], rewards: [20, 60, 150], val: () => prog.stats.stars },
    { id: 'ice', name: 'Rompehielo', desc: n => `Rompe ${n} bloques de hielo`, tiers: [10, 50, 200], rewards: [20, 60, 150], val: () => prog.stats.ice },
    { id: 'clean', name: 'Impecable', desc: n => `Deja el tablero limpio ${n} ${n === 1 ? 'vez' : 'veces'}`, tiers: [1, 5, 20], rewards: [30, 80, 200], val: () => prog.stats.clean }
  ];
  const achClaimed = a => prog.ach[a.id] || 0;
  const achClaimable = () => ACH.some(a => achClaimed(a) < 3 && a.val() >= a.tiers[achClaimed(a)]);
  let achTab = 'ach';
  function renderAch() {
    $('tabAch').setAttribute('aria-selected', achTab === 'ach');
    $('tabStats').setAttribute('aria-selected', achTab === 'stats');
    const list = $('achList'); list.innerHTML = '';
    if (achTab === 'stats') {
      const s = prog.stats;
      const rows = [['Partidas terminadas', s.games], ['Mejor puntaje', best], ['Líneas limpiadas', s.lines], ['Piezas colocadas', s.pieces],
        ['Mejor combo', s.maxCombo ? 'x' + s.maxCombo : 0], ['Más líneas a la vez', s.maxMulti], ['Tableros limpios', s.clean], ['Power-ups usados', s.power],
        ['Estrellas', s.stars], ['Hielos rotos', s.ice], ['Retos diarios', s.daily], ['Nivel de aventura', prog.adv],
        ['Racha actual', prog.streak + (prog.streak === 1 ? ' día' : ' días')], ['Mejor racha', s.bestStreak + (s.bestStreak === 1 ? ' día' : ' días')]];
      const grid = document.createElement('div'); grid.className = 'stats';
      grid.innerHTML = rows.map(([k, v]) => `<div class="stat"><b>${typeof v === 'number' ? v.toLocaleString('es') : v}</b><span>${k}</span></div>`).join('');
      list.appendChild(grid);
      return;
    }
    ACH.forEach(a => {
      const c = achClaimed(a), val = a.val();
      const tier = Math.min(c, 2), next = a.tiers[tier];
      const done = c >= 3, can = !done && val >= a.tiers[c];
      const el = document.createElement('div'); el.className = 'ach';
      const side = done ? '<span style="color:var(--on); font-weight:600">Completo</span>'
        : can ? `<button class="claim" type="button"><span class="coin"></span>+${a.rewards[c]}</button>`
        : `<span class="mreward"><span class="coin"></span>${a.rewards[c]}</span><span>${Math.min(val, next).toLocaleString('es')}/${next.toLocaleString('es')}</span>`;
      el.innerHTML = `<div class="medal ${c ? 't' + c : ''}">${c ? ['', 'I', 'II', 'III'][c] : '–'}</div>
        <div><b>${a.name}</b><small>${a.desc(done ? a.tiers[2] : a.tiers[c])}</small></div>
        <div class="side">${side}</div>
        <div class="mbar"><i style="width:${done ? 100 : Math.min(100, val / a.tiers[c] * 100)}%"></i></div>`;
      const btn = el.querySelector('.claim');
      if (btn) btn.addEventListener('click', () => {
        prog.ach[a.id] = c + 1; addCoins(a.rewards[c]); saveProg(); Sound.win(); vib([30, 40, 30]);
        toast(`Logro: ${a.name} ${['', 'I', 'II', 'III'][c + 1]} · +${a.rewards[c]} monedas`); renderAch(); updateBadges();
      });
      list.appendChild(el);
    });
  }
  function updateBadges() { $('achBadge').hidden = !achClaimable(); }
  $('achBtn').addEventListener('click', () => { Sound.init(); Sound.tap(); achTab = 'ach'; renderAch(); show('ach', true); });
  $('tabAch').addEventListener('click', () => { Sound.tap(); achTab = 'ach'; renderAch(); });
  $('tabStats').addEventListener('click', () => { Sound.tap(); achTab = 'stats'; renderAch(); });
  $('achClose').addEventListener('click', () => { Sound.tap(); show('ach', false); updateBadges(); });

  /* ================= Colocar una pieza ================= */
  function place(i, p, r, c) {
    hideHand();
    const placed = [];
    p.cells.forEach(([dr, dc], k) => { const idx = (r + dr) * N + c + dc; board[idx] = p.color; placed.push(idx); if (p.star === k) stars.add(idx); });
    tray[i] = null;
    prog.stats.pieces++; track('pieces'); placedCount++;
    if (mode === 'adv') piecesLeft--;
    let gain = p.cells.length;
    const cl = clears(board);
    renderBoard();
    placed.forEach(idx => { if (!cl.set.has(idx)) cells[idx].classList.add('land'); });

    if (cl.lines) {
      combo++;
      gain += 10 * cl.lines * cl.lines * combo;
      const cy = r + p.rows / 2 - .5, cx = c + p.cols / 2 - .5;
      let maxDelay = 0, starGot = 0, iceHit = 0;
      cl.set.forEach(idx => {
        const rr = Math.floor(idx / N), cc = idx % N, v = board[idx];
        const delay = Math.round((Math.abs(rr - cy) + Math.abs(cc - cx)) * 30);
        maxDelay = Math.max(maxDelay, delay);
        if (v === ICE) { board[idx] = CRACK; iceHit++; setTimeout(() => { burst(idx, '#e6f7ff', 4); }, delay + 90); return; }
        if (v === CRACK) { prog.stats.ice++; iceHit++; }
        if (stars.has(idx)) { stars.delete(idx); starGot++; }
        const color = colorOf(v);
        cells[idx].style.animationDelay = delay + 'ms';
        cells[idx].classList.add('pop');
        setTimeout(() => burst(idx, color, stars.has(idx) ? 10 : 6), delay + 90);
        board[idx] = 0;
      });
      setTimeout(() => { if (!drag) renderBoard(); }, maxDelay + 360);

      prog.stats.lines += cl.lines; track('lines', cl.lines);
      prog.stats.maxCombo = Math.max(prog.stats.maxCombo, combo); track('combo', combo);
      prog.stats.maxMulti = Math.max(prog.stats.maxMulti, cl.lines);
      if (cl.lines >= 2) track('multi');
      if (mode === 'adv') { advLines += cl.lines; advStars += starGot; }
      if (starGot) { gain += 25 * starGot; prog.stats.stars += starGot; track('star', starGot); addCoins(starGot); setTimeout(() => Sound.star(), 200); }
      if (iceHit) setTimeout(() => Sound.ice(), 120);

      const cleanBoard = board.every(v => !v);
      let sub = cl.lines > 1 ? `¡${cl.lines} líneas!` : '¡Línea!';
      if (combo > 1) sub = `Combo x${combo}`;
      if (starGot) sub = `¡${starGot > 1 ? starGot + ' estrellas' : 'Estrella'}! +${starGot} moneda${starGot > 1 ? 's' : ''}`;
      if (cleanBoard) { gain += 100; sub = '¡Tablero limpio!'; prog.stats.clean++; }
      floatText(`+${gain}`, sub, combo > 1 || cl.lines > 1 || cleanBoard || starGot > 0);
      Sound.place(); Sound.clear(cl.lines, combo); if (cleanBoard) Sound.clean();
      if (cl.lines > 1 || cleanBoard) { boardWrap.classList.remove('shake'); void boardWrap.offsetWidth; boardWrap.classList.add('shake'); }
      // Vibración según la jugada
      if (cleanBoard) vib([60, 40, 60, 40, 150]);
      else if (cl.lines >= 3) vib([40, 30, 40, 30, 80]);
      else if (cl.lines === 2) vib([30, 40, 30]);
      else vib(combo >= 3 ? [25, 30, 60] : 25);
    } else {
      combo = 0;
      Sound.place(); vib(10);
    }
    addScore(gain);
    if (mode === 'adv') setChip();

    // Hielo sorpresa en modo clásico
    if (mode === 'classic' && score >= 2000 && placedCount % 16 === 0) spawnIce();

    let dealt = false;
    if (tray.every(x => !x)) { tray = newTray(); dealt = true; }
    renderTray(dealt);

    if (tutorial) {
      tutorial = false; prog.tutDone = true; saveProg();
      hintEl.textContent = cl.lines ? '¡Eso es! Llena filas o columnas para limpiarlas. Los power-ups de abajo te ayudan si te trabas.' : 'Llena una fila o columna completa para limpiarla.';
    } else hintEl.textContent = combo > 1 ? `Racha x${combo}: limpia otra línea con la próxima pieza para mantenerla.` : '';

    afterMove();
    saveProg(); save();
  }
  function afterMove() {
    const stuck = !tray.some(x => x && canAnywhere(x));
    if (mode === 'adv') {
      if (advProgress() >= goal.target) { over = true; setTimeout(winLevel, 650); }
      else if (piecesLeft <= 0) { over = true; overReason = 'pieces'; setTimeout(showOver, 700); }
      else if (stuck) { over = true; overReason = 'stuck'; setTimeout(showOver, 700); }
    } else if (mode === 'daily' && !goalHit && score >= target) {
      goalHit = true;
      const first = !prog.daily[dailyKey];
      if (first) { prog.daily[dailyKey] = true; trimDaily(); prog.stats.daily++; track('daily'); addCoins(DAILY_REWARD_COINS); }
      updateGoal();
      if (stuck) over = true;
      setTimeout(() => showWin(first, stuck), 650);
    } else if (stuck) { over = true; overReason = 'stuck'; setTimeout(showOver, 700); }
    if (over) boardWrap.classList.remove('danger');
  }
  function spawnIce() {
    const empty = []; board.forEach((v, i) => { if (!v) empty.push(i); });
    for (let t = 0; t < 12 && empty.length; t++) {
      const i = empty.splice(Math.floor(Math.random() * empty.length), 1)[0];
      board[i] = ICE;
      if (clears(board).lines) { board[i] = 0; continue; }
      setTimeout(() => { renderBoard(); cells[i].classList.add('hit'); hintEl.textContent = 'Apareció un bloque de hielo: límpialo dos veces para romperlo.'; Sound.ice(); }, 400);
      return;
    }
  }
  function trimDaily() {
    const keys = Object.keys(prog.daily).sort();
    while (keys.length > 60) delete prog.daily[keys.shift()];
  }

  /* ================= Power-ups ================= */
  function renderPowers() {
    document.querySelectorAll('.pw').forEach(b => {
      const k = b.dataset.pw, n = prog.items[k];
      const tag = b.querySelector('.n'); tag.textContent = n > 0 ? n : '+'; tag.classList.toggle('plus', n <= 0);
      b.classList.toggle('active', targeting === k);
    });
  }
  function cancelTargeting() {
    targeting = null; boardWrap.classList.remove('targeting'); renderPowers();
  }
  function usedPower(k) {
    prog.items[k]--; prog.stats.power++; track('power'); saveProg();
    renderPowers();
  }
  document.querySelectorAll('.pw').forEach(b => b.addEventListener('click', () => {
    Sound.init();
    const k = b.dataset.pw;
    if (drag || !$('home').hidden) return;
    if (targeting === k) { cancelTargeting(); hintEl.textContent = ''; Sound.back(); return; }
    if (prog.items[k] <= 0) { openBuy(k); return; }
    if (k === 'swap') {
      cancelTargeting();
      const keep = tray.map(x => !!x);
      let fresh = newTray();
      tray = tray.map((x, i) => x ? fresh[i] : null);
      if (!tray.some(x => x && canAnywhere(x))) tray = tray.map(x => x ? { cells: [[0,0]], rows: 1, cols: 1, color: x.color } : null);
      usedPower('swap'); Sound.swap(); vib(20);
      renderTray(true); hintEl.textContent = 'Piezas nuevas.';
      rescueCheck(); save();
      return;
    }
    targeting = k; boardWrap.classList.add('targeting'); renderPowers(); Sound.tap();
    hintEl.textContent = k === 'hammer' ? 'Toca un bloque para romperlo. Toca el martillo otra vez para cancelar.' : 'Toca donde quieres que explote la bomba (área de 3x3).';
  }));
  boardEl.addEventListener('pointerdown', e => {
    if (!targeting) return;
    const el = e.target.closest('.cell'); if (!el) return;
    e.preventDefault();
    const i = +el.dataset.i, r = Math.floor(i / N), c = i % N;
    let hit = [];
    if (targeting === 'hammer') { if (!board[i]) { Sound.bad(); hintEl.textContent = 'Ese espacio está vacío. Toca un bloque.'; return; } hit = [i]; }
    else for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) { const rr = r + dr, cc = c + dc; if (rr >= 0 && cc >= 0 && rr < N && cc < N && board[rr * N + cc]) hit.push(rr * N + cc); }
    if (!hit.length) { Sound.bad(); hintEl.textContent = 'No hay bloques ahí. Elige otra zona.'; return; }
    const k = targeting;
    hit.forEach((idx, n) => {
      const v = board[idx];
      if (v >= ICE) prog.stats.ice++;
      if (stars.has(idx)) stars.delete(idx);
      cells[idx].style.animationDelay = (n * 25) + 'ms';
      cells[idx].classList.add('pop');
      const col = colorOf(v);
      setTimeout(() => burst(idx, col, 8), n * 25 + 60);
      board[idx] = 0;
    });
    if (mode === 'adv') updateGoal();
    if (k === 'bomb') { Sound.bomb(); vib([80, 30, 40]); boardWrap.classList.remove('shake'); void boardWrap.offsetWidth; boardWrap.classList.add('shake'); }
    else { Sound.hammer(); vib(40); }
    usedPower(k); cancelTargeting();
    hintEl.textContent = '';
    setTimeout(() => { renderBoard(); renderTray(); rescueCheck(); save(); }, 380);
  });
  function rescueCheck() {
    // Después de usar un power-up: revisa si ya se ganó o si sigue trabado
    if (mode === 'adv' && advProgress() >= goal.target) { over = true; setTimeout(winLevel, 400); return; }
    if (!tray.some(x => x && canAnywhere(x)) && $('over').hidden) {
      const anyPw = Object.values(prog.items).some(n => n > 0);
      if (!anyPw) { over = true; overReason = 'stuck'; setTimeout(showOver, 500); }
      else hintEl.textContent = 'Todavía no cabe ninguna pieza. Usa otro power-up o rinde la partida desde la pausa.';
    }
  }

  /* ---- Comprar power-ups ---- */
  let buying = null;
  function openBuy(k) {
    buying = k; const P = POWERS[k];
    $('buyIcon').innerHTML = document.querySelector(`.pw[data-pw="${k}"] svg`).outerHTML;
    $('buyTitle').textContent = P.name; $('buyDesc').textContent = P.desc;
    $('buyHave').textContent = prog.items[k]; refreshCoins();
    $('buyPrice').textContent = `Comprar 1 por ${P.price}`;
    $('buyCoinsBtn').disabled = prog.coins < P.price;
    show('buy', true);
  }
  function giveItem(k, n) { prog.items[k] += n; saveProg(); renderPowers(); $('buyHave').textContent = prog.items[k]; }
  $('buyCoinsBtn').addEventListener('click', () => {
    const P = POWERS[buying]; if (prog.coins < P.price) { Sound.bad(); return; }
    prog.coins -= P.price; giveItem(buying, 1); refreshCoins(); Sound.coins(); toast(`+1 ${P.name}`); show('buy', false);
  });
  $('buyAd').addEventListener('click', () => { const k = buying; playAd(`Tu recompensa: 1 ${POWERS[k].name}`, () => { giveItem(k, 1); Sound.reward(); toast(`+1 ${POWERS[k].name}`); show('buy', false); }); });
  $('buyClose').addEventListener('click', () => { Sound.tap(); show('buy', false); });

  /* ================= Arrastre ================= */
  let drag = null;
  function onDown(e) {
    const s = e.currentTarget, i = +s.dataset.i, p = tray[i];
    if (!p || over || drag) return;
    e.preventDefault();
    if (targeting) { cancelTargeting(); hintEl.textContent = ''; }
    if (s.classList.contains('dead')) {
      s.classList.remove('nope'); void s.offsetWidth; s.classList.add('nope');
      Sound.bad(); vib([15, 30, 15]); hintEl.textContent = 'Esa pieza no cabe ahora. Limpia líneas o usa un power-up.';
      return;
    }
    hideHand();
    const { r0, pitch, size } = geometry();
    const w = p.cols * pitch - (pitch - size), h = p.rows * pitch - (pitch - size);
    const g = document.createElement('div'); g.className = 'ghost';
    g.style.width = w + 'px'; g.style.height = h + 'px';
    p.cells.forEach(([r, c], k) => {
      const b = document.createElement('div'); b.className = 'blk' + (p.star === k ? ' star' : '');
      b.style.cssText = `left:${c * pitch}px;top:${r * pitch}px;width:${size}px;height:${size}px;--c:var(--c${p.color})`;
      g.appendChild(b);
    });
    document.body.appendChild(g);
    drag = { i, p, g, w, h, pitch, ox: r0.left, oy: r0.top, lift: e.pointerType === 'mouse' ? -h / 2 : Math.max(56, size * 1.3), target: null };
    s.classList.add('lifted');
    Sound.pick(); vib(8);
    onMove(e);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  }
  function onMove(e) {
    if (!drag) return;
    const left = e.clientX - drag.w / 2, top = e.clientY - drag.h - drag.lift;
    drag.g.style.transform = `translate(${left}px, ${top}px)`;
    const c = Math.round((left - drag.ox) / drag.pitch), r = Math.round((top - drag.oy) / drag.pitch);
    if (fits(drag.p, r, c)) {
      if (!drag.target || drag.target.r !== r || drag.target.c !== c) { drag.target = { r, c }; renderBoard(preview(drag.p, r, c)); }
    } else if (drag.target) { drag.target = null; renderBoard(); }
  }
  function unlisten() {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
  }
  function flyBack(d) {
    const sr = slots[d.i].getBoundingClientRect();
    const tx = sr.left + sr.width / 2 - d.w / 2, ty = sr.top + sr.height / 2 - d.h / 2;
    d.g.style.transition = 'transform .2s ease-in, opacity .2s';
    d.g.style.transform = `translate(${tx}px, ${ty}px) scale(.55)`;
    d.g.style.opacity = '.3';
    setTimeout(() => { d.g.remove(); slots[d.i].classList.remove('lifted'); }, 210);
    if (tutorial) setTimeout(showHand, 300);
  }
  function onUp() {
    if (!drag) return;
    const d = drag; unlisten(); drag = null;
    if (d.target) { d.g.remove(); slots[d.i].classList.remove('lifted'); place(d.i, d.p, d.target.r, d.target.c); }
    else { renderBoard(); flyBack(d); Sound.back(); }
  }
  function onCancel() { if (!drag) return; const d = drag; unlisten(); drag = null; renderBoard(); flyBack(d); }
  slots.forEach(s => s.addEventListener('pointerdown', onDown));

  /* ================= Tutorial ================= */
  let handEl = null;
  function showHand() {
    hideHand();
    if (!tutorial || !tray[0] || !$('home').hidden) return;
    const sr = slots[0].getBoundingClientRect();
    const a = cells[7 * N + 3].getBoundingClientRect(), b = cells[7 * N + 4].getBoundingClientRect();
    handEl = document.createElement('div'); handEl.className = 'hand';
    handEl.style.setProperty('--x1', (sr.left + sr.width / 2) + 'px'); handEl.style.setProperty('--y1', (sr.top + sr.height / 2) + 'px');
    handEl.style.setProperty('--x2', ((a.left + b.right) / 2) + 'px'); handEl.style.setProperty('--y2', ((a.top + a.bottom) / 2 + 56) + 'px');
    document.body.appendChild(handEl);
  }
  function hideHand() { if (handEl) { handEl.remove(); handEl = null; } }
  function setupTutorial() {
    board = new Array(N * N).fill(0);
    for (let c = 0; c < N; c++) if (c !== 3 && c !== 4) board[7 * N + c] = 1 + (c % 7);
    for (let c = 0; c < 5; c++) board[6 * N + c] = 0;
    board[6 * N + 0] = 5; board[6 * N + 1] = 5;
    tray = [
      { cells: [[0,0],[0,1]], rows: 1, cols: 2, color: 2 },
      { cells: [[0,0],[1,0],[1,1]], rows: 2, cols: 2, color: 6 },
      { cells: [[0,0],[0,1],[1,0],[1,1]], rows: 2, cols: 2, color: 4 }
    ];
    hintEl.textContent = 'Arrastra la pieza amarilla al hueco de abajo para completar la fila.';
    setTimeout(showHand, 600);
  }

  /* ================= Anuncio simulado ================= */
  let adBusy = false;
  function playAd(msg, done) {
    if (adBusy) return; adBusy = true;
    $('adMsg').textContent = msg; show('adLayer', true);
    let n = 5; $('adCount').textContent = n;
    Sound.setMusic(false);
    const t = setInterval(() => {
      n--; $('adCount').textContent = Math.max(n, 0);
      if (n > 0) return;
      clearInterval(t); adBusy = false;
      show('adLayer', false);
      if (settings.music) Sound.setMusic(true);
      done();
    }, 1000);
  }

  /* ================= Ajustes ================= */
  function syncToggles() {
    document.querySelectorAll('[data-toggle]').forEach(b => b.setAttribute('aria-pressed', settings[b.dataset.toggle] ? 'true' : 'false'));
  }
  document.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => {
    Sound.init();
    const k = b.dataset.toggle; settings[k] = !settings[k]; store.set('bloquetico_settings', settings);
    if (k === 'sound') Sound.setSound(settings.sound); else if (k === 'music') Sound.setMusic(settings.music); else if (settings.vibra) vib(30);
    syncToggles(); Sound.tap();
  }));

  /* ================= Modos ================= */
  function setModeLabel() {
    $('modeLabel').textContent = mode === 'daily' ? 'Reto diario' : mode === 'adv' ? `Nivel ${level}` : 'Clásico';
    setChip();
  }
  function fillRandom(b, count, rand, value) {
    let placed = 0, guard = 0;
    while (placed < count && guard++ < 400) {
      const i = Math.floor(rand() * N * N);
      if (b[i]) continue;
      b[i] = value != null ? value : 1 + Math.floor(rand() * 7);
      if (clears(b).lines) { b[i] = 0; continue; }
      placed++;
    }
    return placed;
  }
  function levelSpec(L) {
    const types = ['score', 'lines', 'ice', 'stars'];
    const type = types[(L - 1) % 4];
    const rand = seeded(hashStr('nivel' + L));
    const b = new Array(N * N).fill(0);
    fillRandom(b, L > 3 ? Math.min(14, 2 + Math.floor(L / 2)) : 0, rand);
    let g, pieces;
    if (type === 'score') { g = { type, target: 100 + L * 20 }; pieces = 24 + Math.floor(L / 5); }
    else if (type === 'lines') { const t = Math.min(14, 4 + Math.floor(L * 0.3)); g = { type, target: t }; pieces = 16 + Math.ceil(t * 1.3); }
    else if (type === 'stars') { const t = Math.min(8, 2 + Math.floor(L / 6)); g = { type, target: t }; pieces = 16 + t * 3; }
    else { const n = fillRandom(b, Math.min(16, 2 + Math.floor(L / 2)), rand, ICE); g = { type, target: n * 2 }; pieces = 14 + n * 3; }
    if (type !== 'ice' && L > 10) fillRandom(b, Math.min(6, Math.floor((L - 8) / 3)), rand, ICE);
    return { board: b, goal: g, pieces };
  }
  function resetRun() {
    over = false; combo = 0; usedContinue = false; goalHit = false; coinsGiven = 0; usedMore = false;
    placedCount = 0; recordShown = false; gameCounted = false; advLines = 0; advStars = 0; stars = new Set(); tutorial = false;
    cancelTargeting(); hideHand();
  }
  function newGame(m = mode) {
    mode = m; resetRun();
    if (mode === 'daily') {
      dailyKey = todayKey(); target = dailyTarget(dailyKey); goalHit = !!prog.daily[dailyKey];
      rngState = hashStr('tablero' + dailyKey) | 0;
      board = new Array(N * N).fill(0); fillRandom(board, 10 + Math.floor(rnd() * 6), rnd);
      rngState = hashStr('piezas' + dailyKey) | 0;
    } else if (mode === 'adv') {
      const spec = levelSpec(level);
      board = spec.board; goal = spec.goal; piecesLeft = spec.pieces; iceHits = iceRemaining();
      if (goal.type === 'ice') goal.target = iceHits;
      rngState = hashStr('piezasnivel' + level) | 0;
    } else {
      board = new Array(N * N).fill(0); bestAtStart = best;
      if (!prog.tutDone) tutorial = true;
    }
    if (tutorial) setupTutorial(); else tray = newTray();
    setModeLabel(); setScoreNow(0);
    if (!tutorial) hintEl.textContent = mode === 'daily' ? `Reto de hoy: llega a ${target} puntos. Todos juegan el mismo tablero.`
      : mode === 'adv' ? `Nivel ${level}: ${goalText(goal)} con ${piecesLeft} piezas.` : '';
    renderBoard(); renderTray(true); renderPowers();
    save();
  }
  function loadGame(m) {
    mode = m;
    const s = store.get(saveKey(), null);
    const valid = s && Array.isArray(s.board) && s.board.length === N * N && Array.isArray(s.tray)
      && (m !== 'daily' || s.dailyKey === todayKey()) && (m !== 'adv' || s.level === level);
    if (!valid) { newGame(m); return; }
    resetRun();
    board = s.board; tray = s.tray; stars = new Set(s.stars || []); combo = s.combo || 0; usedContinue = !!s.usedContinue;
    bestAtStart = s.bestAtStart ?? best; rngState = s.rngState | 0; goalHit = !!s.goalHit; coinsGiven = s.coinsGiven || 0;
    goal = s.goal; piecesLeft = s.piecesLeft || 0; advLines = s.advLines || 0; advStars = s.advStars || 0; iceHits = s.iceHits || 0; usedMore = !!s.usedMore;
    placedCount = s.placedCount || 0; recordShown = !!s.recordShown; gameCounted = !!s.gameCounted;
    if (m === 'daily') { dailyKey = s.dailyKey; target = dailyTarget(dailyKey); }
    setModeLabel(); setScoreNow(s.score || 0);
    hintEl.textContent = '';
    renderBoard(); renderTray(); renderPowers();
    if (!tray.some(x => x && canAnywhere(x))) newGame(m);
  }
  function hasSave(k) {
    const s = store.get(k, null);
    return s && Array.isArray(s.board) && s.board.some(Boolean) && (k !== 'bloquetico_daily' || s.dailyKey === todayKey());
  }

  /* ================= Inicio ================= */
  function renderWeek() {
    const today = new Date(), wk = $('week'); wk.innerHTML = '';
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today); d.setDate(today.getDate() - i);
      const k = keyOf(d), el = document.createElement('div');
      if (prog.daily[k]) el.classList.add('done');
      if (i === 0) el.classList.add('today');
      el.innerHTML = `<i>${prog.daily[k] ? '✓' : ''}</i>${i === 0 ? 'Hoy' : WEEKDAYS[d.getDay()]}`;
      wk.appendChild(el);
    }
    const k = todayKey(), st = $('dailyStatus');
    if (prog.daily[k]) { st.textContent = '✓ Cumplido hoy'; st.className = 'status ok'; }
    else { st.textContent = `Meta: ${dailyTarget(k)} puntos`; st.className = 'status'; }
  }
  function showHome() {
    cancelTargeting(); hideHand();
    const resume = hasSave('bloquetico_save');
    $('playLabel').textContent = resume ? 'Continuar partida' : 'Jugar';
    $('newBtn').hidden = !resume;
    $('homeBest').textContent = best;
    $('homeStreak').textContent = prog.streak === 1 ? '1 día' : `${prog.streak} días`;
    $('advLabel').textContent = `Nivel ${prog.adv}`;
    refreshCoins(); renderWeek(); renderMissions(); updateBadges();
    show('home', true);
    maybeReward();
  }
  function startFromHome(m, fresh) {
    Sound.init(); Sound.tap();
    show('home', false);
    if (fresh) newGame(m); else loadGame(m);
  }
  $('playBtn').addEventListener('click', () => startFromHome('classic', false));
  $('newBtn').addEventListener('click', () => startFromHome('classic', true));
  $('dailyBtn').addEventListener('click', () => startFromHome('daily', !hasSave('bloquetico_daily')));

  /* ---- Aventura ---- */
  const GOAL_TAG = { score: 'Puntos', lines: 'Líneas', ice: 'Hielo', stars: 'Estrellas' };
  function renderLevels() {
    const box = $('levels'); box.innerHTML = '';
    const maxShow = Math.max(20, Math.ceil((prog.adv + 10) / 5) * 5);
    for (let L = 1; L <= maxShow; L++) {
      const b = document.createElement('button'); b.type = 'button';
      const t = ['score', 'lines', 'ice', 'stars'][(L - 1) % 4];
      b.className = 'lvl' + (L < prog.adv ? ' done' : L === prog.adv ? ' cur' : ' lock');
      b.innerHTML = `${L}<small>${L <= prog.adv ? GOAL_TAG[t] : ''}</small>`;
      if (L <= prog.adv) b.addEventListener('click', () => { level = L; show('adv', false); startFromHome('adv', false); });
      box.appendChild(b);
    }
    setTimeout(() => { const cur = box.querySelector('.cur'); if (cur) cur.scrollIntoView({ block: 'center' }); }, 30);
  }
  function openAdv() { renderLevels(); show('adv', true); }
  $('advBtn').addEventListener('click', () => { Sound.init(); Sound.tap(); openAdv(); });
  $('advClose').addEventListener('click', () => { Sound.tap(); show('adv', false); });
  function winLevel() {
    Sound.win(); vib([50, 50, 50, 50, 200]);
    const first = level >= prog.adv;
    const reward = first ? Math.min(80, 15 + level * 2) : 0;
    if (first) { prog.adv = level + 1; addCoins(reward); }
    track('adv'); endGameStats(); payCoins();
    store.del('bloquetico_adv');
    $('winTitle').textContent = `¡Nivel ${level} superado!`;
    $('winText').textContent = `${goalText(goal)} · te sobraron ${piecesLeft} piezas.`;
    $('winCoins').hidden = !first; $('winCoinsN').textContent = `+${reward}`;
    $('winKeep').hidden = false; $('winKeep').textContent = 'Siguiente nivel';
    $('winMenu').textContent = 'Mapa de niveles';
    show('win', true);
  }

  /* ---- Recompensa diaria y racha ---- */
  let pendingReward = 0;
  const reward = { next: 1 };
  function maybeReward() {
    const k = todayKey();
    if (prog.lastClaim === k) return;
    const gap = prog.lastClaim ? dayNum(k) - dayNum(prog.lastClaim) : 99;
    const next = gap === 1 ? prog.streak + 1 : 1;
    const idx = (next - 1) % 7;
    pendingReward = DAY_REWARDS[idx];
    const days = $('days'); days.innerHTML = '';
    DAY_REWARDS.forEach((v, i) => {
      const d = document.createElement('div');
      d.className = 'day' + (i < idx ? ' past' : '') + (i === idx ? ' now' : '') + (i === 6 ? ' wide' : '');
      d.innerHTML = `Día ${i + 1}<b><span class="coin"></span>${v}</b>`;
      days.appendChild(d);
    });
    $('rewardStreak').textContent = next === 1 ? 'Día 1 de tu racha' : `¡${next} días seguidos!`;
    $('rewardNote').textContent = gap > 1 && prog.lastClaim ? 'Tu racha volvió a empezar. Entra todos los días para no perderla.' : 'Vuelve mañana para mantener tu racha y ganar más.';
    $('claimAdLabel').textContent = `Ver anuncio y recibir ${pendingReward * 2}`;
    $('claimBtn').textContent = `Reclamar ${pendingReward}`;
    reward.next = next;
    setTimeout(() => show('reward', true), 250);
  }
  function claim(mult) {
    if (prog.lastClaim === todayKey()) { show('reward', false); return; }
    prog.streak = reward.next; prog.lastClaim = todayKey();
    prog.stats.bestStreak = Math.max(prog.stats.bestStreak, prog.streak);
    addCoins(pendingReward * mult);
    $('homeStreak').textContent = prog.streak === 1 ? '1 día' : `${prog.streak} días`;
    show('reward', false); Sound.coins(); vib(20);
    toast(`+${pendingReward * mult} monedas`);
    updateBadges();
  }
  $('claimBtn').addEventListener('click', () => { Sound.init(); claim(1); });
  $('claimAdBtn').addEventListener('click', () => { Sound.init(); playAd(`Tu recompensa: ${pendingReward * 2} monedas`, () => claim(2)); });

  /* ---- Estilos: bloques y tablero ---- */
  let shopTab = 'blocks';
  function applyTheme() {
    root.setAttribute('data-skin', prog.theme);
    root.setAttribute('data-board', prog.board);
  }
  const PREV = [0,0,3,0, 0,5,5,0, 1,0,0,6, 2,2,0,7];
  function renderThemes() {
    $('tabBlocks').setAttribute('aria-selected', shopTab === 'blocks');
    $('tabBoards').setAttribute('aria-selected', shopTab === 'boards');
    const isB = shopTab === 'blocks', items = isB ? SKINS : BOARDS;
    const owned = isB ? prog.owned : prog.ownedBoards, cur = isB ? prog.theme : prog.board;
    const list = $('themeList'); list.innerHTML = '';
    items.forEach(t => {
      const have = owned.includes(t.id), using = cur === t.id;
      const b = document.createElement('button'); b.type = 'button';
      b.className = 'theme' + (using ? ' using' : '') + (!have ? ' locked' : '') + (!have && prog.coins < t.price ? ' cant' : '');
      let prev;
      if (isB) {
        b.setAttribute('data-skin', t.id);
        prev = '<div class="sw">' + [1, 2, 3, 4, 5, 6].map(n => `<div class="blk" style="--c:var(--c${n})"></div>`).join('') + '</div>';
      } else {
        b.setAttribute('data-board', t.id);
        prev = '<div class="bprev">' + PREV.map(n => n ? `<div class="cell f" style="--c:var(--c${n})"></div>` : '<div class="cell"></div>').join('') + '</div>';
      }
      const state = using ? 'Usando' : have ? 'Usar' : `<span class="coin"></span>${t.price}`;
      b.innerHTML = `${prev}<b>${t.name}</b><span class="state">${state}</span>`;
      b.addEventListener('click', () => pickTheme(t, isB));
      list.appendChild(b);
    });
    refreshCoins();
  }
  function pickTheme(t, isB) {
    Sound.init();
    const owned = isB ? prog.owned : prog.ownedBoards;
    if (!owned.includes(t.id)) {
      if (prog.coins < t.price) { Sound.bad(); toast(`Te faltan ${t.price - prog.coins} monedas`); return; }
      prog.coins -= t.price; owned.push(t.id); Sound.coins(); vib(20); toast(`¡Desbloqueaste ${t.name}!`);
    } else Sound.tap();
    if (isB) prog.theme = t.id; else prog.board = t.id;
    saveProg(); applyTheme(); renderThemes();
  }
  $('tabBlocks').addEventListener('click', () => { Sound.tap(); shopTab = 'blocks'; renderThemes(); });
  $('tabBoards').addEventListener('click', () => { Sound.tap(); shopTab = 'boards'; renderThemes(); });
  $('themesBtn').addEventListener('click', () => { Sound.init(); Sound.tap(); renderThemes(); show('themes', true); });
  $('themesClose').addEventListener('click', () => { Sound.tap(); show('themes', false); refreshCoins(); });
  $('coinAdBtn').addEventListener('click', () => { Sound.init(); playAd('Tu recompensa: 25 monedas', () => { addCoins(25); Sound.coins(); renderThemes(); toast('+25 monedas'); }); });

  /* ---- Pausa ---- */
  $('pauseBtn').addEventListener('click', () => { Sound.tap(); disarm(); cancelTargeting(); show('pause', true); });
  $('resumeBtn').addEventListener('click', () => { Sound.tap(); show('pause', false); });
  let armT = null;
  function disarm() { clearTimeout(armT); const b = $('restartBtn'); b.classList.remove('armed'); b.textContent = mode === 'daily' ? 'Reiniciar reto' : mode === 'adv' ? 'Reiniciar nivel' : 'Reiniciar partida'; }
  $('restartBtn').addEventListener('click', e => {
    const b = e.currentTarget; Sound.tap();
    if (b.classList.contains('armed')) { disarm(); show('pause', false); newGame(); return; }
    b.classList.add('armed'); b.textContent = 'Toca otra vez para reiniciar';
    armT = setTimeout(disarm, 2500);
  });
  $('menuBtn').addEventListener('click', () => { Sound.tap(); save(); show('pause', false); goMenu(); });
  function goMenu() { if (mode === 'adv') { showHome(); openAdv(); } else showHome(); }

  /* ---- Fin de partida ---- */
  function payCoins() {
    const due = Math.floor(score / 100) - coinsGiven;
    if (due > 0) { coinsGiven += due; addCoins(due); }
    return Math.max(0, due);
  }
  function endGameStats() {
    if (gameCounted) return;
    gameCounted = true; prog.stats.games++; track('games'); track('score', score); saveProg();
  }
  function showOver() {
    Sound.over(); vib(120); hideHand();
    const earned = payCoins();
    $('overScore').textContent = score;
    $('continueBtn').hidden = false;
    if (mode === 'adv') {
      const left = goal.type === 'ice' ? 'romper todo el hielo' : `${goal.target - advProgress()} ${GOAL_TAG[goal.type].toLowerCase()}`;
      $('overTitle').textContent = overReason === 'pieces' ? 'Sin piezas' : '¡Sin espacio!';
      $('overBest').textContent = `Nivel ${level}: te faltó ${left}.`;
      if (overReason === 'pieces') { $('continueLabel').textContent = 'Ver anuncio: +5 piezas'; $('continueBtn').hidden = usedMore; }
      else { $('continueLabel').textContent = 'Ver anuncio y seguir'; $('continueBtn').hidden = usedContinue; }
      $('againBtn').textContent = 'Reintentar nivel'; $('overMenuBtn').textContent = 'Mapa de niveles';
    } else if (mode === 'daily') {
      const done = prog.daily[dailyKey];
      $('overTitle').textContent = done ? '¡Sin espacio!' : 'Casi lo logras';
      $('overBest').innerHTML = done ? '<span class="record">Reto de hoy cumplido</span>' : `Te faltaron ${target - score} puntos para la meta de ${target}`;
      $('continueLabel').textContent = 'Ver anuncio y seguir'; $('continueBtn').hidden = usedContinue;
      $('againBtn').textContent = 'Reintentar reto'; $('overMenuBtn').textContent = 'Menú principal';
    } else {
      const rec = bestAtStart > 0 && score > bestAtStart;
      $('overTitle').textContent = '¡Sin espacio!';
      $('overBest').innerHTML = rec ? '<span class="record">¡Nuevo récord!</span>' : `Récord: ${best}`;
      $('continueLabel').textContent = 'Ver anuncio y seguir'; $('continueBtn').hidden = usedContinue;
      $('againBtn').textContent = 'Jugar de nuevo'; $('overMenuBtn').textContent = 'Menú principal';
    }
    $('usePwBtn').hidden = !(overReason === 'stuck' && Object.values(prog.items).some(n => n > 0));
    $('overCoins').hidden = earned <= 0; $('overCoinsN').textContent = `+${earned}`;
    save();
    show('over', true);
  }
  function finishRun() { endGameStats(); payCoins(); store.del(saveKey()); }
  $('againBtn').addEventListener('click', () => { Sound.tap(); show('over', false); finishRun(); newGame(); });
  $('overMenuBtn').addEventListener('click', () => { Sound.tap(); show('over', false); finishRun(); goMenu(); });
  $('usePwBtn').addEventListener('click', () => {
    Sound.tap(); show('over', false); over = false;
    hintEl.textContent = 'Usa el martillo, la bomba o cambia las piezas para hacer espacio.';
  });
  $('continueBtn').addEventListener('click', () => {
    show('over', false);
    if (mode === 'adv' && overReason === 'pieces') {
      playAd('Tu recompensa: 5 piezas más', () => {
        usedMore = true; over = false; piecesLeft += 5; setChip();
        floatText('+5 piezas', 'Recompensa', true); Sound.reward();
        if (!tray.some(x => x && canAnywhere(x))) { over = true; overReason = 'stuck'; setTimeout(showOver, 600); }
        save();
      });
      return;
    }
    playAd('Tu recompensa: despejamos el centro del tablero', () => {
      for (let r = 2; r < 6; r++) for (let c = 2; c < 6; c++) { const i = r * N + c; board[i] = 0; stars.delete(i); }
      usedContinue = true; over = false; combo = 0;
      tray = newTray();
      renderBoard(); renderTray(true); updateGoal();
      floatText('¡Sigue jugando!', 'Recompensa', true); Sound.reward();
      save();
    });
  });

  /* ---- Reto cumplido ---- */
  function showWin(first, stuck) {
    Sound.win(); vib([50, 50, 50, 50, 200]);
    $('winTitle').textContent = '¡Reto cumplido!';
    $('winText').textContent = first ? `Llegaste a ${target} puntos. Mañana hay un reto nuevo.` : 'Ya habías cumplido el reto de hoy.';
    $('winCoins').hidden = !first; $('winCoinsN').textContent = `+${DAILY_REWARD_COINS}`;
    $('winKeep').hidden = stuck; $('winKeep').textContent = 'Seguir jugando';
    $('winMenu').textContent = 'Menú principal';
    show('win', true);
  }
  $('winKeep').addEventListener('click', () => {
    Sound.tap(); show('win', false);
    if (mode === 'adv') { level = prog.adv > level ? level + 1 : level; newGame('adv'); }
  });
  $('winMenu').addEventListener('click', () => {
    Sound.tap(); show('win', false);
    if (mode === 'adv') { showHome(); openAdv(); return; }
    if (over) finishRun(); else save();
    showHome();
  });

  /* Logo de la pantalla de inicio */
  (() => {
    const pat = ['11.22', '1.322', '.4433', '5.4.3', '55.66'];
    const cols = { 1: 1, 2: 2, 3: 4, 4: 5, 5: 6, 6: 7 };
    const logo = $('logo'); let k = 0;
    pat.join('').split('').forEach(ch => {
      const d = document.createElement('div');
      if (ch !== '.') { d.className = 'blk'; d.style.setProperty('--c', `var(--c${cols[ch]})`); d.style.setProperty('--d', (k++ * 120) + 'ms'); }
      logo.appendChild(d);
    });
  })();

  window.addEventListener('resize', () => { renderTray(); sizeCanvas(); if (tutorial) showHand(); });

  /* Ganchos para la app Android: botón Atrás y app en segundo plano */
  window.handleBack = () => {
    if (!$('adLayer').hidden) return true;
    if (!$('reward').hidden) { claim(1); return true; }
    for (const id of ['buy', 'themes', 'ach', 'adv']) if (!$(id).hidden) { show(id, false); return true; }
    if (!$('win').hidden) { $('winMenu').click(); return true; }
    if (!$('pause').hidden) { show('pause', false); return true; }
    if (!$('over').hidden) { $('overMenuBtn').click(); return true; }
    if (targeting) { cancelTargeting(); hintEl.textContent = ''; return true; }
    if ($('home').hidden) { if (drag) onCancel(); disarm(); show('pause', true); return true; }
    return false;
  };
  window.onAppPause = () => {
    if (drag) onCancel(); if (!over) save(); saveProg(); Sound.suspend();
    if ($('home').hidden && $('over').hidden && $('adLayer').hidden && $('win').hidden) { disarm(); cancelTargeting(); show('pause', true); }
  };
  window.onAppResume = () => Sound.resume();

  function start() {
    syncToggles(); applyTheme(); ensureMissions();
    loadGame('classic');
    sizeCanvas();
    showHome();
  }
  start();
})();
