/* Audit Trail & Rekam Jejak Integritas Sistem (US-14) */
Pages.audit = {
  title: 'Audit Trail', crumb: ['Laporan & Audit', 'Audit Trail & Activity Log'], izin: 'audit_view',
  async render(el, p, q, alive) {
    const { icon, esc, $, $$ } = UI;
    const f = { cari: q.cari || '', aksi: q.aksi || '', user: '', dari: '', sampai: '', spjId: q.spj || '', halaman: 1, per: 20, arsip: false };
    let d = null, view = 'tabel', verif = null;
    const AKSI_CLS = { LOCK: 'locked', GENERATE: 'amber', UPLOAD: 'ok', ADD_DATA: 'info', CREATE: 'info', AUTH: '', UNLOCK: 'err', DELETE: 'err', GENERATE_GAGAL: 'err', APPROVE: 'completed', DOWNLOAD: '', EXPORT: 'draft', ROLE_CHANGE: 'err', IMPORT_RUN: 'amber' };
    const AKSI_IC = { LOCK: 'lock', GENERATE: 'zap', UPLOAD: 'upload', ADD_DATA: 'plusCircle', CREATE: 'filePlus', AUTH: 'key', UNLOCK: 'unlock', DELETE: 'trash', DOWNLOAD: 'download', APPROVE: 'checkCircle', PREVIEW: 'eye', EXPORT: 'sheet', IMPORT_RUN: 'database', BLAST: 'send' };
    const load = async () => { d = await API.call('audit.list', f); if (alive()) draw(); };
    const draw = () => {
      const s = d.stats;
      const naik = s.aksiKemarin ? Math.round((s.aksi24 - s.aksiKemarin) / s.aksiKemarin * 100) : 0;
      el.innerHTML = kopCetak('BERITA ACARA AUDIT TRAIL SIPETIK', 'Dicetak ' + UI.tgl(UI.today())) +
        '<div class="no-print">' + pageHead({ eyebrow: '<span class="badge locked">STANDAR AUDIT BPK/BPKP</span><span class="badge info"><span class="dot" style="background:var(--info)"></span>ISO/IEC 27001 ALIGNED</span><span class="badge">' + icon('lock', 'sm') + 'MUTABLE LOGGING: OFF (IMMUTABLE WORM)</span>',
          title: 'Audit Trail &amp; Rekam Jejak Integritas Sistem', sub: 'Pencatatan kronologis seluruh mutasi data SPJ, injeksi Google Docs template, pembubuhan segel digital, dan akses pengguna secara real-time dan tidak dapat dimanipulasi.',
          actions: '<button class="btn btn-ghost" id="ver">' + icon('shieldCheck') + 'Verifikasi Integritas Hash (SHA-256)</button><button class="btn btn-ghost" id="xls">' + icon('sheet') + 'Ekspor Log</button><button class="btn btn-navy" id="prn">' + icon('download') + 'Unduh Berita Acara Audit (.pdf)</button>' }) + '</div>' +
        '<div class="grid g4">' +
          '<div class="card kpi"><div class="lbl"><span>Total Event Tercatat</span><span class="ico">' + icon('receipt') + '</span></div><div class="val">' + UI.angka(s.totalEvent) + '<small>Log Kejadian</small></div><div class="foot mono xs"><span class="dot"></span> 100% tersinkron ke Sheets &amp; Drive' + (s.arsip ? ' • ' + s.arsip + ' log arsip' : '') + '</div></div>' +
          '<div class="card kpi"><div class="lbl"><span>Dokumen Di-Lock / Disahkan</span><span class="badge locked">Terkunci Permanen</span></div><div class="val">' + s.locked + '<small>Berkas SPJ</small></div><div class="foot">Otorisasi Koordinator PPTK terverifikasi</div></div>' +
          '<div class="card kpi"><div class="lbl"><span>Aksi 24 Jam Terakhir</span><span class="badge ' + (naik >= 0 ? 'ok' : 'err') + '">' + icon('trend', 'sm') + (naik >= 0 ? '+' : '') + naik + '%</span></div><div class="val">' + s.aksi24 + '<small>Transaksi Audit</small></div><div class="foot mono xs">vs ' + s.aksiKemarin + ' kejadian pada hari kemarin</div></div>' +
          '<div class="card kpi"><div class="lbl"><span>Integritas Hash Rantai</span><span class="badge ' + (verif ? (verif.valid ? 'ok' : 'err') : '') + '">' + icon(verif && !verif.valid ? 'alert' : 'checkCircle', 'sm') + (verif ? (verif.valid ? 'SEAL INTACT' : 'RUSAK') : 'BELUM DICEK') + '</span></div><div class="val" style="color:' + (verif ? (verif.valid ? 'var(--ok)' : 'var(--err)') : 'var(--muted)') + '">' + (verif ? (verif.valid ? '100%' : '✕') : '—') + '<small>' + (verif ? (verif.valid ? 'VALID TERJAMIN' : 'di ' + esc(verif.rusak.LogID)) : 'klik verifikasi') + '</small></div><div class="foot mono xs">Blok terakhir: SHA256 #' + esc(String(s.lastHash).substring(0, 8).toUpperCase()) + '…</div></div>' +
        '</div>' +
        '<div class="card mt-16 no-print"><div class="card-body row wrap" style="gap:10px">' +
          '<div class="affix grow" style="min-width:220px"><span class="pre">' + icon('search', 'sm') + '</span><input id="cari" placeholder="Cari berdasarkan ID Log, No SPJ, NIP, keterangan…" value="' + esc(f.cari) + '"></div>' +
          '<select class="input" id="aksi" style="width:auto"><option value="">Aksi: Semua Aksi (All)</option>' + d.aksiList.map((a) => '<option ' + (f.aksi === a ? 'selected' : '') + '>' + a + '</option>').join('') + '</select>' +
          '<select class="input" id="user" style="width:auto"><option value="">Aktor: Semua Pengguna</option>' + d.aktor.map((a) => '<option value="' + esc(a.email) + '" ' + (f.user === a.email ? 'selected' : '') + '>' + esc(a.nama) + '</option>').join('') + '</select>' +
          '<input class="input mono" type="date" id="dari" style="width:auto" value="' + f.dari + '" title="Dari"><span class="muted">s.d.</span><input class="input mono" type="date" id="sampai" style="width:auto" value="' + f.sampai + '" title="Sampai">' +
          '<button class="btn btn-navy" id="apl">' + icon('filter', 'sm') + 'Terapkan</button><button class="btn btn-ghost btn-icon" id="rst" title="Reset">' + icon('refresh', 'sm') + '</button>' +
          '<div class="seg"><button data-v="tabel" class="' + (view === 'tabel' ? 'on' : '') + '">' + icon('sheet', 'sm') + ' Tabel</button><button data-v="garis" class="' + (view === 'garis' ? 'on' : '') + '">' + icon('trend', 'sm') + ' Garis Waktu</button></div>' +
          '<label class="check small"><input type="checkbox" id="ars" ' + (f.arsip ? 'checked' : '') + '>Log arsip (migrasi)</label>' +
        '</div></div>' +
        (f.spjId ? '<div class="alert mt-16"><div class="ic">' + icon('filter') + '</div><div class="grow">Menampilkan riwayat SPJ <b class="mono">' + esc(f.spjId) + '</b></div><button class="btn btn-ghost btn-sm" id="clrspj">Hapus filter</button></div>' : '') +
        '<div class="card mt-16"><div class="card-head"><h3 class="mono small upper">' + icon('database', 'sm') + ' Arsip Kronologis Transaksi Dinas Resmi</h3><span class="mono xs muted">Real-time Stream: Active <span class="dot"></span></span></div>' +
        (view === 'tabel' ? '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>ID Log &amp; Waktu</th><th>Nomor SPJ / Referensi</th><th>Tipe Aksi</th><th>Aktor &amp; Jabatan</th><th>Rincian Aktivitas &amp; Payload</th></tr></thead><tbody>' +
          (d.rows.length ? d.rows.map((r) => '<tr><td class="mono small nowrap" style="vertical-align:top"><b>' + esc(r.LogID) + '</b><div class="muted">' + UI.waktu(r.Timestamp) + '</div></td>' +
            '<td class="mono small" style="vertical-align:top">' + (r.NomorSPJ ? '<a href="#/spj/' + esc(r.SPJID) + '/dokumen">' + esc(r.NomorSPJ) + '</a>' : '<span class="muted">' + esc(r.SPJID || (r.Aksi === 'AUTH' ? 'AUTH-SYS' : 'SISTEM')) + '</span>') + '</td>' +
            '<td style="vertical-align:top"><span class="badge ' + (AKSI_CLS[r.Aksi] || '') + '">' + icon(AKSI_IC[r.Aksi] || 'info', 'sm') + esc(r.Aksi) + '</span></td>' +
            '<td style="vertical-align:top"><div class="row"><span class="avatar" style="width:30px;height:30px;font-size:11px">' + esc(UI.inisial(r.Nama)) + '</span><div><div class="small b">' + esc(r.Nama) + '</div><span class="role-tag" style="background:' + (r.Role === 'PEMBANTU' ? 'var(--surface-alt);color:var(--text-2)' : 'var(--navy)') + '">' + esc(r.Role) + '</span></div></div></td>' +
            '<td class="small" style="max-width:520px;vertical-align:top">' + esc(r.Keterangan) + (r.Link ? ' <a href="' + esc(r.Link) + '" target="_blank" rel="noopener">' + icon('external', 'sm') + '</a>' : '') + (r.Hash ? '<div class="mono xs faint mt-8" title="' + esc(r.Hash) + '">hash ' + UI.ringkasHash(r.Hash, 12) + '</div>' : '') + '</td></tr>').join('')
            : '<tr><td colspan="5">' + UI.empty('Tidak ada log yang cocok.', 'history') + '</td></tr>') + '</tbody></table></div>'
          : '<div class="card-body"><div class="timeline">' + (d.rows.length ? d.rows.map((r) => '<div class="tl-item"><div class="row wrap"><span class="badge ' + (AKSI_CLS[r.Aksi] || '') + '">' + esc(r.Aksi) + '</span><span class="mono xs muted">' + UI.waktu(r.Timestamp) + ' • ' + esc(r.LogID) + '</span><b class="small">' + esc(r.Nama) + '</b>' + (r.NomorSPJ ? '<span class="mono xs">' + esc(r.NomorSPJ) + '</span>' : '') + '</div><div class="small muted mt-8">' + esc(r.Keterangan) + '</div></div>').join('') : UI.empty('Tidak ada log.', 'history')) + '</div></div>') +
        '<div class="pager"><span>Menampilkan <b>' + (d.total ? (d.halaman - 1) * d.per + 1 : 0) + '–' + Math.min(d.total, d.halaman * d.per) + '</b> dari <b>' + UI.angka(d.total) + '</b> entri audit log</span>' + UI.pager(d.total, d.halaman, d.per, (h) => { f.halaman = h; load(); }) + '</div></div>' +
        '<div class="card mt-24"><div class="card-body row gap-lg" style="align-items:flex-start"><span class="stamp" style="border:0;background:none;padding:0"><span class="seal">' + icon('shield', 'lg') + '</span></span><div class="grow"><div class="row wrap"><b style="font-size:16px">Jaminan Integritas &amp; Imutabilitas Rekam Jejak (WORM — Write Once, Read Many)</b><span class="badge ok">Hash-Chained Protocol</span></div>' +
          '<div class="small muted mt-8">Seluruh entri audit trail di-hash menggunakan algoritma kriptografi <b>SHA-256</b> berantai (setiap blok menyimpan hash blok sebelumnya) dan tersimpan di Google Sheets Master Log yang diproteksi. Tidak ada endpoint penghapusan; perubahan manual pada sheet akan terdeteksi oleh tombol verifikasi.</div>' +
          '<div class="row wrap mt-16"><span class="panel mono xs" style="padding:8px 12px"><b>SHA256 Head:</b> ' + esc(s.lastHash || '-') + '</span><span class="mono xs muted">' + icon('calendar', 'sm') + ' ' + UI.waktu(verif ? verif.diperiksa : '') + ' • Node: SIPETIK-GAS-PRODUCTION</span></div></div></div></div>';
      bind();
    };
    const bind = () => {
      const apply = () => { f.cari = $('#cari', el).value.trim(); f.aksi = $('#aksi', el).value; f.user = $('#user', el).value; f.dari = $('#dari', el).value; f.sampai = $('#sampai', el).value; f.arsip = $('#ars', el).checked; f.halaman = 1; return load(); };
      $('#apl', el).onclick = (e) => UI.act(e.currentTarget, apply);
      $('#cari', el).onkeydown = (e) => { if (e.key === 'Enter') apply(); };
      $('#ars', el).onchange = apply;
      $('#rst', el).onclick = () => { Object.assign(f, { cari: '', aksi: '', user: '', dari: '', sampai: '', spjId: '', halaman: 1, arsip: false }); load(); };
      if ($('#clrspj', el)) $('#clrspj', el).onclick = () => { f.spjId = ''; load(); };
      $$('[data-v]', el).forEach((b) => (b.onclick = () => { view = b.dataset.v; draw(); }));
      $('#ver', el).onclick = (e) => UI.act(e.currentTarget, async () => { verif = await API.call('audit.verify', {}); UI.toast(verif.valid ? 'Seluruh ' + verif.total + ' blok audit valid — rantai hash utuh.' : 'Integritas RUSAK pada ' + verif.rusak.LogID + ': ' + verif.rusak.alasan, verif.valid ? 'ok' : 'err', 7000); draw(); });
      $('#prn', el).onclick = () => window.print();
      $('#xls', el).onclick = (e) => UI.act(e.currentTarget, async () => {
        const x = await API.call('audit.list', Object.assign({}, f, { semua: true, per: 100000, halaman: 1 }));
        await UI.exportXlsx('Audit_Trail_SIPETIK_' + UI.today() + '.xlsx', [{ nama: 'Audit Trail', rows: x.rows.map((r) => ({ LogID: r.LogID, Waktu: r.Timestamp, SPJ: r.NomorSPJ || r.SPJID, Aksi: r.Aksi, Email: r.UserEmail, Nama: r.Nama, Role: r.Role, Keterangan: r.Keterangan, Link: r.Link, Hash: r.Hash })) }]);
      });
    };
    await load();
  }
};
