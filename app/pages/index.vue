<script setup lang="ts">
import type { Category, StoreWithRelations, StoreListResponse } from '~/types'

const { t } = useI18n()
const router = useRouter()

useSeoMeta({
  titleTemplate: '',
  title: t('home.seo.title'),
  ogTitle: t('home.seo.title'),
  description: t('home.seo.description'),
  ogDescription: t('home.seo.description'),
  ogImage: '/og-image.png',
  twitterCard: 'summary_large_image'
})

// Structured data for SEO
useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        'name': 'DeComer',
        'description': 'Plataforma para descubrir tiendas veganas y vegetarianas en Argentina',
        'applicationCategory': 'LifestyleApplication',
        'operatingSystem': 'Web',
        'offers': {
          '@type': 'Offer',
          'price': '0',
          'priceCurrency': 'ARS'
        }
      })
    }
  ]
})

const { filterCities } = useCities()
const searchCity = ref('')
const isDetectingLocation = ref(false)
const showCitySuggestions = ref(false)
const filteredCitySuggestions = computed(() => filterCities(searchCity.value).slice(0, 6))

const selectCity = (city: string) => {
  searchCity.value = city
  showCitySuggestions.value = false
}

const handleSearch = () => {
  if (searchCity.value.trim()) {
    const encodedCity = encodeURIComponent(searchCity.value)
    router.push(`/buscar?ciudad=${encodedCity}`)
  } else {
    router.push('/buscar')
  }
}

const detectLocation = async () => {
  if (!navigator.geolocation) {
    return
  }

  isDetectingLocation.value = true

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject)
    })

    const { latitude, longitude } = position.coords
    router.push(`/buscar?lat=${latitude}&lng=${longitude}`)
  } catch (error) {
    console.error('Error detecting location:', error)
  } finally {
    isDetectingLocation.value = false
  }
}

const features = computed(() => [
  {
    title: t('home.features.discover.title'),
    description: t('home.features.discover.description'),
    icon: 'i-lucide-store',
    color: 'success' as const
  },
  {
    title: t('home.features.order.title'),
    description: t('home.features.order.description'),
    icon: 'i-lucide-shopping-bag',
    color: 'primary' as const
  },
  {
    title: t('home.features.review.title'),
    description: t('home.features.review.description'),
    icon: 'i-lucide-star',
    color: 'warning' as const
  }
])

interface StoreWithExtras extends StoreWithRelations {
  primaryCategory?: string
  rating?: number
  reviewCount?: number
}

const { data: categories, pending: categoriesPending } = await useFetch<Category[]>('/api/categories', {
  default: () => []
})

const { data: storesResponse, pending: storesPending } = await useFetch<StoreListResponse>('/api/stores', {
  query: { limit: 6 },
  default: () => ({ stores: [], limit: 6, offset: 0 })
})

const stores = computed<StoreWithExtras[]>(() => storesResponse.value?.stores as StoreWithExtras[] || [])

// Platform stats
const { data: platformStats } = await useFetch('/api/stats', {
  default: () => ({ stores: 0, products: 0, reviews: 0 })
})

// Safe testimonials array to prevent SSR issues with i18n returnObjects
const testimonials = computed(() => {
  const items = t('home.testimonials.items', {}, { returnObjects: true })
  return Array.isArray(items) ? items : []
})
</script>

<template>
  <div>
    <!-- Hero Section with Enhanced Gradient -->
    <section class="relative overflow-hidden bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 dark:from-emerald-600 dark:via-green-700 dark:to-teal-800">
      <!-- Animated Background Pattern -->
      <div class="absolute inset-0 opacity-10">
        <div
          class="absolute inset-0"
          style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 40px 40px;"
        />
      </div>

      <!-- Floating Vegetables/Leaves Decorations -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <!-- Floating leaf 1 -->
        <div class="absolute top-20 left-[10%] w-20 h-20 opacity-20 animate-float">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            class="text-white drop-shadow-lg"
          >
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
          </svg>
        </div>
        <!-- Floating leaf 2 -->
        <div class="absolute top-32 right-[15%] w-24 h-24 opacity-15 animate-float-delayed">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            class="text-white drop-shadow-lg"
          >
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
          </svg>
        </div>
        <!-- Floating leaf 3 -->
        <div class="absolute bottom-20 left-[20%] w-16 h-16 opacity-25 animate-float-slow">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            class="text-white drop-shadow-lg"
          >
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
          </svg>
        </div>
        <!-- Floating leaf 4 -->
        <div class="absolute top-40 right-[25%] w-18 h-18 opacity-10 animate-float">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            class="text-white drop-shadow-lg"
          >
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
          </svg>
        </div>
        <!-- Floating leaf 5 -->
        <div class="absolute bottom-32 right-[10%] w-22 h-22 opacity-15 animate-float-delayed">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            class="text-white drop-shadow-lg"
          >
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
          </svg>
        </div>
        <!-- Additional floating elements -->
        <div class="absolute top-1/2 left-[5%] w-14 h-14 opacity-20 animate-float-slow">
          <svg
            viewBox="0 0 24 24"
            fill="currentColor"
            class="text-white drop-shadow-lg"
          >
            <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,8 17,8 17,8Z" />
          </svg>
        </div>
      </div>

      <UContainer class="relative py-24 lg:py-32">
        <div class="text-center max-w-5xl mx-auto">
          <!-- Badge/Tag -->
          <div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-white mb-6 animate-fade-in">
            <UIcon
              name="i-lucide-sparkles"
              class="size-4"
            />
            <span class="text-sm font-medium">Tu guía definitiva para vivir vegano en Argentina</span>
          </div>

          <!-- Headline -->
          <h1 class="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white mb-6 lg:mb-8 leading-tight tracking-tight">
            Descubrí el Mundo
            <span class="block mt-2 bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-300 bg-clip-text text-transparent animate-gradient">
              Vegano Cerca Tuyo
            </span>
          </h1>

          <!-- Subheadline -->
          <p class="text-xl sm:text-2xl text-white/95 mb-10 lg:mb-14 max-w-3xl mx-auto font-light leading-relaxed">
            {{ t('home.description') }}
          </p>

          <!-- Search Bar -->
          <div class="max-w-4xl mx-auto mb-10 relative z-20 animate-slide-up">
            <form
              class="relative"
              @submit.prevent="handleSearch"
            >
              <div class="flex flex-col sm:flex-row gap-3 bg-white dark:bg-gray-900 rounded-3xl shadow-2xl p-3 overflow-visible ring-4 ring-white/20 hover:ring-white/30 transition-all">
                <div class="relative flex-1 flex items-center gap-3 px-4">
                  <UIcon
                    name="i-lucide-map-pin"
                    class="size-6 text-emerald-500 shrink-0"
                  />
                  <input
                    v-model="searchCity"
                    type="text"
                    placeholder="¿Dónde querés comer vegano hoy?"
                    autocomplete="off"
                    class="flex-1 bg-transparent border-0 focus:outline-none focus:ring-0 text-gray-900 dark:text-white placeholder-gray-400 text-lg sm:text-xl py-4 sm:py-5 font-medium"
                    @focus="showCitySuggestions = true"
                    @blur="setTimeout(() => showCitySuggestions = false, 200)"
                  >

                  <!-- City Suggestions Dropdown -->
                  <div
                    v-if="showCitySuggestions && searchCity.length > 0 && filteredCitySuggestions.length > 0"
                    class="absolute z-[100] top-full left-0 right-0 mt-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden animate-slide-down"
                    style="position: absolute;"
                  >
                    <button
                      v-for="city in filteredCitySuggestions"
                      :key="city"
                      type="button"
                      class="w-full flex items-center gap-3 px-5 py-4 hover:bg-emerald-50 dark:hover:bg-gray-700 transition-all text-left text-gray-900 dark:text-white group"
                      @mousedown.prevent="selectCity(city)"
                    >
                      <UIcon
                        name="i-lucide-map-pin"
                        class="size-5 text-emerald-500 group-hover:scale-110 transition-transform"
                      />
                      <span class="font-medium">{{ city }}</span>
                    </button>
                  </div>
                </div>

                <div class="flex gap-3">
                  <UButton
                    type="button"
                    color="neutral"
                    variant="soft"
                    size="xl"
                    :loading="isDetectingLocation"
                    icon="i-lucide-locate-fixed"
                    square
                    class="shrink-0 hover:scale-105 transition-transform"
                    :aria-label="isDetectingLocation ? 'Detectando ubicación...' : 'Detectar mi ubicación'"
                    @click="detectLocation"
                  />

                  <UButton
                    type="submit"
                    color="primary"
                    size="lg"
                    icon="i-lucide-search"
                    class="shrink-0 rounded-2xl font-semibold"
                  >
                    <span class="hidden sm:inline">Buscar</span>
                  </UButton>
                </div>
              </div>
            </form>
          </div>

          <!-- Quick Category Chips -->
          <div
            v-if="!categoriesPending && categories && categories.length > 0"
            class="flex flex-wrap justify-center gap-3 sm:gap-4 animate-fade-in-delayed"
          >
            <NuxtLink
              v-for="category in categories.slice(0, 6)"
              :key="category.id"
              :to="`/buscar?categoria=${category.slug}`"
              class="inline-flex items-center gap-2 px-5 py-2.5 rounded-full cursor-pointer hover:scale-110 transition-all duration-200 bg-white/25 hover:bg-white/40 backdrop-blur-md text-white border border-white/30 hover:border-white/50 shadow-lg hover:shadow-xl"
            >
              <UIcon
                v-if="category.icon"
                :name="category.icon"
                class="size-5"
              />
              <span class="font-medium">{{ category.name }}</span>
            </NuxtLink>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Features Section -->
    <section class="py-20 bg-gradient-to-b from-white to-gray-50 dark:from-gray-950 dark:to-gray-900">
      <UContainer>
        <div class="text-center mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            ¿Por qué elegir DeComer?
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            La plataforma pensada para que vivir vegano sea más fácil y accesible
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <div
            v-for="(feature, index) in features"
            :key="index"
            class="group relative"
          >
            <div class="relative p-8 rounded-3xl bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 h-full">
              <!-- Icon with gradient background -->
              <div class="inline-flex p-4 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                <UIcon
                  :name="feature.icon"
                  class="size-8 text-white"
                />
              </div>

              <!-- Content -->
              <h3 class="text-xl font-bold mb-3 text-gray-900 dark:text-white">
                {{ feature.title }}
              </h3>
              <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
                {{ feature.description }}
              </p>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- How It Works -->
    <section class="py-20 bg-white dark:bg-gray-950 relative overflow-hidden">
      <!-- Decorative background -->
      <div class="absolute inset-0 opacity-5">
        <div
          class="absolute inset-0"
          style="background-image: radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0); background-size: 32px 32px;"
        />
      </div>

      <UContainer class="relative">
        <div class="text-center mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            {{ t('home.howItWorks.title') }}
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {{ t('home.howItWorks.description') }}
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto relative">
          <!-- Connection lines (hidden on mobile) -->
          <div
            class="hidden md:block absolute top-12 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-200 via-emerald-400 to-emerald-200 dark:from-emerald-800 dark:via-emerald-600 dark:to-emerald-800"
            style="top: 48px; left: 20%; right: 20%;"
          />

          <!-- Step 1 -->
          <div class="text-center relative group">
            <div class="relative inline-flex items-center justify-center w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-xl group-hover:scale-110 transition-transform duration-300">
              <div class="absolute inset-0 rounded-full bg-white dark:bg-gray-950 m-1.5" />
              <span class="relative text-4xl font-bold bg-gradient-to-br from-emerald-500 to-teal-600 bg-clip-text text-transparent">1</span>
            </div>
            <h3 class="text-xl font-bold mb-3 text-gray-900 dark:text-white">
              {{ t('home.howItWorks.steps.search.title') }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
              {{ t('home.howItWorks.steps.search.description') }}
            </p>
          </div>

          <!-- Step 2 -->
          <div class="text-center relative group">
            <div class="relative inline-flex items-center justify-center w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-xl group-hover:scale-110 transition-transform duration-300">
              <div class="absolute inset-0 rounded-full bg-white dark:bg-gray-950 m-1.5" />
              <span class="relative text-4xl font-bold bg-gradient-to-br from-emerald-500 to-teal-600 bg-clip-text text-transparent">2</span>
            </div>
            <h3 class="text-xl font-bold mb-3 text-gray-900 dark:text-white">
              {{ t('home.howItWorks.steps.choose.title') }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
              {{ t('home.howItWorks.steps.choose.description') }}
            </p>
          </div>

          <!-- Step 3 -->
          <div class="text-center relative group">
            <div class="relative inline-flex items-center justify-center w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 shadow-xl group-hover:scale-110 transition-transform duration-300">
              <div class="absolute inset-0 rounded-full bg-white dark:bg-gray-950 m-1.5" />
              <span class="relative text-4xl font-bold bg-gradient-to-br from-emerald-500 to-teal-600 bg-clip-text text-transparent">3</span>
            </div>
            <h3 class="text-xl font-bold mb-3 text-gray-900 dark:text-white">
              {{ t('home.howItWorks.steps.order.title') }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400 leading-relaxed">
              {{ t('home.howItWorks.steps.order.description') }}
            </p>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Categories Section -->
    <section
      v-if="!categoriesPending && categories && categories.length > 0"
      class="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950"
    >
      <UContainer>
        <div class="text-center mb-12">
          <h2 class="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            {{ t('home.categories.title') }}
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {{ t('home.categories.description') }}
          </p>
        </div>

        <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <NuxtLink
            v-for="category in categories"
            :key="category.id"
            :to="`/buscar?categoria=${category.slug}`"
            class="block group"
          >
            <div class="relative p-6 rounded-2xl bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 h-full flex flex-col items-center text-center gap-4">
              <!-- Icon container with gradient -->
              <div class="p-4 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 group-hover:from-emerald-100 group-hover:to-teal-100 dark:group-hover:from-emerald-900 dark:group-hover:to-teal-900 transition-colors">
                <UIcon
                  :name="category.icon || 'i-lucide-leaf'"
                  class="size-10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform"
                />
              </div>

              <!-- Category name -->
              <h3 class="font-bold text-base text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                {{ category.name }}
              </h3>
            </div>
          </NuxtLink>
        </div>
      </UContainer>
    </section>

    <!-- Featured Stores -->
    <section
      v-if="!storesPending && stores && stores.length > 0"
      class="py-20 bg-white dark:bg-gray-950"
    >
      <UContainer>
        <div class="text-center mb-12">
          <h2 class="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            {{ t('home.stores.title') }}
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {{ t('home.stores.description') }}
          </p>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <NuxtLink
            v-for="store in stores"
            :key="store.id"
            :to="`/${store.slug}`"
            class="block group"
          >
            <div class="relative rounded-3xl bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 overflow-hidden h-full">
              <!-- Image container -->
              <div class="relative h-48 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 overflow-hidden">
                <img
                  v-if="store.logoUrl"
                  :src="store.logoUrl"
                  :alt="store.name"
                  class="w-full h-full object-contain p-6 group-hover:scale-110 transition-transform duration-300"
                >
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center"
                >
                  <UIcon
                    name="i-lucide-store"
                    class="size-20 text-emerald-300 dark:text-emerald-700"
                  />
                </div>
              </div>

              <!-- Content -->
              <div class="p-6">
                <h3 class="font-bold text-xl mb-3 text-gray-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                  {{ store.name }}
                </h3>

                <!-- Category badge -->
                <div
                  v-if="store.primaryCategory"
                  class="mb-3"
                >
                  <UBadge
                    :label="store.primaryCategory"
                    color="primary"
                    variant="soft"
                    size="md"
                    class="font-medium"
                  />
                </div>

                <!-- Rating -->
                <div
                  v-if="store.rating"
                  class="flex items-center gap-2"
                >
                  <div class="flex items-center gap-1">
                    <UIcon
                      name="i-lucide-star"
                      class="size-5 text-amber-400 fill-amber-400"
                    />
                    <span class="font-bold text-gray-900 dark:text-white">{{ store.rating.toFixed(1) }}</span>
                  </div>
                  <span
                    v-if="store.reviewCount"
                    class="text-sm text-gray-500 dark:text-gray-400"
                  >
                    ({{ store.reviewCount }} {{ store.reviewCount === 1 ? 'reseña' : 'reseñas' }})
                  </span>
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- CTA Button -->
        <div class="flex justify-center mt-12">
          <UButton
            to="/buscar"
            size="xl"
            variant="outline"
            color="primary"
            icon="i-lucide-arrow-right"
            trailing
            class="font-semibold hover:scale-105 transition-transform shadow-lg hover:shadow-xl px-8"
          >
            {{ t('search.viewAll') }}
          </UButton>
        </div>
      </UContainer>
    </section>

    <!-- Stats Section -->
    <section class="py-16 bg-gradient-to-r from-emerald-500 via-green-500 to-teal-600 dark:from-emerald-700 dark:via-green-800 dark:to-teal-900">
      <UContainer>
        <div class="grid grid-cols-3 gap-8 max-w-3xl mx-auto text-center">
          <div>
            <p class="text-4xl sm:text-5xl font-extrabold text-white">
              {{ platformStats.stores }}+
            </p>
            <p class="text-white/80 mt-2 font-medium">
              Tiendas activas
            </p>
          </div>
          <div>
            <p class="text-4xl sm:text-5xl font-extrabold text-white">
              {{ platformStats.products }}+
            </p>
            <p class="text-white/80 mt-2 font-medium">
              Productos veganos
            </p>
          </div>
          <div>
            <p class="text-4xl sm:text-5xl font-extrabold text-white">
              {{ platformStats.reviews }}+
            </p>
            <p class="text-white/80 mt-2 font-medium">
              Reseñas
            </p>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Testimonials Section -->
    <section class="py-20 bg-white dark:bg-gray-950 relative overflow-hidden">
      <!-- Decorative quote marks -->
      <div class="absolute top-20 left-10 text-9xl font-serif text-emerald-100 dark:text-emerald-900/30 pointer-events-none select-none">
        "
      </div>
      <div class="absolute bottom-20 right-10 text-9xl font-serif text-emerald-100 dark:text-emerald-900/30 pointer-events-none select-none rotate-180">
        "
      </div>

      <UContainer class="relative">
        <div class="text-center mb-16">
          <h2 class="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            {{ t('home.testimonials.title') }}
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {{ t('home.testimonials.description') }}
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8 lg:gap-10">
          <!-- Testimonial Cards -->
          <div
            v-for="(testimonial, index) in testimonials"
            :key="index"
            class="relative group"
          >
            <div class="relative p-8 rounded-3xl bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 h-full flex flex-col">
              <!-- Rating stars -->
              <div class="flex gap-1 mb-5">
                <UIcon
                  v-for="star in 5"
                  :key="star"
                  name="i-lucide-star"
                  class="size-5 text-amber-400 fill-amber-400"
                />
              </div>

              <!-- Quote -->
              <blockquote class="text-gray-700 dark:text-gray-300 leading-relaxed mb-6 flex-1 text-lg">
                "{{ testimonial.quote }}"
              </blockquote>

              <!-- Author -->
              <div class="flex items-center gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                <!-- Avatar placeholder with initials -->
                <div class="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  {{ testimonial?.name ? testimonial.name.split(' ').map(n => n?.[0] || '').join('').slice(0, 2) : '?' }}
                </div>

                <div class="flex-1">
                  <p class="font-bold text-gray-900 dark:text-white">
                    {{ testimonial.name }}
                  </p>
                  <p class="text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                    {{ testimonial.store }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ testimonial.role }} · {{ testimonial.location }}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Pricing Preview Section -->
    <section
      id="pricing"
      class="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950"
    >
      <UContainer>
        <div class="text-center mb-12">
          <h2 class="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            {{ t('home.pricing.title') }}
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {{ t('home.pricing.description') }}
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <!-- Free -->
          <div class="relative p-8 rounded-3xl bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div class="text-center">
              <div class="inline-flex p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 mb-4">
                <UIcon
                  name="i-lucide-leaf"
                  class="size-8 text-emerald-600 dark:text-emerald-400"
                />
              </div>
              <h3 class="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                {{ t('home.pricing.free.title') }}
              </h3>
              <p class="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-6">
                $0<span class="text-base font-normal text-gray-500">/mes</span>
              </p>
              <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-3 mb-8 text-left">
                <li class="flex items-center gap-3">
                  <UIcon
                    name="i-lucide-check"
                    class="text-emerald-500 size-5 flex-shrink-0"
                  />
                  {{ t('home.pricing.free.products') }}
                </li>
                <li class="flex items-center gap-3">
                  <UIcon
                    name="i-lucide-check"
                    class="text-emerald-500 size-5 flex-shrink-0"
                  />
                  {{ t('home.pricing.free.store') }}
                </li>
                <li class="flex items-center gap-3">
                  <UIcon
                    name="i-lucide-check"
                    class="text-emerald-500 size-5 flex-shrink-0"
                  />
                  {{ t('home.pricing.free.commission') }}
                </li>
              </ul>
              <UButton
                to="/crear-tienda"
                color="neutral"
                variant="outline"
                size="lg"
                block
                class="font-semibold"
              >
                {{ t('home.pricing.start') }}
              </UButton>
            </div>
          </div>

          <!-- Pro -->
          <div class="relative p-8 rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 border-2 border-emerald-400 shadow-2xl scale-105 z-10">
            <UBadge
              color="warning"
              variant="solid"
              class="absolute -top-3 left-1/2 -translate-x-1/2 font-bold"
            >
              Popular
            </UBadge>
            <div class="text-center">
              <div class="inline-flex p-3 rounded-xl bg-white/20 mb-4">
                <UIcon
                  name="i-lucide-zap"
                  class="size-8 text-white"
                />
              </div>
              <h3 class="text-xl font-bold mb-2 text-white">
                Pro
              </h3>
              <p class="text-4xl font-bold text-white mb-6">
                $9.990<span class="text-base font-normal text-white/70">/mes</span>
              </p>
              <ul class="text-sm text-white/90 space-y-3 mb-8 text-left">
                <li class="flex items-center gap-3">
                  <UIcon
                    name="i-lucide-check"
                    class="text-yellow-300 size-5 flex-shrink-0"
                  />
                  {{ t('home.pricing.pro.products') }}
                </li>
                <li class="flex items-center gap-3">
                  <UIcon
                    name="i-lucide-check"
                    class="text-yellow-300 size-5 flex-shrink-0"
                  />
                  {{ t('home.pricing.pro.stores') }}
                </li>
                <li class="flex items-center gap-3">
                  <UIcon
                    name="i-lucide-check"
                    class="text-yellow-300 size-5 flex-shrink-0"
                  />
                  {{ t('home.pricing.pro.commission') }}
                </li>
              </ul>
              <UButton
                to="/pricing"
                color="white"
                size="lg"
                block
                class="font-semibold text-emerald-600"
              >
                {{ t('home.pricing.see') }}
              </UButton>
            </div>
          </div>

          <!-- Business -->
          <div class="relative p-8 rounded-3xl bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div class="text-center">
              <div class="inline-flex p-3 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950 dark:to-teal-950 mb-4">
                <UIcon
                  name="i-lucide-rocket"
                  class="size-8 text-emerald-600 dark:text-emerald-400"
                />
              </div>
              <h3 class="text-xl font-bold mb-2 text-gray-900 dark:text-white">
                Business
              </h3>
              <p class="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-6">
                $29.990<span class="text-base font-normal text-gray-500">/mes</span>
              </p>
              <ul class="text-sm text-gray-600 dark:text-gray-400 space-y-3 mb-8 text-left">
                <li class="flex items-center gap-3">
                  <UIcon
                    name="i-lucide-check"
                    class="text-emerald-500 size-5 flex-shrink-0"
                  />
                  {{ t('home.pricing.business.products') }}
                </li>
                <li class="flex items-center gap-3">
                  <UIcon
                    name="i-lucide-check"
                    class="text-emerald-500 size-5 flex-shrink-0"
                  />
                  {{ t('home.pricing.business.stores') }}
                </li>
                <li class="flex items-center gap-3">
                  <UIcon
                    name="i-lucide-check"
                    class="text-emerald-500 size-5 flex-shrink-0"
                  />
                  {{ t('home.pricing.business.commission') }}
                </li>
              </ul>
              <UButton
                to="/pricing"
                color="neutral"
                variant="outline"
                size="lg"
                block
                class="font-semibold"
              >
                {{ t('home.pricing.see') }}
              </UButton>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Integrations Section -->
    <section class="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-950">
      <UContainer>
        <div class="text-center mb-12">
          <h2 class="text-3xl sm:text-4xl font-bold mb-4 text-gray-900 dark:text-white">
            {{ t('home.integrations.title') }}
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            {{ t('home.integrations.description') }}
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          <!-- MercadoPago -->
          <div class="text-center p-8 rounded-3xl bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 hover:border-[#00b1ea] transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#00b1ea]/10 flex items-center justify-center">
              <UIcon
                name="i-simple-icons-mercadopago"
                class="size-8 text-[#00b1ea]"
              />
            </div>
            <h3 class="text-lg font-bold mb-3 text-gray-900 dark:text-white">
              {{ t('home.integrations.mercadopago.title') }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              {{ t('home.integrations.mercadopago.description') }}
            </p>
          </div>

          <!-- WhatsApp -->
          <div class="text-center p-8 rounded-3xl bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 hover:border-[#25d366] transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#25d366]/10 flex items-center justify-center">
              <UIcon
                name="i-simple-icons-whatsapp"
                class="size-8 text-[#25d366]"
              />
            </div>
            <h3 class="text-lg font-bold mb-3 text-gray-900 dark:text-white">
              {{ t('home.integrations.whatsapp.title') }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              {{ t('home.integrations.whatsapp.description') }}
            </p>
          </div>

          <!-- Google Business -->
          <div class="text-center p-8 rounded-3xl bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 hover:border-[#4285f4] transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div class="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#4285f4]/10 flex items-center justify-center">
              <UIcon
                name="i-simple-icons-googlemybusiness"
                class="size-8 text-[#4285f4]"
              />
            </div>
            <h3 class="text-lg font-bold mb-3 text-gray-900 dark:text-white">
              {{ t('home.integrations.google.title') }}
            </h3>
            <p class="text-gray-600 dark:text-gray-400">
              {{ t('home.integrations.google.description') }}
            </p>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- CTA Section -->
    <section class="py-24 bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 dark:from-emerald-600 dark:via-green-700 dark:to-teal-800 relative overflow-hidden">
      <!-- Decorative elements -->
      <div class="absolute inset-0 opacity-10">
        <div
          class="absolute inset-0"
          style="background-image: radial-gradient(circle at 2px 2px, white 1px, transparent 0); background-size: 40px 40px;"
        />
      </div>
      <div class="absolute top-10 left-10 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
      <div class="absolute bottom-10 right-10 w-60 h-60 rounded-full bg-white/10 blur-3xl" />

      <UContainer class="relative text-center">
        <h2 class="text-4xl sm:text-5xl font-bold text-white mb-6">
          {{ t('home.cta.owner.title') }}
        </h2>
        <p class="text-xl text-white/90 mb-10 max-w-2xl mx-auto">
          {{ t('home.cta.owner.description') }}
        </p>
        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <UButton
            to="/crear-tienda"
            size="xl"
            color="white"
            icon="i-lucide-plus-circle"
            class="font-bold text-emerald-600 hover:scale-105 transition-transform shadow-xl px-8"
          >
            {{ t('home.cta.owner.button') }}
          </UButton>
          <UButton
            to="/demo"
            size="xl"
            variant="outline"
            color="white"
            icon="i-lucide-play"
            class="font-semibold hover:bg-white/10 hover:scale-105 transition-all px-8"
          >
            {{ t('search.viewDemo') }}
          </UButton>
        </div>
      </UContainer>
    </section>
  </div>
</template>

<style scoped>
/* Floating animations for decorative elements */
@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-25px) rotate(8deg);
  }
}

@keyframes float-delayed {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-35px) rotate(-8deg);
  }
}

@keyframes float-slow {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(5deg);
  }
}

.animate-float {
  animation: float 7s ease-in-out infinite;
}

.animate-float-delayed {
  animation: float-delayed 9s ease-in-out infinite;
  animation-delay: 1.5s;
}

.animate-float-slow {
  animation: float-slow 11s ease-in-out infinite;
  animation-delay: 2.5s;
}

/* Fade in animations */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes gradient {
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
}

.animate-fade-in {
  animation: fadeIn 0.8s ease-out;
}

.animate-fade-in-delayed {
  animation: fadeIn 1s ease-out 0.3s both;
}

.animate-slide-up {
  animation: slideUp 0.8s ease-out;
}

.animate-slide-down {
  animation: slideDown 0.3s ease-out;
}

.animate-gradient {
  background-size: 200% 200%;
  animation: gradient 8s ease infinite;
}
</style>
