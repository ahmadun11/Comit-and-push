# PANDUAN MEMBUAT APK ANDROID MENGGUNAKAN CAPACITOR DI PC
**Aplikasi Kasir & Servis HP - Ahmad Teknisi**

---

## 🛠️ Persyaratan di PC:
1. **Node.js**: Versi 18 atau lebih baru ([nodejs.org](https://nodejs.org))
2. **Android Studio**: Sudah terinstal dengan Android SDK & Command Line Tools ([developer.android.com](https://developer.android.com/studio))
3. **Java JDK**: JDK 17 atau 21

---

## 📦 Langkah-Langkah Build APK:

### 1. Ekstrak Berkas Proyek ZIP
Ekstrak berkas `kasir-servis-hp-ahmad-teknisi.zip` ke folder di PC Anda, misalnya `D:\AhmadTeknisiApp`.

### 2. Buka Terminal / CMD di Folder Tersebut
Jalankan perintah instalasi dependensi:
```bash
npm install
```

### 3. Build Web Assets
Jalankan perintah build untuk menghasilkan folder `dist`:
```bash
npm run build
```

### 4. Tambahkan Platform Android (Jika belum ada folder android)
```bash
npx cap add android
```

### 5. Sinkronkan Berkas ke Folder Android
```bash
npx cap sync
```

### 6. Buka Proyek di Android Studio
```bash
npx cap open android
```
*Atau buka aplikasi Android Studio, pilih **Open**, lalu pilih folder `android` di dalam proyek.*

---

## 🎨 Memasang Ikon Resmi Aplikasi di Android Studio:
1. Di Android Studio, klik kanan pada folder **app** > **New** > **Image Asset**.
2. Pada opsi **Icon Type**, pilih **Launcher Icons (Adaptive and Legacy)**.
3. Pada **Source Asset** > **Path**, pilih berkas `public/icon.png` (resolusi 512x512 / 1024x1024).
4. Atur scaling (ukuran) agar logo pas di dalam lingkaran/persegi.
5. Klik **Next** lalu **Finish**.

---

## 📱 Build APK (Debug / Release):
1. Di menu atas Android Studio, klik **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
2. Tunggu proses Gradle selesai (sekitar 1-2 menit).
3. Setelah selesai, klik notifikasi **locate** di kanan bawah.
4. Salin berkas `app-debug.apk` ke HP Android Anda dan install!

---

## ☁️ Sinkronisasi Otomatis dengan PC:
Setelah APK terpasang di HP:
1. Buka aplikasi di HP.
2. Login dengan **User ID** dan **Password** yang sama dengan yang Anda gunakan di PC.
3. Semua nota servis, arus kas, sparepart, dan data konter otomatis tersinkronisasi 100% secara real-time via Cloud Firebase!
