/* Stepper 3 tahap SPJ (dipakai tahap 1–3) */
function spjStepper(cur, spj) {
  const id = spj && spj.SPJID;
  const st = spj ? spj.Status : 'DRAFT';
  const done1 = !!id, done2 = st !== 'DRAFT', done3 = st === 'GENERATED' || st === 'LOCKED';
  const step = (n, k, t, d, isDone, href) => {
    const cls = cur === n ? 'cur' : isDone ? 'done' : '';
    const tag = href && cur !== n ? 'a href="' + href + '"' : 'div';
    return '<' + tag + ' class="step ' + cls + '"><span class="n">' + (isDone && cur !== n ? UI.icon('check') : n) + '</span><div class="grow" style="min-width:0"><div class="k">Langkah ' + n + ' • ' + (cur === n ? 'Sedang berjalan' : isDone ? 'Selesai' : 'Menunggu') + '</div><div class="t">' + t + '</div><div class="d ellipsis">' + d + '</div></div></' + (tag === 'div' ? 'div' : 'a') + '>';
  };
  return '<div class="card" style="padding:12px"><div class="stepper">' +
    step(1, '', 'Info SPJ & Rekening', id ? 'No: ' + UI.esc(spj.NomorSPJ) : 'Identitas & kode rekening', done1, id ? '#/spj/' + id + '/info' : '') +
    step(2, '', 'Input Rincian Biaya', 'Perhitungan potongan PPh otomatis', done2, id ? '#/spj/' + id + '/rincian' : '') +
    step(3, '', 'Generate & Finalisasi', 'Cetak berkas & TTD digital', done3, id && st !== 'DRAFT' ? '#/spj/' + id + '/dokumen' : '') +
    '</div></div>';
}

/* Tahap 1 — Identitas SPJ & Kode Rekening Anggaran */
Pages.spjForm = {
  title: 'Buat SPJ Baru', crumb: ['Inspektorat', 'Pengelolaan Kegiatan'], izin: ['spj_create', 'spj_view'],
  async render(el, params, q, alive) {
    const { icon, esc, rp, $ } = UI;
    const id = params[0];
    const [rekAll, pgw, tplData, det] = await Promise.all([Master.rekening(true), Master.pegawai(), Master.templates().catch(() => ({ templates: [] })), id ? API.call('spj.get', { spjId: id }) : Promise.resolve(null)]);
    if (!alive()) return;
    const ta = String(App.state.settings.TAHUN_ANGGARAN || new Date().getFullYear());
    const rek = rekAll.filter((r) => r.Status !== 'Nonaktif');
    const s = det ? det.spj : null;
    const bisaEdit = !s || (App.can(['spj_create', 'spj_input']) && (s.Status === 'DRAFT' || s.Status === 'COMPLETED'));
    if (!s && !App.can('spj_create')) { el.innerHTML = UI.empty('Anda tidak memiliki izin membuat SPJ.', 'lock'); return; }
    const pref = (k) => { try { return localStorage.getItem('sipetik_' + k) || ''; } catch (e) { return ''; } };
    const nipUser = String(App.state.user.NIP || '');
    const defPptk = (s && s.PPTK_ID) || pref('pptk') || ((pgw.find((x) => nipUser && x.NIP === nipUser) || pgw.find((x) => /pptk|koordinator/i.test(x.Jabatan)) || {}).PegawaiID || '');
    const defBend = (s && s.Bendahara_ID) || pref('bend') || ((pgw.find((x) => /bendahara/i.test(x.Jabatan)) || {}).PegawaiID || '');
    const tplAktif = (tplData.templates || []).filter((t) => t.Status === 'AKTIF');
    const optPg = (sel) => '<option value="">— pilih pegawai —</option>' + pgw.map((x) => '<option value="' + x.PegawaiID + '" ' + (x.PegawaiID === sel ? 'selected' : '') + '>' + esc(x.Nama) + ' (NIP. ' + UI.nip(x.NIP) + ')</option>').join('');

    el.innerHTML = pageHead({
      bc: [['Dashboard', '#/dashboard'], ['Kelola SPJ', '#/spj'], s ? s.NomorSPJ : 'Buat SPJ Baru'],
      title: s ? 'Identitas SPJ &amp; Kode Rekening Anggaran' : 'Buat SPJ Baru: Identitas &amp; Kode Rekening Anggaran',
      sub: 'Tahap 1 dari 3: Masukkan identitas resmi dokumen pertanggungjawaban kegiatan teknis inspektorat',
      actions: '<span class="badge draft"><span class="dot warn"></span>STATUS: ' + (s ? esc(s.Status) : 'DRAFT PENGISIAN') + '</span><span class="badge locked">' + icon('checkCircle', 'sm') + 'TA ' + esc(ta) + ' DPA Aktif</span>'
    }) + spjStepper(1, s) +
    '<div class="alert mt-16"><div class="ic">' + icon('info') + '</div><div><div class="row"><span>Pedoman Akuntabilitas Penatausahaan SPJ</span><span class="badge draft">SK Standar ' + esc(ta) + '</span></div><div class="muted mt-8">Pastikan <b>Kode Rekening Anggaran</b> sesuai Dokumen Pelaksanaan Anggaran (DPA) Inspektorat TA ' + esc(ta) + '. Nomor SPJ akan terkunci setelah dokumen di-generate dan mendapatkan <span class="hl-amber">cap audit kriptografis SHA-256</span>.</div></div></div>' +
    (!bisaEdit ? '<div class="alert warn mt-16"><div class="ic">' + icon('lock') + '</div><div><b>SPJ berstatus ' + esc(s.Status) + ' — hanya baca.</b><div class="small">' + (s.Status === 'GENERATED' ? 'Buka kembali ke DRAFT dari halaman dokumen untuk merevisi.' : 'Minta Super Admin membuka kunci untuk revisi.') + '</div></div></div>' : '') +
    '<div class="card mt-16"><div class="card-body"><div class="form-grid" style="grid-template-columns:minmax(0,1.6fr) minmax(0,1fr)">' +
      '<div class="field"><label>Nomor SPJ Dokumen Resmi <span class="grow"></span><span class="badge ok">' + (s ? 'Tersimpan' : 'Otomatis dari Sistem') + '</span></label>' +
        '<div class="affix"><span class="pre">' + icon('hash', 'sm') + '</span><input id="nomor" class="mono" value="' + esc(s ? s.NomorSPJ : '') + '" placeholder="memuat…"><button type="button" class="btn btn-soft btn-sm" id="acak" style="margin:3px;height:28px">' + icon('refresh', 'sm') + 'Acak No</button></div>' +
        '<div class="hint mono">Format resmi: ' + esc(App.state.settings.FORMAT_NOMOR_SPJ || 'T-[Klasifikasi]/[Urut]/ITKAB.[Bidang]') + '</div></div>' +
      '<div class="field"><label>Tanggal SPJ<span class="req">*</span></label><input class="input mono" type="date" id="tgl" value="' + esc(s ? s.TglSPJ : UI.today()) + '"><div class="hint" id="tw"></div></div>' +
      '<div class="field full"><label>Kode Rekening Anggaran (DPA-SKPD)<span class="req">*</span><span class="grow"></span><span class="mono xs" style="color:var(--slate)" id="subk"></span></label>' +
        '<select class="input" id="rek"><option value="">— pilih kode rekening —</option>' + rek.map((r) => '<option value="' + r.RekeningID + '">' + esc(r.KodeRekening + ' — ' + r.Uraian + (r.SubKegiatan ? ' (' + r.SubKegiatan + ')' : '')) + '</option>').join('') + '</select>' +
        '<div class="panel" id="pagu" style="padding:12px 16px"></div></div>' +
      '<div class="field full"><label>Uraian / Judul Kegiatan Pengawasan<span class="req">*</span><span class="grow"></span><span class="mono xs muted" id="cnt">0 / 500 karakter</span></label>' +
        '<textarea class="input" id="uraian" maxlength="500" rows="3" placeholder="mis. Pelaksanaan Pengawasan dan Evaluasi Akuntabilitas Pengelolaan Keuangan Desa di Kecamatan …">' + esc(s ? s.UraianKegiatan : '') + '</textarea>' +
        '<div class="row between"><span class="hint">Gunakan bahasa formal sesuai standar redaksional Laporan Hasil Pemeriksaan (LHP).</span><button type="button" class="btn-link mono xs" id="std">Gunakan template SPT standar</button></div></div>' +
      '<div class="field"><label>Nomor Surat Perintah Tugas (SPT)</label><input class="input mono" id="spt" value="' + esc(s ? s.NomorSPT : '') + '" placeholder="700/014/ITKAB/' + esc(ta) + '"></div>' +
      '<div class="field"><label>Tanggal SPT</label><input class="input mono" type="date" id="tglspt" value="' + esc(s ? s.TglSPT : '') + '"></div>' +
    '</div>' +
    '<div class="sec-title mt-24"><span class="ico">' + icon('stamp', 'lg') + '</span><div><h4>Pejabat Penandatangan Dokumen</h4><p>Sesuai Surat Keputusan Inspektur Kutai Timur Tahun Anggaran ' + esc(ta) + '</p></div></div>' +
    '<div class="panel form-grid"><div class="field"><label>Pejabat Pelaksana Teknis Kegiatan (PPTK)<span class="req">*</span></label><select class="input" id="pptk">' + optPg(defPptk) + '</select><div class="hint mono">Bertanggung jawab atas aspek substantif teknis kegiatan</div></div>' +
      '<div class="field"><label>Bendahara Pengeluaran Pembantu<span class="req">*</span></label><select class="input" id="bend">' + optPg(defBend) + '</select><div class="hint mono">Bertanggung jawab atas pengujian kelayakan bayar &amp; pajak</div></div></div>' +
    '<div class="panel mt-16"><label class="check" style="align-items:flex-start"><input type="checkbox" checked disabled><span><b style="font-weight:500">Gunakan template standar Keputusan Inspektur Kutai Timur</b><div class="small muted">Format otomatis mencakup ' + (tplAktif.length ? tplAktif.map((t) => esc(t.Nama)).join(', ') : 'Kwitansi, Rincian Biaya, BKU, dan NPD') + '.</div></span></label></div>' +
    '<div class="stamp mt-16"><span class="seal">' + icon('shieldCheck', 'lg') + '</span><div class="grow"><div class="b">Status Pra-Audit SIPETIK</div><div class="mono xs" style="color:var(--slate)">Integritas dokumen divalidasi terhadap sisa pagu DPA &amp; master pegawai</div></div><span class="badge info" id="pra">TAHAP 1</span></div>' +
    '</div></div>' +
    '<div class="actionbar"><a class="btn btn-link" href="' + (s ? '#/spj' : '#/dashboard') + '">' + icon('arrowLeft') + 'Batal &amp; Kembali</a><span class="grow"></span>' +
      (bisaEdit ? '<button class="btn btn-soft" id="draft">' + icon('book') + 'Simpan Sebagai Draft</button><button class="btn btn-navy" id="next">Lanjut ke Input Rincian (Step 2) ' + icon('arrowRight') + '</button>'
        : '<a class="btn btn-navy" href="#/spj/' + (s && s.SPJID) + '/' + (s && s.Status === 'DRAFT' ? 'rincian' : 'dokumen') + '">Lanjut ' + icon('arrowRight') + '</a>') + '</div>';

    const nomor = $('#nomor', el), tgl = $('#tgl', el), rekSel = $('#rek', el), ura = $('#uraian', el);
    if (s) rekSel.value = s.RekeningID; else if (rek.length === 1) rekSel.value = rek[0].RekeningID;
    const drawPagu = () => {
      const r = rek.find((x) => x.RekeningID === rekSel.value);
      $('#subk', el).innerHTML = r && r.Bidang ? icon('folder', 'sm') + ' Sub Kegiatan: ' + esc(r.Bidang) : '';
      if (!r) { $('#pagu', el).innerHTML = '<span class="muted small">Pilih kode rekening untuk melihat pagu & sisa anggaran.</span>'; return; }
      const lain = s && s.RekeningID === r.RekeningID && s.Status !== 'DRAFT' ? r.Realisasi - s.TotalBruto : r.Realisasi;
      const sisa = r.Pagu - lain, pct = UI.persen(lain, r.Pagu);
      $('#pagu', el).innerHTML = '<div class="row wrap gap-xl"><div><div class="mono xs muted upper">Pagu Tahunan</div><div class="mono b">' + rp(r.Pagu) + '</div></div>' +
        '<div><div class="mono xs muted upper">Realisasi Saat Ini</div><div class="mono b">' + rp(lain) + ' <span class="xs" style="color:var(--amber)">(' + String(pct).replace('.', ',') + '%)</span></div></div>' +
        '<div><div class="mono xs muted upper">Sisa Anggaran Tersedia</div><div class="mono b" style="color:' + (sisa > 0 ? 'var(--ok)' : 'var(--err)') + '">' + rp(sisa) + '</div></div>' +
        '<div class="grow" style="min-width:180px"><div class="row between mono xs"><span class="muted">Beban Pagu</span><b>' + String(pct).replace('.', ',') + '% Terpakai</b></div><div class="mt-8">' + UI.bar(pct, 'grad') + '</div></div></div>';
      $('#pra', el).textContent = sisa > 0 ? 'TAHAP 1 TERVERIFIKASI' : 'PAGU HABIS';
      $('#pra', el).className = 'badge ' + (sisa > 0 ? 'info' : 'err');
    };
    const drawTw = () => { const m = Number((tgl.value || '').substring(5, 7)); $('#tw', el).textContent = m ? 'Terjadwal untuk periode laporan Triwulan ' + ['I', 'II', 'III', 'IV'][Math.floor((m - 1) / 3)] + ' TA ' + tgl.value.substring(0, 4) : ''; };
    const cnt = () => ($('#cnt', el).textContent = ura.value.length + ' / 500 karakter');
    rekSel.onchange = drawPagu; tgl.onchange = () => { drawTw(); if (!s) ambilNomor(); }; ura.oninput = cnt;
    drawPagu(); drawTw(); cnt();
    const ambilNomor = async (acak) => { try { const d = await API.call('spj.nextNumber', { tgl: tgl.value, acak: !!acak }, { silent: true }); nomor.value = d.nomor; } catch (e) { nomor.placeholder = 'isi manual'; } };
    if (!s) ambilNomor();
    $('#acak', el).onclick = () => ambilNomor(true);
    $('#std', el).onclick = () => {
      const r = rek.find((x) => x.RekeningID === rekSel.value);
      ura.value = 'Pelaksanaan ' + (r ? (r.SubKegiatan || r.Uraian) : 'Pengawasan') + ' berdasarkan Surat Perintah Tugas Inspektur Nomor ' + ($('#spt', el).value || '…') + ' di wilayah Kabupaten Kutai Timur.';
      cnt();
    };
    if (!bisaEdit) { UI.$$('input,select,textarea,#acak,#std', el).forEach((x) => (x.disabled = true)); return; }

    const simpan = async (lanjut) => {
      const data = { SPJID: s ? s.SPJID : '', NomorSPJ: nomor.value.trim(), TglSPJ: tgl.value, RekeningID: rekSel.value, UraianKegiatan: ura.value.trim(),
        NomorSPT: $('#spt', el).value.trim(), TglSPT: $('#tglspt', el).value, PPTK_ID: $('#pptk', el).value, Bendahara_ID: $('#bend', el).value };
      const err = [];
      if (!data.NomorSPJ) err.push('Nomor SPJ'); if (!data.TglSPJ) err.push('Tanggal SPJ'); if (!data.RekeningID) err.push('Kode Rekening'); if (!data.UraianKegiatan) err.push('Uraian kegiatan');
      if (!data.PPTK_ID) err.push('PPTK'); if (!data.Bendahara_ID) err.push('Bendahara');
      if (err.length) return UI.toast('Lengkapi: ' + err.join(', '), 'err');
      try { localStorage.setItem('sipetik_pptk', data.PPTK_ID); localStorage.setItem('sipetik_bend', data.Bendahara_ID); } catch (e) {}
      const d = await API.call('spj.save', { spj: data }, { toast: true });
      Master.clear('rek'); API.clearCache(); App.loadNotif();
      App.go(lanjut ? '#/spj/' + d.SPJID + '/rincian' : '#/spj/' + d.SPJID + '/info');
    };
    $('#draft', el).onclick = (e) => UI.act(e.currentTarget, () => simpan(false));
    $('#next', el).onclick = (e) => UI.act(e.currentTarget, () => simpan(true));
  }
};
