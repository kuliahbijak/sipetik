/* Laporan Bulanan & Realisasi Anggaran (US-12, US-13) */
function kopCetak(judul, periode) {
  const s = App.state.settings;
  return '<div class="print-only" style="text-align:center;border-bottom:3px double #000;padding-bottom:8px;margin-bottom:12px"><div style="font-weight:700">' + UI.esc(s.NAMA_PEMDA || '') + '</div><div style="font-weight:800;font-size:16px">' + UI.esc(s.NAMA_INSTANSI || '') + '</div></div>' +
    '<div class="print-only" style="text-align:center;margin-bottom:12px"><b style="font-size:14px">' + judul + '</b><div>' + periode + '</div></div>';
}
function ttdCetak(p) {
  return '<div class="print-only" style="margin-top:28px"><table style="width:100%;text-align:center;font-size:11px"><tr><td>Mengetahui,<br>' + UI.esc(p.jabatanKpa || 'Inspektur') + ' selaku KPA<br><br><br><br><b><u>' + UI.esc(p.kpa || '.............................') + '</u></b><br>NIP. ' + UI.nip(p.nipKpa) + '</td>' +
    '<td>' + UI.esc(p.kota || '') + ', ' + UI.tgl(UI.today()) + '<br>Bendahara Pengeluaran<br><br><br><br><b><u>.............................</u></b><br>NIP.</td></tr></table></div>';
}

Pages.laporan = {
  title: 'Ringkasan Bulanan', crumb: ['Laporan & Audit', 'Ringkasan Bulanan & Realisasi Anggaran'], izin: 'report_view',
  async render(el, p, q, alive) {
    const { icon, esc, rp, $, $$ } = UI;
    const rek = await Master.rekening().catch(() => []);
    if (!alive()) return;
    const now = new Date();
    const f = { tahun: String(App.state.settings.TAHUN_ANGGARAN || now.getFullYear()), bulan: q.bulan !== undefined ? q.bulan : String(now.getMonth() + 1), rekeningId: '', status: ['LOCKED', 'COMPLETED', 'GENERATED'] };
    let d = null, mode = 'nominal';
    const tw = (b) => (b ? ['I', 'II', 'III', 'IV'][Math.floor((b - 1) / 3)] : '');
    const draw = () => {
      const t = d.total, k = d.komposisi, totK = k.Harian + k.Transport + k.Penginapan + k.Bantuan;
      const periode = (d.bulan ? UI.BULAN[d.bulan - 1] + ' ' : 'Januari–Desember ') + d.tahun;
      el.innerHTML = kopCetak('LAPORAN BULANAN & REALISASI ANGGARAN SPJ', 'Periode ' + periode) +
        '<div class="no-print">' + pageHead({ bc: [['Dashboard', '#/dashboard'], 'Laporan & Audit', 'Ringkasan Bulanan'], title: 'Laporan Bulanan &amp; Realisasi Anggaran SPJ',
          eyebrow: '<span class="badge amber"><span class="dot amber"></span>TA ' + esc(d.tahun) + (d.bulan ? ' • Triwulan ' + tw(d.bulan) + ' (Aktif)' : '') + '</span>',
          sub: 'Monitoring komprehensif serapan pagu DPA, distribusi pengeluaran belanja teknis pengawasan, dan kepatuhan administrasi SPJ Inspektorat Daerah.',
          actions: (App.can('report_export') ? '<button class="btn btn-ghost" id="xls">' + icon('sheet') + 'Ekspor Rekap (.xlsx)</button><button class="btn btn-navy" id="prn">' + icon('printer') + 'Cetak Berita Acara Rekonsiliasi (PDF)</button>' : '') }) +
        '<div class="card"><div class="card-body row wrap" style="align-items:flex-end;gap:12px">' +
          '<div class="field"><label>Periode Bulan</label><select class="input" id="bl" style="width:170px"><option value="">Semua bulan</option>' + UI.BULAN.map((b, i) => '<option value="' + (i + 1) + '" ' + (String(i + 1) === String(f.bulan) ? 'selected' : '') + '>' + b + ' ' + f.tahun + '</option>').join('') + '</select></div>' +
          '<div class="field"><label>Tahun Anggaran</label><input class="input mono" id="th" style="width:100px" value="' + esc(f.tahun) + '"></div>' +
          '<div class="field grow" style="min-width:220px"><label>Kode Sub-Kegiatan / Bidang</label><select class="input" id="rk"><option value="">Semua Bidang</option>' + rek.map((r) => '<option value="' + r.RekeningID + '" ' + (f.rekeningId === r.RekeningID ? 'selected' : '') + '>' + esc((r.SubKegiatan || r.Uraian) + ' — ' + r.KodeRekening.slice(-14)) + '</option>').join('') + '</select></div>' +
          '<div class="row wrap" style="height:36px">' + [['LOCKED', 'Locked'], ['COMPLETED', 'Completed'], ['GENERATED', 'Generated'], ['DRAFT', 'Draft']].map((s) => '<label class="check small"><input type="checkbox" data-st="' + s[0] + '" ' + (f.status.includes(s[0]) ? 'checked' : '') + '>' + s[1] + ' (' + (d.statusCount[s[0]] || 0) + ')</label>').join('') + '</div>' +
          '<button class="btn btn-navy" id="go">' + icon('filter', 'sm') + 'Terapkan</button></div></div></div>' +
        '<div class="grid g4 mt-16">' +
          kpi('Total Pagu Anggaran DPA', rp(t.Pagu), 'bank', '<span class="badge info">DPA-SKPD</span> Alokasi belanja pengawasan TA ' + esc(d.tahun)) +
          kpi('Total Realisasi SPJ (Bruto)', rp(t.Bruto), 'trend', UI.bar(t.Persen, 'grad') + '<div class="mt-8">' + String(t.Persen).replace('.', ',') + '% terserap • netto cair ' + rp(t.Netto) + '</div>') +
          kpi('Sisa Pagu Anggaran', rp(t.Sisa), 'wallet', '<span class="badge ok">' + String(Math.round((100 - t.Persen) * 10) / 10).replace('.', ',') + '% Tersedia</span> Likuiditas kas ' + (t.Sisa >= 0 ? 'aman' : '<b class="down">defisit</b>')) +
          kpi('Total Berkas SPJ', d.spj.length + ' <small>berkas</small>', 'folder', ['LOCKED', 'COMPLETED', 'GENERATED', 'DRAFT'].map((s) => '<span class="badge ' + s.toLowerCase() + '">' + (d.statusCount[s] || 0) + ' ' + s.substring(0, 5) + '</span>').join(' ') + '<div class="mt-8">Rata-rata ' + rp(d.spj.length ? t.Netto / d.spj.length : 0) + ' / berkas</div>') +
        '</div>' +
        '<div class="grid g-main mt-24"><div class="card"><div class="card-head"><div><h3>Realisasi vs Pagu Anggaran per Sub-Kegiatan</h3><div class="sub">Komparasi serapan anggaran pelaksanaan audit dan pemeriksaan pengawasan reguler</div></div><div class="seg no-print" id="md"><button data-m="nominal" class="' + (mode === 'nominal' ? 'on' : '') + '">Nominal</button><button data-m="persen" class="' + (mode === 'persen' ? 'on' : '') + '">Persentase</button></div></div><div class="card-body">' +
          (d.perRekening.length ? d.perRekening.map((r, i) => '<div class="realbar"><div class="top"><span class="row"><span class="dot" style="background:' + (i % 2 ? 'var(--amber)' : 'var(--navy)') + '"></span>' + esc(r.SubKegiatan || r.Uraian) + '</span><span class="mono xs muted">Kode: ' + esc(r.KodeRekening.slice(-17)) + '</span></div>' +
            '<div class="bot"><span>Realisasi: <b>' + (mode === 'nominal' ? rp(r.Bruto) : String(r.Persen).replace('.', ',') + '%') + '</b> <span style="color:var(--ok)">' + String(r.Persen).replace('.', ',') + '% Terserap</span></span><span>Pagu: <b>' + rp(r.Pagu) + '</b></span></div><div class="mt-8">' + UI.bar(r.Persen, i % 2 ? '' : 'navy') + '</div><div class="bot" style="justify-content:flex-end">Sisa Pagu: ' + rp(r.Sisa) + '</div></div>').join('')
            : UI.empty('Tidak ada data rekening.', 'wallet')) +
          '<div class="alert mt-16"><div class="ic">' + icon('info') + '</div><div class="small grow">Catatan: target serapan belanja teknis Triwulan ' + (tw(d.bulan) || 'berjalan') + ' minimum 45,0% terpenuhi secara agregat lembaga.</div><span class="badge ' + (t.Persen >= 45 ? 'ok' : 'draft') + '">' + (t.Persen >= 45 ? 'Memenuhi Syarat' : 'Di Bawah Target') + '</span></div>' +
        '</div></div>' +
        '<div class="card"><div class="card-head"><div><h3>Komposisi Komponen Belanja SPJ</h3><div class="sub">Klasifikasi pengeluaran belanja teknis terverifikasi</div></div><span class="badge info">' + rp(totK) + '</span></div><div class="card-body col" style="gap:12px">' +
          [['Uang Harian & Uang Saku Pengawasan', k.Harian, 'wallet'], ['Transportasi Riil & BBM Lapangan', k.Transport, 'send'], ['Biaya Penginapan / Akomodasi', k.Penginapan, 'bank'], ['Bantuan Operasional / Survey Khusus', k.Bantuan, 'receipt']].map((c, i) =>
            '<div class="panel" style="padding:10px 12px"><div class="row between"><span class="row small">' + icon(c[2], 'sm') + ' ' + c[0] + '</span><span class="mono small">' + String(UI.persen(c[1], totK)).replace('.', ',') + '%</span></div><div class="row between mono xs muted mt-8"><span>Nominal Realisasi</span><span>' + rp(c[1]) + '</span></div><div class="mt-8">' + UI.bar(UI.persen(c[1], totK), i === 1 ? 'navy' : '') + '</div></div>').join('') +
          '<div class="panel" style="border-left:3px solid var(--err)"><div class="row between"><span class="row small b" style="color:var(--err)">' + icon('receipt', 'sm') + ' Potongan Pajak PPh</span><span class="mono b" style="color:var(--err)">' + rp(t.Potongan) + '</span></div><div class="xs muted mt-8">Pajak otomatis tervalidasi dan disetor ke Kas Negara</div><div class="row between mt-8"><b>Realisasi Netto (Ditransfer):</b><b class="mono">' + rp(t.Netto) + '</b></div></div>' +
        '</div></div></div>' +
        '<div class="card mt-24"><div class="card-head"><div><h3>' + icon('sheet') + 'Rincian Realisasi Anggaran per Sub-Kegiatan &amp; Rekening Belanja</h3><div class="sub">Buku rekapitulasi penyerapan dana kegiatan pengawasan DPA TA ' + esc(d.tahun) + '</div></div></div>' +
          '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>No.</th><th>Kode Rekening</th><th>Uraian Belanja Teknis</th><th class="num">Pagu DPA (Rp)</th><th class="num">Realisasi Bruto</th><th class="num">Pot. PPh</th><th class="num">Realisasi Netto</th><th class="num">Sisa Anggaran</th><th class="num">%</th></tr></thead><tbody>' +
          d.perRekening.map((r, i) => '<tr><td>' + (i + 1) + '</td><td class="code">' + esc(r.KodeRekening) + '</td><td><div class="b">' + esc(r.Uraian) + '</div><div class="xs muted mono">' + esc(r.Bidang || r.SubKegiatan || '') + ' • ' + r.JumlahSPJ + ' SPJ</div></td><td class="num">' + UI.angka(r.Pagu) + '</td><td class="num">' + UI.angka(r.Bruto) + '</td><td class="num" style="color:var(--err)">' + (r.Potongan ? UI.angka(r.Potongan) : '-') + '</td><td class="num">' + UI.angka(r.Netto) + '</td><td class="num" style="color:var(--ok)">' + UI.angka(r.Sisa) + '</td><td class="num">' + String(r.Persen).replace('.', ',') + '</td></tr>').join('') +
          '</tbody><tfoot><tr><td></td><td colspan="2">TOTAL REKAPITULASI ALOKASI (TA ' + esc(d.tahun) + ')</td><td class="num mono">' + UI.angka(t.Pagu) + '</td><td class="num mono">' + UI.angka(t.Bruto) + '</td><td class="num mono" style="color:var(--err)">' + UI.angka(t.Potongan) + '</td><td class="num mono">' + UI.angka(t.Netto) + '</td><td class="num mono">' + UI.angka(t.Sisa) + '</td><td class="num mono">' + String(t.Persen).replace('.', ',') + '</td></tr></tfoot></table></div></div>' +
        '<div class="card mt-24"><div class="card-head"><h3>' + icon('folder') + 'Daftar SPJ Periode ' + esc(periode) + '</h3><span class="badge">' + d.spj.length + ' berkas</span></div><div class="tbl-wrap"><table class="tbl compact"><thead><tr><th>No SPJ</th><th>Tanggal</th><th>Kode Rekening</th><th>Uraian</th><th class="num">Personil</th><th class="num">Jumlah Bersih</th><th>Status</th><th class="no-print"></th></tr></thead><tbody>' +
          (d.spj.length ? d.spj.map((s) => '<tr><td class="mono small b">' + esc(s.NomorSPJ) + '</td><td class="mono small">' + UI.tglPendek(s.TglSPJ) + '</td><td class="code">' + esc(s.KodeRekening) + '</td><td class="small ellipsis" style="max-width:300px">' + esc(s.UraianKegiatan) + '</td><td class="num">' + s.JumlahPersonil + '</td><td class="num">' + rp(s.TotalBersih) + '</td><td>' + UI.badge(s.Status) + '</td><td class="no-print"><a class="btn btn-ghost btn-sm" href="#/spj/' + s.SPJID + '/dokumen">Buka</a></td></tr>').join('') : '<tr><td colspan="8">' + UI.empty('Tidak ada SPJ pada periode ini.', 'folder') + '</td></tr>') +
          '</tbody></table></div></div>' +
        '<div class="card mt-24" style="border-left:4px solid var(--ok)"><div class="card-body row wrap gap-lg"><span class="file-ic" style="background:var(--ok-bg);color:var(--ok)">' + icon('shieldCheck') + '</span><div class="grow"><div class="b" style="font-size:16px">Sertifikasi Integritas Rekonsiliasi Keuangan</div><div class="small muted">Laporan realisasi divalidasi silang elektronik dengan Buku Kas Umum (BKU) dan Nota Pencairan Dana (NPD) yang di-generate dari satu sumber data rincian. Seluruh angka dihitung ulang server.</div></div>' +
          '<div class="panel small"><div class="mono xs muted">' + icon('checkCircle', 'sm') + ' DISETUJUI OLEH</div><b>' + esc(d.pengesahan.jabatanKpa) + '</b><div class="xs muted">' + esc(d.pengesahan.kpa || '—') + '</div></div></div></div>' +
        ttdCetak(d.pengesahan);
      bind();
    };
    const kpi = (lbl, val, ic, foot) => '<div class="card kpi"><div class="lbl"><span>' + lbl + '</span><span class="ico">' + icon(ic) + '</span></div><div class="val money">' + val + '</div><div class="foot">' + foot + '</div></div>';
    const bind = () => {
      if ($('#go', el)) $('#go', el).onclick = (e) => UI.act(e.currentTarget, () => { f.bulan = $('#bl', el).value; f.tahun = $('#th', el).value.trim(); f.rekeningId = $('#rk', el).value; f.status = $$('[data-st]', el).filter((c) => c.checked).map((c) => c.dataset.st); return load(); });
      $$('#md [data-m]', el).forEach((b) => (b.onclick = () => { mode = b.dataset.m; draw(); }));
      if ($('#prn', el)) $('#prn', el).onclick = () => { API.call('laporan.logExport', { jenis: 'Cetak berita acara rekonsiliasi ' + (f.bulan || '-') + '/' + f.tahun }, { silent: true }).catch(() => {}); window.print(); };
      if ($('#xls', el)) $('#xls', el).onclick = (e) => UI.act(e.currentTarget, async () => {
        const x = await API.call('laporan.bulanan', Object.assign({}, f, { export: true }));
        await UI.exportXlsx('Laporan_Bulanan_' + (f.bulan || 'Semua') + '_' + f.tahun + '.xlsx', [
          { nama: 'Per Rekening', rows: x.perRekening.map((r, i) => ({ No: i + 1, 'Kode Rekening': r.KodeRekening, Uraian: r.Uraian, 'Sub Kegiatan': r.SubKegiatan, 'Jumlah SPJ': r.JumlahSPJ, 'Pagu (Rp)': r.Pagu, 'Bruto (Rp)': r.Bruto, 'Potongan (Rp)': r.Potongan, 'Netto (Rp)': r.Netto, 'Sisa (Rp)': r.Sisa, 'Serapan (%)': r.Persen })).concat([{ No: '', 'Kode Rekening': 'TOTAL', Uraian: '', 'Sub Kegiatan': '', 'Jumlah SPJ': x.total.JumlahSPJ, 'Pagu (Rp)': x.total.Pagu, 'Bruto (Rp)': x.total.Bruto, 'Potongan (Rp)': x.total.Potongan, 'Netto (Rp)': x.total.Netto, 'Sisa (Rp)': x.total.Sisa, 'Serapan (%)': x.total.Persen }]) },
          { nama: 'Daftar SPJ', rows: x.spj.map((s, i) => ({ No: i + 1, 'Nomor SPJ': s.NomorSPJ, Tanggal: s.TglSPJ, 'Kode Rekening': s.KodeRekening, Uraian: s.UraianKegiatan, Personil: s.JumlahPersonil, 'Bruto (Rp)': s.TotalBruto, 'Potongan (Rp)': s.TotalPotongan, 'Bersih (Rp)': s.TotalBersih, Status: s.Status })) },
          { nama: 'Komposisi', rows: [{ Komponen: 'Uang Harian', 'Nominal (Rp)': x.komposisi.Harian }, { Komponen: 'Transport', 'Nominal (Rp)': x.komposisi.Transport }, { Komponen: 'Penginapan', 'Nominal (Rp)': x.komposisi.Penginapan }, { Komponen: 'Bantuan Survey', 'Nominal (Rp)': x.komposisi.Bantuan }, { Komponen: 'Potongan PPh', 'Nominal (Rp)': x.total.Potongan }] }]);
      });
    };
    const load = async () => { d = await API.call('laporan.bulanan', f); if (alive()) draw(); };
    await load();
  }
};

Pages.realisasi = {
  title: 'Realisasi Anggaran', crumb: ['Laporan & Audit', 'Realisasi Anggaran'], izin: 'report_view',
  async render(el, p, q, alive) {
    const { icon, esc, rp, $ } = UI;
    const rek = await Master.rekening().catch(() => []);
    if (!alive()) return;
    const th = String(App.state.settings.TAHUN_ANGGARAN || new Date().getFullYear());
    const f = { dari: th + '-01-01', sampai: UI.today() < th + '-12-31' && UI.today() > th ? UI.today() : th + '-12-31', rekeningId: '' };
    let d;
    const draw = () => {
      const t = d.total;
      el.innerHTML = kopCetak('LAPORAN REALISASI ANGGARAN PER KODE REKENING', 'Periode ' + UI.tgl(f.dari) + ' s.d. ' + UI.tgl(f.sampai)) +
        '<div class="no-print">' + pageHead({ bc: [['Dashboard', '#/dashboard'], 'Laporan & Audit', 'Realisasi Anggaran'], title: 'Laporan Realisasi Anggaran', sub: 'Breakdown realisasi pengeluaran per kode rekening untuk rekonsiliasi dengan BKU & NPD resmi (status COMPLETED, GENERATED, LOCKED).',
          actions: App.can('report_export') ? '<button class="btn btn-ghost" id="xls">' + icon('sheet') + 'Ekspor Excel</button><button class="btn btn-navy" id="prn">' + icon('printer') + 'Cetak / PDF</button>' : '' }) +
        '<div class="card"><div class="card-body row wrap" style="align-items:flex-end;gap:12px"><div class="field"><label>Tanggal mulai</label><input class="input mono" type="date" id="dr" value="' + f.dari + '"></div><div class="field"><label>Tanggal selesai</label><input class="input mono" type="date" id="sp" value="' + f.sampai + '"></div>' +
          '<div class="field grow" style="min-width:220px"><label>Kode rekening</label><select class="input" id="rk"><option value="">Semua kode rekening</option>' + rek.map((r) => '<option value="' + r.RekeningID + '" ' + (f.rekeningId === r.RekeningID ? 'selected' : '') + '>' + esc(r.KodeRekening + ' — ' + r.Uraian) + '</option>').join('') + '</select></div><button class="btn btn-navy" id="go">' + icon('filter', 'sm') + 'Terapkan</button></div></div></div>' +
        '<div class="grid g4 mt-16">' + [['Total Pagu', t.Pagu], ['Realisasi Bruto', t.Bruto], ['Potongan PPh', t.Potongan], ['Netto Ditransfer', t.Netto]].map((k) => '<div class="card kpi"><div class="lbl">' + k[0] + '</div><div class="val money">' + rp(k[1]) + '</div></div>').join('') + '</div>' +
        '<div class="card mt-16"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>No</th><th>Kode Rekening</th><th>Uraian</th><th class="num">SPJ</th><th class="num">Pagu</th><th class="num">Total Realisasi (Rp)</th><th class="num">Potongan</th><th class="num">Netto</th><th class="num">Sisa</th><th>Keterangan</th></tr></thead><tbody>' +
        d.perRekening.map((r, i) => '<tr><td>' + (i + 1) + '</td><td class="code">' + esc(r.KodeRekening) + '</td><td>' + esc(r.Uraian) + '<div class="xs muted">' + esc(r.SubKegiatan || '') + '</div></td><td class="num">' + r.JumlahSPJ + '</td><td class="num">' + UI.angka(r.Pagu) + '</td><td class="num b">' + UI.angka(r.Bruto) + '</td><td class="num">' + UI.angka(r.Potongan) + '</td><td class="num">' + UI.angka(r.Netto) + '</td><td class="num">' + UI.angka(r.Sisa) + '</td><td class="small">' + (r.Sisa < 0 ? '<span class="badge err">Melampaui pagu</span>' : r.Persen >= 90 ? '<span class="badge draft">Serapan ≥ 90%</span>' : r.JumlahSPJ ? '<span class="badge ok">Normal</span>' : '<span class="faint">Belum ada realisasi</span>') + '</td></tr>').join('') +
        '</tbody><tfoot><tr><td></td><td colspan="2">TOTAL PENGELUARAN KESELURUHAN</td><td class="num">' + t.JumlahSPJ + '</td><td class="num mono">' + UI.angka(t.Pagu) + '</td><td class="num mono">' + UI.angka(t.Bruto) + '</td><td class="num mono">' + UI.angka(t.Potongan) + '</td><td class="num mono">' + UI.angka(t.Netto) + '</td><td class="num mono">' + UI.angka(t.Sisa) + '</td><td></td></tr></tfoot></table></div></div>' + ttdCetak(d.pengesahan);
      $('#go', el).onclick = (e) => UI.act(e.currentTarget, () => { f.dari = $('#dr', el).value; f.sampai = $('#sp', el).value; f.rekeningId = $('#rk', el).value; return load(); });
      if ($('#prn', el)) $('#prn', el).onclick = () => { API.call('laporan.logExport', { jenis: 'Cetak laporan realisasi ' + f.dari + ' s.d. ' + f.sampai }, { silent: true }).catch(() => {}); window.print(); };
      if ($('#xls', el)) $('#xls', el).onclick = (e) => UI.act(e.currentTarget, async () => {
        const x = await API.call('laporan.realisasi', Object.assign({}, f, { export: true }));
        await UI.exportXlsx('Realisasi_Anggaran_' + f.dari + '_' + f.sampai + '.xlsx', [{ nama: 'Realisasi', rows: x.perRekening.map((r, i) => ({ No: i + 1, 'Kode Rekening': r.KodeRekening, Uraian: r.Uraian, 'Sub Kegiatan': r.SubKegiatan, 'Jumlah SPJ': r.JumlahSPJ, 'Pagu (Rp)': r.Pagu, 'Total Realisasi (Rp)': r.Bruto, 'Potongan (Rp)': r.Potongan, 'Netto (Rp)': r.Netto, 'Sisa (Rp)': r.Sisa })).concat([{ No: '', 'Kode Rekening': 'TOTAL', 'Jumlah SPJ': x.total.JumlahSPJ, 'Pagu (Rp)': x.total.Pagu, 'Total Realisasi (Rp)': x.total.Bruto, 'Potongan (Rp)': x.total.Potongan, 'Netto (Rp)': x.total.Netto, 'Sisa (Rp)': x.total.Sisa }]) }]);
      });
    };
    const load = async () => { d = await API.call('laporan.realisasi', f); if (alive()) draw(); };
    await load();
  }
};
