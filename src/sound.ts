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
    } else if (type === 'bloop') {
      // Kavanoz tencereye düşünce: "Bloop / Su damlası" sesi (frekansı yükselen sinüs dalgası)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(260, now)
      osc.frequency.exponentialRampToValueAtTime(780, now + 0.14)
      gain.gain.setValueAtTime(0.26, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.16)
    } else if (type === 'chord') {
      // Doğru hece: Neşeli majör akor (C5 - E5 - G5 arpej)
      const notes = [523.25, 659.25, 783.99] // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        const start = now + idx * 0.075
        osc.frequency.setValueAtTime(freq, start)
        gain.gain.setValueAtTime(0.24, start)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(start)
        osc.stop(start + 0.32)
      })
    } else if (type === 'stir') {
      // Karıştırma esnasında yumuşak fokurdama / su girdabı baloncuk sesi
      const freqs = [290, 410, 540]
      const f = freqs[Math.floor(Math.random() * freqs.length)]
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(f, now)
      osc.frequency.exponentialRampToValueAtTime(f * 1.65, now + 0.075)
      gain.gain.setValueAtTime(0.14, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.08)
    } else if (type === 'pling') {
      // Neşeli sihirli "pling" çan/kristal sesi (harf bulunduğunda)
      const freqs = [880, 1318.5, 1760] // A5, E6, A6
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        const start = now + idx * 0.055
        osc.frequency.setValueAtTime(f, start)
        osc.frequency.exponentialRampToValueAtTime(f * 1.03, start + 0.35)
        gain.gain.setValueAtTime(0.24 / (idx + 1), start)
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.38)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(start)
        osc.stop(start + 0.38)
      })
    } else if (type === 'applause') {
      // Zafer müziği + alkış ritmi
      const melody = [523.25, 659.25, 783.99, 1046.5, 1318.5, 1046.5, 1318.5, 1567.98]
      const times = [0, 0.09, 0.18, 0.28, 0.4, 0.52, 0.64, 0.78]
      melody.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'triangle'
        const t = now + times[idx]
        osc.frequency.setValueAtTime(freq, t)
        gain.gain.setValueAtTime(0.24, t)
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.35)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(t)
        osc.stop(t + 0.35)
      })

      // Alkış efektleri (kısa beyaz gürültü vuruşları)
      for (let i = 0; i < 12; i++) {
        const bufferSize = ctx.sampleRate * 0.045
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
        const data = buffer.getChannelData(0)
        for (let j = 0; j < bufferSize; j++) {
          data[j] = (Math.random() * 2 - 1) * Math.exp(-j / (bufferSize * 0.4))
        }
        const noise = ctx.createBufferSource()
        noise.buffer = buffer
        const filter = ctx.createBiquadFilter()
        filter.type = 'bandpass'
        filter.frequency.setValueAtTime(1200 + (i % 3) * 300, now + i * 0.085)
        const gain = ctx.createGain()
        gain.gain.setValueAtTime(0.16, now + i * 0.085)
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.085 + 0.045)
        noise.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)
        noise.start(now + i * 0.085)
      }
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
    } else if (type === 'sneeze') {
      // Komik "boing / buzzer" sesi (düşük frekanslı testere dişi dalga + white noise hapşırık efekti)
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sawtooth'
      osc.frequency.setValueAtTime(280, now)
      osc.frequency.linearRampToValueAtTime(620, now + 0.12)
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.38)
      gain.gain.setValueAtTime(0.08, now)
      gain.gain.linearRampToValueAtTime(0.26, now + 0.12)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.4)

      // White noise "Çuuu!" hapşırık tıslaması
      const bufferSize = Math.floor(ctx.sampleRate * 0.22)
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate)
      const data = buffer.getChannelData(0)
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.5))
      }
      const noise = ctx.createBufferSource()
      noise.buffer = buffer
      const filter = ctx.createBiquadFilter()
      filter.type = 'bandpass'
      filter.frequency.setValueAtTime(1600, now + 0.11)
      const nGain = ctx.createGain()
      nGain.gain.setValueAtTime(0.22, now + 0.11)
      nGain.gain.exponentialRampToValueAtTime(0.001, now + 0.33)
      noise.connect(filter)
      filter.connect(nGain)
      nGain.connect(ctx.destination)
      noise.start(now + 0.11)
    } else if (type === 'bubble') {
      // Kaynayan tencere fokurdama / su kabarcığı sesi
      ;[0, 0.07, 0.14].forEach((delay, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        const baseFreq = idx % 2 === 0 ? 320 : 440
        osc.frequency.setValueAtTime(baseFreq, now + delay)
        osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.8, now + delay + 0.08)
        gain.gain.setValueAtTime(0.16, now + delay)
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.08)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + delay)
        osc.stop(now + delay + 0.08)
      })
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

