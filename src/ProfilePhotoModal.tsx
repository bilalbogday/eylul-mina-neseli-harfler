import { useRef, useState } from 'react'
import { Camera, Upload, Trash2, X, Check, Image as ImageIcon } from 'lucide-react'
import { playSoundEffect, speakTurkish } from './sound'

interface ProfilePhotoModalProps {
  currentAvatar: string
  childName: string
  isOpen: boolean
  onClose: () => void
  onSaveAvatar: (newAvatar: string) => void
}

const PRESET_EMOJIS = ['👧', '🧒', '🦄', '🦁', '🐰', '🐼', '🦊', '🦋', '🚀', '👑', '🐱', '🐶', '🦖', '⭐']

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
    currentAvatar.startsWith('data:image') ? '' : currentAvatar
  )

  if (!isOpen) return null

  // Görseli sıkıştırıp 256x256 kare DataURL'e çevirme (LocalStorage ve Firebase boyutu için hafif tutulur)
  const processImageFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_SIZE = 256
        let width = img.width
        let height = img.height

        // Kare kırpma ve ölçekleme
        const minDim = Math.min(width, height)
        const cropX = (width - minDim) / 2
        const cropY = (height - minDim) / 2

        canvas.width = MAX_SIZE
        canvas.height = MAX_SIZE
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        ctx.drawImage(img, cropX, cropY, minDim, minDim, 0, 0, MAX_SIZE, MAX_SIZE)

        // WebP / JPEG formatında kaliteli ve hafif çıktı (~20-40kb)
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
    setPreview('👧')
    setSelectedPreset('👧')
  }

  const isCustomPhoto = preview.startsWith('data:image') || preview.startsWith('http')

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="profile-photo-modal" onClick={(e) => e.stopPropagation()}>
        <div className="photo-modal-header">
          <h3>
            <Camera size={22} color="#ff6b6b" /> {childName} için Profil Resmi
          </h3>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <p className="photo-modal-subtitle">
          Cihazınızdan, galeriden ya da kameradan çocuğunuzun kendi fotoğrafını yükleyebilirsiniz!
        </p>

        {/* BÜYÜK ÖNİZLEME */}
        <div className="photo-preview-container">
          <div className="photo-preview-circle">
            {isCustomPhoto ? (
              <img src={preview} alt={childName} className="custom-photo-img" />
            ) : (
              <span className="emoji-photo-span">{preview}</span>
            )}
          </div>

          <div className="photo-preview-controls">
            <button
              type="button"
              className="btn-primary photo-upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload size={18} /> Fotoğraf Seç / Çek
            </button>

            {isCustomPhoto && (
              <button
                type="button"
                className="btn-secondary photo-remove-btn"
                onClick={handleRemovePhoto}
                title="Fotoğrafı Kaldır"
              >
                <Trash2 size={16} /> Kaldır
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

        {/* EMOJİ / MASKOT SEÇİMİ ALTERNATİFİ */}
        <div className="photo-presets-section">
          <div className="presets-title">
            <ImageIcon size={16} /> Veya Sevimli Bir Karakter Seçin:
          </div>
          <div className="photo-presets-grid">
            {PRESET_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`preset-emoji-btn ${selectedPreset === emoji && !isCustomPhoto ? 'active' : ''}`}
                onClick={() => {
                  playSoundEffect('pop')
                  setPreview(emoji)
                  setSelectedPreset(emoji)
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>

        {/* KAYDET VE İPTAL BUTONLARI */}
        <div className="photo-modal-footer">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Vazgeç
          </button>
          <button type="button" className="btn-primary btn-save-photo" onClick={handleSave}>
            <Check size={18} /> Resmi Kaydet
          </button>
        </div>
      </div>
    </div>
  )
}
