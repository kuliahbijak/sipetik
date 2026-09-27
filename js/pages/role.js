/* Kelola Role & Matriks Hak Akses (RBAC) + Penugasan Pengguna (US-15) */
Pages.role = {
  title: 'Role & Hak Akses', crumb: ['Setup Admin', 'Role & Hak Akses'], izin: 'role',
  async render(el, p, q, alive) {
    const { icon, esc, $, $$ } = UI;
    let [rl, users] = await Promise.all([API.call('role.list'), API.call('user.list')]);
    if (!alive()) return;
    let draft = JSON.parse(JSON.stringify(rl.roles));
    const fu = { cari: '', role: '', status: 'Aktif' };
    const TONE = { SUPER_ADMIN: ['var(--err)', 'err'], PPTK: ['var(--navy)', 'info'], PEMBANTU: ['var(--amber)', 'draft'], BENDAHARA: ['var(--navy)', 'amber'] };
    const RISK_CLS = { Low: 'ok', Medium: 'draft', High: 'draft', Critical: 'err' };
    const dirty = () => JSON.stringify(draft.map((r) => [r.Role, r.Izin.slice().sort(), r.ScopeSPJ])) !== JSON.stringify(rl.roles.map((r) => [r.Role, r.Izin.slice().sort(), r.ScopeSPJ]));
    App.guard('#/role', dirty);
    const draw = () => {
      const gid = App.state.settings;
      el.innerHTML = pageHead({ eyebrow: '<span class="badge locked">RBAC ENGINE v2.4</span><span class="mono xs muted">Zona Waktu: Asia/Makassar (WITA)</span>', title: 'Kelola Role &amp; Matriks Hak Akses (RBAC)',
        sub: 'Konfigurasi perizinan fungsional berjenjang dan penugasan peran pengguna sesuai tata kelola pengawasan internal Inspektorat Kabupaten Kutai Timur.',
        actions: '<span class="badge ok"><span class="dot"></span>Kebijakan Aktif &amp; Tersinkron</span><button class="btn btn-ghost" id="exp">' + icon('download') + 'Ekspor Konfigurasi (.json / .xlsx)</button><button class="btn btn-navy" id="addu">' + icon('userPlus') + '+ Tambah User Baru</button><button class="btn btn-primary" id="save" ' + (dirty() ? '' : 'disabled') + '>' + icon('check') + 'Simpan Perubahan</button>' }) +
        '<div class="alert dark"><div class="ic" style="background:#24365C;border-color:#24365C;color:#F5BE44">' + icon('key') + '</div><div class="grow"><div class="row wrap"><b>Autentikasi Sandi + Google Workspace OAuth 2.0</b><span class="badge amber">Domain ' + (gid.NAMA_APP ? 'Locked' : '') + '</span></div><div class="small mt-8">Login dengan email + sandi (hash SHA-256 ber-salt) atau Google Sign-In untuk akun terverifikasi. Setiap eskalasi hak akses dicatat dalam <i>Immutable Audit Ledger</i> berkunci SHA-256 dengan batas sesi idle 6 jam. Super Admin selalu memegang seluruh izin agar sistem tidak terkunci.</div></div></div>' +
        '<div class="grid g4 mt-16">' + draft.map((r) => { const t = TONE[r.Role] || ['var(--slate)', '']; return '<div class="card kpi"><div class="row between"><span class="ico" style="color:' + t[0] + '">' + icon(r.Role === 'SUPER_ADMIN' ? 'shield' : r.Role === 'PPTK' ? 'shieldCheck' : r.Role === 'BENDAHARA' ? 'bank' : 'edit') + '</span><span class="badge ' + t[1] + '">' + esc(r.Tier) + '</span></div><div class="b" style="font-size:16px">' + esc(r.Label) + '</div><div class="small muted">' + esc(r.Deskripsi) + '</div><div class="row between"><span><b class="mono" style="font-size:20px">' + r.jumlahAktif + '</b> <span class="small muted">Akun Aktif</span></span><span class="badge">' + r.Izin.length + ' izin • ' + (r.ScopeSPJ === 'MILIK_SENDIRI' ? 'SPJ sendiri' : 'semua SPJ') + '</span></div><div class="bar"><span style="width:' + Math.round(r.Izin.length / Object.keys(rl.izin).length * 100) + '%;background:' + t[0] + '"></span></div></div>'; }).join('') + '</div>' +
        '<div class="card mt-24"><div class="card-head"><div><h3>' + icon('sliders') + 'Matriks Perizinan Fitur (Granular Permission Matrix)</h3><div class="sub">Tentukan kewenangan akses modul teknis, hak modifikasi data, pembacaan arsip, dan eksekusi dokumen otomatis GAS.</div></div><div class="row mono xs"><span class="badge ok">● Diizinkan</span><span class="badge">● Ditolak</span></div></div>' +
        '<div class="tbl-wrap"><table class="tbl compact"><thead><tr><th>Modul &amp; Fitur Operasional</th>' + draft.map((r) => '<th style="text-align:center">' + esc(r.Label) + '</th>').join('') + '<th style="text-align:center">Tingkat Risiko</th></tr></thead><tbody>' +
        '<tr><td><b>Cakupan data SPJ</b><div class="xs muted">Semua SPJ atau hanya SPJ yang dibuat sendiri</div></td>' + draft.map((r, i) => '<td style="text-align:center">' + (r.Role === 'SUPER_ADMIN' ? '<span class="badge ok">Semua SPJ</span>' : '<select class="input" style="height:30px;width:auto" data-scope="' + i + '"><option value="SEMUA" ' + (r.ScopeSPJ === 'SEMUA' ? 'selected' : '') + '>Semua SPJ</option><option value="MILIK_SENDIRI" ' + (r.ScopeSPJ === 'MILIK_SENDIRI' ? 'selected' : '') + '>Milik Sendiri</option></select>') + '</td>').join('') + '<td style="text-align:center"><span class="badge ok">Low</span></td></tr>' +
        Object.keys(rl.izin).map((k) => '<tr><td><b>' + esc(rl.izin[k]) + '</b><div class="mono xs muted">' + k + '</div></td>' + draft.map((r, i) => '<td style="text-align:center">' + (r.Role === 'SUPER_ADMIN' ? '<span style="color:var(--ok)" title="Super Admin selalu penuh">' + icon('checkCircle') + '</span>' : '<input type="checkbox" class="check" style="width:18px;height:18px;accent-color:var(--navy)" data-izin="' + k + '" data-r="' + i + '" ' + (r.Izin.includes(k) ? 'checked' : '') + ' aria-label="' + esc(r.Label + ' ' + rl.izin[k]) + '">') + '</td>').join('') +
          '<td style="text-align:center"><span class="badge ' + (RISK_CLS[rl.risiko[k]] || 'ok') + '">' + (rl.risiko[k] || 'Low') + '</span></td></tr>').join('') +
        '</tbody></table></div><div class="card-foot mono xs muted">' + icon('info', 'sm') + ' Perubahan matriks tercatat sebagai ROLE_CHANGE di audit trail dan berlaku pada permintaan berikutnya. ' + Object.keys(rl.izin).length + ' aturan hak akses terpetakan.</div></div>' +
        '<div class="card mt-24"><div class="card-head"><div><h3>' + icon('users') + 'Penugasan Peran Pengguna (User Assignment)</h3><div class="sub">Pengguna terautentikasi yang dapat mengakses SIPETIK.</div></div><div class="row wrap"><div class="affix" style="width:220px"><span class="pre">' + icon('search', 'sm') + '</span><input id="ucari" placeholder="Cari Pegawai / Email" value="' + esc(fu.cari) + '"></div>' +
        '<select class="input" id="urole" style="width:auto"><option value="">Semua Peran</option>' + draft.map((r) => '<option value="' + r.Role + '" ' + (fu.role === r.Role ? 'selected' : '') + '>' + esc(r.Label) + '</option>').join('') + '</select><select class="input" id="ust" style="width:auto">' + ['Aktif', 'Nonaktif', 'Semua'].map((s) => '<option ' + (fu.status === s ? 'selected' : '') + '>' + s + '</option>').join('') + '</select></div></div>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Pegawai / Aparatur</th><th>Email Login</th><th>Peran Ditugaskan</th><th>Status</th><th>Terakhir Login (WITA)</th><th class="num">Aksi Otoritas</th></tr></thead><tbody id="utb"></tbody></table></div></div>';
      drawUsers(); bind();
    };
    const drawUsers = () => {
      let v = users.filter((u) => (fu.status === 'Semua' || u.Status === fu.status) && (!fu.role || u.Role === fu.role));
      if (fu.cari) v = v.filter((u) => [u.Nama, u.Email, u.NIP].join(' ').toLowerCase().indexOf(fu.cari.toLowerCase()) > -1);
      $('#utb', el).innerHTML = v.length ? v.map((u) => '<tr><td><div class="row"><span class="avatar">' + esc(UI.inisial(u.Nama)) + '</span><div><div class="b">' + esc(u.Nama) + '</div><div class="mono xs muted">NIP. ' + UI.nip(u.NIP) + '</div></div></div></td><td class="mono small">' + esc(u.Email) + (u.Sumber === 'Google' ? ' <span class="pill-tag">Google</span>' : '') + (!u.punyaSandi ? ' <span class="pill-tag">tanpa sandi</span>' : '') + '</td>' +
        '<td><select class="input" style="height:32px;width:auto" data-urole="' + u.UserID + '" ' + (u.UserID === App.state.user.UserID ? 'disabled title="Tidak bisa mengubah peran sendiri"' : '') + '>' + draft.map((r) => '<option value="' + r.Role + '" ' + (u.Role === r.Role ? 'selected' : '') + '>' + esc(r.Label) + '</option>').join('') + '</select></td>' +
        '<td>' + UI.badge(u.Status) + '</td><td class="mono small">' + (u.TerakhirLogin ? UI.waktu(u.TerakhirLogin) : '<span class="faint">belum pernah</span>') + '</td>' +
        '<td class="num nowrap"><button class="btn btn-ghost btn-icon btn-sm" data-ued="' + u.UserID + '" title="Edit">' + icon('edit', 'sm') + '</button> <button class="btn btn-ghost btn-icon btn-sm" data-urs="' + u.UserID + '" title="Reset sandi">' + icon('key', 'sm') + '</button> ' +
        (u.UserID !== App.state.user.UserID ? '<button class="btn btn-ghost btn-icon btn-sm" data-ust="' + u.UserID + '" title="' + (u.Status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan') + '" style="color:' + (u.Status === 'Aktif' ? 'var(--err)' : 'var(--ok)') + '">' + icon(u.Status === 'Aktif' ? 'xCircle' : 'checkCircle', 'sm') + '</button>' : '') + '</td></tr>').join('')
        : '<tr><td colspan="6">' + UI.empty('Tidak ada pengguna.', 'users') + '</td></tr>';
      $$('[data-urole]', el).forEach((s) => (s.onchange = async () => { const u = users.find((x) => x.UserID === s.dataset.urole); try { await simpanUser(Object.assign({}, u, { Role: s.value })); } catch (e) { s.value = u.Role; } }));
      $$('[data-ued]', el).forEach((b) => (b.onclick = () => formUser(users.find((x) => x.UserID === b.dataset.ued))));
      $$('[data-urs]', el).forEach((b) => (b.onclick = async () => { const u = users.find((x) => x.UserID === b.dataset.urs); if (!(await UI.confirm('Reset sandi?', 'Sandi baru acak akan dibuat untuk ' + u.Email + ' dan dikirim via WA/Email bila notifikasi aktif.', 'Reset Sandi'))) return; const r = await API.call('user.resetPassword', { userId: u.UserID }); tampilSandi(u.Email, r.sandi); }));
      $$('[data-ust]', el).forEach((b) => (b.onclick = async () => { const u = users.find((x) => x.UserID === b.dataset.ust); await simpanUser(Object.assign({}, u, { Status: u.Status === 'Aktif' ? 'Nonaktif' : 'Aktif' })); }));
    };
    const simpanUser = async (u, sandi) => {
      const r = await API.call('user.save', { user: u, sandi }, { toast: !sandi });
      users = await API.call('user.list');
      rl = await API.call('role.list'); draft.forEach((d) => { const x = rl.roles.find((y) => y.Role === d.Role); d.jumlahAktif = x.jumlahAktif; });
      if (r.sandiAwal) tampilSandi(u.Email, r.sandiAwal);
      draw();
      return r;
    };
    const tampilSandi = (email, sandi) => UI.modal({ title: 'Sandi awal pengguna', body: '<p class="muted" style="margin-top:0">Sampaikan sandi ini secara aman kepada <b>' + esc(email) + '</b>. Sandi hanya ditampilkan sekali.</p><div class="panel row between"><span class="mono" style="font-size:20px;letter-spacing:.08em">' + esc(sandi) + '</span><button class="btn btn-ghost btn-sm" id="cp">' + icon('copy', 'sm') + 'Salin</button></div>',
      foot: '<button class="btn btn-navy" data-close>Selesai</button>', onOpen: (m) => ($('#cp', m).onclick = () => UI.copy(sandi)) });
    const formUser = (u) => {
      u = u || { Role: 'PEMBANTU', Status: 'Aktif' };
      UI.modal({ title: u.UserID ? 'Edit pengguna' : 'Tambah pengguna', size: 'wide', body: '<div class="form-grid">' +
        '<div class="field"><label>Nama<span class="req">*</span></label><input class="input" data-k="Nama" value="' + esc(u.Nama || '') + '"></div><div class="field"><label>Email login<span class="req">*</span></label><input class="input" type="email" data-k="Email" value="' + esc(u.Email || '') + '" placeholder="nama@kutaitimurkab.go.id"></div>' +
        '<div class="field"><label>NIP</label><input class="input mono" data-k="NIP" value="' + esc(u.NIP || '') + '"></div><div class="field"><label>Jabatan</label><input class="input" data-k="Jabatan" value="' + esc(u.Jabatan || '') + '"></div>' +
        '<div class="field"><label>No. WhatsApp</label><input class="input mono" data-k="NoHP" value="' + esc(u.NoHP || '') + '" placeholder="0812…"></div><div class="field"><label>Peran</label><select class="input" data-k="Role">' + draft.map((r) => '<option value="' + r.Role + '" ' + (u.Role === r.Role ? 'selected' : '') + '>' + esc(r.Label) + '</option>').join('') + '</select></div>' +
        (u.UserID ? '' : '<div class="field full"><label>Sandi awal (opsional)</label><input class="input mono" id="sandi" placeholder="kosongkan untuk dibuat otomatis (10 karakter)"><div class="hint">Pengguna diminta mengganti sandi setelah login.</div></div>') + '</div>',
        foot: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-navy" id="ok">Simpan</button>',
        onOpen: (m, close) => { $('#ok', m).onclick = (e) => UI.act(e.currentTarget, async () => { const d = Object.assign({}, u); $$('[data-k]', m).forEach((i) => (d[i.dataset.k] = i.value.trim())); await simpanUser(d, u.UserID ? undefined : ($('#sandi', m).value.trim() || undefined)); close(); }); } });
    };
    const bind = () => {
      $$('[data-izin]', el).forEach((c) => (c.onchange = () => { const r = draft[+c.dataset.r]; if (c.checked) { if (!r.Izin.includes(c.dataset.izin)) r.Izin.push(c.dataset.izin); } else r.Izin = r.Izin.filter((k) => k !== c.dataset.izin); $('#save', el).disabled = !dirty(); }));
      $$('[data-scope]', el).forEach((s) => (s.onchange = () => { draft[+s.dataset.scope].ScopeSPJ = s.value; $('#save', el).disabled = !dirty(); }));
      $('#save', el).onclick = (e) => UI.act(e.currentTarget, async () => { rl = await API.call('role.save', { roles: draft }, { toast: true }); draft = JSON.parse(JSON.stringify(rl.roles)); draw(); });
      $('#addu', el).onclick = () => formUser();
      $('#ucari', el).oninput = UI.debounce((e) => { fu.cari = e.target.value; drawUsers(); }, 250);
      $('#urole', el).onchange = (e) => { fu.role = e.target.value; drawUsers(); };
      $('#ust', el).onchange = (e) => { fu.status = e.target.value; drawUsers(); };
      $('#exp', el).onclick = async () => {
        const pilihan = await UI.modal({ title: 'Ekspor konfigurasi', body: '<p class="muted" style="margin:0">Pilih format ekspor matriks izin &amp; daftar pengguna.</p>', foot: '<button class="btn btn-ghost" data-close="json">JSON</button><button class="btn btn-navy" data-close="xlsx">Excel (.xlsx)</button>' });
        if (pilihan === 'json') { const b = btoa(unescape(encodeURIComponent(JSON.stringify({ roles: rl.roles, izin: rl.izin, users: users.map((u) => ({ Nama: u.Nama, Email: u.Email, Role: u.Role, Status: u.Status })) }, null, 2)))); UI.download(b, 'SIPETIK_RBAC_' + UI.today() + '.json', 'application/json'); }
        if (pilihan === 'xlsx') UI.exportXlsx('SIPETIK_RBAC_' + UI.today() + '.xlsx', [{ nama: 'Matriks Izin', rows: Object.keys(rl.izin).map((k) => { const o = { Izin: rl.izin[k], Kode: k }; rl.roles.forEach((r) => (o[r.Label] = r.Izin.includes(k) ? 'YA' : '-')); return o; }) }, { nama: 'Pengguna', rows: users.map((u) => ({ Nama: u.Nama, Email: u.Email, NIP: u.NIP, Role: u.Role, Status: u.Status, TerakhirLogin: u.TerakhirLogin })) }]);
      };
    };
    draw();
  }
};
