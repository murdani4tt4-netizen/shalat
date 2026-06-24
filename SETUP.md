# Absensi Sholat - Panduan Setup

## Langkah Setup (3 langkah)

### 1. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Buka **SQL Editor** di Supabase Dashboard
3. Copy-paste seluruh isi file `supabase-schema.sql` lalu klik **Run**
4. Buka **Settings > API**, salin:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 2. Konfigurasi Environment

Buka file `.env.local` dan isi:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
```

### 3. Deploy ke Vercel

**Via GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/USERNAME/absensi-sholat.git
git push -u origin main
```

Lalu:
1. Buka [vercel.com](https://vercel.com), import repository GitHub
2. Di **Environment Variables**, tambahkan semua variabel dari `.env.local`
3. Klik **Deploy**

---

## Fitur Aplikasi

| Fitur | Keterangan |
|-------|------------|
| Absensi 5 Waktu | Subuh, Dzuhur, Ashar, Maghrib, Isya |
| Scan Wajah | Face recognition dengan @vladmandic/face-api |
| Admin Panel | CRUD santri, laporan, pengaturan |
| WhatsApp Otomatis | Notifikasi ke orang tua via Fonnte API |
| Export CSV | Download laporan kehadiran |

## Alur Penggunaan

### Untuk Admin:
1. Login di `/login` (default: admin / admin123)
2. Tambah santri di **Data Santri**
3. Registrasi wajah setiap santri (klik ikon kamera)
4. Lihat rekap di **Laporan**

### Untuk Absensi:
1. Buka `/dashboard`
2. Pilih waktu sholat
3. Klik nama santri
4. Scan wajah → Terverifikasi → Notifikasi WA terkirim

## WhatsApp (Opsional)

1. Daftar di [fonnte.com](https://fonnte.com)
2. Dapatkan API Key dan Device ID
3. Isi di **Pengaturan > Notifikasi WhatsApp**

## Struktur File

```
src/
  app/
    page.tsx              # Landing page
    login/page.tsx        # Login admin
    dashboard/page.tsx    # Dashboard 5 waktu sholat
    absensi/page.tsx      # Halaman absensi + scan wajah
    admin/
      layout.tsx          # Sidebar admin
      page.tsx            # Dashboard admin
      santri/page.tsx     # CRUD santri
      santri/[id]/face-register/page.tsx
      laporan/page.tsx    # Laporan absensi
      pengaturan/page.tsx # Settings
    api/
      login/route.ts      # Login API
      attendance/route.ts # Attendance API
      whatsapp/route.ts   # WhatsApp notification API
  components/
    face-scanner.tsx     # Face verification component
    face-register.tsx    # Face registration component
  lib/
    supabase.ts          # Supabase client
    store.ts             # Zustand state management
    types.ts             # TypeScript types
    face-utils.ts        # Face-api utilities
public/models/           # Face detection AI models
supabase-schema.sql      # Database schema
```