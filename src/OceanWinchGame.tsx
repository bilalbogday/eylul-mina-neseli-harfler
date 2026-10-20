import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Anchor,
  Ship,
  Coins,
  Bomb,
  Volume2,
  Star,
  Award,
  RotateCcw,
  ShoppingBag,
  Clock,
  Shield,
  HelpCircle,
} from 'lucide-react'
import type { LetterCurriculum } from './curriculum'
import { getLearnedDistractorLetters } from './curriculum'
import { playSoundEffect, speakTurkish } from './sound'

// ==========================================
// SES SENTEZLEYİCİSİ (WEB AUDIO API)
// ==========================================
class OceanAudioEngine {
  private ctx: AudioContext | null = null

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  // Zincir fırlatma sesi (Metalik ardışık tıkırtılar)
  playChainClank() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime
    for (let i = 0; i < 4; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(900 + Math.random() * 600, now + i * 0.04)
      gain.gain.setValueAtTime(0.08, now + i * 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.04 + 0.035)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + i * 0.04)
      osc.stop(now + i * 0.04 + 0.04)
    }
  }

  // Vinç motoru gerilim sesi (Düşük frekanslı titreşim)
  playWinchTick() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(140, now)
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.05)
    gain.gain.setValueAtTime(0.06, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.05)
  }

  // Altın şıngırtısı ("Cha-Ching!")
  playChaChing() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const notes = [1046, 1318, 1567, 2093] // C6, E6, G6, C7
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, now + idx * 0.06)
      gain.gain.setValueAtTime(0.12, now + idx * 0.06)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.25)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + idx * 0.06)
      osc.stop(now + idx * 0.06 + 0.26)
    })
  }

  // Gemi Sireni (Hazine yukarı ulaştığında)
  playShipHorn() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc1 = ctx.createOscillator()
    const osc2 = ctx.createOscillator()
    const gain = ctx.createGain()

    osc1.type = 'sawtooth'
    osc2.type = 'triangle'
    osc1.frequency.setValueAtTime(196, now) // G3
    osc2.frequency.setValueAtTime(247, now) // B3

    gain.gain.setValueAtTime(0.14, now)
    gain.gain.linearRampToValueAtTime(0.14, now + 0.3)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.7)

    osc1.connect(gain)
    osc2.connect(gain)
    gain.connect(ctx.destination)

    osc1.start(now)
    osc2.start(now)
    osc1.stop(now + 0.7)
    osc2.stop(now + 0.7)
  }

  // Dinamit Patlaması
  playDynamiteBang() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime
    // Gürültü tamponu oluştur (White noise)
    const bufferSize = ctx.sampleRate * 0.5
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const output = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1
    }
    const whiteNoise = ctx.createBufferSource()
    whiteNoise.buffer = buffer

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(450, now)
    filter.frequency.exponentialRampToValueAtTime(60, now + 0.45)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.25, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45)

    whiteNoise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    whiteNoise.start(now)
    whiteNoise.stop(now + 0.5)
  }

  // Sevimli Su Köpüğü Sesi
  playBubblePop() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(450, now)
    osc.frequency.exponentialRampToValueAtTime(950, now + 0.12)
    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.13)
  }
}

const oceanAudio = new OceanAudioEngine()

// ==========================================
// TİPLER VE VERİ YAPILARI
// ==========================================
export type OceanGameMode = 'eylul_mina' | 'captain_pro'

export interface UnderwaterItem {
  id: string
  type: 'pearl' | 'chest' | 'fish' | 'barrel' | 'rock' | 'mine'
  x: number
  y: number
  radius: number
  char?: string
  word?: string
  emoji?: string
  value: number
  weight: number // 1.0 = hafif/hızlı, 4.0 = çok ağır/yavaş
  isTargetLetter?: boolean
  vx?: number // Hareketli balıklar/köpekbalıkları için yatay hız
  caught?: boolean
  exploded?: boolean
  swayOffset?: number
}

interface WinchUpgrades {
  totalGold: number
  winchLevel: number // 1..3 (+35% hız her seviye)
  dynamiteCount: number // 0..5
  sonarLevel: number // 1..3 (lazer uzama + altın tarama)
  fuelLevel: number // 1..3 (+15s ekstra zaman)
}

const STORAGE_KEY = 'eylul_mina_winch_upgrades'

function loadSavedUpgrades(): WinchUpgrades {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      return {
        totalGold: parsed.totalGold ?? 50,
        winchLevel: parsed.winchLevel ?? 1,
        dynamiteCount: parsed.dynamiteCount ?? 2,
        sonarLevel: parsed.sonarLevel ?? 1,
        fuelLevel: parsed.fuelLevel ?? 1,
      }
    }
  } catch {
    // fallback
  }
  return {
    totalGold: 60,
    winchLevel: 1,
    dynamiteCount: 2,
    sonarLevel: 1,
    fuelLevel: 1,
  }
}

function saveUpgrades(u: WinchUpgrades) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(u))
  } catch {
    // ignore
  }
}

interface OceanWinchGameProps {
  letter: LetterCurriculum
  childName?: string
  completed?: boolean
  onComplete?: () => void
  onExit?: () => void
}

export function OceanWinchGame({
  letter,
  childName = 'Eylül Mina',
  completed = false,
  onComplete,
  onExit,
}: OceanWinchGameProps) {
  // Mod seçimi: 6 Yaş Çocuk Modu (Varsayılan) veya Kaptan Pro Modu
  const [gameMode, setGameMode] = useState<OceanGameMode>('eylul_mina')
  const [upgrades, setUpgrades] = useState<WinchUpgrades>(loadSavedUpgrades)
  const [isShopOpen, setIsShopOpen] = useState(false)

  // Oyun Durumu
  const [roundScore, setRoundScore] = useState(0)
  const [targetLettersCollected, setTargetLettersCollected] = useState(0)
  const [timeLeft, setTimeLeft] = useState(60)
  const [isGameOver, setIsGameOver] = useState(false)
  const [mascotBubble, setMascotBubble] = useState<string>(
    `Merhaba ${childName}! Kancayı salla ve "${letter.upper}" incilerini denizden topla!`
  )

  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  // Fizik ve Animasyon Durumları (Ref üzerinde 60FPS döngüsü)
  const stateRef = useRef({
    // Gemi ve Vinç
    shipX: 400,
    shipY: 105,
    cranePivotX: 400,
    cranePivotY: 110,
    wavePhase: 0,

    // Kanca Sarkaç Fiziği
    angle: 0,
    angleMax: 1.15, // ~66 derece
    angleSpeed: 2.1,
    hookState: 'SWINGING' as 'SWINGING' | 'SHOOTING' | 'REELING',
    hookX: 400,
    hookY: 110,
    hookLength: 26,
    shootSpeed: 640,
    currentSpeed: 640,
    caughtItem: null as UnderwaterItem | null,

    // Su Altı Objeleri
    items: [] as UnderwaterItem[],
    particles: [] as Array<{
      x: number
      y: number
      vx: number
      vy: number
      alpha: number
      color: string
      size: number
    }>,

    lastTime: performance.now(),
    lastMotorTick: 0,
  })

  // ==========================================
  // OYUN ALANI OBJELERİNİ OLUŞTURMA
  // ==========================================
  const initUnderwaterItems = useCallback(() => {
    const distractors = getLearnedDistractorLetters(letter).map((l) => l.upper)
    const fallbackDistractors = ['E', 'L', 'A', 'K', 'İ', 'N', 'O', 'M'].filter(
      (c) => c !== letter.upper
    )
    const pool = distractors.length > 0 ? distractors : fallbackDistractors

    const items: UnderwaterItem[] = []

    // 1. Hedef Harf İncileri (3 adet parlak altın inci)
    const pearlPositions = [
      { x: 160, y: 320 },
      { x: 410, y: 380 },
      { x: 650, y: 340 },
    ]
    pearlPositions.forEach((pos, idx) => {
      items.push({
        id: `target_pearl_${idx}`,
        type: 'pearl',
        x: pos.x + (Math.random() * 40 - 20),
        y: pos.y + (Math.random() * 30 - 15),
        radius: 25,
        char: idx % 2 === 0 ? letter.upper : letter.lower,
        value: 50,
        weight: 1.0,
        isTargetLetter: true,
      })
    })

    // 2. Büyük Hazine Sandığı (Kelime ve Maskot)
    items.push({
      id: 'mascot_chest',
      type: 'chest',
      x: 290,
      y: 470,
      radius: 34,
      word: letter.mascotWord,
      emoji: letter.mascotEmoji,
      value: 120,
      weight: 2.8,
      isTargetLetter: true,
    })

    // 3. Yüzen Harf Balıkları (Hareketli Hedefler)
    items.push({
      id: 'swim_fish_1',
      type: 'fish',
      x: 100,
      y: 240,
      radius: 22,
      char: letter.upper,
      value: 40,
      weight: 1.1,
      vx: 45,
      isTargetLetter: true,
    })

    items.push({
      id: 'swim_fish_2',
      type: 'fish',
      x: 700,
      y: 280,
      radius: 20,
      char: pool[0] || 'A',
      value: 25,
      weight: 1.1,
      vx: -40,
      isTargetLetter: false,
    })

    // 4. Sürpriz Fıçı
    items.push({
      id: 'surprise_barrel',
      type: 'barrel',
      x: 520,
      y: 450,
      radius: 26,
      value: 80,
      weight: 1.6,
      char: '?',
    })

    // 5. Ağır Taşlar (Dinamit için)
    items.push({
      id: 'heavy_rock_1',
      type: 'rock',
      x: 180,
      y: 480,
      radius: 28,
      value: 10,
      weight: 4.2,
    })
    items.push({
      id: 'heavy_rock_2',
      type: 'rock',
      x: 620,
      y: 490,
      radius: 26,
      value: 10,
      weight: 4.0,
    })

    // 6. Mayınlar (Eylül Mina Modunda sevimli köpük balonu, Kaptan Modunda patlayıcı mayın)
    items.push({
      id: 'sea_mine_1',
      type: 'mine',
      x: 350,
      y: 270,
      radius: 24,
      value: 0,
      weight: 1.5,
      swayOffset: 0,
    })
    items.push({
      id: 'sea_mine_2',
      type: 'mine',
      x: 480,
      y: 340,
      radius: 24,
      value: 0,
      weight: 1.5,
      swayOffset: Math.PI,
    })

    stateRef.current.items = items
  }, [letter])

  // İlk yükleme ve harf değişiminde oyunu sıfırla
  useEffect(() => {
    initUnderwaterItems()
    setRoundScore(0)
    setTargetLettersCollected(0)
    setTimeLeft(gameMode === 'captain_pro' ? 60 + (upgrades.fuelLevel - 1) * 15 : 999)
    setIsGameOver(false)
    stateRef.current.hookState = 'SWINGING'
    stateRef.current.caughtItem = null
    stateRef.current.hookLength = 26
  }, [letter, gameMode, initUnderwaterItems, upgrades.fuelLevel])

  // Kaptan Modu Geri Sayım Zamanlayıcısı
  useEffect(() => {
    if (gameMode !== 'captain_pro' || isGameOver) return
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          setIsGameOver(true)
          playSoundEffect('bloop')
          setMascotBubble(`Fırtına yaklaştı Kaptan! Toplam Altın: ${roundScore}`)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [gameMode, isGameOver, roundScore])

  // ==========================================
  // KANCAYI FIRLAT (ATEŞLEME) MEKANİZMASI
  // ==========================================
  const shootHook = useCallback(() => {
    const s = stateRef.current
    if (s.hookState !== 'SWINGING' || isGameOver) return

    s.hookState = 'SHOOTING'
    s.currentSpeed = s.shootSpeed
    oceanAudio.playChainClank()
    playSoundEffect('pop')
  }, [isGameOver])

  // ==========================================
  // DİNAMİT PATLATMA (AĞIR TAŞI İMHA ETME)
  // ==========================================
  const triggerDynamite = useCallback(() => {
    const s = stateRef.current
    if (s.hookState !== 'REELING' || !s.caughtItem) return
    if (upgrades.dynamiteCount <= 0) {
      playSoundEffect('bloop')
      setMascotBubble('Tersaneden daha fazla dinamit almalısın!')
      return
    }

    // Dinamiti harca
    const nextDynamites = upgrades.dynamiteCount - 1
    const nextUpgrades = { ...upgrades, dynamiteCount: nextDynamites }
    setUpgrades(nextUpgrades)
    saveUpgrades(nextUpgrades)

    // Patlama efekti ve sesi
    oceanAudio.playDynamiteBang()
    const item = s.caughtItem

    // Parçacıklar oluştur
    for (let i = 0; i < 28; i++) {
      s.particles.push({
        x: item.x,
        y: item.y,
        vx: (Math.random() - 0.5) * 350,
        vy: (Math.random() - 0.5) * 350,
        alpha: 1,
        color: ['#f97316', '#eab308', '#ef4444', '#ffffff'][Math.floor(Math.random() * 4)],
        size: Math.random() * 8 + 4,
      })
    }

    // Eşyayı yok et ve kancayı hemen geri çek
    s.caughtItem = null
    s.currentSpeed = s.shootSpeed * (1 + 0.35 * (upgrades.winchLevel - 1))
    setMascotBubble('Güm! Dinamitle kanca kurtarıldı!')
  }, [upgrades])

  // ==========================================
  // 60 FPS CANVAS ÇİZİM VE FİZİK DÖNGÜSÜ
  // ==========================================
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const s = stateRef.current

    const render = (now: number) => {
      const dt = Math.min((now - s.lastTime) / 1000, 0.05)
      s.lastTime = now

      // 1. Dalga ve Gemi Hareketi
      s.wavePhase += dt * 1.8
      const waveY = Math.sin(s.wavePhase) * 6
      const waveSlope = Math.cos(s.wavePhase) * 0.07 // Gemi eğim açısı
      s.shipY = 105 + waveY
      s.cranePivotX = s.shipX + 42
      s.cranePivotY = s.shipY - 10

      // 2. Kanca Fiziği
      if (s.hookState === 'SWINGING') {
        s.angle = Math.sin(now * 0.001 * s.angleSpeed) * s.angleMax
        s.hookX = s.cranePivotX + Math.sin(s.angle) * s.hookLength
        s.hookY = s.cranePivotY + Math.cos(s.angle) * s.hookLength
      } else if (s.hookState === 'SHOOTING') {
        s.hookLength += s.currentSpeed * dt
        s.hookX = s.cranePivotX + Math.sin(s.angle) * s.hookLength
        s.hookY = s.cranePivotY + Math.cos(s.angle) * s.hookLength

        // Ekran sınırları kontrolü (Deniz dibi veya yan duvarlar)
        if (s.hookY > 530 || s.hookX < 30 || s.hookX > 770) {
          s.hookState = 'REELING'
          s.currentSpeed = s.shootSpeed * 0.85
        }

        // Çarpışma Kontrolü (Collision Detection)
        for (const item of s.items) {
          if (item.caught || item.exploded) continue
          const dist = Math.hypot(s.hookX - item.x, s.hookY - item.y)
          if (dist < item.radius + 14) {
            // Mayın Kontrolü
            if (item.type === 'mine') {
              if (gameMode === 'eylul_mina') {
                // Çocuk modunda sevimli köpük patlaması, kanca geri döner
                oceanAudio.playBubblePop()
                setMascotBubble('Puf! Sevimli su balonu patladı! 🫧')
                item.exploded = true
                for (let i = 0; i < 18; i++) {
                  s.particles.push({
                    x: item.x,
                    y: item.y,
                    vx: (Math.random() - 0.5) * 160,
                    vy: (Math.random() - 0.5) * 160,
                    alpha: 1,
                    color: '#67e8f9',
                    size: Math.random() * 6 + 3,
                  })
                }
                s.hookState = 'REELING'
                s.currentSpeed = s.shootSpeed
                break
              } else {
                // Kaptan modunda gerçek patlama!
                oceanAudio.playDynamiteBang()
                item.exploded = true
                s.hookState = 'REELING'
                s.currentSpeed = s.shootSpeed * 0.5
                setRoundScore((prev) => Math.max(0, prev - 25))
                setMascotBubble('Dikkat Kaptan! Mayın patladı!')
                for (let i = 0; i < 30; i++) {
                  s.particles.push({
                    x: item.x,
                    y: item.y,
                    vx: (Math.random() - 0.5) * 350,
                    vy: (Math.random() - 0.5) * 350,
                    alpha: 1,
                    color: '#ef4444',
                    size: Math.random() * 8 + 4,
                  })
                }
                break
              }
            }

            // Normal obje yakalama
            item.caught = true
            s.caughtItem = item
            s.hookState = 'REELING'

            // Ağırlık ve Vinç Motor Hızı Hesaplama
            const winchBoost = 1 + 0.35 * (upgrades.winchLevel - 1)
            s.currentSpeed = (s.shootSpeed / item.weight) * winchBoost

            playSoundEffect('pop')
            if (item.isTargetLetter) {
              setMascotBubble(`Harika! "${item.char || letter.upper}" yakalandı, yukarı çekiliyor!`)
            } else if (item.type === 'rock') {
              setMascotBubble('Ağır bir taş yakalandı! Dinamitle patlatabilirsin!')
            }
            break
          }
        }
      } else if (s.hookState === 'REELING') {
        s.hookLength -= s.currentSpeed * dt
        s.hookX = s.cranePivotX + Math.sin(s.angle) * s.hookLength
        s.hookY = s.cranePivotY + Math.cos(s.angle) * s.hookLength

        // Vinç motor sesi ritmik olarak çalsın
        if (now - s.lastMotorTick > 140) {
          s.lastMotorTick = now
          oceanAudio.playWinchTick()
        }

        // Yakalanan objeyi kanca ucunda taşı
        if (s.caughtItem) {
          s.caughtItem.x = s.hookX
          s.caughtItem.y = s.hookY + 12
        }

        // Kanca tekneye geri ulaştı mı?
        if (s.hookLength <= 26) {
          s.hookLength = 26
          s.hookState = 'SWINGING'

          if (s.caughtItem) {
            const delivered = s.caughtItem
            s.caughtItem = null
            // Listeden kaldır
            s.items = s.items.filter((it) => it.id !== delivered.id)

            // Puan ve Ödül
            oceanAudio.playChaChing()
            setRoundScore((prev) => prev + delivered.value)

            // Toplam Altın Cüzdanını Güncelle
            setUpgrades((prev) => {
              const nextU = { ...prev, totalGold: prev.totalGold + delivered.value }
              saveUpgrades(nextU)
              return nextU
            })

            // Hedef Harf İncisi miydi?
            if (delivered.isTargetLetter) {
              oceanAudio.playShipHorn()
              playSoundEffect('fanfare')
              setTargetLettersCollected((prev) => {
                const nextCount = prev + 1
                if (nextCount >= 3) {
                  onComplete?.()
                  speakTurkish(`Tebrikler ${childName}! Fırtına Vincinin tüm hedeflerini tamamladın!`)
                } else {
                  speakTurkish(`${letter.upper} İncisi güvertede!`)
                }
                return nextCount
              })

              setMascotBubble(
                `Bravo ${childName}! "${delivered.char || letter.upper}" incisi güverteye çekildi! (+${delivered.value} Altın)`
              )

              // Yıldız Parçacıkları Saç
              for (let i = 0; i < 22; i++) {
                s.particles.push({
                  x: s.cranePivotX,
                  y: s.cranePivotY,
                  vx: (Math.random() - 0.5) * 220,
                  vy: -Math.random() * 200 - 40,
                  alpha: 1,
                  color: '#facc15',
                  size: Math.random() * 6 + 3,
                })
              }
            } else if (delivered.type === 'barrel') {
              // Sürpriz Fıçı Ödülü: +1 Dinamit veya Altın
              const bonusDynamite = Math.random() > 0.4
              if (bonusDynamite && upgrades.dynamiteCount < 5) {
                setUpgrades((prev) => {
                  const nu = { ...prev, dynamiteCount: prev.dynamiteCount + 1 }
                  saveUpgrades(nu)
                  return nu
                })
                setMascotBubble(`Sürpriz! Fıçıdan +1 Dinamit ve +${delivered.value} Altın çıktı! 🧨`)
              } else {
                setMascotBubble(`Sürpriz fıçıdan +${delivered.value} Altın çıktı! 🪙`)
              }
            } else {
              setMascotBubble(`Güverteye ulaştı: +${delivered.value} Altın!`)
            }

            // Eğer hedef inciler tükendiyse yenilerini oluştur
            const remainingTargets = s.items.filter((it) => it.isTargetLetter && !it.caught)
            if (remainingTargets.length === 0) {
              initUnderwaterItems()
            }
          }
        }
      }

      // 3. Yüzen Balıkların ve Mayınların Hareketi
      s.items.forEach((item) => {
        if (item.caught || item.exploded) return
        if (item.vx) {
          item.x += item.vx * dt
          if (item.x < 60) {
            item.x = 60
            item.vx = Math.abs(item.vx)
          } else if (item.x > 740) {
            item.x = 740
            item.vx = -Math.abs(item.vx)
          }
        }
        if (item.type === 'mine' && item.swayOffset !== undefined) {
          item.swayOffset += dt * 1.5
          item.y += Math.sin(item.swayOffset) * 0.4
        }
      })

      // 4. Parçacık Animasyonu
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i]
        p.x += p.vx * dt
        p.y += p.vy * dt
        p.alpha -= dt * 1.2
        if (p.alpha <= 0) {
          s.particles.splice(i, 1)
        }
      }

      // ==========================================
      // CANVAS ÇİZİMİ
      // ==========================================
      ctx.clearRect(0, 0, 800, 560)

      // A. Gökyüzü ve Deniz Gradyanı
      const skyGrad = ctx.createLinearGradient(0, 0, 0, 110)
      skyGrad.addColorStop(0, '#38bdf8')
      skyGrad.addColorStop(1, '#bae6fd')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, 800, 110)

      // Bulutlar ve Güneş
      ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
      ctx.beginPath()
      ctx.arc(120, 45, 22, 0, Math.PI * 2)
      ctx.arc(142, 40, 28, 0, Math.PI * 2)
      ctx.arc(164, 45, 22, 0, Math.PI * 2)
      ctx.fill()

      ctx.beginPath()
      ctx.arc(670, 50, 18, 0, Math.PI * 2)
      ctx.arc(690, 46, 24, 0, Math.PI * 2)
      ctx.arc(710, 50, 18, 0, Math.PI * 2)
      ctx.fill()

      // Güneş
      ctx.fillStyle = '#fef08a'
      ctx.beginPath()
      ctx.arc(740, 30, 20, 0, Math.PI * 2)
      ctx.fill()

      // B. Derin Deniz Gradyanı
      const seaGrad = ctx.createLinearGradient(0, 110, 0, 560)
      seaGrad.addColorStop(0, '#0284c7')
      seaGrad.addColorStop(0.4, '#0369a1')
      seaGrad.addColorStop(1, '#082f49')
      ctx.fillStyle = seaGrad
      ctx.fillRect(0, 110, 800, 450)

      // Işık huzmeleri (God-rays)
      ctx.save()
      ctx.fillStyle = 'rgba(255, 255, 255, 0.04)'
      ctx.beginPath()
      ctx.moveTo(220, 110)
      ctx.lineTo(290, 560)
      ctx.lineTo(340, 560)
      ctx.lineTo(250, 110)
      ctx.fill()

      ctx.beginPath()
      ctx.moveTo(520, 110)
      ctx.lineTo(590, 560)
      ctx.lineTo(650, 560)
      ctx.lineTo(560, 110)
      ctx.fill()
      ctx.restore()

      // Deniz Dibi Kumu ve Mercanlar
      ctx.fillStyle = '#d97706'
      ctx.beginPath()
      ctx.moveTo(0, 520)
      ctx.bezierCurveTo(200, 505, 500, 535, 800, 515)
      ctx.lineTo(800, 560)
      ctx.lineTo(0, 560)
      ctx.fill()

      // Denizyosunları
      ctx.strokeStyle = '#15803d'
      ctx.lineWidth = 4
      ctx.lineCap = 'round'
      for (let sx = 40; sx < 800; sx += 80) {
        ctx.beginPath()
        ctx.moveTo(sx, 540)
        const waveSway = Math.sin(now * 0.002 + sx) * 12
        ctx.quadraticCurveTo(sx + waveSway, 480, sx - waveSway, 430)
        ctx.stroke()
      }

      // Su Yüzeyi Dalga Çizgisi
      ctx.fillStyle = '#38bdf8'
      ctx.beginPath()
      ctx.moveTo(0, 110)
      for (let x = 0; x <= 800; x += 20) {
        const y = 110 + Math.sin(s.wavePhase + x * 0.03) * 5
        ctx.lineTo(x, y)
      }
      ctx.lineTo(800, 116)
      ctx.lineTo(0, 116)
      ctx.fill()

      // C. Lazer Nişangah Çizgisi (Laser Sonar)
      if (s.hookState === 'SWINGING') {
        ctx.save()
        const laserDist = gameMode === 'eylul_mina' ? 440 : 180 + upgrades.sonarLevel * 80
        const lx = s.cranePivotX + Math.sin(s.angle) * laserDist
        const ly = s.cranePivotY + Math.cos(s.angle) * laserDist

        ctx.strokeStyle =
          gameMode === 'eylul_mina' ? 'rgba(74, 222, 128, 0.75)' : 'rgba(244, 63, 94, 0.65)'
        ctx.lineWidth = 2.5
        ctx.setLineDash([8, 6])
        ctx.beginPath()
        ctx.moveTo(s.hookX, s.hookY)
        ctx.lineTo(lx, ly)
        ctx.stroke()

        // Lazer hedef noktası dairesi
        ctx.fillStyle = gameMode === 'eylul_mina' ? '#22c55e' : '#f43f5e'
        ctx.beginPath()
        ctx.arc(lx, ly, 5, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // D. Vinç Zinciri (Chain Links)
      ctx.save()
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(s.cranePivotX, s.cranePivotY)
      ctx.lineTo(s.hookX, s.hookY)
      ctx.stroke()

      // Zincir halkaları efekti
      const segs = Math.max(1, Math.floor(s.hookLength / 12))
      for (let i = 1; i < segs; i++) {
        const linkX = s.cranePivotX + ((s.hookX - s.cranePivotX) * i) / segs
        const linkY = s.cranePivotY + ((s.hookY - s.cranePivotY) * i) / segs
        ctx.fillStyle = i % 2 === 0 ? '#cbd5e1' : '#64748b'
        ctx.beginPath()
        ctx.arc(linkX, linkY, 2.5, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.restore()

      // E. Mekanik Vinç Kancası (Claw)
      ctx.save()
      ctx.translate(s.hookX, s.hookY)
      ctx.rotate(-s.angle)

      // Kanca Gövdesi
      ctx.fillStyle = '#eab308'
      ctx.beginPath()
      ctx.arc(0, 0, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.strokeStyle = '#a16207'
      ctx.lineWidth = 2
      ctx.stroke()

      // Kanca Pençeleri (Claw Arms)
      const clawSpread = s.caughtItem ? 0.35 : 0.75 // Eşya varsa pençeler sarılır
      ctx.strokeStyle = '#475569'
      ctx.lineWidth = 3.5
      ctx.lineCap = 'round'

      // Sol pençe
      ctx.beginPath()
      ctx.arc(-8, 8, 12, Math.PI * 0.4, Math.PI * (0.4 + clawSpread))
      ctx.stroke()

      // Sağ pençe
      ctx.beginPath()
      ctx.arc(8, 8, 12, Math.PI * (0.6 - clawSpread), Math.PI * 0.6)
      ctx.stroke()

      ctx.restore()

      // F. Su Altı Objelerinin Çizimi
      s.items.forEach((item) => {
        if (item.exploded) return

        ctx.save()
        ctx.translate(item.x, item.y)

        // 1. Hedef Harf İncisi (Parlayan Altın İstiridye)
        if (item.type === 'pearl') {
          // Altın ışıma halesi
          ctx.fillStyle = 'rgba(250, 204, 21, 0.22)'
          ctx.beginPath()
          ctx.arc(0, 0, item.radius + 8, 0, Math.PI * 2)
          ctx.fill()

          // İnci kabuğu
          ctx.fillStyle = '#fef08a'
          ctx.beginPath()
          ctx.arc(0, 0, item.radius, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#ca8a04'
          ctx.lineWidth = 3
          ctx.stroke()

          // Harf
          ctx.fillStyle = '#854d0e'
          ctx.font = 'bold 22px Fredoka, Comic Neue, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(item.char || letter.upper, 0, 2)

          // Sonar ile değer göstergesi
          if (upgrades.sonarLevel >= 3 || gameMode === 'eylul_mina') {
            ctx.font = 'bold 11px sans-serif'
            ctx.fillStyle = '#fef08a'
            ctx.fillText(`${item.value}G`, 0, item.radius + 14)
          }
        }

        // 2. Hazine Sandığı (Kelime ve Maskot)
        else if (item.type === 'chest') {
          // Ahşap sandık gövdesi
          ctx.fillStyle = '#854d0e'
          ctx.fillRect(-item.radius, -item.radius * 0.6, item.radius * 2, item.radius * 1.3)
          ctx.strokeStyle = '#facc15'
          ctx.lineWidth = 3
          ctx.strokeRect(-item.radius, -item.radius * 0.6, item.radius * 2, item.radius * 1.3)

          // Kilit ve süsleme
          ctx.fillStyle = '#facc15'
          ctx.beginPath()
          ctx.arc(0, 0, 6, 0, Math.PI * 2)
          ctx.fill()

          // Sandık üzerindeki kelime/emoji
          ctx.font = '18px sans-serif'
          ctx.textAlign = 'center'
          ctx.fillText(item.emoji || '🎁', 0, -item.radius * 0.7)

          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 11px Fredoka, sans-serif'
          ctx.fillText(item.word || letter.mascotWord, 0, item.radius * 0.4)
        }

        // 3. Yüzen Harf Balığı
        else if (item.type === 'fish') {
          const dir = (item.vx || 1) > 0 ? 1 : -1
          ctx.scale(dir, 1)

          // Balık gövdesi
          ctx.fillStyle = item.isTargetLetter ? '#ec4899' : '#38bdf8'
          ctx.beginPath()
          ctx.ellipse(0, 0, item.radius, item.radius * 0.65, 0, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#ffffff'
          ctx.lineWidth = 2
          ctx.stroke()

          // Kuyruk
          const finSway = Math.sin(now * 0.01) * 4
          ctx.beginPath()
          ctx.moveTo(-item.radius, 0)
          ctx.lineTo(-item.radius - 12, -8 + finSway)
          ctx.lineTo(-item.radius - 12, 8 + finSway)
          ctx.closePath()
          ctx.fillStyle = item.isTargetLetter ? '#db2777' : '#0284c7'
          ctx.fill()

          // Göz
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(item.radius * 0.4, -4, 4, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#0f172a'
          ctx.beginPath()
          ctx.arc(item.radius * 0.45, -4, 2, 0, Math.PI * 2)
          ctx.fill()

          // Harf
          ctx.fillStyle = '#ffffff'
          ctx.font = 'bold 16px Fredoka, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(item.char || letter.upper, 0, 1)
        }

        // 4. Sürpriz Fıçı
        else if (item.type === 'barrel') {
          ctx.fillStyle = '#78350f'
          ctx.beginPath()
          ctx.roundRect(-item.radius, -item.radius, item.radius * 2, item.radius * 2, 8)
          ctx.fill()
          ctx.strokeStyle = '#ca8a04'
          ctx.lineWidth = 3
          ctx.stroke()

          // Soru işareti
          ctx.fillStyle = '#fef08a'
          ctx.font = 'bold 22px Fredoka, sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText('?', 0, 0)
        }

        // 5. Ağır Taş
        else if (item.type === 'rock') {
          ctx.fillStyle = '#64748b'
          ctx.beginPath()
          ctx.arc(0, 0, item.radius, 0, Math.PI * 2)
          ctx.fill()
          ctx.strokeStyle = '#334155'
          ctx.lineWidth = 3
          ctx.stroke()
          // Çatlaklar
          ctx.strokeStyle = '#475569'
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(-8, -6)
          ctx.lineTo(4, 2)
          ctx.lineTo(8, 10)
          ctx.stroke()
        }

        // 6. Deniz Mayını
        else if (item.type === 'mine') {
          if (gameMode === 'eylul_mina') {
            // Sevimli Köpük Balonu (Çocuk Dostu)
            ctx.fillStyle = 'rgba(103, 232, 249, 0.45)'
            ctx.beginPath()
            ctx.arc(0, 0, item.radius, 0, Math.PI * 2)
            ctx.fill()
            ctx.strokeStyle = '#06b6d4'
            ctx.lineWidth = 3
            ctx.stroke()

            // Sevimli gözler ve gülümseme
            ctx.fillStyle = '#083344'
            ctx.beginPath()
            ctx.arc(-6, -3, 3, 0, Math.PI * 2)
            ctx.arc(6, -3, 3, 0, Math.PI * 2)
            ctx.fill()
            ctx.beginPath()
            ctx.arc(0, 4, 5, 0, Math.PI)
            ctx.stroke()
          } else {
            // Kaptan Modu: Dikenli Siyah Demir Mayın
            ctx.fillStyle = '#1e293b'
            ctx.beginPath()
            ctx.arc(0, 0, item.radius, 0, Math.PI * 2)
            ctx.fill()
            ctx.strokeStyle = '#ef4444'
            ctx.lineWidth = 2
            ctx.stroke()

            // Dikenler (Spikes)
            for (let sp = 0; sp < 8; sp++) {
              const spAngle = (sp * Math.PI * 2) / 8
              ctx.fillStyle = '#0f172a'
              ctx.beginPath()
              ctx.arc(
                Math.cos(spAngle) * (item.radius + 6),
                Math.sin(spAngle) * (item.radius + 6),
                3.5,
                0,
                Math.PI * 2
              )
              ctx.fill()
            }

            // Yanıp sönen kırmızı LED
            const blink = Math.sin(now * 0.008) > 0
            ctx.fillStyle = blink ? '#ef4444' : '#7f1d1d'
            ctx.beginPath()
            ctx.arc(0, 0, 4, 0, Math.PI * 2)
            ctx.fill()
          }
        }

        ctx.restore()
      })

      // G. Parçacıklar
      s.particles.forEach((p) => {
        ctx.save()
        ctx.globalAlpha = Math.max(0, p.alpha)
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      // H. Gemi ve Vinç Çizimi
      ctx.save()
      ctx.translate(s.shipX, s.shipY)
      ctx.rotate(waveSlope)

      // Gemi Gövdesi (Hull)
      ctx.fillStyle = '#b45309'
      ctx.beginPath()
      ctx.moveTo(-50, -10)
      ctx.lineTo(40, -10)
      ctx.lineTo(55, 6)
      ctx.lineTo(25, 20)
      ctx.lineTo(-40, 20)
      ctx.closePath()
      ctx.fill()
      ctx.strokeStyle = '#78350f'
      ctx.lineWidth = 3
      ctx.stroke()

      // Kamara (Cabin)
      ctx.fillStyle = '#f8fafc'
      ctx.fillRect(-35, -34, 45, 24)
      ctx.strokeStyle = '#94a3b8'
      ctx.lineWidth = 2
      ctx.strokeRect(-35, -34, 45, 24)

      // Kamara Pencereleri
      ctx.fillStyle = '#38bdf8'
      ctx.fillRect(-28, -28, 12, 12)
      ctx.fillRect(-8, -28, 12, 12)

      // Baca ve Duman
      ctx.fillStyle = '#dc2626'
      ctx.fillRect(-4, -46, 12, 14)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.beginPath()
      ctx.arc(2, -54, 5, 0, Math.PI * 2)
      ctx.arc(8, -62, 7, 0, Math.PI * 2)
      ctx.fill()

      // Vinç Direği ve Makaralar (Crane Boom)
      ctx.strokeStyle = '#eab308'
      ctx.lineWidth = 5
      ctx.beginPath()
      ctx.moveTo(15, -10)
      ctx.lineTo(42, -26)
      ctx.stroke()

      // Vinç Makara Çarkı
      ctx.fillStyle = '#475569'
      ctx.beginPath()
      ctx.arc(42, -26, 6, 0, Math.PI * 2)
      ctx.fill()

      // Türk Bayrağı / Flama
      ctx.fillStyle = '#ef4444'
      ctx.beginPath()
      ctx.moveTo(-45, -30)
      ctx.lineTo(-58, -24)
      ctx.lineTo(-45, -18)
      ctx.closePath()
      ctx.fill()

      ctx.restore()

      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animId)
  }, [letter, gameMode, upgrades, childName, onComplete])

  // ==========================================
  // TERSANE GELİŞTİRME MAĞAZASI İŞLEMLERİ
  // ==========================================
  const buyUpgrade = (
    type: 'winch' | 'dynamite' | 'sonar' | 'fuel',
    cost: number,
    maxLevel: number = 3
  ) => {
    if (upgrades.totalGold < cost) {
      playSoundEffect('bloop')
      setMascotBubble('Yeterli altının yok Kaptan! Denizden hazine toplamaya devam!')
      return
    }

    const next = { ...upgrades, totalGold: upgrades.totalGold - cost }
    if (type === 'winch' && next.winchLevel < maxLevel) {
      next.winchLevel += 1
    } else if (type === 'dynamite' && next.dynamiteCount < 5) {
      next.dynamiteCount += 1
    } else if (type === 'sonar' && next.sonarLevel < maxLevel) {
      next.sonarLevel += 1
    } else if (type === 'fuel' && next.fuelLevel < maxLevel) {
      next.fuelLevel += 1
      setTimeLeft((prev) => prev + 15)
    }

    setUpgrades(next)
    saveUpgrades(next)
    playSoundEffect('success')
    oceanAudio.playChaChing()
  }

  return (
    <div className="ocean-winch-container">
      {/* ÜST BAŞLIK VE KONTROLLER */}
      <div className="ocean-winch-header">
        <div className="ocean-title-group">
          <div className="ship-icon-badge">
            <Ship size={26} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 className="ocean-main-title">Fırtına Vinci: Derin Deniz Hazine Avı</h2>
              {completed && <span className="ocean-completed-tag">✓ Tamamlandı</span>}
            </div>
            <p className="ocean-subtitle">
              Sarkaç Vinci ile "{letter.upper}" İncilerini ve Kelime Sandıklarını Güverteye Çek!
            </p>
          </div>
        </div>

        {/* CÜZDAN VE DÜKKAN BUTONU */}
        <div className="ocean-header-actions">
          <div className="ocean-gold-pill">
            <Coins size={20} color="#eab308" />
            <span className="gold-text">{upgrades.totalGold} G</span>
          </div>

          <button
            type="button"
            className="btn-ocean-shop"
            onClick={() => {
              playSoundEffect('pop')
              setIsShopOpen(true)
            }}
          >
            <ShoppingBag size={18} />
            <span>Tersane Dükkanı</span>
          </button>

          {/* OYUN MODU DEĞİŞTİRİCİ */}
          <div className="mode-toggle-pill">
            <button
              type="button"
              className={`mode-btn ${gameMode === 'eylul_mina' ? 'active' : ''}`}
              onClick={() => {
                playSoundEffect('click')
                setGameMode('eylul_mina')
                setMascotBubble(`Harika ${childName}! Rahat ve eğlenceli çocuk moduna geçtin!`)
              }}
            >
              👧 Eylül Mina Modu
            </button>
            <button
              type="button"
              className={`mode-btn ${gameMode === 'captain_pro' ? 'active' : ''}`}
              onClick={() => {
                playSoundEffect('click')
                setGameMode('captain_pro')
                setMascotBubble('Dikkat Kaptan! 60 saniyelik fırtına mücadelesi başladı!')
              }}
            >
              👨 Kaptan Pro
            </button>
          </div>
        </div>
      </div>

      {/* ŞEF KAPTAN KONUŞMA BALONU VE HEDEF GÖSTERGESİ */}
      <div className="ocean-status-bar">
        <div className="captain-speech-card">
          <div className="captain-avatar">⚓🐶</div>
          <div className="captain-text-content">
            <span className="captain-speaker-name">Kaptan Pelikan:</span>
            <p className="captain-speech-text">{mascotBubble}</p>
          </div>
          <button
            type="button"
            className="btn-listen-captain"
            onClick={() => speakTurkish(mascotBubble)}
            title="Kaptanı Dinle"
          >
            <Volume2 size={18} />
          </button>
        </div>

        <div className="ocean-quest-metrics">
          <div className="metric-box target-box">
            <span className="metric-label">"{letter.upper}" İncileri:</span>
            <div className="pearls-stars-row">
              {[0, 1, 2].map((idx) => (
                <div
                  key={idx}
                  className={`pearl-status-dot ${idx < targetLettersCollected ? 'collected' : ''}`}
                >
                  {letter.upper}
                </div>
              ))}
            </div>
          </div>

          <div className="metric-box score-box">
            <span className="metric-label">Tur Puanı:</span>
            <span className="metric-value">+{roundScore}</span>
          </div>

          {gameMode === 'captain_pro' ? (
            <div className={`metric-box timer-box ${timeLeft < 15 ? 'timer-danger' : ''}`}>
              <Clock size={16} />
              <span className="metric-value">{timeLeft}s</span>
            </div>
          ) : (
            <div className="metric-box relaxed-box">
              <Shield size={16} color="#16a34a" />
              <span className="relaxed-text">Sonsuz Oksijen ♾️</span>
            </div>
          )}
        </div>
      </div>

      {/* OYUN CANVAS ALANI */}
      <div className="ocean-canvas-stage" onClick={shootHook}>
        <canvas
          ref={canvasRef}
          width={800}
          height={560}
          className="ocean-canvas-element"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.code === 'Space') {
              e.preventDefault()
              shootHook()
            }
          }}
        />

        {/* FIRLATMA VE ETKİLEŞİM İPUCU */}
        <div className="ocean-canvas-watermark">
          <span>Kancayı fırlatmak için tıkla veya Boşluk (Space) tuşuna bas!</span>
        </div>

        {/* DİNAMİT ACİL DURUM BUTONU (Kanca takıldığında aktif olur) */}
        {stateRef.current.caughtItem && stateRef.current.hookState === 'REELING' && (
          <button
            type="button"
            className="ocean-dynamite-action-btn"
            onClick={(e) => {
              e.stopPropagation()
              triggerDynamite()
            }}
          >
            <Bomb size={24} className="bomb-wiggle" />
            <span>Dinamit Patlat! ({upgrades.dynamiteCount})</span>
          </button>
        )}
      </div>

      {/* ALT KONTROL PANELİ */}
      <div className="ocean-bottom-controls">
        <button
          type="button"
          className="btn-shoot-hook-giant"
          onClick={shootHook}
          disabled={stateRef.current.hookState !== 'SWINGING'}
        >
          <Anchor size={24} />
          <span>⚓ KANCAYI FIRLAT!</span>
        </button>

        <div className="controls-right-actions">
          <button
            type="button"
            className="btn-ocean-secondary"
            onClick={() => {
              playSoundEffect('click')
              initUnderwaterItems()
              setRoundScore(0)
              setTargetLettersCollected(0)
              setMascotBubble(`Deniz yenilendi! "${letter.upper}" incilerini tekrar avlayalım!`)
            }}
          >
            <RotateCcw size={18} />
            <span>Denizi Yenile</span>
          </button>

          {onExit && (
            <button type="button" className="btn-ocean-exit" onClick={onExit}>
              <Award size={18} />
              <span>Dersi Tamamla</span>
            </button>
          )}
        </div>
      </div>

      {/* TERSANE GELİŞTİRME MAĞAZASI MODALİ */}
      {isShopOpen && (
        <div className="ocean-shop-overlay" onClick={() => setIsShopOpen(false)}>
          <div className="ocean-shop-card" onClick={(e) => e.stopPropagation()}>
            <div className="shop-header">
              <div className="shop-title">
                <ShoppingBag size={24} color="#eab308" />
                <h3>Tersane Geliştirme Dükkanı</h3>
              </div>
              <div className="shop-wallet">
                <Coins size={20} color="#eab308" />
                <span>{upgrades.totalGold} Altın</span>
              </div>
            </div>

            <p className="shop-desc">
              Topladığın altınlarla vinç motorunu güçlendir, dinamit stokla ve lazer sonarını artır!
            </p>

            <div className="shop-items-grid">
              {/* 1. Turbo Vinç Motoru */}
              <div className="shop-item-card">
                <div className="shop-item-icon">⚡</div>
                <div className="shop-item-details">
                  <h4>Turbo Vinç Motoru</h4>
                  <p>Ağır hazineleri ve incileri %35 daha hızlı çeker.</p>
                  <div className="item-level-stars">
                    Seviye: {upgrades.winchLevel}/3
                    {Array.from({ length: upgrades.winchLevel }).map((_, i) => (
                      <Star key={i} size={14} fill="#facc15" color="#ca8a04" />
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-buy"
                  disabled={upgrades.winchLevel >= 3 || upgrades.totalGold < 120}
                  onClick={() => buyUpgrade('winch', 120)}
                >
                  {upgrades.winchLevel >= 3 ? 'Maksimum' : '120 Altın'}
                </button>
              </div>

              {/* 2. Dinamit */}
              <div className="shop-item-card">
                <div className="shop-item-icon">🧨</div>
                <div className="shop-item-details">
                  <h4>Yedek Dinamit</h4>
                  <p>Kancaya takılan gereksiz ağır taşları anında patlatır.</p>
                  <div className="item-level-stars">Mevcut: {upgrades.dynamiteCount}/5 Adet</div>
                </div>
                <button
                  type="button"
                  className="btn-buy"
                  disabled={upgrades.dynamiteCount >= 5 || upgrades.totalGold < 40}
                  onClick={() => buyUpgrade('dynamite', 40, 5)}
                >
                  {upgrades.dynamiteCount >= 5 ? 'Dolu' : '40 Altın'}
                </button>
              </div>

              {/* 3. Lazer Sonar */}
              <div className="shop-item-card">
                <div className="shop-item-icon">🎯</div>
                <div className="shop-item-details">
                  <h4>Lazer Sonar</h4>
                  <p>Hedef lazer çizgisini uzatır ve deniz dibi altınlarını tarar.</p>
                  <div className="item-level-stars">
                    Seviye: {upgrades.sonarLevel}/3
                    {Array.from({ length: upgrades.sonarLevel }).map((_, i) => (
                      <Star key={i} size={14} fill="#facc15" color="#ca8a04" />
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-buy"
                  disabled={upgrades.sonarLevel >= 3 || upgrades.totalGold < 100}
                  onClick={() => buyUpgrade('sonar', 100)}
                >
                  {upgrades.sonarLevel >= 3 ? 'Maksimum' : '100 Altın'}
                </button>
              </div>

              {/* 4. Ekstra Oksijen / Yakıt (Kaptan Modu İçin) */}
              <div className="shop-item-card">
                <div className="shop-item-icon">⏱️</div>
                <div className="shop-item-details">
                  <h4>Fırtına Yakıtı</h4>
                  <p>Kaptan Modunda tur süresine +15 saniye ekler.</p>
                  <div className="item-level-stars">
                    Seviye: {upgrades.fuelLevel}/3
                    {Array.from({ length: upgrades.fuelLevel }).map((_, i) => (
                      <Star key={i} size={14} fill="#facc15" color="#ca8a04" />
                    ))}
                  </div>
                </div>
                <button
                  type="button"
                  className="btn-buy"
                  disabled={upgrades.fuelLevel >= 3 || upgrades.totalGold < 90}
                  onClick={() => buyUpgrade('fuel', 90)}
                >
                  {upgrades.fuelLevel >= 3 ? 'Maksimum' : '90 Altın'}
                </button>
              </div>
            </div>

            <div className="shop-footer">
              <button
                type="button"
                className="btn-close-shop"
                onClick={() => setIsShopOpen(false)}
              >
                Gemiye Dön
              </button>
            </div>
          </div>
        </div>
      )}

      {/* OYUN BİTTİ (KAPTAN MODU) MODALİ */}
      {isGameOver && (
        <div className="ocean-gameover-overlay">
          <div className="ocean-gameover-card">
            <div className="gameover-icon">🏆</div>
            <h3>Fırtına Turu Tamamlandı!</h3>
            <p>
              Harika bir dalış yaptın Kaptan! Toplam Toplanan Altın: <b>{roundScore} G</b>
            </p>
            <div className="gameover-actions">
              <button
                type="button"
                className="btn-play-again"
                onClick={() => {
                  playSoundEffect('fanfare')
                  initUnderwaterItems()
                  setRoundScore(0)
                  setTargetLettersCollected(0)
                  setTimeLeft(60 + (upgrades.fuelLevel - 1) * 15)
                  setIsGameOver(false)
                }}
              >
                Yeniden Başla
              </button>
              {onExit && (
                <button type="button" className="btn-finish-lesson" onClick={onExit}>
                  Dersi Tamamla
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PEDAGOJİK BİLGİLENDİRME ÇUBUĞU */}
      <div className="ocean-pedagogy-footer">
        <HelpCircle size={16} color="#0284c7" />
        <span>
          Pedagojik Not: Bu oyun el-göz koordinasyonunu, açı-zamanlama refleksini ve hedeflenen "
          {letter.upper}" harfini derin deniz öğeleri arasından ayırt etmeyi pekiştirir.
        </span>
      </div>
    </div>
  )
}
