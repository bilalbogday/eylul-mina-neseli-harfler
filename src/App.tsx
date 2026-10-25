import { useEffect, useMemo, useState } from 'react'
import {
  Volume2,
  VolumeX,
  Star,
  Award,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Cloud,
  CheckCircle2,
  Ear,
  BookOpen,
  Users,
  Copy,
  Check,
  RefreshCw,
  Camera,
  Utensils,
  Flashlight,
  Music,
  Rocket,
  Ship,
  Anchor,
  Swords,
  ListChecks,
  Play,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  RotateCcw,
  X,
} from 'lucide-react'
import {
  ISLAND_GROUPS,
  LETTERS_DATA,
  getLearnedDistractorLetters,
  type LetterCurriculum,
} from './curriculum'
import { LighthouseTracingGame } from './LighthouseTracingGame'
import { XylophoneMusicGame } from './XylophoneMusicGame'
import { SpaceRocketGame } from './SpaceRocketGame'
import { OceanWinchGame } from './OceanWinchGame'
import { NeonSamuraiGame } from './NeonSamuraiGame'
import { SyllableKitchenGame } from './SyllableKitchenGame'
import { LetterDetectiveGame } from './LetterDetectiveGame'
import { ProfilePhotoModal } from './ProfilePhotoModal'
import {
  getOrCreateDeviceId,
  isValidBackupCode,
  maskBackupCode,
  loadCloudBackup,
  saveCloudBackup,
  saveGlobalAvatar,
  loadGlobalAvatar,
} from './firebase'
import {
  playSoundEffect,
  speakTurkish,
  playWelcomeGreeting,
  isSoundMuted,
  toggleSoundMuted,
  repeatLastSpeech,
  stopAllAudio,
} from './sound'
import './App.css'

export type ExerciseStepKey =
  | 'sound'
  | 'trace'
  | 'syllable'
  | 'detective'
  | 'xylophone'
  | 'rocket'
  | 'winch'
  | 'quiz'
  | 'samurai'

export interface LetterActivityProgress {
  sound?: boolean
  trace?: boolean
  syllable?: boolean
  detective?: boolean
  xylophone?: boolean
  rocket?: boolean
  winch?: boolean
  quiz?: boolean
  game?: boolean
  samurai?: boolean
}

export interface ChildProfile {
  id: string
  name: string
  avatar: string
  stars: number
  letterProgress: Record<string, LetterActivityProgress>
}

export const STICKER_STAR_GOAL = 5

export const LESSON_STEPS: Array<{
  key: ExerciseStepKey
  num: number
  title: string
  shortTitle: string
  emoji: string
}> = [
  { key: 'sound', num: 1, title: 'Sesi Tanı', shortTitle: 'Ses', emoji: '🔊' },
  { key: 'trace', num: 2, title: 'Deniz Feneri Çizim', shortTitle: 'Çizim', emoji: '⛵' },
  { key: 'syllable', num: 3, title: 'Hece Mutfağı', shortTitle: 'Hece', emoji: '🍲' },
  { key: 'detective', num: 4, title: 'Harf Dedektifi', shortTitle: 'Dedektif', emoji: '🔦' },
  { key: 'xylophone', num: 5, title: 'Nota Ksilofonu', shortTitle: 'Müzik', emoji: '🎹' },
  { key: 'rocket', num: 6, title: 'Kargo Roketi', shortTitle: 'Roket', emoji: '🚀' },
  { key: 'winch', num: 7, title: 'Fırtına Vinci', shortTitle: 'Vinç', emoji: '⚓' },
  { key: 'quiz', num: 8, title: 'Dinle & Bul', shortTitle: 'Test', emoji: '👂' },
  { key: 'samurai', num: 9, title: 'Harf Samurayı', shortTitle: 'Samuray', emoji: '⚔️' },
]

const AVATAR_OPTIONS = [
  '👧',
  '👸',
  '🧚‍♀️',
  '🧜‍♀️',
  '🦸‍♀️',
  '🩰',
  '👩‍🚀',
  '👩‍🎨',
  '🎀',
  '👑',
  '🌸',
  '🍓',
  '🦄',
  '🐰',
  '🐱',
  '🐶',
  '🐼',
  '🦊',
  '🦋',
  '🦩',
  '🧒',
  '👦',
  '🦸‍♂️',
  '🚀',
]

const STORAGE_PROFILES_KEY = 'eylul_mina_neseli_harfler_profiles_v1'
const STORAGE_ACTIVE_ID_KEY = 'eylul_mina_neseli_harfler_active_profile_v1'

const DEFAULT_EYLUL_MINA_PHOTO = '/images/eylul-mina-avatar.jpg'

function createDefaultProfiles(): ChildProfile[] {
  return [
    {
      id: 'prof_eylul_mina',
      name: 'Eylül Mina',
      avatar: DEFAULT_EYLUL_MINA_PHOTO,
      stars: 0,
      letterProgress: {},
    },
  ]
}

// İlerleme hesaplama yardımcıları (Tek ve Tutarlı Ödül Modeli)
export function isStepDoneForLetter(
  prog: LetterActivityProgress | undefined,
  stepKey: ExerciseStepKey
): boolean {
  if (!prog) return false
  if (stepKey === 'samurai') {
    return Boolean(prog.samurai || prog.game)
  }
  return Boolean(prog[stepKey])
}

export function getCompletedStepCountForProg(prog: LetterActivityProgress | undefined): number {
  if (!prog) return 0
  return LESSON_STEPS.filter((s) => isStepDoneForLetter(prog, s.key)).length
}

export function getStarsForProg(prog: LetterActivityProgress | undefined): number {
  if (!prog) return 0
  const count = getCompletedStepCountForProg(prog)
  // Eski 4 temel alıştırmayı bitirmiş olan profiller de 5 yıldıza (tam çıkartmaya) hak kazanır
  const legacyCoreDone = Boolean(prog.sound && prog.trace && prog.syllable && prog.quiz)
  if (legacyCoreDone) return STICKER_STAR_GOAL
  return Math.min(STICKER_STAR_GOAL, count)
}

export function isStickerUnlockedForProg(prog: LetterActivityProgress | undefined): boolean {
  return getStarsForProg(prog) >= STICKER_STAR_GOAL
}

// Buluttan gelen profilleri doğrulama ve yerel ilerlemeyi kaybetmeden güvenli birleştirme
function sanitizeAndMergeProfiles(
  localList: ChildProfile[],
  incomingRaw: unknown
): ChildProfile[] {
  if (!Array.isArray(incomingRaw)) return localList
  const validIncoming: ChildProfile[] = []

  for (const item of incomingRaw) {
    if (!item || typeof item !== 'object') continue
    const rec = item as Record<string, unknown>
    const id = typeof rec.id === 'string' && rec.id.trim() ? rec.id.trim() : null
    const name =
      typeof rec.name === 'string' && rec.name.trim()
        ? rec.name.trim().slice(0, 24)
        : 'Oyuncu'
    if (!id) continue

    const avatar =
      typeof rec.avatar === 'string' && rec.avatar.trim()
        ? rec.avatar.trim()
        : DEFAULT_EYLUL_MINA_PHOTO
    const stars = typeof rec.stars === 'number' && rec.stars >= 0 ? Math.floor(rec.stars) : 0
    const rawProg =
      rec.letterProgress && typeof rec.letterProgress === 'object'
        ? (rec.letterProgress as Record<string, LetterActivityProgress>)
        : {}

    validIncoming.push({
      id,
      name,
      avatar,
      stars,
      letterProgress: rawProg,
    })
  }

  if (validIncoming.length === 0) return localList

  const mergedMap = new Map<string, ChildProfile>()
  localList.forEach((p) => mergedMap.set(p.id, p))

  validIncoming.forEach((inc) => {
    const existing = mergedMap.get(inc.id)
    if (!existing) {
      mergedMap.set(inc.id, inc)
    } else {
      const mergedLetters: Record<string, LetterActivityProgress> = {
        ...existing.letterProgress,
      }
      Object.entries(inc.letterProgress || {}).forEach(([lId, lProg]) => {
        const cur = mergedLetters[lId] || {}
        mergedLetters[lId] = {
          sound: Boolean(cur.sound || lProg?.sound),
          trace: Boolean(cur.trace || lProg?.trace),
          syllable: Boolean(cur.syllable || lProg?.syllable),
          detective: Boolean(cur.detective || lProg?.detective),
          xylophone: Boolean(cur.xylophone || lProg?.xylophone),
          rocket: Boolean(cur.rocket || lProg?.rocket),
          winch: Boolean(cur.winch || lProg?.winch),
          quiz: Boolean(cur.quiz || lProg?.quiz),
          game: Boolean(cur.game || lProg?.game),
          samurai: Boolean(cur.samurai || lProg?.samurai),
        }
      })
      mergedMap.set(inc.id, {
        ...existing,
        avatar: inc.avatar || existing.avatar,
        stars: Math.max(existing.stars, inc.stars),
        letterProgress: mergedLetters,
      })
    }
  })

  return Array.from(mergedMap.values())
}

export default function App() {
  const [profiles, setProfiles] = useState<ChildProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROFILES_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: ChildProfile) => {
            if (p.id === 'prof_eylul_mina' && (!p.avatar || p.avatar === '👧')) {
              return { ...p, avatar: DEFAULT_EYLUL_MINA_PHOTO }
            }
            return p
          })
        }
      }
    } catch {
      // ignore
    }
    return createDefaultProfiles()
  })

  const [activeProfileId, setActiveProfileId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_ACTIVE_ID_KEY) || 'prof_eylul_mina'
  })

  const [activeTab, setActiveTab] = useState<'map' | 'stickers' | 'profiles'>('map')
  const [selectedGroupId, setSelectedGroupId] = useState<number>(1)
  const [selectedLetterId, setSelectedLetterId] = useState<string | null>(null)
  const [exerciseStep, setExerciseStep] = useState<ExerciseStepKey>('sound')
  const [isActivityMenuOpen, setIsActivityMenuOpen] = useState(false)
  const [muted, setMuted] = useState<boolean>(() => isSoundMuted())

  // Ebeveyn alanı ve profil yönetimi state'leri
  const [isParentUnlocked, setIsParentUnlocked] = useState(false)
  const [parentAnswerInput, setParentAnswerInput] = useState<number | null>(null)
  const [showBackupCode, setShowBackupCode] = useState(false)
  const [newProfileName, setNewProfileName] = useState('')
  const [newProfileAvatar, setNewProfileAvatar] = useState('🦄')
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle')
  const [restoreCodeInput, setRestoreCodeInput] = useState('')
  const [restoreFeedback, setRestoreFeedback] = useState<{
    type: 'ok' | 'err'
    text: string
  } | null>(null)
  const [copiedDeviceCode, setCopiedDeviceCode] = useState(false)
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null)
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)

  // Sesi duyup bulma quiz state
  const [quizQuestionIdx, setQuizQuestionIdx] = useState(0)
  const [quizSelectedOption, setQuizSelectedOption] = useState<string | null>(null)
  const [, setQuizCorrectCount] = useState(0)

  const activeProfile = useMemo(() => {
    return profiles.find((p) => p.id === activeProfileId) || profiles[0]
  }, [profiles, activeProfileId])

  const selectedLetter: LetterCurriculum | null = useMemo(() => {
    if (!selectedLetterId) return null
    return LETTERS_DATA.find((l) => l.id === selectedLetterId) || null
  }, [selectedLetterId])

  // Ekran veya etkinlik değiştiğinde sayfa kaydırma konumunu sıfırla ve menüyü kapat
  useEffect(() => {
    setIsActivityMenuOpen(false)
    setQuizQuestionIdx(0)
    setQuizSelectedOption(null)
    setQuizCorrectCount(0)
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior })
    }
  }, [selectedLetterId, exerciseStep, activeTab])

  // İlk açılışta buluttan yedek kontrolü (yerel veriyi kaybetmeden birleştirir)
  useEffect(() => {
    loadCloudBackup().then((cloudData) => {
      if (cloudData && Array.isArray(cloudData.profiles) && cloudData.profiles.length > 0) {
        setProfiles((prev) => sanitizeAndMergeProfiles(prev, cloudData.profiles))
      }
    })

    loadGlobalAvatar().then((savedAvatar) => {
      if (savedAvatar) {
        setProfiles((prev) =>
          prev.map((prof) => {
            if (prof.id === 'prof_eylul_mina' && prof.avatar === DEFAULT_EYLUL_MINA_PHOTO) {
              return { ...prof, avatar: savedAvatar }
            }
            return prof
          })
        )
      }
    })
  }, [])

  // Profiller değiştikçe LocalStorage + Firebase Cloud Backup
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_PROFILES_KEY, JSON.stringify(profiles))
      localStorage.setItem(STORAGE_ACTIVE_ID_KEY, activeProfile.id)
    } catch {
      // ignore
    }

    setCloudSyncStatus('syncing')
    const timer = setTimeout(() => {
      saveCloudBackup({ profiles, activeProfileId: activeProfile.id }).then((ok) => {
        setCloudSyncStatus(ok ? 'synced' : 'idle')
      })
    }, 600)

    return () => clearTimeout(timer)
  }, [profiles, activeProfile.id])

  const triggerCelebration = (msg: string) => {
    setCelebrationMessage(msg)
    setTimeout(() => {
      setCelebrationMessage(null)
    }, 2800)
  }

  const handleUpdateAvatar = (newAvatar: string) => {
    setProfiles((prev) =>
      prev.map((prof) => (prof.id === activeProfile.id ? { ...prof, avatar: newAvatar } : prof))
    )
    if (activeProfile.id === 'prof_eylul_mina') {
      saveGlobalAvatar(newAvatar)
    }
    triggerCelebration(`📸 ${activeProfile.name} için yeni profil resmi kaydedildi!`)
  }

  const renderAvatarElement = (avatarStr: string, className = 'avatar-circle', altName = '') => {
    const isImage =
      avatarStr.startsWith('data:image') ||
      avatarStr.startsWith('http') ||
      avatarStr.startsWith('/')
    if (isImage) {
      return (
        <span className={`${className} avatar-has-image`}>
          <img
            src={avatarStr}
            alt={altName || 'Profil'}
            className="avatar-img-tag"
            loading="lazy"
          />
        </span>
      )
    }
    return <span className={className}>{avatarStr}</span>
  }

  const markActivityDone = (letterId: string, activity: ExerciseStepKey) => {
    setProfiles((prev) =>
      prev.map((prof) => {
        if (prof.id !== activeProfile.id) return prof
        const currentLetterProg = prof.letterProgress[letterId] || {}
        if (isStepDoneForLetter(currentLetterProg, activity)) return prof

        const updatedLetterProg: LetterActivityProgress = {
          ...currentLetterProg,
          [activity]: true,
        }
        const wasStickerUnlocked = isStickerUnlockedForProg(currentLetterProg)
        const isNowStickerUnlocked = isStickerUnlockedForProg(updatedLetterProg)

        const bonusStars = isNowStickerUnlocked && !wasStickerUnlocked ? 3 : 1
        if (isNowStickerUnlocked && !wasStickerUnlocked) {
          const letterObj = LETTERS_DATA.find((l) => l.id === letterId)
          if (letterObj) {
            triggerCelebration(
              `🎉 Tebrikler ${prof.name}! "${letterObj.sticker.name} ${letterObj.sticker.emoji}" Çıkartmasını Açtın!`
            )
          }
        }

        return {
          ...prof,
          stars: prof.stars + bonusStars,
          letterProgress: {
            ...prof.letterProgress,
            [letterId]: updatedLetterProg,
          },
        }
      })
    )
  }

  const isLetterStickerEarned = (letterId: string): boolean => {
    return isStickerUnlockedForProg(activeProfile.letterProgress[letterId])
  }

  const getLetterStarCount = (letterId: string): number => {
    return getStarsForProg(activeProfile.letterProgress[letterId])
  }

  const getLetterCompletedActivitiesCount = (letterId: string): number => {
    return getCompletedStepCountForProg(activeProfile.letterProgress[letterId])
  }

  const getRemainingForStickerText = (letterId: string): string => {
    const stars = getLetterStarCount(letterId)
    if (stars >= STICKER_STAR_GOAL) {
      return '🌟 Çıkartma Açıldı!'
    }
    const rem = STICKER_STAR_GOAL - stars
    return `Çıkartma için ${rem} oyun kaldı`
  }

  const totalEarnedStickers = useMemo(() => {
    return LETTERS_DATA.filter((l) => isLetterStickerEarned(l.id)).length
  }, [activeProfile])

  // "Kaldığın Yerden Devam Et" için sıradaki en uygun harfi ve etkinliği bul
  const continueState = useMemo(() => {
    // 1. Önce yarım kalmış (1..4 yıldızlı) bir harf var mı bak
    let targetLetter = LETTERS_DATA.find((l) => {
      const st = getStarsForProg(activeProfile.letterProgress[l.id])
      return st > 0 && st < STICKER_STAR_GOAL
    })

    // 2. Yoksa çıkartması henüz açılmamış ilk harfi seç
    if (!targetLetter) {
      targetLetter = LETTERS_DATA.find(
        (l) => !isStickerUnlockedForProg(activeProfile.letterProgress[l.id])
      )
    }

    // 3. Tüm çıkartmalar açılmışsa 9 etkinliği henüz bitmemiş ilk harfi veya A harfini seç
    if (!targetLetter) {
      targetLetter =
        LETTERS_DATA.find(
          (l) => getCompletedStepCountForProg(activeProfile.letterProgress[l.id]) < 9
        ) || LETTERS_DATA[0]
    }

    const prog = activeProfile.letterProgress[targetLetter.id]
    const nextStepObj =
      LESSON_STEPS.find((s) => !isStepDoneForLetter(prog, s.key)) || LESSON_STEPS[0]
    const stars = getStarsForProg(prog)

    return {
      letter: targetLetter,
      step: nextStepObj,
      stars,
      remainingForSticker: Math.max(0, STICKER_STAR_GOAL - stars),
    }
  }, [activeProfile])

  // Quiz soruları üretimi (Seçili harf için 3 soru - Yalnızca öğrenilmiş harfler kullanılır)
  const quizQuestions = useMemo(() => {
    if (!selectedLetter) return []
    const distractorLetters = getLearnedDistractorLetters(selectedLetter)

    const distractorPool: Array<{
      word: string
      emoji: string
      letter: string
      isCorrect: false
    }> = []
    distractorLetters.forEach((l) => {
      distractorPool.push({
        word: l.mascotWord,
        emoji: l.mascotEmoji,
        letter: l.upper,
        isCorrect: false,
      })
      l.words.forEach((w) => {
        if (!distractorPool.some((item) => item.word === w.word)) {
          distractorPool.push({
            word: w.word,
            emoji: w.emoji,
            letter: l.upper,
            isCorrect: false,
          })
        }
      })
    })

    return selectedLetter.words.map((targetWord, idx) => {
      const available = distractorPool.filter((d) => d.word !== targetWord.word)

      let picks: typeof distractorPool = []
      if (available.length <= 2) {
        picks = [...available]
      } else {
        const start = (idx * 2) % available.length
        picks = [available[start], available[(start + 1) % available.length]]
      }

      const correctOption = {
        word: targetWord.word,
        emoji: targetWord.emoji,
        letter: selectedLetter.upper,
        isCorrect: true as const,
      }

      const options = [...picks, correctOption].sort((a, b) =>
        a.word.localeCompare(b.word, 'tr-TR')
      )

      return {
        promptText: `Dinle ve "${targetWord.word}" resmine dokun:`,
        speakPrompt: `${targetWord.word}! Hangisi ${targetWord.word}?`,
        targetWord: targetWord.word,
        options,
      }
    })
  }, [selectedLetter])

  const handleAddProfile = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = newProfileName.trim()
    if (!trimmed) return
    playSoundEffect('fanfare')
    const newProf: ChildProfile = {
      id: 'prof_' + Date.now().toString(36),
      name: trimmed,
      avatar: newProfileAvatar,
      stars: 0,
      letterProgress: {},
    }
    setProfiles((prev) => [...prev, newProf])
    setActiveProfileId(newProf.id)
    setNewProfileName('')
    speakTurkish(`Hoş geldin ${trimmed}! Hadi harflerle oynayalım!`)
    setActiveTab('map')
  }

  const handleRestoreFromCloud = async () => {
    const code = restoreCodeInput.trim()
    setRestoreFeedback(null)
    if (!isValidBackupCode(code)) {
      playSoundEffect('error')
      setRestoreFeedback({
        type: 'err',
        text: 'Geçersiz yedek kodu biçimi. Kod "dev_..." ile başlamalıdır.',
      })
      return
    }
    setCloudSyncStatus('syncing')
    const data = await loadCloudBackup(code)
    if (data && Array.isArray(data.profiles) && data.profiles.length > 0) {
      setProfiles((prev) => sanitizeAndMergeProfiles(prev, data.profiles))
      if (typeof data.activeProfileId === 'string') {
        setActiveProfileId(data.activeProfileId)
      }
      setRestoreCodeInput('')
      setCloudSyncStatus('synced')
      playSoundEffect('fanfare')
      setRestoreFeedback({
        type: 'ok',
        text: 'Bulut yedeği mevcut ilerlemeniz korunarak başarıyla birleştirildi!',
      })
      triggerCelebration('☁️ Bulut yedeğiniz başarıyla yüklendi!')
    } else {
      setCloudSyncStatus('idle')
      playSoundEffect('error')
      setRestoreFeedback({
        type: 'err',
        text: 'Bu yedek koduna ait kayıt bulunamadı. Lütfen kodu kontrol edin.',
      })
    }
  }

  const currentGroup = useMemo(() => {
    return ISLAND_GROUPS.find((g) => g.id === selectedGroupId) || ISLAND_GROUPS[0]
  }, [selectedGroupId])

  const groupLetters = useMemo(() => {
    return LETTERS_DATA.filter((l) => l.groupId === selectedGroupId)
  }, [selectedGroupId])

  const currentStepIndex = LESSON_STEPS.findIndex((s) => s.key === exerciseStep)
  const currentStepObj = LESSON_STEPS[currentStepIndex] || LESSON_STEPS[0]
  const nextStepObj = LESSON_STEPS[(currentStepIndex + 1) % LESSON_STEPS.length]

  const renderStepIcon = (key: ExerciseStepKey, size = 18) => {
    switch (key) {
      case 'sound':
        return <BookOpen size={size} />
      case 'trace':
        return <Ship size={size} />
      case 'syllable':
        return <Utensils size={size} />
      case 'detective':
        return <Flashlight size={size} />
      case 'xylophone':
        return <Music size={size} />
      case 'rocket':
        return <Rocket size={size} />
      case 'winch':
        return <Anchor size={size} />
      case 'quiz':
        return <Ear size={size} />
      case 'samurai':
        return <Swords size={size} />
    }
  }

  return (
    <div className={`app-shell ${selectedLetter ? 'in-lesson-mode' : ''}`}>
      {celebrationMessage && (
        <div className="celebration-toast" onClick={() => setCelebrationMessage(null)}>
          <Sparkles size={22} />
          <span>{celebrationMessage}</span>
        </div>
      )}

      {/* PROFİL FOTOĞRAFI YÜKLEME MODALI */}
      <ProfilePhotoModal
        isOpen={isPhotoModalOpen}
        childName={activeProfile.name}
        currentAvatar={activeProfile.avatar}
        onClose={() => setIsPhotoModalOpen(false)}
        onSaveAvatar={handleUpdateAvatar}
      />

      {/* KOMPAKT ÜST BAR */}
      <header className="top-navbar">
        <div
          className="brand-box"
          onClick={() => {
            playSoundEffect('click')
            stopAllAudio()
            setSelectedLetterId(null)
            setActiveTab('map')
          }}
        >
          <div className="brand-logo">
            <img src="/pwa-icon.svg" alt="Neşeli Harfler" className="brand-logo-img" />
          </div>
          <div className="brand-text-col">
            <h1 className="brand-title">Neşeli Harfler</h1>
            <p className="brand-subtitle">{activeProfile.name}</p>
          </div>
        </div>

        <div className="top-stats">
          {/* Ses Tekrar Dinle & Ses Aç/Kapat Düğmeleri */}
          <button
            type="button"
            className="audio-ctrl-pill"
            onClick={() => repeatLastSpeech()}
            title="Son Yönergeyi Tekrar Dinle"
            aria-label="Tekrar Dinle"
          >
            <RotateCcw size={16} />
          </button>

          <button
            type="button"
            className={`audio-ctrl-pill ${muted ? 'is-muted' : ''}`}
            onClick={() => {
              const nextMuted = toggleSoundMuted()
              setMuted(nextMuted)
            }}
            title={muted ? 'Sesi Aç' : 'Sesi Kapat'}
            aria-label={muted ? 'Sesi Aç' : 'Sesi Kapat'}
          >
            {muted ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>

          <div className="score-pill stars-pill" title="Toplanan Yıldızlar">
            <Star size={16} fill="#facc15" color="#eab308" />
            <span>{activeProfile.stars}</span>
          </div>

          <button
            type="button"
            className="score-pill sticker-pill"
            onClick={() => {
              playSoundEffect('click')
              setSelectedLetterId(null)
              setActiveTab('stickers')
            }}
            title="Çıkartma Albümü"
          >
            <Award size={16} />
            <span>
              {totalEarnedStickers}/{LETTERS_DATA.length}
            </span>
          </button>

          <button
            type="button"
            className="profile-pill-compact"
            onClick={() => {
              playSoundEffect('click')
              setSelectedLetterId(null)
              setActiveTab('profiles')
            }}
            title="Profiller ve Ebeveyn Alanı"
          >
            {renderAvatarElement(activeProfile.avatar, 'avatar-circle-sm', activeProfile.name)}
          </button>
        </div>
      </header>

      {/* ANA İÇERİK */}
      <main className="main-container">
        {selectedLetter ? (
          /* ================= HARF DERS EKRANI (KOMPAKT İLERLEME ÇUBUĞU + ETKİNLİK MENÜSÜ) ================= */
          <div className="letter-lesson-view">
            {/* KOMPAKT DERS ÜST ÇUBUĞU */}
            <div className="lesson-compact-header">
              <div className="lesson-header-top-row">
                <button
                  type="button"
                  className="back-map-btn"
                  onClick={() => {
                    playSoundEffect('click')
                    stopAllAudio()
                    setSelectedLetterId(null)
                  }}
                >
                  <ChevronLeft size={18} />
                  <span>Harita</span>
                </button>

                <div
                  className="lesson-letter-badge"
                  style={{ backgroundColor: selectedLetter.color }}
                  onClick={() => speakTurkish(`${selectedLetter.upper} sesi. ${selectedLetter.mascotWord}`)}
                >
                  <span className="badge-pair">
                    {selectedLetter.upper} {selectedLetter.lower}
                  </span>
                  <span className="badge-emoji">{selectedLetter.mascotEmoji}</span>
                </div>

                {/* Yıldız ve Çıkartma Hedef Göstergesi */}
                <div className="lesson-sticker-goal-pill">
                  <div className="mini-stars-row">
                    {[1, 2, 3, 4, 5].map((st) => (
                      <Star
                        key={st}
                        size={14}
                        fill={getLetterStarCount(selectedLetter.id) >= st ? '#facc15' : 'none'}
                        color={getLetterStarCount(selectedLetter.id) >= st ? '#eab308' : '#cbd5e1'}
                      />
                    ))}
                  </div>
                  <span className="goal-hint-text">
                    {getRemainingForStickerText(selectedLetter.id)}
                  </span>
                </div>

                {/* "Etkinlikleri Gör" Menüsü Butonu */}
                <button
                  type="button"
                  className={`btn-activities-drawer ${isActivityMenuOpen ? 'open' : ''}`}
                  onClick={() => {
                    playSoundEffect('click')
                    setIsActivityMenuOpen((prev) => !prev)
                  }}
                >
                  <ListChecks size={18} />
                  <span>Etkinlikleri Gör ({currentStepObj.num}/9)</span>
                </button>
              </div>

              {/* KOMPAKT 9 ADIMLI İLERLEME ÇUBUĞU VE SIRADAKİ ADIM */}
              <div className="lesson-progress-strip">
                <div className="progress-segments-row" role="tablist" aria-label="Ders Etkinlikleri">
                  {LESSON_STEPS.map((st) => {
                    const isDone = isStepDoneForLetter(
                      activeProfile.letterProgress[selectedLetter.id],
                      st.key
                    )
                    const isCurrent = exerciseStep === st.key
                    return (
                      <button
                        key={st.key}
                        type="button"
                        role="tab"
                        aria-selected={isCurrent}
                        className={`prog-segment-btn ${isCurrent ? 'current' : ''} ${
                          isDone ? 'done' : ''
                        }`}
                        onClick={() => {
                          playSoundEffect('click')
                          setExerciseStep(st.key)
                        }}
                        title={`${st.num}. ${st.title}`}
                      >
                        <span className="seg-num">{isDone ? '✓' : st.num}</span>
                        {isCurrent && <span className="seg-active-label">{st.shortTitle}</span>}
                      </button>
                    )
                  })}
                </div>

                <button
                  type="button"
                  className="btn-next-step-inline"
                  onClick={() => {
                    playSoundEffect('click')
                    setExerciseStep(nextStepObj.key)
                  }}
                  title={`Sıradaki Adım: ${nextStepObj.title}`}
                >
                  <span>Sıradaki: {nextStepObj.shortTitle}</span>
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* AÇILIR "ETKİNLİKLERİ GÖR" MENÜSÜ (DRAWER / POPOVER) */}
              {isActivityMenuOpen && (
                <div className="activities-menu-popover">
                  <div className="activities-menu-header">
                    <strong>
                      "{selectedLetter.upper}" Harfi Etkinlikleri (
                      {getLetterCompletedActivitiesCount(selectedLetter.id)}/9 Tamamlandı)
                    </strong>
                    <button
                      type="button"
                      className="btn-close-menu"
                      onClick={() => setIsActivityMenuOpen(false)}
                      aria-label="Menüyü Kapat"
                    >
                      <X size={18} />
                    </button>
                  </div>
                  <div className="activities-menu-grid">
                    {LESSON_STEPS.map((st, idx) => {
                      const isDone = isStepDoneForLetter(
                        activeProfile.letterProgress[selectedLetter.id],
                        st.key
                      )
                      const isCurrent = exerciseStep === st.key
                      const isNext = idx === currentStepIndex + 1
                      return (
                        <button
                          key={st.key}
                          type="button"
                          className={`activity-menu-item ${isCurrent ? 'active' : ''} ${
                            isDone ? 'done' : ''
                          }`}
                          onClick={() => {
                            playSoundEffect('click')
                            setExerciseStep(st.key)
                            setIsActivityMenuOpen(false)
                            if (st.key === 'quiz' && quizQuestions[0]) {
                              setTimeout(() => speakTurkish(quizQuestions[0].speakPrompt), 80)
                            }
                          }}
                        >
                          <div className="act-item-left">
                            <span className="act-item-icon">{renderStepIcon(st.key, 18)}</span>
                            <div className="act-item-titles">
                              <strong>
                                {st.num}. {st.title}
                              </strong>
                              <span className="act-status-tag">
                                {isCurrent
                                  ? '👉 Şu Anki Etkinlik'
                                  : isDone
                                  ? '✅ Tamamlandı'
                                  : isNext
                                  ? '⏭️ Sıradaki Adım'
                                  : 'Oynamak için dokun'}
                              </span>
                            </div>
                          </div>
                          {isDone && <CheckCircle2 size={18} className="done-icon" />}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* ADIM 1: HARF TANIMA VE SESLENDİRME */}
            {exerciseStep === 'sound' && (
              <div className="exercise-panel">
                <div className="sound-hero-card" style={{ borderColor: selectedLetter.color }}>
                  <div className="big-letter-showcase">
                    <button
                      type="button"
                      className="giant-letter-btn"
                      style={{ backgroundColor: selectedLetter.color }}
                      onClick={() => {
                        playSoundEffect('pop')
                        speakTurkish(selectedLetter.phoneticText)
                        markActivityDone(selectedLetter.id, 'sound')
                      }}
                    >
                      <span className="giant-pair">
                        {selectedLetter.upper} {selectedLetter.lower}
                      </span>
                      <span className="listen-tag">
                        <Volume2 size={20} /> Sesi Dinle ({selectedLetter.soundHint})
                      </span>
                    </button>

                    <div className="mascot-showcase">
                      <div className="mascot-big-emoji">{selectedLetter.mascotEmoji}</div>
                      <div className="mascot-word-title">{selectedLetter.mascotWord}</div>
                      <p className="phonetic-desc">{selectedLetter.phoneticText}</p>
                    </div>
                  </div>
                </div>

                <h3 className="section-subtitle">
                  🔊 Resimlere Dokun ve "{selectedLetter.upper}" Sesini Dinle:
                </h3>

                <div className="word-cards-grid">
                  {selectedLetter.words.map((w, i) => (
                    <button
                      key={i}
                      type="button"
                      className="word-interactive-card"
                      onClick={() => {
                        playSoundEffect('pop')
                        speakTurkish(`${w.word}. ${w.syllables.join(' - ')}. ${w.sentence || ''}`)
                        markActivityDone(selectedLetter.id, 'sound')
                      }}
                    >
                      <div className="word-emoji">{w.emoji}</div>
                      <div className="word-title">{w.word}</div>
                      <div className="syllable-chips">
                        {w.syllables.map((syl, sIdx) => (
                          <span
                            key={sIdx}
                            className={`syllable-chip ${sIdx % 2 === 0 ? 'chip-red' : 'chip-blue'}`}
                          >
                            {syl}
                          </span>
                        ))}
                      </div>
                      {w.sentence && <p className="word-sentence">{w.sentence}</p>}
                      <span className="card-audio-hint">
                        <Volume2 size={15} /> Dinle
                      </span>
                    </button>
                  ))}
                </div>

                <div className="step-next-bar">
                  <button
                    type="button"
                    className="btn-primary btn-large"
                    onClick={() => {
                      markActivityDone(selectedLetter.id, 'sound')
                      playSoundEffect('success')
                      setExerciseStep('trace')
                    }}
                  >
                    Harfi Çizmeye Geç <ChevronRight size={22} />
                  </button>
                </div>
              </div>
            )}

            {/* ADIM 2: SİHİRLİ DENİZ FENERİ VE YILDIZ İZLERİ (HARF ÇİZİMİ) */}
            {exerciseStep === 'trace' && (
              <div className="exercise-panel">
                <LighthouseTracingGame
                  letter={selectedLetter}
                  childName={activeProfile.name}
                  completed={isStepDoneForLetter(
                    activeProfile.letterProgress[selectedLetter.id],
                    'trace'
                  )}
                  onComplete={() => markActivityDone(selectedLetter.id, 'trace')}
                  onExit={() => {
                    markActivityDone(selectedLetter.id, 'trace')
                    playSoundEffect('success')
                    setExerciseStep('syllable')
                  }}
                />
              </div>
            )}

            {/* ADIM 3: HECE MUTFAĞI (KELİME PİŞİRME OYUNU) */}
            {exerciseStep === 'syllable' && (
              <div className="exercise-panel">
                <SyllableKitchenGame
                  letter={selectedLetter}
                  childName={activeProfile.name}
                  completed={isStepDoneForLetter(
                    activeProfile.letterProgress[selectedLetter.id],
                    'syllable'
                  )}
                  onComplete={() => markActivityDone(selectedLetter.id, 'syllable')}
                  onNext={() => {
                    markActivityDone(selectedLetter.id, 'syllable')
                    playSoundEffect('fanfare')
                    setExerciseStep('detective')
                  }}
                />
              </div>
            )}

            {/* ADIM 4: KARANLIK ODA / HARF DEDEKTİFİ (EL FENERİ OYUNU) */}
            {exerciseStep === 'detective' && (
              <div className="exercise-panel">
                <LetterDetectiveGame
                  letter={selectedLetter}
                  childName={activeProfile.name}
                  completed={isStepDoneForLetter(
                    activeProfile.letterProgress[selectedLetter.id],
                    'detective'
                  )}
                  onComplete={() => markActivityDone(selectedLetter.id, 'detective')}
                  onExit={() => {
                    markActivityDone(selectedLetter.id, 'detective')
                    playSoundEffect('fanfare')
                    setExerciseStep('xylophone')
                  }}
                />
              </div>
            )}

            {/* ADIM 5: NEŞELİ NOTA KSİLOFONU VE ŞARKI KUTUSU */}
            {exerciseStep === 'xylophone' && (
              <div className="exercise-panel">
                <XylophoneMusicGame
                  letter={selectedLetter}
                  childName={activeProfile.name}
                  completed={isStepDoneForLetter(
                    activeProfile.letterProgress[selectedLetter.id],
                    'xylophone'
                  )}
                  onComplete={() => markActivityDone(selectedLetter.id, 'xylophone')}
                  onExit={() => {
                    markActivityDone(selectedLetter.id, 'xylophone')
                    playSoundEffect('fanfare')
                    setExerciseStep('rocket')
                  }}
                />
                <div className="step-next-bar">
                  <button
                    type="button"
                    className="btn-primary btn-large"
                    onClick={() => {
                      markActivityDone(selectedLetter.id, 'xylophone')
                      playSoundEffect('click')
                      setExerciseStep('rocket')
                    }}
                  >
                    Uzaylı Kargo Roketine Geç <ChevronRight size={22} />
                  </button>
                </div>
              </div>
            )}

            {/* ADIM 6: UZAYLI KARGO ROKETİ (SESLİ FIRLATMA) */}
            {exerciseStep === 'rocket' && (
              <div className="exercise-panel">
                <SpaceRocketGame
                  letter={selectedLetter}
                  childName={activeProfile.name}
                  completed={isStepDoneForLetter(
                    activeProfile.letterProgress[selectedLetter.id],
                    'rocket'
                  )}
                  onComplete={() => markActivityDone(selectedLetter.id, 'rocket')}
                  onExit={() => {
                    markActivityDone(selectedLetter.id, 'rocket')
                    playSoundEffect('fanfare')
                    setExerciseStep('winch')
                  }}
                />
                <div className="step-next-bar">
                  <button
                    type="button"
                    className="btn-primary btn-large"
                    onClick={() => {
                      markActivityDone(selectedLetter.id, 'rocket')
                      playSoundEffect('click')
                      setExerciseStep('winch')
                    }}
                  >
                    Fırtına Vincine Geç <ChevronRight size={22} />
                  </button>
                </div>
              </div>
            )}

            {/* ADIM 7: FIRTINA VİNCİ: DERİN DENİZ HAZİNE VE KELİME AVI */}
            {exerciseStep === 'winch' && (
              <div className="exercise-panel">
                <OceanWinchGame
                  letter={selectedLetter}
                  childName={activeProfile.name}
                  completed={isStepDoneForLetter(
                    activeProfile.letterProgress[selectedLetter.id],
                    'winch'
                  )}
                  onComplete={() => markActivityDone(selectedLetter.id, 'winch')}
                  onExit={() => {
                    markActivityDone(selectedLetter.id, 'winch')
                    playSoundEffect('fanfare')
                    setExerciseStep('quiz')
                    if (quizQuestions[0]) {
                      setTimeout(() => speakTurkish(quizQuestions[0].speakPrompt), 80)
                    }
                  }}
                />
                <div className="step-next-bar">
                  <button
                    type="button"
                    className="btn-primary btn-large"
                    onClick={() => {
                      markActivityDone(selectedLetter.id, 'winch')
                      playSoundEffect('click')
                      setExerciseStep('quiz')
                      if (quizQuestions[0]) {
                        setTimeout(() => speakTurkish(quizQuestions[0].speakPrompt), 80)
                      }
                    }}
                  >
                    Dinle & Bul Testine Geç <ChevronRight size={22} />
                  </button>
                </div>
              </div>
            )}

            {/* ADIM 8: SESİ DUYUP DOĞRU HARFİ/KELİMEYİ BULMA (TEST) */}
            {exerciseStep === 'quiz' && (
              <div className="exercise-panel">
                {(() => {
                  const currentQ = quizQuestions[quizQuestionIdx]
                  if (!currentQ) return null
                  return (
                    <div className="quiz-card">
                      <div className="quiz-header">
                        <span className="step-pill">
                          Soru {quizQuestionIdx + 1} / {quizQuestions.length}
                        </span>
                        <button
                          type="button"
                          className="btn-listen-big"
                          onClick={() => {
                            playSoundEffect('pop')
                            speakTurkish(currentQ.speakPrompt)
                          }}
                        >
                          <Volume2 size={24} /> Dinle: "{currentQ.targetWord}"
                        </button>
                      </div>

                      <p className="quiz-prompt">{currentQ.promptText}</p>

                      <div className="quiz-options-grid">
                        {currentQ.options.map((opt, idx) => {
                          const isPicked = quizSelectedOption === opt.word
                          const statusClass = isPicked
                            ? opt.isCorrect
                              ? 'correct'
                              : 'wrong'
                            : ''

                          return (
                            <button
                              key={idx}
                              type="button"
                              className={`quiz-option-btn ${statusClass}`}
                              onClick={() => {
                                setQuizSelectedOption(opt.word)
                                if (opt.isCorrect) {
                                  playSoundEffect('fanfare')
                                  speakTurkish(
                                    `Harikasın ${activeProfile.name}! Doğru cevap: ${opt.word}!`
                                  )
                                  setQuizCorrectCount((c) => c + 1)
                                } else {
                                  playSoundEffect('error')
                                  speakTurkish(
                                    `Bu ${opt.word}. İpucunu dinleyip "${currentQ.targetWord}" resmini bulalım!`
                                  )
                                }
                              }}
                            >
                              <span className="quiz-opt-emoji">{opt.emoji}</span>
                              <span className="quiz-opt-word">{opt.word}</span>
                              <span className="quiz-opt-badge">{opt.letter} Sesi</span>
                            </button>
                          )
                        })}
                      </div>

                      {quizSelectedOption && (
                        <div className="quiz-footer-bar">
                          {quizQuestionIdx < quizQuestions.length - 1 ? (
                            <button
                              type="button"
                              className="btn-primary btn-large"
                              onClick={() => {
                                const nextIdx = quizQuestionIdx + 1
                                setQuizQuestionIdx(nextIdx)
                                setQuizSelectedOption(null)
                                if (quizQuestions[nextIdx]) {
                                  speakTurkish(quizQuestions[nextIdx].speakPrompt)
                                }
                              }}
                            >
                              Sonraki Soru <ChevronRight size={20} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="btn-primary btn-large"
                              style={{ backgroundColor: '#16a34a' }}
                              onClick={() => {
                                markActivityDone(selectedLetter.id, 'quiz')
                                playSoundEffect('fanfare')
                                speakTurkish(
                                  `Tebrikler ${activeProfile.name}! Şimdi Harf Samurayı oyununa geçelim!`
                                )
                                setExerciseStep('samurai')
                              }}
                            >
                              <Sparkles size={20} /> Ödülü Al ve Harf Samurayına Geç!
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}

            {/* ADIM 9: NEON KILIÇ: HARF SAMURAYI */}
            {exerciseStep === 'samurai' && (
              <div className="exercise-panel">
                <NeonSamuraiGame
                  letter={selectedLetter}
                  childName={activeProfile.name}
                  completed={isStepDoneForLetter(
                    activeProfile.letterProgress[selectedLetter.id],
                    'samurai'
                  )}
                  onComplete={() => markActivityDone(selectedLetter.id, 'samurai')}
                  onExit={() => {
                    playSoundEffect('click')
                    setSelectedLetterId(null)
                  }}
                />
              </div>
            )}
          </div>
        ) : activeTab === 'map' ? (
          /* ================= SADELEŞTİRİLMİŞ ANA EKRAN VE HARF ADALARI ================= */
          <div className="map-view">
            {/* KOMPAKT KARŞILAMA + "KALDIĞIN YERDEN DEVAM ET" KARTI (İLK EKRANDA GÖRÜNÜR) */}
            <section className="compact-hero-continue-card">
              <div className="hero-top-greeting-row">
                <div className="hero-child-identity">
                  {renderAvatarElement(
                    activeProfile.avatar,
                    'hero-avatar-compact',
                    activeProfile.name
                  )}
                  <div className="hero-greeting-col">
                    <span className="hero-hello-tag">Merhaba,</span>
                    <h2 className="hero-child-name">{activeProfile.name}! 👋</h2>
                  </div>
                </div>

                <button
                  type="button"
                  className="hero-welcome-voice-btn"
                  onClick={() => {
                    playSoundEffect('pop')
                    playWelcomeGreeting(activeProfile.name)
                  }}
                >
                  <Volume2 size={18} />
                  <span>Mesajı Dinle</span>
                </button>
              </div>

              {/* TEK DOKUNUŞLA "KALDIĞIN YERDEN DEVAM ET" DÜĞMESİ VE SIRADAKİ HARF */}
              <button
                type="button"
                className="continue-journey-cta-btn"
                onClick={() => {
                  playSoundEffect('pop')
                  setSelectedGroupId(continueState.letter.groupId)
                  setSelectedLetterId(continueState.letter.id)
                  setExerciseStep(continueState.step.key)
                  speakTurkish(
                    `${continueState.letter.upper} sesi, ${continueState.step.title} etkinliğine devam edelim!`
                  )
                }}
              >
                <div
                  className="continue-letter-circle"
                  style={{ backgroundColor: continueState.letter.color }}
                >
                  <span>
                    {continueState.letter.upper}
                    {continueState.letter.lower}
                  </span>
                </div>
                <div className="continue-info-col">
                  <span className="continue-eyebrow">KALDIĞIN YERDEN DEVAM ET</span>
                  <strong className="continue-main-label">
                    {continueState.letter.mascotEmoji} "{continueState.letter.upper}" Sesi •{' '}
                    {continueState.step.num}. {continueState.step.title}
                  </strong>
                  <span className="continue-sub-hint">
                    {continueState.remainingForSticker > 0
                      ? `🎯 Çıkartma için ${continueState.remainingForSticker} oyun kaldı`
                      : '🌟 Çıkartma kazanıldı • Diğer oyunları keşfet'}
                  </span>
                </div>
                <div className="continue-play-icon">
                  <Play size={22} fill="#ffffff" />
                </div>
              </button>
            </section>

            {/* KOMPAKT 5 ADA SEÇİCİ ŞERİT */}
            <div className="island-selector-strip" role="tablist" aria-label="Harf Adaları">
              {ISLAND_GROUPS.map((grp) => {
                const completedCount = grp.letters.filter((lId) =>
                  isLetterStickerEarned(lId)
                ).length
                const isSelected = grp.id === selectedGroupId
                return (
                  <button
                    key={grp.id}
                    type="button"
                    role="tab"
                    aria-selected={isSelected}
                    className={`island-pill-btn ${isSelected ? 'selected' : ''}`}
                    style={{
                      borderColor: isSelected ? grp.accentColor : undefined,
                      backgroundColor: isSelected ? '#ffffff' : undefined,
                    }}
                    onClick={() => {
                      playSoundEffect('click')
                      setSelectedGroupId(grp.id)
                    }}
                  >
                    <span className="island-pill-emoji">{grp.themeEmoji}</span>
                    <span className="island-pill-title">{grp.id}. Ada</span>
                    <span
                      className="island-pill-count"
                      style={{
                        backgroundColor: isSelected ? grp.accentColor : '#e2e8f0',
                        color: isSelected ? '#ffffff' : '#475569',
                      }}
                    >
                      {completedCount}/{grp.letters.length}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* SEÇİLİ ADANIN HARFLERİ */}
            <div className="island-board" style={{ background: currentGroup.bgGradient }}>
              <div className="island-board-header">
                <div>
                  <h3>
                    {currentGroup.themeEmoji} {currentGroup.title}
                  </h3>
                  <p>{currentGroup.subtitle}</p>
                </div>
                <span
                  className="island-header-badge"
                  style={{ backgroundColor: currentGroup.accentColor }}
                >
                  {currentGroup.letters.filter((lId) => isLetterStickerEarned(lId)).length}/
                  {currentGroup.letters.length} Çıkartma
                </span>
              </div>

              <div className="letters-island-grid">
                {groupLetters.map((letter, idx) => {
                  const stars = getLetterStarCount(letter.id)
                  const stickerUnlocked = isLetterStickerEarned(letter.id)
                  const prog = activeProfile.letterProgress[letter.id]
                  const nextStepForThisLetter =
                    LESSON_STEPS.find((s) => !isStepDoneForLetter(prog, s.key)) || LESSON_STEPS[0]

                  return (
                    <button
                      key={letter.id}
                      type="button"
                      className={`letter-island-card ${stickerUnlocked ? 'mastered' : ''}`}
                      onClick={() => {
                        playSoundEffect('pop')
                        setSelectedLetterId(letter.id)
                        setExerciseStep(
                          stars > 0 && stars < STICKER_STAR_GOAL
                            ? nextStepForThisLetter.key
                            : 'sound'
                        )
                        speakTurkish(`${letter.upper} sesi. ${letter.mascotWord}!`)
                      }}
                    >
                      <div className="letter-card-top">
                        <span className="letter-step-num">{idx + 1}. Ses</span>
                        {stickerUnlocked && (
                          <span className="letter-sticker-earned-badge" title="Çıkartma Açıldı!">
                            {letter.sticker.emoji}✓
                          </span>
                        )}
                      </div>

                      <div className="letter-card-center">
                        <div className="letter-pair" style={{ color: letter.color }}>
                          {letter.upper}
                          <span>{letter.lower}</span>
                        </div>
                        <div className="letter-mascot">
                          <span className="mascot-icon">{letter.mascotEmoji}</span>
                          <span className="mascot-label">{letter.mascotWord}</span>
                        </div>
                      </div>

                      <div className="letter-card-stars">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            size={15}
                            fill={stars >= s ? '#facc15' : 'none'}
                            color={stars >= s ? '#eab308' : '#cbd5e1'}
                          />
                        ))}
                      </div>

                      <div className="letter-card-status-hint">
                        {stickerUnlocked
                          ? '🌟 Çıkartma Açıldı!'
                          : stars > 0
                          ? `Çıkartma için ${STICKER_STAR_GOAL - stars} oyun kaldı`
                          : 'Dokun ve Başla'}
                      </div>

                      <div
                        className="letter-card-cta"
                        style={{ backgroundColor: stickerUnlocked ? '#16a34a' : letter.color }}
                      >
                        {stickerUnlocked
                          ? 'Tekrar Oyna'
                          : stars > 0
                          ? 'Devam Et'
                          : 'Başla'}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ) : activeTab === 'stickers' ? (
          /* ================= YILDIZ & ÇIKARTMA (STICKER) ALBÜMÜ ================= */
          <div className="stickers-view">
            <div className="album-header">
              <div>
                <h2>🏆 {activeProfile.name}'nın Çıkartma Albümü</h2>
                <p>
                  Bir harfteki 9 eğlenceli etkinlikten <strong>5 tanesini (5/5 Yıldız)</strong>{' '}
                  tamamladığında o harfin çıkartması açılır!
                </p>
              </div>
              <div className="album-counter">
                <span>Açılan Çıkartmalar:</span>
                <strong>
                  {totalEarnedStickers} / {LETTERS_DATA.length}
                </strong>
              </div>
            </div>

            <div className="sticker-grid">
              {LETTERS_DATA.map((letter) => {
                const unlocked = isLetterStickerEarned(letter.id)
                const stars = getLetterStarCount(letter.id)
                const remaining = Math.max(0, STICKER_STAR_GOAL - stars)
                return (
                  <button
                    key={letter.id}
                    type="button"
                    className={`sticker-slot ${unlocked ? 'unlocked' : 'locked'}`}
                    onClick={() => {
                      playSoundEffect('pop')
                      if (unlocked) {
                        speakTurkish(
                          `Tebrikler! ${letter.sticker.name} çıkartmasını kazandın! Harf oyunlarını tekrar oynamak için dokunabilirsin.`
                        )
                        setSelectedLetterId(letter.id)
                        setActiveTab('map')
                      } else {
                        setSelectedLetterId(letter.id)
                        setActiveTab('map')
                        speakTurkish(
                          `${letter.upper} sesi çıkartması için ${remaining} oyun kaldı. Hadi tamamlayalım!`
                        )
                      }
                    }}
                  >
                    <div className="sticker-letter-tag" style={{ backgroundColor: letter.color }}>
                      {letter.upper}
                      {letter.lower}
                    </div>
                    <div className="sticker-emoji-box">
                      {unlocked ? letter.sticker.emoji : '🔒'}
                    </div>
                    <div className="sticker-name">{letter.sticker.name}</div>
                    <div className="sticker-island">{letter.sticker.islandTitle}</div>
                    <div className="sticker-mini-progress">
                      {unlocked
                        ? `✨ Açıldı! (${stars}/5 ⭐)`
                        : `Çıkartma için ${remaining} oyun kaldı (${stars}/5 ⭐)`}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          /* ================= ÇOCUK PROFİL SEÇİMİ VE KORUMALI EBEVEYN ALANI ================= */
          <div className="profiles-view">
            {/* 1. ÇOCUK PROFİLİ GEÇİŞ KARTI */}
            <div className="profiles-card">
              <h2>👧 Kim Oynuyor? (Profil Seç)</h2>
              <p>
                Her çocuğun yıldızları ve çıkartmaları kendi profilinde ayrı tutulur.
              </p>

              <div className="profile-list">
                {profiles.map((prof) => {
                  const isCurrent = prof.id === activeProfile.id
                  const stickerCount = LETTERS_DATA.filter((l) =>
                    isStickerUnlockedForProg(prof.letterProgress[l.id])
                  ).length

                  return (
                    <div
                      key={prof.id}
                      className={`profile-row-item ${isCurrent ? 'active' : ''}`}
                      onClick={() => {
                        playSoundEffect('pop')
                        setActiveProfileId(prof.id)
                        speakTurkish(`Merhaba ${prof.name}!`)
                        setActiveTab('map')
                      }}
                    >
                      <div className="prof-row-left">
                        {renderAvatarElement(prof.avatar, 'prof-row-avatar', prof.name)}
                        <div>
                          <h4>{prof.name}</h4>
                          <span>
                            ⭐ {prof.stars} Yıldız • 🏆 {stickerCount}/{LETTERS_DATA.length} Çıkartma
                          </span>
                        </div>
                      </div>
                      <div className="prof-row-right">
                        <span className="prof-select-badge">
                          {isCurrent ? '✅ Aktif' : 'Seç'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 2. KORUMALI EBEVEYN ALANI (FOTOĞRAF, PROFİL EKLEME VE BULUT YEDEKLEME) */}
            <div className="parent-gate-card">
              <div className="parent-gate-header">
                <div className="parent-gate-title">
                  {isParentUnlocked ? (
                    <Unlock size={22} color="#16a34a" />
                  ) : (
                    <Lock size={22} color="#64748b" />
                  )}
                  <div>
                    <h3>Ebeveyn Alanı (Ayarlar, Fotoğraf & Bulut Yedekleme)</h3>
                    <p>
                      Profil resmi değiştirme, yeni profil oluşturma ve bulut yedek kodu işlemleri
                      güvenlik için bu alanda toplanmıştır.
                    </p>
                  </div>
                </div>
                {isParentUnlocked && (
                  <button
                    type="button"
                    className="btn-secondary btn-lock-parent"
                    onClick={() => {
                      setIsParentUnlocked(false)
                      setParentAnswerInput(null)
                      setShowBackupCode(false)
                    }}
                  >
                    <Lock size={15} /> Kilitle
                  </button>
                )}
              </div>

              {!isParentUnlocked ? (
                <div className="parent-gate-challenge">
                  <p className="gate-question">
                    🔒 Ebeveyn ayarlarını açmak için işlemin sonucuna dokunun:{' '}
                    <strong>4 + 3 = ?</strong>
                  </p>
                  <div className="gate-options-row">
                    {[5, 7, 9].map((num) => (
                      <button
                        key={num}
                        type="button"
                        className={`gate-opt-btn ${parentAnswerInput === num ? 'wrong' : ''}`}
                        onClick={() => {
                          if (num === 7) {
                            playSoundEffect('success')
                            setIsParentUnlocked(true)
                            setParentAnswerInput(null)
                          } else {
                            playSoundEffect('error')
                            setParentAnswerInput(num)
                          }
                        }}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="parent-unlocked-content">
                  {/* A. Aktif Profilin Fotoğrafını / Karakterini Değiştirme */}
                  <div className="parent-section-box">
                    <h4>📸 {activeProfile.name} İçin Profil Resmi / Karakter Seçimi</h4>
                    <p>
                      Çocuğunuz için sevimli bir karakter seçebilir veya cihazınızdan fotoğraf
                      yükleyebilirsiniz.
                    </p>
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => {
                        playSoundEffect('click')
                        setIsPhotoModalOpen(true)
                      }}
                    >
                      <Camera size={18} /> Profil Resmini veya Karakteri Değiştir
                    </button>
                  </div>

                  {/* B. Yeni Kardeş / Arkadaş Profili Ekleme */}
                  <form className="add-profile-form" onSubmit={handleAddProfile}>
                    <h3>
                      <UserPlus size={20} /> Yeni Kardeş / Arkadaş Profili Ekle
                    </h3>
                    <input
                      type="text"
                      placeholder="Çocuğun Adı (Örn: Barlas)"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      className="profile-input"
                      maxLength={24}
                    />

                    <div className="avatar-picker">
                      {AVATAR_OPTIONS.map((av) => (
                        <button
                          key={av}
                          type="button"
                          className={`avatar-pick-btn ${newProfileAvatar === av ? 'selected' : ''}`}
                          onClick={() => {
                            playSoundEffect('click')
                            setNewProfileAvatar(av)
                          }}
                        >
                          {av}
                        </button>
                      ))}
                    </div>

                    <button type="submit" className="btn-primary">
                      <UserPlus size={18} /> Profili Oluştur
                    </button>
                  </form>

                  {/* C. Bulut Yedekleme ve Geri Yükleme */}
                  <div className="cloud-backup-card">
                    <div className="cloud-title-row">
                      <Cloud size={24} color="#0284c7" />
                      <div>
                        <h3>Bulut Yedekleme ve Cihaz Eşitleme</h3>
                        <span className="sync-status-badge">
                          {cloudSyncStatus === 'syncing'
                            ? '🔄 Yedekleniyor...'
                            : cloudSyncStatus === 'synced'
                            ? '✅ Bulutla Eşitlendi'
                            : '☁️ Otomatik Yedekleme Aktif'}
                        </span>
                      </div>
                    </div>

                    <p className="cloud-desc">
                      İlerleme bu cihaza ve buluta otomatik kaydedilir. Başka bir cihaza geçerseniz
                      yedek kodunu kullanarak mevcut ilerlemeyi kaybetmeden eşitleyebilirsiniz.
                    </p>

                    <div className="device-code-box">
                      <div>
                        <small>Cihaz Yedek Kodu (Ebeveyne Özel):</small>
                        <code>
                          {showBackupCode
                            ? getOrCreateDeviceId()
                            : maskBackupCode(getOrCreateDeviceId())}
                        </code>
                      </div>
                      <div className="device-code-actions">
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => setShowBackupCode((prev) => !prev)}
                        >
                          {showBackupCode ? <EyeOff size={16} /> : <Eye size={16} />}
                          {showBackupCode ? 'Gizle' : 'Göster'}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            navigator.clipboard?.writeText(getOrCreateDeviceId())
                            setCopiedDeviceCode(true)
                            setTimeout(() => setCopiedDeviceCode(false), 2000)
                          }}
                        >
                          {copiedDeviceCode ? <Check size={16} /> : <Copy size={16} />}
                          {copiedDeviceCode ? 'Kopyalandı' : 'Kopyala'}
                        </button>
                      </div>
                    </div>

                    <div className="restore-box">
                      <h4>Başka Cihazdan Yedek Eşitle / Geri Yükle</h4>
                      <div className="restore-input-row">
                        <input
                          type="text"
                          placeholder="dev_xxxx_xxxx kodunu girin"
                          value={restoreCodeInput}
                          onChange={(e) => setRestoreCodeInput(e.target.value)}
                          className="profile-input"
                        />
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={handleRestoreFromCloud}
                        >
                          <RefreshCw size={16} /> Eşitle
                        </button>
                      </div>
                      {restoreFeedback && (
                        <p className={`restore-feedback-msg ${restoreFeedback.type}`}>
                          {restoreFeedback.text}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* ALT MOBİL NAVİGASYON ÇUBUĞU (Ders ekranındayken gizlenir, oyun kontrollerini kapatmaz) */}
      {!selectedLetter && (
        <nav className="bottom-pwa-nav" aria-label="Ana Menü">
          <button
            type="button"
            className={`nav-item ${activeTab === 'map' ? 'active' : ''}`}
            onClick={() => {
              playSoundEffect('click')
              setSelectedLetterId(null)
              setActiveTab('map')
            }}
          >
            <Sparkles size={20} />
            <span>Harf Adaları</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'stickers' ? 'active' : ''}`}
            onClick={() => {
              playSoundEffect('click')
              setSelectedLetterId(null)
              setActiveTab('stickers')
            }}
          >
            <Award size={20} />
            <span>Çıkartmalar ({totalEarnedStickers})</span>
          </button>

          <button
            type="button"
            className={`nav-item ${activeTab === 'profiles' ? 'active' : ''}`}
            onClick={() => {
              playSoundEffect('click')
              setSelectedLetterId(null)
              setActiveTab('profiles')
            }}
          >
            <Users size={20} />
            <span>Profiller & Ebeveyn</span>
          </button>
        </nav>
      )}
    </div>
  )
}
