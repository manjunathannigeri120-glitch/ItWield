/**
 * Device fingerprint / identifier helper to enforce one-device credit allowances
 */
export function getDeviceId(): string {
  try {
    let id = localStorage.getItem('itwield_device_id');
    if (!id) {
      const match = document.cookie.match(/(?:^|; )itwield_device_id=([^;]*)/);
      if (match) id = decodeURIComponent(match[1]);
    }
    if (!id) {
      id = 'dev_' + Math.random().toString(36).substring(2, 12) + '_' + Date.now().toString(36);
      localStorage.setItem('itwield_device_id', id);
      document.cookie = `itwield_device_id=${encodeURIComponent(id)}; max-age=315360000; path=/; SameSite=Lax`;
    }
    return id;
  } catch (e) {
    return 'unknown_device';
  }
}
