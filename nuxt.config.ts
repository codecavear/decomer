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
    '@nuxt/test-utils/module'
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
      titleTemplate: '%s - DeComer',
      meta: [
        { name: 'description', content: 'Crea tu tienda vegetariana o vegana. Plataforma para emprendedores plant-based.' },
        { name: 'theme-color', content: '#22c55e' },
        { property: 'og:title', content: 'DeComer - Viandas saludables por suscripcion' },
        { property: 'og:description', content: 'Plataforma para crear y gestionar tu tienda vegetariana o vegana.' },
        { property: 'og:image', content: 'https://decomer.codecave.ar/og-image.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:type', content: 'website' },
        { property: 'og:url', content: 'https://decomer.codecave.ar' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:title', content: 'DeComer - Viandas saludables por suscripcion' },
        { name: 'twitter:description', content: 'Plataforma para emprendedores plant-based.' },
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
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://decomer.codecave.ar',
      googleMapsApiKey: process.env.NUXT_PUBLIC_GOOGLE_MAPS_API_KEY
    }
  },

  routeRules: {
    // Pages that require session - disable prerender
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
      crawlLinks: true,
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
