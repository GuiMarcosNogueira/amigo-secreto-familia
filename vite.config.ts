import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { apiLocalDeListas } from './servidor/pluginVite.js';

export default defineConfig({
  plugins: [
    react(),
    // Em `npm run dev` e `npm run preview`, a API de listas roda aqui mesmo, em memória.
    apiLocalDeListas(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.ico', 'icone.svg', 'apple-touch-icon-180x180.png'],
      manifest: {
        name: 'Amigo Secreto da Família',
        short_name: 'Amigo Secreto',
        description: 'Sorteio de Amigo Secreto justo e privado, direto no celular.',
        lang: 'pt-BR',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#a3262a',
        background_color: '#fdf8f3',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        // Roteamento por hash: toda navegação é para "/". A API nunca passa pelo cache.
        navigateFallbackDenylist: [/^\/api\//],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'servidor/**/*.test.ts'],
  },
});
