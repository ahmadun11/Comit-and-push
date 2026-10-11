# PANDUAN SINKRONISASI AKUN ANTARA PC DAN HP ANDROID (APK CAPACITOR)
**Aplikasi Kasir & Servis HP - Ahmad Teknisi**

---

## 🚀 Mengapa Data Bisa Sama 100% Antara PC dan HP?
Aplikasi ini dilengkapi sistem **Cloud Synchronization Real-Time (Firebase Firestore + IndexedDB Offline-First)**:
1. Setiap kali Anda menambah nota servis, uang kas, sparepart, atau jual beli HP di **HP**, data tersebut otomatis tersimpan di Cloud dan langsung muncul di layar **PC**.
2. Setiap kali Anda mengubah status servis atau menghapus data di **PC**, data di **HP Android** juga otomatis terupdate dalam hitungan detik tanpa perlu refresh manual.
3. Jika HP Anda sedang tidak ada sinyal internet, data tetap aman tersimpan di HP secara offline dan akan otomatis tersinkron ke PC saat terhubung kembali ke internet.

---

## 📱 Langkah-Langkah Menghubungkan Akun PC dan HP:

### Langkah 1: Buat Akun (User ID & Password) di PC atau HP
1. Buka aplikasi di PC.
2. Klik ikon profil atau menu **Akun & User ID** (atau saat pertama kali buka, pilih tab **Daftar Akun**).
3. Buat **User ID** (contoh: `ahmad_teknisi`) dan **Password** Anda.
4. Anda juga dapat mengatur **Password Keamanan Otorisasi** (untuk proteksi buka kunci dan hapus data).
5. Klik **Daftar** / **Simpan**.

### Langkah 2: Buka Aplikasi di HP Android (APK Capacitor)
1. Install dan buka APK di HP Android Anda.
2. Pada layar login, masukkan **User ID** dan **Password yang SAMA** dengan yang Anda buat di PC.
3. Klik **Login Akun**.

### Langkah 3: Selesai! Data Otomatis Tersinkronisasi
- Begitu berhasil login di HP, sistem akan mendeteksi akun Cloud Anda dan otomatis mengunduh semua data dari PC:
  - 🛠️ Semua Nota Servis & Status Pengerjaan
  - 💰 Arus Kas Toko & Kasbon Karyawan
  - 📦 Stok & Harga Sparepart
  - 📱 Unit Jual Beli HP
  - 👥 Data Karyawan & Pembagian Gaji
  - 📑 Riwayat Tutup Buku Toko
  - ⚙️ Pengaturan Toko (Nama Konter, WhatsApp, Alamat, PIN Kasir)
- Anda dapat menekan tombol **"Sinkron PC ⇄ HP"** di header kapan saja untuk memeriksa status atau memaksa update data terbaru.

---

## 🔒 Proteksi Password Keamanan & Hapus Data
- Fitur hapus data dan buka kunci mode edit dilindungi oleh **Password Keamanan Otorisasi**.
- Pengaturan password ini otomatis tersinkron antara PC dan HP.
- Jika ingin merubah password keamanan, Anda wajib memasukkan kode sebelumnya untuk keamanan.

---

## 🖨️ Diagnostik Bluetooth Printer Termal
- Untuk mencetak nota langsung dari HP atau PC ke printer Bluetooth POS/Kasir, gunakan tombol **Diagnostik Bluetooth** di menu atas atau pengaturan untuk menguji ketersediaan Web Bluetooth dan izin sistem.
