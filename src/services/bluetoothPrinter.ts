/**
 * Web Bluetooth & Web Serial API - ESC/POS Thermal Printer Service
 * Specialized for 58mm (and 57mm Mini EDC / 80mm) Thermal Bluetooth & Serial Printers
 */

// Common Service UUIDs used by 58mm / 80mm Bluetooth Thermal Printers
const THERMAL_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb', // Standard POS Printer service
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2', // Popular Rongta / Goojprt / Panda
  '49535343-fe7d-4ae5-8fa9-9fafd205e455', // ISSC Bluetooth Serial
  '0000ff00-0000-1000-8000-00805f9b34fb', // Common Mini EDC printer
  '0000ae30-0000-1000-8000-00805f9b34fb', // JP-58H / VSC POS
  '0000fee7-0000-1000-8000-00805f9b34fb'  // MPT-II POS
];

let connectedDevice: any = null;
let writeCharacteristic: any = null;

// Serial Port Connection (PC USB / Bluetooth Virtual COM Port)
let serialPort: any = null;
let serialWriter: any = null;
let serialDeviceName: string = 'Printer Serial (COM/USB)';

export interface BluetoothConnectionStatus {
  supported: boolean;
  serialSupported: boolean;
  connected: boolean;
  connectionType: 'bluetooth' | 'serial' | 'none';
  deviceName: string | null;
}

type BluetoothStateListener = (status: BluetoothConnectionStatus) => void;
const stateListeners = new Set<BluetoothStateListener>();

export function isBluetoothSupported(): boolean {
  return typeof navigator !== 'undefined' && 'bluetooth' in navigator;
}

export function isSerialSupported(): boolean {
  return typeof navigator !== 'undefined' && 'serial' in navigator;
}

export function isBluetoothConnected(): boolean {
  return !!connectedDevice && !!connectedDevice.gatt && connectedDevice.gatt.connected && !!writeCharacteristic;
}

export function isSerialConnected(): boolean {
  return !!serialPort && !!serialWriter;
}

export function isPrinterConnected(): boolean {
  return isBluetoothConnected() || isSerialConnected();
}

export function getConnectedDeviceName(): string | null {
  if (isBluetoothConnected() && connectedDevice) {
    return connectedDevice.name || 'Printer Bluetooth';
  }
  if (isSerialConnected()) {
    return serialDeviceName;
  }
  return null;
}

export function getBluetoothStatus(): BluetoothConnectionStatus {
  const btConn = isBluetoothConnected();
  const serConn = isSerialConnected();
  return {
    supported: isBluetoothSupported(),
    serialSupported: isSerialSupported(),
    connected: btConn || serConn,
    connectionType: btConn ? 'bluetooth' : serConn ? 'serial' : 'none',
    deviceName: getConnectedDeviceName()
  };
}

export function subscribeBluetoothStatus(listener: BluetoothStateListener): () => void {
  stateListeners.add(listener);
  listener(getBluetoothStatus());
  return () => {
    stateListeners.delete(listener);
  };
}

function notifyStateChange() {
  const status = getBluetoothStatus();
  stateListeners.forEach(fn => {
    try { fn(status); } catch {}
  });
}

/**
 * Re-scan or discover write characteristic from connected GATT server
 */
async function discoverWriteCharacteristic(server: any): Promise<any> {
  // Try known services first
  for (const serviceUuid of THERMAL_PRINTER_SERVICES) {
    try {
      const service = await server.getPrimaryService(serviceUuid);
      const chars = await service.getCharacteristics();
      for (const c of chars) {
        if (c.properties.write || c.properties.writeWithoutResponse) {
          return c;
        }
      }
    } catch {}
  }

  // Fallback to all primary services
  try {
    const services = await server.getPrimaryServices();
    for (const s of services) {
      try {
        const chars = await s.getCharacteristics();
        for (const c of chars) {
          if (c.properties.write || c.properties.writeWithoutResponse) {
            return c;
          }
        }
      } catch {}
    }
  } catch {}

  return null;
}

/**
 * Ensure persistent connection: Reuses active connection or attempts quick reconnection
 * before asking user to select a device again.
 */
export async function ensureBluetoothPrinterConnected(): Promise<{ 
  connected: boolean; 
  deviceName?: string; 
  error?: string;
  isUnsupportedEnvironment?: boolean;
}> {
  if (isPrinterConnected()) {
    return {
      connected: true,
      deviceName: getConnectedDeviceName() || 'Printer Thermal'
    };
  }

  // If device reference exists, attempt to reconnect GATT server without prompting user
  if (connectedDevice && connectedDevice.gatt) {
    try {
      const server = await connectedDevice.gatt.connect();
      const char = await discoverWriteCharacteristic(server);
      if (char) {
        writeCharacteristic = char;
        notifyStateChange();
        return {
          connected: true,
          deviceName: connectedDevice.name || 'Printer Bluetooth'
        };
      }
    } catch (reconnectErr) {
      console.warn('Auto-reconnect to existing Bluetooth printer failed:', reconnectErr);
    }
  }

  // If Bluetooth is supported, connect Bluetooth
  if (isBluetoothSupported()) {
    return await connectBluetoothPrinter();
  }

  // If Serial is supported (Common in PC / Chrome / Edge / Electron), connect Serial
  if (isSerialSupported()) {
    return await connectSerialPrinter();
  }

  // If neither supported (typical in standard Capacitor WebView on PC or mobile WebView without permissions)
  return {
    connected: false,
    error: 'Web Bluetooth & Serial API tidak diaktifkan oleh browser/wrapper Anda. Silakan gunakan opsi Cetak Struk 58mm (Sistem/Spooler Windows) yang bekerja 100% stabil di PC!',
    isUnsupportedEnvironment: true
  };
}

/**
 * Connect to a Bluetooth Thermal Printer using Web Bluetooth API
 */
export async function connectBluetoothPrinter(): Promise<{ connected: boolean; deviceName?: string; error?: string }> {
  if (!isBluetoothSupported()) {
    return {
      connected: false,
      error: 'Web Bluetooth API tidak didukung pada browser/wrapper ini. Gunakan Google Chrome PC atau Cetak Struk 58mm (Sistem).'
    };
  }

  try {
    // 1. Request Bluetooth Device
    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: THERMAL_PRINTER_SERVICES
    });

    if (!device) {
      return { connected: false, error: 'Tidak ada perangkat printer yang dipilih.' };
    }

    // Handle disconnect listener
    device.addEventListener('gattserverdisconnected', onDeviceDisconnected);

    // 2. Connect to GATT Server
    const server = await device.gatt.connect();

    // 3. Search for available print service & characteristic
    const characteristic = await discoverWriteCharacteristic(server);

    if (!characteristic) {
      device.gatt.disconnect();
      return { 
        connected: false, 
        error: 'Karakteristik penulisan data (Write Characteristic) printer tidak ditemukan pada perangkat ini.' 
      };
    }

    connectedDevice = device;
    writeCharacteristic = characteristic;
    notifyStateChange();

    return {
      connected: true,
      deviceName: device.name || 'Thermal Printer'
    };
  } catch (err: any) {
    if (err?.name === 'NotFoundError') {
      return { connected: false, error: 'Pencarian perangkat dibatalkan.' };
    }
    return { 
      connected: false, 
      error: err?.message || 'Gagal terhubung dengan printer Bluetooth.' 
    };
  }
}

/**
 * Connect to Thermal Printer via Web Serial API (USB / Bluetooth Virtual COM Port on PC)
 */
export async function connectSerialPrinter(baudRate: number = 9600): Promise<{ connected: boolean; deviceName?: string; error?: string }> {
  if (!isSerialSupported()) {
    return {
      connected: false,
      error: 'Web Serial API tidak didukung oleh browser/wrapper ini.'
    };
  }

  try {
    const port = await (navigator as any).serial.requestPort();
    await port.open({ baudRate });
    serialPort = port;
    serialWriter = port.writable.getWriter();
    serialDeviceName = 'Printer Serial (COM/USB)';
    notifyStateChange();

    return {
      connected: true,
      deviceName: serialDeviceName
    };
  } catch (err: any) {
    if (err?.name === 'NotFoundError') {
      return { connected: false, error: 'Pemilihan port serial dibatalkan.' };
    }
    return {
      connected: false,
      error: err?.message || 'Gagal terhubung ke port serial printer.'
    };
  }
}

function onDeviceDisconnected() {
  console.log('Bluetooth printer disconnected.');
  writeCharacteristic = null;
  notifyStateChange();
}

export async function disconnectBluetoothPrinter(): Promise<void> {
  // Disconnect Bluetooth
  if (connectedDevice && connectedDevice.gatt) {
    try {
      connectedDevice.gatt.disconnect();
    } catch {}
  }
  connectedDevice = null;
  writeCharacteristic = null;

  // Disconnect Serial
  if (serialWriter) {
    try {
      serialWriter.releaseLock();
    } catch {}
    serialWriter = null;
  }
  if (serialPort) {
    try {
      await serialPort.close();
    } catch {}
    serialPort = null;
  }

  notifyStateChange();
}

export const disconnectPrinter = disconnectBluetoothPrinter;

// ----------------------------------------------------
// ESC/POS COMMAND BUILDER (OPTIMIZED FOR 58mm / 32 COLS)
// ----------------------------------------------------

export class EscPosBuilder {
  private buffer: number[] = [];
  private readonly maxChars = 32; // Standard 58mm printable character width

  constructor() {
    this.init();
  }

  init(): this {
    // ESC @ (Initialize printer)
    this.buffer.push(0x1B, 0x40);
    return this;
  }

  alignCenter(): this {
    // ESC a 1
    this.buffer.push(0x1B, 0x61, 0x01);
    return this;
  }

  alignLeft(): this {
    // ESC a 0
    this.buffer.push(0x1B, 0x61, 0x00);
    return this;
  }

  alignRight(): this {
    // ESC a 2
    this.buffer.push(0x1B, 0x61, 0x02);
    return this;
  }

  bold(enable: boolean = true): this {
    // ESC E n
    this.buffer.push(0x1B, 0x45, enable ? 0x01 : 0x00);
    return this;
  }

  doubleSize(enable: boolean = true): this {
    // GS ! n (Double width + height)
    this.buffer.push(0x1D, 0x21, enable ? 0x11 : 0x00);
    return this;
  }

  text(str: string): this {
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    for (let i = 0; i < bytes.length; i++) {
      this.buffer.push(bytes[i]);
    }
    return this;
  }

  textLine(str: string = ''): this {
    this.text(str);
    this.buffer.push(0x0A); // LF
    return this;
  }

  lineFeed(lines: number = 1): this {
    for (let i = 0; i < lines; i++) {
      this.buffer.push(0x0A);
    }
    return this;
  }

  divider(char: string = '-'): this {
    this.textLine(char.repeat(this.maxChars));
    return this;
  }

  twoColumn(left: string, right: string): this {
    const l = left || '';
    const r = right || '';
    const totalSpaces = this.maxChars - l.length - r.length;
    if (totalSpaces > 0) {
      this.textLine(l + ' '.repeat(totalSpaces) + r);
    } else {
      // If exceeds 32 chars, trim or print on two lines
      const maxLeft = this.maxChars - r.length - 1;
      if (maxLeft > 0) {
        this.textLine(l.substring(0, maxLeft) + ' ' + r);
      } else {
        this.textLine(l);
        this.alignRight().textLine(r).alignLeft();
      }
    }
    return this;
  }

  cutPaper(): this {
    this.lineFeed(3);
    // GS V 66 0 (Partial cut)
    this.buffer.push(0x1D, 0x56, 0x42, 0x00);
    return this;
  }

  getBytes(): Uint8Array {
    return new Uint8Array(this.buffer);
  }
}

/**
 * Sends raw bytes to Bluetooth Characteristic or Serial Port in safe chunks
 */
export async function sendEscPosBytes(bytes: Uint8Array): Promise<{ success: boolean; error?: string }> {
  // If connected via Web Serial (PC USB / Bluetooth Virtual COM)
  if (isSerialConnected() && serialWriter) {
    try {
      await serialWriter.write(bytes);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal mengirim data ke port serial printer.' };
    }
  }

  // If connected via Web Bluetooth GATT
  if (isBluetoothConnected() && writeCharacteristic) {
    try {
      const CHUNK_SIZE = 64;
      for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
        const chunk = bytes.slice(i, i + CHUNK_SIZE);
        if (writeCharacteristic.writeValueWithoutResponse) {
          await writeCharacteristic.writeValueWithoutResponse(chunk);
        } else {
          await writeCharacteristic.writeValue(chunk);
        }
        // Small pause to prevent buffer overflow on mini EDC printers
        await new Promise(r => setTimeout(r, 20));
      }
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Gagal mengirim data cetak ke printer Bluetooth.' };
    }
  }

  return { 
    success: false, 
    error: 'Printer Thermal belum terhubung. Silakan hubungkan printer atau gunakan Cetak Struk 58mm (Sistem/Spooler).' 
  };
}

/**
 * Encodes Servis transaction data into standard ESC/POS byte array for 58mm thermal printers
 */
export function encodeServisToEscPos58mm(
  toko: { namaKonter: string; hpKonter: string; alamatKonter?: string },
  servis: any
): Uint8Array {
  const builder = new EscPosBuilder();

  // Header Toko
  builder
    .alignCenter()
    .bold(true)
    .doubleSize(true)
    .textLine(toko.namaKonter || 'A TEKNISI')
    .doubleSize(false)
    .textLine('Spesialis Servis HP & Sparepart')
    .textLine(`WA: ${toko.hpKonter || '-'}`)
    .bold(false)
    .divider('=');

  // Info Transaksi / Nota
  builder
    .alignLeft()
    .twoColumn('No. Nota :', servis.noNota || '-')
    .twoColumn('Tgl Masuk:', servis.tanggal || '-')
    .twoColumn('Pelanggan:', (servis.namaPelanggan || '-').substring(0, 18))
    .twoColumn('No. HP   :', servis.noHp || '-')
    .twoColumn('Unit HP  :', (servis.tipeHp || '-').substring(0, 18));

  if (servis.imei) {
    builder.twoColumn('IMEI     :', servis.imei);
  }

  builder
    .twoColumn('Status   :', servis.status || 'Dikerjakan')
    .divider('-');

  // Keluhan & Kerusakan
  builder
    .bold(true)
    .textLine('Keluhan & Kerusakan:')
    .bold(false)
    .textLine(` ${servis.keluhan || '-'}`)
    .divider('-');

  // Rincian Biaya
  if (servis.namaSparepart) {
    builder.twoColumn(`Sp: ${(servis.namaSparepart).substring(0, 16)}`, `Rp ${(servis.hargaSparepart || 0).toLocaleString('id-ID')}`);
  }

  builder
    .twoColumn('Jasa Servis :', `Rp ${(servis.jasaServis || 0).toLocaleString('id-ID')}`)
    .divider('-');

  // Total & Pembayaran
  builder
    .bold(true)
    .twoColumn('TOTAL BIAYA :', `Rp ${(servis.totalBiaya || 0).toLocaleString('id-ID')}`);

  if (servis.dp && servis.dp > 0) {
    const sisa = Math.max(0, (servis.totalBiaya || 0) - servis.dp);
    builder
      .twoColumn('Uang Muka/DP:', `Rp ${servis.dp.toLocaleString('id-ID')}`)
      .twoColumn('SISA BAYAR  :', `Rp ${sisa.toLocaleString('id-ID')}`);
  }

  builder
    .bold(false)
    .divider('=')
    .alignCenter()
    .textLine('SYARAT & KETENTUAN GARANSI:')
    .textLine(toko.alamatKonter || 'Garansi berlaku sesuai nota fisik.')
    .textLine('Barang > 30 hari tidak diambil,')
    .textLine('di luar tanggung jawab kami.')
    .divider('-')
    .bold(true)
    .textLine('TERIMA KASIH ATAS KEPERCAYAANNYA')
    .bold(false)
    .cutPaper();

  return builder.getBytes();
}

/**
 * Print Nota Servis via Bluetooth Thermal ESC/POS
 */
export async function printBluetoothNotaServis(
  toko: { namaKonter: string; hpKonter: string; alamatKonter: string },
  servis: any
): Promise<{ success: boolean; error?: string }> {
  const conn = await ensureBluetoothPrinterConnected();
  if (!conn.connected) {
    return { success: false, error: conn.error || 'Printer Bluetooth belum terhubung.' };
  }

  const bytes = encodeServisToEscPos58mm(toko, servis);
  return await sendEscPosBytes(bytes);
}

/**
 * Print Struk Transaksi Jual Beli HP via Bluetooth Thermal ESC/POS
 */
export async function printBluetoothStrukJualBeli(
  toko: { namaKonter: string; hpKonter: string; alamatKonter?: string },
  hp: {
    namaHp: string;
    imei?: string;
    kondisi?: string;
    hargaJual: number;
    tanggalTerjual?: string;
    pembeli?: string;
    catatan?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  const conn = await ensureBluetoothPrinterConnected();
  if (!conn.connected) {
    return { success: false, error: conn.error || 'Printer Bluetooth belum terhubung.' };
  }

  const builder = new EscPosBuilder();

  builder
    .alignCenter()
    .bold(true)
    .doubleSize(true)
    .textLine(toko.namaKonter || 'A TEKNISI')
    .doubleSize(false)
    .textLine('STRUK JUAL BELI SMARTPHONE')
    .textLine(`WA: ${toko.hpKonter || '-'}`)
    .bold(false)
    .divider('=');

  builder
    .alignLeft()
    .twoColumn('Tanggal :', hp.tanggalTerjual || new Date().toLocaleDateString('id-ID'))
    .twoColumn('Unit HP :', (hp.namaHp || '-').substring(0, 20));

  if (hp.imei) {
    builder.twoColumn('IMEI    :', hp.imei);
  }
  if (hp.kondisi) {
    builder.twoColumn('Kondisi :', hp.kondisi.substring(0, 20));
  }
  if (hp.pembeli) {
    builder.twoColumn('Pembeli :', hp.pembeli.substring(0, 20));
  }

  builder
    .divider('-')
    .bold(true)
    .twoColumn('HARGA JUAL:', `Rp ${(hp.hargaJual || 0).toLocaleString('id-ID')}`)
    .bold(false)
    .divider('=');

  if (hp.catatan) {
    builder
      .textLine(`Catatan: ${hp.catatan}`)
      .divider('-');
  }

  builder
    .alignCenter()
    .textLine('Garansi unit sesuai kesepakatan.')
    .textLine('Cek kondisi sebelum meninggalkan toko.')
    .textLine('Barang yang dibeli tidak dapat')
    .textLine('dikembalikan kecuali rusak fungsi.')
    .divider('-')
    .bold(true)
    .textLine('TERIMA KASIH')
    .bold(false)
    .cutPaper();

  return await sendEscPosBytes(builder.getBytes());
}
