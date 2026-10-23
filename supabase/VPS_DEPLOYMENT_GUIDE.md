# Panduan Pelaksanaan: Supabase Self-Hosted di Pelayan Sewa (VPS)

Dokumentasi ini disediakan khusus untuk membantu Tuan memindahkan dan menjalankan pangkalan data **Supabase Self-Hosted** secara autonomi di pelayan VPS baharu (seperti Contabo, Hetzner, DigitalOcean, Linode, AWS, dll).

---

## 1. Keperluan Asas Pelayan (VPS Requirements)
* **OS:** Ubuntu 22.04 LTS / 24.04 LTS (Disyorkan)
* **RAM:** Minimum 4GB RAM (8GB lebih lancar)
* **CPU:** Minimum 2 vCPU
* **Storan:** Minimum 40GB SSD / NVMe

---

## 2. Langkah Demi Langkah Pemasangan di VPS

### Langkah 1: Pasang Docker & Docker Compose
Log masuk ke VPS Tuan melalui SSH (`ssh root@ip-vps-tuan`), kemudian jalankan:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git ufw

# Pasang Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Pasang Docker Compose Plugin
sudo apt install -y docker-compose-plugin
```

---

### Langkah 2: Muat Turun Setup Supabase Rasmi
Di dalam direktori utama VPS (`/root` atau `/home/ubuntu`):
```bash
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker

# Salin fail konfigurasi persekitaran
cp .env.example .env
```

> [!IMPORTANT]
> **Kunci Keselamatan (`.env`):**
> Sila buka fail `.env` (`nano .env`) dan tukar nilai lalai berikut:
> * `POSTGRES_PASSWORD` (Kata laluan pangkalan data Tuan)
> * `JWT_SECRET` (Rentetan rahsia sekurang-kurangnya 32 aksara)
> * `ANON_KEY` & `SERVICE_ROLE_KEY` (Boleh dijana menggunakan JWT generator mengikut arahan Supabase)

---

### Langkah 3: Hidupkan Kontena Supabase
Jalankan arahan ini di dalam folder `supabase/docker`:
```bash
docker compose up -d
```
Semua perkhidmatan Supabase (Postgres, Kong, PostgREST, Studio, Storage, GoTrue) akan dihidupkan secara automatik di latar belakang.

---

### Langkah 4: Pulihkan (*Restore*) Pangkalan Data Dinspire
Pindahkan fail `supabase_master_dump.sql` yang telah kita jana dari komputer Tuan ke VPS menggunakan `scp`:
```bash
# Dari komputer lokal Tuan (PowerShell):
scp ./supabase/supabase_master_dump.sql root@ip-vps-tuan:/tmp/
```

Kemudian, di dalam terminal VPS, suntik fail tersebut ke dalam kontena PostgreSQL Supabase:
```bash
docker exec -i supabase-db psql -U postgres -d postgres < /tmp/supabase_master_dump.sql
```

Semua jadual, kekangan (*constraints*), indeks, dan **1,766+ rekod transaksi, staf, cawangan, serta tetapan** akan wujud serta-merta di pelayan sewa Tuan!

---

### Langkah 5: Sambungkan Backend Dinspire ke Pelayan Baharu
Buka fail `.env` pelayan Dinspire Tuan dan kemas kini:
```env
SUPABASE_URL=http://ip-vps-tuan:8000
SUPABASE_KEY=kunci_service_role_vps_tuan
```
*(Atau gunakan domain reverse-proxy Nginx dengan SSL, contoh: `https://db.dinspirebarbershop.com`)*

---

## 3. Rutin Kemas Kini Data dari Cloud (Jika Perlu pada Masa Depan)
Sekiranya sebelum Tuan menyewa pelayan terdapat pertambahan rekod baharu di Supabase Cloud, Tuan hanya perlu menjalankan:
```bash
npm run sync:db
```
di komputer lokal, dan fail salinan akan terus dikemas kini kepada data yang paling terkini!
