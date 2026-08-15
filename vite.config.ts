import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'ToastTurn',
        short_name: 'ToastTurn',
        description: 'Whose turn is it to make toast this week?',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#E9553D',
        background_color: '#DCE7EE',
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Fonts and the toaster have to be there on the kitchen dead-spot.
        globPatterns: ['**/*.{js,css,html,svg,png,woff,woff2}'],
      },
      devOptions: { enabled: true, type: 'module' },
    }),
  ],
  server: {
    port: Number(process.env.PORT) || 5173,
  },
  preview: {
    port: Number(process.env.PORT) || 4173,
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
