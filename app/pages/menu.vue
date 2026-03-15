<script setup lang="ts">
useSeoMeta({
  title: 'Menú de la Semana',
  ogTitle: 'Menú DeComer — Esta semana cocinamos...',
  description: 'Mirá las viandas de esta semana. Menú rotativo, siempre fresco. Proteínas, vegetariano, bajo en carbs y más.',
  ogDescription: 'Opciones para todos: proteína, veggie, low carb. Fresco, rico, listo para comer.'
})

interface Vianda {
  id: string
  name: string
  description: string | null
  price: string
  imageUrl: string | null
  isAvailable: boolean
  isVegan: boolean
  category: string | null
  // macros — pendiente de schema migration
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  tags?: string[]
}

// Filters
const activeFilter = ref('todos')
const searchQuery = ref('')

const filters = [
  { id: 'todos', label: 'Todos' },
  { id: 'veggie', label: '🥦 Vegetariano' },
  { id: 'proteico', label: '💪 Proteico' },
  { id: 'low-carb', label: '⚡ Low Carb' },
  { id: 'sin-gluten', label: '🌾 Sin Gluten' }
]

// Fetch viandas — uses /api/products with available filter
// TODO: add storeId once DeComer store is seeded; for now fetches public catalog
const { data, pending, error } = await useFetch<{ products: Vianda[] }>('/api/catalog', {
  query: computed(() => ({
    available: true,
    category: activeFilter.value !== 'todos' ? activeFilter.value : undefined
  }))
})

const viandas = computed(() => data.value?.products ?? [])

const filteredViandas = computed(() => {
  let list = viandas.value

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    list = list.filter(v =>
      v.name.toLowerCase().includes(q) ||
      v.description?.toLowerCase().includes(q)
    )
  }

  if (activeFilter.value === 'veggie') {
    list = list.filter(v => v.isVegan)
  }

  return list
})

const formatPrice = (price: string) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(price))

// Cart state (local, for UX preview)
const cart = ref<Record<string, number>>({})

const addToCart = (id: string) => {
  cart.value[id] = (cart.value[id] ?? 0) + 1
}

const removeFromCart = (id: string) => {
  if (cart.value[id] > 1) {
    cart.value[id]--
  } else {
    delete cart.value[id]
  }
}

const cartTotal = computed(() =>
  viandas.value.reduce((sum, v) => sum + (cart.value[v.id] ?? 0) * Number(v.price), 0)
)

const cartCount = computed(() =>
  Object.values(cart.value).reduce((a, b) => a + b, 0)
)
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-neutral-950">

    <!-- Header section -->
    <div class="pt-12 pb-8 px-6 border-b border-neutral-200 dark:border-neutral-800">
      <div class="max-w-6xl mx-auto">
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p class="text-sm text-neutral-500 uppercase tracking-wider mb-1">Esta semana cocinamos</p>
            <h1 class="text-4xl font-bold">El menú</h1>
          </div>

          <!-- Search -->
          <UInput
            v-model="searchQuery"
            placeholder="Buscar vianda..."
            icon="i-lucide-search"
            class="md:w-64"
          />
        </div>

        <!-- Filters -->
        <div class="flex flex-wrap gap-2 mt-6">
          <UButton
            v-for="f in filters"
            :key="f.id"
            :label="f.label"
            :color="activeFilter === f.id ? 'primary' : 'neutral'"
            :variant="activeFilter === f.id ? 'solid' : 'outline'"
            size="sm"
            @click="activeFilter = f.id"
          />
        </div>
      </div>
    </div>

    <!-- Content -->
    <div class="max-w-6xl mx-auto px-6 py-10">

      <!-- Loading -->
      <div v-if="pending" class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <USkeleton v-for="i in 6" :key="i" class="h-72 rounded-2xl" />
      </div>

      <!-- Error -->
      <UAlert
        v-else-if="error"
        color="error"
        icon="i-lucide-alert-circle"
        title="No pudimos cargar el menú"
        description="Intentá de nuevo en un momento."
      />

      <!-- Empty -->
      <div v-else-if="!filteredViandas.length" class="text-center py-20">
        <UIcon name="i-lucide-utensils" class="w-12 h-12 text-neutral-300 mx-auto mb-4" />
        <p class="text-neutral-500">No hay viandas que coincidan con tu búsqueda.</p>
        <UButton label="Ver todas" variant="ghost" class="mt-4" @click="activeFilter = 'todos'; searchQuery = ''" />
      </div>

      <!-- Grid -->
      <div v-else class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="vianda in filteredViandas"
          :key="vianda.id"
          class="rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 overflow-hidden flex flex-col"
        >
          <!-- Image -->
          <div class="relative aspect-video bg-neutral-100 dark:bg-neutral-700">
            <NuxtImg
              v-if="vianda.imageUrl"
              :src="vianda.imageUrl"
              :alt="vianda.name"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
              <UIcon name="i-lucide-utensils" class="w-8 h-8 text-neutral-300" />
            </div>

            <!-- Vegan badge -->
            <UBadge
              v-if="vianda.isVegan"
              label="🥦 Veggie"
              color="primary"
              variant="solid"
              class="absolute top-3 left-3"
            />
          </div>

          <!-- Info -->
          <div class="p-5 flex flex-col flex-1">
            <div class="flex items-start justify-between gap-2 mb-2">
              <h3 class="font-semibold text-base leading-tight">{{ vianda.name }}</h3>
              <UBadge
                v-if="vianda.category"
                :label="vianda.category"
                color="neutral"
                variant="subtle"
                size="xs"
                class="shrink-0"
              />
            </div>

            <p v-if="vianda.description" class="text-sm text-neutral-500 dark:text-neutral-400 mb-4 line-clamp-2">
              {{ vianda.description }}
            </p>

            <!-- Macros placeholder — pendiente de migration -->
            <div v-if="vianda.calories" class="flex gap-3 text-xs text-neutral-400 mb-4">
              <span>{{ vianda.calories }} kcal</span>
              <span>{{ vianda.protein }}g prot</span>
              <span>{{ vianda.carbs }}g carb</span>
              <span>{{ vianda.fat }}g grasa</span>
            </div>

            <div class="mt-auto flex items-center justify-between">
              <span class="text-lg font-bold text-primary-600 dark:text-primary-400">
                {{ formatPrice(vianda.price) }}
              </span>

              <!-- Add to cart -->
              <div v-if="cart[vianda.id]" class="flex items-center gap-2">
                <UButton
                  icon="i-lucide-minus"
                  color="neutral"
                  variant="outline"
                  size="xs"
                  @click="removeFromCart(vianda.id)"
                />
                <span class="w-5 text-center font-medium text-sm">{{ cart[vianda.id] }}</span>
                <UButton
                  icon="i-lucide-plus"
                  color="primary"
                  size="xs"
                  @click="addToCart(vianda.id)"
                />
              </div>
              <UButton
                v-else
                label="Agregar"
                icon="i-lucide-plus"
                size="sm"
                @click="addToCart(vianda.id)"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Floating cart -->
    <Transition name="slide-up">
      <div
        v-if="cartCount > 0"
        class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50"
      >
        <UButton
          :label="`Ver carrito · ${cartCount} vianda${cartCount > 1 ? 's' : ''} · ${new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(cartTotal)}`"
          to="/carrito"
          size="lg"
          icon="i-lucide-shopping-bag"
          class="shadow-xl shadow-primary-500/30"
        />
      </div>
    </Transition>

  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}
.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(16px);
}
</style>
