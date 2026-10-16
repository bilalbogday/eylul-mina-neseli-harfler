import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
      manifest: {
        name: 'Eylül Mina Neşeli Harfler',
        short_name: 'Neşeli Harfler',
        description: '6 Yaş Çocuklar İçin Türkiye Yüzyılı Maarif Modeli Okuma-Yazma ve Ses Öğrenme Macerası',
        lang: 'tr-TR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#fff9f0',
        theme_color: '#ff6b6b',
        icons: [
          { src: '/pwa-icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
          { src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
    }),
  ],
})
