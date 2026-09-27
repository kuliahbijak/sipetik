/* =====================================================================
   SIPETIK — ui.js : utilitas tampilan, format angka/tanggal, ikon, modal
   ===================================================================== */
const UI = (() => {
  // ---------- Ikon (garis 24×24, gaya Lucide) ----------
  const P = {
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
    filePlus: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/>',
    folder: '<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',
    file: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>',
    fileCheck: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><polyline points="9 15 11 17 15 13"/>',
    sheet: '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><path d="M8 13h2M14 13h2M8 17h2M14 17h2"/>',
    users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
    userPlus: '<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>',
    shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    shieldCheck: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="m9 12 2 2 4-4"/>',
    key: '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
    sliders: '<line x1="21" y1="4" x2="14" y2="4"/><line x1="10" y1="4" x2="3" y2="4"/><line x1="21" y1="12" x2="12" y2="12"/><line x1="8" y1="12" x2="3" y2="12"/><line x1="21" y1="20" x2="16" y2="20"/><line x1="12" y1="20" x2="3" y2="20"/><line x1="14" y1="2" x2="14" y2="6"/><line x1="8" y1="10" x2="8" y2="14"/><line x1="16" y1="18" x2="16" y2="22"/>',
    chart: '<line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/>',
    trend: '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>',
    history: '<path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l4 2"/>',
    chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
    idcard: '<rect x="2" y="4" width="20" height="16" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M15 10h3M15 14h3M6 16c.5-1.5 1.7-2 3-2s2.5.5 3 2"/>',
    database: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"/>',
    search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    bell: '<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
    plusCircle: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/>',
    download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
    upload: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',
    cloudUp: '<polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>',
    lock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
    unlock: '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/>',
    check: '<polyline points="20 6 9 17 4 12"/>',
    checkCircle: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',
    x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    xCircle: '<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',
    right: '<polyline points="9 18 15 12 9 6"/>', left: '<polyline points="15 18 9 12 15 6"/>', down: '<polyline points="6 9 12 15 18 9"/>',
    arrowRight: '<line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>', arrowLeft: '<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>',
    eye: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
    external: '<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>',
    trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
    edit: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>',
    refresh: '<path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>',
    printer: '<polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/>',
    archive: '<rect x="2" y="3" width="20" height="5" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    hash: '<line x1="4" y1="9" x2="20" y2="9"/><line x1="4" y1="15" x2="20" y2="15"/><line x1="10" y1="3" x2="8" y2="21"/><line x1="16" y1="3" x2="14" y2="21"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',
    alert: '<path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>',
    send: '<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',
    filter: '<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',
    copy: '<rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/>',
    tag: '<path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/>',
    merge: '<circle cx="18" cy="18" r="3"/><circle cx="6" cy="6" r="3"/><path d="M6 21V9a9 9 0 0 0 9 9"/>',
    play: '<polygon points="5 3 19 12 5 21 5 3"/>', stop: '<rect x="5" y="5" width="14" height="14" rx="1"/>',
    clock: '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',
    cloud: '<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',
    zap: '<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',
    menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
    layers: '<polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/>',
    receipt: '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
    book: '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',
    bank: '<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>',
    wallet: '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',
    more: '<circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>',
    stamp: '<path d="M5 22h14"/><path d="M19.27 13.73A2.5 2.5 0 0 0 17.5 13h-11A2.5 2.5 0 0 0 4 15.5V17a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-1.5c0-.66-.26-1.3-.73-1.77Z"/><path d="M14 13V8.5C14 7 15 7 15 5a3 3 0 0 0-6 0c0 2 1 2 1 3.5V13"/>',
    image: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
    phoneSm: '<rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/>',
    flask: '<path d="M9 3h6"/><path d="M10 3v6L4 19a2 2 0 0 0 1.7 3h12.6A2 2 0 0 0 20 19l-6-10V3"/>',
    code: '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    link: '<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',
    gavel: '<path d="m14 13-7.5 7.5a2.12 2.12 0 0 1-3-3L11 10"/><path d="m16 16 6-6"/><path d="m8 8 6-6"/><path d="m9 7 8 8"/><path d="m21 11-8-8"/>'
  };
  const icon = (n, cls = '') => '<svg class="i ' + cls + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || P.info) + '</svg>';

  // ---------- Format ----------
  const esc = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const angka = (n) => { const x = Math.round(Number(n) || 0); return (x < 0 ? '-' : '') + String(Math.abs(x)).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); };
  const rp = (n) => 'Rp ' + angka(n);
  const rpSingkat = (n) => { const x = Number(n) || 0; if (Math.abs(x) >= 1e9) return 'Rp ' + (x / 1e9).toFixed(2).replace('.', ',') + ' M'; if (Math.abs(x) >= 1e6) return 'Rp ' + (x / 1e6).toFixed(1).replace('.', ',') + ' jt'; return rp(x); };
  const parseAngka = (s) => Number(String(s == null ? '' : s).replace(/[^\d-]/g, '')) || 0;
  const BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const tgl = (iso) => { const s = String(iso || '').substring(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return iso || '-'; const p = s.split('-'); return Number(p[2]) + ' ' + BULAN[Number(p[1]) - 1] + ' ' + p[0]; };
  const tglPendek = (iso) => { const s = String(iso || '').substring(0, 10); if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return iso || '-'; const p = s.split('-'); return p[2] + ' ' + BULAN[Number(p[1]) - 1].substring(0, 3) + ' ' + p[0]; };
  const waktu = (iso) => { const s = String(iso || ''); if (s.length < 16) return tglPendek(s); return tglPendek(s) + ', ' + s.substring(11, 16) + ' WITA'; };
  const nip = (v) => { const d = String(v || '').replace(/\D/g, ''); return d.length === 18 ? d.substring(0, 8) + ' ' + d.substring(8, 14) + ' ' + d.substring(14, 15) + ' ' + d.substring(15) : (v || '-'); };
  const inisial = (nm) => String(nm || '?').replace(/,.*$/, '').split(/\s+/).filter(Boolean).slice(0, 2).map((x) => x[0]).join('').toUpperCase() || '?';
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
  const persen = (a, b) => (b ? Math.round((a / b) * 1000) / 10 : 0);
  const ringkasHash = (h, n = 6) => (h ? String(h).substring(0, n) + '…' + String(h).slice(-4) : '-');

  // ---------- Terbilang (sama dengan backend) ----------
  function terbilang(n) {
    const x = Math.floor(Math.abs(Number(n) || 0));
    const s = ['', 'Satu', 'Dua', 'Tiga', 'Empat', 'Lima', 'Enam', 'Tujuh', 'Delapan', 'Sembilan', 'Sepuluh', 'Sebelas'];
    const t = (v) => v < 12 ? s[v] : v < 20 ? s[v - 10] + ' Belas' : v < 100 ? s[Math.floor(v / 10)] + ' Puluh' + (v % 10 ? ' ' + s[v % 10] : '') : v < 200 ? 'Seratus' + (v - 100 ? ' ' + t(v - 100) : '')
      : v < 1000 ? s[Math.floor(v / 100)] + ' Ratus' + (v % 100 ? ' ' + t(v % 100) : '') : v < 2000 ? 'Seribu' + (v - 1000 ? ' ' + t(v - 1000) : '')
      : v < 1e6 ? t(Math.floor(v / 1000)) + ' Ribu' + (v % 1000 ? ' ' + t(v % 1000) : '') : v < 1e9 ? t(Math.floor(v / 1e6)) + ' Juta' + (v % 1e6 ? ' ' + t(v % 1e6) : '')
      : v < 1e12 ? t(Math.floor(v / 1e9)) + ' Miliar' + (v % 1e9 ? ' ' + t(v % 1e9) : '') : t(Math.floor(v / 1e12)) + ' Triliun' + (v % 1e12 ? ' ' + t(v % 1e12) : '');
    return (x === 0 ? 'Nol' : t(x)) + ' Rupiah';
  }

  // ---------- Badge status ----------
  const STATUS_CLS = { DRAFT: 'draft', COMPLETED: 'completed', GENERATED: 'generated', LOCKED: 'locked', AKTIF: 'ok', Aktif: 'ok', NONAKTIF: 'err', Nonaktif: 'err',
    Terkirim: 'ok', Antri: 'draft', Gagal: 'err', Batal: '', Berjalan: 'info', Selesai: 'ok', Dihentikan: 'err', USANG: '' };
  const STATUS_LBL = { DRAFT: 'DRAFT', COMPLETED: 'COMPLETED', GENERATED: 'GENERATED', LOCKED: 'LOCKED' };
  function badge(st, label) {
    const c = STATUS_CLS[st] !== undefined ? STATUS_CLS[st] : '';
    return '<span class="badge ' + c + '">' + (st === 'LOCKED' ? icon('lock', 'sm') : (c && c !== 'locked' ? '<span class="dot" style="background:currentColor"></span>' : '')) + esc(label || STATUS_LBL[st] || st) + '</span>';
  }
  const waBadge = (s) => s === 'Terdaftar' ? '<span class="wa-badge ya">✓ WA</span>' : s === 'Tidak Terdaftar' ? '<span class="wa-badge tidak">✕ bukan WA</span>' : '<span class="wa-badge belum">? belum dicek</span>';

  // ---------- DOM ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const debounce = (fn, ms = 350) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };

  function toast(msg, type = 'ok', ms) {
    const box = document.getElementById('toasts'); if (!box) return;
    const el = document.createElement('div');
    el.className = 'toast ' + type;
    el.innerHTML = icon(type === 'err' ? 'xCircle' : type === 'warn' ? 'alert' : 'checkCircle') + '<div>' + esc(msg) + '</div>';
    box.appendChild(el);
    setTimeout(() => { el.style.opacity = '0'; el.style.transition = 'opacity .3s'; setTimeout(() => el.remove(), 300); }, ms || (type === 'err' ? 6500 : 3500));
  }

  /** Modal generik. opts: {title, body(html), wide, foot(html), onOpen(el, close)} → Promise(value) */
  function modal(opts) {
    return new Promise((resolve) => {
      const s = document.createElement('div');
      s.className = 'scrim';
      s.innerHTML = '<div class="modal ' + (opts.size || '') + '" role="dialog" aria-modal="true"><div class="modal-head"><h3>' + (opts.title || '') + '</h3><button class="icon-btn" data-x aria-label="Tutup">' + icon('x') + '</button></div>' +
        '<div class="modal-body">' + (opts.body || '') + '</div>' + (opts.foot !== undefined ? '<div class="modal-foot">' + opts.foot + '</div>' : '') + '</div>';
      document.body.appendChild(s);
      let done = false;
      const close = (v) => { if (done) return; done = true; s.remove(); document.removeEventListener('keydown', onKey); resolve(v); };
      const onKey = (e) => { if (e.key === 'Escape') close(null); };
      document.addEventListener('keydown', onKey);
      s.addEventListener('mousedown', (e) => { if (e.target === s && !opts.sticky) close(null); });
      $('[data-x]', s).onclick = () => close(null);
      $$('[data-close]', s).forEach((b) => (b.onclick = () => close(b.dataset.close || null)));
      if (opts.onOpen) opts.onOpen(s, close);
      const f = $('input:not([type=hidden]),textarea,select', s); if (f && !opts.noFocus) setTimeout(() => f.focus(), 30);
    });
  }
  function drawer(opts) {
    return new Promise((resolve) => {
      const s = document.createElement('div');
      s.className = 'scrim drawer-scrim';
      s.innerHTML = '<aside class="drawer"><div class="modal-head"><h3>' + (opts.title || '') + '</h3><button class="icon-btn" data-x>' + icon('x') + '</button></div><div class="modal-body" style="flex:1">' + (opts.body || '') + '</div>' +
        (opts.foot ? '<div class="modal-foot">' + opts.foot + '</div>' : '') + '</aside>';
      document.body.appendChild(s);
      const close = (v) => { s.remove(); resolve(v); };
      s.addEventListener('mousedown', (e) => { if (e.target === s) close(null); });
      $('[data-x]', s).onclick = () => close(null);
      if (opts.onOpen) opts.onOpen(s, close);
    });
  }
  function confirm(title, pesan, okLabel = 'Ya, lanjutkan', danger = false) {
    return modal({ title, body: '<p style="margin:0;white-space:pre-line">' + pesan + '</p>',
      foot: '<button class="btn btn-ghost" data-close="">Batal</button><button class="btn ' + (danger ? 'btn-danger' : 'btn-navy') + '" data-close="ok">' + esc(okLabel) + '</button>', noFocus: true }).then((v) => v === 'ok');
  }
  function prompt(title, label, opts = {}) {
    return modal({ title, body: '<div class="field"><label>' + esc(label) + '</label>' + (opts.textarea ? '<textarea class="input" id="pr-in" rows="3" placeholder="' + esc(opts.placeholder || '') + '"></textarea>'
      : '<input class="input" id="pr-in" value="' + esc(opts.value || '') + '" placeholder="' + esc(opts.placeholder || '') + '">') + (opts.hint ? '<div class="hint">' + opts.hint + '</div>' : '') + '</div>',
      foot: '<button class="btn btn-ghost" data-close="">Batal</button><button class="btn btn-navy" id="pr-ok">' + esc(opts.ok || 'Simpan') + '</button>',
      onOpen: (el, close) => { const go = () => close($('#pr-in', el).value.trim()); $('#pr-ok', el).onclick = go; if (!opts.textarea) $('#pr-in', el).onkeydown = (e) => { if (e.key === 'Enter') go(); }; } });
  }

  /** Jalankan aksi async dengan tombol berstatus loading */
  async function act(btn, fn) {
    if (btn && btn.disabled) return;
    const html = btn ? btn.innerHTML : '';
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spin"></span>' + (btn.dataset.busy || 'Memproses…'); }
    try { return await fn(); } catch (e) { if (e && e.code === undefined && !String(e.message).length) console.error(e); return undefined; }
    finally { if (btn && btn.isConnected) { btn.disabled = false; btn.innerHTML = html; } }
  }

  // ---------- File ----------
  function b64ToBlob(b64, mime) { const bin = atob(b64); const arr = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i); return new Blob([arr], { type: mime || 'application/octet-stream' }); }
  function download(b64, nama, mime) { const url = URL.createObjectURL(b64ToBlob(b64, mime)); const a = document.createElement('a'); a.href = url; a.download = nama; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); }
  function fileToBase64(file) { return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result).split(',')[1]); r.onerror = rej; r.readAsDataURL(file); }); }
  function pickFile(accept, multiple) {
    return new Promise((res) => { const i = document.createElement('input'); i.type = 'file'; i.accept = accept || ''; i.multiple = !!multiple; i.onchange = () => res(Array.from(i.files || [])); i.click(); });
  }
  let _xlsx = null;
  function loadXLSX() {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (_xlsx) return _xlsx;
    _xlsx = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js'; s.onload = () => res(window.XLSX); s.onerror = () => { _xlsx = null; rej(new Error('Gagal memuat pustaka Excel (cek internet).')); }; document.head.appendChild(s); });
    return _xlsx;
  }
  /** sheets: [{nama, rows:[obj]}] */
  async function exportXlsx(namaFile, sheets) {
    const X = await loadXLSX(); const wb = X.utils.book_new();
    sheets.forEach((s) => { const ws = X.utils.json_to_sheet(s.rows); ws['!cols'] = Object.keys(s.rows[0] || {}).map((k) => ({ wch: Math.min(48, Math.max(10, k.length + 2, ...s.rows.slice(0, 50).map((r) => String(r[k] == null ? '' : r[k]).length + 1))) })); X.utils.book_append_sheet(wb, ws, s.nama.substring(0, 31)); });
    X.writeFile(wb, namaFile);
  }
  /** baca .xlsx/.csv → { namaSheet: [[baris]] } */
  async function readWorkbook(file) {
    const X = await loadXLSX(); const buf = await file.arrayBuffer();
    const wb = X.read(buf, { type: 'array', raw: false, cellText: true, cellDates: false });
    const out = {}; wb.SheetNames.forEach((n) => { out[n] = X.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: false, defval: '' }); });
    return out;
  }
  function rowsToObjects(aoa) { if (!aoa || !aoa.length) return []; const h = aoa[0].map((x) => String(x).trim()); return aoa.slice(1).filter((r) => r.join('') !== '').map((r) => { const o = {}; h.forEach((k, i) => { if (k) o[k] = r[i]; }); return o; }); }

  // ---------- Widgets ----------
  function donut(pct, size = 150, stroke = 16) {
    const r = (size - stroke) / 2, c = 2 * Math.PI * r, p = Math.max(0, Math.min(100, pct));
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + ' ' + size + '"><defs><linearGradient id="dg" x1="0" x2="1" y1="0" y2="1"><stop offset="0" stop-color="#C9971C"/><stop offset="1" stop-color="#1B2A4A"/></linearGradient></defs>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="#E2E8F0" stroke-width="' + stroke + '"/>' +
      '<circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" fill="none" stroke="url(#dg)" stroke-width="' + stroke + '" stroke-linecap="round" stroke-dasharray="' + (c * p / 100) + ' ' + c + '" transform="rotate(-90 ' + size / 2 + ' ' + size / 2 + ')"/></svg>';
  }
  function bar(pct, cls = '') { const p = Math.max(0, Math.min(100, pct)); const k = pct > 100 ? 'over' : pct >= 100 ? 'full' : ''; return '<div class="bar ' + cls + '"><span class="' + k + '" style="width:' + p + '%"></span></div>'; }
  function pager(total, hal, per, onGo) {
    const pages = Math.max(1, Math.ceil(total / per));
    const nums = []; for (let i = 1; i <= pages; i++) if (i === 1 || i === pages || Math.abs(i - hal) <= 1) nums.push(i); else if (nums[nums.length - 1] !== '…') nums.push('…');
    const id = 'pg' + Math.random().toString(36).slice(2, 7);
    setTimeout(() => { const el = document.getElementById(id); if (!el) return; $$('[data-p]', el).forEach((b) => (b.onclick = () => onGo(Number(b.dataset.p)))); });
    return '<div class="pages" id="' + id + '"><button class="pg" data-p="' + (hal - 1) + '" ' + (hal <= 1 ? 'disabled' : '') + '>‹</button>' +
      nums.map((n) => n === '…' ? '<span class="faint" style="align-self:center">…</span>' : '<button class="pg ' + (n === hal ? 'on' : '') + '" data-p="' + n + '">' + n + '</button>').join('') +
      '<button class="pg" data-p="' + (hal + 1) + '" ' + (hal >= pages ? 'disabled' : '') + '>›</button></div>';
  }
  const empty = (msg, ic = 'folder') => '<div class="empty">' + icon(ic) + '<div>' + msg + '</div></div>';
  const loadingBlock = (msg = 'Memuat data…') => '<div class="page-loading"><div class="spin"></div><div>' + msg + '</div></div>';
  /** input angka ribuan: format saat mengetik */
  function bindAngka(input, onChange) {
    const fmt = () => { const v = parseAngka(input.value); const pos = input.value.length - input.selectionStart; input.value = v ? angka(v) : (input.value.trim() === '' ? '' : '0'); try { const p = Math.max(0, input.value.length - pos); input.setSelectionRange(p, p); } catch (e) {} };
    input.addEventListener('input', () => { fmt(); onChange && onChange(parseAngka(input.value)); });
    let baru = false;
    input.addEventListener('focus', () => { input.select(); baru = true; });
    input.addEventListener('mouseup', (e) => { if (baru) { e.preventDefault(); baru = false; } });
  }
  function copy(text) { try { navigator.clipboard.writeText(text); toast('Disalin: ' + text, 'ok', 1800); } catch (e) {} }

  return { icon, esc, angka, rp, rpSingkat, parseAngka, tgl, tglPendek, waktu, nip, inisial, today, persen, terbilang, ringkasHash, BULAN, badge, waBadge,
    $, $$, debounce, toast, modal, drawer, confirm, prompt, act, download, b64ToBlob, fileToBase64, pickFile, loadXLSX, exportXlsx, readWorkbook, rowsToObjects,
    donut, bar, pager, empty, loadingBlock, bindAngka, copy };
})();
