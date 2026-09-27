/* Master data cache sisi klien (TTL 5 menit) */
const Master = (() => {
  const c = {};
  async function get(key, action, data, force) {
    const now = Date.now();
    if (!force && c[key] && now - c[key].t < 300000) return c[key].v;
    const v = await API.call(action, data || {}, { silent: true });
    c[key] = { v, t: now }; return v;
  }
  return {
    rekening: (force) => get('rek', 'rekening.list', { semua: true }, force),
    pegawai: (force) => get('pgw', 'pegawai.list', {}, force),
    templates: (force) => get('tpl', 'template.list', {}, force),
    clear: (k) => { if (k) delete c[k]; else Object.keys(c).forEach((x) => delete c[x]); }
  };
})();

/* Daftar Surat Pertanggungjawaban (SPJ) */
Pages.spjList = {
  title: 'Daftar SPJ', crumb: ['Inspektorat', 'Pengelolaan Kegiatan'], izin: 'spj_view',
  async render(el, p, q, alive) {
    const { icon, esc, rp, badge, $, $$ } = UI;
    const f = { cari: q.cari || '', status: q.status || '', rekeningId: q.rek || '', dari: q.dari || '', sampai: q.sampai || '', halaman: 1, per: 10 };
    const pilih = new Set();
    let data = null;
    const rek = await Master.rekening().catch(() => []);
    if (!alive()) return;
    el.innerHTML = pageHead({
      bc: [['Dashboard', '#/dashboard'], ['Pengelolaan SPJ', '#/spj'], 'Daftar SPJ'], title: 'Daftar Surat Pertanggungjawaban (SPJ)',
      sub: 'Kelola, filter, dan unduh arsip pertanggungjawaban kegiatan teknis pengawasan anggaran',
      actions: (App.can('report_export') || App.can('download') ? '<button class="btn btn-ghost" id="exp">' + icon('sheet') + 'Ekspor Rekap (.xlsx)</button>' : '') +
        (App.can('spj_create') ? '<a class="btn btn-navy" href="#/spj/baru">' + icon('plusCircle') + '+ Buat SPJ Baru</a>' : '')
    }) +
    '<div class="card"><div class="card-body flt5" id="flt">' +
      '<div class="field"><label>Pencarian Arsip</label><div class="affix"><span class="pre">' + icon('search', 'sm') + '</span><input id="f-cari" placeholder="Cari nomor SPJ, uraian kegiatan, atau nama" value="' + esc(f.cari) + '"></div></div>' +
      '<div class="field"><label>Status Berkas</label><select class="input" id="f-status"><option value="">Semua Status</option>' + ['DRAFT', 'COMPLETED', 'GENERATED', 'LOCKED'].map((s) => '<option ' + (f.status === s ? 'selected' : '') + '>' + s + '</option>').join('') + '</select></div>' +
      '<div class="field"><label>Kode Rekening DPA</label><select class="input" id="f-rek"><option value="">Semua Rekening Pengawasan</option>' + rek.map((r) => '<option value="' + r.RekeningID + '" ' + (f.rekeningId === r.RekeningID ? 'selected' : '') + '>' + esc((r.SubKegiatan || r.Uraian) + ' — ' + r.KodeRekening.slice(-12)) + '</option>').join('') + '</select></div>' +
      '<div class="field"><label>Periode Dari</label><input class="input mono" type="date" id="f-dari" value="' + esc(f.dari) + '"></div>' +
      '<div class="field"><label>Sampai</label><input class="input mono" type="date" id="f-sampai" value="' + esc(f.sampai) + '"></div>' +
    '</div></div>' +
    '<div class="row wrap between mt-16" style="align-items:stretch;gap:16px"><div class="row wrap" id="tabs"></div><div class="card" style="padding:12px 18px" id="ring"></div></div>' +
    '<div id="bulk" class="mt-16"></div>' +
    '<div class="card mt-16"><div class="tbl-wrap"><table class="tbl"><thead><tr><th style="width:44px"><input type="checkbox" class="check" id="ck-all" aria-label="Pilih semua"></th><th>No. SPJ &amp; Surat Tugas (SPT)</th><th>Tgl Terbit</th><th>Kode Rekening &amp; Uraian Sub Kegiatan</th><th>Tim Personil</th><th class="num">Netto Cair</th><th>Status</th><th></th></tr></thead><tbody id="tb"></tbody><tfoot id="tf"></tfoot></table></div>' +
    '<div class="pager" id="pg"></div></div>' +
    '<div class="alert mt-16"><div class="ic">' + icon('shieldCheck') + '</div><div><b>Integritas Arsip SPJ Terverifikasi</b><div class="muted small">Seluruh berkas berstatus <b>LOCKED</b> telah disegel secara digital sesuai penomoran registrasi Inspektorat Kabupaten Kutai Timur. Perubahan data hanya dapat dilakukan melalui pembukaan kunci oleh Super Admin dan tercatat di Audit Trail.</div></div></div>';

    const load = async () => {
      $('#tb', el).innerHTML = '<tr><td colspan="8">' + UI.loadingBlock() + '</td></tr>';
      data = await API.call('spj.list', f);
      if (!alive()) return;
      draw();
    };
    const draw = () => {
      const c = data.counts, r = data.ringkas;
      $('#tabs', el).innerHTML = [['', 'Semua', c.SEMUA], ['DRAFT', 'DRAFT', c.DRAFT], ['COMPLETED', 'COMPLETED', c.COMPLETED], ['GENERATED', 'GENERATED', c.GENERATED], ['LOCKED', 'LOCKED', c.LOCKED]]
        .map((t) => '<button class="chip ' + (f.status === t[0] ? 'on' : '') + '" data-st="' + t[0] + '">' + (t[0] === 'DRAFT' ? '<span class="dot warn"></span>' : t[0] === 'COMPLETED' ? '<span class="dot"></span>' : t[0] === 'GENERATED' ? '<span class="dot" style="background:var(--info)"></span>' : t[0] === 'LOCKED' ? icon('lock', 'sm') : '') + t[1] + ' <span class="n">' + (t[2] || 0) + '</span></button>').join('');
      $$('[data-st]', el).forEach((b) => (b.onclick = () => { f.status = b.dataset.st; $('#f-status', el).value = f.status; f.halaman = 1; load(); }));
      $('#ring', el).innerHTML = '<div class="row gap-xl wrap"><div class="row">' + icon('wallet', 'lg') + '<div><div class="mono xs muted upper">Total Belanja Tertampung</div><div class="mono b">' + rp(r.totalBruto) + '</div></div></div>' +
        '<div class="row">' + icon('shieldCheck', 'lg') + '<div><div class="mono xs muted upper">Locked / Audited</div><div class="mono b">' + UI.persen(r.locked, r.total).toString().replace('.', ',') + '% <span class="badge info">' + r.locked + '/' + r.total + ' Dokumen</span></div></div></div>' +
        '<div class="row"><span style="color:var(--amber)">' + icon('printer', 'lg') + '</span><div><div class="mono xs muted upper">Siap Cetak Final</div><div class="mono b" style="color:var(--amber-hover)">' + r.siapCetak + ' Berkas</div></div></div></div>';
      $('#tb', el).innerHTML = data.rows.length ? data.rows.map((s) => {
        const next = s.Status === 'DRAFT' ? 'rincian' : 'dokumen';
        return '<tr class="' + (pilih.has(s.SPJID) ? 'sel' : '') + '"><td><input type="checkbox" class="check" data-ck="' + s.SPJID + '" ' + (pilih.has(s.SPJID) ? 'checked' : '') + ' aria-label="Pilih ' + esc(s.NomorSPJ) + '"></td>' +
          '<td class="nowrap"><a class="mono b" style="color:var(--text)" href="#/spj/' + s.SPJID + '/' + next + '">' + esc(s.NomorSPJ) + '</a><div class="mono xs muted">SPT: ' + esc(s.NomorSPT || '-') + '</div></td>' +
          '<td class="mono small nowrap">' + UI.tglPendek(s.TglSPJ) + '</td>' +
          '<td style="max-width:380px"><div class="code">' + esc(s.KodeRekening) + '</div><div class="ellipsis">' + esc(s.UraianKegiatan || s.UraianRekening) + '</div></td>' +
          '<td class="nowrap">' + icon('users', 'sm') + ' ' + s.Personil + ' Personil <span class="mono xs muted">(' + esc(s.PersonilRingkas) + ')</span></td>' +
          '<td class="num">' + rp(s.TotalBersih) + '</td><td>' + badge(s.Status) + '</td>' +
          '<td class="nowrap"><a class="btn btn-ghost btn-sm" href="#/spj/' + s.SPJID + '/' + next + '">Buka</a>' +
          (App.can('spj_delete') && s.Status !== 'LOCKED' ? ' <button class="btn btn-ghost btn-icon btn-sm" data-del="' + s.SPJID + '" title="Arsipkan">' + icon('trash', 'sm') + '</button>' : '') + '</td></tr>';
      }).join('') : '<tr><td colspan="8">' + UI.empty('Tidak ada SPJ yang cocok dengan filter.', 'search') + '</td></tr>';
      const sb = data.rows.reduce((a, s) => a + s.TotalBruto, 0), sn = data.rows.reduce((a, s) => a + s.TotalBersih, 0);
      $('#tf', el).innerHTML = data.rows.length ? '<tr><td></td><td colspan="4">' + icon('sheet', 'sm') + ' Subtotal Akumulasi Halaman Ini (' + data.rows.length + ' Baris)</td><td class="num" colspan="3"><span class="mono small muted">Bruto:</span> <span class="mono">' + rp(sb) + '</span> &nbsp; <span class="mono small muted">Netto Cair:</span> <span class="mono">' + rp(sn) + '</span></td></tr>' : '';
      $('#pg', el).innerHTML = '<div class="row wrap">Menampilkan <b>' + (data.total ? (data.halaman - 1) * data.per + 1 : 0) + '–' + Math.min(data.total, data.halaman * data.per) + '</b> dari <b>' + data.total + '</b> SPJ terdaftar <span class="small muted" style="margin-left:12px">Tampilkan:</span> <select class="input mono" id="per" style="width:76px;height:32px">' + [10, 25, 50, 100].map((n) => '<option ' + (n === f.per ? 'selected' : '') + '>' + n + '</option>').join('') + '</select></div>' +
        UI.pager(data.total, data.halaman, data.per, (h) => { f.halaman = h; load(); });
      $('#per', el).onchange = (e) => { f.per = Number(e.target.value); f.halaman = 1; load(); };
      $$('[data-ck]', el).forEach((c) => (c.onchange = () => { c.checked ? pilih.add(c.dataset.ck) : pilih.delete(c.dataset.ck); c.closest('tr').classList.toggle('sel', c.checked); drawBulk(); }));
      $('#ck-all', el).checked = data.rows.length > 0 && data.rows.every((s) => pilih.has(s.SPJID));
      $$('[data-del]', el).forEach((b) => (b.onclick = async () => {
        const alasan = await UI.prompt('Arsipkan SPJ', 'Alasan pengarsipan (soft-delete, tercatat di audit)', { ok: 'Arsipkan', placeholder: 'mis. duplikat entri' });
        if (alasan === null) return;
        await API.call('spj.delete', { spjId: b.dataset.del, alasan }, { toast: true }); load(); App.loadNotif();
      }));
      drawBulk();
    };
    const drawBulk = () => {
      const box = $('#bulk', el);
      if (!pilih.size) { box.innerHTML = ''; return; }
      const sel = data.rows.filter((s) => pilih.has(s.SPJID));
      box.innerHTML = '<div class="bulkbar"><span class="ck">' + icon('check', 'sm') + '</span><b>' + pilih.size + ' berkas SPJ dipilih</b><span class="mono small muted">| Akumulasi Bersih (halaman ini): ' + rp(sel.reduce((a, s) => a + s.TotalBersih, 0)) + '</span><span class="grow"></span>' +
        (App.can('download') ? '<button class="btn btn-ghost btn-sm" id="b-zip">' + icon('folder', 'sm') + 'Bulk Unduh ZIP</button>' : '') +
        '<button class="btn btn-navy btn-sm" id="b-reg">' + icon('printer', 'sm') + 'Bulk Cetak Register</button><button class="btn-link" id="b-clr">Batalkan Pilihan</button></div>';
      $('#b-clr', box).onclick = () => { pilih.clear(); draw(); };
      if ($('#b-zip', box)) $('#b-zip', box).onclick = (e) => UI.act(e.currentTarget, async () => { const d = await API.call('dokumen.zip', { spjIds: Array.from(pilih) }); UI.download(d.base64, d.nama, d.mime); UI.toast(d.jumlah + ' berkas dikemas dalam ZIP.', 'ok'); });
      $('#b-reg', box).onclick = () => cetakRegister(data.rows.filter((s) => pilih.has(s.SPJID)));
    };
    const cetakRegister = (rows) => {
      const w = window.open('', '_blank'); if (!w) return UI.toast('Izinkan pop-up untuk mencetak register.', 'warn');
      const st = App.state.settings;
      w.document.write('<html><head><title>Register SPJ</title><style>body{font-family:Arial;font-size:11px;padding:24px}h2,h3{text-align:center;margin:2px}table{width:100%;border-collapse:collapse;margin-top:14px}th,td{border:1px solid #555;padding:5px 6px}th{background:#EEF1F6}td.n{text-align:right;font-family:monospace}</style></head><body>' +
        '<h3>' + esc(st.NAMA_PEMDA || '') + '</h3><h2>' + esc(st.NAMA_INSTANSI || '') + '</h2><h3 style="margin-top:12px">REGISTER SURAT PERTANGGUNGJAWABAN (SPJ)</h3><div style="text-align:center">Dicetak ' + UI.tgl(UI.today()) + '</div>' +
        '<table><tr><th>No</th><th>Nomor SPJ</th><th>Tanggal</th><th>Kode Rekening</th><th>Uraian</th><th>Personil</th><th>Bruto</th><th>Potongan</th><th>Netto</th><th>Status</th></tr>' +
        rows.map((s, i) => '<tr><td>' + (i + 1) + '</td><td>' + esc(s.NomorSPJ) + '</td><td>' + UI.tglPendek(s.TglSPJ) + '</td><td>' + esc(s.KodeRekening) + '</td><td>' + esc(s.UraianKegiatan) + '</td><td class="n">' + s.Personil + '</td><td class="n">' + UI.angka(s.TotalBruto) + '</td><td class="n">' + UI.angka(s.TotalPotongan) + '</td><td class="n">' + UI.angka(s.TotalBersih) + '</td><td>' + s.Status + '</td></tr>').join('') +
        '<tr><th colspan="6">JUMLAH</th><th class="n">' + UI.angka(rows.reduce((a, s) => a + s.TotalBruto, 0)) + '</th><th class="n">' + UI.angka(rows.reduce((a, s) => a + s.TotalPotongan, 0)) + '</th><th class="n">' + UI.angka(rows.reduce((a, s) => a + s.TotalBersih, 0)) + '</th><th></th></tr></table>' +
        '<script>setTimeout(function(){print()},300)<\/script></body></html>');
      w.document.close();
    };
    $('#ck-all', el).onchange = (e) => { data.rows.forEach((s) => (e.target.checked ? pilih.add(s.SPJID) : pilih.delete(s.SPJID))); draw(); };
    const refilter = () => { f.cari = $('#f-cari', el).value.trim(); f.status = $('#f-status', el).value; f.rekeningId = $('#f-rek', el).value; f.dari = $('#f-dari', el).value; f.sampai = $('#f-sampai', el).value; f.halaman = 1; load(); };
    $('#f-cari', el).oninput = UI.debounce(refilter, 400);
    ['#f-status', '#f-rek', '#f-dari', '#f-sampai'].forEach((s) => ($(s, el).onchange = refilter));
    if ($('#exp', el)) $('#exp', el).onclick = (e) => UI.act(e.currentTarget, async () => {
      const d = await API.call('spj.list', Object.assign({}, f, { semua: true, halaman: 1 }));
      if (!d.rows.length) return UI.toast('Tidak ada data untuk diekspor.', 'warn');
      await UI.exportXlsx('Rekap_SPJ_' + UI.today() + '.xlsx', [{ nama: 'Rekap SPJ', rows: d.rows.map((s, i) => ({ No: i + 1, 'Nomor SPJ': s.NomorSPJ, 'Tanggal SPJ': s.TglSPJ, 'Nomor SPT': s.NomorSPT, 'Kode Rekening': s.KodeRekening,
        'Uraian Rekening': s.UraianRekening, 'Uraian Kegiatan': s.UraianKegiatan, Personil: s.Personil, 'Bruto (Rp)': s.TotalBruto, 'Potongan (Rp)': s.TotalPotongan, 'Netto (Rp)': s.TotalBersih, Status: s.Status, 'Dibuat Oleh': s.DibuatOleh })) }]);
      API.call('laporan.logExport', { jenis: 'Rekap daftar SPJ (' + d.rows.length + ' baris)' }, { silent: true }).catch(() => {});
    });
    await load();
  }
};
