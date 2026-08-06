# Dokumentasi UI/UX & Reka Bentuk Sistem Dinspire (Blueprint Lengkap)

Dokumentasi ini adalah panduan reka bentuk terperinci (*Pixel-Perfect Blueprint*) yang membentangkan struktur lengkap, logik pergerakan visual, kod warna, dan *Pengalaman Pengguna (UX)* untuk ekosistem Dinspire Barbershop. Ianya direka khas supaya mana-mana Ejen AI atau Jurutera Antaramuka dapat membayangkan dan membina semula 100% sistem ini dengan sempurna.

---

## 1. Falsafah Reka Bentuk (Design Philosophy)

Sistem Dinspire secara teguh mengadaptasi bahasa reka bentuk berkonsepkan **"Apple/iOS Minimalist & Modern Glassmorphism"**.

- **Tipografi Utama:** Keluarga fon `-apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif`. Tiada fon berserif (*sans-serif* sahaja) dengan variasi ketebalan (*font-weight: 400 untuk teks biasa, 600 untuk label/butang, 700-800 untuk tajuk/KPI*).
- **Responsif & Mobile-First:** Reka bentuk dibina dari saiz skrin telefon pintar terlebih dahulu. Paparan pada PC mengekalkan saiz telefon (dibungkus dalam `.mobile-container` dengan lebar maksimum 400px, diletakkan di tengah skrin berlatar `#e2e8f0`).
- **Animasi (Motion UX):** Menggunakan keluk pergerakan *Cubic-Bezier* untuk meniru kelajuan fizik animasi iOS (pantas bermula, perlahan di hujung).

---

## 2. Palet Warna Mengikut Portal (Color System)

Setiap portal mempunyai identiti warna tersendiri untuk membezakan peranan pengguna:

### Portal Pelanggan (`index.css`)
| Token | Nilai Hex | Kegunaan |
|-------|-----------|----------|
| `--bg-main` | `#f4f5f8` | Latar belakang utama |
| `--bg-surface` | `#ffffff` | Kad dan panel |
| `--bg-input` | `#e4e4e6` | Medan input |
| `--primary-blue` | `#1877f2` | Warna jenama utama / CTA |
| `--text-main` | `#1c1c1e` | Teks utama |
| `--text-muted` | `#8e8e93` | Teks sekunder |
| `--star-color` | `#ffc107` | Bintang ulasan (emas) |
| `--btn-dark` | `#5a5a5e` | Butang gelap sekunder |
| `--border-color` | `#e5e5ea` | Garisan sempadan |

### Portal Staf (`staff.css`)
| Token | Nilai Hex | Kegunaan |
|-------|-----------|----------|
| `--primary` | `#dc2626` | **Merah** — Warna jenama staf |
| `--primary-light` | `#fef2f2` | Isian merah cerah |
| `--success` | `#34c759` | Hijau kejayaan |
| `--danger` | `#ff3b30` | Merah bahaya |

### Papan Pemuka Pemilik (`owner.css`)
| Elemen | Nilai Hex | Kegunaan |
|--------|-----------|----------|
| Latar badan | `#f3f4f6` | Kelabu moden (banking app) |
| Sidebar / Bottom Nav | `#0f1115` | Hitam gelap ultra |
| Kunci masuk overlay | `rgba(15, 17, 21, 0.98)` | Kaca gelap kabur |

### Panel Admin (`admin.css`)
| Token | Nilai Hex | Kegunaan |
|-------|-----------|----------|
| `--primary-blue` | `#1877f2` | Biru aksen utama |
| Nav aktif | `#e8f0fe` | Biru cerah latar tab aktif |
| Butang simpan | `#34c759` | Hijau simpan |
| Butang padam | `#ff3b30` | Merah padam |

---

## 3. Struktur Visual Terperinci: 5 Portal

### A. Skrin Pemuatan (Preloader — `loader.css`)

Skrin animasi butiran tinggi yang menyambut pengguna sebelum aplikasi dimuat:

- **Latar Belakang:** Hitam arang pekat `#0b0c10`, skrin penuh (`z-index: 99999`).
- **Animasi Mesin Gunting Rambut (Hair Clipper Motor):**
  - SVG gunting rambut monokrom putih (`130px x 130px`) dengan titik pangsi di tapak tangan (`transform-origin: 50% 80%`).
  - Gerakan sapuan kiri-kanan (`clipper-sweep`): Berputar dari `-12deg` ke `+12deg` dengan angkatan `translateY(-8px)`, 3 saat, gelung tak terhingga.
  - Bilah bergetar (`vibrating-blade`): Getaran mendatar (`translateX(-1px)` ke `translateX(1px)`) setiap 0.05 saat, meniru motor magnetik gunting sebenar.
- **Zarah Rambut Jatuh:** 3 helai rambut SVG (`.hair-1`, `.hair-2`, `.hair-3`) berwarna putih separuh lutsinar, jatuh 35px, berputar 90 darjah, dengan kelewatan berperingkat (0s, 0.5s, 1s).
- **Teks:** "TRIMMING" — `font-size: 11px`, `letter-spacing: 8px`, huruf besar, `font-weight: 300`, warna `rgba(255, 255, 255, 0.6)`.
- **Peralihan Keluar:** Pudar (`opacity 0.8s ease-in-out`) apabila aplikasi sedia.

---

### B. Portal Pelanggan (`customer/index.html`) — PWA Berkonsep Aplikasi Mudah Alih

#### B.1 Navigasi Bawah (Bottom Navigation Bar)
- Bar putih statik di bawah skrin (`height: calc(65px + env(safe-area-inset-bottom))`, `z-index: 200`).
- **5 Menu:** Services, Products, **Home** (lalai aktif), Notifications, Account.
- **Sistem Dwi-Ikon PNG:** Setiap menu mempunyai 2 fail imej — `.icon-outline` (garis luar kelabu) dan `.icon-full` (ikon penuh).
  - **Tidak Aktif:** Ikon kelabu (`filter: grayscale(100%) opacity(0.5)`), teks `#8e8e93`, `10px`.
  - **Aktif:** Ikon penuh dipaparkan dengan penapis CSS warna biru (`filter: invert(...) sepia(...) hue-rotate(205deg)`), teks `#1877f2`, `font-weight: 700`.

#### B.2 Tab Home (`view-home`)
- **Poster Promosi:** Kad segi empat tepat gelongsor automatik (*auto-slide*) dengan titik navigasi (*dot pagination*) di bawah.
- **Ulasan Pelanggan Langsung (Live Reviews Marquee):** Dua landasan gelongsor mendatar tak terhenti:
  - Landasan atas (`.track-left`): Meluncur ke **kiri** (`scrollLeft 25s linear infinite`).
  - Landasan bawah (`.track-right`): Meluncur ke **kanan** (`scrollRight 25s linear infinite`).
  - Kad ulasan (`260px`): Avatar bulat 32px, nama 13px bold, 5 bintang emas, teks ulasan 12px, tag servis pil (`#f0f4ff` bg, `#1877f2` teks).

#### B.3 Tab Services (`view-services`)
- **Kawalan Segmen iOS (Segmented Control):** 3 tab pil (`#e5e5ea` bg, 3px padding, sudut 20px):
  1. **Haircuts** — Kad servis gunting
  2. **Treatments** — Kad rawatan
  3. **On Call Service** — Borang tempahan ke lokasi rumah
- **Penunjuk Gelongsor Pil Putih (`.slider`):** Lebar `calc((100% - 6px) / 3)`, bergerak licin (`0.3s cubic-bezier(0.25, 1, 0.5, 1)`) mengikut tab terpilih.
- **Kad Servis (`.service-card-inner`):** Akordion kembang/kuncup licin (`max-height: 0` ke `600px`). Mengandungi dropdown pemilih barber dan butang "Choose Schedule".

#### B.4 Modal Pemilih Jadual (Schedule Modal)
Reka bentuk dua panel terbelah yang masuk dari arah bertentangan:

- **Panel Atas — Kalendar (`.schedule-date-panel`):**
  - Latar biru `#1877f2`, teks putih, bucu bawah dibulatkan (`border-radius: 0 0 24px 24px`).
  - Gelongsor turun dari atas (`translateY(-100%)` ke `0`, 0.45s cubic-bezier).
  - Grid tarikh 7 lajur. Panah chevron kiri/kanan untuk navigasi bulan.
  - **Keadaan Visual Tarikh:**
    - *Tersedia:* Bulatan 14px, hover `#1e293b`.
    - *Terpilih (`.selected`):* Bulatan biru `#3b82f6`, teks putih, bayangan `rgba(59, 130, 246, 0.4)`.
    - *Dilumpuhkan (`.disabled`):* Teks malap `#475569`, kursor dilarang.
    - *Penuh (`.fully-booked`):* Latar merah cerah `#ffe5e5`, teks merah gelap `#d32f2f`, sempadan `#ffcccc`.

- **Panel Bawah — Slot Masa (`.schedule-time-panel`):**
  - Latar kelabu-kebiruan `#f0f4f9`, `margin-top: -30px` (rapat di bawah kalendar).
  - Gelongsor naik dari bawah (`translateY(100vh)` ke `0`).
  - Grid 3 lajur slot masa (11:00 AM – 11:00 PM).
  - *Tersedia:* Putih, sempadan `#e5e5ea`. *Terpilih:* Biru `#1877f2`, teks putih. *Ditempah:* Kelabu malap, kursor dilarang.

#### B.5 Tab Products (`view-products`)
- Kotak carian melengkung di atas (`#product-search`).
- **Grid Produk:** CSS Grid `repeat(2, 1fr)`, gap 12px.
- **Kad Produk:** Putih, sudut 16px, imej nisbah 1:1 (sudut 10px), tajuk 14px bold, harga biru `#1877f2`, kawalan kuantiti (`-`/`+` butang persegi), butang "Tambahkan" gelap (`#5a5a5e`).

#### B.6 Palang Checkout Terapung (Floating Checkout Bar)
- `position: absolute; bottom: 70px`, latar putih, sempadan atas `#e5e5ea`, bayangan `0 -4px 12px rgba(0,0,0,0.05)`.
- **Kiri:** Label "JUMLAH PEMBELIAN" (11px, kelabu) + Harga jumlah (16px bold).
- **Kanan:** Butang bakul bulat kelabu (42x42px, ikon beg), Butang "Checkout" biru (`#1877f2`, sudut 8px).

#### B.7 Modal Daftar Keluar (Unified Checkout Modal)
- Helaian pembayaran bergaya Apple (*Apple Payment Sheet*), skrin penuh, gelongsor naik (`slideUpFullScreen`, 0.35s).
- **Pilihan Pembayaran:**
  - *FPX Online Banking:* Ikon perisai hijau `#10b981`, teks arahan pengalihan bank automatik.
  - *DuitNow QR Pay:* Paparan nama bank, imej QR boleh muat turun, butiran akaun, input muat naik resit.
- **Pecahan Pesanan:** Senarai item, subtotal, yuran servis/penghantaran, jumlah keseluruhan (dipisah garisan putus-putus).
- **Butang Sahkan:** Pil biru (`border-radius: 21px`). Apabila ditekan, berubah bentuk menjadi pemutar bulat (`.btn-loading`) dengan gelang putih berputar.
- **Skrin Kejayaan (`.success-screen`):** Latar biru `#1877f2`, mengembang menggunakan animasi `clip-path` bulatan (`circle(0%)` ke `circle(150%)`, 0.55s). Ikon bulat putih pop-in, teks "Payment Success" gelongsor naik, butang pil putih "Continue".

#### B.8 Modal Edit Troli (Swipe-to-Delete)
- Helaian bawah 75% tinggi, latar putih, sudut atas 24px, pemegang seret pil atas (45px x 4px).
- **Mekanisme Leret-untuk-Padam:**
  - Setiap item: tinggi 56px, limpahan tersembunyi.
  - Latar belakang: Butang merah "Delete" (`80px`, `#FF3B30`) dipasang di kanan.
  - Kandungan hadapan: `z-index: 1`, latar putih, `transition: transform 0.3s ease`.
  - Sentuhan/tetikus mengesan delta mendatar. Jika dileret melebihi 40px, snap terbuka ke `translateX(-80px)` mendedahkan butang padam.

#### B.9 Tab Notifications & Account
- **Notifications:** Senarai penjejakan pesanan dengan lencana status (Pending, Preparing, Shipped, Completed, Cancelled). Butang "Sahkan Terima" dan "Jadual Semula".
- **Account (Log Keluar):** Borang Login & Register menggunakan *Segmented Tab*. Modal Lupa Kata Laluan. Pemilih Avatar (grid 4 lajur). Input OTP 6 digit (kotak berasingan dengan fokus ring biru `rgba(24, 119, 242, 0.15)`).
- **Account (Log Masuk):** Gambar profil bulat berbingkai biru, nombor telefon, butang "Logout" merah. Bahagian ulasan Rating 5 Bintang (ikon bintang FontAwesome, `#e5e5ea` tidak aktif, `#ffc107` aktif). Senarai aktiviti transaksi.

#### B.10 Pemberitahuan Toast
- Pil tetap atas (`top: 20px; left: 50%`), latar gelap `#1c1c1e`, teks putih, `border-radius: 30px`, `font-size: 13px`, `z-index: 10000`.
- Animasi dari `translateY(-100px)` ke `translateY(0)`, hilang sendiri selepas 3 saat.

---

### C. Portal Staf (`staff/index.html`) — Panel Operasi Pekerja

#### C.1 Skrin Pengesahan
- **Log Masuk (`#login-screen`):** Lapisan penuh putih (`z-index: 500`), kotak borang berpusat.
- **Tukar Kata Laluan Paksa (`#change-password-screen`):** Dicetuskan jika `must_change_password=true` atau kata laluan lalai `123123`. Memaksa input kata laluan baharu (min 6 aksara) sebelum membenarkan akses.
- **Mohon Reset (`#forgot-password-screen`):** Input nama pengguna, hantar permohonan ke Admin/Owner.

#### C.2 Pengepala & Avatar
- Pengepala fleksibel dengan sapaan, tarikh semasa, dan lencana avatar bulat (`.header-avatar`).
- Latar `var(--primary)` merah, `padding-top: 65px` (kawasan selamat peranti).

#### C.3 Navigasi Bawah
- 5 tab: Dashboard, Walk-In, Booking, History, Profile.
- Latar `rgba(255, 255, 255, 0.95)` dengan penapis kabur (*backdrop blur*), sempadan atas, ikon aktif naik 2px.

#### C.4 Tab Dashboard — Kad KPI
Grid 1 lajur (`gap: 15px`). Setiap kad: putih, sudut 20px, bayangan `0 4px 15px rgba(0,0,0,0.03)`, kotak ikon bulat berwarna 50x50px.

| # | Metrik | Ikon | Warna Kotak Ikon |
|---|--------|------|------------------|
| 1 | Prestasi Staf (Rating %) | Bintang | Oren (`#fff3e0` bg, `#e65100` ikon) |
| 2 | Total Pelanggan | Kumpulan pengguna | Biru (`#e3f2fd` bg, `#1565c0` ikon) |
| 3 | Komisen Terkumpul (RM) | Dompet | Merah (`#fef2f2` bg, `#dc2626` ikon) |
| 4 | Bones / Bonus (RM) | Hadiah | Ungu (`rgba(156,39,176,0.1)` bg, `#9c27b0` ikon) |
| 5 | Cash On Hand (RM) | Wang | Hijau (`#e8f5e9` bg, `#2e7d32` ikon), sempadan hijau `1.5px` |

Nombor KPI: `font-size: 24px`, `font-weight: 800`.

#### C.5 Tab Walk-In — Borang Pendaftaran
- Kad borang (`.card-form`) dengan tajuk huruf besar dan ikon pejalan kaki.
- Medan: Nama Pelanggan, Telefon (pilihan), Jenis Servis (*dropdown* — senarai `Walk-in` + `Treatment Walk-in` berlabel "(Rawatan)"), Harga (auto-isi atau manual), Mod Bayaran (Cash / QR).
- **QR Dipilih:** Mendedahkan kumpulan muat naik resit (`#wi-receipt-group`) — kamera peranti (`capture="environment"`).
- Butang hantar merah (`#dc2626`) dengan bayangan cahaya merah (`box-shadow: 0 4px 15px rgba(220, 38, 38, 0.3)`).

#### C.6 Tab Booking — Senarai & Modal Penyelesaian
- Kad tugas (`.list-card`): Nama pelanggan, butiran servis, tag status, butang tindakan.
- **Modal Penyelesaian Rawatan (`#modal-selesai-rawatan`):** Lapisan gelap (`rgba(0,0,0,0.8)`), kad gelap (`#1e1e1e`, sudut 12px). Staf masukkan harga akhir, pilih mod bayaran, muat naik resit QR.
- **Penyelesaian Gunting:** Dialog `confirm()` ringkas sahaja (tanpa modal).

#### C.7 Tab Profile — GPS & Cuti
- **Punch In/Out GPS:** Butang Hijau "Punch In" (`#34c759`) dan Merah "Punch Out" (`#dc2626`). Status teks berubah: "Mendapatkan lokasi GPS..." → "Berjaya CLOCK IN" (hijau) atau ralat (merah). Staf Am perlu pilih cawangan dari *dropdown*.
- **Pemilih Cuti (Flatpickr):**
  - *Cuti Biasa:* Mod berbilang tarikh, terhad 4 hari bulan depan, tarikh rakan sekerja yang bertindih dilumpuhkan automatik.
  - *Cuti Kecemasan:* Tarikh tunggal bulan semasa + textarea sebab.
- **Profil Avatar:** Bulatan 100px, sempadan putih 4px, bayangan merah `rgba(220, 38, 38, 0.1)`.

---

### D. Papan Pemuka Pemilik (`owner/index.html`) — Suite Analitik Eksekutif

#### D.1 Susun Atur Dwi-Mod
- **Desktop:** Panel kiri gelap (`#000000`, lebar 260px) dengan logo mahkota "EXECUTIVE" + kawasan kandungan cerah `#f3f4f6`.
- **Mudah Alih:** Navigasi bawah gelap (`#0f1115`, sempadan atas `#272a30`).

#### D.2 Navigasi 6 Tab
| # | Tab | Ikon | Nota |
|---|-----|------|------|
| 1 | Analisis Jualan | `fa-chart-pie` | Lalai |
| 2 | Aliran & Pesanan | `fa-exchange-alt` | — |
| 3 | Ulasan Pelanggan | `fa-star` | — |
| 4 | Kehadiran GPS | `fa-fingerprint` | — |
| 5 | Laporan & Resit | `fa-file-archive` | — |
| 6 | Dinspire AI | `fa-brain` | Teks ungu `#a855f7` |

#### D.3 Kawalan Penapis Masa Global
- Pemilih julat masa (`#timeFilter`): Harian / Mingguan / **Bulanan** (lalai) / Tahunan / Semua.
- Butang chevron offset `< >` (`changeDateOffset`) untuk langkah ke depan/belakang. Paparan julat pil (`#currentDateDisplay`) dikemaskini secara dinamik (cth: "Ogos 2026").

#### D.4 Tab Analisis Jualan
- **Kad KPI:** Jumlah Hasil Jualan, Jumlah Pelanggan, Komisen Pekerja, Keuntungan Bersih, Cash On Hand (aksen hijau `#10b981` + butang reset).
- **Nombor Tabular:** `font-variant-numeric: tabular-nums` menghalang getaran digit semasa kemas kini langsung.
- **Carta Chart.js:**
  - *Jualan (salesChart):* Jenis `bar`, bar gelap `#111827`, sudut `borderRadius: 6`.
  - *Pecahan Servis (demoChart):* Jenis `doughnut`, warna `["#111827", "#6b7280", "#d1d5db"]`, `cutout: 65%`.
  - *Pecahan Bayaran (payChart):* Jenis `doughnut`, monokrom.
  - *Prestasi Staf (staffChart):* Jenis `doughnut`, palet kelabu 6 peringkat.
  - *Perbandingan Cawangan (branchLineChart):* Jenis `line`, pelbagai dataset.
- **Cash On Hand Per Barber:** Pecahan tunai setiap barber dengan butang reset.

#### D.5 Tab Aliran & Pesanan
- Sub-tab: *Servis Guntingan & On-Call* vs *Pesanan Produk E-Commerce*.
- Jadual aliran pesanan: No. Pesanan, Tarikh/Masa, Pelanggan, Barber, Servis, Jumlah (RM), Mod Bayaran, Status.
- **Lencana Status:** QR (`badge-qr`, biru cerah), Cash (`badge-cash`, hijau cerah), Pending (`badge-pending`, oren cerah).
- **Transformasi Jadual-ke-Kad (Mudah Alih `≤768px`):** `display: block !important`, `thead { display: none }` — jadual bertukar kepada kad bertindih.

#### D.6 Tab Ulasan Pelanggan
- Sub-tab: *Ulasan* (taburan bintang, senarai sentimen, eksport CSV) & *Database Pelanggan* (senarai unik pelanggan, eksport CSV pemasaran).

#### D.7 Tab Kehadiran GPS & Cuti
- **Rekod Kehadiran:** Jadual log punch dengan lencana status:
  - Clock-In: Latar mint `#d1fae5`, teks hijau gelap `#065f46`.
  - Clock-Out: Latar kelabu `#f3f4f6`.
- **Cuti Bulanan:** Kelulusan 4 hari.
- **Cuti Kecemasan + Modal Konflik:** Jika kelulusan bercanggah dengan tempahan pelanggan (HTTP 409), modal merah (`#reassignModal`) muncul:
  - *Barber Ganti Tersedia:* Dropdown barber lapang + butang hijau "Tukar Staf".
  - *Tiada Barber Ganti:* Dropdown kosong + butang merah "Batal Tempahan (WhatsApp)" yang membina pautan mesej WhatsApp pra-isi kepada pelanggan.

#### D.8 Tab Laporan & Resit
- Pengurus arkib bulanan. Halaman pembantu `archive-download.html` (mod gelap `bg-gray-900`).
- Proses: Jana Excel berbilang helaian → Muat turun resit secara selari (10 serentak) → Mampat ke `.zip` → Muat turun automatik.
- Bar kemajuan langsung (`#progressBar` peratusan + `#progressText`).

#### D.9 Tab Dinspire AI — Laci Pembantu AI
- **Laci Kanan (`#ai-right-drawer`):** Tema gelap ultra (`#050505` bg, sempadan kiri `#1f2937`), lebar 400px.
- **Pemegang Saiz Semula (`#ai-resize-handle`):** Bar kiri 1.5px, cahaya ungu semasa hover, kursor `col-resize`.
- **Pengepala:** Bulatan ikon otak ungu (`bg-purple-600`), tajuk "Ejen AI Din", titik hijau berdenyut (`animate-pulse bg-emerald-400`), status "Dalam Talian".
- **Kad Pandangan AI Ambien:** Orb kaca terapung (`.animate-orb-1`, `.animate-orb-2`) dan anjakan gradien latar 25s.
- **Bar Skrol Glassmorphism:** Skrol bar ultra nipis 4px dengan ibu jari bulat (`#6b7280`).

---

### E. Panel CMS Pentadbir (`admin.html`) — Pangkalan Data Master

#### E.1 Susun Atur Desktop Master-Detail
- Panel kiri tetap (`width: 250px`, latar putih `#ffffff`, sempadan kanan `#e5e5ea`).
- Ruang kandungan utama fleksibel (`.main-content`).

#### E.2 Sidebar Navigasi — 13 Tab
| # | Tab | Ikon Khas |
|---|-----|-----------|
| 1 | Guntingan | — |
| 2 | Rawatan | — |
| 3 | Cawangan | — |
| 4 | Barbers (Staff) | — |
| 5 | General Staff | — |
| 6 | Servis OnCall | — |
| 7 | Barbers OnCall | — |
| 8 | Harga Walk-In | — |
| 9 | Treatment Walk-In | — |
| 10 | Produk | — |
| 11 | Promosi (Poster) | — |
| 12 | Tetapan Sistem & Caj | Ikon cog, sempadan atas biru |
| 13 | Permohonan Reset | Ikon kunci, sempadan atas oren |

- **Keadaan Aktif:** Latar biru cerah `#e8f0fe`, teks biru `#1877f2`, sempadan kanan 4px pepejal biru.

#### E.3 Jadual Data Dinamik (Spreadsheet)
- Jadual bergaya Airtable/Excel (`.data-table`) dengan kepala jadual `#fafafc`.
- **Suntingan Sebaris:** Setiap sel mengandungi input teks/nombor/dropdown. Mengedit terus mengemas kini `appData` dalam memori.
- **Tindakan Baris:** Butang biru "+ Tambah Rekod" menambah baris. Butang merah tong sampah memadam baris. Tab Poster mengehadkan maksimum 3 baris.
- **Jalur Zebra:** Baris berselang-seli pudar dengan animasi tonjol (*hover highlight*) semasa tetikus melintasi.

#### E.4 Muat Naik Imej dengan Mampatan Canvas
- Imej lebih besar daripada 600px lebar dikecilkan secara automatik.
- Dirender pada canvas HTML5 2D dengan latar putih.
- Dieksport sebagai JPEG Base64 (`quality: 0.7`).

#### E.5 Pemilih GPS Peta Leaflet
- Modal SweetAlert2 (lebar 600px) dengan peta Leaflet (`zoom: 17`, `maxZoom: 21`).
- Lapisan jubin Google Maps standard. Kotak carian geocoder (`L.Control.geocoder()`).
- Klik pada peta memindahkan pin penanda dan mengemas kini medan Latitud/Longitud.

#### E.6 Lapisan Kunci Masuk (Login Overlay)
- Skrin penuh gelap (`rgba(28, 28, 30, 0.95)`, penapis kabur 5px, `z-index: 9999`).
- Kotak putih berpusat (`.login-box`, max-width 350px, sudut 16px): Input Username, Password, butang "Log Masuk CMS".

#### E.7 Butang Simpan Global
- Butang hijau di palang atas (`#34c759`), ikon awan muat naik.
- Aliran: Dilumpuhkan → "Menyimpan..." → `POST /api/admin/save` → SweetAlert2 kejayaan "Data Berjaya Disimpan ke Cloud!"

---

## 4. Saiz Responsif & Titik Putus (Responsive Breakpoints)

| Portal | Titik Putus | Perubahan |
|--------|------------|-----------|
| **Pelanggan** | `≤360px` | Skala tipografi, tinggi input, dimensi kotak OTP |
| | `481px–1024px` | `.mobile-container max-width: 768px` |
| | `≥1025px` | `.mobile-container max-width: 400px` (simulator telefon) |
| **Staf** | `≤360px` | Fon pengepala 16px, nombor KPI 18px |
| | `≤480px` | Tajuk 18px, KPI 20px, avatar 38px |
| | `481px–1024px` | `max-width: 768px` |
| | `≥1025px` | `max-width: 400px` |
| **Pemilik** | `≤360px` | Tajuk halaman 16px, teks kad 13px |
| | `≤480px` | Fon badan 11px, padding kad 0.75rem |
| | `≤768px` | Jadual → Kad bertindih, toast ke bawah skrin |
| | `≥768px` | Nav bawah tersembunyi, padding bawah 2rem |
| **Admin** | — | Seni bina desktop, sidebar tetap 250px, tinggi penuh `100vh` |

---

## 5. Garis Panduan Maklum Balas Visual (Feedback UX)

1. **Tiada Amaran Pelayar (No Alert Boxes):** Semua ralat/kejayaan menggunakan Toast terapung pil gelap atau SweetAlert2 moden. Toast masuk licin (*slide-in*) dan hilang sendiri (*fade-out* selepas 3 saat).
2. **Keselamatan XSS Visual:** Semua maklumat di dalam UI (komen pelanggan, nama servis) disaring melalui `escapeHTML()` supaya aksara pelik (cth: `<script>`) tidak merosakkan kod HTML.
3. **Skeleton Loaders:** Blok bayang kelabu berkelip memenuhi skrin semasa memuat data, mengelakkan paparan pecah/kosong.
4. **Penomboran Tabular (`tabular-nums`):** Nombor KPI pada papan pemuka pemilik menggunakan `font-variant-numeric: tabular-nums` untuk mengelakkan getaran/lompatan digit semasa kemas kini langsung.
5. **Butang Anti-Klik-Dua-Kali:** Butang kritikal dilumpuhkan serta-merta dan menunjukkan pemutar loading semasa pemprosesan.

---

## 6. Sokongan Pelbagai Bahasa (i18n)

Portal Pelanggan menyokong **2 bahasa** (`public/js/i18n-index.js`):
- **Bahasa Melayu (`ms`)** — Lalai
- **English (`en`)** — Pilihan

Butang penukar bahasa (`.lang-btn`) di pengepala kanan setiap tab, dengan ikon bola dunia dan teks penunjuk ("EN" / "MS"). Kamus terjemahan merangkumi semua label UI, modal, mesej amaran, dan string JavaScript.

---

*Blueprint UI/UX ini perlu dititikberatkan setiap kali pengubahsuaian sistem baharu dilakukan bagi memastikan pengalaman Dinspire kekal pada standard tertinggi dalam industri. Kemas kini terakhir: 7 Ogos 2026.*
