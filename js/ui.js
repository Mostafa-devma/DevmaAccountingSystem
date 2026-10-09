/* Devma Accounting System — UI toolkit: formatting, modals, toasts, tables, printing */
'use strict';
const UI = {
  esc(s) { return String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); },
  num(n, d) { d = d ?? db().settings.decimals ?? 2; return (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d }); },
  qty(n) { return (Number(n) || 0).toLocaleString('en-US', { maximumFractionDigits: 3 }); },
  base() { return db().currencies.find(c => c.base) || db().currencies[0]; },
  cur(code) { return db().currencies.find(c => c.code === code) || this.base(); },
  money(n, code) { const c = code ? this.cur(code) : this.base(); return (c.symbol || c.code) + ' ' + this.num(n, c.decimals ?? undefined); },
  date(s) { if (!s) return ''; const d = new Date(s.length <= 10 ? s + 'T12:00:00' : s); return isNaN(d) ? s : d.toLocaleDateString(I18N.loc(), { day: '2-digit', month: 'short', year: 'numeric' }); },
  datetime(s) { if (!s) return ''; const d = new Date(s); return d.toLocaleString(I18N.loc(), { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }); },
  ago(s) { const m = Math.round((Date.now() - new Date(s)) / 60000); if (m < 1) return 'just now'; if (m < 60) return m + ' min ago'; const h = Math.round(m / 60); if (h < 24) return h + ' h ago'; return Math.round(h / 24) + ' d ago'; },
  icon(name, cls = '') { if (['chevR', 'chevL', 'arrowL', 'arrowR', 'logout', 'return'].includes(name)) cls += ' flip'; return `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.dot}</svg>`; },
  badge(text, kind = 'gray') { return `<span class="badge b-${kind}">${this.esc(text)}</span>`; },
  statusBadge(s) { return this.badge(s, { Paid: 'green', Partial: 'amber', Unpaid: 'red' }[s] || 'gray'); },
  signed(n) { return `<span class="${n < 0 ? 'neg' : ''}">${this.num(n)}</span>`; },

  /* ---------- toasts ---------- */
  toast(msg, type = 'success', ms = 3400) {
    const root = document.getElementById('toast-root'), el = document.createElement('div');
    el.className = 'toast t-' + type;
    el.innerHTML = this.icon({ success: 'check', error: 'alert', warn: 'alert', info: 'info' }[type] || 'info') + `<span>${this.esc(msg)}</span>`;
    root.appendChild(el); requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => { el.classList.remove('show'); setTimeout(() => el.remove(), 300); }, ms);
  },
  /* run fn, show error toast instead of throwing */
  try(fn, okMsg) { try { const r = fn(); if (okMsg) this.toast(okMsg); return r === undefined ? true : r; } catch (e) { console.error(e); this.toast(e.message || String(e), 'error', 5000); return false; } },

  /* ---------- modals ---------- */
  modal({ title, body, size = 'md', buttons = [], onOpen, onClose, icon }) {
    const root = document.getElementById('modal-root'), wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `<div class="modal modal-${size}" role="dialog" aria-modal="true" aria-label="${this.esc(title)}">
      <div class="modal-head"><h3>${icon ? this.icon(icon) : ''}<span>${this.esc(title)}</span></h3><button type="button" class="icon-btn" data-close aria-label="Close">${this.icon('x')}</button></div>
      <div class="modal-body">${body}</div>
      ${buttons.length ? `<div class="modal-foot">${buttons.map((b, i) => `<button type="button" class="btn ${b.cls || 'btn-light'}" data-bi="${i}">${b.icon ? this.icon(b.icon) : ''}${this.esc(b.label)}</button>`).join('')}</div>` : ''}
    </div>`;
    root.appendChild(wrap);
    const onKey = e => { if (e.key === 'Escape' && root.lastElementChild === wrap) m.close(); };
    const m = { el: wrap.querySelector('.modal'), close() { wrap.remove(); document.removeEventListener('keydown', onKey); onClose && onClose(); } };
    document.addEventListener('keydown', onKey);
    wrap.querySelector('[data-close]').onclick = () => m.close();
    buttons.forEach((b, i) => { wrap.querySelector(`[data-bi="${i}"]`).onclick = () => (b.onClick ? b.onClick(m) : m.close()); });
    m.el.querySelectorAll('form').forEach(f => f.addEventListener('submit', e => { e.preventDefault(); const p = m.el.querySelector('.modal-foot .btn-primary'); p && p.click(); }));
    onOpen && onOpen(m.el, m);
    setTimeout(() => { const f = m.el.querySelector('[autofocus]') || m.el.querySelector('.modal-body input:not([type=hidden]):not([readonly]):not([type=checkbox]),.modal-body select,.modal-body textarea'); f && f.focus(); }, 40);
    return m;
  },
  confirm(msg, { title = 'Please confirm', ok = 'Confirm', danger = false } = {}) {
    return new Promise(res => {
      let done = false;
      this.modal({ title, size: 'sm', icon: danger ? 'alert' : 'info', body: `<p class="confirm-msg">${this.esc(msg)}</p>`,
        onClose: () => { if (!done) res(false); },
        buttons: [{ label: 'Cancel', cls: 'btn-light', onClick: m => m.close() }, { label: ok, cls: danger ? 'btn-danger' : 'btn-primary', onClick: m => { done = true; m.close(); res(true); } }] });
    });
  },
  /* modal containing a form; save(data, modal) returns truthy to close */
  formModal({ title, icon, size = 'md', fields, save, saveLabel = 'Save', extraButtons = [], onOpen }) {
    return this.modal({ title, icon, size, body: `<form class="form-grid" novalidate>${fields}</form>`, onOpen,
      buttons: [...extraButtons, { label: 'Cancel', cls: 'btn-light', onClick: m => m.close() },
        { label: saveLabel, cls: 'btn-primary', icon: 'check', onClick: m => { const data = this.formData(m.el.querySelector('form')); const r = this.try(() => save(data, m)); if (r) m.close(); } }] });
  },

  /* ---------- forms ---------- */
  fld(label, input, cls = '') { return `<div class="fld ${cls}"><label>${label}</label>${input}</div>`; },
  inp(name, value = '', attrs = '') { return `<input name="${name}" value="${this.esc(value)}" ${attrs}>`; },
  sel(name, optionsHtml, attrs = '') { return `<select name="${name}" ${attrs}>${optionsHtml}</select>`; },
  opts(list, valFn, labFn, selected, placeholder) {
    return (placeholder !== undefined ? `<option value="">${this.esc(placeholder)}</option>` : '') +
      list.map(x => { const v = typeof valFn === 'function' ? valFn(x) : x[valFn]; return `<option value="${this.esc(v)}" ${String(v) === String(selected ?? '') ? 'selected' : ''}>${this.esc(typeof labFn === 'function' ? labFn(x) : x[labFn])}</option>`; }).join('');
  },
  formData(form) {
    const o = {};
    form.querySelectorAll('[name]').forEach(el => { if (el.type === 'checkbox') o[el.name] = el.checked; else if (el.type === 'radio') { if (el.checked) o[el.name] = el.value; } else o[el.name] = el.value.trim ? el.value.trim() : el.value; });
    return o;
  },
  accountOpts(selected, filter, placeholder = '— Select account —') {
    const list = db().accounts.filter(a => a.active !== false && !a.isGroup && (!filter || filter(a))).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
    return this.opts(list, 'id', a => a.code + ' · ' + a.name, selected, placeholder);
  },
  itemDatalist(id = 'dl-items', filter) {
    return `<datalist id="${id}">${db().items.filter(i => i.active !== false && (!filter || filter(i))).map(i => `<option value="${this.esc(i.code + ' — ' + i.name)}"></option>`).join('')}</datalist>`;
  },
  findItem(text) {
    const t = String(text || '').trim().toLowerCase(); if (!t) return null;
    const items = db().items;
    return items.find(i => (i.code + ' — ' + i.name).toLowerCase() === t) || items.find(i => (i.barcode || '').toLowerCase() === t) || items.find(i => i.code.toLowerCase() === t) || items.find(i => i.name.toLowerCase() === t) || null;
  },
  itemLabel(i) { return i ? i.code + ' — ' + i.name : ''; },

  /* ---------- layout pieces ---------- */
  head({ title, icon, crumbs = [], actions = '', sub = '' }) {
    return `<div class="page-head">
      <div><div class="crumbs"><a href="#/dashboard">${this.icon('home')}Home</a>${crumbs.map(([l, p]) => `${this.icon('chevR')}${p ? `<a href="#/${p}">${this.esc(l)}</a>` : `<span>${this.esc(l)}</span>`}`).join('')}</div>
      <h1 class="page-title">${icon ? `<span class="pt-ic">${this.icon(icon)}</span>` : ''}${this.esc(title)}</h1>${sub ? `<div class="page-sub">${sub}</div>` : ''}</div>
      <div class="page-actions">${actions}</div></div>`;
  },
  btn(label, { icon, cls = 'btn-light', attrs = '' } = {}) { return `<button type="button" class="btn ${cls}" ${attrs}>${icon ? this.icon(icon) : ''}${label ? `<span>${this.esc(label)}</span>` : ''}</button>`; },
  tabs(list, active, base) { return `<div class="tabs">${list.map(([k, l, n]) => `<a class="tab ${k === active ? 'active' : ''}" href="#/${base}/${k}">${this.esc(l)}${n !== undefined ? ` <span class="tab-n">${n}</span>` : ''}</a>`).join('')}</div>`; },
  empty(msg, icon = 'box', action = '') { return `<div class="empty">${this.icon(icon)}<p>${this.esc(msg)}</p>${action}</div>`; },
  kpi(label, value, { icon = 'chart', tone = '', link = '', sub = '' } = {}) {
    return `<${link ? `a href="#/${link}"` : 'div'} class="kpi ${tone}"><div class="kpi-ic">${this.icon(icon)}</div><div><div class="kpi-l">${this.esc(label)}</div><div class="kpi-v">${value}</div>${sub ? `<div class="kpi-s">${sub}</div>` : ''}</div></${link ? 'a' : 'div'}>`;
  },
  bars(data, fmt = v => this.num(v)) {
    const max = Math.max(1, ...data.map(d => Math.abs(d.value)));
    return `<div class="bars">${data.map(d => `<${d.link ? `a href="#/${d.link}"` : 'div'} class="bar" title="${this.esc(d.label)}: ${this.esc(fmt(d.value))}">
      <div class="bar-v">${fmt(d.value)}</div><div class="bar-track"><div class="bar-fill" style="height:${Math.max(2, Math.abs(d.value) / max * 100)}%"></div></div><div class="bar-l">${this.esc(d.label)}</div></${d.link ? 'a' : 'div'}>`).join('')}</div>`;
  },
  hbars(data, fmt = v => this.num(v)) {
    const max = Math.max(1, ...data.map(d => Math.abs(d.value)));
    return `<div class="hbars">${data.map(d => `<${d.link ? `a href="#/${d.link}"` : 'div'} class="hbar"><div class="hbar-l">${this.esc(d.label)}</div><div class="hbar-track"><div class="hbar-fill" style="width:${Math.max(1, Math.abs(d.value) / max * 100)}%"></div></div><div class="hbar-v">${fmt(d.value)}</div></${d.link ? 'a' : 'div'}>`).join('')}</div>`;
  },

  /* ---------- data table ---------- */
  mountTable(el, cfg) {
    const st = { q: '', sort: cfg.sort || null, dir: cfg.dir || 1, page: 1, size: cfg.pageSize || 15 };
    const txt = (c, r) => c.text ? c.text(r) : (r[c.key] ?? '');
    el.innerHTML = `<div class="tbl-tools">${cfg.search === false ? '<div></div>' : `<div class="search-box">${this.icon('search')}<input type="search" placeholder="${this.esc(cfg.placeholder || 'Search…')}" data-q></div>`}
      <div class="tbl-tools-r">${cfg.tools || ''}<span class="muted" data-count></span>${cfg.csv ? this.btn('CSV', { icon: 'download', cls: 'btn-light btn-sm', attrs: 'data-csv title="Export to CSV"' }) : ''}</div></div>
      <div class="table-wrap"></div><div class="pager"></div>`;
    const wrap = el.querySelector('.table-wrap'), pager = el.querySelector('.pager');
    const filtered = () => {
      let rows = cfg.rows.slice();
      if (st.q) { const q = st.q.toLowerCase(); rows = rows.filter(r => cfg.columns.some(c => String(txt(c, r)).toLowerCase().includes(q))); }
      if (st.sort) {
        const c = cfg.columns.find(c => c.key === st.sort);
        if (c) { const v = r => c.sortVal ? c.sortVal(r) : txt(c, r); rows.sort((a, b) => { const x = v(a), y = v(b); return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x ?? '').localeCompare(String(y ?? ''), undefined, { numeric: true })) * st.dir; }); }
      }
      return rows;
    };
    const body = () => {
      const rows = filtered(), pages = Math.max(1, Math.ceil(rows.length / st.size));
      if (st.page > pages) st.page = pages;
      const slice = rows.slice((st.page - 1) * st.size, st.page * st.size);
      el.querySelector('[data-count]').textContent = rows.length + ' record' + (rows.length === 1 ? '' : 's');
      wrap.innerHTML = `<table class="tbl ${cfg.onRow ? 'clickable' : ''} ${cfg.cls || ''}"><thead><tr>${cfg.columns.map(c => `<th class="${c.align === 'r' ? 'r' : c.align === 'c' ? 'c' : ''} ${c.sort === false ? '' : 'sortable'}" data-k="${c.key}" ${c.width ? `style="width:${c.width}"` : ''}>${this.esc(c.label)}${st.sort === c.key ? (st.dir > 0 ? ' ▲' : ' ▼') : ''}</th>`).join('')}</tr></thead>
        <tbody>${slice.length ? slice.map((r, i) => `<tr data-i="${i}" class="${cfg.rowCls ? cfg.rowCls(r) : ''}">${cfg.columns.map(c => `<td class="${c.align === 'r' ? 'r' : c.align === 'c' ? 'c' : ''}">${c.render ? c.render(r) : this.esc(txt(c, r))}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${cfg.columns.length}" class="empty-row">${this.esc(cfg.empty || 'No records found.')}</td></tr>`}</tbody>
        ${cfg.footer && rows.length ? `<tfoot><tr>${cfg.footer(rows)}</tr></tfoot>` : ''}</table>`;
      pager.innerHTML = pages > 1 ? `<button class="btn btn-light btn-sm" data-p="-1" ${st.page === 1 ? 'disabled' : ''}>${this.icon('chevL')}</button><span>Page ${st.page} of ${pages}</span><button class="btn btn-light btn-sm" data-p="1" ${st.page === pages ? 'disabled' : ''}>${this.icon('chevR')}</button>
        <select data-size>${[10, 15, 25, 50, 100].map(n => `<option ${n === st.size ? 'selected' : ''}>${n}</option>`).join('')}</select>` : '';
      wrap.querySelectorAll('th.sortable').forEach(th => th.onclick = () => { const k = th.dataset.k; if (st.sort === k) st.dir = -st.dir; else { st.sort = k; st.dir = 1; } body(); });
      wrap.querySelectorAll('tbody tr[data-i]').forEach(tr => {
        const r = slice[+tr.dataset.i];
        tr.querySelectorAll('[data-act]').forEach(b => b.onclick = e => { e.stopPropagation(); cfg.onAction && cfg.onAction(b.dataset.act, r, e); });
        if (cfg.onRow) tr.onclick = e => { if (!e.target.closest('a[href],button,input,select,label')) cfg.onRow(r, e); };
      });
      pager.querySelectorAll('[data-p]').forEach(b => b.onclick = () => { st.page += +b.dataset.p; body(); });
      const sz = pager.querySelector('[data-size]'); if (sz) sz.onchange = () => { st.size = +sz.value; st.page = 1; body(); };
    };
    const q = el.querySelector('[data-q]'); if (q) q.oninput = () => { st.q = q.value; st.page = 1; body(); };
    const csvBtn = el.querySelector('[data-csv]');
    if (csvBtn) csvBtn.onclick = () => { const cols = cfg.columns.filter(c => !c.noExport); this.csv(cfg.csv, [cols.map(c => c.label), ...filtered().map(r => cols.map(c => txt(c, r)))]); };
    body();
    return { refresh(rows) { if (rows) cfg.rows = rows; body(); }, rows: () => filtered() };
  },

  /* ---------- export / print ---------- */
  csv(name, rows) {
    const s = rows.map(r => r.map(v => { v = String(v ?? ''); return /[",\n]/.test(v) ? '"' + v.replace(/"/g, '""') + '"' : v; }).join(',')).join('\r\n');
    this.download(name.replace(/\.csv$/, '') + '.csv', '﻿' + s, 'text/csv;charset=utf-8');
  },
  download(name, content, type = 'application/octet-stream') {
    const a = document.createElement('a'), url = URL.createObjectURL(new Blob([content], { type }));
    a.href = url; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 2000);
  },
  print(html, receipt = false) {
    const pa = document.getElementById('print-area');
    pa.innerHTML = html; pa.className = receipt ? 'receipt' : '';
    document.body.classList.add('printing');
    setTimeout(() => { window.print(); setTimeout(() => { document.body.classList.remove('printing'); pa.innerHTML = ''; }, 300); }, 60);
  },
  printTable(title, sub, tableHtml) {
    const s = db().settings;
    this.print(`<div class="doc"><div class="doc-head"><div><div class="doc-co">${this.esc(s.company)}</div><div class="muted">${this.esc(s.address)} · ${this.esc(s.phone)}</div></div><div class="doc-title">${this.esc(title)}</div></div>
      ${sub ? `<div class="muted" style="margin-bottom:10px">${sub}</div>` : ''}${tableHtml}<div class="doc-foot">Printed ${this.datetime(U.now())} by ${this.esc(Eng.user())} — Devma Accounting System</div></div>`);
  },
  logoSvg(size = 40) {
    return `<svg width="${size}" height="${size}" viewBox="0 0 64 64" aria-hidden="true"><rect x="6" y="34" width="10" height="22" rx="2" fill="var(--logo-1)"/><rect x="20" y="24" width="10" height="32" rx="2" fill="var(--logo-2)"/><rect x="34" y="14" width="10" height="42" rx="2" fill="var(--logo-3)"/><path d="M48 8h10v10" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M8 30 26 16l10 6L58 8" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
  },
};
