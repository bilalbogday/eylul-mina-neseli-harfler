// Web Speech API + Web Audio API tabanlı çocuk dostu Türkçe seslendirme ve ses efektleri

let audioCtx: AudioContext | null = null
let activeHtmlAudio: HTMLAudioElement | null = null
let lastSpokenText: string = 'Merhaba! Hadi harflerle oynayalım!'

const MUTE_STORAGE_KEY = 'eylul_mina_sound_muted_v1'

let soundMuted: boolean = (() => {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(MUTE_STORAGE_KEY) === 'true'
  } catch {
    return false
  }
})()

export function isSoundMuted(): boolean {
  return soundMuted
}

export function setSoundMuted(muted: boolean): void {
  soundMuted = muted
  try {
    localStorage.setItem(MUTE_STORAGE_KEY, muted ? 'true' : 'false')
  } catch {
    // ignore
  }
  if (muted) {
    stopAllAudio()
  }
}

export function toggleSoundMuted(): boolean {
  const next = !soundMuted
  setSoundMuted(next)
  return next
}

export function stopAllAudio(): void {
  if (typeof window === 'undefined') return
  try {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    if (activeHtmlAudio) {
      activeHtmlAudio.pause()
      activeHtmlAudio.currentTime = 0
      activeHtmlAudio = null
    }
  } catch {
    // ignore
  }
}

export function getLastSpokenText(): string {
  return lastSpokenText
}

export function repeatLastSpeech(): void {
  if (soundMuted) return
  if (lastSpokenText) {
    speakTurkish(lastSpokenText)
  }
}

export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined' || soundMuted) return null
  if (!audioCtx) {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (AudioContextClass) {
      audioCtx = new AudioContextClass()
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {})
  }
  return audioCtx
}

// İlk kullanıcı dokunuşunda ses motorunu ve Türkçe sesleri hazırla (gecikmesiz ses için)
if (typeof window !== 'undefined') {
  const unlockAudio = () => {
    if (!soundMuted) {
      getAudioContext()
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.getVoices()
    }
    window.removeEventListener('pointerdown', unlockAudio)
    window.removeEventListener('touchstart', unlockAudio)
  }
  window.addEventListener('pointerdown', unlockAudio, { passive: true })
  window.addEventListener('touchstart', unlockAudio, { passive: true })
}

export function playSoundEffect(
  type:
    | 'success'
    | 'pop'
    | 'error'
    | 'fanfare'
    | 'click'
    | 'sneeze'
    | 'bubble'
    | 'pling'
    | 'applause'
    | 'bloop'
    | 'chord'
    | 'stir'
) {
  if (soundMuted) return
  try {
    const ctx = getAudioContext()
    if (!ctx) return
    const now = ctx.currentTime

    if (type === 'click' || type === 'pop') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(type === 'pop' ? 520 : 400, now)
      osc.frequency.exponentialRampToValueAtTime(type === 'pop' ? 880 : 600, now + 0.08)
      gain.gain.setValueAtTime(0.16, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.08)
    } else if (type === 'bloop') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(260, now)
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.14)
      gain.gain.setValueAtTime(0.22, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.15)
    } else if (type === 'chord') {
      const notes = [523.25, 659.25, 783.99]
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        const start = now + idx * 0.07
        osc.frequency.setValueAtTime(freq, start)
        gain.gain.setValueAtTime(0.2, start)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(start)
        osc.stop(start + 0.28)
      })
    } else if (type === 'stir') {
      const freqs = [290, 410, 540]
      const f = freqs[Math.floor(Math.random() * freqs.length)]
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(f, now)
      osc.frequency.exponentialRampToValueAtTime(f * 1.6, now + 0.07)
      gain.gain.setValueAtTime(0.12, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.075)
    } else if (type === 'pling') {
      const freqs = [880, 1318.5, 1760]
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        const start = now + idx * 0.05
        osc.frequency.setValueAtTime(f, start)
        osc.frequency.exponentialRampToValueAtTime(f * 1.03, start + 0.3)
        gain.gain.setValueAtTime(0.2 / (idx + 1), start)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(start)
        osc.stop(start + 0.32)
      })
    } else if (type === 'applause') {
      const melody = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98]
      const times = [0, 0.08, 0.16, 0.25, 0.35, 0.46]
      melody.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        const t = now + times[idx]
        osc.frequency.setValueAtTime(freq, t)
        gain.gain.setValueAtTime(0.2, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.3)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(t)
        osc.stop(t + 0.3)
      })
    } else if (type === 'success') {
      const notes = [523.25, 659.25, 783.99, 1046.5]
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, now + idx * 0.08)
        gain.gain.setValueAtTime(0.2, now + idx * 0.08)
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.22)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.08)
        osc.stop(now + idx * 0.08 + 0.22)
      })
    } else if (type === 'fanfare') {
      const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5]
      const times = [0, 0.09, 0.18, 0.28, 0.4, 0.5]
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(freq, now + times[idx])
        gain.gain.setValueAtTime(0.22, now + times[idx])
        gain.gain.exponentialRampToValueAtTime(0.001, now + times[idx] + 0.28)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + times[idx])
        osc.stop(now + times[idx] + 0.28)
      })
    } else if (type === 'error') {
      // Çocuk dostu yumuşak uyarı tonu (cezalandırıcı sert buzzer yerine nazik çift ton)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(320, now)
      osc.frequency.linearRampToValueAtTime(250, now + 0.18)
      gain.gain.setValueAtTime(0.14, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.18)
    } else if (type === 'sneeze') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'triangle'
      osc.frequency.setValueAtTime(280, now)
      osc.frequency.linearRampToValueAtTime(560, now + 0.1)
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.32)
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.linearRampToValueAtTime(0.2, now + 0.1)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.34)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.34)
    } else if (type === 'bubble') {
      ;[0, 0.06, 0.12].forEach((delay, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        const baseFreq = idx % 2 === 0 ? 320 : 440
        osc.frequency.setValueAtTime(baseFreq, now + delay)
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.7, now + delay + 0.07)
        gain.gain.setValueAtTime(0.14, now + delay)
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.07)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + delay)
        osc.stop(now + delay + 0.07)
      })
    }
  } catch {
    // Ignore audio context errors on restricted devices
  }
}

export function playWelcomeGreeting(childName = 'Eylül Mina', onEnd?: () => void) {
  if (soundMuted) return
  stopAllAudio()
  const fallbackText = `Merhaba ${childName}! Hadi birlikte harfleri keşfedelim!`
  lastSpokenText = fallbackText

  try {
    const audio = new Audio('/audio/welcome-eylul-mina.mp3')
    activeHtmlAudio = audio
    audio.playbackRate = 1.03
    if (onEnd) {
      audio.onended = onEnd
    }
    const playPromise = audio.play()
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        speakTurkishWithYouthVoice(fallbackText)
      })
    }
  } catch {
    speakTurkishWithYouthVoice(fallbackText)
  }
}

export function speakTurkishWithYouthVoice(text: string) {
  if (soundMuted) return
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  lastSpokenText = text
  try {
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'tr-TR'
    utterance.rate = 0.96
    utterance.pitch = 1.15

    const voices = window.speechSynthesis.getVoices()
    const youthFemaleVoice =
      voices.find(
        (v) =>
          v.lang.toLowerCase().includes('tr') &&
          (v.name.toLowerCase().includes('yelda') ||
            v.name.toLowerCase().includes('seda') ||
            v.name.toLowerCase().includes('female'))
      ) ||
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

export function speakTurkish(text: string, rate = 0.9, pitch = 1.08) {
  if (soundMuted) return
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
  lastSpokenText = text

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
