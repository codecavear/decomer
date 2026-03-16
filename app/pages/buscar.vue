<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const { t } = useI18n()
const { filterCities } = useCities()
const { storeTypes } = useStoreTypes()

useSeoMeta({
  title: t('search.seo.title'),
  description: t('search.seo.description')
})

// Query params
const searchQuery = ref(route.query.q as string || '')
const selectedCity = ref(route.query.ciudad as string || '')
const selectedCategories = ref<string[]>(
  route.query.categoria
    ? Array.isArray(route.query.categoria)
      ? route.query.categoria as string[]
      : [route.query.categoria as string]
    : []
)
const selectedType = ref(route.query.tipo as string || '')
const radius = ref(parseFloat(route.query.radio as string || '10'))
const viewMode = ref<'list' | 'map'>('list')

// Geolocation
const userLocation = ref<{ lat: number, lng: number } | null>(null)
const locationError = ref<string | null>(null)

// Fetch categories
const { data: categories } = await useFetch('/api/categories', {
  default: () => []
})

// Fetch stores with filters
const { data: storesData, pending, _refresh } = await useFetch('/api/stores', {
  query: computed(() => ({
    q: searchQuery.value || undefined,
    city: selectedCity.value || undefined,
    categoria: selectedCategories.value.length > 0 ? selectedCategories.value.join(',') : undefined,
    tipo: selectedType.value || undefined,
    lat: userLocation.value?.lat,
    lng: userLocation.value?.lng,
    radio: radius.value
  })),
  default: () => ({ stores: [] }),
  watch: false
})

const stores = computed(() => storesData.value.stores || [])

// Request user's location
const requestLocation = async () => {
  if (!navigator.geolocation) {
    locationError.value = t('search.locationUnavailable')
    return
  }

  try {
    const position = await new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject)
    })

    userLocation.value = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    }
    locationError.value = null
    await _refresh()
  } catch {
    locationError.value = t('search.locationError')
  }
}

// Toggle category
const toggleCategory = (slug: string) => {
  const index = selectedCategories.value.indexOf(slug)
  if (index > -1) {
    selectedCategories.value.splice(index, 1)
  } else {
    selectedCategories.value.push(slug)
  }
}

// City autocomplete - for input menu we need string array
const cityInputValue = ref(selectedCity.value)
const filteredCities = computed(() => filterCities(cityInputValue.value))

// Sync city selection
watch(selectedCity, (val) => {
  cityInputValue.value = val
})

// Search suggestions
const searchSuggestions = ref<{ stores: unknown[], products: unknown[] }>({ stores: [], products: [] })
const showSuggestions = ref(false)

// Fetch suggestions when typing
watchDebounced(
  searchQuery,
  async (q) => {
    if (!q || q.length < 2) {
      searchSuggestions.value = { stores: [], products: [] }
      showSuggestions.value = false
      return
    }

    try {
      const data = await $fetch('/api/search/suggestions', {
        query: { q }
      })
      searchSuggestions.value = data as { stores: unknown[], products: unknown[] }
      showSuggestions.value = true
    } catch {
      searchSuggestions.value = { stores: [], products: [] }
    }
  },
  { debounce: 200 }
)

const hasSuggestions = computed(() =>
  searchSuggestions.value.stores.length > 0 || searchSuggestions.value.products.length > 0
)

const navigateToStore = (slug: string) => {
  showSuggestions.value = false
  navigateTo(`/${slug}`)
}

const closeSuggestions = () => {
  showSuggestions.value = false
}

// Update URL with query params (removed, now using watch)
// Clear all filters
const clearFilters = () => {
  searchQuery.value = ''
  selectedCity.value = ''
  selectedCategories.value = []
  selectedType.value = ''
  radius.value = 10
  userLocation.value = null
}

// Watch for changes with debounce and _refresh
watchDebounced(
  [searchQuery, selectedCity, selectedCategories, selectedType, radius],
  () => {
    const query: Record<string, unknown> = {}

    if (searchQuery.value) query.q = searchQuery.value
    if (selectedCity.value) query.ciudad = selectedCity.value
    if (selectedCategories.value.length > 0) query.categoria = selectedCategories.value
    if (selectedType.value) query.tipo = selectedType.value
    if (radius.value !== 10) query.radio = radius.value.toString()

    router.push({ query })
    _refresh()
  },
  { debounce: 300 }
)
</script>

<template>
  <div class="min-h-screen bg-background">
    <UContainer class="py-8">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-4xl font-bold mb-4">
          {{ t('search.title') }}
        </h1>

        <!-- Search bar -->
        <div class="flex flex-col sm:flex-row gap-4">
          <div class="relative flex-1">
            <UInput
              v-model="searchQuery"
              icon="i-lucide-search"
              size="lg"
              :placeholder="t('search.placeholder')"
              autocomplete="off"
              @focus="showSuggestions = hasSuggestions"
              @blur="setTimeout(() => closeSuggestions(), 200)"
            />

            <!-- Search Suggestions Dropdown -->
            <Transition
              enter-active-class="transition duration-100 ease-out"
              enter-from-class="opacity-0 -translate-y-1"
              enter-to-class="opacity-100 translate-y-0"
              leave-active-class="transition duration-75 ease-in"
              leave-from-class="opacity-100 translate-y-0"
              leave-to-class="opacity-0 -translate-y-1"
            >
              <div
                v-if="showSuggestions && hasSuggestions"
                class="absolute z-50 top-full left-0 right-0 mt-1 bg-default border border-default rounded-lg shadow-xl overflow-hidden backdrop-blur-none"
              >
                <!-- Stores -->
                <div v-if="searchSuggestions.stores.length > 0">
                  <div class="px-3 py-2 text-xs font-medium text-muted bg-elevated">
                    {{ t('search.stores') }}
                  </div>
                  <button
                    v-for="store in searchSuggestions.stores"
                    :key="store.id"
                    class="w-full flex items-center gap-3 px-3 py-2 hover:bg-elevated transition-colors text-left"
                    @mousedown.prevent="navigateToStore(store.slug)"
                  >
                    <div class="size-8 rounded-lg bg-elevated flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img
                        v-if="store.logoUrl"
                        :src="store.logoUrl"
                        :alt="store.name"
                        class="w-full h-full object-contain"
                      >
                      <UIcon
                        v-else
                        name="i-lucide-store"
                        class="size-4 text-muted"
                      />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium truncate">
                        {{ store.name }}
                      </p>
                      <p class="text-xs text-muted capitalize">
                        {{ store.type?.replace('_', ' + ') || 'Tienda' }}
                      </p>
                    </div>
                    <UIcon
                      name="i-lucide-arrow-right"
                      class="size-4 text-muted"
                    />
                  </button>
                </div>

                <!-- Products -->
                <div v-if="searchSuggestions.products.length > 0">
                  <div class="px-3 py-2 text-xs font-medium text-muted bg-elevated border-t border-border">
                    {{ t('search.products') }}
                  </div>
                  <div
                    v-for="product in searchSuggestions.products"
                    :key="product.id"
                    class="flex items-center gap-3 px-3 py-2 hover:bg-elevated transition-colors"
                  >
                    <div class="size-8 rounded-lg bg-elevated flex items-center justify-center overflow-hidden flex-shrink-0">
                      <img
                        v-if="product.imageUrl"
                        :src="product.imageUrl"
                        :alt="product.name"
                        class="w-full h-full object-cover"
                      >
                      <UIcon
                        v-else
                        name="i-lucide-package"
                        class="size-4 text-muted"
                      />
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="font-medium truncate">
                        {{ product.name }}
                      </p>
                      <p class="text-xs text-primary font-medium">
                        ${{ Number(product.price).toLocaleString() }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Transition>
          </div>

          <UInputMenu
            v-model="selectedCity"
            v-model:query="cityInputValue"
            :items="filteredCities"
            icon="i-lucide-map-pin"
            size="lg"
            placeholder="Ciudad"
            class="w-full sm:w-64"
          />

          <UButton
            icon="i-lucide-navigation"
            size="lg"
            variant="outline"
            @click="requestLocation"
          >
            {{ t('search.myLocation') }}
          </UButton>
        </div>

        <!-- Loading indicator for debounced search -->
        <div
          v-if="pending"
          class="mt-2 flex items-center gap-2 text-sm text-muted"
        >
          <UIcon
            name="i-lucide-loader-2"
            class="size-4 animate-spin"
          />
          <span>{{ t('search.searching') }}</span>
        </div>

        <div
          v-if="locationError"
          class="mt-2 text-sm text-_error"
        >
          {{ locationError }}
        </div>

        <div
          v-if="userLocation"
          class="mt-2 flex items-center gap-2 text-sm text-success"
        >
          <UIcon
            name="i-lucide-check-circle"
            class="size-4"
          />
          <span>{{ t('search.locationActive') }}</span>
        </div>
      </div>

      <div class="grid lg:grid-cols-4 gap-8">
        <!-- Filters Sidebar -->
        <aside class="lg:col-span-1">
          <div class="sticky top-8">
            <UCard>
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-semibold">
                  {{ t('search.filters') }}
                </h2>
                <UButton
                  variant="ghost"
                  size="sm"
                  @click="clearFilters"
                >
                  {{ t('search.clearFilters') }}
                </UButton>
              </div>

              <!-- Store Type Filter -->
              <div class="mb-6">
                <h3 class="font-medium mb-3">
                  {{ t('search.storeType') }}
                </h3>
                <div class="space-y-2">
                  <label
                    v-for="type in storeTypes"
                    :key="type.value"
                    class="flex items-center gap-2 cursor-pointer hover:bg-elevated p-2 rounded-lg transition-colors"
                  >
                    <URadio
                      v-model="selectedType"
                      :value="type.value"
                      :label="type.label"
                    />
                  </label>
                  <label
                    class="flex items-center gap-2 cursor-pointer hover:bg-elevated p-2 rounded-lg transition-colors"
                  >
                    <URadio
                      v-model="selectedType"
                      value=""
                      label="Todos"
                    />
                  </label>
                </div>
              </div>

              <!-- Categories -->
              <div class="mb-6">
                <h3 class="font-medium mb-3">
                  {{ t('search.categories') }}
                </h3>
                <div class="space-y-2">
                  <label
                    v-for="category in categories"
                    :key="category.id"
                    class="flex items-center gap-2 cursor-pointer hover:bg-elevated p-2 rounded-lg transition-colors"
                  >
                    <UCheckbox
                      :model-value="selectedCategories.includes(category.slug)"
                      @update:model-value="toggleCategory(category.slug)"
                    />
                    <UIcon
                      :name="category.icon || 'i-lucide-leaf'"
                      class="size-4 text-primary"
                    />
                    <span class="text-sm">{{ category.name }}</span>
                  </label>
                </div>
              </div>

              <!-- Radius slider (only if location is enabled) -->
              <div
                v-if="userLocation"
                class="mb-6"
              >
                <h3 class="font-medium mb-3">
                  {{ t('search.radius') }}
                </h3>
                <div class="space-y-2">
                  <input
                    v-model.number="radius"
                    type="range"
                    min="1"
                    max="50"
                    step="1"
                    class="w-full"
                  >
                  <div class="text-sm text-muted text-center">
                    {{ radius }} km
                  </div>
                </div>
              </div>
            </UCard>
          </div>
        </aside>

        <!-- Results -->
        <div class="lg:col-span-3">
          <!-- View toggle and results count -->
          <div class="flex items-center justify-between mb-6">
            <p class="text-muted">
              {{ t('search.results', { count: stores.length || 0 }, stores.length || 0) }}
            </p>

            <div class="flex gap-2">
              <UButton
                :variant="viewMode === 'list' ? 'solid' : 'ghost'"
                icon="i-lucide-list"
                @click="viewMode = 'list'"
              >
                {{ t('search.list') }}
              </UButton>
              <UButton
                :variant="viewMode === 'map' ? 'solid' : 'ghost'"
                icon="i-lucide-map"
                @click="viewMode = 'map'"
              >
                {{ t('search.map') }}
              </UButton>
            </div>
          </div>

          <!-- Loading state -->
          <div
            v-if="pending"
            class="grid sm:grid-cols-2 gap-6"
          >
            <UCard
              v-for="i in 6"
              :key="i"
              variant="outline"
            >
              <USkeleton class="h-32 mb-4" />
              <USkeleton class="h-6 mb-2" />
              <USkeleton class="h-4 w-2/3" />
            </UCard>
          </div>

          <!-- List view -->
          <div v-else-if="viewMode === 'list'">
            <div
              v-if="stores.length > 0"
              class="grid sm:grid-cols-2 gap-6"
            >
              <StoreCard
                v-for="store in stores"
                :key="store.id"
                :store="store"
              />
            </div>

            <!-- Empty state -->
            <UCard
              v-else
              class="text-center py-12"
            >
              <UIcon
                name="i-lucide-search-x"
                class="size-16 text-muted mx-auto mb-4"
              />
              <h3 class="text-xl font-semibold mb-2">
                {{ t('search.noResults') }}
              </h3>
              <p class="text-muted mb-4">
                {{ t('search.noResultsHint') }}
              </p>
              <UButton
                variant="outline"
                @click="clearFilters"
              >
                {{ t('search.clearAll') }}
              </UButton>
            </UCard>
          </div>

          <!-- Map view -->
          <div v-else>
            <MapStoreMap
              :stores="stores"
              :center="userLocation ? { lat: userLocation.lat, lng: userLocation.lng } : undefined"
              :zoom="userLocation ? 14 : 12"
            />
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>
