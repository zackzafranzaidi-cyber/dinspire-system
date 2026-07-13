# Dokumentasi UI/UX & Reka Bentuk Sistem Dinspire (Blueprint Lengkap)

Dokumentasi ini adalah panduan reka bentuk terperinci (*Pixel-Perfect Blueprint*) yang membentangkan struktur lengkap, logik pergerakan visual, kod warna, dan *Pengalaman Pengguna (UX)* untuk ekosistem Dinspire Barbershop. Ianya direka khas supaya mana-mana Ejen AI atau Jurutera Antaramuka dapat membayangkan dan membina semula 100% sistem ini dengan sempurna.

---

## 1. Falsafah Reka Bentuk (Design Philosophy)

Sistem Dinspire secara teguh mengadaptasi bahasa reka bentuk berkonsepkan **"Apple/iOS Minimalist & Modern Glassmorphism"**.

- **Tipografi Utama:** Keluarga fon `SF Pro Display`, `Inter`, atau `Helvetica Neue`. Tiada fon berserif (*sans-serif* sahaja) dengan variasi ketebalan (*font-weight: 400 untuk teks biasa, 600 untuk tajuk/butang*).
- **Skema Warna Induk (Color Palette):**
  - `--bg-main` (#F4F5F8): Latar belakang kelabu sangat cerah/sejuk.
  - `--bg-surface` (#FFFFFF): Kad dan kontena panel berwarna putih bersih.
  - `--primary-blue` (#1877F2): Biru laut terang (Warna CTA / Butang Utama).
  - `--text-main` (#111827): Kelabu sangat pekat/hitam untuk teks.
  - `--bg-time-panel` (#F0F4F9): Kelabu-kebiruan cair khusus untuk latar belakang laci masa/jadual.
- **Responsif & Mobile-First:** Reka bentuk dibina dari saiz skrin telefon pintar terlebih dahulu. Paparan pada PC mengekalkan saiz telefon (dibungkus dalam `.mobile-container` dengan lebar maksimum 480px, diletakkan di tengah skrin).
- **Animasi (Motion UX):** Menggunakan keluk pergerakan *Cubic-Bezier (0.2, 0.8, 0.2, 1)* untuk meniru kelajuan fizik animasi iOS (pantas bermula, perlahan di hujung).

---

## 2. Struktur Visual Terperinci: 4 Portal Utama

Sistem ini dibahagikan kepada empat (4) laman web (*portals*) dengan hierarki dan fungsi berbeza:

### A. Portal Pelanggan (`index.html`) - PWA Berkonsep Aplikasi Mudah Alih
Laman ini berfungsi sebagai sebuah aplikasi telefon berkuasa penuh yang berjalan di web dan dibahagikan kepada 5 tab utama.

1. **Skrin Memuatkan (Animated SVG Preloader):**
   - Latar belakang skrin biru `#1877F2` menutup keseluruhan web.
   - Animasi garisan melengkung (*swoosh*) berwarna putih separuh lutsinar dilukis (*stroke-dashoffset*) membentuk perisai/logo.
   - Logo SVG berkembang membesar (*scale 1 ke 30*) dan pudar pada saat ke-3.5 memberikan transisi tahap pawagam.
   
2. **Navigasi Bawah (Bottom Navigation Bar) & Sistem Dwi-Ikon:**
   - Bar putih statik di bawah skrin (`height: 70px`, `bottom: 0`, `z-index: 100`).
   - Mempunyai 5 Menu: *Services, Products, Home, Notifications, Account*.
   - **Sistem Dwi-Ikon:** Setiap menu dilengkapi fail imej berbeza: `icon out outline/.png` untuk keadaan tidak aktif, dan `icon full/.png` (warna solid) yang akan dipaparkan apabila menu tersebut dibuka (aktif).
   
3. **Pengepala (Header) & Tetapan Bahasa:**
   - Setiap tab mempunyai pengepala tetap (`.header`) di bahagian atas.
   - **Kiri Header:** Memaparkan `<h1>` (Tajuk utama tab) dan deskripsi lokasi ringkas (`.location`).
   - **Kanan Header:** Mempunyai butang pertukaran bahasa (`.lang-btn`) yang dilengkapi teks penunjuk bahasa (contoh: "EN" atau "MS") beserta ikon bola dunia (Globe/Language icon).
   
4. **Perincian 5 Tab Utama:**
   - **i. Tab Home (`view-home`):**
     - **Info Terkini (Promotions & News):** Menggunakan reka bentuk Poster Segi Empat Tepat (*Rectangular Auto Slide Poster*). Poster akan meluncur ke tepi secara automatik dan mempunyai titik navigasi (*dot pagination*) di bawahnya.
     - **Review Pelanggan (Live Customer Reviews):** Memaparkan senarai ulasan melalui **Endless Slide 2 Track**. Landasan atas (`track-left`) akan meluncur tanpa henti ke arah kiri, manakala landasan bawah (`track-right`) meluncur tanpa henti ke arah kanan. Ini mewujudkan kesan visual moden yang sangat memukau.
   - **ii. Tab Services (`view-services`):**
     - Mempunyai 3 bahagian utama yang dikawal oleh *Segmented Control* (Gaya Butang Pil seperti iOS):
       1. **Haircuts:** Paparan utama untuk servis gunting rambut asas.
       2. **Treatments:** Senarai rawatan khas (Skrub/Cuci).
       3. **On Call Service:** Borang tempahan khas jurugunting ke lokasi rumah. Pelanggan perlu menaip *Full Home Address*, memilih *Service*, dan memilih *Barber* dari senarai juntai bawah (*dropdown*).
   - **iii. Tab Products (`view-products`):**
     - Menempatkan kotak carian melengkung (`#product-search`) di bahagian atas.
     - Memaparkan *Katalog Produk Premium* di dalam Grid Dinamik bersama *Badge* pemantau bil troli.
   - **iv. Tab Notifications (`view-notifications`):**
     - Senarai notifikasi umum yang ringkas tentang status kemas kini tempahan (Booking Updates).
   - **v. Tab Account (`view-account`):**
     - **Mod Log Keluar (Logged Out):** Memaparkan borang *Login* (serta-merta) dan *Register* menggunakan *Segmented Tab*. Dilengkapi Modal Lupa Kata Laluan dan Pemilih Avatar.
     - **Mod Log Masuk (Logged In):** Memaparkan gambar profil bulat berbingkai biru, nombor telefon pengguna, dan butang "Logout" berwarna merah jambu/merah. Turut mempunyai bahagian *Give Customer Review* dengan ciri Rating 5 Bintang (*Star Rating UI*), dan *Your Activity List* (Sejarah transaksi).

5. **Laci Pemilihan Jadual (Schedule Drawer / Bottom Sheet):**
   - **Lapis Atas (Kalendar):** Latar belakang biru `#1877F2`, bucu bawah dibulatkan (`border-bottom-radius: 24px`), `z-index: 2`. Jatuh dari atas skrin sedikit, dilengkapkan dengan `box-shadow` tebal supaya kelihatan timbul.
   - **Lapis Bawah (Slot Masa):** Menggelongsor dari bawah dengan latar `#F0F4F9`. Bahagian atas ditolak ke atas (`margin-top: -30px`) supaya ia rapat menyusup ke bawah kalendar tanpa lompang.
   
6. **Borang Edit Troli (Swipe-to-Delete):**
   - Boleh digeser ke kiri (*swipe/drag*). Apabila digeser, kotak butang merah (Delete, `#FF3B30`) terserlah dari belakang.
   
7. **Floating Checkout Bar:**
   - Palang terapung yang sentiasa duduk tepat di atas *Bottom Nav* (`bottom: 70px`). 
   - Mempunyai ikon butang bakul (Edit Troli) dan butang biru "Checkout" bersudut bulat yang akan membuka tetingkap **Unified Checkout Modal** (Pembayaran QR DuitNow & Alamat Penghantaran).

### B. Portal Staf (`staff.html`) - Panel Operasi Pekerja
Fokus UI di sini adalah kecekapan tinggi dan pembacaan yang jelas ketika pekerja sibuk.
1. **Modul Punch Card (Kehadiran):**
   - Kad gergasi di bahagian atas memaparkan Jam Digital secara *live*. 
   - Butang Punch In/Out yang besar. UI akan menganalisis koordinat Geofencing di latar belakang sebelum membenarkan interaksi. Butang menjadi kusam (*disabled*) semasa pemprosesan.
2. **Pengurusan Tab (Online Bookings vs Walk-In):**
   - Butang navigasi memanjang di atas untuk jurugunting menukar senarai pesanan dalam sekelip mata.
3. **Kad Tempahan (Order Cards):**
   - Setiap tempahan dibalut dengan kad tebal berlatarkan warna yang membezakan status (cth: Kuning = Menunggu, Hijau = Selesai).
   - Terdapat butang pantas "Sahkan Hadir" yang memaparkan transisi *loading spinner* sebaik ditekan untuk mengelakkan *double-click*.

### C. Portal Pemilik (`owner.html`) - Papan Pemuka Eksekutif & Ejen AI
Direka bentuk seakan perisian analisis kewangan gred-Enterprise dan pusat arahan AI.
1. **Kad Analitik Kewangan:**
   - 3 Blok Metrik Utama: *Net Revenue* (Hasil Asas Servis - Warna Hijau), *Collected Fees* (Yuran Tempahan/Sistem - Warna Oren), dan *Staf Aktif* (Warna Biru).
   - Elemen penomboran tebal dan besar (Saiz fon > 24px) membolehkan bacaan sepintas lalu.
2. **Visualisasi Data (Chart.js):**
   - Bar Chart (Carta Palang) untuk prestasi kehadiran staf individu.
   - Line Chart (Carta Garisan melengkung yang cantik) bergradien biru yang mewakili tren jualan bulanan.
3. **Modul Ejen AI Pintar (Dinspire AI Insights):**
   - **Mod Gelap Eksklusif:** Konsol bual AI direka dengan `background: #1C1C1E` (Hitam/Kelabu Gelap) dan teks putih terang, memberikan karakter "Penasihat Robotik Elit".
   - **UI Action Triggers:** Apabila AI memberi cadangan berbentuk nombor atau graf, pergerakan sistem dibina sebati (AI boleh menghantar kod `SWITCH_TAB` dan menukar tab UI pemilik secara fizikal seolah-olah ia menekan butang untuk kita).

### D. Portal Pentadbir (`admin.html`) - Pangkalan Data Master
Platform berbentuk Grid dan Panel, sesuai untuk kegunaan komputer riba (PC Desktop) dan Mudah Alih.
1. **Sidebar / Dropdown Menu:**
   - Ruang kiri skrin memuatkan navigasi ke *Master Data* (Cawangan, Staf, Kategori, Servis). Di skrin kecil, ia diubah menjadi butang menu lipat (Hamburger Dropdown).
2. **Jadual Data Dinamik (Dynamic Grid):**
   - Jadual diilhamkan daripada paparan "Airtable / Excel".
   - **Inline Editing UI:** Setiap baris grid mempunyai input medan (*input fields*) yang boleh ditaip dan terus disimpan (butang "Save" berwarna hijau muncul setelah diubah).
   - **Micro-Interaction:** Setiap baris diselangi baris pudar (*zebra striping*) dan mempunyai animasi menonjol (*hover highlight*) apabila tetikus melintasinya. Ikon sampah berwarna merah berada di setiap hujung baris untuk tindakan memadam.

---

## 3. Garis Panduan Maklum Balas Visual (Feedback UX)

Bagi menjamin keselamatan pengguna dan pengalaman mewah:
- **Tiada Amaran Pelayar (No Alert Boxes):** Semua ralat atau kejayaan dipaparkan menggunakan elemen `Toast` terapung (atau *SweetAlert2* berkonsep moden) di bahagian atas/bawah skrin yang masuk secara licin (*slide-in*) dan hilang sendiri (*fade-out* selepas 3 saat).
- **Keselamatan XSS Visual:** Segala maklumat di dalam UI (komen pelanggan, nama servis) tidak akan merosakkan kod HTML sekiranya terdapat aksara pelik (contoh: `<script>`), kerana ia telah disaring melalui logik sanitasi `escapeHTML()`.
- **Skeleton Loaders:** Sekiranya kelajuan internet pelanggan perlahan, UI tidak akan nampak pecah/kosong. Sebaliknya, blok-blok bayang kelabu berkelip akan memenuhi skrin sehinggalah susun atur data sebenar selesai dimuat turun.

---
*Blueprint UI/UX ini perlu dititikberatkan setiap kali pengubahsuaian sistem baharu dilakukan bagi memastikan pengalaman Dinspire kekal pada standard tertinggi dalam industri.*
