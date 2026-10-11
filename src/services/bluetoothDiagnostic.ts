/**
 * Bluetooth & Thermal Printer Diagnostic Service
 * Analyzes Web Bluetooth runtime support, Secure Context, Permissions,
 * and provides structured diagnostics for SecurityError and NotFoundError
 * with actionable solutions for Capacitor / Android APK and PC builds.
 */

export interface DiagnosticEnvironment {
  isSecureContext: boolean;
  protocol: string;
  hostname: string;
  hasWebBluetooth: boolean;
  hasWebSerial: boolean;
  hasSystemPrint: boolean;
  isCapacitor: boolean;
  isAndroid: boolean;
  isMobile: boolean;
  browserName: string;
  bluetoothAdapterAvailable: boolean | null; // null if getAvailability() unsupported
}

export type DiagnosticErrorType = 
  | 'SECURITY_ERROR' 
  | 'NOT_FOUND_ERROR' 
  | 'NOT_ALLOWED_ERROR' 
  | 'NOT_SUPPORTED_ERROR' 
  | 'UNKNOWN_ERROR';

export interface DiagnosticProbeResult {
  success: boolean;
  errorType?: DiagnosticErrorType;
  rawError?: string;
  title: string;
  message: string;
  rootCauses: string[];
  remedies: {
    target: 'capacitor' | 'pc' | 'printer' | 'general';
    title: string;
    description: string;
    codeSnippet?: string;
  }[];
  device?: {
    name: string;
    id: string;
    connected: boolean;
  };
}

// Thermal Printer Service UUIDs
const THERMAL_PRINTER_SERVICES = [
  '000018f0-0000-1000-8000-00805f9b34fb',
  'e7810a71-73ae-499d-8c15-faa9aef0c3f2',
  '49535343-fe7d-4ae5-8fa9-9fafd205e455',
  '0000ff00-0000-1000-8000-00805f9b34fb',
  '0000ae30-0000-1000-8000-00805f9b34fb',
  '0000fee7-0000-1000-8000-00805f9b34fb'
];

/**
 * Inspect runtime environment and capabilities
 */
export async function getDiagnosticEnvironment(): Promise<DiagnosticEnvironment> {
  const isSecure = typeof window !== 'undefined' ? Boolean(window.isSecureContext) : false;
  const protocol = typeof window !== 'undefined' ? window.location.protocol : 'unknown:';
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'unknown';
  
  const hasWebBluetooth = typeof navigator !== 'undefined' && 'bluetooth' in navigator && typeof (navigator as any).bluetooth !== 'undefined';
  const hasWebSerial = typeof navigator !== 'undefined' && 'serial' in navigator && typeof (navigator as any).serial !== 'undefined';
  const hasSystemPrint = typeof window !== 'undefined' && typeof window.print === 'function';

  // Detect Capacitor & WebView
  const isCapacitor = typeof window !== 'undefined' && Boolean(
    (window as any).Capacitor || 
    (window as any).CapacitorWeb || 
    (window as any).androidBridge ||
    protocol === 'capacitor:'
  );

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  const isAndroid = /Android/i.test(ua);
  const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);

  let browserName = 'Browser Standar';
  if (/Edg\//i.test(ua)) browserName = 'Microsoft Edge';
  else if (/Chrome\//i.test(ua) && !/wv/i.test(ua)) browserName = 'Google Chrome';
  else if (/wv|Version\/.*Chrome/i.test(ua) || isCapacitor) browserName = 'Android WebView (Capacitor/App)';
  else if (/Firefox\//i.test(ua)) browserName = 'Mozilla Firefox';
  else if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) browserName = 'Apple Safari';

  // Probe Bluetooth adapter availability
  let bluetoothAdapterAvailable: boolean | null = null;
  if (hasWebBluetooth && typeof (navigator as any).bluetooth.getAvailability === 'function') {
    try {
      bluetoothAdapterAvailable = await (navigator as any).bluetooth.getAvailability();
    } catch {
      bluetoothAdapterAvailable = null;
    }
  }

  return {
    isSecureContext: isSecure,
    protocol,
    hostname,
    hasWebBluetooth,
    hasWebSerial,
    hasSystemPrint,
    isCapacitor,
    isAndroid,
    isMobile,
    browserName,
    bluetoothAdapterAvailable
  };
}

/**
 * Execute an interactive diagnostic scan via navigator.bluetooth.requestDevice
 * with explicit catching and categorization of SecurityError, NotFoundError, etc.
 */
export async function runDiagnosticBluetoothProbe(): Promise<DiagnosticProbeResult> {
  const env = await getDiagnosticEnvironment();

  // 1. Pre-flight check: Is Web Bluetooth API available at all?
  if (!env.hasWebBluetooth) {
    return {
      success: false,
      errorType: 'NOT_SUPPORTED_ERROR',
      title: 'Web Bluetooth API Tidak Ditemukan',
      message: 'Objek `navigator.bluetooth` tidak tersedia di browser atau wrapper WebView yang sedang berjalan.',
      rootCauses: [
        'Browser yang digunakan tidak mengimplementasikan Web Bluetooth API (misalnya Firefox, Safari, atau WebView Android standar).',
        'Aplikasi berjalan di dalam Android WebView / Capacitor tanpa konfigurasi WebBluetooth bridge.',
        'Koneksi bukan HTTPS atau bukan localhost.'
      ],
      remedies: [
        {
          target: 'capacitor',
          title: 'Konfigurasi Capacitor Android APK',
          description: 'WebView Android bawaan tidak mengaktifkan Web Bluetooth secara native. Pastikan Anda menggunakan plugin @capacitor-community/bluetooth-le atau membuka aplikasi melalui Chrome Android di HP.',
          codeSnippet: `// Pasang di capacitor.config.json:
{
  "server": {
    "androidScheme": "https",
    "cleartext": false
  }
}`
        },
        {
          target: 'pc',
          title: 'Gunakan Google Chrome / Microsoft Edge di PC',
          description: 'Gunakan browser Google Chrome atau Microsoft Edge versi terbaru pada PC untuk dukungan Web Bluetooth 100% aktif.',
          codeSnippet: 'chrome://flags/#enable-web-bluetooth'
        },
        {
          target: 'general',
          title: 'Gunakan Cetak Struk 58mm Sistem (Alternatif 100% Berhasil)',
          description: 'Gunakan tombol "Cetak Struk 58mm (Sistem)" di aplikasi. Opsi ini menggunakan spooler printer Windows/Android bawaan yang selalu berhasil di semua wrapper tanpa memerlukan Web Bluetooth API!'
        }
      ]
    };
  }

  // 2. Pre-flight check: Is context secure?
  if (!env.isSecureContext) {
    return {
      success: false,
      errorType: 'SECURITY_ERROR',
      title: 'Konteks Keamanan Tidak Aman (Insecure Context)',
      message: 'Web Bluetooth API secara ketat membutuhkan Secure Context (HTTPS atau http://localhost). Protokol saat ini adalah ' + env.protocol,
      rootCauses: [
        'Aplikasi dibuka melalui alamat HTTP tidak aman (contoh: http://192.168.x.x atau IP lokal).',
        'Android WebView memuat file via schema file:// atau http:// tanpa SSL.'
      ],
      remedies: [
        {
          target: 'general',
          title: 'Gunakan Domain HTTPS atau Localhost',
          description: 'Jalankan aplikasi melalui URL https:// atau http://localhost agar browser mengizinkan akses ke perangkat keras Bluetooth.'
        },
        {
          target: 'capacitor',
          title: 'Setel Android Scheme ke HTTPS di Capacitor',
          description: 'Tambahkan `androidScheme: "https"` pada konfigurasi server di `capacitor.config.json` agar WebView berjalan dalam konteks HTTPS aman.',
          codeSnippet: `// capacitor.config.json
{
  "server": {
    "androidScheme": "https"
  }
}`
        }
      ]
    };
  }

  // 3. Perform live device request probe
  try {
    const device = await (navigator as any).bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: THERMAL_PRINTER_SERVICES
    });

    if (!device) {
      throw new Error('Tidak ada perangkat yang dipilih.');
    }

    // Try GATT connection test
    let gattConnected = false;
    if (device.gatt) {
      try {
        const server = await device.gatt.connect();
        gattConnected = server.connected;
      } catch (gattErr: any) {
        console.warn('GATT test notice:', gattErr);
      }
    }

    return {
      success: true,
      title: 'Diagnostik Bluetooth Berhasil!',
      message: `Perangkat "${device.name || 'Printer Thermal'}" berhasil ditemukan dan diakses via Web Bluetooth API.`,
      rootCauses: [],
      device: {
        name: device.name || 'Perangkat Bluetooth',
        id: device.id || 'bt_device',
        connected: gattConnected
      },
      remedies: [
        {
          target: 'general',
          title: 'Perangkat Siap Digunakan',
          description: 'Anda dapat langsung mencetak nota struk thermal 58mm / 80mm secara nirkabel.'
        }
      ]
    };
  } catch (err: any) {
    const errorName = err?.name || '';
    const errorMsg = err?.message || String(err);

    // Explicitly handle SecurityError
    if (errorName === 'SecurityError' || errorMsg.toLowerCase().includes('security') || errorMsg.toLowerCase().includes('permissions policy')) {
      return {
        success: false,
        errorType: 'SECURITY_ERROR',
        rawError: `${errorName}: ${errorMsg}`,
        title: 'SecurityError: Akses Bluetooth Diblokir Keamanan',
        message: 'Browser memblokir pemanggilan requestDevice() karena kebijakan keamanan (SecurityError). Ini biasanya terjadi jika aplikasi tidak berjalan di HTTPS, dibatasi izin iframe, atau WebView Android tidak memiliki izin runtime Bluetooth.',
        rootCauses: [
          'Aplikasi berjalan dalam konteks HTTP biasa (bukan HTTPS).',
          'Aplikasi dijalankan di dalam iframe tanpa atribut `allow="bluetooth"`.',
          'Pada APK Capacitor: WebView Android membutuhkan deklarasi izin Bluetooth di AndroidManifest.xml serta WebChromeClient permissions callback.'
        ],
        remedies: [
          {
            target: 'capacitor',
            title: '1. Tambahkan Izin Bluetooth di AndroidManifest.xml',
            description: 'Buka file `android/app/src/main/AndroidManifest.xml` pada proyek Capacitor Anda dan pastikan tag izin berikut ditambahkan di dalam `<manifest>`:',
            codeSnippet: `<!-- Izin Bluetooth Android 12+ (API 31+) -->
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" android:usesPermissionFlags="neverForLocation" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />
<uses-permission android:name="android.permission.BLUETOOTH_ADVERTISE" />

<!-- Izin Bluetooth Android 11 ke bawah -->
<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />`
          },
          {
            target: 'capacitor',
            title: '2. Konfigurasi HTTPS Scheme di capacitor.config.json',
            description: 'Ubah skema server di `capacitor.config.json` agar WebView dikenali sebagai Secure Context:',
            codeSnippet: `{
  "appId": "com.ateknisi.kasirservis",
  "appName": "Kasir Servis HP",
  "webDir": "dist",
  "server": {
    "androidScheme": "https",
    "cleartext": false
  }
}`
          },
          {
            target: 'general',
            title: '3. Solusi Instan: Gunakan Cetak Struk 58mm (Sistem Spooler)',
            description: 'Jika Bluetooth Web API terblokir di wrapper PC/Capacitor, gunakan tombol "Cetak Struk 58mm (Sistem)" pada modal nota. Opsi ini 100% stabil, tidak membutuhkan izin Bluetooth, dan langsung mencetak rapi ke printer thermal kasir Anda!'
          }
        ]
      };
    }

    // Explicitly handle NotFoundError
    if (errorName === 'NotFoundError' || errorMsg.toLowerCase().includes('not found') || errorMsg.toLowerCase().includes('cancelled') || errorMsg.toLowerCase().includes('canceled') || errorMsg.toLowerCase().includes('no device')) {
      return {
        success: false,
        errorType: 'NOT_FOUND_ERROR',
        rawError: `${errorName}: ${errorMsg}`,
        title: 'NotFoundError: Perangkat Tidak Ditemukan / Dibatalkan',
        message: 'Dialog pemindaian Bluetooth ditutup, tidak ada printer yang dipilih, atau adaptor Bluetooth perangkat tidak menemukan printer thermal di sekitarnya.',
        rootCauses: [
          'Pengguna menekan tombol "Batal" atau mengklik di luar jendela dialog pencarian Bluetooth.',
          'Printer thermal 58mm belum dinyalakan (posisi tombol OFF) atau kehabisan daya baterai.',
          'Bluetooth pada HP / PC Anda dalam keadaan non-aktif (OFF).',
          'Printer thermal sudah tersambung ke HP / perangkat lain (printer kasir umumnya hanya menerima 1 koneksi aktif sekaligus).'
        ],
        remedies: [
          {
            target: 'printer',
            title: '1. Periksa Daya & Status Printer Thermal',
            description: 'Pastikan printer thermal 58mm dalam keadaan HIDUP (ON). Lampu indikator status/Bluetooth biasanya berkedip biru/merah menandakan siap dipasangkan.'
          },
          {
            target: 'printer',
            title: '2. Putuskan Koneksi dari Perangkat Lain',
            description: 'Jika printer thermal sebelumnya dihubungkan ke HP lain atau aplikasi POS lain, matikan Bluetooth di HP tersebut agar printer dapat ditemukan kembali.'
          },
          {
            target: 'general',
            title: '3. Aktifkan Bluetooth & Lokasi (GPS) di HP',
            description: 'Pada smartphone Android, sistem operasi mewajibkan fitur Lokasi (GPS) dan Bluetooth aktif secara bersamaan agar pemindaian BLE (Bluetooth Low Energy) diizinkan.'
          },
          {
            target: 'general',
            title: '4. Pasangkan (Pair) Terlebih Dahulu di Pengaturan HP / PC',
            description: 'Buka Pengaturan Bluetooth di Windows atau Android, cari nama printer (contoh: "RPP02N", "POS-58", "MPT-II", "GOOJPRT"), pasangkan dengan PIN default: 0000 atau 1234.'
          }
        ]
      };
    }

    // Explicitly handle NotAllowedError
    if (errorName === 'NotAllowedError') {
      return {
        success: false,
        errorType: 'NOT_ALLOWED_ERROR',
        rawError: `${errorName}: ${errorMsg}`,
        title: 'NotAllowedError: Izin Bluetooth Tidak Diberikan',
        message: 'Akses Bluetooth ditolak oleh pengaturan izin peramban atau sistem perangkat.',
        rootCauses: [
          'Pengguna memilih "Blokir" saat peramban meminta izin Bluetooth.',
          'Izin Bluetooth dibatasi oleh kebijakan keamanan sistem operasi.'
        ],
        remedies: [
          {
            target: 'general',
            title: 'Buka Izin Bluetooth di Peramban',
            description: 'Klik ikon gembok / pengaturan di bilah alamat URL peramban, lalu ubah izin Bluetooth menjadi "Izinkan" (Allow).'
          }
        ]
      };
    }

    // Fallback for other errors
    return {
      success: false,
      errorType: 'UNKNOWN_ERROR',
      rawError: `${errorName}: ${errorMsg}`,
      title: 'Pemeriksaan Bluetooth Gagal',
      message: errorMsg || 'Terjadi kesalahan yang tidak terduga saat mencoba mengakses Bluetooth.',
      rootCauses: [
        'Adaptor Bluetooth perangkat mengalami gangguan atau sibuk.',
        'Driver Bluetooth sistem operasi membutuhkan pembaharuan.'
      ],
      remedies: [
        {
          target: 'general',
          title: 'Muat Ulang Bluetooth & Aplikasi',
          description: 'Matikan Bluetooth selama 5 detik lalu nyalakan kembali. Refresh aplikasi dan coba lagi.'
        },
        {
          target: 'pc',
          title: 'Gunakan Opsi Cetak Struk 58mm (Sistem)',
          description: 'Gunakan tombol cetak langsung tanpa Bluetooth untuk mencetak nota melalui driver printer thermal Windows.'
        }
      ]
    };
  }
}
