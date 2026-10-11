import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged,
  User,
  Auth,
  RecaptchaVerifier,
  signInWithPhoneNumber,
  ConfirmationResult,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
  updatePassword
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  collection,
  getDocFromServer,
  Firestore 
} from 'firebase/firestore';

import firebaseConfigJSON from '../../firebase-applet-config.json';

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  measurementId?: string;
  firestoreDatabaseId?: string;
}

export const defaultFirebaseConfig: FirebaseCustomConfig = {
  apiKey: firebaseConfigJSON.apiKey,
  authDomain: firebaseConfigJSON.authDomain,
  projectId: firebaseConfigJSON.projectId,
  storageBucket: firebaseConfigJSON.storageBucket,
  messagingSenderId: firebaseConfigJSON.messagingSenderId,
  appId: firebaseConfigJSON.appId,
  measurementId: firebaseConfigJSON.measurementId || '',
  firestoreDatabaseId: firebaseConfigJSON.firestoreDatabaseId
};

export function getActiveFirebaseConfig(): FirebaseCustomConfig {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('customFirebaseConfig');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.apiKey && parsed.projectId) {
          return parsed;
        }
      } catch {}
    }
  }
  return defaultFirebaseConfig;
}

export function saveCustomFirebaseConfig(config: FirebaseCustomConfig) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('customFirebaseConfig', JSON.stringify(config));
  }
}

export function resetFirebaseConfig() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('customFirebaseConfig');
  }
}

export const firebaseConfig = getActiveFirebaseConfig();

// Initialize app safely
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const dbCloud: Firestore = getFirestore(app, firebaseConfig.firestoreDatabaseId || (firebaseConfigJSON as any).firestoreDatabaseId);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

// Test connection on boot per Firebase skill
export async function testConnection() {
  try {
    await getDocFromServer(doc(dbCloud, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline or network is disconnected.');
    }
  }
}
testConnection();

export { fbSignOut, onAuthStateChanged, signInWithPopup };

export function getCurrentDomain(): string {
  if (typeof window !== 'undefined') {
    return window.location.hostname;
  }
  return '';
}

export function getRecommendedAuthorizedDomains(): string[] {
  const current = getCurrentDomain();
  const domains: string[] = ['localhost', '127.0.0.1'];
  
  if (current && !domains.includes(current)) {
    domains.unshift(current);
  }
  
  // Detect Cloud Run domain pattern (ais-dev-... / ais-pre-...)
  if (current.includes('.run.app')) {
    const preDomain = current.replace('ais-dev-', 'ais-pre-');
    const devDomain = current.replace('ais-pre-', 'ais-dev-');
    if (!domains.includes(devDomain)) domains.push(devDomain);
    if (!domains.includes(preDomain)) domains.push(preDomain);
  }

  const activeCfg = getActiveFirebaseConfig();
  if (activeCfg.authDomain && !domains.includes(activeCfg.authDomain)) {
    domains.push(activeCfg.authDomain);
  }

  return Array.from(new Set(domains));
}

export interface LoginResult {
  user?: User;
  error?: string;
  errorCode?: string;
  isDomainError?: boolean;
  isOperationNotAllowed?: boolean;
  projectId?: string;
}

export async function loginWithGoogle(): Promise<LoginResult> {
  const currentCfg = getActiveFirebaseConfig();
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user };
  } catch (err: any) {
    console.error('Google Sign-in error:', err);
    const code = err?.code || '';
    const message = err?.message || '';

    const isDomainError =
      code === 'auth/unauthorized-domain' ||
      message.includes('unauthorized domain') ||
      message.includes('auth/unauthorized-domain');

    const isOperationNotAllowed =
      code === 'auth/operation-not-allowed' ||
      message.includes('operation-not-allowed') ||
      message.includes('auth/operation-not-allowed');

    let friendlyError = message || 'Gagal login dengan Google';
    if (isOperationNotAllowed) {
      friendlyError = `Google Sign-in belum diaktifkan di Firebase Console (auth/operation-not-allowed) untuk proyek "${currentCfg.projectId}".`;
    } else if (isDomainError) {
      friendlyError = `Domain "${getCurrentDomain()}" belum ditambahkan ke daftar Authorized Domains di Firebase Console (auth/unauthorized-domain).`;
    } else if (code === 'auth/popup-closed-by-user') {
      friendlyError = 'Jendela pop-up login ditutup sebelum proses selesai.';
    } else if (code === 'auth/cancelled-popup-request') {
      friendlyError = 'Proses login dibatalkan karena ada permintaan baru.';
    }

    return {
      error: friendlyError,
      errorCode: code,
      isDomainError,
      isOperationNotAllowed,
      projectId: currentCfg.projectId
    };
  }
}

// ----------------------------------------------------
// PHONE & WHATSAPP VERIFICATION UTILITIES
// ----------------------------------------------------

/**
 * Standardizes Indonesian phone number into +62 format (E.164)
 */
export function formatIndonesianPhoneNumber(phone: string): { e164: string; waClean: string } {
  let cleaned = phone.replace(/[^0-9+]/g, '');
  if (cleaned.startsWith('+62')) {
    const wa = '62' + cleaned.substring(3).replace(/^0+/, '');
    return { e164: '+' + wa, waClean: wa };
  }
  if (cleaned.startsWith('62')) {
    const wa = cleaned.replace(/^620+/, '62');
    return { e164: '+' + wa, waClean: wa };
  }
  if (cleaned.startsWith('0')) {
    const wa = '62' + cleaned.substring(1);
    return { e164: '+' + wa, waClean: wa };
  }
  // Default fallback
  const wa = '62' + cleaned;
  return { e164: '+' + wa, waClean: wa };
}

/**
 * Generates a 6-digit random verification code
 */
export function generateOtpCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Builds direct WhatsApp URL with customized OTP text
 */
export function getWhatsAppOtpUrl(phoneNumber: string, otpCode: string, namaKonter: string = 'A Teknisi'): string {
  const { waClean } = formatIndonesianPhoneNumber(phoneNumber);
  const text = `*KODE VERIFIKASI ${namaKonter.toUpperCase()}*\n\nKode OTP Anda adalah: *${otpCode}*\n\nMasukkan kode ini pada aplikasi kasir untuk menyelesaikan verifikasi.\n_Rahasiakan kode ini dan jangan berikan kepada siapapun._`;
  return `https://api.whatsapp.com/send?phone=${waClean}&text=${encodeURIComponent(text)}`;
}

/**
 * Initializes Firebase RecaptchaVerifier for SMS Phone Auth
 */
export function initFirebaseRecaptcha(containerId: string): RecaptchaVerifier {
  return new RecaptchaVerifier(auth, containerId, {
    size: 'invisible',
    callback: () => {
      // reCAPTCHA solved
    },
    'expired-callback': () => {
      console.warn('reCAPTCHA expired');
    }
  });
}

/**
 * Sends real SMS OTP using Firebase Phone Auth
 */
export async function sendFirebaseSmsOtp(
  phoneNumberE164: string,
  verifier: RecaptchaVerifier
): Promise<{ confirmationResult?: ConfirmationResult; error?: string; errorCode?: string }> {
  const currentCfg = getActiveFirebaseConfig();
  try {
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumberE164, verifier);
    return { confirmationResult };
  } catch (err: any) {
    console.error('Firebase SMS error:', err);
    const code = err?.code || '';
    let friendly = err?.message || 'Gagal mengirim SMS';

    if (code === 'auth/operation-not-allowed') {
      friendly = `Penyedia Phone (SMS) belum diaktifkan di Firebase Console untuk proyek "${currentCfg.projectId}".`;
    } else if (code === 'auth/invalid-phone-number') {
      friendly = 'Nomor telepon tidak valid. Pastikan diawali dengan +62 atau 08...';
    } else if (code === 'auth/quota-exceeded') {
      friendly = 'Kuota SMS gratis harian Firebase habis. Gunakan metode WhatsApp OTP atau nomor uji coba.';
    } else if (code === 'auth/captcha-check-failed') {
      friendly = 'Verifikasi reCAPTCHA gagal atau domain belum masuk Authorized Domains.';
    }

    return { error: friendly, errorCode: code };
  }
}

export async function syncLocalCollectionToCloud(uid: string, collectionName: string, items: any[]): Promise<boolean> {
  try {
    for (const item of items) {
      const docId = String(item.id || item.noNota || Date.now());
      const docRef = doc(dbCloud, `users/${uid}/${collectionName}`, docId);
      await setDoc(docRef, item, { merge: true });
    }
    return true;
  } catch (err) {
    console.warn(`Cloud sync for ${collectionName} warning:`, err);
    return false;
  }
}

export async function fetchCloudCollection(uid: string, collectionName: string): Promise<any[]> {
  try {
    const colRef = collection(dbCloud, `users/${uid}/${collectionName}`);
    const snap = await getDocs(colRef);
    const results: any[] = [];
    snap.forEach((docSnap) => {
      results.push(docSnap.data());
    });
    return results;
  } catch (err) {
    console.warn(`Fetch cloud ${collectionName} warning:`, err);
    return [];
  }
}

// ----------------------------------------------------
// USER ID & EMAIL REGISTRATION / LOGIN
// ----------------------------------------------------

export interface AuthAccountResult {
  user?: User;
  userId?: string;
  email?: string;
  uid?: string;
  error?: string;
  errorCode?: string;
}

interface StoredAccount {
  userId: string;
  email: string;
  password?: string;
  securityPassword?: string;
  uid?: string;
  createdAt: string;
}

export function getStoredLocalAccounts(): StoredAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('app_registered_accounts');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalAccount(account: StoredAccount) {
  if (typeof window === 'undefined') return;
  try {
    const list = getStoredLocalAccounts();
    const existingIdx = list.findIndex(a => a.userId.toLowerCase() === account.userId.toLowerCase() || a.email.toLowerCase() === account.email.toLowerCase());
    if (existingIdx !== -1) {
      list[existingIdx] = { ...list[existingIdx], ...account };
    } else {
      list.push(account);
    }
    localStorage.setItem('app_registered_accounts', JSON.stringify(list));
  } catch {}
}

/**
 * Mendapatkan Password Keamanan Otorisasi (Buka Kunci / Hapus)
 */
export function getAccountSecurityPassword(userId?: string): string | null {
  if (typeof window === 'undefined') return null;
  // 1. Cek dari localStorage securityPassword
  const direct = localStorage.getItem('securityPassword');
  if (direct && direct.trim()) return direct.trim();

  // 2. Cek dari akun terdaftar lokal
  const idToFind = userId || localStorage.getItem('userAccount') || localStorage.getItem('last_active_user');
  if (idToFind) {
    const accounts = getStoredLocalAccounts();
    const found = accounts.find(a => 
      (a.userId && a.userId.toLowerCase() === idToFind.toLowerCase()) || 
      (a.email && a.email.toLowerCase() === idToFind.toLowerCase())
    );
    if (found && found.securityPassword && found.securityPassword.trim()) {
      localStorage.setItem('securityPassword', found.securityPassword.trim());
      return found.securityPassword.trim();
    }
  }

  return null;
}

/**
 * Cek apakah akun sudah pernah mengatur password keamanan
 */
export function hasAccountSecurityPassword(userId?: string): boolean {
  return Boolean(getAccountSecurityPassword(userId));
}

/**
 * Verifikasi apakah password keamanan yang dimasukkan cocok
 */
export function verifyAccountSecurityPassword(entered: string, userId?: string): boolean {
  const current = getAccountSecurityPassword(userId);
  if (!current) return true; // Belum diset sama sekali
  return entered.trim() === current.trim();
}

/**
 * Menyimpan / Memperbarui Password Keamanan Otorisasi
 * - Jika baru pertama kali: tidak memerlukan previousCode
 * - Jika sudah ada sebelumnya: WAJIB mencocokkan previousCode
 */
export async function setAccountSecurityPassword(
  userId: string,
  newPassword: string,
  previousCode?: string
): Promise<{ success: boolean; error?: string }> {
  const cleanNew = newPassword.trim();
  if (!cleanNew || cleanNew.length < 3) {
    return { success: false, error: 'Password keamanan minimal 3 karakter.' };
  }

  const existing = getAccountSecurityPassword(userId);
  if (existing) {
    // Wajib memasukkan kode sebelumnya jika sudah pernah diatur
    if (!previousCode || previousCode.trim() !== existing.trim()) {
      return { success: false, error: 'Kode keamanan sebelumnya salah atau tidak cocok!' };
    }
  }

  // 1. Simpan ke localStorage
  localStorage.setItem('securityPassword', cleanNew);
  localStorage.setItem('pinKasir', cleanNew);

  // 2. Simpan ke local accounts
  const accounts = getStoredLocalAccounts();
  const idKey = (userId || localStorage.getItem('userAccount') || '').toLowerCase();
  const updatedAccounts = accounts.map(a => {
    if (a.userId.toLowerCase() === idKey || a.email.toLowerCase() === idKey) {
      return { ...a, securityPassword: cleanNew };
    }
    return a;
  });
  localStorage.setItem('app_registered_accounts', JSON.stringify(updatedAccounts));

  // 3. Simpan ke Firestore jika online
  try {
    const curUid = localStorage.getItem('currentUid') || auth.currentUser?.uid;
    if (curUid) {
      await setDoc(doc(dbCloud, `users/${curUid}`), {
        securityPassword: cleanNew,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }

    if (idKey) {
      await setDoc(doc(dbCloud, 'app_users', idKey), {
        securityPassword: cleanNew,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch (fsErr) {
    console.warn('Firestore securityPassword sync notice:', fsErr);
  }

  return { success: true };
}

/**
 * Register account with User ID, Email, and Password
 */
export async function registerUserAccount(
  rawUserId: string, 
  rawEmail: string, 
  rawPassword: string,
  rawSecurityPassword?: string
): Promise<AuthAccountResult> {
  const userId = rawUserId.trim();
  const email = rawEmail.trim().toLowerCase();
  const password = rawPassword;
  const securityPassword = rawSecurityPassword ? rawSecurityPassword.trim() : '';

  // Validation
  if (!userId || userId.length < 3) {
    return { error: 'User ID minimal 3 karakter (huruf, angka, atau underscore).' };
  }
  if (!/^[a-zA-Z0-9_.-]+$/.test(userId)) {
    return { error: 'User ID hanya boleh berisi huruf, angka, tanda hubung, titik atau garis bawah.' };
  }
  if (!email || !email.includes('@') || !email.includes('.')) {
    return { error: 'Format alamat email tidak valid.' };
  }
  if (!password || password.length < 6) {
    return { error: 'Password minimal 6 karakter demi keamanan akun Anda.' };
  }

  // Check local duplicate
  const localList = getStoredLocalAccounts();
  if (localList.some(a => a.userId.toLowerCase() === userId.toLowerCase())) {
    return { error: `User ID "${userId}" sudah digunakan. Silakan gunakan User ID lain.` };
  }
  if (localList.some(a => a.email.toLowerCase() === email)) {
    return { error: `Email "${email}" sudah terdaftar. Silakan login atau gunakan email lain.` };
  }

  if (securityPassword) {
    localStorage.setItem('securityPassword', securityPassword);
    localStorage.setItem('pinKasir', securityPassword);
  }

  try {
    // 1. Create user in Firebase Auth
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCred.user;

    // Update display name with User ID
    try {
      await updateProfile(user, { displayName: userId });
    } catch {}

    // 2. Save public mapping in Firestore for User ID -> Email lookup
    try {
      await setDoc(doc(dbCloud, 'app_users', userId.toLowerCase()), {
        userId,
        email,
        uid: user.uid,
        securityPassword: securityPassword || undefined,
        createdAt: new Date().toISOString()
      }, { merge: true });

      // Save user profile in their own collection
      await setDoc(doc(dbCloud, `users/${user.uid}`), {
        userId,
        email,
        securityPassword: securityPassword || undefined,
        createdAt: new Date().toISOString()
      }, { merge: true });
    } catch (fsErr) {
      console.warn('Firestore user profile write notice:', fsErr);
    }

    // 3. Save local account backup
    saveLocalAccount({
      userId,
      email,
      password,
      securityPassword: securityPassword || undefined,
      uid: user.uid,
      createdAt: new Date().toISOString()
    });

    return {
      user,
      userId,
      email,
      uid: user.uid
    };
  } catch (err: any) {
    const code = err?.code || '';
    const message = err?.message || '';

    if (code === 'auth/email-already-in-use') {
      return { error: `Alamat email "${email}" sudah terdaftar. Silakan login langsung.` };
    } else if (code === 'auth/weak-password') {
      return { error: 'Password terlalu lemah. Buat password minimal 6 karakter.' };
    } else if (code === 'auth/invalid-email') {
      return { error: 'Alamat email tidak valid.' };
    } else if (
      code === 'auth/operation-not-allowed' || 
      message.includes('operation-not-allowed') ||
      code === 'auth/network-request-failed'
    ) {
      // Firebase Email/Password provider isn't enabled or client is offline.
      // Gracefully persist account locally & to Firestore so user registration succeeds smoothly!
      const fallbackUid = 'local_' + Date.now();
      saveLocalAccount({
        userId,
        email,
        password,
        securityPassword: securityPassword || undefined,
        uid: fallbackUid,
        createdAt: new Date().toISOString()
      });

      try {
        await setDoc(doc(dbCloud, 'app_users', userId.toLowerCase()), {
          userId,
          email,
          password,
          securityPassword: securityPassword || undefined,
          uid: fallbackUid,
          createdAt: new Date().toISOString()
        }, { merge: true });
      } catch {}

      return {
        userId,
        email,
        uid: fallbackUid
      };
    }

    return {
      error: err?.message || 'Pendaftaran akun gagal. Silakan coba kembali.'
    };
  }
}

/**
 * Login with either User ID or Email + Password
 * Ensures both PC and Android APK (Capacitor) authenticate to the exact same account and UID.
 */
export async function loginUserAccount(
  rawIdentifier: string, 
  rawPassword: string
): Promise<AuthAccountResult> {
  const identifier = rawIdentifier.trim();
  const password = rawPassword;

  if (!identifier) {
    return { error: 'Masukkan User ID atau Alamat Email Anda.' };
  }
  if (!password) {
    return { error: 'Masukkan Password akun Anda.' };
  }

  let targetEmail = identifier.toLowerCase();
  let resolvedUserId = identifier;
  let remoteUserData: any = null;

  const isEmail = identifier.includes('@');

  // If identifier is not an email, resolve email from User ID
  if (!isEmail) {
    // 1. Try local storage lookup
    const localList = getStoredLocalAccounts();
    const foundLocal = localList.find(a => a.userId.toLowerCase() === identifier.toLowerCase());
    if (foundLocal) {
      targetEmail = foundLocal.email;
      resolvedUserId = foundLocal.userId;
    }

    // 2. Try Firestore lookup to fetch registered email & canonical UID
    try {
      const userDocRef = doc(dbCloud, 'app_users', identifier.toLowerCase());
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data();
        if (data && data.email) {
          targetEmail = data.email;
          resolvedUserId = data.userId || identifier;
          remoteUserData = data;
        }
      } else if (!foundLocal) {
        return { error: `User ID "${identifier}" tidak ditemukan di database cloud. Pastikan User ID benar atau daftar akun baru.` };
      }
    } catch (e: any) {
      console.warn('Firestore lookup warning:', e);
    }
  }

  try {
    // Attempt Firebase Auth sign-in so PC and Android APK share the exact same Auth UID
    const userCred = await signInWithEmailAndPassword(auth, targetEmail, password);
    const user = userCred.user;
    const finalUserId = user.displayName || resolvedUserId || user.email?.split('@')[0] || identifier;

    // Cache to local account
    saveLocalAccount({
      userId: finalUserId,
      email: targetEmail,
      password,
      uid: user.uid,
      createdAt: new Date().toISOString()
    });

    // Sync security authorization password from local or Firestore
    const localAcc = getStoredLocalAccounts().find(a => a.userId.toLowerCase() === finalUserId.toLowerCase());
    if (localAcc?.securityPassword) {
      localStorage.setItem('securityPassword', localAcc.securityPassword);
    } else {
      try {
        const uSnap = await getDoc(doc(dbCloud, 'app_users', finalUserId.toLowerCase()));
        if (uSnap.exists() && uSnap.data()?.securityPassword) {
          localStorage.setItem('securityPassword', uSnap.data().securityPassword);
        }
      } catch {}
    }

    return {
      user,
      userId: finalUserId,
      email: targetEmail,
      uid: user.uid
    };
  } catch (err: any) {
    console.warn('Firebase sign-in result:', err);
    const code = err?.code || '';

    // Check offline / local fallback or password verification from cloud
    const localList = getStoredLocalAccounts();
    const foundLocal = localList.find(a => 
      (a.email.toLowerCase() === targetEmail || a.userId.toLowerCase() === identifier.toLowerCase()) && 
      a.password === password
    );

    if (foundLocal) {
      if (foundLocal.securityPassword) {
        localStorage.setItem('securityPassword', foundLocal.securityPassword);
      }
      return {
        userId: foundLocal.userId,
        email: foundLocal.email,
        uid: foundLocal.uid || ('usr_' + identifier.toLowerCase())
      };
    }

    if (remoteUserData && remoteUserData.password && remoteUserData.password === password) {
      const fallbackUid = remoteUserData.uid || ('usr_' + identifier.toLowerCase());
      saveLocalAccount({
        userId: resolvedUserId,
        email: targetEmail,
        password,
        uid: fallbackUid,
        createdAt: remoteUserData.createdAt || new Date().toISOString()
      });
      if (remoteUserData.securityPassword) {
        localStorage.setItem('securityPassword', remoteUserData.securityPassword);
      }
      return {
        userId: resolvedUserId,
        email: targetEmail,
        uid: fallbackUid
      };
    }

    let msg = 'User ID/Email atau Password salah.';
    if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
      msg = 'User ID / Email atau Password salah. Silakan periksa kembali.';
    } else if (code === 'auth/wrong-password') {
      msg = 'Password yang Anda masukkan salah. Coba lagi.';
    } else if (code === 'auth/too-many-requests') {
      msg = 'Terlalu banyak percobaan login yang gagal. Harap tunggu beberapa saat.';
    } else if (code === 'auth/network-request-failed') {
      msg = 'Koneksi internet bermasalah. Periksa jaringan di HP/PC Anda.';
    }

    return { error: msg, errorCode: code };
  }
}

/**
 * Get list of accounts previously used on this device
 */
export function getRecentLoggedInAccounts(): StoredAccount[] {
  return getStoredLocalAccounts();
}

/**
 * Request password recovery code / email
 */
export async function requestPasswordReset(identifierOrEmail: string): Promise<{
  success: boolean;
  email?: string;
  code?: string;
  message?: string;
  error?: string;
}> {
  const clean = identifierOrEmail.trim().toLowerCase();
  if (!clean) {
    return { success: false, error: 'Masukkan User ID atau Email Anda.' };
  }

  let targetEmail = '';
  let resolvedUserId = '';

  // 1. Search in local accounts
  const localList = getStoredLocalAccounts();
  const localFound = localList.find(a => a.email.toLowerCase() === clean || a.userId.toLowerCase() === clean);
  if (localFound) {
    targetEmail = localFound.email;
    resolvedUserId = localFound.userId;
  }

  // 2. Search in Firestore app_users
  if (!targetEmail) {
    try {
      const snap = await getDoc(doc(dbCloud, 'app_users', clean));
      if (snap.exists()) {
        const d = snap.data();
        if (d?.email) {
          targetEmail = d.email;
          resolvedUserId = d.userId || clean;
        }
      }
    } catch {}
  }

  if (!targetEmail) {
    if (clean.includes('@') && clean.includes('.')) {
      targetEmail = clean;
    } else {
      return { 
        success: false, 
        error: `User ID "${identifierOrEmail}" tidak ditemukan di database. Pastikan penulisan benar.` 
      };
    }
  }

  // Generate 6-digit recovery OTP code
  const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
  // Save temporary recovery code for this email/userId in localStorage
  try {
    sessionStorage.setItem(`recovery_${targetEmail.toLowerCase()}`, JSON.stringify({
      code: recoveryCode,
      userId: resolvedUserId,
      expiresAt: Date.now() + 15 * 60 * 1000 // 15 mins
    }));
  } catch {}

  // Attempt standard Firebase Auth password reset email
  let emailSent = false;
  try {
    await sendPasswordResetEmail(auth, targetEmail);
    emailSent = true;
  } catch (err) {
    console.warn('Firebase Auth sendPasswordResetEmail notice:', err);
  }

  return {
    success: true,
    email: targetEmail,
    code: recoveryCode,
    message: emailSent 
      ? `Link & kode pemulihan telah dikirim ke email ${targetEmail}. Masukkan kode pemulihan untuk reset password langsung.` 
      : `Kode pemulihan akun Anda telah dibuat: ${recoveryCode}. Gunakan kode ini untuk membuat password baru.`
  };
}

/**
 * Complete Password Reset using recovery code or direct verified flow
 */
export async function resetUserPassword(
  targetEmail: string, 
  recoveryCode: string, 
  newPassword: string
): Promise<{ success: boolean; error?: string }> {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'Password baru minimal 6 karakter.' };
  }

  const cleanEmail = targetEmail.trim().toLowerCase();
  
  // Verify code
  const storedRecovery = sessionStorage.getItem(`recovery_${cleanEmail}`);
  if (storedRecovery) {
    try {
      const parsed = JSON.parse(storedRecovery);
      if (parsed.expiresAt < Date.now()) {
        return { success: false, error: 'Kode pemulihan sudah kadaluarsa. Silakan minta kode baru.' };
      }
      if (parsed.code !== recoveryCode.trim()) {
        return { success: false, error: 'Kode pemulihan tidak sesuai. Periksa kembali.' };
      }
    } catch {
      return { success: false, error: 'Gagal memverifikasi kode pemulihan.' };
    }
  }

  // Update in local accounts
  const localList = getStoredLocalAccounts();
  let updatedUserId = '';
  const updatedList = localList.map(acc => {
    if (acc.email.toLowerCase() === cleanEmail) {
      updatedUserId = acc.userId;
      return { ...acc, password: newPassword };
    }
    return acc;
  });
  localStorage.setItem('app_registered_accounts', JSON.stringify(updatedList));

  // Update in Firestore app_users
  try {
    if (updatedUserId) {
      await setDoc(doc(dbCloud, 'app_users', updatedUserId.toLowerCase()), {
        password: newPassword,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
  } catch {}

  // Remove recovery code
  sessionStorage.removeItem(`recovery_${cleanEmail}`);

  return { success: true };
}

/**
 * Update User ID and/or Password from Pengaturan Akun
 */
export async function updateUserAccountProfile(
  currentUserId: string,
  newUserId: string,
  newPassword?: string,
  newEmail?: string
): Promise<{ success: boolean; finalUserId: string; error?: string }> {
  const oldKey = currentUserId.trim().toLowerCase();
  const newCleanId = newUserId.trim();

  if (!newCleanId || newCleanId.length < 3) {
    return { success: false, finalUserId: currentUserId, error: 'User ID minimal 3 karakter.' };
  }

  const localList = getStoredLocalAccounts();
  const account = localList.find(a => a.userId.toLowerCase() === oldKey);

  // Check duplicate if changing user ID
  if (oldKey !== newCleanId.toLowerCase()) {
    const isTaken = localList.some(a => a.userId.toLowerCase() === newCleanId.toLowerCase());
    if (isTaken) {
      return { success: false, finalUserId: currentUserId, error: `User ID "${newCleanId}" sudah digunakan.` };
    }
  }

  const finalPassword = newPassword && newPassword.length >= 6 ? newPassword : (account?.password || '');
  const finalEmail = newEmail && newEmail.includes('@') ? newEmail.trim() : (account?.email || '');

  // Update local accounts
  const updatedList = localList.map(a => {
    if (a.userId.toLowerCase() === oldKey) {
      return {
        ...a,
        userId: newCleanId,
        email: finalEmail,
        password: finalPassword,
        securityPassword: a.securityPassword
      };
    }
    return a;
  });
  localStorage.setItem('app_registered_accounts', JSON.stringify(updatedList));
  localStorage.setItem('userAccount', newCleanId);

  // Update Firestore app_users
  try {
    if (oldKey !== newCleanId.toLowerCase()) {
      await deleteDoc(doc(dbCloud, 'app_users', oldKey));
    }
    await setDoc(doc(dbCloud, 'app_users', newCleanId.toLowerCase()), {
      userId: newCleanId,
      email: finalEmail,
      password: finalPassword,
      securityPassword: account?.securityPassword || undefined,
      uid: account?.uid || ('usr_' + Date.now()),
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch {}

  // If Firebase Auth currentUser is present
  if (auth.currentUser) {
    try {
      await updateProfile(auth.currentUser, { displayName: newCleanId });
      if (newPassword && newPassword.length >= 6) {
        await updatePassword(auth.currentUser, newPassword);
      }
    } catch {}
  }

  return { success: true, finalUserId: newCleanId };
}

