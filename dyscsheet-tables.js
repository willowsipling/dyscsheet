// The table sheets (Crosstabs, Gamma): a table of boxes to fill in, shared by each sheet's page.
// Labels say what each number is, never how to get it: nothing here is worked out or checked.
// Each page gives its slots, what sits below the table, and any extra highlighting; this file
// does the rest (layouts, typing, crosshair, toolbar, File menu, saving).

DYSC.tableSheet = (cfg) => {
  'use strict';
  const { esc } = DYSC;
  const $ = (id) => document.getElementById(id);
  const MIN = 2, MAX = 6;
  const range = (n) => [...Array(n).keys()];
  const SLOTS = cfg.slots.filter(Boolean).map((s) => s.key);
  const slot = Object.fromEntries(cfg.slots.filter(Boolean).map((s) => [s.key, s]));

  // sh = { type, version, layout: 'a' (stacked cells) | 'c' (matched tables), rows, cols, on: { slot: shown? }, v: { key: typed text } }
  // Every box's text lives in v under its key, so shrinking the table or hiding a slot loses nothing.
  const blank = () => ({ type: cfg.type, version: cfg.version, layout: 'a', rows: 2, cols: 2,
    on: Object.fromEntries(SLOTS.map((s) => [s, true])), v: {} });

  // This browser's preferences, not part of a saved sheet: zoom (one for every table sheet), and Crosshair for each sheet.
  const PREFS = 'dyscsheet.tables.prefs';
  let prefs = {};
  try { prefs = JSON.parse(localStorage.getItem(PREFS) || '{}') || {}; } catch (_) { /* start with defaults */ }
  const savePrefs = () => { try { localStorage.setItem(PREFS, JSON.stringify(prefs)); } catch (_) { /* fine for this visit */ } };
  // Crosshair turns every highlight on. It starts off, and the browser remembers whichever way it was last left.
  // A page without the button always has it on.
  const crossOn = () => !$('crossMode') || !!(prefs.cross && prefs.cross[cfg.type]);
  let sh = blank();

  const val = (k) => sh.v[k] || '';
  const rowName = (i) => val(`rn-${i}`) || `row ${i + 1}`;
  const colName = (j) => val(`cn-${j}`) || `column ${j + 1}`;
  // A slot can leave some cells out (Gamma: no concordant box where nothing is below and to the right).
  const has = (s, i, j) => !slot[s].has || slot[s].has(i, j, sh.rows, sh.cols);
  const shown = () => SLOTS.filter((s) => sh.on[s]);
  const store = () => { try { localStorage.setItem(cfg.store, JSON.stringify(sh)); } catch (_) { /* Save file still works */ } };

  // ---------- Building blocks ----------
  const box = (k, label, cls = '') =>
    `<input class="box ${cls}" data-k="${k}" value="${esc(val(k))}" aria-label="${esc(label)}" autocomplete="off" spellcheck="false">`;
  // A label and its box on one line, like "fo [ 283 ]".
  const pair = (name, k, label) => `<label class="slot"><span class="slot-name">${name}</span>${box(k, label)}</label>`;
  const cellLabel = (s, i, j) => `${slot[s].say}, ${rowName(i)}, ${colName(j)}`;

  // The frame both layouts share: names across the top and down the side, margins on the right and bottom.
  function frame(cell, withMargins) {
    const head = `<tr><th class="corner">${cfg.corner}</th>`
      + range(sh.cols).map((j) => `<th data-j="${j}">${box(`cn-${j}`, `Column ${j + 1} name`, 'name')}</th>`).join('')
      + (withMargins ? '<th class="total" data-j="m">Margin</th>' : '') + '</tr>';
    const body = range(sh.rows).map((i) => `<tr><th data-i="${i}">${box(`rn-${i}`, `Row ${i + 1} name`, 'name')}</th>`
      + range(sh.cols).map((j) => cell(i, j)).join('')
      + (withMargins ? `<td class="total" data-i="${i}" data-j="m">${pair('row margin', `rm-${i}`, `Row margin, ${rowName(i)}`)}</td>` : '')
      + '</tr>').join('');
    const foot = withMargins ? `<tr><th class="total" data-i="m">Margin</th>`
      + range(sh.cols).map((j) => `<td class="total" data-i="m" data-j="${j}">${pair('column margin', `cm-${j}`, `Column margin, ${colName(j)}`)}</td>`).join('')
      + `<td class="total grand" data-i="m" data-j="m">${pair('n', 'n', 'n, the sample size')}</td></tr>` : '';
    return `<div class="xtab-scroll"><table class="x">${head}${body}${foot}</table></div>`;
  }

  function render() {
    const below = `<div class="below">${cfg.below.map(([name, k, label]) => pair(name, k, label)).join('')}</div>`;
    if (sh.layout === 'a') {
      // A left-out box keeps its space when others in the row have one, so each quantity sits at the same height across the row.
      const gap = '<span class="slot gap" aria-hidden="true"><span class="slot-name"></span><input class="box" tabindex="-1" disabled></span>';
      $('main').innerHTML = frame((i, j) => `<td class="a-cell" data-i="${i}" data-j="${j}">`
        + shown().filter((s) => range(sh.cols).some((c) => has(s, i, c)))
          .map((s) => has(s, i, j) ? pair(slot[s].tag || slot[s].name, `${s}-${i}-${j}`, cellLabel(s, i, j)) : gap).join('') + '</td>', cfg.margins)
        + below;
    } else {
      // Margins sit on one table only (fo); the others are the same shape so cells line up across them.
      $('main').innerHTML = '<div class="c-wrap">' + shown().map((s) => `<section><h2>${slot[s].title}</h2>`
        + frame((i, j) => `<td data-i="${i}" data-j="${j}">${has(s, i, j) ? box(`${s}-${i}-${j}`, cellLabel(s, i, j)) : ''}</td>`, cfg.margins && s === 'fo')
        + '</section>').join('') + '</div>' + below;
    }

    document.querySelectorAll('[data-layout]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.layout === sh.layout)));
    $('rowCount').textContent = sh.rows;
    $('colCount').textContent = sh.cols;
    $('rowLess').disabled = sh.rows <= MIN; $('rowMore').disabled = sh.rows >= MAX;
    $('colLess').disabled = sh.cols <= MIN; $('colMore').disabled = sh.cols >= MAX;
    $('slotLabel').textContent = sh.layout === 'a' ? 'Show in each cell' : 'Tables to show';
    if ($('crossMode')) $('crossMode').setAttribute('aria-pressed', String(crossOn()));
    // A null slot is a gap, so related checkboxes can share a column.
    $('slotBoxes').innerHTML = cfg.slots.map((s) => s
      ? `<label class="toggle"><input type="checkbox" value="${s.key}"${sh.on[s.key] ? ' checked' : ''}> <span>${s.name}</span></label>`
      : '<span></span>').join('');
  }

  // ---------- Typing ----------
  $('main').addEventListener('input', (e) => {
    const k = e.target.dataset.k;
    if (!k) return;
    // One undo step per stretch of typing in a box.
    if (typingIn !== k) { snapshot(); typingIn = k; }
    sh.v[k] = e.target.value;
    // A name appears in every table; keep each copy the same.
    document.querySelectorAll(`[data-k="${k}"]`).forEach((el) => { if (el !== e.target) el.value = e.target.value; });
    store();
  });

  // A sheet can set the order Tab moves through its boxes (Gamma follows the method taught in class).
  // Boxes that aren't showing are skipped; past either end, Tab carries on as normal.
  if (cfg.tabOrder) {
    $('main').addEventListener('keydown', (e) => {
      if (e.key !== 'Tab' || e.altKey || e.ctrlKey || e.metaKey) return;
      const keys = cfg.tabOrder(sh.rows, sh.cols).filter((k) => document.querySelector(`[data-k="${k}"]`));
      const at = keys.indexOf(e.target.dataset.k);
      if (at < 0) return;
      const next = keys[at + (e.shiftKey ? -1 : 1)];
      if (!next) return;
      e.preventDefault();
      document.querySelector(`[data-k="${next}"]`).focus();
    });
  }

  // Crosshair: the row and column around the box you're in, and the exact spot in pink. In matched tables,
  // the same cell lights up in every table. A sheet can add its own hints (cfg.onFocus).
  // It all stays put when you switch to another window (say, your worksheet), so you can find your place again.
  // With Crosshair mode off, only the box's own outline shows.
  const MARKS = ['is-row', 'is-col', 'is-same', 'is-here', 'is-spot', 'is-input', ...(cfg.marks || [])];
  const clearCross = () => document.querySelectorAll(MARKS.map((m) => '.' + m).join(', '))
    .forEach((el) => el.classList.remove(...MARKS));
  $('main').addEventListener('focusin', (e) => {
    clearCross();
    if (e.target.classList.contains('box')) e.target.classList.add('is-here');
    if (!crossOn()) return;
    // The exact spot: the labelled slot you're in, or the whole cell when it holds just a box.
    const spot = e.target.closest('.slot, td, th');
    if (spot) spot.classList.add('is-spot');
    const td = e.target.closest('td, th');
    const table = e.target.closest('table');
    if (td && table) {
      const { i, j } = td.dataset;
      table.querySelectorAll('td, th').forEach((c) => {
        if (i !== undefined && c.dataset.i === i) c.classList.add('is-row');
        if (j !== undefined && c.dataset.j === j) c.classList.add('is-col');
      });
      if (sh.layout === 'c' && i !== undefined && j !== undefined) {
        document.querySelectorAll(`td[data-i="${i}"][data-j="${j}"]`).forEach((c) => c.classList.add('is-same'));
      }
    }
    // The sheet's own hints. A box's key says what it is and where: "fe-1-2" is slot fe, row 1, column 2;
    // "rm-1" is row 1's margin; "chi" has no row or column. mark() gives a box (by key or selector) a plum border.
    if (cfg.onFocus && e.target.dataset.k) {
      const [slot, i, j] = e.target.dataset.k.split('-');
      const mark = (k) => document.querySelectorAll(k.includes('[') ? k : `[data-k="${k}"]`).forEach((b) => b.classList.add('is-input'));
      cfg.onFocus({ key: e.target.dataset.k, slot, i: i === undefined ? NaN : +i, j: j === undefined ? NaN : +j, mark,
        cells: document.querySelectorAll('.x td[data-i][data-j]') });
    }
  });
  $('main').addEventListener('focusout', () => setTimeout(() => {
    if (document.hasFocus() && !$('main').contains(document.activeElement)) clearCross();
  }));

  // ---------- Toolbar ----------
  const change = (fn) => () => { snapshot(); fn(); store(); render(); };
  document.querySelectorAll('[data-layout]').forEach((b) => b.addEventListener('click', change(() => { sh.layout = b.dataset.layout; })));
  $('rowLess').addEventListener('click', change(() => { sh.rows = Math.max(MIN, sh.rows - 1); }));
  $('rowMore').addEventListener('click', change(() => { sh.rows = Math.min(MAX, sh.rows + 1); }));
  $('colLess').addEventListener('click', change(() => { sh.cols = Math.max(MIN, sh.cols - 1); }));
  $('colMore').addEventListener('click', change(() => { sh.cols = Math.min(MAX, sh.cols + 1); }));
  $('slotBoxes').addEventListener('change', (e) => { sh.on[e.target.value] = e.target.checked; store(); render(); });
  if ($('crossMode')) $('crossMode').addEventListener('click', () => {
    prefs.cross = { ...prefs.cross, [cfg.type]: !crossOn() };
    savePrefs(); render();
  });

  // ---------- Status ----------
  const statusEl = $('status');
  function setStatus(msg, kind) {
    statusEl.textContent = msg;
    statusEl.hidden = !msg;
    statusEl.classList.toggle('is-error', kind === 'error');
  }
  ['keydown', 'pointerdown'].forEach((type) => document.addEventListener(type, () => { if (statusEl.textContent) setStatus(''); }, true));

  // ---------- Menus ----------
  // Same behaviour as the worksheet's menus.
  const menuTitles = [...document.querySelectorAll('.menu-title')];
  const openMenu = () => menuTitles.find((t) => t.getAttribute('aria-expanded') === 'true');
  function setMenu(title, open) {
    title.setAttribute('aria-expanded', String(open));
    $(title.getAttribute('aria-controls')).hidden = !open;
  }
  function closeMenus(returnFocus) {
    const t = openMenu();
    if (!t) return;
    setMenu(t, false);
    if (returnFocus) t.focus();
  }
  const menuItems = (menu) => [...menu.querySelectorAll('.menu-item, .zoom button')];
  menuTitles.forEach((t) => {
    t.addEventListener('click', () => {
      const wasOpen = t.getAttribute('aria-expanded') === 'true';
      closeMenus();
      if (!wasOpen) setMenu(t, true);
    });
    t.addEventListener('pointerenter', () => { if (openMenu() && openMenu() !== t) { closeMenus(); setMenu(t, true); } });
    t.addEventListener('keydown', (e) => {
      if (e.key !== 'ArrowDown') return;
      e.preventDefault();
      setMenu(t, true);
      menuItems($(t.getAttribute('aria-controls')))[0].focus();
    });
  });
  document.querySelectorAll('.menu').forEach((menu) => {
    menu.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { e.preventDefault(); closeMenus(true); return; }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      e.preventDefault();
      const items = menuItems(menu);
      const i = items.indexOf(document.activeElement);
      items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus();
    });
    // Choosing an item closes the menu. Zoom stays open so it can be pressed again (but closes from the keyboard,
    // where e.detail is 0), and New stays open while it asks "Click again to clear".
    menu.addEventListener('click', (e) => {
      if (!e.target.closest('button')) return;
      if (e.target.closest('.zoom') && e.detail) return;
      if (e.target.closest('#newPage') && newArmed) return;
      closeMenus();
    });
  });
  document.addEventListener('pointerdown', (e) => { if (!e.target.closest('.menubar')) closeMenus(); });
  document.querySelector('.menubar').addEventListener('keydown', (e) => {
    if (e.key === 'Tab') setTimeout(() => { if (!document.activeElement.closest('.menubar')) closeMenus(); });
  });
  // Shortcuts on the right of each item, same as the worksheet.
  document.querySelectorAll('.menu button[id]').forEach((b) => {
    const info = DYSC.BUTTONS[b.id];
    if (info && info.keys) b.insertAdjacentHTML('beforeend', `<span class="menu-keys" aria-hidden="true">${esc(DYSC.keysText(info.keys))}</span>`);
  });

  // ---------- Edit menu ----------
  // Undo and Redo cover the whole sheet: typing, and every toolbar change. They put you back in the box you were in.
  const history = [], future = [];
  let typingIn = null;
  function snapshot() {
    history.push(JSON.stringify(sh));
    if (history.length > 200) history.shift();
    future.length = 0;
  }
  function travel(from, to) {
    if (!from.length) return;
    to.push(JSON.stringify(sh));
    sh = JSON.parse(from.pop());
    typingIn = null;
    const k = lastBox && lastBox.dataset.k;
    store(); render();
    const back = k && document.querySelector(`[data-k="${k}"]`);
    if (back) back.focus();
  }
  const undo = () => travel(history, future);
  const redo = () => travel(future, history);
  $('main').addEventListener('focusin', (e) => { if (e.target.dataset.k !== typingIn) typingIn = null; });
  document.addEventListener('keydown', (e) => {
    const mod = e.metaKey || e.ctrlKey;
    if (!mod || e.altKey) return;
    const key = e.key.toLowerCase();
    if (key === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); }
    else if (key === 'y') { e.preventDefault(); redo(); }
  });
  $('undo').addEventListener('click', undo);
  $('redo').addEventListener('click', redo);

  // Cut, Copy and Paste work on the box you were last in: on what you'd selected there, or the whole box if nothing was.
  // (The keyboard shortcuts are the browser's own and already work inside a box.)
  let lastBox = null, lastSel = [0, 0];
  const remember = (e) => { if (e.target.classList.contains('box') && e.target.dataset.k) { lastBox = e.target; lastSel = [e.target.selectionStart, e.target.selectionEnd]; } };
  ['focusin', 'focusout', 'select', 'keyup', 'pointerup'].forEach((t) => $('main').addEventListener(t, remember));
  function picked() {
    if (!lastBox || !lastBox.isConnected) return null;
    const [a, b] = lastSel[0] === lastSel[1] ? [0, lastBox.value.length] : lastSel;
    return { box: lastBox, a, b, text: lastBox.value.slice(a, b) };
  }
  function put(p, text) {
    p.box.focus();
    p.box.setRangeText(text, p.a, p.b, 'end');
    p.box.dispatchEvent(new Event('input', { bubbles: true }));
  }
  const toClipboard = (text) => navigator.clipboard && navigator.clipboard.writeText(text).catch(() => {});
  $('copyBtn').addEventListener('click', () => {
    const p = picked();
    if (!p) return;
    toClipboard(p.text);
    p.box.focus(); p.box.setSelectionRange(p.a, p.b);
  });
  $('cutBtn').addEventListener('click', () => {
    const p = picked();
    if (!p) return;
    toClipboard(p.text);
    typingIn = null;
    put(p, '');
  });
  $('pasteBtn').addEventListener('click', async () => {
    const p = picked();
    if (!p) return;
    try {
      const text = await navigator.clipboard.readText();
      typingIn = null;
      put(p, text.replace(/\s*\n\s*/g, ' ').trim());
    } catch (_) {
      p.box.focus();
      setStatus('The browser didn\'t allow pasting from the menu. Press Cmd+V (Ctrl+V on Windows) in the box instead.', 'error');
    }
  });

  // ---------- View menu ----------
  // Zoom changes only the table area, never the toolbar. One setting for every table sheet.
  const ZOOMS = [0.5, 0.6, 0.7, 0.8, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];
  let zoom = ZOOMS.includes(prefs.zoom) ? prefs.zoom : 1;
  function setZoom(z) {
    zoom = prefs.zoom = z;
    $('main').style.zoom = zoom;
    $('zoomReset').textContent = Math.round(zoom * 100) + '%';
    $('zoomOut').disabled = zoom <= ZOOMS[0];
    $('zoomIn').disabled = zoom >= ZOOMS[ZOOMS.length - 1];
    savePrefs();
  }
  const stepZoom = (dir) => {
    const i = ZOOMS.indexOf(zoom);
    setZoom(ZOOMS[Math.min(ZOOMS.length - 1, Math.max(0, (i < 0 ? ZOOMS.indexOf(1) : i) + dir))]);
  };
  $('zoomOut').addEventListener('click', () => stepZoom(-1));
  $('zoomIn').addEventListener('click', () => stepZoom(1));
  $('zoomReset').addEventListener('click', () => setZoom(1));
  setZoom(zoom);

  // ---------- File menu ----------
  // (cross was saved in sheets for a while; Crosshair is the browser's now.)
  const load = ({ cross, ...data }) => ({ ...blank(), ...data, on: { ...blank().on, ...data.on }, v: { ...data.v } });
  const valid = (data) => data && data.type === cfg.type && data.v && typeof data.v === 'object';
  $('save').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(sh, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = cfg.fileName;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $('open').addEventListener('click', () => $('fileInput').click());
  $('fileInput').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      const data = JSON.parse(await f.text());
      if (!valid(data)) throw new Error(`not a ${cfg.noun}`);
      snapshot();
      sh = load(data);
      store(); render();
    } catch (_) {
      setStatus(`${f.name} isn't a dyscsheet ${cfg.noun}. Choose a .json file saved from this page. (Each sheet's files open on that sheet's page.)`, 'error');
    }
    e.target.value = '';
  });
  $('print').addEventListener('click', () => window.print());

  let newArmed = 0;
  const newLabel = $('newPage').textContent;
  $('newPage').addEventListener('click', () => {
    if (Date.now() - newArmed > 4000) {
      newArmed = Date.now();
      $('newPage').textContent = 'Click again to clear';
      setStatus(`Click again to clear the whole ${cfg.noun}.`, 'error');
      setTimeout(() => { $('newPage').textContent = newLabel; }, 4000);
      return;
    }
    newArmed = 0;
    $('newPage').textContent = newLabel;
    snapshot();
    sh = blank();
    store(); render();
  });

  // ---------- Start ----------
  try {
    const saved = JSON.parse(localStorage.getItem(cfg.store) || 'null');
    if (valid(saved)) sh = load(saved);
  } catch (_) { /* start blank */ }
  render();
};
