import { useState, useCallback } from 'react'
import { Play, Trash2, Sparkles, Music } from 'lucide-react'
import type { LetterCurriculum } from './curriculum'
import { playSoundEffect, speakTurkish } from './sound'

interface XylophoneMusicGameProps {
  letter?: LetterCurriculum
  childName: string
  completed?: boolean
  onComplete?: () => void
  onExit?: () => void
}

interface XyloKey {
  id: string
  note: string // C4, D4, etc.
  solfege: string // Do, Re, Mi...
  freq: number
  letter: string
  color: string
  shadowColor: string
}

interface SongWord {
  id: string
  word: string
  emoji: string
  letters: string[]
  level: number
}

// 8 Tuşlu Pentatonik / C Majör Gam Ksilofon Tuşları
const XYLO_KEYS: XyloKey[] = [
  { id: 'k_c4', note: 'C4', solfege: 'Do', freq: 261.63, letter: 'A', color: '#ef4444', shadowColor: '#b91c1c' },
  { id: 'k_d4', note: 'D4', solfege: 'Re', freq: 293.66, letter: 'N', color: '#f97316', shadowColor: '#c2410c' },
  { id: 'k_e4', note: 'E4', solfege: 'Mi', freq: 329.63, letter: 'E', color: '#eab308', shadowColor: '#a16207' },
  { id: 'k_f4', note: 'Fa', solfege: 'Fa', freq: 349.23, letter: 'T', color: '#10b981', shadowColor: '#047857' },
  { id: 'k_g4', note: 'Sol', solfege: 'Sol', freq: 392.00, letter: 'İ', color: '#06b6d4', shadowColor: '#0e7490' },
  { id: 'k_a4', note: 'La', solfege: 'La', freq: 440.00, letter: 'L', color: '#3b82f6', shadowColor: '#1d4ed8' },
  { id: 'k_b4', note: 'Si', solfege: 'Si', freq: 493.88, letter: 'M', color: '#8b5cf6', shadowColor: '#6d28d9' },
  { id: 'k_c5', note: 'C5', solfege: 'Do’', freq: 523.25, letter: 'K', color: '#ec4899', shadowColor: '#be185d' },
]

// Şarkılı Kelime Çalma Listesi (Maarif 1. Grup Harfleri + Çocuk ve Aile İsimleri)
const SONG_WORDS: SongWord[] = [
  { id: 'w_lale', word: 'LALE', emoji: '🌷', letters: ['L', 'A', 'L', 'E'], level: 1 },
  { id: 'w_anne', word: 'ANNE', emoji: '👩', letters: ['A', 'N', 'N', 'E'], level: 1 },
  { id: 'w_ela', word: 'ELA', emoji: '👀', letters: ['E', 'L', 'A'], level: 1 },
  { id: 'w_nane', word: 'NANE', emoji: '🌿', letters: ['N', 'A', 'N', 'E'], level: 1 },
  { id: 'w_elma', word: 'ELMA', emoji: '🍎', letters: ['E', 'L', 'M', 'A'], level: 2 },
  { id: 'w_mina', word: 'MİNA', emoji: '👧', letters: ['M', 'İ', 'N', 'A'], level: 2 },
  { id: 'w_kale', word: 'KALE', emoji: '🏰', letters: ['K', 'A', 'L', 'E'], level: 2 },
  { id: 'w_nine', word: 'NİNE', emoji: '👵', letters: ['N', 'İ', 'N', 'E'], level: 2 },
]

// Serbest Modda Tanınan Anlamlı Hece ve Kelimeler Sözlüğü
const KNOWN_WORDS_MAP: Record<string, { emoji: string; meaning: string }> = {
  AL: { emoji: '🍎', meaning: 'Kırmızı elmayı al!' },
  LA: { emoji: '🎵', meaning: 'Neşeli bir hece: La la la!' },
  EL: { emoji: '✋', meaning: 'Eylül Mina el salladı!' },
  LE: { emoji: '🎶', meaning: 'Müzik sesi: Le le le!' },
  AN: { emoji: '⏰', meaning: 'Mutlu ve güzel bir an!' },
  NA: { emoji: '🌿', meaning: 'Nane kokulu na hecesi!' },
  AT: { emoji: '🐴', meaning: 'Dörtnala koşan beyaz at!' },
  ET: { emoji: '🍖', meaning: 'Lezzetli sıcak yemek!' },
  EN: { emoji: '🏆', meaning: 'En başarılı okuyucu!' },
  NE: { emoji: '🎁', meaning: 'Kutuda ne var acaba?' },
  İN: { emoji: '🪜', meaning: 'Merdivenden yavaşça in!' },
  İT: { emoji: '🛒', meaning: 'Alışveriş arabasını it!' },
  LALE: { emoji: '🌷', meaning: 'Güzel renkli lale çiçeği!' },
  ANNE: { emoji: '👩', meaning: 'Canım güzel annem!' },
  NANE: { emoji: '🌿', meaning: 'Mis kokulu taze nane!' },
  ELA: { emoji: '👀', meaning: 'Ela gözlü tatlı çocuk!' },
  ELMA: { emoji: '🍎', meaning: 'Kütür kütür kırmızı elma!' },
  MİNA: { emoji: '👑', meaning: 'Prenses Eylül Mina!' },
  NİNE: { emoji: '👵', meaning: 'Tatlı masallar anlatan nine!' },
  KALE: { emoji: '🏰', meaning: 'Yüksek burçlu masal kalesi!' },
  ALİ: { emoji: '👦', meaning: 'Sevimli arkadaşımız Ali!' },
}

interface NoteParticle {
  id: number
  x: number
  y: number
  char: string
  color: string
}

export function XylophoneMusicGame({
  letter: _letter,
  childName,
  completed: _completed,
  onComplete,
  onExit: _onExit,
}: XylophoneMusicGameProps) {
  // Oyun Modu: 'song' (Şarkılı Kelime Çal) veya 'free' (Serbest Beste)
  const [gameMode, setGameMode] = useState<'song' | 'free'>('song')

  // Şarkı Modu Durumu
  const [currentWordIdx, setCurrentWordIdx] = useState<number>(0)
  const [currentLetterIdx, setCurrentLetterIdx] = useState<number>(0)
  const [isWordComplete, setIsWordComplete] = useState<boolean>(false)
  const [totalSongsPlayed, setTotalSongsPlayed] = useState<number>(0)

  // Serbest Mod Durumu
  const [freeNotesHistory, setFreeNotesHistory] = useState<Array<{ letter: string; note: string; color: string }>>([])
  const [discoveredWord, setDiscoveredWord] = useState<{ word: string; emoji: string; meaning: string } | null>(null)
  const [isPlayingBack, setIsPlayingBack] = useState<boolean>(false)

  // UI Animasyon State
  const [activeKeyId, setActiveKeyId] = useState<string | null>(null)
  const [noteParticles, setNoteParticles] = useState<NoteParticle[]>([])

  const currentSong = SONG_WORDS[currentWordIdx] || SONG_WORDS[0]
  const targetLetter = currentSong.letters[currentLetterIdx] || currentSong.letters[0]

  // Web Audio API Ksilofon/Piyano Sentezleyici
  const playSynthesizedXyloNote = useCallback((freq: number) => {
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (!AudioContextClass) return
      const ctx = new AudioContextClass()
      const now = ctx.currentTime

      // 1. Temel Dalga (Fundamental Sine)
      const osc1 = ctx.createOscillator()
      const gain1 = ctx.createGain()
      osc1.type = 'sine'
      osc1.frequency.setValueAtTime(freq, now)

      // 2. İkinci Harmonik (Ahşap Marimba Sıcaklığı için 2x ve 3x hafif detune)
      const osc2 = ctx.createOscillator()
      const gain2 = ctx.createGain()
      osc2.type = 'triangle'
      osc2.frequency.setValueAtTime(freq * 2.75, now)

      // ADSR Zarfı: Hızlı atak (0.008s), yumuşak üstel sönümlenme (0.75s)
      gain1.gain.setValueAtTime(0.001, now)
      gain1.gain.linearRampToValueAtTime(0.38, now + 0.008)
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.75)

      gain2.gain.setValueAtTime(0.001, now)
      gain2.gain.linearRampToValueAtTime(0.12, now + 0.01)
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35)

      osc1.connect(gain1)
      osc2.connect(gain2)
      gain1.connect(ctx.destination)
      gain2.connect(ctx.destination)

      osc1.start(now)
      osc2.start(now)
      osc1.stop(now + 0.8)
      osc2.stop(now + 0.4)
    } catch {
      // Ses hatası oyunu durdurmasın
    }
  }, [])

  // Zafer Hızlı Arpej Melodisi
  const playVictoryMelody = useCallback(() => {
    const melody = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]
    melody.forEach((freq, idx) => {
      setTimeout(() => {
        playSynthesizedXyloNote(freq)
      }, idx * 90)
    })
  }, [playSynthesizedXyloNote])

  // Parçacık fırlatma (♪ ♫)
  const spawnNoteParticles = (x: number, y: number, color: string) => {
    const chars = ['♪', '♫', '♬', '⭐', '✨']
    const newItems: NoteParticle[] = []
    for (let i = 0; i < 4; i++) {
      newItems.push({
        id: Date.now() + Math.random(),
        x: x + (Math.random() - 0.5) * 30,
        y: y - Math.random() * 20,
        char: chars[Math.floor(Math.random() * chars.length)],
        color,
      })
    }
    setNoteParticles((prev) => [...prev, ...newItems])
    setTimeout(() => {
      setNoteParticles((prev) => prev.filter((p) => !newItems.includes(p)))
    }, 900)
  }

  // Ksilofon Tuşuna Basılma Olayı
  const handleKeyPress = (key: XyloKey, e?: React.MouseEvent | React.TouchEvent) => {
    // 3D basılma animasyonu tetikle
    setActiveKeyId(key.id)
    setTimeout(() => setActiveKeyId(null), 250)

    // Nota sesini çal
    playSynthesizedXyloNote(key.freq)

    // Parçacık üret
    const clientX = e && 'clientX' in e ? e.clientX : window.innerWidth / 2
    const clientY = e && 'clientY' in e ? e.clientY : window.innerHeight / 2
    spawnNoteParticles(clientX, clientY, key.color)

    // Harfi seslendir (Harf okunuşu)
    const letterVoiceText = `${key.letter}!`
    speakTurkish(letterVoiceText)

    if (gameMode === 'song') {
      // MOD 1: Şarkılı Kelime Çalma Mantığı
      if (key.letter === targetLetter) {
        // Doğru tuşa basıldı!
        const nextIdx = currentLetterIdx + 1
        if (nextIdx < currentSong.letters.length) {
          setCurrentLetterIdx(nextIdx)
          playSoundEffect('pop')
        } else {
          // Kelimenin tüm harfleri doğru çalındı!
          setCurrentLetterIdx(nextIdx)
          setIsWordComplete(true)
          playVictoryMelody()
          playSoundEffect('fanfare')

          const mergedSpeech = `${currentSong.letters.join(' - ')}... ${currentSong.word}! Harika bir şarkı çaldın ${childName}!`
          speakTurkish(mergedSpeech)

          setTotalSongsPlayed((c) => c + 1)
          if (onComplete) onComplete()

          // 2.8 saniye sonra sonraki kelimeye geç
          setTimeout(() => {
            const nextWord = (currentWordIdx + 1) % SONG_WORDS.length
            setCurrentWordIdx(nextWord)
            setCurrentLetterIdx(0)
            setIsWordComplete(false)
          }, 3200)
        }
      } else {
        // Yanlış tuşa basıldı (nazik yönlendirme)
        playSoundEffect('error')
        const hintText = `Sıradaki harf ${targetLetter}. Işığı yanan ${targetLetter} tuşuna basalım!`
        speakTurkish(hintText)
      }
    } else {
      // MOD 2: Serbest Beste ve Hece Stüdyosu Mantığı
      setFreeNotesHistory((prev) => {
        const next = [...prev, { letter: key.letter, note: key.solfege, color: key.color }]
        // Son 2, 3 ve 4 harfi kontrol et (Anlamlı kelime tespiti)
        checkDiscoveredWord(next)
        return next
      })
    }
  }

  // Serbest modda anlamlı kelime veya hece oluştu mu kontrol et
  const checkDiscoveredWord = (notes: Array<{ letter: string }>) => {
    const lettersStr = notes.map((n) => n.letter).join('')

    // 4 harfli, 3 harfli ve 2 harfli son kelimeleri tara
    const checkLengths = [4, 3, 2]
    for (const len of checkLengths) {
      if (lettersStr.length >= len) {
        const sub = lettersStr.slice(-len)
        if (KNOWN_WORDS_MAP[sub]) {
          const match = KNOWN_WORDS_MAP[sub]
          setDiscoveredWord({
            word: sub,
            emoji: match.emoji,
            meaning: match.meaning,
          })
          playSoundEffect('fanfare')
          playVictoryMelody()
          speakTurkish(`Tebrikler! ${sub} yazdın! ${match.meaning}`)
          break
        }
      }
    }
  }

  // Serbest mod tahtasını baştan sona şarkı gibi çal / dinle
  const handlePlayBackFreeNotes = () => {
    if (freeNotesHistory.length === 0 || isPlayingBack) return
    setIsPlayingBack(true)

    freeNotesHistory.forEach((item, idx) => {
      setTimeout(() => {
        const key = XYLO_KEYS.find((k) => k.letter === item.letter)
        if (key) {
          playSynthesizedXyloNote(key.freq)
          setActiveKeyId(key.id)
          setTimeout(() => setActiveKeyId(null), 200)
        }
        if (idx === freeNotesHistory.length - 1) {
          setIsPlayingBack(false)
          const allText = freeNotesHistory.map((n) => n.letter).join('')
          setTimeout(() => speakTurkish(`Şarkın bitti: ${allText}! Çok güzel çaldın!`), 350)
        }
      }, idx * 360)
    })
  }

  return (
    <div className="xylophone-game-container">
      {/* ÜST BAŞLIK VE MOD SEÇİCİ */}
      <div className="xylo-top-header">
        <div className="xylo-title-block">
          <div className="xylo-icon-avatar">🎹</div>
          <div>
            <h2 className="xylo-main-title">Neşeli Nota Ksilofonu ve Şarkı Kutusu</h2>
            <p className="xylo-subtitle">Harflerle Müzik Yap, Notalarla Oku!</p>
          </div>
        </div>

        {/* 2 OYUN MODU SEÇİCİ */}
        <div className="xylo-mode-switch">
          <button
            type="button"
            className={`mode-pill-btn ${gameMode === 'song' ? 'active' : ''}`}
            onClick={() => {
              playSoundEffect('click')
              setGameMode('song')
              setDiscoveredWord(null)
            }}
          >
            🎵 Şarkılı Kelime Çal
          </button>
          <button
            type="button"
            className={`mode-pill-btn ${gameMode === 'free' ? 'active' : ''}`}
            onClick={() => {
              playSoundEffect('click')
              setGameMode('free')
            }}
          >
            ✨ Serbest Beste Stüdyosu
          </button>
        </div>
      </div>

      {/* KONSER SAHNESİ VE DJ PANDA KARAKTERİ */}
      <div className="concert-stage-area">
        {/* DJ Panda Maskot (Müzikle Salınan Sevimli Karakter) */}
        <div className="dj-panda-box">
          <div className="dj-headphones-icon">🎧</div>
          <div className="dj-panda-avatar">🐼</div>
          <div className="dj-soundwave-row">
            <span className="wave-bar wb-1" />
            <span className="wave-bar wb-2" />
            <span className="wave-bar wb-3" />
            <span className="wave-bar wb-4" />
          </div>
        </div>

        {/* MOD 1: NOTA SEHPASI (HEDEF KELİME KARTI) */}
        {gameMode === 'song' && (
          <div className="sheet-music-stand">
            <div className="stand-wood-header">
              <span className="stand-song-badge">Şarkı {currentWordIdx + 1}/{SONG_WORDS.length}</span>
              <span className="stand-trophy">🏆 {totalSongsPlayed} Şarkı Çalındı</span>
            </div>

            <div className="stand-main-card">
              <div className="stand-big-emoji">{currentSong.emoji}</div>
              <div className="stand-slots-row">
                {currentSong.letters.map((char, idx) => {
                  const isDone = idx < currentLetterIdx
                  const isCurrent = idx === currentLetterIdx
                  return (
                    <div
                      key={idx}
                      className={`letter-slot-box ${isDone ? 'filled' : ''} ${
                        isCurrent ? 'target-glow' : ''
                      }`}
                    >
                      {isDone ? char : isCurrent ? '?' : '•'}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Şarkı Tamamlanma Parıltısı */}
            {isWordComplete && (
              <div className="word-victory-banner">
                <Sparkles size={24} className="star-spin" />
                <span>{currentSong.word}! Harika Çaldın!</span>
                <Sparkles size={24} className="star-spin" />
              </div>
            )}
          </div>
        )}

        {/* MOD 2: SERBEST BESTE VE HECE STÜDYOSU TAHTASI */}
        {gameMode === 'free' && (
          <div className="free-music-studio-board">
            <div className="board-top-controls">
              <span className="board-title-label">🎼 Çaldığın Harfler:</span>
              <div className="board-action-btns">
                <button
                  type="button"
                  className="btn-studio-action play"
                  onClick={handlePlayBackFreeNotes}
                  disabled={freeNotesHistory.length === 0 || isPlayingBack}
                  title="Şarkı Gibi Dinle"
                >
                  <Play size={16} /> Dinle
                </button>
                <button
                  type="button"
                  className="btn-studio-action clear"
                  onClick={() => {
                    playSoundEffect('click')
                    setFreeNotesHistory([])
                    setDiscoveredWord(null)
                  }}
                  title="Tahtayı Temizle (Süpürge)"
                >
                  <Trash2 size={16} /> Süpür
                </button>
              </div>
            </div>

            {/* Yazılan Notalar Şeridi */}
            <div className="notes-staff-scroll">
              {freeNotesHistory.length === 0 ? (
                <div className="empty-staff-hint">
                  Aşağıdaki ksilofon tuşlarına dokunarak kendi şarkını yaz!
                </div>
              ) : (
                freeNotesHistory.map((item, idx) => (
                  <div
                    key={idx}
                    className="staff-note-chip"
                    style={{ backgroundColor: item.color }}
                  >
                    <span className="chip-letter">{item.letter}</span>
                    <span className="chip-note">{item.note}</span>
                  </div>
                ))
              )}
            </div>

            {/* Keşfedilen Anlamlı Kelime Kutlaması */}
            {discoveredWord && (
              <div className="discovered-word-popup">
                <div className="popup-emoji">{discoveredWord.emoji}</div>
                <div className="popup-text">
                  <strong>{discoveredWord.word}!</strong> {discoveredWord.meaning}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DEV RENKLİ KSİLOFON / PİYANO SAHNESİ */}
      <div className="xylophone-keyboard-deck">
        {XYLO_KEYS.map((key) => {
          const isTarget = gameMode === 'song' && key.letter === targetLetter && !isWordComplete
          const isPressed = activeKeyId === key.id

          return (
            <button
              key={key.id}
              type="button"
              className={`xylo-bar-key ${isTarget ? 'bouncing-target' : ''} ${
                isPressed ? 'pressed' : ''
              }`}
              style={{
                backgroundColor: key.color,
                boxShadow: `0 8px 0 ${key.shadowColor}, 0 14px 20px rgba(0,0,0,0.25)`,
              }}
              onClick={(e) => handleKeyPress(key, e)}
            >
              {/* Zıplayan Altın Nota Topu (Bouncing Ball) */}
              {isTarget && (
                <div className="bouncing-note-ball">
                  <span>⚽</span>
                  <div className="ball-glow-ring" />
                </div>
              )}

              {/* Vida / Bağlantı Noktaları */}
              <div className="xylo-screw screw-top" />
              <div className="xylo-screw screw-bottom" />

              {/* Tuş Harfi ve Nota İsmi */}
              <div className="xylo-key-content">
                <span className="xylo-big-letter">{key.letter}</span>
                <span className="xylo-note-label">
                  <Music size={12} /> {key.solfege}
                </span>
              </div>
            </button>
          )
        })}
      </div>

      {/* Ekranda Uçuşan Müzik Notaları (♪ ♫) */}
      <div className="floating-particles-layer">
        {noteParticles.map((np) => (
          <span
            key={np.id}
            className="floating-note-symbol"
            style={{
              left: `${np.x}px`,
              top: `${np.y}px`,
              color: np.color,
            }}
          >
            {np.char}
          </span>
        ))}
      </div>
    </div>
  )
}
