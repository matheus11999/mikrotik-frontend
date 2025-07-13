import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Detectar se estamos usando API externa
  const useExternalAPI = process.env.VITE_API_URL && process.env.VITE_API_URL.startsWith('http')
  
  console.log('Vite Config:', {
    mode,
    VITE_API_URL: process.env.VITE_API_URL,
    useExternalAPI
  })

  return {
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
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'img/logo-white.png'],
        manifest: {
          name: 'MikroPix - Sistema de Gestão MikroTik',
          short_name: 'MikroPix',
          description: 'Sistema completo de gestão para dispositivos MikroTik e hotspots',
          theme_color: '#3b82f6',
          background_color: '#000000',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/?source=pwa',
          lang: 'pt-BR',
          categories: ['business', 'productivity', 'utilities'],
          icons: [
            {
              src: '/img/logo-white.png',
              sizes: '72x72',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/img/logo-white.png',
              sizes: '96x96',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/img/logo-white.png',
              sizes: '128x128',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/img/logo-white.png',
              sizes: '144x144',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/img/logo-white.png',
              sizes: '152x152',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/img/logo-white.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: '/img/logo-white.png',
              sizes: '384x384',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/img/logo-white.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          navigateFallback: '/index.html',
          navigateFallbackAllowlist: [/^\/[^/]*$/],
          // Forçar limpeza de cache em novos builds
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          // Aumentar limite de tamanho de arquivo para cache (3MB)
          maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
          // Configurar caching strategy mais agressiva para atualizações
          cacheId: `mikropix-${Date.now()}`,
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                }
              }
            },
            {
              urlPattern: /\.(js|css|html)$/,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'static-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 // 24 hours
                }
              }
            },
            {
              urlPattern: /^https:\/\/api\.mikropix\.online\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 5 // 5 minutes
                }
              }
            }
          ]
        },
        devOptions: {
          enabled: true,
          type: 'module',
          navigateFallback: '/index.html'
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
      hmr: {
        overlay: true,
        port: 5174
      },
      watch: {
        usePolling: false,
        interval: 100,
      },
      // Desabilitar cache completamente em desenvolvimento
      headers: mode === 'development' ? {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      } : {},
      // Configurar proxy apenas quando não estamos usando API externa
      proxy: useExternalAPI ? undefined : {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          secure: false,
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
          // Adicionar timestamp para forçar limpeza de cache
          entryFileNames: `[name]-[hash]-${Date.now()}.js`,
          chunkFileNames: `[name]-[hash]-${Date.now()}.js`,
          assetFileNames: `[name]-[hash]-${Date.now()}.[ext]`,
        },
      },
      target: 'esnext',
      sourcemap: true,
      // Forçar rebuild completo
      emptyOutDir: true,
      // Minificar assets
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
        },
      },
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
      // Forçar rebuild de dependências em desenvolvimento
      force: mode === 'development',
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
      __REACT_ROUTER_FUTURE_FLAGS__: JSON.stringify({
        v7_relativeSplatPath: true,
        v7_startTransition: true,
        v7_fetcherPersist: true,
        v7_normalizeFormMethod: true,
        v7_partialHydration: true,
        v7_skipActionErrorRevalidation: true,
      }),
      __DEV__: JSON.stringify(mode === 'development'),
      'process.env.NODE_ENV': JSON.stringify(mode)
    },
  }
})
