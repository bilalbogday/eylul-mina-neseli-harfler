import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAW7Lo_ZnFZn1EgF0oNSHvhFyswVktg3WI',
  authDomain: 'eylul-mina-okuma-macerasi.firebaseapp.com',
  projectId: 'eylul-mina-okuma-macerasi',
  storageBucket: 'eylul-mina-okuma-macerasi.firebasestorage.app',
  messagingSenderId: '478381811109',
  appId: '1:478381811109:web:6927a8a2d3912b3afef44c',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)

const DEVICE_ID_KEY = 'neseli_harfler_device_id'

export function getOrCreateDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY)
    if (!id || !isValidBackupCode(id)) {
      id = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36)
      localStorage.setItem(DEVICE_ID_KEY, id)
    }
    return id
  } catch {
    return 'dev_local_fallback'
  }
}

export function isValidBackupCode(code: string): boolean {
  const trimmed = code.trim()
  return /^dev_[a-z0-9]{4,20}_[a-z0-9]{4,20}$/i.test(trimmed)
}

export function maskBackupCode(code: string): string {
  if (!code || code.length < 10) return 'dev_••••_••••'
  return `${code.slice(0, 6)}••••${code.slice(-4)}`
}

export async function saveCloudBackup(data: Record<string, unknown>): Promise<boolean> {
  try {
    const deviceId = getOrCreateDeviceId()
    if (!isValidBackupCode(deviceId)) return false
    await setDoc(
      doc(db, 'neseli_harfler_profiles', deviceId),
      {
        ...data,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    )
    return true
  } catch (err) {
    console.warn('Bulut yedekleme sırasında çevrimdışı mod kullanıldı:', err)
    return false
  }
}

export async function loadCloudBackup(
  customDeviceId?: string
): Promise<Record<string, unknown> | null> {
  try {
    const deviceId = (customDeviceId || getOrCreateDeviceId()).trim()
    if (!isValidBackupCode(deviceId)) {
      return null
    }
    const snap = await getDoc(doc(db, 'neseli_harfler_profiles', deviceId))
    if (snap.exists()) {
      const raw = snap.data() as Record<string, unknown>
      if (raw && Array.isArray(raw.profiles) && raw.profiles.length > 0) {
        if (customDeviceId) {
          localStorage.setItem(DEVICE_ID_KEY, deviceId)
        }
        return raw
      }
    }
    return null
  } catch (err) {
    console.warn('Bulut yedeği okunamadı:', err)
    return null
  }
}

export async function saveGlobalAvatar(avatarUrlOrData: string): Promise<boolean> {
  // Güvenlik: Yalnızca bu cihazın kendi bulut profili içine kaydet, genel ortak kaydı ezme
  return saveCloudBackup({ primaryAvatar: avatarUrlOrData })
}

export async function loadGlobalAvatar(): Promise<string | null> {
  try {
    const data = await loadCloudBackup()
    if (data && typeof data.primaryAvatar === 'string' && data.primaryAvatar) {
      return data.primaryAvatar
    }
    return null
  } catch {
    return null
  }
}
