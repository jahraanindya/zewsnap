# Zewsnap! Photobooth (PHP + MySQL)

Website photobooth dengan login, galeri, upload frame sendiri (lubang foto terdeteksi otomatis), mini games, dan dashboard admin. Semua data tersimpan di database dan folder `uploads/` di server, jadi bisa dibuka dari perangkat mana pun.

## Isi folder
Satu halaman, satu file:

| File | Fungsi |
|---|---|
| `index.html` | Halaman awal (landing) |
| `login.html` | Masuk / daftar |
| `booth.html` | Booth foto (strip, frame, filter, kamera, retake, stiker) |
| `frames.html` | Frame saya (upload template dan editor slot) |
| `gallery.html` | Galeri foto |
| `arcade.html` | Mini games dan papan skor |
| `admin.html` | Dashboard admin |
| `css/style.css` | Semua gaya tampilan |
| `js/common.js` | Dipakai semua halaman: panggilan API, menu atas, cek login |
| `js/frame-editor.js` | Deteksi lubang foto dan editor slot (dipakai booth dan frames) |
| `js/booth.js`, `frames.js`, `gallery.js`, `arcade.js`, `admin.js`, `login.js` | Logika masing-masing halaman |
| `api/index.php` | API backend (daftar, login, frame, foto, skor, stiker, admin) |
| `api/config.php` | Pengaturan koneksi database (WAJIB diisi) |
| `database.sql` | Skema tabel dan data awal |
| `uploads/` | Tempat frame dan foto hasil (otomatis terisi) |

Halaman selain `index.html` dan `login.html` otomatis mengarahkan ke login bila belum masuk, dan `admin.html` hanya untuk admin.

## Jalankan di komputer sendiri (XAMPP)
1. Salin folder ini ke `htdocs/zewsnap`, lalu jalankan Apache dan MySQL di XAMPP.
2. Buka phpMyAdmin, buat database baru bernama `zewsnap` (collation `utf8mb4_general_ci`).
3. Pilih database itu, buka tab Import, pilih `database.sql`, klik Go.
4. Buka `http://localhost/zewsnap/`. Pengaturan bawaan `api/config.php` sudah cocok untuk XAMPP.

## Hosting di InfinityFree
1. Daftar di infinityfree.com dan buat akun hosting (pilih subdomain).
2. Di panel hosting, buka **MySQL Databases**, buat database baru. Catat: host MySQL (mirip `sqlXXX.infinityfree.com`), nama database (berawalan `if0_...`), username, dan password.
3. Buka **phpMyAdmin** dari panel, pilih database tadi, tab **Import**, pilih `database.sql`.
4. Edit `api/config.php`: isi host, db, user, dan pass sesuai langkah 2.
5. Upload isi folder (`index.html`, `api/`, `uploads/`) ke folder `htdocs` lewat Online File Manager atau FTP.
6. Aktifkan **Free SSL Certificate** di panel, lalu buka situs lewat `https://`. Kamera browser hanya jalan di HTTPS (atau localhost).
7. Masuk dengan `admin` / `admin123`. **Segera ganti**: daftar akun baru lewat website, buka tabel `users` di phpMyAdmin, ubah kolom `role` akun baru itu menjadi `admin`, lalu hapus akun `admin` bawaan.

Catatan: akun gratis punya batas ukuran file dan trafik, jadi gunakan frame di bawah sekitar 2 MB.

## Cara pakai template frame
1. Di booth langkah **Frame** (atau menu **Frame Saya**), upload gambar template (PNG atau JPG, ukuran bebas).
2. Lubang foto terdeteksi otomatis jika berupa area transparan, hitam, hijau, magenta, atau putih. Kalau tidak terdeteksi, naikkan slider toleransi atau klik area yang ingin dijadikan slot.
3. Atur slot (geser, ubah ukuran, hapus) lalu simpan. Jumlah foto mengikuti jumlah slot, dan ukuran strip mengikuti ukuran gambar.
4. Frame yang diupload admin tampil untuk semua pengguna.

## Tabel database
| Tabel | Isi |
|---|---|
| `users` | username, password ter-hash, role (user/admin) |
| `frames` | pemilik, nama, file, ukuran, posisi slot (JSON), penanda frame global |
| `photos` | pemilik, frame yang dipakai, file hasil |
| `scores` | skor terbaik per pengguna per game |
| `stickers` | emoji stiker yang dikelola admin |

## Keamanan yang sudah diterapkan
Password di-hash (`password_hash`), semua query memakai prepared statement, sesi memakai cookie HttpOnly + SameSite, request tulis wajib JSON, upload divalidasi sebagai PNG asli dengan nama acak, folder `uploads/` tidak boleh menjalankan script, dan aksi admin dicek di server.
