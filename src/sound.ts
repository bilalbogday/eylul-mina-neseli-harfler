// Web Speech API + Web Audio API tabanlı çocuk dostu Türkçe seslendirme ve ses efektleri

let audioCtx: AudioContext | null = null

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

export function playSoundEffect(type: 'success' | 'pop' | 'error' | 'fanfare' | 'click') {
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime

    if (type === 'click' || type === 'pop') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(type === 'pop' ? 520 : 400, now)
      osc.frequency.exponentialRampToValueAtTime(type === 'pop' ? 880 : 600, now + 0.09)
      gain.gain.setValueAtTime(0.18, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.09)
    } else if (type === 'success') {
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, now + idx * 0.09)
        gain.gain.setValueAtTime(0.22, now + idx * 0.09)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.25)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.09)
        osc.stop(now + idx * 0.09 + 0.25)
      })
    } else if (type === 'fanfare') {
      const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5]
      const times = [0, 0.1, 0.2, 0.32, 0.46, 0.58]
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, now + times[idx])
        gain.gain.setValueAtTime(0.25, now + times[idx])
        gain.gain.exponentialRampToValueAtTime(0.001, now + times[idx] + 0.32)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + times[idx])
        osc.stop(now + times[idx] + 0.32)
      })
    } else if (type === 'error') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(240, now)
      osc.frequency.linearRampToValueAtTime(180, now + 0.22)
      gain.gain.setValueAtTime(0.14, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.22)
    }
  } catch {
    // Ignore audio context errors on restricted devices
  }
}

export function playWelcomeGreeting(childName = 'Eylül Mina', onEnd?: () => void) {
  // 1. Öncelikli olarak berrak, genç, neşeli ve doğal Türkçe kadın ses kaydını çal
  try {
    const audio = new Audio('/audio/welcome-eylul-mina.mp3')
    audio.playbackRate = 1.05 // Genç ve enerjik tempo
    if (onEnd) {
      audio.onended = onEnd
    }
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Tarayıcı otomatik ses engellerse veya dosya yüklenemezse Web Speech API'ye düş
        speakTurkishWithYouthVoice(
          `Hoş geldin ${childName}! Bu uygulamayı baban senin için yaptı. Umarım çok eğlenirsin ve güzel vakit geçirirsin!`
        )
      })
    }
  } catch {
    speakTurkishWithYouthVoice(
      `Hoş geldin ${childName}! Bu uygulamayı baban senin için yaptı. Umarım çok eğlenirsin ve güzel vakit geçirirsin!`
    )
  }
}

export function speakTurkishWithYouthVoice(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'tr-TR'
    utterance.rate = 1.0 // Genç ve neşeli canlı tempo
    utterance.pitch = 1.25 // Daha genç ve enerjik kadın ses tonu

    const voices = window.speechSynthesis.getVoices()
    const youthFemaleVoice =
      voices.find((v) => v.lang.toLowerCase().includes('tr') && (v.name.toLowerCase().includes('yelda') || v.name.toLowerCase().includes('seda') || v.name.toLowerCase().includes('female'))) ||
      voices.find((v) => v.lang.toLowerCase().includes('tr') && v.name.toLowerCase().includes('emel')) ||
      voices.find((v) => v.lang.toLowerCase().includes('tr'))

    if (youthFemaleVoice) {
      utterance.voice = youthFemaleVoice
    }
    window.speechSynthesis.speak(utterance)
  } catch {
    // ignore
  }
}

export function speakTurkish(text: string, rate = 0.88, pitch = 1.1) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'tr-TR'
    utterance.rate = rate
    utterance.pitch = pitch

    const voices = window.speechSynthesis.getVoices()
    const trVoice =
      voices.find((v) => v.lang.toLowerCase().includes('tr') && v.name.toLowerCase().includes('yelda')) ||
      voices.find((v) => v.lang.toLowerCase().includes('tr') && v.name.toLowerCase().includes('emel')) ||
      voices.find((v) => v.lang.toLowerCase().includes('tr'))

    if (trVoice) {
      utterance.voice = trVoice
    }

    window.speechSynthesis.speak(utterance)
  } catch {
    // Fallback if speech synthesis fails
  }
}

