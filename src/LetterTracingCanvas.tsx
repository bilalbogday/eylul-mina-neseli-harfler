import { useEffect, useRef, useState } from 'react'
import { Eraser, CheckCircle2, Sparkles, Volume2 } from 'lucide-react'
import type { LetterCurriculum } from './curriculum'
import { playSoundEffect, speakTurkish } from './sound'

interface LetterTracingCanvasProps {
  letter: LetterCurriculum
  completed: boolean
  onComplete: () => void
}

export function LetterTracingCanvas({ letter, completed, onComplete }: LetterTracingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [caseMode, setCaseMode] = useState<'upper' | 'lower'>('upper')
  const [visitedPoints, setVisitedPoints] = useState<number[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [strokeCount, setStrokeCount] = useState(0)

  // Reset when letter changes
  useEffect(() => {
    setVisitedPoints([])
    setStrokeCount(0)
    clearCanvas()
  }, [letter.id, caseMode])

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const handleReset = () => {
    playSoundEffect('click')
    setVisitedPoints([])
    setStrokeCount(0)
    clearCanvas()
  }

  const checkPointProximity = (normX: number, normY: number) => {
    const threshold = 15 // %15 yarıçap
    letter.tracePoints.forEach((pt, idx) => {
      const dist = Math.hypot(pt.x - normX, pt.y - normY)
      if (dist <= threshold) {
        setVisitedPoints((prev) => {
          if (prev.includes(idx)) return prev
          playSoundEffect('pop')
          const next = [...prev, idx]
          if (next.length >= letter.tracePoints.length) {
            setTimeout(() => {
              playSoundEffect('fanfare')
              speakTurkish(`Harika yazdın! ${letter.upper} harfi tamamlandı!`)
              onComplete()
            }, 250)
          }
          return next
        })
      }
    })
  }

  const getCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return { x: 0, y: 0, normX: 0, normY: 0 }
    const rect = canvas.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height
    const normX = ((e.clientX - rect.left) / rect.width) * 100
    const normY = ((e.clientY - rect.top) / rect.height) * 100
    return { x, y, normX, normY }
  }

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId)
    setIsDrawing(true)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y, normX, normY } = getCoords(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = 22
    ctx.strokeStyle = letter.color
    checkPointProximity(normX, normY)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { x, y, normX, normY } = getCoords(e)
    ctx.lineTo(x, y)
    ctx.stroke()
    checkPointProximity(normX, normY)
  }

  const handlePointerUp = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    setStrokeCount((c) => c + 1)
  }

  const progressPct = Math.round((visitedPoints.length / letter.tracePoints.length) * 100)

  return (
    <div className="tracing-card">
      <div className="tracing-header">
        <div>
          <span className="step-pill">2. Adım: Parmağınla Harfi Çiz</span>
          <h3>Noktaları Birleştirerek "{caseMode === 'upper' ? letter.upper : letter.lower}" Yazalım!</h3>
        </div>
        <div className="case-toggle">
          <button
            type="button"
            className={`case-btn ${caseMode === 'upper' ? 'active' : ''}`}
            onClick={() => {
              playSoundEffect('click')
              setCaseMode('upper')
            }}
          >
            Büyük {letter.upper}
          </button>
          <button
            type="button"
            className={`case-btn ${caseMode === 'lower' ? 'active' : ''}`}
            onClick={() => {
              playSoundEffect('click')
              setCaseMode('lower')
            }}
          >
            Küçük {letter.lower}
          </button>
        </div>
      </div>

      <p className="tracing-instruction">
        Parmağınla renkli yıldız noktalarının üzerinden geçerek harfi tamamla!
      </p>

      <div className="canvas-wrapper">
        {/* Arka plan klavuz çizgileri ve harf şablonu */}
        <svg className="guide-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Defter çizgileri */}
          <line x1="8" y1="20" x2="92" y2="20" stroke="#cbd5e1" strokeWidth="0.6" strokeDasharray="2,2" />
          <line x1="8" y1="50" x2="92" y2="50" stroke="#94a3b8" strokeWidth="0.7" strokeDasharray="3,3" />
          <line x1="8" y1="82" x2="92" y2="82" stroke="#cbd5e1" strokeWidth="0.6" strokeDasharray="2,2" />

          {/* Büyük harf için klavuz okları / kesikli çizgiler */}
          {caseMode === 'upper' &&
            letter.traceStrokes.map((st, i) => (
              <line
                key={i}
                x1={st.x1}
                y1={st.y1}
                x2={st.x2}
                y2={st.y2}
                stroke={letter.color}
                strokeOpacity="0.28"
                strokeWidth="7"
                strokeLinecap="round"
                strokeDasharray="3,4"
              />
            ))}
        </svg>

        <div className="ghost-letter" style={{ color: `${letter.color}22` }}>
          {caseMode === 'upper' ? letter.upper : letter.lower}
        </div>

        {/* Nokta Hedefleri */}
        <div className="trace-points-layer">
          {letter.tracePoints.map((pt, idx) => {
            const isDone = visitedPoints.includes(idx)
            return (
              <div
                key={idx}
                className={`trace-dot ${isDone ? 'done' : ''}`}
                style={{
                  left: `${pt.x}%`,
                  top: `${pt.y}%`,
                  borderColor: letter.color,
                  backgroundColor: isDone ? '#22c55e' : '#ffffff',
                }}
              >
                {isDone ? '⭐' : idx + 1}
              </div>
            )
          })}
        </div>

        <canvas
          ref={canvasRef}
          width={360}
          height={360}
          className="draw-canvas"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />
      </div>

      <div className="tracing-footer">
        <div className="trace-progress-info">
          <div className="trace-bar-bg">
            <div
              className="trace-bar-fill"
              style={{ width: `${progressPct}%`, backgroundColor: letter.color }}
            />
          </div>
          <span>
            {visitedPoints.length} / {letter.tracePoints.length} Nokta ({progressPct}%)
          </span>
        </div>

        <div className="tracing-actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => speakTurkish(`${letter.upper} harfini parmağınla noktaları birleştirerek çiz.`)}
          >
            <Volume2 size={18} /> Sesli Anlat
          </button>

          <button type="button" className="btn-secondary" onClick={handleReset}>
            <Eraser size={18} /> Temizle
          </button>

          {(strokeCount > 0 || completed) && (
            <button
              type="button"
              className="btn-primary"
              style={{ backgroundColor: '#16a34a' }}
              onClick={() => {
                playSoundEffect('fanfare')
                speakTurkish(`Aferin! ${letter.upper} harfini çok güzel yazdın!`)
                onComplete()
              }}
            >
              <CheckCircle2 size={18} /> {completed ? 'Tamamlandı!' : 'Yazmayı Bitirdim'}
            </button>
          )}
        </div>
      </div>

      {completed && (
        <div className="success-banner">
          <Sparkles size={20} /> Harika! Bu harfin yazım alıştırmasından yıldız kazandın!
        </div>
      )}
    </div>
  )
}
