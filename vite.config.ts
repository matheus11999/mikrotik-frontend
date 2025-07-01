import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
      jsxImportSource: 'react',
      babel: {
        plugins: [
          ['@emotion/babel-plugin', { autoLabel: 'dev-only' }]
        ]
      }
    }),
    // @ts-ignore – compatibilidade de tipos entre versões do Vite
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'img/logo-white.png'],
      manifest: {
        name: 'MikroPix',
        short_name: 'MikroPix',
        description: 'Sistema de gestão MikroTik',
        theme_color: '#000000',
        background_color: '#000000',
        display: 'standalone',
        icons: [
          {
            src: '/img/logo-white.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/img/logo-white.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    // Configurações melhoradas para HMR
    hmr: {
      overlay: true,
      port: 5174
    },
    watch: {
      usePolling: false,
      interval: 100,
    },
    // Configuração do proxy melhorada
    proxy: {
      '/api': {
        target: 'https://api.mikropix.online',
        changeOrigin: true,
        secure: true,
        rewrite: (path) => path,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
        },
      }
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
    // Configurações de build otimizadas
    target: 'esnext',
    sourcemap: true,
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom', 
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'framer-motion',
      '@emotion/react',
      '@emotion/styled'
    ],
    exclude: ['@tanstack/react-query'],
    force: true,
    esbuildOptions: {
      target: 'esnext',
      jsx: 'automatic'
    }
  },
  esbuild: {
    jsx: 'automatic',
    jsxImportSource: 'react'
  },
  define: {
    // Configurações para React Router
    __REACT_ROUTER_FUTURE_FLAGS__: JSON.stringify({
      v7_relativeSplatPath: true,
      v7_startTransition: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    }),
    // Configurações de ambiente
    __DEV__: JSON.stringify(true),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development')
  },
})
