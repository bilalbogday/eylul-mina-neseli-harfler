import { useEffect, useMemo, useState } from 'react'
import { Volume2, RotateCcw, ChevronRight, Sparkles } from 'lucide-react'
import { LETTERS_DATA, type LetterCurriculum } from './curriculum'
import { playSoundEffect, speakTurkish } from './sound'

interface LetterSoundGameProps {
  letter: LetterCurriculum
  childName: string
  completed: boolean
  onComplete: () => void
  onExit: () => void
}

interface Balloon {
  id: number
  char: string
  isTarget: boolean
  color: string
  popped: boolean
  shake: boolean
}

interface EarRound {
  word: string
  emoji: string
  hasSound: boolean
}

const BALLOON_COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#a78bfa', '#f472b6']
const TARGET_BALLOONS = 4
const TOTAL_BALLOONS = 9
const EAR_ROUNDS = 5

const trLower = (s: string) => s.toLocaleLowerCase('tr-TR')

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// Tüm müfredattaki kelimelerden (resimli) benzersiz bir havuz
const WORD_POOL: { word: string; emoji: string }[] = (() => {
  const map = new Map<string, string>()
  LETTERS_DATA.forEach((l) => {
    map.set(l.mascotWord, l.mascotEmoji)
    l.words.forEach((w) => map.set(w.word, w.emoji))
    l.syllableTasks.forEach((t) => {
      const w = t.result.charAt(0).toLocaleUpperCase('tr-TR') + t.result.slice(1)
      if (!map.has(w)) map.set(w, t.emoji)
    })
  })
  return [...map.entries()].map(([word, emoji]) => ({ word, emoji }))
})()

function buildBalloons(letter: LetterCurriculum): Balloon[] {
  const targets = Array.from({ length: TARGET_BALLOONS }, (_, i) => (i % 2 === 0 ? letter.upper : letter.lower))
  // Aynı adadaki harfler önce (daha öğretici çeldiriciler), sonra diğerleri
  const sameGroup = LETTERS_DATA.filter((l) => l.groupId === letter.groupId && l.id !== letter.id)
  const others = shuffle(LETTERS_DATA.filter((l) => l.groupId !== letter.groupId))
  const distractorPool = shuffle([...sameGroup, ...others.slice(0, 3)])
  const distractors = distractorPool
    .slice(0, TOTAL_BALLOONS - TARGET_BALLOONS)
    .map((l) => (Math.random() > 0.5 ? l.upper : l.lower))

  return shuffle([
    ...targets.map((c) => ({ char: c, isTarget: true })),
    ...distractors.map((c) => ({ char: c, isTarget: false })),
  ]).map((b, i) => ({
    ...b,
    id: i,
    color: BALLOON_COLORS[i % BALLOON_COLORS.length],
    popped: false,
    shake: false,
  }))
}

function buildEarRounds(letter: LetterCurriculum): EarRound[] {
  const target = trLower(letter.lower)
  const withSound = shuffle(WORD_POOL.filter((w) => trLower(w.word).includes(target)))
  const withoutSound = shuffle(WORD_POOL.filter((w) => !trLower(w.word).includes(target)))
  const yesCount = Math.min(3, withSound.length)
  const picks = [
    ...withSound.slice(0, yesCount).map((w) => ({ ...w, hasSound: true })),
    ...withoutSound.slice(0, EAR_ROUNDS - yesCount).map((w) => ({ ...w, hasSound: false })),
  ]
  return shuffle(picks)
}

function HighlightedWord({ word, letter }: { word: string; letter: LetterCurriculum }) {
  const target = trLower(letter.lower)
  return (
    <span className="game-reveal-word">
      {[...word].map((ch, i) => (
        <span
          key={i}
          style={trLower(ch) === target ? { color: letter.color, textDecoration: 'underline' } : undefined}
        >
          {ch}
        </span>
      ))}
    </span>
  )
}

export function LetterSoundGame({ letter, childName, completed, onComplete, onExit }: LetterSoundGameProps) {
  const [playKey, setPlayKey] = useState(0)
  const [phase, setPhase] = useState<'balloons' | 'ears' | 'done'>('balloons')
  const [balloons, setBalloons] = useState<Balloon[]>([])
  const [earIdx, setEarIdx] = useState(0)
  const [earAnswer, setEarAnswer] = useState<boolean | null>(null)
  const [earScore, setEarScore] = useState(0)

  const earRounds = useMemo(() => buildEarRounds(letter), [letter, playKey])

  useEffect(() => {
    setBalloons(buildBalloons(letter))
    setPhase('balloons')
    setEarIdx(0)
    setEarAnswer(null)
    setEarScore(0)
    const t = setTimeout(
      () => speakTurkish(`${letter.mascotWord} ile ses avı! Üzerinde ${letter.upper} harfi olan balonları patlat! ${letter.soundHint}`),
      300
    )
    return () => clearTimeout(t)
  }, [letter, playKey])

  const poppedTargets = balloons.filter((b) => b.isTarget && b.popped).length

  const handleBalloon = (b: Balloon) => {
    if (b.popped) return
    if (b.isTarget) {
      playSoundEffect('pop')
      speakTurkish(letter.soundHint, 0.9, 1.2)
      const next = balloons.map((x) => (x.id === b.id ? { ...x, popped: true } : x))
      setBalloons(next)
      if (next.filter((x) => x.isTarget && x.popped).length === TARGET_BALLOONS) {
        setTimeout(() => {
          playSoundEffect('success')
          speakTurkish(`Süper! Şimdi kulaklarını aç. Kelimeyi dinle, içinde ${letter.soundHint} sesi var mı?`)
          setPhase('ears')
        }, 700)
      }
    } else {
      playSoundEffect('error')
      speakTurkish(`Bu ${b.char}. ${letter.upper} harfini ara!`)
      setBalloons((prev) => prev.map((x) => (x.id === b.id ? { ...x, shake: true } : x)))
      setTimeout(() => setBalloons((prev) => prev.map((x) => (x.id === b.id ? { ...x, shake: false } : x))), 500)
    }
  }

  const currentRound = earRounds[earIdx]

  const speakRound = () => {
    if (!currentRound) return
    playSoundEffect('click')
    speakTurkish(`${currentRound.word}. ${currentRound.word}.`, 0.75)
  }

  useEffect(() => {
    if (phase !== 'ears' || earIdx === 0) return
    const t = setTimeout(speakRound, 250)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [earIdx, phase])

  const handleEarAnswer = (saysYes: boolean) => {
    if (!currentRound || earAnswer !== null) return
    const correct = saysYes === currentRound.hasSound
    setEarAnswer(saysYes)
    if (correct) {
      setEarScore((s) => s + 1)
      playSoundEffect('success')
      speakTurkish(
        currentRound.hasSound
          ? `Doğru! ${currentRound.word} kelimesinde ${letter.soundHint} sesi var!`
          : `Doğru! ${currentRound.word} kelimesinde ${letter.upper} sesi yok.`
      )
    } else {
      playSoundEffect('error')
      speakTurkish(
        currentRound.hasSound
          ? `Tekrar dinle: ${currentRound.word}. İçinde ${letter.soundHint} sesi var!`
          : `Dikkat: ${currentRound.word}. İçinde ${letter.upper} sesi yok.`
      )
    }
  }

  const nextEarRound = () => {
    if (earIdx < earRounds.length - 1) {
      setEarIdx((i) => i + 1)
      setEarAnswer(null)
    } else {
      setPhase('done')
      playSoundEffect('fanfare')
      speakTurkish(`Bravo ${childName}! ${letter.mascotWord} ses avını tamamladın!`)
      onComplete()
    }
  }

  return (
    <div className="sound-game-card" style={{ borderColor: letter.color }}>
      <div className="sound-game-header">
        <span className="step-pill">5. Adım: Mini Sesli Oyun</span>
        <h3>
          {letter.mascotEmoji} {letter.mascotWord} ile Ses Avı
        </h3>
        <div className="game-phase-dots">
          <span className={phase === 'balloons' ? 'active' : 'done'}>🎈 Balon Patlat</span>
          <span className={phase === 'ears' ? 'active' : phase === 'done' ? 'done' : ''}>👂 Kulak Avcısı</span>
          <span className={phase === 'done' ? 'active' : ''}>🏆 Ödül</span>
        </div>
      </div>

      {phase === 'balloons' && (
        <>
          <button
            type="button"
            className="btn-listen-big"
            onClick={() => speakTurkish(`${letter.upper} harfini bul! ${letter.soundHint}`)}
          >
            <Volume2 size={24} /> "{letter.upper} {letter.lower}" balonlarını patlat! ({poppedTargets}/{TARGET_BALLOONS})
          </button>
          <div className="balloon-field">
            {balloons.map((b, i) => (
              <button
                key={b.id}
                type="button"
                className={`balloon ${b.popped ? 'popped' : ''} ${b.shake ? 'shake' : ''}`}
                style={{ backgroundColor: b.color, animationDelay: `${(i % 4) * 0.35}s` }}
                onClick={() => handleBalloon(b)}
                aria-label={`Balon ${b.char}`}
              >
                {b.popped ? '💥' : b.char}
              </button>
            ))}
          </div>
        </>
      )}

      {phase === 'ears' && currentRound && (
        <div className="ear-game">
          <p className="quiz-prompt">
            Kelimeyi dinle! İçinde <strong style={{ color: letter.color }}>{letter.soundHint}</strong> sesi var mı?
            ({earIdx + 1}/{earRounds.length})
          </p>

          <button type="button" className="ear-speaker" onClick={speakRound}>
            {earAnswer === null ? (
              <>
                <span className="ear-speaker-icon">🔊</span>
                <span>Dinlemek için dokun</span>
              </>
            ) : (
              <>
                <span className="ear-speaker-icon">{currentRound.emoji}</span>
                <HighlightedWord word={currentRound.word} letter={letter} />
              </>
            )}
          </button>

          {earAnswer === null ? (
            <div className="ear-answer-row">
              <button type="button" className="ear-btn yes" onClick={() => handleEarAnswer(true)}>
                ✅ Var, duydum!
              </button>
              <button type="button" className="ear-btn no" onClick={() => handleEarAnswer(false)}>
                ❌ Yok
              </button>
            </div>
          ) : (
            <div className="ear-feedback">
              <span className={earAnswer === currentRound.hasSound ? 'fb-correct' : 'fb-wrong'}>
                {earAnswer === currentRound.hasSound ? '🌟 Doğru!' : '🙂 Bir dahakine!'}
              </span>
              <button type="button" className="btn-primary btn-large" onClick={nextEarRound}>
                {earIdx < earRounds.length - 1 ? 'Sonraki Kelime' : 'Oyunu Bitir'} <ChevronRight size={20} />
              </button>
            </div>
          )}
        </div>
      )}

      {phase === 'done' && (
        <div className="game-done">
          <div className="game-done-emoji">
            {letter.mascotEmoji}🎉
          </div>
          <h3>Bravo {childName}!</h3>
          <p>
            Kulak avcısı puanın: <strong>{earScore}/{earRounds.length}</strong>
          </p>
          {completed && (
            <div className="success-banner">
              <Sparkles size={20} /> Mini oyun yıldızını kazandın!
            </div>
          )}
          <div className="syllable-controls">
            <button type="button" className="btn-secondary" onClick={() => setPlayKey((k) => k + 1)}>
              <RotateCcw size={18} /> Tekrar Oyna
            </button>
            <button type="button" className="btn-primary" onClick={onExit}>
              Haritaya Dön <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
