/* Master Pegawai (US-03) */
Pages.pegawai = {
  title: 'Master Pegawai', crumb: ['Setup Admin', 'Master Pegawai'], izin: 'master_pegawai',
  async render(el, p, q, alive) {
    const { icon, esc, $, $$ } = UI;
    let rows = await API.call('pegawai.list', { semua: true });
    if (!alive()) return;
    const f = { cari: '', status: 'Aktif', hal: 1, per: 15 };
    const shell = () => {
      el.innerHTML = pageHead({ bc: [['Dashboard', '#/dashboard'], 'Setup Admin', 'Master Pegawai'], title: 'Master Pegawai',
        sub: 'Database pegawai (Nama, NIP, rekening, NPWP, WhatsApp) — dipilih otomatis saat input rincian SPJ. NIP & nomor rekening tidak boleh ganda; penghapusan bersifat nonaktif (riwayat tetap ada).',
        actions: '<button class="btn btn-ghost" id="tplx">' + icon('download') + 'Template Excel</button><button class="btn btn-ghost" id="imp">' + icon('upload') + 'Import Excel</button><button class="btn btn-ghost" id="exp">' + icon('sheet') + 'Ekspor</button><button class="btn btn-primary" id="add">' + icon('userPlus') + '+ Tambah Pegawai</button>' }) +
        '<div class="grid g4" id="kpi"></div>' +
        '<div class="card mt-16"><div class="card-head"><div class="row wrap grow"><div class="affix" style="width:min(360px,100%)"><span class="pre">' + icon('search', 'sm') + '</span><input id="cari" placeholder="Cari nama / NIP / rekening / WA"></div>' +
        '<div class="seg" id="st">' + ['Aktif', 'Nonaktif', 'Semua'].map((s) => '<button data-s="' + s + '" class="' + (f.status === s ? 'on' : '') + '">' + s + '</button>').join('') + '</div></div></div>' +
        '<div class="tbl-wrap"><table class="tbl"><thead><tr><th>Pegawai</th><th>NIP</th><th>Gol</th><th>Rekening</th><th>NPWP</th><th>WhatsApp</th><th>Email</th><th>Status</th><th></th></tr></thead><tbody id="tb"></tbody></table></div><div class="pager" id="pg"></div></div>';
      $('#cari', el).oninput = UI.debounce((e) => { f.cari = e.target.value.toLowerCase(); f.hal = 1; draw(); }, 250);
      $$('#st [data-s]', el).forEach((b) => (b.onclick = () => { f.status = b.dataset.s; f.hal = 1; $$('#st button', el).forEach((x) => x.classList.toggle('on', x === b)); draw(); }));
      $('#add', el).onclick = () => form();
      $('#exp', el).onclick = () => UI.exportXlsx('Master_Pegawai_' + UI.today() + '.xlsx', [{ nama: 'Pegawai', rows: rows.map((x) => ({ Nama: x.Nama, NIP: x.NIP, Golongan: x.Golongan, Jabatan: x.Jabatan, NoRekening: x.NoRekening, Bank: x.Bank, NPWP: x.NPWP, NoHP: x.NoHP, Email: x.Email, Status: x.Status, StatusWA: x.StatusWA })) }]);
      $('#tplx', el).onclick = () => UI.exportXlsx('Template_Import_Pegawai.xlsx', [{ nama: 'Pegawai', rows: [{ Nama: 'Contoh Nama, S.E.', NIP: '198201012006041001', Golongan: 'III/a', Jabatan: 'Auditor', NoRekening: '1234567890', Bank: 'Bankaltimtara', NPWP: '', NoHP: '081234567890', Email: '' }] }]);
      $('#imp', el).onclick = importExcel;
      draw();
    };
    const draw = () => {
      const aktif = rows.filter((x) => x.Status !== 'Nonaktif');
      $('#kpi', el).innerHTML = [['Pegawai Aktif', aktif.length, 'users'], ['Nonaktif (soft-delete)', rows.length - aktif.length, 'archive'], ['WA Terverifikasi', aktif.filter((x) => x.StatusWA === 'Terdaftar').length, 'chat'], ['Tanpa No. Rekening', aktif.filter((x) => !x.NoRekening).length, 'alert']]
        .map((k) => '<div class="card kpi"><div class="lbl"><span>' + k[0] + '</span><span class="ico">' + icon(k[2]) + '</span></div><div class="val">' + k[1] + '</div></div>').join('');
      let v = rows.filter((x) => f.status === 'Semua' || (f.status === 'Aktif' ? x.Status !== 'Nonaktif' : x.Status === 'Nonaktif'));
      if (f.cari) v = v.filter((x) => [x.Nama, x.NIP, x.NoRekening, x.NoHP, x.Email, x.Jabatan].join(' ').toLowerCase().indexOf(f.cari) > -1);
      v.sort((a, b) => a.Nama.localeCompare(b.Nama));
      const page = v.slice((f.hal - 1) * f.per, f.hal * f.per);
      $('#tb', el).innerHTML = page.length ? page.map((x) => '<tr class="' + (x.Status === 'Nonaktif' ? 'dim' : '') + '"><td><div class="row"><span class="avatar">' + esc(UI.inisial(x.Nama)) + '</span><div><div class="b">' + esc(x.Nama) + '</div><div class="small muted">' + esc(x.Jabatan || '-') + '</div></div></div></td>' +
        '<td class="mono small nowrap">' + UI.nip(x.NIP) + '</td><td><span class="badge navy-outline">' + esc(x.Golongan || '-') + '</span></td><td class="mono small">' + esc(x.NoRekening || '—') + '<div class="xs muted">' + esc(x.Bank || '') + '</div></td><td class="mono xs">' + esc(x.NPWP || '—') + '</td>' +
        '<td class="nowrap">' + (x.NoHP ? '<span class="mono small">' + esc(x.NoHP) + '</span> ' + UI.waBadge(x.StatusWA) : '<span class="faint">—</span>') + '</td><td class="small">' + esc(x.Email || '—') + '</td><td>' + UI.badge(x.Status || 'Aktif') + '</td>' +
        '<td class="nowrap"><button class="btn btn-ghost btn-icon btn-sm" data-ed="' + x.PegawaiID + '" title="Edit">' + icon('edit', 'sm') + '</button> <button class="btn btn-ghost btn-sm" data-st="' + x.PegawaiID + '">' + (x.Status === 'Nonaktif' ? 'Aktifkan' : 'Nonaktifkan') + '</button></td></tr>').join('')
        : '<tr><td colspan="9">' + UI.empty('Tidak ada pegawai.', 'users') + '</td></tr>';
      $('#pg', el).innerHTML = '<span class="small muted">Menampilkan ' + page.length + ' dari ' + v.length + ' pegawai</span>' + UI.pager(v.length, f.hal, f.per, (h) => { f.hal = h; draw(); });
      $$('[data-ed]', el).forEach((b) => (b.onclick = () => form(rows.find((x) => x.PegawaiID === b.dataset.ed))));
      $$('[data-st]', el).forEach((b) => (b.onclick = async () => {
        const x = rows.find((r) => r.PegawaiID === b.dataset.st); const ke = x.Status === 'Nonaktif' ? 'Aktif' : 'Nonaktif';
        if (ke === 'Nonaktif' && !(await UI.confirm('Nonaktifkan pegawai?', x.Nama + ' tidak akan muncul di pilihan rincian SPJ baru. Riwayat SPJ lama tetap tersimpan.', 'Nonaktifkan', true))) return;
        await API.call('pegawai.setStatus', { pegawaiId: x.PegawaiID, status: ke }, { toast: true }); x.Status = ke; Master.clear('pgw'); draw();
      }));
    };
    const form = (x) => {
      x = x || {};
      UI.modal({ title: x.PegawaiID ? 'Edit pegawai' : 'Tambah pegawai', size: 'wide', body: '<div class="form-grid">' +
        fld('Nama lengkap & gelar', 'Nama', x.Nama, 'full', true) + fld('NIP (18 digit)', 'NIP', x.NIP, 'mono', true) + fld('Golongan / pangkat', 'Golongan', x.Golongan, '', false, 'III/a') +
        fld('Jabatan', 'Jabatan', x.Jabatan, 'full') + fld('No. rekening', 'NoRekening', x.NoRekening, 'mono') + fld('Bank', 'Bank', x.Bank, '', false, 'Bankaltimtara') +
        fld('NPWP', 'NPWP', x.NPWP, 'mono') + fld('No. WhatsApp', 'NoHP', x.NoHP, 'mono', false, '081234567890') + fld('Email', 'Email', x.Email, 'full') + '</div>',
        foot: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-navy" id="ok">Simpan</button>',
        onOpen: (m, close) => { $('#ok', m).onclick = (e) => UI.act(e.currentTarget, async () => {
          const data = { PegawaiID: x.PegawaiID || '', Status: x.Status || 'Aktif' }; $$('[data-k]', m).forEach((i) => (data[i.dataset.k] = i.value.trim()));
          const r = await API.call('pegawai.save', { pegawai: data }, { toast: true });
          const i = rows.findIndex((y) => y.PegawaiID === r.PegawaiID); if (i > -1) rows[i] = r; else rows.push(r);
          Master.clear('pgw'); close(); draw();
        }); } });
    };
    const fld = (lbl, k, v, cls, req, ph) => '<div class="field ' + (cls === 'full' ? 'full' : '') + '"><label>' + lbl + (req ? '<span class="req">*</span>' : '') + '</label><input class="input ' + (cls === 'mono' ? 'mono' : '') + '" data-k="' + k + '" value="' + esc(v || '') + '" placeholder="' + esc(ph || '') + '"></div>';
    const importExcel = async () => {
      const [file] = await UI.pickFile('.xlsx,.xls,.csv'); if (!file) return;
      let data;
      try { const wb = await UI.readWorkbook(file); data = UI.rowsToObjects(Object.values(wb)[0]); } catch (e) { return UI.toast(e.message, 'err'); }
      const alias = { Nama: ['nama', 'namalengkap', 'namapegawai'], NIP: ['nip'], Golongan: ['golongan', 'gol', 'golpkt', 'pangkatgol'], Jabatan: ['jabatan'], NoRekening: ['norekening', 'rekening', 'nomorrekening'], Bank: ['bank', 'namabank'], NPWP: ['npwp'], NoHP: ['nohp', 'hp', 'wa', 'whatsapp', 'nowa', 'telepon'], Email: ['email', 'surel'], Status: ['status'] };
      const rowsIn = data.map((o) => { const out = {}; Object.keys(o).forEach((k) => { const n = k.toLowerCase().replace(/[^a-z]/g, ''); Object.keys(alias).forEach((a) => { if (alias[a].includes(n)) out[a] = String(o[k]).trim(); }); }); return out; }).filter((r) => r.Nama || r.NIP);
      if (!rowsIn.length) return UI.toast('Tidak ada baris yang dikenali. Pastikan header memuat Nama & NIP.', 'err');
      const dry = await API.call('pegawai.import', { rows: rowsIn, dryRun: true });
      const go = await UI.modal({ title: 'Pratinjau import pegawai', body: '<div class="grid g3"><div class="card kpi"><div class="lbl">Baru</div><div class="val" style="color:var(--ok)">' + dry.ditambah + '</div></div><div class="card kpi"><div class="lbl">Diperbarui</div><div class="val" style="color:var(--info)">' + dry.diperbarui + '</div></div><div class="card kpi"><div class="lbl">Error</div><div class="val" style="color:var(--err)">' + dry.errors.length + '</div></div></div>' +
        (dry.errors.length ? '<div class="alert err mt-16"><div class="ic">' + icon('alert') + '</div><div class="small">' + dry.errors.map(esc).join('<br>') + '</div></div>' : '') + '<div class="hint mt-16">Kunci pencocokan: NIP. Baris error dilewati. Belum ada data yang ditulis.</div>',
        foot: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-navy" data-close="go" ' + (dry.ditambah + dry.diperbarui ? '' : 'disabled') + '>Jalankan Import</button>' });
      if (go !== 'go') return;
      await API.call('pegawai.import', { rows: rowsIn }, { toast: true });
      rows = await API.call('pegawai.list', { semua: true }); Master.clear('pgw'); draw();
    };
    shell();
  }
};

/* Master Kode Rekening (US-04) */
Pages.rekening = {
  title: 'Kode Rekening', crumb: ['Setup Admin', 'Master Kode Rekening'], izin: 'master_rekening',
  async render(el, p, q, alive) {
    const { icon, esc, rp, $, $$ } = UI;
    let rows = await API.call('rekening.list', { semua: true });
    if (!alive()) return;
    const ta = String(App.state.settings.TAHUN_ANGGARAN);
    let tahun = ta;
    const draw = () => {
      const tahunList = Array.from(new Set(rows.map((r) => String(r.TahunAnggaran)).concat([ta]))).sort().reverse();
      const v = rows.filter((r) => String(r.TahunAnggaran) === tahun);
      const tp = v.filter((r) => r.Status !== 'Nonaktif').reduce((a, r) => a + r.Pagu, 0), tr = v.filter((r) => r.Status !== 'Nonaktif').reduce((a, r) => a + r.Realisasi, 0);
      el.innerHTML = pageHead({ bc: [['Dashboard', '#/dashboard'], 'Setup Admin', 'Kode Rekening'], title: 'Master Kode Rekening (DPA-SKPD)', sub: 'Daftar kode rekening belanja per tahun anggaran — dasar breakdown BKU, NPD, dan laporan realisasi. Penghapusan bersifat nonaktif.',
        actions: '<select class="input" id="ta" style="width:120px">' + tahunList.map((t) => '<option ' + (t === tahun ? 'selected' : '') + '>' + t + '</option>').join('') + '</select><button class="btn btn-primary" id="add">' + icon('plusCircle') + '+ Tambah Kode Rekening</button>' }) +
        '<div class="grid g3"><div class="card kpi"><div class="lbl">Total Pagu TA ' + esc(tahun) + '</div><div class="val money">' + rp(tp) + '</div></div><div class="card kpi"><div class="lbl">Realisasi (Completed+)</div><div class="val money">' + rp(tr) + '</div><div class="foot">' + UI.bar(UI.persen(tr, tp), 'grad') + '</div></div><div class="card kpi"><div class="lbl">Sisa Pagu</div><div class="val money" style="color:var(--ok)">' + rp(tp - tr) + '</div></div></div>' +
        '<div class="card mt-16"><div class="tbl-wrap"><table class="tbl"><thead><tr><th>Kode Rekening</th><th>Uraian Belanja</th><th>Sub Kegiatan / Bidang</th><th class="num">Pagu</th><th class="num">Realisasi</th><th class="num">Sisa</th><th style="width:140px">Serapan</th><th>Status</th><th></th></tr></thead><tbody>' +
        (v.length ? v.map((r) => '<tr class="' + (r.Status === 'Nonaktif' ? 'dim' : '') + '"><td class="code">' + esc(r.KodeRekening) + '</td><td class="b">' + esc(r.Uraian) + '</td><td class="small">' + esc(r.SubKegiatan || '-') + '<div class="xs muted">' + esc(r.Bidang || '') + '</div></td>' +
          '<td class="num">' + rp(r.Pagu) + '</td><td class="num">' + rp(r.Realisasi) + '</td><td class="num" style="color:' + (r.Sisa < 0 ? 'var(--err)' : 'var(--ok)') + '">' + rp(r.Sisa) + '</td><td><div class="mono xs">' + String(r.Persen).replace('.', ',') + '%</div>' + UI.bar(r.Persen) + '</td><td>' + UI.badge(r.Status || 'Aktif') + '</td>' +
          '<td class="nowrap"><button class="btn btn-ghost btn-icon btn-sm" data-ed="' + r.RekeningID + '">' + icon('edit', 'sm') + '</button> <button class="btn btn-ghost btn-sm" data-st="' + r.RekeningID + '">' + (r.Status === 'Nonaktif' ? 'Aktifkan' : 'Nonaktifkan') + '</button></td></tr>').join('')
          : '<tr><td colspan="9">' + UI.empty('Belum ada kode rekening untuk TA ' + esc(tahun) + '.', 'wallet') + '</td></tr>') + '</tbody></table></div></div>';
      $('#ta', el).onchange = (e) => { tahun = e.target.value; draw(); };
      $('#add', el).onclick = () => form({ TahunAnggaran: tahun });
      $$('[data-ed]', el).forEach((b) => (b.onclick = () => form(rows.find((r) => r.RekeningID === b.dataset.ed))));
      $$('[data-st]', el).forEach((b) => (b.onclick = async () => { const r = rows.find((x) => x.RekeningID === b.dataset.st); const ke = r.Status === 'Nonaktif' ? 'Aktif' : 'Nonaktif'; await API.call('rekening.setStatus', { rekeningId: r.RekeningID, status: ke }, { toast: true }); r.Status = ke; Master.clear('rek'); draw(); }));
    };
    const form = (x) => {
      UI.modal({ title: x.RekeningID ? 'Edit kode rekening' : 'Tambah kode rekening', size: 'wide', body: '<div class="form-grid">' +
        '<div class="field full"><label>Kode rekening<span class="req">*</span></label><input class="input mono" data-k="KodeRekening" value="' + esc(x.KodeRekening || '') + '" placeholder="6.01.02.2.01.0002.5.1.02.04.01.00003"><div class="hint mono">Format angka dipisah titik</div></div>' +
        '<div class="field full"><label>Uraian belanja<span class="req">*</span></label><input class="input" data-k="Uraian" value="' + esc(x.Uraian || '') + '" placeholder="Belanja Perjalanan Dinas Dalam Daerah"></div>' +
        '<div class="field"><label>Sub kegiatan</label><input class="input" data-k="SubKegiatan" value="' + esc(x.SubKegiatan || '') + '"></div><div class="field"><label>Bidang / wilayah</label><input class="input" data-k="Bidang" value="' + esc(x.Bidang || '') + '" placeholder="Inspektur Pembantu Wilayah II"></div>' +
        '<div class="field"><label>Pagu anggaran (Rp)</label><div class="affix"><span class="pre">Rp</span><input class="mono" data-k="Pagu" id="pagu" value="' + UI.angka(x.Pagu || 0) + '"></div></div><div class="field"><label>Tahun anggaran</label><input class="input mono" data-k="TahunAnggaran" value="' + esc(x.TahunAnggaran || ta) + '"></div></div>',
        foot: '<button class="btn btn-ghost" data-close>Batal</button><button class="btn btn-navy" id="ok">Simpan</button>',
        onOpen: (m, close) => {
          UI.bindAngka($('#pagu', m));
          $('#ok', m).onclick = (e) => UI.act(e.currentTarget, async () => {
            const d = { RekeningID: x.RekeningID || '', Status: x.Status || 'Aktif' }; $$('[data-k]', m).forEach((i) => (d[i.dataset.k] = i.value.trim())); d.Pagu = UI.parseAngka(d.Pagu);
            await API.call('rekening.save', { rekening: d }, { toast: true }); rows = await API.call('rekening.list', { semua: true }); Master.clear('rek'); close(); draw();
          });
        } });
    };
    draw();
  }
};
