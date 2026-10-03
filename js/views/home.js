/* Devma — Dashboard & About */
'use strict';
V.dashboard = el => {
  const d = db(), T = U.today(), ms = U.monthStart(), can = k => App.can(k);
  const baseTot = i => Eng.calc(i).total / (+i.rate || 1);
  const sales = d.invoices.filter(i => i.type === 'sale');
  const todayS = U.sum(sales.filter(i => i.date === T), baseTot), monthS = U.sum(sales.filter(i => i.date >= ms), baseTot);
  const tt = Eng.totals(), cash = U.sum(Eng.cashAccounts(), a => Eng.balance(a.id, { totals: tt }));
  const ar = Eng.balance('acc_ar', { totals: tt }), ap = -Eng.balance('acc_ap', { totals: tt }), low = Eng.lowStock().length;
  const occ = d.rooms.filter(r => r.status === 'occupied').length;
  const h = new Date().getHours(), greet = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  const rl = p => can('reports') ? p : '';
  const days = [...Array(7)].map((_, i) => U.addDays(T, i - 6));
  const recent = d.invoices.slice().sort((a, b) => (b.created || '').localeCompare(a.created || '')).slice(0, 7);

  el.innerHTML = `
  <div class="dash-hello"><div><h1>Good ${greet}, ${UI.esc(App.user.fullName.split(' ')[0])}</h1>
    <p class="muted">${new Date().toLocaleDateString(I18N.loc(), { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · ${UI.esc(d.settings.company)}</p></div>
    <div class="page-actions">${can('pos') ? `<a class="btn btn-accent" href="#/pos">${UI.icon('pos')}<span>Open POS</span></a>` : ''}${can('invoices') ? `<a class="btn btn-primary" href="#/invoice/new/sale">${UI.icon('plus')}<span>New sale</span></a>` : ''}</div></div>
  <div class="kpis">
    ${UI.kpi("Today's sales", UI.money(todayS), { icon: 'cash', link: rl(`report/sales_daily?from=${T}&to=${T}`), sub: sales.filter(i => i.date === T).length + ' invoice(s)' })}
    ${UI.kpi('This month', UI.money(monthS), { icon: 'chart', tone: 't2', link: rl('report/sales_daily'), sub: 'since ' + UI.date(ms) })}
    ${!can('cashbox') ? '' : UI.kpi('Cash & bank', UI.money(cash), { icon: 'wallet', tone: 't3', link: can('cashbox') ? 'cashbox' : '' })}
    ${can('accounts') || can('reports') ? UI.kpi('Receivables', UI.money(ar), { icon: 'users', tone: 't4', link: rl('report/customer_balances') }) + UI.kpi('Payables', UI.money(ap), { icon: 'truck', tone: 't5', link: rl('report/supplier_balances') }) : ''}
    ${UI.kpi('Low stock', low + ' item(s)', { icon: 'alert', tone: low ? 'warn' : 't6', link: rl('report/lowstock') })}
    ${UI.kpi('Rooms occupied', `${occ} / ${d.rooms.length}`, { icon: 'bed', tone: 't2', link: can('rooms') ? 'rooms' : '' })}
  </div>
  <div class="tiles">${MODULES.map(m => `<a class="tile ${m.hue} ${can(m.key) ? '' : 'locked'}" href="#/${m.path}" data-k="${m.key}" title="${m.label}">
      <span class="tile-ic">${UI.icon(m.icon)}</span><span class="tile-l">${m.label}</span>${can(m.key) ? '' : `<span class="tile-lock">${UI.icon('lock')}</span>`}</a>`).join('')}</div>
  <div class="grid g2 mt">
    <div class="card"><div class="card-head"><h3>${UI.icon('chart')}Sales — last 7 days</h3>${can('reports') ? '<a href="#/report/sales_daily" class="link">Full report →</a>' : ''}</div>
      <div class="card-body">${UI.bars(days.map(x => ({ label: new Date(x + 'T12:00').toLocaleDateString(I18N.loc(), { weekday: 'short', day: 'numeric' }), value: U.r(U.sum(sales.filter(i => i.date === x), baseTot)), link: rl(`report/sales_daily?from=${x}&to=${x}`) })), v => UI.num(v, 0))}</div></div>
    <div class="card"><div class="card-head"><h3>${UI.icon('file')}Recent invoices</h3>${can('invoices') ? '<a href="#/invoices/sale" class="link">All invoices →</a>' : ''}</div>
      <div class="card-body p0">${recent.length ? `<table class="tbl ${can('invoices') ? 'clickable' : ''}"><tbody>${recent.map(i => { const a = Eng.account(i.accountId); return `<tr data-id="${i.id}"><td><b>${i.no}</b><div class="muted sm">${Eng.INV[i.type].label}</div></td><td>${UI.esc(a ? a.name : '')}<div class="muted sm">${UI.date(i.date)}</div></td><td class="r">${UI.money(Eng.calc(i).total, i.currency)}</td><td class="r">${UI.statusBadge(Eng.statusOf(i))}</td></tr>`; }).join('')}</tbody></table>` : UI.empty('No invoices yet.', 'file')}</div></div>
  </div>`;
  el.querySelectorAll('.tile.locked').forEach(t => t.onclick = e => { e.preventDefault(); UI.toast('You do not have permission to open ' + t.title + '.', 'warn'); });
  if (can('invoices')) el.querySelectorAll('tr[data-id]').forEach(tr => tr.onclick = () => App.go('invoice/' + tr.dataset.id));
};

V.about = el => {
  const d = db();
  el.innerHTML = UI.head({ title: 'About System', icon: 'info', crumbs: [['About']] }) + `
  <div class="grid g2">
    <div class="card about-card"><div class="card-body">
      <div class="about-logo">${UI.logoSvg(84)}<div><div class="about-name"><b>Devma</b> Accounting System</div><div class="muted">Version 1.0 · ERP edition</div></div></div>
      <p>Devma is a complete point-of-sale, inventory and double-entry accounting system. Every sale, purchase, voucher and stock movement posts automatically to the general ledger, so the trial balance, account statements and financial reports are always up to date.</p>
      <ul class="feature-list">${['Point of sale with hold/recall, barcode entry and multi-currency tender', 'Rooms / tables board with check-in, room service and checkout billing', 'Sales, purchases and returns with partial payments', 'Receipt, payment and journal vouchers', 'Warehouses, transfers, stock counts, waste and opening stock', 'Production recipes (bill of materials) and disassembling', 'Trial balance, account statements, P&L, balance sheet and 16 reports', 'Users with role permissions, audit log, backups and automated tasks'].map(x => `<li>${UI.icon('check')}${x}</li>`).join('')}</ul>
    </div></div>
    <div class="stack">
      <div class="card"><div class="card-head"><h3>${UI.icon('database')}Your data</h3></div><div class="card-body"><div class="stats">
        ${[['Items', d.items.length, 'items'], ['Accounts', d.accounts.length, 'accounts/chart'], ['Invoices', d.invoices.length, 'invoices/sale'], ['Vouchers', d.vouchers.length, 'vouchers/receipt'], ['Journal entries', d.journal.length, 'trial-balance'], ['Stock movements', d.stockMoves.length, 'stock/moves']].map(([l, n, p]) => `<a class="stat" href="#/${p}"><b>${n}</b><span>${l}</span></a>`).join('')}
      </div><p class="muted sm mt">Storage used: ${(JSON.stringify(d).length / 1024).toFixed(1)} KB in this browser.</p></div></div>
      <div class="card"><div class="card-head"><h3>${UI.icon('key')}Keyboard shortcuts</h3></div><div class="card-body">
        <table class="tbl"><tbody><tr><td><kbd>F2</kbd></td><td>POS: focus search / barcode</td></tr><tr><td><kbd>F9</kbd></td><td>POS: pay</td></tr><tr><td><kbd>Enter</kbd></td><td>POS: add scanned barcode · Search: open first result</td></tr><tr><td><kbd>Esc</kbd></td><td>Close dialog</td></tr></tbody></table></div></div>
      <div class="card"><div class="card-head"><h3>${UI.icon('info')}Support</h3></div><div class="card-body"><p>Devma Computers &amp; Software<br>info@devma.com · +961 1 234 567</p>
        <button class="btn btn-light" id="ab-check">${UI.icon('refresh')}<span>Check system integrity</span></button></div></div>
    </div>
  </div>`;
  el.querySelector('#ab-check').onclick = () => {
    const t = Eng.totals(); let dr = 0, cr = 0; for (const k in t) { dr += t[k].dr; cr += t[k].cr; }
    const sm = Eng.stockMap(), stockVal = U.r(U.sum(d.items.filter(i => i.type !== 'service'), i => sm.item(i.id) * (+i.cost || 0)));
    const invAcc = Eng.balance('acc_inventory', { totals: t });
    const orphan = d.journal.filter(j => j.refType === 'invoice' && !Eng.get('invoices', j.refId)).length;
    UI.modal({ title: 'System integrity', icon: 'check', body: `<table class="tbl"><tbody>
      <tr><td>Ledger debits = credits</td><td class="r">${UI.num(dr)} / ${UI.num(cr)}</td><td>${U.r(dr) === U.r(cr) ? UI.badge('OK', 'green') : UI.badge('Mismatch', 'red')}</td></tr>
      <tr><td>Inventory account vs stock value</td><td class="r">${UI.num(invAcc)} / ${UI.num(stockVal)}</td><td>${Math.abs(invAcc - stockVal) < 1 ? UI.badge('OK', 'green') : UI.badge('Differs', 'amber')}</td></tr>
      <tr><td>Orphan journal entries</td><td class="r">${orphan}</td><td>${orphan ? UI.badge('Check', 'red') : UI.badge('OK', 'green')}</td></tr></tbody></table>
      <p class="muted sm mt">A small inventory difference can appear after editing old purchase invoices because item costs use a moving average.</p>`, buttons: [{ label: 'Close', cls: 'btn-primary', onClick: m => m.close() }] });
  };
};
