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
  let id = localStorage.getItem(DEVICE_ID_KEY)
  if (!id) {
    id = 'dev_' + Math.random().toString(36).substring(2, 10) + '_' + Date.now().toString(36)
    localStorage.setItem(DEVICE_ID_KEY, id)
  }
  return id
}

export async function saveCloudBackup(data: Record<string, unknown>): Promise<boolean> {
  try {
    const deviceId = getOrCreateDeviceId()
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

export async function loadCloudBackup(customDeviceId?: string): Promise<Record<string, unknown> | null> {
  try {
    const deviceId = (customDeviceId || getOrCreateDeviceId()).trim()
    const snap = await getDoc(doc(db, 'neseli_harfler_profiles', deviceId))
    if (snap.exists()) {
      if (customDeviceId) {
        localStorage.setItem(DEVICE_ID_KEY, deviceId)
      }
      return snap.data() as Record<string, unknown>
    }
    return null
  } catch (err) {
    console.warn('Bulut yedeği okunamadı:', err)
    return null
  }
}
