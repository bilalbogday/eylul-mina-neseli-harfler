import { useEffect, useRef, useState, useCallback } from 'react'
import { RefreshCw, Volume2, Sparkles, Star, Flashlight } from 'lucide-react'
import {
  type LetterCurriculum,
  getLearnedDistractorLetters,
} from './curriculum'
import { playSoundEffect, speakTurkish } from './sound'

interface LetterDetectiveGameProps {
  letter?: LetterCurriculum
  childName: string
  completed?: boolean
  onComplete?: () => void
  onExit?: () => void
}

interface HiddenObject {
  id: string
  kind: 'target' | 'distractor_letter' | 'distractor_bug'
  label: string
  // Normalized coordinates (0..1) so responsive resize never loses object positions
  nx: number
  ny: number
  color: string
  hideSpotType: 'bush' | 'tree' | 'mushroom' | 'stone'
  found: boolean
  // Collecting animation progress (0 = not started, 0..1 = floating up & scaling, >=1 = done)
  collectAnim: number
  // Shake animation timer for distractors (0 = none, >0 = shaking)
  shakeTimer: number
  rotation: number
}

interface ConfettiParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  rotation: number
  vRot: number
  alpha: number
  shape: 'rect' | 'circle' | 'star'
}

interface ForestProp {
  type: 'tree' | 'bush' | 'mushroom' | 'stone'
  nx: number
  ny: number
  scale: number
  variant: number
}

const TARGET_COUNT = 5
const FLASHLIGHT_RADIUS = 110

const TARGET_COLORS = ['#fb923c', '#f472b6', '#facc15', '#38bdf8', '#a855f7']
const BUG_POOL = ['🐞', '🐛', '🍃', '🐌']
const CONFETTI_COLORS = ['#fbbf24', '#f43f5e', '#10b981', '#3b82f6', '#a855f7', '#fb923c', '#2dd4bf']

// Sabit ve dengeli orman dekorasyonu noktaları (ağaçlar, çalılar, mantarlar, taşlar)
const FOREST_PROPS: ForestProp[] = [
  // Arka plan ağaçlar
  { type: 'tree', nx: 0.08, ny: 0.36, scale: 1.05, variant: 0 },
  { type: 'tree', nx: 0.28, ny: 0.32, scale: 0.9, variant: 1 },
  { type: 'tree', nx: 0.52, ny: 0.34, scale: 1.1, variant: 0 },
  { type: 'tree', nx: 0.76, ny: 0.33, scale: 0.95, variant: 1 },
  { type: 'tree', nx: 0.92, ny: 0.38, scale: 1.05, variant: 0 },
  // Orta katman çalılar
  { type: 'bush', nx: 0.16, ny: 0.54, scale: 1.0, variant: 0 },
  { type: 'bush', nx: 0.42, ny: 0.50, scale: 1.1, variant: 1 },
  { type: 'bush', nx: 0.68, ny: 0.56, scale: 0.95, variant: 0 },
  { type: 'bush', nx: 0.86, ny: 0.53, scale: 1.0, variant: 1 },
  { type: 'bush', nx: 0.24, ny: 0.78, scale: 1.15, variant: 1 },
  { type: 'bush', nx: 0.78, ny: 0.80, scale: 1.1, variant: 0 },
  // Sevimli mantarlar
  { type: 'mushroom', nx: 0.12, ny: 0.72, scale: 1.0, variant: 0 },
  { type: 'mushroom', nx: 0.36, ny: 0.68, scale: 0.9, variant: 1 },
  { type: 'mushroom', nx: 0.61, ny: 0.74, scale: 1.05, variant: 0 },
  { type: 'mushroom', nx: 0.88, ny: 0.70, scale: 0.95, variant: 1 },
  // Taşlar / Kayalar
  { type: 'stone', nx: 0.19, ny: 0.86, scale: 1.0, variant: 0 },
  { type: 'stone', nx: 0.48, ny: 0.84, scale: 1.1, variant: 1 },
  { type: 'stone', nx: 0.66, ny: 0.88, scale: 0.95, variant: 0 },
]

// Saklanma aday noktaları (çalıların, ağaç gölgelerinin, mantarların ve taşların yanı)
const HIDING_ANCHORS: Array<{ nx: number; ny: number; spot: 'bush' | 'tree' | 'mushroom' | 'stone' }> = [
  { nx: 0.14, ny: 0.39, spot: 'tree' },
  { nx: 0.29, ny: 0.36, spot: 'tree' },
  { nx: 0.53, ny: 0.37, spot: 'tree' },
  { nx: 0.75, ny: 0.37, spot: 'tree' },
  { nx: 0.88, ny: 0.42, spot: 'tree' },
  { nx: 0.17, ny: 0.53, spot: 'bush' },
  { nx: 0.42, ny: 0.49, spot: 'bush' },
  { nx: 0.67, ny: 0.55, spot: 'bush' },
  { nx: 0.84, ny: 0.53, spot: 'bush' },
  { nx: 0.25, ny: 0.76, spot: 'bush' },
  { nx: 0.77, ny: 0.78, spot: 'bush' },
  { nx: 0.13, ny: 0.70, spot: 'mushroom' },
  { nx: 0.37, ny: 0.66, spot: 'mushroom' },
  { nx: 0.60, ny: 0.72, spot: 'mushroom' },
  { nx: 0.86, ny: 0.68, spot: 'mushroom' },
  { nx: 0.48, ny: 0.82, spot: 'stone' },
]

export function LetterDetectiveGame({
  letter,
  childName,
  onComplete,
  onExit,
}: LetterDetectiveGameProps) {
  // Varsayılan olarak kullanıcının istediği "T" harfi, veya ders içinden açıldıysa o harf
  const defaultTargetUpper = letter?.upper || 'T'
  const [targetChar, setTargetChar] = useState<string>(defaultTargetUpper)
  const [foundCount, setFoundCount] = useState<number>(0)
  const [isVictory, setIsVictory] = useState<boolean>(false)
  const [wrongFeedbackText, setWrongFeedbackText] = useState<string | null>(null)

  // Harf değişirse (ders içinden) hedef harfi güncelle
  useEffect(() => {
    if (letter?.upper) {
      setTargetChar(letter.upper)
    }
  }, [letter?.upper])

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const maskCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)

  // Oyun içi mutasyonlu referanslar (60 FPS gecikmesiz çizim için)
  const objectsRef = useRef<HiddenObject[]>([])
  const confettiRef = useRef<ConfettiParticle[]>([])
  const pointerRef = useRef<{ x: number; y: number; active: boolean }>({
    x: 240,
    y: 230,
    active: true,
  })
  const darknessOpacityRef = useRef<number>(0.93)
  const isVictoryRef = useRef<boolean>(false)
  const lastTouchTimeRef = useRef<number>(0)
  const starsTwinkleRef = useRef<Array<{ nx: number; ny: number; r: number; phase: number }>>([])

  // Gece gökyüzü yıldızlarını bir kez oluştur
  useEffect(() => {
    const stars = []
    for (let i = 0; i < 28; i++) {
      stars.push({
        nx: ((i * 37) % 94 + 3) / 100,
        ny: ((i * 19) % 24 + 3) / 100,
        r: (i % 3) + 1.2,
        phase: i * 0.7,
      })
    }
    starsTwinkleRef.current = stars
  }, [])

  // Konfeti patlatma yardımcı fonksiyonu
  const spawnConfettiBurst = useCallback((cx: number, cy: number, count: number, fullScreen = false) => {
    const canvas = canvasRef.current
    const w = canvas ? canvas.width : 600
    for (let i = 0; i < count; i++) {
      const angle = fullScreen ? Math.random() * Math.PI + Math.PI * 0.15 : Math.random() * Math.PI * 2
      const speed = fullScreen ? 2 + Math.random() * 5 : 2 + Math.random() * 6.5
      confettiRef.current.push({
        x: fullScreen ? Math.random() * w : cx,
        y: fullScreen ? -10 - Math.random() * 80 : cy,
        vx: fullScreen ? (Math.random() - 0.5) * 4 : Math.cos(angle) * speed,
        vy: fullScreen ? 2.5 + Math.random() * 4.5 : Math.sin(angle) * speed - 2.2,
        size: 6 + Math.random() * 6,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        alpha: 1,
        shape: i % 3 === 0 ? 'star' : i % 2 === 0 ? 'circle' : 'rect',
      })
    }
  }, [])

  // Oyunu başlatma / sıfırlama
  const initGame = useCallback(
    (charToUse: string, announceAudio = true) => {
      // Saklanma noktalarını karıştır
      const shuffledAnchors = [...HIDING_ANCHORS].sort(() => Math.random() - 0.5)

      // Birbirine çok yakın olmayan noktaları seç
      const selectedAnchors: typeof HIDING_ANCHORS = []
      for (const candidate of shuffledAnchors) {
        const tooClose = selectedAnchors.some(
          (a) => Math.hypot(a.nx - candidate.nx, a.ny - candidate.ny) < 0.14
        )
        if (!tooClose) {
          selectedAnchors.push(candidate)
        }
        if (selectedAnchors.length >= TARGET_COUNT + 6) break
      }

      const newObjects: HiddenObject[] = []

      // 1. 5 adet hedef harf ("T" veya seçili harf)
      for (let i = 0; i < TARGET_COUNT; i++) {
        const anchor = selectedAnchors[i] || shuffledAnchors[i]
        // Küçük rastgele sapma ekle (ekran dışına taşmayacak güvenli sınırlar içinde)
        const nx = Math.min(0.88, Math.max(0.12, anchor.nx + (Math.random() - 0.5) * 0.03))
        const ny = Math.min(0.85, Math.max(0.34, anchor.ny + (Math.random() - 0.5) * 0.03))
        newObjects.push({
          id: `target_${i}`,
          kind: 'target',
          label: charToUse,
          nx,
          ny,
          color: TARGET_COLORS[i % TARGET_COLORS.length],
          hideSpotType: anchor.spot,
          found: false,
          collectAnim: 0,
          shakeTimer: 0,
          rotation: (Math.random() - 0.5) * 0.22,
        })
      }

      // 2. Yalnızca öğrenilmiş harflerden 3 adet çeldirici harf (Maarif modeli kuralı)
      const learnedDistractors = getLearnedDistractorLetters(charToUse).map((l) => l.upper)
      const distractorLetters: string[] = []
      if (learnedDistractors.length > 0) {
        for (let i = 0; i < 3; i++) {
          distractorLetters.push(learnedDistractors[i % learnedDistractors.length])
        }
      }
      distractorLetters.forEach((dChar, idx) => {
        const anchor = selectedAnchors[TARGET_COUNT + idx] || shuffledAnchors[TARGET_COUNT + idx]
        if (!anchor) return
        newObjects.push({
          id: `dist_letter_${idx}`,
          kind: 'distractor_letter',
          label: dChar,
          nx: Math.min(0.88, Math.max(0.12, anchor.nx)),
          ny: Math.min(0.85, Math.max(0.35, anchor.ny)),
          color: '#94a3b8',
          hideSpotType: anchor.spot,
          found: false,
          collectAnim: 0,
          shakeTimer: 0,
          rotation: (Math.random() - 0.5) * 0.25,
        })
      })

      // 3. 3 adet sevimli böcek / yaprak dikkat dağıtıcı
      BUG_POOL.slice(0, 3).forEach((bugEmoji, idx) => {
        const anchor =
          selectedAnchors[TARGET_COUNT + 3 + idx] || shuffledAnchors[TARGET_COUNT + 3 + idx]
        if (!anchor) return
        newObjects.push({
          id: `dist_bug_${idx}`,
          kind: 'distractor_bug',
          label: bugEmoji,
          nx: Math.min(0.88, Math.max(0.12, anchor.nx)),
          ny: Math.min(0.86, Math.max(0.36, anchor.ny)),
          color: '#4ade80',
          hideSpotType: anchor.spot,
          found: false,
          collectAnim: 0,
          shakeTimer: 0,
          rotation: 0,
        })
      })

      objectsRef.current = newObjects
      confettiRef.current = []
      darknessOpacityRef.current = 0.93
      isVictoryRef.current = false
      setFoundCount(0)
      setIsVictory(false)
      setWrongFeedbackText(null)

      // El fenerini ekranın ortasında başlat
      const canvas = canvasRef.current
      if (canvas) {
        pointerRef.current = {
          x: canvas.width * 0.5,
          y: canvas.height * 0.52,
          active: true,
        }
      }

      if (announceAudio) {
        setTimeout(() => {
          speakTurkish(
            `Ormanda saklanan 5 tane ${charToUse} harfini bulabilir misin? El fenerini parmağınla gezdirerek onları ara!`
          )
        }, 250)
      }
    },
    []
  )

  // İlk yüklemede ve hedef harf değiştiğinde oyunu kur
  useEffect(() => {
    initGame(targetChar, true)
  }, [targetChar, initGame])

  // Canvas boyutunu dinamik ve responsive olarak ayarla (resize event)
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = containerRef.current
      const canvas = canvasRef.current
      if (!container || !canvas) return

      const rect = container.getBoundingClientRect()
      const width = Math.max(300, Math.floor(rect.width))
      // Mobil dikey ve yatay ekranlara kusursuz uyum
      const height = Math.max(380, Math.min(560, Math.floor(window.innerHeight * 0.62)))

      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width
        canvas.height = height

        if (!maskCanvasRef.current) {
          maskCanvasRef.current = document.createElement('canvas')
        }
        maskCanvasRef.current.width = width
        maskCanvasRef.current.height = height

        // Feneri yeni boyuta göre merkeze al
        pointerRef.current.x = width * 0.5
        pointerRef.current.y = height * 0.52
      }
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  // Tıklama / Dokunma kontrolü (Harf toplama veya yanıltıcı nesne sallanması)
  const checkObjectHitAt = useCallback(
    (x: number, y: number) => {
      if (isVictoryRef.current) return
      const canvas = canvasRef.current
      if (!canvas) return
      const w = canvas.width
      const h = canvas.height

      // Önce hedef harfleri kontrol et (çocuğun parmak dokunuşu için cömert ~44px yarıçap)
      for (const obj of objectsRef.current) {
        if (obj.found || obj.collectAnim > 0) continue
        const ox = obj.nx * w
        const oy = obj.ny * h
        const dist = Math.hypot(x - ox, y - oy)

        if (dist <= 46) {
          if (obj.kind === 'target') {
            // Doğru "T" harfi bulundu!
            obj.found = true
            obj.collectAnim = 0.01
            playSoundEffect('pling')
            spawnConfettiBurst(ox, oy, 26, false)

            const currentFound = objectsRef.current.filter(
              (o) => o.kind === 'target' && o.found
            ).length
            setFoundCount(currentFound)

            if (currentFound >= TARGET_COUNT) {
              // KAZANMA SENARYOSU (5/5 tamamlandı)
              isVictoryRef.current = true
              setIsVictory(true)
              onComplete?.()
              setTimeout(() => {
                playSoundEffect('applause')
                spawnConfettiBurst(w / 2, h / 3, 95, true)
                speakTurkish(
                  `Tebrikler ${childName}! Tüm ${targetChar} harflerini buldun! Harika bir dedektifsin!`
                )
              }, 350)
            } else {
              speakTurkish(`Harika! ${currentFound} oldu!`)
            }
            return
          } else {
            // Yanıltıcı harf veya böcek tıklandı: hafif sallanma efekti, puan gitmez
            obj.shakeTimer = 1.0
            playSoundEffect('error')
            const msg =
              obj.kind === 'distractor_letter'
                ? `Bu "${obj.label}" harfi! Biz "${targetChar}" harfini arıyoruz 🔦`
                : `Sevimli ${obj.label}! Ama biz "${targetChar}" harfini arıyoruz!`
            setWrongFeedbackText(msg)
            setTimeout(() => {
              setWrongFeedbackText((prev) => (prev === msg ? null : prev))
            }, 1800)
            return
          }
        }
      }
    },
    [childName, onComplete, spawnConfettiBurst, targetChar]
  )

  // Koordinat hesaplayıcı (Fail-safe: çoklu dokunmada sadece touches[0] baz alınır)
  const getCanvasPointFromTouch = (touch: React.Touch): { x: number; y: number } | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (touch.clientX - rect.left) * scaleX,
      y: (touch.clientY - rect.top) * scaleY,
    }
  }

  const getCanvasPointFromMouse = (e: React.MouseEvent): { x: number; y: number } | null => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    }
  }

  // Touch eventleri (Avuç içi fail-safe: sadece e.touches[0])
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    lastTouchTimeRef.current = Date.now()
    if (!e.touches || e.touches.length === 0) return
    const firstTouch = e.touches[0]
    const pt = getCanvasPointFromTouch(firstTouch)
    if (!pt) return
    pointerRef.current.x = pt.x
    pointerRef.current.y = pt.y
    pointerRef.current.active = true
    checkObjectHitAt(pt.x, pt.y)
  }

  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault()
    lastTouchTimeRef.current = Date.now()
    if (!e.touches || e.touches.length === 0) return
    const firstTouch = e.touches[0]
    const pt = getCanvasPointFromTouch(firstTouch)
    if (!pt) return
    pointerRef.current.x = pt.x
    pointerRef.current.y = pt.y
    pointerRef.current.active = true
  }

  // Mouse eventleri (Touch ile çakışmayı önlemek için lastTouchTimeRef kontrolü)
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (Date.now() - lastTouchTimeRef.current < 500) return
    const pt = getCanvasPointFromMouse(e)
    if (!pt) return
    pointerRef.current.x = pt.x
    pointerRef.current.y = pt.y
    pointerRef.current.active = true
    checkObjectHitAt(pt.x, pt.y)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (Date.now() - lastTouchTimeRef.current < 500) return
    const pt = getCanvasPointFromMouse(e)
    if (!pt) return
    pointerRef.current.x = pt.x
    pointerRef.current.y = pt.y
    pointerRef.current.active = true
  }

  // 60 FPS Canvas Çizim Döngüsü (requestAnimationFrame)
  useEffect(() => {
    let animationFrameId: number

    const drawTree = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      scale: number,
      variant: number
    ) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(scale, scale)

      // Ağaç gölgesi
      ctx.fillStyle = 'rgba(6, 15, 25, 0.45)'
      ctx.beginPath()
      ctx.ellipse(0, 48, 38, 12, 0, 0, Math.PI * 2)
      ctx.fill()

      // Gövde
      ctx.fillStyle = '#452719'
      ctx.beginPath()
      ctx.roundRect(-11, 0, 22, 48, 6)
      ctx.fill()

      // Yaprak katmanları (Cartoon çam / meşe ağacı)
      if (variant === 0) {
        const greens = ['#14532d', '#166534', '#15803d']
        greens.forEach((col, i) => {
          ctx.fillStyle = col
          ctx.beginPath()
          const topY = -68 + i * 18
          const halfW = 46 - i * 6
          ctx.moveTo(0, topY)
          ctx.lineTo(halfW, topY + 46)
          ctx.lineTo(-halfW, topY + 46)
          ctx.closePath()
          ctx.fill()
        })
      } else {
        ctx.fillStyle = '#115e59'
        ctx.beginPath()
        ctx.arc(-18, -12, 26, 0, Math.PI * 2)
        ctx.arc(18, -12, 26, 0, Math.PI * 2)
        ctx.arc(0, -34, 30, 0, Math.PI * 2)
        ctx.fill()

        ctx.fillStyle = '#0f766e'
        ctx.beginPath()
        ctx.arc(-10, -18, 20, 0, Math.PI * 2)
        ctx.arc(12, -20, 20, 0, Math.PI * 2)
        ctx.arc(0, -36, 22, 0, Math.PI * 2)
        ctx.fill()
      }

      ctx.restore()
    }

    const drawBush = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      scale: number,
      variant: number
    ) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(scale, scale)

      // Çalı gölgesi
      ctx.fillStyle = 'rgba(5, 12, 22, 0.4)'
      ctx.beginPath()
      ctx.ellipse(0, 16, 44, 10, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = variant === 0 ? '#166534' : '#15803d'
      ctx.beginPath()
      ctx.arc(-22, 2, 20, 0, Math.PI * 2)
      ctx.arc(22, 2, 20, 0, Math.PI * 2)
      ctx.arc(0, -8, 25, 0, Math.PI * 2)
      ctx.fill()

      // Çalı üstü küçük renkli orman meyveleri
      ctx.fillStyle = variant === 0 ? '#f43f5e' : '#fbbf24'
      ctx.beginPath()
      ctx.arc(-14, -4, 3.5, 0, Math.PI * 2)
      ctx.arc(8, -10, 3.5, 0, Math.PI * 2)
      ctx.arc(18, 2, 3.5, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }

    const drawMushroom = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      scale: number,
      variant: number
    ) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(scale, scale)

      // Mantar sapı
      ctx.fillStyle = '#fef3c7'
      ctx.beginPath()
      ctx.roundRect(-8, 0, 16, 22, 6)
      ctx.fill()

      // Mantar şapkası
      ctx.fillStyle = variant === 0 ? '#ef4444' : '#a855f7'
      ctx.beginPath()
      ctx.arc(0, 2, 22, Math.PI, 0, false)
      ctx.closePath()
      ctx.fill()

      // Benekler
      ctx.fillStyle = '#ffffff'
      ctx.beginPath()
      ctx.arc(-9, -8, 3.8, 0, Math.PI * 2)
      ctx.arc(2, -13, 4.2, 0, Math.PI * 2)
      ctx.arc(11, -6, 3.4, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }

    const drawStone = (
      ctx: CanvasRenderingContext2D,
      x: number,
      y: number,
      scale: number
    ) => {
      ctx.save()
      ctx.translate(x, y)
      ctx.scale(scale, scale)

      ctx.fillStyle = '#475569'
      ctx.beginPath()
      ctx.ellipse(0, 4, 26, 15, 0, 0, Math.PI * 2)
      ctx.fill()

      ctx.fillStyle = '#64748b'
      ctx.beginPath()
      ctx.ellipse(-4, 0, 20, 11, -0.1, 0, Math.PI * 2)
      ctx.fill()

      ctx.restore()
    }

    const renderFrame = (time: number) => {
      const canvas = canvasRef.current
      if (!canvas) {
        animationFrameId = requestAnimationFrame(renderFrame)
        return
      }
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        animationFrameId = requestAnimationFrame(renderFrame)
        return
      }

      const w = canvas.width
      const h = canvas.height
      const fx = pointerRef.current.x
      const fy = pointerRef.current.y

      // 1. ARKA PLAN: Koyu lacivert gece gökyüzü ve koyu yeşil orman zemini (2D Cartoon)
      const skyGrad = ctx.createLinearGradient(0, 0, 0, h)
      skyGrad.addColorStop(0, '#0b1528')
      skyGrad.addColorStop(0.32, '#102542')
      skyGrad.addColorStop(0.36, '#0f2e22')
      skyGrad.addColorStop(0.7, '#143d2b')
      skyGrad.addColorStop(1, '#0c261b')
      ctx.fillStyle = skyGrad
      ctx.fillRect(0, 0, w, h)

      // Gece gökyüzü parlayan yıldızlar ve hilal ay
      starsTwinkleRef.current.forEach((st) => {
        const twinkle = 0.45 + 0.55 * Math.sin(time * 0.003 + st.phase)
        ctx.fillStyle = `rgba(254, 240, 138, ${twinkle})`
        ctx.beginPath()
        ctx.arc(st.nx * w, st.ny * h, st.r, 0, Math.PI * 2)
        ctx.fill()
      })

      // Sevimli Hilal Ay
      ctx.save()
      ctx.fillStyle = '#fef08a'
      ctx.beginPath()
      ctx.arc(w * 0.85, h * 0.13, 24, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#0d1c33'
      ctx.beginPath()
      ctx.arc(w * 0.85 - 9, h * 0.13 - 4, 21, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()

      // Uzak orman tepeleri
      ctx.fillStyle = '#0d3124'
      ctx.beginPath()
      ctx.moveTo(0, h * 0.36)
      ctx.quadraticCurveTo(w * 0.25, h * 0.26, w * 0.52, h * 0.35)
      ctx.quadraticCurveTo(w * 0.78, h * 0.27, w, h * 0.36)
      ctx.lineTo(w, h)
      ctx.lineTo(0, h)
      ctx.closePath()
      ctx.fill()

      // Orman patikası (yumuşak kıvrımlı yol)
      ctx.fillStyle = '#1b4332'
      ctx.beginPath()
      ctx.ellipse(w * 0.5, h * 0.68, w * 0.42, h * 0.24, 0, 0, Math.PI * 2)
      ctx.fill()

      // 2. ORMAN NESNELERİ (Ağaçlar, çalılar, mantarlar ve taşlar)
      for (const prop of FOREST_PROPS) {
        const px = prop.nx * w
        const py = prop.ny * h
        if (prop.type === 'tree') drawTree(ctx, px, py, prop.scale, prop.variant)
        else if (prop.type === 'bush') drawBush(ctx, px, py, prop.scale, prop.variant)
        else if (prop.type === 'mushroom') drawMushroom(ctx, px, py, prop.scale, prop.variant)
        else if (prop.type === 'stone') drawStone(ctx, px, py, prop.scale)
      }

      // 3. SAKLANAN HARFLER VE DİKKAT DAĞITICILAR
      // KURAL: "T" harfleri karanlıkta tamamen görünmez olmalı, sadece fener ışığı üzerlerine geldiğinde net görünmeli.
      for (const obj of objectsRef.current) {
        // Bulunmuş ve animasyonu bitmiş harfleri artık çizme
        if (obj.found && obj.collectAnim >= 1) continue

        const baseX = obj.nx * w
        const baseY = obj.ny * h
        const distToFlashlight = Math.hypot(baseX - fx, baseY - fy)

        // Fenerin dışındayken tamamen görünmez (alpha = 0), fener üzerine geldiğinde net görünür (alpha = 1)
        let visibilityAlpha = 0
        if (isVictoryRef.current || obj.collectAnim > 0) {
          visibilityAlpha = 1
        } else if (distToFlashlight < FLASHLIGHT_RADIUS) {
          // Fener yarıçapı (110px) içinde yumuşak ve net şekilde belirmesi
          visibilityAlpha = Math.max(
            0,
            Math.min(1, (FLASHLIGHT_RADIUS - distToFlashlight) / 38)
          )
        }

        if (visibilityAlpha <= 0.01) {
          // Shake timer varsa yine de azalt
          if (obj.shakeTimer > 0) obj.shakeTimer = Math.max(0, obj.shakeTimer - 0.05)
          continue
        }

        let drawX = baseX
        let drawY = baseY
        let scale = 1
        let alpha = visibilityAlpha

        // Eğer harf yeni bulunduysa: yukarı doğru hafifçe süzülüp büyüyerek kaybolma animasyonu
        if (obj.collectAnim > 0 && obj.collectAnim < 1) {
          obj.collectAnim = Math.min(1, obj.collectAnim + 0.028)
          const p = obj.collectAnim
          drawY = baseY - p * 68
          scale = 1 + p * 0.65
          alpha = 1 - Math.pow(p, 1.5)
        }

        // Eğer yanıltıcı nesneye tıklandıysa: hafif sallanma (shake) efekti
        if (obj.shakeTimer > 0) {
          obj.shakeTimer = Math.max(0, obj.shakeTimer - 0.045)
          drawX += Math.sin(obj.shakeTimer * Math.PI * 10) * 7
        }

        ctx.save()
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha))
        ctx.translate(drawX, drawY)
        ctx.rotate(obj.rotation)
        ctx.scale(scale, scale)

        if (obj.kind === 'target') {
          // Hedef "T" Harfi: Sevimli, renkli, Fredoka yuvarlak font ve parlama halkası
          ctx.shadowColor = obj.color
          ctx.shadowBlur = obj.collectAnim > 0 ? 28 : 16

          // Harf arka plan rozeti (çalı/taş üzerinde net okunması için)
          ctx.fillStyle = 'rgba(15, 23, 42, 0.55)'
          ctx.beginPath()
          ctx.arc(0, 0, 27, 0, Math.PI * 2)
          ctx.fill()

          ctx.font = '900 44px "Fredoka", "Comic Sans MS", sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'

          // Beyaz dış kontur
          ctx.lineWidth = 6
          ctx.strokeStyle = '#ffffff'
          ctx.strokeText(obj.label, 0, 2)

          // Renkli iç dolgu
          ctx.fillStyle = obj.color
          ctx.fillText(obj.label, 0, 2)
        } else if (obj.kind === 'distractor_letter') {
          // Yanıltıcı harf (L, A, O vb.)
          ctx.font = '800 36px "Fredoka", "Comic Sans MS", sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.lineWidth = 4
          ctx.strokeStyle = '#1e293b'
          ctx.strokeText(obj.label, 0, 2)
          ctx.fillStyle = '#cbd5e1'
          ctx.fillText(obj.label, 0, 2)
        } else {
          // Sevimli böcek / yaprak
          ctx.font = '32px sans-serif'
          ctx.textAlign = 'center'
          ctx.textBaseline = 'middle'
          ctx.fillText(obj.label, 0, 0)
        }

        ctx.restore()
      }

      // 4. MASKELEME KATMANI (%93 opaklıkta rgba(10, 15, 30, 0.93) karanlık katman ve Fener Deliği)
      if (isVictoryRef.current) {
        // Kazanıldığında karanlık katman tamamen kalkar
        darknessOpacityRef.current = Math.max(0, darknessOpacityRef.current - 0.025)
      }

      if (darknessOpacityRef.current > 0.005) {
        let maskCanvas = maskCanvasRef.current
        if (!maskCanvas) {
          maskCanvas = document.createElement('canvas')
          maskCanvas.width = w
          maskCanvas.height = h
          maskCanvasRef.current = maskCanvas
        }
        const mCtx = maskCanvas.getContext('2d')
        if (mCtx) {
          mCtx.clearRect(0, 0, w, h)

          // Tüm ekranı kapatan %93 opaklıkta (rgba(10, 15, 30, 0.93)) karanlık katman
          mCtx.globalCompositeOperation = 'source-over'
          mCtx.fillStyle = `rgba(10, 15, 30, ${darknessOpacityRef.current})`
          mCtx.fillRect(0, 0, w, h)

          // El Feneri Efekti: Yarıçapı ~110px olan, kenarları yumuşak geçişli aydınlık delik
          mCtx.globalCompositeOperation = 'destination-out'
          const holeGrad = mCtx.createRadialGradient(
            fx,
            fy,
            FLASHLIGHT_RADIUS * 0.25,
            fx,
            fy,
            FLASHLIGHT_RADIUS
          )
          holeGrad.addColorStop(0, 'rgba(0, 0, 0, 1)')
          holeGrad.addColorStop(0.68, 'rgba(0, 0, 0, 0.92)')
          holeGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')

          mCtx.fillStyle = holeGrad
          mCtx.beginPath()
          mCtx.arc(fx, fy, FLASHLIGHT_RADIUS, 0, Math.PI * 2)
          mCtx.fill()

          // Maskeyi ana canvas üzerine uygula
          ctx.drawImage(maskCanvas, 0, 0)
        }

        // Fenerin merkezinde hafif sarımsı ışık hüzmesi ve fener çemberi (border-like glow)
        ctx.save()
        const beamGrad = ctx.createRadialGradient(fx, fy, 4, fx, fy, FLASHLIGHT_RADIUS)
        beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.22)')
        beamGrad.addColorStop(0.65, 'rgba(253, 224, 71, 0.09)')
        beamGrad.addColorStop(1, 'rgba(253, 224, 71, 0)')
        ctx.fillStyle = beamGrad
        ctx.beginPath()
        ctx.arc(fx, fy, FLASHLIGHT_RADIUS, 0, Math.PI * 2)
        ctx.fill()

        // Fener çemberi (border-like glow)
        ctx.strokeStyle = 'rgba(253, 224, 71, 0.45)'
        ctx.lineWidth = 3
        ctx.shadowColor = '#facc15'
        ctx.shadowBlur = 14
        ctx.beginPath()
        ctx.arc(fx, fy, FLASHLIGHT_RADIUS - 3, 0, Math.PI * 2)
        ctx.stroke()
        ctx.restore()
      }

      // 5. KONFETİ PARÇACIKLARI (Hem harf bulunduğunda hem oyun sonunda)
      for (let i = confettiRef.current.length - 1; i >= 0; i--) {
        const p = confettiRef.current[i]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.14 // yerçekimi
        p.rotation += p.vRot
        p.alpha -= 0.008

        if (p.alpha <= 0 || p.y > h + 30) {
          confettiRef.current.splice(i, 1)
          continue
        }

        ctx.save()
        ctx.globalAlpha = Math.max(0, p.alpha)
        ctx.translate(p.x, p.y)
        ctx.rotate(p.rotation)
        ctx.fillStyle = p.color

        if (p.shape === 'circle') {
          ctx.beginPath()
          ctx.arc(0, 0, p.size * 0.5, 0, Math.PI * 2)
          ctx.fill()
        } else if (p.shape === 'star') {
          ctx.fillRect(-p.size * 0.5, -p.size * 0.5, p.size, p.size)
        } else {
          ctx.fillRect(-p.size * 0.6, -p.size * 0.35, p.size * 1.2, p.size * 0.7)
        }
        ctx.restore()
      }

      animationFrameId = requestAnimationFrame(renderFrame)
    }

    animationFrameId = requestAnimationFrame(renderFrame)
    return () => cancelAnimationFrame(animationFrameId)
  }, [])

  return (
    <div className="detective-game-card">
      {/* ÜST BAR: Başlık, 5 Harf İkonu, Sayaç ve Yeniden Başlat Butonu */}
      <div className="detective-topbar">
        <div className="detective-title-group">
          <span className="detective-flashlight-badge">
            <Flashlight size={20} /> Karanlık Oda
          </span>
          <h3 className="detective-main-title">"{targetChar}" Harfi Dedektifi</h3>
        </div>

        <div className="detective-hud-right">
          {/* 5 adet sönük "T" harfi ikonu; her bulunan harfle renkli/yıldızlı hale gelir */}
          <div className="detective-letter-icons" aria-label="Bulunan Harf İkonları">
            {Array.from({ length: TARGET_COUNT }).map((_, idx) => {
              const isLit = idx < foundCount
              return (
                <div
                  key={idx}
                  className={`detective-target-slot ${isLit ? 'lit' : 'dim'}`}
                  title={isLit ? `${idx + 1}. ${targetChar} Bulundu!` : 'Henüz Bulunmadı'}
                >
                  <span className="slot-char">{targetChar}</span>
                  {isLit && <Star size={12} fill="#facc15" color="#eab308" className="slot-star" />}
                </div>
              )
            })}
          </div>

          <div className="detective-counter-pill">
            🌟 Bulunan: <strong>{foundCount} / {TARGET_COUNT}</strong>
          </div>

          <button
            type="button"
            className="detective-refresh-btn"
            onClick={() => {
              playSoundEffect('click')
              initGame(targetChar, true)
            }}
            title="Yeniden Başlat"
          >
            <RefreshCw size={18} />
            <span>Yeniden Başlat</span>
          </button>
        </div>
      </div>

      {/* Harf Seçici: Yalnızca bağımsız oyun modunda ve 1. grup harflerle */}
      {!letter && (
        <div className="detective-letter-selector">
          <span className="selector-label">Aranan Harf:</span>
          {['T', 'A', 'N', 'E', 'İ', 'L'].map((char) => (
            <button
              key={char}
              type="button"
              className={`detective-char-pill ${targetChar === char ? 'active' : ''}`}
              onClick={() => {
                playSoundEffect('click')
                setTargetChar(char)
              }}
            >
              {char === 'T' ? '🔦 T (Varsayılan)' : char}
            </button>
          ))}
        </div>
      )}

      {/* SEVİMLİ SESLENDİRME BALONU / ÜST YÖNERGE */}
      <div className="detective-speech-bubble">
        <div className="speech-owl-avatar">🦉</div>
        <p className="speech-text">
          Ormanda saklanan <strong>5 tane '{targetChar}' harfini</strong> bulabilir misin? El
          fenerini parmağınla gezdirerek onları ara!
        </p>
        <button
          type="button"
          className="speech-listen-btn"
          onClick={() => {
            playSoundEffect('pop')
            speakTurkish(
              `Ormanda saklanan 5 tane ${targetChar} harfini bulabilir misin? El fenerini parmağınla gezdirerek onları ara!`
            )
          }}
          title="Yönergeyi Sesli Dinle"
        >
          <Volume2 size={20} /> Dinle
        </button>
      </div>

      {/* YANILTICI NESNE UYARI BALONU (Puan gitmez, sadece sevimli geri bildirim) */}
      {wrongFeedbackText && !isVictory && (
        <div className="detective-gentle-hint">{wrongFeedbackText}</div>
      )}

      {/* HTML5 CANVAS KARANLIK ORMAN SAHNESİ */}
      <div ref={containerRef} className="detective-canvas-container">
        <canvas
          ref={canvasRef}
          className="detective-canvas"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
        />

        {/* KAZANMA SENARYOSU (GAME OVER) TEBRİK KARTI */}
        {isVictory && (
          <div className="detective-victory-overlay">
            <div className="detective-victory-card">
              <div className="victory-crown-badge">🌟🕵️‍♀️🔦</div>
              <h2>
                Tebrikler {childName}! Tüm '{targetChar}' Harflerini Buldun! 🌟
              </h2>
              <p>
                Karanlık ormandaki bütün saklı <strong>"{targetChar}"</strong> harflerini el
                fenerinle aydınlattın ve ormanı rengarenk yaptın!
              </p>
              <div className="detective-victory-buttons">
                <button
                  type="button"
                  className="btn-primary btn-large detective-play-again-btn"
                  onClick={() => {
                    playSoundEffect('fanfare')
                    initGame(targetChar, true)
                  }}
                >
                  <Sparkles size={22} /> Tekrar Oyna
                </button>
                {onExit && (
                  <button
                    type="button"
                    className="btn-secondary btn-large"
                    onClick={onExit}
                  >
                    Haritaya Dön
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
