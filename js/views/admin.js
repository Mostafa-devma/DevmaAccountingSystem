/* Devma — User management, Settings, Backup, Automated tasks */
'use strict';
const ROLE_LBL = { admin: 'Administrator', accountant: 'Accountant', cashier: 'Cashier', storekeeper: 'Store keeper', custom: 'Custom' };

/* ---------------- Users ---------------- */
V.userForm = u => {
  const d = db(), isNew = !u; u = u || { fullName: '', username: '', role: 'cashier', perms: ROLE_PERMS.cashier.slice(), active: true };
  const has = k => u.perms === '*' || (Array.isArray(u.perms) && u.perms.includes(k));
  UI.formModal({ title: isNew ? 'New user' : 'Edit user — ' + u.username, icon: 'usercog', size: 'lg',
    fields: UI.fld('Full name *', UI.inp('fullName', u.fullName)) + UI.fld('Username *', UI.inp('username', u.username, isNew ? 'autocomplete="off"' : 'readonly')) +
      (isNew ? UI.fld('Password *', UI.inp('password', '', 'type="password" autocomplete="new-password"')) : '') + UI.fld('Role', UI.sel('role', UI.opts(Object.entries(ROLE_LBL), 0, 1, u.role))) +
      `<div class="fld fld-full"><label>Module permissions</label><div class="perm-grid">${MODULES.map(m => `<label class="check"><input type="checkbox" data-perm="${m.key}" ${has(m.key) ? 'checked' : ''}> ${UI.icon(m.icon)} ${m.label}</label>`).join('')}</div>
        <div class="row gap mt-s"><button type="button" class="btn btn-light btn-sm" id="pm-all">Select all</button><button type="button" class="btn btn-light btn-sm" id="pm-none">Clear all</button></div></div>
      <label class="check fld-full"><input type="checkbox" name="active" ${u.active !== false ? 'checked' : ''}> Active (can log in)</label>`,
    extraButtons: isNew ? [] : [{ label: 'Reset password', icon: 'key', onClick: () => UI.formModal({ title: 'Reset password — ' + u.username, icon: 'key', size: 'sm', fields: UI.fld('New password', UI.inp('p', '', 'type="password"'), 'fld-full'),
      save: x => { if (x.p.length < 4) throw new Error('Use at least 4 characters.'); d.users.find(y => y.id === u.id).password = x.p; Eng.audit('Reset password', u.username); Store.save(); UI.toast('Password reset'); return true; } }) }],
    onOpen: me => {
      const f = me.querySelector('form'), boxes = () => me.querySelectorAll('[data-perm]');
      f.role.onchange = () => { const p = ROLE_PERMS[f.role.value]; if (!p) return; boxes().forEach(b => b.checked = p === '*' || p.includes(b.dataset.perm)); };
      me.querySelector('#pm-all').onclick = () => boxes().forEach(b => b.checked = true);
      me.querySelector('#pm-none').onclick = () => boxes().forEach(b => b.checked = false);
    },
    save: (x, m) => {
      if (!x.fullName || !x.username) throw new Error('Name and username are required.');
      if (isNew && d.users.some(y => y.username.toLowerCase() === x.username.toLowerCase())) throw new Error('Username already exists.');
      if (isNew && (x.password || '').length < 4) throw new Error('Password must have at least 4 characters.');
      const perms = [...m.el.querySelectorAll('[data-perm]')].filter(b => b.checked).map(b => b.dataset.perm);
      const finalPerms = x.role === 'admin' ? '*' : perms;
      const me = App.user.id === u.id;
      if (me && !x.active) throw new Error('You cannot deactivate yourself.');
      const admins = d.users.filter(y => y.active && y.role === 'admin' && y.id !== u.id).length;
      if (!isNew && u.role === 'admin' && (x.role !== 'admin' || !x.active) && !admins) throw new Error('At least one active administrator is required.');
      const o = isNew ? { id: U.uid('u'), username: x.username, password: x.password, created: U.now() } : d.users.find(y => y.id === u.id);
      Object.assign(o, { fullName: x.fullName, role: x.role, perms: finalPerms, active: x.active }); if (isNew) d.users.push(o);
      Eng.audit(isNew ? 'Created user' : 'Updated user', o.username); Store.save(); UI.toast('User saved');
      if (me) { App.user = o; App.shell(); } else App.refresh();
      return true;
    } });
};
V.users = (el, [tab = 'list']) => {
  const d = db();
  el.innerHTML = UI.head({ title: 'User Management', icon: 'usercog', crumbs: [['Settings', 'settings'], ['Users']], actions: UI.btn('New user', { icon: 'plus', cls: 'btn-primary', attrs: 'id="u-new"' }) }) +
    UI.tabs([['list', 'Users', d.users.length], ['log', 'Activity log', d.audit.length]], tab, 'users') + '<div class="card"><div id="u-tbl"></div></div>';
  if (tab === 'list') UI.mountTable(el.querySelector('#u-tbl'), { rows: d.users, onRow: r => V.userForm(r), rowCls: r => r.active ? '' : 'dim',
    columns: [{ key: 'fullName', label: 'Name', render: r => `<span class="avatar sm">${UI.esc(r.fullName[0] || '?')}</span> <b>${UI.esc(r.fullName)}</b>${r.id === App.user.id ? ' ' + UI.badge('You', 'blue') : ''}` }, { key: 'username', label: 'Username' }, { key: 'role', label: 'Role', text: r => ROLE_LBL[r.role] || r.role },
      { key: 'perms', label: 'Access', text: r => r.perms === '*' ? 'All modules' : r.perms.length + ' of ' + MODULES.length + ' modules' }, { key: 'last', label: 'Last login', text: r => r.lastLogin ? UI.datetime(r.lastLogin) : 'Never', sortVal: r => r.lastLogin || '' },
      { key: 'active', label: 'Status', render: r => r.active ? UI.badge('Active', 'green') : UI.badge('Disabled', 'red'), text: r => r.active ? 'Active' : 'Disabled' },
      { key: 'a', label: '', sort: false, render: r => `<span class="row-acts"><button class="btn btn-light btn-sm" data-act="toggle">${r.active ? 'Disable' : 'Enable'}</button><button class="icon-btn sm" data-act="del" title="Delete">${UI.icon('trash')}</button></span>` }],
    onAction: async (act, r) => {
      if (r.id === App.user.id) return UI.toast('You cannot ' + (act === 'del' ? 'delete' : 'disable') + ' your own account.', 'warn');
      if (r.role === 'admin' && d.users.filter(y => y.active && y.role === 'admin').length < 2 && (act === 'del' || r.active)) return UI.toast('At least one active administrator is required.', 'warn');
      if (act === 'toggle') { r.active = !r.active; Eng.audit(r.active ? 'Enabled user' : 'Disabled user', r.username); Store.save(); return App.refresh(); }
      if (await UI.confirm(`Delete user ${r.username}? Their past documents keep their name.`, { danger: true, ok: 'Delete' })) { d.users = d.users.filter(y => y.id !== r.id); Eng.audit('Deleted user', r.username); Store.save(); App.refresh(); }
    } });
  else UI.mountTable(el.querySelector('#u-tbl'), { rows: d.audit, csv: 'activity-log', pageSize: 25, empty: 'No activity yet.',
    columns: [{ key: 'date', label: 'When', text: r => UI.datetime(r.date), sortVal: r => r.date }, { key: 'user', label: 'User' }, { key: 'action', label: 'Action', render: r => UI.badge(r.action, /Delet/.test(r.action) ? 'red' : /Creat|Produc/.test(r.action) ? 'green' : 'gray') }, { key: 'detail', label: 'Detail' }] });
  el.querySelector('#u-new').onclick = () => V.userForm();
};

/* ---------------- Settings ---------------- */
const PALETTES = [['emerald', 'Emerald & Amber'], ['plum', 'Plum & Coral'], ['forest', 'Forest & Lime'], ['graphite', 'Graphite & Orange']];
V.settings = el => {
  const d = db(), s = d.settings;
  el.innerHTML = UI.head({ title: 'Settings', icon: 'settings', crumbs: [['Settings']], actions: UI.btn('Save settings', { icon: 'check', cls: 'btn-primary', attrs: 'id="s-save"' }) }) + `
  <form id="s-form" class="grid g2">
    <div class="card"><div class="card-head"><h3>${UI.icon('warehouse')}Company</h3></div><div class="card-body form-grid">
      ${UI.fld('Company name', UI.inp('company', s.company), 'fld-full')}${UI.fld('Address', UI.inp('address', s.address), 'fld-full')}${UI.fld('Phone', UI.inp('phone', s.phone))}${UI.fld('Email', UI.inp('email', s.email))}${UI.fld('Tax / VAT number', UI.inp('taxNo', s.taxNo))}
      ${UI.fld('Base currency', `<input value="${UI.esc(UI.base().code + ' — ' + UI.base().name)}" readonly>`)}</div></div>
    <div class="card"><div class="card-head"><h3>${UI.icon('file')}Sales & invoices</h3></div><div class="card-body form-grid">
      ${UI.fld('Default tax rate %', UI.inp('taxRate', s.taxRate, 'type="number" step="any" min="0"'))}${UI.fld('Decimals', UI.sel('decimals', UI.opts([0, 2, 3], x => x, x => x, s.decimals)))}
      ${UI.fld('Walk-in (cash) customer', UI.sel('walkInCustomerId', UI.opts(Eng.parties('customer'), 'id', 'name', s.walkInCustomerId)))}${UI.fld('Default warehouse', UI.sel('defaultWarehouseId', UI.opts(d.warehouses, 'id', 'name', Eng.defWh())))}
      ${UI.fld('Default cash account', UI.sel('defaultCashAccountId', UI.opts(Eng.cashAccounts(), 'id', 'name', Eng.defCash())))}${UI.fld('Invoice footer', UI.inp('invoiceFooter', s.invoiceFooter))}
      <label class="check fld-full"><input type="checkbox" name="allowNegative" ${s.allowNegative ? 'checked' : ''}> Allow selling more than the available stock (negative stock)</label>
      <label class="check fld-full"><input type="checkbox" name="lowStockAlerts" ${s.lowStockAlerts ? 'checked' : ''}> Show low-stock alerts in notifications</label></div></div>
    <div class="card"><div class="card-head"><h3>${UI.icon('sparkle')}Appearance</h3></div><div class="card-body">
      <div class="palettes">${PALETTES.map(([k, l]) => `<button type="button" class="palette ${s.theme === k ? 'active' : ''}" data-pal="${k}"><span class="pal-sw pal-${k}"><i></i><i></i><i></i></span>${l}</button>`).join('')}</div>
      <label class="check mt"><input type="checkbox" id="s-dark" ${s.dark ? 'checked' : ''}> Dark mode</label>
      <div class="fld mt"><label>Language</label><select id="s-lang" class="no-tr"><option value="en" ${I18N.ar ? '' : 'selected'}>English</option><option value="ar" ${I18N.ar ? 'selected' : ''}>العربية</option></select></div></div></div>
    <div class="card"><div class="card-head"><h3>${UI.icon('info')}Quick links</h3></div><div class="card-body links-grid">
      ${[['users/list', 'usercog', 'Users & permissions'], ['backup', 'database', 'Backup & restore'], ['tasks', 'clock', 'Automated tasks'], ['currencies', 'coins', 'Currencies & rates'], ['accounts/chart', 'book', 'Chart of accounts'], ['warehouses', 'warehouse', 'Warehouses']].filter(([p]) => App.can({ 'users/list': 'users', backup: 'backup', tasks: 'tasks', currencies: 'currencies', 'accounts/chart': 'accounts', warehouses: 'warehouses' }[p])).map(([p, i, l]) => `<a href="#/${p}" class="qlink">${UI.icon(i)}${l}</a>`).join('')}</div></div>
  </form>`;
  el.querySelectorAll('[data-pal]').forEach(b => b.onclick = () => { s.theme = b.dataset.pal; Store.save(); App.applyTheme(); el.querySelectorAll('[data-pal]').forEach(x => x.classList.toggle('active', x === b)); UI.toast('Theme changed'); });
  el.querySelector('#s-lang').onchange = e => { I18N.set(e.target.value); App.go('settings'); };
  el.querySelector('#s-dark').onchange = e => { s.dark = e.target.checked; Store.save(); App.applyTheme(); };
  el.querySelector('#s-save').onclick = () => {
    const x = UI.formData(el.querySelector('#s-form'));
    if (!x.company) return UI.toast('Company name is required.', 'error');
    Object.assign(s, { company: x.company, address: x.address, phone: x.phone, email: x.email, taxNo: x.taxNo, taxRate: +x.taxRate || 0, decimals: +x.decimals, walkInCustomerId: x.walkInCustomerId, defaultWarehouseId: x.defaultWarehouseId, defaultCashAccountId: x.defaultCashAccountId, invoiceFooter: x.invoiceFooter, allowNegative: x.allowNegative, lowStockAlerts: x.lowStockAlerts });
    Eng.audit('Updated', 'Settings'); Store.save(); UI.toast('Settings saved'); App.shell();
  };
};

/* ---------------- Backup ---------------- */
V.backup = el => {
  const d = db(), snaps = Snapshots.list(), size = JSON.stringify(d).length;
  el.innerHTML = UI.head({ title: 'Backup', icon: 'database', crumbs: [['Settings', 'settings'], ['Backup']] }) + `
  <div class="grid g2">
    <div class="card"><div class="card-head"><h3>${UI.icon('download')}Download backup</h3></div><div class="card-body"><p>Save a complete copy of all data (${(size / 1024).toFixed(1)} KB) to a file. Keep it on a USB drive or cloud folder.</p>
      <button class="btn btn-primary" id="b-down">${UI.icon('download')}<span>Download backup file</span></button></div></div>
    <div class="card"><div class="card-head"><h3>${UI.icon('upload')}Restore from file</h3></div><div class="card-body"><p>Replace all current data with a backup file. A safety snapshot is taken first.</p>
      <label class="btn btn-light file-btn">${UI.icon('upload')}<span>Choose backup file…</span><input type="file" id="b-file" accept=".json,application/json" hidden></label></div></div>
  </div>
  <div class="card mt"><div class="card-head"><h3>${UI.icon('history')}Local snapshots (last 5)</h3><button class="btn btn-light btn-sm" id="b-snap">${UI.icon('plus')}<span>Create snapshot now</span></button></div><div id="b-tbl"></div></div>
  <div class="card mt danger-zone"><div class="card-head"><h3>${UI.icon('alert')}Danger zone</h3></div><div class="card-body row gap wrap">
    <button class="btn btn-light" id="b-demo">${UI.icon('refresh')}<span>Reset to demo data</span></button>
    <button class="btn btn-danger" id="b-fresh">${UI.icon('trash')}<span>Start fresh (empty company)</span></button>
    <p class="muted sm grow">Both actions take a snapshot first, so you can undo from the list above.</p></div></div>`;
  UI.mountTable(el.querySelector('#b-tbl'), { rows: snaps, search: false, empty: 'No snapshots yet. Automated tasks can create one daily.',
    columns: [{ key: 'date', label: 'Taken', text: r => UI.datetime(r.date) }, { key: 'label', label: 'Label' }, { key: 'size', label: 'Size', align: 'r', text: r => (r.size / 1024).toFixed(1) + ' KB' },
      { key: 'a', label: '', sort: false, render: () => `<span class="row-acts"><button class="btn btn-light btn-sm" data-act="restore">${UI.icon('refresh')}<span>Restore</span></button><button class="icon-btn sm" data-act="dl" title="Download">${UI.icon('download')}</button><button class="icon-btn sm" data-act="del" title="Delete">${UI.icon('trash')}</button></span>` }],
    onAction: async (act, r) => {
      if (act === 'dl') return UI.download(`devma-snapshot-${r.date.slice(0, 10)}.json`, r.data, 'application/json');
      if (act === 'del') { Snapshots.remove(r.id); UI.toast('Snapshot deleted'); return App.refresh(); }
      if (await UI.confirm(`Restore the snapshot from ${UI.datetime(r.date)}? Current data will be replaced.`, { danger: true, ok: 'Restore' })) restore(JSON.parse(Snapshots.get(r.id).data), 'Before restoring snapshot');
    } });
  const restore = (data, label) => {
    if (!data || !data.version || !Array.isArray(data.items) || !Array.isArray(data.accounts) || !Array.isArray(data.journal)) return UI.toast('This is not a valid Devma backup.', 'error');
    Snapshots.create(label); Store.replace(data); Eng.audit('Restored', 'Data restored from backup'); Store.save();
    UI.toast('Data restored'); const u = db().users.find(x => x.id === App.user.id && x.active); if (!u) return App.logout(); App.user = u; App.applyTheme(); App.shell();
  };
  el.querySelector('#b-down').onclick = () => { UI.download(`devma-backup-${U.today()}.json`, JSON.stringify(db(), null, 1), 'application/json'); Eng.audit('Backup', 'Downloaded backup file'); Store.save(); UI.toast('Backup downloaded'); };
  el.querySelector('#b-file').onchange = e => {
    const f = e.target.files[0]; if (!f) return; const rd = new FileReader();
    rd.onload = async () => { let data; try { data = JSON.parse(rd.result); } catch (err) { return UI.toast('Could not read the file.', 'error'); }
      if (await UI.confirm(`Restore "${f.name}"? All current data will be replaced.`, { danger: true, ok: 'Restore' })) restore(data, 'Before restoring ' + f.name); e.target.value = ''; };
    rd.readAsText(f);
  };
  el.querySelector('#b-snap').onclick = () => { Snapshots.create('Manual snapshot'); UI.toast('Snapshot created'); App.refresh(); };
  el.querySelector('#b-demo').onclick = async () => { if (await UI.confirm('Replace all data with the demo company?', { danger: true, ok: 'Reset' })) { Snapshots.create('Before demo reset'); Seed.demo(); Store.save(); UI.toast('Demo data loaded'); App.user = db().users.find(u => u.username === 'admin'); sessionStorage.setItem('devma_uid', App.user.id); App.shell(); } };
  el.querySelector('#b-fresh').onclick = async () => {
    if (!(await UI.confirm('Erase ALL items, accounts, invoices and stock and start an empty company? Users and settings are kept.', { danger: true, ok: 'Erase everything' }))) return;
    Snapshots.create('Before start fresh');
    const old = db(), b = Seed.blank();
    b.users = old.users; Object.assign(b.settings, old.settings, { defaultWarehouseId: 'wh_main', walkInCustomerId: 'acc_c_walkin', defaultCashAccountId: 'acc_cash' });
    b.currencies = old.currencies; b.warehouses = [{ id: 'wh_main', name: 'Main Warehouse', location: '' }];
    b.accounts.push({ id: 'acc_c_walkin', code: '1200-001', name: 'Walk-in Customer', type: 'asset', parentId: 'acc_ar', kind: 'customer', active: true });
    b.tasks = old.tasks.map(t => Object.assign(t, { lastRun: null }));
    Store.replace(b); Eng.audit('Reset', 'Started fresh company'); Store.save(); UI.toast('Empty company ready'); App.shell();
  };
};

/* ---------------- Automated tasks ---------------- */
V.taskForm = t => {
  const d = db(), isNew = !t; t = t || { name: '', type: 'backup', frequency: 'daily', active: true, config: {} };
  const c = t.config || {};
  UI.formModal({ title: isNew ? 'New automated task' : 'Edit task', icon: 'clock', size: 'lg',
    fields: UI.fld('Task name *', UI.inp('name', t.name), 'fld-2') + UI.fld('Action', UI.sel('type', UI.opts(Object.entries(Eng.TASKS), 0, 1, t.type))) + UI.fld('Repeat', UI.sel('frequency', UI.opts([['hourly', 'Every hour'], ['daily', 'Every day'], ['weekly', 'Every week'], ['monthly', 'Every 30 days']], 0, 1, t.frequency))) +
      `<div class="fld-full form-grid rec-only">${UI.fld('Expense account', UI.sel('accountId', UI.accountOpts(c.accountId, a => a.type === 'expense')))}${UI.fld('Pay from', UI.sel('cashAccountId', UI.opts(Eng.cashAccounts(), 'id', 'name', c.cashAccountId || Eng.defCash())))}${UI.fld('Amount (' + UI.base().code + ')', UI.inp('amount', c.amount || '', 'type="number" step="any" min="0"'))}${UI.fld('Voucher description', UI.inp('memo', c.memo || ''))}</div>
      <p class="muted sm fld-full" id="tk-help"></p><label class="check fld-full"><input type="checkbox" name="active" ${t.active ? 'checked' : ''}> Active</label>`,
    onOpen: me => { const f = me.querySelector('form'), up = () => { me.querySelector('.rec-only').hidden = f.type.value !== 'recurring'; me.querySelector('#tk-help').textContent = { backup: 'Saves a local snapshot of all data (the last 5 are kept).', lowstock: 'Checks every item against its minimum quantity and sends a notification.', recurring: 'Creates a payment voucher automatically — e.g. rent, internet, subscriptions.', summary: "Posts a notification with today's sales count and total." }[f.type.value]; }; f.type.onchange = up; up(); },
    save: x => {
      if (!x.name) throw new Error('Task name is required.');
      if (x.type === 'recurring' && (!x.accountId || !(+x.amount > 0))) throw new Error('Choose an expense account and amount.');
      const o = isNew ? { id: U.uid('tk'), lastRun: null } : Eng.get('tasks', t.id);
      Object.assign(o, { name: x.name, type: x.type, frequency: x.frequency, active: x.active, config: x.type === 'recurring' ? { accountId: x.accountId, cashAccountId: x.cashAccountId, amount: +x.amount, memo: x.memo } : {} });
      if (isNew) d.tasks.push(o); Eng.audit(isNew ? 'Created task' : 'Updated task', o.name); Store.save(); UI.toast('Task saved'); App.refresh(); return true;
    } });
};
V.tasks = el => {
  const d = db();
  el.innerHTML = UI.head({ title: 'Automated Tasks', icon: 'clock', crumbs: [['Settings', 'settings'], ['Automated tasks']], sub: 'Due tasks run automatically while Devma is open (checked every minute and at login).',
    actions: UI.btn('Run all due now', { icon: 'play', attrs: 'id="t-due"' }) + UI.btn('New task', { icon: 'plus', cls: 'btn-primary', attrs: 'id="t-new"' }) }) +
    `<div class="card"><div id="t-tbl"></div></div><div class="card mt"><div class="card-head"><h3>${UI.icon('history')}Run history</h3></div><div id="t-log"></div></div>`;
  UI.mountTable(el.querySelector('#t-tbl'), { rows: d.tasks, search: false, onRow: r => V.taskForm(r), empty: 'No tasks yet.',
    columns: [{ key: 'name', label: 'Task', render: r => `<b>${UI.esc(r.name)}</b><div class="muted sm">${Eng.TASKS[r.type]}${r.type === 'recurring' ? ' · ' + UI.money(r.config.amount) + ' → ' + UI.esc(accName(r.config.accountId)) : ''}</div>` },
      { key: 'frequency', label: 'Repeat', text: r => ({ hourly: 'Hourly', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' })[r.frequency] },
      { key: 'active', label: 'Active', render: r => `<label class="switch" title="Turn on/off"><input type="checkbox" data-act="toggle" ${r.active ? 'checked' : ''}><span></span></label>` },
      { key: 'lastRun', label: 'Last run', text: r => r.lastRun ? UI.datetime(r.lastRun) : 'Never', sortVal: r => r.lastRun || '' }, { key: 'next', label: 'Next run', text: r => r.active ? (Eng.taskDue(r) ? 'Due now' : UI.datetime(Eng.nextRun(r))) : '—' },
      { key: 'res', label: 'Last result', text: r => r.lastResult || '' },
      { key: 'a', label: '', sort: false, render: () => `<span class="row-acts"><button class="btn btn-light btn-sm" data-act="run">${UI.icon('play')}<span>Run now</span></button><button class="icon-btn sm" data-act="del" title="Delete">${UI.icon('trash')}</button></span>` }],
    onAction: async (act, r, e) => {
      if (act === 'toggle') { Eng.get('tasks', r.id).active = e.target.checked; Store.save(); UI.toast(r.name + (e.target.checked ? ' enabled' : ' paused')); return App.refresh(); }
      if (act === 'run') { const res = Eng.runTask(r.id); UI.toast(res.result, res.ok ? 'success' : 'error'); App.refreshBell(); return App.refresh(); }
      if (await UI.confirm(`Delete task "${r.name}"?`, { danger: true, ok: 'Delete' })) { d.tasks = d.tasks.filter(x => x.id !== r.id); Store.save(); App.refresh(); }
    } });
  UI.mountTable(el.querySelector('#t-log'), { rows: d.taskLog, search: false, pageSize: 10, empty: 'Tasks have not run yet.',
    columns: [{ key: 'date', label: 'When', text: r => UI.datetime(r.date) }, { key: 'name', label: 'Task' }, { key: 'ok', label: 'Status', render: r => r.ok ? UI.badge('OK', 'green') : UI.badge('Failed', 'red') }, { key: 'result', label: 'Result' }] });
  el.querySelector('#t-new').onclick = () => V.taskForm();
  el.querySelector('#t-due').onclick = () => { const n = Eng.runDueTasks(); UI.toast(n ? n + ' task(s) ran' : 'No tasks are due right now.', n ? 'success' : 'info'); App.refreshBell(); App.refresh(); };
};
