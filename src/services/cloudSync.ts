/**
 * Cloud Synchronization Service (PC ⇄ Android HP / Capacitor APK)
 * Synchronizes all store data in real time between PC and Android APK
 * so records and configuration are 100% identical on all devices.
 */

import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  Unsubscribe 
} from 'firebase/firestore';
import { dbCloud, auth } from './firebase';
import { 
  putToStore, 
  deleteFromStore, 
  getAllFromStore, 
  openDatabase 
} from './db';
import { 
  ServisItem, 
  TransaksiKas, 
  Sparepart, 
  JualBeliHp, 
  Karyawan, 
  LaporanTutupBuku, 
  PengaturanToko,
  PengaturanVisual
} from '../types';

export interface SyncState {
  status: 'idle' | 'syncing' | 'synced' | 'error' | 'offline';
  lastSyncTime: string | null;
  totalSyncedItems: number;
  message?: string;
  deviceType?: 'PC' | 'Android APK' | 'Mobile Web';
}

type SyncStateListener = (state: SyncState) => void;
const syncListeners = new Set<SyncStateListener>();

export function getDeviceType(): 'PC' | 'Android APK' | 'Mobile Web' {
  if (typeof window === 'undefined') return 'PC';
  const isCapacitor = Boolean(
    (window as any).Capacitor || 
    (window as any).CapacitorWeb || 
    (window as any).androidBridge ||
    window.location.protocol === 'capacitor:'
  );
  if (isCapacitor) return 'Android APK';
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  return isMobile ? 'Mobile Web' : 'PC';
}

let currentSyncState: SyncState = {
  status: 'idle',
  lastSyncTime: typeof window !== 'undefined' ? localStorage.getItem('last_cloud_sync_time') : null,
  totalSyncedItems: 0,
  deviceType: getDeviceType()
};

function updateSyncState(next: Partial<SyncState>) {
  currentSyncState = { ...currentSyncState, ...next };
  if (next.lastSyncTime && typeof window !== 'undefined') {
    localStorage.setItem('last_cloud_sync_time', next.lastSyncTime);
  }
  syncListeners.forEach(listener => {
    try { listener(currentSyncState); } catch {}
  });
}

export function subscribeSyncState(listener: SyncStateListener): () => void {
  syncListeners.add(listener);
  listener(currentSyncState);
  return () => {
    syncListeners.delete(listener);
  };
}

export function getSyncState(): SyncState {
  return currentSyncState;
}

/**
 * Save / Update a single document directly to Cloud for instant PC ⇄ HP sync
 */
export async function pushItemToCloud(
  uid: string, 
  collectionName: 'servis' | 'kas' | 'sparepart' | 'jual_beli' | 'karyawan' | 'laporan_tutup_buku', 
  item: any
): Promise<boolean> {
  if (!uid) return false;
  try {
    const docId = String(item.id || item.noNota || Date.now());
    const docRef = doc(dbCloud, `users/${uid}/${collectionName}`, docId);
    await setDoc(docRef, { 
      ...item, 
      _updatedAt: item._updatedAt || new Date().toISOString() 
    }, { merge: true });

    // Also remove from tombstones if it was previously deleted
    try {
      const tombRef = doc(dbCloud, `users/${uid}/deletions`, `${collectionName}_${docId}`);
      await deleteDoc(tombRef);
    } catch {}

    return true;
  } catch (err) {
    console.warn(`[CloudSync] pushItemToCloud warning for ${collectionName}:`, err);
    return false;
  }
}

/**
 * Delete a single document directly from Cloud & record tombstone
 * so other devices (PC or Android HP) delete it without re-uploading
 */
export async function deleteItemFromCloud(
  uid: string,
  collectionName: 'servis' | 'kas' | 'sparepart' | 'jual_beli' | 'karyawan' | 'laporan_tutup_buku',
  docId: string | number
): Promise<boolean> {
  if (!uid) return false;
  try {
    const idStr = String(docId);
    // 1. Delete original document
    const docRef = doc(dbCloud, `users/${uid}/${collectionName}`, idStr);
    await deleteDoc(docRef);

    // 2. Add tombstone to prevent resurrection during bidirectional sync
    const tombRef = doc(dbCloud, `users/${uid}/deletions`, `${collectionName}_${idStr}`);
    await setDoc(tombRef, {
      collectionName,
      docId: idStr,
      deletedAt: new Date().toISOString()
    });

    return true;
  } catch (err) {
    console.warn(`[CloudSync] deleteItemFromCloud warning for ${collectionName}:`, err);
    return false;
  }
}

/**
 * Save store settings (toko, modalAwalKas, pinKasir, securityPassword, visual) to Cloud
 */
export async function pushSettingsToCloud(
  uid: string,
  toko: PengaturanToko,
  modalAwalKas: number,
  securityPassword?: string,
  visual?: PengaturanVisual
): Promise<boolean> {
  if (!uid) return false;
  try {
    const docRef = doc(dbCloud, `users/${uid}/settings`, 'store_config');
    const visualConfig = visual || (typeof window !== 'undefined' && localStorage.getItem('cfgVisual') 
      ? JSON.parse(localStorage.getItem('cfgVisual')!) 
      : undefined);

    await setDoc(docRef, {
      toko,
      modalAwalKas,
      visual: visualConfig,
      securityPassword: securityPassword || (typeof window !== 'undefined' ? localStorage.getItem('securityPassword') : undefined) || undefined,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    return true;
  } catch (err) {
    console.warn('[CloudSync] pushSettingsToCloud warning:', err);
    return false;
  }
}

/**
 * Helper to determine which item is newer between local and remote
 */
function isLocalNewer(localItem: any, remoteItem: any): boolean {
  const localTime = new Date(localItem._updatedAt || localItem.tanggal || 0).getTime();
  const remoteTime = new Date(remoteItem._updatedAt || remoteItem.tanggal || 0).getTime();
  return localTime > remoteTime;
}

/**
 * Perform a full bidirectional synchronization between Local IndexedDB and Cloud Firestore.
 * Ensures all records on PC and Android APK are merged and made 100% identical.
 */
export async function performFullCloudSync(
  uid: string,
  currentToko: PengaturanToko,
  currentModalKas: number
): Promise<{
  success: boolean;
  totalSynced: number;
  updatedToko?: PengaturanToko;
  updatedModalKas?: number;
  updatedVisual?: PengaturanVisual;
  error?: string;
}> {
  if (!uid) {
    updateSyncState({ status: 'offline', message: 'User belum login' });
    return { success: false, totalSynced: 0, error: 'User belum login' };
  }

  updateSyncState({ 
    status: 'syncing', 
    message: `Menyinkronkan data antara PC dan HP (${getDeviceType()})...` 
  });

  try {
    await openDatabase();

    // 1. Fetch Cloud collections & tombstones in parallel
    const [
      cloudServisSnap,
      cloudKasSnap,
      cloudSparepartSnap,
      cloudJualBeliSnap,
      cloudKaryawanSnap,
      cloudLaporanSnap,
      tombstonesSnap
    ] = await Promise.all([
      getDocs(collection(dbCloud, `users/${uid}/servis`)),
      getDocs(collection(dbCloud, `users/${uid}/kas`)),
      getDocs(collection(dbCloud, `users/${uid}/sparepart`)),
      getDocs(collection(dbCloud, `users/${uid}/jual_beli`)),
      getDocs(collection(dbCloud, `users/${uid}/karyawan`)),
      getDocs(collection(dbCloud, `users/${uid}/laporan_tutup_buku`)),
      getDocs(collection(dbCloud, `users/${uid}/deletions`))
    ]);

    // Parse tombstones set
    const deletedMap = new Set<string>();
    tombstonesSnap.forEach(d => {
      deletedMap.add(d.id); // e.g. "servis_123"
    });

    const cloudServis: ServisItem[] = [];
    cloudServisSnap.forEach(d => {
      if (!deletedMap.has(`servis_${d.id}`)) {
        cloudServis.push(d.data() as ServisItem);
      }
    });

    const cloudKas: TransaksiKas[] = [];
    cloudKasSnap.forEach(d => {
      if (!deletedMap.has(`kas_${d.id}`)) {
        cloudKas.push(d.data() as TransaksiKas);
      }
    });

    const cloudSparepart: Sparepart[] = [];
    cloudSparepartSnap.forEach(d => {
      if (!deletedMap.has(`sparepart_${d.id}`)) {
        cloudSparepart.push(d.data() as Sparepart);
      }
    });

    const cloudJualBeli: JualBeliHp[] = [];
    cloudJualBeliSnap.forEach(d => {
      if (!deletedMap.has(`jual_beli_${d.id}`)) {
        cloudJualBeli.push(d.data() as JualBeliHp);
      }
    });

    const cloudKaryawan: Karyawan[] = [];
    cloudKaryawanSnap.forEach(d => {
      if (!deletedMap.has(`karyawan_${d.id}`)) {
        cloudKaryawan.push(d.data() as Karyawan);
      }
    });

    const cloudLaporan: LaporanTutupBuku[] = [];
    cloudLaporanSnap.forEach(d => {
      if (!deletedMap.has(`laporan_tutup_buku_${d.id}`)) {
        cloudLaporan.push(d.data() as LaporanTutupBuku);
      }
    });

    // 2. Fetch all local collections from IndexedDB
    const [
      localServis,
      localKas,
      localSparepart,
      localJualBeli,
      localLaporan
    ] = await Promise.all([
      getAllFromStore<ServisItem>('servis'),
      getAllFromStore<TransaksiKas>('kas'),
      getAllFromStore<Sparepart>('sparepart'),
      getAllFromStore<JualBeliHp>('jual_beli_hp'),
      getAllFromStore<LaporanTutupBuku>('laporan_tutup_buku')
    ]);

    let localKaryawan: Karyawan[] = [];
    try {
      localKaryawan = await getAllFromStore<Karyawan>('karyawan');
    } catch {
      const saved = localStorage.getItem('karyawanList');
      if (saved) try { localKaryawan = JSON.parse(saved); } catch {}
    }

    // 3. Bidirectional merge with tombstone checking & conflict resolution

    // A. Sync Servis
    const cloudServisMap = new Map(cloudServis.map(s => [String(s.id || s.noNota), s]));
    for (const s of localServis) {
      const key = String(s.id || s.noNota);
      if (deletedMap.has(`servis_${key}`)) {
        // Deleted on remote -> delete locally
        if (s.id) await deleteFromStore('servis', s.id);
      } else if (!cloudServisMap.has(key)) {
        await pushItemToCloud(uid, 'servis', s);
      } else {
        const cloudItem = cloudServisMap.get(key)!;
        if (isLocalNewer(s, cloudItem)) {
          await pushItemToCloud(uid, 'servis', s);
        }
      }
    }
    for (const s of cloudServis) {
      const key = String(s.id || s.noNota);
      if (!deletedMap.has(`servis_${key}`)) {
        await putToStore('servis', s);
      }
    }

    // B. Sync Kas
    const cloudKasMap = new Map(cloudKas.map(k => [String(k.id || (k.tanggal + k.nominal + k.keterangan)), k]));
    for (const k of localKas) {
      const key = String(k.id || (k.tanggal + k.nominal + k.keterangan));
      if (deletedMap.has(`kas_${key}`)) {
        if (k.id) await deleteFromStore('kas', k.id);
      } else if (!cloudKasMap.has(key)) {
        await pushItemToCloud(uid, 'kas', k);
      } else {
        const cloudItem = cloudKasMap.get(key)!;
        if (isLocalNewer(k, cloudItem)) {
          await pushItemToCloud(uid, 'kas', k);
        }
      }
    }
    for (const k of cloudKas) {
      const key = String(k.id || (k.tanggal + k.nominal + k.keterangan));
      if (!deletedMap.has(`kas_${key}`)) {
        await putToStore('kas', k);
      }
    }

    // C. Sync Sparepart
    const cloudSpMap = new Map(cloudSparepart.map(sp => [String(sp.id || sp.nama), sp]));
    for (const sp of localSparepart) {
      const key = String(sp.id || sp.nama);
      if (deletedMap.has(`sparepart_${key}`)) {
        if (sp.id) await deleteFromStore('sparepart', sp.id);
      } else if (!cloudSpMap.has(key)) {
        await pushItemToCloud(uid, 'sparepart', sp);
      } else {
        const cloudItem = cloudSpMap.get(key)!;
        if (isLocalNewer(sp, cloudItem)) {
          await pushItemToCloud(uid, 'sparepart', sp);
        }
      }
    }
    for (const sp of cloudSparepart) {
      const key = String(sp.id || sp.nama);
      if (!deletedMap.has(`sparepart_${key}`)) {
        await putToStore('sparepart', sp);
      }
    }

    // D. Sync Jual Beli HP
    const cloudJbMap = new Map(cloudJualBeli.map(jb => [String(jb.id || jb.namaHp), jb]));
    for (const jb of localJualBeli) {
      const key = String(jb.id || jb.namaHp);
      if (deletedMap.has(`jual_beli_${key}`)) {
        if (jb.id) await deleteFromStore('jual_beli_hp', jb.id);
      } else if (!cloudJbMap.has(key)) {
        await pushItemToCloud(uid, 'jual_beli', jb);
      } else {
        const cloudItem = cloudJbMap.get(key)!;
        if (isLocalNewer(jb, cloudItem)) {
          await pushItemToCloud(uid, 'jual_beli', jb);
        }
      }
    }
    for (const jb of cloudJualBeli) {
      const key = String(jb.id || jb.namaHp);
      if (!deletedMap.has(`jual_beli_${key}`)) {
        await putToStore('jual_beli_hp', jb);
      }
    }

    // E. Sync Karyawan
    const cloudKryMap = new Map(cloudKaryawan.map(kry => [String(kry.id || kry.nama), kry]));
    for (const kry of localKaryawan) {
      const key = String(kry.id || kry.nama);
      if (deletedMap.has(`karyawan_${key}`)) {
        if (kry.id) await deleteFromStore('karyawan', kry.id);
      } else if (!cloudKryMap.has(key)) {
        await pushItemToCloud(uid, 'karyawan', kry);
      }
    }
    for (const kry of cloudKaryawan) {
      const key = String(kry.id || kry.nama);
      if (!deletedMap.has(`karyawan_${key}`)) {
        await putToStore('karyawan', kry);
      }
    }
    if (cloudKaryawan.length > 0) {
      localStorage.setItem('karyawanList', JSON.stringify(cloudKaryawan));
    }

    // F. Sync Laporan Tutup Buku
    const cloudLapMap = new Map(cloudLaporan.map(l => [String(l.id || (l.tglMulai + l.tglSelesai)), l]));
    for (const l of localLaporan) {
      const key = String(l.id || (l.tglMulai + l.tglSelesai));
      if (deletedMap.has(`laporan_tutup_buku_${key}`)) {
        if (l.id) await deleteFromStore('laporan_tutup_buku', l.id);
      } else if (!cloudLapMap.has(key)) {
        await pushItemToCloud(uid, 'laporan_tutup_buku', l);
      }
    }
    for (const l of cloudLaporan) {
      const key = String(l.id || (l.tglMulai + l.tglSelesai));
      if (!deletedMap.has(`laporan_tutup_buku_${key}`)) {
        await putToStore('laporan_tutup_buku', l);
      }
    }

    // 4. Sync Settings (Store config, initial cash, security password, theme)
    let updatedToko: PengaturanToko | undefined;
    let updatedModalKas: number | undefined;
    let updatedVisual: PengaturanVisual | undefined;

    try {
      const cfgSnap = await getDocs(collection(dbCloud, `users/${uid}/settings`));
      let remoteConfigDoc: any = null;
      cfgSnap.forEach(d => {
        if (d.id === 'store_config') remoteConfigDoc = d.data();
      });

      if (remoteConfigDoc) {
        if (remoteConfigDoc.toko) {
          updatedToko = remoteConfigDoc.toko;
          localStorage.setItem('namaKonter', remoteConfigDoc.toko.namaKonter);
          localStorage.setItem('hpKonter', remoteConfigDoc.toko.hpKonter);
          localStorage.setItem('alamatKonter', remoteConfigDoc.toko.alamatKonter);
          if (remoteConfigDoc.toko.pinKasir) {
            localStorage.setItem('pinKasir', remoteConfigDoc.toko.pinKasir);
          }
        }
        if (typeof remoteConfigDoc.modalAwalKas === 'number') {
          updatedModalKas = remoteConfigDoc.modalAwalKas;
          localStorage.setItem('modalAwalKas', String(remoteConfigDoc.modalAwalKas));
        }
        if (remoteConfigDoc.securityPassword) {
          localStorage.setItem('securityPassword', remoteConfigDoc.securityPassword);
        }
        if (remoteConfigDoc.visual) {
          updatedVisual = remoteConfigDoc.visual;
          localStorage.setItem('cfgVisual', JSON.stringify(remoteConfigDoc.visual));
        }
      } else {
        // Upload local settings to Cloud for the first time
        await pushSettingsToCloud(uid, currentToko, currentModalKas);
      }
    } catch (cfgErr) {
      console.warn('[CloudSync] Settings sync warning:', cfgErr);
    }

    const totalSynced = cloudServis.length + cloudKas.length + cloudSparepart.length + cloudJualBeli.length + cloudKaryawan.length + cloudLaporan.length;
    const nowStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

    updateSyncState({
      status: 'synced',
      lastSyncTime: nowStr,
      totalSyncedItems: totalSynced,
      message: `Semua data tersinkronisasi (${totalSynced} data antara PC & HP)`
    });

    return {
      success: true,
      totalSynced,
      updatedToko,
      updatedModalKas,
      updatedVisual
    };
  } catch (err: any) {
    console.error('[CloudSync] Full sync error:', err);
    updateSyncState({
      status: 'error',
      message: err?.message || 'Gagal menyinkronkan data dengan Cloud.'
    });
    return {
      success: false,
      totalSynced: 0,
      error: err?.message || 'Sinkronisasi gagal.'
    };
  }
}

/**
 * Setup Real-time Listeners so PC and HP reflect changes instantaneously
 */
export function setupRealtimeCloudListeners(
  uid: string,
  onRemoteChange: () => void
): Unsubscribe {
  if (!uid) return () => {};

  const unsubs: Unsubscribe[] = [];

  try {
    // 1. Listen to Servis changes
    unsubs.push(
      onSnapshot(collection(dbCloud, `users/${uid}/servis`), () => {
        onRemoteChange();
      }, (err) => console.warn('[CloudSync] Servis listener error:', err))
    );

    // 2. Listen to Kas changes
    unsubs.push(
      onSnapshot(collection(dbCloud, `users/${uid}/kas`), () => {
        onRemoteChange();
      }, (err) => console.warn('[CloudSync] Kas listener error:', err))
    );

    // 3. Listen to Sparepart changes
    unsubs.push(
      onSnapshot(collection(dbCloud, `users/${uid}/sparepart`), () => {
        onRemoteChange();
      }, (err) => console.warn('[CloudSync] Sparepart listener error:', err))
    );

    // 4. Listen to Jual Beli HP changes
    unsubs.push(
      onSnapshot(collection(dbCloud, `users/${uid}/jual_beli`), () => {
        onRemoteChange();
      }, (err) => console.warn('[CloudSync] Jual Beli listener error:', err))
    );

    // 5. Listen to Karyawan changes
    unsubs.push(
      onSnapshot(collection(dbCloud, `users/${uid}/karyawan`), () => {
        onRemoteChange();
      }, (err) => console.warn('[CloudSync] Karyawan listener error:', err))
    );

    // 6. Listen to Laporan Tutup Buku changes
    unsubs.push(
      onSnapshot(collection(dbCloud, `users/${uid}/laporan_tutup_buku`), () => {
        onRemoteChange();
      }, (err) => console.warn('[CloudSync] Laporan listener error:', err))
    );

    // 7. Listen to Settings changes (Store profile, PIN, theme, etc.)
    unsubs.push(
      onSnapshot(collection(dbCloud, `users/${uid}/settings`), () => {
        onRemoteChange();
      }, (err) => console.warn('[CloudSync] Settings listener error:', err))
    );

    // 8. Listen to Deletions tombstones
    unsubs.push(
      onSnapshot(collection(dbCloud, `users/${uid}/deletions`), () => {
        onRemoteChange();
      }, (err) => console.warn('[CloudSync] Deletions listener error:', err))
    );
  } catch (err) {
    console.warn('[CloudSync] Setup realtime listeners error:', err);
  }

  return () => {
    unsubs.forEach(unsub => {
      try { unsub(); } catch {}
    });
  };
}
