export interface WordItem {
  word: string
  emoji: string
  syllables: string[]
  sentence?: string
}

export interface SyllableTask {
  parts: [string, string]
  result: string
  meaning: string
  emoji: string
}

export interface LetterCurriculum {
  id: string
  upper: string
  lower: string
  groupId: number
  phoneticText: string // TTS için ses okunuşu
  soundHint: string // Ekranda gösterilecek ipucu
  mascotWord: string
  mascotEmoji: string
  color: string
  sticker: {
    id: string
    name: string
    emoji: string
    islandTitle: string
  }
  words: WordItem[]
  syllableTasks: SyllableTask[]
  tracePoints: { x: number; y: number }[] // 0..100 normalize koordinatlar (nokta birleştirme)
  traceStrokes: { x1: number; y1: number; x2: number; y2: number }[]
}

export interface IslandGroup {
  id: number
  title: string
  subtitle: string
  themeEmoji: string
  bgGradient: string
  accentColor: string
  letters: string[]
}

export const ISLAND_GROUPS: IslandGroup[] = [
  {
    id: 1,
    title: '1. Ada: Neşeli Orman',
    subtitle: 'A - N - E - T - İ - L Sesleri (Maarif Modeli 1. Grup)',
    themeEmoji: '🌳',
    bgGradient: 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)',
    accentColor: '#16a34a',
    letters: ['A', 'N', 'E', 'T', 'İ', 'L'],
  },
  {
    id: 2,
    title: '2. Ada: Gökkuşağı Koyu',
    subtitle: 'O - K - U - R - I - M Sesleri (Maarif Modeli 2. Grup)',
    themeEmoji: '🌈',
    bgGradient: 'linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)',
    accentColor: '#0284c7',
    letters: ['O', 'K', 'U', 'R', 'I', 'M'],
  },
  {
    id: 3,
    title: '3. Ada: Yıldızlı Tepe',
    subtitle: 'Ü - S - Ö - Y - D - Z Sesleri (Maarif Modeli 3. Grup)',
    themeEmoji: '🌟',
    bgGradient: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    accentColor: '#d97706',
    letters: ['Ü', 'S', 'Ö', 'Y', 'D', 'Z'],
  },
  {
    id: 4,
    title: '4. Ada: Masal Şatosu',
    subtitle: 'Ç - B - G - C - Ş Sesleri (Maarif Modeli 4. Grup)',
    themeEmoji: '🏰',
    bgGradient: 'linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 100%)',
    accentColor: '#9333ea',
    letters: ['Ç', 'B', 'G', 'C', 'Ş'],
  },
  {
    id: 5,
    title: '5. Ada: Uzay İstasyonu',
    subtitle: 'P - H - V - Ğ - F - J Sesleri (Maarif Modeli 5. Grup)',
    themeEmoji: '🚀',
    bgGradient: 'linear-gradient(135deg, #ffe4e6 0%, #fecdd3 100%)',
    accentColor: '#e11d48',
    letters: ['P', 'H', 'V', 'Ğ', 'F', 'J'],
  },
]

export const LETTERS_DATA: LetterCurriculum[] = [
  // ================= 1. GRUP: A, N, E, T, İ, L =================
  {
    id: 'A',
    upper: 'A',
    lower: 'a',
    groupId: 1,
    phoneticText: 'aaa! Arı derken ağzımızı kocaman açıp aaa diyoruz.',
    soundHint: 'Aaa!',
    mascotWord: 'Arı',
    mascotEmoji: '🐝',
    color: '#ef4444',
    sticker: { id: 'stk_a', name: 'Çalışkan Arı', emoji: '🐝', islandTitle: 'Neşeli Orman' },
    words: [
      { word: 'Arı', emoji: '🐝', syllables: ['A', 'rı'], sentence: 'Eylül Mina arı uçtu.' },
      { word: 'At', emoji: '🐴', syllables: ['At'], sentence: 'Beyaz at koşuyor.' },
      { word: 'Ayı', emoji: '🐻', syllables: ['A', 'yı'], sentence: 'Sevimli ayı bal yedi.' },
    ],
    syllableTasks: [
      { parts: ['a', 'n'], result: 'an', meaning: 'A ve N birleşti: an', emoji: '✨' },
      { parts: ['n', 'a'], result: 'na', meaning: 'N ve A birleşti: na', emoji: '🎵' },
      { parts: ['a', 'na'], result: 'ana', meaning: 'Sevgi dolu canım ana', emoji: '💛' },
    ],
    tracePoints: [
      { x: 50, y: 18 },
      { x: 25, y: 82 },
      { x: 75, y: 82 },
      { x: 35, y: 55 },
      { x: 65, y: 55 },
    ],
    traceStrokes: [
      { x1: 50, y1: 18, x2: 25, y2: 82 },
      { x1: 50, y1: 18, x2: 75, y2: 82 },
      { x1: 35, y1: 55, x2: 65, y2: 55 },
    ],
  },
  {
    id: 'N',
    upper: 'N',
    lower: 'n',
    groupId: 1,
    phoneticText: 'nnn! Nar derken dilimiz damağa değiyor: nnn!',
    soundHint: 'Nnn!',
    mascotWord: 'Nar',
    mascotEmoji: '🍎',
    color: '#f97316',
    sticker: { id: 'stk_n', name: 'Kırmızı Nar', emoji: '🍓', islandTitle: 'Neşeli Orman' },
    words: [
      { word: 'Nar', emoji: '🍎', syllables: ['Nar'], sentence: 'Tatlı kırmızı nar.' },
      { word: 'Anne', emoji: '👩‍👧', syllables: ['An', 'ne'], sentence: 'Eylül Mina annesini sever.' },
      { word: 'Nane', emoji: '🌿', syllables: ['Na', 'ne'], sentence: 'Yeşil nane mis kokar.' },
    ],
    syllableTasks: [
      { parts: ['a', 'n'], result: 'an', meaning: 'A ve N birleşti: an', emoji: '✨' },
      { parts: ['n', 'a'], result: 'na', meaning: 'N ve A birleşti: na', emoji: '🎵' },
      { parts: ['an', 'a'], result: 'ana', meaning: 'Canım ana', emoji: '💛' },
    ],
    tracePoints: [
      { x: 26, y: 82 },
      { x: 26, y: 18 },
      { x: 74, y: 82 },
      { x: 74, y: 18 },
    ],
    traceStrokes: [
      { x1: 26, y1: 18, x2: 26, y2: 82 },
      { x1: 26, y1: 18, x2: 74, y2: 82 },
      { x1: 74, y1: 82, x2: 74, y2: 18 },
    ],
  },
  {
    id: 'E',
    upper: 'E',
    lower: 'e',
    groupId: 1,
    phoneticText: 'eee! Elma derken gülümseyerek eee diyoruz.',
    soundHint: 'Eee!',
    mascotWord: 'Elma',
    mascotEmoji: '🍏',
    color: '#10b981',
    sticker: { id: 'stk_e', name: 'Tatlı Elma', emoji: '🍏', islandTitle: 'Neşeli Orman' },
    words: [
      { word: 'Elma', emoji: '🍏', syllables: ['El', 'ma'], sentence: 'Kütür kütür elma.' },
      { word: 'Ekmek', emoji: '🍞', syllables: ['Ek', 'mek'], sentence: 'Sıcak taze ekmek.' },
      { word: 'Anne', emoji: '👩‍👧', syllables: ['An', 'ne'], sentence: 'Canım annem.' },
    ],
    syllableTasks: [
      { parts: ['e', 'n'], result: 'en', meaning: 'En güzel oyun', emoji: '🏆' },
      { parts: ['n', 'e'], result: 'ne', meaning: 'Bu kutuda ne var?', emoji: '🎁' },
      { parts: ['an', 'ne'], result: 'anne', meaning: 'Güzel anne', emoji: '👩‍👧' },
    ],
    tracePoints: [
      { x: 30, y: 18 },
      { x: 30, y: 82 },
      { x: 72, y: 18 },
      { x: 65, y: 50 },
      { x: 72, y: 82 },
    ],
    traceStrokes: [
      { x1: 30, y1: 18, x2: 30, y2: 82 },
      { x1: 30, y1: 18, x2: 72, y2: 18 },
      { x1: 30, y1: 50, x2: 65, y2: 50 },
      { x1: 30, y1: 82, x2: 72, y2: 82 },
    ],
  },
  {
    id: 'T',
    upper: 'T',
    lower: 't',
    groupId: 1,
    phoneticText: 't! Tavşan ve top derken t sesini çıkarıyoruz.',
    soundHint: 'Ttt!',
    mascotWord: 'Tavşan',
    mascotEmoji: '🐰',
    color: '#3b82f6',
    sticker: { id: 'stk_t', name: 'Zıpzıp Tavşan', emoji: '🐰', islandTitle: 'Neşeli Orman' },
    words: [
      { word: 'Tavşan', emoji: '🐰', syllables: ['Tav', 'şan'], sentence: 'Tavşan havuç yedi.' },
      { word: 'Top', emoji: '⚽', syllables: ['Top'], sentence: 'Renkli top zıpladı.' },
      { word: 'Tren', emoji: '🚂', syllables: ['Tren'], sentence: 'Çuf çuf tren geliyor.' },
    ],
    syllableTasks: [
      { parts: ['a', 't'], result: 'at', meaning: 'Hızlı koşan at', emoji: '🐴' },
      { parts: ['e', 't'], result: 'et', meaning: 'E ve T birleşti: et', emoji: '🍖' },
      { parts: ['an', 'ten'], result: 'anten', meaning: 'Televizyon anteni', emoji: '📡' },
    ],
    tracePoints: [
      { x: 22, y: 20 },
      { x: 78, y: 20 },
      { x: 50, y: 20 },
      { x: 50, y: 82 },
    ],
    traceStrokes: [
      { x1: 22, y1: 20, x2: 78, y2: 20 },
      { x1: 50, y1: 20, x2: 50, y2: 82 },
    ],
  },
  {
    id: 'İ',
    upper: 'İ',
    lower: 'i',
    groupId: 1,
    phoneticText: 'iii! İnek ve incir derken incecik iii diyoruz.',
    soundHint: 'İii!',
    mascotWord: 'İnek',
    mascotEmoji: '🐮',
    color: '#8b5cf6',
    sticker: { id: 'stk_i', name: 'Benekli İnek', emoji: '🐮', islandTitle: 'Neşeli Orman' },
    words: [
      { word: 'İnek', emoji: '🐮', syllables: ['İ', 'nek'], sentence: 'Benekli inek süt verir.' },
      { word: 'İp', emoji: '🧶', syllables: ['İp'], sentence: 'Eylül Mina ip atladı.' },
      { word: 'İncir', emoji: '🫐', syllables: ['İn', 'cir'], sentence: 'Tatlı incir yedik.' },
    ],
    syllableTasks: [
      { parts: ['i', 'n'], result: 'in', meaning: 'Merdivenden in', emoji: '🪜' },
      { parts: ['i', 't'], result: 'it', meaning: 'Arabayı ileri it', emoji: '🛒' },
      { parts: ['n', 'i'], result: 'ni', meaning: 'N ve İ birleşti: ni', emoji: '🎶' },
    ],
    tracePoints: [
      { x: 50, y: 14 },
      { x: 50, y: 28 },
      { x: 50, y: 55 },
      { x: 50, y: 84 },
    ],
    traceStrokes: [
      { x1: 50, y1: 28, x2: 50, y2: 84 },
    ],
  },
  {
    id: 'L',
    upper: 'L',
    lower: 'l',
    groupId: 1,
    phoneticText: 'lll! Limon ve lale derken dilimizi kaldırıp lll diyoruz.',
    soundHint: 'Lll!',
    mascotWord: 'Limon',
    mascotEmoji: '🍋',
    color: '#eab308',
    sticker: { id: 'stk_l', name: 'Sarı Limon', emoji: '🍋', islandTitle: 'Neşeli Orman' },
    words: [
      { word: 'Limon', emoji: '🍋', syllables: ['Li', 'mon'], sentence: 'Sarı ekşi limon.' },
      { word: 'Lale', emoji: '🌷', syllables: ['La', 'le'], sentence: 'Bahçede güzel lale.' },
      { word: 'El', emoji: '✋', syllables: ['El'], sentence: 'Eylül Mina el salladı.' },
    ],
    syllableTasks: [
      { parts: ['e', 'l'], result: 'el', meaning: 'Minik el', emoji: '✋' },
      { parts: ['el', 'a'], result: 'ela', meaning: 'Ela gözlü', emoji: '👀' },
      { parts: ['la', 'le'], result: 'lale', meaning: 'Renkli lale çiçeği', emoji: '🌷' },
    ],
    tracePoints: [
      { x: 32, y: 18 },
      { x: 32, y: 82 },
      { x: 74, y: 82 },
    ],
    traceStrokes: [
      { x1: 32, y1: 18, x2: 32, y2: 82 },
      { x1: 32, y1: 82, x2: 74, y2: 82 },
    ],
  },

  // ================= 2. GRUP: O, K, U, R, I, M =================
  {
    id: 'O',
    upper: 'O',
    lower: 'o',
    groupId: 2,
    phoneticText: 'ooo! Otobüs derken dudaklarımızı yuvarlayıp ooo diyoruz.',
    soundHint: 'Ooo!',
    mascotWord: 'Otobüs',
    mascotEmoji: '🚌',
    color: '#0ea5e9',
    sticker: { id: 'stk_o', name: 'Neşeli Otobüs', emoji: '🚌', islandTitle: 'Gökkuşağı Koyu' },
    words: [
      { word: 'Otobüs', emoji: '🚌', syllables: ['O', 'to', 'büs'], sentence: 'Sarı okul otobüsü.' },
      { word: 'Orman', emoji: '🌲', syllables: ['Or', 'man'], sentence: 'Yemyeşil orman.' },
      { word: 'Oyun', emoji: '🎲', syllables: ['O', 'yun'], sentence: 'Oyun oynamak çok güzel.' },
    ],
    syllableTasks: [
      { parts: ['o', 'n'], result: 'on', meaning: 'On tane parmak', emoji: '🔟' },
      { parts: ['o', 'l'], result: 'ol', meaning: 'Mutlu ol', emoji: '😊' },
      { parts: ['ot', 'el'], result: 'otel', meaning: 'Tatil oteli', emoji: '🏨' },
    ],
    tracePoints: [
      { x: 50, y: 18 },
      { x: 78, y: 50 },
      { x: 50, y: 82 },
      { x: 22, y: 50 },
    ],
    traceStrokes: [
      { x1: 50, y1: 18, x2: 78, y2: 50 },
      { x1: 78, y1: 50, x2: 50, y2: 82 },
      { x1: 50, y1: 82, x2: 22, y2: 50 },
      { x1: 22, y1: 50, x2: 50, y2: 18 },
    ],
  },
  {
    id: 'K',
    upper: 'K',
    lower: 'k',
    groupId: 2,
    phoneticText: 'k! Kedi ve kalem derken k sesini çıkarıyoruz.',
    soundHint: 'Kkk!',
    mascotWord: 'Kedi',
    mascotEmoji: '🐱',
    color: '#ec4899',
    sticker: { id: 'stk_k', name: 'Pamuk Kedi', emoji: '🐱', islandTitle: 'Gökkuşağı Koyu' },
    words: [
      { word: 'Kedi', emoji: '🐱', syllables: ['Ke', 'di'], sentence: 'Pamuk kedi miyavladı.' },
      { word: 'Kalem', emoji: '✏️', syllables: ['Ka', 'lem'], sentence: 'Renkli boya kalemi.' },
      { word: 'Kek', emoji: '🧁', syllables: ['Kek'], sentence: 'Çikolatalı lezzetli kek.' },
    ],
    syllableTasks: [
      { parts: ['o', 'k'], result: 'ok', meaning: 'Hedef ok', emoji: '🏹' },
      { parts: ['k', 'ol'], result: 'kol', meaning: 'Güçlü kol', emoji: '💪' },
      { parts: ['ka', 'le'], result: 'kale', meaning: 'Büyük taş kale', emoji: '🏰' },
    ],
    tracePoints: [
      { x: 30, y: 18 },
      { x: 30, y: 82 },
      { x: 72, y: 20 },
      { x: 35, y: 50 },
      { x: 74, y: 82 },
    ],
    traceStrokes: [
      { x1: 30, y1: 18, x2: 30, y2: 82 },
      { x1: 72, y1: 20, x2: 35, y2: 50 },
      { x1: 35, y1: 50, x2: 74, y2: 82 },
    ],
  },
  {
    id: 'U',
    upper: 'U',
    lower: 'u',
    groupId: 2,
    phoneticText: 'uuu! Uçak ve uçurtma derken uuu diyoruz.',
    soundHint: 'Uuu!',
    mascotWord: 'Uçak',
    mascotEmoji: '✈️',
    color: '#6366f1',
    sticker: { id: 'stk_u', name: 'Mavi Uçak', emoji: '✈️', islandTitle: 'Gökkuşağı Koyu' },
    words: [
      { word: 'Uçak', emoji: '✈️', syllables: ['U', 'çak'], sentence: 'Uçak bulutların üstünde.' },
      { word: 'Uçurtma', emoji: '🪁', syllables: ['U', 'çurt', 'ma'], sentence: 'Renkli uçurtma gökyüzünde.' },
      { word: 'Un', emoji: '🌾', syllables: ['Un'], sentence: 'Beyaz un ile kurabiye yaptık.' },
    ],
    syllableTasks: [
      { parts: ['u', 'n'], result: 'un', meaning: 'Beyaz un', emoji: '🌾' },
      { parts: ['o', 'kul'], result: 'okul', meaning: 'Güzel okulumuz', emoji: '🏫' },
      { parts: ['k', 'ul'], result: 'kul', meaning: 'K ve U-L birleşti', emoji: '✨' },
    ],
    tracePoints: [
      { x: 28, y: 18 },
      { x: 28, y: 72 },
      { x: 50, y: 84 },
      { x: 72, y: 72 },
      { x: 72, y: 18 },
    ],
    traceStrokes: [
      { x1: 28, y1: 18, x2: 28, y2: 72 },
      { x1: 28, y1: 72, x2: 50, y2: 84 },
      { x1: 50, y1: 84, x2: 72, y2: 72 },
      { x1: 72, y1: 72, x2: 72, y2: 18 },
    ],
  },
  {
    id: 'R',
    upper: 'R',
    lower: 'r',
    groupId: 2,
    phoneticText: 'rrr! Robot ve roket derken dilimiz titriyor: rrr!',
    soundHint: 'Rrr!',
    mascotWord: 'Robot',
    mascotEmoji: '🤖',
    color: '#14b8a6',
    sticker: { id: 'stk_r', name: 'Akıllı Robot', emoji: '🤖', islandTitle: 'Gökkuşağı Koyu' },
    words: [
      { word: 'Robot', emoji: '🤖', syllables: ['Ro', 'bot'], sentence: 'Sevimli robot dans ediyor.' },
      { word: 'Roket', emoji: '🚀', syllables: ['Ro', 'ket'], sentence: 'Roket uzaya fırladı.' },
      { word: 'Nar', emoji: '🍎', syllables: ['Nar'], sentence: 'Taneli kırmızı nar.' },
    ],
    syllableTasks: [
      { parts: ['t', 'ur'], result: 'tur', meaning: 'Hızlı bir tur', emoji: '🔄' },
      { parts: ['n', 'ar'], result: 'nar', meaning: 'Tatlı nar', emoji: '🍎' },
      { parts: ['k', 'ar'], result: 'kar', meaning: 'Bembeyaz kar', emoji: '❄️' },
    ],
    tracePoints: [
      { x: 30, y: 18 },
      { x: 30, y: 82 },
      { x: 68, y: 32 },
      { x: 30, y: 50 },
      { x: 72, y: 82 },
    ],
    traceStrokes: [
      { x1: 30, y1: 18, x2: 30, y2: 82 },
      { x1: 30, y1: 18, x2: 68, y2: 32 },
      { x1: 68, y1: 32, x2: 30, y2: 50 },
      { x1: 30, y1: 50, x2: 72, y2: 82 },
    ],
  },
  {
    id: 'I',
    upper: 'I',
    lower: 'ı',
    groupId: 2,
    phoneticText: 'ııı! Irmak ve ışık derken noktasız ııı diyoruz.',
    soundHint: 'Iıı!',
    mascotWord: 'Işık',
    mascotEmoji: '💡',
    color: '#f59e0b',
    sticker: { id: 'stk_ii', name: 'Parlak Işık', emoji: '💡', islandTitle: 'Gökkuşağı Koyu' },
    words: [
      { word: 'Işık', emoji: '💡', syllables: ['I', 'şık'], sentence: 'Parlak sarı ışık.' },
      { word: 'Irmak', emoji: '🏞️', syllables: ['Ir', 'mak'], sentence: 'Mavi ırmak akıyor.' },
      { word: 'Altı', emoji: '6️⃣', syllables: ['Al', 'tı'], sentence: 'Eylül Mina altı yaşında.' },
    ],
    syllableTasks: [
      { parts: ['a', 'rı'], result: 'arı', meaning: 'Çiçekteki arı', emoji: '🐝' },
      { parts: ['k', 'ır'], result: 'kır', meaning: 'Yeşil çiçekli kır', emoji: '🌼' },
      { parts: ['al', 'tı'], result: 'altı', meaning: 'Altı sayısı', emoji: '6️⃣' },
    ],
    tracePoints: [
      { x: 50, y: 18 },
      { x: 50, y: 50 },
      { x: 50, y: 82 },
    ],
    traceStrokes: [
      { x1: 50, y1: 18, x2: 50, y2: 82 },
    ],
  },
  {
    id: 'M',
    upper: 'M',
    lower: 'm',
    groupId: 2,
    phoneticText: 'mmm! Muz ve dondurma yerken dudaklarımızı kapatıp mmm diyoruz.',
    soundHint: 'Mmm!',
    mascotWord: 'Muz',
    mascotEmoji: '🍌',
    color: '#d97706',
    sticker: { id: 'stk_m', name: 'Lezzetli Muz', emoji: '🍌', islandTitle: 'Gökkuşağı Koyu' },
    words: [
      { word: 'Muz', emoji: '🍌', syllables: ['Muz'], sentence: 'Maymun sarı muz yedi.' },
      { word: 'Masa', emoji: '🪑', syllables: ['Ma', 'sa'], sentence: 'Kitaplar masanın üstünde.' },
      { word: 'Mina', emoji: '👧', syllables: ['Mi', 'na'], sentence: 'Eylül Mina harfleri okuyor!' },
    ],
    syllableTasks: [
      { parts: ['el', 'ma'], result: 'elma', meaning: 'Tatlı kırmızı elma', emoji: '🍎' },
      { parts: ['mi', 'na'], result: 'mina', meaning: 'Harika okur Eylül Mina!', emoji: '👑' },
      { parts: ['li', 'mon'], result: 'limon', meaning: 'Sarı limon', emoji: '🍋' },
    ],
    tracePoints: [
      { x: 22, y: 82 },
      { x: 22, y: 18 },
      { x: 50, y: 56 },
      { x: 78, y: 18 },
      { x: 78, y: 82 },
    ],
    traceStrokes: [
      { x1: 22, y1: 82, x2: 22, y2: 18 },
      { x1: 22, y1: 18, x2: 50, y2: 56 },
      { x1: 50, y1: 56, x2: 78, y2: 18 },
      { x1: 78, y1: 18, x2: 78, y2: 82 },
    ],
  },

  // ================= 3. GRUP: Ü, S, Ö, Y, D, Z =================
  {
    id: 'Ü',
    upper: 'Ü',
    lower: 'ü',
    groupId: 3,
    phoneticText: 'üüü! Üzüm derken dudaklarımızı büzüp üüü diyoruz.',
    soundHint: 'Üüü!',
    mascotWord: 'Üzüm',
    mascotEmoji: '🍇',
    color: '#9333ea',
    sticker: { id: 'stk_u2', name: 'Mor Üzüm', emoji: '🍇', islandTitle: 'Yıldızlı Tepe' },
    words: [
      { word: 'Üzüm', emoji: '🍇', syllables: ['Ü', 'züm'], sentence: 'Salkım salkım tatlı üzüm.' },
      { word: 'Ütü', emoji: '👕', syllables: ['Ü', 'tü'], sentence: 'Gömlekleri ütüledik.' },
      { word: 'Üç', emoji: '3️⃣', syllables: ['Üç'], sentence: 'Bir, iki, üç!' },
    ],
    syllableTasks: [
      { parts: ['ü', 'tü'], result: 'ütü', meaning: 'Sıcak ütü', emoji: '👕' },
      { parts: ['k', 'ül'], result: 'kül', meaning: 'Sıcak kül', emoji: '🌋' },
      { parts: ['t', 'ül'], result: 'tül', meaning: 'Beyaz tül perde', emoji: '🪟' },
    ],
    tracePoints: [
      { x: 36, y: 14 },
      { x: 64, y: 14 },
      { x: 28, y: 28 },
      { x: 50, y: 84 },
      { x: 72, y: 28 },
    ],
    traceStrokes: [
      { x1: 28, y1: 28, x2: 50, y2: 84 },
      { x1: 50, y1: 84, x2: 72, y2: 28 },
    ],
  },
  {
    id: 'S',
    upper: 'S',
    lower: 's',
    groupId: 3,
    phoneticText: 'sss! Saat ve su derken tıpkı rüzgar gibi sss diyoruz.',
    soundHint: 'Sss!',
    mascotWord: 'Saat',
    mascotEmoji: '⏰',
    color: '#0284c7',
    sticker: { id: 'stk_s', name: 'Çalar Saat', emoji: '⏰', islandTitle: 'Yıldızlı Tepe' },
    words: [
      { word: 'Saat', emoji: '⏰', syllables: ['Sa', 'at'], sentence: 'Saat tik tak çalışıyor.' },
      { word: 'Su', emoji: '💧', syllables: ['Su'], sentence: 'Berrak serin su içtim.' },
      { word: 'Simit', emoji: '🥯', syllables: ['Si', 'mit'], sentence: 'Susamlı çıtır simit.' },
    ],
    syllableTasks: [
      { parts: ['s', 'u'], result: 'su', meaning: 'Temiz su', emoji: '💧' },
      { parts: ['s', 'üt'], result: 'süt', meaning: 'Ilık süt', emoji: '🥛' },
      { parts: ['ma', 'sa'], result: 'masa', meaning: 'Çalışma masası', emoji: '🪑' },
    ],
    tracePoints: [
      { x: 70, y: 24 },
      { x: 32, y: 34 },
      { x: 68, y: 66 },
      { x: 30, y: 78 },
    ],
    traceStrokes: [
      { x1: 70, y1: 24, x2: 32, y2: 34 },
      { x1: 32, y1: 34, x2: 68, y2: 66 },
      { x1: 68, y1: 66, x2: 30, y2: 78 },
    ],
  },
  {
    id: 'Ö',
    upper: 'Ö',
    lower: 'ö',
    groupId: 3,
    phoneticText: 'ööö! Ördek vak vak derken ööö sesini duyuyoruz.',
    soundHint: 'Ööö!',
    mascotWord: 'Ördek',
    mascotEmoji: '🦆',
    color: '#16a34a',
    sticker: { id: 'stk_o2', name: 'Sarı Ördek', emoji: '🦆', islandTitle: 'Yıldızlı Tepe' },
    words: [
      { word: 'Ördek', emoji: '🦆', syllables: ['Ör', 'dek'], sentence: 'Sarı ördek gölde yüzüyor.' },
      { word: 'Örümcek', emoji: '🕷️', syllables: ['Ö', 'rüm', 'cek'], sentence: 'Küçük örümcek ağ ördü.' },
      { word: 'Göz', emoji: '👀', syllables: ['Göz'], sentence: 'İki güzel göz.' },
    ],
    syllableTasks: [
      { parts: ['ö', 'n'], result: 'ön', meaning: 'Sıranın ön tarafı', emoji: '⬆️' },
      { parts: ['k', 'ök'], result: 'kök', meaning: 'Ağacın kökü', emoji: '🌱' },
      { parts: ['ö', 'rt'], result: 'ört', meaning: 'Üstünü ört', emoji: '🛏️' },
    ],
    tracePoints: [
      { x: 36, y: 14 },
      { x: 64, y: 14 },
      { x: 50, y: 28 },
      { x: 76, y: 56 },
      { x: 50, y: 84 },
      { x: 24, y: 56 },
    ],
    traceStrokes: [
      { x1: 50, y1: 28, x2: 76, y2: 56 },
      { x1: 76, y1: 56, x2: 50, y2: 84 },
      { x1: 50, y1: 84, x2: 24, y2: 56 },
      { x1: 24, y1: 56, x2: 50, y2: 28 },
    ],
  },
  {
    id: 'Y',
    upper: 'Y',
    lower: 'y',
    groupId: 3,
    phoneticText: 'yyy! Yıldız ve yaprak derken yyy diyoruz.',
    soundHint: 'Yyy!',
    mascotWord: 'Yıldız',
    mascotEmoji: '⭐',
    color: '#eab308',
    sticker: { id: 'stk_y', name: 'Parlak Yıldız', emoji: '⭐', islandTitle: 'Yıldızlı Tepe' },
    words: [
      { word: 'Yıldız', emoji: '⭐', syllables: ['Yıl', 'dız'], sentence: 'Gökyüzünde parlak yıldız.' },
      { word: 'Yumurta', emoji: '🥚', syllables: ['Yu', 'mur', 'ta'], sentence: 'Kahvaltıda yumurta yedim.' },
      { word: 'Eylül', emoji: '🍂', syllables: ['Ey', 'lül'], sentence: 'Eylül Mina yıldızları topladı!' },
    ],
    syllableTasks: [
      { parts: ['a', 'y'], result: 'ay', meaning: 'Gece parlayan ay', emoji: '🌙' },
      { parts: ['ey', 'lül'], result: 'eylül', meaning: 'Harika okur Eylül!', emoji: '🌟' },
      { parts: ['o', 'yun'], result: 'oyun', meaning: 'Eğlenceli oyun', emoji: '🎮' },
    ],
    tracePoints: [
      { x: 26, y: 18 },
      { x: 50, y: 50 },
      { x: 74, y: 18 },
      { x: 50, y: 84 },
    ],
    traceStrokes: [
      { x1: 26, y1: 18, x2: 50, y2: 50 },
      { x1: 74, y1: 18, x2: 50, y2: 50 },
      { x1: 50, y1: 50, x2: 50, y2: 84 },
    ],
  },
  {
    id: 'D',
    upper: 'D',
    lower: 'd',
    groupId: 3,
    phoneticText: 'd! Dondurma ve davul derken d sesini çıkarıyoruz.',
    soundHint: 'Ddd!',
    mascotWord: 'Dondurma',
    mascotEmoji: '🍦',
    color: '#ec4899',
    sticker: { id: 'stk_d', name: 'Tatlı Dondurma', emoji: '🍦', islandTitle: 'Yıldızlı Tepe' },
    words: [
      { word: 'Dondurma', emoji: '🍦', syllables: ['Don', 'dur', 'ma'], sentence: 'Çilekli soğuk dondurma.' },
      { word: 'Dedem', emoji: '👴', syllables: ['De', 'dem'], sentence: 'Dedem masal anlattı.' },
      { word: 'Deniz', emoji: '🌊', syllables: ['De', 'niz'], sentence: 'Masmavi dalgalı deniz.' },
    ],
    syllableTasks: [
      { parts: ['d', 'al'], result: 'dal', meaning: 'Ağacın yeşil dalı', emoji: '🌿' },
      { parts: ['de', 'de'], result: 'dede', meaning: 'Sevimli dede', emoji: '👴' },
      { parts: ['k', 'edi'], result: 'kedi', meaning: 'Minik kedi', emoji: '🐱' },
    ],
    tracePoints: [
      { x: 28, y: 18 },
      { x: 28, y: 82 },
      { x: 74, y: 50 },
    ],
    traceStrokes: [
      { x1: 28, y1: 18, x2: 28, y2: 82 },
      { x1: 28, y1: 18, x2: 74, y2: 50 },
      { x1: 74, y1: 50, x2: 28, y2: 82 },
    ],
  },
  {
    id: 'Z',
    upper: 'Z',
    lower: 'z',
    groupId: 3,
    phoneticText: 'zzz! Zebra ve zil derken arı gibi vızıldayarak zzz diyoruz.',
    soundHint: 'Zzz!',
    mascotWord: 'Zebra',
    mascotEmoji: '🦓',
    color: '#6366f1',
    sticker: { id: 'stk_z', name: 'Çizgili Zebra', emoji: '🦓', islandTitle: 'Yıldızlı Tepe' },
    words: [
      { word: 'Zebra', emoji: '🦓', syllables: ['Zeb', 'ra'], sentence: 'Siyah beyaz çizgili zebra.' },
      { word: 'Zil', emoji: '🔔', syllables: ['Zil'], sentence: 'Okul zili çaldı.' },
      { word: 'Zeytin', emoji: '🫒', syllables: ['Zey', 'tin'], sentence: 'Kahvaltıda zeytin yedik.' },
    ],
    syllableTasks: [
      { parts: ['z', 'il'], result: 'zil', meaning: 'Çalan zil', emoji: '🔔' },
      { parts: ['y', 'az'], result: 'yaz', meaning: 'Güneşli yaz mevsimi', emoji: '☀️' },
      { parts: ['m', 'uz'], result: 'muz', meaning: 'Sarı tatlı muz', emoji: '🍌' },
    ],
    tracePoints: [
      { x: 26, y: 20 },
      { x: 74, y: 20 },
      { x: 26, y: 80 },
      { x: 74, y: 80 },
    ],
    traceStrokes: [
      { x1: 26, y1: 20, x2: 74, y2: 20 },
      { x1: 74, y1: 20, x2: 26, y2: 80 },
      { x1: 26, y1: 80, x2: 74, y2: 80 },
    ],
  },

  // ================= 4. GRUP: Ç, B, G, C, Ş =================
  {
    id: 'Ç',
    upper: 'Ç',
    lower: 'ç',
    groupId: 4,
    phoneticText: 'ç! Çilek ve çiçek derken ç sesini çıkarıyoruz.',
    soundHint: 'Ççç!',
    mascotWord: 'Çilek',
    mascotEmoji: '🍓',
    color: '#e11d48',
    sticker: { id: 'stk_c2', name: 'Kırmızı Çilek', emoji: '🍓', islandTitle: 'Masal Şatosu' },
    words: [
      { word: 'Çilek', emoji: '🍓', syllables: ['Çi', 'lek'], sentence: 'Mis kokulu kırmızı çilek.' },
      { word: 'Çiçek', emoji: '🌸', syllables: ['Çi', 'çek'], sentence: 'Pembe bahar çiçeği.' },
      { word: 'Çanta', emoji: '🎒', syllables: ['Çan', 'ta'], sentence: 'Okul çantamı hazırladım.' },
    ],
    syllableTasks: [
      { parts: ['ç', 'ay'], result: 'çay', meaning: 'Sıcak çay', emoji: '🍵' },
      { parts: ['s', 'aç'], result: 'saç', meaning: 'Uzun güzel saç', emoji: '💇‍♀️' },
      { parts: ['çi', 'lek'], result: 'çilek', meaning: 'Tatlı çilek', emoji: '🍓' },
    ],
    tracePoints: [
      { x: 70, y: 22 },
      { x: 26, y: 48 },
      { x: 70, y: 74 },
      { x: 50, y: 88 },
    ],
    traceStrokes: [
      { x1: 70, y1: 22, x2: 26, y2: 48 },
      { x1: 26, y1: 48, x2: 70, y2: 74 },
    ],
  },
  {
    id: 'B',
    upper: 'B',
    lower: 'b',
    groupId: 4,
    phoneticText: 'b! Balık ve balon derken dudaklarımızdan b sesi çıkıyor.',
    soundHint: 'Bbb!',
    mascotWord: 'Balık',
    mascotEmoji: '🐠',
    color: '#2563eb',
    sticker: { id: 'stk_b', name: 'Renkli Balık', emoji: '🐠', islandTitle: 'Masal Şatosu' },
    words: [
      { word: 'Balık', emoji: '🐠', syllables: ['Ba', 'lık'], sentence: 'Denizde yüzen renkli balık.' },
      { word: 'Balon', emoji: '🎈', syllables: ['Ba', 'lon'], sentence: 'Kırmızı uçan balon.' },
      { word: 'Bebek', emoji: '👶', syllables: ['Be', 'bek'], sentence: 'Şirin bebek gülümsedi.' },
    ],
    syllableTasks: [
      { parts: ['b', 'al'], result: 'bal', meaning: 'Tatlı arı balı', emoji: '🍯' },
      { parts: ['ba', 'ba'], result: 'baba', meaning: 'Canım babam', emoji: '👨' },
      { parts: ['ba', 'lon'], result: 'balon', meaning: 'Uçan balon', emoji: '🎈' },
    ],
    tracePoints: [
      { x: 28, y: 18 },
      { x: 28, y: 82 },
      { x: 68, y: 34 },
      { x: 28, y: 50 },
      { x: 70, y: 68 },
    ],
    traceStrokes: [
      { x1: 28, y1: 18, x2: 28, y2: 82 },
      { x1: 28, y1: 18, x2: 68, y2: 34 },
      { x1: 68, y1: 34, x2: 28, y2: 50 },
      { x1: 28, y1: 50, x2: 70, y2: 68 },
      { x1: 70, y1: 68, x2: 28, y2: 82 },
    ],
  },
  {
    id: 'G',
    upper: 'G',
    lower: 'g',
    groupId: 4,
    phoneticText: 'g! Güneş ve gemi derken g sesini çıkarıyoruz.',
    soundHint: 'Ggg!',
    mascotWord: 'Güneş',
    mascotEmoji: '☀️',
    color: '#f59e0b',
    sticker: { id: 'stk_g', name: 'Gülümseyen Güneş', emoji: '☀️', islandTitle: 'Masal Şatosu' },
    words: [
      { word: 'Güneş', emoji: '☀️', syllables: ['Gü', 'neş'], sentence: 'Güneş dünyamızı ısıtır.' },
      { word: 'Gemi', emoji: '🚢', syllables: ['Ge', 'mi'], sentence: 'Büyük gemi limana yanaştı.' },
      { word: 'Gitar', emoji: '🎸', syllables: ['Gi', 'tar'], sentence: 'Gitar ile şarkı çaldık.' },
    ],
    syllableTasks: [
      { parts: ['g', 'ül'], result: 'gül', meaning: 'Kırmızı gül', emoji: '🌹' },
      { parts: ['g', 'öl'], result: 'göl', meaning: 'Durgun mavi göl', emoji: '🏞️' },
      { parts: ['ge', 'mi'], result: 'gemi', meaning: 'Yüzen gemi', emoji: '🚢' },
    ],
    tracePoints: [
      { x: 70, y: 24 },
      { x: 26, y: 50 },
      { x: 68, y: 80 },
      { x: 70, y: 54 },
      { x: 48, y: 54 },
    ],
    traceStrokes: [
      { x1: 70, y1: 24, x2: 26, y2: 50 },
      { x1: 26, y1: 50, x2: 68, y2: 80 },
      { x1: 68, y1: 80, x2: 70, y2: 54 },
      { x1: 70, y1: 54, x2: 48, y2: 54 },
    ],
  },
  {
    id: 'C',
    upper: 'C',
    lower: 'c',
    groupId: 4,
    phoneticText: 'c! Civciv cik cik derken c sesini duyuyoruz.',
    soundHint: 'Ccc!',
    mascotWord: 'Civciv',
    mascotEmoji: '🐥',
    color: '#eab308',
    sticker: { id: 'stk_c', name: 'Minik Civciv', emoji: '🐥', islandTitle: 'Masal Şatosu' },
    words: [
      { word: 'Civciv', emoji: '🐥', syllables: ['Civ', 'civ'], sentence: 'Sarı civciv yem yiyor.' },
      { word: 'Ceviz', emoji: '🌰', syllables: ['Ce', 'viz'], sentence: 'Ceviz yemek çok faydalı.' },
      { word: 'Cam', emoji: '🪟', syllables: ['Cam'], sentence: 'Pencerenin camı tertemiz.' },
    ],
    syllableTasks: [
      { parts: ['c', 'am'], result: 'cam', meaning: 'Parlak cam', emoji: '🪟' },
      { parts: ['c', 'an'], result: 'can', meaning: 'Canım arkadaşım', emoji: '💖' },
      { parts: ['ci', 'ci'], result: 'cici', meaning: 'Cici tatlı bebek', emoji: '👶' },
    ],
    tracePoints: [
      { x: 70, y: 24 },
      { x: 26, y: 50 },
      { x: 70, y: 78 },
    ],
    traceStrokes: [
      { x1: 70, y1: 24, x2: 26, y2: 50 },
      { x1: 26, y1: 50, x2: 70, y2: 78 },
    ],
  },
  {
    id: 'Ş',
    upper: 'Ş',
    lower: 'ş',
    groupId: 4,
    phoneticText: 'şşş! Şemsiye ve şeker derken sessizlik işareti gibi şşş diyoruz.',
    soundHint: 'Şşş!',
    mascotWord: 'Şemsiye',
    mascotEmoji: '☂️',
    color: '#a855f7',
    sticker: { id: 'stk_s2', name: 'Renkli Şemsiye', emoji: '☂️', islandTitle: 'Masal Şatosu' },
    words: [
      { word: 'Şemsiye', emoji: '☂️', syllables: ['Şem', 'si', 'ye'], sentence: 'Yağmurda şemsiye açtık.' },
      { word: 'Şapka', emoji: '👒', syllables: ['Şap', 'ka'], sentence: 'Hasır yazlık şapka.' },
      { word: 'Şeker', emoji: '🍬', syllables: ['Şe', 'ker'], sentence: 'Renkli tatlı şeker.' },
    ],
    syllableTasks: [
      { parts: ['k', 'uş'], result: 'kuş', meaning: 'Uçan minik kuş', emoji: '🐦' },
      { parts: ['t', 'aş'], result: 'taş', meaning: 'Dere kenarındaki taş', emoji: '🪨' },
      { parts: ['gü', 'neş'], result: 'güneş', meaning: 'Parlak güneş', emoji: '☀️' },
    ],
    tracePoints: [
      { x: 68, y: 22 },
      { x: 32, y: 34 },
      { x: 68, y: 62 },
      { x: 32, y: 74 },
      { x: 50, y: 88 },
    ],
    traceStrokes: [
      { x1: 68, y1: 22, x2: 32, y2: 34 },
      { x1: 32, y1: 34, x2: 68, y2: 62 },
      { x1: 68, y1: 62, x2: 32, y2: 74 },
    ],
  },

  // ================= 5. GRUP: P, H, V, Ğ, F, J =================
  {
    id: 'P',
    upper: 'P',
    lower: 'p',
    groupId: 5,
    phoneticText: 'p! Penguen ve papatya derken p sesini çıkarıyoruz.',
    soundHint: 'Ppp!',
    mascotWord: 'Penguen',
    mascotEmoji: '🐧',
    color: '#06b6d4',
    sticker: { id: 'stk_p', name: 'Buzul Pengueni', emoji: '🐧', islandTitle: 'Uzay İstasyonu' },
    words: [
      { word: 'Penguen', emoji: '🐧', syllables: ['Pen', 'gu', 'en'], sentence: 'Sevimli penguen buzda yürüdü.' },
      { word: 'Pasta', emoji: '🎂', syllables: ['Pas', 'ta'], sentence: 'Doğum günü pastası.' },
      { word: 'Papatya', emoji: '🌼', syllables: ['Pa', 'pat', 'ya'], sentence: 'Beyaz yapraklı papatya.' },
    ],
    syllableTasks: [
      { parts: ['t', 'op'], result: 'top', meaning: 'Zıplayan top', emoji: '⚽' },
      { parts: ['i', 'p'], result: 'ip', meaning: 'Renkli ip', emoji: '🧶' },
      { parts: ['pas', 'ta'], result: 'pasta', meaning: 'Çilekli pasta', emoji: '🎂' },
    ],
    tracePoints: [
      { x: 30, y: 18 },
      { x: 30, y: 82 },
      { x: 70, y: 34 },
      { x: 30, y: 52 },
    ],
    traceStrokes: [
      { x1: 30, y1: 18, x2: 30, y2: 82 },
      { x1: 30, y1: 18, x2: 70, y2: 34 },
      { x1: 70, y1: 34, x2: 30, y2: 52 },
    ],
  },
  {
    id: 'H',
    upper: 'H',
    lower: 'h',
    groupId: 5,
    phoneticText: 'hhh! Havuç ve helikopter derken nefes verir gibi hhh diyoruz.',
    soundHint: 'Hhh!',
    mascotWord: 'Havuç',
    mascotEmoji: '🥕',
    color: '#f97316',
    sticker: { id: 'stk_h', name: 'Turuncu Havuç', emoji: '🥕', islandTitle: 'Uzay İstasyonu' },
    words: [
      { word: 'Havuç', emoji: '🥕', syllables: ['Ha', 'vuç'], sentence: 'Turuncu kıtır havuç.' },
      { word: 'Helikopter', emoji: '🚁', syllables: ['He', 'li', 'kop', 'ter'], sentence: 'Helikopter pervane döndürdü.' },
      { word: 'Hediye', emoji: '🎁', syllables: ['He', 'di', 'ye'], sentence: 'Sürpriz hediye paketi.' },
    ],
    syllableTasks: [
      { parts: ['h', 'al'], result: 'hal', meaning: 'Halı ve kilim', emoji: '🧶' },
      { parts: ['ha', 'lı'], result: 'halı', meaning: 'Yumuşak halı', emoji: '🏠' },
      { parts: ['h', 'an'], result: 'han', meaning: 'Tarihi büyük han', emoji: '🏰' },
    ],
    tracePoints: [
      { x: 28, y: 18 },
      { x: 28, y: 82 },
      { x: 72, y: 18 },
      { x: 72, y: 82 },
      { x: 28, y: 50 },
      { x: 72, y: 50 },
    ],
    traceStrokes: [
      { x1: 28, y1: 18, x2: 28, y2: 82 },
      { x1: 72, y1: 18, x2: 72, y2: 82 },
      { x1: 28, y1: 50, x2: 72, y2: 50 },
    ],
  },
  {
    id: 'V',
    upper: 'V',
    lower: 'v',
    groupId: 5,
    phoneticText: 'vvv! Vazo ve vapur derken vvv sesini çıkarıyoruz.',
    soundHint: 'Vvv!',
    mascotWord: 'Vapur',
    mascotEmoji: '⛴️',
    color: '#3b82f6',
    sticker: { id: 'stk_v', name: 'Boğaz Vapuru', emoji: '⛴️', islandTitle: 'Uzay İstasyonu' },
    words: [
      { word: 'Vapur', emoji: '⛴️', syllables: ['Va', 'pur'], sentence: 'Beyaz vapur düdük çaldı.' },
      { word: 'Vazo', emoji: '🏺', syllables: ['Va', 'zo'], sentence: 'Çiçekleri vazoya koyduk.' },
      { word: 'Valiz', emoji: '🧳', syllables: ['Va', 'liz'], sentence: 'Tatil valizimiz hazır.' },
    ],
    syllableTasks: [
      { parts: ['e', 'v'], result: 'ev', meaning: 'Sıcak yuvamız ev', emoji: '🏡' },
      { parts: ['va', 'zo'], result: 'vazo', meaning: 'Çiçek vazosu', emoji: '🏺' },
      { parts: ['va', 'pur'], result: 'vapur', meaning: 'Deniz vapuru', emoji: '⛴️' },
    ],
    tracePoints: [
      { x: 24, y: 18 },
      { x: 50, y: 82 },
      { x: 76, y: 18 },
    ],
    traceStrokes: [
      { x1: 24, y1: 18, x2: 50, y2: 82 },
      { x1: 50, y1: 82, x2: 76, y2: 18 },
    ],
  },
  {
    id: 'Ğ',
    upper: 'Ğ',
    lower: 'ğ',
    groupId: 5,
    phoneticText: 'Yumuşak g! Ağaç ve dağ derken önceki sesi yumuşatıp uzatır.',
    soundHint: 'Ğğğ!',
    mascotWord: 'Ağaç',
    mascotEmoji: '🌳',
    color: '#16a34a',
    sticker: { id: 'stk_g2', name: 'Ulu Ağaç', emoji: '🌳', islandTitle: 'Uzay İstasyonu' },
    words: [
      { word: 'Ağaç', emoji: '🌳', syllables: ['A', 'ğaç'], sentence: 'Bahçedeki yemyeşil ağaç.' },
      { word: 'Dağ', emoji: '⛰️', syllables: ['Dağ'], sentence: 'Yüksek karlı dağ.' },
      { word: 'Yağmur', emoji: '🌧️', syllables: ['Yağ', 'mur'], sentence: 'Şıpır şıpır yağmur yağdı.' },
    ],
    syllableTasks: [
      { parts: ['d', 'ağ'], result: 'dağ', meaning: 'Yüksek dağ', emoji: '⛰️' },
      { parts: ['b', 'ağ'], result: 'bağ', meaning: 'Üzüm bağı', emoji: '🍇' },
      { parts: ['a', 'ğaç'], result: 'ağaç', meaning: 'Yeşil ağaç', emoji: '🌳' },
    ],
    tracePoints: [
      { x: 40, y: 12 },
      { x: 60, y: 12 },
      { x: 68, y: 28 },
      { x: 28, y: 54 },
      { x: 68, y: 80 },
      { x: 68, y: 56 },
    ],
    traceStrokes: [
      { x1: 40, y1: 12, x2: 60, y2: 12 },
      { x1: 68, y1: 28, x2: 28, y2: 54 },
      { x1: 28, y1: 54, x2: 68, y2: 80 },
      { x1: 68, y1: 80, x2: 68, y2: 56 },
    ],
  },
  {
    id: 'F',
    upper: 'F',
    lower: 'f',
    groupId: 5,
    phoneticText: 'fff! Fil ve fener derken mum üfler gibi fff diyoruz.',
    soundHint: 'Fff!',
    mascotWord: 'Fil',
    mascotEmoji: '🐘',
    color: '#8b5cf6',
    sticker: { id: 'stk_f', name: 'Sevimli Fil', emoji: '🐘', islandTitle: 'Uzay İstasyonu' },
    words: [
      { word: 'Fil', emoji: '🐘', syllables: ['Fil'], sentence: 'Büyük kulaklı sevimli fil.' },
      { word: 'Fare', emoji: '🐭', syllables: ['Fa', 're'], sentence: 'Minik fare peynir yedi.' },
      { word: 'Fener', emoji: '🔦', syllables: ['Fe', 'ner'], sentence: 'Deniz feneri ışık saçtı.' },
    ],
    syllableTasks: [
      { parts: ['f', 'il'], result: 'fil', meaning: 'Uzun hortumlu fil', emoji: '🐘' },
      { parts: ['fa', 're'], result: 'fare', meaning: 'Minik fare', emoji: '🐭' },
      { parts: ['fe', 'ner'], result: 'fener', meaning: 'Parlak fener', emoji: '🔦' },
    ],
    tracePoints: [
      { x: 30, y: 18 },
      { x: 30, y: 82 },
      { x: 72, y: 18 },
      { x: 64, y: 50 },
    ],
    traceStrokes: [
      { x1: 30, y1: 18, x2: 30, y2: 82 },
      { x1: 30, y1: 18, x2: 72, y2: 18 },
      { x1: 30, y1: 50, x2: 64, y2: 50 },
    ],
  },
  {
    id: 'J',
    upper: 'J',
    lower: 'j',
    groupId: 5,
    phoneticText: 'jjj! Jaguar ve jet derken jjj sesini çıkarıyoruz.',
    soundHint: 'Jjj!',
    mascotWord: 'Jaguar',
    mascotEmoji: '🐆',
    color: '#e11d48',
    sticker: { id: 'stk_j', name: 'Hızlı Jaguar', emoji: '🐆', islandTitle: 'Uzay İstasyonu' },
    words: [
      { word: 'Jaguar', emoji: '🐆', syllables: ['Ja', 'gu', 'ar'], sentence: 'Benekli jaguar hızlı koşar.' },
      { word: 'Jet', emoji: '🛩️', syllables: ['Jet'], sentence: 'Hızlı jet uçağı geçti.' },
      { word: 'Pijama', emoji: '🎽', syllables: ['Pi', 'ja', 'ma'], sentence: 'Yumuşacık pijamamı giydim.' },
    ],
    syllableTasks: [
      { parts: ['j', 'et'], result: 'jet', meaning: 'Hızlı jet uçağı', emoji: '🛩️' },
      { parts: ['ba', 'gaj'], result: 'bagaj', meaning: 'Arabanın bagajı', emoji: '🚗' },
      { parts: ['pl', 'aj'], result: 'plaj', meaning: 'Kumlu deniz plajı', emoji: '🏖️' },
    ],
    tracePoints: [
      { x: 64, y: 18 },
      { x: 64, y: 70 },
      { x: 46, y: 84 },
      { x: 28, y: 70 },
    ],
    traceStrokes: [
      { x1: 64, y1: 18, x2: 64, y2: 70 },
      { x1: 64, y1: 70, x2: 46, y2: 84 },
      { x1: 46, y1: 84, x2: 28, y2: 70 },
    ],
  },
]

/**
 * Maarif modeline göre, verilen harfe kadar öğrenilmiş harfleri döndürür.
 * Kural: Çocuklar harfleri sırayla öğrenir (A -> N -> E -> T -> İ -> L ...).
 * Harf 'A' için önceki harf olmadığından, yalnızca 'A' ve 'N' harflerini döndürür.
 * Harf 'N' için 'A' ve 'N' döndürür.
 * Harf 'E' için 'A', 'N' ve 'E' döndürür.
 */
export function getLearnedLetters(letterOrUpper: string | LetterCurriculum): LetterCurriculum[] {
  const upper = typeof letterOrUpper === 'string'
    ? letterOrUpper.toLocaleUpperCase('tr-TR')
    : letterOrUpper.upper
  const idx = LETTERS_DATA.findIndex((l) => l.upper === upper || l.id === upper)
  if (idx <= 0) {
    // 'A' harfi için kural: Yalnızca A ve N harfleri
    return LETTERS_DATA.slice(0, 2)
  }
  return LETTERS_DATA.slice(0, idx + 1)
}

/**
 * Verilen harf haricinde, o ana kadar öğrenilmiş çeldirici harfleri döndürür.
 * 'A' için -> ['N']
 * 'N' için -> ['A']
 * 'E' için -> ['A', 'N']
 * 'T' için -> ['A', 'N', 'E']
 */
export function getLearnedDistractorLetters(letterOrUpper: string | LetterCurriculum): LetterCurriculum[] {
  const upper = typeof letterOrUpper === 'string'
    ? letterOrUpper.toLocaleUpperCase('tr-TR')
    : letterOrUpper.upper
  const learned = getLearnedLetters(letterOrUpper)
  const distractors = learned.filter((l) => l.upper !== upper && l.id !== upper)
  if (distractors.length === 0) {
    const fallback = LETTERS_DATA.find((l) => l.upper !== upper)
    return fallback ? [fallback] : []
  }
  return distractors
}

