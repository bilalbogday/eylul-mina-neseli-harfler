import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Volume2, Mic, Rocket, Sparkles, Star, Award, Compass } from 'lucide-react'
import type { LetterCurriculum } from './curriculum'
import { playSoundEffect, speakTurkish } from './sound'

interface SpaceRocketGameProps {
  letter?: LetterCurriculum
  childName: string
  completed?: boolean
  onComplete?: () => void
  onExit?: () => void
}

interface RocketWordMission {
  id: string
  word: string
  emoji: string
  missionType: 'first' | 'last'
  missingIndex: number // 0 = ilk harf, word.length - 1 = son harf
  targetChar: string
  distractors: string[]
  familyTag?: string
}

// Kişiselleştirilmiş Aile Kelimeleri ve Müfredat Kelimeleri (Hem İlk Hem Son Harf Görevleri)
const ROCKET_MISSIONS: RocketWordMission[] = [
  // 1. Aile İsimleri - İlk Harf Görevleri
  {
    id: 'm_mina_first',
    word: 'MİNA',
    emoji: '👧',
    missionType: 'first',
    missingIndex: 0,
    targetChar: 'M',
    distractors: ['A', 'N', 'L'],
    familyTag: 'Prenses Mina',
  },
  {
    id: 'm_barlas_first',
    word: 'BARLAS',
    emoji: '👶',
    missionType: 'first',
    missingIndex: 0,
    targetChar: 'B',
    distractors: ['M', 'K', 'T'],
    familyTag: 'Cesur Kardeş',
  },
  {
    id: 'm_emine_first',
    word: 'EMİNE',
    emoji: '👩',
    missionType: 'first',
    missingIndex: 0,
    targetChar: 'E',
    distractors: ['A', 'İ', 'O'],
    familyTag: 'Canım Anne',
  },
  {
    id: 'm_bilal_first',
    word: 'BİLAL',
    emoji: '👨',
    missionType: 'first',
    missingIndex: 0,
    targetChar: 'B',
    distractors: ['L', 'T', 'N'],
    familyTag: 'Sevgili Baba',
  },

  // 2. Aile İsimleri - Son Harf Görevleri
  {
    id: 'm_mina_last',
    word: 'MİNA',
    emoji: '👧',
    missionType: 'last',
    missingIndex: 3,
    targetChar: 'A',
    distractors: ['E', 'İ', 'O'],
    familyTag: 'Prenses Mina (Son Ses)',
  },
  {
    id: 'm_barlas_last',
    word: 'BARLAS',
    emoji: '👶',
    missionType: 'last',
    missingIndex: 5,
    targetChar: 'S',
    distractors: ['L', 'M', 'N'],
    familyTag: 'Cesur Kardeş (Son Ses)',
  },

  // 3. Müfredat Kelimeleri - İlk ve Son Harfler
  {
    id: 'm_roket_first',
    word: 'ROKET',
    emoji: '🚀',
    missionType: 'first',
    missingIndex: 0,
    targetChar: 'R',
    distractors: ['K', 'T', 'L'],
  },
  {
    id: 'm_roket_last',
    word: 'ROKET',
    emoji: '🚀',
    missionType: 'last',
    missingIndex: 4,
    targetChar: 'T',
    distractors: ['K', 'P', 'N'],
  },
  {
    id: 'm_elma_first',
    word: 'ELMA',
    emoji: '🍎',
    missionType: 'first',
    missingIndex: 0,
    targetChar: 'E',
    distractors: ['A', 'İ', 'U'],
  },
  {
    id: 'm_elma_last',
    word: 'ELMA',
    emoji: '🍎',
    missionType: 'last',
    missingIndex: 3,
    targetChar: 'A',
    distractors: ['E', 'İ', 'U'],
  },
  {
    id: 'm_lale_first',
    word: 'LALE',
    emoji: '🌷',
    missionType: 'first',
    missingIndex: 0,
    targetChar: 'L',
    distractors: ['N', 'T', 'E'],
  },
  {
    id: 'm_lale_last',
    word: 'LALE',
    emoji: '🌷',
    missionType: 'last',
    missingIndex: 3,
    targetChar: 'E',
    distractors: ['A', 'İ', 'O'],
  },
  {
    id: 'm_nar_first',
    word: 'NAR',
    emoji: '🍓',
    missionType: 'first',
    missingIndex: 0,
    targetChar: 'N',
    distractors: ['M', 'L', 'R'],
  },
  {
    id: 'm_nar_last',
    word: 'NAR',
    emoji: '🍓',
    missionType: 'last',
    missingIndex: 2,
    targetChar: 'R',
    distractors: ['N', 'T', 'S'],
  },
]

// Web Audio API ile Gerçekçi Roket Motoru Gürültüsü Sentezleyici
function playRocketEngineRoar() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const now = ctx.currentTime
    const bufferSize = ctx.sampleRate * 2.5
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1
    }

    const noise = ctx.createBufferSource()
    noise.buffer = buffer

    // Derin titreşimli Low-pass filtre
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(120, now)
    filter.frequency.exponentialRampToValueAtTime(1400, now + 1.8)

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.01, now)
    gain.gain.linearRampToValueAtTime(0.45, now + 0.5)
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.4)

    noise.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    noise.start(now)
    noise.stop(now + 2.5)
  } catch {
    // Fail-safe
  }
}

// Mekanik Kargo Kilit / Çıkrık Sesi
function playCargoLockSound() {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    const now = ctx.currentTime

    ;[0, 0.08].forEach((offset) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'square'
      osc.frequency.setValueAtTime(480, now + offset)
      osc.frequency.exponentialRampToValueAtTime(120, now + offset + 0.05)

      gain.gain.setValueAtTime(0.3, now + offset)
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.05)

      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now + offset)
      osc.stop(now + offset + 0.06)
    })
  } catch {
    // Fail-safe
  }
}

export function SpaceRocketGame({
  letter: _letter,
  childName,
  completed: _completed,
  onComplete,
  onExit: _onExit,
}: SpaceRocketGameProps) {
  // Görev listesi
  const [missionIdx, setMissionIdx] = useState<number>(0)
  const currentMission = ROCKET_MISSIONS[missionIdx] || ROCKET_MISSIONS[0]

  // Oyun Aşaması: 'loading' | 'launching' | 'blastoff'
  const [phase, setPhase] = useState<'loading' | 'launching' | 'blastoff'>('loading')

  // Seçilen / yüklenen harf
  const [slottedChar, setSlottedChar] = useState<string | null>(null)
  const [bouncingChar, setBouncingChar] = useState<string | null>(null)
  const [astronautSpeech, setAstronautSpeech] = useState<string>('')

  // Mikrofon ve Ses Gücü Barı (0..100)
  const [voicePower, setVoicePower] = useState<number>(0)
  const [isMicListening, setIsMicListening] = useState<boolean>(false)
  const [isLaunchingViaButton, setIsLaunchingViaButton] = useState<boolean>(false)

  // İstatistik
  const [launchedCount, setLaunchedCount] = useState<number>(0)
  const [showVictoryBanner, setShowVictoryBanner] = useState<boolean>(false)

  const audioStreamRef = useRef<MediaStream | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const micAnimRef = useRef<number | null>(null)

  // Kargo kapsülleri havuzu (1 doğru + 3 çeldirici)
  const capsules = useMemo(() => {
    const list = [currentMission.targetChar, ...currentMission.distractors]
    // Karıştır
    for (let i = list.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[list[i], list[j]] = [list[j], list[i]]
    }
    return list
  }, [currentMission])

  // Yeni görev geldiğinde durumu sıfırla
  const resetMission = useCallback(() => {
    setPhase('loading')
    setSlottedChar(null)
    setBouncingChar(null)
    setVoicePower(0)
    setIsLaunchingViaButton(false)
    setShowVictoryBanner(false)

    const missionPrompt =
      currentMission.missionType === 'first'
        ? `Astronot ${childName}, rokete "${currentMission.word}" kargosu yüklüyoruz! İLK HARFİ (baş sesi) bulabilir misin?`
        : `Astronot ${childName}, "${currentMission.word}" kelimesinin SON HARFİNİ (son sesi) bulup rokete yükleyelim!`
    setAstronautSpeech(missionPrompt)
  }, [currentMission, childName])

  useEffect(() => {
    resetMission()
    const timer = setTimeout(() => {
      const speechText =
        currentMission.missionType === 'first'
          ? `Astronot ${childName}! "${currentMission.word}" kelimesinin ilk harfini seç ve kargoyu tamamla!`
          : `Astronot ${childName}! "${currentMission.word}" kelimesinin son harfini seç ve kargoyu tamamla!`
      speakTurkish(speechText)
    }, 450)
    return () => clearTimeout(timer)
  }, [resetMission, childName, currentMission])

  // Aşama 1: Kargo Kapsülüne Tıklama
  const handleSelectCapsule = (char: string) => {
    if (phase !== 'loading') return

    if (char === currentMission.targetChar) {
      // Doğru Harf!
      playCargoLockSound()
      playSoundEffect('chord')
      setSlottedChar(char)
      setPhase('launching')

      const readySpeech = `Kargo kilitlendi! Harikasın ${childName}! Şimdi roketi fırlatmak için yüksek sesle "${currentMission.word}" de veya Fırlat butonuna bas!`
      setAstronautSpeech(readySpeech)
      speakTurkish(readySpeech)

      // Mikrofon dinlemeyi başlat
      startMicListening()
    } else {
      // Yanlış Harf (Manyetik Kalkan Bzzz Sesi)
      playSoundEffect('error')
      setBouncingChar(char)
      setTimeout(() => setBouncingChar(null), 700)

      if (currentMission.missionType === 'first') {
        const firstSound = currentMission.word.slice(0, 1).toLocaleUpperCase('tr-TR')
        const hintSpeech = `Hmm, bu harfle başlamıyor. İlk sesi dinleyelim: ${firstSound}... ${currentMission.word}!`
        setAstronautSpeech(hintSpeech)
        speakTurkish(hintSpeech)
      } else {
        const lastSound = currentMission.word.slice(-1).toLocaleUpperCase('tr-TR')
        const hintSpeech = `Hmm, bu harfle bitmiyor. Son sesi dinleyelim: ${currentMission.word}... ${lastSound}!`
        setAstronautSpeech(hintSpeech)
        speakTurkish(hintSpeech)
      }
    }
  }

  // Mikrofon Ses Seviyesi Ölçümü
  const startMicListening = async () => {
    if (!navigator.mediaDevices?.getUserMedia) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      audioStreamRef.current = stream

      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const ctx = new AudioContextClass()
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)
      analyserRef.current = analyser
      setIsMicListening(true)

      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const checkVolume = () => {
        if (!analyserRef.current) return
        analyserRef.current.getByteFrequencyData(dataArray)

        let sum = 0
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i]
        }
        const average = sum / bufferLength
        const powerLevel = Math.min(100, Math.round((average / 55) * 100))

        setVoicePower((prev) => Math.max(prev * 0.9, powerLevel))

        if (powerLevel >= 80) {
          triggerBlastoff()
          return
        }

        micAnimRef.current = requestAnimationFrame(checkVolume)
      }

      micAnimRef.current = requestAnimationFrame(checkVolume)
    } catch {
      setIsMicListening(false)
    }
  }

  const stopMicListening = () => {
    if (micAnimRef.current) {
      cancelAnimationFrame(micAnimRef.current)
      micAnimRef.current = null
    }
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((t) => t.stop())
      audioStreamRef.current = null
    }
    setIsMicListening(false)
  }

  // Aşama 2: Roket Fırlatma
  const triggerBlastoff = () => {
    stopMicListening()
    setIsLaunchingViaButton(true)
    setPhase('blastoff')
    setVoicePower(100)

    speakTurkish('3... 2... 1... Fırlat!')
    playRocketEngineRoar()
    playSoundEffect('fanfare')

    setTimeout(() => {
      setShowVictoryBanner(true)
      setLaunchedCount((c) => c + 1)
      if (onComplete) onComplete()

      speakTurkish(`Tebrikler Astronot ${childName}! Roket uzay yıldızlarına ulaştı!`)
    }, 1800)

    setTimeout(() => {
      const nextIdx = (missionIdx + 1) % ROCKET_MISSIONS.length
      setMissionIdx(nextIdx)
    }, 4500)
  }

  useEffect(() => {
    return () => {
      stopMicListening()
    }
  }, [])

  return (
    <div className="space-rocket-container">
      {/* ÜST BAŞLIK VE KONTROLLER */}
      <div className="rocket-top-header">
        <div className="rocket-title-group">
          <div className="rocket-icon-pill">🚀</div>
          <div>
            <h2 className="rocket-main-title">Uzaylı Kargo Roketi</h2>
            <p className="rocket-subtitle">
              {currentMission.missionType === 'first' ? 'İlk Sesi Bul' : 'Son Sesi Bul'}, Sesinle Roketi Uzaya Fırlat!
            </p>
          </div>
        </div>

        <div className="rocket-header-tags">
          <span className="mission-type-tag">
            <Compass size={14} />
            {currentMission.missionType === 'first' ? 'İlk Harfi Bul' : 'Son Harfi Bul'}
          </span>
          <div className="rocket-stats-pill">
            <Star size={16} fill="#facc15" color="#eab308" />
            <span>{launchedCount} Roket</span>
          </div>
        </div>
      </div>

      {/* ASTRONOT KÖPEK/KEDİ KONUŞMA BALONU */}
      <div className="astronaut-speech-card">
        <div className="astronaut-avatar-box">
          <span className="astronaut-helmet">👨‍🚀</span>
          <span className="astronaut-pet">🐶</span>
        </div>
        <div className="astronaut-bubble-text">
          <div className="astronaut-name">Kaptan Astronot:</div>
          <p className="speech-quote">{astronautSpeech}</p>
        </div>
        <button
          type="button"
          className="astronaut-audio-btn"
          onClick={() => {
            playSoundEffect('pop')
            speakTurkish(astronautSpeech)
          }}
          title="Sesli Dinle"
        >
          <Volume2 size={20} />
        </button>
      </div>

      {/* UZAY ÜSSÜ VE ROKET FIRLATMA SAHNESİ */}
      <div className="space-launchpad-scene">
        <div className="space-planet saturn">🪐</div>
        <div className="space-planet mars">🔴</div>

        {/* ================= SVG UZAY ROKETİ ================= */}
        <div
          className={`space-rocket-assembly ${phase === 'blastoff' ? 'blasting-off' : ''} ${
            isLaunchingViaButton ? 'rocket-shaking' : ''
          }`}
        >
          <svg viewBox="0 0 160 320" className="svg-space-rocket" aria-hidden="true">
            <defs>
              <linearGradient id="rocketBodyGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="45%" stopColor="#f8fafc" />
                <stop offset="100%" stopColor="#e2e8f0" />
              </linearGradient>
              <linearGradient id="rocketFinGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#b91c1c" />
              </linearGradient>
            </defs>

            <path d="M 38 230 L 10 280 L 40 270 Z" fill="url(#rocketFinGrad)" />
            <path d="M 122 230 L 150 280 L 120 270 Z" fill="url(#rocketFinGrad)" />
            <path d="M 72 245 L 80 285 L 88 245 Z" fill="#991b1b" />

            <path
              d="M 80 20 C 45 60 40 180 40 260 L 120 260 C 120 180 115 60 80 20 Z"
              fill="url(#rocketBodyGrad)"
              stroke="#cbd5e1"
              strokeWidth="2"
            />

            <path d="M 80 20 C 62 55 52 85 50 100 L 110 100 C 108 85 98 55 80 20 Z" fill="url(#rocketFinGrad)" />

            <circle cx="80" cy="140" r="26" fill="#0284c7" stroke="#94a3b8" strokeWidth="4" />
            <circle cx="80" cy="140" r="20" fill="#38bdf8" />
            <path d="M 68 128 Q 78 124 88 130" stroke="#ffffff" strokeWidth="2.5" fill="none" strokeLinecap="round" />

            <polygon points="58,260 102,260 108,280 52,280" fill="#334155" />
          </svg>

          {/* Astronot Penceresindeki Karakter */}
          <div className="rocket-porthole-character">
            <span>🐶👋</span>
          </div>

          {/* ROKET GÖVDESİNDEKİ KARGO GÖREV EKRANI */}
          <div className="rocket-cargo-screen">
            <div className="cargo-emoji-badge">{currentMission.emoji}</div>
            {currentMission.familyTag && (
              <span className="family-mini-tag">👑 {currentMission.familyTag}</span>
            )}

            <div className="cargo-word-display">
              {currentMission.word.split('').map((ch, idx) => {
                const isTarget = idx === currentMission.missingIndex
                if (isTarget) {
                  return (
                    <span
                      key={idx}
                      className={`cargo-letter-box missing-box ${
                        slottedChar ? 'filled' : 'waiting-pulse'
                      }`}
                    >
                      {slottedChar || '?'}
                    </span>
                  )
                }
                return (
                  <span key={idx} className="cargo-letter-box">
                    {ch}
                  </span>
                )
              })}
            </div>
          </div>

          {/* ATEŞLEME ALEVLERİ */}
          {phase === 'blastoff' && (
            <div className="rocket-thruster-flames">
              <div className="flame-core" />
              <div className="flame-outer" />
              <div className="smoke-billow sb-1" />
              <div className="smoke-billow sb-2" />
              <div className="smoke-billow sb-3" />
            </div>
          )}
        </div>

        <div className="launchpad-base">
          <div className="launchpad-beam left" />
          <div className="launchpad-beam right" />
          <div className="launchpad-platform" />
        </div>
      </div>

      {/* AŞAMA 1: UÇAN KARGO KAPSÜLLERİ */}
      {phase === 'loading' && (
        <div className="cargo-capsules-dock">
          <div className="capsules-instruction">
            📦 {currentMission.missionType === 'first' ? 'İlk eksik harfi' : 'Son eksik harfi'} seçip rokete yükle:
          </div>
          <div className="capsules-row">
            {capsules.map((char, idx) => {
              const isBouncing = bouncingChar === char
              return (
                <button
                  key={idx}
                  type="button"
                  className={`capsule-item ${isBouncing ? 'shield-bounce' : ''}`}
                  onClick={() => handleSelectCapsule(char)}
                >
                  <div className="capsule-glass-dome" />
                  <span className="capsule-letter">{char}</span>
                  <div className="capsule-thruster" />
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* AŞAMA 2: SESLİ FIRLATMA BAR VE BÜYÜK FIRLAT BUTONU */}
      {phase === 'launching' && (
        <div className="voice-launch-control-bar">
          <div className="voice-meter-wrapper">
            <div className="meter-label-row">
              <span className="meter-title">
                <Mic size={18} className="mic-pulse" /> Fırlatma Ses Gücü:
              </span>
              <span className="meter-percent">%{voicePower}</span>
            </div>
            <div className="voice-progress-track">
              <div
                className="voice-progress-fill"
                style={{
                  width: `${voicePower}%`,
                  backgroundColor: voicePower > 70 ? '#10b981' : voicePower > 40 ? '#facc15' : '#38bdf8',
                }}
              />
            </div>
            <p className="voice-subtext">
              {isMicListening ? (
                <span>🎙️ Yüksek sesle <strong>"{currentMission.word}"</strong> diye bağır!</span>
              ) : (
                <span>Kargo yüklendi! Roketi fırlatmak için butona bas!</span>
              )}
            </p>
          </div>

          <button
            type="button"
            className="big-blastoff-btn"
            onClick={triggerBlastoff}
          >
            <Rocket size={28} className="rocket-fly-icon" />
            <span>FIRLAT! (3-2-1)</span>
          </button>
        </div>
      )}

      {/* ZAFER KUTLAMA MODALI */}
      {showVictoryBanner && (
        <div className="space-victory-overlay">
          <div className="space-victory-card">
            <div className="space-stars-fanfare">🚀 🌟 🪐</div>
            <h3 className="victory-space-title">Tebrikler Astronot {childName}!</h3>
            <p className="victory-space-desc">
              <strong>"{currentMission.word}"</strong> kargosu başarıyla uzaya fırlatıldı!
            </p>
            <div className="cosmic-badge">
              <Award size={48} color="#facc15" />
              <span>Yıldız Kargo Madalyası</span>
            </div>
            <button
              type="button"
              className="btn-primary btn-large"
              onClick={() => {
                const nextIdx = (missionIdx + 1) % ROCKET_MISSIONS.length
                setMissionIdx(nextIdx)
                resetMission()
              }}
            >
              <Sparkles size={20} /> Yeni Roketi Yükle
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
