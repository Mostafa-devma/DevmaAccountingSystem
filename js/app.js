/* Devma Accounting System — application shell, login, router, navigation */
'use strict';
const V = {}; // views register themselves here

const MODULES = [
  { key: 'rooms', label: 'Rooms', icon: 'bed', path: 'rooms', hue: 'h1' },
  { key: 'pos', label: 'P.O.S', icon: 'pos', path: 'pos', hue: 'h2' },
  { key: 'converter', label: 'Money Converter', icon: 'exchange', path: 'converter', hue: 'h3' },
  { key: 'categories', label: 'Categories', icon: 'layers', path: 'categories', hue: 'h4' },
  { key: 'currencies', label: 'Currencies', icon: 'coins', path: 'currencies', hue: 'h5' },
  { key: 'vouchers', label: 'Vouchers', icon: 'receipt', path: 'vouchers/receipt', hue: 'h6' },
  { key: 'items', label: 'Items', icon: 'box', path: 'items', hue: 'h2' },
  { key: 'inventory', label: 'Stock Inventory', icon: 'clipboard', path: 'inventory', hue: 'h3' },
  { key: 'accounts', label: 'Accounts', icon: 'users', path: 'accounts/chart', hue: 'h4' },
  { key: 'invoices', label: 'Invoices', icon: 'file', path: 'invoices/sale', hue: 'h5' },
  { key: 'cashbox', label: 'Cash Box', icon: 'wallet', path: 'cashbox', hue: 'h6' },
  { key: 'salesman', label: 'Salesman', icon: 'badge', path: 'salesman', hue: 'h1' },
  { key: 'stockmgmt', label: 'Stock Management', icon: 'truck', path: 'stock/transfers', hue: 'h3' },
  { key: 'production', label: 'Production Line', icon: 'factory', path: 'production/orders', hue: 'h4' },
  { key: 'disassembly', label: 'Disassembling', icon: 'split', path: 'disassembly', hue: 'h5' },
  { key: 'trialbalance', label: 'Trial Balance', icon: 'scale', path: 'trial-balance', hue: 'h6' },
  { key: 'statement', label: 'Account Statement', icon: 'book', path: 'statement', hue: 'h1' },
  { key: 'warehouses', label: 'Warehouses', icon: 'warehouse', path: 'warehouses', hue: 'h2' },
  { key: 'users', label: 'User Management', icon: 'usercog', path: 'users/list', hue: 'h4' },
  { key: 'settings', label: 'Settings', icon: 'settings', path: 'settings', hue: 'h5' },
  { key: 'waste', label: 'Update / Waste Stock', icon: 'refresh', path: 'waste', hue: 'h6' },
  { key: 'backup', label: 'Backup', icon: 'database', path: 'backup', hue: 'h1' },
  { key: 'reports', label: 'All Reports', icon: 'chart', path: 'reports', hue: 'h2' },
  { key: 'tasks', label: 'Automated Tasks', icon: 'clock', path: 'tasks', hue: 'h3' },
];

const NAV = [
  { label: 'Dashboard', icon: 'home', path: 'dashboard' },
  { label: 'Items', icon: 'box', children: [['Items List', 'items', 'items'], ['Categories', 'categories', 'categories'], ['Warehouses', 'warehouses', 'warehouses']] },
  { label: 'Currencies', icon: 'coins', children: [['Currencies', 'currencies', 'currencies'], ['Money Converter', 'converter', 'converter']] },
  { label: 'Stock Management', icon: 'truck', children: [['Stock Inventory', 'inventory', 'inventory'], ['Transfers', 'stock/transfers', 'stockmgmt'], ['Opening Stock', 'stock/opening', 'stockmgmt'], ['Stock Movements', 'stock/moves', 'stockmgmt'], ['Update / Waste', 'waste', 'waste'], ['Production Line', 'production/orders', 'production'], ['Disassembling', 'disassembly', 'disassembly']] },
  { label: 'Sales & POS', icon: 'pos', children: [['Point of Sale', 'pos', 'pos'], ['Rooms', 'rooms', 'rooms'], ['Salesmen', 'salesman', 'salesman'], ['Cash Box', 'cashbox', 'cashbox']] },
  { label: 'Accounts', icon: 'users', children: [['Chart of Accounts', 'accounts/chart', 'accounts'], ['Customers', 'accounts/customers', 'accounts'], ['Suppliers', 'accounts/suppliers', 'accounts']] },
  { label: 'Invoices', icon: 'file', children: [['Sales', 'invoices/sale', 'invoices'], ['Purchases', 'invoices/purchase', 'invoices'], ['Sales Returns', 'invoices/sale_return', 'invoices'], ['Purchase Returns', 'invoices/purchase_return', 'invoices']] },
  { label: 'Vouchers', icon: 'receipt', children: [['Receipts', 'vouchers/receipt', 'vouchers'], ['Payments', 'vouchers/payment', 'vouchers'], ['Journal', 'vouchers/journal', 'vouchers']] },
  { label: 'Reports', icon: 'chart', children: [['All Reports', 'reports', 'reports'], ['Trial Balance', 'trial-balance', 'trialbalance'], ['Account Statement', 'statement', 'statement']] },
  { label: 'Settings', icon: 'settings', children: [['General Settings', 'settings', 'settings'], ['User Management', 'users/list', 'users'], ['Backup', 'backup', 'backup'], ['Automated Tasks', 'tasks', 'tasks']] },
  { label: 'About System', icon: 'info', path: 'about' },
];

const QUICK = [
  ['pos', 'pos', 'Point of Sale', 'pos'], ['file', 'invoice/new/sale', 'New sales invoice', 'invoices'], ['truck', 'invoice/new/purchase', 'New purchase invoice', 'invoices'],
  ['cash', 'vouchers/receipt?new=1', 'New receipt voucher', 'vouchers'], ['wallet', 'vouchers/payment?new=1', 'New payment voucher', 'vouchers'], ['box', 'items', 'Items', 'items'],
  ['book', 'statement', 'Account statement', 'statement'], ['chart', 'reports', 'Reports', 'reports'], ['exchange', 'converter', 'Money converter', 'converter'], ['database', 'backup', 'Backup', 'backup'],
];

/* route name -> [permission, view function name] */
const ROUTES = {
  dashboard: [null, 'dashboard'], about: [null, 'about'],
  rooms: ['rooms', 'rooms'], pos: ['pos', 'pos'], converter: ['converter', 'converter'], categories: ['categories', 'categories'], currencies: ['currencies', 'currencies'],
  vouchers: ['vouchers', 'vouchers'], voucher: ['vouchers', 'voucherView'], items: ['items', 'items'], item: ['items', 'item'], inventory: ['inventory', 'inventory'],
  accounts: ['accounts', 'accounts'], invoices: ['invoices', 'invoices'], invoice: ['invoices', 'invoice'], cashbox: ['cashbox', 'cashbox'],
  salesman: ['salesman', 'salesman'], stock: ['stockmgmt', 'stock'], production: ['production', 'production'], disassembly: ['disassembly', 'disassembly'],
  'trial-balance': ['trialbalance', 'trialBalance'], statement: ['statement', 'statement'], journal: ['statement', 'journalView'], warehouses: ['warehouses', 'warehouses'],
  users: ['users', 'users'], settings: ['settings', 'settings'], waste: ['waste', 'waste'], backup: ['backup', 'backup'], reports: ['reports', 'reports'], report: ['reports', 'report'], tasks: ['tasks', 'tasks'],
};

const App = {
  user: null, route_: null,
  init() {
    Store.load(); this.applyTheme();
    const uid = sessionStorage.getItem('devma_uid') || localStorage.getItem('devma_uid');
    const u = uid && db().users.find(x => x.id === uid && x.active);
    if (u) { this.user = u; this.shell(); } else this.loginScreen();
    window.addEventListener('hashchange', () => this.route());
    setInterval(() => { if (this.user && Eng.runDueTasks()) this.refreshBell(); }, 60000);
  },
  applyTheme() {
    const s = db().settings, html = document.documentElement;
    html.dataset.palette = s.theme || 'emerald';
    html.dataset.theme = s.dark ? 'dark' : 'light';
  },
  can(perm) { if (!perm || !this.user) return true; const p = this.user.perms; return p === '*' || (Array.isArray(p) && p.includes(perm)); },
  go(path) { const h = '#/' + path; if (location.hash === h) this.route(); else location.hash = h; },
  refresh() { this.route(); },

  /* ---------------- login ---------------- */
  loginScreen() {
    document.getElementById('app').innerHTML = `
    <div class="login">
      <section class="login-promo">
        <div class="promo-top"><div class="promo-brand">${UI.logoSvg(34)}<span>Devma<br><small>Computers &amp; Software</small></span></div></div>
        <h2>ORGANIZE YOUR<br><b>BUSINESS</b><br>WITH US</h2>
        <p class="promo-lead">One system for sales, stock, rooms, production and accounting — built for growing businesses.</p>
        <div class="promo-art">${this.promoArt()}</div>
        <ul class="promo-list"><li>${UI.icon('check')}Point of sale &amp; invoices</li><li>${UI.icon('check')}Live stock across warehouses</li><li>${UI.icon('check')}Double-entry accounting &amp; reports</li><li>${UI.icon('check')}Multi-currency with converter</li></ul>
        <div class="promo-contact"><b>GET IN TOUCH</b><span>info@devma.com · +961 1 234 567</span></div>
      </section>
      <section class="login-main"><button type="button" class="btn btn-light btn-sm login-lang no-tr" id="lang-btn">${I18N.ar ? 'English' : 'العربية'}</button>
        <div class="login-logo">${UI.logoSvg(110)}</div>
        <div class="login-name"><b>Devma</b> Accounting System</div>
        <form class="login-card" id="login-form" autocomplete="on">
          <div class="login-title">Login To Your Account Into <a href="#" id="dd-link">DevmaData</a></div>
          <label class="login-fld">${UI.icon('user')}<input name="username" placeholder="Username" autocomplete="username" required autofocus></label>
          <label class="login-fld">${UI.icon('lock')}<input name="password" type="password" placeholder="Password" autocomplete="current-password" required><button type="button" class="icon-btn" id="pw-eye" title="Show password">${UI.icon('eye')}</button></label>
          <div class="login-row"><label class="check"><input type="checkbox" name="remember"> Remember me</label><a href="#" id="forgot">Forgot password?</a></div>
          <div class="login-err" id="login-err"></div>
          <button class="btn btn-primary btn-block" type="submit">${UI.icon('logout')}<span>Login</span></button>
          <div class="login-hint">Demo users: <code>admin / admin</code> · <code>cashier / 1234</code> · <code>accountant / 1234</code></div>
        </form>
        <div class="login-foot">© ${new Date().getFullYear()} Devma Accounting System v1.0</div>
      </section>
    </div>`;
    const f = document.getElementById('login-form');
    f.onsubmit = e => {
      e.preventDefault();
      const { username, password, remember } = UI.formData(f);
      const u = db().users.find(x => x.username.toLowerCase() === username.toLowerCase() && x.password === password);
      const err = document.getElementById('login-err');
      if (!u) { err.textContent = 'Wrong username or password.'; f.classList.remove('shake'); void f.offsetWidth; f.classList.add('shake'); return; }
      if (!u.active) { err.textContent = 'This user is disabled. Contact your administrator.'; return; }
      this.user = u; sessionStorage.setItem('devma_uid', u.id); if (remember) localStorage.setItem('devma_uid', u.id);
      u.lastLogin = U.now(); Eng.audit('Login', u.fullName); Store.save();
      if (!location.hash || location.hash === '#/') location.hash = '#/dashboard';
      this.shell();
    };
    document.getElementById('lang-btn').onclick = () => I18N.toggle();
    document.getElementById('pw-eye').onclick = () => { const p = f.password; p.type = p.type === 'password' ? 'text' : 'password'; };
    document.getElementById('forgot').onclick = e => { e.preventDefault(); UI.modal({ title: 'Forgot password', icon: 'key', size: 'sm', body: '<p>Passwords are reset by an administrator from <b>Settings → User Management → Reset password</b>.</p><p class="muted">Demo administrator: <code>admin / admin</code></p>', buttons: [{ label: 'OK', cls: 'btn-primary', onClick: m => m.close() }] }); };
    document.getElementById('dd-link').onclick = e => { e.preventDefault(); const d = db(); UI.modal({ title: 'DevmaData — database', icon: 'database', size: 'sm', body: `<p>Company: <b>${UI.esc(d.settings.company)}</b></p><p>Records: ${d.items.length} items · ${d.invoices.length} invoices · ${d.journal.length} journal entries</p><p class="muted">Data is stored securely in this browser. Use Backup to move it to another computer.</p>`, buttons: [{ label: 'OK', cls: 'btn-primary', onClick: m => m.close() }] }); };
  },
  promoArt() {
    return `<svg viewBox="0 0 260 150" class="promo-svg" aria-hidden="true"><rect x="10" y="20" width="160" height="110" rx="10" fill="rgba(255,255,255,.12)"/><rect x="24" y="36" width="70" height="8" rx="4" fill="rgba(255,255,255,.55)"/><rect x="24" y="52" width="110" height="6" rx="3" fill="rgba(255,255,255,.25)"/>
      <rect x="30" y="100" width="16" height="20" rx="3" fill="var(--accent)"/><rect x="54" y="86" width="16" height="34" rx="3" fill="rgba(255,255,255,.6)"/><rect x="78" y="74" width="16" height="46" rx="3" fill="var(--accent)"/><rect x="102" y="64" width="16" height="56" rx="3" fill="rgba(255,255,255,.6)"/><rect x="126" y="80" width="16" height="40" rx="3" fill="var(--accent)"/>
      <rect x="150" y="54" width="100" height="80" rx="10" fill="rgba(255,255,255,.92)"/><circle cx="178" cy="86" r="16" fill="none" stroke="var(--primary)" stroke-width="8" stroke-dasharray="60 41"/><circle cx="178" cy="86" r="16" fill="none" stroke="var(--accent)" stroke-width="8" stroke-dasharray="40 61" stroke-dashoffset="-60"/>
      <rect x="202" y="72" width="38" height="6" rx="3" fill="var(--primary)"/><rect x="202" y="84" width="30" height="6" rx="3" fill="var(--accent)"/><rect x="202" y="96" width="24" height="6" rx="3" fill="#cbd5e1"/></svg>`;
  },
  logout() {
    Eng.audit('Logout', this.user ? this.user.fullName : ''); Store.save();
    sessionStorage.removeItem('devma_uid'); localStorage.removeItem('devma_uid'); this.user = null;
    document.getElementById('modal-root').innerHTML = '';
    location.hash = ''; this.loginScreen();
  },

  /* ---------------- shell ---------------- */
  shell() {
    const s = db().settings;
    document.getElementById('app').innerHTML = `
    <div class="shell ${localStorage.getItem('devma_side') === 'min' ? 'side-min' : ''}" id="shell">
      <header class="topbar">
        <div class="titlebar"><span>${UI.logoSvg(16)} Devma ERP System v1.0 — ${UI.esc(s.company)}</span><span id="clock"></span></div>
        <div class="toprow">
          <button class="icon-btn menu-btn" id="menu-btn" title="Toggle menu">${UI.icon('menu')}</button>
          <a class="brand" href="#/dashboard">${UI.logoSvg(38)}<span><b>Devma</b><small>System</small></span></a>
          <nav class="quickbar">${QUICK.filter(q => this.can(q[3])).map(([ic, path, title]) => `<a class="qbtn" href="#/${path}" title="${title}" aria-label="${title}">${UI.icon(ic)}</a>`).join('')}</nav>
          <div class="top-right">
            <div class="tsearch"><span>${UI.icon('search')}</span><input id="gsearch" type="search" placeholder="Search items, accounts, invoices…" autocomplete="off"><div class="search-results" id="gresults"></div></div>
            <button class="icon-btn lang-btn no-tr" id="lang-top" title="${I18N.ar ? 'English' : 'العربية'}">${I18N.ar ? 'EN' : 'ع'}</button>
            <button class="icon-btn" id="theme-btn" title="Toggle dark mode">${UI.icon(s.dark ? 'sun' : 'moon')}</button>
            <div class="dropdown"><button class="icon-btn" id="bell-btn" title="Notifications">${UI.icon('bell')}<span class="dot-n" id="bell-n"></span></button><div class="dd-menu dd-wide" id="bell-menu"></div></div>
            <div class="dropdown"><button class="user-btn" id="user-btn"><span class="avatar">${UI.esc(this.user.fullName[0] || 'U')}</span><span class="user-name">${UI.esc(this.user.fullName)}</span>${UI.icon('chevD')}</button>
              <div class="dd-menu" id="user-menu">
                <div class="dd-head"><b>${UI.esc(this.user.fullName)}</b><span>${UI.esc(this.user.role)} · ${UI.esc(this.user.username)}</span></div>
                <a href="#" data-um="profile">${UI.icon('user')}My profile</a><a href="#" data-um="password">${UI.icon('key')}Change password</a>
                ${this.can('settings') ? `<a href="#/settings">${UI.icon('settings')}Settings</a>` : ''}<a href="#/about">${UI.icon('info')}About system</a>
                <a href="#" data-um="logout" class="danger">${UI.icon('logout')}Logout</a></div></div>
          </div>
        </div>
      </header>
      <aside class="sidebar" id="sidebar">
        <div class="side-user"><span class="avatar">${UI.esc(this.user.fullName[0] || 'U')}</span><div>Welcome<br><b>${UI.esc(this.user.fullName)}</b></div></div>
        <nav class="nav" id="nav">${this.navHtml()}</nav>
        <div class="side-foot"><span>${UI.icon('database')} ${UI.esc(s.company)}</span></div>
      </aside>
      <div class="side-scrim" id="scrim"></div>
      <main class="content" id="content"></main>
    </div>`;
    this.bindShell();
    if (Eng.runDueTasks()) {/* tasks ran on login */}
    this.refreshBell();
    if (!location.hash || location.hash === '#/' || location.hash === '#') location.hash = '#/dashboard'; else this.route();
  },
  navHtml() {
    const open = JSON.parse(localStorage.getItem('devma_nav') || '[]');
    return NAV.map((g, gi) => {
      if (!g.children) return `<a class="nav-link top" href="#/${g.path}" data-path="${g.path}">${UI.icon(g.icon)}<span>${g.label}</span></a>`;
      const kids = g.children.filter(c => this.can(c[2])); if (!kids.length) return '';
      return `<div class="nav-group ${open.includes(gi) ? 'open' : ''}" data-g="${gi}"><button class="nav-head">${UI.icon(g.icon)}<span>${g.label}</span>${UI.icon('chevD', 'chev')}</button>
        <div class="nav-sub">${kids.map(([l, p]) => `<a class="nav-link" href="#/${p}" data-path="${p}">${UI.esc(l)}</a>`).join('')}</div></div>`;
    }).join('');
  },
  bindShell() {
    const $ = id => document.getElementById(id), shell = $('shell');
    $('menu-btn').onclick = () => {
      if (window.innerWidth < 900) shell.classList.toggle('side-open');
      else { shell.classList.toggle('side-min'); localStorage.setItem('devma_side', shell.classList.contains('side-min') ? 'min' : ''); }
    };
    $('scrim').onclick = () => shell.classList.remove('side-open');
    $('nav').querySelectorAll('.nav-head').forEach(h => h.onclick = () => {
      const g = h.parentElement; g.classList.toggle('open');
      const open = [...$('nav').querySelectorAll('.nav-group.open')].map(x => +x.dataset.g); localStorage.setItem('devma_nav', JSON.stringify(open));
    });
    $('lang-top').onclick = () => I18N.toggle();
    $('theme-btn').onclick = () => { db().settings.dark = !db().settings.dark; Store.save(); this.applyTheme(); $('theme-btn').innerHTML = UI.icon(db().settings.dark ? 'sun' : 'moon'); };
    const dd = (btn, menu) => { $(btn).onclick = e => { e.stopPropagation(); const m = $(menu), was = m.classList.contains('show'); document.querySelectorAll('.dd-menu.show').forEach(x => x.classList.remove('show')); if (!was) { if (menu === 'bell-menu') this.renderBell(); m.classList.add('show'); } }; };
    dd('bell-btn', 'bell-menu'); dd('user-btn', 'user-menu');
    document.addEventListener('click', e => { if (!e.target.closest('.dropdown')) document.querySelectorAll('.dd-menu.show').forEach(x => x.classList.remove('show')); if (!e.target.closest('.tsearch')) { const r = $('gresults'); r && r.classList.remove('show'); } });
    $('user-menu').querySelectorAll('[data-um]').forEach(a => a.onclick = e => {
      e.preventDefault(); $('user-menu').classList.remove('show');
      const k = a.dataset.um;
      if (k === 'logout') return UI.confirm('Log out of Devma?', { ok: 'Logout' }).then(y => y && this.logout());
      if (k === 'profile') return UI.formModal({ title: 'My profile', icon: 'user', fields: UI.fld('Full name', UI.inp('fullName', this.user.fullName, 'required')) + UI.fld('Username', UI.inp('u', this.user.username, 'readonly')) + UI.fld('Role', UI.inp('r', this.user.role, 'readonly')) + UI.fld('Last login', UI.inp('l', UI.datetime(this.user.lastLogin), 'readonly')),
        save: d => { if (!d.fullName) throw new Error('Name is required.'); const u = db().users.find(x => x.id === this.user.id); u.fullName = d.fullName; this.user = u; Store.save(); UI.toast('Profile updated'); this.shell(); return true; } });
      if (k === 'password') return UI.formModal({ title: 'Change password', icon: 'key', size: 'sm', fields: UI.fld('Current password', UI.inp('cur', '', 'type="password" required'), 'fld-full') + UI.fld('New password', UI.inp('n1', '', 'type="password" required'), 'fld-full') + UI.fld('Repeat new password', UI.inp('n2', '', 'type="password" required'), 'fld-full'),
        save: d => { const u = db().users.find(x => x.id === this.user.id); if (d.cur !== u.password) throw new Error('Current password is wrong.'); if (d.n1.length < 4) throw new Error('Use at least 4 characters.'); if (d.n1 !== d.n2) throw new Error('New passwords do not match.'); u.password = d.n1; Eng.audit('Changed password', u.username); Store.save(); UI.toast('Password changed'); return true; } });
    });
    this.bindSearch();
    const tick = () => { const c = $('clock'); if (c) c.textContent = new Date().toLocaleString(I18N.loc(), { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); };
    tick(); clearInterval(this._clock); this._clock = setInterval(tick, 30000);
  },
  bindSearch() {
    const inp = document.getElementById('gsearch'), box = document.getElementById('gresults');
    const run = () => {
      const q = inp.value.trim().toLowerCase(); if (q.length < 2) { box.classList.remove('show'); return; }
      const d = db(), res = [];
      if (this.can('items')) d.items.filter(i => (i.name + ' ' + i.code + ' ' + (i.barcode || '')).toLowerCase().includes(q)).slice(0, 6).forEach(i => res.push(['box', i.name, i.code + ' · ' + UI.money(i.price), 'item/' + i.id]));
      if (this.can('accounts')) d.accounts.filter(a => (a.name + ' ' + a.code + ' ' + (a.phone || '')).toLowerCase().includes(q)).slice(0, 5).forEach(a => res.push(['users', a.name, a.code + ' · ' + a.kind, (this.can('statement') ? 'statement/' : 'accounts/chart?') + a.id]));
      if (this.can('invoices')) d.invoices.filter(i => i.no.toLowerCase().includes(q)).slice(0, 5).forEach(i => res.push(['file', i.no, Eng.INV[i.type].label + ' · ' + UI.date(i.date), 'invoice/' + i.id]));
      if (this.can('vouchers')) d.vouchers.filter(v => v.no.toLowerCase().includes(q) || (v.memo || '').toLowerCase().includes(q)).slice(0, 4).forEach(v => res.push(['receipt', v.no, Eng.VCH[v.type].label + ' · ' + UI.date(v.date), 'voucher/' + v.id]));
      MODULES.filter(m => this.can(m.key) && (m.label.toLowerCase().includes(q) || I18N.tr(m.label).includes(q))).forEach(m => res.push([m.icon, m.label, 'Open module', m.path]));
      box.innerHTML = res.length ? res.map(([ic, t, s, p], i) => `<a href="#/${p}" class="${i === 0 ? 'hl' : ''}">${UI.icon(ic)}<span><b>${UI.esc(t)}</b><small>${UI.esc(s)}</small></span></a>`).join('') : '<div class="sr-empty">No results</div>';
      box.classList.add('show');
      box.querySelectorAll('a').forEach(a => a.onclick = () => { box.classList.remove('show'); inp.value = ''; });
    };
    inp.oninput = run; inp.onfocus = run;
    inp.onkeydown = e => { if (e.key === 'Enter') { const a = box.querySelector('a'); if (a) { location.hash = a.getAttribute('href'); box.classList.remove('show'); inp.value = ''; inp.blur(); } } if (e.key === 'Escape') { box.classList.remove('show'); inp.blur(); } };
  },
  refreshBell() { const n = db().notifications.filter(x => !x.read).length, el = document.getElementById('bell-n'); if (el) { el.textContent = n > 9 ? '9+' : n; el.style.display = n ? '' : 'none'; } },
  renderBell() {
    const m = document.getElementById('bell-menu'), list = db().notifications.slice(0, 12), low = Eng.lowStock();
    m.innerHTML = `<div class="dd-head row between"><b>Notifications</b><span><a href="#" data-n="read">Mark all read</a> · <a href="#" data-n="clear">Clear</a></span></div>
      ${low.length && db().settings.lowStockAlerts ? `<a href="#/report/lowstock" class="nt warn">${UI.icon('alert')}<span><b>${low.length} item(s) low on stock</b><small>${UI.esc(low.slice(0, 3).map(x => x.item.name).join(', '))}</small></span></a>` : ''}
      ${list.length ? list.map(n => `<a href="#/${n.link || 'dashboard'}" class="nt ${n.read ? '' : 'unread'} ${n.kind}" data-id="${n.id}">${UI.icon(n.kind === 'warn' ? 'alert' : 'bell')}<span><b>${UI.esc(n.title)}</b><small>${UI.esc(n.body)}</small><small class="muted">${UI.ago(n.date)}</small></span></a>`).join('') : '<div class="sr-empty">You are all caught up.</div>'}`;
    m.querySelectorAll('.nt[data-id]').forEach(a => a.onclick = () => { const n = db().notifications.find(x => x.id === a.dataset.id); if (n) n.read = true; Store.save(); this.refreshBell(); m.classList.remove('show'); });
    m.querySelectorAll('[data-n]').forEach(a => a.onclick = e => { e.preventDefault(); e.stopPropagation(); if (a.dataset.n === 'read') db().notifications.forEach(n => n.read = true); else db().notifications = []; Store.save(); this.refreshBell(); this.renderBell(); });
  },

  /* ---------------- router ---------------- */
  parse() {
    const h = decodeURIComponent(location.hash.replace(/^#\/?/, '')), [p, qs] = h.split('?');
    const q = {}; new URLSearchParams(qs || '').forEach((v, k) => q[k] = v);
    return { segs: p.split('/').filter(Boolean), q, path: p };
  },
  route() {
    if (!this.user) return;
    const el = document.getElementById('content'); if (!el) return;
    const { segs, q, path } = this.parse(), name = segs[0] || 'dashboard', r = ROUTES[name];
    document.getElementById('shell').classList.remove('side-open');
    document.querySelectorAll('.dd-menu.show').forEach(x => x.classList.remove('show'));
    document.querySelectorAll('.modal-backdrop').forEach(x => x.remove());
    document.getElementById('shell').classList.toggle('pos-mode', name === 'pos');
    document.querySelectorAll('#nav .nav-link').forEach(a => {
      const on = a.dataset.path === path || (a.dataset.path === name) || (path.startsWith(a.dataset.path + '/') && a.dataset.path.includes('/'));
      a.classList.toggle('active', on); if (on) { const g = a.closest('.nav-group'); g && g.classList.add('open'); }
    });
    el.scrollTop = 0; window.scrollTo(0, 0);
    if (!r || !V[r[1]]) { el.innerHTML = UI.head({ title: 'Page not found', icon: 'alert' }) + UI.empty('This page does not exist.', 'alert', `<a class="btn btn-primary" href="#/dashboard">Back to dashboard</a>`); return; }
    if (!this.can(r[0])) { el.innerHTML = UI.head({ title: 'Access denied', icon: 'lock' }) + UI.empty('Your user role does not have permission to open this module. Ask an administrator to grant it in User Management.', 'lock', `<a class="btn btn-primary" href="#/dashboard">Back to dashboard</a>`); return; }
    this.route_ = { name, segs, q };
    try { el.innerHTML = '<div class="page"></div>'; V[r[1]](el.firstChild, segs.slice(1), q); }
    catch (e) { console.error(e); el.innerHTML = UI.head({ title: 'Something went wrong', icon: 'alert' }) + `<div class="card"><div class="card-body"><p>${UI.esc(e.message)}</p><a class="btn btn-primary" href="#/dashboard">Back to dashboard</a></div></div>`; }
    const mod = MODULES.find(m => m.key === r[0]); document.title = I18N.tr((mod ? mod.label + ' · ' : '')) + I18N.tr('Devma Accounting System');
  },
  /* open the source document of a ledger / stock entry */
  openRef(type, id, jeId) {
    const map = { invoice: () => this.go('invoice/' + id), voucher: () => this.go('voucher/' + id), adjustment: () => V.showAdjustment(id), transfer: () => V.showTransfer(id), production: () => V.showProduction(id), disassembly: () => V.showDisassembly(id), shift: () => V.showShift(id) };
    if (map[type]) return map[type]();
    if (jeId) return this.go('journal/' + jeId);
  },
};
window.addEventListener('DOMContentLoaded', () => App.init());
