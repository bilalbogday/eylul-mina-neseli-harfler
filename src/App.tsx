import { useEffect, useMemo, useState } from 'react'
import {
  Volume2,
  Star,
  Award,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  UserPlus,
  Cloud,
  CheckCircle2,
  Ear,
  Pencil,
  BookOpen,
  Users,
  Copy,
  Check,
  RefreshCw,
  Gamepad2,
  Camera,
  Utensils,
  Flashlight,
} from 'lucide-react'
import { ISLAND_GROUPS, LETTERS_DATA, type LetterCurriculum } from './curriculum'
import { LetterTracingCanvas } from './LetterTracingCanvas'
import { LetterSoundGame } from './LetterSoundGame'
import { SyllableKitchenGame } from './SyllableKitchenGame'
import { LetterDetectiveGame } from './LetterDetectiveGame'
import { ProfilePhotoModal } from './ProfilePhotoModal'
import {
  getOrCreateDeviceId,
  loadCloudBackup,
  saveCloudBackup,
  saveGlobalAvatar,
  loadGlobalAvatar,
} from './firebase'
import { playSoundEffect, speakTurkish, playWelcomeGreeting } from './sound'
import './App.css'

export interface ChildProfile {
  id: string
  name: string
  avatar: string
  stars: number
  // Her harf için tamamlanan aktiviteler: sound, trace, syllable, quiz, game, detective
  letterProgress: Record<
    string,
    {
      sound?: boolean
      trace?: boolean
      syllable?: boolean
      quiz?: boolean
      game?: boolean
      detective?: boolean
    }
  >
}

const AVATAR_OPTIONS = ['👧', '🧒', '🦄', '🦁', '🐰', '🐼', '🦊', '🦋', '🚀', '👑']

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

export default function App() {
  const [profiles, setProfiles] = useState<ChildProfile[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_PROFILES_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Eğer profil Eylül Mina ise ve hala varsayılan emojide kalmışsa güncel fotoğrafa yükselt
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

  const [activeTab, setActiveTab] = useState<
    'map' | 'kitchen' | 'detective' | 'stickers' | 'profiles'
  >('map')
  const [selectedGroupId, setSelectedGroupId] = useState<number>(1)
  const [selectedLetterId, setSelectedLetterId] = useState<string | null>(null)
  const [exerciseStep, setExerciseStep] = useState<
    'sound' | 'trace' | 'syllable' | 'detective' | 'quiz' | 'game'
  >('sound')

  // Yeni profil ekleme modal/form
  const [newProfileName, setNewProfileName] = useState('')
  const [newProfileAvatar, setNewProfileAvatar] = useState('🦄')
  const [cloudSyncStatus, setCloudSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle')
  const [restoreCodeInput, setRestoreCodeInput] = useState('')
  const [copiedDeviceCode, setCopiedDeviceCode] = useState(false)
  const [celebrationMessage, setCelebrationMessage] = useState<string | null>(null)
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false)

  // Sesi duyup bulma quiz state
  const [quizQuestionIdx, setQuizQuestionIdx] = useState(0)
  const [quizSelectedOption, setQuizSelectedOption] = useState<string | null>(null)
  const [quizCorrectCount, setQuizCorrectCount] = useState(0)

  const activeProfile = useMemo(() => {
    return profiles.find((p) => p.id === activeProfileId) || profiles[0]
  }, [profiles, activeProfileId])

  const selectedLetter: LetterCurriculum | null = useMemo(() => {
    if (!selectedLetterId) return null
    return LETTERS_DATA.find((l) => l.id === selectedLetterId) || null
  }, [selectedLetterId])

  // İlk açılışta buluttan yedek ve global avatar kontrolü
  useEffect(() => {
    // 1. Cihaza özel bulut yedeği kontrolü
    loadCloudBackup().then((cloudData) => {
      if (cloudData && Array.isArray(cloudData.profiles) && cloudData.profiles.length > 0) {
        const localSaved = localStorage.getItem(STORAGE_PROFILES_KEY)
        if (!localSaved) {
          setProfiles(cloudData.profiles as ChildProfile[])
        }
      }
    })

    // 2. Tüm cihazlar için ortak global profil fotoğrafı senkronizasyonu
    loadGlobalAvatar().then((globalAvatar) => {
      if (globalAvatar) {
        setProfiles((prev) =>
          prev.map((prof) => {
            if (prof.id === 'prof_eylul_mina' && prof.avatar !== globalAvatar) {
              return { ...prof, avatar: globalAvatar }
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

  // Harf değiştiğinde alt egzersiz state'lerini sıfırla
  useEffect(() => {
    setQuizQuestionIdx(0)
    setQuizSelectedOption(null)
    setQuizCorrectCount(0)
  }, [selectedLetterId, exerciseStep])

  const triggerCelebration = (msg: string) => {
    setCelebrationMessage(msg)
    setTimeout(() => {
      setCelebrationMessage(null)
    }, 3000)
  }

  const handleUpdateAvatar = (newAvatar: string) => {
    setProfiles((prev) =>
      prev.map((prof) => (prof.id === activeProfile.id ? { ...prof, avatar: newAvatar } : prof))
    )
    // Tüm cihazların anında görmesi için bulut ortak koleksiyonuna da kaydet
    if (activeProfile.id === 'prof_eylul_mina') {
      saveGlobalAvatar(newAvatar)
    }
    triggerCelebration(`📸 ${activeProfile.name} için yeni profil resmi kaydedildi!`)
  }

  const renderAvatarElement = (avatarStr: string, className = 'avatar-circle', altName = '') => {
    const isImage = avatarStr.startsWith('data:image') || avatarStr.startsWith('http')
    if (isImage) {
      return (
        <span className={`${className} avatar-has-image`}>
          <img src={avatarStr} alt={altName || 'Profil'} className="avatar-img-tag" />
        </span>
      )
    }
    return <span className={className}>{avatarStr}</span>
  }

  const markActivityDone = (
    letterId: string,
    activity: 'sound' | 'trace' | 'syllable' | 'detective' | 'quiz' | 'game'
  ) => {
    setProfiles((prev) =>
      prev.map((prof) => {
        if (prof.id !== activeProfile.id) return prof
        const currentLetterProg = prof.letterProgress[letterId] || {}
        if (currentLetterProg[activity]) return prof // Zaten kazanılmış

        const updatedLetterProg = { ...currentLetterProg, [activity]: true }
        const wasStickerUnlocked =
          currentLetterProg.sound &&
          currentLetterProg.trace &&
          currentLetterProg.syllable &&
          currentLetterProg.quiz
        const isNowStickerUnlocked =
          updatedLetterProg.sound &&
          updatedLetterProg.trace &&
          updatedLetterProg.syllable &&
          updatedLetterProg.quiz

        const bonusStars = isNowStickerUnlocked && !wasStickerUnlocked ? 3 : 1
        if (isNowStickerUnlocked && !wasStickerUnlocked) {
          const letterObj = LETTERS_DATA.find((l) => l.id === letterId)
          if (letterObj) {
            triggerCelebration(
              `🎉 Tebrikler ${prof.name}! "${letterObj.sticker.name} ${letterObj.sticker.emoji}" Çıkartmasını Kazandın!`
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
    const p = activeProfile.letterProgress[letterId]
    if (!p) return false
    return Boolean(p.sound && p.trace && p.syllable && p.quiz)
  }

  const getLetterStarCount = (letterId: string): number => {
    const p = activeProfile.letterProgress[letterId]
    if (!p) return 0
    return Math.min(
      5,
      [p.sound, p.trace, p.syllable, p.detective, p.quiz, p.game].filter(Boolean).length
    )
  }

  const totalEarnedStickers = useMemo(() => {
    return LETTERS_DATA.filter((l) => isLetterStickerEarned(l.id)).length
  }, [activeProfile])

  // Quiz soruları üretimi (Seçili harf için 3 soru)
  const quizQuestions = useMemo(() => {
    if (!selectedLetter) return []
    const otherLetters = LETTERS_DATA.filter((l) => l.id !== selectedLetter.id)

    return selectedLetter.words.map((targetWord, idx) => {
      const distractors = otherLetters
        .slice(idx * 3, idx * 3 + 2)
        .map((d) => ({
          word: d.mascotWord,
          emoji: d.mascotEmoji,
          letter: d.upper,
          isCorrect: false,
        }))

      const correctOption = {
        word: targetWord.word,
        emoji: targetWord.emoji,
        letter: selectedLetter.upper,
        isCorrect: true,
      }

      const options = [...distractors, correctOption].sort((a, b) => a.word.localeCompare(b.word))
      return {
        promptText: `Hangi resmin adı "${selectedLetter.upper}" (${selectedLetter.soundHint}) sesi ile başlıyor veya içinde "${selectedLetter.upper}" sesi var? Dinle: "${targetWord.word}"`,
        speakPrompt: `${targetWord.word}! Göster bakalım, hangisi ${targetWord.word}?`,
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
    speakTurkish(`Hoş geldin ${trimmed}! Neşeli harfler macerasına başlayalım!`)
    setActiveTab('map')
  }

  const handleRestoreFromCloud = async () => {
    if (!restoreCodeInput.trim()) return
    setCloudSyncStatus('syncing')
    const data = await loadCloudBackup(restoreCodeInput.trim())
    if (data && Array.isArray(data.profiles) && data.profiles.length > 0) {
      setProfiles(data.profiles as ChildProfile[])
      setActiveProfileId((data.activeProfileId as string) || (data.profiles[0] as ChildProfile).id)
      setRestoreCodeInput('')
      setCloudSyncStatus('synced')
      playSoundEffect('fanfare')
      triggerCelebration('☁️ Bulut yedeğiniz başarıyla yüklendi!')
    } else {
      setCloudSyncStatus('idle')
      playSoundEffect('error')
      alert('Bu yedek koduna ait kayıt bulunamadı. Lütfen kodu kontrol edin.')
    }
  }

  const currentGroup = useMemo(() => {
    return ISLAND_GROUPS.find((g) => g.id === selectedGroupId) || ISLAND_GROUPS[0]
  }, [selectedGroupId])

  const groupLetters = useMemo(() => {
    return LETTERS_DATA.filter((l) => l.groupId === selectedGroupId)
  }, [selectedGroupId])

  return (
    <div className="app-shell">
      {celebrationMessage && (
        <div className="celebration-toast" onClick={() => setCelebrationMessage(null)}>
          <Sparkles size={24} />
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

      {/* ÜST BAR */}
      <header className="top-navbar">
        <div
          className="brand-box"
          onClick={() => {
            playSoundEffect('click')
            setSelectedLetterId(null)
            setActiveTab('map')
          }}
        >
          <div className="brand-logo">🌈</div>
          <div>
            <h1 className="brand-title">Eylül Mina Neşeli Harfler</h1>
            <p className="brand-subtitle">6 Yaş Okuma-Yazma & Ses Macerası</p>
          </div>
        </div>

        <div className="top-stats">
          <div className="profile-pill-wrapper">
            <button
              type="button"
              className="profile-pill"
              onClick={() => {
                playSoundEffect('click')
                setSelectedLetterId(null)
                setActiveTab('profiles')
              }}
              title="Çocuk Profilini Değiştir"
            >
              {renderAvatarElement(activeProfile.avatar, 'avatar-circle', activeProfile.name)}
              <span className="profile-name">{activeProfile.name}</span>
            </button>
            <button
              type="button"
              className="change-photo-badge-btn"
              onClick={(e) => {
                e.stopPropagation()
                playSoundEffect('click')
                setIsPhotoModalOpen(true)
              }}
              title="Profil Resmi Yükle / Değiştir"
            >
              <Camera size={13} />
            </button>
          </div>

          <div className="score-pill stars-pill" title="Toplanan Yıldızlar">
            <Star size={18} fill="#facc15" color="#eab308" />
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
            <Award size={18} />
            <span>
              {totalEarnedStickers}/{LETTERS_DATA.length}
            </span>
          </button>
        </div>
      </header>

      {/* ANA İÇERİK */}
      <main className="main-container">
        {selectedLetter ? (
          /* ================= HARF ALIŞTIRMA EKRANI (4 ADIMLI OYUN) ================= */
          <div className="letter-lesson-view">
            <div className="lesson-topbar">
              <button
                type="button"
                className="back-map-btn"
                onClick={() => {
                  playSoundEffect('click')
                  setSelectedLetterId(null)
                }}
              >
                <ChevronLeft size={20} /> Haritaya Dön
              </button>

              <div className="lesson-letter-badge" style={{ backgroundColor: selectedLetter.color }}>
                <span>
                  {selectedLetter.upper} {selectedLetter.lower}
                </span>
                <span className="badge-emoji">{selectedLetter.mascotEmoji}</span>
              </div>

              <div className="lesson-stars-indicator">
                {[1, 2, 3, 4, 5].map((st) => (
                  <Star
                    key={st}
                    size={22}
                    fill={getLetterStarCount(selectedLetter.id) >= st ? '#facc15' : 'none'}
                    color={getLetterStarCount(selectedLetter.id) >= st ? '#eab308' : '#cbd5e1'}
                  />
                ))}
              </div>
            </div>

            {/* 4 ALIŞTIRMA SEKMESİ */}
            <div className="exercise-tabs">
              <button
                type="button"
                className={`ex-tab ${exerciseStep === 'sound' ? 'active' : ''} ${
                  activeProfile.letterProgress[selectedLetter.id]?.sound ? 'done' : ''
                }`}
                onClick={() => {
                  playSoundEffect('click')
                  setExerciseStep('sound')
                }}
              >
                <BookOpen size={20} />
                <span>1. Sesi Tanı</span>
                {activeProfile.letterProgress[selectedLetter.id]?.sound && (
                  <CheckCircle2 size={16} className="done-icon" />
                )}
              </button>

              <button
                type="button"
                className={`ex-tab ${exerciseStep === 'trace' ? 'active' : ''} ${
                  activeProfile.letterProgress[selectedLetter.id]?.trace ? 'done' : ''
                }`}
                onClick={() => {
                  playSoundEffect('click')
                  setExerciseStep('trace')
                }}
              >
                <Pencil size={20} />
                <span>2. Harf Çiz</span>
                {activeProfile.letterProgress[selectedLetter.id]?.trace && (
                  <CheckCircle2 size={16} className="done-icon" />
                )}
              </button>

              <button
                type="button"
                className={`ex-tab ${exerciseStep === 'syllable' ? 'active' : ''} ${
                  activeProfile.letterProgress[selectedLetter.id]?.syllable ? 'done' : ''
                }`}
                onClick={() => {
                  playSoundEffect('click')
                  setExerciseStep('syllable')
                }}
              >
                <Utensils size={20} />
                <span>3. Hece Mutfağı</span>
                {activeProfile.letterProgress[selectedLetter.id]?.syllable && (
                  <CheckCircle2 size={16} className="done-icon" />
                )}
              </button>

              <button
                type="button"
                className={`ex-tab ${exerciseStep === 'detective' ? 'active' : ''} ${
                  activeProfile.letterProgress[selectedLetter.id]?.detective ? 'done' : ''
                }`}
                onClick={() => {
                  playSoundEffect('click')
                  setExerciseStep('detective')
                }}
              >
                <Flashlight size={20} />
                <span>4. Harf Dedektifi</span>
                {activeProfile.letterProgress[selectedLetter.id]?.detective && (
                  <CheckCircle2 size={16} className="done-icon" />
                )}
              </button>

              <button
                type="button"
                className={`ex-tab ${exerciseStep === 'quiz' ? 'active' : ''} ${
                  activeProfile.letterProgress[selectedLetter.id]?.quiz ? 'done' : ''
                }`}
                onClick={() => {
                  playSoundEffect('click')
                  setExerciseStep('quiz')
                  if (quizQuestions[0]) {
                    setTimeout(() => speakTurkish(quizQuestions[0].speakPrompt), 250)
                  }
                }}
              >
                <Ear size={20} />
                <span>5. Dinle & Bul</span>
                {activeProfile.letterProgress[selectedLetter.id]?.quiz && (
                  <CheckCircle2 size={16} className="done-icon" />
                )}
              </button>

              <button
                type="button"
                className={`ex-tab ${exerciseStep === 'game' ? 'active' : ''} ${
                  activeProfile.letterProgress[selectedLetter.id]?.game ? 'done' : ''
                }`}
                onClick={() => {
                  playSoundEffect('click')
                  setExerciseStep('game')
                }}
              >
                <Gamepad2 size={20} />
                <span>6. Sesli Oyun</span>
                {activeProfile.letterProgress[selectedLetter.id]?.game && (
                  <CheckCircle2 size={16} className="done-icon" />
                )}
              </button>
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
                        <Volume2 size={22} /> Sesi Dinle ({selectedLetter.soundHint})
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
                  🔊 Resimlere Dokun, "{selectedLetter.upper}" Sesini ve Kelimeleri Dinle!
                </h3>

                <div className="word-cards-grid">
                  {selectedLetter.words.map((w, i) => (
                    <div
                      key={i}
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
                      {w.sentence && <p className="word-sentence">"{w.sentence}"</p>}
                      <span className="card-audio-hint">
                        <Volume2 size={16} /> Dinle
                      </span>
                    </div>
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

            {/* ADIM 2: PARMAĞIYLA HARF ÇİZME */}
            {exerciseStep === 'trace' && (
              <div className="exercise-panel">
                <LetterTracingCanvas
                  letter={selectedLetter}
                  completed={Boolean(activeProfile.letterProgress[selectedLetter.id]?.trace)}
                  onComplete={() => markActivityDone(selectedLetter.id, 'trace')}
                />

                <div className="step-next-bar">
                  <button
                    type="button"
                    className="btn-primary btn-large"
                    onClick={() => {
                      playSoundEffect('click')
                      setExerciseStep('syllable')
                    }}
                  >
                    Hece Mutfağına Geç <ChevronRight size={22} />
                  </button>
                </div>
              </div>
            )}

            {/* ADIM 3: HECE MUTFAĞI (KELİME PİŞİRME OYUNU) */}
            {exerciseStep === 'syllable' && (
              <div className="exercise-panel">
                <SyllableKitchenGame
                  letter={selectedLetter}
                  childName={activeProfile.name}
                  completed={Boolean(activeProfile.letterProgress[selectedLetter.id]?.syllable)}
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
                  completed={Boolean(activeProfile.letterProgress[selectedLetter.id]?.detective)}
                  onComplete={() => markActivityDone(selectedLetter.id, 'detective')}
                  onExit={() => {
                    markActivityDone(selectedLetter.id, 'detective')
                    playSoundEffect('fanfare')
                    setExerciseStep('quiz')
                    if (quizQuestions[0]) {
                      setTimeout(() => speakTurkish(quizQuestions[0].speakPrompt), 300)
                    }
                  }}
                />
              </div>
            )}

            {/* ADIM 6: MİNİ SESLİ OYUN */}
            {exerciseStep === 'game' && (
              <div className="exercise-panel">
                <LetterSoundGame
                  letter={selectedLetter}
                  childName={activeProfile.name}
                  completed={Boolean(activeProfile.letterProgress[selectedLetter.id]?.game)}
                  onComplete={() => markActivityDone(selectedLetter.id, 'game')}
                  onExit={() => {
                    playSoundEffect('click')
                    setSelectedLetterId(null)
                  }}
                />
              </div>
            )}

            {/* ADIM 5: SESİ DUYUP DOĞRU HARFİ/KELİMEYİ BULMA */}
            {exerciseStep === 'quiz' && (
              <div className="exercise-panel">
                {(() => {
                  const currentQ = quizQuestions[quizQuestionIdx]
                  if (!currentQ) return null
                  return (
                    <div className="quiz-card">
                      <div className="quiz-header">
                        <span className="step-pill">
                          5. Adım: Sesi Duy ve Bul ({quizQuestionIdx + 1}/{quizQuestions.length})
                        </span>
                        <button
                          type="button"
                          className="btn-listen-big"
                          onClick={() => {
                            playSoundEffect('pop')
                            speakTurkish(currentQ.speakPrompt)
                          }}
                        >
                          <Volume2 size={26} /> Soruyu Sesli Dinle: "{currentQ.targetWord}"
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
                                  speakTurkish(`Harikasın ${activeProfile.name}! Doğru cevap: ${opt.word}!`)
                                  setQuizCorrectCount((c) => c + 1)
                                } else {
                                  playSoundEffect('error')
                                  speakTurkish(`Bu ${opt.word}. Tekrar deneyelim!`)
                                }
                              }}
                            >
                              <span className="quiz-opt-emoji">{opt.emoji}</span>
                              <span className="quiz-opt-word">{opt.word}</span>
                              <span className="quiz-opt-badge">{opt.letter} Harfi</span>
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
                                  `Tebrikler ${activeProfile.name}! Şimdi ${selectedLetter.mascotWord} ile mini sesli oyun zamanı!`
                                )
                                setExerciseStep('game')
                              }}
                            >
                              <Sparkles size={20} /> Ödülü Al ve Oyuna Geç! (
                              {Math.max(quizCorrectCount, 1)}/{quizQuestions.length})
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )
                })()}
              </div>
            )}
          </div>
        ) : activeTab === 'kitchen' ? (
          /* ================= HECE MUTFAĞI (3 SEVİYELİ TAM EKRAN OYUN) ================= */
          <div className="detective-standalone-view">
            <SyllableKitchenGame
              childName={activeProfile.name}
              onComplete={() => {
                markActivityDone('e', 'syllable')
              }}
              onNext={() => {
                playSoundEffect('click')
                setActiveTab('map')
              }}
            />
          </div>
        ) : activeTab === 'detective' ? (
          /* ================= KARANLIK ODA / HARF DEDEKTİFİ TAM EKRAN OYUN ================= */
          <div className="detective-standalone-view">
            <LetterDetectiveGame
              childName={activeProfile.name}
              onComplete={() => {
                markActivityDone('t', 'detective')
              }}
              onExit={() => {
                playSoundEffect('click')
                setActiveTab('map')
              }}
            />
          </div>
        ) : activeTab === 'map' ? (
          /* ================= SEVİYE HARİTASI VE HARF ADALARI ================= */
          <div className="map-view">
            <section className="hero-welcome-banner">
              {/* BÜYÜK VE BELİRGİN PROFİL FOTOĞRAFI VİTRİNİ */}
              <div className="hero-avatar-showcase">
                <div
                  className="hero-avatar-frame-large"
                  onClick={() => {
                    playSoundEffect('click')
                    setIsPhotoModalOpen(true)
                  }}
                  title="Fotoğrafı Değiştirmek İçin Dokun"
                >
                  {renderAvatarElement(activeProfile.avatar, 'hero-avatar-big-img', activeProfile.name)}
                  <button
                    type="button"
                    className="hero-avatar-camera-btn"
                    onClick={(e) => {
                      e.stopPropagation()
                      playSoundEffect('click')
                      setIsPhotoModalOpen(true)
                    }}
                    title="Profil Fotoğrafı Yükle"
                  >
                    <Camera size={18} />
                  </button>
                  <div className="hero-avatar-glow-ring" />
                </div>
              </div>

              <div className="hero-welcome-text">
                <div className="hero-badge-row">
                  <span className="hero-name-pill">👑 {activeProfile.name}</span>
                </div>

                <div className="hero-action-buttons">
                  <button
                    type="button"
                    className="hero-audio-btn"
                    onClick={() => {
                      playSoundEffect('pop')
                      playWelcomeGreeting(activeProfile.name)
                    }}
                  >
                    <Volume2 size={24} /> Hoş Geldin Mesajını Dinle 🔊
                  </button>

                  <button
                    type="button"
                    className="hero-kitchen-launch-btn"
                    onClick={() => {
                      playSoundEffect('pop')
                      setSelectedLetterId(null)
                      setActiveTab('kitchen')
                    }}
                  >
                    <Utensils size={22} /> 🍲 Hece Mutfağı (Kelime Pişir)
                  </button>

                  <button
                    type="button"
                    className="hero-detective-launch-btn"
                    onClick={() => {
                      playSoundEffect('pop')
                      setSelectedLetterId(null)
                      setActiveTab('detective')
                    }}
                  >
                    <Flashlight size={22} /> 🔦 Harf Dedektifi (Karanlık Oda)
                  </button>
                </div>
              </div>
            </section>

            {/* 5 ADA SEÇİCİ */}
            <div className="island-selector">
              {ISLAND_GROUPS.map((grp) => {
                const completedCount = grp.letters.filter((lId) => isLetterStickerEarned(lId)).length
                const isSelected = grp.id === selectedGroupId
                return (
                  <button
                    key={grp.id}
                    type="button"
                    className={`island-tab-btn ${isSelected ? 'selected' : ''}`}
                    style={{
                      borderColor: isSelected ? grp.accentColor : 'transparent',
                      background: isSelected ? grp.bgGradient : '#ffffff',
                    }}
                    onClick={() => {
                      playSoundEffect('click')
                      setSelectedGroupId(grp.id)
                    }}
                  >
                    <span className="island-tab-emoji">{grp.themeEmoji}</span>
                    <div className="island-tab-info">
                      <strong>{grp.title}</strong>
                      <span>{grp.letters.join(' • ')}</span>
                    </div>
                    <span className="island-progress-pill" style={{ backgroundColor: grp.accentColor }}>
                      {completedCount}/{grp.letters.length} ⭐
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
              </div>

              <div className="letters-island-grid">
                {groupLetters.map((letter, idx) => {
                  const stars = getLetterStarCount(letter.id)
                  const stickerUnlocked = isLetterStickerEarned(letter.id)

                  return (
                    <div
                      key={letter.id}
                      className={`letter-island-card ${stickerUnlocked ? 'mastered' : ''}`}
                      onClick={() => {
                        playSoundEffect('pop')
                        setSelectedLetterId(letter.id)
                        setExerciseStep('sound')
                        speakTurkish(`${letter.upper} sesi. ${letter.mascotWord}!`)
                      }}
                    >
                      <div className="letter-step-num">{idx + 1}. Ses</div>

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
                            size={18}
                            fill={stars >= s ? '#facc15' : 'none'}
                            color={stars >= s ? '#eab308' : '#cbd5e1'}
                          />
                        ))}
                      </div>

                      <div
                        className="letter-card-cta"
                        style={{ backgroundColor: stickerUnlocked ? '#16a34a' : letter.color }}
                      >
                        {stickerUnlocked ? '🌟 Tamamlandı (Tekrar Oyna)' : '🚀 Maceraya Başla'}
                      </div>
                    </div>
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
                  Bir harfin 4 alıştırmasını (Ses, Çizim, Hece ve Oyun) tamamladığında özel çıkartması
                  açılır!
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
                return (
                  <div
                    key={letter.id}
                    className={`sticker-slot ${unlocked ? 'unlocked' : 'locked'}`}
                    onClick={() => {
                      playSoundEffect('pop')
                      if (unlocked) {
                        speakTurkish(`Tebrikler! ${letter.sticker.name} çıkartmasını kazandın!`)
                      } else {
                        setSelectedLetterId(letter.id)
                        setActiveTab('map')
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
                      {unlocked ? '✨ Kazanıldı!' : `${stars}/5 Yıldız`}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          /* ================= ÇOKLU ÇOCUK PROFİLİ VE ÜCRETSİZ BULUT YEDEK ================= */
          <div className="profiles-view">
            <div className="profiles-grid-layout">
              <div className="profiles-card">
                <h2>👧 Çocuk Profilleri (Üye Olmadan Tek Tıkla)</h2>
                <p>
                  Her çocuğun yıldızları ve çıkartmaları kendi profilinde ayrı tutulur. İstediğin
                  profile dokunarak geçiş yapabilirsin.
                </p>

                <div className="profile-list">
                  {profiles.map((prof) => {
                    const isCurrent = prof.id === activeProfile.id
                    const stickerCount = LETTERS_DATA.filter((l) => {
                      const lp = prof.letterProgress[l.id]
                      return Boolean(lp?.sound && lp?.trace && lp?.syllable && lp?.quiz)
                    }).length

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
                              ⭐ {prof.stars} Yıldız • 🏆 {stickerCount} Çıkartma
                            </span>
                          </div>
                        </div>
                        <div className="prof-row-right">
                          {isCurrent && (
                            <button
                              type="button"
                              className="btn-secondary btn-small-photo"
                              onClick={(e) => {
                                e.stopPropagation()
                                playSoundEffect('click')
                                setIsPhotoModalOpen(true)
                              }}
                              title="Fotoğrafı Değiştir"
                            >
                              <Camera size={14} /> Fotoğraf Değiştir
                            </button>
                          )}
                          <span className="prof-select-badge">
                            {isCurrent ? '✅ Aktif' : 'Seç'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                <form className="add-profile-form" onSubmit={handleAddProfile}>
                  <h3>
                    <UserPlus size={20} /> Yeni Kardeş / Arkadaş Profili Ekle
                  </h3>
                  <input
                    type="text"
                    placeholder="Çocuğun Adı (Örn: Eylül Mina)"
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
                    <UserPlus size={18} /> Profili Oluştur ve Başla
                  </button>
                </form>
              </div>

              <div className="cloud-backup-card">
                <div className="cloud-title-row">
                  <Cloud size={26} color="#0284c7" />
                  <div>
                    <h3>Ücretsiz Firebase Bulut Yedekleme</h3>
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
                  Üyelik veya şifre gerekmez! İlerlemeniz bu cihaza ve ücretsiz Firebase bulutuna
                  otomatik kaydedilir. Başka bir telefon veya tablete geçerseniz aşağıdaki{' '}
                  <strong>Yedek Kodunu</strong> girerek kaldığınız yerden devam edebilirsiniz.
                </p>

                <div className="device-code-box">
                  <div>
                    <small>Bu Cihazın Bulut Yedek Kodu:</small>
                    <code>{getOrCreateDeviceId()}</code>
                  </div>
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
                    {copiedDeviceCode ? 'Kopyalandı' : 'Kodu Kopyala'}
                  </button>
                </div>

                <div className="restore-box">
                  <h4>Başka Cihazdan Yedek Geri Yükle</h4>
                  <div className="restore-input-row">
                    <input
                      type="text"
                      placeholder="dev_xxxx_xxxx kodunu yapıştırın"
                      value={restoreCodeInput}
                      onChange={(e) => setRestoreCodeInput(e.target.value)}
                      className="profile-input"
                    />
                    <button type="button" className="btn-secondary" onClick={handleRestoreFromCloud}>
                      <RefreshCw size={16} /> Yükle
                    </button>
                  </div>
                </div>

                <div className="pwa-install-guide">
                  <h4>📱 iOS (iPhone/iPad) ve Android Ana Ekrana Ekleme</h4>
                  <ul>
                    <li>
                      <strong>iPhone / iPad (Safari):</strong> Alt menüdeki <em>Paylaş</em> ikonuna
                      dokunun ve <strong>"Ana Ekrana Ekle"</strong> seçeneğini seçin.
                    </li>
                    <li>
                      <strong>Android (Chrome):</strong> Sağ üstteki üç noktaya dokunup{' '}
                      <strong>"Uygulamayı Yükle / Ana ekrana ekle"</strong> seçeneğine basın.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ALT MOBİL PWA NAVİGASYON BARI */}
      <nav className="bottom-pwa-nav">
        <button
          type="button"
          className={`nav-item ${activeTab === 'map' && !selectedLetterId ? 'active' : ''}`}
          onClick={() => {
            playSoundEffect('click')
            setSelectedLetterId(null)
            setActiveTab('map')
          }}
        >
          <Sparkles size={22} />
          <span>Harf Adaları</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === 'kitchen' && !selectedLetterId ? 'active' : ''}`}
          onClick={() => {
            playSoundEffect('click')
            setSelectedLetterId(null)
            setActiveTab('kitchen')
          }}
        >
          <Utensils size={22} />
          <span>Hece Mutfağı</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === 'detective' && !selectedLetterId ? 'active' : ''}`}
          onClick={() => {
            playSoundEffect('click')
            setSelectedLetterId(null)
            setActiveTab('detective')
          }}
        >
          <Flashlight size={22} />
          <span>Harf Dedektifi</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === 'stickers' && !selectedLetterId ? 'active' : ''}`}
          onClick={() => {
            playSoundEffect('click')
            setSelectedLetterId(null)
            setActiveTab('stickers')
          }}
        >
          <Award size={22} />
          <span>Çıkartmalar ({totalEarnedStickers})</span>
        </button>

        <button
          type="button"
          className={`nav-item ${activeTab === 'profiles' && !selectedLetterId ? 'active' : ''}`}
          onClick={() => {
            playSoundEffect('click')
            setSelectedLetterId(null)
            setActiveTab('profiles')
          }}
        >
          <Users size={22} />
          <span>Profiller & Bulut</span>
        </button>
      </nav>
    </div>
  )
}
