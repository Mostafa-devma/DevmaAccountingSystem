/* Devma — Salesmen, Cash Box */
'use strict';

/* ================= SALESMEN ================= */
const smSales = (smId, from, to) => db().invoices.filter(i => i.salesmanId === smId && (i.type === 'sale' || i.type === 'sale_return') && (!from || i.date >= from) && (!to || i.date <= to));
const smNet = invs => U.sum(invs, i => (i.type === 'sale' ? 1 : -1) * Eng.calc(i).net / (+i.rate || 1));
const smPaid = (smId, from, to) => U.sum(db().vouchers.filter(v => v.salesmanId === smId && (!from || v.date >= from) && (!to || v.date <= to)), v => v.amount / (+v.rate || 1));
V.salesmanForm = (s, done) => {
  const d = db(), isNew = !s; s = s || { name: '', phone: '', commission: 2, active: true };
  UI.formModal({ title: isNew ? 'New salesman' : 'Edit salesman', icon: 'badge', size: 'sm', fields: UI.fld('Name *', UI.inp('name', s.name), 'fld-full') + UI.fld('Phone', UI.inp('phone', s.phone), 'fld-full') + UI.fld('Commission % (of net sales)', UI.inp('commission', s.commission, 'type="number" step="any" min="0" max="100"'), 'fld-full') + `<label class="check fld-full"><input type="checkbox" name="active" ${s.active !== false ? 'checked' : ''}> Active</label>`,
    save: x => { if (!x.name) throw new Error('Name is required.'); const o = isNew ? { id: U.uid('sm') } : Eng.get('salesmen', s.id); Object.assign(o, { name: x.name, phone: x.phone, commission: +x.commission || 0, active: x.active }); if (isNew) d.salesmen.push(o); Eng.audit(isNew ? 'Created' : 'Updated', 'Salesman ' + o.name); Store.save(); UI.toast('Salesman saved'); done ? done(o) : App.refresh(); return true; } });
};
V.salesman = (el, [id], q) => {
  const d = db(), from = q.from || U.monthStart(), to = q.to || U.today();
  if (!id) {
    el.innerHTML = UI.head({ title: 'Salesmen', icon: 'badge', crumbs: [['Sales & POS', 'pos'], ['Salesmen']], sub: `Performance ${UI.date(from)} → ${UI.date(to)}`, actions: UI.btn('New salesman', { icon: 'plus', cls: 'btn-primary', attrs: 'id="sm-new"' }) }) +
      `<div class="card"><div class="filters">${UI.fld('From', UI.inp('from', from, 'type="date"'))}${UI.fld('To', UI.inp('to', to, 'type="date"'))}</div><div id="sm-tbl"></div></div>`;
    el.querySelectorAll('.filters [name]').forEach(s => s.onchange = () => App.go(`salesman?from=${el.querySelector('[name=from]').value}&to=${el.querySelector('[name=to]').value}`));
    UI.mountTable(el.querySelector('#sm-tbl'), { rows: d.salesmen, csv: 'salesmen', onRow: r => App.go(`salesman/${r.id}?from=${from}&to=${to}`), rowCls: r => r.active === false ? 'dim' : '',
      columns: [{ key: 'name', label: 'Salesman', render: r => `<b>${UI.esc(r.name)}</b>` }, { key: 'phone', label: 'Phone' }, { key: 'commission', label: 'Commission %', align: 'r' },
        { key: 'n', label: 'Invoices', align: 'r', text: r => smSales(r.id, from, to).filter(i => i.type === 'sale').length }, { key: 'net', label: 'Net sales', align: 'r', sortVal: r => smNet(smSales(r.id, from, to)), text: r => UI.num(smNet(smSales(r.id, from, to))) },
        { key: 'com', label: 'Commission earned', align: 'r', text: r => UI.num(smNet(smSales(r.id, from, to)) * r.commission / 100) }, { key: 'paid', label: 'Paid', align: 'r', text: r => UI.num(smPaid(r.id, from, to)) },
        { key: 'a', label: '', sort: false, noExport: true, render: () => `<span class="row-acts"><button class="icon-btn sm" data-act="edit" title="Edit">${UI.icon('edit')}</button><button class="icon-btn sm" data-act="del" title="Delete">${UI.icon('trash')}</button></span>` }],
      onAction: async (act, r) => { if (act === 'edit') return V.salesmanForm(r); if (d.invoices.some(i => i.salesmanId === r.id)) { if (await UI.confirm(`${r.name} has invoices. Deactivate instead?`, { ok: 'Deactivate' })) { r.active = false; Store.save(); App.refresh(); } return; } if (await UI.confirm(`Delete ${r.name}?`, { danger: true, ok: 'Delete' })) { d.salesmen = d.salesmen.filter(x => x.id !== r.id); Store.save(); App.refresh(); } } });
    el.querySelector('#sm-new').onclick = () => V.salesmanForm();
    return;
  }
  const s = Eng.get('salesmen', id); if (!s) return App.go('salesman');
  const invs = smSales(id, from, to).sort((a, b) => b.date.localeCompare(a.date)), net = smNet(invs), earned = U.r(net * s.commission / 100), paid = U.r(smPaid(id, from, to));
  el.innerHTML = UI.head({ title: s.name, icon: 'badge', crumbs: [['Salesmen', 'salesman'], [s.name]], sub: `${s.phone ? UI.esc(s.phone) + ' · ' : ''}Commission ${s.commission}% · ${UI.date(from)} → ${UI.date(to)}`,
    actions: UI.btn('Edit', { icon: 'edit', attrs: 'id="sm-edit"' }) + (App.can('vouchers') ? UI.btn('Pay commission', { icon: 'cash', cls: 'btn-primary', attrs: 'id="sm-pay"' }) : '') }) +
    `<div class="card"><div class="filters">${UI.fld('From', UI.inp('from', from, 'type="date"'))}${UI.fld('To', UI.inp('to', to, 'type="date"'))}</div></div>
    <div class="kpis">${UI.kpi('Invoices', invs.filter(i => i.type === 'sale').length, { icon: 'file' })}${UI.kpi('Net sales', UI.money(net), { icon: 'chart', tone: 't2' })}${UI.kpi('Commission earned', UI.money(earned), { icon: 'coins', tone: 't3' })}${UI.kpi('Commission paid', UI.money(paid), { icon: 'check', tone: 't4' })}${UI.kpi('Commission due', UI.money(earned - paid), { icon: 'alert', tone: earned - paid > 0.004 ? 'warn' : 't5' })}</div>
    <div class="card"><div id="sm-inv"></div></div>`;
  el.querySelectorAll('.filters [name]').forEach(x => x.onchange = () => App.go(`salesman/${id}?from=${el.querySelector('[name=from]').value}&to=${el.querySelector('[name=to]').value}`));
  UI.mountTable(el.querySelector('#sm-inv'), { rows: invs, csv: 'salesman-' + s.name, onRow: r => App.go('invoice/' + r.id), empty: 'No sales in this period.',
    columns: [{ key: 'no', label: 'Invoice', render: r => `<b>${r.no}</b>` }, { key: 'date', label: 'Date', text: r => UI.date(r.date), sortVal: r => r.date }, { key: 't', label: 'Type', text: r => Eng.INV[r.type].label }, { key: 'party', label: 'Customer', text: r => accName(r.accountId) },
      { key: 'net', label: 'Net (excl. tax)', align: 'r', text: r => UI.num((r.type === 'sale' ? 1 : -1) * Eng.calc(r).net / (+r.rate || 1)) }, { key: 'c', label: 'Commission', align: 'r', text: r => UI.num((r.type === 'sale' ? 1 : -1) * Eng.calc(r).net / (+r.rate || 1) * s.commission / 100) }] });
  el.querySelector('#sm-edit').onclick = () => V.salesmanForm(s);
  const pay = el.querySelector('#sm-pay'); if (pay) pay.onclick = () => V.voucherForm({ type: 'payment', accountId: Eng.A('commission'), amount: Math.max(0, U.r(earned - paid)) || '', salesmanId: id, date: U.today(), memo: `Commission ${s.name} ${UI.date(from)} – ${UI.date(to)}` }, () => App.refresh());
};

/* ================= CASH BOX ================= */
V.cashbox = (el, a, q) => {
  const d = db(), day = q.date || U.today(), cash = Eng.cashAccounts(), tt = Eng.totals();
  const ids = new Set(cash.map(c => c.id));
  const lines = []; d.journal.filter(j => j.date === day).forEach(j => j.lines.forEach(l => { if (ids.has(l.accountId)) lines.push({ j, l }); }));
  const dayIn = id => U.sum(lines.filter(x => x.l.accountId === id), x => x.l.debit), dayOut = id => U.sum(lines.filter(x => x.l.accountId === id), x => x.l.credit);
  el.innerHTML = UI.head({ title: 'Cash Box', icon: 'wallet', crumbs: [['Sales & POS', 'pos'], ['Cash Box']], sub: 'Movements for ' + UI.date(day),
    actions: (App.can('vouchers') ? UI.btn('Cash in', { icon: 'plus', attrs: 'id="cb-in"' }) + UI.btn('Cash out', { icon: 'minus', attrs: 'id="cb-out"' }) + UI.btn('Transfer', { icon: 'exchange', attrs: 'id="cb-trf"' }) : '') + UI.btn('Close shift', { icon: 'lock', cls: 'btn-primary', attrs: 'id="cb-close"' }) }) +
    `<div class="cash-cards">${cash.map(c => `<a class="cash-card ${c.kind}" ${App.can('statement') ? `href="#/statement/${c.id}?from=${day}&to=${day}"` : ''}><div class="cc-top">${UI.icon(c.kind === 'bank' ? 'card' : 'cash')}<span>${UI.esc(c.name)}</span></div><div class="cc-bal">${UI.money(Eng.balance(c.id, { totals: tt }))}</div><div class="cc-day"><span class="pos">+ ${UI.num(dayIn(c.id))}</span><span class="neg">− ${UI.num(dayOut(c.id))}</span><small>today</small></div></a>`).join('')}</div>
    <div class="card"><div class="filters">${UI.fld('Date', UI.inp('date', day, 'type="date"'))}<div class="chips"><button class="chip" data-d="${U.addDays(day, -1)}">${UI.icon('chevL')} Previous day</button><button class="chip" data-d="${U.today()}">Today</button><button class="chip" data-d="${U.addDays(day, 1)}">Next day ${UI.icon('chevR')}</button></div></div><div id="cb-tbl"></div></div>
    <div class="card mt"><div class="card-head"><h3>${UI.icon('lock')}Closed shifts</h3></div><div id="cb-sh"></div></div>`;
  el.querySelector('[name=date]').onchange = e => App.go('cashbox?date=' + e.target.value);
  el.querySelectorAll('[data-d]').forEach(b => b.onclick = () => App.go('cashbox?date=' + b.dataset.d));
  UI.mountTable(el.querySelector('#cb-tbl'), { rows: lines, csv: 'cashbox-' + day, empty: 'No cash movements on this day.', onRow: r => r.j.refType ? App.openRef(r.j.refType, r.j.refId, r.j.id) : App.go('journal/' + r.j.id),
    columns: [{ key: 'ref', label: 'Document', render: r => `<a class="link">${UI.esc(r.j.ref || r.j.no)}</a>`, text: r => r.j.ref || r.j.no }, { key: 'memo', label: 'Description', text: r => r.j.memo }, { key: 'acc', label: 'Cash account', text: r => accName(r.l.accountId) },
      { key: 'in', label: 'In', align: 'r', text: r => r.l.debit ? UI.num(r.l.debit) : '', render: r => r.l.debit ? `<span class="pos">${UI.num(r.l.debit)}</span>` : '' }, { key: 'out', label: 'Out', align: 'r', text: r => r.l.credit ? UI.num(r.l.credit) : '', render: r => r.l.credit ? `<span class="neg">${UI.num(r.l.credit)}</span>` : '' }, { key: 'by', label: 'By', text: r => r.j.user || '' }],
    footer: rs => `<td colspan="3">Total</td><td class="r">${UI.num(U.sum(rs, r => r.l.debit))}</td><td class="r">${UI.num(U.sum(rs, r => r.l.credit))}</td><td></td>` });
  UI.mountTable(el.querySelector('#cb-sh'), { rows: d.shifts.slice().reverse(), search: false, pageSize: 8, empty: 'No shifts closed yet.', onRow: r => V.showShift(r.id),
    columns: [{ key: 'no', label: 'Shift', render: r => `<b>${r.no}</b>` }, { key: 'closedAt', label: 'Closed', text: r => UI.datetime(r.closedAt) }, { key: 'acc', label: 'Cash account', text: r => accName(r.cashAccountId) }, { key: 'expected', label: 'Expected', align: 'r', text: r => UI.num(r.expected) }, { key: 'counted', label: 'Counted', align: 'r', text: r => UI.num(r.counted) }, { key: 'diff', label: 'Difference', align: 'r', render: r => UI.signed(r.diff), text: r => r.diff }, { key: 'user', label: 'By' }] });
  const $ = s => el.querySelector(s);
  if ($('#cb-in')) {
    $('#cb-in').onclick = () => V.voucherForm({ type: 'receipt', accountId: Eng.A('other_inc'), memo: 'Cash in' }, () => App.refresh());
    $('#cb-out').onclick = () => V.voucherForm({ type: 'payment', accountId: Eng.A('general_exp'), memo: 'Cash out' }, () => App.refresh());
    $('#cb-trf').onclick = () => UI.formModal({ title: 'Transfer between cash accounts', icon: 'exchange', fields: UI.fld('From', UI.sel('from', UI.opts(cash, 'id', 'name', Eng.A('cash')))) + UI.fld('To', UI.sel('to', UI.opts(cash, 'id', 'name', Eng.A('bank')))) + UI.fld('Amount', UI.inp('amount', '', 'type="number" step="any" min="0"')) + UI.fld('Date', UI.inp('date', U.today(), 'type="date"')) + UI.fld('Description', UI.inp('memo', 'Cash deposit to bank'), 'fld-full'),
      save: x => { if (x.from === x.to) throw new Error('Choose two different accounts.'); if (!(+x.amount > 0)) throw new Error('Enter an amount.'); const v = Eng.saveVoucher({ type: 'journal', date: x.date, memo: x.memo, lines: [{ accountId: x.to, debit: +x.amount, credit: 0 }, { accountId: x.from, debit: 0, credit: +x.amount }] }); UI.toast('Transfer posted (' + v.no + ')'); App.refresh(); return true; } });
  }
  $('#cb-close').onclick = () => {
    const denoms = UI.base().decimals === 0 ? [100000, 50000, 20000, 10000, 5000, 1000] : [100, 50, 20, 10, 5, 1, 0.5, 0.25];
    UI.modal({ title: 'Close shift — count the drawer', icon: 'lock', size: 'lg',
      body: `<form class="form-grid" id="sh-f">${UI.fld('Cash account', UI.sel('cashAccountId', UI.opts(cash.filter(c => c.kind === 'cash'), 'id', 'name', Eng.defCash())))}${UI.fld('Date', UI.inp('date', U.today(), 'type="date"'))}
        ${UI.fld('Expected (system balance)', `<input name="expected" readonly>`)}${UI.fld('Counted total', `<input name="counted" type="number" step="any" min="0">`)}${UI.fld('Note', UI.inp('note', ''), 'fld-2')}</form>
        <div class="section-label mt">Count by denomination (${UI.base().code})</div><div class="denoms">${denoms.map(v => `<label><span>${UI.num(v, v < 1 ? 2 : 0)} ×</span><input type="number" min="0" data-v="${v}"></label>`).join('')}</div><div class="change-box" id="sh-diff"></div>`,
      onOpen: me => {
        const f = me.querySelector('#sh-f'), exp = () => { f.expected.value = U.r(Eng.balance(f.cashAccountId.value)); diff(); };
        const diff = () => { const df = U.r((+f.counted.value || 0) - (+f.expected.value || 0)); me.querySelector('#sh-diff').innerHTML = `<span>${df === 0 ? 'Drawer balanced' : df > 0 ? 'Cash over' : 'Cash short'}</span><b class="${df < 0 ? 'neg' : ''}">${UI.money(df)}</b>`; me.querySelector('#sh-diff').classList.toggle('bad', df < 0); };
        me.querySelectorAll('.denoms input').forEach(i => i.oninput = () => { f.counted.value = U.r(U.sum([...me.querySelectorAll('.denoms input')], x => (+x.value || 0) * +x.dataset.v)); diff(); });
        f.cashAccountId.onchange = exp; f.counted.oninput = diff; exp();
      },
      buttons: [{ label: 'Cancel', onClick: m => m.close() }, { label: 'Close shift', cls: 'btn-primary', icon: 'check', onClick: m => {
        const x = UI.formData(m.el.querySelector('#sh-f')); if (x.counted === '') return UI.toast('Enter the counted amount.', 'error');
        const s = UI.try(() => Eng.closeShift(Object.assign(x, { expected: +x.expected, counted: +x.counted })));
        if (s) { m.close(); UI.toast(`Shift ${s.no} closed${s.diff ? ' — difference ' + UI.num(s.diff) + ' posted to Cash Over/Short' : ''}`); App.refresh(); V.showShift(s.id); }
      } }] });
  };
};
V.showShift = id => {
  const s = Eng.get('shifts', id); if (!s) return UI.toast('Shift not found.', 'error');
  const body = docMeta([['Shift', s.no], ['Closed at', UI.datetime(s.closedAt)], ['Closed by', UI.esc(s.user)], ['Cash account', UI.esc(accName(s.cashAccountId))], ['Expected', UI.money(s.expected)], ['Counted', UI.money(s.counted)], ['Difference', UI.signed(s.diff)], ['Note', UI.esc(s.note || '—')]]);
  UI.modal({ title: 'Shift ' + s.no, icon: 'lock', size: 'md', body, buttons: [{ label: 'Print', icon: 'printer', onClick: () => UI.printTable('Shift closing ' + s.no, '', body) }, { label: 'Close', cls: 'btn-primary', onClick: m => m.close() }] });
};
