import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { RotateCcw, Volume2, Sparkles, Award } from 'lucide-react'
import type { LetterCurriculum } from './curriculum'
import { playSoundEffect, speakTurkish } from './sound'

interface LighthouseTracingGameProps {
  letter?: LetterCurriculum
  childName: string
  completed?: boolean
  onComplete?: () => void
  onExit?: () => void
}

interface Waypoint {
  x: number // 0..100 %
  y: number // 0..100 %
}

interface StrokeDef {
  id: number
  points: Waypoint[]
  directionHint?: string // e.g. "Aşağıya doğru kayalım"
}

interface StarParticle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  alpha: number
  life: number
}

interface FireworkParticle {
  x: number
  y: number
  vx: number
  vy: number
  color: string
  alpha: number
  size: number
}

// MEB Dik Temel Harfleri ve 1-5 Rakamları için Sıralı Çizgi Vektörleri (Waypoints)
const STROKE_DATA: Record<string, StrokeDef[]> = {
  // A (3 Çizgi)
  A: [
    { id: 1, points: [{ x: 50, y: 16 }, { x: 24, y: 84 }], directionHint: 'Aşağıya doğru kayalım!' },
    { id: 2, points: [{ x: 50, y: 16 }, { x: 76, y: 84 }], directionHint: 'Sağa aşağıya doğru kayalım!' },
    { id: 3, points: [{ x: 34, y: 56 }, { x: 66, y: 56 }], directionHint: 'Soldan sağa doğru birleştirelim!' },
  ],
  a: [
    {
      id: 1,
      points: [
        { x: 64, y: 46 },
        { x: 44, y: 44 },
        { x: 32, y: 62 },
        { x: 46, y: 80 },
        { x: 64, y: 72 },
        { x: 64, y: 50 },
      ],
      directionHint: 'Yuvarlağı tamamlayalım!',
    },
    { id: 2, points: [{ x: 64, y: 44 }, { x: 64, y: 82 }], directionHint: 'Yukarıdan aşağıya çizgi çekelim!' },
  ],
  // N (3 Çizgi)
  N: [
    { id: 1, points: [{ x: 28, y: 16 }, { x: 28, y: 84 }], directionHint: 'Yukarıdan aşağıya inelim!' },
    { id: 2, points: [{ x: 28, y: 16 }, { x: 72, y: 84 }], directionHint: 'Çapraz aşağıya kayalım!' },
    { id: 3, points: [{ x: 72, y: 84 }, { x: 72, y: 16 }], directionHint: 'Aşağıdan yukarıya çıkalım!' },
  ],
  n: [
    { id: 1, points: [{ x: 34, y: 44 }, { x: 34, y: 82 }], directionHint: 'Yukarıdan aşağıya inelim!' },
    {
      id: 2,
      points: [
        { x: 34, y: 56 },
        { x: 48, y: 44 },
        { x: 66, y: 52 },
        { x: 66, y: 82 },
      ],
      directionHint: 'Köprüyü geçip aşağıya inelim!',
    },
  ],
  // E (4 Çizgi)
  E: [
    { id: 1, points: [{ x: 30, y: 16 }, { x: 30, y: 84 }], directionHint: 'Yukarıdan aşağıya dik çizgi!' },
    { id: 2, points: [{ x: 30, y: 16 }, { x: 72, y: 16 }], directionHint: 'Üst çizgiyi çekelim!' },
    { id: 3, points: [{ x: 30, y: 50 }, { x: 65, y: 50 }], directionHint: 'Orta çizgiyi çekelim!' },
    { id: 4, points: [{ x: 30, y: 84 }, { x: 72, y: 84 }], directionHint: 'Alt çizgiyi çekelim!' },
  ],
  e: [
    {
      id: 1,
      points: [
        { x: 32, y: 60 },
        { x: 68, y: 60 },
        { x: 52, y: 42 },
        { x: 34, y: 58 },
        { x: 50, y: 80 },
        { x: 68, y: 74 },
      ],
      directionHint: 'Düz git ve etrafında dön!',
    },
  ],
  // T (2 Çizgi)
  T: [
    { id: 1, points: [{ x: 20, y: 18 }, { x: 80, y: 18 }], directionHint: 'Üstteki çatıyı çizelim!' },
    { id: 2, points: [{ x: 50, y: 18 }, { x: 50, y: 84 }], directionHint: 'Tam ortadan aşağıya inelim!' },
  ],
  t: [
    { id: 1, points: [{ x: 50, y: 22 }, { x: 50, y: 76 }, { x: 62, y: 80 }], directionHint: 'Aşağı inip kıvıralım!' },
    { id: 2, points: [{ x: 36, y: 44 }, { x: 64, y: 44 }], directionHint: 'Kollarını açalım!' },
  ],
  // İ (2 Çizgi)
  İ: [
    { id: 1, points: [{ x: 50, y: 28 }, { x: 50, y: 84 }], directionHint: 'Yukarıdan aşağıya inelim!' },
    { id: 2, points: [{ x: 50, y: 14 }, { x: 50, y: 16 }], directionHint: 'Tepesine yıldız konduralım!' },
  ],
  i: [
    { id: 1, points: [{ x: 50, y: 44 }, { x: 50, y: 82 }], directionHint: 'Yukarıdan aşağıya inelim!' },
    { id: 2, points: [{ x: 50, y: 30 }, { x: 50, y: 32 }], directionHint: 'Noktasını koyalım!' },
  ],
  // L (2 Çizgi)
  L: [
    { id: 1, points: [{ x: 32, y: 16 }, { x: 32, y: 84 }], directionHint: 'Yukarıdan aşağıya inelim!' },
    { id: 2, points: [{ x: 32, y: 84 }, { x: 74, y: 84 }], directionHint: 'Sağa doğru kayalım!' },
  ],
  l: [
    { id: 1, points: [{ x: 50, y: 16 }, { x: 50, y: 78 }, { x: 60, y: 82 }], directionHint: 'Uzun bir çizgi çekelim!' },
  ],
  // Rakamlar 1 - 5
  '1': [
    { id: 1, points: [{ x: 38, y: 35 }, { x: 50, y: 18 }], directionHint: 'Tepeye tırmanalım!' },
    { id: 2, points: [{ x: 50, y: 18 }, { x: 50, y: 84 }], directionHint: 'Dimdik aşağıya inelim!' },
  ],
  '2': [
    {
      id: 1,
      points: [
        { x: 34, y: 36 },
        { x: 50, y: 18 },
        { x: 68, y: 32 },
        { x: 34, y: 84 },
        { x: 72, y: 84 },
      ],
      directionHint: 'Kuğunun boynunu çizip tabana kayalım!',
    },
  ],
  '3': [
    {
      id: 1,
      points: [
        { x: 34, y: 22 },
        { x: 66, y: 22 },
        { x: 48, y: 48 },
        { x: 68, y: 68 },
        { x: 34, y: 82 },
      ],
      directionHint: 'İki yarım daire yapalım!',
    },
  ],
  '4': [
    { id: 1, points: [{ x: 62, y: 18 }, { x: 32, y: 58 }], directionHint: 'Çapraz aşağıya inelim!' },
    { id: 2, points: [{ x: 32, y: 58 }, { x: 74, y: 58 }], directionHint: 'Sağa doğru uzatalım!' },
    { id: 3, points: [{ x: 62, y: 18 }, { x: 62, y: 84 }], directionHint: 'Yukarıdan dik çizgi indirelim!' },
  ],
  '5': [
    { id: 1, points: [{ x: 64, y: 20 }, { x: 38, y: 20 }], directionHint: 'Şapkasını çizelim!' },
    { id: 2, points: [{ x: 38, y: 20 }, { x: 38, y: 48 }], directionHint: 'Aşağıya inelim!' },
    {
      id: 3,
      points: [
        { x: 38, y: 48 },
        { x: 68, y: 62 },
        { x: 38, y: 84 },
      ],
      directionHint: 'Göbeğini yuvarlayalım!',
    },
  ],
}

// 1. Grup Harf ve Rakam Seçici Listesi
const QUICK_SELECT_ITEMS = [
  { key: 'A', label: 'A / a' },
  { key: 'N', label: 'N / n' },
  { key: 'E', label: 'E / e' },
  { key: 'T', label: 'T / t' },
  { key: 'İ', label: 'İ / i' },
  { key: 'L', label: 'L / l' },
  { key: '1', label: '1' },
  { key: '2', label: '2' },
  { key: '3', label: '3' },
  { key: '4', label: '4' },
  { key: '5', label: '5' },
]

// Web Audio API ile Gemi Düdüğü Sentezleyici ("Düüüt Düüüt!")
function playShipHornSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const now = ctx.currentTime

    // İki tonlu gerçek vapur/gemi düdüğü (185 Hz ve 220 Hz)
    const freqs = [185, 220]
    freqs.forEach((f) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(f, now)
      osc.frequency.linearRampToValueAtTime(f * 1.02, now + 0.4)

      // Düdük 1 (0.0s - 0.35s)
      gain.gain.setValueAtTime(0.001, now)
      gain.gain.linearRampToValueAtTime(0.22, now + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

      // Düdük 2 (0.42s - 0.85s)
      gain.gain.setValueAtTime(0.001, now + 0.42)
      gain.gain.linearRampToValueAtTime(0.25, now + 0.47)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85)

      // Hafif low-pass filtre ile yumuşat
      const filter = ctx.createBiquadFilter()
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(650, now)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.start(now)
      osc.stop(now + 0.9)
    })
  } catch {
    // Ses hatası oyunu durdurmasın
  }
}

// Parmak sürüklenirken parıltı çanı (chime)
function playTwinkleChime(pitchIndex = 0) {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const now = ctx.currentTime

    const baseFreqs = [587.33, 659.25, 783.99, 880.0, 987.77, 1174.66]
    const freq = baseFreqs[pitchIndex % baseFreqs.length]

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq, now)

    gain.gain.setValueAtTime(0.12, now)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16)

    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(now)
    osc.stop(now + 0.18)
  } catch {
    // Fail-safe
  }
}

export function LighthouseTracingGame({
  letter,
  childName,
  completed: _completed,
  onComplete,
  onExit,
}: LighthouseTracingGameProps) {
  // Seçili karakter (harf veya rakam)
  const initialChar = letter?.upper || 'A'
  const [currentChar, setCurrentChar] = useState<string>(initialChar)
  const [caseMode, setCaseMode] = useState<'upper' | 'lower'>('upper')

  // Çizim durumu
  const [currentStrokeIdx, setCurrentStrokeIdx] = useState<number>(0)
  const [strokeProgress, setStrokeProgress] = useState<number>(0) // 0..1 aktif çizginin tamamlanma oranı
  const [completedStrokes, setCompletedStrokes] = useState<number[]>([]) // Tamamlanan çizgi indeksleri
  const [isVictory, setIsVictory] = useState<boolean>(false)
  const [hintMessage, setHintMessage] = useState<string>('')
  const [shipDocked, setShipDocked] = useState<boolean>(false)

  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const isPointerDownRef = useRef<boolean>(false)
  const particlesRef = useRef<StarParticle[]>([])
  const fireworksRef = useRef<FireworkParticle[]>([])
  const animFrameRef = useRef<number | null>(null)
  const lastChimeTimeRef = useRef<number>(0)
  const beamAngleRef = useRef<number>(0)

  // Aktif harfin çizgi şablonu
  const effectiveChar = useMemo(() => {
    if (['1', '2', '3', '4', '5'].includes(currentChar)) return currentChar
    return caseMode === 'upper' ? currentChar.toLocaleUpperCase('tr-TR') : currentChar.toLocaleLowerCase('tr-TR')
  }, [currentChar, caseMode])

  const strokes: StrokeDef[] = useMemo(() => {
    return STROKE_DATA[effectiveChar] || STROKE_DATA['A']
  }, [effectiveChar])

  const activeStroke = strokes[currentStrokeIdx] || strokes[0]

  // Harf veya büyük/küçük modu değiştiğinde oyunu sıfırla
  const resetGame = useCallback(() => {
    setCurrentStrokeIdx(0)
    setStrokeProgress(0)
    setCompletedStrokes([])
    setIsVictory(false)
    setShipDocked(false)
    particlesRef.current = []
    fireworksRef.current = []
    const firstHint = strokes[0]?.directionHint || 'Hadi yıldızları birleştirelim!'
    setHintMessage(firstHint)
  }, [strokes])

  useEffect(() => {
    resetGame()
  }, [effectiveChar, resetGame])

  // Kaptan Martı başlangıç yönergesi
  useEffect(() => {
    const timer = setTimeout(() => {
      speakTurkish(
        `Geminin limana ulaşması için gökyüzündeki "${effectiveChar}" harfi yıldızlarını sırasıyla birleştirelim!`
      )
    }, 450)
    return () => clearTimeout(timer)
  }, [effectiveChar])

  // Parçacık ekleme (altın sarısı ve gökkuşağı yıldız tozları)
  const spawnStarDust = (x: number, y: number, count = 3) => {
    const colors = ['#fde047', '#fbbf24', '#f472b6', '#38bdf8', '#a855f7', '#ffffff']
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 0.8 + Math.random() * 2.5
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2.5 + Math.random() * 3.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        life: 1,
      })
    }
  }

  // Havai fişek patlaması
  const spawnFireworks = (cx: number, cy: number) => {
    const colors = ['#f43f5e', '#fbbf24', '#10b981', '#38bdf8', '#a855f7', '#fb923c']
    for (let i = 0; i < 45; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 5.5
      fireworksRef.current.push({
        x: cx,
        y: cy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        alpha: 1,
        size: 3 + Math.random() * 3,
      })
    }
  }

  // Koordinat dönüştürücü (Canvas piksel -> 0..100 normalize)
  const getNormCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { nx: 50, ny: 50, px: 0, py: 0 }
    const rect = canvas.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    const nx = (px / rect.width) * 100
    const ny = (py / rect.height) * 100
    return { nx, ny, px, py }
  }

  // 2 nokta arasındaki mesafe
  const distance = (p1: Waypoint, p2: Waypoint) => {
    return Math.hypot(p1.x - p2.x, p1.y - p2.y)
  }

  // Çizgi üzerindeki en yakın noktayı ve ilerlemeyi (0..1) hesaplama
  const calculateSegmentProgress = (pt: Waypoint, pStart: Waypoint, pEnd: Waypoint) => {
    const dx = pEnd.x - pStart.x
    const dy = pEnd.y - pStart.y
    const lenSq = dx * dx + dy * dy
    if (lenSq === 0) return { progress: 0, dist: distance(pt, pStart) }

    // Projeksiyon katsayısı t
    let t = ((pt.x - pStart.x) * dx + (pt.y - pStart.y) * dy) / lenSq
    t = Math.max(0, Math.min(1, t))

    const projX = pStart.x + t * dx
    const projY = pStart.y + t * dy
    const dist = Math.hypot(pt.x - projX, pt.y - projY)

    return { progress: t, dist, projX, projY }
  }

  // Pointer Down (Yıldıza dokunma)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    isPointerDownRef.current = true

    if (isVictory) return
    const { nx, ny, px, py } = getNormCoords(e)
    const startPt = activeStroke.points[0]

    // 6 yaş motor becerisi için tolerans alanı (en az 45-50px ~ %12 normalize)
    const distToStart = distance({ x: nx, y: ny }, startPt)
    if (distToStart <= 16) {
      playSoundEffect('pop')
      spawnStarDust(px, py, 6)
      if (activeStroke.directionHint) {
        setHintMessage(activeStroke.directionHint)
      }
    }
  }

  // Pointer Move (Yıldız izini sürme)
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isPointerDownRef.current || isVictory) return
    const { nx, ny, px, py } = getNormCoords(e)

    const pts = activeStroke.points
    const pStart = pts[0]
    const pEnd = pts[pts.length - 1]

    // Ters yönden başlama kontrolü: Çocuk bitişten geriye doğru çizmeye çalışırsa engelle
    const distToEnd = distance({ x: nx, y: ny }, pEnd)
    if (strokeProgress < 0.25 && distToEnd < 10) {
      playSoundEffect('error')
      setHintMessage('Buradan aşağıya doğru kayalım! 🌟 Başlangıç yıldızına dön!')
      return
    }

    // Doğru çizgi üzerindeki ilerlemeyi hesapla
    const { progress, dist } = calculateSegmentProgress({ x: nx, y: ny }, pStart, pEnd)

    // Geniş tolerans alanı (%18 yarıçap ~ 60px)
    if (dist <= 18) {
      // Sadece ileri doğru hareketi kabul et (kaldığı yerden devam mekaniği)
      if (progress >= strokeProgress - 0.05) {
        const nextProg = Math.max(strokeProgress, progress)
        setStrokeProgress(nextProg)
        spawnStarDust(px, py, 2)

        // Hafif rüzgar çanı / parıltı sesi (150ms arayla)
        const now = performance.now()
        if (now - lastChimeTimeRef.current > 140) {
          playTwinkleChime(Math.floor(nextProg * 5))
          lastChimeTimeRef.current = now
        }

        // Çizgi tamamlandı mı? (%92 ve üzeri)
        if (nextProg >= 0.92) {
          completeCurrentStroke()
        }
      }
    }
  }

  // Aktif çizgiyi tamamlama
  const completeCurrentStroke = () => {
    playSoundEffect('chord')
    const completedIdx = currentStrokeIdx
    setCompletedStrokes((prev) => [...new Set([...prev, completedIdx])])
    setStrokeProgress(1)

    // Sonraki çizgiye geç veya oyunu kazan
    if (completedIdx + 1 < strokes.length) {
      const nextIdx = completedIdx + 1
      setCurrentStrokeIdx(nextIdx)
      setStrokeProgress(0)
      const nextHint = strokes[nextIdx]?.directionHint || 'Sıradaki yıldıza geçelim!'
      setHintMessage(nextHint)
    } else {
      // Tüm çizgiler tamamlandı! (BÜYÜK KAZANMA ANI)
      triggerVictory()
    }
  }

  // Zafer ve Tamamlanma Kutlaması
  const triggerVictory = () => {
    setIsVictory(true)
    setShipDocked(true)
    playShipHornSound()
    playSoundEffect('fanfare')

    const canvas = canvasRef.current
    if (canvas) {
      spawnFireworks(canvas.width * 0.5, canvas.height * 0.4)
      spawnFireworks(canvas.width * 0.75, canvas.height * 0.35)
      spawnFireworks(canvas.width * 0.25, canvas.height * 0.35)
    }

    speakTurkish(
      `Harikasın Kaptan ${childName}! ${effectiveChar} harfini kusursuz çizdin! Gemi limana güvenle yanaştı!`
    )

    if (onComplete) {
      onComplete()
    }
  }

  const handlePointerUp = () => {
    isPointerDownRef.current = false
  }

  // Canvas 60 FPS Render Döngüsü
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let isRunning = true

    const render = () => {
      if (!isRunning) return
      const w = canvas.width
      const h = canvas.height
      ctx.clearRect(0, 0, w, h)

      // 1. Deniz Feneri Dönen Işık Hüzmesi
      beamAngleRef.current += isVictory ? 0.03 : 0.008
      const lightSourceX = w * 0.16
      const lightSourceY = h * 0.42

      ctx.save()
      ctx.translate(lightSourceX, lightSourceY)
      ctx.rotate(beamAngleRef.current)
      const beamGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, w * 0.85)
      beamGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)')
      beamGrad.addColorStop(0.5, 'rgba(253, 224, 71, 0.18)')
      beamGrad.addColorStop(1, 'rgba(253, 224, 71, 0)')
      ctx.fillStyle = beamGrad
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.arc(0, 0, w * 0.9, -0.32, 0.32)
      ctx.closePath()
      ctx.fill()
      ctx.restore()

      // 2. Harf Çizgi Şablonlarını Çiz
      strokes.forEach((stroke, sIdx) => {
        const isDone = completedStrokes.includes(sIdx)
        const isActive = sIdx === currentStrokeIdx && !isVictory
        const pStart = stroke.points[0]
        const pEnd = stroke.points[stroke.points.length - 1]

        const x1 = (pStart.x / 100) * w
        const y1 = (pStart.y / 100) * h
        const x2 = (pEnd.x / 100) * w
        const y2 = (pEnd.y / 100) * h

        // 2A. Arka plan sönük kesik çizgi rehberi
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(x1, y1)
        ctx.lineTo(x2, y2)
        ctx.lineCap = 'round'
        ctx.lineWidth = 26
        ctx.strokeStyle = isActive ? 'rgba(255, 255, 255, 0.22)' : 'rgba(148, 163, 184, 0.14)'
        ctx.setLineDash([10, 14])
        ctx.stroke()
        ctx.restore()

        // 2B. Çizilmiş/Boyanmış Kısım (Neon Altın Sarı / Beyaz Işıltılı)
        if (isDone || (isActive && strokeProgress > 0)) {
          const prog = isDone ? 1 : strokeProgress
          const curX = x1 + (x2 - x1) * prog
          const curY = y1 + (y2 - y1) * prog

          ctx.save()
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(curX, curY)
          ctx.lineCap = 'round'
          ctx.lineWidth = 24
          ctx.strokeStyle = isVictory ? '#38bdf8' : '#facc15'
          ctx.shadowColor = isVictory ? '#60a5fa' : '#fbbf24'
          ctx.shadowBlur = 18
          ctx.stroke()

          // Çizginin iç çekirdek parlaklığı
          ctx.beginPath()
          ctx.moveTo(x1, y1)
          ctx.lineTo(curX, curY)
          ctx.lineWidth = 10
          ctx.strokeStyle = '#ffffff'
          ctx.stroke()
          ctx.restore()
        }

        // 2C. Başlangıç ve Bitiş Yıldız / Hedef Halkaları
        // Başlangıç Yıldızı
        ctx.save()
        ctx.beginPath()
        ctx.arc(x1, y1, isActive ? 18 : 12, 0, Math.PI * 2)
        ctx.fillStyle = isActive ? '#fbbf24' : isDone ? '#4ade80' : 'rgba(203, 213, 225, 0.4)'
        ctx.shadowColor = '#f59e0b'
        ctx.shadowBlur = isActive ? 16 : 4
        ctx.fill()
        ctx.lineWidth = 3
        ctx.strokeStyle = '#ffffff'
        ctx.stroke()

        // Çizgi Sıra Numarası ("1", "2", "3")
        ctx.fillStyle = '#1e1b4b'
        ctx.font = 'bold 15px Fredoka, sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(String(stroke.id), x1, y1)
        ctx.restore()

        // Bitiş Hedef Halkası
        ctx.save()
        ctx.beginPath()
        ctx.arc(x2, y2, isActive ? 14 : 9, 0, Math.PI * 2)
        ctx.fillStyle = isDone ? '#4ade80' : 'rgba(255, 255, 255, 0.15)'
        ctx.lineWidth = 2.5
        ctx.strokeStyle = isActive ? '#fde047' : 'rgba(203, 213, 225, 0.3)'
        ctx.stroke()
        ctx.restore()

        // 2D. Aktif Çizgi Boyunca İlerleyen Yön Oku Animasyonu
        if (isActive && strokeProgress < 0.88) {
          const arrowT = (Date.now() % 1400) / 1400
          const ax = x1 + (x2 - x1) * arrowT
          const ay = y1 + (y2 - y1) * arrowT
          ctx.save()
          ctx.beginPath()
          ctx.arc(ax, ay, 7, 0, Math.PI * 2)
          ctx.fillStyle = '#ffffff'
          ctx.shadowColor = '#facc15'
          ctx.shadowBlur = 10
          ctx.fill()
          ctx.restore()
        }
      })

      // 3. Yıldız Tozu Parçacıklarını Güncelle ve Çiz
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const p = particlesRef.current[i]
        p.x += p.vx
        p.y += p.vy
        p.alpha -= 0.025
        p.size *= 0.96

        if (p.alpha <= 0) {
          particlesRef.current.splice(i, 1)
          continue
        }

        ctx.save()
        ctx.globalAlpha = p.alpha
        ctx.fillStyle = p.color
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      // 4. Havai Fişek Parçacıkları (Zafer Anı)
      for (let i = fireworksRef.current.length - 1; i >= 0; i--) {
        const fp = fireworksRef.current[i]
        fp.x += fp.vx
        fp.y += fp.vy
        fp.vy += 0.06 // Yerçekimi
        fp.alpha -= 0.016

        if (fp.alpha <= 0) {
          fireworksRef.current.splice(i, 1)
          continue
        }

        ctx.save()
        ctx.globalAlpha = fp.alpha
        ctx.fillStyle = fp.color
        ctx.beginPath()
        ctx.arc(fp.x, fp.y, fp.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }

      animFrameRef.current = requestAnimationFrame(render)
    }

    render()

    return () => {
      isRunning = false
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current)
      }
    }
  }, [strokes, completedStrokes, currentStrokeIdx, strokeProgress, isVictory])

  return (
    <div className="lighthouse-game-container">
      {/* ÜST BAŞLIK VE HARF SEÇİCİ */}
      <div className="lighthouse-header">
        <div className="lighthouse-title-row">
          <div className="lighthouse-icon-badge">⛵</div>
          <div>
            <h2 className="lighthouse-main-title">Sihirli Deniz Feneri ve Yıldız İzleri</h2>
            <p className="lighthouse-subtitle">Kaptan Martı ile Dik Temel Harfleri Çizelim</p>
          </div>
        </div>

        <div className="lighthouse-controls">
          {/* Büyük / Küçük Harf Değiştirici */}
          {!['1', '2', '3', '4', '5'].includes(currentChar) && (
            <div className="case-toggle-group">
              <button
                type="button"
                className={`case-btn ${caseMode === 'upper' ? 'active' : ''}`}
                onClick={() => {
                  playSoundEffect('click')
                  setCaseMode('upper')
                }}
              >
                Büyük
              </button>
              <button
                type="button"
                className={`case-btn ${caseMode === 'lower' ? 'active' : ''}`}
                onClick={() => {
                  playSoundEffect('click')
                  setCaseMode('lower')
                }}
              >
                küçük
              </button>
            </div>
          )}

          {/* Yeniden Başlat Butonu */}
          <button
            type="button"
            className="lh-btn lh-btn-reset"
            onClick={() => {
              playSoundEffect('click')
              resetGame()
            }}
            title="Yeniden Başlat"
          >
            <RotateCcw size={18} />
            <span>Yeniden Çiz</span>
          </button>
        </div>
      </div>

      {/* 1. GRUP MEB HARFLERİ VE RAKAMLAR SEÇİCİ BANT (Yalnızca serbest modda göster) */}
      {!letter && (
        <div className="lighthouse-quick-selector">
          <span className="quick-label">Harf / Rakam Seç:</span>
          <div className="quick-pills-row">
            {QUICK_SELECT_ITEMS.map((item) => {
              const isActive = currentChar === item.key
              return (
                <button
                  key={item.key}
                  type="button"
                  className={`quick-char-pill ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    playSoundEffect('click')
                    setCurrentChar(item.key)
                  }}
                >
                  {item.label}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* KAPTAN MARTI KONUŞMA BALONU (REHBER) */}
      <div className="captain-speech-bubble">
        <div className="seagull-avatar">
          <span className="seagull-emoji">🕊️</span>
          <span className="captain-cap">⚓</span>
        </div>
        <div className="speech-content">
          <div className="speech-author">Kaptan Martı:</div>
          <p className="speech-text">
            {isVictory ? (
              <span>🌟 Düüüüt! Harikasın Kaptan {childName}! Gemi limana güvenle yanaştı!</span>
            ) : (
              <span>{hintMessage}</span>
            )}
          </p>
        </div>
        <button
          type="button"
          className="speech-listen-btn"
          onClick={() => {
            playSoundEffect('pop')
            speakTurkish(hintMessage)
          }}
          title="Sesli Dinle"
        >
          <Volume2 size={20} />
        </button>
      </div>

      {/* ANA ÇİZİM SAHNESİ (GÖKYÜZÜ, DENİZ FENERİ, GEMİ) */}
      <div className="lighthouse-canvas-stage">
        {/* SVG Deniz Feneri (Sol Taraf) */}
        <div className="scene-lighthouse-wrapper">
          <svg viewBox="0 0 140 320" className="svg-lighthouse" aria-hidden="true">
            {/* Deniz Feneri Gövdesi */}
            <defs>
              <linearGradient id="lhStripeRed" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#e11d48" />
                <stop offset="100%" stopColor="#be123c" />
              </linearGradient>
              <linearGradient id="lhStripeWhite" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#e2e8f0" />
              </linearGradient>
            </defs>
            {/* Kayalık Zemin */}
            <path d="M 0 320 Q 70 280 140 320 Z" fill="#334155" />
            <ellipse cx="70" cy="300" rx="65" ry="16" fill="#475569" />
            {/* Gövde Şeritleri */}
            <polygon points="35,300 105,300 98,240 42,240" fill="url(#lhStripeRed)" />
            <polygon points="42,240 98,240 92,180 48,180" fill="url(#lhStripeWhite)" />
            <polygon points="48,180 92,180 86,120 54,120" fill="url(#lhStripeRed)" />
            <polygon points="54,120 86,120 80,75 60,75" fill="url(#lhStripeWhite)" />
            {/* Balkon ve Korkuluk */}
            <rect x="45" y="70" width="50" height="8" rx="2" fill="#1e293b" />
            <line x1="48" y1="62" x2="92" y2="62" stroke="#64748b" strokeWidth="2.5" />
            {/* Fener Odası (Cam Bölme ve Sarı Ampul) */}
            <rect x="52" y="38" width="36" height="32" rx="3" fill="#0f172a" />
            <circle cx="70" cy="54" r="13" fill="#fde047" className="lantern-glow-pulse" />
            {/* Çatı Kubbesi ve Paratoner */}
            <path d="M 48 38 Q 70 14 92 38 Z" fill="#0f172a" />
            <line x1="70" y1="14" x2="70" y2="2" stroke="#94a3b8" strokeWidth="3" />
            <circle cx="70" cy="2" r="3" fill="#fbbf24" />
          </svg>
        </div>

        {/* HTML5 Canvas Çizim Alanı (Merkez) */}
        <div className="canvas-wrapper">
          <canvas
            ref={canvasRef}
            width={620}
            height={500}
            className="lighthouse-canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
        </div>

        {/* Liman ve Sevimli Gemi / Römorkör (Sağ Alt) */}
        <div className={`scene-ship-dock-wrapper ${shipDocked ? 'docked' : ''}`}>
          {/* Liman İskelesi */}
          <div className="dock-pier">
            <div className="dock-bollard" />
            <div className="dock-wooden-deck" />
          </div>

          {/* Sevimli Gemi / Römorkör */}
          <div className="tugboat-ship">
            <div className="tugboat-steam">💨</div>
            <div className="tugboat-cabin">
              <div className="tugboat-porthole" />
              <div className="tugboat-chimney" />
            </div>
            <div className="tugboat-hull">
              <span className="tugboat-star">⭐</span>
              <span className="tugboat-name">EYLÜL</span>
            </div>
            <div className="water-waves-small" />
          </div>
        </div>

        {/* Dalgalı Deniz Animasyonu Tabanı */}
        <div className="sea-waves-layer">
          <div className="wave wave-1" />
          <div className="wave wave-2" />
        </div>
      </div>

      {/* ZAFER KART VE TEBRİK MODALI */}
      {isVictory && (
        <div className="victory-modal-overlay">
          <div className="victory-card">
            <div className="victory-stars-top">🌟 ⭐ 🌟</div>
            <h3 className="victory-title">Tebrikler Kaptan {childName}!</h3>
            <p className="victory-desc">
              <strong>"{effectiveChar}"</strong> harfini harika bir şekilde çizdin! Gemi güvenle limana yanaştı.
            </p>
            <div className="victory-badge-large">
              <Award size={48} color="#facc15" />
              <span>Yıldız Kaptan Madalyası</span>
            </div>

            <div className="victory-actions">
              <button
                type="button"
                className="btn-primary btn-large"
                onClick={() => {
                  playSoundEffect('click')
                  resetGame()
                }}
              >
                <RotateCcw size={20} /> Tekrar Çiz
              </button>

              {onExit && (
                <button
                  type="button"
                  className="btn-primary btn-large"
                  style={{ backgroundColor: '#16a34a' }}
                  onClick={() => {
                    playSoundEffect('success')
                    onExit()
                  }}
                >
                  <Sparkles size={20} /> Sonraki Adıma Geç
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
