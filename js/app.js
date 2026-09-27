/* =====================================================================
   SIPETIK — app.js : shell, router hash, login, RBAC menu
   ===================================================================== */
const Pages = {};
const App = (() => {
  const { icon, esc, $, $$ } = UI;
  const state = { user: null, izin: [], settings: {}, role: {}, scopeSendiri: false, ping: null, leaveGuard: null, renderId: 0, notif: null };
  const can = (k) => [].concat(k).some((x) => state.izin.indexOf(x) > -1);

  const NAV = [
    { sec: 'Navigasi Utama' },
    { href: '#/dashboard', label: 'Dashboard', ic: 'grid', izin: 'dashboard' },
    { sec: 'Pengelolaan SPJ' },
    { href: '#/spj/baru', label: 'Buat SPJ Baru', ic: 'filePlus', izin: 'spj_create' },
    { href: '#/spj', label: 'Daftar SPJ', ic: 'folder', izin: 'spj_view', match: /^#\/spj(\?|$|\/SPJ)/ },
    { sec: 'Setup Admin' },
    { href: '#/template', label: 'Template Manager', ic: 'file', izin: 'template' },
    { href: '#/pegawai', label: 'Master Pegawai', ic: 'users', izin: 'master_pegawai' },
    { href: '#/rekening', label: 'Kode Rekening', ic: 'wallet', izin: 'master_rekening' },
    { href: '#/role', label: 'Role & Hak Akses', ic: 'shieldCheck', izin: 'role' },
    { href: '#/pengaturan', label: 'Pengaturan', ic: 'sliders', izin: 'pengaturan' },
    { sec: 'Komunikasi' },
    { href: '#/notifikasi', label: 'WhatsApp & Notifikasi', ic: 'chat', izin: ['blast', 'notif_config'] },
    { href: '#/crm', label: 'CRM Kontak', ic: 'idcard', izin: 'crm_view' },
    { sec: 'Laporan & Audit' },
    { href: '#/laporan', label: 'Ringkasan Bulanan', ic: 'chart', izin: 'report_view' },
    { href: '#/realisasi', label: 'Realisasi Anggaran', ic: 'trend', izin: 'report_view' },
    { href: '#/audit', label: 'Audit Trail', ic: 'history', izin: 'audit_view' },
    { sec: 'Sistem' },
    { href: '#/migrasi', label: 'Migrasi Data', ic: 'database', izin: 'migrasi' }
  ];
  const ROUTES = [
    [/^#\/dashboard$/, 'dashboard'], [/^#\/spj$/, 'spjList'], [/^#\/spj\/baru$/, 'spjForm'], [/^#\/spj\/([\w-]+)\/info$/, 'spjForm'],
    [/^#\/spj\/([\w-]+)\/rincian$/, 'spjRincian'], [/^#\/spj\/([\w-]+)\/dokumen$/, 'spjDokumen'], [/^#\/template$/, 'template'], [/^#\/template\/([\w-]+)\/uji$/, 'templateUji'],
    [/^#\/pegawai$/, 'pegawai'], [/^#\/rekening$/, 'rekening'], [/^#\/role$/, 'role'], [/^#\/pengaturan$/, 'pengaturan'], [/^#\/laporan$/, 'laporan'],
    [/^#\/realisasi$/, 'realisasi'], [/^#\/audit$/, 'audit'], [/^#\/notifikasi$/, 'notifikasi'], [/^#\/crm$/, 'crm'], [/^#\/migrasi$/, 'migrasi']
  ];

  // ------------------------------------------------------------------ START
  async function start() {
    if (!API.configured()) return renderConfigMissing();
    const pingP = API.ping().then((p) => { state.ping = p; updateChip(); return p; });
    if (API.token) { try { await bootstrap(); } catch (e) { API.setToken(''); } }
    if (!state.user) { await pingP; return renderLogin(); }
    enterApp();
  }
  async function bootstrap() {
    const d = await API.call('app.bootstrap', {}, { silent: true, noAuthRedirect: true });
    Object.assign(state, { user: d.user, izin: d.izin, settings: d.settings, role: d.role, scopeSendiri: d.scopeSendiri, izinKatalog: d.izinKatalog });
  }
  function enterApp() {
    renderShell();
    if (!location.hash || location.hash === '#' || location.hash === '#/login') location.hash = firstAllowed();
    window.removeEventListener('hashchange', route); window.addEventListener('hashchange', route);
    route();
    loadNotif();
  }
  function firstAllowed() { const n = NAV.find((x) => x.href && can(x.izin)); return n ? n.href : '#/dashboard'; }

  // ------------------------------------------------------------------ LOGIN
  function renderConfigMissing() {
    $('#app').innerHTML = '<div class="login"><div class="login-art">' + artHtml() + '</div><div class="login-form"><div class="login-box">' +
      '<div class="alert warn"><div class="ic">' + icon('alert') + '</div><div><b>Konfigurasi belum lengkap</b><div class="muted mt-8">Buka berkas <code>js/config.js</code> lalu isi <code>GAS_URL</code> dengan URL Web App Apps Script (berakhiran <code>/exec</code>). Setelah itu commit & push ulang ke GitHub.</div></div></div>' +
      '</div></div></div>';
  }
  function artHtml() {
    return '<div class="row gap-lg"><img src="assets/logo.png" alt="" width="46" height="48"><div><div style="color:#fff;font-weight:800;font-size:20px">SIPETIK <span class="badge amber">v1.0</span></div><div class="mono small" style="color:#9FB0CF">Inspektorat Kutai Timur</div></div></div>' +
      '<div><h1>Pertanggungjawaban kegiatan, <em>sekali input</em> — kwitansi, rincian, BKU &amp; NPD terbit otomatis.</h1>' +
      '<div class="login-feats">' +
      [['zap', 'Kalkulasi otomatis', 'Jumlah, PPh & netto dihitung server — konsisten di semua dokumen.'], ['file', 'Template Google Docs dinamis', 'Ubah desain kwitansi/BKU tanpa coding ulang.'],
        ['shieldCheck', 'Audit trail berantai SHA-256', 'Setiap aksi tercatat & tahan manipulasi.'], ['chat', 'Notifikasi WhatsApp & Email', 'PPTK, bendahara & penerima diberi tahu otomatis.']]
        .map((f) => '<div>' + icon(f[0], 'lg') + '<div><b style="color:#fff">' + f[1] + '</b><div class="small">' + f[2] + '</div></div></div>').join('') + '</div></div>' +
      '<div class="mono xs" style="color:#7F90B0">Pemerintah Kabupaten Kutai Timur • Inspektorat Daerah • TA ' + new Date().getFullYear() + '</div>';
  }
  function renderLogin(pesan) {
    const p = state.ping || {};
    const siap = p.ok && p.data && p.data.siap;
    const gid = (p.data && p.data.googleClientId) || API.cfg.GOOGLE_CLIENT_ID;
    $('#app').innerHTML = '<div class="login"><div class="login-art">' + artHtml() + '</div><div class="login-form"><div class="login-box">' +
      '<div class="row mb-16"><img src="assets/logo.png" width="40" height="42" alt="Logo SIPETIK"><div><div class="bb">SIPETIK</div><div class="mono xs muted">' + esc((p.data && p.data.namaInstansi) || 'Inspektorat Daerah Kabupaten Kutai Timur') + '</div></div></div>' +
      '<h2>Masuk ke akun Anda</h2><div class="sub">Gunakan akun yang didaftarkan Super Admin.</div>' +
      (pesan ? '<div class="alert warn mb-16"><div class="ic">' + icon('info') + '</div><div>' + esc(pesan) + '</div></div>' : '') +
      (!p.ok ? '<div class="alert err mb-16"><div class="ic">' + icon('alert') + '</div><div><b>Server tidak dapat dihubungi.</b><div class="small">' + esc(p.error || 'Periksa GAS_URL di js/config.js & deployment Web App.') + '</div></div></div>'
        : !siap ? '<div class="alert warn mb-16"><div class="ic">' + icon('alert') + '</div><div><b>Backend belum di-setup.</b><div class="small">Jalankan fungsi <code>setupAppEnvironment()</code> di editor Apps Script.</div></div></div>' : '') +
      '<form id="lf" class="col gap-lg" autocomplete="on">' +
      '<div class="field"><label for="le">Email</label><input class="input" id="le" type="email" required autocomplete="username" placeholder="nama@kutaitimurkab.go.id"></div>' +
      '<div class="field"><label for="lp">Sandi</label><input class="input" id="lp" type="password" required autocomplete="current-password" placeholder="••••••••"></div>' +
      '<button class="btn btn-navy btn-lg" type="submit" id="lb">' + icon('lock') + 'Masuk</button></form>' +
      (gid ? '<div class="or">atau</div><div id="gbtn" style="display:flex;justify-content:center"></div>' : '') +
      '<div class="hint mt-24">' + icon('shield', 'sm') + ' Sesi berlaku 6 jam sejak aktivitas terakhir. Lupa sandi? Hubungi Super Admin untuk reset.</div>' +
      '</div></div></div>';
    $('#lf').onsubmit = (e) => {
      e.preventDefault();
      UI.act($('#lb'), async () => {
        const d = await API.call('auth.login', { email: $('#le').value.trim(), sandi: $('#lp').value, appUrl: location.origin + location.pathname }, { noAuthRedirect: true });
        await afterLogin(d);
      });
    };
    if (gid) initGoogle(gid);
  }
  function initGoogle(clientId) {
    const go = () => {
      if (!window.google || !google.accounts) return;
      google.accounts.id.initialize({ client_id: clientId, callback: async (resp) => {
        try { const d = await API.call('auth.google', { credential: resp.credential }, { noAuthRedirect: true }); await afterLogin(d); } catch (e) {}
      } });
      const el = document.getElementById('gbtn'); if (el) google.accounts.id.renderButton(el, { theme: 'outline', size: 'large', width: 360, text: 'signin_with', locale: 'id' });
    };
    if (window.google && google.accounts) return go();
    const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = go; document.head.appendChild(s);
  }
  async function afterLogin(d) {
    API.setToken(d.token); API.clearCache();
    await bootstrap();
    UI.toast('Selamat datang, ' + state.user.Nama + '.', 'ok');
    enterApp();                                   // deep link (#/spj/…) sebelum login tetap dipertahankan
  }
  function onAuthExpired(msg) {
    state.user = null; API.clearCache();
    renderLogin(msg || 'Sesi berakhir. Silakan login ulang.');
  }
  async function logout() {
    try { await API.call('auth.logout', {}, { silent: true }); } catch (e) {}
    API.setToken(''); API.clearCache(); state.user = null; location.hash = ''; renderLogin('Anda telah keluar.');
  }

  // ------------------------------------------------------------------ SHELL
  function renderShell() {
    const u = state.user;
    $('#app').innerHTML = '<div class="shell" id="shell">' +
      '<aside class="sidebar"><div class="brand"><img src="assets/logo.png" alt="Logo SIPETIK"><div class="txt"><div class="t1">SIPETIK <span class="ver">v1.0</span></div><div class="t2">Inspektorat Kutai Timur</div></div></div>' +
      '<nav class="nav" id="nav">' + navHtml() + '</nav>' +
      '<div class="side-user"><div class="avatar">' + esc(UI.inisial(u.Nama)) + '</div><div class="who" style="min-width:0"><div class="nm ellipsis">' + esc(u.Nama) + '</div><span class="role-tag">' + esc(state.role.Label || u.Role) + '</span></div>' +
      '<button class="out" id="btn-out" title="Keluar">' + icon('logout', 'lg') + '</button></div></aside>' +
      '<div class="main"><header class="topbar">' +
      '<button class="icon-btn menu-btn" id="menu-btn" aria-label="Menu">' + icon('menu', 'lg') + '</button>' +
      '<div class="crumbs" id="crumbs"></div>' +
      '<label class="tb-search">' + icon('search') + '<input id="gsearch" placeholder="Cari nomor SPJ / NIP… (Ctrl+K)" autocomplete="off"></label>' +
      '<span class="ws-chip" id="ws-chip"><span class="dot"></span>Google Workspace: Terhubung</span>' +
      '<button class="icon-btn" id="btn-bell" title="Tugas menunggu">' + icon('bell', 'lg') + '<span class="badge-dot hidden" id="bell-n">0</span></button>' +
      '<button class="me-btn" id="btn-me" title="Akun"><span class="avatar">' + icon('user') + '</span>' + icon('down', 'sm') + '</button>' +
      '</header><main class="content" id="view"></main></div></div>';
    updateChip();
    $('#btn-out').onclick = logout;
    $('#menu-btn').onclick = () => $('#shell').classList.toggle('nav-open');
    $('#nav').addEventListener('click', (e) => { if (e.target.closest('.nav-item')) $('#shell').classList.remove('nav-open'); });
    $('#shell').addEventListener('click', (e) => { if (e.target.id === 'shell') $('#shell').classList.remove('nav-open'); });
    const gs = $('#gsearch');
    gs.onkeydown = (e) => { if (e.key === 'Enter' && gs.value.trim()) { go('#/spj?cari=' + encodeURIComponent(gs.value.trim())); gs.blur(); } };
    document.onkeydown = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); gs.focus(); gs.select(); } };
    $('#btn-me').onclick = menuAkun;
    $('#btn-bell').onclick = panelTugas;
  }
  function navHtml() {
    let out = '', pending = null;
    NAV.forEach((n) => {
      if (n.sec) { pending = n.sec; return; }
      if (!can(n.izin)) return;
      if (pending) { out += '<div class="nav-sec">' + pending + '</div>'; pending = null; }
      out += '<a class="nav-item" href="' + n.href + '" data-href="' + n.href + '" title="' + esc(n.label) + '">' + icon(n.ic, 'lg') + '<span>' + n.label + '</span></a>';
    });
    return out;
  }
  function setActiveNav(hash) {
    $$('.nav-item').forEach((a) => {
      const n = NAV.find((x) => x.href === a.dataset.href);
      const on = n.match ? n.match.test(hash) : hash === n.href || hash.indexOf(n.href + '/') === 0 || hash.indexOf(n.href + '?') === 0;
      a.classList.toggle('active', !!on && !(n.href === '#/spj' && /^#\/spj\/baru/.test(hash)));
    });
  }
  function updateChip() {
    const el = document.getElementById('ws-chip'); if (!el) return;
    const ok = state.ping && state.ping.ok;
    el.innerHTML = '<span class="dot ' + (ok ? '' : state.ping ? 'off' : 'warn') + '"></span>Google Workspace: ' + (ok ? 'Terhubung' : state.ping ? 'Terputus' : 'Memeriksa…');
  }
  function setCrumbs(list) {
    const el = $('#crumbs'); if (!el) return;
    el.innerHTML = '<img class="logo-mini" src="assets/logo.png" alt=""><span class="txt row">' + list.map((c, i) => (i === list.length - 1 ? '<b>' + esc(c) + '</b>' : esc(c) + icon('right', 'sm'))).join(' ') + '</span>';
  }

  async function loadNotif() {
    if (!can('dashboard')) return;
    try {
      const d = await API.call('dashboard.stats', {}, { silent: true });
      state.notif = d;
      const n = (d.status.DRAFT || 0) + (can('generate') ? d.status.COMPLETED || 0 : 0) + (can('lock') ? d.status.GENERATED || 0 : 0);
      const b = $('#bell-n'); if (b) { b.textContent = n > 99 ? '99+' : n; b.classList.toggle('hidden', !n); }
    } catch (e) {}
  }
  function panelTugas() {
    const d = state.notif;
    const items = [];
    if (d) {
      if (d.status.DRAFT) items.push(['draft', d.status.DRAFT + ' SPJ berstatus DRAFT', 'Perlu input/approve rincian', '#/spj?status=DRAFT']);
      if (d.status.COMPLETED && can('generate')) items.push(['completed', d.status.COMPLETED + ' SPJ COMPLETED', 'Siap generate dokumen', '#/spj?status=COMPLETED']);
      if (d.status.GENERATED && can('lock')) items.push(['generated', d.status.GENERATED + ' SPJ GENERATED', 'Menunggu pengesahan & kunci', '#/spj?status=GENERATED']);
    }
    UI.modal({ title: 'Tugas menunggu', body: items.length ? '<div class="col gap-lg">' + items.map((x) => '<a class="file-row" href="' + x[3] + '" data-close style="text-decoration:none">' + UI.badge(x[0].toUpperCase()) + '<div class="grow"><div class="b" style="color:var(--text)">' + x[1] + '</div><div class="small muted">' + x[2] + '</div></div>' + icon('right') + '</a>').join('') + '</div>'
      : UI.empty('Tidak ada tugas menunggu. 🎉', 'checkCircle'), onOpen: (el, close) => $$('a', el).forEach((a) => a.addEventListener('click', () => close())) });
  }
  function menuAkun() {
    const u = state.user;
    UI.modal({ title: 'Akun saya', body: '<div class="row gap-lg mb-16"><div class="avatar" style="width:48px;height:48px;background:var(--navy);color:#fff">' + esc(UI.inisial(u.Nama)) + '</div><div><div class="bb">' + esc(u.Nama) + '</div><div class="small muted">' + esc(u.Email) + '</div><span class="role-tag" style="background:var(--navy)">' + esc(state.role.Label || u.Role) + '</span></div></div>' +
      '<div class="panel small"><div class="row between"><span class="muted">NIP</span><span class="mono">' + UI.nip(u.NIP) + '</span></div><div class="row between mt-8"><span class="muted">Login terakhir</span><span class="mono">' + UI.waktu(u.TerakhirLogin) + '</span></div><div class="row between mt-8"><span class="muted">Cakupan SPJ</span><span>' + (state.scopeSendiri ? 'Milik sendiri' : 'Semua SPJ') + '</span></div></div>',
      foot: '<button class="btn btn-ghost" id="ma-pw">' + icon('key') + 'Ganti Sandi</button><button class="btn btn-danger" id="ma-out">' + icon('logout') + 'Keluar</button>',
      onOpen: (el, close) => { $('#ma-out', el).onclick = () => { close(); logout(); }; $('#ma-pw', el).onclick = () => { close(); gantiSandi(); }; } });
  }
  function gantiSandi() {
    UI.modal({ title: 'Ganti sandi', body: '<div class="col gap-lg"><div class="field"><label>Sandi lama</label><input class="input" type="password" id="pw0" autocomplete="current-password"></div><div class="field"><label>Sandi baru (min. 8 karakter)</label><input class="input" type="password" id="pw1" autocomplete="new-password"></div><div class="field"><label>Ulangi sandi baru</label><input class="input" type="password" id="pw2" autocomplete="new-password"></div></div>',
      foot: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-navy" id="pw-ok">Simpan Sandi</button>',
      onOpen: (el, close) => { $('#pw-ok', el).onclick = (e) => {
        if ($('#pw1', el).value !== $('#pw2', el).value) return UI.toast('Ulangan sandi tidak sama.', 'err');
        UI.act(e.currentTarget, async () => { await API.call('auth.changePassword', { lama: $('#pw0', el).value, baru: $('#pw1', el).value }, { toast: true }); close(); });
      }; } });
  }

  // ------------------------------------------------------------------ ROUTER
  function parseHash() {
    const h = location.hash || '#/dashboard';
    const [path, qs] = h.split('?');
    const q = {}; (qs || '').split('&').filter(Boolean).forEach((kv) => { const [k, v] = kv.split('='); q[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
    return { path, q, full: h };
  }
  async function route() {
    if (!state.user) return;
    const { path, q, full } = parseHash();
    if (state.leaveGuard && state.leaveGuard.hash !== path) {
      const g = state.leaveGuard;
      if (g.dirty && g.dirty() && !(await UI.confirm('Perubahan belum disimpan', 'Ada perubahan yang belum disimpan ke server. Tinggalkan halaman ini?', 'Tinggalkan', true))) { history.replaceState(null, '', g.hash); return; }
      state.leaveGuard = null;
    }
    let pageKey = null, params = [];
    for (const [re, key] of ROUTES) { const m = path.match(re); if (m) { pageKey = key; params = m.slice(1); break; } }
    const view = $('#view'); if (!view) return;
    const sh = $('#shell'); if (sh) sh.classList.remove('nav-open');
    setActiveNav(full);
    const page = Pages[pageKey];
    if (!page) { setCrumbs(['Inspektorat', 'Tidak ditemukan']); view.innerHTML = UI.empty('Halaman tidak ditemukan. <a href="' + firstAllowed() + '">Kembali</a>', 'alert'); return; }
    if (page.izin && !can(page.izin)) { setCrumbs(['Inspektorat', 'Akses ditolak']); view.innerHTML = UI.empty('Anda tidak memiliki izin untuk halaman ini.', 'lock'); return; }
    setCrumbs(page.crumb || ['Inspektorat', page.title || '']);
    document.title = (page.title || 'SIPETIK') + ' — SIPETIK';
    const rid = ++state.renderId;
    view.innerHTML = UI.loadingBlock();
    window.scrollTo(0, 0);
    try { await page.render(view, params, q, () => rid === state.renderId); }
    catch (e) { if (rid === state.renderId && e.code !== 'AUTH') view.innerHTML = '<div class="alert err"><div class="ic">' + icon('alert') + '</div><div><b>Gagal memuat halaman.</b><div class="small">' + esc(e.message) + '</div><button class="btn btn-ghost btn-sm mt-8" onclick="App.reload()">' + icon('refresh') + 'Coba lagi</button></div></div>'; }
  }
  function go(hash) { if (location.hash === hash) route(); else location.hash = hash; }
  function reload() { route(); }
  function guard(hash, dirtyFn) { state.leaveGuard = { hash, dirty: dirtyFn }; }

  window.addEventListener('beforeunload', (e) => { const g = state.leaveGuard; if (g && g.dirty && g.dirty()) { e.preventDefault(); e.returnValue = ''; } });

  return { start, state, can, go, reload, guard, onAuthExpired, logout, loadNotif, setCrumbs };
})();

/** Helper header halaman seragam */
function pageHead(o) {
  return '<div class="page-head"><div class="grow">' + (o.bc ? '<div class="bc">' + o.bc.map((b, i) => (i ? '<span class="sep">/</span>' : '') + (Array.isArray(b) ? '<a href="' + b[1] + '">' + UI.esc(b[0]) + '</a>' : '<b>' + UI.esc(b) + '</b>')).join('') + '</div>' : '') +
    (o.eyebrow ? '<div class="eyebrow">' + o.eyebrow + '</div>' : '') + '<h1>' + o.title + '</h1>' + (o.sub ? '<div class="sub">' + o.sub + '</div>' : '') + '</div>' +
    (o.actions ? '<div class="actions">' + o.actions + '</div>' : '') + '</div>';
}
