/* Devma — All reports with drill-down */
'use strict';
const baseOf = (i, v) => v / (+i.rate || 1);
const inRange = (date, f) => (!f.from || date >= f.from) && (!f.to || date <= f.to);
const salesIn = (f, types = ['sale']) => db().invoices.filter(i => types.includes(i.type) && inRange(i.date, f));
const groupBy = (arr, key) => arr.reduce((m, x) => { const k = key(x); (m[k] = m[k] || []).push(x); return m; }, {});
const lineCogs = inv => U.sum(inv.lines, l => (+l.qty || 0) * (+l.cost || 0));
const sgn = i => i.type.endsWith('_return') ? -1 : 1;

const REPORTS = {
  sales_daily: { group: 'Sales', title: 'Sales by day', icon: 'chart', desc: 'Daily sales, tax and invoice count.', build: f => {
    const inv = salesIn(f, ['sale', 'sale_return']), g = groupBy(inv, i => i.date);
    const rows = Object.keys(g).sort().reverse().map(date => { const xs = g[date]; return { date, n: xs.filter(i => i.type === 'sale').length, net: U.sum(xs, i => sgn(i) * baseOf(i, Eng.calc(i).net)), tax: U.sum(xs, i => sgn(i) * baseOf(i, Eng.calc(i).tax)), total: U.sum(xs, i => sgn(i) * baseOf(i, Eng.calc(i).total)) }; });
    return { kpis: [['Invoices', rows.reduce((a, r) => a + r.n, 0), 'file'], ['Net sales', UI.money(U.sum(rows, r => r.net)), 'chart'], ['Tax', UI.money(U.sum(rows, r => r.tax)), 'receipt'], ['Total', UI.money(U.sum(rows, r => r.total)), 'coins'], ['Daily average', UI.money(rows.length ? U.sum(rows, r => r.total) / rows.length : 0), 'scale']],
      chart: UI.bars(rows.slice(0, 31).reverse().map(r => ({ label: r.date.slice(5), value: U.r(r.total), link: `invoices/sale?from=${r.date}&to=${r.date}` })), v => UI.num(v, 0)),
      rows, onRow: r => App.go(`invoices/sale?from=${r.date}&to=${r.date}`),
      columns: [{ key: 'date', label: 'Date', text: r => UI.date(r.date), sortVal: r => r.date }, { key: 'n', label: 'Invoices', align: 'r' }, { key: 'net', label: 'Net sales', align: 'r', text: r => UI.num(r.net) }, { key: 'tax', label: 'Tax', align: 'r', text: r => UI.num(r.tax) }, { key: 'total', label: 'Total', align: 'r', text: r => UI.num(r.total) }],
      footer: rs => `<td>Total</td><td class="r">${rs.reduce((a, r) => a + r.n, 0)}</td><td class="r">${UI.num(U.sum(rs, r => r.net))}</td><td class="r">${UI.num(U.sum(rs, r => r.tax))}</td><td class="r">${UI.num(U.sum(rs, r => r.total))}</td>` };
  } },
  sales_item: { group: 'Sales', title: 'Sales by item', icon: 'box', desc: 'Quantity sold, revenue, cost and profit per item.', build: f => {
    const m = {};
    salesIn(f, ['sale', 'sale_return']).forEach(i => { const c = Eng.calc(i), fac = c.subtotal ? c.net / c.subtotal : 0; c.lines.forEach(l => { const r = m[l.itemId] || (m[l.itemId] = { id: l.itemId, qty: 0, rev: 0, cost: 0 }); r.qty += sgn(i) * l.qty; r.rev += sgn(i) * baseOf(i, l.amount * fac); r.cost += sgn(i) * l.qty * (+l.cost || 0); }); });
    const rows = Object.values(m).map(r => Object.assign(r, { it: Eng.item(r.id) || { name: '?', code: '' }, profit: r.rev - r.cost })).sort((a, b) => b.rev - a.rev);
    return { kpis: [['Items sold', rows.length, 'box'], ['Revenue', UI.money(U.sum(rows, r => r.rev)), 'chart'], ['Cost', UI.money(U.sum(rows, r => r.cost)), 'coins'], ['Gross profit', UI.money(U.sum(rows, r => r.profit)), 'scale']],
      chart: UI.hbars(rows.slice(0, 8).map(r => ({ label: r.it.name, value: U.r(r.rev), link: 'item/' + r.id }))), rows, onRow: r => App.go('item/' + r.id),
      columns: [{ key: 'code', label: 'Code', text: r => r.it.code }, { key: 'name', label: 'Item', text: r => r.it.name }, { key: 'qty', label: 'Qty sold', align: 'r', text: r => UI.qty(r.qty), sortVal: r => r.qty }, { key: 'rev', label: 'Revenue', align: 'r', text: r => UI.num(r.rev), sortVal: r => r.rev }, { key: 'cost', label: 'Cost', align: 'r', text: r => UI.num(r.cost), sortVal: r => r.cost }, { key: 'profit', label: 'Profit', align: 'r', render: r => UI.signed(r.profit), text: r => UI.num(r.profit), sortVal: r => r.profit }, { key: 'm', label: 'Margin', align: 'r', text: r => r.rev ? U.r(r.profit / r.rev * 100, 1) + '%' : '—', sortVal: r => r.rev ? r.profit / r.rev : 0 }],
      footer: rs => `<td colspan="3">Total</td><td class="r">${UI.num(U.sum(rs, r => r.rev))}</td><td class="r">${UI.num(U.sum(rs, r => r.cost))}</td><td class="r">${UI.num(U.sum(rs, r => r.profit))}</td><td></td>` };
  } },
  sales_customer: { group: 'Sales', title: 'Sales by customer', icon: 'users', desc: 'Revenue, payments and balances per customer.', build: f => {
    const g = groupBy(salesIn(f, ['sale', 'sale_return']), i => i.accountId);
    const rows = Object.entries(g).map(([id, xs]) => ({ id, name: accName(id), n: xs.filter(i => i.type === 'sale').length, total: U.sum(xs, i => sgn(i) * baseOf(i, Eng.calc(i).total)), paid: U.sum(xs, i => sgn(i) * baseOf(i, Eng.paidOf(i))) })).map(r => Object.assign(r, { due: r.total - r.paid })).sort((a, b) => b.total - a.total);
    return { kpis: [['Customers', rows.length, 'users'], ['Sales', UI.money(U.sum(rows, r => r.total)), 'chart'], ['Collected', UI.money(U.sum(rows, r => r.paid)), 'check'], ['Outstanding', UI.money(U.sum(rows, r => r.due)), 'alert']],
      chart: UI.hbars(rows.slice(0, 8).map(r => ({ label: r.name, value: U.r(r.total), link: 'statement/' + r.id }))), rows, onRow: r => App.go(`invoices/sale?party=${r.id}${f.from ? '&from=' + f.from : ''}${f.to ? '&to=' + f.to : ''}`),
      columns: [{ key: 'name', label: 'Customer' }, { key: 'n', label: 'Invoices', align: 'r' }, { key: 'total', label: 'Sales', align: 'r', text: r => UI.num(r.total), sortVal: r => r.total }, { key: 'paid', label: 'Paid', align: 'r', text: r => UI.num(r.paid), sortVal: r => r.paid }, { key: 'due', label: 'Unpaid', align: 'r', render: r => UI.signed(r.due), text: r => UI.num(r.due), sortVal: r => r.due }],
      footer: rs => `<td>Total</td><td class="r">${rs.reduce((a, r) => a + r.n, 0)}</td><td class="r">${UI.num(U.sum(rs, r => r.total))}</td><td class="r">${UI.num(U.sum(rs, r => r.paid))}</td><td class="r">${UI.num(U.sum(rs, r => r.due))}</td>` };
  } },
  sales_salesman: { group: 'Sales', title: 'Sales by salesman', icon: 'badge', desc: 'Net sales and commission per salesman.', build: f => {
    const rows = db().salesmen.map(s => { const xs = smSales(s.id, f.from, f.to), net = smNet(xs); return { s, n: xs.filter(i => i.type === 'sale').length, net, com: net * s.commission / 100 }; }).sort((a, b) => b.net - a.net);
    return { kpis: [['Salesmen', rows.length, 'badge'], ['Net sales', UI.money(U.sum(rows, r => r.net)), 'chart'], ['Commission', UI.money(U.sum(rows, r => r.com)), 'coins']],
      chart: UI.hbars(rows.map(r => ({ label: r.s.name, value: U.r(r.net), link: `salesman/${r.s.id}?from=${f.from}&to=${f.to}` }))), rows, onRow: r => App.go(`salesman/${r.s.id}?from=${f.from}&to=${f.to}`),
      columns: [{ key: 'name', label: 'Salesman', text: r => r.s.name }, { key: 'n', label: 'Invoices', align: 'r' }, { key: 'rate', label: 'Rate %', align: 'r', text: r => r.s.commission }, { key: 'net', label: 'Net sales', align: 'r', text: r => UI.num(r.net), sortVal: r => r.net }, { key: 'com', label: 'Commission', align: 'r', text: r => UI.num(r.com), sortVal: r => r.com }] };
  } },
  profit_invoice: { group: 'Sales', title: 'Profit by invoice', icon: 'scale', desc: 'Gross profit of every sale after cost of goods.', build: f => {
    const rows = salesIn(f, ['sale', 'sale_return']).map(i => { const net = sgn(i) * baseOf(i, Eng.calc(i).net), cogs = sgn(i) * lineCogs(i); return { i, net, cogs, profit: net - cogs }; }).sort((a, b) => b.i.date.localeCompare(a.i.date));
    const N = U.sum(rows, r => r.net), P = U.sum(rows, r => r.profit);
    return { kpis: [['Invoices', rows.length, 'file'], ['Net revenue', UI.money(N), 'chart'], ['Cost of goods', UI.money(U.sum(rows, r => r.cogs)), 'coins'], ['Gross profit', UI.money(P), 'scale'], ['Margin', N ? U.r(P / N * 100, 1) + '%' : '—', 'tag']],
      rows, onRow: r => App.go('invoice/' + r.i.id),
      columns: [{ key: 'no', label: 'Invoice', text: r => r.i.no }, { key: 'date', label: 'Date', text: r => UI.date(r.i.date), sortVal: r => r.i.date }, { key: 'party', label: 'Customer', text: r => accName(r.i.accountId) }, { key: 'net', label: 'Net revenue', align: 'r', text: r => UI.num(r.net), sortVal: r => r.net }, { key: 'cogs', label: 'Cost', align: 'r', text: r => UI.num(r.cogs), sortVal: r => r.cogs }, { key: 'profit', label: 'Profit', align: 'r', render: r => UI.signed(r.profit), text: r => UI.num(r.profit), sortVal: r => r.profit }, { key: 'm', label: 'Margin', align: 'r', text: r => r.net ? U.r(r.profit / r.net * 100, 1) + '%' : '—', sortVal: r => r.net ? r.profit / r.net : 0 }],
      footer: rs => `<td colspan="3">Total</td><td class="r">${UI.num(U.sum(rs, r => r.net))}</td><td class="r">${UI.num(U.sum(rs, r => r.cogs))}</td><td class="r">${UI.num(U.sum(rs, r => r.profit))}</td><td></td>` };
  } },
  purchases_supplier: { group: 'Purchases', title: 'Purchases by supplier', icon: 'truck', desc: 'Purchases, payments and amounts owed per supplier.', build: f => {
    const g = groupBy(salesIn(f, ['purchase', 'purchase_return']), i => i.accountId);
    const rows = Object.entries(g).map(([id, xs]) => ({ id, name: accName(id), n: xs.filter(i => i.type === 'purchase').length, net: U.sum(xs, i => sgn(i) * baseOf(i, Eng.calc(i).net)), tax: U.sum(xs, i => sgn(i) * baseOf(i, Eng.calc(i).tax)), total: U.sum(xs, i => sgn(i) * baseOf(i, Eng.calc(i).total)), paid: U.sum(xs, i => sgn(i) * baseOf(i, Eng.paidOf(i))) })).sort((a, b) => b.total - a.total);
    return { kpis: [['Suppliers', rows.length, 'truck'], ['Purchases', UI.money(U.sum(rows, r => r.total)), 'chart'], ['Paid', UI.money(U.sum(rows, r => r.paid)), 'check'], ['Unpaid', UI.money(U.sum(rows, r => r.total - r.paid)), 'alert']],
      chart: UI.hbars(rows.map(r => ({ label: r.name, value: U.r(r.total), link: 'statement/' + r.id }))), rows, onRow: r => App.go(`invoices/purchase?party=${r.id}`),
      columns: [{ key: 'name', label: 'Supplier' }, { key: 'n', label: 'Invoices', align: 'r' }, { key: 'net', label: 'Net', align: 'r', text: r => UI.num(r.net) }, { key: 'tax', label: 'Tax', align: 'r', text: r => UI.num(r.tax) }, { key: 'total', label: 'Total', align: 'r', text: r => UI.num(r.total), sortVal: r => r.total }, { key: 'paid', label: 'Paid', align: 'r', text: r => UI.num(r.paid) }, { key: 'due', label: 'Unpaid', align: 'r', text: r => UI.num(r.total - r.paid), sortVal: r => r.total - r.paid }] };
  } },
  stock_valuation: { group: 'Inventory', title: 'Stock valuation', icon: 'warehouse', desc: 'Quantity, cost value and retail value of stock.', dates: false, build: () => {
    const sm = Eng.stockMap(), rows = db().items.filter(i => i.type !== 'service' && sm.item(i.id) !== 0).map(i => ({ i, q: sm.item(i.id), v: sm.item(i.id) * i.cost, rv: sm.item(i.id) * i.price })).sort((a, b) => b.v - a.v);
    const byCat = groupBy(rows, r => r.i.categoryId);
    return { kpis: [['Items in stock', rows.length, 'box'], ['Cost value', UI.money(U.sum(rows, r => r.v)), 'coins'], ['Retail value', UI.money(U.sum(rows, r => r.rv)), 'tag'], ['Potential profit', UI.money(U.sum(rows, r => r.rv - r.v)), 'chart']],
      chart: UI.hbars(Object.entries(byCat).map(([c, xs]) => ({ label: catName(c), value: U.r(U.sum(xs, r => r.v)), link: 'inventory?cat=' + c })).sort((a, b) => b.value - a.value)), rows, onRow: r => App.go('item/' + r.i.id),
      columns: [{ key: 'code', label: 'Code', text: r => r.i.code }, { key: 'name', label: 'Item', text: r => r.i.name }, { key: 'cat', label: 'Category', text: r => catName(r.i.categoryId) }, { key: 'q', label: 'Qty', align: 'r', text: r => UI.qty(r.q), sortVal: r => r.q }, { key: 'cost', label: 'Avg cost', align: 'r', text: r => UI.num(r.i.cost) }, { key: 'v', label: 'Cost value', align: 'r', text: r => UI.num(r.v), sortVal: r => r.v }, { key: 'rv', label: 'Retail value', align: 'r', text: r => UI.num(r.rv), sortVal: r => r.rv }],
      footer: rs => `<td colspan="5">Total</td><td class="r">${UI.num(U.sum(rs, r => r.v))}</td><td class="r">${UI.num(U.sum(rs, r => r.rv))}</td>` };
  } },
  lowstock: { group: 'Inventory', title: 'Low stock / reorder', icon: 'alert', desc: 'Items at or below their minimum quantity, with suggested order.', dates: false, build: () => {
    const rows = Eng.lowStock().map(x => { const lastP = db().invoices.filter(i => i.type === 'purchase' && i.lines.some(l => l.itemId === x.item.id)).sort((a, b) => b.date.localeCompare(a.date))[0]; return { i: x.item, q: x.qty, sug: Math.max(1, Math.ceil(x.item.minQty * 2 - x.qty)), sup: lastP ? lastP.accountId : '' }; });
    return { kpis: [['Items to reorder', rows.length, 'alert'], ['Estimated cost', UI.money(U.sum(rows, r => r.sug * r.i.cost)), 'coins']],
      actions: rows.length && App.can('invoices') ? `<a class="btn btn-primary" href="#/invoice/new/purchase?low=1">${UI.icon('truck')}<span>Create purchase for all</span></a>` : '', rows, onRow: r => App.go('item/' + r.i.id),
      columns: [{ key: 'code', label: 'Code', text: r => r.i.code }, { key: 'name', label: 'Item', text: r => r.i.name }, { key: 'q', label: 'On hand', align: 'r', render: r => `<b class="neg">${UI.qty(r.q)}</b>`, text: r => r.q }, { key: 'min', label: 'Minimum', align: 'r', text: r => UI.qty(r.i.minQty) }, { key: 'sug', label: 'Suggested order', align: 'r', text: r => UI.qty(r.sug) }, { key: 'cost', label: 'Est. cost', align: 'r', text: r => UI.num(r.sug * r.i.cost) }, { key: 'sup', label: 'Last supplier', text: r => r.sup ? accName(r.sup) : '—' },
        { key: 'a', label: '', sort: false, noExport: true, render: r => App.can('invoices') ? `<a class="btn btn-light btn-sm" href="#/invoice/new/purchase?item=${r.i.id}${r.sup ? '&party=' + r.sup : ''}">Order</a>` : '' }] };
  } },
  item_movement: { group: 'Inventory', title: 'Item movement summary', icon: 'truck', desc: 'Opening, in, out and closing quantity per item for a period.', build: f => {
    const mv = db().stockMoves, rows = db().items.filter(i => i.type !== 'service').map(i => { const ms = mv.filter(m => m.itemId === i.id); const open = U.sum(ms.filter(m => f.from && m.date < f.from), m => m.qty), per = ms.filter(m => inRange(m.date, f)), inQ = U.sum(per.filter(m => m.qty > 0 && m.type !== 'transfer'), m => m.qty), outQ = -U.sum(per.filter(m => m.qty < 0 && m.type !== 'transfer'), m => m.qty); return { i, open, inQ, outQ, close: open + inQ - outQ }; }).filter(r => r.open || r.inQ || r.outQ);
    return { kpis: [['Items moved', rows.length, 'box'], ['Total in', UI.qty(U.sum(rows, r => r.inQ)), 'plus'], ['Total out', UI.qty(U.sum(rows, r => r.outQ)), 'minus']], rows, onRow: r => App.go('item/' + r.i.id),
      columns: [{ key: 'code', label: 'Code', text: r => r.i.code }, { key: 'name', label: 'Item', text: r => r.i.name }, { key: 'open', label: 'Opening', align: 'r', text: r => UI.qty(r.open) }, { key: 'in', label: 'In', align: 'r', text: r => UI.qty(r.inQ), sortVal: r => r.inQ }, { key: 'out', label: 'Out', align: 'r', text: r => UI.qty(r.outQ), sortVal: r => r.outQ }, { key: 'close', label: 'Closing', align: 'r', text: r => UI.qty(r.close) }] };
  } },
  waste: { group: 'Inventory', title: 'Waste report', icon: 'trash', desc: 'Damaged, expired and spoiled stock with value.', build: f => {
    const rows = []; db().adjustments.filter(a => a.kind === 'waste' && inRange(a.date, f)).forEach(a => a.lines.forEach(l => rows.push({ a, l, it: Eng.item(l.itemId) || { name: '?' }, v: l.qty * l.cost })));
    const g = groupBy(rows, r => r.it.name);
    return { kpis: [['Waste lines', rows.length, 'trash'], ['Total value', UI.money(U.sum(rows, r => r.v)), 'coins']], chart: UI.hbars(Object.entries(g).map(([n, xs]) => ({ label: n, value: U.r(U.sum(xs, r => r.v)) })).sort((a, b) => b.value - a.value).slice(0, 8)),
      rows, onRow: r => V.showAdjustment(r.a.id),
      columns: [{ key: 'date', label: 'Date', text: r => UI.date(r.a.date), sortVal: r => r.a.date }, { key: 'no', label: 'Document', text: r => r.a.no }, { key: 'item', label: 'Item', text: r => r.it.name }, { key: 'qty', label: 'Qty', align: 'r', text: r => UI.qty(r.l.qty) }, { key: 'v', label: 'Value', align: 'r', text: r => UI.num(r.v), sortVal: r => r.v }, { key: 'reason', label: 'Reason', text: r => r.a.reason || '' }, { key: 'wh', label: 'Warehouse', text: r => whName(r.a.warehouseId) }] };
  } },
  pnl: { group: 'Financial', title: 'Income statement (P&L)', icon: 'chart', desc: 'Revenue, cost of sales, expenses and net profit.', build: f => {
    const t = Eng.totals(f), accs = db().accounts.filter(a => !a.isGroup && (a.type === 'revenue' || a.type === 'expense'));
    const amt = a => { const x = t[a.id] ? t[a.id].dr - t[a.id].cr : 0; return a.type === 'revenue' ? -x : x; };
    const rev = accs.filter(a => a.type === 'revenue' && amt(a)), cogs = accs.filter(a => a.sys === 'cogs'), exp = accs.filter(a => a.type === 'expense' && a.sys !== 'cogs' && amt(a));
    const R = U.sum(rev, amt), C = U.sum(cogs, amt), G = R - C, E = U.sum(exp, amt), N = G - E;
    const line = (a, cls = '') => `<tr class="${cls}" data-acc="${a.id}"><td>${UI.esc(a.code)}</td><td>${UI.esc(a.name)}</td><td class="r">${UI.signed(amt(a))}</td></tr>`;
    return { kpis: [['Revenue', UI.money(R), 'chart'], ['Gross profit', UI.money(G), 'scale'], ['Expenses', UI.money(E), 'minus'], ['Net profit', UI.money(N), N >= 0 ? 'check' : 'alert']],
      html: `<table class="tbl clickable fin" id="rp-fin"><tbody><tr class="sec"><td colspan="3">Revenue</td></tr>${rev.map(a => line(a)).join('')}<tr class="sub"><td colspan="2">Total revenue</td><td class="r">${UI.num(R)}</td></tr>
        <tr class="sec"><td colspan="3">Cost of sales</td></tr>${cogs.map(a => line(a)).join('')}<tr class="sub"><td colspan="2">Gross profit</td><td class="r">${UI.signed(G)}</td></tr>
        <tr class="sec"><td colspan="3">Operating expenses</td></tr>${exp.map(a => line(a)).join('')}<tr class="sub"><td colspan="2">Total expenses</td><td class="r">${UI.num(E)}</td></tr>
        <tr class="grand"><td colspan="2">Net ${N >= 0 ? 'profit' : 'loss'}</td><td class="r">${UI.signed(N)}</td></tr></tbody></table>` };
  } },
  balance_sheet: { group: 'Financial', title: 'Balance sheet', icon: 'scale', desc: 'Assets, liabilities and equity as of a date.', single: true, build: f => {
    const t = Eng.totals({ to: f.to }), map = Eng.childMap(), d = db();
    const bal = a => Eng.natural(a, Eng.balance(a.id, { totals: t, map }));
    const earn = -U.sum(d.accounts.filter(a => !a.isGroup && (a.type === 'revenue' || a.type === 'expense')), a => t[a.id] ? t[a.id].dr - t[a.id].cr : 0);
    const sec = type => d.accounts.filter(a => a.type === type && a.parentId && Eng.account(a.parentId) && !Eng.account(a.parentId).parentId);
    const rows = list => list.map(a => `<tr data-acc="${a.id}"><td>${UI.esc(a.code)}</td><td>${UI.esc(a.name)}</td><td class="r">${UI.signed(bal(a))}</td></tr>`).join('');
    const A = bal(Eng.account('acc_g_assets')), L = bal(Eng.account('acc_g_liab')), Q = bal(Eng.account('acc_g_equity'));
    return { kpis: [['Total assets', UI.money(A), 'warehouse'], ['Liabilities', UI.money(L), 'truck'], ['Equity + earnings', UI.money(Q + earn), 'users'], ['Check', Math.abs(A - L - Q - earn) < 0.05 ? 'Balanced ✓' : 'Off by ' + UI.num(A - L - Q - earn), 'check']],
      html: `<table class="tbl clickable fin" id="rp-fin"><tbody><tr class="sec"><td colspan="3">Assets</td></tr>${rows(sec('asset'))}<tr class="sub"><td colspan="2">Total assets</td><td class="r">${UI.num(A)}</td></tr>
        <tr class="sec"><td colspan="3">Liabilities</td></tr>${rows(sec('liability'))}<tr class="sub"><td colspan="2">Total liabilities</td><td class="r">${UI.num(L)}</td></tr>
        <tr class="sec"><td colspan="3">Equity</td></tr>${rows(sec('equity'))}<tr><td></td><td>Current earnings (profit to date)</td><td class="r">${UI.signed(earn)}</td></tr><tr class="sub"><td colspan="2">Total equity</td><td class="r">${UI.num(Q + earn)}</td></tr>
        <tr class="grand"><td colspan="2">Liabilities + equity</td><td class="r">${UI.num(L + Q + earn)}</td></tr></tbody></table>` };
  } },
  expenses: { group: 'Financial', title: 'Expense breakdown', icon: 'wallet', desc: 'Where the money went, by expense account.', build: f => {
    const t = Eng.totals(f), rows = db().accounts.filter(a => a.type === 'expense' && !a.isGroup).map(a => ({ a, v: t[a.id] ? t[a.id].dr - t[a.id].cr : 0 })).filter(r => r.v).sort((a, b) => b.v - a.v), T = U.sum(rows, r => r.v);
    return { kpis: [['Total expenses', UI.money(T), 'wallet'], ['Accounts', rows.length, 'list']], chart: UI.hbars(rows.map(r => ({ label: r.a.name, value: U.r(r.v), link: `statement/${r.a.id}?from=${f.from}&to=${f.to}` }))), rows, onRow: r => App.go(`statement/${r.a.id}?from=${f.from}&to=${f.to}`),
      columns: [{ key: 'code', label: 'Code', text: r => r.a.code }, { key: 'name', label: 'Account', text: r => r.a.name }, { key: 'v', label: 'Amount', align: 'r', text: r => UI.num(r.v), sortVal: r => r.v }, { key: 'p', label: 'Share', align: 'r', text: r => T ? U.r(r.v / T * 100, 1) + '%' : '' }] };
  } },
  customer_balances: { group: 'Receivables & payables', title: 'Customer balances & aging', icon: 'users', desc: 'What each customer owes, split by invoice age.', single: true, build: f => aging('customer', f) },
  supplier_balances: { group: 'Receivables & payables', title: 'Supplier balances & aging', icon: 'truck', desc: 'What you owe each supplier, split by invoice age.', single: true, build: f => aging('supplier', f) },
  cash_daily: { group: 'Cash & tax', title: 'Daily cash report', icon: 'cash', desc: 'Cash and bank in / out per day with running balance.', build: f => {
    const ids = new Set(Eng.cashAccounts().map(a => a.id)), d = db();
    let open = 0; d.journal.forEach(j => { if (f.from && j.date < f.from) j.lines.forEach(l => { if (ids.has(l.accountId)) open += l.debit - l.credit; }); });
    const g = {}; d.journal.filter(j => inRange(j.date, f)).forEach(j => j.lines.forEach(l => { if (!ids.has(l.accountId)) return; const r = g[j.date] || (g[j.date] = { date: j.date, inn: 0, out: 0 }); r.inn += l.debit; r.out += l.credit; }));
    let run = open; const rows = Object.values(g).sort((a, b) => a.date.localeCompare(b.date)).map(r => { run += r.inn - r.out; return Object.assign(r, { bal: run }); }).reverse();
    return { kpis: [['Opening', UI.money(open), 'book'], ['Cash in', UI.money(U.sum(rows, r => r.inn)), 'plus'], ['Cash out', UI.money(U.sum(rows, r => r.out)), 'minus'], ['Closing', UI.money(run), 'wallet']],
      chart: UI.bars(rows.slice(0, 21).reverse().map(r => ({ label: r.date.slice(5), value: U.r(r.inn - r.out), link: 'cashbox?date=' + r.date })), v => UI.num(v, 0)), rows, onRow: r => App.go('cashbox?date=' + r.date),
      columns: [{ key: 'date', label: 'Date', text: r => UI.date(r.date), sortVal: r => r.date }, { key: 'inn', label: 'In', align: 'r', text: r => UI.num(r.inn) }, { key: 'out', label: 'Out', align: 'r', text: r => UI.num(r.out) }, { key: 'net', label: 'Net', align: 'r', render: r => UI.signed(r.inn - r.out), text: r => UI.num(r.inn - r.out) }, { key: 'bal', label: 'Balance', align: 'r', text: r => UI.num(r.bal) }] };
  } },
  vat: { group: 'Cash & tax', title: 'VAT / tax report', icon: 'receipt', desc: 'Output tax on sales, input tax on purchases, net payable by month.', build: f => {
    const g = {}; db().journal.filter(j => inRange(j.date, f)).forEach(j => j.lines.forEach(l => { if (l.accountId !== 'acc_vat_out' && l.accountId !== 'acc_vat_in') return; const k = j.date.slice(0, 7), r = g[k] || (g[k] = { m: k, out: 0, inn: 0 }); if (l.accountId === 'acc_vat_out') r.out += l.credit - l.debit; else r.inn += l.debit - l.credit; }));
    const rows = Object.values(g).sort((a, b) => b.m.localeCompare(a.m)), O = U.sum(rows, r => r.out), I = U.sum(rows, r => r.inn);
    return { kpis: [['Output VAT (sales)', UI.money(O), 'chart'], ['Input VAT (purchases)', UI.money(I), 'truck'], [O - I >= 0 ? 'Net VAT payable' : 'Net VAT refundable', UI.money(Math.abs(O - I)), 'scale']], rows, onRow: r => App.go(`statement/acc_vat_out?from=${r.m}-01&to=${r.m}-31`),
      columns: [{ key: 'm', label: 'Month', text: r => new Date(r.m + '-15').toLocaleDateString(I18N.loc(), { month: 'long', year: 'numeric' }), sortVal: r => r.m }, { key: 'out', label: 'Output VAT', align: 'r', text: r => UI.num(r.out) }, { key: 'inn', label: 'Input VAT', align: 'r', text: r => UI.num(r.inn) }, { key: 'net', label: 'Net payable', align: 'r', render: r => UI.signed(r.out - r.inn), text: r => UI.num(r.out - r.inn) }],
      footer: rs => `<td>Total</td><td class="r">${UI.num(U.sum(rs, r => r.out))}</td><td class="r">${UI.num(U.sum(rs, r => r.inn))}</td><td class="r">${UI.num(U.sum(rs, r => r.out - r.inn))}</td>` };
  } },
};
function aging(kind, f) {
  const d = db(), asOf = f.to || U.today(), want = kind === 'customer' ? ['sale'] : ['purchase'];
  const rows = Eng.parties(kind).map(a => {
    const bal = Eng.natural(a, Eng.balance(a.id, { to: asOf })), b = [0, 0, 0, 0];
    d.invoices.filter(i => i.accountId === a.id && want.includes(i.type) && i.date <= asOf).forEach(i => { const due = baseOf(i, Eng.dueOf(i)); if (due <= 0.004) return; const age = U.daysBetween(i.date, asOf); b[age <= 30 ? 0 : age <= 60 ? 1 : age <= 90 ? 2 : 3] += due; });
    return { a, bal, b, other: bal - U.sum(b) };
  }).filter(r => Math.abs(r.bal) > 0.004 || U.sum(r.b) > 0.004).sort((x, y) => y.bal - x.bal);
  return { kpis: [[kind === 'customer' ? 'Total receivable' : 'Total payable', UI.money(U.sum(rows, r => r.bal)), 'coins'], ['0–30 days', UI.money(U.sum(rows, r => r.b[0])), 'clock'], ['31–60 days', UI.money(U.sum(rows, r => r.b[1])), 'clock'], ['Over 60 days', UI.money(U.sum(rows, r => r.b[2] + r.b[3])), 'alert']],
    rows, onRow: r => App.go('statement/' + r.a.id),
    columns: [{ key: 'name', label: kind === 'customer' ? 'Customer' : 'Supplier', text: r => r.a.name }, { key: 'phone', label: 'Phone', text: r => r.a.phone || '' }, ...['0–30', '31–60', '61–90', '90+'].map((l, i) => ({ key: 'b' + i, label: l + ' days', align: 'r', text: r => r.b[i] ? UI.num(r.b[i]) : '', sortVal: r => r.b[i] })),
      { key: 'other', label: 'Unapplied', align: 'r', text: r => Math.abs(r.other) > 0.004 ? UI.num(r.other) : '' }, { key: 'bal', label: 'Balance', align: 'r', render: r => `<b>${UI.signed(r.bal)}</b>`, text: r => UI.num(r.bal), sortVal: r => r.bal }],
    footer: rs => `<td colspan="2">Total</td>${[0, 1, 2, 3].map(i => `<td class="r">${UI.num(U.sum(rs, r => r.b[i]))}</td>`).join('')}<td class="r">${UI.num(U.sum(rs, r => r.other))}</td><td class="r">${UI.num(U.sum(rs, r => r.bal))}</td>` };
}

V.reports = el => {
  const groups = groupBy(Object.entries(REPORTS), ([, r]) => r.group);
  el.innerHTML = UI.head({ title: 'All Reports', icon: 'chart', crumbs: [['Reports']], sub: Object.keys(REPORTS).length + 2 + ' reports — click any report, then click any row to drill down to the source.' }) +
    Object.entries(groups).map(([g, list]) => `<div class="section-label mt">${g}</div><div class="report-cards">${list.map(([k, r]) => `<a class="rcard" href="#/report/${k}"><span class="rc-ic">${UI.icon(r.icon)}</span><div><b>${r.title}</b><small>${r.desc}</small></div>${UI.icon('chevR', 'rc-go')}</a>`).join('')}</div>`).join('') +
    `<div class="section-label mt">Accounting</div><div class="report-cards">
      <a class="rcard" href="#/trial-balance"><span class="rc-ic">${UI.icon('scale')}</span><div><b>Trial balance</b><small>Debit and credit totals of every account.</small></div>${UI.icon('chevR', 'rc-go')}</a>
      <a class="rcard" href="#/statement"><span class="rc-ic">${UI.icon('book')}</span><div><b>Account statement</b><small>Every transaction of one account with running balance.</small></div>${UI.icon('chevR', 'rc-go')}</a></div>`;
};
V.report = (el, [key], q) => {
  const R = REPORTS[key];
  if (!R) return App.go('reports');
  const f = { from: R.dates === false || R.single ? '' : (q.from ?? U.monthStart()), to: R.dates === false ? '' : (q.to || U.today()) };
  if (q.from === '' || q.all) f.from = '';
  const res = R.build(f);
  const presets = [['Today', U.today(), U.today()], ['This month', U.monthStart(), U.today()], ['Last 30 days', U.addDays(U.today(), -30), U.today()], ['This year', U.yearStart(), U.today()]];
  el.innerHTML = UI.head({ title: R.title, icon: R.icon, crumbs: [['Reports', 'reports'], [R.title]], sub: R.desc,
    actions: (res.actions || '') + UI.btn('Print', { icon: 'printer', cls: 'btn-primary', attrs: 'id="rp-print"' }) }) +
    (R.dates === false ? '' : `<div class="card"><div class="filters">${R.single ? '' : UI.fld('From', UI.inp('from', f.from, 'type="date"'))}${UI.fld(R.single ? 'As of' : 'To', UI.inp('to', f.to, 'type="date"'))}
      ${R.single ? '' : `<div class="chips">${presets.map(([l, a, b]) => `<button class="chip ${f.from === a && f.to === b ? 'active' : ''}" data-f="${a}" data-t="${b}">${l}</button>`).join('')}</div>`}</div></div>`) +
    `<div class="kpis">${res.kpis.map(([l, v, ic], i) => UI.kpi(l, v, { icon: ic, tone: ['', 't2', 't3', 't4', 't5'][i % 5] })).join('')}</div>
    ${res.chart ? `<div class="card"><div class="card-body">${res.chart}</div></div>` : ''}
    <div class="card" id="rp-body">${res.html ? res.html : '<div id="rp-tbl"></div>'}</div>`;
  const go = (a, b) => App.go(`report/${key}?from=${a ?? ''}&to=${b ?? ''}`);
  el.querySelectorAll('.filters [name]').forEach(i => i.onchange = () => go(el.querySelector('[name=from]') ? el.querySelector('[name=from]').value : '', el.querySelector('[name=to]').value));
  el.querySelectorAll('.chips .chip').forEach(c => c.onclick = () => go(c.dataset.f, c.dataset.t));
  let tbl;
  if (res.html) el.querySelectorAll('#rp-fin [data-acc]').forEach(tr => tr.onclick = () => App.go(`statement/${tr.dataset.acc}?from=${f.from || '2000-01-01'}&to=${f.to || U.today()}`));
  else tbl = UI.mountTable(el.querySelector('#rp-tbl'), { rows: res.rows, columns: res.columns, onRow: res.onRow, footer: res.footer, csv: key, pageSize: 25, empty: 'No data for this period.' });
  el.querySelector('#rp-print').onclick = () => {
    const sub = R.dates === false ? 'As of ' + UI.date(U.today()) : R.single ? 'As of ' + UI.date(f.to) : `${f.from ? UI.date(f.from) : 'Beginning'} → ${UI.date(f.to)}`;
    const kp = `<div class="print-kpis">${res.kpis.map(([l, v]) => `<div><span>${l}</span><b>${v}</b></div>`).join('')}</div>`;
    if (res.html) return UI.printTable(R.title, sub, kp + res.html);
    const cols = res.columns.filter(c => !c.noExport), rows = tbl.rows();
    UI.printTable(R.title, sub, kp + `<table class="doc-table"><thead><tr>${cols.map(c => `<th class="${c.align === 'r' ? 'r' : ''}">${c.label}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${cols.map(c => `<td class="${c.align === 'r' ? 'r' : ''}">${UI.esc(c.text ? c.text(r) : r[c.key] ?? '')}</td>`).join('')}</tr>`).join('')}</tbody>${res.footer && rows.length ? `<tfoot><tr>${res.footer(rows)}</tr></tfoot>` : ''}</table>`);
  };
};
