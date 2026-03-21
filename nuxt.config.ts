// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    '@nuxt/eslint',
    '@nuxt/image',
    '@nuxt/ui',
    '@vueuse/nuxt',
    'nuxt-auth-utils',
    '@nuxtjs/i18n',
    '@nuxtjs/sitemap',
    '@vite-pwa/nuxt',
    ...(process.env.NODE_ENV === 'test' ? ['@nuxt/test-utils/module'] : [])
  ],

  devtools: {
    enabled: true
  },

  app: {
    head: {
      htmlAttrs: {
        lang: 'es'
      },
      title: 'DeComer',
      titleTemplate: '%s | DeComer',
      meta: [
        { name: 'description', content: 'Viandas saludables, cocinadas hoy, en tu puerta mañana. Sin congelar. Suscripción semanal o pedido único. Delivery en Córdoba Capital.' },
        { name: 'theme-color', content: '#22c55e' },
        { property: 'og:site_name', content: 'DeComer' },
        { property: 'og:title', content: 'DeComer — Viandas frescas, nunca congeladas' },
        { property: 'og:description', content: 'Comes bien, nosotros cocinamos. Viandas saludables con delivery en Córdoba. Suscribite o pedí cuando quieras.' },
        { property: 'og:image', content: 'https://decomer.codecave.ar/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://decomer.codecave.ar' },
        { property: 'og:locale', content: 'es_AR' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'DeComer — Viandas frescas por suscripción' },
        { name: 'twitter:description', content: 'Comida real, cocinada hoy, en tu puerta mañana. Sin congelar. Córdoba Capital.' },
        { name: 'twitter:image', content: 'https://decomer.codecave.ar/og-image.png' }
      ],
      link: [
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '96x96', href: '/favicon-96x96.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
        { rel: 'canonical', href: 'https://decomer.codecave.ar' }
      ],
      script: [
        {
          'src': 'https://umami.codecave.ar/script.js',
          'defer': true,
          'data-website-id': '9ba99e88-51c9-4267-9727-32fb10171f80'
        }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

  site: {
    url: 'https://decomer.codecave.ar'
  },

  ui: {
    fonts: false
  },

  runtimeConfig: {
    sessionPassword: process.env.NUXT_SESSION_PASSWORD,
    cloudinary: {
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
      apiSecret: process.env.CLOUDINARY_API_SECRET
    },
    oauth: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET
      }
    },
    // Twilio (SMS/WhatsApp)
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID,
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN,
    twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER,
    twilioWhatsAppNumber: process.env.TWILIO_WHATSAPP_NUMBER,
    // MercadoPago
    mercadoPagoAccessToken: process.env.MERCADOPAGO_ACCESS_TOKEN,
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://decomer.codecave.ar',
      baseUrl: process.env.NUXT_PUBLIC_BASE_URL || 'https://decomer.codecave.ar',
      googleMapsApiKey: process.env.NUXT_PUBLIC_GOOGLE_MAPS_API_KEY,
      // VAPID public key for Web Push (set VAPID_PUBLIC_KEY in env)
      vapidPublicKey: process.env.VAPID_PUBLIC_KEY || ''
    }
  },

  routeRules: {
    '/panel/**': { prerender: false },
    '/carrito': { prerender: false },
    '/favoritos': { prerender: false },
    '/mis-pedidos': { prerender: false },
    '/crear-tienda': { prerender: false },
    '/auth/**': { prerender: false }
  },

  compatibilityDate: '2024-07-11',

  nitro: {
    prerender: {
      routes: [
        '/',
        '/buscar',
        '/login',
        '/pricing',
        '/blog'
      ],
      crawlLinks: false,
      failOnError: false
    }
  },

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  },

  i18n: {
    locales: [
      { code: 'es', language: 'es-ES', name: 'Español', file: 'es.json' },
      { code: 'en', language: 'en-US', name: 'English', file: 'en.json' }
    ],
    defaultLocale: 'es',
    langDir: 'locales',
    strategy: 'no_prefix',
    detectBrowserLanguage: {
      useCookie: true,
      cookieKey: 'i18n_redirected',
      redirectOn: 'root',
      alwaysRedirect: false,
      fallbackLocale: 'es'
    }
  },

  pwa: {
    registerType: 'autoUpdate',
    manifest: false,
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,png,svg,ico,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^\/api\/viandas/,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'viandas-cache',
            expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 6 }
          }
        }
      ]
    },
    client: {
      installPrompt: true,
      periodicSyncForUpdates: 3600
    },
    devOptions: {
      enabled: false
    }
  },

  sitemap: {
    exclude: [
      '/panel/**',
      '/carrito',
      '/favoritos',
      '/mis-pedidos',
      '/crear-tienda',
      '/auth/**',
      '/login'
    ],
    sources: [
      '/api/__sitemap__/urls'
    ],
    defaults: {
      changefreq: 'weekly',
      priority: 0.5
    }
  }
})
