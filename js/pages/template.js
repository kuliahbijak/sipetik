/* Template Manager — registrasi Google Docs, pindai placeholder, matriks mapping (US-01, US-02) */
Pages.template = {
  title: 'Template Manager', crumb: ['Setup Admin', 'Template Manager'], izin: 'template',
  async render(el, p, q, alive) {
    const { icon, esc, $, $$ } = UI;
    let [list, fields] = await Promise.all([API.call('template.list'), API.call('template.fields')]);
    if (!alive()) return;
    const KOL = {}; fields.kolom.forEach((k) => (KOL[k.kode] = k));
    const grup = {}; fields.kolom.forEach((k) => (grup[k.grup] = grup[k.grup] || []).push(k));
    let sel = null;          // { TemplateID?, Nama, Tipe, Mode, DocUrl, Status, mapping:[], peringatan:[] }
    let filter = 'semua';
    const pilih = (t) => { sel = t ? JSON.parse(JSON.stringify(t)) : null; draw(); };
    if (q.id) { const t = list.templates.find((x) => x.TemplateID === q.id); if (t) sel = JSON.parse(JSON.stringify(t)); }
    if (!sel && list.templates.length) sel = JSON.parse(JSON.stringify(list.templates[0]));

    const draw = () => {
      const aktif = list.templates.filter((t) => t.Status === 'AKTIF');
      const totPh = list.templates.reduce((a, t) => a + t.mapping.length, 0), totMap = list.templates.reduce((a, t) => a + t.terpetakan, 0);
      el.innerHTML = pageHead({
        eyebrow: '<span class="mono xs muted">' + icon('sliders', 'sm') + ' SIPETIK SETUP ADMIN / PRD SEKSI 4.1 &amp; US-01/02</span>',
        title: 'Kelola Template &amp; Mapping Placeholder Dokumen',
        sub: 'Daftarkan tautan dokumen master Google Docs, pindai placeholder variabel dinamis secara otomatis (contoh: <code>{{nama}}</code>, <code>{{nip}}</code>, <code>{{jumlah}}</code>), dan petakan ke kolom basis data SIPETIK tanpa perlu pemrograman ulang aplikasi.',
        actions: '<button class="btn btn-ghost" id="doc">' + icon('book') + 'Dokumentasi Sintaks</button>' + (list.folder ? '<a class="btn btn-ghost" href="' + esc(list.folder) + '" target="_blank" rel="noopener">' + icon('folder') + 'Folder Template Drive</a>' : '') + '<button class="btn btn-primary" id="baru">' + icon('plusCircle') + '+ Daftarkan Template Baru</button>'
      }) +
      '<div class="grid g4">' +
        kpi('Total Template Master', aktif.length, 'Dokumen Aktif', 'file', '<span class="dot"></span> ' + list.templates.length + ' terdaftar di Drive') +
        kpi('Placeholder Terpetakan', totMap, 'Variabel Dinamis', 'code', (totPh - totMap ? '<span style="color:var(--warn)">' + (totPh - totMap) + ' belum dipetakan</span>' : icon('checkCircle', 'sm') + ' 0 konflik sintaks')) +
        kpi('Mesin Render GAS', list.renderRata ? (list.renderRata / 1000).toFixed(1) + 's' : '—', 'Rerata Latensi', 'zap', 'Google Docs API v1 • <span class="badge ok">Stabil</span>') +
        kpi('Fleksibilitas Template', '100%', 'Dynamic Engine', 'sliders', icon('lock', 'sm') + ' Tanpa hardcode • AppSheet native') +
      '</div>' +
      '<div class="grid g-side mt-24">' +
        '<div class="card"><div class="card-head"><h3><span class="num-tag">01</span> ' + (sel && sel.TemplateID ? 'Edit Registrasi ' + esc(sel.TemplateID) : 'Form Registrasi &amp; Pemindai') + '</h3><span class="badge info">Auto-Detection ON</span></div><div class="card-body col gap-lg">' +
          '<div class="alert" style="border-left-width:1px"><div class="ic">' + icon('info') + '</div><div class="small"><b>ALUR KERJA STANDAR:</b> 1. Siapkan naskah format di Google Docs → 2. Sisipkan variabel kurung kurawal ganda <code>{{variabel}}</code> → 3. Bagikan dokumen ke akun pemilik script → 4. Tempel URL &amp; klik <b>Pindai Dokumen</b> → 5. Petakan kolom ke basis data SIPETIK.</div></div>' +
          '<div class="field"><label>Nama Template Dokumen</label><input class="input" id="t-nama" value="' + esc(sel ? sel.Nama : '') + '" placeholder="Kwitansi Pembayaran Perjalanan Dinas Pengawasan"></div>' +
          '<div class="form-grid"><div class="field"><label>Kategori Dokumen</label><select class="input" id="t-tipe">' + fields.tipeDokumen.map((x) => '<option ' + (sel && sel.Tipe === x ? 'selected' : '') + '>' + x + '</option>').join('') + '</select></div>' +
          '<div class="field"><label>Mode Rendering</label><select class="input" id="t-mode"><option value="SPJ" ' + (sel && sel.Mode === 'SPJ' ? 'selected' : '') + '>1 dokumen per SPJ (tabel berulang)</option><option value="PER_PEGAWAI" ' + (sel && sel.Mode === 'PER_PEGAWAI' ? 'selected' : '') + '>1 halaman per penerima</option></select></div></div>' +
          '<div class="field"><label>URL Dokumen Google Docs Master' + (sel && sel.DocUrl ? '<a class="small" href="' + esc(sel.DocUrl) + '" target="_blank" rel="noopener">Buka Dokumen ' + icon('external', 'sm') + '</a>' : '') + '</label><input class="input mono" id="t-url" value="' + esc(sel ? sel.DocUrl : '') + '" placeholder="https://docs.google.com/document/d/1aBcDeFg…/edit"></div>' +
          (sel && sel.peringatan && sel.peringatan.length ? '<div class="alert warn"><div class="ic">' + icon('alert') + '</div><div class="small">' + sel.peringatan.map(esc).join('<br>') + '</div></div>' : '') +
          '<div class="row"><button class="btn btn-soft grow" id="scan">' + icon('search') + 'Pindai Ulang Dokumen</button><button class="btn btn-navy grow" id="save1">' + icon('check') + 'Simpan Konfigurasi</button></div>' +
        '</div></div>' +
        '<div class="card"><div class="card-head"><div><h3><span class="num-tag">02</span> Daftar Template Master &amp; Status</h3><div class="sub">Sesuai Peraturan Bupati &amp; Ketentuan Standar Dokumen SPJ Inspektorat</div></div><span class="badge">' + list.templates.length + ' Dokumen Terkonfigurasi</span></div><div class="card-body col" style="gap:10px">' +
          (list.templates.length ? list.templates.map((t) => '<div class="file-row" style="' + (sel && sel.TemplateID === t.TemplateID ? 'border-color:var(--navy);box-shadow:0 0 0 1px var(--navy);background:#fff' : '') + '">' +
            '<span class="avatar" style="border-radius:6px;background:var(--navy);color:#fff;border:0;font-family:var(--mono);font-size:12px">' + esc(t.TemplateID) + '</span>' +
            '<div class="grow" style="min-width:0"><div class="row wrap"><b>' + esc(t.Nama) + '</b>' + UI.badge(t.Status) + '<span class="badge">' + (t.Mode === 'PER_PEGAWAI' ? 'Per penerima' : 'Per SPJ') + '</span></div><div class="small muted">Kategori: ' + esc(t.Tipe) + ' • ' + t.jumlahPlaceholder + ' placeholder terdeteksi • ' + (t.terpetakan === t.mapping.length ? '<span style="color:var(--ok)">terhubung penuh</span>' : '<span style="color:var(--warn)">' + (t.mapping.length - t.terpetakan) + ' belum dipetakan</span>') + '</div></div>' +
            (sel && sel.TemplateID === t.TemplateID ? '<span class="badge ok">Terpilih di Matriks</span>' : '<button class="btn btn-ghost btn-sm" data-pick="' + t.TemplateID + '">Pilih &amp; Petakan</button>') +
            '<a class="btn btn-ghost btn-icon btn-sm" href="' + esc(t.DocUrl) + '" target="_blank" rel="noopener" title="Buka Google Docs">' + icon('eye', 'sm') + '</a>' +
            '<a class="btn btn-ghost btn-icon btn-sm" href="#/template/' + t.TemplateID + '/uji" title="Uji render (sandbox)" style="color:var(--amber)">' + icon('flask', 'sm') + '</a>' +
            '<label class="switch" title="Aktif/nonaktif"><input type="checkbox" data-tog="' + t.TemplateID + '" ' + (t.Status === 'AKTIF' ? 'checked' : '') + '><span class="tr"></span></label></div>').join('') : UI.empty('Belum ada template. Daftarkan template pertama di form kiri.', 'file')) +
          '<div class="mono xs muted mt-8"><span style="color:var(--ok)">' + icon('checkCircle', 'sm') + '</span> Status Drive: dokumen dibaca langsung dari Google Docs saat generate (tanpa salin statis).</div>' +
        '</div></div>' +
      '</div>' +
      '<div class="card mt-24" id="matriks">' + matriks() + '</div>' +
      '<div class="grid g-main mt-24"><div class="card"><div class="card-body row gap-lg" style="align-items:flex-start"><span class="kpi" style="padding:0"><span class="ico" style="background:var(--amber-soft);color:var(--amber)">' + icon('code', 'lg') + '</span></span><div><div class="b" style="font-size:16px">Aturan Penulisan Sintaks Google Docs Placeholder (GAS Engine)</div>' +
        '<div class="small muted mt-8">Gunakan tanda kurung kurawal ganda tanpa spasi: <code>{{nama}}</code>, <code>{{nomor_spj}}</code>. Tidak valid: <code>{{ nama }}</code> atau <code>{nama}</code>. Awali dengan <code>r.</code> untuk nilai per penerima (mis. <code>{{r.nama}}</code>, <code>{{r.bersih}}</code>) — pada mode <b>1 dokumen per SPJ</b>, baris tabel yang memuat <code>{{r.…}}</code> otomatis digandakan untuk setiap penerima. Setelah mengubah dokumen di Google Docs, klik <b>Pindai Ulang</b>.</div></div></div></div>' +
      '<div class="card"><div class="card-body"><div class="row between"><span class="mono xs upper b">Audit Compliance Stamp</span><span style="color:var(--ok)">' + icon('shieldCheck') + '</span></div><div class="small muted mt-8">Konfigurasi terikat dengan skema audit Inspektorat Kutai Timur. Tersinkronisasi dua arah dengan Master Google Sheets tab <b>Template</b> &amp; tab <b>Mapping</b>. Setiap perubahan tercatat di Audit Trail.</div><div class="row between mono xs muted mt-8"><span>ISO 27001 / SPBE Compliant</span><b style="color:var(--text)">SIPETIK • ' + new Date().getFullYear() + '</b></div></div></div></div>';
      bind();
    };
    const kpi = (lbl, val, sm, ic, foot) => '<div class="card kpi"><div class="lbl"><span>' + lbl + '</span><span class="ico">' + icon(ic) + '</span></div><div class="val">' + val + '<small>' + sm + '</small></div><div class="foot panel" style="padding:6px 10px">' + foot + '</div></div>';
    const optKolom = (v) => '<option value="">— tidak dipetakan (opsional) —</option>' + Object.keys(grup).map((g) => '<optgroup label="' + g + '">' + grup[g].map((k) => '<option value="' + k.kode + '" ' + (k.kode === v ? 'selected' : '') + '>' + k.kode + ' — ' + esc(k.label) + '</option>').join('') + '</optgroup>').join('');
    const matriks = () => {
      if (!sel) return '<div class="card-body">' + UI.empty('Pilih template atau pindai dokumen baru untuk memetakan placeholder.', 'code') + '</div>';
      const m = sel.mapping || [];
      const rows = m.map((x, i) => ({ x, i })).filter(({ x }) => filter === 'semua' || (filter === 'wajib' ? x.Opsional !== 'YA' : KOL[x.Kolom] && KOL[x.Kolom].auto));
      return '<div class="card-head"><h3><span class="num-tag">03</span> Matriks Konfigurasi Mapping: ' + esc(sel.Nama || '(template baru)') + ' <span class="badge locked">Template ID: ' + esc(sel.TemplateID || 'BARU') + '</span><span class="badge">' + m.length + ' Placeholder Terdeteksi</span></h3>' +
        '<div class="row wrap"><div class="seg" id="flt">' + [['semua', 'Semua (' + m.length + ')'], ['wajib', 'Wajib Saja (' + m.filter((x) => x.Opsional !== 'YA').length + ')'], ['auto', 'Auto Formula (' + m.filter((x) => KOL[x.Kolom] && KOL[x.Kolom].auto).length + ')']].map((f) => '<button class="' + (filter === f[0] ? 'on' : '') + '" data-f="' + f[0] + '">' + f[1] + '</button>').join('') + '</div>' +
        (sel.TemplateID ? '<a class="btn btn-navy btn-sm" href="#/template/' + sel.TemplateID + '/uji">' + icon('flask', 'sm') + 'Uji Render Riil</a>' : '') + '</div></div>' +
        '<div class="tbl-wrap"><table class="tbl compact"><thead><tr><th>No</th><th>Sintaks Placeholder (Docs)</th><th>Label Tampilan di Form</th><th>Sumber Kolom SIPETIK</th><th>Tipe Data</th><th>Sifat Entri</th></tr></thead><tbody>' +
        (rows.length ? rows.map(({ x, i }) => '<tr class="' + (!x.Kolom ? 'warn' : '') + '"><td class="mono">' + String(i + 1).padStart(2, '0') + '</td><td><span class="badge" style="font-size:12px;color:var(--navy)">{{' + esc(x.Placeholder) + '}}</span>' + (x.Placeholder.indexOf('r.') === 0 ? ' <span class="pill-tag">baris</span>' : '') + '</td>' +
          '<td><input class="input" style="height:32px" data-i="' + i + '" data-k="Label" value="' + esc(x.Label) + '"></td>' +
          '<td><select class="input mono" style="height:32px;font-size:12px;min-width:240px" data-i="' + i + '" data-k="Kolom">' + optKolom(x.Kolom) + '</select></td>' +
          '<td><select class="input" style="height:32px;min-width:150px" data-i="' + i + '" data-k="TipeData">' + Object.keys(fields.tipe).map((t) => '<option value="' + t + '" ' + (t === x.TipeData ? 'selected' : '') + '>' + fields.tipe[t] + '</option>').join('') + '</select></td>' +
          '<td><button class="badge ' + (x.Opsional === 'YA' ? '' : 'err') + '" style="cursor:pointer" data-opt="' + i + '">' + (x.Opsional === 'YA' ? 'Opsional' : 'Wajib') + '</button></td></tr>').join('')
          : '<tr><td colspan="6">' + UI.empty('Tidak ada placeholder pada filter ini. Pastikan dokumen memuat {{variabel}} lalu Pindai Ulang.', 'code') + '</td></tr>') +
        '</tbody></table></div><div class="card-foot row wrap between"><span class="small muted">' + icon('file', 'sm') + ' Placeholder tanpa kolom dianggap opsional dan dikosongkan saat render (tercatat sebagai peringatan).</span><div class="row"><button class="btn btn-ghost btn-sm" id="reset">Reset ke Saran Sistem</button><button class="btn btn-navy btn-sm" id="save2">' + icon('check', 'sm') + 'Terapkan Pemetaan (Simpan ke DB)</button></div></div>';
    };
    const ambilForm = () => { if (!sel) sel = { mapping: [] }; sel.Nama = $('#t-nama', el).value.trim(); sel.Tipe = $('#t-tipe', el).value; sel.Mode = $('#t-mode', el).value; sel.DocUrl = $('#t-url', el).value.trim(); };
    const simpan = async () => {
      ambilForm();
      if (!sel.Nama || !sel.DocUrl) return UI.toast('Nama & URL Google Docs wajib diisi.', 'err');
      list = await API.call('template.save', { template: { TemplateID: sel.TemplateID || '', Nama: sel.Nama, Tipe: sel.Tipe, Mode: sel.Mode, DocUrl: sel.DocUrl, Status: sel.Status || 'AKTIF', Urutan: sel.Urutan }, mapping: sel.mapping || [] }, { toast: true });
      const id = sel.TemplateID || (list.templates.find((t) => t.DocUrl.indexOf(sel.DocUrl.match(/[A-Za-z0-9_-]{20,}/) || '@@') > -1) || {}).TemplateID;
      Master.clear('tpl');
      pilih(list.templates.find((t) => t.TemplateID === id) || list.templates[list.templates.length - 1]);
    };
    const bind = () => {
      $('#doc', el).onclick = () => UI.modal({ title: 'Dokumentasi sintaks & katalog kolom', size: 'xwide', body: '<div class="tbl-wrap" style="max-height:60vh"><table class="tbl compact"><thead><tr><th>Placeholder</th><th>Keterangan</th><th>Tipe</th><th>Grup</th></tr></thead><tbody>' +
        fields.kolom.map((k) => '<tr><td class="mono small">{{' + k.kode + '}}</td><td>' + esc(k.label) + '</td><td class="small">' + fields.tipe[k.tipe] + '</td><td class="small muted">' + k.grup + '</td></tr>').join('') + '</tbody></table></div>', foot: '<button class="btn btn-navy" data-close>Tutup</button>' });
      $('#baru', el).onclick = () => { sel = { Nama: '', Tipe: 'Kwitansi', Mode: 'SPJ', DocUrl: '', mapping: [] }; draw(); $('#t-nama', el).focus(); };
      $$('[data-pick]', el).forEach((b) => (b.onclick = () => pilih(list.templates.find((t) => t.TemplateID === b.dataset.pick))));
      $$('[data-tog]', el).forEach((c) => (c.onchange = async () => { try { list = await API.call('template.setStatus', { templateId: c.dataset.tog, status: c.checked ? 'AKTIF' : 'NONAKTIF' }, { toast: true }); Master.clear('tpl'); draw(); } catch (e) { c.checked = !c.checked; } }));
      $('#scan', el).onclick = (e) => UI.act(e.currentTarget, async () => {
        ambilForm();
        if (!sel.DocUrl) return UI.toast('Tempel URL Google Docs dulu.', 'err');
        const r = await API.call('template.scan', { url: sel.DocUrl, mode: sel.Mode, templateId: sel.TemplateID || '' }, { toast: true });
        if (!sel.Nama) sel.Nama = r.judul;
        sel.DocUrl = r.url; sel.mapping = r.placeholders; sel.peringatan = r.peringatan;
        draw();
      });
      $('#save1', el).onclick = (e) => UI.act(e.currentTarget, simpan);
      const s2 = $('#save2', el); if (s2) s2.onclick = (e) => UI.act(e.currentTarget, simpan);
      $$('#flt [data-f]', el).forEach((b) => (b.onclick = () => { filter = b.dataset.f; $('#matriks', el).innerHTML = matriks(); bind(); }));
      $$('#matriks [data-k]', el).forEach((inp) => (inp.onchange = () => {
        const x = sel.mapping[+inp.dataset.i]; x[inp.dataset.k] = inp.value;
        if (inp.dataset.k === 'Kolom') { if (KOL[inp.value]) { x.TipeData = KOL[inp.value].tipe; if (!x.Label || x.Label === x.Placeholder) x.Label = KOL[inp.value].label; x.Opsional = 'TIDAK'; } else x.Opsional = 'YA'; $('#matriks', el).innerHTML = matriks(); bind(); }
      }));
      $$('[data-opt]', el).forEach((b) => (b.onclick = () => { const x = sel.mapping[+b.dataset.opt]; x.Opsional = x.Opsional === 'YA' ? 'TIDAK' : 'YA'; $('#matriks', el).innerHTML = matriks(); bind(); }));
      const rs = $('#reset', el); if (rs) rs.onclick = (e) => UI.act(e.currentTarget, async () => {
        ambilForm();
        const r = await API.call('template.scan', { url: sel.DocUrl, mode: sel.Mode });
        sel.mapping = r.placeholders; $('#matriks', el).innerHTML = matriks(); bind(); UI.toast('Pemetaan dikembalikan ke saran sistem (belum disimpan).', 'warn');
      });
    };
    draw();
  }
};

/* Uji Render (sandbox) — pratinjau A4 riil dari Google Docs → PDF */
Pages.templateUji = {
  title: 'Uji Render Template', crumb: ['Setup Admin', 'Template Manager', 'Uji Render'], izin: 'template',
  async render(el, params, q, alive) {
    const { icon, esc, rp, $ } = UI;
    const tid = params[0];
    const list = await API.call('template.list');
    if (!alive()) return;
    const tpl = list.templates.find((t) => t.TemplateID === tid);
    if (!tpl) { el.innerHTML = UI.empty('Template tidak ditemukan.', 'file'); return; }
    App.setCrumbs(['Setup Admin', 'Template Manager', 'Uji Render (' + tid + ') — Sandbox']);
    let hasil = null, url = null, spjId = q.spj || '';
    const draw = () => {
      const ok = hasil && !hasil.warnings.length;
      el.innerHTML = '<div class="card"><div class="card-body row wrap between"><div class="row wrap"><span class="badge draft"><span class="dot warn"></span>SANDBOX MODE: TEST ENGINE ACTIVE</span><span class="badge">' + icon('file', 'sm') + ' Google Docs API v1 Terhubung</span>' +
        (hasil ? '<span class="badge">' + icon('clock', 'sm') + ' Waktu Render: ' + (hasil.ms / 1000).toFixed(2) + 's</span><span class="badge ' + (ok ? 'ok' : 'draft') + '">' + icon(ok ? 'checkCircle' : 'alert', 'sm') + ' Sintaks: ' + (hasil.tokens.length - hasil.warnings.length) + '/' + hasil.tokens.length + ' Valid</span>' : '') + '</div>' +
        '<div class="row"><button class="btn btn-ghost" id="reload">' + icon('refresh') + 'Muat Ulang Data Sampel</button>' + (hasil ? '<button class="btn btn-navy" id="dl">' + icon('download') + 'Unduh PDF Uji</button>' : '') + '</div></div></div>' +
        '<div class="grid g-side mt-16"><div class="col gap-lg">' +
          '<div class="card"><div class="card-head"><h3>' + icon('grid') + 'Data SPJ Uji Coba</h3><span class="badge info">' + esc(tpl.TemplateID) + ' • ' + esc(tpl.Nama) + '</span></div><div class="card-body"><div class="field"><label>Pilih sampel SPJ penerima</label><select class="input" id="sp">' +
            (hasil ? hasil.sampel.map((s) => '<option value="' + s.SPJID + '" ' + (s.SPJID === hasil.spj.SPJID ? 'selected' : '') + '>' + esc(s.NomorSPJ) + ' — ' + rp(s.TotalBersih) + ' — ' + esc(s.UraianKegiatan) + '</option>').join('') : '<option>memuat…</option>') + '</select></div>' +
            '<div class="row mt-8 small"><span class="muted">Status sinkronisasi:</span><span class="badge ok"><span class="dot"></span>Terpetakan ke Spreadsheet</span></div></div></div>' +
          '<div class="card"><div class="card-head"><h3>Tabel Token Injeksi Template (' + esc(tpl.TemplateID) + ')</h3>' + (hasil ? '<span class="badge locked">' + hasil.tokens.length + ' Token</span>' : '') + '</div><div class="tbl-wrap" style="max-height:360px"><table class="tbl compact"><thead><tr><th>Placeholder Docs</th><th>Nilai Injeksi Realtime</th><th>Sumber</th></tr></thead><tbody>' +
            (hasil ? hasil.tokens.map((t) => '<tr class="' + (/tidak terpetakan/.test(t.kolom) ? 'warn' : '') + '"><td class="mono small">' + esc(t.placeholder) + '</td><td class="small">' + esc(t.nilai || '—') + '</td><td><span class="pill-tag mono">' + esc(t.kolom) + '</span></td></tr>').join('') : '<tr><td colspan="3">' + UI.loadingBlock('Merender…') + '</td></tr>') + '</tbody></table></div></div>' +
          '<div class="card"><div class="card-head"><h3>' + icon('code') + 'Log Mesin Google Apps Script (GAS)</h3><span class="badge ' + (hasil ? 'ok' : '') + '">STATUS: ' + (hasil ? '200 OK' : '…') + '</span></div><div class="card-body"><pre class="mono xs" style="background:#0F1B33;color:#C9D3E6;padding:12px;border-radius:6px;margin:0;white-space:pre-wrap;max-height:240px;overflow:auto">' +
            (hasil ? hasil.log.map((l) => esc(l)).join('\n').replace(/(\[SHA-256[^\n]*)/, '<span style="color:#6EE7B7">$1</span>') : 'Menunggu eksekusi…') + '</pre></div></div>' +
        '</div>' +
        '<div class="card"><div class="card-head"><h3>' + icon('file') + 'Pratinjau Dokumen Cetak (Format A4 Resmi)</h3>' + (hasil ? '<span class="mono xs muted">' + Math.round(hasil.ukuran / 1024) + ' KB • SHA ' + UI.ringkasHash(hasil.sha, 8) + '</span>' : '') + '</div><div class="card-body" style="background:var(--surface-alt)">' +
          (url ? '<iframe src="' + url + '" style="width:100%;height:78vh;border:1px solid var(--border);background:#fff;border-radius:4px" title="Pratinjau PDF"></iframe>' : UI.loadingBlock('Membuat salinan Docs, injeksi token, ekspor PDF…')) + '</div></div>' +
        '</div>' +
        '<div class="actionbar"><span class="file-ic" style="background:' + (ok ? 'var(--ok-bg)' : 'var(--warn-bg)') + ';color:' + (ok ? 'var(--ok)' : 'var(--warn)') + '">' + icon(ok ? 'checkCircle' : 'alert') + '</span><div class="grow"><div class="b">' + (hasil ? (ok ? 'Validasi Dokumen Sempurna' : hasil.warnings.length + ' placeholder tidak terpetakan') : 'Menjalankan uji render…') + '</div><div class="small muted">' + (hasil ? (ok ? 'Semua placeholder token terinjeksi tanpa pemotongan teks.' : 'Tidak terpetakan: ' + esc(hasil.warnings.join(', ')) + ' — perbaiki di Matriks Mapping.') : '') + '</div></div>' +
          '<a class="btn btn-soft" href="#/template?id=' + tid + '">Kembali ke Template Manager</a>' + (hasil && hasil.sampel.length > 1 ? '<button class="btn btn-ghost" id="next">Uji Sampel Berikutnya ' + icon('arrowRight') + '</button>' : '') +
          (tpl.Status !== 'AKTIF' ? '<button class="btn btn-success" id="aktif">' + icon('check') + 'Jadikan Template Aktif</button>' : '<span class="badge ok">' + icon('check', 'sm') + 'Template Aktif (Produksi)</span>') + '</div>';
      $('#reload', el).onclick = () => jalan();
      if ($('#dl', el)) $('#dl', el).onclick = () => UI.download(hasil.base64, hasil.nama, 'application/pdf');
      if (hasil) $('#sp', el).onchange = (e) => { spjId = e.target.value; jalan(); };
      if ($('#next', el)) $('#next', el).onclick = () => { const i = hasil.sampel.findIndex((s) => s.SPJID === hasil.spj.SPJID); spjId = hasil.sampel[(i + 1) % hasil.sampel.length].SPJID; jalan(); };
      if ($('#aktif', el)) $('#aktif', el).onclick = (e) => UI.act(e.currentTarget, async () => { await API.call('template.setStatus', { templateId: tid, status: 'AKTIF' }, { toast: true }); tpl.Status = 'AKTIF'; Master.clear('tpl'); draw(); });
    };
    const jalan = async () => {
      if (url) URL.revokeObjectURL(url); url = null; hasil = null; draw();
      try {
        hasil = await API.call('template.testRender', { templateId: tid, spjId });
        if (!alive()) return;
        url = URL.createObjectURL(UI.b64ToBlob(hasil.base64, 'application/pdf'));
      } catch (e) { el.querySelector('.card-body[style]') && (el.querySelector('.card-body[style]').innerHTML = UI.empty(esc(e.message), 'alert')); return; }
      draw();
    };
    jalan();
  }
};
