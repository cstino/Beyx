import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'beyx_icon.svg', 'beyx_icon512.png', 'assets/academy/*.png'],
      manifest: {
        name: 'BeyManager X',
        short_name: 'BeyX',
        description: 'Elite Beyblade X Companion',
        theme_color: '#0A0A1A', // quasi nero ma pastello
        background_color: '#0A0A1A', // sfondo caricamento (splash screen)
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: '/beyx_icon.svg',
            sizes: 'any',
            type: 'image/svg+xml',
            purpose: 'any'
          },
          {
            src: '/beyx_icon512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      }
    })
  ],
  server: {
    port: 3000
  }
})
