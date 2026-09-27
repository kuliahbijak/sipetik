/* Migrasi Data — impor dari SIPETIK/Excel lama (dry-run, idempoten, delta sync) */
Pages.migrasi = {
  title: 'Migrasi Data', crumb: ['Sistem', 'Migrasi Data'], izin: 'migrasi',
  async render(el, p, q, alive) {
    const { icon, esc, $, $$ } = UI;
    const info = await API.call('migrasi.info');
    if (!alive()) return;
    let mode = 'sheet', berkas = null, hasil = null;
    const draw = () => {
      el.innerHTML = pageHead({ bc: [['Dashboard', '#/dashboard'], 'Sistem', 'Migrasi Data'], title: 'Migrasi Database dari Aplikasi / Excel Lama',
        sub: 'Pindahkan master pegawai, kode rekening, pengguna, SPJ beserta rincian, dan audit lama ke SIPETIK tanpa menyentuh sumber lama. Aman diulang (idempoten) — jalankan lagi tepat sebelum cutover untuk menangkap data baru (delta sync).',
        eyebrow: '<span class="badge info">' + icon('shieldCheck', 'sm') + 'SUMBER HANYA DIBACA</span><span class="badge">' + icon('database', 'sm') + 'Target: ' + esc(info.target.nama) + '</span>' + (info.terakhir ? '<span class="badge ok">Terakhir: ' + esc(info.terakhir) + '</span>' : '') }) +
        '<div class="grid g-main" style="align-items:start"><div class="col gap-lg">' +
        '<div class="card"><div class="card-head"><h3><span class="num-tag">1</span> Sumber Data Lama</h3><div class="seg"><button data-m="sheet" class="' + (mode === 'sheet' ? 'on' : '') + '">Spreadsheet Google</button><button data-m="xlsx" class="' + (mode === 'xlsx' ? 'on' : '') + '">Unggah Excel (.xlsx)</button></div></div><div class="card-body col gap-lg">' +
          (mode === 'sheet' ? '<div class="field"><label>URL / ID spreadsheet lama</label><input class="input mono" id="src" placeholder="https://docs.google.com/spreadsheets/d/1AbC…/edit" value="' + esc(q.src || '') + '"><div class="hint">Spreadsheet harus bisa dibuka oleh akun pemilik script: <b class="mono">' + esc(info.akunScript) + '</b>. Gunakan akun Google yang sama agar ID file Drive lama tetap valid.</div></div>'
            : '<div class="drop" id="drop" tabindex="0" role="button"><div class="ic">' + icon('sheet', 'xl') + '</div><div class="b">' + (berkas ? esc(berkas.nama) + ' — ' + Object.keys(berkas.data).length + ' sheet terbaca' : 'Pilih berkas Excel lama (.xlsx / .xls)') + '</div><div class="small muted">Diparse di browser; nama sheet &amp; kolom dikenali otomatis (mis. "Master Pegawai", "Detail Rincian Potongan").</div></div>' +
              (berkas ? '<div class="row wrap">' + Object.keys(berkas.data).map((n) => '<span class="pill-tag">' + esc(n) + ' (' + Math.max(0, berkas.data[n].length - 1) + ')</span>').join('') + '</div>' : '')) +
        '</div></div>' +
        '<div class="card"><div class="card-head"><h3><span class="num-tag">2</span> Pilih Data &amp; Opsi</h3></div><div class="card-body"><div class="grid g2">' +
          info.peta.map((m) => '<label class="file-row" style="cursor:pointer"><input type="checkbox" class="check" data-sh="' + m.kode + '" ' + (m.def ? 'checked' : '') + '><div class="grow"><div class="b small">' + esc(m.label) + '</div><div class="xs muted">Sheet: ' + esc(m.alias.slice(0, 3).join(' / ')) + '</div></div></label>').join('') +
        '</div><label class="check mt-16"><input type="checkbox" id="timpa"><span class="small"><b>Timpa data master yang sudah ada</b> — default: hanya mengisi kolom yang masih kosong. SPJ yang sudah COMPLETED/GENERATED/LOCKED di SIPETIK tidak pernah ditimpa.</span></label></div>' +
        '<div class="card-foot row end"><button class="btn btn-ghost" id="scan">' + icon('search') + 'Pindai (Dry-run)</button><button class="btn btn-primary" id="run">' + icon('database') + 'Jalankan Import</button></div></div>' +
        '<div id="hasil"></div></div>' +
        '<div class="col gap-lg"><div class="card"><div class="card-head"><h3>' + icon('checkCircle') + 'Checklist Cutover</h3></div><div class="card-body"><ol class="small" style="margin:0;padding-left:18px;display:grid;gap:8px">' +
          '<li>Pasang SIPETIK baru → login Super Admin.</li><li>Klik <b>Pindai</b> → periksa angka ditambah/diperbarui &amp; peringatan.</li><li>Klik <b>Jalankan Import</b>.</li><li>Cek Master Pegawai, Kode Rekening, Daftar SPJ, dan CRM. Uji 1 SPJ sampai generate PDF.</li>' +
          '<li>Tepat sebelum pindah: <b>jalankan import sekali lagi</b> (delta sync).</li><li>Umumkan alamat baru via <a href="#/notifikasi">Blast WhatsApp</a>. Arsipkan aplikasi lama (data lama tetap aman).</li></ol></div></div>' +
          '<div class="card"><div class="card-head"><h3>' + icon('info') + 'Kunci &amp; Aturan</h3></div><div class="card-body small col" style="gap:8px">' +
          '<div><b>Pegawai</b> — kunci NIP. HP 62…/8… dinormalisasi ke 08…</div><div><b>Kode Rekening</b> — kunci kode + tahun anggaran.</div><div><b>Pengguna</b> — kunci email; akun Super Admin lama tidak diimpor.</div>' +
          '<div><b>SPJ</b> — kunci Nomor SPJ; rekening yatim dilewati.</div><div><b>Rincian</b> — kunci Nomor SPJ + NIP; jumlah, PPh &amp; netto <b>dihitung ulang</b> dengan rumus SIPETIK.</div><div><b>Audit lama</b> — masuk sheet AuditArsip (rantai hash audit baru tetap utuh).</div>' +
          '<div class="alert warn mt-8"><div class="ic">' + icon('alert') + '</div><div class="xs">Sesi login lama tidak ikut pindah — pengguna login ulang. NIP yang di sumber tersimpan sebagai angka bisa kehilangan digit akhir (akan diperingatkan).</div></div>' +
          '<button class="btn btn-ghost btn-sm" id="tplx">' + icon('download', 'sm') + 'Unduh template Excel migrasi</button></div></div></div></div>';
      drawHasil(); bind();
    };
    const drawHasil = () => {
      const box = $('#hasil', el); if (!box) return;
      if (!hasil) { box.innerHTML = ''; return; }
      const r = hasil.report, tot = Object.values(r).reduce((a, x) => ({ s: a.s + x.sumber, t: a.t + x.ditambah, u: a.u + x.diperbarui, l: a.l + x.dilewati }), { s: 0, t: 0, u: 0, l: 0 });
      box.innerHTML = '<div class="card" style="border-color:' + (hasil.dryRun ? 'var(--info-bd)' : 'var(--ok-bd)') + '"><div class="card-head"><h3>' + icon(hasil.dryRun ? 'search' : 'checkCircle') + (hasil.dryRun ? 'Hasil Pindai (belum ada yang ditulis)' : 'Hasil Import') + '</h3><span class="mono xs muted">Sumber: ' + esc(hasil.source.nama) + '</span></div>' +
        '<div class="tbl-wrap"><table class="tbl compact"><thead><tr><th>Data</th><th>Sheet sumber</th><th class="num">Di sumber</th><th class="num">Ditambah</th><th class="num">Diperbarui</th><th class="num">Dilewati</th></tr></thead><tbody>' +
        Object.keys(r).map((k) => '<tr><td class="b">' + esc((info.peta.find((m) => m.kode === k) || {}).label || k) + '</td><td class="small ' + (/tidak/.test(r[k].sheetSumber) ? 'faint' : '') + '">' + esc(r[k].sheetSumber) + '</td><td class="num">' + r[k].sumber + '</td><td class="num" style="color:var(--ok)">' + r[k].ditambah + '</td><td class="num" style="color:var(--info)">' + r[k].diperbarui + '</td><td class="num muted">' + r[k].dilewati + '</td></tr>').join('') +
        '</tbody><tfoot><tr><td colspan="2">TOTAL</td><td class="num">' + tot.s + '</td><td class="num">' + tot.t + '</td><td class="num">' + tot.u + '</td><td class="num">' + tot.l + '</td></tr></tfoot></table></div>' +
        (hasil.warnings.length ? '<div class="card-body"><div class="alert warn"><div class="ic">' + icon('alert') + '</div><div class="small"><b>' + hasil.warnings.length + ' peringatan</b><ul style="margin:6px 0 0;padding-left:18px">' + hasil.warnings.map((w) => '<li>' + esc(w) + '</li>').join('') + '</ul></div></div></div>' : '<div class="card-body"><div class="alert ok"><div class="ic">' + icon('checkCircle') + '</div><div class="small">Tidak ada peringatan.</div></div></div>') + '</div>';
    };
    const payload = (dry) => {
      const sheets = $$('[data-sh]', el).filter((c) => c.checked).map((c) => c.dataset.sh);
      const o = { dryRun: dry, sheets, timpa: $('#timpa', el).checked };
      if (mode === 'sheet') { o.source = $('#src', el).value.trim(); if (!o.source) throw new Error('Tempel URL / ID spreadsheet lama.'); }
      else { if (!berkas) throw new Error('Pilih berkas Excel dulu.'); o.sumberData = berkas.data; o.sumberNama = berkas.nama; }
      if (!sheets.length) throw new Error('Pilih minimal 1 jenis data.');
      return o;
    };
    const bind = () => {
      $$('[data-m]', el).forEach((b) => (b.onclick = () => { mode = b.dataset.m; hasil = null; draw(); }));
      const drop = $('#drop', el);
      if (drop) drop.onclick = async () => {
        const [file] = await UI.pickFile('.xlsx,.xls'); if (!file) return;
        try { berkas = { nama: file.name, data: await UI.readWorkbook(file) }; draw(); } catch (e) { UI.toast(e.message, 'err'); }
      };
      $('#scan', el).onclick = (e) => UI.act(e.currentTarget, async () => { let o; try { o = payload(true); } catch (x) { return UI.toast(x.message, 'err'); } hasil = await API.call('migrasi.run', o, { toast: true }); drawHasil(); });
      $('#run', el).onclick = (e) => UI.act(e.currentTarget, async () => {
        let o; try { o = payload(false); } catch (x) { return UI.toast(x.message, 'err'); }
        if (!(await UI.confirm('Jalankan import?', 'Data akan ditulis ke database SIPETIK. Proses aman diulang (tanpa baris dobel). Disarankan menjalankan Pindai terlebih dahulu.', 'Jalankan Import'))) return;
        hasil = await API.call('migrasi.run', o, { toast: true }); Master.clear(); API.clearCache(); drawHasil();
      });
      $('#tplx', el).onclick = async () => {
        const X = await UI.loadXLSX(); const wb = X.utils.book_new();
        const add = (n, h) => X.utils.book_append_sheet(wb, X.utils.aoa_to_sheet([h]), n);
        add('Master Pegawai', ['Nama', 'NIP', 'Golongan', 'Jabatan', 'No Rekening', 'Bank', 'NPWP', 'No HP', 'Email', 'Status']);
        add('Master Kode Rekening', ['Kode Rekening', 'Uraian', 'Sub Kegiatan', 'Bidang', 'Pagu', 'Tahun Anggaran', 'Status']);
        add('Users', ['Email', 'Nama', 'NIP', 'Jabatan', 'Role', 'No HP', 'Status']);
        add('Data SPJ', ['ID SPJ', 'Nomor SPJ', 'Tgl SPJ', 'Kode Rekening', 'Uraian Kegiatan', 'Nomor SPT', 'Tgl SPT', 'NIP PPTK', 'NIP Bendahara', 'Status', 'Created By']);
        add('Detail Rincian Potongan', ['SPJ ID', 'No Urut', 'Nama', 'NIP', 'Bantuan Survey', 'Harian (Rp)', 'Hari', 'Transport (Rp)', 'Penginapan (Rp)', 'Jumlah (Rp)', 'Potongan 5% (Rp)', 'Jumlah Bersih (Rp)']);
        add('Audit Trail', ['ID', 'SPJ ID', 'Aksi', 'User', 'Timestamp', 'Keterangan', 'File Download Link']);
        X.writeFile(wb, 'Template_Migrasi_SIPETIK.xlsx');
      };
    };
    draw();
  }
};
