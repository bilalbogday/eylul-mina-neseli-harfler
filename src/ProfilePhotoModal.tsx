import { useRef, useState, useMemo } from 'react'
import { Camera, Upload, Trash2, X, Check, Image as ImageIcon, Sparkles } from 'lucide-react'
import { playSoundEffect, speakTurkish } from './sound'

interface ProfilePhotoModalProps {
  currentAvatar: string
  childName: string
  isOpen: boolean
  onClose: () => void
  onSaveAvatar: (newAvatar: string) => void
}

export interface AvatarCategory {
  id: string
  label: string
  icon: string
  emojis: string[]
}

// Çoğunlukla kız çocuklarının en sevdiği prensesler, sevimli kız karakterleri ve şirin maskotlar
export const AVATAR_CATEGORIES: AvatarCategory[] = [
  {
    id: 'girls',
    label: 'Prensesler & Kızlar',
    icon: '👸',
    emojis: [
      '👧', '👸', '🧚‍♀️', '🧜‍♀️', '🦸‍♀️', '🧝‍♀️', '👩‍🚀', '👩‍🎨',
      '👩‍🍳', '👩‍🎤', '💃', '🩰', '👧🏻', '👧🏼', '👧🏽', '👸🏻',
      '👸🏼', '👸🏽', '🧚🏻‍♀️', '🧜🏻‍♀️', '🦸🏻‍♀️', '🎀', '👑', '🌸',
      '🍓', '🍭', '🧁', '🦄',
    ],
  },
  {
    id: 'animals',
    label: 'Sevimli Hayvanlar',
    icon: '🐰',
    emojis: [
      '🐰', '🐱', '🐶', '🐼', '🦊', '🐨', '🐻', '🦋',
      '🦩', '🦔', '🐬', '🦭', '🐣', '🐧', '🦥', '🦁',
    ],
  },
  {
    id: 'heroes',
    label: 'Kahramanlar & Diğer',
    icon: '⭐',
    emojis: [
      '🧒', '👦', '🦸‍♂️', '🧑‍🚀', '🦖', '🚀', '🌈', '⭐',
    ],
  },
]

export function ProfilePhotoModal({
  currentAvatar,
  childName,
  isOpen,
  onClose,
  onSaveAvatar,
}: ProfilePhotoModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [preview, setPreview] = useState<string>(currentAvatar)
  const [selectedPreset, setSelectedPreset] = useState<string>(
    currentAvatar.startsWith('data:image') || currentAvatar.startsWith('http') ? '' : currentAvatar
  )
  const [activeCategoryId, setActiveCategoryId] = useState<string>('girls')

  // Seçili kategoriye göre gösterilecek emojiler
  const displayedEmojis = useMemo(() => {
    if (activeCategoryId === 'all') {
      return Array.from(new Set(AVATAR_CATEGORIES.flatMap((c) => c.emojis)))
    }
    const category = AVATAR_CATEGORIES.find((c) => c.id === activeCategoryId)
    return category ? category.emojis : AVATAR_CATEGORIES[0].emojis
  }, [activeCategoryId])

  if (!isOpen) return null

  // Görseli sıkıştırıp 256x256 kare DataURL'e çevirme
  const processImageFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_SIZE = 256
        const width = img.width
        const height = img.height

        const minDim = Math.min(width, height)
        const cropX = (width - minDim) / 2
        const cropY = (height - minDim) / 2

        canvas.width = MAX_SIZE
        canvas.height = MAX_SIZE
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.drawImage(img, cropX, cropY, minDim, minDim, 0, 0, MAX_SIZE, MAX_SIZE)

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85)
        setPreview(compressedDataUrl)
        setSelectedPreset('')
        playSoundEffect('pop')
        speakTurkish('Harika bir fotoğraf seçtin!')
      }
      img.src = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      alert('Lütfen geçerli bir resim dosyası seçin.')
      return
    }
    processImageFile(file)
  }

  const handleSave = () => {
    playSoundEffect('fanfare')
    speakTurkish(`Profil resmin güncellendi ${childName}!`)
    onSaveAvatar(preview)
    onClose()
  }

  const handleRemovePhoto = () => {
    playSoundEffect('click')
    setPreview('👸')
    setSelectedPreset('👸')
  }

  const isCustomPhoto = preview.startsWith('data:image') || preview.startsWith('http')

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="profile-photo-modal modal-large" onClick={(e) => e.stopPropagation()}>
        <div className="photo-modal-header">
          <h3>
            <Camera size={24} color="#ec4899" /> {childName} için Profil Resmi
          </h3>
          <button type="button" className="modal-close-btn" onClick={onClose} title="Kapat">
            <X size={20} />
          </button>
        </div>

        <p className="photo-modal-subtitle">
          Cihazınızdan çocuğunuzun kendi fotoğrafını yükleyebilir veya aşağıdaki sevimli karakterlerden birini seçebilirsiniz!
        </p>

        {/* BÜYÜK VE BELİRGİN ÖNİZLEME */}
        <div className="photo-preview-container">
          <div className="photo-preview-circle large-circle">
            {isCustomPhoto ? (
              <img src={preview} alt={childName} className="custom-photo-img" />
            ) : (
              <span className="emoji-photo-span jumbo-emoji">{preview}</span>
            )}
            <div className="preview-glow-ring" />
          </div>

          <div className="photo-preview-controls">
            <button
              type="button"
              className="btn-primary photo-upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={18} /> Kendi Fotoğrafını Yükle
            </button>

            {isCustomPhoto && (
              <button
                type="button"
                className="btn-secondary photo-remove-btn"
                onClick={handleRemovePhoto}
                title="Fotoğrafı Kaldır ve Karakter Seç"
              >
                <Trash2 size={16} /> Fotoğrafı Kaldır
              </button>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
          </div>
        </div>

        {/* EMOJİ / KARAKTER SEÇİM BÖLÜMÜ */}
        <div className="photo-presets-section">
          <div className="presets-header-row">
            <div className="presets-title">
              <ImageIcon size={18} color="#ec4899" /> Sevimli Bir Karakter Seç:
            </div>

            {/* Kategori Filtre Butonları */}
            <div className="presets-category-tabs">
              {AVATAR_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`category-pill ${activeCategoryId === cat.id ? 'active' : ''}`}
                  onClick={() => {
                    playSoundEffect('click')
                    setActiveCategoryId(cat.id)
                  }}
                >
                  <span>{cat.icon}</span>
                  <span>{cat.label}</span>
                </button>
              ))}
              <button
                type="button"
                className={`category-pill ${activeCategoryId === 'all' ? 'active' : ''}`}
                onClick={() => {
                  playSoundEffect('click')
                  setActiveCategoryId('all')
                }}
              >
                <span>🌈</span>
                <span>Tümü</span>
              </button>
            </div>
          </div>

          {/* BÜYÜTÜLMÜŞ VE GENİŞLETİLMİŞ KARAKTER IZGARASI */}
          <div className="photo-presets-grid jumbo-grid">
            {displayedEmojis.map((emoji, idx) => {
              const isSelected = selectedPreset === emoji && !isCustomPhoto
              return (
                <button
                  key={`${emoji}-${idx}`}
                  type="button"
                  className={`preset-emoji-btn jumbo-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    playSoundEffect('pop')
                    setPreview(emoji)
                    setSelectedPreset(emoji)
                  }}
                  title={emoji}
                >
                  <span className="jumbo-char">{emoji}</span>
                  {isSelected && (
                    <span className="selected-check-badge">
                      <Check size={12} strokeWidth={3} />
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* KAYDET VE İPTAL BUTONLARI */}
        <div className="photo-modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Vazgeç
          </button>
          <button type="button" className="btn-primary btn-save-photo" onClick={handleSave}>
            <Sparkles size={18} /> Resmi Kaydet
          </button>
        </div>
      </div>
    </div>
  )
}
