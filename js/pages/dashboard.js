/* Dashboard Pengawasan & Akuntabilitas SPJ */
Pages.dashboard = {
  title: 'Dashboard', crumb: ['Inspektorat', 'Pengelolaan Kegiatan'], izin: 'dashboard',
  async render(el, p, q, alive) {
    const { icon, esc, rp, angka, badge } = UI;
    const draw = (d) => {
      if (!alive()) return;
      const s = d.status, r = d.realisasi, ig = d.integrasi;
      const naik = d.selisihBulanLalu;
      el.innerHTML = pageHead({
        eyebrow: '<span class="badge locked">TAHUN ANGGARAN ' + esc(d.tahun) + '</span><span class="row small muted"><span class="dot"></span>Live Monitoring</span>',
        title: 'Dashboard Pengawasan &amp; Akuntabilitas SPJ', sub: 'Monitoring berkas pertanggungjawaban kegiatan teknis inspektorat secara real-time',
        actions: (App.can('report_export') ? '<a class="btn btn-ghost" href="#/laporan">' + icon('download') + 'Ekspor Rekap BKU</a>' : '') +
          (App.can('spj_create') ? '<a class="btn btn-primary" href="#/spj/baru">' + icon('plusCircle') + '+ Buat SPJ Baru</a>' : '')
      }) +
      '<div class="grid g4">' +
        kpi('Total SPJ Bulan Ini', d.totalBulanIni, 'folder', '', (naik >= 0 ? '<span class="up">' + icon('trend', 'sm') + ' +' + naik + ' berkas</span>' : '<span class="down">' + naik + ' berkas</span>') + ' dari bulan lalu', '#/spj') +
        kpi('Status Draft', s.DRAFT || 0, '', '<span class="badge draft">Perlu Tindakan</span>', 'Memerlukan input rincian / approve', '#/spj?status=DRAFT', 'var(--warn)') +
        kpi('Status Completed', (s.COMPLETED || 0) + (s.GENERATED || 0), '', '<span class="badge completed">Verifikasi Selesai</span>', (s.COMPLETED || 0) + ' siap generate • ' + (s.GENERATED || 0) + ' siap dikunci', '#/spj?status=COMPLETED', 'var(--ok)') +
        kpi('Status Locked', s.LOCKED || 0, 'lock', '', 'Telah ditandatangani & diarsipkan', '#/spj?status=LOCKED') +
      '</div>' +
      '<div class="grid g-main mt-24">' +
        '<div class="card"><div class="card-head"><div><h3>Realisasi Pengeluaran vs Target Pagu Anggaran</h3><div class="sub">Tahun Anggaran ' + esc(d.tahun) + ' • Program Pengawasan Penyelenggaraan Pemda</div></div><span class="badge">DPA ' + esc(d.tahun) + '</span></div>' +
          '<div class="card-body"><div class="row gap-xl" style="align-items:flex-start;flex-wrap:wrap">' +
            '<div class="panel" style="text-align:center;padding:14px"><div class="donut-wrap">' + UI.donut(r.persen) + '<div class="c"><div><b>' + String(r.persen).replace('.', ',') + '%</b><br><span>TERSERAP</span></div></div></div>' +
              '<div class="mono xs muted mt-8">Ceiling Status: ' + (r.persen > 100 ? '<span class="down">Melampaui</span>' : r.persen > 90 ? 'Waspada' : 'Stabil') + '</div></div>' +
            '<div class="grow" style="min-width:240px">' + (r.perRekening.length ? r.perRekening.slice(0, 5).map((x, i) =>
              '<div class="realbar"><div class="top"><span class="ellipsis" title="' + esc(x.KodeRekening) + '">' + esc(x.SubKegiatan || x.Uraian) + '</span><span class="mono small" style="color:' + (i === 2 ? 'var(--amber)' : 'var(--text)') + '">' + String(x.Persen).replace('.', ',') + '%</span></div>' +
              UI.bar(x.Persen, i % 3 === 2 ? '' : 'navy') + '<div class="bot"><span>Real: <b>' + rp(x.Realisasi) + '</b></span><span>Pagu: ' + rp(x.Pagu) + '</span></div></div>').join('') : UI.empty('Belum ada kode rekening untuk TA ini.', 'wallet')) + '</div>' +
          '</div>' +
          '<div class="panel mt-16"><div class="row between wrap"><div>Total Realisasi: <b class="mono">' + rp(r.totalRealisasi) + '</b> <span class="muted">(' + String(r.persen).replace('.', ',') + '% dari total pagu ' + rp(r.totalPagu) + ')</span></div><div class="mono small">Sisa: <b>' + rp(r.sisa) + '</b></div></div><div class="mt-8">' + UI.bar(r.persen, 'grad thick') + '</div></div>' +
        '</div></div>' +
        '<div class="card"><div class="card-head"><div><h3>Status Mesin &amp; Integrasi</h3><div class="sub">Koneksi otomatisasi Google Apps Script (GAS)</div></div><span style="color:var(--ok)">' + icon('refresh', 'lg') + '</span></div><div class="card-body col gap-lg">' +
          integ('checkCircle', 'Google Docs Template Engine', ig.templateAktif + '/' + ig.templateTotal + ' Template Terverifikasi & Aktif', App.can('template') ? '<a href="#/template" class="btn-link small">Lihat ' + icon('arrowRight', 'sm') + '</a>' : '', ig.templateAktif ? 'ok' : 'warn') +
          integ('users', 'Sinkronisasi Master Pegawai', ig.pegawaiAktif + ' Pegawai Aktif' + (ig.crmSync ? ' • CRM sync ' + UI.waktu(ig.crmSync) : ''), App.can('master_pegawai') ? '<a href="#/pegawai" class="btn-link small">Kelola ' + icon('arrowRight', 'sm') + '</a>' : '', 'ok') +
          integ('cloud', 'Google Drive Backup Otomatis', '02_SPJ_ARCHIVE/' + esc(d.tahun) + ' Aktif', ig.driveArsip ? '<a href="' + esc(ig.driveArsip) + '" target="_blank" rel="noopener" class="btn-link small">Buka Drive ' + icon('external', 'sm') + '</a>' : '', 'info') +
          integ('chat', 'Notifikasi WhatsApp & Email', 'WA ' + (ig.waAktif ? 'AKTIF' : 'nonaktif') + ' • Email ' + (ig.emailAktif ? 'AKTIF' : 'nonaktif'), App.can(['blast', 'notif_config']) ? '<a href="#/notifikasi" class="btn-link small">Atur ' + icon('arrowRight', 'sm') + '</a>' : '', ig.waAktif || ig.emailAktif ? 'ok' : 'warn') +
          '<div class="panel"><div class="row b mb-8">' + icon('zap') + 'Aksi Cepat Tim Keuangan</div><div class="grid g2">' +
            (App.can('spj_input') ? '<a class="btn btn-ghost tall" href="#/spj?status=DRAFT"><span style="color:var(--amber)">' + icon('userPlus', 'lg') + '</span>+ Input Rincian Tambahan</a>' : '') +
            (App.can('report_view') ? '<a class="btn btn-ghost tall" href="#/realisasi">' + icon('printer', 'lg') + 'Cetak Lembar Kontrol BKU</a>' : '') +
          '</div></div>' +
        '</div></div>' +
      '</div>' +
      '<div class="card mt-24"><div class="card-head"><div><h3>Daftar SPJ Terbaru</h3><div class="sub">Arsip berkas pertanggungjawaban kegiatan teknis berjalan</div></div><a class="btn btn-ghost btn-sm" href="#/spj">Lihat semua ' + icon('arrowRight', 'sm') + '</a></div>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nomor SPJ</th><th>Tgl Masuk</th><th>Kode Rekening</th><th>Uraian Pertanggungjawaban</th><th class="num">Jumlah Bersih</th><th>Status</th></tr></thead><tbody>' +
        (d.recent.length ? d.recent.map((x) => '<tr style="cursor:pointer" data-go="#/spj/' + x.SPJID + '/' + (x.Status === 'DRAFT' ? 'rincian' : 'dokumen') + '"><td class="mono b">' + esc(x.NomorSPJ) + '</td><td class="nowrap">' + UI.tglPendek(x.TglSPJ) + '</td><td class="code">' + esc(x.KodeRekening) + '</td><td class="ellipsis" style="max-width:320px">' + esc(x.UraianKegiatan || x.UraianRekening) + '</td><td class="num">' + rp(x.TotalBersih) + '</td><td>' + badge(x.Status) + '</td></tr>').join('')
          : '<tr><td colspan="6">' + UI.empty('Belum ada SPJ. ' + (App.can('spj_create') ? '<a href="#/spj/baru">Buat SPJ pertama</a>' : ''), 'folder') + '</td></tr>') +
        '</tbody></table></div></div>';
      UI.$$('[data-go]', el).forEach((tr) => (tr.onclick = () => App.go(tr.dataset.go)));
      UI.$$('[data-kpi]', el).forEach((c) => (c.onclick = () => App.go(c.dataset.kpi)));
    };
    function kpi(lbl, val, ic, tag, foot, go, color) {
      return '<div class="card kpi click" data-kpi="' + go + '"><div class="lbl"><span>' + lbl + '</span>' + (tag || (ic ? '<span class="ico">' + icon(ic) + '</span>' : '')) + '</div>' +
        '<div class="val" style="' + (color ? 'color:' + color : '') + '">' + angka(val) + '<small>Berkas</small></div><div class="foot">' + foot + '</div></div>';
    }
    function integ(ic, t, s, link, tone) {
      const bg = tone === 'ok' ? 'var(--ok-bg)' : tone === 'info' ? 'var(--info-bg)' : 'var(--warn-bg)', fg = tone === 'ok' ? 'var(--ok)' : tone === 'info' ? 'var(--info)' : 'var(--warn)';
      return '<div class="file-row"><div class="file-ic" style="background:' + bg + ';color:' + fg + '">' + icon(ic) + '</div><div class="grow"><div class="b">' + t + '</div><div class="mono xs" style="color:' + fg + '">' + s + '</div></div>' + link + '</div>';
    }
    await API.swr('dash', 'dashboard.stats', {}, draw);
  }
};
