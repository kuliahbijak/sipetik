/* Tahap 2 — Rincian Biaya & Potongan Personil (tabel dinamis, kalkulasi real-time) */
Pages.spjRincian = {
  title: 'Input Rincian Biaya', crumb: ['Inspektorat', 'Pengelolaan Kegiatan'], izin: 'spj_view',
  async render(el, params, q, alive) {
    const { icon, esc, rp, angka, $, $$ } = UI;
    const spjId = params[0];
    let [det, pgw] = await Promise.all([API.call('spj.get', { spjId }), Master.pegawai(true)]);
    if (!alive()) return;
    const pgMap = {}; pgw.forEach((x) => (pgMap[x.PegawaiID] = x));
    det.rincian.forEach((r) => { if (!pgMap[r.PegawaiID]) pgMap[r.PegawaiID] = { PegawaiID: r.PegawaiID, Nama: r.Nama + ' (nonaktif)', NIP: r.NIP, Golongan: r.Golongan }; });
    const pgList = Object.values(pgMap).sort((a, b) => a.Nama.localeCompare(b.Nama));
    const LS = 'sipetik_draft_' + spjId;
    let rows, dirty = false;
    const fromServer = () => det.rincian.map((r) => ({ RincianID: r.RincianID, PegawaiID: r.PegawaiID, Bantuan: r.Bantuan, Harian: r.Harian, Hari: r.Hari, Transport: r.Transport, Penginapan: r.Penginapan, Keterangan: r.Keterangan || '' }));
    rows = fromServer();
    const persen = det.persenPotongan, batas = det.batasAnomali;
    const s = () => det.spj;
    const editable = () => det.bisa.edit;
    const hitung = (r) => { const j = (+r.Bantuan || 0) + (+r.Harian || 0) * Math.floor(+r.Hari || 0) + (+r.Transport || 0) + (+r.Penginapan || 0); const p = Math.round(j * persen / 100); return { j, p, n: j - p }; };
    let lokal = null; try { lokal = JSON.parse(localStorage.getItem(LS) || 'null'); } catch (e) {}

    const shell = () => {
      const sp = s();
      el.innerHTML = pageHead({
        bc: [['Dashboard', '#/dashboard'], ['Kelola SPJ', '#/spj'], [sp.NomorSPJ, '#/spj/' + spjId + '/info'], 'Input Rincian Biaya'],
        eyebrow: '<span class="badge ' + (sp.Status === 'DRAFT' ? 'draft' : sp.Status === 'LOCKED' ? 'locked' : 'completed') + '">STATUS: ' + (sp.Status === 'DRAFT' ? 'PROSES INPUT RINCIAN' : sp.Status) + '</span><span class="badge locked">TA ' + esc(App.state.settings.TAHUN_ANGGARAN) + ' DPA Aktif</span>',
        title: 'Rincian Biaya &amp; Potongan Personil',
        sub: 'Tahap 2 dari 3: Masukkan rincian honorarium, uang harian, transportasi, akomodasi penginapan dan perhitungan potongan PPh otomatis sesuai Standar Biaya Masukan (SBM).',
        actions: '<button class="btn btn-ghost" id="sync">' + icon('refresh') + 'Sync Master Pegawai</button><button class="btn btn-ghost" id="help">' + icon('info') + 'Panduan SPT</button>'
      }) + spjStepper(2, sp) +
      '<div class="card mt-16"><div class="card-body row wrap gap-xl" style="justify-content:space-between">' +
        '<div><div class="mono xs muted upper">' + icon('hash', 'sm') + ' Nomor &amp; Tanggal SPJ</div><div class="mono b mt-8">' + esc(sp.NomorSPJ) + '</div><div class="small muted">' + icon('calendar', 'sm') + ' ' + UI.tgl(sp.TglSPJ) + '</div></div>' +
        '<div class="grow" style="min-width:260px"><div class="mono xs muted upper">' + icon('wallet', 'sm') + ' Kode Rekening Belanja (DPA-SKPD)</div><div class="mono small mt-8">' + esc(det.rekening.KodeRekening) + '</div><div>' + esc(det.rekening.Uraian) + (det.rekening.SubKegiatan ? ' (' + esc(det.rekening.SubKegiatan) + ')' : '') + '</div></div>' +
        '<div class="panel" style="min-width:250px"><div class="row between"><span class="mono xs muted upper">Sisa Pagu Anggaran</span><span class="badge ok">TERSEDIA</span></div><div class="mono b mt-8" style="color:var(--ok);font-size:17px">' + rp(det.rekening.Sisa) + '</div><div class="mt-8">' + UI.bar(UI.persen(det.rekening.Sisa, det.rekening.Pagu), '') + '</div></div>' +
      '</div></div>' +
      (lokal && editable() && JSON.stringify(lokal.rows) !== JSON.stringify(rows) ? '<div class="alert warn mt-16" id="lokal"><div class="ic">' + icon('history') + '</div><div class="grow"><b>Ada draf lokal yang belum tersimpan ke server</b> <span class="small muted">(' + UI.waktu(lokal.t) + ', ' + lokal.rows.length + ' baris)</span></div><button class="btn btn-ghost btn-sm" id="lk-no">Abaikan</button><button class="btn btn-navy btn-sm" id="lk-yes">Pulihkan draf</button></div>' : '') +
      (!editable() ? '<div class="alert ' + (sp.Status === 'LOCKED' ? 'dark' : 'warn') + ' mt-16"><div class="ic">' + icon('lock') + '</div><div><b>Rincian hanya baca (' + esc(sp.Status) + ').</b> <span class="small">' + (sp.Status === 'GENERATED' ? 'Buka kembali ke DRAFT di halaman Generate untuk merevisi.' : sp.Status === 'LOCKED' ? 'SPJ Locked pada ' + UI.waktu(sp.LockedPada) + ' oleh ' + esc(sp.LockedOleh) + '.' : 'Anda tidak memiliki izin input rincian.') + '</span></div></div>' : '') +
      (sp.Status === 'COMPLETED' && editable() ? '<div class="alert mt-16"><div class="ic">' + icon('info') + '</div><div class="small">SPJ ini sudah <b>COMPLETED</b>. Menyimpan perubahan rincian akan mengembalikan status ke <b>DRAFT</b> dan perlu di-approve ulang.</div></div>' : '') +
      '<div class="row wrap mt-16">' + (editable() ? '<button class="btn btn-primary" id="add">' + icon('userPlus') + '+ Tambah Pegawai</button><button class="btn btn-ghost" id="imp">' + icon('sheet') + 'Impor dari Excel (.xlsx)</button>' : '') +
        '<span class="chip" id="cnt-chip" style="cursor:default">' + icon('users', 'sm') + '<span class="mono small" id="cnt">0 Personil Ditambahkan</span></span><span class="grow"></span>' +
        '<span class="chip" style="cursor:default;color:var(--ok)"><span class="dot"></span><span class="mono xs">Auto-Calculation Active (PPh ' + persen + '% Otomatis)</span></span>' +
        (editable() ? '<button class="icon-btn" id="tplx" title="Unduh template Excel">' + icon('download', 'lg') + '</button>' : '') + '</div>' +
      '<div class="card mt-16"><div class="tbl-wrap"><table class="tbl compact" id="tbl"><thead><tr><th>No</th><th>Nama Pegawai · NIP · Gol</th><th class="num">Bantuan Survey</th><th class="num">Uang Harian</th><th class="num">Hari</th><th class="num">Transport Riil</th><th class="num">Penginapan</th><th class="num">Jumlah</th><th class="num">PPh ' + persen + '%</th><th class="num">Bersih</th><th></th></tr></thead>' +
        '<tbody id="tb"></tbody><tfoot id="tf"></tfoot></table></div>' +
        (editable() ? '<div class="card-foot row between wrap"><button class="btn-link" id="add2">' + icon('plusCircle') + ' + Tambah baris personil baru</button><span class="mono xs muted">Tekan <span class="badge">Tab</span> untuk berpindah antar sel nominal</span></div>' : '') + '</div>' +
      '<div class="grid g2 mt-24"><div class="card"><div class="card-head"><h3>' + icon('bank') + 'Rekapitulasi Keuangan SPJ</h3><span class="badge info">Format Permendagri 77/2020</span></div><div class="card-body" id="rekap"></div></div>' +
        '<div class="card"><div class="card-head"><h3>' + icon('checkCircle') + 'Auto Terbilang &amp; Integritas Kepatuhan</h3></div><div class="card-body" id="cek"></div></div></div>' +
      '<div class="actionbar"><a class="btn btn-ghost" href="#/spj/' + spjId + '/info">' + icon('arrowLeft') + 'Kembali ke Identitas SPJ (Step 1)</a><span class="mono xs muted grow" id="save-st">' + icon('cloud', 'sm') + ' Data tersinkron dengan Google Sheets</span>' +
        (editable() ? '<button class="btn btn-soft" id="save">' + icon('book') + 'Simpan DRAFT</button>' : '') +
        (det.bisa.approve || (editable() && App.can('spj_approve')) ? '<button class="btn btn-navy" id="approve">Approve &amp; Lanjut ke Generate Dokumen (Step 3) ' + icon('arrowRight') + '</button>'
          : sp.Status !== 'DRAFT' ? '<a class="btn btn-navy" href="#/spj/' + spjId + '/dokumen">Lanjut ke Dokumen (Step 3) ' + icon('arrowRight') + '</a>' : '') + '</div>';
      bindShell();
      drawTable();
    };

    const optPg = (sel) => '<option value="">— pilih pegawai —</option>' + pgList.map((x) => '<option value="' + x.PegawaiID + '" ' + (x.PegawaiID === sel ? 'selected' : '') + '>' + esc(x.Nama) + '</option>').join('');
    const drawTable = () => {
      const ro = !editable();
      $('#tb', el).innerHTML = rows.length ? rows.map((r, i) => {
        const pg = pgMap[r.PegawaiID] || {}; const h = hitung(r);
        const cell = (f, cls = '') => ro ? '<td class="num">' + (f === 'Hari' ? r[f] : angka(r[f])) + '</td>' : '<td class="num"><input class="cell ' + cls + '" data-i="' + i + '" data-f="' + f + '" inputmode="numeric" value="' + (f === 'Hari' ? (r[f] || 0) : angka(r[f] || 0)) + '" aria-label="' + f + ' baris ' + (i + 1) + '"></td>';
        return '<tr data-row="' + i + '" class="' + (h.j > batas ? 'warn' : '') + '"><td class="mono">' + (i + 1) + '</td>' +
          '<td>' + (ro ? '<b>' + esc(pg.Nama || '-') + '</b>' : '<select class="cell" data-i="' + i + '" data-f="PegawaiID" aria-label="Pegawai baris ' + (i + 1) + '">' + optPg(r.PegawaiID) + '</select>') +
          '<div class="row mt-8" style="gap:6px"><span class="mono xs muted">' + esc(pg.NIP ? UI.nip(pg.NIP) : 'NIP —') + '</span><span class="badge navy-outline" style="height:18px;font-size:10.5px">' + esc(pg.Golongan || '—') + '</span></div></td>' +
          cell('Bantuan') + cell('Harian') + cell('Hari', 'hari') + cell('Transport') + cell('Penginapan') +
          '<td class="num" data-o="j">' + angka(h.j) + (h.j > batas ? ' <span title="Di atas batas anomali ' + rp(batas) + '" style="color:var(--warn)">' + icon('alert', 'sm') + '</span>' : '') + '</td><td class="num" data-o="p" style="color:var(--err)">' + angka(h.p) + '</td><td class="num b" data-o="n">' + angka(h.n) + '</td>' +
          '<td>' + (ro ? '' : '<button class="btn btn-ghost btn-icon btn-sm" data-del="' + i + '" title="Hapus baris" aria-label="Hapus baris ' + (i + 1) + '">' + icon('trash', 'sm') + '</button>') + '</td></tr>';
      }).join('') : '<tr><td colspan="11">' + UI.empty('Belum ada personil. Klik <b>+ Tambah Pegawai</b> atau impor dari Excel.', 'users') + '</td></tr>';
      $$('input.cell', el).forEach((inp) => {
        let baruFokus = false;                                  // pilih seluruh isi saat fokus tanpa timer (aman untuk ketik cepat)
        inp.addEventListener('focus', () => { inp.select(); baruFokus = true; });
        inp.addEventListener('mouseup', (e) => { if (baruFokus) { e.preventDefault(); baruFokus = false; } });
        inp.addEventListener('keydown', () => { baruFokus = false; });
        inp.addEventListener('input', () => {
          const i = +inp.dataset.i, f = inp.dataset.f;
          const v = UI.parseAngka(inp.value);
          rows[i][f] = f === 'Hari' ? Math.min(366, v) : v;
          if (f !== 'Hari') { const pos = inp.value.length - inp.selectionStart; inp.value = angka(v); try { const p2 = Math.max(0, inp.value.length - pos); inp.setSelectionRange(p2, p2); } catch (e) {} }
          updRow(i); markDirty();
        });
      });
      $$('select.cell', el).forEach((sel) => (sel.onchange = () => { rows[+sel.dataset.i].PegawaiID = sel.value; markDirty(); drawTable(); }));
      $$('[data-del]', el).forEach((b) => (b.onclick = () => { rows.splice(+b.dataset.del, 1); markDirty(); drawTable(); }));
      drawTotals();
    };
    const updRow = (i) => {
      const tr = $('tr[data-row="' + i + '"]', el); if (!tr) return;
      const h = hitung(rows[i]);
      $('[data-o="j"]', tr).innerHTML = angka(h.j) + (h.j > batas ? ' <span style="color:var(--warn)">' + icon('alert', 'sm') + '</span>' : '');
      $('[data-o="p"]', tr).textContent = angka(h.p); $('[data-o="n"]', tr).textContent = angka(h.n);
      tr.classList.toggle('warn', h.j > batas);
      drawTotals();
    };
    const drawTotals = () => {
      const t = rows.reduce((a, r) => { const h = hitung(r); a.b += +r.Bantuan || 0; a.hr += (+r.Harian || 0) * (+r.Hari || 0); a.tr += +r.Transport || 0; a.pg += +r.Penginapan || 0; a.j += h.j; a.p += h.p; a.n += h.n; return a; }, { b: 0, hr: 0, tr: 0, pg: 0, j: 0, p: 0, n: 0 });
      $('#cnt', el).textContent = rows.length + ' Personil Ditambahkan';
      $('#tf', el).innerHTML = rows.length ? '<tr><td></td><td class="upper small">Total Rincian (' + rows.length + ' personil)</td><td class="num mono">' + angka(t.b) + '</td><td class="num mono" colspan="2">' + angka(t.hr) + '</td><td class="num mono">' + angka(t.tr) + '</td><td class="num mono">' + angka(t.pg) + '</td><td class="num mono">' + angka(t.j) + '</td><td class="num mono" style="color:var(--err)">' + angka(t.p) + '</td><td class="num mono">' + angka(t.n) + '</td><td></td></tr>' : '';
      const sisaSetelah = det.rekening.Sisa - t.j;
      $('#rekap', el).innerHTML = '<div class="col" style="gap:10px">' +
        [['Total Pengeluaran Bruto (Sebelum Pajak)', t.j, ''], ['Uang Harian', t.hr, 'faint'], ['Transport Riil', t.tr, 'faint'], ['Penginapan / Akomodasi', t.pg, 'faint'], ['Bantuan Survey', t.b, 'faint'], ['Potongan PPh ' + persen + '% (disetor ke Kas Negara)', -t.p, 'err']]
          .map((x) => '<div class="row between ' + (x[2] === 'faint' ? 'small muted' : '') + '" style="' + (x[2] === 'faint' ? 'padding-left:14px' : '') + '"><span>' + (x[2] === 'faint' ? '' : '<span class="dot navy"></span> ') + x[0] + '</span><span class="mono" style="' + (x[2] === 'err' ? 'color:var(--err)' : '') + '">' + (x[1] < 0 ? '− ' + rp(-x[1]) : rp(x[1])) + '</span></div>').join('') + '</div>' +
        '<div class="total-card mt-16"><div class="row between wrap" style="align-items:flex-start"><div><div class="k">Grand Total Dana Bersih Dicairkan (Netto)</div><div class="v">' + rp(t.n) + '</div><div class="s">(' + rows.length + ' Penerima)</div></div>' +
        '<div style="text-align:right"><span class="badge ' + (sisaSetelah >= 0 ? 'ok' : 'err') + '">' + icon(sisaSetelah >= 0 ? 'checkCircle' : 'alert', 'sm') + (sisaSetelah >= 0 ? 'Pagu Kas Mencukupi' : 'Melampaui Pagu') + '</span><div class="mono small mt-8" style="color:#B7C6EE">Sisa setelah pencairan:<br><b style="color:#fff">' + rp(sisaSetelah) + '</b></div></div></div>' +
        '<div class="small mt-16" style="border-top:1px solid rgba(255,255,255,.12);padding-top:10px;color:#D3DCEC">' + icon(sisaSetelah >= 0 ? 'checkCircle' : 'alert', 'sm') + ' Status Anggaran: ' + (sisaSetelah >= 0 ? 'Sesuai plafon pagu sub-kegiatan (' + rp(t.j) + ' ≤ sisa ' + rp(det.rekening.Sisa) + ') • <b>AMAN</b>' : '<b>Melebihi sisa pagu ' + rp(det.rekening.Sisa) + '</b> — tidak dapat di-approve') + '</div></div>';
      const ids = rows.map((r) => r.PegawaiID).filter(Boolean);
      const dup = ids.length !== new Set(ids).size;
      const kosong = rows.some((r) => !r.PegawaiID);
      const nol = rows.some((r) => hitung(r).j <= 0);
      const anom = rows.filter((r) => hitung(r).j > batas).map((r) => (pgMap[r.PegawaiID] || {}).Nama || '?');
      const cek = [[rows.length > 0 && !kosong, 'Seluruh baris berisi pegawai dari master' + (App.state.settings && det.spj.NomorSPT ? ' — tercantum dalam SPT <b>' + esc(det.spj.NomorSPT) + '</b>' : '')], [!dup, 'Tidak ada pegawai ganda dalam satu SPJ'], [!nol && rows.length > 0, 'Setiap baris memiliki jumlah &gt; 0'],
        [sisaSetelah >= 0, 'Nilai bruto tidak melampaui sisa pagu belanja'], [!anom.length, anom.length ? 'Anomali: ' + anom.map(esc).join(', ') + ' di atas ' + rp(batas) + ' (periksa ulang)' : 'Tidak ada nilai anomali (batas ' + rp(batas) + ' per pegawai)']];
      $('#cek', el).innerHTML = '<div class="panel"><div class="mono xs muted upper">Kutipan Resmi Terbilang:</div><div style="font-style:italic;margin-top:6px">“' + UI.terbilang(t.n) + '”</div></div>' +
        '<div class="col mt-16" style="gap:10px">' + cek.map((c) => '<div class="row" style="align-items:flex-start"><span style="color:' + (c[0] ? 'var(--ok)' : 'var(--warn)') + '">' + icon(c[0] ? 'checkCircle' : 'alert') + '</span><span class="small">' + c[1] + '</span></div>').join('') + '</div>' +
        '<div class="stamp mt-16"><span class="seal" style="width:36px;height:36px">' + icon('shield') + '</span><div class="grow"><div class="mono xs upper b">Audited by SIPETIK Engine</div><div class="mono xs muted" id="hash">Hash integritas: menghitung…</div></div><span class="badge ' + (cek.every((c) => c[0]) ? 'ok' : 'draft') + '">' + (cek.every((c) => c[0]) ? 'VALID' : 'PERIKSA') + '</span></div>';
      hashRows();
      const ap = $('#approve', el); if (ap) ap.disabled = !(rows.length && !kosong && !dup && !nol && sisaSetelah >= 0);
    };
    const hashRows = UI.debounce(async () => {
      try { const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(rows))); const h = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('').toUpperCase();
        const e = $('#hash', el); if (e) e.textContent = 'Hash integritas: ' + h.substring(0, 4) + '-' + h.substring(4, 8) + '-' + h.substring(8, 12) + '-' + h.substring(12, 16); } catch (e) {}
    }, 250);
    const markDirty = () => {
      dirty = true;
      try { localStorage.setItem(LS, JSON.stringify({ t: new Date().toISOString().substring(0, 19), rows })); } catch (e) {}
      const st = $('#save-st', el); if (st) st.innerHTML = icon('clock', 'sm') + ' Draf lokal tersimpan ' + new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' — belum dikirim ke server';
    };
    const tambah = (pgId) => {
      const last = rows[rows.length - 1] || {};
      rows.push({ RincianID: '', PegawaiID: pgId || '', Bantuan: 0, Harian: last.Harian || 0, Hari: last.Hari || 1, Transport: 0, Penginapan: 0, Keterangan: '' });
      markDirty(); drawTable();
      const sel = $$('select.cell', el).pop(); if (sel && !pgId) sel.focus();
    };
    const simpan = async () => {
      const d = await API.call('spj.saveRincian', { spjId, rows }, { toast: false });
      det = d; rows = fromServer(); dirty = false;
      try { localStorage.removeItem(LS); } catch (e) {}
      UI.toast('Rincian tersimpan: ' + det.spj.JumlahPersonil + ' personil, netto ' + rp(det.spj.TotalBersih), 'ok');
      API.clearCache(); App.loadNotif();
    };
    const bindShell = () => {
      App.guard('#/spj/' + spjId + '/rincian', () => dirty);
      $('#help', el).onclick = () => UI.modal({ title: 'Panduan pengisian rincian', size: 'wide', body: '<ol class="col" style="gap:8px;padding-left:18px;margin:0">' +
        '<li>Pilih pegawai yang tercantum dalam <b>Surat Perintah Tugas (SPT)</b>. NIP & golongan terisi otomatis dari Master Pegawai.</li>' +
        '<li>Isi nominal sesuai <b>Standar Biaya Masukan (SBM)</b>: bantuan survey, tarif uang harian × jumlah hari, transport riil, penginapan.</li>' +
        '<li>Rumus: <code>Jumlah = Bantuan + (Harian × Hari) + Transport + Penginapan</code>; <code>PPh = Jumlah × ' + persen + '%</code>; <code>Bersih = Jumlah − PPh</code>. Server menghitung ulang saat menyimpan.</li>' +
        '<li>Baris kuning = nilai di atas batas anomali ' + rp(batas) + ' — tetap bisa disimpan namun periksa ulang bukti.</li>' +
        '<li>Klik <b>Simpan DRAFT</b> untuk menyimpan ke Google Sheets. Perubahan juga disimpan sementara di browser agar tidak hilang.</li>' +
        '<li><b>Approve</b> mengubah status menjadi COMPLETED sehingga Koordinator PPTK dapat meng-generate dokumen.</li></ol>', foot: '<button class="btn btn-navy" data-close>Mengerti</button>' });
      $('#sync', el).onclick = (e) => UI.act(e.currentTarget, async () => { pgw = await Master.pegawai(true); pgw.forEach((x) => (pgMap[x.PegawaiID] = x)); pgList.splice(0, pgList.length, ...Object.values(pgMap).sort((a, b) => a.Nama.localeCompare(b.Nama))); drawTable(); UI.toast('Master pegawai disinkronkan (' + pgw.length + ' aktif).', 'ok'); });
      if (!editable()) return;
      if ($('#lk-yes', el)) { $('#lk-yes', el).onclick = () => { rows = lokal.rows; $('#lokal', el).remove(); markDirty(); drawTable(); }; $('#lk-no', el).onclick = () => { try { localStorage.removeItem(LS); } catch (e) {} $('#lokal', el).remove(); }; }
      $('#add', el).onclick = () => tambah(); $('#add2', el).onclick = () => tambah();
      $('#save', el).onclick = (e) => UI.act(e.currentTarget, async () => { await simpan(); shell(); });
      const ap = $('#approve', el);
      if (ap) ap.onclick = (e) => UI.act(e.currentTarget, async () => {
        if (!(await UI.confirm('Approve rincian?', 'Rincian ' + rows.length + ' personil akan dikunci sebagai COMPLETED dan siap di-generate menjadi Kwitansi, Rincian Biaya, BKU, dan NPD.', 'Approve'))) return;
        if (dirty || !rows.every((r) => r.RincianID)) await simpan();
        det = await API.call('spj.approve', { spjId }, { toast: true });
        dirty = false; App.loadNotif(); API.clearCache();
        App.go('#/spj/' + spjId + '/dokumen');
      });
      $('#tplx', el).onclick = () => UI.exportXlsx('Template_Rincian_SPJ.xlsx', [{ nama: 'Rincian', rows: (rows.length ? rows.map((r) => pgMap[r.PegawaiID] || {}) : pgw.slice(0, 5)).map((x) => ({ NIP: x.NIP || '', Nama: x.Nama || '', Bantuan: 0, Harian: 170000, Hari: 1, Transport: 0, Penginapan: 0 })) }]);
      $('#imp', el).onclick = async () => {
        const [file] = await UI.pickFile('.xlsx,.xls,.csv'); if (!file) return;
        try {
          const wb = await UI.readWorkbook(file); const first = Object.values(wb)[0]; const objs = UI.rowsToObjects(first);
          const byNip = {}; pgw.forEach((x) => (byNip[String(x.NIP).replace(/\D/g, '')] = x));
          const norm = (o, keys) => { for (const k of Object.keys(o)) if (keys.includes(k.toLowerCase().replace(/[^a-z]/g, ''))) return o[k]; return ''; };
          let ok = 0; const gagal = [];
          objs.forEach((o, i) => {
            const nip = String(norm(o, ['nip'])).replace(/\D/g, ''); const pg = byNip[nip];
            if (!pg) { gagal.push('Baris ' + (i + 2) + ' (NIP ' + (nip || '-') + ')'); return; }
            const ex = rows.find((r) => r.PegawaiID === pg.PegawaiID) || (rows.push({ RincianID: '', PegawaiID: pg.PegawaiID, Keterangan: '' }), rows[rows.length - 1]);
            ex.Bantuan = UI.parseAngka(norm(o, ['bantuan', 'bantuansurvey'])); ex.Harian = UI.parseAngka(norm(o, ['harian', 'uangharian', 'harianrp'])); ex.Hari = UI.parseAngka(norm(o, ['hari', 'jumlahhari']));
            ex.Transport = UI.parseAngka(norm(o, ['transport', 'transportriil', 'transportrp'])); ex.Penginapan = UI.parseAngka(norm(o, ['penginapan', 'hotel', 'penginapanrp']));
            ok++;
          });
          markDirty(); drawTable();
          UI.toast(ok + ' baris diimpor.' + (gagal.length ? '\n' + gagal.length + ' dilewati (NIP tidak ada di master): ' + gagal.slice(0, 5).join(', ') : ''), gagal.length ? 'warn' : 'ok', 7000);
        } catch (e) { UI.toast(e.message, 'err'); }
      };
    };
    shell();
  }
};
