import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import {
  Volume2,
  RotateCcw,
  Sparkles,
  ChevronRight,
  ChefHat,
  CheckCircle2,
  Award,
} from 'lucide-react'
import { type LetterCurriculum } from './curriculum'
import { playSoundEffect, speakTurkish } from './sound'

interface SyllableKitchenGameProps {
  letter?: LetterCurriculum
  childName: string
  completed?: boolean
  onComplete: () => void
  onNext?: () => void
}

export interface KitchenRecipe {
  id: string
  word: string
  emoji: string
  targetParts: string[]
  recipeTitle: string
  level: 1 | 2 | 3
}

interface JarItem {
  id: string
  text: string
  color: string
  liquidColor: string
  targetSlotIndex: number // -1 if distractor, otherwise 0..N-1
}

interface PotParticle {
  id: number
  x: number
  y: number
  vx: number
  vy: number
  size: number
  color: string
  kind: 'bubble' | 'star' | 'smoke_green' | 'smoke_rainbow' | 'confetti'
  alpha: number
}

interface FlyingJarAnim {
  jar: JarItem
  startX: number
  startY: number
  endX: number
  endY: number
  progress: number // 0..1
  isCorrect: boolean
  bouncingBack: boolean
}

// 3 Zorluk Seviyeli Zengin Kelime Tarif Veri Seti (En az 10+ özel tarif)
const LEVEL_RECIPES: KitchenRecipe[] = [
  // SEVİYE 1 (1. Grup Harfler - Kolay)
  { id: 'l1_lale', word: 'LALE', emoji: '🌷', targetParts: ['LA', 'LE'], recipeTitle: 'Mis Kokulu Lale İksiri', level: 1 },
  { id: 'l1_el', word: 'EL', emoji: '👋', targetParts: ['E', 'L'], recipeTitle: 'Sıcak El Çorbası', level: 1 },
  { id: 'l1_al', word: 'AL', emoji: '🟥', targetParts: ['A', 'L'], recipeTitle: 'Al Kırmızı Sos', level: 1 },
  { id: 'l1_ela', word: 'ELA', emoji: '👧', targetParts: ['E', 'LA'], recipeTitle: 'Tatlı Ela Pudingi', level: 1 },
  { id: 'l1_aile', word: 'AİLE', emoji: '👨‍👩‍👧', targetParts: ['A', 'İ', 'LE'], recipeTitle: 'Mutlu Aile Pastası', level: 1 },
  { id: 'l1_nine', word: 'NİNE', emoji: '👵', targetParts: ['Nİ', 'NE'], recipeTitle: 'Nine Kurabiyesi', level: 1 },
  { id: 'l1_anne', word: 'ANNE', emoji: '🤱', targetParts: ['A', 'N', 'NE'], recipeTitle: 'Anne Kek Karışımı', level: 1 },
  { id: 'l1_et', word: 'ET', emoji: '🥩', targetParts: ['E', 'T'], recipeTitle: 'Lezzetli Et Yahni', level: 1 },
  { id: 'l1_tel', word: 'TEL', emoji: '🎸', targetParts: ['T', 'E', 'L'], recipeTitle: 'Çıtır Tel Kadayıf', level: 1 },

  // SEVİYE 2 (2 Hece - Orta)
  { id: 'l2_elma', word: 'ELMA', emoji: '🍎', targetParts: ['EL', 'MA'], recipeTitle: 'Tarçınlı Elma Kompostosu', level: 2 },
  { id: 'l2_limon', word: 'LİMON', emoji: '🍋', targetParts: ['Lİ', 'MON'], recipeTitle: 'Taze Limonata İksiri', level: 2 },
  { id: 'l2_kalem', word: 'KALEM', emoji: '✏️', targetParts: ['KA', 'LEM'], recipeTitle: 'Renkli Kalem Böreği', level: 2 },
  { id: 'l2_kitap', word: 'KİTAP', emoji: '📖', targetParts: ['Kİ', 'TAP'], recipeTitle: 'Bilge Kitap Suflesi', level: 2 },
  { id: 'l2_balik', word: 'BALIK', emoji: '🐟', targetParts: ['BA', 'LIK'], recipeTitle: 'Neşeli Balık Çorbası', level: 2 },
  { id: 'l2_esek', word: 'EŞEK', emoji: '🫏', targetParts: ['E', 'ŞEK'], recipeTitle: 'Sevimli Eşek Havuçlu Kek', level: 2 },
  { id: 'l2_araba', word: 'ARABA', emoji: '🚗', targetParts: ['A', 'RA', 'BA'], recipeTitle: 'Hızlı Araba Makarnası', level: 2 },

  // SEVİYE 3 (3+ Hece - İleri)
  { id: 'l3_kelebek', word: 'KELEBEK', emoji: '🦋', targetParts: ['KE', 'LE', 'BEK'], recipeTitle: 'Gökkuşağı Kelebek Tatlısı', level: 3 },
  { id: 'l3_cikolata', word: 'ÇİKOLATA', emoji: '🍫', targetParts: ['Çİ', 'KO', 'LA', 'TA'], recipeTitle: 'Sıcak Çikolata Şelalesi', level: 3 },
  { id: 'l3_hazine', word: 'HAZİNE', emoji: '💎', targetParts: ['HA', 'Zİ', 'NE'], recipeTitle: 'Altın Hazine Pilavı', level: 3 },
  { id: 'l3_mina', word: 'MİNA', emoji: '👑', targetParts: ['Mİ', 'NA'], recipeTitle: 'Prenses Mina Özel Pastası', level: 3 },
  { id: 'l3_barlas', word: 'BARLAS', emoji: '🦁', targetParts: ['BA', 'R', 'LAS'], recipeTitle: 'Cesur Barlas Enerji İksiri', level: 3 },
]

const DISTRACTOR_SYLLABLES = [
  'KO', 'SU', 'TA', 'ME', 'RO', 'LU', 'Zİ', 'ŞE', 'BO', 'KA', 'DE', 'Pİ', 'TU', 'MÜ',
]

const JAR_PALETTE = [
  { border: '#f97316', liquid: '#fb923c' },
  { border: '#ec4899', liquid: '#f472b6' },
  { border: '#8b5cf6', liquid: '#a78bfa' },
  { border: '#06b6d4', liquid: '#22d3ee' },
  { border: '#10b981', liquid: '#34d399' },
  { border: '#eab308', liquid: '#facc15' },
  { border: '#ef4444', liquid: '#f87171' },
]

const SOUP_COLORS = ['#f97316', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981', '#eab308']

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function SyllableKitchenGame({
  letter,
  childName,
  onComplete,
  onNext,
}: SyllableKitchenGameProps) {
  // Zorluk seviyesi: 'letter' (eğer harf dersindeyse) veya 1 | 2 | 3
  const [selectedLevel, setSelectedLevel] = useState<'letter' | 1 | 2 | 3>(
    letter ? 'letter' : 1
  )

  // Seçili harf değişirse o harfin menüsüne geç
  useEffect(() => {
    if (letter) {
      setSelectedLevel('letter')
    }
  }, [letter?.id])

  // Aktif seviyenin yemek listesi
  const activeDishes: KitchenRecipe[] = useMemo(() => {
    if (selectedLevel === 'letter' && letter) {
      const list: KitchenRecipe[] = []
      letter.syllableTasks.forEach((st, idx) => {
        list.push({
          id: `let_syl_${letter.id}_${idx}`,
          word: st.result.toLocaleUpperCase('tr-TR'),
          emoji: st.emoji,
          targetParts: [
            st.parts[0].toLocaleUpperCase('tr-TR'),
            st.parts[1].toLocaleUpperCase('tr-TR'),
          ],
          recipeTitle: `${st.result.toLocaleUpperCase('tr-TR')} Özel Tarifi`,
          level: 1,
        })
      })
      letter.words.forEach((w, idx) => {
        if (w.syllables && w.syllables.length >= 2) {
          const upper = w.word.toLocaleUpperCase('tr-TR')
          if (!list.some((item) => item.word === upper)) {
            list.push({
              id: `let_word_${letter.id}_${idx}`,
              word: upper,
              emoji: w.emoji,
              targetParts: w.syllables.map((s) => s.toLocaleUpperCase('tr-TR')),
              recipeTitle: `${upper} Lezzeti`,
              level: 2,
            })
          }
        }
      })
      if (list.length > 0) return list
    }

    const lvl = selectedLevel === 'letter' ? 1 : selectedLevel
    return LEVEL_RECIPES.filter((r) => r.level === lvl)
  }, [selectedLevel, letter])

  const [dishIdx, setDishIdx] = useState(0)
  const currentDish = activeDishes[dishIdx] || activeDishes[0]

  // 3 AŞAMALI OYUN MEKANİĞİ STATE:
  // 'adding' (Aşama 1: Sıralı Hece Ekleme)
  // 'stirring' (Aşama 2: Kepçe ile Karıştırma Mini-Oyunu)
  // 'serving' (Aşama 3: Servis, Kelime Birleştirme ve Ödül)
  const [cookingPhase, setCookingPhase] = useState<'adding' | 'stirring' | 'serving'>('adding')

  // Eklenen doğru hecelerin sayısı (0 .. targetParts.length)
  const [addedCount, setAddedCount] = useState(0)
  // Kullanılmış kavanoz ID'leri
  const [usedJarIds, setUsedJarIds] = useState<string[]>([])
  // Tencere durumu: 'idle' | 'happy' | 'sneeze' | 'stirring' | 'served'
  const [potMood, setPotMood] = useState<'idle' | 'happy' | 'sneeze' | 'stirring' | 'served'>('idle')
  // Çorba rengi
  const [soupColor, setSoupColor] = useState<string>('#f97316')
  // Şef Kedi konuşma balonu metni
  const [chefSpeech, setChefSpeech] = useState<string>('')
  // Aşama 2: Kepçeyle karıştırma ilerlemesi (0..100)
  const [stirProgress, setStirProgress] = useState<number>(0)
  const [ladleAngle, setLadleAngle] = useState<number>(0)
  // Aşama 3: Hecelerin sırayla yanıp sönerek okunması (-1 = hiçbiri, 0..N-1 = aktif hece, 99 = tam kelime birleşti)
  const [activeReadSyllableIdx, setActiveReadSyllableIdx] = useState<number>(-1)

  // Pişirilen toplam yemek sayısı ("Tarif Defterim / Tabaklarım" - 5 olunca Usta Şef Rozeti!)
  const [cookedPlatesCount, setCookedPlatesCount] = useState<number>(0)
  const [showMasterChefModal, setShowMasterChefModal] = useState<boolean>(false)

  // Sürükle-Bırak (Pointer Events) state - Aynı anda yalnızca 1 kavanoz sürüklenebilir
  const [dragState, setDragState] = useState<{
    jar: JarItem
    pointerId: number
    startX: number
    startY: number
    currentX: number
    currentY: number
    moved: boolean
  } | null>(null)

  // Tıklama ile Bezier eğrisi uçuş animasyonu
  const [flyingJar, setFlyingJar] = useState<FlyingJarAnim | null>(null)

  // Parçacık sistemi (baloncuk, yıldız, yeşil hapşırık dumanı, gökkuşağı dumanı, konfeti)
  const [particles, setParticles] = useState<PotParticle[]>([])

  const stageRef = useRef<HTMLDivElement | null>(null)
  const potRef = useRef<HTMLDivElement | null>(null)
  const jarRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const lastStirSoundRef = useRef<number>(0)
  const isStirDraggingRef = useRef<boolean>(false)

  // Raftaki kavanozları üret (Hedef heceler + 3 yanıltıcı kavanoz)
  const shelfJars: JarItem[] = useMemo(() => {
    if (!currentDish) return []

    const targetJars: JarItem[] = currentDish.targetParts.map((part, idx) => {
      const pal = JAR_PALETTE[idx % JAR_PALETTE.length]
      return {
        id: `jar_target_${currentDish.id}_${idx}`,
        text: part,
        color: pal.border,
        liquidColor: pal.liquid,
        targetSlotIndex: idx,
      }
    })

    const distractors = shuffleArray(
      DISTRACTOR_SYLLABLES.filter((d) => !currentDish.targetParts.includes(d))
    ).slice(0, 3)

    const distractorJars: JarItem[] = distractors.map((d, idx) => {
      const pal = JAR_PALETTE[(targetJars.length + idx) % JAR_PALETTE.length]
      return {
        id: `jar_dist_${currentDish.id}_${idx}`,
        text: d,
        color: pal.border,
        liquidColor: pal.liquid,
        targetSlotIndex: -1,
      }
    })

    return shuffleArray([...targetJars, ...distractorJars])
  }, [currentDish])

  // Parçacık üretme yardımcı fonksiyonu
  const spawnParticles = useCallback(
    (kind: PotParticle['kind'], count: number) => {
      const newPts: PotParticle[] = []
      const colors =
        kind === 'smoke_green'
          ? ['#84cc16', '#65a30d', '#a3e635', '#4ade80']
          : ['#fbbf24', '#f43f5e', '#38bdf8', '#a855f7', '#34d399', '#fb923c']

      for (let i = 0; i < count; i++) {
        const angle = -Math.PI * 0.15 - Math.random() * Math.PI * 0.7
        const speed = kind === 'confetti' ? 3 + Math.random() * 5 : 1.5 + Math.random() * 3.5
        newPts.push({
          id: Date.now() + Math.random() * 10000 + i,
          x: 50 + (Math.random() - 0.5) * 32, // % cinsinden tencere merkezi etrafı
          y: 35 + (Math.random() - 0.5) * 14,
          vx: Math.cos(angle) * speed * 1.4,
          vy: Math.sin(angle) * speed * 1.6,
          size: kind === 'smoke_green' || kind === 'smoke_rainbow' ? 22 + Math.random() * 16 : 12 + Math.random() * 10,
          color: colors[i % colors.length],
          kind,
          alpha: 1,
        })
      }
      setParticles((prev) => [...prev.slice(-30), ...newPts])
    },
    []
  )

  // Parçacık animasyon döngüsü
  useEffect(() => {
    if (particles.length === 0) return
    const timer = requestAnimationFrame(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * 0.45,
            y: p.y + p.vy * 0.45,
            vy: p.kind === 'confetti' ? p.vy + 0.12 : p.vy - 0.03,
            alpha: p.alpha - 0.022,
          }))
          .filter((p) => p.alpha > 0.04)
      )
    })
    return () => cancelAnimationFrame(timer)
  }, [particles])

  // Seviye değiştiğinde ilk tarife dön
  useEffect(() => {
    setDishIdx(0)
  }, [selectedLevel])

  // Yeni yemeğe geçildiğinde sıfırla ve seslendir
  useEffect(() => {
    if (!currentDish) return
    setCookingPhase('adding')
    setAddedCount(0)
    setUsedJarIds([])
    setPotMood('idle')
    setSoupColor('#f97316')
    setStirProgress(0)
    setActiveReadSyllableIdx(-1)
    setFlyingJar(null)
    setDragState(null)

    const welcomeHint = `Siparişimiz: ${currentDish.word}! Önce "${currentDish.targetParts[0]}" kavanozunu tencereye atalım!`
    setChefSpeech(welcomeHint)

    const t = setTimeout(() => {
      playSoundEffect('bubble')
      speakTurkish(
        `Yeni siparişimiz ${currentDish.word}! Hadi sırayla doğru hece kavanozlarını tencereye atalım!`,
        0.9,
        1.1
      )
    }, 220)
    return () => clearTimeout(t)
  }, [currentDish])

  // Kavanoz tencereye ulaştığında (Sürükleme veya Bezier uçuşu sonunda) değerlendir
  const evaluateJarDrop = useCallback(
    (jar: JarItem) => {
      if (!currentDish || cookingPhase !== 'adding') return
      const expectedPart = currentDish.targetParts[addedCount]

      if (jar.text === expectedPart) {
        // DOĞRU HECE ATILDI!
        playSoundEffect('bloop')
        setTimeout(() => playSoundEffect('chord'), 90)

        const newCount = addedCount + 1
        setAddedCount(newCount)
        setUsedJarIds((prev) => [...prev, jar.id])
        setSoupColor(SOUP_COLORS[newCount % SOUP_COLORS.length])
        setPotMood('happy')
        spawnParticles('bubble', 10)
        spawnParticles('star', 8)

        // Atılan heceyi seslendir (rate: 0.9, pitch: 1.1)
        speakTurkish(`${jar.text}!`, 0.9, 1.1)

        if (newCount < currentDish.targetParts.length) {
          const nextPart = currentDish.targetParts[newCount]
          setChefSpeech(`Mmm, çok lezzetli! Şimdi sırada "${nextPart}" hecesi var!`)
          setTimeout(() => setPotMood('idle'), 900)
        } else {
          // Tüm heceler eklendi -> AŞAMA 2: KEPÇE İLE KARIŞTIRMA BAŞLASIN!
          setTimeout(() => {
            setCookingPhase('stirring')
            setPotMood('stirring')
            const stirMsg = 'Harika! Şimdi parmağınla kepçeyi çevirerek yemeği pişir!'
            setChefSpeech(stirMsg)
            playSoundEffect('bubble')
            speakTurkish(stirMsg, 0.9, 1.1)
          }, 750)
        }
      } else {
        // YANLIŞ HECE VEYA YANLIŞ SIRA -> HAPŞIRMA MEKANİĞİ!
        playSoundEffect('sneeze')
        setPotMood('sneeze')
        spawnParticles('smoke_green', 14)

        const sneezeText =
          'Hapşuuu! Bu hece bu yemeğe uymadı, sıradaki heceyi bulalım!'
        setChefSpeech(sneezeText)
        speakTurkish(sneezeText, 0.9, 1.1)

        setTimeout(() => {
          setPotMood('idle')
        }, 2100)
      }
    },
    [addedCount, cookingPhase, currentDish, spawnParticles]
  )

  // Bezier Curve uçuş animasyonu döngüsü (Tıklandığında kavanozun yay çizerek tencereye dökülmesi)
  useEffect(() => {
    if (!flyingJar) return
    const frame = requestAnimationFrame(() => {
      setFlyingJar((prev) => {
        if (!prev) return null
        if (!prev.bouncingBack) {
          const nextP = prev.progress + 0.055
          if (nextP >= 1) {
            if (prev.isCorrect) {
              evaluateJarDrop(prev.jar)
              return null
            } else {
              // Yanlış hece ise tencereye çarpıp hapşırtır ve rafına geri seker!
              evaluateJarDrop(prev.jar)
              return { ...prev, progress: 1, bouncingBack: true }
            }
          }
          return { ...prev, progress: nextP }
        } else {
          // Rafına geri sekme animasyonu
          const backP = prev.progress - 0.065
          if (backP <= 0) {
            return null
          }
          return { ...prev, progress: backP }
        }
      })
    })
    return () => cancelAnimationFrame(frame)
  }, [flyingJar, evaluateJarDrop])

  // Kavanoza tıklandığında Bezier eğrisi uçuşunu başlat
  const triggerBezierJarFlight = (jar: JarItem) => {
    if (cookingPhase !== 'adding' || flyingJar) return
    const stageEl = stageRef.current
    const potEl = potRef.current
    const jarEl = jarRefs.current[jar.id]

    if (!stageEl || !potEl || !jarEl) {
      evaluateJarDrop(jar)
      return
    }

    const stageRect = stageEl.getBoundingClientRect()
    const potRect = potEl.getBoundingClientRect()
    const jarRect = jarEl.getBoundingClientRect()

    const startX = jarRect.left - stageRect.left + jarRect.width / 2
    const startY = jarRect.top - stageRect.top + jarRect.height / 2
    const endX = potRect.left - stageRect.left + potRect.width / 2
    const endY = potRect.top - stageRect.top + potRect.height * 0.28

    const expectedPart = currentDish.targetParts[addedCount]
    const isCorrect = jar.text === expectedPart

    playSoundEffect('click')
    setFlyingJar({
      jar,
      startX,
      startY,
      endX,
      endY,
      progress: 0.02,
      isCorrect,
      bouncingBack: false,
    })
  }

  // Pointer Events (Drag & Drop + Tıklama hibrit desteği, Multi-Touch Korumalı)
  const handleJarPointerDown = (e: React.PointerEvent<HTMLDivElement>, jar: JarItem) => {
    if (cookingPhase !== 'adding' || flyingJar) return
    // Aynı anda yalnızca 1 kavanoz sürüklenebilir
    if (dragState && dragState.pointerId !== e.pointerId) return

    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)

    setDragState({
      jar,
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      moved: false,
    })
  }

  const handleJarPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.pointerId !== e.pointerId) return
    e.preventDefault()
    const dist = Math.hypot(e.clientX - dragState.startX, e.clientY - dragState.startY)
    setDragState((prev) =>
      prev
        ? {
            ...prev,
            currentX: e.clientX,
            currentY: e.clientY,
            moved: prev.moved || dist > 8,
          }
        : null
    )
  }

  const handleJarPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState || dragState.pointerId !== e.pointerId) return
    e.preventDefault()
    const { jar, moved, currentX, currentY } = dragState
    setDragState(null)

    // Eğer çocuk sürüklemek yerine dokunduysa/tıkladıysa -> Bezier uçuş animasyonunu başlat!
    if (!moved) {
      triggerBezierJarFlight(jar)
      return
    }

    // Sürüklediyse tencerenin yakınında mı kontrol et
    const potEl = potRef.current
    if (potEl) {
      const potRect = potEl.getBoundingClientRect()
      const potCenterX = potRect.left + potRect.width / 2
      const potCenterY = potRect.top + potRect.height / 2
      const distToPot = Math.hypot(currentX - potCenterX, currentY - potCenterY)

      if (distToPot < Math.max(potRect.width, potRect.height) * 0.85) {
        evaluateJarDrop(jar)
        return
      }
    }
  }

  // AŞAMA 3: SERVİS VE KELİME BİRLEŞTİRME (Heceler tek tek yanıp sönerek okunur, sonra tam kelime okunur)
  const triggerServingCelebration = useCallback(() => {
    if (!currentDish) return
    setCookingPhase('serving')
    setPotMood('served')
    playSoundEffect('fanfare')
    spawnParticles('smoke_rainbow', 16)
    spawnParticles('confetti', 28)

    setChefSpeech(`Tencerenin kapağı fırladı! Şimdi heceleri birleştirip okuyalım!`)

    // Önce heceleri sırayla tek tek okut
    const parts = currentDish.targetParts
    parts.forEach((part, idx) => {
      setTimeout(() => {
        setActiveReadSyllableIdx(idx)
        playSoundEffect('pop')
        speakTurkish(part, 0.85, 1.12)
      }, idx * 950 + 300)
    })

    // Ardından tüm heceleri birleştirip coşkulu tam kelimeyi okut
    const totalDelay = parts.length * 950 + 450
    setTimeout(() => {
      setActiveReadSyllableIdx(99) // Tam kelime birleşti
      playSoundEffect('applause')
      spawnParticles('confetti', 35)
      speakTurkish(
        `${currentDish.word}! Tebrikler Şef ${childName}!`,
        0.92,
        1.15
      )
      setChefSpeech(`${currentDish.word}! Tebrikler Şef ${childName}! Nefis oldu!`)
      onComplete()

      setCookedPlatesCount((prev) => {
        const nextPlates = prev + 1
        if (nextPlates === 5) {
          setTimeout(() => {
            setShowMasterChefModal(true)
            playSoundEffect('applause')
            speakTurkish(
              `Muhteşemsin Şef ${childName}! Tam 5 yemek pişirdin ve Usta Şef Rozetini kazandın!`,
              0.92,
              1.15
            )
          }, 1400)
        }
        return nextPlates
      })
    }, totalDelay)
  }, [childName, currentDish, onComplete, spawnParticles])

  // AŞAMA 2: KEPÇE İLE KARIŞTIRMA HAREKETİ
  const advanceStirring = useCallback(
    (amount: number) => {
      if (cookingPhase !== 'stirring') return
      const now = Date.now()
      if (now - lastStirSoundRef.current > 130) {
        playSoundEffect('stir')
        lastStirSoundRef.current = now
      }

      setLadleAngle((prev) => prev + 28)
      if (Math.random() < 0.35) {
        spawnParticles('bubble', 2)
      }

      setStirProgress((prev) => {
        const next = Math.min(100, prev + amount)
        if (next >= 100 && prev < 100) {
          setTimeout(() => {
            triggerServingCelebration()
          }, 250)
        }
        return next
      })
    },
    [cookingPhase, spawnParticles, triggerServingCelebration]
  )

  const handlePotPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (cookingPhase !== 'stirring') return
    if (e.buttons > 0 || e.pointerType === 'touch' || isStirDraggingRef.current) {
      e.preventDefault()
      advanceStirring(3.2)
    }
  }

  // Bezier eğrisi üzerindeki anlık koordinatı hesapla
  const getFlyingJarPosition = () => {
    if (!flyingJar) return null
    const t = flyingJar.progress
    const { startX, startY, endX, endY } = flyingJar
    // Tepe kontrol noktası (yay çizmesi için yukarıda)
    const cx = (startX + endX) / 2
    const cy = Math.min(startY, endY) - 130

    const x = (1 - t) * (1 - t) * startX + 2 * (1 - t) * t * cx + t * t * endX
    const y = (1 - t) * (1 - t) * startY + 2 * (1 - t) * t * cy + t * t * endY
    const rot = flyingJar.bouncingBack ? -t * 45 : t * 55
    return { x, y, rot }
  }

  const flyingPos = getFlyingJarPosition()

  return (
    <div ref={stageRef} className="kitchen-v2-scene">
      {/* ÜST MUTFAK BARI: Başlık, Zorluk Seviyeleri ve Tarif Defterim / Tabaklarım */}
      <div className="kitchen-v2-topbar">
        <div className="kitchen-v2-brand">
          <span className="kitchen-v2-badge">
            <ChefHat size={18} /> Hece Mutfağı
          </span>
          <h3>Şef {childName}'nın Büyülü Mutfağı</h3>
        </div>

        {/* TARİF DEFTERİM / PİŞEN TABAKLARIM SAYACI */}
        <div className="kitchen-plates-tracker" title="Pişirilen Yemekler ve Usta Şef Rozeti">
          <span className="plates-label">🍽️ Tabaklarım:</span>
          <div className="plates-stars-row">
            {[1, 2, 3, 4, 5].map((num) => {
              const earned = cookedPlatesCount >= num
              return (
                <span key={num} className={`plate-star-slot ${earned ? 'earned' : ''}`}>
                  {earned ? '⭐' : '🍽️'}
                </span>
              )
            })}
          </div>
          {cookedPlatesCount >= 5 && (
            <span className="master-chef-mini-badge">🏅 Usta Şef!</span>
          )}
        </div>
      </div>

      {/* SEVİYE SEÇİCİ SEKMELER (Seviye 1 Kolay, Seviye 2 Orta, Seviye 3 İleri) */}
      <div className="kitchen-level-tabs">
        {letter && (
          <button
            type="button"
            className={`kitchen-lvl-btn ${selectedLevel === 'letter' ? 'active' : ''}`}
            onClick={() => {
              playSoundEffect('click')
              setSelectedLevel('letter')
            }}
          >
            🔤 "{letter.upper}" Harfi Menüsü
          </button>
        )}
        <button
          type="button"
          className={`kitchen-lvl-btn ${selectedLevel === 1 ? 'active' : ''}`}
          onClick={() => {
            playSoundEffect('click')
            setSelectedLevel(1)
          }}
        >
          🟢 Seviye 1 (Kolay • 1. Grup)
        </button>
        <button
          type="button"
          className={`kitchen-lvl-btn ${selectedLevel === 2 ? 'active' : ''}`}
          onClick={() => {
            playSoundEffect('click')
            setSelectedLevel(2)
          }}
        >
          🟡 Seviye 2 (Orta • 2 Hece)
        </button>
        <button
          type="button"
          className={`kitchen-lvl-btn ${selectedLevel === 3 ? 'active' : ''}`}
          onClick={() => {
            playSoundEffect('click')
            setSelectedLevel(3)
          }}
        >
          🔴 Seviye 3 (İleri • 3+ Hece)
        </button>
      </div>

      {/* AHŞAP SİPARİŞ PANOSU (TARİF KARTI) */}
      <div className="wooden-order-board">
        <div className="wooden-nail nail-left" />
        <div className="wooden-nail nail-right" />

        <div className="order-board-left">
          <div className="order-big-emoji-box">{currentDish.emoji}</div>
          <div className="order-title-col">
            <span className="order-counter-tag">
              Tarif {dishIdx + 1} / {activeDishes.length}
            </span>
            <h4 className="order-word-heading">{currentDish.word}</h4>
            <span className="order-sub-recipe">{currentDish.recipeTitle}</span>
          </div>
          <button
            type="button"
            className="order-audio-btn"
            onClick={() => {
              playSoundEffect('pop')
              speakTurkish(
                `${currentDish.word}! ${currentDish.targetParts.join(' ... ')} ... ${currentDish.word}!`,
                0.88,
                1.1
              )
            }}
            title="Kelimeyi Sesli Dinle"
          >
            <Volume2 size={24} />
            <span>Dinle</span>
          </button>
        </div>

        {/* HECE KUTUCUKLARI: [ LA ] + [ ? ] */}
        <div className="order-syllable-boxes">
          {currentDish.targetParts.map((part, idx) => {
            const isFilled = idx < addedCount
            const isNext = idx === addedCount && cookingPhase === 'adding'
            return (
              <div key={idx} className="syllable-box-wrapper">
                {idx > 0 && <span className="syllable-plus-sign">+</span>}
                <div
                  className={`recipe-syllable-box ${isFilled ? 'filled' : 'empty'} ${
                    isNext ? 'next-target' : ''
                  }`}
                >
                  <span className="box-step-num">{idx + 1}. Hece</span>
                  <strong className="box-syllable-text">{isFilled ? part : '?'}</strong>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* ORTA SAHNE: ŞEF KEDİ MASKOTU & BÜYÜLÜ KAYNAYAN TENCERE */}
      <div className="kitchen-center-stage">
        {/* ŞEF KEDİ MASKOTU VE KONUŞMA BALONU */}
        <div className="chef-mascot-column">
          <div className="chef-Mascot-svg-wrap">
            <svg viewBox="0 0 140 150" className="chef-cat-svg">
              {/* Beyaz Aşçı Şapkası */}
              <path
                d="M35 48 C20 48, 18 22, 42 20 C48 6, 92 6, 98 20 C122 22, 120 48, 105 48 Z"
                fill="#ffffff"
                stroke="#cbd5e1"
                strokeWidth="3"
              />
              <rect x="36" y="44" width="68" height="16" rx="6" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="3" />
              <line x1="52" y1="44" x2="52" y2="60" stroke="#e2e8f0" strokeWidth="2" />
              <line x1="70" y1="44" x2="70" y2="60" stroke="#e2e8f0" strokeWidth="2" />
              <line x1="88" y1="44" x2="88" y2="60" stroke="#e2e8f0" strokeWidth="2" />

              {/* Kedi Kulakları */}
              <polygon points="34,62 24,38 50,54" fill="#fb923c" stroke="#c2410c" strokeWidth="3" />
              <polygon points="106,62 116,38 90,54" fill="#fb923c" stroke="#c2410c" strokeWidth="3" />
              <polygon points="36,59 29,43 46,54" fill="#fda4af" />
              <polygon points="104,59 111,43 94,54" fill="#fda4af" />

              {/* Kedi Yüzü */}
              <circle cx="70" cy="86" r="36" fill="#fb923c" stroke="#c2410c" strokeWidth="3" />
              {/* Yanaklar */}
              <ellipse cx="48" cy="92" rx="7" ry="4.5" fill="#fda4af" />
              <ellipse cx="92" cy="92" rx="7" ry="4.5" fill="#fda4af" />

              {/* Gözler */}
              {potMood === 'sneeze' ? (
                <>
                  <path d="M48 78 L58 84 L48 88" fill="none" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
                  <path d="M92 78 L82 84 L92 88" fill="none" stroke="#1e293b" strokeWidth="3.5" strokeLinecap="round" />
                </>
              ) : (
                <>
                  <circle cx="54" cy="80" r="6" fill="#0f172a" />
                  <circle cx="86" cy="80" r="6" fill="#0f172a" />
                  <circle cx="52" cy="78" r="2.2" fill="#ffffff" />
                  <circle cx="84" cy="78" r="2.2" fill="#ffffff" />
                </>
              )}

              {/* Burun ve Gülümseyen Ağız */}
              <polygon points="70,88 65,83 75,83" fill="#f43f5e" />
              <path
                d="M62 93 Q70 101 78 93"
                fill="none"
                stroke="#1e293b"
                strokeWidth="3"
                strokeLinecap="round"
              />

              {/* Kırmızı Şef Fular & Önlük */}
              <path d="M42 116 Q70 132 98 116 L104 145 L36 145 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="3" />
              <path d="M46 116 Q70 128 94 116 L86 128 L70 123 L54 128 Z" fill="#ef4444" />
            </svg>
            <span className="chef-cat-tag">Şef Pamuk 🐱</span>
          </div>

          <div
            className={`chef-speech-bubble ${potMood === 'sneeze' ? 'bubble-sneeze' : ''}`}
            onClick={() => speakTurkish(chefSpeech, 0.9, 1.1)}
          >
            <p>{chefSpeech}</p>
            <span className="bubble-listen-mini">
              <Volume2 size={14} /> Dinle
            </span>
          </div>
        </div>

        {/* BÜYÜLÜ KAYNAYAN TENCERE (CAULDRON SVG + KEPÇE + PARÇACIKLAR) */}
        <div
          ref={potRef}
          className={`cauldron-Interactive-zone ${potMood}`}
          onPointerDown={() => {
            if (cookingPhase === 'stirring') {
              isStirDraggingRef.current = true
              advanceStirring(8)
            }
          }}
          onPointerMove={handlePotPointerMove}
          onPointerUp={() => {
            isStirDraggingRef.current = false
          }}
          onPointerCancel={() => {
            isStirDraggingRef.current = false
          }}
        >
          {/* AŞAMA 2: KARIŞTIRMA İLERLEME ÇUBUĞU (PROGRESS BAR) */}
          {cookingPhase === 'stirring' && (
            <div className="stir-progress- floating-hud">
              <div className="stir-hud-header">
                <span>🥄 Kepçeyle Karıştır ve Pişir!</span>
                <strong>%{Math.round(stirProgress)}</strong>
              </div>
              <div className="stir-bar-track">
                <div
                  className="stir-bar-fill"
                  style={{ width: `${stirProgress}%` }}
                />
              </div>
              <button
                type="button"
                className="stir-quick-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  advanceStirring(20)
                }}
              >
                🥄 Kepçeyle Karıştır! (+%20)
              </button>
            </div>
          )}

          {/* PARÇACIK KATMANI (Baloncuklar, Yıldızlar, Yeşil Hapşırık Dumanı, Gökkuşağı Dumanı) */}
          <div className="pot-particles-layer">
            {particles.map((pt) => (
              <span
                key={pt.id}
                className={`pot-particle pt-${pt.kind}`}
                style={{
                  left: `${pt.x}%`,
                  top: `${pt.y}%`,
                  width: `${pt.size}px`,
                  height: `${pt.size}px`,
                  backgroundColor:
                    pt.kind === 'star' || pt.kind === 'confetti' ? 'transparent' : pt.color,
                  color: pt.color,
                  opacity: pt.alpha,
                }}
              >
                {pt.kind === 'star' ? '⭐' : pt.kind === 'confetti' ? '🎉' : ''}
              </span>
            ))}
          </div>

          {/* BÜYÜLÜ TENCERE SVG ÇİZİMİ */}
          <svg viewBox="0 0 280 240" className="magic-cauldron-svg">
            <defs>
              <radialGradient id="cauldronBodyGrad" cx="38%" cy="35%" r="65%">
                <stop offset="0%" stopColor={potMood === 'sneeze' ? '#ef4444' : '#475569'} />
                <stop offset="65%" stopColor={potMood === 'sneeze' ? '#b91c1c' : '#1e293b'} />
                <stop offset="100%" stopColor={potMood === 'sneeze' ? '#7f1d1d' : '#0f172a'} />
              </radialGradient>
              <linearGradient id="soupGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={soupColor} />
                <stop offset="50%" stopColor="#fde047" />
                <stop offset="100%" stopColor={soupColor} />
              </linearGradient>
            </defs>

            {/* Ocak Alevleri */}
            <g className="stove-flames-svg">
              <path
                d="M75 215 Q90 180 105 215 Q120 175 140 215 Q160 175 175 215 Q190 180 205 215 Z"
                fill="#f97316"
              />
              <path
                d="M90 215 Q105 190 120 215 Q140 185 160 215 Q175 190 190 215 Z"
                fill="#facc15"
              />
            </g>

            {/* Tencere Kulpları */}
            <path
              d="M38 98 C10 98, 10 142, 42 142"
              fill="none"
              stroke="#334155"
              strokeWidth="12"
              strokeLinecap="round"
            />
            <path
              d="M242 98 C270 98, 270 142, 238 142"
              fill="none"
              stroke="#334155"
              strokeWidth="12"
              strokeLinecap="round"
            />

            {/* Tencere Ana Gövdesi */}
            <path
              d="M42 78 C32 165, 65 204, 140 204 C215 204, 248 165, 238 78 Z"
              fill="url(#cauldronBodyGrad)"
              stroke="#0f172a"
              strokeWidth="4"
            />

            {/* Tencere Üst Çemberi ve İçindeki Renkli İksir/Çorba */}
            <ellipse cx="140" cy="78" rx="102" ry="24" fill="#1e293b" stroke="#0f172a" strokeWidth="4" />
            <ellipse cx="140" cy="78" rx="92" ry="18" fill="url(#soupGrad)" />

            {/* Aşama 2'de Dönen Çorba Girdabı (Swirl) */}
            {cookingPhase === 'stirring' && (
              <g
                transform={`translate(140, 78) rotate(${ladleAngle})`}
                opacity="0.85"
              >
                <path
                  d="M-45 0 Q-20 -10 0 0 Q20 10 45 0"
                  fill="none"
                  stroke="#ffffff"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <circle cx="-25" cy="-4" r="5" fill="#ffffff" />
                <circle cx="28" cy="5" r="4" fill="#ffffff" />
              </g>
            )}

            {/* AŞAMA 2: BÜYÜK TAHTA KEPÇE (STIRRING MECHANIC) */}
            {cookingPhase === 'stirring' && (
              <g
                className="wooden-ladle-svg"
                transform={`translate(${140 + Math.sin((ladleAngle * Math.PI) / 180) * 34}, 64) rotate(${
                  Math.cos((ladleAngle * Math.PI) / 180) * 18
                })`}
              >
                {/* Kepçe Sapı */}
                <rect
                  x="-7"
                  y="-62"
                  width="14"
                  height="70"
                  rx="7"
                  fill="#b45309"
                  stroke="#78350f"
                  strokeWidth="3"
                />
                {/* Kepçe Haznesi */}
                <ellipse
                  cx="0"
                  cy="10"
                  rx="24"
                  ry="12"
                  fill="#d97706"
                  stroke="#78350f"
                  strokeWidth="3"
                />
                <ellipse cx="0" cy="10" rx="18" ry="8" fill={soupColor} />
              </g>
            )}

            {/* AŞAMA 3: HAVAYA FIRLAYAN TENCERE KAPAĞI */}
            {cookingPhase === 'serving' && (
              <g className="flying-pot-lid">
                <ellipse cx="140" cy="22" rx="95" ry="18" fill="#475569" stroke="#0f172a" strokeWidth="3" />
                <circle cx="140" cy="6" r="11" fill="#facc15" stroke="#0f172a" strokeWidth="3" />
              </g>
            )}

            {/* TENCERENİN SEVİMLİ YÜZ İFADELERİ (Gözler ve Ağız) */}
            <g className="cauldron-cute-face">
              {potMood === 'sneeze' ? (
                <>
                  {/* Ekşimiş / Hapşıran Gözler (> <) */}
                  <path
                    d="M92 122 L112 132 L92 142"
                    fill="none"
                    stroke="#fef08a"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M188 122 L168 132 L188 142"
                    fill="none"
                    stroke="#fef08a"
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Hapşıran Dalgalı Ağız */}
                  <path
                    d="M115 168 Q128 152 140 168 Q152 182 165 165"
                    fill="none"
                    stroke="#fef08a"
                    strokeWidth="5"
                    strokeLinecap="round"
                  />
                </>
              ) : (
                <>
                  {/* Parlak Sevimli Gözler */}
                  <circle cx="102" cy="130" r="11" fill="#ffffff" />
                  <circle cx="178" cy="130" r="11" fill="#ffffff" />
                  <circle cx="102" cy="130" r="6" fill="#0f172a" />
                  <circle cx="178" cy="130" r="6" fill="#0f172a" />
                  <circle cx="99" cy="127" r="2.5" fill="#ffffff" />
                  <circle cx="175" cy="127" r="2.5" fill="#ffffff" />
                  {/* Pembe Yanaklar */}
                  <ellipse cx="82" cy="144" rx="9" ry="5" fill="#f43f5e" opacity="0.7" />
                  <ellipse cx="198" cy="144" rx="9" ry="5" fill="#f43f5e" opacity="0.7" />
                  {/* Mutlu Gülümseyen Ağız */}
                  <path
                    d="M114 152 Q140 178 166 152"
                    fill={potMood === 'happy' || potMood === 'served' ? '#f43f5e' : 'none'}
                    stroke="#ffffff"
                    strokeWidth="4.5"
                    strokeLinecap="round"
                  />
                </>
              )}
            </g>

            {/* Tencere Üstünde Eklenen Heceler Özeti */}
            <text
              x="140"
              y="83"
              textAnchor="middle"
              fill="#ffffff"
              fontWeight="900"
              fontSize="16"
              stroke="#0f172a"
              strokeWidth="3"
              paintOrder="stroke"
            >
              {addedCount === 0
                ? 'Heceleri Bırak!'
                : currentDish.targetParts.slice(0, addedCount).join(' + ')}
            </text>
          </svg>
        </div>
      </div>

      {/* AŞAMA 1: BAHARAT KAVANOZLARI RAFI (SVG CAM KAVANOZLAR - SÜRÜKLE VEYA DOKUN) */}
      {cookingPhase === 'adding' && (
        <div className="wooden-spice-shelf">
          <div className="shelf-plank-top">
            <span>
              🫙 <strong>Baharat Kavanozları Rafı:</strong> Kavanozu parmağınla tencereye{' '}
              <u>sürükle</u> veya üzerine <u>dokun</u>!
            </span>
          </div>

          <div className="svg-jars-grid">
            {shelfJars.map((jar) => {
              const isUsed = usedJarIds.includes(jar.id)
              const isDraggingThis = dragState?.jar.id === jar.id

              return (
                <div
                  key={jar.id}
                  ref={(el) => {
                    jarRefs.current[jar.id] = el
                  }}
                  className={`svg-spice-jar-item ${isUsed ? 'jar-empty-used' : ''} ${
                    isDraggingThis ? 'jar-dragging-source' : ''
                  }`}
                  onPointerDown={(e) => !isUsed && handleJarPointerDown(e, jar)}
                  onPointerMove={handleJarPointerMove}
                  onPointerUp={handleJarPointerUp}
                  onPointerCancel={() => setDragState(null)}
                >
                  <svg viewBox="0 0 100 125" className="jar-vector-svg">
                    {/* Mantar / Ahşap Kavanoz Kapağı */}
                    <rect
                      x="26"
                      y="6"
                      width="48"
                      height="14"
                      rx="5"
                      fill="#92400e"
                      stroke="#451a03"
                      strokeWidth="2.5"
                    />
                    {/* Kavanoz Boğazı */}
                    <rect
                      x="22"
                      y="18"
                      width="56"
                      height="8"
                      rx="4"
                      fill="#e2e8f0"
                      stroke="#94a3b8"
                      strokeWidth="2"
                    />
                    {/* Cam Gövde */}
                    <rect
                      x="14"
                      y="26"
                      width="72"
                      height="90"
                      rx="18"
                      fill="rgba(255, 255, 255, 0.88)"
                      stroke={jar.color}
                      strokeWidth="4"
                    />
                    {/* İçindeki Renkli Toz / Sıvı İksir */}
                    {!isUsed && (
                      <path
                        d="M17 62 Q50 56 83 62 L83 98 C83 108, 75 113, 66 113 L34 113 C25 113, 17 108, 17 98 Z"
                        fill={jar.liquidColor}
                        opacity="0.45"
                      />
                    )}
                    {/* Cam Parlama Efekti */}
                    <path
                      d="M23 36 L23 96"
                      stroke="#ffffff"
                      strokeWidth="4"
                      strokeLinecap="round"
                      opacity="0.8"
                    />
                    {/* Kavanoz Etiketi */}
                    <rect
                      x="20"
                      y="46"
                      width="60"
                      height="46"
                      rx="10"
                      fill="#ffffff"
                      stroke={jar.color}
                      strokeWidth="2.5"
                    />
                    {/* Hece / Harf Yazısı (Fredoka Font) */}
                    <text
                      x="50"
                      y="77"
                      textAnchor="middle"
                      fontFamily="'Fredoka', 'Comic Neue', sans-serif"
                      fontWeight="900"
                      fontSize={jar.text.length >= 3 ? '21' : '26'}
                      fill="#0f172a"
                    >
                      {jar.text}
                    </text>
                  </svg>
                  <span className="jar-bottom-hint">
                    {isUsed ? '✅ Eklendi' : '🍲 Tencereye At'}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="wooden-shelf-beam" />
        </div>
      )}

      {/* AŞAMA 3: SERVİS VE KELİME BİRLEŞTİRME KARTI */}
      {cookingPhase === 'serving' && (
        <div className="serving-reward-card">
          <div className="serving-rainbow-header">
            <Sparkles size={24} />
            <span>Aşama 3: Yemek Pişti! Heceleri Birleştirelim!</span>
          </div>

          <div className="serving-dish-showcase">
            <div className="serving-big-emoji">{currentDish.emoji}</div>

            {/* Hecelerin Tek Tek Yanıp Sönmesi ve Birleşmesi */}
            <div className="serving-syllables-merge-row">
              {currentDish.targetParts.map((part, idx) => {
                const isReadingThis =
                  activeReadSyllableIdx === idx || activeReadSyllableIdx === 99
                return (
                  <span
                    key={idx}
                    className={`serving-syl-pill ${isReadingThis ? 'lit' : ''}`}
                  >
                    {part}
                  </span>
                )
              })}
            </div>

            <div
              className={`serving-final-word ${
                activeReadSyllableIdx === 99 ? 'merged-glow' : ''
              }`}
            >
              {currentDish.word}
            </div>
          </div>

          <div className="serving-actions-row">
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                playSoundEffect('click')
                setCookingPhase('adding')
                setAddedCount(0)
                setUsedJarIds([])
                setPotMood('idle')
                setStirProgress(0)
                setActiveReadSyllableIdx(-1)
              }}
            >
              <RotateCcw size={18} /> Tekrar Pişir
            </button>

            <button
              type="button"
              className="btn-primary btn-large"
              onClick={() => {
                playSoundEffect('pop')
                if (dishIdx < activeDishes.length - 1) {
                  setDishIdx((i) => i + 1)
                } else if (onNext) {
                  onNext()
                } else {
                  setDishIdx(0)
                }
              }}
            >
              {dishIdx < activeDishes.length - 1 ? (
                <>
                  Sıradaki Tarife Geç <ChevronRight size={22} />
                </>
              ) : (
                <>
                  <CheckCircle2 size={22} /> Menüyü Tamamla! 🏆
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* TIKLAMA İLE BEZIER EĞRİSİ UÇUŞ KAVANOZU */}
      {flyingJar && flyingPos && (
        <div
          className="bezier-flying-jar"
          style={{
            left: `${flyingPos.x}px`,
            top: `${flyingPos.y}px`,
            transform: `translate(-50%, -50%) rotate(${flyingPos.rot}deg)`,
          }}
        >
          <div className="flying-jar-badge" style={{ borderColor: flyingJar.jar.color }}>
            {flyingJar.jar.text}
          </div>
        </div>
      )}

      {/* PARMAKLA SÜRÜKLENEN KAVANOZ (DRAG OVERLAY) */}
      {dragState && dragState.moved && (
        <div
          className="pointer-dragged-jar"
          style={{
            left: `${dragState.currentX}px`,
            top: `${dragState.currentY}px`,
          }}
        >
          <div className="flying-jar-badge" style={{ borderColor: dragState.jar.color }}>
            🫙 {dragState.jar.text}
          </div>
        </div>
      )}

      {/* 5 YEMEK PİŞİNCE AÇILAN "USTA ŞEF ROZETİ" ÖDÜL MODALI */}
      {showMasterChefModal && (
        <div
          className="master-chef-modal-backdrop"
          onClick={() => setShowMasterChefModal(false)}
        >
          <div
            className="master-chef-modal-card"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="master-badge-icon">🏅👑👨‍🍳</div>
            <h2>Tebrikler Usta Şef {childName}!</h2>
            <p>
              Hece Mutfağında tam <strong>5 lezzetli kelime yemeği</strong> pişirdin ve{' '}
              <strong>Altın Usta Şef Rozetini</strong> kazandın!
            </p>
            <button
              type="button"
              className="btn-primary btn-large"
              onClick={() => {
                playSoundEffect('fanfare')
                setShowMasterChefModal(false)
              }}
            >
              <Award size={22} /> Rozeti Al ve Devam Et!
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
