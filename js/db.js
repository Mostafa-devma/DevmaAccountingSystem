/* Devma Accounting System — data store, accounting & stock engine, demo seed */
'use strict';
const DB_KEY = 'devma_db_v1';
const SNAP_KEY = 'devma_snapshots_v1';

/* ---------------- Utilities ---------------- */
const U = {
  uid(p = 'id') { return p + '_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8); },
  r(n, d = 2) { const f = Math.pow(10, d); return Math.round(((Number(n) || 0) + (n >= 0 ? Number.EPSILON : -Number.EPSILON)) * f) / f; },
  iso(d) { const z = new Date(d.getTime() - d.getTimezoneOffset() * 60000); return z.toISOString().slice(0, 10); },
  today() { return U.iso(new Date()); },
  addDays(s, n) { const d = new Date(s + 'T12:00:00'); d.setDate(d.getDate() + n); return U.iso(d); },
  monthStart(s) { return (s || U.today()).slice(0, 8) + '01'; },
  yearStart(s) { return (s || U.today()).slice(0, 5) + '01-01'; },
  now() { return new Date().toISOString(); },
  sum(a, f) { return a.reduce((t, x) => t + (Number(f ? f(x) : x) || 0), 0); },
  clone(o) { return JSON.parse(JSON.stringify(o)); },
  daysBetween(a, b) { return Math.round((new Date(b.slice(0, 10) + 'T12:00:00') - new Date(a.slice(0, 10) + 'T12:00:00')) / 864e5); },
};

/* ---------------- Store ---------------- */
const Store = {
  data: null,
  load() {
    try { const raw = localStorage.getItem(DB_KEY); this.data = raw ? JSON.parse(raw) : null; } catch (e) { this.data = null; }
    if (!this.data || !this.data.version) { Seed.demo(); this.save(); }
    this.migrate();
    return this.data;
  },
  migrate() {
    const b = Seed.blank();
    for (const k in b) if (this.data[k] === undefined) this.data[k] = b[k];
    for (const k in b.settings) if (this.data.settings[k] === undefined) this.data.settings[k] = b.settings[k];
  },
  save() {
    try { localStorage.setItem(DB_KEY, JSON.stringify(this.data)); return true; }
    catch (e) { console.error(e); if (window.UI) UI.toast('Browser storage is full — download a backup and delete old snapshots.', 'error'); return false; }
  },
  replace(data) { this.data = data; this.migrate(); this.save(); },
};
const db = () => Store.data;

/* ---------------- Snapshots (local backups) ---------------- */
const Snapshots = {
  list() { try { return JSON.parse(localStorage.getItem(SNAP_KEY) || '[]'); } catch (e) { return []; } },
  write(l) { try { localStorage.setItem(SNAP_KEY, JSON.stringify(l)); return true; } catch (e) { return false; } },
  create(label) {
    const data = JSON.stringify(db());
    const l = this.list();
    l.unshift({ id: U.uid('snap'), date: U.now(), label: label || 'Manual snapshot', size: data.length, data });
    while (l.length > 5) l.pop();
    while (!this.write(l) && l.length > 1) l.pop();
    return l[0];
  },
  get(id) { return this.list().find(s => s.id === id); },
  remove(id) { this.write(this.list().filter(s => s.id !== id)); },
};

/* ---------------- Engine ---------------- */
const Eng = {
  A(sys) { return 'acc_' + sys; },
  item(id) { return db().items.find(x => x.id === id); },
  account(id) { return db().accounts.find(x => x.id === id); },
  get(coll, id) { return (db()[coll] || []).find(x => x.id === id); },
  user() { return (window.App && App.user) ? App.user.username : 'system'; },
  nextNo(key, prefix, pad = 5) { const c = db().counters; c[key] = (c[key] || 0) + 1; return prefix + String(c[key]).padStart(pad, '0'); },
  audit(action, detail) {
    const d = db(); d.audit.unshift({ id: U.uid('log'), date: U.now(), user: this.user(), action, detail });
    if (d.audit.length > 600) d.audit.length = 600;
  },
  notify(title, body, link, kind = 'info') {
    const n = db().notifications; n.unshift({ id: U.uid('nt'), date: U.now(), title, body, link, kind, read: false });
    if (n.length > 100) n.length = 100;
  },

  /* transaction: rolls back all changes if anything throws */
  _depth: 0,
  tx(fn) {
    if (this._depth) return fn();
    const snap = JSON.stringify(db()); this._depth++;
    try { const r = fn(); this._depth--; Store.save(); return r; }
    catch (e) { this._depth--; Store.data = JSON.parse(snap); throw e; }
  },

  /* ---------- Ledger ---------- */
  post({ date, memo, refType, refId, ref, lines }) {
    lines = lines.map(l => ({ accountId: l.accountId, debit: U.r(l.debit), credit: U.r(l.credit), note: l.note || '' }));
    lines.forEach(l => {
      if (l.debit < 0) { l.credit = U.r(l.credit - l.debit); l.debit = 0; }
      if (l.credit < 0) { l.debit = U.r(l.debit - l.credit); l.credit = 0; }
    });
    lines = lines.filter(l => l.debit || l.credit);
    if (!lines.length) return null;
    lines.forEach(l => { if (!this.account(l.accountId)) throw new Error('Unknown account in journal entry.'); });
    const dr = U.r(U.sum(lines, l => l.debit)), cr = U.r(U.sum(lines, l => l.credit));
    const diff = U.r(dr - cr);
    if (diff !== 0) {
      if (Math.abs(diff) > 0.05) throw new Error('Journal entry is not balanced (Debit ' + dr + ' / Credit ' + cr + ').');
      if (diff > 0) { const f = lines.find(l => l.credit); f.credit = U.r(f.credit + diff); }
      else { const f = lines.find(l => l.debit); f.debit = U.r(f.debit - diff); }
    }
    const je = { id: U.uid('je'), no: this.nextNo('je', 'JE-'), date, memo, refType: refType || null, refId: refId || null, ref: ref || '', lines, created: U.now(), user: this.user() };
    db().journal.push(je);
    return je;
  },
  unpost(refType, refId) { const d = db(); d.journal = d.journal.filter(j => !(j.refType === refType && j.refId === refId)); },
  childMap() { const m = {}; db().accounts.forEach(a => { if (a.parentId) (m[a.parentId] = m[a.parentId] || []).push(a.id); }); return m; },
  descendants(id, map) { map = map || this.childMap(); const out = [id]; (map[id] || []).forEach(c => out.push(...this.descendants(c, map))); return out; },
  totals({ from, to } = {}) {
    const m = {};
    db().journal.forEach(j => {
      if (from && j.date < from) return; if (to && j.date > to) return;
      j.lines.forEach(l => { const t = m[l.accountId] || (m[l.accountId] = { dr: 0, cr: 0 }); t.dr += l.debit; t.cr += l.credit; });
    });
    return m;
  },
  /* debit minus credit, including sub-accounts */
  balance(accId, opts = {}) {
    const t = opts.totals || this.totals(opts), ids = this.descendants(accId, opts.map);
    let b = 0; ids.forEach(i => { if (t[i]) b += t[i].dr - t[i].cr; }); return U.r(b);
  },
  /* balance expressed in the account's natural direction */
  natural(acc, dc) { return ['asset', 'expense'].includes(acc.type) ? dc : -dc; },
  cashAccounts() { return db().accounts.filter(a => (a.kind === 'cash' || a.kind === 'bank') && a.active !== false); },
  parties(kind) { return db().accounts.filter(a => a.kind === kind && a.active !== false); },

  /* ---------- Stock ---------- */
  move(m) {
    const it = this.item(m.itemId);
    if (!it) throw new Error('Unknown item.');
    if (!m.warehouseId) throw new Error('Choose a warehouse.');
    if (m.qty < 0 && it.type !== 'service' && !db().settings.allowNegative) {
      const avail = this.qty(m.itemId, m.warehouseId);
      if (avail + m.qty < -0.0001) {
        const wh = this.get('warehouses', m.warehouseId);
        throw new Error(`Not enough stock for "${it.name}" in ${wh ? wh.name : 'warehouse'} (available ${U.r(avail, 3)}, needed ${U.r(-m.qty, 3)}).`);
      }
    }
    const mv = Object.assign({ id: U.uid('mv'), created: U.now() }, m);
    mv.qty = U.r(mv.qty, 4); mv.cost = U.r(mv.cost || 0, 4);
    db().stockMoves.push(mv);
    return mv;
  },
  unmove(refType, refId) { const d = db(); d.stockMoves = d.stockMoves.filter(m => !(m.refType === refType && m.refId === refId)); },
  qty(itemId, whId) { let q = 0; db().stockMoves.forEach(m => { if (m.itemId === itemId && (!whId || m.warehouseId === whId)) q += m.qty; }); return U.r(q, 4); },
  stockMap() {
    const byItem = {}, byWh = {};
    db().stockMoves.forEach(m => { byItem[m.itemId] = (byItem[m.itemId] || 0) + m.qty; const k = m.itemId + '|' + m.warehouseId; byWh[k] = (byWh[k] || 0) + m.qty; });
    return { item: id => U.r(byItem[id] || 0, 4), at: (id, wh) => U.r(byWh[id + '|' + wh] || 0, 4) };
  },
  avgCost(item, addQty, unitCost) {
    const q = Math.max(this.qty(item.id), 0), tot = q + addQty;
    if (tot > 0 && addQty > 0) item.cost = U.r((q * (+item.cost || 0) + addQty * unitCost) / tot, 4);
  },
  defWh() { const s = db().settings; return (s.defaultWarehouseId && this.get('warehouses', s.defaultWarehouseId)) ? s.defaultWarehouseId : (db().warehouses[0] && db().warehouses[0].id); },
  defCash() { const s = db().settings; return (s.defaultCashAccountId && this.account(s.defaultCashAccountId)) ? s.defaultCashAccountId : this.A('cash'); },
  lowStock() {
    const sm = this.stockMap();
    return db().items.filter(i => i.type !== 'service' && i.active !== false && +i.minQty > 0 && sm.item(i.id) <= +i.minQty).map(i => ({ item: i, qty: sm.item(i.id) }));
  },

  /* ---------- Invoices ---------- */
  INV: {
    sale: { label: 'Sales Invoice', plural: 'Sales Invoices', prefix: 'SI-', party: 'customer' },
    purchase: { label: 'Purchase Invoice', plural: 'Purchase Invoices', prefix: 'PI-', party: 'supplier' },
    sale_return: { label: 'Sales Return', plural: 'Sales Returns', prefix: 'SR-', party: 'customer' },
    purchase_return: { label: 'Purchase Return', plural: 'Purchase Returns', prefix: 'PR-', party: 'supplier' },
  },
  calc(inv) {
    const lines = (inv.lines || []).filter(l => l.itemId).map(l => {
      const g = (+l.qty || 0) * (+l.price || 0);
      return Object.assign({}, l, { amount: U.r(g - g * (+l.disc || 0) / 100) });
    });
    const subtotal = U.r(U.sum(lines, l => l.amount)), discount = U.r(+inv.discount || 0);
    const net = U.r(subtotal - discount), tax = U.r(net * (+inv.taxRate || 0) / 100), total = U.r(net + tax);
    return { lines, subtotal, discount, net, tax, total };
  },
  paidOf(inv) {
    const r = +inv.rate || 1;
    return U.r((+inv.paid || 0) + U.sum(db().vouchers.filter(v => v.invoiceId === inv.id), v => (+v.amount / (+v.rate || 1)) * r));
  },
  dueOf(inv) { return U.r(this.calc(inv).total - this.paidOf(inv)); },
  statusOf(inv) {
    const t = this.calc(inv).total, p = this.paidOf(inv);
    if (p >= t - 0.004) return 'Paid';
    return p > 0.004 ? 'Partial' : 'Unpaid';
  },
  saveInvoice(src) {
    return this.tx(() => {
      const d = db(), inv = U.clone(src);
      inv.lines = (inv.lines || []).filter(l => l.itemId && +l.qty > 0);
      if (!inv.lines.length) throw new Error('Add at least one item with a quantity greater than zero.');
      if (!inv.date) throw new Error('Choose an invoice date.');
      if (!inv.accountId) inv.accountId = this.INV[inv.type].party === 'customer' ? d.settings.walkInCustomerId : null;
      if (!inv.accountId) throw new Error('Choose a ' + this.INV[inv.type].party + '.');
      const total = this.calc(inv).total;
      if (+inv.paid > total + 0.004) throw new Error('Paid amount cannot exceed the invoice total.');
      const idx = inv.id ? d.invoices.findIndex(x => x.id === inv.id) : -1;
      if (idx < 0) {
        inv.id = U.uid('inv'); inv.no = this.nextNo('inv_' + inv.type, this.INV[inv.type].prefix);
        inv.created = U.now(); inv.createdBy = this.user(); d.invoices.push(inv);
      } else {
        this.unpost('invoice', inv.id); this.unmove('invoice', inv.id);
        inv.updated = U.now(); d.invoices[idx] = inv;
      }
      this.postInvoice(inv);
      this.audit(idx < 0 ? 'Created' : 'Updated', this.INV[inv.type].label + ' ' + inv.no);
      return inv;
    });
  },
  postInvoice(inv) {
    const T = this.INV[inv.type], c = this.calc(inv), rate = +inv.rate || 1, B = x => x / rate;
    const party = inv.accountId, wh = inv.warehouseId || this.defWh(), pay = inv.payAccountId || this.defCash();
    const isSale = inv.type === 'sale' || inv.type === 'sale_return', isRet = inv.type.endsWith('_return');
    const factor = c.subtotal ? c.net / c.subtotal : 0;
    const rev = {}; let cogs = 0, stockNet = 0, servNet = 0;
    inv.warehouseId = wh;
    c.lines.forEach((l, i) => {
      const it = this.item(l.itemId); if (!it) throw new Error('An invoice line refers to a deleted item.');
      const qty = +l.qty, netB = B(l.amount * factor), stock = it.type !== 'service';
      const mv = { date: inv.date, itemId: it.id, warehouseId: wh, type: inv.type, refType: 'invoice', refId: inv.id, ref: inv.no };
      if (isSale) {
        const ra = this.A(isRet ? 'sales_ret' : (it.revenueSys || 'sales'));
        rev[ra] = (rev[ra] || 0) + netB;
        if (stock) { const uc = +it.cost || 0; inv.lines[i].cost = uc; cogs += qty * uc; this.move(Object.assign(mv, { qty: isRet ? qty : -qty, cost: uc })); }
      } else if (stock) {
        const uc = qty ? netB / qty : 0; stockNet += netB;
        if (!isRet) this.avgCost(it, qty, uc);
        this.move(Object.assign(mv, { qty: isRet ? -qty : qty, cost: uc }));
      } else servNet += netB;
    });
    const L = [], dr = (a, v) => L.push({ accountId: a, debit: v, credit: 0 }), cr = (a, v) => L.push({ accountId: a, debit: 0, credit: v });
    const totB = B(c.total), taxB = B(c.tax), paidB = B(+inv.paid || 0), A = s => this.A(s);
    if (inv.type === 'sale') {
      dr(party, totB); for (const a in rev) cr(a, rev[a]); cr(A('vat_out'), taxB);
      dr(A('cogs'), cogs); cr(A('inventory'), cogs);
      if (paidB) { dr(pay, paidB); cr(party, paidB); }
    } else if (inv.type === 'sale_return') {
      cr(party, totB); for (const a in rev) dr(a, rev[a]); dr(A('vat_out'), taxB);
      dr(A('inventory'), cogs); cr(A('cogs'), cogs);
      if (paidB) { dr(party, paidB); cr(pay, paidB); }
    } else if (inv.type === 'purchase') {
      dr(A('inventory'), stockNet); dr(A('general_exp'), servNet); dr(A('vat_in'), taxB); cr(party, totB);
      if (paidB) { dr(party, paidB); cr(pay, paidB); }
    } else {
      cr(A('inventory'), stockNet); cr(A('general_exp'), servNet); cr(A('vat_in'), taxB); dr(party, totB);
      if (paidB) { dr(pay, paidB); cr(party, paidB); }
    }
    const pa = this.account(party);
    this.post({ date: inv.date, memo: T.label + ' ' + inv.no + (pa ? ' — ' + pa.name : ''), refType: 'invoice', refId: inv.id, ref: inv.no, lines: L });
  },
  deleteInvoice(id) {
    return this.tx(() => {
      const d = db(), inv = this.get('invoices', id); if (!inv) return;
      this.unpost('invoice', id); this.unmove('invoice', id);
      d.vouchers.forEach(v => { if (v.invoiceId === id) v.invoiceId = null; });
      d.invoices = d.invoices.filter(x => x.id !== id);
      this.audit('Deleted', this.INV[inv.type].label + ' ' + inv.no);
    });
  },

  /* ---------- Vouchers ---------- */
  VCH: {
    receipt: { label: 'Receipt Voucher', plural: 'Receipt Vouchers', prefix: 'RV-' },
    payment: { label: 'Payment Voucher', plural: 'Payment Vouchers', prefix: 'PV-' },
    journal: { label: 'Journal Voucher', plural: 'Journal Vouchers', prefix: 'JV-' },
  },
  saveVoucher(src) {
    return this.tx(() => {
      const d = db(), v = U.clone(src), T = this.VCH[v.type];
      if (!v.date) throw new Error('Choose a date.');
      let lines;
      if (v.type === 'journal') {
        v.lines = (v.lines || []).filter(l => l.accountId && (+l.debit || +l.credit));
        if (v.lines.length < 2) throw new Error('A journal voucher needs at least two lines.');
        const dr = U.r(U.sum(v.lines, l => l.debit)), cr = U.r(U.sum(v.lines, l => l.credit));
        if (dr !== cr) throw new Error(`Debits (${dr}) must equal credits (${cr}).`);
        v.amount = dr; v.rate = 1; lines = v.lines.map(l => ({ accountId: l.accountId, debit: +l.debit || 0, credit: +l.credit || 0, note: l.note }));
      } else {
        if (!v.accountId) throw new Error('Choose the account.');
        if (!v.cashAccountId) throw new Error('Choose the cash / bank account.');
        if (!(+v.amount > 0)) throw new Error('Amount must be greater than zero.');
        if (v.accountId === v.cashAccountId) throw new Error('Account and cash account must be different.');
        const amt = +v.amount / (+v.rate || 1);
        lines = v.type === 'receipt'
          ? [{ accountId: v.cashAccountId, debit: amt, credit: 0 }, { accountId: v.accountId, debit: 0, credit: amt }]
          : [{ accountId: v.accountId, debit: amt, credit: 0 }, { accountId: v.cashAccountId, debit: 0, credit: amt }];
      }
      const idx = v.id ? d.vouchers.findIndex(x => x.id === v.id) : -1;
      if (idx < 0) { v.id = U.uid('vch'); v.no = this.nextNo('vch_' + v.type, T.prefix); v.created = U.now(); v.createdBy = this.user(); d.vouchers.push(v); }
      else { this.unpost('voucher', v.id); d.vouchers[idx] = v; }
      const a = this.account(v.accountId);
      this.post({ date: v.date, memo: v.memo || (T.label + (a ? ' — ' + a.name : '')), refType: 'voucher', refId: v.id, ref: v.no, lines });
      this.audit(idx < 0 ? 'Created' : 'Updated', T.label + ' ' + v.no);
      return v;
    });
  },
  deleteVoucher(id) {
    return this.tx(() => {
      const v = this.get('vouchers', id); if (!v) return;
      this.unpost('voucher', id); db().vouchers = db().vouchers.filter(x => x.id !== id);
      this.audit('Deleted', this.VCH[v.type].label + ' ' + v.no);
    });
  },

  /* ---------- Stock adjustments (update / waste / opening / count) ---------- */
  ADJ: {
    increase: { label: 'Stock Increase', counter: 'adjust', sign: 1 },
    decrease: { label: 'Stock Decrease', counter: 'adjust', sign: -1 },
    waste: { label: 'Waste / Damaged', counter: 'waste', sign: -1 },
    opening: { label: 'Opening Stock', counter: 'opening', sign: 1 },
    count: { label: 'Stock Count', counter: 'adjust', sign: 1 },
  },
  saveAdjustment(src) {
    return this.tx(() => {
      const d = db(), a = U.clone(src), T = this.ADJ[a.kind];
      a.lines = (a.lines || []).filter(l => l.itemId && +l.qty);
      if (!a.lines.length) throw new Error('Add at least one item with a quantity.');
      if (!a.warehouseId) throw new Error('Choose a warehouse.');
      const idx = a.id ? d.adjustments.findIndex(x => x.id === a.id) : -1;
      if (idx < 0) { a.id = U.uid('adj'); a.no = this.nextNo('adj', 'ADJ-'); a.created = U.now(); a.createdBy = this.user(); d.adjustments.push(a); }
      else { this.unpost('adjustment', a.id); this.unmove('adjustment', a.id); d.adjustments[idx] = a; }
      let value = 0;
      a.lines.forEach(l => {
        const it = this.item(l.itemId); if (it.type === 'service') throw new Error(`"${it.name}" is a service and has no stock.`);
        const q = T.sign * (+l.qty);
        let uc = +it.cost || 0;
        if (q > 0 && l.cost !== undefined && l.cost !== '' && +l.cost >= 0) { uc = +l.cost; this.avgCost(it, q, uc); }
        l.cost = uc;
        this.move({ date: a.date, itemId: it.id, warehouseId: a.warehouseId, qty: q, cost: uc, type: a.kind, refType: 'adjustment', refId: a.id, ref: a.no });
        value += q * uc;
      });
      const inv = this.A('inventory'), ctr = this.A(T.counter);
      this.post({ date: a.date, memo: T.label + ' ' + a.no + (a.reason ? ' — ' + a.reason : ''), refType: 'adjustment', refId: a.id, ref: a.no,
        lines: value >= 0 ? [{ accountId: inv, debit: value }, { accountId: ctr, credit: value }] : [{ accountId: ctr, debit: -value }, { accountId: inv, credit: -value }] });
      this.audit(idx < 0 ? 'Created' : 'Updated', T.label + ' ' + a.no);
      return a;
    });
  },
  deleteAdjustment(id) {
    return this.tx(() => {
      const a = this.get('adjustments', id); if (!a) return;
      this.unpost('adjustment', id); this.unmove('adjustment', id);
      db().adjustments = db().adjustments.filter(x => x.id !== id);
      this.audit('Deleted', this.ADJ[a.kind].label + ' ' + a.no);
    });
  },

  /* ---------- Transfers ---------- */
  saveTransfer(src) {
    return this.tx(() => {
      const t = U.clone(src);
      t.lines = (t.lines || []).filter(l => l.itemId && +l.qty > 0);
      if (!t.fromWh || !t.toWh) throw new Error('Choose both warehouses.');
      if (t.fromWh === t.toWh) throw new Error('Source and destination warehouses must be different.');
      if (!t.lines.length) throw new Error('Add at least one item.');
      t.id = U.uid('trf'); t.no = this.nextNo('trf', 'TRF-'); t.created = U.now(); t.createdBy = this.user();
      db().transfers.push(t);
      t.lines.forEach(l => {
        const it = this.item(l.itemId), base = { date: t.date, itemId: it.id, cost: +it.cost || 0, type: 'transfer', refType: 'transfer', refId: t.id, ref: t.no };
        this.move(Object.assign({}, base, { warehouseId: t.fromWh, qty: -(+l.qty) }));
        this.move(Object.assign({}, base, { warehouseId: t.toWh, qty: +l.qty }));
      });
      this.audit('Created', 'Stock Transfer ' + t.no);
      return t;
    });
  },
  deleteTransfer(id) {
    return this.tx(() => {
      const t = this.get('transfers', id); if (!t) return;
      this.unmove('transfer', id); db().transfers = db().transfers.filter(x => x.id !== id);
      if (!db().settings.allowNegative) {
        const sm = this.stockMap();
        t.lines.forEach(l => { if (sm.at(l.itemId, t.toWh) < -0.0001) throw new Error(`Cannot delete: "${this.item(l.itemId).name}" stock in destination would become negative.`); });
      }
      this.audit('Deleted', 'Stock Transfer ' + t.no);
    });
  },

  /* ---------- Production ---------- */
  produce(src) {
    return this.tx(() => {
      const p = U.clone(src), r = this.get('recipes', p.recipeId);
      if (!r) throw new Error('Choose a recipe.');
      if (!(+p.batches > 0)) throw new Error('Batches must be greater than zero.');
      if (!p.warehouseId) throw new Error('Choose a warehouse.');
      p.id = U.uid('prd'); p.no = this.nextNo('prd', 'PRD-'); p.created = U.now(); p.createdBy = this.user();
      p.consumed = []; let total = 0;
      r.components.forEach(c => {
        const it = this.item(c.itemId), q = +c.qty * +p.batches, uc = +it.cost || 0;
        this.move({ date: p.date, itemId: it.id, warehouseId: p.warehouseId, qty: -q, cost: uc, type: 'production_in', refType: 'production', refId: p.id, ref: p.no });
        p.consumed.push({ itemId: it.id, qty: q, cost: uc }); total += q * uc;
      });
      total += (+r.extraCost || 0) * +p.batches;
      const fin = this.item(r.itemId), outQ = +r.outputQty * +p.batches, unit = outQ ? total / outQ : 0;
      this.avgCost(fin, outQ, unit);
      this.move({ date: p.date, itemId: fin.id, warehouseId: p.warehouseId, qty: outQ, cost: unit, type: 'production_out', refType: 'production', refId: p.id, ref: p.no });
      p.output = { itemId: fin.id, qty: outQ, unitCost: U.r(unit, 4), total: U.r(total) };
      const extra = (+r.extraCost || 0) * +p.batches;
      if (extra) this.post({ date: p.date, memo: 'Production overhead ' + p.no, refType: 'production', refId: p.id, ref: p.no, lines: [{ accountId: this.A('inventory'), debit: extra }, { accountId: this.A('salaries'), credit: extra }] });
      db().productions.push(p);
      this.audit('Produced', `${p.no}: ${outQ} × ${fin.name}`);
      return p;
    });
  },
  deleteProduction(id) {
    return this.tx(() => {
      const p = this.get('productions', id); if (!p) return;
      this.unmove('production', id); this.unpost('production', id);
      db().productions = db().productions.filter(x => x.id !== id);
      if (!db().settings.allowNegative && this.qty(p.output.itemId, p.warehouseId) < -0.0001) throw new Error('Cannot undo: the produced items were already sold or moved.');
      this.audit('Deleted', 'Production ' + p.no);
    });
  },

  /* ---------- Disassembly ---------- */
  disassemble(src) {
    return this.tx(() => {
      const x = U.clone(src);
      x.outputs = (x.outputs || []).filter(o => o.itemId && +o.qty > 0);
      if (!x.itemId) throw new Error('Choose the item to disassemble.');
      if (!(+x.qty > 0)) throw new Error('Quantity must be greater than zero.');
      if (!x.outputs.length) throw new Error('Add at least one output part.');
      if (x.outputs.some(o => o.itemId === x.itemId)) throw new Error('An output cannot be the same as the source item.');
      const shares = U.r(U.sum(x.outputs, o => o.share));
      if (Math.abs(shares - 100) > 0.01) throw new Error(`Cost shares must add up to 100% (now ${shares}%).`);
      x.id = U.uid('dis'); x.no = this.nextNo('dis', 'DIS-'); x.created = U.now(); x.createdBy = this.user();
      const src_ = this.item(x.itemId), uc = +src_.cost || 0, total = uc * +x.qty;
      this.move({ date: x.date, itemId: src_.id, warehouseId: x.warehouseId, qty: -(+x.qty), cost: uc, type: 'disassembly_in', refType: 'disassembly', refId: x.id, ref: x.no });
      x.outputs.forEach(o => {
        const it = this.item(o.itemId), part = total * (+o.share) / 100, unit = part / +o.qty;
        o.unitCost = U.r(unit, 4); this.avgCost(it, +o.qty, unit);
        this.move({ date: x.date, itemId: it.id, warehouseId: x.warehouseId, qty: +o.qty, cost: unit, type: 'disassembly_out', refType: 'disassembly', refId: x.id, ref: x.no });
      });
      x.totalCost = U.r(total);
      db().disassemblies.push(x);
      this.audit('Disassembled', `${x.no}: ${x.qty} × ${src_.name}`);
      return x;
    });
  },
  deleteDisassembly(id) {
    return this.tx(() => {
      const x = this.get('disassemblies', id); if (!x) return;
      this.unmove('disassembly', id); db().disassemblies = db().disassemblies.filter(y => y.id !== id);
      if (!db().settings.allowNegative) x.outputs.forEach(o => { if (this.qty(o.itemId, x.warehouseId) < -0.0001) throw new Error('Cannot undo: some output parts were already used.'); });
      this.audit('Deleted', 'Disassembly ' + x.no);
    });
  },

  /* ---------- Rooms ---------- */
  checkout(stayId, opt) {
    return this.tx(() => {
      const d = db(), stay = this.get('stays', stayId), room = this.get('rooms', stay.roomId);
      const roomItem = d.items.find(i => i.sys === 'room_charge');
      const lines = [];
      if (+opt.nights > 0) lines.push({ itemId: roomItem.id, qty: +opt.nights, price: +room.rate, disc: 0 });
      stay.orders.forEach(o => lines.push({ itemId: o.itemId, qty: o.qty, price: o.price, disc: 0 }));
      if (!lines.length) throw new Error('Nothing to bill — add nights or orders.');
      const inv = this.saveInvoice({ type: 'sale', date: U.today(), accountId: opt.accountId, warehouseId: this.defWh(), currency: UI_base(), rate: 1,
        taxRate: +opt.taxRate || 0, discount: +opt.discount || 0, paid: +opt.paid || 0, payAccountId: opt.payAccountId, salesmanId: opt.salesmanId || '',
        notes: `Room ${room.name} — ${stay.guest} (${U.daysBetween(stay.checkIn, U.today()) || 1} night(s))`, source: 'room', stayId: stay.id, lines });
      const s = this.get('stays', stayId);
      s.status = 'closed'; s.checkOut = U.now(); s.invoiceId = inv.id;
      this.get('rooms', room.id).status = 'cleaning';
      this.audit('Check-out', `Room ${room.name} — ${stay.guest}`);
      return inv;
    });
  },

  /* ---------- Cash shifts ---------- */
  closeShift(src) {
    return this.tx(() => {
      const s = U.clone(src);
      s.id = U.uid('sh'); s.no = this.nextNo('shift', 'SH-', 4); s.closedAt = U.now(); s.user = this.user();
      s.diff = U.r(+s.counted - +s.expected);
      if (s.diff) {
        const cash = s.cashAccountId, diffA = this.A('cash_diff');
        this.post({ date: s.date, memo: `Shift ${s.no} cash ${s.diff > 0 ? 'over' : 'short'}`, refType: 'shift', refId: s.id, ref: s.no,
          lines: s.diff > 0 ? [{ accountId: cash, debit: s.diff }, { accountId: diffA, credit: s.diff }] : [{ accountId: diffA, debit: -s.diff }, { accountId: cash, credit: -s.diff }] });
      }
      db().shifts.push(s);
      this.audit('Closed shift', `${s.no} — difference ${s.diff}`);
      return s;
    });
  },

  /* ---------- Automated tasks ---------- */
  TASKS: { backup: 'Auto Backup Snapshot', lowstock: 'Low Stock Alert', recurring: 'Recurring Expense Voucher', summary: 'Daily Sales Summary' },
  FREQ: { hourly: 36e5, daily: 864e5, weekly: 6048e5, monthly: 2592e6 },
  taskDue(t) { return t.active && (!t.lastRun || Date.now() - new Date(t.lastRun).getTime() >= this.FREQ[t.frequency]); },
  nextRun(t) { return t.lastRun ? new Date(new Date(t.lastRun).getTime() + this.FREQ[t.frequency]).toISOString() : U.now(); },
  runTask(id) {
    const d = db(), t = this.get('tasks', id); let result = '', ok = true;
    try {
      if (t.type === 'backup') { Snapshots.create('Auto: ' + t.name); result = 'Local snapshot created.'; }
      else if (t.type === 'lowstock') {
        const low = this.lowStock();
        result = low.length ? `${low.length} item(s) at or below minimum.` : 'All items above minimum.';
        if (low.length) this.notify('Low stock: ' + low.length + ' item(s)', low.slice(0, 4).map(x => x.item.name).join(', ') + (low.length > 4 ? '…' : ''), 'report/lowstock', 'warn');
      } else if (t.type === 'recurring') {
        const c = t.config || {};
        const v = this.saveVoucher({ type: 'payment', date: U.today(), accountId: c.accountId, cashAccountId: c.cashAccountId || this.defCash(), amount: +c.amount, currency: UI_base(), rate: 1, memo: c.memo || t.name });
        result = `Created ${v.no} for ${c.amount}.`;
      } else if (t.type === 'summary') {
        const day = U.today(), sales = d.invoices.filter(i => i.type === 'sale' && i.date === day);
        const tot = U.r(U.sum(sales, i => this.calc(i).total / (+i.rate || 1)));
        result = `${sales.length} sale(s) today, total ${tot}.`;
        this.notify('Daily sales summary', result, 'report/sales_daily', 'info');
      }
    } catch (e) { ok = false; result = 'Error: ' + e.message; }
    const t2 = this.get('tasks', id); t2.lastRun = U.now(); t2.lastResult = result;
    db().taskLog.unshift({ id: U.uid('tl'), taskId: id, name: t2.name, date: U.now(), result, ok });
    if (db().taskLog.length > 200) db().taskLog.length = 200;
    Store.save();
    return { ok, result };
  },
  runDueTasks() { let n = 0; db().tasks.forEach(t => { if (this.taskDue(t)) { this.runTask(t.id); n++; } }); return n; },
};
function UI_base() { const c = db().currencies.find(x => x.base) || db().currencies[0]; return c.code; }

/* ---------------- Seed ---------------- */
const ROLE_PERMS = {
  admin: '*',
  accountant: ['rooms', 'pos', 'converter', 'categories', 'currencies', 'vouchers', 'items', 'inventory', 'accounts', 'invoices', 'cashbox', 'salesman', 'stockmgmt', 'production', 'disassembly', 'trialbalance', 'statement', 'warehouses', 'waste', 'reports', 'tasks'],
  cashier: ['rooms', 'pos', 'converter', 'items', 'inventory', 'invoices', 'cashbox'],
  storekeeper: ['items', 'categories', 'warehouses', 'inventory', 'stockmgmt', 'waste', 'production', 'disassembly'],
};
const Seed = {
  blank() {
    return {
      version: 1,
      settings: {
        company: 'Devma Trading Co.', address: 'Hamra Street, Beirut, Lebanon', phone: '+961 1 234 567', email: 'info@devma.com', taxNo: 'VAT-1029384',
        taxRate: 11, invoiceFooter: 'Thank you for your business!', theme: 'emerald', dark: false, decimals: 2, allowNegative: false,
        lowStockAlerts: true, defaultWarehouseId: null, defaultCashAccountId: 'acc_cash', walkInCustomerId: null, receiptWidth: 80,
      },
      counters: {},
      users: [{ id: 'u_admin', username: 'admin', password: 'admin', fullName: 'Devma Admin', role: 'admin', perms: '*', active: true, created: U.now() }],
      currencies: [{ id: 'cur_usd', code: 'USD', name: 'US Dollar', symbol: '$', rate: 1, decimals: 2, base: true }],
      categories: [], warehouses: [], items: [], stockMoves: [],
      accounts: this.coa(), journal: [], invoices: [], vouchers: [], salesmen: [],
      rooms: [], stays: [], recipes: [], productions: [], disassemblies: [], transfers: [], adjustments: [],
      shifts: [], tasks: [], taskLog: [], notifications: [], audit: [], rateHistory: [], heldOrders: [], conversions: [],
    };
  },
  coa() {
    const rows = [
      ['1000', 'Assets', 'asset', null, 'g_assets', 1], ['1100', 'Cash Box', 'asset', 'g_assets', 'cash', 0, 'cash'], ['1110', 'Bank Account', 'asset', 'g_assets', 'bank', 0, 'bank'],
      ['1200', 'Accounts Receivable', 'asset', 'g_assets', 'ar', 1], ['1300', 'Inventory', 'asset', 'g_assets', 'inventory'], ['1400', 'VAT Receivable', 'asset', 'g_assets', 'vat_in'],
      ['2000', 'Liabilities', 'liability', null, 'g_liab', 1], ['2100', 'Accounts Payable', 'liability', 'g_liab', 'ap', 1], ['2200', 'VAT Payable', 'liability', 'g_liab', 'vat_out'],
      ['3000', 'Equity', 'equity', null, 'g_equity', 1], ['3100', 'Owner Capital', 'equity', 'g_equity', 'capital'], ['3200', 'Opening Balance Equity', 'equity', 'g_equity', 'opening'], ['3300', 'Retained Earnings', 'equity', 'g_equity', 'retained'],
      ['4000', 'Revenue', 'revenue', null, 'g_rev', 1], ['4100', 'Sales Revenue', 'revenue', 'g_rev', 'sales'], ['4200', 'Sales Returns', 'revenue', 'g_rev', 'sales_ret'], ['4300', 'Room Revenue', 'revenue', 'g_rev', 'room_rev'], ['4400', 'Other Income', 'revenue', 'g_rev', 'other_inc'],
      ['5000', 'Expenses', 'expense', null, 'g_exp', 1], ['5100', 'Cost of Goods Sold', 'expense', 'g_exp', 'cogs'], ['5200', 'Waste & Spoilage', 'expense', 'g_exp', 'waste'], ['5300', 'Inventory Adjustments', 'expense', 'g_exp', 'adjust'],
      ['5400', 'Salaries & Wages', 'expense', 'g_exp', 'salaries'], ['5500', 'Rent', 'expense', 'g_exp', 'rent'], ['5600', 'Utilities', 'expense', 'g_exp', 'utilities'], ['5700', 'Salesman Commission', 'expense', 'g_exp', 'commission'],
      ['5800', 'General Expenses', 'expense', 'g_exp', 'general_exp'], ['5900', 'Cash Over / Short', 'expense', 'g_exp', 'cash_diff'],
    ];
    return rows.map(([code, name, type, parent, sys, group, kind]) => ({ id: 'acc_' + sys, code, name, type, parentId: parent ? 'acc_' + parent : null, sys, isGroup: !!group, kind: kind || 'general', active: true, system: true }));
  },
  demo() {
    Store.data = this.blank();
    const d = Store.data, T = U.today(), day = n => U.addDays(T, -n);
    let seed = 7; const rnd = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    const pick = a => a[Math.floor(rnd() * a.length)];
    Eng.tx(() => {
      d.currencies.push({ id: 'cur_lbp', code: 'LBP', name: 'Lebanese Pound', symbol: 'LL', rate: 89500, decimals: 0 }, { id: 'cur_eur', code: 'EUR', name: 'Euro', symbol: '€', rate: 0.92, decimals: 2 });
      d.warehouses.push({ id: 'wh_main', name: 'Main Warehouse', location: 'Industrial Zone, Dora', keeper: 'Fadi K.' }, { id: 'wh_shop', name: 'Shop Floor', location: 'Hamra Street', keeper: 'Maya R.' });
      d.settings.defaultWarehouseId = 'wh_main';
      const cats = [['cat_bev', 'Beverages', '#0f766e'], ['cat_snk', 'Snacks', '#d97706'], ['cat_dry', 'Dairy', '#2563eb'], ['cat_bak', 'Bakery', '#b45309'], ['cat_cln', 'Cleaning', '#7c3aed'], ['cat_raw', 'Raw Materials', '#64748b'], ['cat_srv', 'Services', '#db2777']];
      cats.forEach(([id, name, color]) => d.categories.push({ id, name, color, parentId: null }));
      const mk = (id, code, name, cat, unit, cost, price, min, type = 'stock', extra = {}) => d.items.push(Object.assign({ id, code, barcode: '622' + code.replace(/\D/g, '').padStart(9, '0'), name, categoryId: cat, unit, cost, price, minQty: min, type, active: true, created: U.now() }, extra));
      mk('it_coffee', 'BEV-001', 'Espresso Coffee Beans 1kg', 'cat_bev', 'pcs', 12, 18.5, 10);
      mk('it_water', 'BEV-002', 'Mineral Water 1.5L', 'cat_bev', 'pcs', 0.35, 0.75, 48);
      mk('it_juice', 'BEV-003', 'Orange Juice 1L', 'cat_bev', 'pcs', 1.2, 2.25, 20);
      mk('it_cola', 'BEV-004', 'Cola Can 330ml', 'cat_bev', 'pcs', 0.4, 1, 48);
      mk('it_tea', 'BEV-005', 'Green Tea Box (25)', 'cat_bev', 'box', 2, 3.5, 10);
      mk('it_chips', 'SNK-001', 'Potato Chips 150g', 'cat_snk', 'pcs', 0.6, 1.25, 30);
      mk('it_choc', 'SNK-002', 'Chocolate Bar 80g', 'cat_snk', 'pcs', 0.7, 1.5, 30);
      mk('it_nuts', 'SNK-003', 'Mixed Nuts 250g', 'cat_snk', 'pcs', 3, 5.5, 12);
      mk('it_combo', 'SNK-010', 'Snack Combo Box', 'cat_snk', 'box', 7.8, 14, 2);
      mk('it_milk', 'DRY-001', 'Fresh Milk 1L', 'cat_dry', 'pcs', 0.9, 1.6, 24);
      mk('it_labneh', 'DRY-002', 'Labneh 500g', 'cat_dry', 'pcs', 1.8, 3.2, 10);
      mk('it_cheese', 'DRY-003', 'Cheddar Cheese 200g', 'cat_dry', 'pcs', 2.1, 3.75, 10);
      mk('it_crois', 'BAK-001', 'Butter Croissant', 'cat_bak', 'pcs', 0, 1.25, 20);
      mk('it_flour', 'RAW-001', 'Flour', 'cat_raw', 'kg', 0.8, 1.2, 20, 'raw');
      mk('it_butter', 'RAW-002', 'Butter', 'cat_raw', 'kg', 6, 8, 5, 'raw');
      mk('it_sugar', 'RAW-003', 'Sugar', 'cat_raw', 'kg', 1, 1.5, 10, 'raw');
      mk('it_soap', 'CLN-001', 'Dish Soap 750ml', 'cat_cln', 'pcs', 1.1, 2, 12);
      mk('it_towel', 'CLN-002', 'Paper Towels (6 rolls)', 'cat_cln', 'pack', 1.5, 2.75, 12);
      mk('it_room', 'SRV-001', 'Room Charge (per night)', 'cat_srv', 'night', 0, 60, 0, 'service', { sys: 'room_charge', revenueSys: 'room_rev' });
      mk('it_deliv', 'SRV-002', 'Delivery Fee', 'cat_srv', 'trip', 0, 3, 0, 'service');

      const party = (id, name, kind, phone, extra = {}) => {
        const parent = kind === 'customer' ? 'acc_ar' : 'acc_ap', n = d.accounts.filter(a => a.parentId === parent).length + 1;
        d.accounts.push(Object.assign({ id, code: (kind === 'customer' ? '1200-' : '2100-') + String(n).padStart(3, '0'), name, type: kind === 'customer' ? 'asset' : 'liability', parentId: parent, kind, phone, email: '', address: 'Beirut', creditLimit: 0, active: true }, extra));
      };
      party('acc_c_walkin', 'Walk-in Customer', 'customer', '');
      party('acc_c_amal', 'Al Amal Supermarket', 'customer', '+961 3 112 233', { creditLimit: 5000 });
      party('acc_c_cedar', 'Cedar Hotel', 'customer', '+961 70 445 566', { creditLimit: 3000 });
      party('acc_c_nour', 'Nour Café', 'customer', '+961 71 778 899', { creditLimit: 1500 });
      party('acc_s_global', 'Global Foods Ltd', 'supplier', '+961 1 555 010');
      party('acc_s_dairy', 'Fresh Dairy Co.', 'supplier', '+961 1 555 020');
      party('acc_s_clean', 'CleanPro Supplies', 'supplier', '+961 1 555 030');
      d.settings.walkInCustomerId = 'acc_c_walkin';

      d.salesmen.push({ id: 'sm_rami', name: 'Rami Haddad', phone: '+961 3 900 100', commission: 3, active: true }, { id: 'sm_lina', name: 'Lina Saad', phone: '+961 3 900 200', commission: 2.5, active: true });
      d.users.push({ id: 'u_cash', username: 'cashier', password: '1234', fullName: 'Maya Cashier', role: 'cashier', perms: ROLE_PERMS.cashier.slice(), active: true, created: U.now() },
        { id: 'u_acct', username: 'accountant', password: '1234', fullName: 'Omar Accountant', role: 'accountant', perms: ROLE_PERMS.accountant.slice(), active: true, created: U.now() });

      [['101', 'Standard', 1, 60], ['102', 'Standard', 1, 60], ['103', 'Standard', 1, 60], ['104', 'Twin', 1, 70], ['201', 'Deluxe', 2, 95], ['202', 'Deluxe', 2, 95], ['203', 'Family', 2, 120], ['301', 'Suite', 3, 150]]
        .forEach(([name, type, floor, rate]) => d.rooms.push({ id: 'rm_' + name, name, type, floor, rate, status: 'available', capacity: type === 'Family' ? 4 : 2 }));

      // Opening capital
      Eng.post({ date: day(30), memo: 'Owner capital contribution', refType: null, ref: 'OPENING', lines: [{ accountId: 'acc_cash', debit: 15000 }, { accountId: 'acc_bank', debit: 25000 }, { accountId: 'acc_capital', credit: 40000 }] });

      const P = (date, sup, lines, paidPct, payAcc = 'acc_bank') => {
        const tmp = { type: 'purchase', taxRate: 11, discount: 0, lines: lines.map(([itemId, qty]) => ({ itemId, qty, price: Eng.item(itemId).cost, disc: 0 })) };
        const tot = Eng.calc(tmp).total;
        Eng.saveInvoice(Object.assign(tmp, { date, accountId: sup, warehouseId: 'wh_main', currency: 'USD', rate: 1, paid: U.r(tot * paidPct), payAccountId: payAcc, notes: '' }));
      };
      P(day(28), 'acc_s_global', [['it_coffee', 40], ['it_water', 480], ['it_juice', 120], ['it_cola', 480], ['it_tea', 60], ['it_chips', 240], ['it_choc', 240], ['it_nuts', 80], ['it_flour', 100], ['it_sugar', 50]], 1);
      P(day(27), 'acc_s_dairy', [['it_milk', 120], ['it_labneh', 60], ['it_cheese', 60], ['it_butter', 30]], 0.5);
      P(day(26), 'acc_s_clean', [['it_soap', 60], ['it_towel', 60]], 0);
      P(day(12), 'acc_s_dairy', [['it_milk', 80], ['it_labneh', 30]], 0, 'acc_cash');

      Eng.saveTransfer({ date: day(25), fromWh: 'wh_main', toWh: 'wh_shop', note: 'Initial shop stocking', lines: [['it_water', 96], ['it_cola', 96], ['it_chips', 60], ['it_choc', 60], ['it_juice', 24]].map(([itemId, qty]) => ({ itemId, qty })) });

      d.recipes.push({ id: 'rc_crois', name: 'Butter Croissant (batch of 40)', itemId: 'it_crois', outputQty: 40, extraCost: 4, components: [{ itemId: 'it_flour', qty: 4 }, { itemId: 'it_butter', qty: 2 }, { itemId: 'it_sugar', qty: 0.5 }] });
      d.recipes.push({ id: 'rc_combo', name: 'Snack Combo Box', itemId: 'it_combo', outputQty: 1, extraCost: 0, components: [{ itemId: 'it_chips', qty: 4 }, { itemId: 'it_choc', qty: 4 }, { itemId: 'it_nuts', qty: 1 }] });
      Eng.produce({ date: day(24), recipeId: 'rc_crois', batches: 3, warehouseId: 'wh_main', note: 'Morning bake' });
      Eng.produce({ date: day(22), recipeId: 'rc_combo', batches: 10, warehouseId: 'wh_main', note: '' });
      Eng.disassemble({ date: day(15), itemId: 'it_combo', qty: 2, warehouseId: 'wh_main', note: 'Damaged boxes — recover contents', outputs: [{ itemId: 'it_chips', qty: 8, share: 35 }, { itemId: 'it_choc', qty: 8, share: 37 }, { itemId: 'it_nuts', qty: 2, share: 28 }] });

      const custs = ['acc_c_walkin', 'acc_c_walkin', 'acc_c_walkin', 'acc_c_amal', 'acc_c_cedar', 'acc_c_nour'];
      const sellable = ['it_coffee', 'it_water', 'it_juice', 'it_cola', 'it_tea', 'it_chips', 'it_choc', 'it_nuts', 'it_milk', 'it_labneh', 'it_cheese', 'it_crois', 'it_soap', 'it_towel', 'it_combo'];
      for (let n = 21; n >= 0; n--) {
        const count = 1 + Math.floor(rnd() * 3);
        for (let k = 0; k < count; k++) {
          const cust = pick(custs), used = {}, lines = [];
          const nl = 1 + Math.floor(rnd() * 4);
          for (let j = 0; j < nl; j++) {
            const id = pick(sellable); if (used[id]) continue; used[id] = 1;
            const avail = Eng.qty(id, 'wh_main'); const q = Math.min(avail, 1 + Math.floor(rnd() * (cust === 'acc_c_walkin' ? 4 : 12)));
            if (q > 0) lines.push({ itemId: id, qty: q, price: Eng.item(id).price, disc: 0 });
          }
          if (!lines.length) continue;
          const tmp = { taxRate: 11, discount: 0, lines }, tot = Eng.calc(tmp).total;
          const walk = cust === 'acc_c_walkin', paid = walk ? tot : (rnd() < 0.5 ? tot : 0);
          Eng.saveInvoice(Object.assign(tmp, { type: 'sale', date: day(n), accountId: cust, warehouseId: 'wh_main', currency: 'USD', rate: 1, paid, payAccountId: 'acc_cash', salesmanId: walk ? '' : pick(['sm_rami', 'sm_lina']), notes: '' }));
        }
      }
      // A return and some vouchers
      const someSale = d.invoices.find(i => i.type === 'sale' && i.accountId === 'acc_c_amal');
      if (someSale) {
        const l = someSale.lines[0];
        Eng.saveInvoice({ type: 'sale_return', date: U.addDays(someSale.date, 1) > T ? T : U.addDays(someSale.date, 1), accountId: 'acc_c_amal', warehouseId: 'wh_main', currency: 'USD', rate: 1, taxRate: 11, discount: 0, paid: 0, payAccountId: 'acc_cash', returnOf: someSale.id, notes: 'Damaged on delivery', lines: [{ itemId: l.itemId, qty: 1, price: l.price, disc: 0 }] });
      }
      Eng.saveVoucher({ type: 'payment', date: day(20), accountId: 'acc_rent', cashAccountId: 'acc_bank', amount: 1200, currency: 'USD', rate: 1, memo: 'Shop rent — this month' });
      Eng.saveVoucher({ type: 'payment', date: day(10), accountId: 'acc_utilities', cashAccountId: 'acc_cash', amount: 185, currency: 'USD', rate: 1, memo: 'Electricity & water' });
      Eng.saveVoucher({ type: 'payment', date: day(3), accountId: 'acc_salaries', cashAccountId: 'acc_bank', amount: 2400, currency: 'USD', rate: 1, memo: 'Staff salaries' });
      Eng.saveVoucher({ type: 'payment', date: day(9), accountId: 'acc_s_dairy', cashAccountId: 'acc_bank', amount: 300, currency: 'USD', rate: 1, memo: 'Partial settlement' });
      const amalDue = d.invoices.find(i => i.type === 'sale' && i.accountId === 'acc_c_amal' && Eng.dueOf(i) > 0);
      if (amalDue) Eng.saveVoucher({ type: 'receipt', date: amalDue.date > day(2) ? amalDue.date : day(2), accountId: 'acc_c_amal', cashAccountId: 'acc_cash', amount: Eng.dueOf(amalDue), currency: 'USD', rate: 1, invoiceId: amalDue.id, memo: 'Payment for ' + amalDue.no });
      Eng.saveAdjustment({ kind: 'waste', date: day(5), warehouseId: 'wh_main', reason: 'Expired milk', lines: [{ itemId: 'it_milk', qty: 6 }] });

      // Hotel: one occupied room with orders, one being cleaned
      d.stays.push({ id: 'st_1', roomId: 'rm_102', guest: 'Karim Mansour', phone: '+961 76 123 456', persons: 2, accountId: 'acc_c_walkin', checkIn: day(2) + 'T14:00:00.000Z', status: 'open',
        orders: [{ id: 'o1', itemId: 'it_water', qty: 4, price: 0.75, time: day(2) + 'T18:00:00.000Z' }, { id: 'o2', itemId: 'it_crois', qty: 2, price: 1.25, time: day(1) + 'T08:00:00.000Z' }] });
      d.rooms.find(r => r.id === 'rm_102').status = 'occupied';
      d.rooms.find(r => r.id === 'rm_201').status = 'cleaning';
      d.rooms.find(r => r.id === 'rm_301').status = 'maintenance';

      d.tasks.push(
        { id: 'tk_backup', name: 'Daily local backup', type: 'backup', frequency: 'daily', active: true, lastRun: null, config: {} },
        { id: 'tk_low', name: 'Low stock check', type: 'lowstock', frequency: 'daily', active: true, lastRun: null, config: {} },
        { id: 'tk_rent', name: 'Monthly shop rent', type: 'recurring', frequency: 'monthly', active: false, lastRun: null, config: { accountId: 'acc_rent', cashAccountId: 'acc_bank', amount: 1200, memo: 'Shop rent (automatic)' } },
        { id: 'tk_sum', name: 'Daily sales summary', type: 'summary', frequency: 'daily', active: true, lastRun: null, config: {} },
      );
      d.notifications.push({ id: U.uid('nt'), date: U.now(), title: 'Welcome to Devma', body: 'Demo data is loaded. Explore every module, or reset from Backup.', link: 'about', kind: 'info', read: false });
      d.audit = []; Eng.audit('System', 'Demo data loaded');
    });
    return d;
  },
};
