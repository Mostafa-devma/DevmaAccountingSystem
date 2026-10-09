/* Devma — soft, multi-colour illustrated icons for the dashboard tiles (viewBox 0 0 64 64) */
'use strict';
const ILLUS = (() => {
  const C = { navy: '#2b3a55', blue: '#4f8cf7', sky: '#a8c8ff', teal: '#2bb3a3', green: '#4cc285', yellow: '#ffc94d', orange: '#ff9f43', red: '#ff6b6b', purple: '#8b7cf6', gray: '#d5dde8', gray2: '#9aa8bd', white: '#ffffff', skin: '#f6c9a5', brown: '#c98a52', brown2: '#a8703f', wood: '#8b5e3c' };
  const shadow = '<ellipse cx="32" cy="59" rx="22" ry="3" fill="#000" opacity=".08"/>';
  const gloss = (x, y, w, h, rx = 3) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="#fff" opacity=".22"/>`;
  const gear = (cx, cy, r, n, fill, hole = '#fff') => {
    const ri = r * 0.76, pts = [];
    for (let i = 0; i < n * 2; i++) {
      const a = i * Math.PI / n, w = Math.PI / n * 0.42, rr = i % 2 ? ri : r;
      pts.push([cx + rr * Math.cos(a - w), cy + rr * Math.sin(a - w)], [cx + rr * Math.cos(a + w), cy + rr * Math.sin(a + w)]);
    }
    return `<path d="M${pts.map(p => p.map(v => v.toFixed(1)).join(' ')).join(' L')}Z" fill="${fill}"/><circle cx="${cx}" cy="${cy}" r="${(r * 0.34).toFixed(1)}" fill="${hole}"/>`;
  };
  const person = (cx, cy, s, shirt, hair = C.navy) => `<path d="M${cx - 15 * s} ${cy + 26 * s} a${15 * s} ${13 * s} 0 0 1 ${30 * s} 0 z" fill="${shirt}"/><circle cx="${cx}" cy="${cy}" r="${9 * s}" fill="${C.skin}"/><path d="M${cx - 9 * s} ${cy - 1 * s} a${9 * s} ${9 * s} 0 0 1 ${18 * s} 0 q${-9 * s} ${-5 * s} ${-18 * s} 0z" fill="${hair}"/>`;
  const txt = (x, y, t, size, fill) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="Segoe UI, Arial, sans-serif" font-weight="800" font-size="${size}" fill="${fill}">${t}</text>`;
  return {
    pos: shadow + `<rect x="36" y="5" width="13" height="16" rx="1" fill="${C.white}" stroke="${C.gray}"/><path d="M39 10h7M39 14h7" stroke="${C.gray2}" stroke-width="1.5"/>
      <rect x="9" y="10" width="24" height="15" rx="3" fill="${C.navy}"/><rect x="12" y="13" width="18" height="7" rx="1.5" fill="${C.green}"/><rect x="18" y="25" width="6" height="4" fill="${C.gray2}"/>
      <rect x="6" y="28" width="52" height="18" rx="4" fill="${C.blue}"/>${gloss(8, 30, 48, 4)}${[0, 1, 2, 3].map(c => [0, 1].map(r => `<rect x="${12 + c * 9}" y="${34 + r * 5}" width="6" height="3" rx="1" fill="#fff" opacity=".85"/>`).join('')).join('')}<rect x="48" y="34" width="6" height="8" rx="1" fill="${C.yellow}"/>
      <rect x="4" y="46" width="56" height="11" rx="3" fill="${C.navy}"/><rect x="25" y="50" width="14" height="3" rx="1.5" fill="${C.sky}"/>`,
    converter: shadow + `<circle cx="22" cy="24" r="15" fill="${C.yellow}" stroke="#f0a020" stroke-width="3"/>${txt(22, 31, '$', 19, '#b86e00')}<circle cx="42" cy="40" r="15" fill="${C.green}" stroke="#2f9e63" stroke-width="3"/>${txt(42, 47, '€', 19, '#fff')}
      <path d="M40 8a16 16 0 0 1 14 12" fill="none" stroke="${C.blue}" stroke-width="3.5" stroke-linecap="round"/><path d="M50 19l4 2 2-5" fill="none" stroke="${C.blue}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="M24 56a16 16 0 0 1-14-12" fill="none" stroke="${C.red}" stroke-width="3.5" stroke-linecap="round"/><path d="M14 45l-4-2-2 5" fill="none" stroke="${C.red}" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    categories: shadow + `<rect x="8" y="6" width="34" height="34" rx="6" fill="${C.red}"/><rect x="15" y="13" width="34" height="34" rx="6" fill="${C.yellow}"/><rect x="22" y="20" width="34" height="34" rx="6" fill="${C.blue}"/>${gloss(24, 22, 30, 5)}
      <path d="M29 33h20M29 40h20M29 47h12" stroke="#fff" stroke-width="3" stroke-linecap="round"/>`,
    currencies: shadow + `<rect x="5" y="12" width="40" height="24" rx="3" fill="${C.green}"/><rect x="9" y="16" width="32" height="16" rx="2" fill="none" stroke="#fff" stroke-opacity=".6"/><circle cx="25" cy="24" r="6" fill="#fff" opacity=".85"/>${txt(25, 28, '$', 10, '#2f9e63')}
      ${[0, 1, 2, 3].map(i => `<ellipse cx="44" cy="${53 - i * 6}" rx="13" ry="4.5" fill="#f0a020"/><ellipse cx="44" cy="${51 - i * 6}" rx="13" ry="4.5" fill="${C.yellow}"/>`).join('')}${txt(44, 36, '$', 7, '#b86e00')}`,
    vouchers: shadow + `<rect x="14" y="6" width="38" height="50" rx="4" fill="${C.white}" stroke="${C.gray}" stroke-width="1.5"/><rect x="14" y="6" width="9" height="50" rx="3" fill="${C.purple}"/>${[0, 1, 2, 3, 4].map(i => `<circle cx="18.5" cy="${13 + i * 9}" r="2" fill="#fff"/>`).join('')}
      <path d="M28 16h18M28 23h18M28 30h14M28 37h18" stroke="${C.gray2}" stroke-width="2.5" stroke-linecap="round"/><path d="M38 52l16-16 4 4-16 16-6 2z" fill="${C.orange}"/><path d="M54 36l4 4 2-2-4-4z" fill="${C.red}"/>`,
    items: shadow + `<path d="M8 24l24-8 24 8-24 8z" fill="#e7b37a"/><path d="M8 24l24 8v24L8 48z" fill="${C.brown}"/><path d="M56 24L32 32v24l24-8z" fill="${C.brown2}"/>
      <path d="M8 24l-4 8 24 8 4-8z" fill="#ddb07c"/><path d="M56 24l4 8-24 8-4-8z" fill="#c4935e"/><rect x="18" y="8" width="10" height="12" rx="2" fill="${C.red}"/><rect x="31" y="5" width="11" height="14" rx="2" fill="${C.blue}"/><path d="M14 40l10 3" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>`,
    inventory: shadow + `<rect x="12" y="8" width="40" height="50" rx="5" fill="${C.blue}"/><rect x="17" y="15" width="30" height="38" rx="2" fill="${C.white}"/><rect x="24" y="4" width="16" height="9" rx="3" fill="${C.navy}"/>
      ${[0, 1, 2].map(i => `<path d="M21 ${24 + i * 10}l2.5 2.5 4.5-5" fill="none" stroke="${C.green}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><rect x="31" y="${22 + i * 10}" width="12" height="3" rx="1.5" fill="${C.gray}"/>`).join('')}`,
    accounts: shadow + person(42, 20, 0.9, C.purple) + person(24, 26, 1.05, C.blue, '#3b2a1e'),
    invoices: shadow + `<path d="M12 6h30l10 10v40H12z" fill="${C.white}" stroke="${C.gray}" stroke-width="1.5"/><path d="M42 6v10h10" fill="#e6ecf5"/><rect x="12" y="6" width="22" height="9" fill="${C.blue}"/>
      <path d="M18 24h28M18 31h28M18 38h18" stroke="${C.gray2}" stroke-width="2.5" stroke-linecap="round"/><circle cx="46" cy="47" r="11" fill="${C.green}"/>${txt(46, 52, '$', 14, '#fff')}`,
    cashbox: shadow + `<rect x="8" y="6" width="48" height="34" rx="5" fill="${C.navy}"/><rect x="14" y="11" width="36" height="13" rx="2" fill="${C.sky}"/><path d="M18 17h14" stroke="${C.blue}" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="16" y="30" width="32" height="4" rx="2" fill="#111827"/><rect x="21" y="32" width="22" height="24" rx="2" fill="${C.green}"/><circle cx="32" cy="45" r="5" fill="#fff" opacity=".85"/>${txt(32, 48.5, '$', 8, '#2f9e63')}`,
    salesman: shadow + `<path d="M13 58a19 17 0 0 1 38 0z" fill="${C.navy}"/><path d="M27 42l5 8 5-8z" fill="#fff"/><path d="M31 44h2l1 8-2 3-2-3z" fill="${C.red}"/><circle cx="32" cy="26" r="12" fill="${C.skin}"/>
      <path d="M20 25a12 12 0 0 1 24 0q-12-8-24 0z" fill="#3b2a1e"/><path d="M18 27a14 14 0 0 1 28 0" fill="none" stroke="${C.blue}" stroke-width="3"/><rect x="15" y="24" width="6" height="9" rx="3" fill="${C.blue}"/><rect x="43" y="24" width="6" height="9" rx="3" fill="${C.blue}"/><path d="M46 33q0 6-8 6" fill="none" stroke="${C.blue}" stroke-width="2"/><circle cx="37" cy="39" r="2" fill="${C.navy}"/>`,
    stockmgmt: shadow + `<rect x="3" y="16" width="36" height="28" rx="3" fill="${C.blue}"/>${gloss(5, 18, 32, 4)}<rect x="9" y="22" width="10" height="9" rx="1" fill="${C.yellow}"/><rect x="21" y="22" width="10" height="9" rx="1" fill="#e7b37a"/>
      <path d="M39 24h12l9 11v9H39z" fill="${C.orange}"/><path d="M43 27h7l6 8H43z" fill="${C.sky}"/><rect x="3" y="44" width="57" height="5" rx="2" fill="${C.navy}"/>
      <circle cx="15" cy="50" r="6" fill="${C.navy}"/><circle cx="15" cy="50" r="2.5" fill="${C.gray}"/><circle cx="48" cy="50" r="6" fill="${C.navy}"/><circle cx="48" cy="50" r="2.5" fill="${C.gray}"/>`,
    trialbalance: shadow + `<path d="M20 56h24l-4-6H24z" fill="${C.wood}"/><rect x="30" y="10" width="4" height="42" fill="#d9921b"/><circle cx="32" cy="9" r="4" fill="${C.yellow}"/><path d="M10 18l44-6" stroke="#d9921b" stroke-width="3.5" stroke-linecap="round"/>
      <path d="M10 18l-6 16M10 18l6 16M54 12l-6 16M54 12l6 16" stroke="${C.gray2}" stroke-width="1.5"/><path d="M2 34h16a8 8 0 0 1-16 0z" fill="${C.yellow}"/><path d="M46 28h16a8 8 0 0 1-16 0z" fill="${C.yellow}"/>
      <circle cx="7" cy="31" r="2.5" fill="${C.green}"/><circle cx="12" cy="31" r="2.5" fill="${C.green}"/><circle cx="54" cy="25" r="2.5" fill="${C.red}"/>`,
    statement: shadow + `<path d="M4 52V14q14-4 28 3v38q-14-7-28-3z" fill="${C.white}" stroke="${C.gray}"/><path d="M60 52V14q-14-4-28 3v38q14-7 28-3z" fill="${C.white}" stroke="${C.gray}"/><path d="M4 52q14-4 28 3 14-7 28-3v4q-14-3-28 3-14-6-28-3z" fill="${C.teal}"/>
      <path d="M9 22q9-2 18 1M9 29q9-2 18 1M9 36q9-2 18 1" stroke="${C.gray2}" stroke-width="2" stroke-linecap="round"/><path d="M37 40l6-8 5 4 7-11" fill="none" stroke="${C.blue}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/><circle cx="55" cy="25" r="2.5" fill="${C.orange}"/>`,
    warehouses: shadow + `<path d="M5 26L32 10l27 16v31H5z" fill="${C.orange}"/><path d="M2 27L32 9l30 18-3 4L32 15 5 31z" fill="#e0731a"/><rect x="17" y="32" width="30" height="25" fill="${C.navy}"/>
      ${[0, 1, 2, 3].map(i => `<rect x="17" y="${33 + i * 3.4}" width="30" height="1.4" fill="${C.gray2}" opacity=".7"/>`).join('')}<rect x="20" y="47" width="10" height="10" rx="1" fill="${C.brown}"/><rect x="32" y="49" width="10" height="8" rx="1" fill="#e7b37a"/><circle cx="32" cy="22" r="3.5" fill="#fff" opacity=".85"/>`,
    users: shadow + person(28, 22, 1.1, C.teal) + `<circle cx="46" cy="44" r="13" fill="#fff"/>` + gear(46, 44, 11, 8, C.purple),
    settings: shadow + gear(25, 27, 19, 9, C.blue) + gear(46, 45, 12, 8, C.yellow) + `<circle cx="25" cy="27" r="3" fill="${C.blue}"/>`,
    waste: shadow + `<path d="M16 22h30l-3 34H19z" fill="${C.gray}"/><path d="M24 28v22M31 28v22M38 28v22" stroke="${C.gray2}" stroke-width="2.5" stroke-linecap="round"/><rect x="12" y="15" width="38" height="7" rx="3" fill="${C.gray2}"/><rect x="25" y="10" width="12" height="6" rx="2" fill="${C.gray2}"/>
      <circle cx="47" cy="45" r="12" fill="${C.green}"/><path d="M41 45a6 6 0 0 1 10-4.5M53 45a6 6 0 0 1-10 4.5" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round"/><path d="M51 37v4h-4M43 53v-4h4" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    backup: shadow + `<ellipse cx="32" cy="48" rx="18" ry="5" fill="${C.navy}"/><rect x="14" y="40" width="36" height="8" fill="${C.navy}"/><ellipse cx="32" cy="40" rx="18" ry="5" fill="#3d5075"/>
      <path d="M17 36a10 10 0 0 1 2-20 15 15 0 0 1 28-3 10 10 0 0 1 1 23z" fill="${C.blue}"/>${gloss(22, 18, 22, 4, 2)}<path d="M32 33V20M26 25l6-6 6 6" fill="none" stroke="#fff" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/>`,
    reports: shadow + `<path d="M20 48l-6 10M44 48l6 10M32 48v9" stroke="${C.wood}" stroke-width="3" stroke-linecap="round"/><rect x="6" y="8" width="52" height="40" rx="4" fill="${C.white}" stroke="${C.gray}" stroke-width="1.5"/><rect x="6" y="8" width="52" height="6" rx="3" fill="${C.navy}"/>
      <rect x="13" y="32" width="7" height="11" rx="1" fill="${C.blue}"/><rect x="23" y="25" width="7" height="18" rx="1" fill="${C.green}"/><rect x="33" y="29" width="7" height="14" rx="1" fill="${C.yellow}"/><rect x="43" y="20" width="7" height="23" rx="1" fill="${C.red}"/><path d="M14 26l10-6 10 3 13-7" fill="none" stroke="${C.purple}" stroke-width="2" stroke-linecap="round"/>`,
    tasks: shadow + `<circle cx="28" cy="30" r="22" fill="${C.blue}"/><circle cx="28" cy="30" r="17" fill="#fff"/>${[0, 1, 2, 3].map(i => `<rect x="27" y="15" width="2" height="4" fill="${C.gray2}" transform="rotate(${i * 90} 28 30)"/>`).join('')}
      <path d="M28 30V19M28 30l8 5" stroke="${C.navy}" stroke-width="3" stroke-linecap="round"/><circle cx="28" cy="30" r="2.5" fill="${C.red}"/><circle cx="48" cy="46" r="12" fill="${C.yellow}"/><path d="M50 37l-7 10h5l-2 8 8-11h-5z" fill="#fff"/>`,
  };
})();
