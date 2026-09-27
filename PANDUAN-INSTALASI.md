# 📋 Panduan Instalasi SIPETIK v1.0

**Sistem Informasi Pertanggungjawaban Teknis Kegiatan — Inspektorat Daerah Kabupaten Kutai Timur**

Arsitektur: **frontend statis di GitHub Pages** + **Google Apps Script (GAS) sebagai REST API JSON**. Database di Google Sheets, dokumen di Google Docs/Drive. Tidak memakai iframe atau `google.script.run`.

```
Browser (GitHub Pages)  ──fetch(text/plain JSON)──►  Apps Script Web App (/exec)
index.html · css/ · js/                              Kode.gs · Dokumen.gs · Notifikasi.gs · CRM.gs · Migrasi.gs
                                                     ▼
                                   Google Sheets (database) · Google Docs (template) · Drive (PDF & bukti)
                                   Gmail (email) · Fonnte (WhatsApp)
```

---

## Daftar berkas

| Berkas | Dipasang di | Keterangan |
|---|---|---|
| `Kode.gs` | Apps Script | Inti: router API, login, RBAC, SPJ, rincian, master, laporan, audit, setup |
| `Dokumen.gs` | Apps Script | Mesin template Google Docs → PDF, unduh ZIP, bukti fisik |
| `Notifikasi.gs` | Apps Script | WhatsApp Fonnte + Email, antrean, blast per batch, deteksi nomor WA |
| `CRM.gs` | Apps Script | CRM Kontak (Nama · Email · WhatsApp) |
| `Migrasi.gs` | Apps Script | Impor data dari SIPETIK/Excel lama |
| `appsscript.json` | Apps Script | Manifest (zona waktu WITA + izin OAuth) |
| `sipetik-frontend.zip` | GitHub Pages | Berisi folder `sipetik/` → `index.html`, `css/`, `js/`, `assets/` |

---

## TAHAP 1 — Backend (Google Apps Script)

> Gunakan **akun Google instansi yang akan menjadi pemilik data** (mis. akun admin IT Inspektorat). Semua spreadsheet, template Docs, dan PDF akan dibuat di Drive akun ini.

1. Buka <https://script.google.com> → **Proyek baru**. Beri nama `SIPETIK Backend`.
2. Klik ikon ⚙️ **Setelan proyek** → centang **"Tampilkan file manifes appsscript.json di editor"**.
3. Kembali ke **Editor** (ikon `< >`):
   - Buka `appsscript.json` → hapus isinya → tempel isi berkas `appsscript.json`.
   - Rename `Kode.gs` bawaan (klik ⋮ → Ganti nama) menjadi `Kode` → tempel isi `Kode.gs`.
   - Klik **＋ → Skrip** untuk membuat berkas baru: `Dokumen`, `Notifikasi`, `CRM`, `Migrasi` → tempel isi masing-masing.
   - Klik 💾 **Simpan**.
4. Jalankan setup **SEKALI**:
   - Dropdown fungsi (di sebelah tombol ▶ Jalankan) → pilih **`setupAppEnvironment`** → **▶ Jalankan**.
   - Klik **Tinjau izin** → pilih akun → **Lanjutan** → **Buka SIPETIK Backend (tidak aman)** → **Izinkan**.
   - Tunggu ±1–2 menit. Buka **Log eksekusi**; pastikan muncul `✅ SETUP SELESAI` beserta:
     - URL spreadsheet & folder Drive `📁 SIPETIK — Inspektorat Kutai Timur`
     - **Login admin** (email akun Anda) dan **Sandi awal** → catat!
   - Setup otomatis membuat: folder `00_TEMPLATE_MASTER` … `05_BACKUP`, spreadsheet database 18 sheet, **4 template Google Docs** (Kwitansi, Rincian Biaya, BKU, NPD) yang sudah dipetakan, data contoh (7 pegawai, 4 kode rekening, 1 SPJ senilai Rp 24.242.100), trigger antrean notifikasi (1 menit) dan backup mingguan (Senin 06.00).
   - ⚠️ **Jangan jalankan `setupAppEnvironment` dua kali.** Untuk menambah kolom/sheet pada versi baru, jalankan `upgradeSkema`.
5. Deploy sebagai Web App:
   - **Terapkan → Deployment baru** → ikon ⚙️ → **Aplikasi web**.
   - **Jalankan sebagai: Saya** · **Siapa yang memiliki akses: Siapa saja**.
   - Klik **Terapkan** → salin **URL aplikasi web** (berakhiran `/exec`).
6. Uji: buka `URL/exec?action=ping` di browser → harus tampil JSON `{"success":true, ... "siap":true}`.

> 🔁 Setiap kali mengubah kode `.gs`: **Terapkan → Kelola deployment → ✏️ Edit → Versi: Versi baru → Terapkan**. URL `/exec` tetap sama.

**Mengapa "Siapa saja"?** Frontend di GitHub Pages memanggil API tanpa login Google. Keamanan dijaga di server: setiap aksi (kecuali login) wajib token sesi, dan izin diperiksa per role (RBAC). Sandi disimpan sebagai hash SHA-256 ber-salt.

---

## TAHAP 2 — Isi URL backend di frontend

1. Ekstrak `sipetik-frontend.zip`. Hasilnya **satu folder bernama `sipetik`** berisi:
   ```
   sipetik/
   ├── index.html        ← harus terlihat di sini
   ├── PANDUAN-INSTALASI.md
   ├── README.md
   ├── assets/  (logo)
   ├── css/style.css
   └── js/config.js, api.js, ui.js, app.js, pages/…
   ```
2. Buka `sipetik/js/config.js` dengan Notepad → ganti nilai `GAS_URL` dengan URL `/exec` dari Tahap 1 → simpan.

---

## TAHAP 3 — Deploy ke GitHub Pages

> 📁 **Folder yang di-`git init` adalah folder `sipetik` hasil ekstraksi** — folder yang langsung berisi `index.html`. Jangan satu level di atasnya.

1. Instal Git: <https://git-scm.com/download/win> (pengaturan bawaan). Cek: `git --version`.
2. Sekali saja per komputer:
   ```bash
   git config --global user.name "Nama Anda"
   git config --global user.email "email-akun-github@contoh.com"
   ```
3. Di github.com: **＋ → New repository** → nama mis. `sipetik` → **Public** → **jangan** centang README/.gitignore/license → **Create**.
4. Buka folder `sipetik` di File Explorer → klik address bar → ketik `powershell` → Enter. Pastikan:
   ```powershell
   dir
   ```
   menampilkan `index.html`, `css`, `js`, `assets`. Kalau yang terlihat justru folder `sipetik`, jalankan `cd sipetik` dulu.
5. Kirim ke GitHub (satu per satu):
   ```bash
   git init
   git add .
   git commit -m "Upload pertama SIPETIK"
   git branch -M main
   git remote add origin https://github.com/USERNAME/sipetik.git
   git push -u origin main
   ```
   Saat diminta **Password**, tempel **Personal Access Token** (bukan sandi GitHub): <https://github.com/settings/tokens> → *Generate new token (classic)* → centang **repo** → salin `ghp_…`. Layar memang kosong saat menempel — itu normal.
6. Di repo GitHub: **Settings → Pages** → Source **Deploy from a branch** → Branch **main** / **(root)** → **Save** → centang **Enforce HTTPS**. Tunggu 1–2 menit → buka `https://USERNAME.github.io/sipetik/`.

**Update berikutnya** (mis. ganti `config.js`):
```bash
git add .
git commit -m "Perbarui konfigurasi"
git push
```
Lalu tekan **Ctrl+Shift+R** di browser.

---

## TAHAP 4 — Login pertama & konfigurasi awal

1. Buka situs → login dengan **email admin + sandi awal** dari log setup.
2. Klik avatar (kanan atas) → **Ganti Sandi**. Lalu hapus baris `SANDI_AWAL_ADMIN` di sheet **AppConfig**.
3. **Setup Admin → Pengaturan**: lengkapi nama KPA/Inspektur & NIP, tahun anggaran, persen potongan PPh (default 5%), format nomor SPJ (`T-700.1.2.8/{urut}/ITKAB.SET`), nomor urut awal.
4. **Setup Admin → Master Pegawai**: hapus/nonaktifkan data contoh, tambah pegawai atau **Import Excel** (unduh templatenya dulu).
5. **Setup Admin → Kode Rekening**: isi kode rekening DPA & pagu tahun berjalan.
6. **Setup Admin → Role & Hak Akses**: **+ Tambah User Baru** untuk Koordinator PPTK, Pembantu Input, Bendahara. Sandi awal ditampilkan sekali (dan dikirim via WA/Email bila notifikasi aktif). Matriks izin bisa diubah per role; Super Admin selalu memegang seluruh izin.
7. **Setup Admin → Template Manager**: 4 template bawaan sudah aktif. Klik 👁 untuk membuka Google Docs-nya dan ubah desain sesuka hati (kop, tata letak, logo). Setelah mengedit, klik **Pilih & Petakan → Pindai Ulang Dokumen → Terapkan Pemetaan**, lalu **🧪 Uji Render** untuk melihat PDF nyata.

### Alur kerja harian SPJ
| Tahap | Siapa | Aksi | Status |
|---|---|---|---|
| 1. Info SPJ & Rekening | Pembantu / PPTK | Nomor otomatis, tanggal, kode rekening (sisa pagu tampil), uraian, SPT, PPTK & bendahara | DRAFT |
| 2. Input Rincian | Pembantu / PPTK | Tambah pegawai (NIP & golongan terisi otomatis), isi bantuan, harian × hari, transport, penginapan → jumlah, PPh, bersih & terbilang dihitung otomatis → **Approve** | COMPLETED |
| 3. Generate | Koordinator PPTK | **Generate Semua Dokumen** → Kwitansi (per penerima), Rincian, BKU, NPD tersimpan di `02_SPJ_ARCHIVE/2026/01_T-700…/` dengan checksum SHA-256 | GENERATED |
| 4. Unggah bukti | Pembantu / PPTK | Tarik & lepas nota, boarding pass, struk (PDF/JPG/PNG ≤ 10 MB) | — |
| 5. Kunci | Koordinator PPTK | **Kunci & Terbitkan SPJ** → tidak bisa diubah; notifikasi ke Bendahara & penerima | LOCKED |
| Revisi | Super Admin | **Buka Kunci** (wajib alasan, tercatat di audit) | GENERATED |

---

## TAHAP 5 — Notifikasi WhatsApp (Fonnte) & Email

1. Daftar di <https://fonnte.com> → **Device → Add device** → scan QR dengan nomor WhatsApp kantor → salin **Token**.
2. SIPETIK → **Komunikasi → WhatsApp & Notifikasi → tab Konfigurasi**:
   - Tempel token → **Cek Perangkat** (harus `connect`) → **Kirim Tes WA**.
   - Nyalakan saklar **WhatsApp** dan/atau **Email** (Email memakai Gmail akun pemilik script; kuota ±100/hari akun biasa, ±1.500/hari Google Workspace).
   - Atur **Matriks Notifikasi Otomatis** per kejadian: SPJ baru → PPTK, rincian disetujui, dokumen terbit, SPJ dikunci, info pembayaran ke setiap penerima, kunci dibuka, generate gagal → Super Admin, akun dibuat/sandi direset. Klik **Ubah** untuk mengedit isi pesan & lihat pratinjau.
   - **Simpan Konfigurasi** (sekaligus memastikan trigger antrean 1 menit terpasang).
3. **Blast WhatsApp**: pilih sasaran (CRM, penerima SPJ tertentu, atau tempel manual) → **Muat Penerima** → **Deteksi Nomor WA** → tulis pesan dengan variabel `{nama}` `{jumlah}` … → pilih batch **10/20/50** + jeda → **Mulai Blast**. Server mengirim 1 batch per menit walau halaman ditutup; tombol **Kirim Batch Berikutnya** mempercepat.
   - Tips anti-banned: pakai nomor yang sudah "hangat", mulai batch 10, jeda acak `3-8` detik, hindari link yang sama ke ratusan nomor dalam 1 jam.
4. Token disimpan di **Script Properties**, tidak pernah ditulis ke sheet atau dikirim ke browser.

## TAHAP 6 — CRM Kontak

Menu **Komunikasi → CRM Kontak** menyatukan kontak **Master Pegawai + Pengguna Sistem** (sinkron otomatis tiap 30 menit, atau klik **Sinkron Sekarang**).
- Kartu KPI bisa diklik sebagai filter: WA terverifikasi, email valid, belum dicek WA, opt-out, duplikat.
- Centang kontak → **Deteksi WA**, **Beri Tag**, **Opt-out**, atau **Blast ke Terpilih**.
- **Detail**: ubah Nama/Email/WA (ditulis balik ke Master Pegawai), tag, catatan, opt-out, catat interaksi (telepon/kunjungan), lihat timeline pesan & riwayat SPJ penerima.
- **Import CSV** untuk kontak luar sistem (auditor BPKP, mitra); **Periksa Duplikat → Gabungkan**; **Ekspor** ke Excel (tercatat di audit karena berisi data pribadi).

## TAHAP 7 — Migrasi data dari aplikasi/Excel lama

Menu **Sistem → Migrasi Data** (Super Admin):
1. Pilih sumber: tempel **URL spreadsheet lama** (harus bisa dibuka akun pemilik script — sebaiknya akun yang sama) **atau unggah berkas Excel** lama. Sumber hanya dibaca.
2. Centang data: Master Pegawai, Kode Rekening, Pengguna, SPJ, Rincian, (opsional) Template, Audit lama. Nama sheet & kolom dikenali otomatis (mis. "Master Pegawai", "Data SPJ", "Detail Rincian Potongan", "Harian (Rp)").
3. **Pindai (Dry-run)** → periksa jumlah ditambah/diperbarui/dilewati & peringatan (NIP ganda, rekening yatim, admin lama dilewati, NIP tersimpan sebagai angka, jumlah beda dengan hitung ulang).
4. **Jalankan Import**. Aman diulang — tidak ada baris dobel.
5. **Cutover**: tepat sebelum pindah, jalankan import sekali lagi (delta sync), uji 1 SPJ sampai PDF, umumkan alamat baru via Blast WA, arsipkan aplikasi lama.

Aturan: kunci pegawai = NIP · rekening = kode + tahun · pengguna = email · SPJ = nomor SPJ · rincian = nomor SPJ + NIP (jumlah/PPh/netto dihitung ulang). SPJ yang di SIPETIK sudah COMPLETED/GENERATED/LOCKED tidak ditimpa. Audit lama masuk sheet **AuditArsip** agar rantai hash audit baru tetap utuh. Tanpa opsi "Timpa", data master hanya mengisi kolom yang masih kosong.

---

## Opsional — Login dengan Google

1. <https://console.cloud.google.com> → **APIs & Services → Credentials → Create credentials → OAuth client ID** → tipe **Web application**.
2. **Authorized JavaScript origins**: `https://USERNAME.github.io`.
3. Salin **Client ID** → SIPETIK **Pengaturan → Google OAuth Client ID**. Isi **Domain email diizinkan** (mis. `kutaitimurkab.go.id`) dan **Daftar otomatis = YA** bila akun domain boleh langsung masuk dengan role bawaan.
4. Tombol "Masuk dengan Google" muncul di halaman login.

---

## Troubleshooting

| Gejala | Penyebab & solusi |
|---|---|
| Halaman login: "Konfigurasi belum lengkap" | `GAS_URL` di `js/config.js` belum diisi → isi, lalu `git add . && git commit -m "config" && git push` |
| "Server tidak dapat dihubungi" / "Respon server bukan JSON" | Deployment belum "Siapa saja", URL bukan `/exec`, atau lupa membuat **versi baru** setelah mengubah kode |
| "Backend belum di-setup" | Jalankan `setupAppEnvironment` di editor Apps Script |
| Lupa sandi admin | Jalankan fungsi `resetSandiAdmin` di editor → sandi baru muncul di log |
| GitHub Pages 404 | `index.html` tidak berada di root repo → push ulang dari folder `sipetik` (lihat panduan GitHub Pages) |
| Tampilan tanpa warna/tata letak | Folder `css/` & `js/` tidak ikut → selalu push lewat terminal, jangan upload via web |
| Generate gagal "dokumen tidak bisa diakses" | Template Docs harus dimiliki/dibagikan ke akun pemilik script |
| Placeholder kosong di PDF | Placeholder belum dipetakan → Template Manager → petakan kolom → Uji Render |
| Antrean notifikasi menumpuk | Trigger mati → jalankan `pasangTrigger` di editor; cek token & status perangkat Fonnte |
| "Deteksi WA: not available" | Paket Fonnte tidak mendukung `/validate`; blast tetap bisa tanpa filter |
| Kuota email habis | Pesan tetap di antrean dan dikirim hari berikutnya |
| Versi lama masih tampil | **Ctrl+Shift+R** atau buka jendela Incognito |

## Batasan yang perlu diketahui

- Batas eksekusi Apps Script 6 menit per permintaan: generate dijalankan per template (±10–30 detik/dokumen), sehingga aman untuk 30–40 personil per SPJ.
- Sesi login berlaku 6 jam sejak aktivitas terakhir.
- Balasan WhatsApp masuk tidak tercatat otomatis (perlu webhook Fonnte terpisah). Pengiriman bergantung pada status perangkat Fonnte.
- Kuota UrlFetch ±20.000/hari (akun gratis) — cukup untuk ribuan pesan per hari.
- Unduhan PDF/ZIP dikirim melalui API (berkas tetap privat di Drive); ZIP maksimal 15 SPJ sekali unduh.
- Backup mingguan menyimpan 8 salinan spreadsheet terakhir di `05_BACKUP`.
