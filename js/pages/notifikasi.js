/* WhatsApp & Notifikasi — Blast per batch, Antrean, Konfigurasi Fonnte/Email + Matriks event */
Pages.notifikasi = {
  title: 'WhatsApp & Notifikasi', crumb: ['Komunikasi', 'WhatsApp & Notifikasi'], izin: ['blast', 'notif_config'],
  async render(el, p, q, alive) {
    const { icon, esc, $, $$ } = UI;
    const bolehBlast = App.can('blast'), bolehCfg = App.can('notif_config');
    let tab = q.tab || (bolehBlast ? 'blast' : 'config');
    let presetIds = null; try { presetIds = JSON.parse(sessionStorage.getItem('sipetik_blast_ids') || 'null'); sessionStorage.removeItem('sipetik_blast_ids'); } catch (e) {}
    const B = { sumber: presetIds ? 'crm' : 'crm', segmen: '', tag: '', statusWA: '', spjId: '', manual: '', rows: [], ring: null, pilih: new Set(), hanyaWA: false,
      judul: '', pesan: 'Yth. {nama},\n\n', batch: 20, jeda: '5', aktif: null, auto: false, timer: null, cd: 0, riwayat: [] };
    let cfg = null, antre = null, fAntre = { status: '', kanal: '' };
    const cleanup = () => { if (B.timer) { clearInterval(B.timer); B.timer = null; } };
    App.guard('#/notifikasi', () => { cleanup(); return false; });

    const shell = () => {
      el.innerHTML = pageHead({ bc: [['Dashboard', '#/dashboard'], 'Komunikasi', 'WhatsApp & Notifikasi'], title: 'WhatsApp &amp; Notifikasi',
        sub: 'Notifikasi otomatis alur SPJ (WhatsApp via Fonnte + Email) dengan saklar per kanal &amp; per kejadian, blast pesan per batch anti-banned, dan deteksi nomor WhatsApp aktif.',
        eyebrow: '<span class="badge ' + (App.state.settings.NOTIF_WA_AKTIF === 'YA' ? 'wa' : '') + '">' + icon('chat', 'sm') + 'WA ' + (App.state.settings.NOTIF_WA_AKTIF === 'YA' ? 'AKTIF' : 'NONAKTIF') + '</span><span class="badge ' + (App.state.settings.NOTIF_EMAIL_AKTIF === 'YA' ? 'ok' : '') + '">' + icon('mail', 'sm') + 'EMAIL ' + (App.state.settings.NOTIF_EMAIL_AKTIF === 'YA' ? 'AKTIF' : 'NONAKTIF') + '</span>' }) +
        '<div class="tabs">' + (bolehBlast ? '<button class="tab ' + (tab === 'blast' ? 'on' : '') + '" data-t="blast">' + icon('send') + ' Blast WhatsApp</button>' : '') +
        '<button class="tab ' + (tab === 'antre' ? 'on' : '') + '" data-t="antre">' + icon('history') + ' Antrean &amp; Riwayat</button>' +
        (bolehCfg ? '<button class="tab ' + (tab === 'config' ? 'on' : '') + '" data-t="config">' + icon('sliders') + ' Konfigurasi</button>' : '') + '</div><div id="tabc"></div>';
      $$('[data-t]', el).forEach((b) => (b.onclick = () => { tab = b.dataset.t; cleanup(); shell(); }));
      if (tab === 'blast') tabBlast(); else if (tab === 'antre') tabAntre(); else tabConfig();
    };

    // ============================ TAB BLAST ============================
    const tabBlast = async () => {
      const c = $('#tabc', el);
      c.innerHTML = UI.loadingBlock();
      const [spjList, crmStat] = await Promise.all([API.call('spj.list', { semua: true, per: 200 }, { silent: true }).catch(() => ({ rows: [] })), App.can('crm_view') ? API.call('crm.stats', {}, { silent: true }).catch(() => null) : null]);
      B.riwayat = await API.call('wa.blastList', {}, { silent: true }).catch(() => []);
      if (!B.aktif) B.aktif = B.riwayat.find((x) => x.Status === 'Berjalan') || null;
      const segs = crmStat ? Object.keys(crmStat.perSegmen) : ['Pegawai', 'Pengguna Sistem'];
      c.innerHTML = '<div class="grid g2" style="align-items:start">' +
        '<div class="card"><div class="card-head"><h3><span class="num-tag">1</span> Pilih Sasaran</h3></div><div class="card-body col gap-lg">' +
          '<div class="form-grid"><div class="field"><label>Sumber penerima</label><select class="input" id="b-src"><option value="crm">CRM Kontak (pegawai + pengguna)</option><option value="spj">Penerima SPJ tertentu</option><option value="manual">Tempel manual</option></select></div>' +
          '<div class="field" data-for="crm"><label>Segmen</label><select class="input" id="b-seg"><option value="">Semua segmen</option>' + segs.map((s) => '<option>' + esc(s) + '</option>').join('') + '</select></div>' +
          '<div class="field" data-for="crm"><label>Status WA</label><select class="input" id="b-swa"><option value="">Semua</option><option>Terdaftar</option><option>Tidak Terdaftar</option><option value="Belum">Belum dicek</option></select></div>' +
          '<div class="field" data-for="crm"><label>Tag</label><input class="input" id="b-tag" placeholder="mis. Tim Wilayah II"></div>' +
          '<div class="field full" data-for="spj"><label>SPJ</label><select class="input" id="b-spj">' + spjList.rows.map((s) => '<option value="' + s.SPJID + '">' + esc(s.NomorSPJ + ' — ' + s.Personil + ' personil — ' + s.Status) + '</option>').join('') + '</select><div class="hint">Variabel tambahan: {jumlah} (bersih per orang), {nomor}, {kegiatan}, {nip}</div></div>' +
          '<div class="field full" data-for="manual"><label>Nomor | Nama (satu per baris)</label><textarea class="input mono" id="b-man" rows="5" placeholder="081234567890|Budi Santoso\n6281355550001|Siti Aminah"></textarea></div></div>' +
          (presetIds ? '<div class="alert"><div class="ic">' + icon('idcard') + '</div><div class="small grow"><b>' + presetIds.length + ' kontak terpilih dari CRM.</b></div><button class="btn btn-ghost btn-sm" id="b-clrp">Hapus pilihan CRM</button></div>' : '') +
          '<div class="row wrap"><button class="btn btn-navy" id="b-load">' + icon('users') + 'Muat Penerima</button><button class="btn btn-ghost" id="b-det">' + icon('phoneSm') + 'Deteksi Nomor WA</button><span class="small muted" id="b-prog"></span></div>' +
          '<div id="b-ring"></div><label class="check small"><input type="checkbox" id="b-only" ' + (B.hanyaWA ? 'checked' : '') + '>Kirim hanya ke nomor terdeteksi WhatsApp</label>' +
          '<div class="tbl-wrap" style="max-height:360px;border:1px solid var(--border);border-radius:6px"><table class="tbl compact"><thead><tr><th><input type="checkbox" class="check" id="b-all"></th><th>Nama</th><th>Nomor</th><th>WA</th></tr></thead><tbody id="b-tb"><tr><td colspan="4">' + UI.empty('Klik <b>Muat Penerima</b>.', 'users') + '</td></tr></tbody></table></div>' +
        '</div></div>' +
        '<div class="col gap-lg"><div class="card"><div class="card-head"><h3><span class="num-tag">2</span> Tulis Pesan</h3></div><div class="card-body col gap-lg">' +
          '<div class="field"><label>Judul internal</label><input class="input" id="b-judul" value="' + esc(B.judul) + '" placeholder="mis. Undangan rapat evaluasi SPJ"></div>' +
          '<div class="row wrap">' + ['nama', 'nip', 'jabatan', 'jumlah', 'nomor', 'kegiatan', 'institusi', 'link'].map((v) => '<button class="pill-tag" style="cursor:pointer" data-var="' + v + '">{' + v + '}</button>').join('') + '</div>' +
          '<textarea class="input" id="b-pesan" rows="7">' + esc(B.pesan) + '</textarea><div class="hint">Format WhatsApp: *tebal*, _miring_. Tambahkan "Balas STOP untuk berhenti." untuk blast non-dinas.</div>' +
          '<div class="wa-preview"><div class="mono xs muted mb-8">Pratinjau (penerima pertama)</div><div class="wa-bubble" id="b-prev" data-t="' + new Date().toTimeString().substring(0, 5) + ' ✓✓"></div></div></div></div>' +
          '<div class="card"><div class="card-head"><h3><span class="num-tag">3</span> Ukuran Batch &amp; Jeda</h3></div><div class="card-body col gap-lg"><div class="row wrap gap-lg"><div class="seg" id="b-batch">' + [10, 20, 50].map((n) => '<button data-b="' + n + '" class="' + (B.batch === n ? 'on' : '') + '">' + n + '</button>').join('') + '</div>' +
            '<div class="affix" style="width:170px"><span class="pre">Jeda</span><input class="mono" id="b-jeda" value="' + esc(B.jeda) + '"><span class="post">detik</span></div></div><div class="small muted" id="b-sum"></div>' +
            '<button class="btn btn-primary btn-lg" id="b-go">' + icon('send') + 'Mulai Blast</button></div></div></div></div>' +
        '<div id="b-aktif" class="mt-24"></div>' +
        '<div class="card mt-24"><div class="card-head"><h3>' + icon('history') + 'Riwayat Blast</h3><button class="btn btn-ghost btn-sm" id="b-ref">' + icon('refresh', 'sm') + 'Muat ulang</button></div><div class="tbl-wrap"><table class="tbl compact"><thead><tr><th>Judul</th><th>Sasaran</th><th>Batch · Jeda</th><th style="width:200px">Progres</th><th>Status</th><th>Dibuat</th><th></th></tr></thead><tbody id="b-hist"></tbody></table></div></div>';
      const showSrc = () => { const v = $('#b-src', c).value; $$('[data-for]', c).forEach((x) => (x.style.display = x.dataset.for === v ? '' : 'none')); };
      $('#b-src', c).value = B.sumber; showSrc();
      $('#b-src', c).onchange = () => { B.sumber = $('#b-src', c).value; showSrc(); };
      if ($('#b-clrp', c)) $('#b-clrp', c).onclick = (e) => { presetIds = null; e.target.closest('.alert').remove(); };
      $('#b-load', c).onclick = (e) => UI.act(e.currentTarget, muat);
      $('#b-det', c).onclick = (e) => UI.act(e.currentTarget, deteksi);
      $('#b-only', c).onchange = (e) => { B.hanyaWA = e.target.checked; drawRows(); };
      $('#b-all', c).onchange = (e) => { B.rows.forEach((r, i) => { if (bisaDipilih(r)) e.target.checked ? B.pilih.add(i) : B.pilih.delete(i); }); drawRows(); };
      $$('[data-var]', c).forEach((b) => (b.onclick = () => { const t = $('#b-pesan', c); const s = t.selectionStart; t.value = t.value.slice(0, s) + '{' + b.dataset.var + '}' + t.value.slice(t.selectionEnd); t.focus(); t.selectionStart = t.selectionEnd = s + b.dataset.var.length + 2; B.pesan = t.value; preview(); }));
      $('#b-pesan', c).oninput = (e) => { B.pesan = e.target.value; preview(); };
      $('#b-judul', c).oninput = (e) => (B.judul = e.target.value);
      $$('#b-batch [data-b]', c).forEach((b) => (b.onclick = () => { B.batch = +b.dataset.b; $$('#b-batch button', c).forEach((x) => x.classList.toggle('on', x === b)); summary(); }));
      $('#b-jeda', c).oninput = (e) => { B.jeda = e.target.value.trim(); summary(); };
      $('#b-go', c).onclick = (e) => UI.act(e.currentTarget, mulai);
      $('#b-ref', c).onclick = async () => { B.riwayat = await API.call('wa.blastList'); drawHist(); };
      preview(); summary(); drawHist(); drawAktif();
      if (presetIds) muat();
    };
    const bisaDipilih = (r) => r.valid && !r.ganda && !r.optOut && (!B.hanyaWA || r.statusWA === 'Terdaftar');
    const muat = async () => {
      const c = $('#tabc', el);
      const d = await API.call('wa.audience', { sumber: B.sumber, segmen: $('#b-seg', c).value, statusWA: $('#b-swa', c).value, tag: $('#b-tag', c).value.trim(), spjId: $('#b-spj', c) ? $('#b-spj', c).value : '', manual: $('#b-man', c).value, ids: presetIds || undefined });
      B.rows = d.rows; B.ring = d.ringkas; B.pilih = new Set(); B.rows.forEach((r, i) => { if (bisaDipilih(r)) B.pilih.add(i); });
      drawRows(); preview();
    };
    const drawRows = () => {
      const c = $('#tabc', el); if (!c || !$('#b-tb', c)) return;
      B.rows.forEach((r, i) => { if (!bisaDipilih(r)) B.pilih.delete(i); });
      const R = B.ring;
      $('#b-ring', c).innerHTML = R ? '<div class="row wrap">' + [['total', R.total, ''], ['valid', R.valid, 'ok'], ['tidak valid', R.tidakValid, 'err'], ['ganda', R.ganda, 'draft'], ['terdaftar WA', R.terdaftarWA, 'wa'], ['opt-out', R.optOut, '']].map((x) => '<span class="badge ' + x[2] + '">' + x[1] + ' ' + x[0] + '</span>').join('') + '</div>' : '';
      $('#b-tb', c).innerHTML = B.rows.length ? B.rows.map((r, i) => '<tr class="' + (!bisaDipilih(r) ? 'dim' : '') + '"><td><input type="checkbox" class="check" data-bi="' + i + '" ' + (B.pilih.has(i) ? 'checked' : '') + ' ' + (bisaDipilih(r) ? '' : 'disabled') + '></td><td class="small">' + esc(r.nama) + (r.optOut ? ' <span class="pill-tag">opt-out</span>' : '') + (r.ganda ? ' <span class="pill-tag">ganda</span>' : '') + '</td><td class="mono small">' + esc(r.hp || '—') + '</td><td>' + (r.valid ? UI.waBadge(r.statusWA) : '<span class="wa-badge tidak">✕ tidak valid</span>') + '</td></tr>').join('') : '<tr><td colspan="4">' + UI.empty('Tidak ada penerima.', 'users') + '</td></tr>';
      $$('[data-bi]', c).forEach((x) => (x.onchange = () => { x.checked ? B.pilih.add(+x.dataset.bi) : B.pilih.delete(+x.dataset.bi); summary(); }));
      summary();
    };
    const deteksi = async () => {
      const nomor = Array.from(new Set(B.rows.filter((r) => r.valid).map((r) => r.hp)));
      if (!nomor.length) return UI.toast('Muat penerima dulu.', 'warn');
      const peta = {};
      for (let i = 0; i < nomor.length; i += 50) {
        $('#b-prog', el).textContent = 'Mengecek ' + Math.min(i + 50, nomor.length) + '/' + nomor.length + '…';
        const d = await API.call('wa.validate', { nomor: nomor.slice(i, i + 50) });
        d.hasil.forEach((h) => (peta[h.nomor] = h.status));
      }
      B.rows.forEach((r) => { if (peta[r.hp]) r.statusWA = peta[r.hp]; });
      B.ring.terdaftarWA = B.rows.filter((r) => r.statusWA === 'Terdaftar').length;
      $('#b-prog', el).textContent = 'Selesai: ' + B.ring.terdaftarWA + ' nomor terdaftar WhatsApp.';
      drawRows();
    };
    const isi = (tpl, r) => String(tpl).replace(/\{(\w+)\}/g, (m, k) => { const v = Object.assign({ nama: r.nama, institusi: App.state.settings.NAMA_INSTANSI_PANJANG, link: location.origin + location.pathname }, r.vars || {})[k]; return v == null ? '' : v; });
    const preview = () => {
      const b = $('#b-prev', el); if (!b) return;
      const r = B.rows[Array.from(B.pilih)[0]] || { nama: 'Budi Santoso', vars: { jumlah: 'Rp 13.469.100', nomor: 'T-700.1.2.8/438/ITKAB.SET', nip: '19820415 200604 1 008' } };
      b.innerHTML = esc(isi(B.pesan, r)).replace(/\*([^*\n]+)\*/g, '<b>$1</b>').replace(/_([^_\n]+)_/g, '<i>$1</i>');
    };
    const rataJeda = () => { const m = String(B.jeda).match(/^(\d+)(?:-(\d+))?$/); return m ? (m[2] ? (+m[1] + +m[2]) / 2 : +m[1]) : 5; };
    const summary = () => {
      const s = $('#b-sum', el); if (!s) return;
      const n = B.pilih.size, bt = Math.ceil(n / B.batch), mnt = Math.max(1, Math.round((n * rataJeda() + bt * 60) / 60));
      s.innerHTML = '<b>' + n + '</b> penerima → <b>' + bt + '</b> batch · estimasi ±' + mnt + ' menit (server mengirim 1 batch/menit walau halaman ditutup).';
      const g = $('#b-go', el); if (g) g.innerHTML = icon('send') + 'Mulai Blast (' + n + ' nomor)';
    };
    const mulai = async () => {
      const pen = Array.from(B.pilih).map((i) => B.rows[i]).map((r) => ({ id: r.id, nama: r.nama, hp: r.hp, vars: r.vars }));
      if (!pen.length) return UI.toast('Pilih minimal 1 penerima.', 'warn');
      if (!(await UI.confirm('Mulai blast?', pen.length + ' pesan akan diantrekan dalam ' + Math.ceil(pen.length / B.batch) + ' batch (ukuran ' + B.batch + ', jeda ' + B.jeda + ' detik).\n\nTips anti-banned: mulai batch 10, jeda acak ≥ 5 detik, hindari link yang sama ke ratusan nomor dalam 1 jam.', 'Mulai Blast'))) return;
      const sasaran = B.sumber === 'spj' ? 'Penerima SPJ ' + ($('#b-spj', el).selectedOptions[0] || {}).textContent : B.sumber === 'manual' ? 'Manual' : 'CRM ' + ($('#b-seg', el).value || 'semua segmen');
      const r = await API.call('wa.blastCreate', { judul: B.judul || 'Blast ' + UI.today(), pesan: B.pesan, ukuranBatch: B.batch, jeda: B.jeda, penerima: pen, sasaran }, { toast: true });
      B.riwayat = await API.call('wa.blastList'); B.aktif = B.riwayat.find((x) => x.BlastID === r.blastId); drawHist(); drawAktif();
    };
    const drawAktif = () => {
      const box = $('#b-aktif', el); if (!box) return;
      const a = B.aktif;
      if (!a) { box.innerHTML = ''; return; }
      box.innerHTML = '<div class="card" style="border-color:var(--navy)"><div class="card-head"><h3>' + icon('send') + 'Blast Aktif: ' + esc(a.Judul) + ' ' + UI.badge(a.Status) + '</h3><span class="mono xs muted">' + esc(a.BlastID) + '</span></div><div class="card-body">' +
        '<div class="row between mono small"><span>' + a.Terkirim + ' terkirim · ' + a.Gagal + ' gagal · ' + a.sisa + ' sisa</span><b>' + a.persen + '%</b></div><div class="mt-8">' + UI.bar(a.persen, 'thick') + '</div>' +
        (a.Status === 'Berjalan' ? '<div class="row wrap mt-16"><button class="btn btn-navy" id="a-next">' + icon('play', 'sm') + 'Kirim Batch Berikutnya Sekarang</button><label class="switch"><input type="checkbox" id="a-auto" ' + (B.auto ? 'checked' : '') + '><span class="tr"></span><span class="small">Otomatis <span class="mono" id="a-cd"></span></span></label><span class="grow"></span><button class="btn btn-danger" id="a-stop">' + icon('stop', 'sm') + 'Hentikan</button></div><div class="hint mt-8">Server tetap mengirim 1 batch per menit melalui trigger walau halaman ini ditutup.</div>' : '<div class="row mt-16"><button class="btn btn-ghost btn-sm" id="a-close">Tutup</button></div>') + '</div></div>';
      if ($('#a-next', box)) $('#a-next', box).onclick = (e) => UI.act(e.currentTarget, prosesBatch);
      if ($('#a-stop', box)) $('#a-stop', box).onclick = async () => { if (!(await UI.confirm('Hentikan blast?', 'Pesan yang belum terkirim akan dibatalkan.', 'Hentikan', true))) return; cleanup(); B.auto = false; B.aktif = await API.call('wa.blastStop', { blastId: a.BlastID }, { toast: true }); B.riwayat = await API.call('wa.blastList'); drawHist(); drawAktif(); };
      if ($('#a-close', box)) $('#a-close', box).onclick = () => { B.aktif = null; drawAktif(); };
      if ($('#a-auto', box)) $('#a-auto', box).onchange = (e) => { B.auto = e.target.checked; cleanup(); if (B.auto) mulaiAuto(); };
    };
    const prosesBatch = async () => {
      B.aktif = await API.call('wa.blastProcess', { blastId: B.aktif.BlastID }, { toast: true });
      if (B.aktif.Status !== 'Berjalan') { cleanup(); B.auto = false; }
      const i = B.riwayat.findIndex((x) => x.BlastID === B.aktif.BlastID); if (i > -1) B.riwayat[i] = B.aktif;
      drawHist(); drawAktif();
    };
    const mulaiAuto = () => {
      const tunggu = Math.max(30, Math.round(B.aktif.UkuranBatch * rataJeda()));
      B.cd = tunggu;
      B.timer = setInterval(async () => {
        if (!document.body.contains(el) || !B.aktif || B.aktif.Status !== 'Berjalan') { cleanup(); return; }
        B.cd--; const cd = $('#a-cd', el); if (cd) cd.textContent = '(' + B.cd + ' dtk)';
        if (B.cd <= 0) { B.cd = tunggu; try { await prosesBatch(); } catch (e) { cleanup(); } }
      }, 1000);
    };
    const drawHist = () => {
      const tb = $('#b-hist', el); if (!tb) return;
      tb.innerHTML = B.riwayat.length ? B.riwayat.map((b) => '<tr><td class="b small">' + esc(b.Judul) + '</td><td class="small muted">' + esc(b.Sasaran || '-') + '</td><td class="mono small">' + b.UkuranBatch + ' · ' + esc(b.JedaDetik) + 's</td><td><div class="mono xs">' + b.Terkirim + '/' + b.Total + ' (' + b.persen + '%)</div>' + UI.bar(b.persen) + '</td><td>' + UI.badge(b.Status) + '</td><td class="mono xs">' + UI.waktu(b.Tanggal) + '<div class="muted">' + esc(b.DibuatOleh) + '</div></td>' +
        '<td>' + (b.Status === 'Berjalan' ? '<button class="btn btn-ghost btn-sm" data-pantau="' + b.BlastID + '">Pantau</button>' : '') + '</td></tr>').join('') : '<tr><td colspan="7">' + UI.empty('Belum ada blast.', 'send') + '</td></tr>';
      $$('[data-pantau]', tb).forEach((x) => (x.onclick = () => { B.aktif = B.riwayat.find((b) => b.BlastID === x.dataset.pantau); drawAktif(); $('#b-aktif', el).scrollIntoView({ behavior: 'smooth' }); }));
    };

    // ============================ TAB ANTREAN ============================
    const tabAntre = async () => {
      const c = $('#tabc', el); c.innerHTML = UI.loadingBlock();
      antre = await API.call('notif.queue', fAntre);
      const r = antre.ringkas;
      c.innerHTML = '<div class="grid g4">' + [['Menunggu', r.Antri, 'clock', 'var(--warn)'], ['Terkirim', r.Terkirim, 'checkCircle', 'var(--ok)'], ['Gagal', r.Gagal, 'xCircle', 'var(--err)'], ['Dibatalkan', r.Batal, 'stop', 'var(--muted)']]
        .map((k) => '<div class="card kpi"><div class="lbl"><span>' + k[0] + '</span><span class="ico" style="color:' + k[3] + '">' + icon(k[2]) + '</span></div><div class="val">' + (k[1] || 0) + '</div></div>').join('') + '</div>' +
        '<div class="card mt-16"><div class="card-head"><div class="row wrap"><select class="input" id="q-st" style="width:auto"><option value="">Semua status</option>' + ['Antri', 'Terkirim', 'Gagal', 'Batal'].map((s) => '<option ' + (fAntre.status === s ? 'selected' : '') + '>' + s + '</option>').join('') + '</select><select class="input" id="q-kn" style="width:auto"><option value="">Semua kanal</option><option ' + (fAntre.kanal === 'WA' ? 'selected' : '') + '>WA</option><option ' + (fAntre.kanal === 'EMAIL' ? 'selected' : '') + '>EMAIL</option></select>' +
        '<span class="badge ' + (antre.trigger ? 'ok' : 'err') + '">' + icon('clock', 'sm') + 'Trigger 1 menit: ' + (antre.trigger ? 'aktif' : 'TIDAK AKTIF') + '</span></div><div class="row"><button class="btn btn-ghost btn-sm" id="q-ref">' + icon('refresh', 'sm') + 'Muat ulang</button><button class="btn btn-navy btn-sm" id="q-run">' + icon('play', 'sm') + 'Proses Sekarang</button>' + (bolehCfg ? '<button class="btn btn-ghost btn-sm" id="q-retry">' + icon('refresh', 'sm') + 'Ulangi yang Gagal</button>' : '') + '</div></div>' +
        '<div class="tbl-wrap"><table class="tbl compact"><thead><tr><th>Waktu</th><th>Kanal</th><th>Tujuan</th><th>Event</th><th>Pesan</th><th>Status</th></tr></thead><tbody>' +
        (antre.rows.length ? antre.rows.map((x) => '<tr><td class="mono xs nowrap">' + UI.waktu(x.DikirimPada || x.DibuatPada) + '</td><td><span class="badge ' + (x.Kanal === 'WA' ? 'wa' : 'info') + '">' + icon(x.Kanal === 'WA' ? 'chat' : 'mail', 'sm') + x.Kanal + '</span></td><td class="mono small">' + esc(x.Tujuan) + '<div class="xs muted" style="font-family:var(--font)">' + esc(x.NamaPenerima) + '</div></td><td class="mono xs">' + esc(x.Event) + (x.BlastID ? '<div class="muted">' + esc(x.BlastID) + '</div>' : '') + '</td><td class="small" style="max-width:360px">' + esc(x.Pesan) + '</td><td>' + UI.badge(x.Status) + (x.Respon && x.Status !== 'Terkirim' ? '<div class="xs muted">' + esc(x.Respon) + '</div>' : '') + '</td></tr>').join('')
          : '<tr><td colspan="6">' + UI.empty('Antrean kosong.', 'history') + '</td></tr>') + '</tbody></table></div></div>';
      $('#q-st', c).onchange = (e) => { fAntre.status = e.target.value; tabAntre(); };
      $('#q-kn', c).onchange = (e) => { fAntre.kanal = e.target.value; tabAntre(); };
      $('#q-ref', c).onclick = () => tabAntre();
      $('#q-run', c).onclick = (e) => UI.act(e.currentTarget, async () => { await API.call('notif.processNow', {}, { toast: true }); tabAntre(); });
      if ($('#q-retry', c)) $('#q-retry', c).onclick = (e) => UI.act(e.currentTarget, async () => { await API.call('notif.retry', {}, { toast: true }); tabAntre(); });
    };

    // ============================ TAB KONFIGURASI ============================
    const tabConfig = async () => {
      const c = $('#tabc', el); c.innerHTML = UI.loadingBlock();
      cfg = await API.call('notif.config');
      let buka = null;
      const draw = () => {
        c.innerHTML = '<div class="grid g2" style="align-items:start">' +
          '<div class="card"><div class="card-head"><h3><span style="color:var(--wa)">' + icon('chat', 'lg') + '</span> WhatsApp (Fonnte)</h3><label class="switch big"><input type="checkbox" id="c-wa" ' + (cfg.waAktif ? 'checked' : '') + '><span class="tr"></span><b id="c-wa-l">' + (cfg.waAktif ? 'AKTIF' : 'NONAKTIF') + '</b></label></div><div class="card-body col gap-lg">' +
            '<div class="field"><label>Token Fonnte ' + (cfg.adaToken ? '<span class="badge ok">tersimpan</span>' : '<span class="badge err">belum diisi</span>') + '</label><div class="row"><input class="input mono" type="password" id="c-tok" placeholder="' + esc(cfg.tokenMask || 'tempel token dari fonnte.com → Device') + '" autocomplete="off">' + (cfg.adaToken ? '<button class="btn btn-ghost btn-sm" id="c-deltok" title="Hapus token">' + icon('trash', 'sm') + '</button>' : '') + '</div><div class="hint">Disimpan di Script Properties — tidak pernah ditulis ke sheet atau dikirim ke browser.</div></div>' +
            '<div class="row wrap"><button class="btn btn-ghost" id="c-dev">' + icon('phoneSm') + 'Cek Perangkat</button><span class="small" id="c-devr"></span></div>' +
            '<div class="row"><input class="input mono" id="c-tnum" placeholder="0812… nomor tes" style="max-width:220px"><button class="btn btn-ghost" id="c-twa">' + icon('send', 'sm') + 'Kirim Tes WA</button></div>' +
            '<div class="row wrap gap-lg"><div class="field"><label>Batch default blast</label><div class="seg" id="c-batch">' + [10, 20, 50].map((n) => '<button data-b="' + n + '" class="' + (cfg.batchDefault === n ? 'on' : '') + '">' + n + '</button>').join('') + '</div></div>' +
              '<div class="field"><label>Jeda antarpesan (detik)</label><input class="input mono" id="c-jeda" value="' + esc(cfg.jeda) + '" style="width:120px"><div class="hint">angka (5) atau acak (3-8)</div></div></div>' +
            '<label class="switch"><input type="checkbox" id="c-det" ' + (cfg.deteksiOtomatis ? 'checked' : '') + '><span class="tr"></span><span class="small">Deteksi otomatis nomor WA kontak baru (±50 nomor / 10 menit)</span></label>' +
          '</div></div>' +
          '<div class="card"><div class="card-head"><h3><span style="color:var(--info)">' + icon('mail', 'lg') + '</span> Email (Gmail Apps Script)</h3><label class="switch big"><input type="checkbox" id="c-em" ' + (cfg.emailAktif ? 'checked' : '') + '><span class="tr"></span><b id="c-em-l">' + (cfg.emailAktif ? 'AKTIF' : 'NONAKTIF') + '</b></label></div><div class="card-body col gap-lg">' +
            '<div class="panel row between"><span class="small">Sisa kuota email hari ini</span><b class="mono">' + cfg.kuotaEmail + '</b></div>' +
            '<div class="field"><label>Nama pengirim</label><input class="input" id="c-nama" value="' + esc(cfg.namaPengirim) + '"></div>' +
            '<div class="row"><input class="input" id="c-temail" placeholder="email tes" style="max-width:240px" value="' + esc(App.state.user.Email) + '"><button class="btn btn-ghost" id="c-tem">' + icon('send', 'sm') + 'Kirim Tes Email</button></div>' +
            '<div class="field"><label>URL aplikasi untuk {link}</label><input class="input mono" id="c-url" value="' + esc(cfg.appUrl || location.origin + location.pathname) + '"></div>' +
            '<div class="row"><span class="badge ' + (cfg.trigger ? 'ok' : 'err') + '">' + icon('clock', 'sm') + 'Trigger antrean 1 menit: ' + (cfg.trigger ? 'aktif' : 'tidak aktif — simpan konfigurasi untuk memasang') + '</span></div>' +
          '</div></div></div>' +
          '<div class="card mt-24"><div class="card-head"><div><h3>' + icon('sliders') + 'Matriks Notifikasi Otomatis</h3><div class="sub">Pilih kanal per kejadian alur SPJ. Saklar kanal utama yang mati menonaktifkan seluruh kolomnya.</div></div></div><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Kejadian</th><th style="text-align:center">WhatsApp</th><th style="text-align:center">Email</th><th></th></tr></thead><tbody>' +
          cfg.matriks.map((m, i) => '<tr><td><b>' + esc(m.label) + '</b><div class="mono xs muted">' + m.kode + '</div></td><td style="text-align:center"><label class="switch"><input type="checkbox" data-mw="' + i + '" ' + (m.wa ? 'checked' : '') + ' ' + (cfg.waAktif ? '' : 'disabled') + '><span class="tr"></span></label></td>' +
            '<td style="text-align:center"><label class="switch"><input type="checkbox" data-me="' + i + '" ' + (m.email ? 'checked' : '') + ' ' + (cfg.emailAktif ? '' : 'disabled') + '><span class="tr"></span></label></td><td class="num"><button class="btn btn-ghost btn-sm" data-ed="' + i + '">' + icon('edit', 'sm') + 'Ubah</button></td></tr>' +
            (buka === i ? '<tr><td colspan="4" style="background:var(--surface-soft)"><div class="grid g2"><div class="col gap-lg"><div class="field"><label>Subjek email</label><input class="input" data-sub="' + i + '" value="' + esc(m.subjek) + '"></div><div class="field"><label>Isi pesan</label><textarea class="input" rows="6" data-msg="' + i + '">' + esc(m.pesan) + '</textarea></div>' +
              '<div class="small muted">Variabel: {nama} {institusi} {link} ' + m.vars.map((v) => '{' + v + '}').join(' ') + '</div><div><button class="btn btn-ghost btn-sm" data-rst="' + i + '">↺ Kembalikan bawaan</button></div></div>' +
              '<div class="wa-preview"><div class="mono xs muted mb-8">Pratinjau</div><div class="wa-bubble" data-t="10:00 ✓✓" id="pv-' + i + '"></div></div></div></td></tr>' : '')).join('') +
          '</tbody></table></div><div class="card-foot row end"><button class="btn btn-primary" id="c-save">' + icon('check') + 'Simpan Konfigurasi</button></div></div>';
        bindCfg();
      };
      const sampel = { nama: 'Budi Santoso', institusi: App.state.settings.NAMA_INSTANSI_PANJANG, link: location.origin + location.pathname, nomor: 'T-700.1.2.8/438/ITKAB.SET', kegiatan: 'Pengawasan Keuangan Desa', total: 'Rp 24.242.100', bruto: 'Rp 25.518.000', personil: 3, oleh: App.state.user.Nama, jumlah: 'Rp 13.469.100', rekening: 'Bankaltimtara 1234567890', persen: 5, alasan: 'Revisi nama kegiatan', template: 'Kwitansi', error: 'contoh', emailLogin: 'budi@kutaitimurkab.go.id', sandi: 'Abc123xyz', role: 'Koordinator PPTK', tanggal: '10 Januari 2026' };
      const pv = (i) => { const e = $('#pv-' + i, c); if (e) e.innerHTML = esc(String(cfg.matriks[i].pesan).replace(/\{(\w+)\}/g, (m, k) => (sampel[k] != null ? sampel[k] : m))).replace(/\*([^*\n]+)\*/g, '<b>$1</b>'); };
      const bindCfg = () => {
        $('#c-wa', c).onchange = (e) => { cfg.waAktif = e.target.checked; $('#c-wa-l', c).textContent = cfg.waAktif ? 'AKTIF' : 'NONAKTIF'; $$('[data-mw]', c).forEach((x) => (x.disabled = !cfg.waAktif)); };
        $('#c-em', c).onchange = (e) => { cfg.emailAktif = e.target.checked; $('#c-em-l', c).textContent = cfg.emailAktif ? 'AKTIF' : 'NONAKTIF'; $$('[data-me]', c).forEach((x) => (x.disabled = !cfg.emailAktif)); };
        $$('#c-batch [data-b]', c).forEach((b) => (b.onclick = () => { cfg.batchDefault = +b.dataset.b; $$('#c-batch button', c).forEach((x) => x.classList.toggle('on', x === b)); }));
        $$('[data-mw]', c).forEach((x) => (x.onchange = () => (cfg.matriks[+x.dataset.mw].wa = x.checked)));
        $$('[data-me]', c).forEach((x) => (x.onchange = () => (cfg.matriks[+x.dataset.me].email = x.checked)));
        $$('[data-ed]', c).forEach((b) => (b.onclick = () => { simpanForm(); buka = buka === +b.dataset.ed ? null : +b.dataset.ed; draw(); if (buka !== null) pv(buka); }));
        $$('[data-msg]', c).forEach((t) => (t.oninput = () => { cfg.matriks[+t.dataset.msg].pesan = t.value; pv(+t.dataset.msg); }));
        $$('[data-sub]', c).forEach((t) => (t.oninput = () => (cfg.matriks[+t.dataset.sub].subjek = t.value)));
        $$('[data-rst]', c).forEach((b) => (b.onclick = () => { const m = cfg.matriks[+b.dataset.rst]; m.pesan = m.pesanDefault; m.subjek = m.subjekDefault; draw(); pv(+b.dataset.rst); }));
        if ($('#c-deltok', c)) $('#c-deltok', c).onclick = async () => { if (!(await UI.confirm('Hapus token Fonnte?', 'WhatsApp akan dinonaktifkan.', 'Hapus', true))) return; cfg = await API.call('notif.configSave', { token: '__HAPUS__', waAktif: false }, { toast: true }); draw(); };
        $('#c-dev', c).onclick = (e) => UI.act(e.currentTarget, async () => { const d = await API.call('wa.device'); $('#c-devr', c).innerHTML = '<span class="badge ' + (d.status === 'connect' ? 'ok' : 'err') + '">' + esc(d.device) + ' · ' + esc(d.status) + '</span> <span class="mono xs">paket ' + esc(d.paket) + ' · kuota ' + esc(d.kuota) + ' · s.d. ' + esc(d.expired) + '</span>'; });
        $('#c-twa', c).onclick = (e) => UI.act(e.currentTarget, () => API.call('wa.test', { nomor: $('#c-tnum', c).value }, { toast: true }));
        $('#c-tem', c).onclick = (e) => UI.act(e.currentTarget, () => API.call('email.test', { email: $('#c-temail', c).value }, { toast: true }));
        $('#c-save', c).onclick = (e) => UI.act(e.currentTarget, async () => {
          simpanForm();
          const tok = $('#c-tok', c).value.trim();
          cfg = await API.call('notif.configSave', { token: tok, waAktif: cfg.waAktif, emailAktif: cfg.emailAktif, batchDefault: cfg.batchDefault, jeda: $('#c-jeda', c).value.trim(), deteksiOtomatis: $('#c-det', c).checked,
            namaPengirim: $('#c-nama', c).value.trim(), appUrl: $('#c-url', c).value.trim(), matriks: cfg.matriks }, { toast: true });
          App.state.settings.NOTIF_WA_AKTIF = cfg.waAktif ? 'YA' : 'TIDAK'; App.state.settings.NOTIF_EMAIL_AKTIF = cfg.emailAktif ? 'YA' : 'TIDAK';
          buka = null; draw();
        });
      };
      const simpanForm = () => { if (!$('#c-jeda', c)) return; cfg.jeda = $('#c-jeda', c).value.trim(); cfg.namaPengirim = $('#c-nama', c).value; cfg.appUrl = $('#c-url', c).value; cfg.deteksiOtomatis = $('#c-det', c).checked; };
      draw();
    };
    shell();
  }
};
