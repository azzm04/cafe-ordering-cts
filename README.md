# ☕ Coklat Tepi Sawah — Sistem Pemesanan Restoran

> Aplikasi pemesanan makanan berbasis web untuk restoran **Coklat Tepi Sawah**.  
> Pelanggan dapat memesan langsung dari meja tanpa mengunduh aplikasi apapun.

🔗 **Live Demo:** [cafe-ordering-cts.vercel.app](https://cafe-ordering-cts.vercel.app)

---

## Panduan Testing

### Akses Login Karyawan

| Role  | URL Login | PIN |
|-------|-----------|-----|
| Kasir | `/admin/kasir` | `111111` |
| Owner | `/admin/owner` | `123456` |

---

## Alur 1 — Sebagai Pelanggan (Self-Order)

Simulasikan pengalaman pelanggan yang memesan langsung dari meja.

**Langkah-langkah:**

1. Buka [cafe-ordering-cts.vercel.app](https://cafe-ordering-cts.vercel.app)
2. Pilih nomor meja yang tersedia (status **Tersedia**)
3. Telusuri menu berdasarkan kategori
4. Tambahkan item ke keranjang — bisa tambahkan **catatan khusus** per item
5. Buka keranjang → klik **Checkout**
6. Pilih metode pembayaran:
   - **Tunai** → pesanan langsung masuk ke kasir, bayar di tempat
   - **Online (QRIS)** → diarahkan ke halaman pembayaran Mayar.ID, scan QR
7. Setelah pembayaran berhasil → halaman nota otomatis berubah menjadi **"Pesanan Diterima"**


---

## 🧾 Alur 2 — Sebagai Kasir

Login ke dashboard kasir untuk memproses pesanan yang masuk.

**Login:** [cafe-ordering-cts.vercel.app/admin/kasir](https://cafe-ordering-cts.vercel.app/admin/kasir)  
**PIN:** `111111`

**Yang bisa dilakukan:**

- **Monitor pesanan real-time** — dashboard auto-refresh setiap 5 detik
- **Konfirmasi pembayaran tunai** — klik tombol konfirmasi pada pesanan cash pending
- **Update status dapur** — alur: `Diterima → Diproses → Disajikan → Selesai`
- **Terapkan voucher** — masukkan kode promo saat checkout pelanggan memintanya
- **Manual Order** — buat pesanan langsung dari dashboard untuk pelanggan yang tidak menggunakan HP

---

## Alur 3 — Sebagai Owner

Login ke dashboard owner untuk manajemen penuh restoran.

**Login:** [cafe-ordering-cts.vercel.app/admin/owner](https://cafe-ordering-cts.vercel.app/admin/owner)  
**PIN:** `123456`

**Yang bisa dilakukan:**

| Fitur | Deskripsi |
|-------|-----------|
| **Laporan Penjualan** | Grafik pendapatan harian, produk terlaris, total transaksi |
| **Kelola Menu** | Tambah, edit, nonaktifkan item menu beserta harga dan stok |
| **Kelola Voucher** | Buat kode diskon persentase atau nominal dengan batas minimum order |
| **Manajemen Meja** | Atur jumlah meja, ubah status meja secara manual |
| **Kelola Staff** | Tambah atau hapus akun kasir |

---

## 💳 Pembayaran Online — Test QRIS

Pembayaran online menggunakan **Mayar.ID** (production). Untuk keperluan testing:

- Gunakan QRIS dari aplikasi **GoPay, OVO, DANA, ShopeePay**, atau **m-Banking** manapun
- Nominal minimal sesuai harga menu yang dipesan
- Setelah pembayaran berhasil, status pesanan otomatis terupdate dalam **< 5 detik**

---

## 🛠️ Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 14 (App Router) + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Database | Supabase (PostgreSQL) |
| Auth | Custom PIN-based session |
| Payment | Mayar.ID (production) |
| Deploy | Vercel |

---

## 📁 Struktur Fitur Utama

```
/                    → Halaman utama
/pilih-meja          → Pilih nomor meja
/menu                → Daftar menu & keranjang
/checkout            → Konfirmasi pesanan & pembayaran
/nota/[orderNumber]  → Status pesanan real-time
/admin/kasir         → Dashboard kasir
/admin/owner         → Dashboard owner
/admin/vouchers      → Manajemen voucher (owner only)
```

---

## ⚠️ Catatan Penting

- Aplikasi menggunakan **payment gateway production** — pembayaran yang dilakukan adalah transaksi nyata
- Status meja akan otomatis terkunci saat ada pesanan aktif dan terbuka kembali setelah pesanan selesai
- Pesanan cash yang tidak dikonfirmasi dalam **60 menit** akan otomatis dibatalkan

---

