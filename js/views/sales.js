/* Devma — Point of Sale, Rooms, Salesmen, Cash Box */
'use strict';

/* ================= POINT OF SALE ================= */
V.pos = el => {
  const d = db();
  const S = V._pos || (V._pos = { cart: [], customerId: d.settings.walkInCustomerId, salesmanId: '', discount: 0, cat: '', q: '', wh: Eng.defWh() });
  if (!Eng.get('warehouses', S.wh)) S.wh = Eng.defWh();
  el.innerHTML = `<div class="pos">
    <section class="pos-left">
      <div class="pos-top"><a class="btn btn-light" href="#/dashboard" title="Exit POS">${UI.icon('arrowL')}</a>
        <div class="search-box big">${UI.icon('barcode')}<input id="pos-q" placeholder="Search item or scan barcode  (F2)" value="${UI.esc(S.q)}" autocomplete="off"></div>
        <select id="pos-wh" title="Sell from warehouse">${UI.opts(d.warehouses, 'id', 'name', S.wh)}</select></div>
      <div class="pos-cats" id="pos-cats"></div>
      <div class="pos-grid" id="pos-grid"></div>
    </section>
    <section class="pos-right">
      <div class="pos-cust"><div class="input-group"><select id="pos-cust">${partyOpts('customer', S.customerId)}</select><button class="btn btn-light btn-sm" id="pos-newc" title="New customer">${UI.icon('plus')}</button></div>
        <select id="pos-sm">${UI.opts(d.salesmen.filter(s => s.active !== false), 'id', 'name', S.salesmanId, 'No salesman')}</select></div>
      <div class="cart" id="cart"></div>
      <div class="cart-totals" id="cart-tot"></div>
      <div class="pos-actions">
        <button class="btn btn-light" id="pos-hold">${UI.icon('hold')}<span>Hold</span></button>
        <button class="btn btn-light" id="pos-recall">${UI.icon('history')}<span>Recall <b id="held-n"></b></span></button>
        <button class="btn btn-light" id="pos-disc">${UI.icon('tag')}<span>Discount</span></button>
        <button class="btn btn-light danger" id="pos-clear">${UI.icon('trash')}<span>Clear</span></button>
        <button class="btn btn-accent pay-btn" id="pos-pay">${UI.icon('cash')}<span>PAY <small>F9</small></span><b id="pay-amt"></b></button>
      </div>
    </section></div>`;
  const $ = s => el.querySelector(s);
  const sm = () => Eng.stockMap();
  const calc = () => Eng.calc({ lines: S.cart, discount: S.discount, taxRate: d.settings.taxRate });
  const inCart = id => U.sum(S.cart.filter(l => l.itemId === id), l => l.qty);
  const add = (it, n = 1) => {
    if (it.active === false) return UI.toast(it.name + ' is inactive.', 'warn');
    if (it.type !== 'service' && !d.settings.allowNegative && sm().at(it.id, S.wh) < inCart(it.id) + n - 1e-6) return UI.toast(`Not enough stock of ${it.name} in ${whName(S.wh)}.`, 'warn');
    const l = S.cart.find(x => x.itemId === it.id && !+x.disc && +x.price === +it.price);
    if (l) l.qty = U.r(+l.qty + n, 3); else S.cart.push({ itemId: it.id, qty: n, price: it.price, disc: 0 });
    drawCart(it.id); flash(it.id);
  };
  const flash = id => { const c = $(`.pos-item[data-id="${id}"]`); if (c) { c.classList.remove('bump'); void c.offsetWidth; c.classList.add('bump'); } };
  const drawCats = () => {
    $('#pos-cats').innerHTML = `<button class="chip ${!S.cat ? 'active' : ''}" data-c="">All</button>` + d.categories.filter(c => d.items.some(i => i.categoryId === c.id && i.active !== false && i.type !== 'raw')).map(c => `<button class="chip ${S.cat === c.id ? 'active' : ''}" data-c="${c.id}" style="--c:${c.color}"><span class="cdot" style="background:${c.color}"></span>${UI.esc(c.name)}</button>`).join('');
    $('#pos-cats').querySelectorAll('.chip').forEach(b => b.onclick = () => { S.cat = b.dataset.c; drawCats(); drawGrid(); });
  };
  const drawGrid = () => {
    const m = sm(), q = S.q.toLowerCase();
    const list = d.items.filter(i => i.active !== false && i.type !== 'raw' && !i.sys && (!S.cat || i.categoryId === S.cat) && (!q || (i.name + ' ' + i.code + ' ' + (i.barcode || '')).toLowerCase().includes(q)));
    $('#pos-grid').innerHTML = list.length ? list.map(i => { const c = Eng.get('categories', i.categoryId), st = m.at(i.id, S.wh), out = i.type !== 'service' && st <= 0;
      return `<button class="pos-item ${out ? 'out' : ''}" data-id="${i.id}" style="--c:${c ? c.color : '#94a3b8'}"><span class="pi-name">${UI.esc(i.name)}</span><span class="pi-code">${UI.esc(i.code)}</span><span class="pi-foot"><b>${UI.money(i.price)}</b><span class="pi-stock">${i.type === 'service' ? 'service' : UI.qty(st) + ' ' + UI.esc(i.unit)}</span></span></button>`; }).join('') : UI.empty('No items match.', 'search');
    $('#pos-grid').querySelectorAll('.pos-item').forEach(b => b.onclick = () => add(Eng.item(b.dataset.id)));
  };
  const drawCart = hl => {
    const c = calc();
    $('#cart').innerHTML = S.cart.length ? S.cart.map((l, i) => { const it = Eng.item(l.itemId) || {}; const amt = l.qty * l.price * (1 - (+l.disc || 0) / 100);
      return `<div class="cart-line ${l.itemId === hl ? 'hl' : ''}" data-i="${i}"><div class="cl-main"><b>${UI.esc(it.name)}</b><span class="muted sm">${UI.num(l.price)} × ${UI.qty(l.qty)}${+l.disc ? ` · −${l.disc}%` : ''}</span></div>
        <div class="cl-qty"><button class="icon-btn sm" data-q="-1">${UI.icon('minus')}</button><span>${UI.qty(l.qty)}</span><button class="icon-btn sm" data-q="1">${UI.icon('plus')}</button></div><div class="cl-amt">${UI.num(amt)}</div></div>`; }).join('')
      : `<div class="cart-empty">${UI.icon('pos')}<p>Cart is empty</p><small>Tap an item or scan a barcode</small></div>`;
    $('#cart').querySelectorAll('.cart-line').forEach(row => {
      const i = +row.dataset.i;
      row.querySelectorAll('[data-q]').forEach(b => b.onclick = e => { e.stopPropagation(); const l = S.cart[i]; if (+b.dataset.q > 0) { add(Eng.item(l.itemId)); return; } l.qty = U.r(l.qty - 1, 3); if (l.qty <= 0) S.cart.splice(i, 1); drawCart(); });
      row.onclick = () => editLine(i);
    });
    const hlEl = $('#cart .cart-line.hl'); if (hlEl) hlEl.scrollIntoView({ block: 'nearest' });
    $('#cart-tot').innerHTML = `<div><span>Items</span><span>${UI.qty(U.sum(S.cart, l => l.qty))}</span></div><div><span>Subtotal</span><span>${UI.money(c.subtotal)}</span></div>${c.discount ? `<div><span>Discount</span><span>− ${UI.money(c.discount)}</span></div>` : ''}<div><span>Tax ${d.settings.taxRate}%</span><span>${UI.money(c.tax)}</span></div><div class="grand"><span>Total</span><span>${UI.money(c.total)}</span></div>`;
    $('#pay-amt').textContent = UI.money(c.total);
    $('#held-n').textContent = d.heldOrders.length ? '(' + d.heldOrders.length + ')' : '';
  };
  const editLine = i => {
    const l = S.cart[i], it = Eng.item(l.itemId);
    UI.formModal({ title: it.name, icon: 'edit', size: 'sm', fields: UI.fld('Quantity', UI.inp('qty', l.qty, 'type="number" step="any" min="0"'), 'fld-full') + UI.fld('Unit price', UI.inp('price', l.price, 'type="number" step="any" min="0"'), 'fld-full') + UI.fld('Discount %', UI.inp('disc', l.disc || 0, 'type="number" step="any" min="0" max="100"'), 'fld-full'),
      extraButtons: [{ label: 'Remove', cls: 'btn-light danger', icon: 'trash', onClick: m => { S.cart.splice(i, 1); m.close(); drawCart(); } }],
      save: x => {
        if (!(+x.qty > 0)) throw new Error('Quantity must be greater than zero.');
        if (it.type !== 'service' && !d.settings.allowNegative && +x.qty - l.qty > 0 && sm().at(it.id, S.wh) < inCart(it.id) - l.qty + +x.qty - 1e-6) throw new Error('Not enough stock.');
        if (+x.disc < 0 || +x.disc > 100) throw new Error('Discount must be between 0 and 100%.');
        Object.assign(l, { qty: +x.qty, price: +x.price, disc: +x.disc || 0 }); drawCart(); return true;
      } });
  };
  /* search & barcode */
  const q = $('#pos-q');
  q.oninput = () => { S.q = q.value; drawGrid(); };
  q.onkeydown = e => {
    if (e.key !== 'Enter') return; e.preventDefault();
    const v = q.value.trim(); if (!v) return;
    let it = UI.findItem(v);
    if (!it) { const vis = [...$('#pos-grid').querySelectorAll('.pos-item')]; if (vis.length === 1) it = Eng.item(vis[0].dataset.id); }
    if (!it) return UI.toast('No item found for "' + v + '"', 'warn');
    add(it); q.value = ''; S.q = ''; drawGrid();
  };
  $('#pos-wh').onchange = e => { S.wh = e.target.value; drawGrid(); };
  $('#pos-cust').onchange = e => { S.customerId = e.target.value; const a = Eng.account(S.customerId); if (a && a.salesmanId) { S.salesmanId = a.salesmanId; $('#pos-sm').value = a.salesmanId; } };
  $('#pos-sm').onchange = e => { S.salesmanId = e.target.value; };
  $('#pos-newc').onclick = () => V.partyForm('customer', null, a => { S.customerId = a.id; $('#pos-cust').innerHTML = partyOpts('customer', a.id); });
  $('#pos-clear').onclick = async () => { if (!S.cart.length) return; if (await UI.confirm('Clear the cart?', { ok: 'Clear', danger: true })) { S.cart = []; S.discount = 0; drawCart(); } };
  $('#pos-disc').onclick = () => {
    const c = calc();
    UI.formModal({ title: 'Cart discount', icon: 'tag', size: 'sm', saveLabel: 'Apply', fields: UI.fld('Discount type', UI.sel('t', UI.opts([['amt', 'Amount (' + UI.base().code + ')'], ['pct', 'Percent of subtotal']], 0, 1, 'amt')), 'fld-full') + UI.fld('Value', UI.inp('v', S.discount || '', 'type="number" step="any" min="0" autofocus'), 'fld-full') + `<p class="muted sm fld-full">Subtotal: ${UI.money(c.subtotal)}</p>`,
      save: x => { let v = +x.v || 0; if (x.t === 'pct') v = U.r(c.subtotal * v / 100); if (v < 0 || v > c.subtotal) throw new Error('Discount cannot exceed the subtotal.'); S.discount = v; drawCart(); return true; } });
  };
  $('#pos-hold').onclick = () => {
    if (!S.cart.length) return UI.toast('Cart is empty.', 'info');
    UI.formModal({ title: 'Hold order', icon: 'hold', size: 'sm', saveLabel: 'Hold', fields: UI.fld('Label (table, name…)', UI.inp('note', 'Order ' + (d.heldOrders.length + 1)), 'fld-full'),
      save: x => { d.heldOrders.push({ id: U.uid('hold'), date: U.now(), note: x.note, cart: U.clone(S.cart), customerId: S.customerId, salesmanId: S.salesmanId, discount: S.discount, wh: S.wh, total: calc().total }); Store.save(); S.cart = []; S.discount = 0; drawCart(); UI.toast('Order held — recall it any time'); return true; } });
  };
  $('#pos-recall').onclick = () => {
    if (!d.heldOrders.length) return UI.toast('No held orders.', 'info');
    const m = UI.modal({ title: 'Held orders', icon: 'history', body: `<div class="held-list">${d.heldOrders.map(h => `<div class="held" data-id="${h.id}"><div><b>${UI.esc(h.note)}</b><div class="muted sm">${UI.datetime(h.date)} · ${h.cart.length} line(s) · ${UI.esc(accName(h.customerId))}</div></div><b>${UI.money(h.total)}</b><button class="btn btn-primary btn-sm" data-load>Load</button><button class="icon-btn sm" data-del title="Delete">${UI.icon('trash')}</button></div>`).join('')}</div>` });
    m.el.querySelectorAll('.held').forEach(row => {
      const h = d.heldOrders.find(x => x.id === row.dataset.id);
      row.querySelector('[data-load]').onclick = async () => {
        if (S.cart.length && !(await UI.confirm('Replace the current cart with this held order?', { ok: 'Replace' }))) return;
        Object.assign(S, { cart: h.cart, customerId: h.customerId, salesmanId: h.salesmanId, discount: h.discount, wh: h.wh || S.wh });
        d.heldOrders = d.heldOrders.filter(x => x.id !== h.id); Store.save(); m.close(); App.refresh();
      };
      row.querySelector('[data-del]').onclick = () => { d.heldOrders = d.heldOrders.filter(x => x.id !== h.id); Store.save(); row.remove(); drawCart(); if (!d.heldOrders.length) m.close(); };
    });
  };
  $('#pos-pay').onclick = () => {
    if (!S.cart.length) return UI.toast('Add items to the cart first.', 'info');
    V.posPay(S, calc(), () => { S.cart = []; S.discount = 0; S.customerId = d.settings.walkInCustomerId; S.salesmanId = ''; App.refresh(); });
  };
  if (!V._posKeys) {
    V._posKeys = true;
    document.addEventListener('keydown', e => {
      if (!App.route_ || App.route_.name !== 'pos' || document.querySelector('.modal-backdrop')) return;
      if (e.key === 'F2') { e.preventDefault(); const x = document.getElementById('pos-q'); x && x.focus(); }
      if (e.key === 'F9') { e.preventDefault(); const x = document.getElementById('pos-pay'); x && x.click(); }
    });
  }
  drawCats(); drawGrid(); drawCart(); setTimeout(() => q.focus(), 50);
};
V.posPay = (S, c, done) => {
  const d = db(), base = UI.base(), walk = S.customerId === d.settings.walkInCustomerId;
  const banks = Eng.cashAccounts().filter(a => a.kind === 'bank'), cashes = Eng.cashAccounts().filter(a => a.kind === 'cash');
  let method = 'cash';
  UI.modal({ title: 'Payment', icon: 'cash', size: 'lg',
    body: `<div class="pay-total"><span>Amount due</span><b>${UI.money(c.total)}</b><div class="muted sm">${d.currencies.filter(x => !x.base).map(x => UI.money(c.total * x.rate, x.code)).join(' · ')}</div></div>
      <div class="seg" id="pay-seg"><button class="active" data-m="cash">${UI.icon('cash')}Cash</button><button data-m="card">${UI.icon('card')}Card / bank</button><button data-m="credit">${UI.icon('users')}On account</button></div>
      <div data-p="cash"><div class="form-grid">${UI.fld('Received in', `<select id="pay-cur">${UI.opts(d.currencies, 'code', x => x.code + ' — ' + x.name, base.code)}</select>`)}${UI.fld('Amount received', `<input id="pay-recv" type="number" step="any" min="0" class="big-input" value="${U.r(c.total, 2)}">`)}
        ${UI.fld('Cash drawer', `<select id="pay-cash">${UI.opts(cashes, 'id', 'name', Eng.defCash())}</select>`)}</div>
        <div class="quick-amts" id="pay-quick"></div><div class="change-box" id="pay-change"></div></div>
      <div data-p="card" hidden><div class="form-grid">${UI.fld('Bank / card account', `<select id="pay-bank">${UI.opts(banks.length ? banks : Eng.cashAccounts(), 'id', 'name')}</select>`)}${UI.fld('Card / reference no.', '<input id="pay-ref" placeholder="Last 4 digits or ref">')}</div><p class="muted">The full amount ${UI.money(c.total)} will be recorded to the selected account.</p></div>
      <div data-p="credit" hidden>${walk ? `<div class="hint warn">${UI.icon('alert')}Choose a named customer on the POS screen to sell on account.</div>` : `<div class="form-grid">${UI.fld('Customer', `<input readonly value="${UI.esc(accName(S.customerId))}">`)}${UI.fld('Pay now (optional)', '<input id="pay-part" type="number" step="any" min="0" value="0">')}</div><p class="muted">Current balance: ${UI.money(partyBalance(S.customerId))}. The unpaid amount is added to the customer's account.</p>`}</div>`,
    onOpen: me => {
      const g = s => me.querySelector(s);
      const chg = () => {
        const cur = UI.cur(g('#pay-cur').value), recv = +g('#pay-recv').value || 0, recvB = recv / cur.rate, ch = recvB - c.total;
        g('#pay-change').innerHTML = ch >= -0.004 ? `<span>Change</span><b>${UI.money(Math.max(0, ch))}</b>${d.currencies.filter(x => !x.base).map(x => `<small>${UI.money(Math.max(0, ch) * x.rate, x.code)}</small>`).join('')}` : `<span class="neg">Still due</span><b class="neg">${UI.money(-ch)}</b><small>${UI.money(-ch * cur.rate, cur.code)}</small>`;
        g('#pay-change').classList.toggle('bad', ch < -0.004);
      };
      const quick = () => { const cur = UI.cur(g('#pay-cur').value), due = c.total * cur.rate, steps = cur.decimals === 0 ? [50000, 100000, 500000, 1000000] : [5, 10, 20, 50, 100];
        const opts = [due, ...steps.map(s => Math.ceil(due / s) * s)].filter((v, i, a) => a.findIndex(x => Math.abs(x - v) < 1e-6) === i).slice(0, 6);
        g('#pay-quick').innerHTML = opts.map((v, i) => `<button class="chip" data-v="${v}">${i === 0 ? 'Exact ' : ''}${UI.num(v, cur.decimals)}</button>`).join('');
        g('#pay-quick').querySelectorAll('.chip').forEach(b => b.onclick = () => { g('#pay-recv').value = U.r(+b.dataset.v, 4); chg(); }); };
      g('#pay-cur').onchange = () => { g('#pay-recv').value = U.r(c.total * UI.cur(g('#pay-cur').value).rate, 2); quick(); chg(); };
      g('#pay-recv').oninput = chg;
      me.querySelectorAll('#pay-seg button').forEach(b => b.onclick = () => { method = b.dataset.m; me.querySelectorAll('#pay-seg button').forEach(x => x.classList.toggle('active', x === b)); me.querySelectorAll('[data-p]').forEach(p => p.hidden = p.dataset.p !== method); });
      quick(); chg(); setTimeout(() => { g('#pay-recv').select(); }, 60);
    },
    buttons: [{ label: 'Cancel', onClick: m => m.close() }, { label: 'Complete sale', cls: 'btn-primary', icon: 'check', onClick: m => {
      const g = s => m.el.querySelector(s); let paid = c.total, payAcc = Eng.defCash(), tender = null;
      if (method === 'cash') {
        const cur = UI.cur(g('#pay-cur').value), recv = +g('#pay-recv').value || 0, recvB = recv / cur.rate;
        if (recvB < c.total - 0.004) return UI.toast('Amount received is less than the total. Use "On account" for partial payment.', 'error');
        payAcc = g('#pay-cash').value; tender = { label: 'Cash ' + cur.code, given: UI.money(recv, cur.code), change: UI.money(recvB - c.total) };
      } else if (method === 'card') { payAcc = g('#pay-bank').value; tender = { label: 'Card', given: UI.money(c.total), change: UI.money(0) }; }
      else { if (walk) return UI.toast('Select a named customer for on-account sales.', 'error'); paid = Math.min(c.total, +g('#pay-part').value || 0); }
      const inv = UI.try(() => Eng.saveInvoice({ type: 'sale', source: 'pos', date: U.today(), accountId: S.customerId, warehouseId: S.wh, currency: UI.base().code, rate: 1, taxRate: d.settings.taxRate, discount: S.discount, paid, payAccountId: payAcc, salesmanId: S.salesmanId, notes: method === 'card' && g('#pay-ref').value ? 'Card ref ' + g('#pay-ref').value : '', lines: S.cart.map(l => ({ itemId: l.itemId, qty: +l.qty, price: +l.price, disc: +l.disc || 0 })) }));
      if (!inv) return;
      m.close(); done();
      const r = UI.modal({ title: 'Sale completed', icon: 'check', size: 'sm', body: `<div class="done-box">${UI.icon('check')}<b>${inv.no}</b><span>${UI.money(Eng.calc(inv).total)}</span>${tender && method === 'cash' ? `<div class="change-big">Change: ${tender.change}</div>` : ''}${method === 'credit' ? `<div class="muted">Added to ${UI.esc(accName(inv.accountId))}'s account</div>` : ''}</div>`,
        buttons: [{ label: 'View invoice', onClick: x => { x.close(); App.go('invoice/' + inv.id); } }, { label: 'Print receipt', icon: 'printer', onClick: () => UI.print(V.receiptDoc(inv, tender), true) }, { label: 'New sale', cls: 'btn-primary', onClick: x => { x.close(); const q = document.getElementById('pos-q'); q && q.focus(); } }] });
      setTimeout(() => { const b = r.el.querySelector('.modal-foot .btn-primary'); b && b.focus(); }, 60);
    } }] });
};

/* ================= ROOMS ================= */
const ROOM_ST = { available: ['Available', 'green'], occupied: ['Occupied', 'red'], cleaning: ['Cleaning', 'amber'], maintenance: ['Maintenance', 'gray'] };
V.rooms = (el, [tab = 'board'], q) => {
  const d = db(), filter = q.st || '';
  const head = UI.head({ title: 'Rooms', icon: 'bed', crumbs: [['Sales & POS', 'pos'], ['Rooms']], actions: UI.btn('Add room', { icon: 'plus', cls: 'btn-primary', attrs: 'id="rm-add"' }) }) +
    UI.tabs([['board', 'Room board'], ['history', 'Stay history', d.stays.filter(s => s.status === 'closed').length], ['manage', 'Manage rooms', d.rooms.length]], tab, 'rooms');
  if (tab === 'board') {
    const cnt = k => d.rooms.filter(r => r.status === k).length;
    const floors = [...new Set(d.rooms.map(r => r.floor))].sort();
    el.innerHTML = head + `<div class="legend">${Object.entries(ROOM_ST).map(([k, [l]]) => `<button class="chip st-${k} ${filter === k ? 'active' : ''}" data-st="${k}"><span class="sdot"></span>${l} <b>${cnt(k)}</b></button>`).join('')}${filter ? '<button class="chip" data-st="">Show all</button>' : ''}</div>
      ${floors.map(f => { const rs = d.rooms.filter(r => r.floor === f && (!filter || r.status === filter)); return rs.length ? `<div class="floor"><div class="section-label">Floor ${UI.esc(f)}</div><div class="rooms-grid">${rs.map(r => {
        const s = d.stays.find(x => x.roomId === r.id && x.status === 'open'), nights = s ? Math.max(1, U.daysBetween(s.checkIn, U.today())) : 0, bill = s ? nights * r.rate + U.sum(s.orders, o => o.qty * o.price) : 0;
        return `<button class="room st-${r.status}" data-id="${r.id}"><div class="room-top"><b>${UI.esc(r.name)}</b>${UI.icon(r.status === 'occupied' ? 'user' : r.status === 'cleaning' ? 'sparkle' : r.status === 'maintenance' ? 'settings' : 'door')}</div>
          <div class="room-type">${UI.esc(r.type)} · ${UI.money(r.rate)}/night</div>${s ? `<div class="room-guest">${UI.esc(s.guest)}</div><div class="room-bill">${nights} night(s) · ${UI.money(bill)}</div>` : `<div class="room-st">${ROOM_ST[r.status][0]}</div>`}</button>`; }).join('')}</div></div>` : ''; }).join('') || UI.empty('No rooms match this filter.', 'bed')}`;
    el.querySelectorAll('[data-st]').forEach(b => b.onclick = () => App.go('rooms/board' + (b.dataset.st ? '?st=' + b.dataset.st : '')));
    el.querySelectorAll('.room').forEach(b => b.onclick = () => V.roomClick(b.dataset.id));
  } else if (tab === 'history') {
    el.innerHTML = head + '<div class="card"><div id="rm-tbl"></div></div>';
    UI.mountTable(el.querySelector('#rm-tbl'), { rows: d.stays.filter(s => s.status === 'closed').reverse(), csv: 'room-stays', empty: 'No completed stays yet.', onRow: r => r.invoiceId && App.go('invoice/' + r.invoiceId),
      columns: [{ key: 'room', label: 'Room', text: r => (Eng.get('rooms', r.roomId) || {}).name || '' }, { key: 'guest', label: 'Guest' }, { key: 'in', label: 'Check-in', text: r => UI.datetime(r.checkIn), sortVal: r => r.checkIn }, { key: 'out', label: 'Check-out', text: r => UI.datetime(r.checkOut), sortVal: r => r.checkOut },
        { key: 'inv', label: 'Invoice', render: r => r.invoiceId ? `<a class="link">${(Eng.get('invoices', r.invoiceId) || {}).no || ''}</a>` : '', text: r => (Eng.get('invoices', r.invoiceId) || {}).no || '' }, { key: 't', label: 'Total', align: 'r', text: r => { const i = Eng.get('invoices', r.invoiceId); return i ? UI.num(Eng.calc(i).total) : ''; } }] });
  } else {
    el.innerHTML = head + '<div class="card"><div id="rm-tbl"></div></div>';
    UI.mountTable(el.querySelector('#rm-tbl'), { rows: d.rooms, onRow: r => V.roomForm(r),
      columns: [{ key: 'name', label: 'Room', render: r => `<b>${UI.esc(r.name)}</b>` }, { key: 'type', label: 'Type' }, { key: 'floor', label: 'Floor' }, { key: 'capacity', label: 'Capacity', align: 'r' }, { key: 'rate', label: 'Rate / night', align: 'r', text: r => UI.num(r.rate) },
        { key: 'status', label: 'Status', render: r => UI.badge(ROOM_ST[r.status][0], ROOM_ST[r.status][1]), text: r => r.status }, { key: 'a', label: '', sort: false, render: () => `<button class="icon-btn sm" data-act="del" title="Delete">${UI.icon('trash')}</button>` }],
      onAction: async (act, r) => { if (r.status === 'occupied') return UI.toast('Check the guest out first.', 'warn'); if (await UI.confirm(`Delete room ${r.name}?`, { danger: true, ok: 'Delete' })) { d.rooms = d.rooms.filter(x => x.id !== r.id); Store.save(); App.refresh(); } } });
  }
  el.querySelector('#rm-add').onclick = () => V.roomForm();
};
V.roomForm = r => {
  const d = db(), isNew = !r; r = r || { name: '', type: 'Standard', floor: '1', rate: 60, capacity: 2, status: 'available' };
  UI.formModal({ title: isNew ? 'Add room' : 'Edit room ' + r.name, icon: 'bed', fields: UI.fld('Room no. / name *', UI.inp('name', r.name)) + UI.fld('Type', UI.inp('type', r.type, 'list="dl-rt"') + '<datalist id="dl-rt"><option>Standard<option>Twin<option>Deluxe<option>Family<option>Suite<option>Table<option>VIP Table</datalist>') +
    UI.fld('Floor / area', UI.inp('floor', r.floor)) + UI.fld('Capacity', UI.inp('capacity', r.capacity, 'type="number" min="1"')) + UI.fld('Rate per night (' + UI.base().code + ')', UI.inp('rate', r.rate, 'type="number" step="any" min="0"')) +
    (r.status === 'occupied' ? '' : UI.fld('Status', UI.sel('status', UI.opts(Object.entries(ROOM_ST).filter(([k]) => k !== 'occupied').map(([k, v]) => [k, v[0]]), 0, 1, r.status)))),
    save: x => { if (!x.name) throw new Error('Room name is required.'); if (d.rooms.some(y => y.name === x.name && y.id !== r.id)) throw new Error('Room ' + x.name + ' already exists.');
      const o = isNew ? { id: U.uid('rm') } : Eng.get('rooms', r.id); Object.assign(o, { name: x.name, type: x.type, floor: x.floor || '1', capacity: +x.capacity || 1, rate: +x.rate || 0 }); if (x.status) o.status = x.status; if (isNew) d.rooms.push(o);
      Store.save(); UI.toast('Room saved'); App.refresh(); return true; } });
};
V.roomClick = id => {
  const d = db(), r = Eng.get('rooms', id);
  if (r.status === 'available') return UI.formModal({ title: 'Check in — Room ' + r.name, icon: 'door', saveLabel: 'Check in',
    fields: UI.fld('Guest name *', UI.inp('guest', '', 'autofocus'), 'fld-2') + UI.fld('Phone', UI.inp('phone', '')) + UI.fld('Persons', UI.inp('persons', 1, `type="number" min="1" max="${r.capacity || 9}"`)) +
      UI.fld('Bill to account', UI.sel('accountId', partyOpts('customer', d.settings.walkInCustomerId))) + UI.fld('Check-in', UI.inp('checkIn', new Date(Date.now() - new Date().getTimezoneOffset() * 6e4).toISOString().slice(0, 16), 'type="datetime-local"')),
    extraButtons: [{ label: 'Set maintenance', icon: 'settings', onClick: m => { r.status = 'maintenance'; Store.save(); m.close(); App.refresh(); } }],
    save: x => { if (!x.guest) throw new Error('Guest name is required.');
      const s = { id: U.uid('st'), roomId: r.id, guest: x.guest, phone: x.phone, persons: +x.persons || 1, accountId: x.accountId, checkIn: new Date(x.checkIn).toISOString(), status: 'open', orders: [] };
      d.stays.push(s); r.status = 'occupied'; Eng.audit('Check-in', `Room ${r.name} — ${x.guest}`); Store.save(); UI.toast(`${x.guest} checked in to room ${r.name}`); App.refresh(); setTimeout(() => V.roomStay(s.id), 50); return true; } });
  if (r.status === 'occupied') { const s = d.stays.find(x => x.roomId === r.id && x.status === 'open'); if (s) return V.roomStay(s.id); r.status = 'available'; Store.save(); return App.refresh(); }
  UI.modal({ title: 'Room ' + r.name + ' — ' + ROOM_ST[r.status][0], icon: r.status === 'cleaning' ? 'sparkle' : 'settings', size: 'sm',
    body: `<p>${r.status === 'cleaning' ? 'Housekeeping is cleaning this room. Mark it ready when done.' : 'This room is out of service for maintenance.'}</p>`,
    buttons: [{ label: r.status === 'cleaning' ? 'Set maintenance' : 'Send to cleaning', onClick: m => { r.status = r.status === 'cleaning' ? 'maintenance' : 'cleaning'; Store.save(); m.close(); App.refresh(); } },
      { label: 'Mark available', cls: 'btn-primary', icon: 'check', onClick: m => { r.status = 'available'; Eng.audit('Room ready', r.name); Store.save(); m.close(); App.refresh(); UI.toast('Room ' + r.name + ' is available'); } }] });
};
V.roomStay = sid => {
  const d = db(), s = Eng.get('stays', sid), r = Eng.get('rooms', s.roomId);
  const nights = Math.max(1, U.daysBetween(s.checkIn, U.today()));
  const ordersTot = () => U.sum(s.orders, o => o.qty * o.price);
  const m = UI.modal({ title: `Room ${r.name} — ${s.guest}`, icon: 'bed', size: 'xl',
    body: `<div class="stay-head">${docMeta([['Guest', UI.esc(s.guest)], ['Phone', UI.esc(s.phone || '—')], ['Persons', s.persons], ['Checked in', UI.datetime(s.checkIn)], ['Nights so far', nights], ['Bill to', UI.esc(accName(s.accountId))]])}</div>
      <div class="row between"><div class="section-label">Room service / orders</div><div class="input-group add-order"><input list="dl-stay" id="so-item" placeholder="Add item — type code or name">${UI.itemDatalist('dl-stay', i => i.type !== 'raw' && !i.sys)}<input id="so-qty" type="number" min="1" value="1" style="width:70px"><button class="btn btn-primary btn-sm" id="so-add">${UI.icon('plus')}<span>Add</span></button></div></div>
      <div id="so-list"></div><div class="stay-sum" id="so-sum"></div>`,
    onOpen: me => {
      const list = () => {
        me.querySelector('#so-list').innerHTML = s.orders.length ? `<table class="tbl"><thead><tr><th>Time</th><th>Item</th><th class="r">Qty</th><th class="r">Price</th><th class="r">Amount</th><th></th></tr></thead><tbody>${s.orders.map((o, i) => `<tr><td class="muted sm">${UI.datetime(o.time)}</td><td>${UI.esc((Eng.item(o.itemId) || {}).name || '')}</td><td class="r">${UI.qty(o.qty)}</td><td class="r">${UI.num(o.price)}</td><td class="r">${UI.num(o.qty * o.price)}</td><td><button class="icon-btn sm" data-rm="${i}" title="Remove">${UI.icon('x')}</button></td></tr>`).join('')}</tbody></table>` : UI.empty('No orders yet.', 'pos');
        me.querySelector('#so-sum').innerHTML = `<div><span>Room ${nights} × ${UI.money(r.rate)}</span><b>${UI.money(nights * r.rate)}</b></div><div><span>Orders</span><b>${UI.money(ordersTot())}</b></div><div class="grand"><span>Running bill (before tax)</span><b>${UI.money(nights * r.rate + ordersTot())}</b></div>`;
        me.querySelectorAll('[data-rm]').forEach(b => b.onclick = () => { s.orders.splice(+b.dataset.rm, 1); Store.save(); list(); });
      };
      const addOrder = () => { const it = UI.findItem(me.querySelector('#so-item').value), qn = +me.querySelector('#so-qty').value || 1; if (!it) return UI.toast('Choose an item.', 'warn');
        s.orders.push({ id: U.uid('o'), itemId: it.id, qty: qn, price: it.price, time: U.now() }); Store.save(); me.querySelector('#so-item').value = ''; me.querySelector('#so-qty').value = 1; list(); me.querySelector('#so-item').focus(); };
      me.querySelector('#so-add').onclick = addOrder; me.querySelector('#so-item').onkeydown = e => { if (e.key === 'Enter') { e.preventDefault(); addOrder(); } };
      list();
    },
    buttons: [{ label: 'Move room', icon: 'exchange', onClick: x => {
        const free = d.rooms.filter(y => y.status === 'available'); if (!free.length) return UI.toast('No available rooms.', 'warn');
        UI.formModal({ title: 'Move guest', icon: 'exchange', size: 'sm', saveLabel: 'Move', fields: UI.fld('Move to room', UI.sel('to', UI.opts(free, 'id', y => y.name + ' — ' + y.type + ' (' + UI.money(y.rate) + ')')), 'fld-full'),
          save: y => { const to = Eng.get('rooms', y.to); r.status = 'cleaning'; to.status = 'occupied'; s.roomId = to.id; Eng.audit('Room move', `${s.guest}: ${r.name} → ${to.name}`); Store.save(); x.close(); App.refresh(); UI.toast('Guest moved to room ' + to.name); return true; } });
      } },
      { label: 'Edit guest', icon: 'edit', onClick: x => UI.formModal({ title: 'Edit guest', icon: 'user', fields: UI.fld('Guest name', UI.inp('guest', s.guest)) + UI.fld('Phone', UI.inp('phone', s.phone)) + UI.fld('Persons', UI.inp('persons', s.persons, 'type="number" min="1"')) + UI.fld('Bill to account', UI.sel('accountId', partyOpts('customer', s.accountId))),
          save: y => { if (!y.guest) throw new Error('Guest name is required.'); Object.assign(s, { guest: y.guest, phone: y.phone, persons: +y.persons || 1, accountId: y.accountId }); Store.save(); x.close(); App.refresh(); V.roomStay(sid); return true; } }) },
      { label: 'Check out', cls: 'btn-primary', icon: 'logout', onClick: x => { x.close(); V.roomCheckout(sid, nights); } }] });
  return m;
};
V.roomCheckout = (sid, nights) => {
  const d = db(), s = Eng.get('stays', sid), r = Eng.get('rooms', s.roomId);
  const sub = () => (+document.getElementById('co-n').value || 0) * r.rate + U.sum(s.orders, o => o.qty * o.price);
  UI.modal({ title: `Check out — Room ${r.name}`, icon: 'logout', size: 'lg',
    body: `<form class="form-grid" id="co-f">${UI.fld('Nights to charge', `<input id="co-n" name="nights" type="number" min="0" value="${nights}">`)}${UI.fld('Bill to', UI.sel('accountId', partyOpts('customer', s.accountId)))}
      ${UI.fld('Discount (' + UI.base().code + ')', UI.inp('discount', 0, 'type="number" step="any" min="0"'))}${UI.fld('Tax %', UI.inp('taxRate', d.settings.taxRate, 'type="number" step="any" min="0"'))}
      ${UI.fld('Amount paid now', UI.inp('paid', '', 'type="number" step="any" min="0"'))}${UI.fld('Paid to', UI.sel('payAccountId', UI.opts(Eng.cashAccounts(), 'id', 'name', Eng.defCash())))}
      ${UI.fld('Salesman', UI.sel('salesmanId', UI.opts(d.salesmen, 'id', 'name', '', '— None —')))}</form><div class="stay-sum" id="co-sum"></div>`,
    onOpen: me => {
      const f = me.querySelector('#co-f'), up = () => { const sb = sub(), net = sb - (+f.discount.value || 0), tax = net * (+f.taxRate.value || 0) / 100, tot = U.r(net + tax);
        me.querySelector('#co-sum').innerHTML = `<div><span>Room ${+f.nights.value || 0} × ${UI.money(r.rate)}</span><b>${UI.money((+f.nights.value || 0) * r.rate)}</b></div><div><span>Orders (${s.orders.length})</span><b>${UI.money(U.sum(s.orders, o => o.qty * o.price))}</b></div><div><span>Discount</span><b>− ${UI.money(+f.discount.value || 0)}</b></div><div><span>Tax</span><b>${UI.money(tax)}</b></div><div class="grand"><span>Total</span><b>${UI.money(tot)}</b></div>`;
        if (f.paid.dataset.touched !== '1') f.paid.value = tot; };
      f.paid.oninput = () => f.paid.dataset.touched = '1';
      f.nights.oninput = f.discount.oninput = f.taxRate.oninput = up; up();
    },
    buttons: [{ label: 'Back', onClick: m => { m.close(); V.roomStay(sid); } }, { label: 'Check out & bill', cls: 'btn-primary', icon: 'check', onClick: m => {
      const x = UI.formData(m.el.querySelector('#co-f')); const inv = UI.try(() => Eng.checkout(sid, x));
      if (!inv) return; m.close(); UI.toast(`Checked out. Invoice ${inv.no} created — room set to cleaning.`); App.refresh();
      UI.modal({ title: 'Checkout complete', icon: 'check', size: 'sm', body: `<div class="done-box">${UI.icon('check')}<b>${inv.no}</b><span>${UI.money(Eng.calc(inv).total)}</span><div class="muted">${Eng.statusOf(inv)}</div></div>`,
        buttons: [{ label: 'Print invoice', icon: 'printer', onClick: () => UI.print(V.invoiceDoc(inv)) }, { label: 'View invoice', cls: 'btn-primary', onClick: y => { y.close(); App.go('invoice/' + inv.id); } }] });
    } }] });
};

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
