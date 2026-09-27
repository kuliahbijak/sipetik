/* CRM Kontak — Nama · Email · WhatsApp seluruh pegawai & pengguna */
Pages.crm = {
  title: 'CRM Kontak', crumb: ['Komunikasi', 'CRM Kontak'], izin: 'crm_view',
  async render(el, p, q, alive) {
    const { icon, esc, $, $$ } = UI;
    const kelola = App.can('crm_manage');
    const f = { cari: '', segmen: '', sumber: '', tag: '', statusWA: '', emailValid: '', optOut: '', duplikat: false, masalah: false, halaman: 1, per: 50 };
    const pilih = new Set();
    let st = null, d = null;
    const shell = () => {
      el.innerHTML = pageHead({ bc: [['Dashboard', '#/dashboard'], 'Komunikasi', 'CRM Kontak'], title: 'CRM Kontak',
        sub: 'Satu layar untuk memantau seluruh kontak — <b>Nama · Email · WhatsApp</b> — dari Master Pegawai &amp; Pengguna Sistem: kualitas data, status WhatsApp, riwayat dihubungi, segmen &amp; tag.',
        actions: (kelola ? '<button class="btn btn-ghost" id="sync">' + icon('refresh') + 'Sinkron Sekarang</button><button class="btn btn-ghost" id="imp">' + icon('upload') + 'Import CSV</button><button class="btn btn-ghost" id="dup">' + icon('merge') + 'Periksa Duplikat</button><button class="btn btn-ghost" id="exp">' + icon('download') + 'Ekspor</button>' : '') }) +
        '<div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(160px,1fr))" id="kpi"></div>' +
        '<div class="mono xs muted mt-8" id="synct"></div>' +
        '<div class="row wrap mt-16" id="segs"></div>' +
        '<div class="card mt-16"><div class="card-body row wrap" style="gap:10px;padding:14px 16px"><div class="affix grow" style="min-width:220px"><span class="pre">' + icon('search', 'sm') + '</span><input id="cari" placeholder="Cari nama, email, nomor, tag, NIP…"></div>' +
          '<select class="input" id="f-src" style="width:auto"><option value="">Semua sumber</option><option value="pegawai">Master Pegawai</option><option value="pengguna">Pengguna Sistem</option><option value="manual">Import manual</option></select>' +
          '<select class="input" id="f-wa" style="width:auto"><option value="">Status WA: semua</option><option>Terdaftar</option><option>Tidak Terdaftar</option><option value="Belum">Belum dicek</option></select>' +
          '<select class="input" id="f-em" style="width:auto"><option value="">Email: semua</option><option value="YA">Email valid</option><option value="TIDAK">Tanpa / tidak valid</option></select>' +
          '<select class="input" id="f-tag" style="width:auto"><option value="">Semua tag</option></select>' +
          '<label class="check small"><input type="checkbox" id="f-mas">Hanya bermasalah</label></div></div>' +
        '<div id="bulk" class="mt-16"></div>' +
        '<div class="card mt-16"><div class="tbl-wrap"><table class="tbl"><thead><tr><th style="width:40px"><input type="checkbox" class="check" id="all"></th><th>Kontak</th><th>Email</th><th>WhatsApp</th><th>Tag</th><th>Terakhir Dihubungi</th><th class="num">Pesan</th><th></th></tr></thead><tbody id="tb"></tbody></table></div><div class="pager" id="pg"></div></div>';
      bindShell();
    };
    const loadStats = async () => {
      st = await API.call('crm.stats', {}, { silent: true });
      const K = [['Total Kontak', st.total, 'idcard', {}], ['WA Terverifikasi', st.terdaftarWA, 'chat', { statusWA: 'Terdaftar' }], ['Email Valid', st.emailValid, 'mail', { emailValid: 'YA' }], ['Belum Dicek WA', st.belumCekWA, 'phoneSm', { statusWA: 'Belum' }], ['Opt-out', st.optOut, 'xCircle', { optOut: 'YA' }], ['Duplikat', st.duplikat, 'merge', { duplikat: true }]];
      $('#kpi', el).innerHTML = K.map((k, i) => '<div class="card kpi click" data-k="' + i + '"><div class="lbl"><span>' + k[0] + '</span><span class="ico">' + icon(k[2]) + '</span></div><div class="val">' + UI.angka(k[1]) + '</div>' + (i === 0 ? '<div class="foot">+' + st.baru7 + ' baru 7 hari • ' + st.dihubungi30 + ' dihubungi 30 hari</div>' : i === 5 ? '<div class="foot">' + st.tidakBisaDihubungi + ' tidak bisa dihubungi</div>' : '') + '</div>').join('');
      $$('[data-k]', el).forEach((c) => (c.onclick = () => { Object.assign(f, { statusWA: '', emailValid: '', optOut: '', duplikat: false, masalah: false, halaman: 1 }, K[+c.dataset.k][3]); syncForm(); load(); }));
      $('#synct', el).innerHTML = icon('clock', 'sm') + ' Sinkron terakhir: ' + (st.syncTerakhir ? UI.waktu(st.syncTerakhir) : 'belum pernah') + ' — otomatis tiap 30 menit via trigger.';
    };
    const syncForm = () => { $('#f-wa', el).value = f.statusWA; $('#f-em', el).value = f.emailValid; $('#f-src', el).value = f.sumber; $('#f-mas', el).checked = f.masalah; };
    const load = async () => {
      $('#tb', el).innerHTML = '<tr><td colspan="8">' + UI.loadingBlock() + '</td></tr>';
      d = await API.call('crm.list', f);
      if (!alive()) return;
      draw();
    };
    const draw = () => {
      $('#segs', el).innerHTML = '<button class="chip ' + (!f.segmen ? 'on' : '') + '" data-seg="">Semua <span class="n">' + UI.angka(Object.values(d.facet.segmen).reduce((a, b) => a + b, 0)) + '</span></button>' +
        Object.keys(d.facet.segmen).map((s) => '<button class="chip ' + (f.segmen === s ? 'on' : '') + '" data-seg="' + esc(s) + '">' + esc(s) + ' <span class="n">' + UI.angka(d.facet.segmen[s]) + '</span></button>').join('');
      $$('[data-seg]', el).forEach((b) => (b.onclick = () => { f.segmen = b.dataset.seg; f.halaman = 1; load(); }));
      const tg = $('#f-tag', el), cur = f.tag;
      tg.innerHTML = '<option value="">Semua tag</option>' + Object.keys(d.facet.tag).map((t) => '<option ' + (cur === t ? 'selected' : '') + '>' + esc(t) + '</option>').join('');
      $('#tb', el).innerHTML = d.rows.length ? d.rows.map((k) => '<tr class="' + (k.masalah.length ? 'warn' : '') + (pilih.has(k.KontakID) ? ' sel' : '') + '">' +
        '<td><input type="checkbox" class="check" data-ck="' + k.KontakID + '" ' + (pilih.has(k.KontakID) ? 'checked' : '') + '></td>' +
        '<td><div class="row"><span class="avatar">' + esc(UI.inisial(k.Nama)) + '</span><div><a href="javascript:void 0" class="b" style="color:var(--text)" data-det="' + k.KontakID + '">' + esc(k.Nama) + '</a><div class="row wrap"><span class="pill-tag">' + esc(k.Segmen) + '</span>' + (k.Info.Jabatan ? '<span class="xs muted">' + esc(k.Info.Jabatan) + '</span>' : '') + (k.OptOut === 'YA' ? '<span class="badge err">opt-out</span>' : '') + (k.duplikat ? '<span class="badge draft">duplikat</span>' : '') + '</div></div></div></td>' +
        '<td class="small">' + (k.Email ? esc(k.Email) + ' <span style="color:' + (k.EmailValid === 'YA' ? 'var(--ok)' : 'var(--warn)') + '">' + icon(k.EmailValid === 'YA' ? 'checkCircle' : 'alert', 'sm') + '</span>' : '<span class="faint">—</span>') + '</td>' +
        '<td class="nowrap">' + (k.NoWA ? '<span class="mono small">' + esc(k.NoWA) + '</span> ' + (k.waValid ? UI.waBadge(k.StatusWA) + ' <a href="https://wa.me/' + esc(k.NoWA.replace(/^0/, '62')) + '" target="_blank" rel="noopener" title="Buka WhatsApp">' + icon('external', 'sm') + '</a>' : '<span class="wa-badge tidak">tidak valid</span>') : '<span class="faint">—</span>') + '</td>' +
        '<td>' + String(k.Tag || '').split(',').filter(Boolean).map((t) => '<span class="pill-tag">' + esc(t) + '</span>').join('') + '</td>' +
        '<td class="mono xs">' + (k.TerakhirDihubungi ? UI.waktu(k.TerakhirDihubungi) : '<span class="faint">—</span>') + '</td><td class="num mono">' + (k.JumlahPesan || 0) + '</td>' +
        '<td><button class="btn btn-ghost btn-sm" data-det="' + k.KontakID + '">Detail</button></td></tr>').join('') : '<tr><td colspan="8">' + UI.empty('Tidak ada kontak.' + (kelola ? ' Klik <b>Sinkron Sekarang</b>.' : ''), 'idcard') + '</td></tr>';
      $('#pg', el).innerHTML = '<span class="small muted">' + UI.angka(d.total) + ' kontak</span>' + UI.pager(d.total, d.halaman, d.per, (h) => { f.halaman = h; load(); });
      $$('[data-ck]', el).forEach((c) => (c.onchange = () => { c.checked ? pilih.add(c.dataset.ck) : pilih.delete(c.dataset.ck); c.closest('tr').classList.toggle('sel', c.checked); drawBulk(); }));
      $$('[data-det]', el).forEach((a) => (a.onclick = () => detail(a.dataset.det)));
      $('#all', el).checked = d.rows.length && d.rows.every((k) => pilih.has(k.KontakID));
      drawBulk();
    };
    const drawBulk = () => {
      const box = $('#bulk', el);
      if (!pilih.size) { box.innerHTML = ''; return; }
      box.innerHTML = '<div class="bulkbar"><span class="ck">' + icon('check', 'sm') + '</span><b>' + pilih.size + ' kontak dipilih</b><button class="btn-link small" id="bsem">Pilih semua ' + UI.angka(d.total) + ' hasil filter</button><span class="grow"></span>' +
        (App.can(['blast', 'crm_manage']) ? '<button class="btn btn-ghost btn-sm" data-b="deteksiWA">' + icon('phoneSm', 'sm') + 'Deteksi WA</button>' : '') +
        (kelola ? '<button class="btn btn-ghost btn-sm" data-b="tag">' + icon('tag', 'sm') + 'Beri Tag</button><button class="btn btn-ghost btn-sm" data-b="untag">Hapus Tag</button><button class="btn btn-ghost btn-sm" data-b="optout">' + icon('xCircle', 'sm') + 'Opt-out</button><button class="btn btn-ghost btn-sm" data-b="optin">Opt-in</button>' : '') +
        (App.can('blast') ? '<button class="btn btn-navy btn-sm" id="bblast">' + icon('send', 'sm') + 'Blast ke Terpilih</button>' : '') + '<button class="btn-link" id="bclr">Batal</button></div>';
      $('#bclr', box).onclick = () => { pilih.clear(); draw(); };
      $('#bsem', box).onclick = async () => { const x = await API.call('crm.list', Object.assign({}, f, { semuaId: true, per: 1, halaman: 1 })); x.semuaId.forEach((i) => pilih.add(i)); draw(); };
      if ($('#bblast', box)) $('#bblast', box).onclick = () => { try { sessionStorage.setItem('sipetik_blast_ids', JSON.stringify(Array.from(pilih))); } catch (e) {} App.go('#/notifikasi?tab=blast'); };
      $$('[data-b]', box).forEach((b) => (b.onclick = () => UI.act(b, async () => {
        const aksi = b.dataset.b; let nilai = '';
        if (aksi === 'tag' || aksi === 'untag') { nilai = await UI.prompt(aksi === 'tag' ? 'Beri tag' : 'Hapus tag', 'Nama tag', { placeholder: 'mis. Tim Wilayah II', ok: 'Terapkan' }); if (!nilai) return; }
        const ids = Array.from(pilih);
        if (aksi === 'deteksiWA') { for (let i = 0; i < ids.length; i += 50) await API.call('crm.bulk', { ids: ids.slice(i, i + 50), aksi }, { toast: true }); }
        else await API.call('crm.bulk', { ids, aksi, nilai }, { toast: true });
        await Promise.all([load(), loadStats()]);
      })));
    };
    const detail = async (id) => {
      let x = await API.call('crm.detail', { kontakId: id });
      const body = () => { const k = x.kontak; return '<div class="row gap-lg"><span class="avatar" style="width:52px;height:52px;font-size:16px;background:var(--navy);color:#fff">' + esc(UI.inisial(k.Nama)) + '</span><div class="grow"><div class="bb" style="font-size:17px">' + esc(k.Nama) + '</div><div class="row wrap"><span class="pill-tag">' + esc(k.Segmen) + '</span><span class="mono xs muted">' + esc(k.KontakID) + ' • sumber ' + esc(k.Sumber) + '</span></div></div></div>' +
        '<div class="row wrap mt-16">' + (k.waValid ? '<a class="btn btn-success btn-sm" href="https://wa.me/' + esc(k.NoWA.replace(/^0/, '62')) + '" target="_blank" rel="noopener">' + icon('chat', 'sm') + 'WhatsApp</a>' : '') + (k.Email ? '<a class="btn btn-ghost btn-sm" href="mailto:' + esc(k.Email) + '">' + icon('mail', 'sm') + 'Email</a>' : '') + (k.NoWA ? '<button class="btn btn-ghost btn-sm" id="d-cp">' + icon('copy', 'sm') + 'Salin nomor</button>' : '') + '</div>' +
        '<div class="form-grid mt-16"><div class="field"><label>Nama</label><input class="input" id="d-nama" value="' + esc(k.Nama) + '" ' + (kelola ? '' : 'disabled') + '></div><div class="field"><label>WhatsApp ' + UI.waBadge(k.StatusWA) + '</label><input class="input mono" id="d-wa" value="' + esc(k.NoWA) + '" ' + (kelola ? '' : 'disabled') + '></div>' +
        '<div class="field full"><label>Email</label><input class="input" id="d-em" value="' + esc(k.Email) + '" ' + (kelola ? '' : 'disabled') + '></div>' +
        '<div class="field full"><label>Tag (pisahkan koma)</label><input class="input" id="d-tag" value="' + esc(k.Tag) + '" ' + (kelola ? '' : 'disabled') + '></div>' +
        '<div class="field full"><label>Catatan</label><textarea class="input" id="d-cat" rows="2" ' + (kelola ? '' : 'disabled') + '>' + esc(k.Catatan) + '</textarea></div>' +
        '<label class="switch full"><input type="checkbox" id="d-opt" ' + (k.OptOut === 'YA' ? 'checked' : '') + ' ' + (kelola ? '' : 'disabled') + '><span class="tr"></span><span class="small">Opt-out dari blast (notifikasi transaksional SPJ tetap dikirim)</span></label></div>' +
        (k.Sumber !== 'manual' ? '<div class="hint mt-8">' + icon('info', 'sm') + ' Perubahan Nama/Email/WA ditulis balik ke ' + (k.Sumber === 'pegawai' ? 'Master Pegawai' : 'data Pengguna') + ' (satu sumber kebenaran).</div>' : '') +
        (x.spj.length ? '<div class="mt-16"><div class="lbl-ui mb-8">Riwayat penerimaan SPJ</div>' + x.spj.map((s) => '<a class="file-row mt-8" href="#/spj/' + s.SPJID + '/dokumen" style="text-decoration:none;color:inherit"><span class="mono small grow">' + esc(s.NomorSPJ) + '<div class="xs muted">' + UI.tglPendek(s.TglSPJ) + '</div></span><span class="mono small">' + UI.rp(s.Bersih) + '</span>' + UI.badge(s.Status) + '</a>').join('') + '</div>' : '') +
        '<div class="mt-24"><div class="lbl-ui mb-8">Timeline interaksi</div>' + (kelola ? '<div class="row mb-16"><select class="input" id="i-kn" style="width:auto">' + ['Telepon', 'WA Manual', 'Kunjungan', 'Email Manual', 'Catatan'].map((o) => '<option>' + o + '</option>').join('') + '</select><input class="input" id="i-rg" placeholder="Ringkasan interaksi…"><button class="btn btn-navy btn-sm" id="i-ok">Catat</button></div>' : '') +
        '<div class="timeline">' + (x.timeline.length ? x.timeline.map((t) => '<div class="tl-item ' + t.jenis + '"><div class="row wrap"><span class="badge ' + (t.kanal === 'WA' ? 'wa' : t.kanal === 'EMAIL' ? 'info' : 'amber') + '">' + esc(t.kanal) + '</span><span class="mono xs muted">' + UI.waktu(t.waktu) + '</span>' + (t.status ? UI.badge(t.status) : '') + '<span class="xs muted">' + esc(t.oleh) + '</span></div><div class="small mt-8">' + esc(t.ringkasan) + '</div></div>').join('') : '<div class="small muted">Belum ada interaksi.</div>') + '</div></div>'; };
      UI.drawer({ title: 'Detail kontak', body: body(), foot: kelola ? '<button class="btn btn-ghost" data-x2>Tutup</button><button class="btn btn-navy" id="d-save">Simpan</button>' : '',
        onOpen: (m, close) => {
          const bindD = () => {
            if ($('#d-cp', m)) $('#d-cp', m).onclick = () => UI.copy(x.kontak.NoWA);
            if ($('#i-ok', m)) $('#i-ok', m).onclick = (e) => UI.act(e.currentTarget, async () => { x = await API.call('crm.interaksi', { kontakId: id, kanal: $('#i-kn', m).value, ringkasan: $('#i-rg', m).value }, { toast: true }); $('.modal-body', m).innerHTML = body(); bindD(); });
          };
          bindD();
          if ($('[data-x2]', m)) $('[data-x2]', m).onclick = () => close();
          if ($('#d-save', m)) $('#d-save', m).onclick = (e) => UI.act(e.currentTarget, async () => {
            const k = x.kontak, o = { KontakID: id, Tag: $('#d-tag', m).value, Catatan: $('#d-cat', m).value, OptOut: $('#d-opt', m).checked ? 'YA' : 'TIDAK' };
            if ($('#d-nama', m).value.trim() !== k.Nama) o.Nama = $('#d-nama', m).value.trim();
            if ($('#d-wa', m).value.trim() !== k.NoWA) o.NoWA = $('#d-wa', m).value.trim();
            if ($('#d-em', m).value.trim() !== k.Email) o.Email = $('#d-em', m).value.trim();
            x = await API.call('crm.save', { kontak: o }, { toast: true }); Master.clear('pgw'); close(); load(); loadStats();
          });
        } });
    };
    const bindShell = () => {
      $('#cari', el).oninput = UI.debounce((e) => { f.cari = e.target.value.trim(); f.halaman = 1; load(); }, 350);
      $('#f-src', el).onchange = (e) => { f.sumber = e.target.value; f.halaman = 1; load(); };
      $('#f-wa', el).onchange = (e) => { f.statusWA = e.target.value; f.halaman = 1; load(); };
      $('#f-em', el).onchange = (e) => { f.emailValid = e.target.value; f.halaman = 1; load(); };
      $('#f-tag', el).onchange = (e) => { f.tag = e.target.value; f.halaman = 1; load(); };
      $('#f-mas', el).onchange = (e) => { f.masalah = e.target.checked; f.halaman = 1; load(); };
      $('#all', el).onchange = (e) => { d.rows.forEach((k) => (e.target.checked ? pilih.add(k.KontakID) : pilih.delete(k.KontakID))); draw(); };
      if (!kelola) return;
      $('#sync', el).onclick = (e) => UI.act(e.currentTarget, async () => { await API.call('crm.sync', {}, { toast: true }); await Promise.all([load(), loadStats()]); });
      $('#exp', el).onclick = (e) => UI.act(e.currentTarget, async () => { const rows = await API.call('crm.export', f); await UI.exportXlsx('CRM_Kontak_' + UI.today() + '.xlsx', [{ nama: 'Kontak', rows }]); });
      $('#imp', el).onclick = async () => {
        const go = await UI.modal({ title: 'Import kontak (CSV / Excel)', body: '<p class="muted" style="margin-top:0">Untuk kontak di luar sistem (auditor eksternal, mitra, peserta sosialisasi). Kolom: <code>nama</code>, <code>wa</code>, <code>email</code>, <code>segmen</code>, <code>tag</code>, <code>instansi</code>. Kunci pencocokan: nomor WA (atau email).</p>',
          foot: '<button class="btn btn-ghost" data-close="tpl">' + icon('download', 'sm') + 'Unduh Template</button><button class="btn btn-navy" data-close="pick">' + icon('upload', 'sm') + 'Pilih Berkas</button>' });
        if (go === 'tpl') return UI.exportXlsx('Template_Import_Kontak.xlsx', [{ nama: 'Kontak', rows: [{ nama: 'Auditor BPKP Kaltim', wa: '081234567890', email: 'auditor@bpkp.go.id', segmen: 'Mitra', tag: 'Eksternal', instansi: 'BPKP' }] }]);
        if (go !== 'pick') return;
        const [file] = await UI.pickFile('.csv,.xlsx,.xls'); if (!file) return;
        try { const wb = await UI.readWorkbook(file); const rows = UI.rowsToObjects(Object.values(wb)[0]).map((o) => { const out = {}; Object.keys(o).forEach((k) => (out[k.toLowerCase().trim()] = o[k])); return out; });
          await API.call('crm.import', { rows }, { toast: true }); await Promise.all([load(), loadStats()]); } catch (e) {}
      };
      $('#dup', el).onclick = (e) => UI.act(e.currentTarget, async () => {
        const g = await API.call('crm.duplikat');
        UI.modal({ title: 'Kontak duplikat (' + g.length + ' grup)', size: 'wide', body: g.length ? g.map((x, gi) => '<div class="panel mb-16"><div class="row between mb-8"><b class="mono small">' + esc(x.jenis) + ': ' + esc(x.kunci) + '</b><button class="btn btn-navy btn-sm" data-merge="' + gi + '">' + icon('merge', 'sm') + 'Gabungkan</button></div>' +
          x.kontak.map((k, i) => '<label class="check small" style="display:flex;padding:4px 0"><input type="radio" name="u' + gi + '" value="' + k.KontakID + '" ' + (i === 0 ? 'checked' : '') + '><span><b>' + esc(k.Nama) + '</b> <span class="pill-tag">' + esc(k.Segmen) + '</span> <span class="mono xs muted">' + esc(k.KontakID) + ' • ' + esc(k.Email || '-') + ' • ' + k.JumlahPesan + ' pesan</span></span></label>').join('') + '<div class="hint">Pilih kontak utama; tag, catatan & jumlah pesan digabung.</div></div>').join('') : UI.empty('Tidak ada duplikat. Data kontak bersih.', 'checkCircle'),
          onOpen: (m, close) => $$('[data-merge]', m).forEach((b) => (b.onclick = () => UI.act(b, async () => { const grp = g[+b.dataset.merge]; const utama = $('input[name="u' + b.dataset.merge + '"]:checked', m).value; await API.call('crm.merge', { utama, gabung: grp.kontak.map((k) => k.KontakID).filter((i) => i !== utama) }, { toast: true }); close(); load(); loadStats(); }))) });
      });
    };
    shell();
    await Promise.all([loadStats(), load()]);
  }
};
