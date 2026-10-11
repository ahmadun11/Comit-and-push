/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { 
  openDatabase, 
  getAllFromStore, 
  addToStore, 
  putToStore, 
  deleteFromStore, 
  formatDateToDMY,
  formatRupiah 
} from './services/db';
import { 
  auth, 
  onAuthStateChanged, 
  fbSignOut, 
  syncLocalCollectionToCloud, 
  fetchCloudCollection,
  getCurrentDomain,
  dbCloud 
} from './services/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import { 
  ServisItem, 
  Sparepart, 
  TransaksiKas, 
  Karyawan, 
  LaporanTutupBuku, 
  PengaturanToko, 
  PengaturanVisual, 
  StatusServis,
  JualBeliHp
} from './types';

import { Header } from './components/Header';
import { Navigation, TabType } from './components/Navigation';
import { DashboardTab } from './components/DashboardTab';
import { ServisTab } from './components/ServisTab';
import { JualBeliTab } from './components/JualBeliTab';
import { KasTab } from './components/KasTab';
import { StokTab } from './components/StokTab';
import { LaporanTab } from './components/LaporanTab';

import { AkunModal } from './components/AkunModal';
import { AuthorizedDomainModal } from './components/AuthorizedDomainModal';
import { LoginModal } from './components/LoginModal';
import { NotaModal } from './components/NotaModal';
import { KalkulatorModal } from './components/KalkulatorModal';
import { KaryawanModal } from './components/KaryawanModal';
import { PengaturanModal } from './components/PengaturanModal';
import { VisualModal } from './components/VisualModal';
import { ConfirmModal } from './components/ConfirmModal';
import { UnlockModal } from './components/UnlockModal';
import { BluetoothDiagnosticModal } from './components/BluetoothDiagnosticModal';
import { SyncModal } from './components/SyncModal';
import { 
  pushItemToCloud, 
  deleteItemFromCloud, 
  pushSettingsToCloud, 
  performFullCloudSync, 
  setupRealtimeCloudListeners 
} from './services/cloudSync';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  // Confirmation Modal state (safe in iframes)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'danger' | 'warning' | 'info';
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Ya, Hapus',
    cancelText: 'Batal',
    variant: 'danger',
    onConfirm: () => {}
  });

  // Auth & Session
  const [userAccount, setUserAccount] = useState<string | null>(() => {
    return localStorage.getItem('userAccount') || null;
  });
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [currentUid, setCurrentUid] = useState<string | null>(null);

  // Security mode
  const [isModeEditUnlocked, setIsModeEditUnlocked] = useState(false);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);

  // Bluetooth Diagnostic Modal state
  const [isBluetoothDiagnosticOpen, setIsBluetoothDiagnosticOpen] = useState(false);

  // Cloud Sync state (PC ⇄ HP Android APK)
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(() => localStorage.getItem('last_cloud_sync_time'));

  const handleToggleModeEdit = () => {
    if (isModeEditUnlocked) {
      setIsModeEditUnlocked(false);
    } else {
      setIsUnlockModalOpen(true);
    }
  };

  // Store & Visual config
  const [toko, setToko] = useState<PengaturanToko>(() => {
    const savedName = localStorage.getItem('namaKonter');
    return {
      namaKonter: (savedName && savedName !== 'FAZTA CELL') ? savedName : 'A Teknisi',
      hpKonter: localStorage.getItem('hpKonter') || '0812-3456-7890',
      alamatKonter: localStorage.getItem('alamatKonter') || 'Garansi servis berlaku sesuai nota fisik. Terima kasih!',
      pinKasir: localStorage.getItem('pinKasir') || '123456'
    };
  });

  const [visual, setVisual] = useState<PengaturanVisual>(() => {
    const saved = localStorage.getItem('cfgVisual');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return {
      c1: '#0a1128',
      c2: '#1e3a8a',
      dir: '135deg',
      op: 94
    };
  });

  const [modalAwalKas, setModalAwalKas] = useState<number>(() => {
    return parseFloat(localStorage.getItem('modalAwalKas') || '0') || 0;
  });

  // Data Stores
  const [servisList, setServisList] = useState<ServisItem[]>([]);
  const [jualBeliList, setJualBeliList] = useState<JualBeliHp[]>([]);
  const [sparepartList, setSparepartList] = useState<Sparepart[]>([]);
  const [kasList, setKasList] = useState<TransaksiKas[]>([]);
  const [historiList, setHistoriList] = useState<LaporanTutupBuku[]>([]);
  const [karyawanList, setKaryawanList] = useState<Karyawan[]>([]);

  // Modals state
  const [isAkunOpen, setIsAkunOpen] = useState(false);
  const [isKalkulatorOpen, setIsKalkulatorOpen] = useState(false);
  const [isKaryawanOpen, setIsKaryawanOpen] = useState(false);
  const [isPengaturanOpen, setIsPengaturanOpen] = useState(false);
  const [isVisualOpen, setIsVisualOpen] = useState(false);
  const [isDomainGuideOpen, setIsDomainGuideOpen] = useState(false);
  const [selectedServisNota, setSelectedServisNota] = useState<ServisItem | null>(null);

  // Initial Load from DB
  const refreshAllData = async () => {
    try {
      await openDatabase();
      const [sp, srv, kas, his, kry, jb] = await Promise.all([
        getAllFromStore<Sparepart>('sparepart'),
        getAllFromStore<ServisItem>('servis'),
        getAllFromStore<TransaksiKas>('kas'),
        getAllFromStore<LaporanTutupBuku>('laporan_tutup_buku'),
        getAllFromStore<Karyawan>('karyawan'),
        getAllFromStore<JualBeliHp>('jual_beli_hp')
      ]);

      let kryList = kry || [];
      if (kryList.length === 0) {
        const savedKry = localStorage.getItem('karyawanList');
        if (savedKry) {
          try {
            kryList = JSON.parse(savedKry);
          } catch {}
        }
      }

      setSparepartList(sp);
      setServisList(srv);
      setKasList(kas);
      setHistoriList(his);
      setKaryawanList(kryList);
      setJualBeliList(jb || []);

      if (kryList.length > 0) {
        localStorage.setItem('karyawanList', JSON.stringify(kryList));
      }
    } catch (err) {
      console.error('Error loading database:', err);
    }
  };

  useEffect(() => {
    refreshAllData();

    // Check Firebase Auth and local session
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        const identifier = user.displayName || user.email || 'Pengguna';
        setUserAccount(identifier);
        setCurrentUid(user.uid);
        localStorage.setItem('userAccount', identifier);
        localStorage.setItem('currentUid', user.uid);
        setIsLoginModalOpen(false);
      } else {
        const savedAccount = localStorage.getItem('userAccount');
        const savedUid = localStorage.getItem('currentUid');
        if (savedAccount) {
          setUserAccount(savedAccount);
          if (savedUid) setCurrentUid(savedUid);
          setIsLoginModalOpen(false);
        } else {
          setIsLoginModalOpen(true);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Full Cloud Sync & Real-time Listeners (PC ⇄ HP Android APK)
  const handleManualSync = async () => {
    if (!currentUid) {
      setIsLoginModalOpen(true);
      return;
    }
    setIsSyncing(true);
    const res = await performFullCloudSync(currentUid, toko, modalAwalKas);
    setIsSyncing(false);
    if (res.success) {
      const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setLastSyncTime(nowStr);
      if (res.updatedToko) setToko(res.updatedToko);
      if (typeof res.updatedModalKas === 'number') setModalAwalKas(res.updatedModalKas);
      if (res.updatedVisual) setVisual(res.updatedVisual);
      await refreshAllData();
    }
  };

  useEffect(() => {
    if (!currentUid) return;

    let isMounted = true;

    // 1. Initial full bidirectional sync on mount/login
    handleManualSync();

    // 2. Real-time listener: instant changes between PC and Android APK
    const unsubscribeRealtime = setupRealtimeCloudListeners(currentUid, () => {
      if (isMounted) {
        refreshAllData();
      }
    });

    return () => {
      isMounted = false;
      unsubscribeRealtime();
    };
  }, [currentUid]);

  // Financial calculations
  const { totalPemasukan, totalPengeluaran, totalKasbon, modalSparepartTerpakai, saldoKas, labaBersih } = useMemo(() => {
    let pem = 0;
    let pengOperasional = 0;
    let kasbon = 0;
    let modalSp = 0;

    kasList.forEach(k => {
      if (k.jenis === 'pemasukan') {
        pem += k.nominal;
      } else if (k.jenis === 'pengeluaran') {
        const isKasbon = (
          k.kategori === 'Kasbon Karyawan' &&
          k.keterangan &&
          k.keterangan.toLowerCase().includes('kasbon')
        );
        const isGaji = (
          k.kategori === 'Gaji Karyawan' ||
          k.kategori === 'Bagi Hasil Karyawan' ||
          (k.keterangan && k.keterangan.toLowerCase().includes('gaji'))
        );

        if (isKasbon) {
          if (!k.keterangan.includes('[LUNAS_GAJI]')) {
            kasbon += k.nominal;
          }
        } else if (!isGaji) {
          // Gaji karyawan TIDAK dihitung di pengeluaran operasional toko
          pengOperasional += k.nominal;
        }
      }
    });

    servisList.forEach(s => {
      if (s.status !== 'Cancel') {
        modalSp += (s.modalSparepart || 0);
      }
    });

    // Saldo kas uang real = modal awal + pemasukan - operasional - kasbon aktif
    const saldo = modalAwalKas + pem - pengOperasional - kasbon;
    // Laba bersih toko = pemasukan - modal sparepart - operasional toko
    const laba = pem - modalSp - pengOperasional;

    return {
      totalPemasukan: pem,
      totalPengeluaran: pengOperasional,
      totalKasbon: kasbon,
      modalSparepartTerpakai: modalSp,
      saldoKas: saldo,
      labaBersih: laba
    };
  }, [kasList, servisList, modalAwalKas]);

  // Handlers for Servis
  const handleAddServis = async (newItem: Omit<ServisItem, 'id'>, idSparepartUsed?: number | null) => {
    const id = await addToStore('servis', newItem);
    const created = { ...newItem, id };

    // Deduct stock if sparepart used
    if (idSparepartUsed) {
      const sp = sparepartList.find(s => s.id === idSparepartUsed);
      if (sp && sp.stok > 0) {
        const updated = { ...sp, stok: sp.stok - 1 };
        await putToStore('sparepart', updated);
        if (currentUid) pushItemToCloud(currentUid, 'sparepart', updated);
      }
    }

    // Auto-record DP to Kas if dp > 0
    if (newItem.dp > 0) {
      const dpKas: Omit<TransaksiKas, 'id'> = {
        tanggal: newItem.tanggal,
        jenis: 'pemasukan',
        kategori: 'DP Servis',
        nominal: newItem.dp,
        metode: 'Cash',
        keterangan: `DP Servis ${newItem.noNota} (${newItem.namaPelanggan})`
      };
      const kasId = await addToStore('kas', dpKas);
      if (currentUid) pushItemToCloud(currentUid, 'kas', { ...dpKas, id: kasId });
    }

    if (currentUid) {
      await pushItemToCloud(currentUid, 'servis', created);
    }

    await refreshAllData();
    setSelectedServisNota(created);
  };

  const handleUpdateStatusServis = async (id: number, statusBaru: StatusServis) => {
    const item = servisList.find(s => s.id === id);
    if (!item) return;

    const statusLama = item.status;
    const todayStr = formatDateToDMY(new Date());

    const updatedItem: ServisItem = {
      ...item,
      status: statusBaru,
      tanggalDiambil: statusBaru === 'Diambil' ? todayStr : '-'
    };

    await putToStore('servis', updatedItem);
    if (currentUid) pushItemToCloud(currentUid, 'servis', updatedItem);

    // If changed to Diambil -> Auto-record remaining balance to Kas Pemasukan!
    if (statusBaru === 'Diambil' && statusLama !== 'Diambil') {
      const sisa = item.totalBiaya - item.dp;
      if (sisa > 0) {
        const pelunasanKas: Omit<TransaksiKas, 'id'> = {
          tanggal: todayStr,
          jenis: 'pemasukan',
          kategori: 'Pembayaran Servis',
          nominal: sisa,
          metode: 'Cash',
          keterangan: `Pelunasan Servis ${item.noNota} (${item.namaPelanggan} - ${item.tipeHp})`
        };
        const kasId = await addToStore('kas', pelunasanKas);
        if (currentUid) pushItemToCloud(currentUid, 'kas', { ...pelunasanKas, id: kasId });
      }
    } else if (statusBaru === 'Cancel' && statusLama !== 'Cancel' && item.dp > 0) {
      // If Cancel -> Auto refund DP to Kas Pengeluaran
      const refundKas: Omit<TransaksiKas, 'id'> = {
        tanggal: todayStr,
        jenis: 'pengeluaran',
        kategori: 'Pengeluaran Lainnya',
        nominal: item.dp,
        metode: 'Cash',
        keterangan: `Pengembalian DP (Servis Cancel ${item.noNota} - ${item.namaPelanggan})`
      };
      const kasId = await addToStore('kas', refundKas);
      if (currentUid) pushItemToCloud(currentUid, 'kas', { ...refundKas, id: kasId });
    }

    await refreshAllData();
  };

  const handleUpdateServis = async (updated: ServisItem) => {
    await putToStore('servis', updated);
    if (currentUid) pushItemToCloud(currentUid, 'servis', updated);
    await refreshAllData();
  };

  const handleDeleteServis = (id: number) => {
    const item = servisList.find(s => s.id === id);
    const label = item ? `${item.noNota} (${item.namaPelanggan})` : 'ini';
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Nota Servis?',
      message: `Yakin ingin menghapus nota servis ${label} dari sistem?`,
      confirmText: 'Ya, Hapus Servis',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteFromStore('servis', id);
          if (currentUid) {
            await deleteItemFromCloud(currentUid, 'servis', id);
          }
        } catch (e) {
          console.warn('Delete servis error:', e);
        }
        setServisList(prev => prev.filter(s => s.id !== id));
        await refreshAllData();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Handlers for Kas
  const handleAddKas = async (kas: Omit<TransaksiKas, 'id'>) => {
    const id = await addToStore('kas', kas);
    if (currentUid) pushItemToCloud(currentUid, 'kas', { ...kas, id });
    await refreshAllData();
  };

  const handleUpdateKas = async (kas: TransaksiKas) => {
    await putToStore('kas', kas);
    if (currentUid) pushItemToCloud(currentUid, 'kas', kas);
    await refreshAllData();
  };

  const handleDeleteKas = (id: number) => {
    const item = kasList.find(k => k.id === id);
    const label = item ? `${item.keterangan} (${formatRupiah(item.nominal)})` : 'ini';
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Transaksi Kas?',
      message: `Yakin ingin menghapus transaksi kas ${label}?`,
      confirmText: 'Ya, Hapus Kas',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteFromStore('kas', id);
          if (currentUid) {
            await deleteItemFromCloud(currentUid, 'kas', id);
          }
        } catch (e) {
          console.warn('Delete kas error:', e);
        }
        setKasList(prev => prev.filter(k => k.id !== id));
        await refreshAllData();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const handleSaveKasbon = async (tgl: string, nama: string, nominal: number, ket: string) => {
    const kasbonItem: Omit<TransaksiKas, 'id'> = {
      tanggal: tgl,
      jenis: 'pengeluaran',
      kategori: 'Kasbon Karyawan',
      nominal: nominal,
      metode: 'Cash',
      keterangan: `Kasbon - ${nama} (${ket || 'Uang jalan'})`
    };
    const id = await addToStore('kas', kasbonItem);
    if (currentUid) pushItemToCloud(currentUid, 'kas', { ...kasbonItem, id });

    await refreshAllData();
  };

  // Handlers for Sparepart
  const handleAddSparepart = async (sp: Omit<Sparepart, 'id'>) => {
    const id = await addToStore('sparepart', sp);
    if (currentUid) pushItemToCloud(currentUid, 'sparepart', { ...sp, id });
    await refreshAllData();
  };

  const handleUpdateSparepart = async (sp: Sparepart) => {
    await putToStore('sparepart', sp);
    if (currentUid) pushItemToCloud(currentUid, 'sparepart', sp);
    await refreshAllData();
  };

  const handleDeleteSparepart = (id: number) => {
    const item = sparepartList.find(sp => sp.id === id);
    const label = item ? `"${item.nama}"` : 'ini';
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Sparepart?',
      message: `Yakin ingin menghapus sparepart ${label} dari daftar stok?`,
      confirmText: 'Ya, Hapus Sparepart',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteFromStore('sparepart', id);
          if (currentUid) {
            await deleteItemFromCloud(currentUid, 'sparepart', id);
          }
        } catch (e) {
          console.warn('Delete sparepart error:', e);
        }
        setSparepartList(prev => prev.filter(sp => sp.id !== id));
        await refreshAllData();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Tutup Buku
  const handleTutupBuku = async (tglMulai: string, tglSelesai: string) => {
    let pem = 0;
    let peng = 0;
    const detailKas: TransaksiKas[] = [];

    kasList.forEach(item => {
      if (item.jenis === 'pemasukan') pem += item.nominal;
      if (item.jenis === 'pengeluaran') {
        const isGaji = (
          item.kategori === 'Gaji Karyawan' ||
          item.kategori === 'Bagi Hasil Karyawan' ||
          (item.keterangan && item.keterangan.toLowerCase().includes('gaji'))
        );
        if (!isGaji) {
          peng += item.nominal;
        }
      }
      detailKas.push(item);
    });

    const sisaSaldo = modalAwalKas + pem - peng;
    const laba = pem - peng;

    const arsip: Omit<LaporanTutupBuku, 'id'> = {
      jenisArsip: 'TUTUP_BUKU',
      tglMulai,
      tglSelesai,
      tglEksekusi: formatDateToDMY(new Date()),
      modalAwal: modalAwalKas,
      totalPemasukan: pem,
      totalPengeluaran: peng,
      modalSparepart: 0,
      labaBersih: laba,
      sisaSaldoAkhir: sisaSaldo,
      rincianKas: detailKas
    };

    const laporanId = await addToStore('laporan_tutup_buku', arsip);
    if (currentUid) pushItemToCloud(currentUid, 'laporan_tutup_buku', { ...arsip, id: laporanId });

    // Delete non-kasbon entries from kas
    for (const item of kasList) {
      const isKasbonAktif = (
        item.kategori === 'Kasbon Karyawan' &&
        item.keterangan &&
        item.keterangan.toLowerCase().includes('kasbon') &&
        !item.keterangan.includes('[LUNAS_GAJI]')
      );
      if (!isKasbonAktif && item.id) {
        await deleteFromStore('kas', item.id);
        if (currentUid) deleteItemFromCloud(currentUid, 'kas', item.id);
      }
    }

    const newStartCash = Math.max(0, sisaSaldo);
    setModalAwalKas(newStartCash);
    localStorage.setItem('modalAwalKas', String(newStartCash));
    if (currentUid) pushSettingsToCloud(currentUid, toko, newStartCash);

    await refreshAllData();
    setConfirmDialog({
      isOpen: true,
      title: 'Tutup Buku Berhasil!',
      message: `Riwayat kas telah diarsipkan. Kasbon aktif tetap dipertahankan, dan sisa kas ${formatRupiah(newStartCash)} dilanjutkan sebagai modal kas periode baru.`,
      confirmText: 'Tutup & Mengerti',
      cancelText: 'Tutup',
      variant: 'info',
      onConfirm: () => setConfirmDialog(prev => ({ ...prev, isOpen: false }))
    });
  };

  const handleTambahHistoriManual = async (manualData: LaporanTutupBuku) => {
    const id = await addToStore('laporan_tutup_buku', manualData);
    if (currentUid) pushItemToCloud(currentUid, 'laporan_tutup_buku', { ...manualData, id });
    await refreshAllData();
  };

  const handleDeleteHistori = (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Arsip Laporan?',
      message: 'Yakin ingin menghapus arsip laporan tutup buku ini dari riwayat?',
      confirmText: 'Ya, Hapus Arsip',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteFromStore('laporan_tutup_buku', id);
          if (currentUid) {
            await deleteItemFromCloud(currentUid, 'laporan_tutup_buku', id);
          }
        } catch (e) {
          console.warn('Delete histori error:', e);
        }
        setHistoriList(prev => prev.filter(h => h.id !== id));
        await refreshAllData();
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Salary execution
  const handleProsesGaji = async (
    nama: string,
    hp: string,
    laporan: LaporanTutupBuku,
    porsi: number,
    kasbon: number,
    bersih: number
  ) => {
    const namaKey = nama.toLowerCase().trim();

    // Mark active kasbon for this employee as [LUNAS_GAJI]
    for (const item of kasList) {
      if (
        item.kategori === 'Kasbon Karyawan' &&
        item.keterangan &&
        item.keterangan.toLowerCase().includes('kasbon') &&
        item.keterangan.toLowerCase().includes(namaKey) &&
        !item.keterangan.includes('[LUNAS_GAJI]')
      ) {
        const updated = {
          ...item,
          keterangan: `${item.keterangan} [LUNAS_GAJI]`
        };
        await putToStore('kas', updated);
        if (currentUid) pushItemToCloud(currentUid, 'kas', updated);
      }
    }

    // Gaji karyawan memotong saldo uang real kas toko saat gajian
    const newModal = Math.max(0, modalAwalKas - bersih);
    setModalAwalKas(newModal);
    localStorage.setItem('modalAwalKas', String(newModal));
    if (currentUid) pushSettingsToCloud(currentUid, toko, newModal);

    await refreshAllData();
  };

  // Jual Beli HP CRUD & Auto Kas Masuk
  const handleAddJualBeli = async (data: Omit<JualBeliHp, 'id'>) => {
    try {
      const id = await addToStore('jual_beli_hp', data);
      if (currentUid) pushItemToCloud(currentUid, 'jual_beli', { ...data, id });
      await refreshAllData();
    } catch (err) {
      console.error('Error adding Jual Beli HP:', err);
    }
  };

  const handleUpdateJualBeli = async (data: JualBeliHp) => {
    try {
      await putToStore('jual_beli_hp', data);
      if (currentUid) pushItemToCloud(currentUid, 'jual_beli', data);
      await refreshAllData();
    } catch (err) {
      console.error('Error updating Jual Beli HP:', err);
    }
  };

  const handleDeleteJualBeli = (id: number) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Hapus Unit Jual Beli HP',
      message: 'Apakah Anda yakin ingin menghapus data unit HP ini dari daftar?',
      confirmText: 'Ya, Hapus',
      variant: 'danger',
      onConfirm: async () => {
        try {
          await deleteFromStore('jual_beli_hp', id);
          if (currentUid) deleteItemFromCloud(currentUid, 'jual_beli', id);
          await refreshAllData();
        } catch (err) {
          console.error('Error deleting Jual Beli HP:', err);
        } finally {
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleTandaiTerjual = async (
    hp: JualBeliHp, 
    hargaReal: number, 
    metodeKas: 'Cash' | 'Transfer' | 'QRIS', 
    pembeli?: string
  ) => {
    try {
      const untungReal = hargaReal - hp.hargaBeli;
      const tglHariIni = formatDateToDMY(new Date());

      // 1. Update status unit HP
      const updatedHp: JualBeliHp = {
        ...hp,
        status: 'Terjual',
        hargaJual: hargaReal,
        untung: untungReal,
        tanggalTerjual: tglHariIni,
        pembeli: pembeli || hp.pembeli
      };
      await putToStore('jual_beli_hp', updatedHp);
      if (currentUid) pushItemToCloud(currentUid, 'jual_beli', updatedHp);

      // 2. Otomatis masuk riwayat Kas
      const saleKas: Omit<TransaksiKas, 'id'> = {
        tanggal: tglHariIni,
        jenis: 'pemasukan',
        kategori: 'Penjualan HP',
        nominal: hargaReal,
        metode: metodeKas,
        keterangan: `Penjualan HP: ${hp.namaHp}${pembeli ? ` (${pembeli})` : ''} [Modal: ${formatRupiah(hp.hargaBeli)}, Untung: +${formatRupiah(untungReal)}]`
      };
      const kasId = await addToStore('kas', saleKas);
      if (currentUid) pushItemToCloud(currentUid, 'kas', { ...saleKas, id: kasId });

      await refreshAllData();
    } catch (err) {
      console.error('Error marking HP as sold:', err);
    }
  };

  // Karyawan CRUD
  const handleSaveKaryawan = async (data: { id?: number; nama: string; noHp?: string; jabatan?: string }) => {
    try {
      const cleanData: Karyawan = {
        nama: data.nama.trim(),
        noHp: (data.noHp || '').trim(),
        jabatan: (data.jabatan || 'Teknisi').trim()
      };

      if (data.id) {
        cleanData.id = data.id;
        await putToStore('karyawan', cleanData);
      } else {
        const id = await addToStore('karyawan', cleanData);
        cleanData.id = id;
      }

      if (currentUid) pushItemToCloud(currentUid, 'karyawan', cleanData);

      await refreshAllData();
    } catch (err) {
      console.error('Error saving karyawan to IndexedDB, saving to fallback:', err);
      setKaryawanList(prev => {
        const updated = [...prev];
        if (data.id) {
          const idx = updated.findIndex(k => k.id === data.id);
          if (idx !== -1) {
            updated[idx] = { ...updated[idx], ...data, nama: data.nama.trim(), noHp: (data.noHp || '').trim() };
          }
        } else {
          updated.push({
            id: Date.now(),
            nama: data.nama.trim(),
            noHp: (data.noHp || '').trim(),
            jabatan: data.jabatan || 'Teknisi'
          });
        }
        localStorage.setItem('karyawanList', JSON.stringify(updated));
        return updated;
      });
    }
  };

  const handleDeleteKaryawan = async (id: number) => {
    try {
      await deleteFromStore('karyawan', id);
      if (currentUid) deleteItemFromCloud(currentUid, 'karyawan', id);
    } catch (err) {
      console.warn('Error deleting karyawan from IDB:', err);
    }

    setKaryawanList(prev => {
      const updated = prev.filter(k => k.id !== id && Number(k.id) !== Number(id));
      localStorage.setItem('karyawanList', JSON.stringify(updated));
      return updated;
    });
  };

  // Config saves
  const handleSaveToko = (newToko: PengaturanToko) => {
    setToko(newToko);
    localStorage.setItem('namaKonter', newToko.namaKonter);
    localStorage.setItem('hpKonter', newToko.hpKonter);
    localStorage.setItem('alamatKonter', newToko.alamatKonter);
    if (newToko.pinKasir) {
      localStorage.setItem('pinKasir', newToko.pinKasir);
    }
    if (currentUid) {
      pushSettingsToCloud(currentUid, newToko, modalAwalKas);
    }
  };

  const handleSaveVisual = (newVisual: PengaturanVisual) => {
    setVisual(newVisual);
    localStorage.setItem('cfgVisual', JSON.stringify(newVisual));
  };

  // Export & Import backup
  const handleExportBackup = async (): Promise<string> => {
    const backupObj = {
      aplikasi: "FAZTA_CELL_KASIR_HP",
      versi: "6.0",
      tanggalBackup: new Date().toISOString(),
      toko,
      modalAwalKas,
      sparepart: sparepartList,
      servis: servisList,
      kas: kasList,
      laporan_tutup_buku: historiList,
      karyawan: karyawanList
    };
    return JSON.stringify(backupObj, null, 2);
  };

  const handleImportRestore = async (jsonString: string): Promise<boolean> => {
    try {
      const data = JSON.parse(jsonString);
      if (!data.sparepart || !data.servis || !data.kas) {
        return false;
      }

      if (data.modalAwalKas !== undefined) {
        setModalAwalKas(data.modalAwalKas);
        localStorage.setItem('modalAwalKas', String(data.modalAwalKas));
      }
      if (data.toko) {
        handleSaveToko(data.toko);
      }

      for (const item of data.sparepart) {
        const { id, ...rest } = item;
        await addToStore('sparepart', rest);
      }
      for (const item of data.servis) {
        const { id, ...rest } = item;
        await addToStore('servis', rest);
      }
      for (const item of data.kas) {
        const { id, ...rest } = item;
        await addToStore('kas', rest);
      }
      if (data.laporan_tutup_buku) {
        for (const item of data.laporan_tutup_buku) {
          const { id, ...rest } = item;
          await addToStore('laporan_tutup_buku', rest);
        }
      }
      if (data.karyawan) {
        for (const item of data.karyawan) {
          const { id, ...rest } = item;
          await addToStore('karyawan', rest);
        }
      }

      await refreshAllData();
      return true;
    } catch (err) {
      console.error('Gagal membaca kode backup:', err);
      return false;
    }
  };

  // WhatsApp helper from table
  const handleShareServisWA = (servis: ServisItem) => {
    let noHp = (servis.noHp || '').replace(/[^0-9]/g, '');
    if (noHp.startsWith('0')) noHp = '62' + noHp.substring(1);

    const sisa = servis.totalBiaya - servis.dp;
    const hargaSp = servis.hargaSparepart || 0;
    const namaSp = servis.namaSparepart || (hargaSp > 0 ? 'Sparepart' : '-');
    const teksSparepart = hargaSp > 0 ? `${namaSp} (${formatRupiah(hargaSp)})` : '-';
    const teksDiambil = servis.status === 'Diambil' && servis.tanggalDiambil ? `\n📅 *Tgl Diambil:* ${servis.tanggalDiambil}` : '';

    const pesan = `Halo kak *${servis.namaPelanggan}*, berikut rincian nota servis HP Anda di *${toko.namaKonter}*:\n\n` +
                  `📌 *No. Nota:* ${servis.noNota}\n` +
                  `📱 *Tipe HP:* ${servis.tipeHp}\n` +
                  `🔧 *Keluhan:* ${servis.keluhan}\n` +
                  `🧩 *Sparepart:* ${teksSparepart}\n` +
                  `🛠 *Biaya Jasa:* ${formatRupiah(servis.jasaServis)}\n` +
                  `💰 *Total Biaya:* ${formatRupiah(servis.totalBiaya)}\n` +
                  `💵 *DP:* ${formatRupiah(servis.dp)}\n` +
                  `💳 *Sisa Bayar:* ${formatRupiah(sisa)}\n` +
                  `📊 *Status:* ${servis.status}${teksDiambil}\n\n` +
                  `*Alamat/Catatan:* ${toko.alamatKonter}\n` +
                  `Terima kasih sudah mempercayakan servis HP di tempat kami! 🙏`;

    window.open(`https://wa.me/${noHp}?text=${encodeURIComponent(pesan)}`, '_blank');
  };

  // Sign out
  const handleLogout = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Keluar Akun?',
      message: 'Yakin ingin melepas koneksi akun di perangkat ini?',
      confirmText: 'Ya, Keluar Akun',
      variant: 'warning',
      onConfirm: async () => {
        await fbSignOut(auth);
        setUserAccount(null);
        setCurrentUid(null);
        localStorage.removeItem('userAccount');
        localStorage.removeItem('appPermissionGranted');
        setIsLoginModalOpen(true);
        setConfirmDialog(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  // Calculate background style
  const backgroundStyle = useMemo(() => {
    const { c1, c2, dir } = visual;
    const grad = dir === 'circle' 
      ? `radial-gradient(circle, ${c1}, ${c2})` 
      : `linear-gradient(${dir}, ${c1}, ${c2})`;

    const svgCircuit = "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'%3E%3Cpath d='M20 20 h 80 v 80 h -80 z' fill='none' stroke='%231e3a8a' stroke-width='1' opacity='0.3'/%3E%3Cpath d='M35 35 h 50 v 50 h -50 z' fill='none' stroke='%232563eb' stroke-width='1.5' opacity='0.25'/%3E%3Cpath d='M0 40 h 20 M100 40 h 20 M40 0 v 20 M40 100 v 20 M0 80 h 20 M100 80 h 20 M80 0 v 20 M80 100 v 20 M20 60 h 15 M85 60 h 15 M60 20 v 15 M60 85 v 15' stroke='%233b82f6' stroke-width='1.5' opacity='0.35'/%3E%3Ccircle cx='20' cy='40' r='3' fill='%2360a5fa' opacity='0.4'/%3E%3Ccircle cx='100' cy='40' r='3' fill='%2360a5fa' opacity='0.4'/%3E%3Ccircle cx='20' cy='80' r='3' fill='%2360a5fa' opacity='0.4'/%3E%3Ccircle cx='100' cy='80' r='3' fill='%2360a5fa' opacity='0.4'/%3E%3Ccircle cx='40' cy='20' r='3' fill='%2360a5fa' opacity='0.4'/%3E%3Ccircle cx='40' cy='100' r='3' fill='%2360a5fa' opacity='0.4'/%3E%3Ccircle cx='80' cy='20' r='3' fill='%2360a5fa' opacity='0.4'/%3E%3Ccircle cx='80' cy='100' r='3' fill='%2360a5fa' opacity='0.4'/%3E%3C/svg%3E\")";

    return {
      backgroundImage: `${svgCircuit}, ${grad}`,
      backgroundAttachment: 'fixed' as const
    };
  }, [visual]);

  const cardOpacityStyle = useMemo(() => {
    return {
      backgroundColor: `rgba(15, 23, 42, ${visual.op / 100})`
    };
  }, [visual.op]);

  return (
    <div className="min-h-screen text-slate-100 flex flex-col font-sans pb-20 relative selection:bg-cyan-500 selection:text-white" style={backgroundStyle}>
      
      {/* Header */}
      <Header
        toko={toko}
        userAccount={userAccount}
        isModeEditUnlocked={isModeEditUnlocked}
        onToggleModeEdit={handleToggleModeEdit}
        onOpenKaryawan={() => setIsKaryawanOpen(true)}
        onOpenPengaturan={() => setIsPengaturanOpen(true)}
        onOpenVisual={() => setIsVisualOpen(true)}
        onOpenAkun={() => setIsAkunOpen(true)}
        onOpenBluetoothDiagnostic={() => setIsBluetoothDiagnosticOpen(true)}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onTriggerSync={handleManualSync}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        onLogout={handleLogout}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-5 space-y-4">
        {activeTab === 'dashboard' && (
          <DashboardTab
            userAccount={userAccount}
            saldoKas={saldoKas}
            totalKasbon={totalKasbon}
            totalPemasukan={totalPemasukan}
            totalPengeluaran={totalPengeluaran}
            servisList={servisList}
            onOpenKalkulator={() => setIsKalkulatorOpen(true)}
            onOpenDomainGuide={() => setIsDomainGuideOpen(true)}
            onSaveKasbon={handleSaveKasbon}
            onSwitchTab={setActiveTab}
          />
        )}

        {activeTab === 'servis' && (
          <ServisTab
            servisList={servisList}
            sparepartList={sparepartList}
            isModeEditUnlocked={isModeEditUnlocked}
            onAddServis={handleAddServis}
            onUpdateStatus={handleUpdateStatusServis}
            onUpdateServis={handleUpdateServis}
            onDeleteServis={handleDeleteServis}
            onViewNota={(s) => setSelectedServisNota(s)}
            onShareWhatsApp={handleShareServisWA}
          />
        )}

        {activeTab === 'jual_beli' && (
          <JualBeliTab
            jualBeliList={jualBeliList}
            toko={toko}
            isModeEditUnlocked={isModeEditUnlocked}
            onAddJualBeli={handleAddJualBeli}
            onUpdateJualBeli={handleUpdateJualBeli}
            onDeleteJualBeli={handleDeleteJualBeli}
            onTandaiTerjual={handleTandaiTerjual}
          />
        )}

        {activeTab === 'kas' && (
          <KasTab
            kasList={kasList}
            servisList={servisList}
            isModeEditUnlocked={isModeEditUnlocked}
            onAddKas={handleAddKas}
            onUpdateKas={handleUpdateKas}
            onDeleteKas={handleDeleteKas}
          />
        )}

        {activeTab === 'stok' && (
          <StokTab
            sparepartList={sparepartList}
            isModeEditUnlocked={isModeEditUnlocked}
            onAddSparepart={handleAddSparepart}
            onUpdateSparepart={handleUpdateSparepart}
            onDeleteSparepart={handleDeleteSparepart}
          />
        )}

        {activeTab === 'laporan' && (
          <LaporanTab
            totalPemasukan={totalPemasukan}
            totalPengeluaran={totalPengeluaran}
            modalSparepartTerpakai={modalSparepartTerpakai}
            labaBersih={labaBersih}
            saldoKas={saldoKas}
            historiList={historiList}
            karyawanList={karyawanList}
            kasList={kasList}
            toko={toko}
            isModeEditUnlocked={isModeEditUnlocked}
            onTutupBuku={handleTutupBuku}
            onTambahHistoriManual={handleTambahHistoriManual}
            onDeleteHistori={handleDeleteHistori}
            onProsesGaji={handleProsesGaji}
            onExportBackup={handleExportBackup}
            onImportRestore={handleImportRestore}
          />
        )}
      </main>

      {/* Navigation */}
      <Navigation
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        servisAktifCount={servisList.filter(s => s.status === 'Dikerjakan' || s.status === 'Selesai').length}
        jualBeliStokCount={jualBeliList.filter(j => j.status === 'Tersedia').length}
        stokKritisCount={sparepartList.filter(s => s.stok <= 2).length}
      />

      {/* Authorized Domain Guide Modal */}
      <AuthorizedDomainModal
        isOpen={isDomainGuideOpen}
        onClose={() => setIsDomainGuideOpen(false)}
      />

      {/* Akun & User ID Settings Modal */}
      <AkunModal
        isOpen={isAkunOpen}
        onClose={() => setIsAkunOpen(false)}
        currentUserId={userAccount || ''}
        onUserUpdated={(newId) => {
          setUserAccount(newId);
          localStorage.setItem('userAccount', newId);
        }}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
      />

      {/* Login & Auth Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onSuccess={(userIdOrEmail, uid) => {
          setUserAccount(userIdOrEmail);
          if (uid) setCurrentUid(uid);
          localStorage.setItem('userAccount', userIdOrEmail);
          if (uid) localStorage.setItem('currentUid', uid);
          setIsLoginModalOpen(false);
        }}
      />

      {/* Nota Servis Modal */}
      <NotaModal
        isOpen={Boolean(selectedServisNota)}
        onClose={() => setSelectedServisNota(null)}
        servis={selectedServisNota}
        toko={toko}
      />

      {/* Calculator Modal */}
      <KalkulatorModal
        isOpen={isKalkulatorOpen}
        onClose={() => setIsKalkulatorOpen(false)}
      />

      {/* Karyawan Modal */}
      <KaryawanModal
        isOpen={isKaryawanOpen}
        onClose={() => setIsKaryawanOpen(false)}
        karyawanList={karyawanList}
        onSaveKaryawan={handleSaveKaryawan}
        onDeleteKaryawan={handleDeleteKaryawan}
      />

      {/* Store Settings Modal */}
      <PengaturanModal
        isOpen={isPengaturanOpen}
        onClose={() => setIsPengaturanOpen(false)}
        toko={toko}
        onSaveToko={handleSaveToko}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        onOpenBluetoothDiagnostic={() => setIsBluetoothDiagnosticOpen(true)}
      />

      {/* Visual Settings Modal */}
      <VisualModal
        isOpen={isVisualOpen}
        onClose={() => setIsVisualOpen(false)}
        visual={visual}
        onSaveVisual={handleSaveVisual}
      />

      {/* Cloud Synchronization Modal (PC ⇄ HP Android APK) */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        userAccount={userAccount}
        currentUid={currentUid}
        isSyncing={isSyncing}
        lastSyncTime={lastSyncTime}
        onTriggerSync={handleManualSync}
        counts={{
          servis: servisList.length,
          kas: kasList.length,
          sparepart: sparepartList.length,
          jualBeli: jualBeliList.length,
          karyawan: karyawanList.length,
          histori: historiList.length
        }}
      />

      {/* Bluetooth & Printer Diagnostics Modal */}
      <BluetoothDiagnosticModal
        isOpen={isBluetoothDiagnosticOpen}
        onClose={() => setIsBluetoothDiagnosticOpen(false)}
      />

      {/* Universal Confirm Modal with Security Password Verification */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        cancelText={confirmDialog.cancelText}
        variant={confirmDialog.variant}
        userId={userAccount || undefined}
        requirePassword={confirmDialog.variant === 'danger'}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />

      {/* Unlock Mode Modal */}
      <UnlockModal
        isOpen={isUnlockModalOpen}
        onClose={() => setIsUnlockModalOpen(false)}
        userId={userAccount || ''}
        onUnlockSuccess={() => setIsModeEditUnlocked(true)}
      />

    </div>
  );
}
