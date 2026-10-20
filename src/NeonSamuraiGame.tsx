import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Swords,
  Heart,
  RotateCcw,
  Trophy,
  Sparkles,
  Zap,
  Snowflake,
  Clock,
  Play,
  HelpCircle,
} from 'lucide-react'
import type { LetterCurriculum } from './curriculum'
import { getLearnedDistractorLetters } from './curriculum'
import { playSoundEffect, speakTurkish } from './sound'

// ============================================================================
// PROSEDÜREL SES MOTORU (WEB AUDIO API - ZERO ASSETS)
// ============================================================================
class SamuraiAudioEngine {
  private ctx: AudioContext | null = null

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume()
    }
    return this.ctx
  }

  // 1. Kılıç Savurma Sesi (Whoosh)
  playWhoosh() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime

    // White noise oluştur
    const bufSize = Math.floor(ctx.sampleRate * 0.16)
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buf

    // Bandpass filtresi (Hızlı frekans kaydırması)
    const filter = ctx.createBiquadFilter()
    filter.type = 'bandpass'
    filter.Q.value = 3.5
    filter.frequency.setValueAtTime(1900, now)
    filter.frequency.exponentialRampToValueAtTime(320, now + 0.15)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.2, now)
    gain.gain.linearRampToValueAtTime(0.25, now + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    noise.start(now)
    noise.stop(now + 0.16)
  }

  // 2. Harf Kesme ve Sulu Patlama (Splat / Slice)
  playSlice() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime

    // Yüksek tınlamalı metalik darbe (Blade resonance)
    const osc1 = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc1.type = 'sine'
    osc1.frequency.setValueAtTime(1760, now) // A6
    osc1.frequency.exponentialRampToValueAtTime(880, now + 0.12)
    gain1.gain.setValueAtTime(0.18, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.12)
    osc1.connect(gain1)
    gain1.connect(ctx.destination)
    osc1.start(now)
    osc1.stop(now + 0.13)

    // Sulu çıtırtı (Juicy low-pass pop)
    const bufSize = Math.floor(ctx.sampleRate * 0.1)
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buf

    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(1400, now)
    filter.frequency.exponentialRampToValueAtTime(200, now + 0.1)

    const gain2 = ctx.createGain()
    gain2.gain.setValueAtTime(0.22, now)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.1)

    noise.connect(filter)
    filter.connect(gain2)
    gain2.connect(ctx.destination)
    noise.start(now)
    noise.stop(now + 0.1)
  }

  // 3. Yükselen Kombo Sesi (Pitch-shifted pentatonic arpeggio)
  playCombo(level: number) {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime

    const scale = [523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.5]
    const freq = scale[Math.min(level - 1, scale.length - 1)] || 523.25

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'triangle'
    osc.frequency.setValueAtTime(freq, now)
    gain.gain.setValueAtTime(0.22, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.36)
  }

  // 4. Bomba Patlaması (Deep explosion)
  playBombExplosion() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime

    // Sub-bass thump
    const osc = ctx.createOscillator()
    const gain1 = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(150, now)
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.45)
    gain1.gain.setValueAtTime(0.35, now)
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.45)
    osc.connect(gain1)
    gain1.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.46)

    // Distorted rumble
    const bufSize = Math.floor(ctx.sampleRate * 0.5)
    const buf = ctx.createBuffer(1, bufSize, ctx.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufSize; i++) {
      data[i] = Math.random() * 2 - 1
    }
    const noise = ctx.createBufferSource()
    noise.buffer = buf
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(500, now)
    filter.frequency.exponentialRampToValueAtTime(50, now + 0.5)

    const gain2 = ctx.createGain()
    gain2.gain.setValueAtTime(0.3, now)
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.5)

    noise.connect(filter)
    filter.connect(gain2)
    gain2.connect(ctx.destination)
    noise.start(now)
    noise.stop(now + 0.5)
  }

  // 5. Buz Kristali Sesi (Shimmering Ice)
  playFreezeSound() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const freqs = [1200, 1600, 2400]
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(f, now + i * 0.05)
      gain.gain.setValueAtTime(0.12, now + i * 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.4)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + i * 0.05)
      osc.stop(now + i * 0.05 + 0.4)
    })
  }

  // 6. Çılgınlık / Frenzy Güçlendirmesi
  playFrenzySound() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(300, now)
    osc.frequency.exponentialRampToValueAtTime(900, now + 0.25)
    gain.gain.setValueAtTime(0.15, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.3)
  }

  // 7. Çocuk Modu Mürekkep Kıkırdaması
  playGiggle() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(450 + (i % 2) * 150, now + i * 0.08)
      gain.gain.setValueAtTime(0.15, now + i * 0.08)
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.07)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + i * 0.08)
      osc.stop(now + i * 0.08 + 0.08)
    }
  }

  // 8. Kelime Tamamlama Zafer Şarkısı
  playWordVictory() {
    const ctx = this.getContext()
    if (!ctx) return
    const now = ctx.currentTime
    const notes = [523.25, 659.25, 783.99, 1046.5] // C - E - G - High C
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, now + idx * 0.08)
      gain.gain.setValueAtTime(0.2, now + idx * 0.08)
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.4)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + idx * 0.08)
      osc.stop(now + idx * 0.08 + 0.42)
    })
  }
}

const samuraiAudio = new SamuraiAudioEngine()

// ============================================================================
// TİPLER VE VERİ MODELLERİ
// ============================================================================
export type SamuraiGameMode = 'eylul_mina' | 'captain_pro'

export interface TargetWord {
  word: string
  emoji: string
  hint: string
}

export interface FlyingSphere {
  id: string
  type: 'letter' | 'freeze' | 'frenzy' | 'bomb'
  char: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  rotation: number
  vRot: number
  color: string
  isTargetLetter: boolean
  isNextTarget: boolean
  sliced: boolean
}

export interface SlicedHalf {
  id: string
  char: string
  color: string
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  vRot: number
  radius: number
  sliceAngle: number
  side: 'left' | 'right'
  alpha: number
}

export interface JuiceParticle {
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  alpha: number
  gravity: number
}

export interface DecalSplatter {
  x: number
  y: number
  radius: number
  color: string
  alpha: number
}

export interface FloatingText {
  id: string
  text: string
  x: number
  y: number
  color: string
  alpha: number
  scale: number
  vy: number
}

interface TouchTrailPoint {
  x: number
  y: number
  time: number
}

interface NeonSamuraiGameProps {
  letter: LetterCurriculum
  childName?: string
  completed?: boolean
  onComplete?: () => void
  onExit?: () => void
}

const HIGH_SCORE_KEY = 'eylul_mina_samurai_highscore'

export function NeonSamuraiGame({
  letter,
  childName = 'Eylül Mina',
  completed = false,
  onComplete,
  onExit,
}: NeonSamuraiGameProps) {
  // Başlangıç Menüsü & Mod Seçimi
  const [isPlaying, setIsPlaying] = useState(false)
  const [gameMode, setGameMode] = useState<SamuraiGameMode>('eylul_mina')
  const [adultSubMode, setAdultSubMode] = useState<'arcade' | 'time_attack'>('arcade')

  // Oyun Durumu
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(() => {
    try {
      return parseInt(localStorage.getItem(HIGH_SCORE_KEY) || '0', 10)
    } catch {
      return 0
    }
  })
  const [hearts, setHearts] = useState(3)
  const [timeLeft, setTimeLeft] = useState(60)
  const [isGameOver, setIsGameOver] = useState(false)
  const [wordsCompletedCount, setWordsCompletedCount] = useState(0)

  // Aktif Kelime Takibi
  const [targetWordIndex, setTargetWordIndex] = useState(0)
  const [slicedLetterIndices, setSlicedLetterIndices] = useState<number[]>([])

  // Güçlendirme Durumları
  const [freezeTimer, setFreezeTimer] = useState(0) // Slow-mo süresi
  const [frenzyTimer, setFrenzyTimer] = useState(0) // 2x frenzy süresi
  const [inkSplatAlpha, setInkSplatAlpha] = useState(0) // Çocuk modu mürekkep lekesi

  // Kombo Takibi
  const [comboCount, setComboCount] = useState(0)

  // Canvas Referansları
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const trailRef = useRef<TouchTrailPoint[]>([])
  const isPointerDownRef = useRef(false)

  // Kelime Havuzu
  const wordPool = useRef<TargetWord[]>([])

  // Fizik ve Görsel Motor State Referansı (60FPS döngüsü için React re-render olmadan)
  const engineRef = useRef({
    spheres: [] as FlyingSphere[],
    halves: [] as SlicedHalf[],
    particles: [] as JuiceParticle[],
    splatters: [] as DecalSplatter[],
    floatingTexts: [] as FloatingText[],
    screenShake: 0,
    hitStop: 0, // ms cinsinden mikro donma
    lastTime: performance.now(),
    spawnTimer: 0,
    spawnInterval: 1.6,
    lastWhooshTime: 0,
    nextId: 1,
    currentWord: { word: 'ELMA', emoji: '🍎', hint: 'Lezzetli kırmızı meyve' },
    nextTargetChar: 'E',
    currentComboInSwipe: 0,
  })

  // ============================================================================
  // KELİME HAVUZU HAZIRLAMA (MÜFREDAT + ÇOCUK MODU VE YETİŞKİN MODU)
  // ============================================================================
  useEffect(() => {
    const list: TargetWord[] = []

    if (gameMode === 'eylul_mina') {
      // 6 Yaş Çocuk Modu: 2-4 harfli tatlı kelimeler (Aile isimleri + seçilen harfin kelimeleri)
      const family = [
        { word: 'MİNA', emoji: '👧', hint: 'Canım Prenses Mina' },
        { word: 'BARLAS', emoji: '👶', hint: 'Cesur Küçük Kardeş' },
        { word: 'EMİNE', emoji: '👩', hint: 'Canım Anne' },
        { word: 'BİLAL', emoji: '👨', hint: 'Sevgili Baba' },
      ]
      // Seçilen harfin kendi kelimeleri
      letter.words.forEach((w) => {
        if (w.word.length <= 5) {
          list.push({ word: w.word.toLocaleUpperCase('tr-TR'), emoji: w.emoji, hint: w.word })
        }
      })
      list.push(...family)
      // Temel kelimeler
      list.push(
        { word: 'ELA', emoji: '👧', hint: 'Ela gözlü kız' },
        { word: 'LALE', emoji: '🌷', hint: 'Mis kokulu lale' },
        { word: 'ANNE', emoji: '❤️', hint: 'Canım anne' },
        { word: 'KEDİ', emoji: '🐱', hint: 'Sevimli miyav' },
        { word: 'ELMA', emoji: '🍎', hint: 'Kırmızı tatlı elma' }
      )
    } else {
      // Yetişkin / Kaptan Modu: 5-8 harfli mücadeleci kelimeler
      list.push(
        { word: 'TERSANE', emoji: '⚓', hint: 'Gemi yapım yeri' },
        { word: 'DENİZCİ', emoji: '⛵', hint: 'Mavi suların fatihi' },
        { word: 'FIRTINA', emoji: '🌪️', hint: 'Büyük deniz rüzgarı' },
        { word: 'KAPTAN', emoji: '👨‍✈️', hint: 'Geminin yöneticisi' },
        { word: 'ŞAMPİYON', emoji: '🏆', hint: 'Zirvedeki kahraman' },
        { word: 'SAMURAY', emoji: '⚔️', hint: 'Neon kılıç ustası' },
        { word: 'PUSULA', emoji: '🧭', hint: 'Yön gösteren alet' },
        { word: 'OKYANUS', emoji: '🌊', hint: 'Uçsuz bucaksız deniz' }
      )
    }

    wordPool.current = list
    const initialWord = list[0] || { word: 'LALE', emoji: '🌷', hint: 'Lale' }
    engineRef.current.currentWord = initialWord
    engineRef.current.nextTargetChar = initialWord.word[0] || 'A'
    setTargetWordIndex(0)
    setSlicedLetterIndices([])
  }, [letter, gameMode])

  // Aktif Kelimedeki Sıradaki Harfi Güncelle
  const updateNextTarget = useCallback(
    (completedIdxs: number[], currentW: TargetWord) => {
      for (let i = 0; i < currentW.word.length; i++) {
        if (!completedIdxs.includes(i)) {
          engineRef.current.nextTargetChar = currentW.word[i]
          return
        }
      }
      engineRef.current.nextTargetChar = ''
    },
    []
  )

  // ============================================================================
  // YENİ KÜRE FIRLATMA MEKANİZMASI (SPAWN LOGIC)
  // ============================================================================
  const spawnSphere = useCallback(
    (customType?: 'letter' | 'freeze' | 'frenzy' | 'bomb', forceLetter?: string) => {
      const e = engineRef.current
      const canvas = canvasRef.current
      if (!canvas) return

      const w = canvas.width
      const h = canvas.height

      // X ekseninde ekranın altından rastgele bir noktadan fırlat
      const x = Math.random() * (w - 200) + 100
      const y = h + 20

      // Hız vektörleri (Kavis ve yükseklik)
      const gravity = gameMode === 'eylul_mina' ? 420 : 700
      const targetApexY = Math.random() * (h * 0.35) + h * 0.15 // Ulaşacağı tepe noktası
      const vy = -Math.sqrt(2 * gravity * (y - targetApexY))
      const vx = (w / 2 - x) * 0.55 + (Math.random() - 0.5) * 120

      const id = `sphere_${e.nextId++}`
      const radius = gameMode === 'eylul_mina' ? 36 : 30
      const rotation = Math.random() * Math.PI * 2
      const vRot = (Math.random() - 0.5) * 4.5

      // Güçlendirme veya Bomba fırlatma şansı
      let type: 'letter' | 'freeze' | 'frenzy' | 'bomb' = customType || 'letter'
      if (!customType) {
        const rand = Math.random()
        if (rand < 0.05) type = 'freeze'
        else if (rand < 0.1) type = 'frenzy'
        else if (rand < (gameMode === 'eylul_mina' ? 0.2 : 0.28)) type = 'bomb'
      }

      // Harf Belirleme
      let char = forceLetter || ''
      let isTargetLetter = false
      let color = '#38bdf8'

      if (type === 'letter') {
        if (!char) {
          // Sıradaki hedef harfin çıkma olasılığı yüksek olsun (%55)
          const curWord = e.currentWord.word
          const nextTarget = e.nextTargetChar
          if (Math.random() < 0.58 && nextTarget) {
            char = nextTarget
            isTargetLetter = true
          } else if (Math.random() < 0.75) {
            // Kelimenin diğer bir harfi
            char = curWord[Math.floor(Math.random() * curWord.length)]
            isTargetLetter = curWord.includes(char)
          } else {
            // Yanıltıcı harf
            const learned = getLearnedDistractorLetters(letter).map((l) => l.upper)
            const pool = learned.length > 0 ? learned : ['A', 'E', 'L', 'M', 'N', 'K', 'İ']
            char = pool[Math.floor(Math.random() * pool.length)]
            isTargetLetter = curWord.includes(char)
          }
        } else {
          isTargetLetter = e.currentWord.word.includes(char)
        }

        // Renk paleti
        const palette = ['#f43f5e', '#38bdf8', '#eab308', '#a855f7', '#10b981', '#fb923c']
        color = palette[Math.floor(Math.random() * palette.length)]
      } else if (type === 'freeze') {
        char = '❄️'
        color = '#67e8f9'
      } else if (type === 'frenzy') {
        char = '⚡'
        color = '#facc15'
      } else if (type === 'bomb') {
        char = '💣'
        color = '#1e293b'
      }

      e.spheres.push({
        id,
        type,
        char,
        x,
        y,
        vx,
        vy,
        radius,
        rotation,
        vRot,
        color,
        isTargetLetter,
        isNextTarget: char === e.nextTargetChar,
        sliced: false,
      })
    },
    [gameMode, letter]
  )

  // ============================================================================
  // KESİLME VE İKİYE BÖLÜNME FİZİĞİ (SPLIT & SCREEN JUICE)
  // ============================================================================
  const sliceSphere = useCallback(
    (sphere: FlyingSphere, sliceAngle: number) => {
      const e = engineRef.current
      if (sphere.sliced) return
      sphere.sliced = true

      // 1. Ekran Sarsıntısı (Screen Shake) ve Mikro Donma (Hit-Stop)
      e.screenShake = sphere.type === 'bomb' ? 14 : 6
      e.hitStop = 0.04 // 40 milisaniyelik vuruş ağırlığı

      // 2. Parçacık Patlaması (25 adet renkli meyve suyu parçacığı)
      for (let i = 0; i < 26; i++) {
        const speed = Math.random() * 320 + 80
        const pAngle = Math.random() * Math.PI * 2
        e.particles.push({
          x: sphere.x,
          y: sphere.y,
          vx: Math.cos(pAngle) * speed,
          vy: Math.sin(pAngle) * speed,
          radius: Math.random() * 5 + 2.5,
          color: sphere.type === 'bomb' ? '#ef4444' : sphere.color,
          alpha: 1,
          gravity: 520,
        })
      }

      // 3. Arka Plana Leke Yapışması (Decal Splatter)
      e.splatters.push({
        x: sphere.x,
        y: sphere.y,
        radius: Math.random() * 25 + 20,
        color: sphere.type === 'bomb' ? 'rgba(30, 41, 59, 0.45)' : sphere.color,
        alpha: 0.55,
      })

      // 4. İKİYE BÖLÜNME (TWO HALVES PHYSICS)
      const perpAngle = sliceAngle + Math.PI / 2
      const spreadSpeed = 160

      // Sol Yarı
      e.halves.push({
        id: `${sphere.id}_left`,
        char: sphere.char,
        color: sphere.color,
        x: sphere.x - Math.cos(perpAngle) * 8,
        y: sphere.y - Math.sin(perpAngle) * 8,
        vx: sphere.vx - Math.cos(perpAngle) * spreadSpeed,
        vy: sphere.vy - 60 - Math.sin(perpAngle) * spreadSpeed,
        rotation: sphere.rotation,
        vRot: -4.8,
        radius: sphere.radius,
        sliceAngle,
        side: 'left',
        alpha: 1,
      })

      // Sağ Yarı
      e.halves.push({
        id: `${sphere.id}_right`,
        char: sphere.char,
        color: sphere.color,
        x: sphere.x + Math.cos(perpAngle) * 8,
        y: sphere.y + Math.sin(perpAngle) * 8,
        vx: sphere.vx + Math.cos(perpAngle) * spreadSpeed,
        vy: sphere.vy - 60 + Math.sin(perpAngle) * spreadSpeed,
        rotation: sphere.rotation,
        vRot: 4.8,
        radius: sphere.radius,
        sliceAngle,
        side: 'right',
        alpha: 1,
      })

      // 5. ÖZEL KÜRE ETKİLERİ VE PUANLAMA
      if (sphere.type === 'bomb') {
        samuraiAudio.playBombExplosion()
        if (gameMode === 'eylul_mina') {
          // Çocuk modunda sadece komik mürekkep sıçraması ve kıkırdama!
          samuraiAudio.playGiggle()
          setInkSplatAlpha(1)
          e.floatingTexts.push({
            id: `text_${e.nextId++}`,
            text: 'MÜREKKEP! Hihihi! 🫧',
            x: sphere.x,
            y: sphere.y - 30,
            color: '#c084fc',
            alpha: 1,
            scale: 1.3,
            vy: -70,
          })
        } else {
          // Yetişkin modunda Can kaybı ve kombo sıfırlama!
          setHearts((prev) => {
            const nextHearts = prev - 1
            if (nextHearts <= 0) {
              setIsGameOver(true)
            }
            return Math.max(0, nextHearts)
          })
          setComboCount(0)
          e.floatingTexts.push({
            id: `text_${e.nextId++}`,
            text: 'BOMBA! -1 CAN 💥',
            x: sphere.x,
            y: sphere.y - 30,
            color: '#ef4444',
            alpha: 1,
            scale: 1.4,
            vy: -80,
          })
        }
        return
      }

      if (sphere.type === 'freeze') {
        samuraiAudio.playFreezeSound()
        setFreezeTimer(5)
        e.floatingTexts.push({
          id: `text_${e.nextId++}`,
          text: '❄️ AĞIR ÇEKİM (SLOW-MO)!',
          x: sphere.x,
          y: sphere.y - 30,
          color: '#67e8f9',
          alpha: 1,
          scale: 1.3,
          vy: -60,
        })
        return
      }

      if (sphere.type === 'frenzy') {
        samuraiAudio.playFrenzySound()
        setFrenzyTimer(5)
        e.floatingTexts.push({
          id: `text_${e.nextId++}`,
          text: '⚡ ÇILGINLIK (2X PUAN)!',
          x: sphere.x,
          y: sphere.y - 30,
          color: '#facc15',
          alpha: 1,
          scale: 1.4,
          vy: -60,
        })
        // Ekrandan hızlı doğru harfler fırlat
        for (let k = 0; k < 3; k++) {
          setTimeout(() => spawnSphere('letter', e.nextTargetChar), k * 220)
        }
        return
      }

      // Normal Harf Kesildiğinde
      samuraiAudio.playSlice()

      // Tek kılıç savuruşundaki kombo takibi
      e.currentComboInSwipe += 1
      const isFrenzy = frenzyTimer > 0
      const multiplier = (isFrenzy ? 2 : 1) * Math.max(1, e.currentComboInSwipe)
      const basePoints = 50 * multiplier
      setScore((prev) => {
        const nextScore = prev + basePoints
        if (nextScore > highScore) {
          setHighScore(nextScore)
          try {
            localStorage.setItem(HIGH_SCORE_KEY, nextScore.toString())
          } catch {
            // ignore
          }
        }
        return nextScore
      })

      // Kombo Floating Text
      if (e.currentComboInSwipe >= 2) {
        samuraiAudio.playCombo(e.currentComboInSwipe)
        setComboCount(e.currentComboInSwipe)
        e.floatingTexts.push({
          id: `text_${e.nextId++}`,
          text: `${e.currentComboInSwipe}x SÜPER KOMBO! +${basePoints}`,
          x: sphere.x,
          y: sphere.y - 35,
          color: '#facc15',
          alpha: 1,
          scale: 1.25,
          vy: -80,
        })
      } else {
        e.floatingTexts.push({
          id: `text_${e.nextId++}`,
          text: `+${basePoints}`,
          x: sphere.x,
          y: sphere.y - 25,
          color: '#ffffff',
          alpha: 1,
          scale: 1.0,
          vy: -60,
        })
      }

      // 6. KELİME TAMAMLAMA İLERLEMESİ
      const targetChar = e.nextTargetChar
      if (sphere.char === targetChar) {
        setSlicedLetterIndices((prev) => {
          // Henüz kesilmemiş ilk boş indeksi bul
          const currentWordStr = e.currentWord.word
          let targetSlot = -1
          for (let i = 0; i < currentWordStr.length; i++) {
            if (currentWordStr[i] === targetChar && !prev.includes(i)) {
              targetSlot = i
              break
            }
          }

          if (targetSlot !== -1) {
            const nextSliced = [...prev, targetSlot]

            // Kelime Tamamlandı mı?
            if (nextSliced.length === currentWordStr.length) {
              // BÜYÜK KELİME ZAFERİ!
              samuraiAudio.playWordVictory()
              speakTurkish(`Tebrikler ${childName}! ${e.currentWord.word} kelimesini tamamladın!`)

              setScore((s) => s + 500 * (frenzyTimer > 0 ? 2 : 1))
              setWordsCompletedCount((c) => {
                const nextC = c + 1
                if (nextC >= 3) {
                  onComplete?.()
                }
                return nextC
              })

              e.floatingTexts.push({
                id: `text_${e.nextId++}`,
                text: `🌟 ${e.currentWord.word} TAMAMLANDI! +500`,
                x: 400,
                y: 240,
                color: '#4ade80',
                alpha: 1,
                scale: 1.5,
                vy: -50,
              })

              // 1 saniye sonra bir sonraki kelimeye geç
              setTimeout(() => {
                const nextIdx = (targetWordIndex + 1) % wordPool.current.length
                const nextW = wordPool.current[nextIdx] || {
                  word: 'ELMA',
                  emoji: '🍎',
                  hint: 'Elma',
                }
                setTargetWordIndex(nextIdx)
                setSlicedLetterIndices([])
                e.currentWord = nextW
                e.nextTargetChar = nextW.word[0]
              }, 1000)
            } else {
              updateNextTarget(nextSliced, e.currentWord)
            }
            return nextSliced
          }
          return prev
        })
      }
    },
    [frenzyTimer, gameMode, highScore, onComplete, targetWordIndex, updateNextTarget]
  )

  // ============================================================================
  // KILIÇ SAVURMA VE ÇARPIŞMA TESTİ (SEGMENT TO CIRCLE COLLISION)
  // ============================================================================
  const checkBladeCollisions = useCallback(
    (p1: TouchTrailPoint, p2: TouchTrailPoint) => {
      const e = engineRef.current
      const dx = p2.x - p1.x
      const dy = p2.y - p1.y
      const lenSq = dx * dx + dy * dy
      if (lenSq < 4) return // Çok küçük hareket

      const sliceAngle = Math.atan2(dy, dx)

      // Kılıç savurma sesi periyodu (hızlı ardışık whoosh)
      const now = performance.now()
      if (now - e.lastWhooshTime > 140) {
        e.lastWhooshTime = now
        samuraiAudio.playWhoosh()
      }

      e.spheres.forEach((sphere) => {
        if (sphere.sliced) return

        // Segment ile Çember Arasındaki En Kısa Mesafe Testi
        const t = Math.max(
          0,
          Math.min(1, ((sphere.x - p1.x) * dx + (sphere.y - p1.y) * dy) / lenSq)
        )
        const closestX = p1.x + t * dx
        const closestY = p1.y + t * dy
        const dist = Math.hypot(sphere.x - closestX, sphere.y - closestY)

        // Çarpışma Gerçekleşti!
        if (dist <= sphere.radius + 12) {
          sliceSphere(sphere, sliceAngle)
        }
      })
    },
    [sliceSphere]
  )

  // ============================================================================
  // POINTER / TOUCH ETKİLEŞİM HANDLERLARI
  // ============================================================================
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    isPointerDownRef.current = true
    trailRef.current = [{ x, y, time: performance.now() }]
    engineRef.current.currentComboInSwipe = 0
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current) return
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = (e.clientX - rect.left) * scaleX
    const y = (e.clientY - rect.top) * scaleY

    const now = performance.now()
    const trail = trailRef.current
    const prev = trail[trail.length - 1]

    trail.push({ x, y, time: now })
    if (prev) {
      checkBladeCollisions(prev, { x, y, time: now })
    }
  }

  const handlePointerUp = () => {
    isPointerDownRef.current = false
    engineRef.current.currentComboInSwipe = 0
  }

  // ============================================================================
  // ZAMAN VE GÜÇLENDİRME TICK DÖNGÜSÜ (1 SANİYELİK)
  // ============================================================================
  useEffect(() => {
    if (!isPlaying || isGameOver) return
    const timer = setInterval(() => {
      // Slow-mo sayacı
      setFreezeTimer((prev) => Math.max(0, prev - 1))
      // Frenzy sayacı
      setFrenzyTimer((prev) => Math.max(0, prev - 1))
      // Mürekkep lekesi solması
      setInkSplatAlpha((prev) => Math.max(0, prev - 0.2))

      // Yetişkin Time Attack Modu
      if (gameMode === 'captain_pro' && adultSubMode === 'time_attack') {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsGameOver(true)
            playSoundEffect('fanfare')
            return 0
          }
          return prev - 1
        })
      }
    }, 1000)

    return () => clearInterval(timer)
  }, [isPlaying, isGameOver, gameMode, adultSubMode])

  // ============================================================================
  // ANA 60 FPS CANVAS MOTORU (DELTA TIME TABANLI)
  // ============================================================================
  useEffect(() => {
    if (!isPlaying) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    const e = engineRef.current
    e.lastTime = performance.now()

    const render = (now: number) => {
      let dt = Math.min((now - e.lastTime) / 1000, 0.05)
      e.lastTime = now

      // Hit-stop (Mikro donma kontrolü)
      if (e.hitStop > 0) {
        e.hitStop -= dt
        animId = requestAnimationFrame(render)
        return
      }

      // Freeze (Slow-mo) çarpanı
      const timeScale = freezeTimer > 0 ? 0.4 : 1.0
      const scaledDt = dt * timeScale

      const w = canvas.width
      const h = canvas.height

      // 1. Kürelerin Doğuş Zamanlaması (Spawn Timer)
      e.spawnTimer += dt
      const targetInterval =
        freezeTimer > 0 ? 2.4 : frenzyTimer > 0 ? 0.75 : e.spawnInterval
      if (e.spawnTimer >= targetInterval) {
        e.spawnTimer = 0
        spawnSphere()
        // Yetişkin modunda salvo fırlatması
        if (gameMode === 'captain_pro' && Math.random() < 0.45) {
          setTimeout(() => spawnSphere(), 150)
          setTimeout(() => spawnSphere(), 300)
        }
      }

      // 2. Kılıç İzi Noktalarını Temizle (160ms'den eskileri sil)
      trailRef.current = trailRef.current.filter((p) => now - p.time < 160)

      // 3. FİZİK GÜNCELLEMESİ: KÜRELER
      const gravity = gameMode === 'eylul_mina' ? 420 : 700
      for (let i = e.spheres.length - 1; i >= 0; i--) {
        const s = e.spheres[i]
        if (s.sliced) {
          e.spheres.splice(i, 1)
          continue
        }

        s.vy += gravity * scaledDt
        s.x += s.vx * scaledDt
        s.y += s.vy * scaledDt
        s.rotation += s.vRot * scaledDt

        // Ekranın altına düştü mü?
        if (s.y > h + 70 && s.vy > 0) {
          // Yetişkin modunda doğru harf kaçırılırsa can kaybedilir
          if (gameMode === 'captain_pro' && s.isNextTarget && adultSubMode === 'arcade') {
            setHearts((h) => {
              const nh = h - 1
              if (nh <= 0) setIsGameOver(true)
              return Math.max(0, nh)
            })
            setComboCount(0)
            samuraiAudio.playGiggle()
          }
          e.spheres.splice(i, 1)
        }
      }

      // 4. FİZİK GÜNCELLEMESİ: KESİLMİŞ YARIMLAR (TWO HALVES)
      for (let i = e.halves.length - 1; i >= 0; i--) {
        const half = e.halves[i]
        half.vy += (gravity + 80) * scaledDt
        half.x += half.vx * scaledDt
        half.y += half.vy * scaledDt
        half.rotation += half.vRot * scaledDt
        half.alpha -= scaledDt * 0.4

        if (half.y > h + 80 || half.alpha <= 0) {
          e.halves.splice(i, 1)
        }
      }

      // 5. FİZİK GÜNCELLEMESİ: PARÇACIKLAR
      for (let i = e.particles.length - 1; i >= 0; i--) {
        const p = e.particles[i]
        p.vy += p.gravity * scaledDt
        p.x += p.vx * scaledDt
        p.y += p.vy * scaledDt
        p.alpha -= scaledDt * 1.5

        if (p.alpha <= 0) {
          e.particles.splice(i, 1)
        }
      }

      // 6. FİZİK GÜNCELLEMESİ: FLOATING TEXTS
      for (let i = e.floatingTexts.length - 1; i >= 0; i--) {
        const ft = e.floatingTexts[i]
        ft.y += ft.vy * scaledDt
        ft.alpha -= scaledDt * 1.1
        if (ft.alpha <= 0) {
          e.floatingTexts.splice(i, 1)
        }
      }

      // 7. LEKELERİN SOLMASI
      for (let i = e.splatters.length - 1; i >= 0; i--) {
        const splat = e.splatters[i]
        splat.alpha -= scaledDt * 0.05
        if (splat.alpha <= 0) {
          e.splatters.splice(i, 1)
        }
      }

      // 8. EKRAN SARSINTISI SÖNÜMLEMESİ
      e.screenShake *= Math.exp(-dt * 14)

      // ========================================================================
      // CANVAS ÇİZİMİ (GAME JUICE RENDERING)
      // ========================================================================
      ctx.save()

      // Ekran sarsıntısı offseti
      if (e.screenShake > 0.4) {
        const rx = (Math.random() - 0.5) * e.screenShake * 2
        const ry = (Math.random() - 0.5) * e.screenShake * 2
        ctx.translate(rx, ry)
      }

      // A. Arka Plan (Neon Dojo & Ahşap Doku)
      const bgGrad = ctx.createLinearGradient(0, 0, 0, h)
      bgGrad.addColorStop(0, '#0f172a')
      bgGrad.addColorStop(0.5, '#1e1b4b')
      bgGrad.addColorStop(1, '#090d16')
      ctx.fillStyle = bgGrad
      ctx.fillRect(0, 0, w, h)

      // Dojo Ahşap Çizgileri
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.035)'
      ctx.lineWidth = 1.5
      for (let y = 0; y < h; y += 45) {
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(w, y)
        ctx.stroke()
      }

      // B. Meyve Suyu Lekeleri (Decal Splatters)
      e.splatters.forEach((splat) => {
        ctx.save()
        ctx.globalAlpha = Math.max(0, splat.alpha)
        ctx.fillStyle = splat.color
        ctx.beginPath()
        ctx.arc(splat.x, splat.y, splat.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      // C. Fırlatılan Harf Küreleri (Flying Spheres)
      e.spheres.forEach((s) => {
        ctx.save()
        ctx.translate(s.x, s.y)
        ctx.rotate(s.rotation)

        // Çocuk Modunda Sıradaki Hedef Harf ise: ALTIN HALE VE PARILTI!
        if (gameMode === 'eylul_mina' && s.isNextTarget) {
          const auraPulse = Math.sin(now * 0.008) * 6 + 10
          ctx.strokeStyle = '#facc15'
          ctx.lineWidth = 4.5
          ctx.shadowBlur = 18
          ctx.shadowColor = '#facc15'
          ctx.beginPath()
          ctx.arc(0, 0, s.radius + auraPulse, 0, Math.PI * 2)
          ctx.stroke()
        }

        // Küre Gövdesi
        const sphereGrad = ctx.createRadialGradient(
          -s.radius * 0.35,
          -s.radius * 0.35,
          s.radius * 0.1,
          0,
          0,
          s.radius
        )
        sphereGrad.addColorStop(0, '#ffffff')
        sphereGrad.addColorStop(0.3, s.color)
        sphereGrad.addColorStop(1, '#0f172a')

        ctx.fillStyle = sphereGrad
        ctx.beginPath()
        ctx.arc(0, 0, s.radius, 0, Math.PI * 2)
        ctx.fill()

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
        ctx.lineWidth = 2.5
        ctx.stroke()

        // İkon veya Harf Çizimi
        ctx.fillStyle = '#ffffff'
        ctx.font = `900 ${s.type === 'letter' ? '28px' : '24px'} Fredoka, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(s.char, 0, 2)

        ctx.restore()
      })

      // D. Kesilmiş Yarımlar (Two Halves Slices)
      e.halves.forEach((half) => {
        ctx.save()
        ctx.globalAlpha = Math.max(0, half.alpha)
        ctx.translate(half.x, half.y)
        ctx.rotate(half.rotation)

        // Yarım küre çizimi (Clipping arc)
        ctx.fillStyle = half.color
        ctx.beginPath()
        if (half.side === 'left') {
          ctx.arc(0, 0, half.radius, Math.PI * 0.5, Math.PI * 1.5)
        } else {
          ctx.arc(0, 0, half.radius, -Math.PI * 0.5, Math.PI * 0.5)
        }
        ctx.closePath()
        ctx.fill()

        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 2
        ctx.stroke()

        // İç sulu etli doku çizgisi
        ctx.fillStyle = '#fef08a'
        ctx.beginPath()
        if (half.side === 'left') {
          ctx.arc(0, 0, half.radius * 0.45, Math.PI * 0.5, Math.PI * 1.5)
        } else {
          ctx.arc(0, 0, half.radius * 0.45, -Math.PI * 0.5, Math.PI * 0.5)
        }
        ctx.closePath()
        ctx.fill()

        ctx.restore()
      })

      // E. Sıvı Parçacıkları (Juice Particles)
      e.particles.forEach((p) => {
        ctx.save()
        ctx.globalAlpha = Math.max(0, p.alpha)
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      })

      // F. KILIÇ İZİ (NEON BLADE TRAIL - FRUIT NINJA STYLE)
      const trail = trailRef.current
      if (trail.length >= 2) {
        ctx.save()
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'

        // Neon Glow Katmanı
        ctx.shadowBlur = 22
        ctx.shadowColor = freezeTimer > 0 ? '#38bdf8' : '#ec4899'

        for (let i = 1; i < trail.length; i++) {
          const p1 = trail[i - 1]
          const p2 = trail[i]
          const progress = i / trail.length // 0'dan 1'e incelme

          ctx.strokeStyle =
            freezeTimer > 0
              ? `rgba(56, 189, 248, ${progress})`
              : `rgba(244, 63, 94, ${progress})`
          ctx.lineWidth = progress * 13 + 1.5

          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.stroke()
        }

        // Beyaz keskin iç çekirdek çizgisi
        ctx.shadowBlur = 4
        ctx.shadowColor = '#ffffff'
        ctx.strokeStyle = '#ffffff'
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(trail[0].x, trail[0].y)
        for (let i = 1; i < trail.length; i++) {
          ctx.lineTo(trail[i].x, trail[i].y)
        }
        ctx.stroke()
        ctx.restore()
      }

      // G. Yüzen Yazılar (Floating Texts)
      e.floatingTexts.forEach((ft) => {
        ctx.save()
        ctx.globalAlpha = Math.max(0, ft.alpha)
        ctx.fillStyle = ft.color
        ctx.shadowBlur = 12
        ctx.shadowColor = ft.color
        ctx.font = `900 ${Math.round(24 * ft.scale)}px Fredoka, sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(ft.text, ft.x, ft.y)
        ctx.restore()
      })

      // H. Buz Kristali Vignette (Slow-mo Aktifken)
      if (freezeTimer > 0) {
        const frostGrad = ctx.createRadialGradient(
          w / 2,
          h / 2,
          h * 0.35,
          w / 2,
          h / 2,
          h * 0.7
        )
        frostGrad.addColorStop(0, 'rgba(56, 189, 248, 0)')
        frostGrad.addColorStop(1, 'rgba(56, 189, 248, 0.32)')
        ctx.fillStyle = frostGrad
        ctx.fillRect(0, 0, w, h)
      }

      // I. Mürekkep Lekesi Katmanı (Çocuk Modu)
      if (inkSplatAlpha > 0.05) {
        ctx.save()
        ctx.globalAlpha = inkSplatAlpha * 0.75
        ctx.fillStyle = '#3b0764'
        ctx.beginPath()
        ctx.arc(w * 0.35, h * 0.45, 110, 0, Math.PI * 2)
        ctx.arc(w * 0.65, h * 0.55, 90, 0, Math.PI * 2)
        ctx.arc(w * 0.5, h * 0.38, 70, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      ctx.restore() // Screen shake pop

      animId = requestAnimationFrame(render)
    }

    animId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animId)
  }, [isPlaying, freezeTimer, frenzyTimer, inkSplatAlpha, gameMode, adultSubMode, spawnSphere])

  // ============================================================================
  // YENİDEN BAŞLATMA
  // ============================================================================
  const restartGame = () => {
    playSoundEffect('fanfare')
    setScore(0)
    setHearts(3)
    setTimeLeft(60)
    setIsGameOver(false)
    setFreezeTimer(0)
    setFrenzyTimer(0)
    setInkSplatAlpha(0)
    setWordsCompletedCount(0)
    setSlicedLetterIndices([])

    const e = engineRef.current
    e.spheres = []
    e.halves = []
    e.particles = []
    e.floatingTexts = []
    e.screenShake = 0
    e.hitStop = 0

    const initialWord = wordPool.current[0] || { word: 'ELMA', emoji: '🍎', hint: 'Elma' }
    e.currentWord = initialWord
    e.nextTargetChar = initialWord.word[0]
    setTargetWordIndex(0)
  }

  const currentWord = engineRef.current.currentWord

  return (
    <div className="neon-samurai-wrapper">
      {/* 1. BAŞLANGIÇ VE MOD SEÇİM EKRANI (EĞER OYUN BAŞLAMADIYSA) */}
      {!isPlaying ? (
        <div className="samurai-intro-card">
          <div className="samurai-hero-icon">
            <Swords size={38} color="#f43f5e" />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <h2 className="samurai-hero-title">Neon Kılıç: Harf Samurayı</h2>
            {completed && <span className="samurai-completed-tag">✓ Tamamlandı</span>}
          </div>
          <p className="samurai-hero-desc">
            Kılıcını savur, havada uçan harf kürelerini ikiye böl ve gizli kelimeleri tamamla!
          </p>

          <div className="samurai-modes-selection">
            {/* Çırak Modu: Eylül Mina (6 Yaş) */}
            <div
              className={`mode-card ${gameMode === 'eylul_mina' ? 'selected' : ''}`}
              onClick={() => {
                playSoundEffect('pop')
                setGameMode('eylul_mina')
              }}
            >
              <div className="mode-card-badge">👧 ÇOCUK MODU</div>
              <h3>Eylül Mina (Çırak Samuray)</h3>
              <p>
                Düşük yerçekimi, altın haleli ipucu harfler, patlamayan eğlenceli mürekkep bombaları!
              </p>
              <span className="mode-highlight-text">💖 Sonsuz Can • 2-4 Harfli Kelimeler</span>
            </div>

            {/* Usta Modu: Kaptan / Yetişkin */}
            <div
              className={`mode-card ${gameMode === 'captain_pro' ? 'selected' : ''}`}
              onClick={() => {
                playSoundEffect('pop')
                setGameMode('captain_pro')
              }}
            >
              <div className="mode-card-badge pro">👨 KAPTAN PRO</div>
              <h3>Usta Samuray (Arcade)</h3>
              <p>Hızlı çoklu salvo fırlatmaları, tehlikeli korsan bombaları ve 5-8 harfli kelimeler!</p>
              <div className="submode-pill-row" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  className={`submode-btn ${adultSubMode === 'arcade' ? 'active' : ''}`}
                  onClick={() => setAdultSubMode('arcade')}
                >
                  3 Canlı Arcade
                </button>
                <button
                  type="button"
                  className={`submode-btn ${adultSubMode === 'time_attack' ? 'active' : ''}`}
                  onClick={() => setAdultSubMode('time_attack')}
                >
                  60s Time Attack
                </button>
              </div>
            </div>
          </div>

          <button
            type="button"
            className="btn-start-samurai"
            onClick={() => {
              samuraiAudio.playWhoosh()
              playSoundEffect('fanfare')
              setIsPlaying(true)
              restartGame()
            }}
          >
            <Play size={24} fill="#ffffff" />
            <span>KILICINI KUŞAN VE BAŞLA!</span>
          </button>
        </div>
      ) : (
        /* 2. OYUN ALANI VE ÜST HUD */
        <div className="samurai-gameplay-container">
          {/* ÜST BİLGİ VE KELİME TAKİP ÇUBUĞU (HUD) */}
          <div className="samurai-hud-top">
            {/* Sol: Skor ve Kombo */}
            <div className="hud-left-stats">
              <div className="stat-pill score-pill">
                <Trophy size={18} color="#facc15" />
                <span className="stat-num">{score}</span>
              </div>
              {comboCount >= 2 && (
                <div className="stat-pill combo-pill">
                  <Zap size={16} color="#facc15" />
                  <span>{comboCount}x Kombo!</span>
                </div>
              )}
            </div>

            {/* Orta: HEDEF KELİME VE HARF KUTULARI */}
            <div className="hud-target-word-board">
              <div className="word-emoji-pill">{currentWord.emoji}</div>
              <div className="word-letters-track">
                {currentWord.word.split('').map((ch, idx) => {
                  const isSliced = slicedLetterIndices.includes(idx)
                  const isNext =
                    !isSliced &&
                    ch === engineRef.current.nextTargetChar &&
                    idx ===
                      currentWord.word.split('').findIndex((c, i) => c === ch && !slicedLetterIndices.includes(i))

                  return (
                    <div
                      key={idx}
                      className={`word-slot-box ${isSliced ? 'sliced' : ''} ${
                        isNext ? 'next-target' : ''
                      }`}
                    >
                      {isSliced ? ch : isNext ? ch : '_'}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Sağ: Canlar / Zaman & Çıkış */}
            <div className="hud-right-stats">
              {gameMode === 'eylul_mina' ? (
                <div className="stat-pill infinity-pill">
                  <Heart size={18} fill="#ec4899" color="#ec4899" />
                  <span>Sonsuz Enerji</span>
                </div>
              ) : adultSubMode === 'arcade' ? (
                <div className="stat-pill hearts-pill">
                  {[0, 1, 2].map((idx) => (
                    <Heart
                      key={idx}
                      size={20}
                      fill={idx < hearts ? '#ef4444' : 'none'}
                      color={idx < hearts ? '#ef4444' : '#64748b'}
                    />
                  ))}
                </div>
              ) : (
                <div className={`stat-pill timer-pill ${timeLeft < 15 ? 'danger' : ''}`}>
                  <Clock size={18} />
                  <span>{timeLeft}s</span>
                </div>
              )}

              <button
                type="button"
                className="btn-samurai-exit"
                onClick={() => setIsPlaying(false)}
                title="Menüye Dön"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>

          {/* AKTİF GÜÇLENDİRME İNDİKATÖRLERİ */}
          {(freezeTimer > 0 || frenzyTimer > 0) && (
            <div className="samurai-powerup-banner">
              {freezeTimer > 0 && (
                <span className="powerup-tag freeze">
                  <Snowflake size={16} /> Ağır Çekim: {freezeTimer}s
                </span>
              )}
              {frenzyTimer > 0 && (
                <span className="powerup-tag frenzy">
                  <Zap size={16} /> 2x Çılgınlık: {frenzyTimer}s
                </span>
              )}
            </div>
          )}

          {/* CANVAS KESME SAHNESİ */}
          <div className="samurai-canvas-wrapper">
            <canvas
              ref={canvasRef}
              width={800}
              height={560}
              className="samurai-canvas-element"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
            />

            <div className="samurai-watermark">
              <span>Parmağını veya fareyi ekranda kaydırarak harfleri kes! ⚔️</span>
            </div>
          </div>

          {/* OYUN BİTTİ EKRANI (GAME OVER MODAL) */}
          {isGameOver && (
            <div className="samurai-gameover-overlay">
              <div className="samurai-gameover-card">
                <div className="gameover-emblem">🏆</div>
                <h3>Dojo Antrenmanı Tamamlandı!</h3>
                <p>
                  Harika kılıç hareketleri! Toplam Puan: <b>{score}</b>
                </p>
                <div className="highscore-pill">
                  <Trophy size={18} color="#facc15" />
                  <span>En Yüksek Skor: {highScore}</span>
                </div>
                <div className="gameover-btns">
                  <button type="button" className="btn-restart" onClick={restartGame}>
                    Tekrar Oyna
                  </button>
                  {onExit && (
                    <button type="button" className="btn-finish" onClick={onExit}>
                      Dersi Tamamla
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ALT BİLGİ ÇUBUĞU */}
          <div className="samurai-footer-bar">
            <div className="words-cleared-count">
              <Sparkles size={16} color="#facc15" />
              <span>Tamamlanan Kelimeler: {wordsCompletedCount}</span>
            </div>

            <div className="pedagogy-samurai-note">
              <HelpCircle size={14} color="#94a3b8" />
              <span>
                Pedagojik Not: Harf Samurayı oyunu hızlı karar verme, harf ardışıklığı ve ince motor
                el-göz reflekslerini en üst seviyeye çıkarır.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
