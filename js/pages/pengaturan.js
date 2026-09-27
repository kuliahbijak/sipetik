/* Pengaturan aplikasi (instansi, KPA, anggaran, penomoran, login Google, backup) */
Pages.pengaturan = {
  title: 'Pengaturan', crumb: ['Setup Admin', 'Pengaturan'], izin: 'pengaturan',
  async render(el, p, q, alive) {
    const { icon, esc, $, $$ } = UI;
    const d = await API.call('settings.get');
    if (!alive()) return;
    const v = d.values, ket = d.keterangan;
    const G = [
      ['Identitas Instansi (kop dokumen)', 'bank', ['NAMA_PEMDA', 'NAMA_INSTANSI', 'NAMA_INSTANSI_PANJANG', 'ALAMAT_INSTANSI', 'TELEPON_INSTANSI', 'EMAIL_INSTANSI', 'KOTA']],
      ['Pejabat Pengguna Anggaran', 'stamp', ['NAMA_KPA', 'NIP_KPA', 'JABATAN_KPA']],
      ['Anggaran, Penomoran & Kalkulasi', 'hash', ['TAHUN_ANGGARAN', 'PERSEN_POTONGAN', 'FORMAT_NOMOR_SPJ', 'NOMOR_URUT_AWAL', 'BATAS_ANOMALI', 'SIMPAN_DOCS']],
      ['Login & Akses', 'key', ['GOOGLE_CLIENT_ID', 'DOMAIN_DIIZINKAN', 'AUTO_DAFTAR', 'DEFAULT_ROLE', 'APP_URL']]
    ];
    const LBL = { NAMA_PEMDA: 'Baris 1 kop (pemerintah daerah)', NAMA_INSTANSI: 'Baris 2 kop (instansi)', NAMA_INSTANSI_PANJANG: 'Nama instansi lengkap', ALAMAT_INSTANSI: 'Alamat', TELEPON_INSTANSI: 'Telepon', EMAIL_INSTANSI: 'Email instansi', KOTA: 'Kota penandatanganan',
      NAMA_KPA: 'Nama KPA / Inspektur', NIP_KPA: 'NIP KPA', JABATAN_KPA: 'Jabatan KPA', TAHUN_ANGGARAN: 'Tahun anggaran aktif', PERSEN_POTONGAN: 'Potongan PPh (%)', FORMAT_NOMOR_SPJ: 'Format nomor SPJ', NOMOR_URUT_AWAL: 'Nomor urut awal',
      BATAS_ANOMALI: 'Batas anomali per pegawai (Rp)', SIMPAN_DOCS: 'Simpan salinan Google Docs hasil generate', GOOGLE_CLIENT_ID: 'Google OAuth Client ID', DOMAIN_DIIZINKAN: 'Domain email diizinkan', AUTO_DAFTAR: 'Daftar otomatis via Google', DEFAULT_ROLE: 'Role bawaan pengguna baru', APP_URL: 'URL aplikasi (GitHub Pages)' };
    const YN = ['SIMPAN_DOCS', 'AUTO_DAFTAR'];
    const inp = (k) => {
      if (YN.includes(k)) return '<select class="input" data-k="' + k + '"><option ' + (v[k] === 'YA' ? 'selected' : '') + '>YA</option><option ' + (v[k] !== 'YA' ? 'selected' : '') + '>TIDAK</option></select>';
      if (k === 'DEFAULT_ROLE') return '<select class="input" data-k="' + k + '">' + d.roles.filter((r) => r !== 'SUPER_ADMIN').map((r) => '<option ' + (v[k] === r ? 'selected' : '') + '>' + r + '</option>').join('') + '</select>';
      return '<input class="input ' + (/NIP|NOMOR|FORMAT|TAHUN|PERSEN|BATAS|CLIENT|URL/.test(k) ? 'mono' : '') + '" data-k="' + k + '" value="' + esc(v[k]) + '">';
    };
    el.innerHTML = pageHead({ bc: [['Dashboard', '#/dashboard'], 'Setup Admin', 'Pengaturan'], title: 'Pengaturan Aplikasi', sub: 'Nilai di sini dipakai sebagai placeholder dokumen (kop, pejabat), rumus kalkulasi, dan penomoran otomatis. Pengaturan WhatsApp & Email ada di menu <a href="#/notifikasi?tab=config">WhatsApp &amp; Notifikasi</a>.',
      actions: '<button class="btn btn-ghost" id="bk">' + icon('archive') + 'Backup Database Sekarang</button><button class="btn btn-primary" id="sv">' + icon('check') + 'Simpan Pengaturan</button>' }) +
      '<div class="grid g2" style="align-items:start">' + G.map((g) => '<div class="card"><div class="card-head"><h3>' + icon(g[1]) + esc(g[0]) + '</h3></div><div class="card-body form-grid">' +
        g[2].map((k) => '<div class="field ' + (/ALAMAT|PANJANG|FORMAT|CLIENT|URL/.test(k) ? 'full' : '') + '"><label>' + esc(LBL[k] || k) + '</label>' + inp(k) + '<div class="hint">' + esc(ket[k] || '') + '</div></div>').join('') + '</div></div>').join('') +
      '<div class="card"><div class="card-head"><h3>' + icon('folder') + 'Lokasi Data Google Drive</h3></div><div class="card-body col" style="gap:8px">' +
        [['Spreadsheet database', d.drive.spreadsheet], ['Folder root SIPETIK', d.drive.root], ['00_TEMPLATE_MASTER', d.drive.template], ['02_SPJ_ARCHIVE', d.drive.arsip], ['03_UPLOAD_BUKTI', d.drive.bukti], ['05_BACKUP (mingguan, 8 terakhir)', d.drive.backup]]
          .map((x) => '<a class="file-row" href="' + esc(x[1] || '#') + '" target="_blank" rel="noopener" style="text-decoration:none;color:inherit">' + icon('folder') + '<span class="grow small b">' + x[0] + '</span>' + icon('external', 'sm') + '</a>').join('') +
        '<div class="alert mt-8"><div class="ic">' + icon('info') + '</div><div class="small">Login Google: buat OAuth Client ID tipe <i>Web application</i> di Google Cloud Console, tambahkan origin GitHub Pages Anda (mis. <code>https://username.github.io</code>) ke <i>Authorized JavaScript origins</i>, lalu tempel Client ID di atas.</div></div></div></div></div>';
    $('#sv', el).onclick = (e) => UI.act(e.currentTarget, async () => {
      const values = {}; $$('[data-k]', el).forEach((i) => (values[i.dataset.k] = i.value.trim()));
      await API.call('settings.save', { values }, { toast: true });
      const b = await API.call('app.bootstrap', {}, { silent: true }); App.state.settings = b.settings; Master.clear();
    });
    $('#bk', el).onclick = (e) => UI.act(e.currentTarget, () => API.call('system.backup', {}, { toast: true }));
  }
};
