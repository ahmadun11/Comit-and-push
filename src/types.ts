export interface Sparepart {
  id?: number;
  nama: string;
  stok: number;
  hargaModal: number;
  hargaJual: number;
}

export type StatusServis = 'Dikerjakan' | 'Selesai' | 'Diambil' | 'Cancel';

export interface ServisItem {
  id?: number;
  noNota: string;
  tanggal: string; // DD/MM/YYYY
  tanggalDiambil?: string;
  namaPelanggan: string;
  noHp: string;
  tipeHp: string;
  imei?: string;
  keluhan: string;
  idSparepart?: number | null;
  namaSparepart?: string;
  modalSparepart?: number;
  hargaSparepart?: number;
  jasaServis: number;
  totalBiaya: number;
  dp: number;
  status: StatusServis;
}

export type JenisKas = 'pemasukan' | 'pengeluaran';

export interface TransaksiKas {
  id?: number;
  tanggal: string; // DD/MM/YYYY
  jenis: JenisKas;
  kategori: string;
  nominal: number;
  metode: 'Cash' | 'Transfer' | 'QRIS';
  keterangan: string;
}

export interface Karyawan {
  id?: number;
  nama: string;
  noHp?: string;
  jabatan?: string;
}

export interface LaporanTutupBuku {
  id?: number;
  jenisArsip?: 'TUTUP_BUKU' | 'SUSULAN_MANUAL';
  tglMulai: string;
  tglSelesai: string;
  tglEksekusi: string;
  modalAwal?: number;
  totalPemasukan: number;
  totalPengeluaran: number;
  modalSparepart?: number;
  labaBersih: number;
  sisaSaldoAkhir?: number;
  rincianKas?: TransaksiKas[];
}

export interface PengaturanToko {
  namaKonter: string;
  hpKonter: string;
  alamatKonter: string;
  pinKasir?: string;
}

export interface PengaturanVisual {
  c1: string;
  c2: string;
  dir: string;
  op: number;
}

export type StatusJualBeli = 'Tersedia' | 'Terjual';

export interface JualBeliHp {
  id?: number;
  namaHp: string;
  imei?: string;
  kondisi?: string;
  hargaBeli: number;
  hargaJual: number;
  untung: number;
  status: StatusJualBeli;
  tanggalBeli: string; // DD/MM/YYYY
  tanggalTerjual?: string; // DD/MM/YYYY
  pembeli?: string;
  noHpPembeli?: string;
  catatan?: string;
}
