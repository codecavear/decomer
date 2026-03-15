<script setup lang="ts">
definePageMeta({
  layout: 'store'
})

// Dynamic route for stores with reserved routes protection
const route = useRoute()
const slug = route.params.slug as string

// Reserved routes that should NOT be treated as stores
const reservedRoutes = [
  'buscar',
  'carrito',
  'crear-tienda',
  'demo',
  'favoritos',
  'login',
  'mis-pedidos',
  'pricing',
  'blog',
  'panel',
  'api',
  'admin',
  '_nuxt',
  'assets'
]

// Check if this slug is reserved
if (reservedRoutes.includes(slug)) {
  throw createError({
    statusCode: 404,
    message: 'Página no encontrada'
  })
}

// Rest of the logic is the same as tienda/[slug].vue
const { isFavorited, toggleFavorite } = useFavorites()
const { getOpenStatus, getNextOpenTime } = useStoreHours()
const { getStoreType } = useStoreTypes()
const { setIsCatalogStore } = useCartVisibility()

// Fetch store data
const { data: store, error } = await useFetch(`/api/stores/${slug}`)

if (error.value || !store.value) {
  const statusCode = error.value?.statusCode ?? 404
  const isServerError = statusCode >= 500
  throw createError({
    statusCode: isServerError ? 500 : 404,
    message: isServerError ? 'Error al cargar la tienda. Intenta más tarde.' : 'Tienda no encontrada'
  })
}

useSeoMeta({
  title: store.value.name,
  description: store.value.description || `Tienda vegana y vegetariana en ${store.value.city || 'Argentina'}`,
  ogImage: store.value.bannerUrl || store.value.logoUrl
})

// Tabs
const activeTab = ref('productos')
const tabs = [
  { value: 'productos', label: 'Productos', icon: 'i-lucide-shopping-bag' },
  { value: 'informacion', label: 'Información', icon: 'i-lucide-info' },
  { value: 'resenas', label: 'Reseñas', icon: 'i-lucide-star' }
]

// Fetch products
const { data: productsData } = await useFetch(`/api/products`, {
  query: { storeId: store.value.id },
  default: () => ({ products: [] })
})

const products = computed(() => productsData.value.products || [])

// Group products by category
const productsByCategory = computed(() => {
  const grouped = new Map<string, typeof products.value>()

  products.value.forEach((product) => {
    const category = product.category || 'Sin categoría'
    if (!grouped.has(category)) {
      grouped.set(category, [])
    }
    grouped.get(category)!.push(product)
  })

  return grouped
})

// Check if products have categories
const hasCategories = computed(() =>
  products.value.some(p => p.category)
)

// Fetch reviews
const { data: reviews } = await useFetch(`/api/reviews`, {
  query: { storeId: store.value.id },
  default: () => []
})

// Cart items count (placeholder)
const cartItemsCount = ref(0)

// Get primary location
const primaryLocation = computed(() =>
  store.value.locations?.find(l => l.isPrimary) || store.value.locations?.[0]
)

// Open/closed status
const openStatus = computed(() => getOpenStatus(store.value.schedules))
const nextOpenTime = computed(() => getNextOpenTime(store.value.schedules))

// Store type badge
const storeType = computed(() => store.value.type ? getStoreType(store.value.type) : null)

// Check if store supports cart/orders (not catalog-only)
const supportsCart = computed(() => {
  const type = store.value.type
  return type && type !== 'catalog'
})

// Tell CartDrawer to hide if this is a catalog-only store
watchEffect(() => {
  setIsCatalogStore(!supportsCart.value)
})

// Reset cart visibility when leaving the page
onUnmounted(() => {
  setIsCatalogStore(false)
})
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Hero Section -->
    <div class="relative h-48 lg:h-56 overflow-hidden">
      <img
        v-if="store.bannerUrl"
        :src="store.bannerUrl"
        :alt="store.name"
        class="w-full h-full object-cover"
      >
      <div
        v-else
        class="w-full h-full bg-gradient-to-br from-primary/20 to-success/20"
      />

      <!-- Store Logo Overlay -->
      <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent">
        <UContainer class="py-6">
          <div class="flex items-end gap-6">
            <div class="size-16 lg:size-20 rounded-xl overflow-hidden bg-background shadow-xl border-4 border-background">
              <img
                v-if="store.logoUrl"
                :src="store.logoUrl"
                :alt="store.name"
                class="w-full h-full object-contain p-2"
              >
              <div
                v-else
                class="w-full h-full flex items-center justify-center bg-elevated"
              >
                <UIcon
                  name="i-lucide-store"
                  class="size-12 text-muted"
                />
              </div>
            </div>

            <div class="flex-1 pb-2">
              <h1 class="text-3xl lg:text-4xl font-bold text-white mb-2">
                {{ store.name }}
              </h1>
              <div class="flex gap-2 flex-wrap">
                <UBadge
                  v-if="storeType"
                  :label="storeType.label"
                  :icon="storeType.icon"
                  :color="storeType.color"
                  variant="solid"
                  size="sm"
                />
                <UBadge
                  v-for="category in (store.categories || [])"
                  :key="category"
                  :label="category"
                  color="primary"
                  variant="solid"
                  size="sm"
                />
              </div>
            </div>

            <div class="flex items-center gap-3 pb-2">
              <UButton
                :icon="isFavorited(store.id) ? 'i-lucide-heart-filled' : 'i-lucide-heart'"
                :color="isFavorited(store.id) ? 'red' : 'white'"
                variant="soft"
                size="lg"
                square
                @click="toggleFavorite(store.id)"
              />
              <!-- Only show cart button for stores that support orders -->
              <UButton
                v-if="supportsCart"
                icon="i-lucide-shopping-cart"
                color="primary"
                size="lg"
                :label="cartItemsCount ? `${cartItemsCount}` : undefined"
                to="/carrito"
              />
            </div>
          </div>
        </UContainer>
      </div>
    </div>

    <UContainer>
      <!-- Store Info Bar -->
      <div class="border-b border-border">
        <div class="py-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Description -->
          <div class="lg:col-span-2">
            <p
              v-if="store.description"
              class="text-muted mb-4"
            >
              {{ store.description }}
            </p>

            <!-- Open/Closed Status -->
            <div class="flex items-center gap-2 text-sm">
              <UIcon
                :name="openStatus.isOpen ? 'i-lucide-clock' : 'i-lucide-clock-off'"
                :class="openStatus.isOpen ? 'text-success' : 'text-destructive'"
              />
              <span :class="openStatus.isOpen ? 'text-success' : 'text-destructive'">
                {{ openStatus.isOpen ? 'Abierto' : 'Cerrado' }}
              </span>
              <span
                v-if="openStatus.message"
                class="text-muted"
              >
                • {{ openStatus.message }}
              </span>
            </div>
          </div>

          <!-- Contact Info - Address & WhatsApp with links -->
          <div class="flex flex-col lg:flex-row gap-4">
            <!-- Address with Google Maps link -->
            <a
              v-if="primaryLocation"
              :href="`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(primaryLocation.address + ', ' + primaryLocation.city + ', ' + primaryLocation.country)}`"
              target="_blank"
              class="flex items-center gap-2 text-sm hover:text-primary transition-colors"
            >
              <UIcon
                name="i-lucide-map-pin"
                class="text-primary size-4 flex-shrink-0"
              />
              <span class="text-highlighted">{{ primaryLocation.address }}, {{ primaryLocation.city }}</span>
            </a>

            <!-- WhatsApp with link -->
            <a
              v-if="store.contacts?.find(c => c.type === 'whatsapp')"
              :href="`https://wa.me/${store.contacts.find(c => c.type === 'whatsapp')?.value?.replace(/\D/g, '')}`"
              target="_blank"
              class="flex items-center gap-2 text-sm hover:text-primary transition-colors"
            >
              <UIcon
                name="i-lucide-message-circle"
                class="text-primary size-4 flex-shrink-0"
              />
              <span class="text-highlighted">{{ store.contacts.find(c => c.type === 'whatsapp')?.value }}</span>
            </a>
          </div>
        </div>
      </div>

      <!-- Tabs Navigation -->
      <div class="py-6">
        <UTabs
          v-model="activeTab"
          :items="tabs"
          :content="false"
          class="w-full"
        />

        <!-- Tab Content -->
        <div class="mt-8">
          <!-- Products Tab -->
          <div
            v-if="activeTab === 'productos'"
            class="space-y-8"
          >
            <div
              v-if="products.length === 0"
              class="text-center py-12"
            >
              <UIcon
                name="i-lucide-package"
                class="size-16 text-muted mx-auto mb-4"
              />
              <h3 class="text-lg font-semibold text-highlighted mb-2">
                No hay productos disponibles
              </h3>
              <p class="text-muted">
                Esta tienda aún no ha agregado productos a su catálogo.
              </p>
            </div>

            <!-- Grouped by category if products have categories -->
            <template v-else-if="hasCategories">
              <div
                v-for="[category, categoryProducts] in productsByCategory"
                :key="category"
                class="space-y-4"
              >
                <!-- Category Header with Divider -->
                <div class="flex items-center gap-4">
                  <h3 class="text-lg font-semibold text-highlighted">
                    {{ category }}
                  </h3>
                  <div class="flex-1 h-px bg-border" />
                </div>

                <!-- Products Grid -->
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <UCard
                    v-for="product in categoryProducts"
                    :key="product.id"
                    class="group hover:shadow-lg transition-shadow"
                    :ui="{ body: { padding: 'p-0' } }"
                  >
                    <div class="aspect-[4/3] bg-muted rounded-t-lg overflow-hidden">
                      <img
                        v-if="product.imageUrl"
                        :src="product.imageUrl"
                        :alt="product.name"
                        class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      >
                      <div
                        v-else
                        class="w-full h-full flex items-center justify-center bg-elevated"
                      >
                        <UIcon
                          name="i-lucide-image"
                          class="size-12 text-muted"
                        />
                      </div>
                    </div>

                    <div class="p-4 space-y-3">
                      <div>
                        <h4 class="font-semibold text-highlighted group-hover:text-primary transition-colors">
                          {{ product.name }}
                        </h4>
                        <p
                          v-if="product.description"
                          class="text-sm text-muted mt-1 line-clamp-2"
                        >
                          {{ product.description }}
                        </p>
                      </div>

                      <div class="flex items-center justify-between">
                        <span class="text-lg font-bold text-primary">
                          ${{ Number(product.price).toLocaleString() }}
                        </span>
                        <!-- Add to cart button only for stores that support orders -->
                        <UButton
                          v-if="supportsCart"
                          icon="i-lucide-plus"
                          color="primary"
                          size="sm"
                          :disabled="!product.isAvailable"
                        >
                          {{ product.isAvailable ? 'Agregar' : 'No disponible' }}
                        </UButton>
                        <!-- Availability badge for catalog-only stores -->
                        <UBadge
                          v-else
                          :color="product.isAvailable ? 'success' : 'neutral'"
                          variant="soft"
                        >
                          {{ product.isAvailable ? 'Disponible' : 'No disponible' }}
                        </UBadge>
                      </div>
                    </div>
                  </UCard>
                </div>
              </div>
            </template>

            <!-- No categories - simple grid -->
            <div
              v-else
              class="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
              <UCard
                v-for="product in products"
                :key="product.id"
                class="group hover:shadow-lg transition-shadow"
                :ui="{ body: { padding: 'p-0' } }"
              >
                <div class="aspect-[4/3] bg-muted rounded-t-lg overflow-hidden">
                  <img
                    v-if="product.imageUrl"
                    :src="product.imageUrl"
                    :alt="product.name"
                    class="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  >
                  <div
                    v-else
                    class="w-full h-full flex items-center justify-center bg-elevated"
                  >
                    <UIcon
                      name="i-lucide-image"
                      class="size-12 text-muted"
                    />
                  </div>
                </div>

                <div class="p-4 space-y-3">
                  <div>
                    <h4 class="font-semibold text-highlighted group-hover:text-primary transition-colors">
                      {{ product.name }}
                    </h4>
                    <p
                      v-if="product.description"
                      class="text-sm text-muted mt-1 line-clamp-2"
                    >
                      {{ product.description }}
                    </p>
                  </div>

                  <div class="flex items-center justify-between">
                    <span class="text-lg font-bold text-primary">
                      ${{ Number(product.price).toLocaleString() }}
                    </span>
                    <!-- Add to cart button only for stores that support orders -->
                    <UButton
                      v-if="supportsCart"
                      icon="i-lucide-plus"
                      color="primary"
                      size="sm"
                      :disabled="!product.isAvailable"
                    >
                      {{ product.isAvailable ? 'Agregar' : 'No disponible' }}
                    </UButton>
                    <!-- Availability badge for catalog-only stores -->
                    <UBadge
                      v-else
                      :color="product.isAvailable ? 'success' : 'neutral'"
                      variant="soft"
                    >
                      {{ product.isAvailable ? 'Disponible' : 'No disponible' }}
                    </UBadge>
                  </div>
                </div>
              </UCard>
            </div>
          </div>

          <!-- Information Tab -->
          <div
            v-else-if="activeTab === 'informacion'"
            class="space-y-8"
          >
            <!-- Contact Information Card -->
            <UCard>
              <template #header>
                <div class="flex items-center gap-3">
                  <UIcon
                    name="i-lucide-contact"
                    class="size-5 text-primary"
                  />
                  <h3 class="text-xl font-semibold">
                    Información de Contacto
                  </h3>
                </div>
              </template>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <!-- Address Column -->
                <div
                  v-if="primaryLocation"
                  class="space-y-4"
                >
                  <div class="flex items-start gap-4 p-4 rounded-lg bg-elevated">
                    <div class="p-2 rounded-lg bg-primary/10">
                      <UIcon
                        name="i-lucide-map-pin"
                        class="text-primary size-6"
                      />
                    </div>
                    <div class="flex-1">
                      <p class="text-sm text-muted mb-1">
                        Dirección
                      </p>
                      <p class="font-semibold text-highlighted">
                        {{ primaryLocation.address }}
                      </p>
                      <p class="text-muted text-sm mt-1">
                        {{ primaryLocation.city }}, {{ primaryLocation.country }}
                      </p>
                      <p
                        v-if="primaryLocation.neighborhood"
                        class="text-muted text-sm"
                      >
                        {{ primaryLocation.neighborhood }}
                      </p>
                    </div>
                  </div>
                </div>

                <!-- Contacts Column -->
                <div
                  v-if="store.contacts && store.contacts.length > 0"
                  class="space-y-4"
                >
                  <div
                    v-for="contact in store.contacts"
                    :key="contact.id"
                    class="flex items-start gap-4 p-4 rounded-lg bg-elevated"
                  >
                    <div class="p-2 rounded-lg bg-primary/10">
                      <UIcon
                        :name="contact.type === 'whatsapp' ? 'i-lucide-message-circle' : contact.type === 'email' ? 'i-lucide-mail' : contact.type === 'phone' ? 'i-lucide-phone' : 'i-lucide-link'"
                        class="text-primary size-6"
                      />
                    </div>
                    <div class="flex-1">
                      <p class="text-sm text-muted mb-1 capitalize">
                        {{ contact.type }}
                      </p>
                      <p class="font-semibold text-highlighted">
                        {{ contact.value }}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </UCard>

            <!-- Schedule Card -->
            <UCard v-if="store.schedules && store.schedules.length > 0">
              <template #header>
                <div class="flex items-center gap-3">
                  <UIcon
                    name="i-lucide-clock"
                    class="size-5 text-primary"
                  />
                  <h3 class="text-xl font-semibold">
                    Horarios de Atención
                  </h3>
                </div>
              </template>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div
                  v-for="schedule in store.schedules"
                  :key="schedule.id"
                  class="flex justify-between items-center p-4 rounded-lg bg-elevated"
                >
                  <span class="font-medium text-highlighted">
                    {{ ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'][schedule.dayOfWeek] }}
                  </span>
                  <span :class="schedule.isClosed ? 'text-muted' : 'text-success font-medium'">
                    {{ schedule.isClosed ? 'Cerrado' : `${schedule.openTime} - ${schedule.closeTime}` }}
                  </span>
                </div>
              </div>
            </UCard>

            <!-- Image Gallery Card -->
            <UCard v-if="store.logoUrl || store.bannerUrl">
              <template #header>
                <div class="flex items-center gap-3">
                  <UIcon
                    name="i-lucide-images"
                    class="size-5 text-primary"
                  />
                  <h3 class="text-xl font-semibold">
                    Galería
                  </h3>
                </div>
              </template>

              <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  v-if="store.logoUrl"
                  class="aspect-square rounded-xl overflow-hidden border border-border hover:border-primary transition-colors"
                >
                  <img
                    :src="store.logoUrl"
                    :alt="`${store.name} logo`"
                    class="w-full h-full object-cover"
                  >
                </div>
                <div
                  v-if="store.bannerUrl"
                  class="aspect-square rounded-xl overflow-hidden border border-border hover:border-primary transition-colors"
                >
                  <img
                    :src="store.bannerUrl"
                    :alt="`${store.name} banner`"
                    class="w-full h-full object-cover"
                  >
                </div>
              </div>
            </UCard>
          </div>

          <!-- Reviews Tab -->
          <div
            v-else-if="activeTab === 'resenas'"
            class="space-y-6"
          >
            <div
              v-if="reviews.length === 0"
              class="text-center py-12"
            >
              <UIcon
                name="i-lucide-star"
                class="size-16 text-muted mx-auto mb-4"
              />
              <h3 class="text-lg font-semibold text-highlighted mb-2">
                No hay reseñas aún
              </h3>
              <p class="text-muted">
                Sé el primero en dejar una reseña de esta tienda.
              </p>
            </div>

            <div
              v-else
              class="space-y-4"
            >
              <UCard
                v-for="review in reviews"
                :key="review.id"
              >
                <div class="space-y-3">
                  <div class="flex items-start justify-between">
                    <div>
                      <p class="font-semibold text-highlighted">
                        {{ review.userName }}
                      </p>
                      <div class="flex items-center gap-1 mt-1">
                        <UIcon
                          v-for="n in 5"
                          :key="n"
                          name="i-lucide-star"
                          :class="n <= review.rating ? 'text-warning' : 'text-muted'"
                          class="size-4"
                        />
                      </div>
                    </div>
                    <span class="text-sm text-muted">
                      {{ new Date(review.createdAt).toLocaleDateString() }}
                    </span>
                  </div>

                  <p
                    v-if="review.comment"
                    class="text-muted"
                  >
                    {{ review.comment }}
                  </p>
                </div>
              </UCard>
            </div>
          </div>
        </div>
      </div>
    </UContainer>
  </div>
</template>
