# PANDUAN LENGKAP MEMBUAT APK ANDROID MENGGUNAKAN CAPACITOR DI PC
### Aplikasi: Ahmad Teknisi - Kasir & Servis HP

Semua file source code, aset ikon aplikasi (**Ahmad Teknisi Services & Repair**), dan konfigurasi Capacitor sudah disiapkan lengkap di dalam paket ini.

---

## 🛠️ Persyaratan di PC Anda:
1. **Node.js** (Versi 18, 20, atau 22) - Download di [nodejs.org](https://nodejs.org)
2. **Android Studio** - Download di [developer.android.com/studio](https://developer.android.com/studio)
   * Pastikan saat instalasi mencentang **Android SDK**, **Android SDK Command-line Tools**, dan **Android Virtual Device / Build Tools**.

---

## 🚀 Langkah 1: Ekstrak & Buka Terminal di Folder Proyek
1. Ekstrak file zip `kasir-servis-hp-ahmad-teknisi.zip` ke folder di PC Anda (contoh: `D:\Proyek\KasirHp`).
2. Buka aplikasi **Command Prompt (cmd)** atau **PowerShell** atau **VS Code**, lalu arahkan ke folder hasil ekstrak tersebut:
   ```bash
   cd D:\Proyek\KasirHp
   ```

---

## 📦 Langkah 2: Install Dependensi & Build Aplikasi
Jalankan perintah berikut secara berurutan:

```bash
# 1. Install semua dependensi web & react
npm install

# 2. Pasang library Capacitor Android
npm install @capacitor/core @capacitor/cli @capacitor/android

# 3. Build file web menjadi folder dist
npm run build
```

---

## 🤖 Langkah 3: Inisialisasi Platform Android
Jalankan perintah untuk membuat proyek Android:

```bash
npx cap add android
```
*Perintah ini akan membuat folder baru bernama `android/` di dalam proyek Anda.*

---

## 🎨 Langkah 4: Memasang Ikon Aplikasi (Logo Ahmad Teknisi)
Kami sudah menyiapkan ikon logo dalam resolusi tinggi dan format Android lengkap! Anda bisa memilih salah satu cara termudah berikut:

### Opsi A (Paling Mudah - Salin Langsung Folder `android-res`):
1. Buka folder `android-res` yang ada di dalam proyek ini. Di dalamnya terdapat 5 folder:
   * `mipmap-mdpi`
   * `mipmap-hdpi`
   * `mipmap-xhdpi`
   * `mipmap-xxhdpi`
   * `mipmap-xxxhdpi`
2. Salin (copy) semua folder tersebut, lalu tempel (paste / replace) ke lokasi:
   `android/app/src/main/res/`
3. Selesai! Semua ukuran ikon launcher dan ikon bulat (round) otomatis terpasang dengan rapi.

### Opsi B (Otomatis menggunakan Capacitor Assets):
Jalankan perintah:
```bash
npx @capacitor/assets generate --android
```
*(Perintah ini akan otomatis membaca file `resources/icon.png` 1024x1024 yang sudah kami sediakan).*

---

## 📡 Langkah 5: Izin Bluetooth & Internet di `AndroidManifest.xml`
Agar printer thermal Bluetooth dan koneksi Firebase dapat berjalan normal di dalam APK:

1. Buka file: `android/app/src/main/AndroidManifest.xml`
2. Tambahkan baris izin berikut di dalam tag `<manifest ...>` (sebelum tag `<application>`):

```xml
    <!-- Izin Akses Internet & Jaringan -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <!-- Izin Bluetooth Printer Thermal -->
    <uses-permission android:name="android.permission.BLUETOOTH" />
    <uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
    <uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />
    <uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
    <uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />
```

3. Pada tag `<application ...>`, pastikan tambahkan atribut:
```xml
    android:usesCleartextTraffic="true"
```

---

## 📱 Langkah 6: Sinkronkan & Buka di Android Studio
Setiap kali selesai melakukan build atau perubahan, jalankan:

```bash
# Sinkronkan kode web terbaru ke folder android
npx cap sync android

# Buka proyek di Android Studio
npx cap open android
```

---

## 🔨 Langkah 7: Generate File APK Siap Pakai!
1. Tunggu Android Studio selesai melakukan proses **Gradle Sync** (tunggu loading bar di pojok kanan bawah selesai).
2. Di menu atas Android Studio, klik:
   **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**
3. Tunggu 1 - 2 menit hingga muncul notifikasi balon di kanan bawah:
   `APK(s) generated successfully for module 'app' with 1 build variant.`
4. Klik tulisan biru bertuliskan **locate**.
5. File `app-debug.apk` Anda sudah jadi! Salin file APK tersebut ke HP Android Anda dan lakukan install.

---

### 🎉 Selamat!
Aplikasi **Ahmad Teknisi - Kasir & Servis HP** kini siap digunakan secara offline & online di HP Android Anda dengan logo resmi!
