import { Sparepart, ServisItem, TransaksiKas, Karyawan, LaporanTutupBuku, JualBeliHp } from '../types';

const DB_NAME = 'KasirServisHPDB';
const DB_VERSION = 6;

let dbInstance: IDBDatabase | null = null;

export function openDatabase(): Promise<IDBDatabase> {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('sparepart')) {
        db.createObjectStore('sparepart', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('servis')) {
        db.createObjectStore('servis', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('kas')) {
        db.createObjectStore('kas', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('laporan_tutup_buku')) {
        db.createObjectStore('laporan_tutup_buku', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('karyawan')) {
        db.createObjectStore('karyawan', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('jual_beli_hp')) {
        db.createObjectStore('jual_beli_hp', { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (e) => {
      dbInstance = (e.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (e) => {
      reject((e.target as IDBOpenDBRequest).error);
    };
  });
}

// Helpers
export function parseDateString(str: string): Date {
  if (!str) return new Date(0);
  if (str.includes('/')) {
    const parts = str.split('/');
    if (parts.length === 3) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), 12, 0, 0);
    }
  } else if (str.includes('-')) {
    const parts = str.split('-');
    if (parts[0].length === 4) {
      return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 12, 0, 0);
    } else if (parts[2].length === 4) {
      return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]), 12, 0, 0);
    }
  }
  return new Date(str);
}

export function formatDateToDMY(dateObj: Date): string {
  if (!dateObj || isNaN(dateObj.getTime())) return '-';
  const d = String(dateObj.getDate()).padStart(2, '0');
  const m = String(dateObj.getMonth() + 1).padStart(2, '0');
  const y = dateObj.getFullYear();
  return `${d}/${m}/${y}`;
}

export function convertISOToDMY(isoStr: string): string {
  if (!isoStr) return '-';
  const parts = isoStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoStr;
}

export function formatRupiah(num: number | undefined | null): string {
  if (num === undefined || num === null || isNaN(num)) return 'Rp 0';
  return 'Rp ' + Math.round(num).toLocaleString('id-ID');
}

export function getTodayISO(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generic Store operations
export async function getAllFromStore<T>(storeName: string): Promise<T[]> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    try {
      if (!db.objectStoreNames.contains(storeName)) {
        console.warn(`Object store "${storeName}" not found in IndexedDB.`);
        resolve([]);
        return;
      }
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result as T[]);
      req.onerror = () => reject(req.error);
    } catch (err) {
      console.warn(`Error reading from ${storeName}:`, err);
      resolve([]);
    }
  });
}

export async function addToStore<T>(storeName: string, item: T): Promise<number> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      
      // Clean object: prevent undefined or null id from breaking autoIncrement in IndexedDB
      const cleanItem = { ...(item as any) };
      if (cleanItem.id === undefined || cleanItem.id === null) {
        delete cleanItem.id;
      }

      const req = store.add(cleanItem);
      req.onsuccess = () => resolve(req.result as number);
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

export async function putToStore<T>(storeName: string, item: T): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      
      const cleanItem = { ...(item as any) };
      if (cleanItem.id === undefined || cleanItem.id === null) {
        delete cleanItem.id;
      }

      const req = store.put(cleanItem);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

export async function deleteFromStore(storeName: string, id: number | string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const numId = Number(id);
      const targetKey = !isNaN(numId) ? numId : id;
      const req = store.delete(targetKey);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}

export async function clearStore(storeName: string): Promise<void> {
  const db = await openDatabase();
  return new Promise((resolve, reject) => {
    try {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    } catch (err) {
      reject(err);
    }
  });
}
