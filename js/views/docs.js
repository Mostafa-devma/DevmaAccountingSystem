/* Devma — Invoices, Vouchers, Journal entries, printable documents */
'use strict';
const accName = id => { const a = Eng.account(id); return a ? a.name : '—'; };
const smName = id => { const s = Eng.get('salesmen', id); return s ? s.name : ''; };
const TYPE_LBL = { asset: 'Assets', liability: 'Liabilities', equity: 'Equity', revenue: 'Revenue', expense: 'Expenses' };
V.accountGroupedOpts = (selected, filter, placeholder = '— Select account —') => {
  const list = db().accounts.filter(a => a.active !== false && !a.isGroup && (!filter || filter(a))).sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
  const groups = [['customer', 'Customers'], ['supplier', 'Suppliers'], ['cash', 'Cash & bank'], ['bank', null]];
  let html = `<option value="">${UI.esc(placeholder)}</option>`;
  const used = new Set();
  [['Customers', a => a.kind === 'customer'], ['Suppliers', a => a.kind === 'supplier'], ['Cash & bank', a => a.kind === 'cash' || a.kind === 'bank'], ...Object.entries(TYPE_LBL).map(([t, l]) => [l, a => a.type === t])].forEach(([lbl, fn]) => {
    const g = list.filter(a => !used.has(a.id) && fn(a)); if (!g.length) return; g.forEach(a => used.add(a.id));
    html += `<optgroup label="${lbl}">${g.map(a => `<option value="${a.id}" ${a.id === selected ? 'selected' : ''}>${UI.esc(a.code + ' · ' + a.name)}</option>`).join('')}</optgroup>`;
  });
  void groups; return html;
};
const partyOpts = (kind, sel) => UI.opts(Eng.parties(kind).sort((a, b) => a.name.localeCompare(b.name)), 'id', 'name', sel, '— Select ' + kind + ' —');
const partyBalance = id => { const a = Eng.account(id); return a ? Eng.natural(a, Eng.balance(id)) : 0; };

/* ---------------- Invoices list ---------------- */
V.invoices = (el, [type = 'sale'], q) => {
  const d = db(), T = Eng.INV[type]; if (!T) return App.go('invoices/sale');
  const f = { from: q.from || '', to: q.to || '', party: q.party || '', status: q.status || '', sm: q.sm || '' };
  let rows = d.invoices.filter(i => i.type === type && (!f.from || i.date >= f.from) && (!f.to || i.date <= f.to) && (!f.party || i.accountId === f.party) && (!f.sm || i.salesmanId === f.sm) && (!f.status || Eng.statusOf(i) === f.status));
  rows.sort((a, b) => b.date.localeCompare(a.date) || b.no.localeCompare(a.no));
  const B = i => Eng.calc(i).total / (+i.rate || 1), P = i => Eng.paidOf(i) / (+i.rate || 1);
  el.innerHTML = UI.head({ title: T.plural, icon: 'file', crumbs: [['Invoices', 'invoices/sale'], [T.plural]],
    actions: UI.btn('Print list', { icon: 'printer', attrs: 'id="iv-print"' }) + `<a class="btn btn-primary" href="#/invoice/new/${type}">${UI.icon('plus')}<span>New ${T.label.toLowerCase()}</span></a>` }) +
    UI.tabs(Object.entries(Eng.INV).map(([k, v]) => [k, v.plural, d.invoices.filter(i => i.type === k).length]), type, 'invoices') +
    `<div class="kpis">${UI.kpi('Invoices', rows.length, { icon: 'file' })}${UI.kpi('Total', UI.money(U.sum(rows, B)), { icon: 'chart', tone: 't2' })}${UI.kpi('Paid', UI.money(U.sum(rows, P)), { icon: 'check', tone: 't3' })}${UI.kpi('Outstanding', UI.money(U.sum(rows, i => B(i) - P(i))), { icon: 'alert', tone: 'warn' })}</div>
    <div class="card"><div class="filters">${UI.fld('From', UI.inp('from', f.from, 'type="date"'))}${UI.fld('To', UI.inp('to', f.to, 'type="date"'))}${UI.fld(T.party === 'customer' ? 'Customer' : 'Supplier', UI.sel('party', UI.opts(Eng.parties(T.party), 'id', 'name', f.party, 'All')))}
      ${UI.fld('Status', UI.sel('status', UI.opts(['Paid', 'Partial', 'Unpaid'], x => x, x => x, f.status, 'All')))}${type === 'sale' ? UI.fld('Salesman', UI.sel('sm', UI.opts(d.salesmen, 'id', 'name', f.sm, 'All'))) : ''}
      <button class="btn btn-light btn-sm" id="iv-clear">${UI.icon('x')}<span>Clear</span></button></div><div id="iv-tbl"></div></div>`;
  el.querySelectorAll('.filters [name]').forEach(s => s.onchange = () => { q[s.name] = s.value; V.invoices(el, [type], q); });
  el.querySelector('#iv-clear').onclick = () => App.go('invoices/' + type);
  const tbl = UI.mountTable(el.querySelector('#iv-tbl'), { rows, csv: type + '-invoices', onRow: r => App.go('invoice/' + r.id),
    columns: [{ key: 'no', label: 'Number', render: r => `<b>${r.no}</b>${r.source === 'pos' ? ' ' + UI.badge('POS', 'purple') : r.source === 'room' ? ' ' + UI.badge('Room', 'blue') : ''}` },
      { key: 'date', label: 'Date', text: r => UI.date(r.date), sortVal: r => r.date }, { key: 'party', label: T.party === 'customer' ? 'Customer' : 'Supplier', text: r => accName(r.accountId) },
      ...(type === 'sale' ? [{ key: 'sm', label: 'Salesman', text: r => smName(r.salesmanId) }] : []),
      { key: 'total', label: 'Total', align: 'r', sortVal: B, text: r => UI.money(Eng.calc(r).total, r.currency) }, { key: 'paid', label: 'Paid', align: 'r', sortVal: P, text: r => UI.num(Eng.paidOf(r)) },
      { key: 'due', label: 'Due', align: 'r', sortVal: r => B(r) - P(r), render: r => { const x = Eng.dueOf(r); return x > 0.004 ? `<b class="neg">${UI.num(x)}</b>` : UI.num(0); }, text: r => UI.num(Eng.dueOf(r)) },
      { key: 'st', label: 'Status', text: r => Eng.statusOf(r), render: r => UI.statusBadge(Eng.statusOf(r)) },
      { key: 'a', label: '', sort: false, noExport: true, render: r => `<span class="row-acts"><button class="icon-btn sm" data-act="print" title="Print">${UI.icon('printer')}</button>${Eng.dueOf(r) > 0.004 ? `<button class="icon-btn sm" data-act="pay" title="Record payment">${UI.icon('cash')}</button>` : ''}</span>` }],
    onAction: (act, r) => act === 'print' ? UI.print(V.invoiceDoc(r)) : V.payInvoice(r, () => App.refresh()),
    footer: rs => `<td colspan="${type === 'sale' ? 4 : 3}">Total (${UI.base().code})</td><td class="r">${UI.num(U.sum(rs, B))}</td><td class="r">${UI.num(U.sum(rs, P))}</td><td class="r">${UI.num(U.sum(rs, i => B(i) - P(i)))}</td><td colspan="2"></td>` });
  el.querySelector('#iv-print').onclick = () => UI.printTable(T.plural, (f.from || f.to) ? `${UI.date(f.from) || '…'} → ${UI.date(f.to) || '…'}` : '', `<table class="doc-table"><thead><tr><th>No</th><th>Date</th><th>Party</th><th class="r">Total</th><th class="r">Paid</th><th class="r">Due</th><th>Status</th></tr></thead><tbody>${tbl.rows().map(r => `<tr><td>${r.no}</td><td>${UI.date(r.date)}</td><td>${UI.esc(accName(r.accountId))}</td><td class="r">${UI.money(Eng.calc(r).total, r.currency)}</td><td class="r">${UI.num(Eng.paidOf(r))}</td><td class="r">${UI.num(Eng.dueOf(r))}</td><td>${Eng.statusOf(r)}</td></tr>`).join('')}</tbody></table>`);
};

/* ---------------- Invoice router ---------------- */
V.invoice = (el, segs, q) => {
  if (segs[0] === 'new') return V.invoiceForm(el, null, segs[1] || 'sale', q);
  if (segs[0] === 'edit') { const inv = Eng.get('invoices', segs[1]); return inv ? V.invoiceForm(el, inv, inv.type, q) : App.go('invoices/sale'); }
  V.invoiceView(el, segs[0]);
};

/* ---------------- Invoice form ---------------- */
V.invoiceForm = (el, existing, type, q = {}) => {
  const d = db(), T = Eng.INV[type], isSale = type === 'sale' || type === 'sale_return', base = UI.base();
  if (!T) return App.go('invoices/sale');
  let f;
  if (existing) f = U.clone(existing);
  else {
    f = { type, date: U.today(), accountId: T.party === 'customer' ? d.settings.walkInCustomerId : '', warehouseId: Eng.defWh(), currency: base.code, rate: 1, taxRate: d.settings.taxRate, discount: 0, paid: 0, payAccountId: Eng.defCash(), salesmanId: '', notes: '', lines: [] };
    const src = q.from && Eng.get('invoices', q.from);
    if (src && q.mode === 'dup') Object.assign(f, U.clone(src), { id: undefined, no: undefined, date: U.today(), paid: 0, source: undefined, stayId: undefined, returnOf: undefined, created: undefined });
    else if (src) Object.assign(f, { accountId: src.accountId, warehouseId: src.warehouseId, currency: src.currency, rate: src.rate, taxRate: src.taxRate, salesmanId: src.salesmanId || '', returnOf: src.id, notes: 'Return of ' + src.no, lines: src.lines.map(l => ({ itemId: l.itemId, qty: l.qty, price: l.price, disc: l.disc })) });
    if (q.party) f.accountId = q.party;
    if (q.item && Eng.item(q.item)) { const it = Eng.item(q.item); f.lines = [{ itemId: it.id, qty: isSale ? 1 : Math.max(1, Math.ceil(it.minQty * 2 - Eng.qty(it.id))), price: (isSale ? it.price : it.cost) * f.rate, disc: 0 }]; }
    if (q.low) f.lines = Eng.lowStock().map(x => ({ itemId: x.item.id, qty: Math.max(1, Math.ceil(x.item.minQty * 2 - x.qty)), price: x.item.cost, disc: 0 }));
  }
  f.lines = f.lines.map(l => Object.assign({}, l)); f.lines.push({ itemId: '', qty: '', price: '', disc: '' });
  const returnSrc = f.returnOf && Eng.get('invoices', f.returnOf);
  const walkIn = () => type === 'sale' && f.accountId === d.settings.walkInCustomerId;
  let autoPaid = !existing && walkIn() && !(+f.paid); // walk-in sales default to fully paid until the user types an amount
  el.innerHTML = UI.head({ title: existing ? `Edit ${T.label} ${existing.no}` : 'New ' + T.label, icon: 'file', crumbs: [['Invoices', 'invoices/' + type], [T.plural, 'invoices/' + type], [existing ? existing.no : 'New']],
    sub: returnSrc ? `Returning items from <a class="link" href="#/invoice/${returnSrc.id}">${returnSrc.no}</a>` : '',
    actions: UI.btn('Cancel', { icon: 'x', attrs: 'id="f-cancel"' }) + UI.btn('Save & new', { icon: 'plus', attrs: 'id="f-new"' }) + UI.btn('Save & print', { icon: 'printer', attrs: 'id="f-print"' }) + UI.btn('Save', { icon: 'check', cls: 'btn-primary', attrs: 'id="f-save"' }) }) +
    `<div class="inv-form">
     <div class="card"><div class="card-body"><form class="form-grid g4" id="f-head">
       ${UI.fld(T.party === 'customer' ? 'Customer *' : 'Supplier *', `<div class="input-group">${UI.sel('accountId', partyOpts(T.party, f.accountId))}<button type="button" class="btn btn-light btn-sm" id="f-newparty" title="New ${T.party}">${UI.icon('plus')}</button></div>`, 'fld-2')}
       ${UI.fld('Date *', UI.inp('date', f.date, 'type="date"'))}${UI.fld('Warehouse', UI.sel('warehouseId', UI.opts(d.warehouses, 'id', 'name', f.warehouseId)))}
       ${UI.fld('Currency', UI.sel('currency', UI.opts(d.currencies, 'code', c => c.code + ' — ' + c.name, f.currency)))}${UI.fld(`Rate (per 1 ${base.code})`, UI.inp('rate', f.rate, 'type="number" step="any" min="0"'))}
       ${isSale ? UI.fld('Salesman', UI.sel('salesmanId', UI.opts(d.salesmen.filter(s => s.active !== false), 'id', 'name', f.salesmanId, '— None —'))) : UI.fld('Supplier ref. no.', UI.inp('supplierRef', f.supplierRef || ''))}
       ${UI.fld('Notes', UI.inp('notes', f.notes))}
     </form><div id="f-party" class="party-info"></div></div></div>
     <div class="card"><div class="card-head"><h3>${UI.icon('list')}Items</h3><div class="scan">${UI.icon('barcode')}<input id="f-scan" placeholder="Scan barcode or type code + Enter"></div></div><div class="card-body p0" id="f-lines"></div></div>
     <div class="inv-bottom">
       <div class="card"><div class="card-body"><div class="section-label">Payment</div><form class="form-grid" id="f-pay">
         ${UI.fld(`${isSale && type === 'sale' || type === 'purchase_return' ? 'Amount received now' : 'Amount paid now'} (${'<span class="cur-l"></span>'})`, `<div class="input-group">${UI.inp('paid', f.paid, 'type="number" step="any" min="0"')}<button type="button" class="btn btn-light btn-sm" id="f-full">Full</button><button type="button" class="btn btn-light btn-sm" id="f-none">None</button></div>`, 'fld-full')}
         ${UI.fld('Cash / bank account', UI.sel('payAccountId', UI.opts(Eng.cashAccounts(), 'id', a => a.name, f.payAccountId)), 'fld-full')}
       </form><p class="muted sm">The unpaid balance stays on the ${T.party}'s account. You can record more payments later from the invoice.</p></div></div>
       <div class="card totals-card"><div class="card-body" id="f-totals"></div></div>
     </div></div>`;
  const $ = s => el.querySelector(s), head = $('#f-head'), pay = $('#f-pay');
  const cur = () => UI.cur(f.currency);
  const sync = () => { Object.assign(f, UI.formData(head)); f.rate = +f.rate || 1; Object.assign(f, UI.formData(pay)); };
  const partyInfo = () => {
    const a = Eng.account(head.accountId.value); if (!a) { $('#f-party').innerHTML = ''; return; }
    const bal = partyBalance(a.id), lim = +a.creditLimit || 0;
    $('#f-party').innerHTML = `${UI.icon('users')}<span><b>${UI.esc(a.name)}</b> ${a.phone ? '· ' + UI.esc(a.phone) : ''} · Balance: <b class="${bal > 0 && T.party === 'customer' ? 'neg' : ''}">${UI.money(bal)}</b>${lim ? ` · Credit limit ${UI.money(lim)}` : ''}</span>${App.can('statement') ? `<a class="link" href="#/statement/${a.id}">Statement →</a>` : ''}`;
  };
  const totals = () => {
    sync(); const c = Eng.calc(f), C = f.currency;
    if (autoPaid) { pay.paid.value = c.total; f.paid = c.total; }
    const due = U.r(c.total - (+f.paid || 0));
    el.querySelectorAll('.cur-l').forEach(x => x.textContent = C);
    $('#f-totals').innerHTML = `<div class="tot"><span>Subtotal</span><b>${UI.money(c.subtotal, C)}</b></div>
      <div class="tot"><span>Discount</span><input type="number" step="any" min="0" id="t-disc" value="${f.discount || 0}" class="r"></div>
      <div class="tot"><span>Net</span><b>${UI.money(c.net, C)}</b></div>
      <div class="tot"><span>Tax %</span><input type="number" step="any" min="0" id="t-tax" value="${f.taxRate || 0}" class="r"></div>
      <div class="tot"><span>Tax amount</span><b>${UI.money(c.tax, C)}</b></div>
      <div class="tot grand"><span>Total</span><b>${UI.money(c.total, C)}</b></div>
      ${C !== base.code ? `<div class="tot muted tot-in"><span>In ${base.code}</span><span>${UI.money(c.total / f.rate)}</span></div>` : ''}
      <div class="tot tot-paid"><span>Paid now</span><b>${UI.money(+f.paid || 0, C)}</b></div>
      <div class="tot due ${due > 0.004 ? 'neg' : ''}"><span>Balance due</span><b>${UI.money(due, C)}</b></div>`;
    const td = $('#t-disc'), tt = $('#t-tax');
    td.oninput = () => { f.discount = +td.value || 0; refreshNums(); }; tt.oninput = () => { f.taxRate = +tt.value || 0; refreshNums(); };
  };
  /* update numbers without re-rendering inputs that have focus */
  const refreshNums = () => {
    const c = Eng.calc(f), C = f.currency;
    if (autoPaid) { pay.paid.value = c.total; f.paid = c.total; }
    const due = U.r(c.total - (+f.paid || 0));
    const rows = $('#f-totals').querySelectorAll('.tot b');
    rows[0].textContent = UI.money(c.subtotal, C); rows[1].textContent = UI.money(c.net, C); rows[2].textContent = UI.money(c.tax, C); rows[3].textContent = UI.money(c.total, C);
    const tot = $('#f-totals'); tot.querySelector('.tot.due b').textContent = UI.money(due, C); tot.querySelector('.tot.due').classList.toggle('neg', due > 0.004);
    const paidB = tot.querySelector('.tot-paid'); if (paidB) paidB.querySelector('b').textContent = UI.money(+f.paid || 0, C);
    const inB = tot.querySelector('.tot-in'); if (inB) inB.lastElementChild.textContent = UI.money(c.total / f.rate);
  };
  const lines = focus => {
    const sm = Eng.stockMap(), wh = head.warehouseId.value, C = f.currency, showAvail = type === 'sale' || type === 'purchase_return';
    $('#f-lines').innerHTML = `<div class="table-wrap"><table class="tbl lines inv-lines"><thead><tr><th style="width:34px">#</th><th>Item</th><th>Unit</th>${showAvail ? '<th class="r">In stock</th>' : ''}<th class="r" style="width:100px">Qty</th><th class="r" style="width:120px">Price (${C})</th><th class="r" style="width:80px">Disc %</th><th class="r" style="width:130px">Amount</th><th style="width:40px"></th></tr></thead><tbody>
      ${f.lines.map((l, i) => { const it = Eng.item(l.itemId), amt = (+l.qty || 0) * (+l.price || 0) * (1 - (+l.disc || 0) / 100), av = it ? sm.at(it.id, wh) : 0;
        return `<tr data-i="${i}"><td class="muted">${i + 1}</td><td><input list="dl-inv" class="li-item" value="${UI.esc(UI.itemLabel(it))}" placeholder="Type code, name or barcode…"></td><td class="muted">${it ? UI.esc(it.unit) : ''}</td>
        ${showAvail ? `<td class="r ${it && it.type !== 'service' && av < (+l.qty || 0) ? 'neg b' : 'muted'}">${it ? (it.type === 'service' ? '—' : UI.qty(av)) : ''}</td>` : ''}
        <td><input type="number" step="any" min="0" class="li-qty r" value="${l.qty}"></td><td><input type="number" step="any" min="0" class="li-price r" value="${l.price}"></td><td><input type="number" step="any" min="0" max="100" class="li-disc r" value="${l.disc}"></td>
        <td class="r amt">${it ? UI.num(amt) : ''}</td><td>${it ? `<button type="button" class="icon-btn sm li-del" title="Remove">${UI.icon('x')}</button>` : ''}</td></tr>`; }).join('')}</tbody></table></div>${UI.itemDatalist('dl-inv')}`;
    $('#f-lines').querySelectorAll('tr[data-i]').forEach(tr => {
      const i = +tr.dataset.i, l = f.lines[i], g = s => tr.querySelector(s);
      g('.li-item').onchange = e => { const it = UI.findItem(e.target.value); if (!it) { if (e.target.value) UI.toast('Item not found', 'warn'); e.target.value = ''; return; } setItem(i, it); lines({ i, cls: '.li-qty' }); totals(); };
      const num = () => { const it = Eng.item(l.itemId); g('.amt').textContent = it ? UI.num((+l.qty || 0) * (+l.price || 0) * (1 - (+l.disc || 0) / 100)) : ''; refreshNums(); };
      g('.li-qty').oninput = e => { l.qty = e.target.value; num(); }; g('.li-price').oninput = e => { l.price = e.target.value; num(); }; g('.li-disc').oninput = e => { l.disc = e.target.value; num(); };
      g('.li-qty').onchange = () => lines();
      const del = g('.li-del'); if (del) del.onclick = () => { f.lines.splice(i, 1); lines(); totals(); };
    });
    if (focus) { const x = $(`#f-lines tr[data-i="${focus.i}"] ${focus.cls}`); if (x) { x.focus(); x.select && x.select(); } }
  };
  const setItem = (i, it) => {
    const ex = f.lines.findIndex((l, j) => j !== i && l.itemId === it.id);
    const price = U.r((isSale ? it.price : it.cost) * (+f.rate || 1), 4);
    if (ex >= 0 && i === f.lines.length - 1) { f.lines[ex].qty = (+f.lines[ex].qty || 0) + 1; return ex; }
    Object.assign(f.lines[i], { itemId: it.id, qty: f.lines[i].qty || 1, price, disc: f.lines[i].disc || 0 });
    if (i === f.lines.length - 1) f.lines.push({ itemId: '', qty: '', price: '', disc: '' });
    return i;
  };
  head.accountId.onchange = () => { f.accountId = head.accountId.value; if (!existing && walkIn() && !(+pay.paid.value)) autoPaid = true; else if (!walkIn()) autoPaid = false; partyInfo(); totals(); };
  head.warehouseId.onchange = () => lines();
  head.currency.onchange = () => {
    const old = +f.rate || 1, nr = UI.cur(head.currency.value).rate; head.rate.value = nr; f.currency = head.currency.value; f.rate = nr;
    f.lines.forEach(l => { if (l.price !== '') l.price = U.r(+l.price / old * nr, 4); }); f.discount = U.r((+f.discount || 0) / old * nr, 4); pay.paid.value = U.r((+pay.paid.value || 0) / old * nr, 4);
    lines(); totals();
  };
  head.rate.oninput = () => { f.rate = +head.rate.value || 1; refreshNums(); };
  pay.paid.oninput = () => { autoPaid = false; f.paid = pay.paid.value; refreshNums(); };
  $('#f-full').onclick = () => { pay.paid.value = Eng.calc(f).total; f.paid = pay.paid.value; refreshNums(); };
  $('#f-none').onclick = () => { autoPaid = false; pay.paid.value = 0; f.paid = 0; refreshNums(); };
  $('#f-scan').onkeydown = e => { if (e.key !== 'Enter') return; e.preventDefault(); const it = UI.findItem(e.target.value); if (!it) return UI.toast('No item with code/barcode ' + e.target.value, 'warn'); setItem(f.lines.length - 1, it); e.target.value = ''; lines(); totals(); $('#f-scan').focus(); };
  $('#f-newparty').onclick = () => V.partyForm(T.party, null, a => { head.accountId.innerHTML = partyOpts(T.party, a.id); partyInfo(); });
  $('#f-cancel').onclick = () => existing ? App.go('invoice/' + existing.id) : history.length > 1 ? history.back() : App.go('invoices/' + type);
  const save = async after => {
    sync(); const c = Eng.calc(f);
    if (type === 'sale') {
      const a = Eng.account(f.accountId);
      if (a && +a.creditLimit > 0) { const after_ = partyBalance(a.id) - (existing ? Eng.dueOf(existing) / (+existing.rate || 1) : 0) + (c.total - (+f.paid || 0)) / f.rate; if (after_ > +a.creditLimit && !(await UI.confirm(`${a.name} will owe ${UI.money(after_)}, above the credit limit of ${UI.money(a.creditLimit)}. Save anyway?`, { ok: 'Save anyway' }))) return; }
      if (f.accountId === d.settings.walkInCustomerId && (+f.paid || 0) < c.total - 0.004 && !(await UI.confirm('This walk-in sale is not fully paid. The balance will stay on the Walk-in Customer account. Continue?', { ok: 'Continue' }))) return;
    }
    const inv = UI.try(() => Eng.saveInvoice(Object.assign({}, f, { lines: f.lines.filter(l => l.itemId).map(l => ({ itemId: l.itemId, qty: +l.qty, price: +l.price || 0, disc: +l.disc || 0 })) })));
    if (!inv) return;
    UI.toast(`${T.label} ${inv.no} saved`);
    if (after === 'print') { App.go('invoice/' + inv.id); setTimeout(() => UI.print(V.invoiceDoc(inv)), 150); }
    else if (after === 'new') { App.go('invoice/new/' + type + '?t=' + Date.now()); }
    else App.go('invoice/' + inv.id);
  };
  $('#f-save').onclick = () => save(); $('#f-print').onclick = () => save('print'); $('#f-new').onclick = () => save('new');
  partyInfo(); lines(); totals();
  if (!existing && !f.lines[0].itemId) setTimeout(() => { const x = $('#f-lines .li-item'); x && x.focus(); }, 50);
};

/* ---------------- Payment against invoice ---------------- */
V.payInvoice = (inv, done) => {
  const due = Eng.dueOf(inv), inbound = inv.type === 'sale' || inv.type === 'purchase_return';
  V.voucherForm({ type: inbound ? 'receipt' : 'payment', accountId: inv.accountId, amount: due, currency: inv.currency, rate: inv.rate, invoiceId: inv.id, memo: (inbound ? 'Payment received for ' : 'Payment for ') + inv.no }, done);
};

/* ---------------- Invoice view ---------------- */
V.invoiceView = (el, id) => {
  const d = db(), inv = Eng.get('invoices', id);
  if (!inv) { el.innerHTML = UI.head({ title: 'Invoice not found', icon: 'file' }) + UI.empty('This invoice was deleted or does not exist.', 'file', '<a class="btn btn-primary" href="#/invoices/sale">Back to invoices</a>'); return; }
  const T = Eng.INV[inv.type], c = Eng.calc(inv), st = Eng.statusOf(inv), due = Eng.dueOf(inv);
  const vch = d.vouchers.filter(v => v.invoiceId === id), returns = d.invoices.filter(i => i.returnOf === id), je = d.journal.find(j => j.refType === 'invoice' && j.refId === id);
  const canRet = inv.type === 'sale' || inv.type === 'purchase';
  el.innerHTML = UI.head({ title: `${T.label} ${inv.no}`, icon: 'file', crumbs: [['Invoices', 'invoices/' + inv.type], [T.plural, 'invoices/' + inv.type], [inv.no]], sub: UI.statusBadge(st) + (inv.source === 'pos' ? ' ' + UI.badge('POS sale', 'purple') : '') + (inv.source === 'room' ? ' ' + UI.badge('Room checkout', 'blue') : ''),
    actions: `<a class="btn btn-light" href="#/invoices/${inv.type}">${UI.icon('arrowL')}<span>List</span></a>` + UI.btn('Delete', { icon: 'trash', cls: 'btn-light danger', attrs: 'id="v-del"' }) + UI.btn('Duplicate', { icon: 'copy', attrs: 'id="v-dup"' }) +
      (canRet ? UI.btn('Return', { icon: 'return', attrs: 'id="v-ret"' }) : '') + UI.btn('Edit', { icon: 'edit', attrs: 'id="v-edit"' }) + (inv.type === 'sale' ? UI.btn('Receipt', { icon: 'receipt', attrs: 'id="v-rcpt"' }) : '') + UI.btn('Print', { icon: 'printer', attrs: 'id="v-print"' }) +
      (due > 0.004 ? UI.btn(inv.type === 'sale' || inv.type === 'purchase_return' ? 'Receive payment' : 'Make payment', { icon: 'cash', cls: 'btn-primary', attrs: 'id="v-pay"' }) : '') }) +
    `<div class="inv-view"><div class="card doc-card">${V.invoiceDoc(inv, true)}</div>
     <div class="stack">
       <div class="card"><div class="card-head"><h3>${UI.icon('wallet')}Payments</h3></div><div class="card-body">
         <div class="tot"><span>Invoice total</span><b>${UI.money(c.total, inv.currency)}</b></div><div class="tot"><span>Paid at invoice</span><b>${UI.money(+inv.paid || 0, inv.currency)}</b></div>
         ${vch.map(v => `<a class="tot link-row" href="#/voucher/${v.id}"><span>${v.no} · ${UI.date(v.date)}</span><b>${UI.money(v.amount / (+v.rate || 1) * (+inv.rate || 1), inv.currency)}</b></a>`).join('')}
         <div class="tot due ${due > 0.004 ? 'neg' : ''}"><span>Balance due</span><b>${UI.money(due, inv.currency)}</b></div></div></div>
       ${returns.length ? `<div class="card"><div class="card-head"><h3>${UI.icon('return')}Returns</h3></div><div class="card-body p0"><table class="tbl clickable"><tbody>${returns.map(r => `<tr data-go="invoice/${r.id}"><td><b>${r.no}</b></td><td>${UI.date(r.date)}</td><td class="r">${UI.money(Eng.calc(r).total, r.currency)}</td></tr>`).join('')}</tbody></table></div></div>` : ''}
       ${inv.returnOf ? `<div class="card"><div class="card-body">${UI.icon('return')} Return of <a class="link" href="#/invoice/${inv.returnOf}">${(Eng.get('invoices', inv.returnOf) || {}).no || 'deleted invoice'}</a></div></div>` : ''}
       ${je ? `<div class="card"><div class="card-head"><h3>${UI.icon('book')}Journal entry ${je.no}</h3></div><div class="card-body p0"><table class="tbl ${App.can('statement') ? 'clickable' : ''}"><thead><tr><th>Account</th><th class="r">Debit</th><th class="r">Credit</th></tr></thead><tbody>${je.lines.map(l => `<tr data-go="statement/${l.accountId}"><td>${UI.esc(accName(l.accountId))}</td><td class="r">${l.debit ? UI.num(l.debit) : ''}</td><td class="r">${l.credit ? UI.num(l.credit) : ''}</td></tr>`).join('')}</tbody></table></div></div>` : ''}
       <div class="card"><div class="card-body muted sm">Created ${UI.datetime(inv.created)} by ${UI.esc(inv.createdBy || '—')}${inv.updated ? `<br>Last edited ${UI.datetime(inv.updated)}` : ''}</div></div>
     </div></div>`;
  const $ = s => el.querySelector(s);
  el.querySelectorAll('[data-go]').forEach(tr => tr.onclick = () => { const p = tr.dataset.go; if (p.startsWith('statement') && !App.can('statement')) return; App.go(p); });
  el.querySelectorAll('.doc-card [data-item]').forEach(a => a.onclick = () => App.go('item/' + a.dataset.item));
  $('#v-print').onclick = () => UI.print(V.invoiceDoc(inv));
  if ($('#v-rcpt')) $('#v-rcpt').onclick = () => UI.print(V.receiptDoc(inv), true);
  if ($('#v-pay')) $('#v-pay').onclick = () => V.payInvoice(inv, () => App.refresh());
  $('#v-edit').onclick = () => { if (inv.source === 'room') UI.toast('Tip: this invoice came from a room checkout — editing it will not reopen the room.', 'info'); App.go('invoice/edit/' + id); };
  $('#v-dup').onclick = () => App.go(`invoice/new/${inv.type}?from=${id}&mode=dup`);
  if ($('#v-ret')) $('#v-ret').onclick = () => App.go(`invoice/new/${inv.type}_return?from=${id}`);
  $('#v-del').onclick = async () => {
    const msg = `Delete ${inv.no}? Its stock movements and journal entry will be reversed.` + (vch.length ? ` ${vch.length} linked payment voucher(s) will be kept as payments on account.` : '');
    if (await UI.confirm(msg, { danger: true, ok: 'Delete invoice' })) { if (UI.try(() => Eng.deleteInvoice(id), 'Invoice deleted')) App.go('invoices/' + inv.type); }
  };
};

/* ---------------- Printable documents ---------------- */
V.invoiceDoc = (inv, inline = false) => {
  const s = db().settings, T = Eng.INV[inv.type], c = Eng.calc(inv), a = Eng.account(inv.accountId) || {}, C = inv.currency, paid = Eng.paidOf(inv);
  return `<div class="doc">
    <div class="doc-head"><div class="doc-brand">${UI.logoSvg(46)}<div><div class="doc-co">${UI.esc(s.company)}</div><div class="muted">${UI.esc(s.address)}<br>${UI.esc(s.phone)} · ${UI.esc(s.email)}${s.taxNo ? '<br>Tax no. ' + UI.esc(s.taxNo) : ''}</div></div></div>
      <div class="doc-title-box"><div class="doc-title">${UI.esc(T.label)}</div><div><b>${inv.no}</b></div><div class="muted">${UI.date(inv.date)}</div></div></div>
    <div class="doc-meta"><div><span>${T.party === 'customer' ? 'Bill to' : 'Supplier'}</span><b>${UI.esc(a.name || '')}</b><div class="muted">${UI.esc(a.address || '')}${a.phone ? '<br>' + UI.esc(a.phone) : ''}</div></div>
      <div><span>Details</span><div>Warehouse: ${UI.esc(whName(inv.warehouseId))}</div>${inv.salesmanId ? `<div>Salesman: ${UI.esc(smName(inv.salesmanId))}</div>` : ''}<div>Currency: ${C}${C !== UI.base().code ? ' @ ' + inv.rate : ''}</div>${inv.supplierRef ? `<div>Ref: ${UI.esc(inv.supplierRef)}</div>` : ''}</div>
      <div><span>Status</span><b>${Eng.statusOf(inv)}</b></div></div>
    <table class="doc-table"><thead><tr><th>#</th><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Disc</th><th class="r">Amount</th></tr></thead><tbody>
      ${c.lines.map((l, i) => { const it = Eng.item(l.itemId) || {}; return `<tr><td>${i + 1}</td><td>${inline ? `<a class="link" data-item="${it.id}">${UI.esc(it.name || '?')}</a>` : UI.esc(it.name || '?')}<div class="muted sm">${UI.esc(it.code || '')}</div></td><td class="r">${UI.qty(l.qty)} ${UI.esc(it.unit || '')}</td><td class="r">${UI.num(l.price)}</td><td class="r">${+l.disc ? l.disc + '%' : ''}</td><td class="r">${UI.num(l.amount)}</td></tr>`; }).join('')}
    </tbody></table>
    <div class="doc-bottom"><div class="doc-notes">${inv.notes ? `<b>Notes</b><p>${UI.esc(inv.notes)}</p>` : ''}<p class="muted">${UI.esc(s.invoiceFooter || '')}</p></div>
      <div class="doc-totals"><div><span>Subtotal</span><b>${UI.money(c.subtotal, C)}</b></div>${c.discount ? `<div><span>Discount</span><b>− ${UI.money(c.discount, C)}</b></div>` : ''}<div><span>Tax ${inv.taxRate || 0}%</span><b>${UI.money(c.tax, C)}</b></div>
        <div class="grand"><span>Total</span><b>${UI.money(c.total, C)}</b></div><div><span>Paid</span><b>${UI.money(paid, C)}</b></div><div><span>Balance due</span><b>${UI.money(c.total - paid, C)}</b></div></div></div>
    <div class="doc-sign"><div>Prepared by</div><div>Received by</div></div>
  </div>`;
};
V.receiptDoc = (inv, tender) => {
  const s = db().settings, c = Eng.calc(inv), C = inv.currency, a = Eng.account(inv.accountId) || {};
  return `<div class="rcpt"><div class="c"><b class="rc-co">${UI.esc(s.company)}</b><br>${UI.esc(s.address)}<br>${UI.esc(s.phone)}</div><hr>
    <div>${inv.no}<span class="rt">${UI.datetime(inv.created || inv.date)}</span></div><div>Customer: ${UI.esc(a.name || '')}</div><div>Cashier: ${UI.esc(inv.createdBy || Eng.user())}</div><hr>
    ${c.lines.map(l => { const it = Eng.item(l.itemId) || {}; return `<div>${UI.esc(it.name || '')}</div><div class="rl">${UI.qty(l.qty)} × ${UI.num(l.price)}${+l.disc ? ' −' + l.disc + '%' : ''}<span class="rt">${UI.num(l.amount)}</span></div>`; }).join('')}<hr>
    <div>Subtotal<span class="rt">${UI.num(c.subtotal)}</span></div>${c.discount ? `<div>Discount<span class="rt">−${UI.num(c.discount)}</span></div>` : ''}<div>Tax ${inv.taxRate || 0}%<span class="rt">${UI.num(c.tax)}</span></div>
    <div class="rc-big">TOTAL ${C}<span class="rt">${UI.num(c.total)}</span></div>
    ${tender ? `<div>Paid (${UI.esc(tender.label)})<span class="rt">${UI.esc(tender.given)}</span></div><div>Change<span class="rt">${UI.esc(tender.change)}</span></div>` : `<div>Paid<span class="rt">${UI.num(Eng.paidOf(inv))}</span></div>`}
    <hr><div class="c">${UI.esc(s.invoiceFooter || 'Thank you!')}</div><div class="c rc-bars">${inv.no}</div></div>`;
};
V.voucherDoc = v => {
  const s = db().settings, T = Eng.VCH[v.type], C = v.currency || UI.base().code;
  return `<div class="doc"><div class="doc-head"><div class="doc-brand">${UI.logoSvg(46)}<div><div class="doc-co">${UI.esc(s.company)}</div><div class="muted">${UI.esc(s.address)} · ${UI.esc(s.phone)}</div></div></div>
    <div class="doc-title-box"><div class="doc-title">${T.label}</div><div><b>${v.no}</b></div><div class="muted">${UI.date(v.date)}</div></div></div>
    ${v.type === 'journal' ? `<table class="doc-table"><thead><tr><th>Account</th><th>Note</th><th class="r">Debit</th><th class="r">Credit</th></tr></thead><tbody>${v.lines.map(l => `<tr><td>${UI.esc(accName(l.accountId))}</td><td>${UI.esc(l.note || '')}</td><td class="r">${+l.debit ? UI.num(l.debit) : ''}</td><td class="r">${+l.credit ? UI.num(l.credit) : ''}</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="2">Total</td><td class="r">${UI.num(U.sum(v.lines, l => l.debit))}</td><td class="r">${UI.num(U.sum(v.lines, l => l.credit))}</td></tr></tfoot></table>`
    : `<div class="vch-body"><div class="vch-amt">${UI.money(v.amount, C)}</div>
      <div class="vch-row"><span>${v.type === 'receipt' ? 'Received from' : 'Paid to'}</span><b>${UI.esc(accName(v.accountId))}</b></div>
      <div class="vch-row"><span>${v.type === 'receipt' ? 'Deposited to' : 'Paid from'}</span><b>${UI.esc(accName(v.cashAccountId))}</b></div>
      ${C !== UI.base().code ? `<div class="vch-row"><span>Equivalent</span><b>${UI.money(v.amount / v.rate)} (rate ${v.rate})</b></div>` : ''}
      ${v.invoiceId ? `<div class="vch-row"><span>For invoice</span><b>${UI.esc((Eng.get('invoices', v.invoiceId) || {}).no || '')}</b></div>` : ''}</div>`}
    ${v.memo ? `<p><b>Description:</b> ${UI.esc(v.memo)}</p>` : ''}<div class="doc-sign"><div>Prepared by: ${UI.esc(v.createdBy || '')}</div><div>Signature</div></div></div>`;
};

/* ---------------- Vouchers ---------------- */
V.vouchers = (el, [type = 'receipt'], q) => {
  const d = db(), T = Eng.VCH[type]; if (!T) return App.go('vouchers/receipt');
  const f = { from: q.from || '', to: q.to || '' };
  const rows = d.vouchers.filter(v => v.type === type && (!f.from || v.date >= f.from) && (!f.to || v.date <= f.to)).sort((a, b) => b.date.localeCompare(a.date) || b.no.localeCompare(a.no));
  const B = v => +v.amount / (+v.rate || 1);
  el.innerHTML = UI.head({ title: T.plural, icon: 'receipt', crumbs: [['Vouchers', 'vouchers/receipt'], [T.plural]], actions: UI.btn('New ' + T.label.toLowerCase(), { icon: 'plus', cls: 'btn-primary', attrs: 'id="vc-new"' }) }) +
    UI.tabs(Object.entries(Eng.VCH).map(([k, v]) => [k, v.plural, d.vouchers.filter(x => x.type === k).length]), type, 'vouchers') +
    `<div class="kpis">${UI.kpi('Vouchers', rows.length, { icon: 'receipt' })}${UI.kpi('Total amount', UI.money(U.sum(rows, B)), { icon: 'coins', tone: 't2' })}${UI.kpi('This month', UI.money(U.sum(rows.filter(v => v.date >= U.monthStart()), B)), { icon: 'chart', tone: 't3' })}</div>
    <div class="card"><div class="filters">${UI.fld('From', UI.inp('from', f.from, 'type="date"'))}${UI.fld('To', UI.inp('to', f.to, 'type="date"'))}</div><div id="vc-tbl"></div></div>`;
  el.querySelectorAll('.filters [name]').forEach(s => s.onchange = () => { q[s.name] = s.value; V.vouchers(el, [type], q); });
  UI.mountTable(el.querySelector('#vc-tbl'), { rows, csv: type + '-vouchers', empty: 'No vouchers yet.', onRow: r => App.go('voucher/' + r.id),
    columns: type === 'journal'
      ? [{ key: 'no', label: 'Number', render: r => `<b>${r.no}</b>` }, { key: 'date', label: 'Date', text: r => UI.date(r.date), sortVal: r => r.date }, { key: 'memo', label: 'Description' }, { key: 'n', label: 'Lines', align: 'r', text: r => r.lines.length }, { key: 'amount', label: 'Amount', align: 'r', text: r => UI.num(r.amount) }, { key: 'by', label: 'By', text: r => r.createdBy || '' }]
      : [{ key: 'no', label: 'Number', render: r => `<b>${r.no}</b>` }, { key: 'date', label: 'Date', text: r => UI.date(r.date), sortVal: r => r.date }, { key: 'acc', label: type === 'receipt' ? 'Received from' : 'Paid to', text: r => accName(r.accountId) },
        { key: 'cash', label: type === 'receipt' ? 'Deposited to' : 'Paid from', text: r => accName(r.cashAccountId) }, { key: 'amount', label: 'Amount', align: 'r', sortVal: B, text: r => UI.money(r.amount, r.currency) },
        { key: 'inv', label: 'Invoice', text: r => (Eng.get('invoices', r.invoiceId) || {}).no || '' }, { key: 'memo', label: 'Description' }],
    footer: type === 'journal' ? null : rs => `<td colspan="4">Total (${UI.base().code})</td><td class="r">${UI.num(U.sum(rs, B))}</td><td colspan="2"></td>` });
  el.querySelector('#vc-new').onclick = () => V.voucherForm({ type }, () => App.refresh());
  if (q.new) V.voucherForm({ type, accountId: q.account || '' }, v => App.go('voucher/' + v.id));
};
V.voucherForm = (preset, done) => {
  const d = db(), base = UI.base(), v = Object.assign({ date: U.today(), accountId: '', cashAccountId: Eng.defCash(), amount: '', currency: base.code, rate: 1, memo: '', invoiceId: '', lines: [] }, U.clone(preset));
  const T = Eng.VCH[v.type], isNew = !v.id;
  if (v.type === 'journal') return V.journalForm(v, done);
  UI.modal({ title: (isNew ? 'New ' : 'Edit ') + T.label + (v.no ? ' ' + v.no : ''), icon: v.type === 'receipt' ? 'cash' : 'wallet', size: 'lg',
    body: `<form class="form-grid">
      ${UI.fld(v.type === 'receipt' ? 'Received from (account) *' : 'Paid to (account) *', UI.sel('accountId', V.accountGroupedOpts(v.accountId, a => a.kind !== 'cash' && a.kind !== 'bank')), 'fld-2')}
      ${UI.fld('Date *', UI.inp('date', v.date, 'type="date"'))}
      ${UI.fld(v.type === 'receipt' ? 'Deposit to *' : 'Pay from *', UI.sel('cashAccountId', UI.opts(Eng.cashAccounts(), 'id', a => a.name, v.cashAccountId)))}
      ${UI.fld('Currency', UI.sel('currency', UI.opts(d.currencies, 'code', c => c.code, v.currency)))}${UI.fld(`Rate (per 1 ${base.code})`, UI.inp('rate', v.rate, 'type="number" step="any" min="0"'))}
      ${UI.fld('Amount *', UI.inp('amount', v.amount, 'type="number" step="any" min="0" autofocus'))}${UI.fld('Equivalent', `<div class="readonly-v" id="vf-eq">—</div>`)}
      ${UI.fld('Against invoice (optional)', UI.sel('invoiceId', ''), 'fld-2')}${UI.fld('Description', UI.inp('memo', v.memo), 'fld-2')}
      <div class="fld-full party-info" id="vf-bal"></div></form>`,
    onOpen: me => {
      const f = me.querySelector('form');
      const invs = () => {
        const want = v.type === 'receipt' ? ['sale', 'purchase_return'] : ['purchase', 'sale_return'];
        const list = d.invoices.filter(i => i.accountId === f.accountId.value && want.includes(i.type) && (Eng.dueOf(i) > 0.004 || i.id === v.invoiceId));
        f.invoiceId.innerHTML = `<option value="">— On account (no specific invoice) —</option>` + list.map(i => `<option value="${i.id}" ${i.id === v.invoiceId ? 'selected' : ''}>${i.no} · ${UI.date(i.date)} · due ${UI.money(Eng.dueOf(i), i.currency)}</option>`).join('');
        const a = Eng.account(f.accountId.value); me.querySelector('#vf-bal').innerHTML = a ? `${UI.icon('users')}<span>Current balance of <b>${UI.esc(a.name)}</b>: <b>${UI.money(Eng.natural(a, Eng.balance(a.id)))}</b></span>` : '';
      };
      const eq = () => { me.querySelector('#vf-eq').textContent = UI.money((+f.amount.value || 0) / (+f.rate.value || 1)); };
      f.accountId.onchange = invs; f.amount.oninput = f.rate.oninput = eq;
      f.currency.onchange = () => { f.rate.value = UI.cur(f.currency.value).rate; eq(); };
      f.invoiceId.onchange = () => { const i = Eng.get('invoices', f.invoiceId.value); if (i && i.id !== v.invoiceId) { f.currency.value = i.currency; f.rate.value = i.rate; f.amount.value = Eng.dueOf(i); if (!f.memo.value) f.memo.value = 'Payment for ' + i.no; eq(); } };
      invs(); eq();
    },
    buttons: [{ label: 'Cancel', onClick: m => m.close() }, { label: 'Save & print', icon: 'printer', onClick: m => go(m, true) }, { label: 'Save', cls: 'btn-primary', icon: 'check', onClick: m => go(m) }] });
  function go(m, print) {
    const x = UI.formData(m.el.querySelector('form')), r = UI.try(() => Eng.saveVoucher(Object.assign({}, v, x, { rate: +x.rate || 1 })));
    if (!r) return;
    m.close(); UI.toast(`${T.label} ${r.no} saved`);
    if (print) UI.print(V.voucherDoc(r));
    done ? done(r) : App.refresh();
  }
};
V.journalForm = (v, done) => {
  const d = db(), isNew = !v.id; let lines = v.lines.length ? v.lines.map(l => Object.assign({}, l)) : [{ accountId: '', debit: '', credit: '', note: '' }, { accountId: '', debit: '', credit: '', note: '' }];
  UI.modal({ title: (isNew ? 'New' : 'Edit') + ' journal voucher' + (v.no ? ' ' + v.no : ''), icon: 'book', size: 'xl',
    body: `<form class="form-grid">${UI.fld('Date *', UI.inp('date', v.date, 'type="date"'))}${UI.fld('Description', UI.inp('memo', v.memo), 'fld-3')}</form><div id="jv-lines" class="mt"></div>`,
    onOpen: me => {
      const box = me.querySelector('#jv-lines');
      const tot = () => { const dr = U.r(U.sum(lines, l => l.debit)), cr = U.r(U.sum(lines, l => l.credit)); box.querySelector('#jv-tot').innerHTML = `<td>Total</td><td class="r">${UI.num(dr)}</td><td class="r">${UI.num(cr)}</td><td colspan="2">${dr === cr && dr > 0 ? UI.badge('Balanced', 'green') : UI.badge('Difference ' + UI.num(dr - cr), 'red')}</td>`; };
      const render = () => {
        box.innerHTML = `<div class="table-wrap"><table class="tbl lines"><thead><tr><th>Account</th><th class="r" style="width:130px">Debit</th><th class="r" style="width:130px">Credit</th><th>Line note</th><th style="width:40px"></th></tr></thead><tbody>
          ${lines.map((l, i) => `<tr data-i="${i}"><td><select class="j-acc">${V.accountGroupedOpts(l.accountId)}</select></td><td><input type="number" step="any" min="0" class="j-dr r" value="${l.debit}"></td><td><input type="number" step="any" min="0" class="j-cr r" value="${l.credit}"></td><td><input class="j-note" value="${UI.esc(l.note || '')}"></td><td><button type="button" class="icon-btn sm j-del">${UI.icon('x')}</button></td></tr>`).join('')}
          </tbody><tfoot><tr id="jv-tot"></tr></tfoot></table></div><div class="row gap mt-s"><button type="button" class="btn btn-light btn-sm" id="jv-add">${UI.icon('plus')}<span>Add line</span></button><button type="button" class="btn btn-light btn-sm" id="jv-bal">${UI.icon('scale')}<span>Balance last line</span></button></div>`;
        box.querySelectorAll('tr[data-i]').forEach(tr => { const l = lines[+tr.dataset.i], g = s => tr.querySelector(s);
          g('.j-acc').onchange = e => l.accountId = e.target.value; g('.j-note').oninput = e => l.note = e.target.value;
          g('.j-dr').oninput = e => { l.debit = e.target.value; if (+l.debit) { l.credit = ''; g('.j-cr').value = ''; } tot(); };
          g('.j-cr').oninput = e => { l.credit = e.target.value; if (+l.credit) { l.debit = ''; g('.j-dr').value = ''; } tot(); };
          g('.j-del').onclick = () => { if (lines.length > 2) { lines.splice(+tr.dataset.i, 1); render(); } }; });
        box.querySelector('#jv-add').onclick = () => { lines.push({ accountId: '', debit: '', credit: '', note: '' }); render(); };
        box.querySelector('#jv-bal').onclick = () => { const l = lines[lines.length - 1]; l.debit = l.credit = ''; const df = U.r(U.sum(lines, x => x.debit) - U.sum(lines, x => x.credit)); if (df > 0) l.credit = df; else if (df < 0) l.debit = -df; render(); };
        tot();
      };
      render();
    },
    buttons: [{ label: 'Cancel', onClick: m => m.close() }, { label: 'Save', cls: 'btn-primary', icon: 'check', onClick: m => {
      const x = UI.formData(m.el.querySelector('form'));
      const r = UI.try(() => Eng.saveVoucher(Object.assign({}, v, x, { currency: UI.base().code, rate: 1, lines: lines.map(l => ({ accountId: l.accountId, debit: +l.debit || 0, credit: +l.credit || 0, note: l.note })) })));
      if (r) { m.close(); UI.toast('Journal voucher ' + r.no + ' saved'); done ? done(r) : App.refresh(); }
    } }] });
};
V.voucherView = (el, [id]) => {
  const v = Eng.get('vouchers', id);
  if (!v) { el.innerHTML = UI.head({ title: 'Voucher not found', icon: 'receipt' }) + UI.empty('This voucher was deleted.', 'receipt', '<a class="btn btn-primary" href="#/vouchers/receipt">Back to vouchers</a>'); return; }
  const T = Eng.VCH[v.type], je = db().journal.find(j => j.refType === 'voucher' && j.refId === id);
  el.innerHTML = UI.head({ title: T.label + ' ' + v.no, icon: 'receipt', crumbs: [['Vouchers', 'vouchers/' + v.type], [T.plural, 'vouchers/' + v.type], [v.no]],
    actions: `<a class="btn btn-light" href="#/vouchers/${v.type}">${UI.icon('arrowL')}<span>List</span></a>` + UI.btn('Delete', { icon: 'trash', cls: 'btn-light danger', attrs: 'id="vv-del"' }) + UI.btn('Edit', { icon: 'edit', attrs: 'id="vv-edit"' }) + UI.btn('Print', { icon: 'printer', cls: 'btn-primary', attrs: 'id="vv-print"' }) }) +
    `<div class="inv-view"><div class="card doc-card">${V.voucherDoc(v)}</div><div class="stack">
      ${v.invoiceId && Eng.get('invoices', v.invoiceId) ? `<div class="card"><div class="card-body">${UI.icon('file')} Linked to invoice <a class="link" href="#/invoice/${v.invoiceId}">${Eng.get('invoices', v.invoiceId).no}</a></div></div>` : ''}
      ${je ? `<div class="card"><div class="card-head"><h3>${UI.icon('book')}Journal entry ${je.no}</h3></div><div class="card-body p0"><table class="tbl clickable"><thead><tr><th>Account</th><th class="r">Debit</th><th class="r">Credit</th></tr></thead><tbody>${je.lines.map(l => `<tr data-acc="${l.accountId}"><td>${UI.esc(accName(l.accountId))}</td><td class="r">${l.debit ? UI.num(l.debit) : ''}</td><td class="r">${l.credit ? UI.num(l.credit) : ''}</td></tr>`).join('')}</tbody></table></div></div>` : ''}
      <div class="card"><div class="card-body muted sm">Created ${UI.datetime(v.created)} by ${UI.esc(v.createdBy || '—')}</div></div></div></div>`;
  el.querySelectorAll('[data-acc]').forEach(tr => tr.onclick = () => App.can('statement') ? App.go('statement/' + tr.dataset.acc) : null);
  el.querySelector('#vv-print').onclick = () => UI.print(V.voucherDoc(v));
  el.querySelector('#vv-edit').onclick = () => V.voucherForm(v, () => App.refresh());
  el.querySelector('#vv-del').onclick = async () => { if (await UI.confirm(`Delete ${v.no}? Its journal entry will be reversed.`, { danger: true, ok: 'Delete' })) { if (UI.try(() => Eng.deleteVoucher(id), 'Voucher deleted')) App.go('vouchers/' + v.type); } };
};
V.journalView = (el, [id]) => {
  const je = db().journal.find(j => j.id === id);
  if (!je) { el.innerHTML = UI.head({ title: 'Journal entry not found', icon: 'book' }) + UI.empty('This entry no longer exists.', 'book'); return; }
  el.innerHTML = UI.head({ title: 'Journal entry ' + je.no, icon: 'book', crumbs: [['Accounts', 'accounts/chart'], ['Journal'], [je.no]],
    actions: UI.btn('Back', { icon: 'arrowL', attrs: 'onclick="history.back()"' }) + (je.refType ? UI.btn('Open source document', { icon: 'file', cls: 'btn-primary', attrs: 'id="je-src"' }) : '') + UI.btn('Print', { icon: 'printer', attrs: 'id="je-print"' }) }) +
    `<div class="card"><div class="card-body">${docMeta([['Number', je.no], ['Date', UI.date(je.date)], ['Reference', UI.esc(je.ref || '—')], ['Description', UI.esc(je.memo || '')], ['Posted by', UI.esc(je.user || '')], ['Posted at', UI.datetime(je.created)]])}</div>
     <table class="tbl clickable" id="je-tbl"><thead><tr><th>Code</th><th>Account</th><th>Note</th><th class="r">Debit</th><th class="r">Credit</th></tr></thead><tbody>${je.lines.map(l => { const a = Eng.account(l.accountId) || {}; return `<tr data-acc="${l.accountId}"><td>${UI.esc(a.code || '')}</td><td><b>${UI.esc(a.name || '?')}</b></td><td>${UI.esc(l.note || '')}</td><td class="r">${l.debit ? UI.num(l.debit) : ''}</td><td class="r">${l.credit ? UI.num(l.credit) : ''}</td></tr>`; }).join('')}</tbody>
     <tfoot><tr><td colspan="3">Total</td><td class="r">${UI.num(U.sum(je.lines, l => l.debit))}</td><td class="r">${UI.num(U.sum(je.lines, l => l.credit))}</td></tr></tfoot></table></div>`;
  el.querySelectorAll('[data-acc]').forEach(tr => tr.onclick = () => App.go('statement/' + tr.dataset.acc));
  const src = el.querySelector('#je-src'); if (src) src.onclick = () => App.openRef(je.refType, je.refId);
  el.querySelector('#je-print').onclick = () => UI.printTable('Journal entry ' + je.no, UI.esc(je.memo || ''), el.querySelector('#je-tbl').outerHTML);
};
