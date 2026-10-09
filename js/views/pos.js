/* Devma — Point of Sale cashier screen
   Left: invoice panel (customer, toggles, barcode, lines, totals, dual-currency payment)
   Middle: category / item tiles with paging      Right: action buttons */
'use strict';
const POS_PER_PAGE = 20;
const posNow = () => { const d = new Date(); return new Date(d.getTime() - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 16); };
V.posState = () => {
  const d = db(), lbp = d.currencies.find(c => c.code === 'LBP');
  return { lines: [], sel: -1, customerId: '', custName: '', mobile: '', address: '', number: '', level: 'retail', wh: Eng.defWh(), mode: 'cash', delivery: false, deliveryFee: '', deliveryNo: '', type: 'sale',
    dispCur: (lbp || UI.base()).code, discPct: '', discAmt: '', paidL: '', paidU: '', date: posNow(), cat: null, page: 0, q: '', edit: false };
};
V.pos = el => {
  const d = db(), base = UI.base();
  if (!V._pos) V._pos = V.posState();
  const S = V._pos;
  if (!Eng.get('warehouses', S.wh)) S.wh = Eng.defWh();
  const lbp = () => d.currencies.find(c => c.code === 'LBP');
  const walk = () => d.settings.walkInCustomerId;
  const priceOf = it => (S.level === 'wholesale' && +it.price2 > 0) ? +it.price2 : +it.price;
  const sellable = i => i.active !== false && i.type !== 'raw' && !i.sys;
  const row = (label, input) => `<label class="bp-f"><span>${label}</span>${input}</label>`;

  el.innerHTML = `<div class="bpos">
  <section class="bp-left">
    <div class="bp-title"><b>${UI.icon('pos')}<span>Point of Sale</span></b>
      <div class="bp-ticons"><button class="bp-ib" id="bp-hold" title="Hold">${UI.icon('hold')}</button><button class="bp-ib" id="bp-recall" title="Recall">${UI.icon('history')}<i id="bp-heldn"></i></button><button class="bp-ib" id="bp-today" title="Today's sales">${UI.icon('list')}</button></div></div>
    <div class="bp-form">
      <div class="bp-col">
        ${row('Invoice no.', `<input id="bp-no" readonly value="Auto">`)}
        ${row('Invoice date', `<input id="bp-date" type="datetime-local" value="${S.date}">`)}
        ${row('Number', `<div class="bp-ig"><input id="bp-num" value="${UI.esc(S.number)}" placeholder="Phone / code / name"><button id="bp-find" title="Search">${UI.icon('search')}</button><button id="bp-hist" title="Customer history">${UI.icon('history')}</button><button id="bp-addc" title="Add customer">${UI.icon('user')}</button></div>`)}
        ${row('Mobile', `<input id="bp-mob" value="${UI.esc(S.mobile)}">`)}
        ${row('Price level', `<select id="bp-level"><option value="retail" ${S.level === 'retail' ? 'selected' : ''}>Retail price</option><option value="wholesale" ${S.level === 'wholesale' ? 'selected' : ''}>Wholesale price</option></select>`)}
        ${row('Customer', `<input id="bp-cust" value="${UI.esc(S.custName)}">`)}
      </div>
      <div class="bp-col">
        ${row('Warehouse', `<select id="bp-wh">${UI.opts(d.warehouses, 'id', 'name', S.wh)}</select>`)}
        ${row('Account name', `<select id="bp-acc">${UI.opts(Eng.parties('customer'), 'id', 'name', S.customerId || walk())}</select>`)}
        ${row('Delivery no.', `<input id="bp-dno" value="${UI.esc(S.deliveryNo)}">`)}
        ${row('Delivery', `<input id="bp-dfee" type="number" min="0" step="any" value="${S.deliveryFee}" placeholder="0" ${S.delivery ? '' : 'disabled'}>`)}
        ${row('Search', `<input id="bp-q" type="search" value="${UI.esc(S.q)}" placeholder="Item name or code">`)}
      </div>
      ${row('Address', `<input id="bp-addr" value="${UI.esc(S.address)}">`).replace('class="bp-f"', 'class="bp-f bp-full"')}
    </div>
    <div class="bp-toggles">
      <button class="bp-tg" id="bp-mode"></button><button class="bp-tg" id="bp-deliv"></button>
      <button class="bp-tg" id="bp-type"></button><button class="bp-tg" id="bp-cur"></button>
    </div>
    <div class="bp-scan">${UI.icon('barcode')}<input id="bp-bc" placeholder="Barcode (F2)" autocomplete="off"><span class="no-tr">ITEM <b id="bp-ni">0</b></span><span class="no-tr">QTY <b id="bp-nq">0</b></span><button class="bp-ib" id="bp-look" title="Find item">${UI.icon('search')}</button></div>
    <div class="bp-lines"><div class="bp-lwrap"><table><thead><tr><th>Item name</th><th>Price</th><th>Qty</th><th>Disc %</th><th>Total</th><th>Notes</th></tr></thead><tbody id="bp-body"></tbody></table></div>
      <div class="bp-lbtns"><button id="bp-minus" class="lb-minus" title="Decrease">${UI.icon('minus')}</button><button id="bp-plus" class="lb-plus" title="Increase">${UI.icon('plus')}</button><button id="bp-del" class="lb-del" title="Remove line">${UI.icon('x')}</button></div></div>
    <div class="bp-totals">
      <div class="bp-tgrid">
        <label>Disc %</label><input id="bp-dpct" type="number" min="0" max="100" step="any" placeholder="0.00">
        <label>Total</label><output id="bp-sub">0.00</output>
        <label>Discount</label><input id="bp-damt" type="number" min="0" step="any" placeholder="0.00">
        <label>Net after discount</label><output id="bp-net">0.00</output>
        <label id="bp-taxl"></label><output id="bp-tax">0.00</output>
        <label>Net to pay</label><output id="bp-pay" class="strong">0.00</output>
      </div>
      <div class="bp-paygrid">
        <label>Paid LL</label><input id="bp-pl" type="number" min="0" step="any" placeholder="0">
        <label>Paid $</label><input id="bp-pu" type="number" min="0" step="any" placeholder="0.00">
        <div class="bp-big"><small id="bp-bigl">To pay</small><b id="bp-bigv">0</b><span id="bp-bigc"></span></div>
        <label>Change LL</label><output id="bp-cl">0</output>
        <label>Change $</label><output id="bp-cu">0.00</output>
      </div>
    </div>
  </section>
  <section class="bp-mid">
    <div class="bp-nav"><button class="bp-arrow" id="bp-prev" title="Back">${UI.icon('arrowL')}</button><button class="bp-arrow" id="bp-next" title="Next page">${UI.icon('arrowR')}</button>
      <div class="bp-crumb" id="bp-crumb"></div><button class="bp-editbtn" id="bp-editmode">${UI.icon('edit')}<span></span></button></div>
    <div class="bp-grid-wrap"><div class="bp-bg" aria-hidden="true"><svg viewBox="0 0 64 64">${ILLUS.pos}</svg></div><div class="bp-grid" id="bp-grid"></div></div>
  </section>
  <aside class="bp-actions">
    <button data-a="new">${UI.icon('plus')}<span>New</span></button>
    <button data-a="addc">${UI.icon('user')}<span>Add customer</span></button>
    <button data-a="save" class="hot">${UI.icon('check')}<span>Save</span></button>
    <button data-a="print">${UI.icon('printer')}<span>Print</span></button>
    <button data-a="last">${UI.icon('receipt')}<span>Print last invoice</span></button>
    <button data-a="saveprint" class="hot">${UI.icon('printer')}<span>Save & print</span></button>
    <button data-a="price">${UI.icon('barcode')}<span>Price check</span></button>
    <button data-a="newinv">${UI.icon('file')}<span>New invoice</span></button>
    <button data-a="drawer">${UI.icon('wallet')}<span>Open cash drawer</span></button>
    <button data-a="close" class="exit">${UI.icon('x')}<span>Close</span></button>
  </aside></div>`;

  const $ = s => el.querySelector(s);
  /* ---------- calculations ---------- */
  const deliveryItem = () => {
    let it = d.items.find(i => i.sys === 'delivery');
    if (!it) { it = { id: 'it_delivery', code: 'SRV-DLV', barcode: '', name: 'Delivery Fee', categoryId: '', unit: 'trip', cost: 0, price: 0, minQty: 0, type: 'service', active: true, sys: 'delivery', created: U.now() }; d.items.push(it); Store.save(); }
    return it;
  };
  const allLines = () => S.lines.map(l => ({ itemId: l.itemId, qty: +l.qty || 0, price: +l.price || 0, disc: +l.disc || 0, note: l.note || '' }))
    .concat(S.delivery && +S.deliveryFee > 0 ? [{ itemId: deliveryItem().id, qty: 1, price: +S.deliveryFee, disc: 0 }] : []);
  const calc = () => Eng.calc({ lines: allLines(), discount: +S.discAmt || 0, taxRate: d.settings.taxRate });
  const rateL = () => (lbp() ? lbp().rate : 0);
  const paidBase = () => (+S.paidU || 0) + (rateL() ? (+S.paidL || 0) / rateL() : 0);

  /* ---------- toggles ---------- */
  const drawToggles = () => {
    $('#bp-mode').innerHTML = UI.icon(S.mode === 'cash' ? 'cash' : 'users') + `<b>${S.mode === 'cash' ? 'Cash' : 'Credit sale'}</b>`;
    $('#bp-deliv').innerHTML = UI.icon('truck') + '<b>Delivery</b>'; $('#bp-deliv').classList.toggle('on', S.delivery);
    $('#bp-type').innerHTML = UI.icon(S.type === 'sale' ? 'file' : 'return') + `<b>${S.type === 'sale' ? 'Sales invoice' : 'Sales return'}</b>`; $('#bp-type').classList.toggle('warn', S.type !== 'sale');
    $('#bp-cur').innerHTML = UI.icon('coins') + `<b class="no-tr">${S.dispCur}</b>`;
    $('#bp-dfee').disabled = !S.delivery;
  };
  /* ---------- lines ---------- */
  const drawLines = () => {
    const sm = Eng.stockMap();
    $('#bp-body').innerHTML = S.lines.length ? S.lines.map((l, i) => { const it = Eng.item(l.itemId) || {}, amt = (+l.qty || 0) * (+l.price || 0) * (1 - (+l.disc || 0) / 100), short = S.type === 'sale' && it.type !== 'service' && !d.settings.allowNegative && sm.at(it.id, S.wh) < U.sum(S.lines.filter(x => x.itemId === it.id), x => x.qty);
      return `<tr data-i="${i}" class="${i === S.sel ? 'sel' : ''} ${short ? 'short' : ''}"><td class="nm" title="${UI.esc(it.code || '')}">${UI.esc(it.name || '?')}</td><td><input class="c-price" type="number" step="any" min="0" value="${l.price}"></td><td><input class="c-qty" type="number" step="any" min="0" value="${l.qty}"></td><td><input class="c-disc" type="number" step="any" min="0" max="100" value="${l.disc || ''}" placeholder="0"></td><td class="amt">${UI.num(amt)}</td><td><input class="c-note" value="${UI.esc(l.note || '')}"></td></tr>`; }).join('')
      : `<tr class="empty"><td colspan="6">${UI.icon('barcode')} Scan a barcode or tap an item to start</td></tr>`;
    $('#bp-body').querySelectorAll('tr[data-i]').forEach(tr => {
      const i = +tr.dataset.i, l = S.lines[i];
      tr.onclick = () => { if (S.sel !== i) { S.sel = i; $('#bp-body').querySelectorAll('tr').forEach(x => x.classList.toggle('sel', x === tr)); } };
      const upd = () => { tr.querySelector('.amt').textContent = UI.num((+l.qty || 0) * (+l.price || 0) * (1 - (+l.disc || 0) / 100)); drawTotals(); };
      tr.querySelector('.c-price').oninput = e => { l.price = e.target.value; upd(); };
      tr.querySelector('.c-qty').oninput = e => { l.qty = e.target.value; upd(); };
      tr.querySelector('.c-qty').onchange = () => drawLines();
      tr.querySelector('.c-disc').oninput = e => { l.disc = e.target.value; upd(); };
      tr.querySelector('.c-note').oninput = e => { l.note = e.target.value; };
    });
    const sel = $('#bp-body tr.sel'); if (sel) sel.scrollIntoView({ block: 'nearest' });
    $('#bp-ni').textContent = S.lines.length; $('#bp-nq').textContent = UI.qty(U.sum(S.lines, l => +l.qty || 0));
    drawTotals();
  };
  /* ---------- totals & payment ---------- */
  const drawTotals = () => {
    const c = calc(), disp = UI.cur(S.dispCur), paid = paidBase(), ch = paid - c.total, r = rateL();
    $('#bp-sub').textContent = UI.num(c.subtotal); $('#bp-net').textContent = UI.num(c.net); $('#bp-tax').textContent = UI.num(c.tax); $('#bp-pay').textContent = UI.num(c.total);
    $('#bp-taxl').textContent = `Tax ${d.settings.taxRate}%`;
    const remaining = paid > 0 ? Math.max(0, c.total - paid) : c.total;
    $('#bp-bigl').textContent = paid > 0 ? 'Remaining' : 'To pay';
    $('#bp-bigv').textContent = UI.num(remaining * disp.rate, disp.decimals); $('#bp-bigc').textContent = disp.code;
    $('#bp-cu').textContent = UI.num(Math.max(0, ch)); $('#bp-cl').textContent = r ? UI.num(Math.max(0, ch) * r, 0) : '—';
    $('#bp-cu').classList.toggle('pos', ch > 0.004); $('#bp-cl').classList.toggle('pos', ch > 0.004);
    if (document.activeElement !== $('#bp-dpct')) $('#bp-dpct').value = c.subtotal && +S.discAmt ? U.r(+S.discAmt / c.subtotal * 100, 2) : '';
    if (document.activeElement !== $('#bp-damt')) $('#bp-damt').value = S.discAmt || '';
  };
  /* ---------- adding items ---------- */
  const add = (it, n = 1) => {
    if (!it) return;
    if (S.type === 'sale' && it.type !== 'service' && !d.settings.allowNegative) {
      const have = Eng.qty(it.id, S.wh), inCart = U.sum(S.lines.filter(l => l.itemId === it.id), l => +l.qty || 0);
      if (have < inCart + n - 1e-6) return UI.toast(`Not enough stock of ${it.name} (available ${UI.qty(have)}).`, 'warn');
    }
    const p = priceOf(it), ex = S.lines.findIndex(l => l.itemId === it.id && +l.price === p && !+l.disc);
    if (ex >= 0) { S.lines[ex].qty = U.r((+S.lines[ex].qty || 0) + n, 3); S.sel = ex; }
    else { S.lines.push({ itemId: it.id, qty: n, price: p, disc: '', note: '' }); S.sel = S.lines.length - 1; }
    drawLines();
    const t = $(`.bp-tile[data-item="${it.id}"]`); if (t) { t.classList.remove('bump'); void t.offsetWidth; t.classList.add('bump'); }
  };
  /* ---------- tiles ---------- */
  const drawGrid = () => {
    let tiles = [], crumb;
    const cats = d.categories, uncats = d.items.filter(i => sellable(i) && !Eng.get('categories', i.categoryId));
    if (S.q) {
      const q = S.q.toLowerCase();
      tiles = d.items.filter(i => sellable(i) && (i.name + ' ' + i.code + ' ' + (i.barcode || '')).toLowerCase().includes(q)).map(i => ({ item: i }));
      crumb = `<span>${UI.icon('search')} "${UI.esc(S.q)}"</span>`;
    } else if (S.cat === null) {
      tiles = cats.map(c => ({ cat: c })); if (uncats.length) tiles.push({ cat: { id: '', name: 'Uncategorized', color: '#94a3b8' } });
      tiles.push({ addCat: true }); crumb = '<b>Item categories</b>';
    } else {
      const c = S.cat ? Eng.get('categories', S.cat) : { name: 'Uncategorized' };
      if (!c) { S.cat = null; return drawGrid(); }
      tiles = d.items.filter(i => sellable(i) && (S.cat ? i.categoryId === S.cat : !Eng.get('categories', i.categoryId))).map(i => ({ item: i }));
      tiles.push({ addItem: true }); crumb = `<a href="#" id="bp-home">Item categories</a> ${UI.icon('chevR')} <b>${UI.esc(c.name)}</b>`;
    }
    const pages = Math.max(1, Math.ceil(tiles.length / POS_PER_PAGE)); if (S.page >= pages) S.page = pages - 1;
    const shown = tiles.slice(S.page * POS_PER_PAGE, (S.page + 1) * POS_PER_PAGE), sm = Eng.stockMap();
    $('#bp-crumb').innerHTML = crumb + (pages > 1 ? ` <small class="no-tr">${S.page + 1}/${pages}</small>` : '');
    $('#bp-prev').disabled = S.page === 0 && S.cat === null && !S.q; $('#bp-next').disabled = S.page >= pages - 1;
    $('#bp-editmode').classList.toggle('on', S.edit); $('#bp-editmode span').textContent = S.edit ? 'Done' : 'Edit tiles';
    const editBtns = '<span class="bp-tedit"><i data-e="edit">' + UI.icon('edit') + '</i><i data-e="del">' + UI.icon('trash') + '</i></span>';
    const disp = UI.cur(S.dispCur);
    $('#bp-grid').innerHTML = shown.map(t => {
      if (t.addCat) return `<button class="bp-tile add" data-add="cat">${UI.icon('plus')}<span>New category</span></button>`;
      if (t.addItem) return `<button class="bp-tile add" data-add="item">${UI.icon('plus')}<span>New item</span></button>`;
      if (t.cat) { const n = d.items.filter(i => sellable(i) && (t.cat.id ? i.categoryId === t.cat.id : !Eng.get('categories', i.categoryId))).length;
        return `<button class="bp-tile cat" data-cat="${t.cat.id}" style="--c:${t.cat.color || '#94a3b8'}"><b>${UI.esc(t.cat.name)}</b><small>${n} item(s)</small>${S.edit && t.cat.id ? editBtns : ''}</button>`; }
      const it = t.item, st = sm.at(it.id, S.wh), out = it.type !== 'service' && st <= 0, c = Eng.get('categories', it.categoryId);
      return `<button class="bp-tile item ${out ? 'out' : ''}" data-item="${it.id}" style="--c:${c ? c.color : '#94a3b8'}"><b>${UI.esc(it.name)}</b><span class="pr">${UI.money(priceOf(it))}</span>${disp.code !== base.code ? `<small class="no-tr">${UI.money(priceOf(it) * disp.rate, disp.code)}</small>` : ''}<small>${it.type === 'service' ? 'service' : UI.qty(st) + ' ' + UI.esc(it.unit)}</small>${S.edit ? editBtns : ''}</button>`;
    }).join('') || '';
    if (!shown.length || (shown.length === 1 && (shown[0].addCat || shown[0].addItem))) {
      $('#bp-grid').insertAdjacentHTML('beforeend', `<div class="bp-empty">${UI.icon('box')}<b>${S.q ? 'No items match.' : S.cat === null ? 'No categories yet.' : 'No items in this category yet.'}</b><span>${S.q ? '' : S.cat === null ? 'Start by adding a category, then add items inside it.' : 'Add the first item'}</span></div>`);
    }
    const home = $('#bp-home'); if (home) home.onclick = e => { e.preventDefault(); S.cat = null; S.page = 0; drawGrid(); };
    $('#bp-grid').querySelectorAll('.bp-tile').forEach(b => b.onclick = e => {
      const ed = e.target.closest('[data-e]');
      if (b.dataset.add === 'cat') return V.categoryForm(null, c => { S.cat = c.id; S.page = 0; drawGrid(); });
      if (b.dataset.add === 'item') return V.itemForm(null, () => drawGrid(), { categoryId: S.cat || '' });
      if (b.dataset.cat !== undefined) {
        const cat = Eng.get('categories', b.dataset.cat);
        if (S.edit && cat) {
          if (ed && ed.dataset.e === 'del') return delCat(cat);
          return V.categoryForm(cat, () => drawGrid());
        }
        S.cat = b.dataset.cat; S.page = 0; return drawGrid();
      }
      const it = Eng.item(b.dataset.item);
      if (S.edit) { if (ed && ed.dataset.e === 'del') return V.deleteItem(it.id, () => drawGrid()); return V.itemForm(it, () => { drawGrid(); drawLines(); }); }
      add(it);
    });
  };
  const delCat = async cat => {
    if (d.items.some(i => i.categoryId === cat.id)) return UI.toast('Move or delete the items in this category first.', 'warn');
    if (await UI.confirm(`Delete category "${cat.name}"?`, { danger: true, ok: 'Delete' })) { d.categories = d.categories.filter(c => c.id !== cat.id); Eng.audit('Deleted', 'Category ' + cat.name); Store.save(); UI.toast('Category deleted'); drawGrid(); }
  };
  /* ---------- customer ---------- */
  const setCustomer = a => {
    S.customerId = a ? a.id : ''; S.custName = a && a.id !== walk() ? a.name : S.custName;
    if (a && a.id !== walk()) { S.mobile = a.phone || S.mobile; S.address = a.address || S.address; S.number = a.code; }
    $('#bp-acc').innerHTML = UI.opts(Eng.parties('customer'), 'id', 'name', S.customerId || walk());
    $('#bp-cust').value = S.custName; $('#bp-mob').value = S.mobile; $('#bp-addr').value = S.address; $('#bp-num').value = S.number;
  };
  const findCustomer = () => {
    const q = $('#bp-num').value.trim().toLowerCase(); if (!q) return UI.toast('Type a phone number, code or name.', 'info');
    const hits = Eng.parties('customer').filter(a => [a.phone, a.code, a.name].some(v => (v || '').toLowerCase().includes(q)));
    if (hits.length === 1) return setCustomer(hits[0]);
    if (!hits.length) return UI.confirm('Customer not found. Create a new customer?', { ok: 'Create' }).then(y => y && V.partyForm('customer', null, a => setCustomer(a)));
    const m = UI.modal({ title: 'Choose customer', icon: 'users', body: `<div class="held-list">${hits.map(a => `<div class="held" data-id="${a.id}"><div><b>${UI.esc(a.name)}</b><div class="muted sm">${UI.esc(a.code)} · ${UI.esc(a.phone || '')}</div></div><button class="btn btn-primary btn-sm">Select</button></div>`).join('')}</div>` });
    m.el.querySelectorAll('.held').forEach(r => r.onclick = () => { setCustomer(Eng.account(r.dataset.id)); m.close(); });
  };
  /* ---------- save ---------- */
  const reset = () => { const keep = { wh: S.wh, level: S.level, dispCur: S.dispCur, lastId: S.lastId, cat: S.cat }; V._pos = Object.assign(V.posState(), keep); App.refresh(); };
  const save = print => {
    if (!S.lines.length) return UI.toast('Add items to the invoice first.', 'info');
    const c = calc(), acc = S.customerId || walk(), paidIn = paidBase();
    if (S.mode === 'credit' && acc === walk()) return UI.toast('Choose a named customer for a credit sale.', 'error');
    let paid;
    if (S.mode === 'cash') {
      if (paidIn > 0 && paidIn < c.total - 0.004) return UI.toast('Amount paid is less than the total. Switch to Credit sale for a partial payment.', 'error');
      paid = c.total;
    } else paid = Math.min(paidIn, c.total);
    const notes = [S.custName && acc === walk() ? S.custName : '', S.mobile, S.address, S.deliveryNo ? 'Delivery #' + S.deliveryNo : ''].filter(Boolean).join(' · ');
    const inv = UI.try(() => Eng.saveInvoice({ type: S.type, source: 'pos', date: (S.date || posNow()).slice(0, 10), accountId: acc, warehouseId: S.wh, currency: base.code, rate: 1, taxRate: d.settings.taxRate,
      discount: c.discount, paid, payAccountId: Eng.defCash(), salesmanId: '', notes, lines: allLines() }));
    if (!inv) return;
    const rawChange = paidIn > 0 ? paidIn - c.total : 0, change = U.r(rawChange), r = rateL();
    S.lastId = inv.id;
    UI.toast(`${Eng.INV[inv.type].label} ${inv.no} saved` + (change > 0.004 ? ` — change ${UI.money(change)}${r ? ' / ' + UI.money(rawChange * r, 'LBP') : ''}` : ''));
    if (print) UI.print(V.receiptDoc(inv, paidIn > 0 ? { label: S.mode === 'cash' ? 'Cash' : 'Credit sale', given: UI.money(paidIn), change: UI.money(Math.max(0, change)) } : null), true);
    reset();
  };
  /* ---------- action buttons ---------- */
  const actions = {
    new: () => UI.modal({ title: 'What do you want to add?', icon: 'plus', size: 'sm', body: `<div class="bp-choose"><button class="btn btn-light" data-c="item">${UI.icon('box')}<span>New item</span></button><button class="btn btn-light" data-c="cat">${UI.icon('layers')}<span>New category</span></button></div>`,
      onOpen: (me, m) => me.querySelectorAll('[data-c]').forEach(b => b.onclick = () => { m.close(); b.dataset.c === 'item' ? V.itemForm(null, () => drawGrid(), { categoryId: S.cat || '' }) : V.categoryForm(null, c => { S.cat = c.id; S.page = 0; drawGrid(); }); }) }),
    addc: () => V.partyForm('customer', null, a => setCustomer(a)),
    save: () => save(false),
    saveprint: () => save(true),
    print: () => {
      if (!S.lines.length) return UI.toast('Add items to the invoice first.', 'info');
      UI.print(V.receiptDoc({ id: 'quotation', no: 'QUOTATION', type: S.type, date: S.date.slice(0, 10), created: new Date(S.date).toISOString(), accountId: S.customerId || walk(), currency: base.code, rate: 1, taxRate: d.settings.taxRate, discount: +S.discAmt || 0, paid: 0, lines: allLines(), createdBy: Eng.user() }), true);
    },
    last: () => { const inv = (S.lastId && Eng.get('invoices', S.lastId)) || d.invoices.filter(i => i.source === 'pos').sort((a, b) => (b.created || '').localeCompare(a.created || ''))[0]; if (!inv) return UI.toast('No POS invoice saved yet.', 'info'); UI.print(V.receiptDoc(inv), true); },
    price: () => UI.modal({ title: 'Price check', icon: 'barcode', body: `<input id="pc-q" placeholder="Scan barcode or type item name" autofocus><div id="pc-res" class="mt"></div>`,
      onOpen: me => { const inp = me.querySelector('#pc-q'), out = me.querySelector('#pc-res'); const show = () => {
        const v = inp.value.trim().toLowerCase(); if (!v) { out.innerHTML = ''; return; }
        const it = UI.findItem(inp.value) || d.items.find(i => !i.sys && (i.name.toLowerCase().includes(v) || i.code.toLowerCase().includes(v)));
        if (!it) { out.innerHTML = UI.empty('Item not found.', 'search'); return; }
        const sm = Eng.stockMap(), L = lbp();
        out.innerHTML = `<div class="pc-card"><b>${UI.esc(it.name)}</b><span class="muted no-tr">${UI.esc(it.code)} ${it.barcode ? '· ' + UI.esc(it.barcode) : ''}</span>
          <div class="pc-prices"><div><small>Retail price</small><b>${UI.money(it.price)}</b>${L ? `<span>${UI.money(it.price * L.rate, 'LBP')}</span>` : ''}</div>${+it.price2 ? `<div><small>Wholesale price</small><b>${UI.money(it.price2)}</b>${L ? `<span>${UI.money(it.price2 * L.rate, 'LBP')}</span>` : ''}</div>` : ''}</div>
          ${it.type === 'service' ? '' : `<table class="tbl"><tbody>${d.warehouses.map(w => `<tr><td>${UI.esc(w.name)}</td><td class="r"><b>${UI.qty(sm.at(it.id, w.id))}</b> ${UI.esc(it.unit)}</td></tr>`).join('')}</tbody></table>`}</div>`; };
        inp.oninput = show; },
      buttons: [{ label: 'Close', cls: 'btn-primary', onClick: m => m.close() }] }),
    newinv: async () => { if (S.lines.length && !(await UI.confirm('Clear the current invoice and start a new one?', { ok: 'New invoice' }))) return; reset(); },
    drawer: () => {
      const cash = Eng.defCash(), bal = Eng.balance(cash), today = U.today();
      let inn = 0, out = 0; d.journal.filter(j => j.date === today).forEach(j => j.lines.forEach(l => { if (l.accountId === cash) { inn += l.debit; out += l.credit; } }));
      Eng.audit('Cash drawer', 'Opened from POS'); Store.save();
      const L = lbp();
      UI.modal({ title: 'Open cash drawer', icon: 'wallet', size: 'sm', body: `<div class="pc-card"><small>Drawer balance</small><b class="big">${UI.money(bal)}</b>${L ? `<span>${UI.money(bal * L.rate, 'LBP')}</span>` : ''}
          <div class="pc-prices"><div><small>Cash in</small><b class="pos">${UI.money(inn)}</b></div><div><small>Cash out</small><b class="neg">${UI.money(out)}</b></div></div></div>`,
        buttons: [{ label: 'Cash out', icon: 'minus', onClick: m => { m.close(); V.voucherForm({ type: 'payment', accountId: Eng.A('general_exp'), cashAccountId: cash, memo: 'Cash out (POS)' }, () => {}); } },
          { label: 'Cash in', icon: 'plus', onClick: m => { m.close(); V.voucherForm({ type: 'receipt', accountId: Eng.A('other_inc'), cashAccountId: cash, memo: 'Cash in (POS)' }, () => {}); } },
          { label: 'Close', cls: 'btn-primary', onClick: m => m.close() }] });
    },
    close: () => App.go('dashboard'),
  };
  el.querySelectorAll('.bp-actions [data-a]').forEach(b => b.onclick = () => actions[b.dataset.a]());

  /* ---------- field bindings ---------- */
  $('#bp-date').onchange = e => { S.date = e.target.value; };
  $('#bp-num').oninput = e => { S.number = e.target.value; };
  $('#bp-num').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); findCustomer(); } };
  $('#bp-find').onclick = findCustomer;
  $('#bp-hist').onclick = () => { const id = S.customerId || walk(); if (!App.can('statement')) return UI.toast('You do not have permission to open account statements.', 'warn'); App.go('statement/' + id); };
  $('#bp-addc').onclick = actions.addc;
  $('#bp-mob').oninput = e => { S.mobile = e.target.value; };
  $('#bp-cust').oninput = e => { S.custName = e.target.value; };
  $('#bp-addr').oninput = e => { S.address = e.target.value; };
  $('#bp-dno').oninput = e => { S.deliveryNo = e.target.value; };
  $('#bp-dfee').oninput = e => { S.deliveryFee = e.target.value; drawTotals(); };
  $('#bp-level').onchange = e => { S.level = e.target.value; S.lines.forEach(l => { const it = Eng.item(l.itemId); if (it) l.price = priceOf(it); }); drawLines(); drawGrid(); };
  $('#bp-wh').onchange = e => { S.wh = e.target.value; drawGrid(); drawLines(); };
  $('#bp-acc').onchange = e => setCustomer(Eng.account(e.target.value));
  $('#bp-q').oninput = e => { S.q = e.target.value.trim(); S.page = 0; drawGrid(); };
  $('#bp-mode').onclick = () => { S.mode = S.mode === 'cash' ? 'credit' : 'cash'; drawToggles(); };
  $('#bp-deliv').onclick = () => { S.delivery = !S.delivery; drawToggles(); drawTotals(); if (S.delivery) $('#bp-dfee').focus(); };
  $('#bp-type').onclick = () => { S.type = S.type === 'sale' ? 'sale_return' : 'sale'; drawToggles(); drawLines(); };
  $('#bp-cur').onclick = () => { const list = d.currencies.map(c => c.code), i = list.indexOf(S.dispCur); S.dispCur = list[(i + 1) % list.length]; drawToggles(); drawTotals(); drawGrid(); };
  $('#bp-dpct').oninput = e => { const sub = calc().subtotal; S.discAmt = e.target.value === '' ? '' : U.r(sub * (+e.target.value || 0) / 100); drawTotals(); };
  $('#bp-damt').oninput = e => { S.discAmt = e.target.value; drawTotals(); };
  $('#bp-pl').oninput = e => { S.paidL = e.target.value; drawTotals(); };
  $('#bp-pu').oninput = e => { S.paidU = e.target.value; drawTotals(); };
  $('#bp-pl').value = S.paidL; $('#bp-pu').value = S.paidU;
  const lineAct = fn => { if (S.sel < 0 || !S.lines[S.sel]) return UI.toast('Select a line first.', 'info'); fn(S.lines[S.sel]); drawLines(); };
  $('#bp-plus').onclick = () => lineAct(l => { const it = Eng.item(l.itemId); if (S.type === 'sale' && it.type !== 'service' && !d.settings.allowNegative && Eng.qty(it.id, S.wh) < U.sum(S.lines.filter(x => x.itemId === it.id), x => +x.qty || 0) + 1 - 1e-6) return UI.toast('Not enough stock.', 'warn'); l.qty = U.r((+l.qty || 0) + 1, 3); });
  $('#bp-minus').onclick = () => lineAct(l => { l.qty = U.r((+l.qty || 0) - 1, 3); if (l.qty <= 0) { S.lines.splice(S.sel, 1); S.sel = Math.min(S.sel, S.lines.length - 1); } });
  $('#bp-del').onclick = () => lineAct(() => { S.lines.splice(S.sel, 1); S.sel = Math.min(S.sel, S.lines.length - 1); });
  /* barcode: Enter adds; "3*code" adds 3 */
  $('#bp-bc').onkeydown = e => {
    if (e.key !== 'Enter') return; e.preventDefault();
    let v = e.target.value.trim(), n = 1; if (!v) return;
    const m = v.match(/^(\d+(?:\.\d+)?)\*(.+)$/); if (m) { n = +m[1]; v = m[2]; }
    const it = UI.findItem(v);
    if (!it || !sellable(it)) { UI.toast('No item with barcode or code ' + v, 'warn'); e.target.select(); return; }
    add(it, n); e.target.value = '';
  };
  $('#bp-look').onclick = () => UI.modal({ title: 'Find item', icon: 'search', size: 'lg', body: `<input id="fi-q" placeholder="Item name or code" autofocus><div id="fi-res" class="mt"></div>`,
    onOpen: (me, m) => { const inp = me.querySelector('#fi-q'), out = me.querySelector('#fi-res'), sm = Eng.stockMap(); const show = () => {
      const q = inp.value.trim().toLowerCase(), list = d.items.filter(i => sellable(i) && (!q || (i.name + ' ' + i.code + ' ' + (i.barcode || '')).toLowerCase().includes(q))).slice(0, 40);
      out.innerHTML = list.length ? `<table class="tbl clickable"><thead><tr><th>Item</th><th>Code</th><th class="r">Price</th><th class="r">Stock</th></tr></thead><tbody>${list.map(i => `<tr data-id="${i.id}"><td><b>${UI.esc(i.name)}</b></td><td class="no-tr">${UI.esc(i.code)}</td><td class="r">${UI.money(priceOf(i))}</td><td class="r">${i.type === 'service' ? '—' : UI.qty(sm.at(i.id, S.wh))}</td></tr>`).join('')}</tbody></table>` : UI.empty('No items match.', 'search');
      out.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => { add(Eng.item(tr.dataset.id)); m.close(); }); };
      inp.oninput = show; show(); } });
  $('#bp-editmode').onclick = () => { S.edit = !S.edit; drawGrid(); };
  $('#bp-prev').onclick = () => { if (S.page > 0) S.page--; else if (S.q) { S.q = ''; $('#bp-q').value = ''; } else S.cat = null; drawGrid(); };
  $('#bp-next').onclick = () => { S.page++; drawGrid(); };
  /* held orders */
  const heldN = () => { $('#bp-heldn').textContent = d.heldOrders.length || ''; };
  $('#bp-hold').onclick = () => {
    if (!S.lines.length) return UI.toast('Cart is empty.', 'info');
    UI.formModal({ title: 'Hold order', icon: 'hold', size: 'sm', saveLabel: 'Hold', fields: UI.fld('Label (table, name…)', UI.inp('note', S.custName || 'Order ' + (d.heldOrders.length + 1)), 'fld-full'),
      save: x => { d.heldOrders.push({ id: U.uid('hold'), date: U.now(), note: x.note, total: calc().total, cart: U.clone(S.lines), customerId: S.customerId, state: U.clone(S) }); Store.save(); UI.toast('Order held — recall it any time'); reset(); return true; } });
  };
  $('#bp-recall').onclick = () => {
    if (!d.heldOrders.length) return UI.toast('No held orders.', 'info');
    const m = UI.modal({ title: 'Held orders', icon: 'history', body: `<div class="held-list">${d.heldOrders.map(h => `<div class="held" data-id="${h.id}"><div><b>${UI.esc(h.note)}</b><div class="muted sm">${UI.datetime(h.date)} · ${h.cart.length} line(s)</div></div><b>${UI.money(h.total)}</b><button class="btn btn-primary btn-sm" data-load>Load</button><button class="icon-btn sm" data-del title="Delete">${UI.icon('trash')}</button></div>`).join('')}</div>` });
    m.el.querySelectorAll('.held').forEach(r => {
      const h = d.heldOrders.find(x => x.id === r.dataset.id);
      r.querySelector('[data-load]').onclick = async () => {
        if (S.lines.length && !(await UI.confirm('Replace the current cart with this held order?', { ok: 'Replace' }))) return;
        V._pos = Object.assign(V.posState(), h.state || { lines: h.cart, customerId: h.customerId }, { date: posNow(), edit: false });
        d.heldOrders = d.heldOrders.filter(x => x.id !== h.id); Store.save(); m.close(); App.refresh();
      };
      r.querySelector('[data-del]').onclick = () => { d.heldOrders = d.heldOrders.filter(x => x.id !== h.id); Store.save(); r.remove(); heldN(); if (!d.heldOrders.length) m.close(); };
    });
  };
  $('#bp-today').onclick = () => App.go(`invoices/sale?from=${U.today()}&to=${U.today()}`);
  /* keyboard: F2 barcode, F9 save & print */
  if (!V._posKeys2) {
    V._posKeys2 = true;
    document.addEventListener('keydown', e => {
      if (!App.route_ || App.route_.name !== 'pos' || document.querySelector('.modal-backdrop')) return;
      if (e.key === 'F2') { e.preventDefault(); const x = document.getElementById('bp-bc'); x && x.focus(); }
      if (e.key === 'F9') { e.preventDefault(); const x = document.querySelector('.bp-actions [data-a="saveprint"]'); x && x.click(); }
    });
  }
  drawToggles(); drawLines(); drawGrid(); heldN();
  setTimeout(() => $('#bp-bc').focus(), 60);
};
