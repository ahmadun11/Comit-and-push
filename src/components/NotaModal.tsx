import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Bluetooth, 
  X, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Unlink, 
  Smartphone,
  Cable,
  HelpCircle,
  FileText,
  Monitor,
  ExternalLink
} from 'lucide-react';
import { ServisItem, PengaturanToko } from '../types';
import { formatRupiah } from '../services/db';
import { 
  connectBluetoothPrinter, 
  connectSerialPrinter,
  disconnectBluetoothPrinter,
  ensureBluetoothPrinterConnected,
  isBluetoothSupported, 
  isSerialSupported,
  subscribeBluetoothStatus, 
  BluetoothConnectionStatus,
  encodeServisToEscPos58mm,
  sendEscPosBytes,
  getBluetoothStatus
} from '../services/bluetoothPrinter';
import { openWhatsApp } from '../services/externalApp';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  servis: ServisItem | null;
  toko: PengaturanToko;
}

/**
 * Encodes transaction data into ESC/POS byte commands for 58mm paper.
 * Standard 58mm thermal width: 32 character columns.
 */
export function encodeTransactionToEscPos(
  toko: PengaturanToko,
  servis: ServisItem
): Uint8Array {
  return encodeServisToEscPos58mm(toko, servis);
}

export const NotaModal: React.FC<Props> = ({ isOpen, onClose, servis, toko }) => {
  const [btStatus, setBtStatus] = useState<BluetoothConnectionStatus>(getBluetoothStatus());
  const [isConnectingBt, setIsConnectingBt] = useState(false);
  const [isConnectingSerial, setIsConnectingSerial] = useState(false);
  const [isPrintingBt, setIsPrintingBt] = useState(false);
  const [printStatus, setPrintStatus] = useState<{ message: string; isError: boolean } | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Subscribe to persistent Bluetooth & Serial state updates across actions
  useEffect(() => {
    const unsubscribe = subscribeBluetoothStatus((status) => {
      setBtStatus(status);
    });
    return () => unsubscribe();
  }, []);

  if (!isOpen || !servis) return null;

  const sisa = servis.totalBiaya - servis.dp;

  // Handle manual Bluetooth connect
  const handleConnectBluetooth = async () => {
    setIsConnectingBt(true);
    setPrintStatus({ message: 'Mencari dan menghubungkan ke Printer Bluetooth...', isError: false });

    try {
      const res = await connectBluetoothPrinter();
      if (res.connected) {
        setPrintStatus({ 
          message: `Printer Bluetooth (${res.deviceName || 'Thermal'}) berhasil terhubung dan siap digunakan!`, 
          isError: false 
        });
      } else {
        setPrintStatus({ 
          message: res.error || 'Gagal menghubungkan printer bluetooth.', 
          isError: true 
        });
      }
    } catch (err: any) {
      setPrintStatus({ 
        message: err?.message || 'Terjadi kesalahan saat mencari printer bluetooth.', 
        isError: true 
      });
    } finally {
      setIsConnectingBt(false);
      setTimeout(() => {
        setPrintStatus(null);
      }, 5000);
    }
  };

  // Handle Web Serial (USB / Bluetooth Virtual COM on PC)
  const handleConnectSerial = async () => {
    setIsConnectingSerial(true);
    setPrintStatus({ message: 'Membuka pilihan port Serial/COM printer (PC)...', isError: false });

    try {
      const res = await connectSerialPrinter();
      if (res.connected) {
        setPrintStatus({
          message: `Port Serial (${res.deviceName || 'COM'}) berhasil terhubung!`,
          isError: false
        });
      } else {
        setPrintStatus({
          message: res.error || 'Gagal terhubung ke port serial.',
          isError: true
        });
      }
    } catch (err: any) {
      setPrintStatus({
        message: err?.message || 'Terjadi kesalahan saat membuka port serial.',
        isError: true
      });
    } finally {
      setIsConnectingSerial(false);
      setTimeout(() => {
        setPrintStatus(null);
      }, 5000);
    }
  };

  // Disconnect printer
  const handleDisconnectPrinter = async () => {
    try {
      await disconnectBluetoothPrinter();
      setPrintStatus({ message: 'Koneksi printer telah diputus.', isError: false });
    } catch {
      setPrintStatus({ message: 'Gagal memutuskan koneksi printer.', isError: true });
    }
    setTimeout(() => {
      setPrintStatus(null);
    }, 3000);
  };

  // Print using persistent Web Bluetooth API / Serial with ESC/POS encoding
  const handlePrintBluetoothOrSerial = async () => {
    // If printer is already connected via Bluetooth or Serial, print immediately
    if (btStatus.connected) {
      setIsPrintingBt(true);
      setPrintStatus({ message: 'Mengirim data struk ESC/POS ke printer thermal 58mm...', isError: false });

      try {
        const escPosBytes = encodeTransactionToEscPos(toko, servis);
        const res = await sendEscPosBytes(escPosBytes);
        if (res.success) {
          setPrintStatus({ 
            message: `Struk berhasil dicetak ke ${btStatus.deviceName || 'Printer Thermal'}!`, 
            isError: false 
          });
        } else {
          setPrintStatus({ 
            message: res.error || 'Gagal mengirim data cetak ke printer.', 
            isError: true 
          });
        }
      } catch (err: any) {
        setPrintStatus({ 
          message: err?.message || 'Terjadi kesalahan cetak ESC/POS.', 
          isError: true 
        });
      } finally {
        setIsPrintingBt(false);
        setTimeout(() => {
          setPrintStatus(null);
        }, 5000);
      }
      return;
    }

    // If not connected, check if Web Bluetooth or Serial is available
    if (isBluetoothSupported()) {
      setIsPrintingBt(true);
      setPrintStatus({ message: 'Menghubungkan ke Printer Bluetooth...', isError: false });
      const conn = await ensureBluetoothPrinterConnected();
      if (!conn.connected) {
        setPrintStatus({ 
          message: conn.error || 'Silakan pilih printer Bluetooth thermal terlebih dahulu.', 
          isError: true 
        });
        setIsPrintingBt(false);
        return;
      }

      // Send print
      try {
        const escPosBytes = encodeTransactionToEscPos(toko, servis);
        const res = await sendEscPosBytes(escPosBytes);
        if (res.success) {
          setPrintStatus({ 
            message: `Struk berhasil dicetak ke ${conn.deviceName || 'Printer Thermal'}!`, 
            isError: false 
          });
        } else {
          setPrintStatus({ 
            message: res.error || 'Gagal mengirim data cetak.', 
            isError: true 
          });
        }
      } catch (err: any) {
        setPrintStatus({ 
          message: err?.message || 'Terjadi kesalahan cetak Bluetooth.', 
          isError: true 
        });
      } finally {
        setIsPrintingBt(false);
        setTimeout(() => {
          setPrintStatus(null);
        }, 5000);
      }
      return;
    }

    // If on Capacitor PC / unsupported WebView:
    // Auto-invoke Direct System Thermal Print (100% works on PC without plugins!)
    setPrintStatus({ 
      message: 'Membuka dialog cetak Windows untuk printer thermal 58mm...', 
      isError: false 
    });
    handlePrintStandard();
  };

  const handlePrintStandard = () => {
    window.print();
  };

  const handleShareWA = () => {
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

    openWhatsApp(servis.noHp || '', pesan);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
        <div className="bg-slate-900 border border-slate-700 w-full max-w-sm rounded-2xl p-4 sm:p-5 shadow-2xl text-slate-100 max-h-[95vh] overflow-y-auto relative animate-in fade-in zoom-in-95 duration-150">
          
          {/* Header Preview */}
          <div className="flex items-center justify-between mb-3 no-print">
            <div className="flex items-center gap-1.5">
              <Printer className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-400">
                Cetak Struk (58mm Thermal)
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => setShowHelpModal(true)}
                className="p-1 text-slate-400 hover:text-cyan-300 rounded-lg hover:bg-slate-800 transition"
                title="Panduan Cetak PC / Capacitor"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <button 
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Persistent Connection Bar */}
          <div className="mb-3 p-2.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 no-print">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 overflow-hidden">
                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                  btStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                }`} />
                <div className="truncate text-[11px]">
                  <span className="text-slate-400">Status: </span>
                  {btStatus.connected ? (
                    <span className="font-bold text-emerald-400 truncate">
                      {btStatus.deviceName || 'Terhubung'} ({btStatus.connectionType.toUpperCase()})
                    </span>
                  ) : (
                    <span className="text-slate-400">Belum Terhubung</span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {btStatus.connected ? (
                  <button
                    onClick={handleDisconnectPrinter}
                    className="px-2 py-1 bg-slate-800 hover:bg-rose-900/60 border border-slate-700 hover:border-rose-700/60 text-slate-300 hover:text-rose-200 rounded-lg text-[10px] font-semibold flex items-center gap-1 transition"
                    title="Putus koneksi printer"
                  >
                    <Unlink className="w-3 h-3" />
                    <span>Putus</span>
                  </button>
                ) : (
                  <div className="flex items-center gap-1">
                    {btStatus.supported && (
                      <button
                        onClick={handleConnectBluetooth}
                        disabled={isConnectingBt}
                        className="px-2 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition active:scale-95 disabled:opacity-50"
                        title="Scan & Hubungkan Printer Bluetooth"
                      >
                        {isConnectingBt ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Bluetooth className="w-3 h-3" />}
                        <span>Bluetooth</span>
                      </button>
                    )}

                    {btStatus.serialSupported && (
                      <button
                        onClick={handleConnectSerial}
                        disabled={isConnectingSerial}
                        className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition active:scale-95 disabled:opacity-50"
                        title="Hubungkan Printer via USB / Bluetooth Serial COM"
                      >
                        {isConnectingSerial ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Cable className="w-3 h-3" />}
                        <span>Serial/COM</span>
                      </button>
                    )}

                    {!btStatus.supported && !btStatus.serialSupported && (
                      <button
                        onClick={() => setShowHelpModal(true)}
                        className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 rounded-lg text-[10px] font-medium flex items-center gap-1 transition"
                      >
                        <Monitor className="w-3 h-3" />
                        <span>Mode PC</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Note for PC / Capacitor user */}
            {!btStatus.supported && (
              <div className="text-[10px] text-slate-400 bg-slate-900/80 p-1.5 rounded-lg border border-slate-800/80 flex items-center justify-between">
                <span>Di PC/Capacitor: Gunakan tombol Cetak 58mm (Sistem).</span>
                <button 
                  onClick={() => setShowHelpModal(true)} 
                  className="text-cyan-400 hover:underline font-bold ml-1 shrink-0"
                >
                  Panduan
                </button>
              </div>
            )}
          </div>

          {/* Print Feedback Notification */}
          {printStatus && (
            <div className={`mb-3 p-2.5 rounded-xl border text-xs flex items-center gap-2 ${
              printStatus.isError 
                ? 'bg-rose-950/80 border-rose-700/60 text-rose-200' 
                : 'bg-emerald-950/80 border-emerald-700/60 text-emerald-200'
            }`}>
              {printStatus.isError ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
              )}
              <span className="flex-1 text-[11px] leading-tight">{printStatus.message}</span>
              <button onClick={() => setPrintStatus(null)} className="p-0.5 hover:opacity-75">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Thermal Print Area (Optimized for 57mm - 58mm Paper / 32 Cols) */}
          <div 
            id="printable-receipt" 
            className="bg-white text-slate-900 p-4 rounded-xl font-mono text-xs shadow-inner border border-slate-200 mx-auto select-all max-w-[280px]"
            style={{ width: '100%' }}
          >
            <div className="text-center pb-2 border-b border-dashed border-slate-400">
              <h2 className="text-sm font-black tracking-tight uppercase">{toko.namaKonter || 'A TEKNISI'}</h2>
              <p className="text-[10px] text-slate-600 mt-0.5">Spesialis Servis HP & Sparepart</p>
              <p className="text-[10px] text-slate-600 font-bold">WA: {toko.hpKonter}</p>
            </div>

            <div className="py-2 space-y-1 border-b border-dashed border-slate-400 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">No. Nota:</span>
                <span className="font-bold">{servis.noNota}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tgl Masuk:</span>
                <span>{servis.tanggal}</span>
              </div>
              {servis.status === 'Diambil' && servis.tanggalDiambil && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Tgl Diambil:</span>
                  <span>{servis.tanggalDiambil}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">Pelanggan:</span>
                <span className="font-semibold truncate max-w-[150px]">{servis.namaPelanggan}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">No. HP:</span>
                <span>{servis.noHp || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Tipe HP:</span>
                <span className="font-semibold truncate max-w-[150px]">{servis.tipeHp}</span>
              </div>
              {servis.imei && (
                <div className="flex justify-between">
                  <span className="text-slate-600">IMEI:</span>
                  <span className="font-mono text-[10px]">{servis.imei}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-600">Status:</span>
                <span className="font-bold uppercase text-blue-800">{servis.status}</span>
              </div>
            </div>

            <div className="py-2 space-y-1 border-b border-dashed border-slate-400 text-[11px]">
              <div className="text-slate-600 text-[10px] font-bold">Kerusakan / Keluhan:</div>
              <div className="font-medium text-[10px] bg-slate-50 p-1 rounded leading-tight">{servis.keluhan}</div>

              {servis.namaSparepart && (
                <div className="flex justify-between pt-1">
                  <span className="text-slate-600">Sp: {servis.namaSparepart}</span>
                  <span>{formatRupiah(servis.hargaSparepart || 0)}</span>
                </div>
              )}
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-600">Biaya Jasa:</span>
                <span>{formatRupiah(servis.jasaServis)}</span>
              </div>
            </div>

            <div className="pt-2 pb-1.5 space-y-1 text-xs">
              <div className="flex justify-between font-bold text-xs">
                <span>TOTAL BIAYA:</span>
                <span>{formatRupiah(servis.totalBiaya)}</span>
              </div>
              <div className="flex justify-between text-slate-700 text-[11px]">
                <span>Uang Muka (DP):</span>
                <span>{formatRupiah(servis.dp)}</span>
              </div>
              <div className="flex justify-between font-black text-blue-900 text-sm pt-1 border-t border-slate-200">
                <span>SISA BAYAR:</span>
                <span>{formatRupiah(sisa)}</span>
              </div>
            </div>

            <div className="text-center pt-2 border-t border-dashed border-slate-400 text-[9px] text-slate-600 space-y-0.5">
              <p className="italic">{toko.alamatKonter || 'Garansi servis berlaku sesuai nota fisik.'}</p>
              <p>Barang &gt; 30 hari tidak diambil diluar tanggung jawab kami.</p>
              <p className="font-bold text-slate-900 mt-1">Terima kasih atas kepercayaannya!</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 space-y-2 no-print">
            
            {/* Tombol Utama Cetak Struk */}
            <button
              onClick={handlePrintBluetoothOrSerial}
              disabled={isPrintingBt || isConnectingBt || isConnectingSerial}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold text-xs transition shadow-md shadow-blue-500/20 active:scale-95 disabled:opacity-60"
            >
              {isPrintingBt ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Printer className="w-4 h-4 text-cyan-200" />
              )}
              <span>
                {btStatus.connected 
                  ? `Cetak Struk Thermal (${btStatus.deviceName || '58mm'})` 
                  : btStatus.supported 
                  ? 'Cetak Struk Thermal Bluetooth (58mm)'
                  : '🖨️ Cetak Struk 58mm (Sistem / Thermal Windows)'}
              </span>
            </button>

            <div className="grid grid-cols-2 gap-2">
              {/* Tombol Cetak Standar / PDF */}
              <button
                onClick={handlePrintStandard}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs transition"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Cetak Web / PDF</span>
              </button>

              {/* Tombol Kirim Struk via WhatsApp */}
              <button
                onClick={handleShareWA}
                className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow shadow-emerald-600/25 active:scale-95"
              >
                {/* WhatsApp Official SVG Icon */}
                <svg 
                  className="w-4 h-4 fill-white shrink-0" 
                  viewBox="0 0 24 24"
                >
                  <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
                </svg>
                <span>Kirim Struk WA</span>
              </button>
            </div>

          </div>

        </div>
      </div>

      {/* Capacitor & PC Printing Guide Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm">
          <div className="bg-slate-900 border border-cyan-500/40 w-full max-w-md rounded-2xl p-5 shadow-2xl text-slate-100 max-h-[90vh] overflow-y-auto space-y-4">
            
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Monitor className="w-5 h-5 text-cyan-400" />
                <h3 className="font-bold text-sm text-white">Panduan Cetak Struk di PC / Capacitor</h3>
              </div>
              <button 
                onClick={() => setShowHelpModal(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-300 space-y-3 leading-relaxed">
              <div className="p-3 bg-cyan-950/40 border border-cyan-500/30 rounded-xl text-cyan-200">
                <span className="font-bold block mb-1">❓ Mengapa muncul pesan "Web Bluetooth API tidak didukung"?</span>
                Pada aplikasi yang dibungkus dengan <strong>Capacitor PC / Electron / WebView2</strong>, sistem Windows secara default mematikan akses Web Bluetooth di dalam embedded WebView.
              </div>

              <div>
                <span className="font-bold text-white text-xs block mb-1">✅ 3 Solusi Pasti Berhasil di PC:</span>
                
                <div className="space-y-2 mt-2">
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                      <span>1. Cetak Struk 58mm (Sistem Windows) — Paling Direkomendasikan!</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Klik tombol biru <strong>"Cetak Struk 58mm (Sistem / Thermal Windows)"</strong>. Pada jendela print yang muncul, pilih printer thermal Anda (seperti Xprinter, Panda, POS-58). Layout struk otomatis disetel pas dengan ukuran roll kertas 58mm/57mm tanpa terpotong!
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="font-bold text-indigo-400 flex items-center gap-1.5">
                      <Cable className="w-3.5 h-3.5" />
                      <span>2. Koneksi Port Serial / USB COM (PC)</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Jika printer dihubungkan melalui kabel USB atau dipasangkan sebagai Bluetooth Serial di Windows (misal COM3, COM4), gunakan tombol <strong>"Serial/COM"</strong> di bar atas untuk mengirim byte struk langsung.
                    </p>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                    <div className="font-bold text-cyan-400 flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>3. Buka di Google Chrome / Edge PC</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Buka URL aplikasi ini di browser Google Chrome PC. Browser Chrome memiliki modul Web Bluetooth asli sehingga pemindaian Bluetooth dapat berjalan langsung.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px]">
                <span className="font-bold text-amber-400 block mb-0.5">📱 Jika Dibungkus ke APK Android (Capacitor):</span>
                Pastikan menambahkan izin Bluetooth di file <code>android/app/src/main/AndroidManifest.xml</code>:
                <pre className="bg-slate-900 p-1.5 rounded mt-1 text-[10px] text-cyan-300 overflow-x-auto">
{`<uses-permission android:name="android.permission.BLUETOOTH" />
<uses-permission android:name="android.permission.BLUETOOTH_ADMIN" />
<uses-permission android:name="android.permission.BLUETOOTH_SCAN" />
<uses-permission android:name="android.permission.BLUETOOTH_CONNECT" />`}
                </pre>
              </div>
            </div>

            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl transition"
            >
              Saya Mengerti, Tutup Panduan
            </button>

          </div>
        </div>
      )}
    </>
  );
};


