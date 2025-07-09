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
        registerType: 'prompt',
        includeAssets: ['favicon.ico', 'robots.txt'],
        manifest: {
          name: 'MikroPix',
          short_name: 'MikroPix',
          description: 'Sistema de gestão MikroTik',
          theme_color: '#3b82f6',
          background_color: '#000000',
          display: 'standalone',
          scope: '/',
          start_url: '/',
          lang: 'pt-BR',
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
        workbox: {
          navigateFallback: '/index.html',
          navigateFallbackAllowlist: [/^\/[^/]*$/],
          // Forçar limpeza de cache em novos builds
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
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
          enabled: false
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
