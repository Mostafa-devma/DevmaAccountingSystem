/* Devma — Stock management: transfers, opening stock, movements, update/waste */
'use strict';

/* reusable item-lines editor used inside modals */
V.linesEditor = (box, lines, opt = {}) => {
  const st = (lines && lines.length ? lines : [{ itemId: '', qty: '' }]).map(l => Object.assign({}, l));
  const dl = 'dl-' + Math.random().toString(36).slice(2, 8), filter = opt.filter || (i => i.type !== 'service' && i.active !== false);
  const render = focus => {
    const sm = Eng.stockMap(), wh = opt.wh ? opt.wh() : null;
    box.innerHTML = `<div class="table-wrap"><table class="tbl lines"><thead><tr><th>Item</th>${wh !== null ? '<th class="r">Available</th>' : ''}<th class="r" style="width:110px">Quantity</th>${opt.cost ? '<th class="r" style="width:120px">Unit cost</th>' : ''}${opt.share ? '<th class="r" style="width:120px">Cost share %</th>' : ''}<th style="width:40px"></th></tr></thead><tbody>
      ${st.map((l, i) => { const it = Eng.item(l.itemId); return `<tr data-i="${i}"><td><input list="${dl}" class="li-item" value="${UI.esc(UI.itemLabel(it))}" placeholder="Type code, name or scan barcode"></td>
        ${wh !== null ? `<td class="r muted nowrap">${it ? UI.qty(sm.at(it.id, wh)) + ' ' + UI.esc(it.unit) : ''}</td>` : ''}
        <td><input type="number" step="any" min="0" class="li-qty r" value="${l.qty ?? ''}"></td>
        ${opt.cost ? `<td><input type="number" step="any" min="0" class="li-cost r" value="${l.cost ?? (it ? it.cost : '')}"></td>` : ''}
        ${opt.share ? `<td><input type="number" step="any" min="0" class="li-share r" value="${l.share ?? ''}"></td>` : ''}
        <td><button type="button" class="icon-btn sm li-del" title="Remove line">${UI.icon('x')}</button></td></tr>`; }).join('')}
      </tbody></table></div><button type="button" class="btn btn-light btn-sm li-add mt-s">${UI.icon('plus')}<span>Add line</span></button>${UI.itemDatalist(dl, filter)}`;
    box.querySelectorAll('tr[data-i]').forEach(tr => {
      const i = +tr.dataset.i, $ = s => tr.querySelector(s);
      $('.li-item').onchange = e => {
        const it = UI.findItem(e.target.value);
        if (!it && e.target.value) { UI.toast('Item not found: ' + e.target.value, 'warn'); e.target.value = ''; st[i].itemId = ''; return; }
        st[i].itemId = it ? it.id : ''; if (it && opt.cost) st[i].cost = it.cost;
        if (it && i === st.length - 1) st.push({ itemId: '', qty: '' });
        render({ i, cls: '.li-qty' }); opt.onChange && opt.onChange();
      };
      $('.li-qty').oninput = e => { st[i].qty = e.target.value; opt.onChange && opt.onChange(); };
      if ($('.li-cost')) $('.li-cost').oninput = e => { st[i].cost = e.target.value; };
      if ($('.li-share')) $('.li-share').oninput = e => { st[i].share = e.target.value; opt.onChange && opt.onChange(); };
      $('.li-del').onclick = () => { st.splice(i, 1); if (!st.length) st.push({ itemId: '', qty: '' }); render(); opt.onChange && opt.onChange(); };
    });
    box.querySelector('.li-add').onclick = () => { st.push({ itemId: '', qty: '' }); render({ i: st.length - 1, cls: '.li-item' }); };
    if (focus) { const f = box.querySelector(`tr[data-i="${focus.i}"] ${focus.cls}`); f && f.focus(); }
  };
  render();
  return { get: () => st.filter(l => l.itemId), set: ls => { st.length = 0; ls.forEach(l => st.push(Object.assign({}, l))); st.push({ itemId: '', qty: '' }); render(); }, render };
};
const linesTable = (lines, cols) => `<table class="tbl"><thead><tr><th>Item</th>${cols.map(c => `<th class="r">${c[0]}</th>`).join('')}</tr></thead><tbody>${lines.map(l => { const it = Eng.item(l.itemId); return `<tr><td>${it ? `<a href="#/item/${it.id}" class="link">${UI.esc(it.code)}</a> ${UI.esc(it.name)}` : '<i>deleted item</i>'}</td>${cols.map(c => `<td class="r">${c[1](l, it)}</td>`).join('')}</tr>`; }).join('')}</tbody></table>`;
const docMeta = rows => `<div class="meta-grid">${rows.map(([k, v]) => `<div><span>${k}</span><b>${v}</b></div>`).join('')}</div>`;

/* ---------------- Transfers ---------------- */
V.transferForm = (preset = {}, done) => {
  const d = db(); let ed;
  if (d.warehouses.length < 2) return UI.toast('Create a second warehouse first (Items → Warehouses).', 'warn');
  const from = preset.fromWh || Eng.defWh(), to = preset.toWh || (d.warehouses.find(w => w.id !== from) || {}).id;
  UI.modal({ title: 'New stock transfer', icon: 'truck', size: 'xl',
    body: `<form class="form-grid">${UI.fld('Date', UI.inp('date', U.today(), 'type="date"'))}${UI.fld('From warehouse', UI.sel('fromWh', UI.opts(d.warehouses, 'id', 'name', from)))}${UI.fld('To warehouse', UI.sel('toWh', UI.opts(d.warehouses, 'id', 'name', to)))}${UI.fld('Note', UI.inp('note', ''))}</form><div id="tr-lines" class="mt"></div>`,
    onOpen: me => { const f = me.querySelector('form'); ed = V.linesEditor(me.querySelector('#tr-lines'), preset.lines, { wh: () => f.fromWh.value }); f.fromWh.onchange = () => ed.render(); },
    buttons: [{ label: 'Cancel', onClick: m => m.close() }, { label: 'Save transfer', cls: 'btn-primary', icon: 'check', onClick: m => {
      const x = UI.formData(m.el.querySelector('form')); const t = UI.try(() => Eng.saveTransfer(Object.assign(x, { lines: ed.get() })));
      if (t) { m.close(); UI.toast('Transfer ' + t.no + ' saved'); done ? done(t) : App.route_ && App.route_.name === 'stock' ? App.refresh() : V.showTransfer(t.id); }
    } }] });
};
V.showTransfer = id => {
  const t = Eng.get('transfers', id); if (!t) return UI.toast('Transfer not found.', 'error');
  const body = docMeta([['Number', t.no], ['Date', UI.date(t.date)], ['From', UI.esc(whName(t.fromWh))], ['To', UI.esc(whName(t.toWh))], ['By', UI.esc(t.createdBy || '')], ['Note', UI.esc(t.note || '—')]]) + linesTable(t.lines, [['Quantity', l => UI.qty(l.qty)]]);
  UI.modal({ title: 'Stock transfer ' + t.no, icon: 'truck', size: 'lg', body,
    buttons: [{ label: 'Delete', cls: 'btn-light danger', icon: 'trash', onClick: async m => { if (await UI.confirm(`Delete transfer ${t.no}? Stock returns to ${whName(t.fromWh)}.`, { danger: true, ok: 'Delete' })) { if (UI.try(() => Eng.deleteTransfer(id), 'Transfer deleted')) { m.close(); App.refresh(); } } } },
      { label: 'Print', icon: 'printer', onClick: () => UI.printTable('Stock transfer ' + t.no, '', body) }, { label: 'Close', cls: 'btn-primary', onClick: m => m.close() }] });
};

/* ---------------- Stock management (tabs) ---------------- */
V.stock = (el, [tab = 'transfers'], q) => {
  const d = db();
  const tabs = UI.tabs([['transfers', 'Transfers', d.transfers.length], ['opening', 'Opening stock', d.adjustments.filter(a => a.kind === 'opening').length], ['moves', 'All movements', d.stockMoves.length]], tab, 'stock');
  const head = (actions) => UI.head({ title: 'Stock Management', icon: 'truck', crumbs: [['Stock', 'inventory'], ['Stock Management']], actions }) + tabs;
  if (tab === 'transfers') {
    el.innerHTML = head(UI.btn('New transfer', { icon: 'plus', cls: 'btn-primary', attrs: 'id="s-new"' })) + '<div class="card"><div id="s-tbl"></div></div>';
    UI.mountTable(el.querySelector('#s-tbl'), { rows: d.transfers.slice().reverse(), csv: 'transfers', empty: 'No transfers yet. Click "New transfer" to move stock between warehouses.', onRow: r => V.showTransfer(r.id),
      columns: [{ key: 'no', label: 'Number', render: r => `<b>${r.no}</b>` }, { key: 'date', label: 'Date', text: r => UI.date(r.date), sortVal: r => r.date }, { key: 'from', label: 'From', text: r => whName(r.fromWh) }, { key: 'to', label: 'To', text: r => whName(r.toWh) },
        { key: 'n', label: 'Lines', align: 'r', text: r => r.lines.length }, { key: 'q', label: 'Total qty', align: 'r', text: r => UI.qty(U.sum(r.lines, l => l.qty)) }, { key: 'note', label: 'Note' }, { key: 'by', label: 'By', text: r => r.createdBy || '' }] });
    el.querySelector('#s-new').onclick = () => V.transferForm();
    if (q.new) V.transferForm();
  } else if (tab === 'opening') {
    el.innerHTML = head(UI.btn('Enter opening stock', { icon: 'plus', cls: 'btn-primary', attrs: 'id="s-new"' })) + `<div class="card"><div class="card-body hint">${UI.icon('info')}Opening stock records quantities you already had before using Devma. Its value is posted to <b>Opening Balance Equity</b>.</div><div id="s-tbl"></div></div>`;
    UI.mountTable(el.querySelector('#s-tbl'), { rows: d.adjustments.filter(a => a.kind === 'opening').reverse(), empty: 'No opening stock entered.', onRow: r => V.showAdjustment(r.id),
      columns: [{ key: 'no', label: 'Number', render: r => `<b>${r.no}</b>` }, { key: 'date', label: 'Date', text: r => UI.date(r.date) }, { key: 'wh', label: 'Warehouse', text: r => whName(r.warehouseId) }, { key: 'n', label: 'Items', align: 'r', text: r => r.lines.length }, { key: 'v', label: 'Value', align: 'r', text: r => UI.num(U.sum(r.lines, l => l.qty * l.cost)) }, { key: 'reason', label: 'Note' }] });
    el.querySelector('#s-new').onclick = () => V.adjustmentForm({ kind: 'opening' }, () => App.refresh());
  } else {
    const f = { wh: q.wh || '', type: q.type || '', from: q.from || U.addDays(U.today(), -30), to: q.to || U.today() };
    const TYPES_M = { purchase: 'Purchase', sale: 'Sale', sale_return: 'Sales return', purchase_return: 'Purchase return', transfer: 'Transfer', increase: 'Increase', decrease: 'Decrease', waste: 'Waste', opening: 'Opening', count: 'Stock count' };
    el.innerHTML = head(UI.btn('New transfer', { icon: 'truck', attrs: 'id="s-new"' })) + `<div class="card"><div class="filters">${UI.fld('From', UI.inp('from', f.from, 'type="date"'))}${UI.fld('To', UI.inp('to', f.to, 'type="date"'))}${UI.fld('Warehouse', UI.sel('wh', UI.opts(d.warehouses, 'id', 'name', f.wh, 'All')))}${UI.fld('Movement', UI.sel('type', UI.opts(Object.entries(TYPES_M), 0, 1, f.type, 'All')))}</div><div id="s-tbl"></div></div>`;
    el.querySelectorAll('.filters [name]').forEach(s => s.onchange = () => { q[s.name] = s.value; V.stock(el, [tab], q); });
    const rows = d.stockMoves.filter(m => m.date >= f.from && m.date <= f.to && (!f.wh || m.warehouseId === f.wh) && (!f.type || m.type === f.type)).sort((a, b) => b.date.localeCompare(a.date) || (b.created || '').localeCompare(a.created || ''));
    UI.mountTable(el.querySelector('#s-tbl'), { rows, csv: 'stock-movements', pageSize: 25, onRow: r => App.openRef(r.refType, r.refId),
      columns: [{ key: 'date', label: 'Date', text: r => UI.date(r.date), sortVal: r => r.date }, { key: 'ref', label: 'Document', render: r => `<a class="link">${UI.esc(r.ref)}</a>` }, { key: 'type', label: 'Movement', text: r => TYPES_M[r.type] || r.type },
        { key: 'item', label: 'Item', text: r => (Eng.item(r.itemId) || {}).name || '', render: r => `<a class="link" href="#/item/${r.itemId}">${UI.esc((Eng.item(r.itemId) || {}).name || '?')}</a>` }, { key: 'wh', label: 'Warehouse', text: r => whName(r.warehouseId) },
        { key: 'in', label: 'In', align: 'r', text: r => r.qty > 0 ? UI.qty(r.qty) : '' }, { key: 'out', label: 'Out', align: 'r', text: r => r.qty < 0 ? UI.qty(-r.qty) : '' }, { key: 'cost', label: 'Unit cost', align: 'r', text: r => UI.num(r.cost) }, { key: 'val', label: 'Value', align: 'r', render: r => UI.signed(r.qty * r.cost), text: r => UI.num(r.qty * r.cost) }] });
    el.querySelector('#s-new').onclick = () => V.transferForm();
  }
};

/* ---------------- Update / Waste ---------------- */
const REASONS = { increase: ['Found during count', 'Received free sample', 'Correction'], decrease: ['Lost / missing', 'Internal use', 'Correction', 'Given as sample'], waste: ['Expired', 'Damaged', 'Spoiled', 'Broken in transit'], opening: ['Opening stock'] };
V.adjustmentForm = (preset = {}, done) => {
  const d = db(), a = Object.assign({ kind: 'increase', date: U.today(), warehouseId: Eng.defWh(), reason: '', lines: [] }, U.clone(preset));
  const kinds = a.kind === 'opening' ? [['opening', 'Opening stock']] : [['increase', 'Increase stock (+)'], ['decrease', 'Decrease stock (−)'], ['waste', 'Waste / damaged (−)']];
  let ed;
  UI.modal({ title: (a.id ? 'Edit ' : '') + (a.kind === 'opening' ? 'Opening stock' : 'Update / waste stock'), icon: 'refresh', size: 'xl',
    body: `<form class="form-grid">${UI.fld('Type', UI.sel('kind', UI.opts(kinds, 0, 1, a.kind)))}${UI.fld('Date', UI.inp('date', a.date, 'type="date"'))}${UI.fld('Warehouse', UI.sel('warehouseId', UI.opts(d.warehouses, 'id', 'name', a.warehouseId)))}
      ${UI.fld('Reason', UI.inp('reason', a.reason, 'list="dl-reasons" placeholder="Choose or type"') + `<datalist id="dl-reasons"></datalist>`)}</form>
      <div class="hint mt" id="adj-hint"></div><div id="adj-lines" class="mt"></div>`,
    onOpen: me => {
      const f = me.querySelector('form'), upd = () => {
        const k = f.kind.value; me.querySelector('#dl-reasons').innerHTML = (REASONS[k] || []).map(r => `<option>${r}</option>`).join('');
        me.querySelector('#adj-hint').innerHTML = UI.icon('info') + { increase: 'Adds quantity. Value posts to <b>Inventory Adjustments</b>. Enter a unit cost to update the average cost.', decrease: 'Removes quantity at average cost. Value posts to <b>Inventory Adjustments</b>.', waste: 'Removes damaged / expired stock at average cost. Value posts to <b>Waste &amp; Spoilage</b> expense.', opening: 'Adds stock you already owned. Value posts to <b>Opening Balance Equity</b>.' }[k];
        ed = V.linesEditor(me.querySelector('#adj-lines'), ed ? ed.get() : a.lines, { cost: k === 'increase' || k === 'opening', wh: () => f.warehouseId.value });
      };
      f.kind.onchange = upd; f.warehouseId.onchange = () => ed.render(); upd();
    },
    buttons: [{ label: 'Cancel', onClick: m => m.close() }, { label: 'Post', cls: 'btn-primary', icon: 'check', onClick: m => {
      const x = UI.formData(m.el.querySelector('form'));
      const r = UI.try(() => Eng.saveAdjustment(Object.assign({}, a, x, { lines: ed.get().map(l => ({ itemId: l.itemId, qty: +l.qty, cost: l.cost })) })));
      if (r) { m.close(); UI.toast(`${Eng.ADJ[r.kind].label} ${r.no} posted`); done ? done(r) : App.refresh(); }
    } }] });
};
V.showAdjustment = id => {
  const a = Eng.get('adjustments', id); if (!a) return UI.toast('Adjustment not found.', 'error');
  const T = Eng.ADJ[a.kind], sign = T.sign, val = U.sum(a.lines, l => sign * l.qty * l.cost);
  const body = docMeta([['Number', a.no], ['Type', T.label], ['Date', UI.date(a.date)], ['Warehouse', UI.esc(whName(a.warehouseId))], ['Reason', UI.esc(a.reason || '—')], ['Value', UI.signed(val)]]) +
    linesTable(a.lines, [['Quantity', l => UI.signed(sign * l.qty)], ['Unit cost', l => UI.num(l.cost)], ['Value', l => UI.signed(sign * l.qty * l.cost)]]);
  const je = db().journal.find(j => j.refType === 'adjustment' && j.refId === id);
  UI.modal({ title: T.label + ' ' + a.no, icon: 'refresh', size: 'lg', body,
    buttons: [{ label: 'Delete', cls: 'btn-light danger', icon: 'trash', onClick: async m => { if (await UI.confirm(`Delete ${a.no}? Stock and ledger entries will be reversed.`, { danger: true, ok: 'Delete' })) { if (UI.try(() => Eng.deleteAdjustment(id), 'Adjustment deleted')) { m.close(); App.refresh(); } } } },
      ...(a.kind !== 'count' ? [{ label: 'Edit', icon: 'edit', onClick: m => { m.close(); V.adjustmentForm(a); } }] : []),
      ...(je && App.can('statement') ? [{ label: 'Journal entry', icon: 'book', onClick: () => App.go('journal/' + je.id) }] : []),
      { label: 'Print', icon: 'printer', onClick: () => UI.printTable(T.label + ' ' + a.no, '', body) }, { label: 'Close', cls: 'btn-primary', onClick: m => m.close() }] });
};
V.waste = (el, a, q) => {
  const d = db(), f = { kind: q.kind || '' };
  const rows = d.adjustments.filter(x => x.kind !== 'opening' && (!f.kind || x.kind === f.kind)).reverse();
  const ms = U.monthStart(), val = x => U.sum(x.lines, l => Eng.ADJ[x.kind].sign * l.qty * l.cost);
  const wasteM = U.sum(d.adjustments.filter(x => x.kind === 'waste' && x.date >= ms), x => -val(x));
  el.innerHTML = UI.head({ title: 'Update / Waste Stock', icon: 'refresh', crumbs: [['Stock', 'inventory'], ['Update / Waste']],
    actions: UI.btn('Increase', { icon: 'plus', attrs: 'data-k="increase"' }) + UI.btn('Decrease', { icon: 'minus', attrs: 'data-k="decrease"' }) + UI.btn('Record waste', { icon: 'trash', cls: 'btn-accent', attrs: 'data-k="waste"' }) + UI.btn('Stock count', { icon: 'clipboard', cls: 'btn-primary', attrs: 'id="w-count"' }) }) +
    `<div class="kpis">${UI.kpi('Waste this month', UI.money(wasteM), { icon: 'trash', tone: 'warn', link: App.can('reports') ? 'report/waste' : '' })}${UI.kpi('Adjustments', rows.length, { icon: 'refresh', tone: 't2' })}${UI.kpi('Net adjustment value', UI.money(U.sum(rows, val)), { icon: 'coins', tone: 't3' })}</div>
    <div class="card"><div class="filters">${UI.fld('Type', UI.sel('kind', UI.opts([['increase', 'Increase'], ['decrease', 'Decrease'], ['waste', 'Waste'], ['count', 'Stock count']], 0, 1, f.kind, 'All types')))}</div><div id="w-tbl"></div></div>`;
  el.querySelector('[name=kind]').onchange = e => { q.kind = e.target.value; V.waste(el, a, q); };
  UI.mountTable(el.querySelector('#w-tbl'), { rows, csv: 'stock-adjustments', empty: 'No adjustments yet.', onRow: r => V.showAdjustment(r.id),
    columns: [{ key: 'no', label: 'Number', render: r => `<b>${r.no}</b>` }, { key: 'date', label: 'Date', text: r => UI.date(r.date), sortVal: r => r.date },
      { key: 'kind', label: 'Type', text: r => Eng.ADJ[r.kind].label, render: r => UI.badge(Eng.ADJ[r.kind].label, { increase: 'green', decrease: 'amber', waste: 'red', count: 'blue' }[r.kind]) },
      { key: 'wh', label: 'Warehouse', text: r => whName(r.warehouseId) }, { key: 'reason', label: 'Reason' }, { key: 'n', label: 'Items', align: 'r', text: r => r.lines.length },
      { key: 'v', label: 'Value', align: 'r', sortVal: val, render: r => UI.signed(val(r)), text: r => UI.num(val(r)) }, { key: 'by', label: 'By', text: r => r.createdBy || '' }] });
  el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => V.adjustmentForm({ kind: b.dataset.k }));
  el.querySelector('#w-count').onclick = () => V.stockCount(Eng.defWh(), '', () => App.refresh());
  if (q.new) V.adjustmentForm({ kind: q.new === '1' ? 'waste' : q.new });
};
