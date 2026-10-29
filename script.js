(() => {
  const N = 8;
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
    { id: 'metal', name: 'Metálico', price: 400 },
    { id: 'pixel', name: 'Pixel retro', price: 500 },
    { id: 'neon', name: 'Neón', price: 650 }
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
  const DAY_REWARDS = [10, 15, 20, 25, 30, 40, 75];
  const DAILY_REWARD_COINS = 50;
  const WEEKDAYS = ['D', 'L', 'K', 'M', 'J', 'V', 'S'];

  const $ = id => document.getElementById(id);
  const root = document.documentElement;
  const boardEl = $('board'), boardWrap = $('boardWrap'), fxEl = $('fx'), scoreEl = $('score'), bestEl = $('best'), hintEl = $('hint');
  const slots = [...document.querySelectorAll('.slot')];

  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  const settings = Object.assign({ sound: true, music: true }, store.get('bloquetico_settings', {}));
  let best = +store.get('bloquetico_best', 0) || 0;
  const prog = Object.assign({ coins: 0, streak: 0, lastClaim: null, daily: {}, theme: 'classic', owned: ['classic'], board: 'night', ownedBoards: ['night'] }, store.get('bloquetico_prog', {}));
  if (!SKINS.some(t => t.id === prog.theme)) prog.theme = 'classic';
  if (!BOARDS.some(t => t.id === prog.board)) prog.board = 'night';
  prog.owned = prog.owned.filter(id => SKINS.some(t => t.id === id));
  if (!prog.owned.includes('classic')) prog.owned.unshift('classic');
  const saveProg = () => store.set('bloquetico_prog', prog);

  /* ================= Fechas ================= */
  const pad = n => String(n).padStart(2, '0');
  const keyOf = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayKey = () => keyOf(new Date());
  const dayNum = k => { const [y, m, d] = k.split('-').map(Number); return Math.round(Date.UTC(y, m - 1, d) / 864e5); };
  function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  const dailyTarget = k => [800, 1000, 1200, 1500][hashStr('meta' + k) % 4];

  /* ================= Estado de partida ================= */
  // mode: 'classic' | 'daily'
  let mode = 'classic', board, tray, score = 0, shown = 0, combo, over, usedContinue, bestAtStart = 0;
  let rngState = 0, dailyKey = null, target = 0, goalHit = false, coinsGiven = 0;

  function rnd() {
    if (mode !== 'daily') return Math.random();
    rngState = (rngState + 0x6D2B79F5) | 0;
    let t = Math.imul(rngState ^ (rngState >>> 15), 1 | rngState);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

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
    function noise(t, dur, vol, freq, dest = sfx) {
      const s = ctx.createBufferSource(); s.buffer = noiseBuf;
      const f = ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = 1.4;
      const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      s.connect(f); f.connect(g); g.connect(dest); s.start(t); s.stop(t + dur + .02);
    }
    const ok = () => ctx && settings.sound && ctx.state === 'running';

    /* Música: loop generativo suave (marimba + bajo), nunca suena igual dos veces */
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
      record() { if (!ok()) return; const t = ctx.currentTime + .9; [5, 7, 9, 10, 12].forEach((n, i) => tone(pnote(n), t + i * .09, .45, { type: 'triangle', vol: .14 })); },
      win() { if (!ok()) return; const t = ctx.currentTime; [5, 7, 9, 10, 12, 14, 15].forEach((n, i) => tone(pnote(n), t + i * .08, .5, { type: 'triangle', vol: .14 })); },
      coins() { if (!ok()) return; const t = ctx.currentTime; for (let i = 0; i < 5; i++) { tone(1320 + i * 90, t + i * .07, .14, { vol: .07 }); tone(1980 + i * 90, t + i * .07, .08, { vol: .03 }); } },
      reward() { if (!ok()) return; const t = ctx.currentTime; for (let i = 0; i < 9; i++) tone(pnote(10 + Math.floor(Math.random() * 6)), t + i * .06, .25, { vol: .07 }); }
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
  const colorOf = n => getComputedStyle(root).getPropertyValue('--c' + n).trim() || '#fff';
  function burst(idx, color) {
    const cr = cells[idx].getBoundingClientRect(), kr = canvas.getBoundingClientRect();
    const x = cr.left - kr.left + cr.width / 2, y = cr.top - kr.top + cr.height / 2;
    for (let i = 0; i < 6; i++) parts.push({ x, y, vx: (Math.random() - .5) * 6, vy: -Math.random() * 4.5 - 1, s: 4 + Math.random() * 5, life: 1, rot: Math.random() * 6, vr: (Math.random() - .5) * .4, color });
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

  /* ================= Lógica del juego ================= */
  const cells = [];
  for (let i = 0; i < N * N; i++) { const d = document.createElement('div'); d.className = 'cell'; boardEl.appendChild(d); cells.push(d); }

  function makePiece() {
    let r = rnd() * TOTAL_W, s = SHAPES[0];
    for (const x of SHAPES) { r -= x.w; if (r <= 0) { s = x; break; } }
    return { cells: s.c, rows: s.rows, cols: s.cols, color: 1 + Math.floor(rnd() * 7) };
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
      if (pv && pv.clear.has(i)) { cls += ' f wc'; col = pv.color; }
      else if (pv && pv.set.has(i)) { cls += ' f pv'; col = pv.color; }
      else if (v) cls += ' f';
      el.className = cls; el.style.animationDelay = '';
      if (col) el.style.setProperty('--c', `var(--c${col})`); else el.style.removeProperty('--c');
    }
  }
  function preview(p, r, c) {
    const tmp = board.slice(), set = new Set();
    for (const [dr, dc] of p.cells) { const i = (r + dr) * N + c + dc; tmp[i] = p.color; set.add(i); }
    return { set, clear: clears(tmp).set, color: p.color };
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
      const filled = new Set(p.cells.map(([r, c]) => r * 10 + c));
      for (let r = 0; r < p.rows; r++) for (let c = 0; c < p.cols; c++) {
        const b = document.createElement('div');
        if (filled.has(r * 10 + c)) { b.className = 'blk'; b.style.setProperty('--c', `var(--c${p.color})`); }
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

  function setBest() {
    if (mode === 'classic' && score > best) { best = score; store.set('bloquetico_best', best); }
    $('homeBest').textContent = best;
    bestEl.textContent = mode === 'daily' ? target : best;
  }
  function updateGoal() {
    const g = $('goal'); g.hidden = mode !== 'daily';
    if (mode !== 'daily') return;
    const done = goalHit || prog.daily[dailyKey];
    $('goalBar').style.width = Math.min(100, score / target * 100) + '%';
    $('goalText').textContent = done ? '¡Meta cumplida!' : `Meta: ${target} · faltan ${Math.max(0, target - score)}`;
    g.classList.toggle('done', !!done);
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
  }
  function setScoreNow(v) { score = shown = v; scoreEl.textContent = v; setBest(); updateGoal(); }
  function floatText(main, sub, big) {
    const d = document.createElement('div'); d.className = 'float' + (big ? ' big' : '');
    d.innerHTML = (sub ? `<i>${sub}</i>` : '') + `<b>${main}</b>`;
    fxEl.appendChild(d); setTimeout(() => d.remove(), 1050);
  }
  function toast(msg) {
    const t = document.createElement('div'); t.className = 'toast'; t.textContent = msg;
    document.body.appendChild(t); setTimeout(() => t.remove(), 2300);
  }
  function addCoins(n) { prog.coins += n; saveProg(); refreshCoins(); }
  function refreshCoins() { $('homeCoins').textContent = prog.coins; $('themeCoins').textContent = prog.coins; }

  const saveKey = () => mode === 'daily' ? 'bloquetico_daily' : 'bloquetico_save';
  function save() {
    if (over) { store.del(saveKey()); return; }
    store.set(saveKey(), { board, tray, score, combo, usedContinue, bestAtStart, rngState, dailyKey, goalHit, coinsGiven });
  }

  function place(i, p, r, c) {
    const placed = [];
    for (const [dr, dc] of p.cells) { const idx = (r + dr) * N + c + dc; board[idx] = p.color; placed.push(idx); }
    tray[i] = null;
    let gain = p.cells.length;
    const cl = clears(board);
    renderBoard();
    placed.forEach(idx => { if (!cl.set.has(idx)) cells[idx].classList.add('land'); });

    if (cl.lines) {
      combo++;
      gain += 10 * cl.lines * cl.lines * combo;
      const cy = r + p.rows / 2 - .5, cx = c + p.cols / 2 - .5;
      let maxDelay = 0;
      cl.set.forEach(idx => {
        const rr = Math.floor(idx / N), cc = idx % N, color = colorOf(board[idx]);
        const delay = Math.round((Math.abs(rr - cy) + Math.abs(cc - cx)) * 30);
        maxDelay = Math.max(maxDelay, delay);
        cells[idx].style.animationDelay = delay + 'ms';
        cells[idx].classList.add('pop');
        setTimeout(() => burst(idx, color), delay + 90);
      });
      cl.set.forEach(idx => board[idx] = 0);
      setTimeout(() => { if (!drag) renderBoard(); }, maxDelay + 360);

      const cleanBoard = board.every(v => !v);
      let sub = cl.lines > 1 ? `¡${cl.lines} líneas!` : '¡Línea!';
      if (combo > 1) sub = `Combo x${combo}`;
      if (cleanBoard) { gain += 100; sub = '¡Tablero limpio!'; }
      floatText(`+${gain}`, sub, combo > 1 || cl.lines > 1 || cleanBoard);
      Sound.place(); Sound.clear(cl.lines, combo); if (cleanBoard) Sound.clean();
      if (cl.lines > 1 || cleanBoard) { boardWrap.classList.remove('shake'); void boardWrap.offsetWidth; boardWrap.classList.add('shake'); }
      try { navigator.vibrate && navigator.vibrate(cl.lines > 1 ? [20, 40, 20] : 18); } catch (e) {}
    } else {
      combo = 0;
      Sound.place();
    }
    addScore(gain);

    let dealt = false;
    if (tray.every(x => !x)) { tray = newTray(); dealt = true; }
    renderTray(dealt);
    hintEl.textContent = combo > 1 ? `Racha x${combo}: limpia otra línea con la próxima pieza para mantenerla.` : '';

    const stuck = !tray.some(x => x && canAnywhere(x));
    if (mode === 'daily' && !goalHit && score >= target) {
      goalHit = true;
      const first = !prog.daily[dailyKey];
      if (first) { prog.daily[dailyKey] = true; trimDaily(); prog.coins += DAILY_REWARD_COINS; saveProg(); refreshCoins(); }
      updateGoal();
      if (stuck) over = true;
      setTimeout(() => showWin(first, stuck), 650);
    } else if (stuck) { over = true; boardWrap.classList.remove('danger'); setTimeout(showOver, 700); }
    save();
  }
  function trimDaily() {
    const keys = Object.keys(prog.daily).sort();
    while (keys.length > 60) delete prog.daily[keys.shift()];
  }

  /* ================= Arrastre ================= */
  let drag = null;
  function onDown(e) {
    const s = e.currentTarget, i = +s.dataset.i, p = tray[i];
    if (!p || over || drag) return;
    e.preventDefault();
    if (s.classList.contains('dead')) {
      s.classList.remove('nope'); void s.offsetWidth; s.classList.add('nope');
      Sound.bad(); hintEl.textContent = 'Esa pieza no cabe ahora. Limpia líneas para hacerle espacio.';
      return;
    }
    const { r0, pitch, size } = geometry();
    const w = p.cols * pitch - (pitch - size), h = p.rows * pitch - (pitch - size);
    const g = document.createElement('div'); g.className = 'ghost';
    g.style.width = w + 'px'; g.style.height = h + 'px';
    for (const [r, c] of p.cells) {
      const b = document.createElement('div'); b.className = 'blk';
      b.style.cssText = `left:${c * pitch}px;top:${r * pitch}px;width:${size}px;height:${size}px;--c:var(--c${p.color})`;
      g.appendChild(b);
    }
    document.body.appendChild(g);
    drag = { i, p, g, w, h, pitch, ox: r0.left, oy: r0.top, lift: e.pointerType === 'mouse' ? -h / 2 : Math.max(56, size * 1.3), target: null };
    s.classList.add('lifted');
    Sound.pick();
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
  }
  function onUp() {
    if (!drag) return;
    const d = drag; unlisten(); drag = null;
    if (d.target) { d.g.remove(); slots[d.i].classList.remove('lifted'); place(d.i, d.p, d.target.r, d.target.c); }
    else { renderBoard(); flyBack(d); Sound.back(); }
  }
  function onCancel() { if (!drag) return; const d = drag; unlisten(); drag = null; renderBoard(); flyBack(d); }
  slots.forEach(s => s.addEventListener('pointerdown', onDown));

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

  /* ================= Pantallas ================= */
  const show = (id, v) => { $(id).hidden = !v; };

  function syncToggles() {
    document.querySelectorAll('[data-toggle]').forEach(b => b.setAttribute('aria-pressed', settings[b.dataset.toggle] ? 'true' : 'false'));
  }
  document.querySelectorAll('[data-toggle]').forEach(b => b.addEventListener('click', () => {
    Sound.init();
    const k = b.dataset.toggle; settings[k] = !settings[k]; store.set('bloquetico_settings', settings);
    if (k === 'sound') Sound.setSound(settings.sound); else Sound.setMusic(settings.music);
    syncToggles(); Sound.tap();
  }));

  /* ---- Modos ---- */
  function setModeLabel() {
    $('modeLabel').textContent = mode === 'daily' ? 'Reto diario' : 'Clásico';
    $('bestChip').title = mode === 'daily' ? 'Meta de hoy' : 'Récord';
  }
  function dailyStartBoard(k) {
    const b = new Array(N * N).fill(0);
    rngState = hashStr('tablero' + k) | 0;
    const count = 10 + Math.floor(rnd() * 6);
    let placed = 0, guard = 0;
    while (placed < count && guard++ < 200) {
      const i = Math.floor(rnd() * N * N), col = 1 + Math.floor(rnd() * 7);
      if (b[i]) continue;
      b[i] = col;
      if (clears(b).lines) { b[i] = 0; continue; }
      placed++;
    }
    return b;
  }
  function newGame(m = mode) {
    mode = m; over = false; combo = 0; usedContinue = false; goalHit = false; coinsGiven = 0;
    if (mode === 'daily') {
      dailyKey = todayKey(); target = dailyTarget(dailyKey); goalHit = !!prog.daily[dailyKey];
      board = dailyStartBoard(dailyKey);
      rngState = hashStr('piezas' + dailyKey) | 0;
    } else {
      board = new Array(N * N).fill(0); bestAtStart = best;
    }
    tray = newTray(); setModeLabel(); setScoreNow(0);
    hintEl.textContent = mode === 'daily' ? `Reto de hoy: llega a ${target} puntos. Todos juegan el mismo tablero.` : '';
    renderBoard(); renderTray(true);
    save();
  }
  function loadGame(m) {
    mode = m;
    const s = store.get(saveKey(), null);
    const valid = s && Array.isArray(s.board) && s.board.length === N * N && Array.isArray(s.tray) && (m !== 'daily' || s.dailyKey === todayKey());
    if (!valid) { newGame(m); return; }
    board = s.board; tray = s.tray; combo = s.combo || 0; usedContinue = !!s.usedContinue;
    bestAtStart = s.bestAtStart ?? best; rngState = s.rngState | 0; goalHit = !!s.goalHit; coinsGiven = s.coinsGiven || 0; over = false;
    if (m === 'daily') { dailyKey = s.dailyKey; target = dailyTarget(dailyKey); }
    setModeLabel(); setScoreNow(s.score || 0);
    hintEl.textContent = '';
    renderBoard(); renderTray();
    if (!tray.some(x => x && canAnywhere(x))) newGame(m);
  }
  function hasSave(k) { const s = store.get(k, null); return s && Array.isArray(s.board) && s.board.some(Boolean) && (k !== 'bloquetico_daily' || s.dailyKey === todayKey()); }

  /* ---- Inicio ---- */
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
    const resume = hasSave('bloquetico_save');
    $('playLabel').textContent = resume ? 'Continuar partida' : 'Jugar';
    $('newBtn').hidden = !resume;
    $('homeBest').textContent = best;
    $('homeStreak').textContent = prog.streak === 1 ? '1 día' : `${prog.streak} días`;
    refreshCoins(); renderWeek();
    show('home', true);
    maybeReward();
  }
  function startFromHome(m, fresh) {
    Sound.init(); Sound.tap();
    if (fresh) newGame(m); else loadGame(m);
    show('home', false);
  }
  $('playBtn').addEventListener('click', () => startFromHome('classic', false));
  $('newBtn').addEventListener('click', () => startFromHome('classic', true));
  $('dailyBtn').addEventListener('click', () => {
    const k = 'bloquetico_daily';
    startFromHome('daily', !hasSave(k));
  });

  /* ---- Recompensa diaria y racha ---- */
  let pendingReward = 0;
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
  const reward = { next: 1 };
  function claim(mult) {
    prog.streak = reward.next; prog.lastClaim = todayKey();
    addCoins(pendingReward * mult);
    $('homeStreak').textContent = prog.streak === 1 ? '1 día' : `${prog.streak} días`;
    show('reward', false); Sound.coins();
    toast(`+${pendingReward * mult} monedas`);
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
      prog.coins -= t.price; owned.push(t.id); Sound.coins(); toast(`¡Desbloqueaste ${t.name}!`);
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
  $('pauseBtn').addEventListener('click', () => { Sound.tap(); disarm(); show('pause', true); });
  $('resumeBtn').addEventListener('click', () => { Sound.tap(); show('pause', false); });
  let armT = null;
  function disarm() { clearTimeout(armT); const b = $('restartBtn'); b.classList.remove('armed'); b.textContent = mode === 'daily' ? 'Reiniciar reto' : 'Reiniciar partida'; }
  $('restartBtn').addEventListener('click', e => {
    const b = e.currentTarget; Sound.tap();
    if (b.classList.contains('armed')) { disarm(); show('pause', false); newGame(); return; }
    b.classList.add('armed'); b.textContent = 'Toca otra vez para reiniciar';
    armT = setTimeout(disarm, 2500);
  });
  $('menuBtn').addEventListener('click', () => { Sound.tap(); save(); show('pause', false); showHome(); });

  /* ---- Fin de partida ---- */
  function payCoins() {
    const due = Math.floor(score / 100) - coinsGiven;
    if (due > 0) { coinsGiven += due; addCoins(due); }
    return due;
  }
  function showOver() {
    Sound.over();
    const earned = payCoins();
    $('overScore').textContent = score;
    if (mode === 'daily') {
      const done = prog.daily[dailyKey];
      $('overTitle').textContent = done ? '¡Sin espacio!' : 'Casi lo logras';
      $('overBest').innerHTML = done ? '<span class="record">Reto de hoy cumplido</span>' : `Te faltaron ${target - score} puntos para la meta de ${target}`;
      $('againBtn').textContent = 'Reintentar reto';
    } else {
      const rec = bestAtStart > 0 && score > bestAtStart;
      $('overTitle').textContent = '¡Sin espacio!';
      $('overBest').innerHTML = rec ? '<span class="record">¡Nuevo récord!</span>' : `Récord: ${best}`;
      if (rec) Sound.record();
      $('againBtn').textContent = 'Jugar de nuevo';
    }
    $('overCoins').hidden = earned <= 0; $('overCoinsN').textContent = `+${earned}`;
    $('continueBtn').hidden = usedContinue;
    save();
    show('over', true);
  }
  $('againBtn').addEventListener('click', () => { Sound.tap(); show('over', false); newGame(); });
  $('overMenuBtn').addEventListener('click', () => { Sound.tap(); show('over', false); store.del(saveKey()); showHome(); });
  $('continueBtn').addEventListener('click', () => {
    show('over', false);
    playAd('Tu recompensa: despejamos el centro del tablero', () => {
      for (let r = 2; r < 6; r++) for (let c = 2; c < 6; c++) board[r * N + c] = 0;
      usedContinue = true; over = false; combo = 0;
      tray = newTray();
      renderBoard(); renderTray(true);
      floatText('¡Sigue jugando!', 'Recompensa', true); Sound.reward();
      save();
    });
  });

  /* ---- Reto cumplido ---- */
  function showWin(first, stuck) {
    Sound.win();
    $('winText').textContent = first ? `Llegaste a ${target} puntos. Mañana hay un reto nuevo.` : 'Ya habías cumplido el reto de hoy.';
    $('win').querySelector('.earned').hidden = !first;
    $('winKeep').hidden = stuck;
    show('win', true);
  }
  $('winKeep').addEventListener('click', () => { Sound.tap(); show('win', false); });
  $('winMenu').addEventListener('click', () => { Sound.tap(); show('win', false); if (over) { payCoins(); store.del(saveKey()); } else save(); showHome(); });

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

  window.addEventListener('resize', () => { renderTray(); sizeCanvas(); });

  /* Ganchos para la app Android: botón Atrás y app en segundo plano */
  window.handleBack = () => {
    if (!$('adLayer').hidden) return true;
    if (!$('reward').hidden) { claim(1); return true; }
    if (!$('themes').hidden) { show('themes', false); return true; }
    if (!$('win').hidden) { $('winMenu').click(); return true; }
    if (!$('pause').hidden) { show('pause', false); return true; }
    if (!$('over').hidden) { $('overMenuBtn').click(); return true; }
    if ($('home').hidden) { if (drag) onCancel(); disarm(); show('pause', true); return true; }
    return false;
  };
  window.onAppPause = () => { if (drag) onCancel(); if (!over) save(); Sound.suspend(); if ($('home').hidden && $('over').hidden && $('adLayer').hidden && $('win').hidden) { disarm(); show('pause', true); } };
  window.onAppResume = () => Sound.resume();

  function start() {
    syncToggles(); applyTheme();
    loadGame('classic');
    sizeCanvas();
    showHome();
  }
  start();
})();
