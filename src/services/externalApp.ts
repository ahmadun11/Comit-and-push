/**
 * Safe External App & Deep Link Handler
 * Optimized for Android Native WebView (WebIntoApp), Capacitor, and Standard Web Browsers.
 */

export interface OpenAppResult {
  success: boolean;
  methodUsed: 'deeplink' | 'web' | 'capacitor';
  error?: string;
}

/**
 * Detects running environment
 */
export function getRuntimeEnvironment(): 'android-webview' | 'capacitor' | 'standard-browser' {
  if (typeof window === 'undefined') return 'standard-browser';

  // Capacitor detection
  if ((window as any).Capacitor !== undefined) {
    return 'capacitor';
  }

  // Android WebView detection (WebIntoApp injects Android userAgent or WebView flags)
  const ua = navigator.userAgent || '';
  const isAndroid = /Android/i.test(ua);
  const isWebView = /wv|Version\/[0-9.]+/i.test(ua) || (window as any).Android !== undefined;

  if (isAndroid && isWebView) {
    return 'android-webview';
  }

  return 'standard-browser';
}

/**
 * Normalizes Indonesian Phone Number to international format (628...)
 */
export function normalizeIndonesianPhone(phone: string): string {
  if (!phone) return '';
  let clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.substring(1);
  } else if (!clean.startsWith('62') && clean.length >= 9) {
    clean = '62' + clean;
  }
  return clean;
}

/**
 * Opens WhatsApp with automatic Deep-Link and Fallback
 * Supported schemes:
 * 1. whatsapp://send?phone=...&text=... (Native App Intent)
 * 2. https://api.whatsapp.com/send?phone=...&text=... (Universal Web Link)
 */
export function openWhatsApp(phone: string, text: string): OpenAppResult {
  const cleanPhone = normalizeIndonesianPhone(phone);
  const encodedText = encodeURIComponent(text);
  const env = getRuntimeEnvironment();

  const deepLink = cleanPhone 
    ? `whatsapp://send?phone=${cleanPhone}&text=${encodedText}` 
    : `whatsapp://send?text=${encodedText}`;
    
  const webLink = cleanPhone 
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}` 
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  // 1. Capacitor Native Environment
  if (env === 'capacitor') {
    try {
      if ((window as any).Capacitor?.Plugins?.Browser?.open) {
        (window as any).Capacitor.Plugins.Browser.open({ url: webLink });
        return { success: true, methodUsed: 'capacitor' };
      }
      if ((window as any).Capacitor?.Plugins?.App?.openUrl) {
        (window as any).Capacitor.Plugins.App.openUrl({ url: deepLink });
        return { success: true, methodUsed: 'capacitor' };
      }
    } catch (e) {
      console.warn('Capacitor native open error, falling back:', e);
    }
  }

  // 2. Android WebView (WebIntoApp)
  // In WebIntoApp/WebView, setting window.location to a deep link or window.open requires safe execution
  if (env === 'android-webview') {
    try {
      // Attempt deep link navigation
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = deepLink;
      document.body.appendChild(iframe);

      setTimeout(() => {
        try {
          document.body.removeChild(iframe);
        } catch {}
      }, 1000);

      // Also provide universal web fallback window.open for safety
      setTimeout(() => {
        try {
          window.open(webLink, '_blank');
        } catch {
          window.location.href = webLink;
        }
      }, 500);

      return { success: true, methodUsed: 'deeplink' };
    } catch (err: any) {
      console.warn('Android webview deep link notice:', err);
      try {
        window.location.href = webLink;
        return { success: true, methodUsed: 'web' };
      } catch (err2: any) {
        return { success: false, methodUsed: 'web', error: err2?.message };
      }
    }
  }

  // 3. Standard Browser (PC, Chrome, Safari, etc.)
  try {
    const win = window.open(webLink, '_blank');
    if (!win) {
      window.location.href = webLink;
    }
    return { success: true, methodUsed: 'web' };
  } catch (err: any) {
    window.location.href = webLink;
    return { success: true, methodUsed: 'web', error: err?.message };
  }
}

/**
 * Universal external application URL launcher
 */
export function openExternalApp(url: string): void {
  try {
    const env = getRuntimeEnvironment();
    if (env === 'capacitor' && (window as any).Capacitor?.Plugins?.Browser) {
      (window as any).Capacitor.Plugins.Browser.open({ url });
      return;
    }
    const win = window.open(url, '_blank');
    if (!win) {
      window.location.href = url;
    }
  } catch {
    window.location.href = url;
  }
}
