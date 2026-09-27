/* Tahap 3 — Generate & Unduh Dokumen SPJ Resmi */
Pages.spjDokumen = {
  title: 'Generate Dokumen', crumb: ['Inspektorat', 'Pengelolaan Kegiatan'], izin: 'spj_view',
  async render(el, params, q, alive) {
    const { icon, esc, rp, $, $$ } = UI;
    const spjId = params[0];
    let det = await API.call('spj.get', { spjId });
    if (!alive()) return;
    const jalan = {};           // status render per template: run | fail | ok
    const TIPE_IC = { Kwitansi: 'receipt', Rincian: 'sheet', BKU: 'book', NPD: 'shieldCheck', Lainnya: 'file' };
    const TIPE_DESC = { Kwitansi: 'Kwitansi pembayaran resmi tanda bukti penerimaan kas per penerima.', Rincian: 'Pernyataan pengeluaran riil transport, harian & penginapan personil.',
      BKU: 'Buku kas umum pengeluaran — terintegrasi beban belanja & pajak.', NPD: 'Nota pencairan dana — surat pengantar beban rekening kas daerah.', Lainnya: 'Dokumen tambahan dari template kustom.' };

    const draw = () => {
      const s = det.spj, b = det.bisa;
      const docByTpl = {}; det.dokumen.forEach((d) => (docByTpl[d.TemplateID] = d));
      const lengkap = det.templates.length > 0 && det.templates.every((t) => docByTpl[t.TemplateID]);
      el.innerHTML = pageHead({
        bc: [['Dashboard', '#/dashboard'], ['Kelola SPJ', '#/spj'], [s.NomorSPJ, '#/spj/' + spjId + '/info'], 'Generate Dokumen'],
        title: 'Generate &amp; Unduh Dokumen SPJ Resmi',
        eyebrow: UI.badge(s.Status, s.Status + ' | ' + ({ DRAFT: 'Menunggu approve rincian', COMPLETED: 'Siap generate & cetak dokumen', GENERATED: 'Dokumen terbit — menunggu pengesahan', LOCKED: 'Disahkan & diarsipkan permanen' })[s.Status]),
        actions: b.download && det.dokumen.length ? '<button class="btn btn-primary" id="zip">' + icon('folder') + 'Cetak Semua Berkas (ZIP)</button>' : ''
      }) + spjStepper(3, s) +
      (s.Status === 'DRAFT' ? '<div class="alert warn mt-16"><div class="ic">' + icon('alert') + '</div><div class="grow"><b>Rincian belum di-approve.</b> <span class="small">Dokumen hanya bisa di-generate setelah SPJ berstatus COMPLETED.</span></div><a class="btn btn-navy btn-sm" href="#/spj/' + spjId + '/rincian">Ke Rincian</a></div>' : '') +
      (s.Status === 'LOCKED' ? '<div class="alert dark mt-16"><div class="ic">' + icon('lock') + '</div><div><b>SPJ Locked pada ' + UI.waktu(s.LockedPada) + ' oleh ' + esc(s.LockedOleh) + '.</b> <span class="small">Form input dinonaktifkan; berkas & bukti hanya dapat dilihat/diunduh.</span></div></div>' : '') +
      '<div class="card mt-16"><div class="card-body sum5" id="ringkas">' +
        info('Tanggal SPJ', '<div class="row b">' + icon('calendar') + UI.tgl(s.TglSPJ) + '</div><div class="mono xs muted">No: ' + esc(s.NomorSPJ) + '</div>') +
        info('PPTK Pengampu', det.pptk ? '<div class="b">' + esc(det.pptk.Nama) + '</div><div class="mono xs muted">NIP. ' + UI.nip(det.pptk.NIP) + '</div><span class="badge mt-8" style="max-width:100%;overflow:hidden">' + esc(det.pptk.Jabatan || 'PPTK') + '</span>' : '<span class="muted">—</span>') +
        info('Bendahara Pengeluaran', det.bendahara ? '<div class="b">' + esc(det.bendahara.Nama) + '</div><div class="mono xs muted">NIP. ' + UI.nip(det.bendahara.NIP) + '</div><span class="badge mt-8">' + esc(det.bendahara.Jabatan || 'Bendahara') + '</span>' : '<span class="muted">—</span>') +
        info('Kode Rekening DPA', '<div class="mono small ellipsis" title="' + esc(s.KodeRekening) + '">' + esc(s.KodeRekening) + '</div><div class="small">' + esc(s.UraianRekening) + '</div>') +
        '<div class="total-card" style="padding:14px 16px"><div class="row between"><span class="k">Total Tagihan Bersih</span>' + icon('wallet') + '</div><div class="v" style="font-size:24px;line-height:30px;color:#F5BE44">' + rp(s.TotalBersih) + '</div><div class="s">Potongan PPh: ' + rp(s.TotalPotongan) + ' • ' + s.JumlahPersonil + ' penerima</div><div class="s mt-8" style="color:#6EE7B7">' + icon('checkCircle', 'sm') + ' Sesuai DPA Subkegiatan</div></div>' +
      '</div></div>' +
      '<div class="row between wrap mt-24 mb-8"><h3 class="row" style="font-size:17px">' + icon('zap', 'lg') + ' Status Otomasi Dokumen Google Docs Engine</h3><div class="row"><span class="mono xs muted"><span class="dot"></span> Google Apps Script Engine Active &amp; Ready</span>' +
        (b.generate ? '<button class="btn btn-navy btn-sm" id="gen">' + icon('zap', 'sm') + (lengkap ? 'Regenerasi Semua' : 'Generate Semua Dokumen') + '</button>' : '') + '</div></div>' +
      '<div class="grid g4" id="eng">' + (det.templates.length ? det.templates.map((t) => engCard(t, docByTpl[t.TemplateID])).join('') : '<div class="span-2">' + UI.empty('Belum ada template aktif. ' + (App.can('template') ? '<a href="#/template">Daftarkan template</a>' : 'Hubungi Super Admin.'), 'file') + '</div>') + '</div>' +
      '<div class="card mt-24"><div class="card-head"><h3>' + icon('fileCheck') + 'Daftar Berkas Dokumen PDF Resmi <span class="badge">' + det.dokumen.length + ' Berkas</span></h3>' +
        (b.download && det.dokumen.length ? '<button class="btn btn-ghost btn-sm" id="zip2">' + icon('download', 'sm') + 'Unduh Semua Berkas (ZIP)</button>' : '') + '</div>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Nama Berkas Dokumen</th><th>Ukuran</th><th>Terbit &amp; Hash SHA256</th><th>Lokasi Google Drive</th><th class="num">Aksi</th></tr></thead><tbody>' +
        (det.dokumen.length ? det.dokumen.map((d) => '<tr><td><div class="row"><span class="file-ic">' + icon('file') + '</span><div><div class="mono small b">' + esc(d.NamaFile) + '</div><div class="small muted">' + esc(TIPE_DESC[d.Tipe] || '') + '</div>' + (d.Pesan ? '<div class="xs" style="color:var(--warn)">' + esc(d.Pesan) + '</div>' : '') + '</div></div></td>' +
          '<td class="mono small nowrap">' + Math.round(d.Ukuran / 1024) + ' KB</td><td class="mono xs"><div>' + UI.waktu(d.DibuatPada) + '</div><div class="muted" title="' + esc(d.SHA256) + '">SHA: ' + UI.ringkasHash(d.SHA256, 10) + '</div></td>' +
          '<td class="mono xs" style="max-width:220px">' + icon('folder', 'sm') + ' <a href="' + esc(det.folderUrl || '#') + '" target="_blank" rel="noopener" class="ellipsis" style="display:inline-block;max-width:180px;vertical-align:middle">02_SPJ_ARCHIVE/' + esc(String(s.TglSPJ).substring(0, 4)) + '/…</a></td>' +
          '<td class="num nowrap">' + (b.download ? '<button class="btn btn-ghost btn-icon btn-sm" data-view="' + d.DokumenID + '" title="Lihat">' + icon('eye', 'sm') + '</button> ' : '') +
          '<a class="btn btn-ghost btn-icon btn-sm" href="' + esc(d.DriveUrl) + '" target="_blank" rel="noopener" title="Buka di Drive">' + icon('external', 'sm') + '</a> ' +
          (d.DocUrl && App.can('generate') ? '<a class="btn btn-ghost btn-icon btn-sm" href="' + esc(d.DocUrl) + '" target="_blank" rel="noopener" title="Edit salinan Google Docs">' + icon('edit', 'sm') + '</a> ' : '') +
          (b.download ? '<button class="btn btn-navy btn-sm" data-dl="' + d.DokumenID + '">' + icon('download', 'sm') + 'PDF</button>' : '') + '</td></tr>').join('')
          : '<tr><td colspan="5">' + UI.empty(s.Status === 'DRAFT' ? 'Approve rincian terlebih dahulu.' : b.generate ? 'Belum ada dokumen. Klik <b>Generate Semua Dokumen</b>.' : 'Dokumen belum di-generate oleh Koordinator PPTK.', 'file') + '</td></tr>') +
        '</tbody></table></div></div>' +
      '<div class="grid g2 mt-24"><div class="card"><div class="card-head"><div><h3>' + icon('upload') + 'Unggah Bukti Fisik Pendukung</h3><div class="sub">Lampirkan pindaian nota riil, boarding pass, bill penginapan, dan kuitansi transfer.</div></div></div><div class="card-body">' +
        (b.upload ? '<div class="drop" id="drop" tabindex="0" role="button" aria-label="Unggah berkas bukti"><div class="ic">' + icon('cloudUp', 'xl') + '</div><div class="b">Tarik &amp; Lepas Berkas Bukti Disini</div><div class="small muted">atau klik untuk jelajahi berkas lokal</div><div class="mono xs muted mt-8">' + icon('info', 'sm') + ' Format didukung: PDF, JPG, PNG (Maksimal 10 MB per berkas)</div><span class="btn btn-soft btn-sm mt-8">+ Pilih Berkas Bukti</span></div>'
          : '<div class="alert"><div class="ic">' + icon('lock') + '</div><div class="small">' + (s.Status === 'LOCKED' ? 'SPJ terkunci — bukti hanya bisa dilihat.' : 'Anda tidak memiliki izin mengunggah bukti.') + '</div></div>') +
        '<div class="file-row mt-16">' + icon('cloud') + '<div class="grow"><div class="small b">Arsip Cloud Terenkripsi</div><div class="mono xs muted">Folder: 03_UPLOAD_BUKTI/SPJ_' + esc(s.SPJID) + '</div></div><span class="badge ok">Aktif</span></div></div></div>' +
        '<div class="card"><div class="card-head"><h3>' + icon('link') + 'Lampiran Bukti Terarsip <span class="badge info">' + det.bukti.length + ' Lampiran</span></h3><span class="mono xs muted">Total: ' + (det.bukti.reduce((a, x) => a + x.Ukuran, 0) / 1048576).toFixed(2) + ' MB</span></div><div class="card-body col" style="gap:10px">' +
        (det.bukti.length ? det.bukti.map((x) => '<div class="file-row"><span class="file-ic ' + (x.Mime.indexOf('image') === 0 ? 'img' : '') + '">' + icon(x.Mime.indexOf('image') === 0 ? 'image' : 'file') + '</span><div class="grow" style="min-width:0"><div class="mono small b ellipsis">' + esc(x.NamaFile) + '</div><div class="xs muted">' + Math.round(x.Ukuran / 1024) + ' KB • Diunggah oleh ' + esc(x.DiunggahOleh) + ' • ' + UI.waktu(x.DiunggahPada) + '</div></div>' +
          '<button class="btn btn-ghost btn-icon btn-sm" data-bdl="' + x.BuktiID + '" title="Unduh">' + icon('download', 'sm') + '</button>' + (b.upload ? '<button class="btn btn-ghost btn-icon btn-sm" data-bdel="' + x.BuktiID + '" title="Hapus" style="color:var(--err)">' + icon('trash', 'sm') + '</button>' : '') + '</div>').join('')
          : UI.empty('Belum ada bukti terlampir.', 'image')) +
        '</div><div class="card-foot row between small"><span class="mono xs muted">Kesesuaian berkas dengan PMK No. 119/2023</span>' + (det.bukti.length ? '<span style="color:var(--ok)">' + icon('checkCircle', 'sm') + ' Lampiran tersedia</span>' : '<span class="faint">Belum lengkap</span>') + '</div></div></div>' +
      '<div class="card mt-24"><div class="card-body row wrap gap-lg"><span class="stamp" style="border:0;background:none;padding:0"><span class="seal">' + icon('stamp', 'lg') + '</span></span><div class="grow"><div class="b" style="font-size:16px">Tanda Pengesahan Digital Inspektorat</div><div class="small muted">' +
        (s.Status === 'LOCKED' ? 'Dokumen telah melalui verifikasi berjenjang oleh Staf Pemeriksa Teknis, PPTK, dan Pejabat Penatausahaan Keuangan (PPK).' : 'Pengesahan diterbitkan setelah dokumen di-generate dan SPJ dikunci oleh Koordinator PPTK.') + '</div></div>' +
        '<div class="stamp"><div><div class="mono xs muted upper">Stamp Verifikasi</div><div class="mono b">SIPETIK-KUTIM-' + esc(String(s.TglSPJ).substring(0, 4)) + '-' + (s.Status === 'LOCKED' ? 'VAL' : 'PND') + '</div></div><span style="color:' + (s.Status === 'LOCKED' ? 'var(--ok)' : 'var(--muted)') + '">' + icon('shieldCheck', 'xl') + '</span></div></div></div>' +
      '<details class="card mt-24"><summary class="card-head" style="cursor:pointer;list-style:none"><h3>' + icon('history') + 'Riwayat Aktivitas SPJ (Audit Trail)</h3><span class="badge">' + det.audit.length + ' entri</span></summary><div class="card-body"><div class="timeline">' +
        det.audit.map((a) => '<div class="tl-item"><div class="row wrap"><span class="badge ' + ({ LOCK: 'locked', GENERATE: 'amber', CREATE: 'info', UNLOCK: 'err', DELETE: 'err' }[a.Aksi] || '') + '">' + esc(a.Aksi) + '</span><span class="mono xs muted">' + UI.waktu(a.Timestamp) + '</span><span class="small b">' + esc(a.Nama) + '</span></div><div class="small muted mt-8">' + esc(a.Keterangan) + '</div></div>').join('') +
      '</div></div></details>' +
      '<div class="actionbar"><a class="btn btn-ghost" href="#/spj/' + spjId + '/rincian">' + icon('arrowLeft') + 'Kembali ke Rincian Biaya (Step 2)</a>' +
        '<span class="grow small muted row">' + (s.Status !== 'LOCKED' ? icon('lock', 'sm') + ' Dokumen yang telah di-Lock akan terarsip permanen ke Google Drive dan tercatat di audit trail.' : '') + '</span>' +
        (b.reopen ? '<button class="btn btn-ghost" id="reopen">' + icon('edit') + 'Buka Kembali ke Draft</button>' : '') +
        (b.generate && det.dokumen.length ? '<button class="btn btn-ghost" id="regen">' + icon('refresh') + 'Regenerasi Dokumen</button>' : '') +
        (b.unlock ? '<button class="btn btn-danger" id="unlock">' + icon('unlock') + 'Buka Kunci SPJ</button>' : '') +
        (App.can('lock') && s.Status !== 'LOCKED' ? '<button class="btn btn-navy" id="lock" ' + (b.lock ? '' : 'disabled title="Generate semua dokumen terlebih dahulu"') + '>' + icon('lock') + 'Kunci &amp; Terbitkan SPJ</button>' : '') +
      '</div>';
      bind();
    };
    const info = (lbl, html) => '<div style="min-width:0"><div class="mono xs muted upper mb-8">' + lbl + '</div>' + html + '</div>';
    const engCard = (t, d) => {
      const st = jalan[t.TemplateID] || (d ? 'ok' : 'none');
      const lbl = { ok: ['completed', '✓ Siap Cetak'], run: ['draft', 'Memproses…'], fail: ['err', '✕ Gagal'], none: ['', 'Belum dibuat'] }[st];
      return '<div class="eng-card ' + (st === 'run' ? 'run' : st === 'fail' ? 'fail' : '') + '" data-eng="' + t.TemplateID + '"><div class="row between"><span class="ic">' + icon(TIPE_IC[t.Tipe] || 'file', 'lg') + '</span><span class="badge ' + lbl[0] + '">' + lbl[1] + '</span></div>' +
        '<div><div class="row between"><b>' + esc(t.Nama) + '</b><span class="badge">' + esc(t.TemplateID) + '</span></div><div class="small muted mt-8">' + esc(TIPE_DESC[t.Tipe] || '') + '</div></div>' +
        '<div class="meta"><span>Injeksi Token:</span><b>' + t.JumlahPlaceholder + ' Token' + (t.Mode === 'PER_PEGAWAI' ? ' × ' + det.spj.JumlahPersonil + ' Personil' : ' Terpetakan') + '</b><span>SHA256:</span><b style="color:' + (d ? 'var(--ok)' : 'var(--muted)') + '">' + (d ? UI.ringkasHash(d.SHA256, 4) + ' (VALID)' : '—') + '</b></div>' +
        '<div class="bar ' + (st === 'ok' ? '' : '') + '"><span class="' + (st === 'ok' ? 'ok' : st === 'fail' ? 'over' : '') + '" style="width:' + (st === 'ok' ? 100 : st === 'run' ? 55 : st === 'fail' ? 100 : 0) + '%"></span></div>' +
        (det.bisa.preview && det.spj.JumlahPersonil ? '<button class="btn btn-ghost btn-sm" data-prev="' + t.TemplateID + '">' + icon('eye', 'sm') + 'Pratinjau</button>' : '') + '</div>';
    };
    const lihatPdf = (b64, nama) => {
      const url = URL.createObjectURL(UI.b64ToBlob(b64, 'application/pdf'));
      UI.modal({ title: esc(nama), size: 'xwide', body: '<iframe src="' + url + '" style="width:100%;height:70vh;border:1px solid var(--border);border-radius:6px" title="Pratinjau PDF"></iframe>',
        foot: '<a class="btn btn-ghost" href="' + url + '" target="_blank" rel="noopener">' + icon('external') + 'Buka di tab baru</a><button class="btn btn-navy" data-close>Tutup</button>' }).then(() => setTimeout(() => URL.revokeObjectURL(url), 60000));
    };
    const generateSemua = async (btn) => {
      const tpl = det.templates;
      if (!tpl.length) return;
      if (det.dokumen.length && !(await UI.confirm('Regenerasi dokumen?', 'Berkas PDF lama akan dipindahkan ke sampah Drive dan diganti versi baru. Lanjutkan?', 'Regenerasi'))) return;
      await UI.act(btn, async () => {
        let gagal = 0; const peringatan = [];
        for (const t of tpl) {
          jalan[t.TemplateID] = 'run'; redrawCard(t);
          try {
            const r = await API.call('spj.generate', { spjId, templateId: t.TemplateID }, { silent: true });
            jalan[t.TemplateID] = 'ok';
            const i = det.dokumen.findIndex((d) => d.TemplateID === t.TemplateID); if (i > -1) det.dokumen.splice(i, 1); det.dokumen.push(r.dokumen);
            if (r.warnings.length) peringatan.push(t.Nama + ': ' + r.warnings.join(', '));
          } catch (e) { jalan[t.TemplateID] = 'fail'; gagal++; UI.toast(t.Nama + ': ' + e.message, 'err'); }
          redrawCard(t);
        }
        if (!gagal) {
          det = await API.call('spj.generateDone', { spjId });
          Object.keys(jalan).forEach((k) => delete jalan[k]);
          UI.toast('Semua ' + tpl.length + ' dokumen berhasil di-generate & diarsipkan ke Drive.', 'ok');
          if (peringatan.length) UI.toast('Placeholder tak terpetakan (dikosongkan):\n' + peringatan.join('\n'), 'warn', 9000);
          App.loadNotif(); API.clearCache();
        }
        draw();
      });
    };
    const redrawCard = (t) => { const c = $('[data-eng="' + t.TemplateID + '"]', el); if (c) { c.outerHTML = engCard(t, det.dokumen.find((d) => d.TemplateID === t.TemplateID)); bindPrev(); } };
    const bindPrev = () => $$('[data-prev]', el).forEach((b) => (b.onclick = () => UI.act(b, async () => { const r = await API.call('spj.preview', { spjId, templateId: b.dataset.prev }); lihatPdf(r.base64, r.nama); if (r.warnings.length) UI.toast('Placeholder tak terpetakan: ' + r.warnings.join(', '), 'warn'); })));
    const upload = async (files) => {
      for (const f of files) {
        if (!/^(image\/(jpeg|png)|application\/pdf)$/.test(f.type)) { UI.toast(f.name + ': format tidak didukung.', 'err'); continue; }
        if (f.size > 10 * 1048576) { UI.toast(f.name + ': melebihi 10 MB.', 'err'); continue; }
        try { UI.toast('Mengunggah ' + f.name + '…', 'warn', 2000); await API.call('bukti.upload', { spjId, nama: f.name, mime: f.type, base64: await UI.fileToBase64(f) }, { toast: true }); } catch (e) {}
      }
      det = await API.call('spj.get', { spjId }); draw();
    };
    const bind = () => {
      bindPrev();
      const s = det.spj;
      ['#zip', '#zip2'].forEach((id) => { const b = $(id, el); if (b) b.onclick = () => UI.act(b, async () => { const d = await API.call('dokumen.zip', { spjId, bukti: det.bukti.length > 0 }); UI.download(d.base64, d.nama, d.mime); }); });
      if ($('#gen', el)) $('#gen', el).onclick = (e) => generateSemua(e.currentTarget);
      if ($('#regen', el)) $('#regen', el).onclick = (e) => generateSemua(e.currentTarget);
      $$('[data-dl]', el).forEach((b) => (b.onclick = () => UI.act(b, async () => { const d = await API.call('dokumen.download', { dokumenId: b.dataset.dl }); UI.download(d.base64, d.nama, d.mime); })));
      $$('[data-view]', el).forEach((b) => (b.onclick = () => UI.act(b, async () => { const d = await API.call('dokumen.download', { dokumenId: b.dataset.view }); lihatPdf(d.base64, d.nama); })));
      $$('[data-bdl]', el).forEach((b) => (b.onclick = () => UI.act(b, async () => { const d = await API.call('bukti.download', { buktiId: b.dataset.bdl }); UI.download(d.base64, d.nama, d.mime); })));
      $$('[data-bdel]', el).forEach((b) => (b.onclick = async () => { if (!(await UI.confirm('Hapus bukti?', 'Berkas akan dipindahkan ke sampah Drive dan penghapusan tercatat di audit.', 'Hapus', true))) return; await API.call('bukti.delete', { buktiId: b.dataset.bdel }, { toast: true }); det = await API.call('spj.get', { spjId }); draw(); }));
      const drop = $('#drop', el);
      if (drop) {
        drop.onclick = async () => upload(await UI.pickFile('.pdf,.jpg,.jpeg,.png', true));
        drop.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') drop.click(); };
        drop.ondragover = (e) => { e.preventDefault(); drop.classList.add('over'); };
        drop.ondragleave = () => drop.classList.remove('over');
        drop.ondrop = (e) => { e.preventDefault(); drop.classList.remove('over'); upload(Array.from(e.dataTransfer.files)); };
      }
      if ($('#lock', el)) $('#lock', el).onclick = (e) => UI.act(e.currentTarget, async () => {
        if (!(await UI.confirm('Kunci & terbitkan SPJ?', 'SPJ ' + s.NomorSPJ + ' akan dikunci (LOCKED). Rincian dan dokumen tidak dapat diubah lagi kecuali dibuka oleh Super Admin.\n\nNotifikasi akan dikirim ke Bendahara dan setiap penerima (bila diaktifkan).', 'Kunci SPJ'))) return;
        det = await API.call('spj.lock', { spjId }, { toast: true }); App.loadNotif(); API.clearCache(); draw();
      });
      if ($('#unlock', el)) $('#unlock', el).onclick = async () => {
        const alasan = await UI.prompt('Buka kunci SPJ', 'Alasan membuka kunci (wajib, tercatat permanen di audit trail)', { textarea: true, ok: 'Buka Kunci' });
        if (!alasan) return;
        det = await API.call('spj.unlock', { spjId, alasan }, { toast: true }); API.clearCache(); draw();
      };
      if ($('#reopen', el)) $('#reopen', el).onclick = async () => {
        const alasan = await UI.prompt('Buka kembali ke DRAFT', 'Alasan revisi (opsional)', { ok: 'Buka Kembali', hint: 'Dokumen PDF yang sudah terbit ditandai USANG dan perlu di-generate ulang setelah revisi.' });
        if (alasan === null) return;
        det = await API.call('spj.reopen', { spjId, alasan }, { toast: true }); API.clearCache(); App.go('#/spj/' + spjId + '/rincian');
      };
    };
    draw();
  }
};
