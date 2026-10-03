/* Devma — Items, Item card, Categories, Warehouses, Currencies, Money Converter, Stock Inventory */
'use strict';
const TYPES = { stock: 'Stock item', raw: 'Raw material', service: 'Service' };
const catName = id => { const c = Eng.get('categories', id); return c ? c.name : '—'; };
const whName = id => { const w = Eng.get('warehouses', id); return w ? w.name : '—'; };
/* in-page tab switcher */
function localTabs(el, onShow) {
  el.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => {
    el.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('active', x === b));
    el.querySelectorAll('[data-pane]').forEach(p => p.hidden = p.dataset.pane !== b.dataset.tab);
    onShow && onShow(b.dataset.tab);
  });
}

/* ---------------- Item form (shared) ---------------- */
V.itemForm = (item, done) => {
  const d = db(), isNew = !item;
  item = item || { code: '', barcode: '', name: '', categoryId: '', unit: 'pcs', cost: 0, price: 0, minQty: 0, type: 'stock', active: true };
  if (isNew) { const n = d.items.length + 1; item.code = 'ITM-' + String(n).padStart(3, '0'); while (d.items.some(i => i.code === item.code)) item.code = 'ITM-' + String(Math.floor(Math.random() * 9000 + 1000)); }
  const m = UI.formModal({
    title: isNew ? 'New item' : 'Edit item — ' + item.name, icon: 'box', size: 'lg',
    fields: UI.fld('Item name *', UI.inp('name', item.name, 'required'), 'fld-2') + UI.fld('Code *', UI.inp('code', item.code)) +
      UI.fld('Barcode', `<div class="input-group">${UI.inp('barcode', item.barcode)}<button type="button" class="btn btn-light btn-sm" id="gen-bc" title="Generate">${UI.icon('barcode')}</button></div>`) +
      UI.fld('Category', `<div class="input-group">${UI.sel('categoryId', UI.opts(d.categories, 'id', 'name', item.categoryId, '— None —'))}<button type="button" class="btn btn-light btn-sm" id="new-cat" title="New category">${UI.icon('plus')}</button></div>`) +
      UI.fld('Type', UI.sel('type', UI.opts(Object.entries(TYPES), 0, 1, item.type))) + UI.fld('Unit', UI.inp('unit', item.unit, 'list="dl-units"') + '<datalist id="dl-units"><option>pcs<option>box<option>kg<option>g<option>L<option>pack<option>night<option>hour</datalist>') +
      UI.fld('Cost (' + UI.base().code + ')', UI.inp('cost', item.cost, 'type="number" step="0.01" min="0"')) + UI.fld('Sale price (' + UI.base().code + ')', UI.inp('price', item.price, 'type="number" step="0.01" min="0"')) +
      UI.fld('Minimum qty (reorder level)', UI.inp('minQty', item.minQty, 'type="number" step="1" min="0"')) +
      UI.fld('Margin', `<div class="readonly-v" id="margin">—</div>`) +
      (isNew ? `<div class="fld fld-full section-label">Opening stock (optional)</div>` + UI.fld('Opening quantity', UI.inp('openQty', '', 'type="number" step="1" min="0" placeholder="0"')) + UI.fld('Warehouse', UI.sel('openWh', UI.opts(d.warehouses, 'id', 'name', Eng.defWh()))) : '') +
      `<label class="check fld-full"><input type="checkbox" name="active" ${item.active !== false ? 'checked' : ''}> Active (available for sale and purchase)</label>`,
    onOpen: me => {
      const f = me.querySelector('form'), mg = () => { const c = +f.cost.value, p = +f.price.value; me.querySelector('#margin').textContent = p ? U.r((p - c) / p * 100, 1) + '%  (' + UI.num(p - c) + ' per unit)' : '—'; };
      f.cost.oninput = f.price.oninput = mg; mg();
      me.querySelector('#gen-bc').onclick = () => { f.barcode.value = '622' + String(Date.now()).slice(-9); };
      me.querySelector('#new-cat').onclick = () => V.categoryForm(null, c => { f.categoryId.insertAdjacentHTML('beforeend', `<option value="${c.id}">${UI.esc(c.name)}</option>`); f.categoryId.value = c.id; });
    },
    save: x => {
      if (!x.name) throw new Error('Item name is required.');
      if (!x.code) throw new Error('Item code is required.');
      if (d.items.some(i => i.code.toLowerCase() === x.code.toLowerCase() && i.id !== item.id)) throw new Error('Another item already uses code ' + x.code + '.');
      if (x.barcode && d.items.some(i => i.barcode === x.barcode && i.id !== item.id)) throw new Error('Another item already uses this barcode.');
      let saved;
      Eng.tx(() => {
        const o = isNew ? { id: U.uid('it'), created: U.now() } : Eng.item(item.id);
        Object.assign(o, { name: x.name, code: x.code, barcode: x.barcode, categoryId: x.categoryId, type: x.type, unit: x.unit || 'pcs', cost: +x.cost || 0, price: +x.price || 0, minQty: +x.minQty || 0, active: x.active });
        if (isNew) d.items.push(o);
        if (isNew && +x.openQty > 0 && o.type !== 'service') Eng.saveAdjustment({ kind: 'opening', date: U.today(), warehouseId: x.openWh, reason: 'Opening stock for new item', lines: [{ itemId: o.id, qty: +x.openQty, cost: o.cost }] });
        Eng.audit(isNew ? 'Created' : 'Updated', 'Item ' + o.code + ' ' + o.name);
        saved = o;
      });
      UI.toast(isNew ? 'Item created' : 'Item saved');
      done && done(saved);
      return true;
    },
  });
  return m;
};
V.deleteItem = async (id, after) => {
  const d = db(), it = Eng.item(id);
  const used = d.stockMoves.some(m => m.itemId === id) || d.invoices.some(i => i.lines.some(l => l.itemId === id)) || d.recipes.some(r => r.itemId === id || r.components.some(c => c.itemId === id));
  if (it.sys) return UI.toast('This is a system item and cannot be deleted.', 'warn');
  if (used) {
    if (await UI.confirm(`"${it.name}" has transactions, so it cannot be deleted. Deactivate it instead? It will be hidden from POS and new invoices.`, { ok: 'Deactivate' })) { it.active = false; Eng.audit('Deactivated', 'Item ' + it.name); Store.save(); UI.toast('Item deactivated'); after && after(); }
    return;
  }
  if (await UI.confirm(`Delete item "${it.name}"? This cannot be undone.`, { danger: true, ok: 'Delete' })) { d.items = d.items.filter(i => i.id !== id); Eng.audit('Deleted', 'Item ' + it.name); Store.save(); UI.toast('Item deleted'); after && after(); }
};

/* ---------------- Items list ---------------- */
V.items = (el, a, q) => {
  const d = db();
  const draw = () => {
    const sm = Eng.stockMap(), f = { cat: q.cat || '', type: q.type || '', st: q.st || '' };
    let rows = d.items.filter(i => (!f.cat || i.categoryId === f.cat) && (!f.type || i.type === f.type) && (f.st === 'inactive' ? i.active === false : f.st === 'all' ? true : i.active !== false));
    if (f.st === 'low') rows = d.items.filter(i => i.type !== 'service' && +i.minQty > 0 && sm.item(i.id) <= +i.minQty);
    el.innerHTML = UI.head({ title: 'Items', icon: 'box', crumbs: [['Items']], sub: `${d.items.length} items in ${d.categories.length} categories`,
      actions: UI.btn('Import CSV', { icon: 'upload', attrs: 'id="it-imp"' }) + UI.btn('Print list', { icon: 'printer', attrs: 'id="it-print"' }) + UI.btn('New item', { icon: 'plus', cls: 'btn-primary', attrs: 'id="it-new"' }) }) +
      `<div class="card"><div class="filters">
        ${UI.fld('Category', UI.sel('cat', UI.opts(d.categories, 'id', 'name', f.cat, 'All categories')))}
        ${UI.fld('Type', UI.sel('type', UI.opts(Object.entries(TYPES), 0, 1, f.type, 'All types')))}
        ${UI.fld('Show', UI.sel('st', UI.opts([['', 'Active items'], ['low', 'Low stock only'], ['inactive', 'Inactive items'], ['all', 'All items']], 0, 1, f.st)))}
      </div><div id="it-tbl"></div></div>`;
    el.querySelectorAll('.filters select').forEach(s => s.onchange = () => { q[s.name] = s.value; draw(); });
    const tbl = UI.mountTable(el.querySelector('#it-tbl'), {
      rows, csv: 'items', sort: 'code', placeholder: 'Search name, code or barcode…', onRow: r => App.go('item/' + r.id),
      rowCls: r => r.active === false ? 'dim' : '',
      columns: [
        { key: 'code', label: 'Code', render: r => `<b>${UI.esc(r.code)}</b>` },
        { key: 'name', label: 'Item', text: r => r.name + ' ' + (r.barcode || ''), render: r => { const c = Eng.get('categories', r.categoryId); return `<span class="cdot" style="background:${c ? c.color : '#94a3b8'}"></span>${UI.esc(r.name)}${r.barcode ? `<div class="muted sm">${UI.esc(r.barcode)}</div>` : ''}`; } },
        { key: 'cat', label: 'Category', text: r => catName(r.categoryId) },
        { key: 'type', label: 'Type', text: r => TYPES[r.type] },
        { key: 'unit', label: 'Unit' },
        { key: 'cost', label: 'Cost', align: 'r', sortVal: r => +r.cost, text: r => UI.num(r.cost) },
        { key: 'price', label: 'Price', align: 'r', sortVal: r => +r.price, text: r => UI.num(r.price) },
        { key: 'qty', label: 'On hand', align: 'r', sortVal: r => sm.item(r.id), text: r => r.type === 'service' ? '—' : UI.qty(sm.item(r.id)), render: r => r.type === 'service' ? '<span class="muted">—</span>' : `<span class="${+r.minQty > 0 && sm.item(r.id) <= +r.minQty ? 'neg b' : ''}">${UI.qty(sm.item(r.id))}</span>` },
        { key: 'value', label: 'Value', align: 'r', sortVal: r => sm.item(r.id) * r.cost, text: r => r.type === 'service' ? '' : UI.num(sm.item(r.id) * r.cost) },
        { key: 'act', label: '', sort: false, noExport: true, render: r => `<span class="row-acts"><button class="icon-btn sm" data-act="edit" title="Edit">${UI.icon('edit')}</button><button class="icon-btn sm" data-act="del" title="Delete">${UI.icon('trash')}</button></span>` },
      ],
      onAction: (act, r) => act === 'edit' ? V.itemForm(r, draw) : V.deleteItem(r.id, draw),
    });
    el.querySelector('#it-new').onclick = () => V.itemForm(null, it => App.go('item/' + it.id));
    el.querySelector('#it-print').onclick = () => UI.printTable('Items list', `${tbl.rows().length} items`, `<table class="doc-table"><thead><tr><th>Code</th><th>Item</th><th>Category</th><th>Unit</th><th class="r">Cost</th><th class="r">Price</th><th class="r">On hand</th></tr></thead><tbody>${tbl.rows().map(r => `<tr><td>${UI.esc(r.code)}</td><td>${UI.esc(r.name)}</td><td>${UI.esc(catName(r.categoryId))}</td><td>${UI.esc(r.unit)}</td><td class="r">${UI.num(r.cost)}</td><td class="r">${UI.num(r.price)}</td><td class="r">${r.type === 'service' ? '—' : UI.qty(sm.item(r.id))}</td></tr>`).join('')}</tbody></table>`);
    el.querySelector('#it-imp').onclick = V.importItems.bind(null, draw);
  };
  draw();
};
V.importItems = draw => {
  UI.modal({ title: 'Import items from CSV', icon: 'upload', size: 'lg',
    body: `<p>Columns (first row is the header): <code>code,name,category,unit,cost,price,minQty,barcode</code>. Existing codes are updated; new categories are created.</p>
      <div class="row gap"><input type="file" accept=".csv,text/csv" id="imp-file"><button class="btn btn-light btn-sm" id="imp-tpl">${UI.icon('download')}<span>Download template</span></button></div>
      <textarea id="imp-txt" rows="9" class="mt mono" placeholder="code,name,category,unit,cost,price,minQty,barcode&#10;BEV-100,Lemonade 1L,Beverages,pcs,0.9,1.75,12,"></textarea><div id="imp-prev" class="muted sm mt"></div>`,
    onOpen: me => {
      me.querySelector('#imp-file').onchange = e => { const f = e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { me.querySelector('#imp-txt').value = r.result; prev(); }; r.readAsText(f); };
      me.querySelector('#imp-tpl').onclick = () => UI.csv('devma-items-template', [['code', 'name', 'category', 'unit', 'cost', 'price', 'minQty', 'barcode'], ['BEV-100', 'Lemonade 1L', 'Beverages', 'pcs', '0.9', '1.75', '12', '']]);
      const prev = () => { const rows = V.parseCsv(me.querySelector('#imp-txt').value); me.querySelector('#imp-prev').textContent = rows.length > 1 ? (rows.length - 1) + ' row(s) ready to import.' : ''; };
      me.querySelector('#imp-txt').oninput = prev;
    },
    buttons: [{ label: 'Cancel', onClick: m => m.close() }, { label: 'Import', cls: 'btn-primary', icon: 'upload', onClick: m => {
      const rows = V.parseCsv(m.el.querySelector('#imp-txt').value); if (rows.length < 2) return UI.toast('Nothing to import.', 'warn');
      const h = rows[0].map(x => x.trim().toLowerCase()), col = k => h.indexOf(k.toLowerCase());
      if (col('code') < 0 || col('name') < 0) return UI.toast('The header must include code and name.', 'error');
      let added = 0, updated = 0; const d = db();
      Eng.tx(() => rows.slice(1).forEach(r => {
        const g = k => (col(k) >= 0 ? (r[col(k)] || '').trim() : ''); if (!g('code') || !g('name')) return;
        let cat = d.categories.find(c => c.name.toLowerCase() === g('category').toLowerCase());
        if (!cat && g('category')) { cat = { id: U.uid('cat'), name: g('category'), color: '#0f766e', parentId: null }; d.categories.push(cat); }
        let it = d.items.find(i => i.code.toLowerCase() === g('code').toLowerCase());
        const v = { name: g('name'), categoryId: cat ? cat.id : '', unit: g('unit') || 'pcs', cost: +g('cost') || 0, price: +g('price') || 0, minQty: +g('minQty') || +g('minqty') || 0, barcode: g('barcode') };
        if (it) { Object.assign(it, v); updated++; } else { d.items.push(Object.assign({ id: U.uid('it'), code: g('code'), type: 'stock', active: true, created: U.now() }, v)); added++; }
      }));
      Eng.audit('Imported', `${added} new, ${updated} updated items`); Store.save();
      UI.toast(`Imported: ${added} new, ${updated} updated`); m.close(); draw();
    } }] });
};
V.parseCsv = text => {
  const rows = []; let row = [], cur = '', q = false;
  text = String(text || '').replace(/^﻿/, '');
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) { if (c === '"') { if (text[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true; else if (c === ',') { row.push(cur); cur = ''; } else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; row.push(cur); if (row.some(x => x.trim())) rows.push(row); row = []; cur = ''; } else cur += c;
  }
  row.push(cur); if (row.some(x => x.trim())) rows.push(row);
  return rows;
};

/* ---------------- Item card ---------------- */
V.item = (el, [id]) => {
  const d = db(), it = Eng.item(id);
  if (!it) { el.innerHTML = UI.head({ title: 'Item not found', icon: 'box', crumbs: [['Items', 'items']] }) + UI.empty('This item no longer exists.', 'box', '<a class="btn btn-primary" href="#/items">Back to items</a>'); return; }
  const sm = Eng.stockMap(), onHand = sm.item(id), since = U.addDays(U.today(), -30);
  const saleLines = []; d.invoices.forEach(inv => inv.lines.forEach(l => { if (l.itemId === id) saleLines.push({ inv, l }); }));
  const sold30 = U.sum(saleLines.filter(x => x.inv.type === 'sale' && x.inv.date >= since), x => x.l.qty);
  const moves = d.stockMoves.filter(m => m.itemId === id).sort((a, b) => a.date.localeCompare(b.date) || (a.created || '').localeCompare(b.created || ''));
  let run = 0; moves.forEach(m => { run += m.qty; m._bal = U.r(run, 4); });
  const svc = it.type === 'service', cat = Eng.get('categories', it.categoryId);
  el.innerHTML = UI.head({ title: it.name, icon: 'box', crumbs: [['Items', 'items'], [it.code]],
    sub: `${UI.badge(TYPES[it.type], 'blue')} ${cat ? `<a href="#/items?cat=${cat.id}">${UI.badge(cat.name, 'gray')}</a>` : ''} ${it.active === false ? UI.badge('Inactive', 'red') : ''} <span class="muted">Barcode: ${UI.esc(it.barcode || '—')}</span>`,
    actions: UI.btn('Back', { icon: 'arrowL', attrs: 'onclick="history.back()"' }) + (svc ? '' : UI.btn('Adjust stock', { icon: 'refresh', attrs: 'id="i-adj"' })) + UI.btn('Label', { icon: 'tag', attrs: 'id="i-lbl"' }) + UI.btn('Duplicate', { icon: 'copy', attrs: 'id="i-dup"' }) + UI.btn('Delete', { icon: 'trash', cls: 'btn-light danger', attrs: 'id="i-del"' }) + UI.btn('Edit', { icon: 'edit', cls: 'btn-primary', attrs: 'id="i-edit"' }) }) +
    `<div class="kpis">
      ${UI.kpi('On hand', svc ? '—' : UI.qty(onHand) + ' ' + UI.esc(it.unit), { icon: 'clipboard', tone: !svc && +it.minQty > 0 && onHand <= +it.minQty ? 'warn' : '', sub: svc ? 'service item' : 'min ' + UI.qty(it.minQty) })}
      ${UI.kpi('Average cost', UI.money(it.cost), { icon: 'coins', tone: 't2' })}
      ${UI.kpi('Sale price', UI.money(it.price), { icon: 'tag', tone: 't3', sub: it.price ? 'margin ' + U.r((it.price - it.cost) / it.price * 100, 1) + '%' : '' })}
      ${UI.kpi('Stock value', svc ? '—' : UI.money(onHand * it.cost), { icon: 'warehouse', tone: 't4' })}
      ${UI.kpi('Sold (30 days)', UI.qty(sold30) + ' ' + UI.esc(it.unit), { icon: 'chart', tone: 't5' })}
    </div>
    <div class="card"><div class="tabs">${svc ? '' : '<button class="tab active" data-tab="wh">Stock by warehouse</button><button class="tab" data-tab="card">Stock card</button>'}<button class="tab ${svc ? 'active' : ''}" data-tab="sales">Sales</button><button class="tab" data-tab="purch">Purchases</button></div>
      ${svc ? '' : `<div data-pane="wh"><table class="tbl clickable"><thead><tr><th>Warehouse</th><th>Location</th><th class="r">Quantity</th><th class="r">Value</th></tr></thead><tbody>${d.warehouses.map(w => `<tr data-wh="${w.id}"><td><b>${UI.esc(w.name)}</b></td><td>${UI.esc(w.location || '')}</td><td class="r">${UI.qty(sm.at(id, w.id))}</td><td class="r">${UI.num(sm.at(id, w.id) * it.cost)}</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="2">Total</td><td class="r">${UI.qty(onHand)}</td><td class="r">${UI.num(onHand * it.cost)}</td></tr></tfoot></table></div>
      <div data-pane="card" hidden id="i-card"></div>`}
      <div data-pane="sales" ${svc ? '' : 'hidden'} id="i-sales"></div><div data-pane="purch" hidden id="i-purch"></div></div>`;
  localTabs(el);
  el.querySelectorAll('tr[data-wh]').forEach(tr => tr.onclick = () => App.go('inventory?wh=' + tr.dataset.wh));
  const MT = { purchase: 'Purchase', sale: 'Sale', sale_return: 'Sales return', purchase_return: 'Purchase return', transfer: 'Transfer', increase: 'Increase', decrease: 'Decrease', waste: 'Waste', opening: 'Opening', count: 'Stock count', production_in: 'Used in production', production_out: 'Produced', disassembly_in: 'Disassembled', disassembly_out: 'From disassembly' };
  if (!svc) UI.mountTable(el.querySelector('#i-card'), { rows: moves.slice().reverse(), csv: 'stock-card-' + it.code, pageSize: 15, onRow: r => App.openRef(r.refType, r.refId),
    columns: [{ key: 'date', label: 'Date', text: r => UI.date(r.date), sortVal: r => r.date }, { key: 'ref', label: 'Document', render: r => `<a class="link">${UI.esc(r.ref || '')}</a>` }, { key: 'type', label: 'Movement', text: r => MT[r.type] || r.type },
      { key: 'wh', label: 'Warehouse', text: r => whName(r.warehouseId) }, { key: 'in', label: 'In', align: 'r', text: r => r.qty > 0 ? UI.qty(r.qty) : '' }, { key: 'out', label: 'Out', align: 'r', text: r => r.qty < 0 ? UI.qty(-r.qty) : '' },
      { key: 'cost', label: 'Unit cost', align: 'r', text: r => UI.num(r.cost) }, { key: '_bal', label: 'Balance', align: 'r', text: r => UI.qty(r._bal) }] });
  const histTable = (sel, types) => UI.mountTable(el.querySelector(sel), { rows: saleLines.filter(x => types.includes(x.inv.type)).sort((a, b) => b.inv.date.localeCompare(a.inv.date)), csv: 'item-history', onRow: r => App.go('invoice/' + r.inv.id), empty: 'No transactions yet.',
    columns: [{ key: 'date', label: 'Date', text: r => UI.date(r.inv.date), sortVal: r => r.inv.date }, { key: 'no', label: 'Invoice', text: r => r.inv.no, render: r => `<a class="link">${r.inv.no}</a>` }, { key: 't', label: 'Type', text: r => Eng.INV[r.inv.type].label },
      { key: 'party', label: 'Party', text: r => (Eng.account(r.inv.accountId) || {}).name || '' }, { key: 'qty', label: 'Qty', align: 'r', text: r => UI.qty(r.l.qty) }, { key: 'price', label: 'Price', align: 'r', text: r => UI.money(r.l.price, r.inv.currency) }] });
  histTable('#i-sales', ['sale', 'sale_return']); histTable('#i-purch', ['purchase', 'purchase_return']);
  const $ = s => el.querySelector(s);
  $('#i-edit').onclick = () => V.itemForm(it, () => App.refresh());
  $('#i-del').onclick = () => V.deleteItem(id, () => App.go('items'));
  $('#i-dup').onclick = () => { const c = U.clone(it); delete c.id; delete c.sys; c.name += ' (copy)'; c.barcode = ''; c.code += '-C'; V.itemForm(null, x => App.go('item/' + x.id)); setTimeout(() => { const f = document.querySelector('.modal form'); if (f) ['name', 'code', 'unit', 'cost', 'price', 'minQty'].forEach(k => f[k].value = c[k]); f.categoryId.value = c.categoryId || ''; f.type.value = c.type; }, 0); };
  if ($('#i-adj')) $('#i-adj').onclick = () => V.adjustmentForm({ kind: 'increase', lines: [{ itemId: id, qty: '' }] }, () => App.refresh());
  $('#i-lbl').onclick = () => UI.formModal({ title: 'Print shelf labels', icon: 'tag', size: 'sm', saveLabel: 'Print', fields: UI.fld('Number of labels', UI.inp('n', 6, 'type="number" min="1" max="200"'), 'fld-full') + UI.fld('Show price in', UI.sel('cur', UI.opts(d.currencies, 'code', c => c.code + ' — ' + c.name, UI.base().code)), 'fld-full'),
    save: x => { const c = UI.cur(x.cur), n = Math.min(200, Math.max(1, +x.n || 1)); UI.print(`<div class="labels">${Array(n).fill(`<div class="label"><div class="lb-co">${UI.esc(d.settings.company)}</div><div class="lb-name">${UI.esc(it.name)}</div><div class="lb-price">${UI.money(it.price * c.rate, c.code)}</div><div class="lb-code">${UI.esc(it.barcode || it.code)}</div></div>`).join('')}</div>`); return true; } });
};

/* ---------------- Categories ---------------- */
V.categoryForm = (cat, done) => {
  const d = db(), isNew = !cat; cat = cat || { name: '', color: '#0f766e', parentId: '' };
  UI.formModal({ title: isNew ? 'New category' : 'Edit category', icon: 'layers', size: 'sm',
    fields: UI.fld('Name *', UI.inp('name', cat.name, 'required'), 'fld-full') + UI.fld('Parent category', UI.sel('parentId', UI.opts(d.categories.filter(c => c.id !== cat.id), 'id', 'name', cat.parentId, '— None —')), 'fld-full') + UI.fld('Colour', UI.inp('color', cat.color, 'type="color"'), 'fld-full'),
    save: x => {
      if (!x.name) throw new Error('Name is required.');
      if (d.categories.some(c => c.name.toLowerCase() === x.name.toLowerCase() && c.id !== cat.id)) throw new Error('A category with this name exists.');
      const o = isNew ? { id: U.uid('cat') } : Eng.get('categories', cat.id);
      Object.assign(o, { name: x.name, color: x.color, parentId: x.parentId || null }); if (isNew) d.categories.push(o);
      Eng.audit(isNew ? 'Created' : 'Updated', 'Category ' + o.name); Store.save(); UI.toast('Category saved'); done && done(o); return true;
    } });
};
V.categories = el => {
  const d = db(), draw = () => {
    const sm = Eng.stockMap();
    el.innerHTML = UI.head({ title: 'Categories', icon: 'layers', crumbs: [['Items', 'items'], ['Categories']], actions: UI.btn('New category', { icon: 'plus', cls: 'btn-primary', attrs: 'id="c-new"' }) }) +
      `<div class="cat-cards">${d.categories.map(c => { const its = d.items.filter(i => i.categoryId === c.id); return `<a class="cat-card" href="#/items?cat=${c.id}" style="--c:${c.color}"><span class="cat-sw"></span><b>${UI.esc(c.name)}</b><span class="muted sm">${its.length} item(s) · ${UI.money(U.sum(its, i => sm.item(i.id) * i.cost))}</span></a>`; }).join('')}</div>
      <div class="card mt"><div id="c-tbl"></div></div>`;
    UI.mountTable(el.querySelector('#c-tbl'), { rows: d.categories, csv: 'categories', onRow: r => App.go('items?cat=' + r.id),
      columns: [{ key: 'name', label: 'Category', render: r => `<span class="cdot" style="background:${r.color}"></span><b>${UI.esc(r.name)}</b>` }, { key: 'parent', label: 'Parent', text: r => r.parentId ? catName(r.parentId) : '—' },
        { key: 'n', label: 'Items', align: 'r', sortVal: r => d.items.filter(i => i.categoryId === r.id).length, text: r => d.items.filter(i => i.categoryId === r.id).length },
        { key: 'v', label: 'Stock value', align: 'r', text: r => UI.num(U.sum(d.items.filter(i => i.categoryId === r.id), i => sm.item(i.id) * i.cost)) },
        { key: 'a', label: '', sort: false, noExport: true, render: () => `<span class="row-acts"><button class="icon-btn sm" data-act="edit" title="Edit">${UI.icon('edit')}</button><button class="icon-btn sm" data-act="del" title="Delete">${UI.icon('trash')}</button></span>` }],
      onAction: async (act, r) => {
        if (act === 'edit') return V.categoryForm(r, draw);
        if (d.items.some(i => i.categoryId === r.id)) return UI.toast('Move or delete the items in this category first.', 'warn');
        if (d.categories.some(c => c.parentId === r.id)) return UI.toast('This category has sub-categories.', 'warn');
        if (await UI.confirm(`Delete category "${r.name}"?`, { danger: true, ok: 'Delete' })) { d.categories = d.categories.filter(c => c.id !== r.id); Eng.audit('Deleted', 'Category ' + r.name); Store.save(); UI.toast('Category deleted'); draw(); }
      } });
    el.querySelector('#c-new').onclick = () => V.categoryForm(null, draw);
  };
  draw();
};

/* ---------------- Warehouses ---------------- */
V.warehouses = el => {
  const d = db(), draw = () => {
    const sm = Eng.stockMap(), stockItems = d.items.filter(i => i.type !== 'service');
    const info = w => { const its = stockItems.filter(i => sm.at(i.id, w.id) > 0); return { n: its.length, v: U.sum(stockItems, i => sm.at(i.id, w.id) * i.cost) }; };
    el.innerHTML = UI.head({ title: 'Warehouses', icon: 'warehouse', crumbs: [['Items', 'items'], ['Warehouses']], actions: UI.btn('Transfer stock', { icon: 'truck', attrs: 'id="w-trf"' }) + UI.btn('New warehouse', { icon: 'plus', cls: 'btn-primary', attrs: 'id="w-new"' }) }) +
      `<div class="wh-cards">${d.warehouses.map(w => { const x = info(w); return `<div class="wh-card"><div class="wh-top"><span class="wh-ic">${UI.icon('warehouse')}</span><div><b>${UI.esc(w.name)}</b>${w.id === Eng.defWh() ? ' ' + UI.badge('Default', 'green') : ''}<div class="muted sm">${UI.esc(w.location || '')}${w.keeper ? ' · Keeper: ' + UI.esc(w.keeper) : ''}</div></div></div>
        <div class="wh-stats"><div><b>${x.n}</b><span>items in stock</span></div><div><b>${UI.money(x.v)}</b><span>stock value</span></div></div>
        <div class="wh-acts"><a class="btn btn-light btn-sm" href="#/inventory?wh=${w.id}">${UI.icon('clipboard')}<span>View stock</span></a><button class="btn btn-light btn-sm" data-edit="${w.id}">${UI.icon('edit')}<span>Edit</span></button>${w.id === Eng.defWh() ? '' : `<button class="btn btn-light btn-sm" data-def="${w.id}">${UI.icon('check')}<span>Make default</span></button>`}<button class="btn btn-light btn-sm danger" data-del="${w.id}">${UI.icon('trash')}</button></div></div>`; }).join('')}</div>`;
    const form = w => {
      const isNew = !w; w = w || { name: '', location: '', keeper: '' };
      UI.formModal({ title: isNew ? 'New warehouse' : 'Edit warehouse', icon: 'warehouse', size: 'sm', fields: UI.fld('Name *', UI.inp('name', w.name), 'fld-full') + UI.fld('Location', UI.inp('location', w.location), 'fld-full') + UI.fld('Store keeper', UI.inp('keeper', w.keeper), 'fld-full'),
        save: x => { if (!x.name) throw new Error('Name is required.'); const o = isNew ? { id: U.uid('wh') } : Eng.get('warehouses', w.id); Object.assign(o, x); if (isNew) d.warehouses.push(o); Eng.audit(isNew ? 'Created' : 'Updated', 'Warehouse ' + o.name); Store.save(); UI.toast('Warehouse saved'); draw(); return true; } });
    };
    el.querySelector('#w-new').onclick = () => form();
    el.querySelector('#w-trf').onclick = () => V.transferForm();
    el.querySelectorAll('[data-edit]').forEach(b => b.onclick = () => form(Eng.get('warehouses', b.dataset.edit)));
    el.querySelectorAll('[data-def]').forEach(b => b.onclick = () => { d.settings.defaultWarehouseId = b.dataset.def; Store.save(); UI.toast('Default warehouse changed'); draw(); });
    el.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      const w = Eng.get('warehouses', b.dataset.del);
      if (d.stockMoves.some(m => m.warehouseId === w.id)) return UI.toast('This warehouse has stock movements and cannot be deleted.', 'warn');
      if (d.warehouses.length === 1) return UI.toast('You need at least one warehouse.', 'warn');
      if (await UI.confirm(`Delete warehouse "${w.name}"?`, { danger: true, ok: 'Delete' })) { d.warehouses = d.warehouses.filter(x => x.id !== w.id); Store.save(); UI.toast('Warehouse deleted'); draw(); }
    });
  };
  draw();
};

/* ---------------- Currencies ---------------- */
V.currencies = el => {
  const d = db(), base = UI.base();
  const draw = () => {
    el.innerHTML = UI.head({ title: 'Currencies', icon: 'coins', crumbs: [['Currencies']], sub: `Base currency: <b>${base.code}</b> — all ledgers are kept in ${UI.esc(base.name)}.`,
      actions: UI.btn('Money converter', { icon: 'exchange', attrs: 'onclick="App.go(\'converter\')"' }) + UI.btn('New currency', { icon: 'plus', cls: 'btn-primary', attrs: 'id="cu-new"' }) }) +
      `<div class="card"><div id="cu-tbl"></div></div><div class="card mt"><div class="card-head"><h3>${UI.icon('history')}Rate history</h3></div><div id="cu-hist"></div></div>`;
    UI.mountTable(el.querySelector('#cu-tbl'), { rows: d.currencies, search: false, onRow: r => r.base ? UI.toast('The base currency rate is always 1.', 'info') : rateForm(r),
      columns: [{ key: 'code', label: 'Code', render: r => `<b>${r.code}</b> ${r.base ? UI.badge('Base', 'green') : ''}` }, { key: 'name', label: 'Name' }, { key: 'symbol', label: 'Symbol' },
        { key: 'rate', label: `Rate (per 1 ${base.code})`, align: 'r', render: r => UI.num(r.rate, r.decimals > 2 ? r.decimals : Math.max(2, r.decimals)) }, { key: 'inv', label: `1 unit in ${base.code}`, align: 'r', text: r => UI.num(1 / r.rate, 6) },
        { key: 'a', label: '', sort: false, render: r => r.base ? '' : `<span class="row-acts"><button class="btn btn-light btn-sm" data-act="rate">${UI.icon('refresh')}<span>Update rate</span></button><button class="icon-btn sm" data-act="edit" title="Edit">${UI.icon('edit')}</button><button class="icon-btn sm" data-act="del" title="Delete">${UI.icon('trash')}</button></span>` }],
      onAction: async (act, r) => {
        if (act === 'rate') return rateForm(r);
        if (act === 'edit') return form(r);
        if (d.invoices.some(i => i.currency === r.code) || d.vouchers.some(v => v.currency === r.code)) return UI.toast('This currency is used by documents and cannot be deleted.', 'warn');
        if (await UI.confirm(`Delete currency ${r.code}?`, { danger: true, ok: 'Delete' })) { d.currencies = d.currencies.filter(c => c.id !== r.id); Store.save(); UI.toast('Currency deleted'); draw(); }
      } });
    UI.mountTable(el.querySelector('#cu-hist'), { rows: d.rateHistory.slice().reverse(), search: false, pageSize: 8, empty: 'No rate changes yet.',
      columns: [{ key: 'date', label: 'Date', text: r => UI.datetime(r.date) }, { key: 'code', label: 'Currency' }, { key: 'old', label: 'Old rate', align: 'r', text: r => UI.num(r.old, 4) }, { key: 'rate', label: 'New rate', align: 'r', text: r => UI.num(r.rate, 4) }, { key: 'chg', label: 'Change', align: 'r', render: r => UI.signed(U.r((r.rate - r.old) / r.old * 100, 2)) + '%' }, { key: 'user', label: 'By' }] });
    el.querySelector('#cu-new').onclick = () => form();
  };
  const rateForm = c => UI.formModal({ title: 'Update rate — ' + c.code, icon: 'refresh', size: 'sm', fields: UI.fld(`How many ${c.code} equal 1 ${base.code}?`, UI.inp('rate', c.rate, 'type="number" step="any" min="0"'), 'fld-full') + `<p class="muted sm fld-full">Current: 1 ${base.code} = ${UI.num(c.rate, 4)} ${c.code}. Existing documents keep the rate they were saved with.</p>`,
    save: x => { if (!(+x.rate > 0)) throw new Error('Rate must be greater than zero.'); d.rateHistory.push({ date: U.now(), code: c.code, old: c.rate, rate: +x.rate, user: Eng.user() }); Eng.get('currencies', c.id).rate = +x.rate; Eng.audit('Rate update', `${c.code}: ${c.rate} → ${x.rate}`); Store.save(); UI.toast('Rate updated'); draw(); return true; } });
  const form = c => {
    const isNew = !c; c = c || { code: '', name: '', symbol: '', rate: 1, decimals: 2 };
    UI.formModal({ title: isNew ? 'New currency' : 'Edit currency', icon: 'coins', fields: UI.fld('Code (e.g. GBP) *', UI.inp('code', c.code, 'maxlength="4" style="text-transform:uppercase"' + (isNew ? '' : ' readonly'))) + UI.fld('Name *', UI.inp('name', c.name)) + UI.fld('Symbol', UI.inp('symbol', c.symbol)) + UI.fld('Decimals', UI.inp('decimals', c.decimals, 'type="number" min="0" max="4"')) + UI.fld(`Rate (per 1 ${base.code}) *`, UI.inp('rate', c.rate, 'type="number" step="any" min="0"')),
      save: x => {
        x.code = x.code.toUpperCase(); if (!x.code || !x.name) throw new Error('Code and name are required.'); if (!(+x.rate > 0)) throw new Error('Rate must be greater than zero.');
        if (isNew && d.currencies.some(y => y.code === x.code)) throw new Error('Currency already exists.');
        const o = isNew ? { id: U.uid('cur') } : Eng.get('currencies', c.id);
        if (!isNew && +x.rate !== +o.rate) d.rateHistory.push({ date: U.now(), code: o.code, old: o.rate, rate: +x.rate, user: Eng.user() });
        Object.assign(o, { code: x.code, name: x.name, symbol: x.symbol || x.code, decimals: +x.decimals || 0, rate: +x.rate }); if (isNew) d.currencies.push(o);
        Store.save(); UI.toast('Currency saved'); draw(); return true;
      } });
  };
  draw();
};

/* ---------------- Money converter ---------------- */
V.converter = el => {
  const d = db(), st = V._conv || (V._conv = { amount: 100, from: UI.base().code, to: (d.currencies.find(c => !c.base) || UI.base()).code });
  el.innerHTML = UI.head({ title: 'Money Converter', icon: 'exchange', crumbs: [['Currencies', 'currencies'], ['Money Converter']], actions: App.can('currencies') ? UI.btn('Manage rates', { icon: 'coins', attrs: 'onclick="App.go(\'currencies\')"' }) : '' }) + `
  <div class="grid g2">
    <div class="card"><div class="card-body conv">
      <div class="fld"><label>Amount</label><input id="cv-amt" type="number" step="any" value="${st.amount}" class="big-input"></div>
      <div class="conv-row"><div class="fld"><label>From</label><select id="cv-from">${UI.opts(d.currencies, 'code', c => c.code + ' — ' + c.name, st.from)}</select></div>
        <button class="icon-btn swap" id="cv-swap" title="Swap">${UI.icon('exchange')}</button>
        <div class="fld"><label>To</label><select id="cv-to">${UI.opts(d.currencies, 'code', c => c.code + ' — ' + c.name, st.to)}</select></div></div>
      <div class="conv-result"><div class="muted" id="cv-line"></div><div class="conv-big" id="cv-res"></div><div class="muted sm" id="cv-rate"></div></div>
      <div class="row gap"><button class="btn btn-light" id="cv-copy">${UI.icon('copy')}<span>Copy result</span></button><button class="btn btn-primary" id="cv-save">${UI.icon('check')}<span>Save to history</span></button></div>
      <div class="quick-amts">${[1, 10, 50, 100, 500, 1000].map(n => `<button class="chip" data-a="${n}">${n}</button>`).join('')}</div>
    </div></div>
    <div class="stack"><div class="card"><div class="card-head"><h3>${UI.icon('coins')}In every currency</h3></div><div class="card-body p0"><table class="tbl" id="cv-all"></table></div></div>
      <div class="card"><div class="card-head"><h3>${UI.icon('history')}History</h3><a href="#" class="link" id="cv-clear">Clear</a></div><div class="card-body p0" id="cv-hist"></div></div></div>
  </div>`;
  const $ = s => el.querySelector(s);
  const conv = (amt, f, t) => amt / UI.cur(f).rate * UI.cur(t).rate;
  const calc = () => {
    st.amount = +$('#cv-amt').value || 0; st.from = $('#cv-from').value; st.to = $('#cv-to').value;
    const r = conv(st.amount, st.from, st.to);
    $('#cv-line').textContent = UI.money(st.amount, st.from) + ' ='; $('#cv-res').textContent = UI.money(r, st.to);
    $('#cv-rate').textContent = `1 ${st.from} = ${UI.num(conv(1, st.from, st.to), 6)} ${st.to} · 1 ${st.to} = ${UI.num(conv(1, st.to, st.from), 6)} ${st.from}`;
    $('#cv-all').innerHTML = `<tbody>${d.currencies.map(c => `<tr class="${c.code === st.to ? 'hl' : ''}" data-c="${c.code}"><td><b>${c.code}</b> <span class="muted">${UI.esc(c.name)}</span></td><td class="r">${UI.money(conv(st.amount, st.from, c.code), c.code)}</td></tr>`).join('')}</tbody>`;
    $('#cv-all').classList.add('clickable');
    $('#cv-all').querySelectorAll('tr').forEach(tr => tr.onclick = () => { $('#cv-to').value = tr.dataset.c; calc(); });
    return r;
  };
  const hist = () => { $('#cv-hist').innerHTML = d.conversions.length ? `<table class="tbl clickable"><tbody>${d.conversions.slice(0, 10).map((h, i) => `<tr data-i="${i}"><td class="muted sm">${UI.datetime(h.date)}</td><td>${UI.money(h.amount, h.from)}</td><td>→</td><td class="r"><b>${UI.money(h.result, h.to)}</b></td></tr>`).join('')}</tbody></table>` : UI.empty('Saved conversions appear here.', 'history');
    $('#cv-hist').querySelectorAll('tr').forEach(tr => tr.onclick = () => { const h = d.conversions[+tr.dataset.i]; $('#cv-amt').value = h.amount; $('#cv-from').value = h.from; $('#cv-to').value = h.to; calc(); }); };
  $('#cv-amt').oninput = $('#cv-from').onchange = $('#cv-to').onchange = calc;
  $('#cv-swap').onclick = () => { const f = $('#cv-from').value; $('#cv-from').value = $('#cv-to').value; $('#cv-to').value = f; calc(); };
  $('#cv-copy').onclick = () => { const t = UI.num(calc(), UI.cur(st.to).decimals); (navigator.clipboard ? navigator.clipboard.writeText(t) : Promise.reject()).then(() => UI.toast('Copied ' + t), () => UI.toast(t, 'info')); };
  $('#cv-save').onclick = () => { d.conversions.unshift({ date: U.now(), amount: st.amount, from: st.from, to: st.to, result: U.r(calc(), 4) }); if (d.conversions.length > 30) d.conversions.length = 30; Store.save(); hist(); UI.toast('Saved to history'); };
  $('#cv-clear').onclick = e => { e.preventDefault(); d.conversions = []; Store.save(); hist(); };
  el.querySelectorAll('[data-a]').forEach(b => b.onclick = () => { $('#cv-amt').value = b.dataset.a; calc(); });
  calc(); hist();
};

/* ---------------- Stock inventory ---------------- */
V.inventory = (el, a, q) => {
  const d = db();
  const draw = () => {
    const sm = Eng.stockMap(), wh = q.wh || '', cat = q.cat || '', zero = q.zero === '1';
    const qtyOf = i => wh ? sm.at(i.id, wh) : sm.item(i.id);
    const rows = d.items.filter(i => i.type !== 'service' && (!cat || i.categoryId === cat) && (zero || qtyOf(i) !== 0));
    const totV = U.sum(rows, i => qtyOf(i) * i.cost), low = rows.filter(i => +i.minQty > 0 && sm.item(i.id) <= +i.minQty).length;
    el.innerHTML = UI.head({ title: 'Stock Inventory', icon: 'clipboard', crumbs: [['Stock', 'inventory'], ['Inventory']], sub: wh ? 'Warehouse: <b>' + UI.esc(whName(wh)) + '</b>' : 'All warehouses',
      actions: UI.btn('Print', { icon: 'printer', attrs: 'id="in-print"' }) + (App.can('stockmgmt') ? UI.btn('Transfer', { icon: 'truck', attrs: 'id="in-trf"' }) : '') + (App.can('waste') ? UI.btn('Stock count', { icon: 'clipboard', cls: 'btn-primary', attrs: 'id="in-count"' }) : '') }) +
      `<div class="kpis">${UI.kpi('Items listed', rows.length, { icon: 'box' })}${UI.kpi('Total quantity', UI.qty(U.sum(rows, qtyOf)), { icon: 'clipboard', tone: 't2' })}${UI.kpi('Stock value (cost)', UI.money(totV), { icon: 'coins', tone: 't3' })}${UI.kpi('Retail value', UI.money(U.sum(rows, i => qtyOf(i) * i.price)), { icon: 'tag', tone: 't4' })}${UI.kpi('Low stock', low, { icon: 'alert', tone: low ? 'warn' : 't6', link: App.can('reports') ? 'report/lowstock' : '' })}</div>
      <div class="card"><div class="filters">${UI.fld('Warehouse', UI.sel('wh', UI.opts(d.warehouses, 'id', 'name', wh, 'All warehouses')))}${UI.fld('Category', UI.sel('cat', UI.opts(d.categories, 'id', 'name', cat, 'All categories')))}
        <label class="check"><input type="checkbox" name="zero" ${zero ? 'checked' : ''}> Show zero-stock items</label></div><div id="in-tbl"></div></div>`;
    el.querySelectorAll('.filters select').forEach(s => s.onchange = () => { q[s.name] = s.value; draw(); });
    el.querySelector('[name=zero]').onchange = e => { q.zero = e.target.checked ? '1' : ''; draw(); };
    const whCols = wh ? [] : d.warehouses.map(w => ({ key: 'w_' + w.id, label: w.name, align: 'r', sortVal: r => sm.at(r.id, w.id), text: r => UI.qty(sm.at(r.id, w.id)) }));
    const tbl = UI.mountTable(el.querySelector('#in-tbl'), { rows, csv: 'stock-inventory', sort: 'code', onRow: r => App.go('item/' + r.id),
      rowCls: r => +r.minQty > 0 && sm.item(r.id) <= +r.minQty ? 'warn-row' : '',
      columns: [{ key: 'code', label: 'Code', render: r => `<b>${UI.esc(r.code)}</b>` }, { key: 'name', label: 'Item' }, { key: 'cat', label: 'Category', text: r => catName(r.categoryId) }, ...whCols,
        { key: 'qty', label: wh ? 'Quantity' : 'Total', align: 'r', sortVal: qtyOf, text: r => UI.qty(qtyOf(r)), render: r => `<b>${UI.qty(qtyOf(r))}</b> <span class="muted sm">${UI.esc(r.unit)}</span>` },
        { key: 'min', label: 'Min', align: 'r', text: r => UI.qty(r.minQty) }, { key: 'cost', label: 'Avg cost', align: 'r', text: r => UI.num(r.cost) }, { key: 'val', label: 'Value', align: 'r', sortVal: r => qtyOf(r) * r.cost, text: r => UI.num(qtyOf(r) * r.cost) },
        { key: 'st', label: 'Status', render: r => { const x = sm.item(r.id); return x <= 0 ? UI.badge('Out of stock', 'red') : +r.minQty > 0 && x <= +r.minQty ? UI.badge('Low', 'amber') : UI.badge('OK', 'green'); }, text: r => sm.item(r.id) <= 0 ? 'Out' : 'OK' }],
      footer: rs => `<td colspan="${3 + whCols.length}">Total</td><td class="r">${UI.qty(U.sum(rs, qtyOf))}</td><td></td><td></td><td class="r">${UI.num(U.sum(rs, i => qtyOf(i) * i.cost))}</td><td></td>` });
    el.querySelector('#in-print').onclick = () => UI.printTable('Stock inventory', (wh ? whName(wh) : 'All warehouses') + ' — ' + UI.date(U.today()), `<table class="doc-table"><thead><tr><th>Code</th><th>Item</th><th class="r">Qty</th><th class="r">Cost</th><th class="r">Value</th></tr></thead><tbody>${tbl.rows().map(r => `<tr><td>${UI.esc(r.code)}</td><td>${UI.esc(r.name)}</td><td class="r">${UI.qty(qtyOf(r))}</td><td class="r">${UI.num(r.cost)}</td><td class="r">${UI.num(qtyOf(r) * r.cost)}</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="4">Total</td><td class="r">${UI.num(totV)}</td></tr></tfoot></table>`);
    const trf = el.querySelector('#in-trf'); if (trf) trf.onclick = () => V.transferForm({ fromWh: wh });
    const cnt = el.querySelector('#in-count'); if (cnt) cnt.onclick = () => V.stockCount(wh || Eng.defWh(), cat, draw);
  };
  draw();
};
V.stockCount = (wh, cat, done) => {
  const d = db(), sm = Eng.stockMap(), items = d.items.filter(i => i.type !== 'service' && i.active !== false && (!cat || i.categoryId === cat));
  UI.modal({ title: 'Physical stock count', icon: 'clipboard', size: 'xl',
    body: `<div class="row gap mb">${UI.fld('Warehouse', `<select id="sc-wh">${UI.opts(d.warehouses, 'id', 'name', wh)}</select>`)}${UI.fld('Date', `<input type="date" id="sc-date" value="${U.today()}">`)}<div class="fld grow"><label>Note</label><input id="sc-note" placeholder="e.g. Month-end count"></div></div>
      <p class="muted sm">Enter the counted quantity. Leave blank to skip an item. Differences post as stock adjustments.</p>
      <div class="table-wrap tall"><table class="tbl"><thead><tr><th>Item</th><th class="r">System qty</th><th class="r" style="width:140px">Counted</th><th class="r">Difference</th><th class="r">Value</th></tr></thead><tbody id="sc-body"></tbody></table></div>`,
    onOpen: me => {
      const body = me.querySelector('#sc-body'), fill = () => {
        const w = me.querySelector('#sc-wh').value;
        body.innerHTML = items.map(i => `<tr data-id="${i.id}"><td><b>${UI.esc(i.code)}</b> ${UI.esc(i.name)}</td><td class="r">${UI.qty(sm.at(i.id, w))}</td><td class="r"><input type="number" step="any" class="cnt r" data-sys="${sm.at(i.id, w)}"></td><td class="r diff">—</td><td class="r val">—</td></tr>`).join('');
        body.querySelectorAll('.cnt').forEach(inp => inp.oninput = () => { const tr = inp.closest('tr'), it = Eng.item(tr.dataset.id), df = inp.value === '' ? null : U.r(+inp.value - +inp.dataset.sys, 4); tr.querySelector('.diff').innerHTML = df === null ? '—' : UI.signed(df); tr.querySelector('.val').innerHTML = df === null ? '—' : UI.signed(df * it.cost); });
      };
      me.querySelector('#sc-wh').onchange = fill; fill();
    },
    buttons: [{ label: 'Cancel', onClick: m => m.close() }, { label: 'Post count', cls: 'btn-primary', icon: 'check', onClick: m => {
      const lines = [...m.el.querySelectorAll('.cnt')].filter(i => i.value !== '').map(i => ({ itemId: i.closest('tr').dataset.id, qty: U.r(+i.value - +i.dataset.sys, 4) })).filter(l => l.qty !== 0);
      if (!lines.length) return UI.toast('No differences to post.', 'info');
      const r = UI.try(() => Eng.saveAdjustment({ kind: 'count', date: m.el.querySelector('#sc-date').value, warehouseId: m.el.querySelector('#sc-wh').value, reason: m.el.querySelector('#sc-note').value || 'Physical count', lines }));
      if (r) { UI.toast(`Count posted: ${lines.length} adjustment line(s) (${r.no})`); m.close(); done && done(); }
    } }] });
};
