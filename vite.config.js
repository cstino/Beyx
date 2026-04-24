import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'icon-512.png'],
      manifest: {
        name: 'BeyManager X',
        short_name: 'BeyX',
        description: 'Elite Beyblade X Companion',
        theme_color: '#0A0A1A',
        background_color: '#0A0A1A',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000
  }
})
