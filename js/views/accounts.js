/* Devma — Chart of accounts, customers & suppliers, account statement, trial balance */
'use strict';
const KIND_LBL = { general: 'General', cash: 'Cash', bank: 'Bank', customer: 'Customer', supplier: 'Supplier' };

/* customer / supplier form */
V.partyForm = (kind, acc, done) => {
  const d = db(), isNew = !acc, parent = kind === 'customer' ? 'acc_ar' : 'acc_ap';
  acc = acc || { name: '', phone: '', email: '', address: '', creditLimit: 0, salesmanId: '', active: true };
  UI.formModal({ title: (isNew ? 'New ' : 'Edit ') + kind, icon: 'users', size: 'lg',
    fields: UI.fld('Name *', UI.inp('name', acc.name, 'required'), 'fld-2') + UI.fld('Phone', UI.inp('phone', acc.phone)) + UI.fld('Email', UI.inp('email', acc.email, 'type="email"')) + UI.fld('Address', UI.inp('address', acc.address), 'fld-2') +
      (kind === 'customer' ? UI.fld('Credit limit (0 = none)', UI.inp('creditLimit', acc.creditLimit, 'type="number" min="0" step="any"')) + UI.fld('Default salesman', UI.sel('salesmanId', UI.opts(d.salesmen, 'id', 'name', acc.salesmanId, '— None —'))) : '') +
      (isNew ? UI.fld(`Opening balance (${kind === 'customer' ? 'they owe you' : 'you owe them'})`, UI.inp('opening', '', 'type="number" step="any" placeholder="0"')) + UI.fld('As of', UI.inp('openDate', U.today(), 'type="date"')) : '') +
      `<label class="check fld-full"><input type="checkbox" name="active" ${acc.active !== false ? 'checked' : ''}> Active</label>`,
    save: x => {
      if (!x.name) throw new Error('Name is required.');
      let o;
      Eng.tx(() => {
        if (isNew) {
          const n = d.accounts.filter(a => a.parentId === parent).length + 1;
          let code = (kind === 'customer' ? '1200-' : '2100-') + String(n).padStart(3, '0'); let k = n; while (d.accounts.some(a => a.code === code)) code = code.slice(0, 5) + String(++k).padStart(3, '0');
          o = { id: U.uid('acc'), code, type: kind === 'customer' ? 'asset' : 'liability', parentId: parent, kind, created: U.now() }; d.accounts.push(o);
        } else o = Eng.account(acc.id);
        Object.assign(o, { name: x.name, phone: x.phone, email: x.email, address: x.address, creditLimit: +x.creditLimit || 0, salesmanId: x.salesmanId || '', active: x.active });
        if (isNew && +x.opening) {
          const v = +x.opening, ob = Eng.A('opening');
          Eng.post({ date: x.openDate || U.today(), memo: 'Opening balance — ' + o.name, refType: 'opening', refId: o.id, ref: 'OPEN', lines: kind === 'customer' ? [{ accountId: o.id, debit: v }, { accountId: ob, credit: v }] : [{ accountId: ob, debit: v }, { accountId: o.id, credit: v }] });
        }
        Eng.audit(isNew ? 'Created' : 'Updated', kind + ' ' + o.name);
      });
      UI.toast((isNew ? 'Created ' : 'Saved ') + o.name); done && done(o); return true;
    } });
};
V.accountForm = (acc, done) => {
  const d = db(), isNew = !acc; acc = acc || { code: '', name: '', type: 'expense', parentId: '', isGroup: false, kind: 'general', active: true };
  UI.formModal({ title: isNew ? 'New account' : 'Edit account', icon: 'book', size: 'lg',
    fields: UI.fld('Code *', UI.inp('code', acc.code, acc.system ? 'readonly' : '')) + UI.fld('Name *', UI.inp('name', acc.name)) +
      UI.fld('Type', UI.sel('type', UI.opts(Object.entries(TYPE_LBL), 0, 1, acc.type), acc.system ? 'disabled' : '')) + UI.fld('Parent group', UI.sel('parentId', UI.opts(d.accounts.filter(a => a.isGroup && a.id !== acc.id), 'id', a => a.code + ' · ' + a.name, acc.parentId, '— Top level —'), acc.system ? 'disabled' : '')) +
      UI.fld('Kind', UI.sel('kind', UI.opts([['general', 'General'], ['cash', 'Cash box'], ['bank', 'Bank account']], 0, 1, acc.kind), acc.system || acc.kind === 'customer' || acc.kind === 'supplier' ? 'disabled' : '')) +
      `<label class="check fld-full"><input type="checkbox" name="isGroup" ${acc.isGroup ? 'checked' : ''} ${acc.system ? 'disabled' : ''}> This is a group (header) account — it only totals its sub-accounts</label><label class="check fld-full"><input type="checkbox" name="active" ${acc.active !== false ? 'checked' : ''}> Active</label>`,
    onOpen: me => { const f = me.querySelector('form'); if (isNew) f.parentId.onchange = () => { const p = Eng.account(f.parentId.value); if (p) { f.type.value = p.type; const sib = d.accounts.filter(a => a.parentId === p.id).length; if (!f.code.value) f.code.value = String(+p.code + (sib + 1) * 10); } }; },
    save: x => {
      if (!x.code || !x.name) throw new Error('Code and name are required.');
      if (d.accounts.some(a => a.code === x.code && a.id !== acc.id)) throw new Error('Code ' + x.code + ' is already used.');
      const o = isNew ? { id: U.uid('acc'), created: U.now() } : Eng.account(acc.id);
      if (!isNew && x.isGroup && !o.isGroup && d.journal.some(j => j.lines.some(l => l.accountId === o.id))) throw new Error('An account with postings cannot become a group.');
      if (acc.system) Object.assign(o, { name: x.name, active: x.active });
      else Object.assign(o, { code: x.code, name: x.name, type: x.type, parentId: x.parentId || null, isGroup: !!x.isGroup, kind: o.kind === 'customer' || o.kind === 'supplier' ? o.kind : (x.kind || 'general'), active: x.active });
      if (isNew) d.accounts.push(o);
      Eng.audit(isNew ? 'Created' : 'Updated', 'Account ' + o.code + ' ' + o.name); Store.save(); UI.toast('Account saved'); done && done(o); return true;
    } });
};
V.deleteAccount = async (acc, after) => {
  const d = db();
  if (acc.system) return UI.toast('System accounts cannot be deleted. You can rename them.', 'warn');
  if (d.accounts.some(a => a.parentId === acc.id)) return UI.toast('This account has sub-accounts.', 'warn');
  if (d.journal.some(j => j.lines.some(l => l.accountId === acc.id)) || d.invoices.some(i => i.accountId === acc.id)) {
    if (await UI.confirm(`"${acc.name}" has transactions and cannot be deleted. Deactivate it instead?`, { ok: 'Deactivate' })) { Eng.account(acc.id).active = false; Store.save(); UI.toast('Account deactivated'); after && after(); }
    return;
  }
  if (await UI.confirm(`Delete account "${acc.name}"?`, { danger: true, ok: 'Delete' })) { d.accounts = d.accounts.filter(a => a.id !== acc.id); Eng.audit('Deleted', 'Account ' + acc.name); Store.save(); UI.toast('Account deleted'); after && after(); }
};

V.accounts = (el, [tab = 'chart']) => {
  const d = db(), tt = Eng.totals(), map = Eng.childMap(), bal = a => Eng.natural(a, Eng.balance(a.id, { totals: tt, map }));
  const nC = Eng.parties('customer').length, nS = Eng.parties('supplier').length;
  const canSt = App.can('statement');
  if (tab === 'chart') {
    const order = [], walk = (pid, lvl) => d.accounts.filter(a => (a.parentId || null) === pid).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true })).forEach(a => { order.push({ a, lvl }); walk(a.id, lvl + 1); });
    walk(null, 0);
    el.innerHTML = UI.head({ title: 'Chart of Accounts', icon: 'users', crumbs: [['Accounts'], ['Chart of accounts']], actions: UI.btn('Expand / collapse', { icon: 'list', attrs: 'id="a-tog"' }) + UI.btn('New account', { icon: 'plus', cls: 'btn-primary', attrs: 'id="a-new"' }) }) +
      UI.tabs([['chart', 'Chart of accounts', d.accounts.length], ['customers', 'Customers', nC], ['suppliers', 'Suppliers', nS]], tab, 'accounts') +
      `<div class="card"><div class="table-wrap"><table class="tbl clickable coa"><thead><tr><th>Code</th><th>Account</th><th>Type</th><th>Kind</th><th class="r">Balance</th><th></th></tr></thead><tbody>
      ${order.map(({ a, lvl }) => `<tr data-id="${a.id}" data-lvl="${lvl}" class="${a.isGroup ? 'grp' : ''} ${a.active === false ? 'dim' : ''} ${lvl > 1 ? 'deep' : ''}"><td>${UI.esc(a.code)}</td><td style="padding-inline-start:${12 + lvl * 22}px">${a.isGroup ? UI.icon('chevD', 'sm-ic') : ''}${UI.esc(a.name)}${a.system ? ' <span class="muted sm">system</span>' : ''}</td><td>${TYPE_LBL[a.type]}</td><td>${KIND_LBL[a.kind] || ''}</td><td class="r">${UI.signed(bal(a))}</td>
        <td class="r"><span class="row-acts"><button class="icon-btn sm" data-act="edit" title="Edit">${UI.icon('edit')}</button><button class="icon-btn sm" data-act="del" title="Delete">${UI.icon('trash')}</button></span></td></tr>`).join('')}</tbody></table></div></div>`;
    el.querySelectorAll('tr[data-id]').forEach(tr => {
      const a = Eng.account(tr.dataset.id);
      tr.onclick = e => { const b = e.target.closest('[data-act]'); if (b) { e.stopPropagation(); return b.dataset.act === 'edit' ? (a.kind === 'customer' || a.kind === 'supplier' ? V.partyForm(a.kind, a, () => App.refresh()) : V.accountForm(a, () => App.refresh())) : V.deleteAccount(a, () => App.refresh()); } canSt ? App.go('statement/' + a.id) : V.accountForm(a, () => App.refresh()); };
    });
    let collapsed = false;
    el.querySelector('#a-tog').onclick = () => { collapsed = !collapsed; el.querySelectorAll('tr.deep').forEach(tr => tr.hidden = collapsed); };
    el.querySelector('#a-new').onclick = () => V.accountForm(null, () => App.refresh());
    return;
  }
  const kind = tab === 'customers' ? 'customer' : 'supplier';
  const rows = d.accounts.filter(a => a.kind === kind);
  const lastInv = id => { const l = d.invoices.filter(i => i.accountId === id).sort((a, b) => b.date.localeCompare(a.date))[0]; return l ? l.date : ''; };
  el.innerHTML = UI.head({ title: tab === 'customers' ? 'Customers' : 'Suppliers', icon: 'users', crumbs: [['Accounts', 'accounts/chart'], [tab === 'customers' ? 'Customers' : 'Suppliers']], actions: UI.btn('New ' + kind, { icon: 'plus', cls: 'btn-primary', attrs: 'id="a-new"' }) }) +
    UI.tabs([['chart', 'Chart of accounts', d.accounts.length], ['customers', 'Customers', nC], ['suppliers', 'Suppliers', nS]], tab, 'accounts') +
    `<div class="kpis">${UI.kpi(tab === 'customers' ? 'Customers' : 'Suppliers', rows.length, { icon: 'users' })}${UI.kpi(kind === 'customer' ? 'Total receivable' : 'Total payable', UI.money(U.sum(rows, bal)), { icon: 'coins', tone: 't2', link: App.can('reports') ? (kind === 'customer' ? 'report/customer_balances' : 'report/supplier_balances') : '' })}${UI.kpi('With balance', rows.filter(a => Math.abs(bal(a)) > 0.004).length, { icon: 'alert', tone: 't3' })}</div>
    <div class="card"><div id="a-tbl"></div></div>`;
  UI.mountTable(el.querySelector('#a-tbl'), { rows, csv: tab, sort: 'name', onRow: r => canSt ? App.go('statement/' + r.id) : V.partyForm(kind, r, () => App.refresh()), rowCls: r => r.active === false ? 'dim' : '',
    columns: [{ key: 'code', label: 'Code' }, { key: 'name', label: 'Name', render: r => `<b>${UI.esc(r.name)}</b>${r.email ? `<div class="muted sm">${UI.esc(r.email)}</div>` : ''}` }, { key: 'phone', label: 'Phone' },
      ...(kind === 'customer' ? [{ key: 'limit', label: 'Credit limit', align: 'r', text: r => +r.creditLimit ? UI.num(r.creditLimit) : '—' }] : []), { key: 'last', label: 'Last invoice', text: r => UI.date(lastInv(r.id)), sortVal: r => lastInv(r.id) },
      { key: 'bal', label: 'Balance', align: 'r', sortVal: bal, render: r => { const b = bal(r), over = kind === 'customer' && +r.creditLimit && b > +r.creditLimit; return `<b class="${over ? 'neg' : ''}">${UI.num(b)}</b>${over ? ' ' + UI.badge('Over limit', 'red') : ''}`; }, text: r => UI.num(bal(r)) },
      { key: 'a', label: '', sort: false, noExport: true, render: () => `<span class="row-acts">${App.can('invoices') ? `<button class="icon-btn sm" data-act="inv" title="New invoice">${UI.icon('file')}</button>` : ''}${App.can('vouchers') ? `<button class="icon-btn sm" data-act="pay" title="${kind === 'customer' ? 'Receive payment' : 'Make payment'}">${UI.icon('cash')}</button>` : ''}<button class="icon-btn sm" data-act="edit" title="Edit">${UI.icon('edit')}</button><button class="icon-btn sm" data-act="del" title="Delete">${UI.icon('trash')}</button></span>` }],
    onAction: (act, r) => {
      if (act === 'inv') return App.go(`invoice/new/${kind === 'customer' ? 'sale' : 'purchase'}?party=${r.id}`);
      if (act === 'pay') return V.voucherForm({ type: kind === 'customer' ? 'receipt' : 'payment', accountId: r.id, amount: Math.max(0, U.r(bal(r))) || '' }, () => App.refresh());
      if (act === 'edit') return V.partyForm(kind, r, () => App.refresh());
      if (r.id === d.settings.walkInCustomerId) return UI.toast('The walk-in customer is used by POS and cannot be deleted.', 'warn');
      V.deleteAccount(r, () => App.refresh());
    } });
  el.querySelector('#a-new').onclick = () => V.partyForm(kind, null, () => App.refresh());
};

/* ---------------- Account statement ---------------- */
V.statement = (el, [accId], q) => {
  const d = db(), from = q.from || U.yearStart(), to = q.to || U.today(), acc = accId && Eng.account(accId);
  const picker = `<div class="filters">${UI.fld('Account', `<select id="st-acc">${V.accountGroupedOpts(accId, () => true, '— Choose an account —').replace('<option value="">', '<option value="">')}${d.accounts.filter(a => a.isGroup).length ? `<optgroup label="Group accounts (totals)">${d.accounts.filter(a => a.isGroup).map(a => `<option value="${a.id}" ${a.id === accId ? 'selected' : ''}>${UI.esc(a.code + ' · ' + a.name)}</option>`).join('')}</optgroup>` : ''}</select>`, 'grow')}
    ${UI.fld('From', `<input type="date" id="st-from" value="${from}">`)}${UI.fld('To', `<input type="date" id="st-to" value="${to}">`)}
    <div class="chips">${[['This month', U.monthStart(), U.today()], ['This year', U.yearStart(), U.today()], ['Last 30 days', U.addDays(U.today(), -30), U.today()], ['All time', '2000-01-01', U.today()]].map(([l, f, t]) => `<button class="chip" data-f="${f}" data-t="${t}">${l}</button>`).join('')}</div></div>`;
  const go = (id, f, t) => App.go(`statement/${id || ''}?from=${f}&to=${t}`);
  if (!acc) {
    const tt = Eng.totals(), parties = d.accounts.filter(a => (a.kind === 'customer' || a.kind === 'supplier' || a.kind === 'cash' || a.kind === 'bank'));
    el.innerHTML = UI.head({ title: 'Account Statement', icon: 'book', crumbs: [['Reports', 'reports'], ['Account statement']] }) + `<div class="card">${picker}</div>
      <div class="card mt"><div class="card-head"><h3>${UI.icon('users')}Quick pick</h3></div><div class="pick-grid">${parties.map(a => `<a class="pick" href="#/statement/${a.id}?from=${from}&to=${to}"><span>${UI.icon(a.kind === 'customer' ? 'user' : a.kind === 'supplier' ? 'truck' : 'wallet')}</span><b>${UI.esc(a.name)}</b><small>${KIND_LBL[a.kind]} · ${UI.money(Eng.natural(a, Eng.balance(a.id, { totals: tt })))}</small></a>`).join('')}</div></div>`;
  } else {
    const ids = new Set(Eng.descendants(acc.id)), nat = x => Eng.natural(acc, x);
    const opening = nat(U.sum(d.journal.filter(j => j.date < from), j => U.sum(j.lines.filter(l => ids.has(l.accountId)), l => l.debit - l.credit)));
    const rows = []; let run = opening;
    d.journal.filter(j => j.date >= from && j.date <= to && j.lines.some(l => ids.has(l.accountId))).sort((a, b) => a.date.localeCompare(b.date) || (a.created || '').localeCompare(b.created || '')).forEach(j => {
      const ls = j.lines.filter(l => ids.has(l.accountId)), dr = U.sum(ls, l => l.debit), cr = U.sum(ls, l => l.credit);
      run += nat(dr - cr); rows.push({ j, dr, cr, bal: U.r(run) });
    });
    const tDr = U.sum(rows, r => r.dr), tCr = U.sum(rows, r => r.cr), party = acc.kind === 'customer' || acc.kind === 'supplier';
    el.innerHTML = UI.head({ title: acc.name, icon: 'book', crumbs: [['Reports', 'reports'], ['Account statement', 'statement'], [acc.code]], sub: `${UI.badge(TYPE_LBL[acc.type], 'blue')} ${UI.badge(KIND_LBL[acc.kind] || 'General', 'gray')} ${acc.phone ? UI.esc(acc.phone) : ''} · ${UI.date(from)} → ${UI.date(to)}`,
      actions: (party && App.can('invoices') ? `<a class="btn btn-light" href="#/invoice/new/${acc.kind === 'customer' ? 'sale' : 'purchase'}?party=${acc.id}">${UI.icon('file')}<span>New invoice</span></a>` : '') +
        (party && App.can('vouchers') ? UI.btn(acc.kind === 'customer' ? 'Receive payment' : 'Make payment', { icon: 'cash', attrs: 'id="st-pay"' }) : '') + UI.btn('Print', { icon: 'printer', cls: 'btn-primary', attrs: 'id="st-print"' }) }) +
      `<div class="card">${picker}</div>
      <div class="kpis">${UI.kpi('Opening balance', UI.money(opening), { icon: 'book' })}${UI.kpi('Total debit', UI.money(tDr), { icon: 'plus', tone: 't2' })}${UI.kpi('Total credit', UI.money(tCr), { icon: 'minus', tone: 't3' })}${UI.kpi('Closing balance', UI.money(run), { icon: 'scale', tone: 't4', sub: acc.kind === 'customer' ? (run > 0 ? 'customer owes you' : 'credit balance') : acc.kind === 'supplier' ? (run > 0 ? 'you owe supplier' : 'advance paid') : '' })}</div>
      <div class="card"><div id="st-tbl"></div></div>`;
    UI.mountTable(el.querySelector('#st-tbl'), { rows, csv: 'statement-' + acc.code, pageSize: 50, sort: null, onRow: r => r.j.refType ? App.openRef(r.j.refType, r.j.refId, r.j.id) : App.go('journal/' + r.j.id),
      columns: [{ key: 'date', label: 'Date', text: r => UI.date(r.j.date), sortVal: r => r.j.date }, { key: 'ref', label: 'Document', text: r => r.j.ref || r.j.no, render: r => `<a class="link">${UI.esc(r.j.ref || r.j.no)}</a>` }, { key: 'memo', label: 'Description', text: r => r.j.memo },
        { key: 'dr', label: 'Debit', align: 'r', sortVal: r => r.dr, text: r => r.dr ? UI.num(r.dr) : '' }, { key: 'cr', label: 'Credit', align: 'r', sortVal: r => r.cr, text: r => r.cr ? UI.num(r.cr) : '' }, { key: 'bal', label: 'Balance', align: 'r', sortVal: r => r.bal, render: r => `<b>${UI.signed(r.bal)}</b>`, text: r => UI.num(r.bal) }],
      footer: () => `<td colspan="3">Opening ${UI.num(opening)} · Closing</td><td class="r">${UI.num(tDr)}</td><td class="r">${UI.num(tCr)}</td><td class="r">${UI.num(run)}</td>`, empty: 'No transactions in this period.' });
    el.querySelector('#st-print').onclick = () => UI.printTable('Account statement — ' + acc.name, `${acc.code} · ${UI.date(from)} to ${UI.date(to)}`, `<table class="doc-table"><thead><tr><th>Date</th><th>Document</th><th>Description</th><th class="r">Debit</th><th class="r">Credit</th><th class="r">Balance</th></tr></thead><tbody><tr><td colspan="5"><i>Opening balance</i></td><td class="r">${UI.num(opening)}</td></tr>${rows.map(r => `<tr><td>${UI.date(r.j.date)}</td><td>${UI.esc(r.j.ref || r.j.no)}</td><td>${UI.esc(r.j.memo || '')}</td><td class="r">${r.dr ? UI.num(r.dr) : ''}</td><td class="r">${r.cr ? UI.num(r.cr) : ''}</td><td class="r">${UI.num(r.bal)}</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="3">Totals</td><td class="r">${UI.num(tDr)}</td><td class="r">${UI.num(tCr)}</td><td class="r">${UI.num(run)}</td></tr></tfoot></table>`);
    const pay = el.querySelector('#st-pay'); if (pay) pay.onclick = () => V.voucherForm({ type: acc.kind === 'customer' ? 'receipt' : 'payment', accountId: acc.id, amount: Math.max(0, U.r(Eng.natural(acc, Eng.balance(acc.id)))) || '' }, () => App.refresh());
  }
  el.querySelector('#st-acc').onchange = e => go(e.target.value, el.querySelector('#st-from').value, el.querySelector('#st-to').value);
  el.querySelector('#st-from').onchange = el.querySelector('#st-to').onchange = () => go(accId, el.querySelector('#st-from').value, el.querySelector('#st-to').value);
  el.querySelectorAll('.chips .chip').forEach(c => c.onclick = () => go(accId, c.dataset.f, c.dataset.t));
};

/* ---------------- Trial balance ---------------- */
V.trialBalance = (el, a, q) => {
  const d = db(), from = q.from || U.yearStart(), to = q.to || U.today(), mode = q.mode || 'detail', hideZero = q.zero !== '0';
  const before = Eng.totals({ to: U.addDays(from, -1) }), period = Eng.totals({ from, to }), map = Eng.childMap();
  const sumOf = (t, id) => { let dr = 0, cr = 0; Eng.descendants(id, map).forEach(i => { if (t[i]) { dr += t[i].dr; cr += t[i].cr; } }); return { dr, cr }; };
  const order = []; const walk = (pid, lvl) => d.accounts.filter(x => (x.parentId || null) === pid).sort((x, y) => x.code.localeCompare(y.code, undefined, { numeric: true })).forEach(x => { order.push({ a: x, lvl }); walk(x.id, lvl + 1); });
  walk(null, 0);
  const rows = order.filter(({ a, lvl }) => mode === 'summary' ? lvl === 0 : true).map(({ a, lvl }) => {
    const o = sumOf(before, a.id), p = sumOf(period, a.id), open = o.dr - o.cr, close = open + p.dr - p.cr;
    return { a, lvl, open: U.r(open), pdr: U.r(p.dr), pcr: U.r(p.cr), cdr: close > 0 ? U.r(close) : 0, ccr: close < 0 ? U.r(-close) : 0 };
  }).filter(r => !hideZero || r.open || r.pdr || r.pcr);
  const leaf = rows.filter(r => mode === 'summary' ? r.lvl === 0 : !r.a.isGroup);
  const T = k => U.r(U.sum(leaf, r => r[k])), ok = T('cdr') === T('ccr');
  el.innerHTML = UI.head({ title: 'Trial Balance', icon: 'scale', crumbs: [['Reports', 'reports'], ['Trial balance']], sub: `${UI.date(from)} → ${UI.date(to)} · ${ok ? UI.badge('Balanced', 'green') : UI.badge('Not balanced', 'red')}`,
    actions: UI.btn('CSV', { icon: 'download', attrs: 'id="tb-csv"' }) + UI.btn('Print', { icon: 'printer', cls: 'btn-primary', attrs: 'id="tb-print"' }) }) +
    `<div class="card"><div class="filters">${UI.fld('From', UI.inp('from', from, 'type="date"'))}${UI.fld('To', UI.inp('to', to, 'type="date"'))}${UI.fld('View', UI.sel('mode', UI.opts([['detail', 'Detailed (all accounts)'], ['summary', 'Summary (main groups)']], 0, 1, mode)))}
      <label class="check"><input type="checkbox" name="zero" ${hideZero ? 'checked' : ''}> Hide zero accounts</label></div>
      <div class="table-wrap"><table class="tbl clickable tb" id="tb-tbl"><thead><tr><th>Code</th><th>Account</th><th class="r">Opening</th><th class="r">Period debit</th><th class="r">Period credit</th><th class="r">Closing debit</th><th class="r">Closing credit</th></tr></thead><tbody>
      ${rows.map(r => `<tr data-id="${r.a.id}" class="${r.a.isGroup ? 'grp' : ''}"><td>${UI.esc(r.a.code)}</td><td style="padding-inline-start:${12 + (mode === 'summary' ? 0 : r.lvl) * 20}px">${UI.esc(r.a.name)}</td><td class="r">${UI.signed(r.open)}</td><td class="r">${UI.num(r.pdr)}</td><td class="r">${UI.num(r.pcr)}</td><td class="r">${r.cdr ? UI.num(r.cdr) : ''}</td><td class="r">${r.ccr ? UI.num(r.ccr) : ''}</td></tr>`).join('')}
      </tbody><tfoot><tr><td colspan="2">Totals ${mode === 'detail' ? '(posting accounts)' : ''}</td><td class="r">${UI.num(T('open'))}</td><td class="r">${UI.num(T('pdr'))}</td><td class="r">${UI.num(T('pcr'))}</td><td class="r">${UI.num(T('cdr'))}</td><td class="r">${UI.num(T('ccr'))}</td></tr></tfoot></table></div></div>
      <p class="muted sm">Click any account to open its statement for the same period. Group rows show the total of their sub-accounts.</p>`;
  el.querySelectorAll('.filters [name]').forEach(s => s.onchange = () => { const x = UI.formData(el.querySelector('.filters')); App.go(`trial-balance?from=${x.from}&to=${x.to}&mode=${x.mode}&zero=${x.zero ? 1 : 0}`); });
  el.querySelectorAll('#tb-tbl tbody tr').forEach(tr => tr.onclick = () => App.can('statement') ? App.go(`statement/${tr.dataset.id}?from=${from}&to=${to}`) : null);
  el.querySelector('#tb-print').onclick = () => UI.printTable('Trial balance', `${UI.date(from)} to ${UI.date(to)}`, el.querySelector('#tb-tbl').outerHTML.replace('clickable', ''));
  el.querySelector('#tb-csv').onclick = () => UI.csv('trial-balance', [['Code', 'Account', 'Opening', 'Period debit', 'Period credit', 'Closing debit', 'Closing credit'], ...rows.map(r => [r.a.code, r.a.name, r.open, r.pdr, r.pcr, r.cdr, r.ccr])]);
};
