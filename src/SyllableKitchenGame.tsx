import { useState, useEffect, useMemo } from 'react'
import {
  Volume2,
  RotateCcw,
  Sparkles,
  ChevronRight,
  Flame,
  ChefHat,
  CheckCircle2,
  Soup,
} from 'lucide-react'
import { LETTERS_DATA, type LetterCurriculum } from './curriculum'
import { playSoundEffect, speakTurkish } from './sound'

interface SyllableKitchenGameProps {
  letter: LetterCurriculum
  childName: string
  completed: boolean
  onComplete: () => void
  onNext?: () => void
}

interface KitchenDish {
  word: string
  emoji: string
  targetParts: string[] // Hece veya harfler sırasıyla, örn: ['el', 'ma'] veya ['l', 'a', 'l', 'e']
  recipeTitle: string
}

interface JarIngredient {
  id: string
  text: string
  isNextExpected: boolean
  color: string
}

const JAR_COLORS = ['#f87171', '#fb923c', '#facc15', '#4ade80', '#38bdf8', '#a78bfa', '#f472b6', '#34d399']

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function SyllableKitchenGame({
  letter,
  childName,
  completed,
  onComplete,
  onNext,
}: SyllableKitchenGameProps) {
  // Seçilen harfe göre yemek tariflerini hazırla
  const dishes: KitchenDish[] = useMemo(() => {
    const list: KitchenDish[] = []

    // 1. Harfin hece görevlerinden gelen tarifler
    letter.syllableTasks.forEach((st) => {
      list.push({
        word: st.result.toLocaleUpperCase('tr-TR'),
        emoji: st.emoji,
        targetParts: [st.parts[0].toLocaleUpperCase('tr-TR'), st.parts[1].toLocaleUpperCase('tr-TR')],
        recipeTitle: `${st.result.toLocaleUpperCase('tr-TR')} Çorbası`,
      })
    })

    // 2. Harfin örnek kelimelerinden gelen tarifler
    letter.words.forEach((w) => {
      if (w.syllables && w.syllables.length >= 2) {
        const wordUpper = w.word.toLocaleUpperCase('tr-TR')
        if (!list.some((d) => d.word === wordUpper)) {
          list.push({
            word: wordUpper,
            emoji: w.emoji,
            targetParts: w.syllables.map((s) => s.toLocaleUpperCase('tr-TR')),
            recipeTitle: `${wordUpper} Yemeği`,
          })
        }
      }
    })

    return list.slice(0, 3)
  }, [letter])

  const [currentDishIndex, setCurrentDishIndex] = useState(0)
  const currentDish = dishes[currentDishIndex] || dishes[0]

  // Tencereye atılmış doğru parçalar
  const [cookedParts, setCookedParts] = useState<string[]>([])
  // Tencerenin durumu: normal | boiling | sneeze | victory
  const [potStatus, setPotStatus] = useState<'normal' | 'boiling' | 'sneeze' | 'victory'>('normal')
  const [sneezeMessage, setSneezeMessage] = useState<string | null>(null)
  const [steamBubbles, setSteamBubbles] = useState<number[]>([])

  // Raftaki kavanozları üret (Hedef parçalar + çeldiriciler)
  const jarIngredients: JarIngredient[] = useMemo(() => {
    if (!currentDish) return []

    // Hedef parçalar
    const targets = currentDish.targetParts.map((p, idx) => ({
      id: `target_${p}_${idx}`,
      text: p,
      isTarget: true,
    }))

    // Diğer harflerden çeldirici heceler/harfler topla
    const distractorsPool: string[] = []
    LETTERS_DATA.forEach((l) => {
      if (l.id !== letter.id) {
        l.syllableTasks.forEach((st) => {
          distractorsPool.push(st.parts[0].toLocaleUpperCase('tr-TR'))
          distractorsPool.push(st.parts[1].toLocaleUpperCase('tr-TR'))
        })
      }
    })

    const filteredDistractors = shuffle(
      Array.from(new Set(distractorsPool.filter((d) => !currentDish.targetParts.includes(d))))
    ).slice(0, 4)

    const distractors = filteredDistractors.map((d, idx) => ({
      id: `dist_${d}_${idx}`,
      text: d,
      isTarget: false,
    }))

    const combined = shuffle([...targets, ...distractors])

    return combined.map((item, i) => ({
      id: `${item.id}_${i}`,
      text: item.text,
      isNextExpected: false, // dinamik hesaplanacak
      color: JAR_COLORS[i % JAR_COLORS.length],
    }))
  }, [currentDish, letter.id])

  // Yeni yemeğe geçildiğinde sıfırla
  useEffect(() => {
    setCookedParts([])
    setPotStatus('normal')
    setSneezeMessage(null)
    if (currentDish) {
      playSoundEffect('bubble')
      speakTurkish(
        `Hece Mutfağına hoş geldin Şef ${childName}! Sıradaki siparişimiz: ${currentDish.word}! Doğru kavanozları tencereye atalım.`
      )
    }
  }, [currentDishIndex, currentDish, childName])

  // Fokurdama efekti döngüsü
  useEffect(() => {
    const interval = setInterval(() => {
      setSteamBubbles([Date.now(), Date.now() + 1, Date.now() + 2])
    }, 1800)
    return () => clearInterval(interval)
  }, [])

  // Kavanoza tıklandığında (veya tencereye atıldığında)
  const handleThrowIngredient = (ingredientText: string) => {
    if (potStatus === 'sneeze' || potStatus === 'victory') return

    const nextNeededPart = currentDish.targetParts[cookedParts.length]

    if (ingredientText === nextNeededPart) {
      // DOĞRU HECE ATILDI
      playSoundEffect('bubble')
      playSoundEffect('pop')
      const nextParts = [...cookedParts, ingredientText]
      setCookedParts(nextParts)
      setPotStatus('boiling')
      setSneezeMessage(null)

      speakTurkish(`${ingredientText}! Tencereye girdi!`)

      // Yemek tamamlandı mı?
      if (nextParts.length === currentDish.targetParts.length) {
        setTimeout(() => {
          setPotStatus('victory')
          playSoundEffect('fanfare')
          speakTurkish(`Nefis! ${currentDish.word} yemeği pişti! Afiyet olsun!`)
          onComplete()
        }, 600)
      } else {
        setTimeout(() => setPotStatus('normal'), 600)
      }
    } else {
      // YANLIŞ HECE ATILDI - TENCERE HAPŞIRIR!
      setPotStatus('sneeze')
      playSoundEffect('sneeze')
      const funnyMsg = `Hapşuu! 🤧 "${ingredientText}" hecesi çok acıymış! Başka bir hece deneyelim!`
      setSneezeMessage(funnyMsg)
      speakTurkish(`Hapşuu! Bu çok acıymış! Sıradaki hece "${nextNeededPart}".`)

      setTimeout(() => {
        setPotStatus('normal')
      }, 2200)
    }
  }

  const handleNextDish = () => {
    if (currentDishIndex < dishes.length - 1) {
      playSoundEffect('click')
      setCurrentDishIndex((idx) => idx + 1)
    } else if (onNext) {
      onNext()
    }
  }

  const handleRetryDish = () => {
    playSoundEffect('click')
    setCookedParts([])
    setPotStatus('normal')
    setSneezeMessage(null)
    speakTurkish(`Hadi ${currentDish.word} yemeğini baştan pişirelim!`)
  }

  return (
    <div className="kitchen-game-card" style={{ borderColor: letter.color }}>
      {/* BAŞLIK & AŞÇI BİLGİSİ */}
      <div className="kitchen-header">
        <div className="kitchen-title-box">
          <span className="step-pill kitchen-pill">🍲 3. Adım: Hece Mutfağı</span>
          <h3>
            <ChefHat size={24} className="chef-icon" /> Şef {childName}'nın Kelime Mutfağı
          </h3>
        </div>

        <div className="kitchen-dish-counter">
          <span>Sipariş:</span>
          <strong>
            {currentDishIndex + 1} / {dishes.length}
          </strong>
        </div>
      </div>

      {/* SİPARİŞ PANOSU (Müşteri Siparişi) */}
      <div className="kitchen-order-board">
        <div className="order-ticket">
          <div className="order-badge">Günün Menüsü 📜</div>
          <div className="order-content">
            <span className="order-dish-emoji">{currentDish.emoji}</span>
            <div className="order-text">
              <h4 className="order-dish-name">{currentDish.word}</h4>
              <p className="order-recipe-title">{currentDish.recipeTitle}</p>
            </div>
            <button
              type="button"
              className="order-listen-btn"
              onClick={() => {
                playSoundEffect('click')
                speakTurkish(
                  `Siparişimiz: ${currentDish.word}! Heceleri sırayla tencereye atalım: ${currentDish.targetParts.join(
                    ' ve '
                  )}.`
                )
              }}
              title="Siparişi Dinle"
            >
              <Volume2 size={20} />
            </button>
          </div>

          {/* TARİF İLERLEME YUVARLAKLARI */}
          <div className="recipe-slots-row">
            {currentDish.targetParts.map((part, idx) => {
              const isFilled = idx < cookedParts.length
              const isNext = idx === cookedParts.length
              return (
                <div
                  key={idx}
                  className={`recipe-slot ${isFilled ? 'filled' : ''} ${isNext ? 'next-pulse' : ''}`}
                >
                  <span className="slot-idx">{idx + 1}. Malzeme</span>
                  <strong className="slot-text">{isFilled ? part : '?'}</strong>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* PİŞİRME SAHNESİ: SEVİMLİ TENCERE & AŞÇI */}
      <div className="kitchen-stage">
        {/* Aşçı Karakter */}
        <div className="kitchen-chef-box">
          <div className="chef-avatar">
            <span className="chef-hat-emoji">👨‍🍳</span>
            <span className="chef-face-emoji">{potStatus === 'sneeze' ? '🤧' : potStatus === 'victory' ? '😋' : '😃'}</span>
          </div>
          <span className="chef-name-tag">Şef {childName}</span>
        </div>

        {/* TENCERE VİTRİNİ */}
        <div className={`magic-pot-container ${potStatus}`}>
          {/* Renkli Buharlar & Dumanlar */}
          <div className="pot-steam-area">
            {potStatus === 'boiling' && (
              <div className="steam-puff rainbow-puff">✨ Renkli Dumanlar! ✨</div>
            )}
            {potStatus === 'sneeze' && (
              <div className="steam-puff sneeze-puff">💨 HAPŞUUU! 🌶️ Acı Biber!</div>
            )}
            {potStatus === 'victory' && (
              <div className="steam-puff victory-puff">🎉 Pişti! Mis gibi koktu! 🍲</div>
            )}
            {potStatus === 'normal' && (
              <div className="gentle-bubbles">
                {steamBubbles.map((id) => (
                  <span key={id} className="bubble-dot">
                    🫧
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Tencere Gövdesi */}
          <div className="pot-body">
            <div className="pot-rim">
              <div className="pot-soup-liquid">
                <Soup size={32} color="#ffffff" className="soup-icon" />
                <span className="pot-inside-text">
                  {cookedParts.length === 0
                    ? 'Boş Tencere'
                    : cookedParts.join(' • ')}
                </span>
              </div>
            </div>
            <div className="pot-handles handle-left" />
            <div className="pot-handles handle-right" />
            <div className="pot-belly">
              <span className="pot-face">
                {potStatus === 'sneeze' ? '😣' : potStatus === 'victory' ? '🥰' : '😋'}
              </span>
            </div>
            {/* Alt Ateş */}
            <div className="pot-stove-fire">
              <Flame size={24} className="fire-flicker flame-1" color="#ff4500" />
              <Flame size={28} className="fire-flicker flame-2" color="#ffa500" />
              <Flame size={24} className="fire-flicker flame-3" color="#ff4500" />
            </div>
          </div>
        </div>
      </div>

      {/* HAPŞIRMA BİLDİRİMİ */}
      {sneezeMessage && (
        <div className="sneeze-alert-banner">
          <span>{sneezeMessage}</span>
        </div>
      )}

      {/* MUTFAK RAFI: HECE KAVANOZLARI */}
      <div className="kitchen-shelf-area">
        <div className="shelf-header">
          <span>🧂 Baharat Rafı: Tencereye atılacak doğru heceyi seç!</span>
        </div>

        <div className="jars-grid">
          {jarIngredients.map((jar) => {
            const isAlreadyAdded = cookedParts.includes(jar.text)
            return (
              <button
                key={jar.id}
                type="button"
                className={`spice-jar-btn ${isAlreadyAdded ? 'jar-used' : ''}`}
                style={{
                  borderColor: jar.color,
                }}
                disabled={isAlreadyAdded || potStatus === 'victory'}
                onClick={() => handleThrowIngredient(jar.text)}
              >
                <div className="jar-lid" />
                <div className="jar-glass" style={{ backgroundColor: `${jar.color}22` }}>
                  <span className="jar-text" style={{ color: jar.color }}>
                    {jar.text}
                  </span>
                </div>
                <span className="jar-action-tag">Tencereye At 🍲</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* YEMEK BİTTİĞİNDE KUTLAMA VE SONRAKİ MENÜ BUTONU */}
      {potStatus === 'victory' && (
        <div className="kitchen-victory-box">
          <div className="victory-badge">
            <Sparkles size={24} /> Harika Pişirdin Şef {childName}! {completed ? '⭐' : '✨'}
          </div>
          <p>
            "{currentDish.word}" yemeğini başarıyla hazırladın ve mutfak yıldızı kazandın!
          </p>

          <div className="kitchen-victory-actions">
            <button type="button" className="btn-secondary" onClick={handleRetryDish}>
              <RotateCcw size={18} /> Tekrar Pişir
            </button>
            {currentDishIndex < dishes.length - 1 ? (
              <button type="button" className="btn-primary btn-large" onClick={handleNextDish}>
                Sıradaki Siparişe Geç <ChevronRight size={20} />
              </button>
            ) : (
              <button
                type="button"
                className="btn-primary btn-large"
                style={{ backgroundColor: '#16a34a' }}
                onClick={() => {
                  playSoundEffect('fanfare')
                  if (onNext) onNext()
                }}
              >
                <CheckCircle2 size={20} /> Hece Mutfağını Tamamla! 🏆
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
