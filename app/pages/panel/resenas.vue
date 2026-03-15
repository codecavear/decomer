<script setup lang="ts">
definePageMeta({
  layout: 'panel',
  middleware: 'auth'
})

interface Review {
  id: string
  userName: string
  userAvatar?: string
  rating: number
  comment: string
  isVerified: boolean
  createdAt: string
}

const reviews = ref<Review[]>([])

// Rating filter
const ratingFilter = ref<number | 'all'>('all')

const ratingOptions = [
  { value: 'all', label: 'Todas' },
  { value: 5, label: '5 estrellas' },
  { value: 4, label: '4 estrellas' },
  { value: 3, label: '3 estrellas' },
  { value: 2, label: '2 estrellas' },
  { value: 1, label: '1 estrella' }
]

const filteredReviews = computed(() => {
  if (ratingFilter.value === 'all') {
    return reviews.value
  }
  return reviews.value.filter(review => review.rating === ratingFilter.value)
})

// Calculate average rating
const averageRating = computed(() => {
  if (reviews.value.length === 0) return 0
  const total = reviews.value.reduce((sum, review) => sum + review.rating, 0)
  return (total / reviews.value.length).toFixed(1)
})

// Rating distribution
const ratingDistribution = computed(() => {
  const distribution = [0, 0, 0, 0, 0]
  reviews.value.forEach((review) => {
    distribution[review.rating - 1]++
  })
  return distribution.reverse().map((count, index) => ({
    stars: 5 - index,
    count,
    percentage: reviews.value.length > 0 ? (count / reviews.value.length) * 100 : 0
  }))
})

const renderStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, i) => i < rating)
}
</script>

<template>
  <UDashboardPanel id="panel-resenas">
    <template #header>
      <UDashboardNavbar title="Resenas">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
    <div class="space-y-6">

    <!-- Rating overview -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Average rating -->
      <UCard class="lg:col-span-1 border-2 border-gray-200 dark:border-gray-800">
        <div class="text-center py-4">
          <div class="size-20 mx-auto rounded-3xl bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900 dark:to-yellow-900 flex items-center justify-center mb-4 shadow-lg">
            <UIcon
              name="i-lucide-star"
              class="size-12 text-amber-500"
            />
          </div>
          <div class="flex items-center justify-center gap-2 mb-2">
            <span class="text-5xl font-bold text-gray-900 dark:text-white">{{ averageRating }}</span>
          </div>
          <p class="text-gray-500 dark:text-gray-400 font-medium">
            de 5 estrellas
          </p>
          <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">
            {{ reviews.length }} reseñas totales
          </p>
        </div>
      </UCard>

      <!-- Rating distribution -->
      <UCard class="lg:col-span-2 border-2 border-gray-200 dark:border-gray-800">
        <template #header>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white">
            Distribución de calificaciones
          </h3>
        </template>

        <div class="space-y-4">
          <div
            v-for="item in ratingDistribution"
            :key="item.stars"
            class="flex items-center gap-4"
          >
            <div class="flex items-center gap-2 w-28">
              <span class="text-sm font-bold text-gray-900 dark:text-white">{{ item.stars }}</span>
              <UIcon
                name="i-lucide-star"
                class="size-5 text-amber-500"
              />
            </div>
            <div class="flex-1 h-3 bg-gray-200 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-amber-400 to-yellow-500 transition-all"
                :style="{ width: `${item.percentage}%` }"
              />
            </div>
            <span class="text-sm font-semibold text-gray-600 dark:text-gray-400 w-16 text-right">{{ item.count }} ({{ Math.round(item.percentage) }}%)</span>
          </div>
        </div>
      </UCard>
    </div>

    <!-- Rating filter -->
    <div class="flex flex-wrap gap-3">
      <UButton
        v-for="option in ratingOptions"
        :key="option.value"
        :color="ratingFilter === option.value ? 'primary' : 'neutral'"
        :variant="ratingFilter === option.value ? 'solid' : 'soft'"
        size="lg"
        class="hover:scale-105 transition-transform font-semibold"
        @click="ratingFilter = option.value"
      >
        {{ option.label }}
      </UButton>
    </div>

    <!-- Reviews list -->
    <UCard class="border-2 border-gray-200 dark:border-gray-800">
      <div
        v-if="filteredReviews.length > 0"
        class="space-y-4"
      >
        <div
          v-for="review in filteredReviews"
          :key="review.id"
          class="p-5 rounded-2xl border-2 border-gray-200 dark:border-gray-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-lg transition-all"
        >
          <div class="flex items-start gap-4">
            <UAvatar
              :name="review.userName"
              :src="review.userAvatar"
              size="xl"
              class="ring-2 ring-emerald-200 dark:ring-emerald-800"
            />

            <div class="flex-1 space-y-3">
              <!-- User info and rating -->
              <div class="flex items-start justify-between">
                <div>
                  <div class="flex items-center gap-2">
                    <p class="font-bold text-lg text-gray-900 dark:text-white">
                      {{ review.userName }}
                    </p>
                    <UBadge
                      v-if="review.isVerified"
                      color="success"
                      variant="soft"
                      size="md"
                    >
                      <UIcon
                        name="i-lucide-check-circle"
                        class="size-4"
                      />
                      Verificado
                    </UBadge>
                  </div>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {{ new Date(review.createdAt).toLocaleDateString('es-AR', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    }) }}
                  </p>
                </div>

                <!-- Star rating -->
                <div class="flex items-center gap-1 bg-amber-50 dark:bg-amber-950 px-3 py-1.5 rounded-xl border border-amber-200 dark:border-amber-800">
                  <UIcon
                    v-for="(filled, index) in renderStars(review.rating)"
                    :key="index"
                    name="i-lucide-star"
                    :class="[
                      'size-5',
                      filled ? 'text-amber-500 fill-amber-500' : 'text-gray-300 dark:text-gray-700'
                    ]"
                  />
                </div>
              </div>

              <!-- Review comment -->
              <p class="text-gray-700 dark:text-gray-300 leading-relaxed">
                {{ review.comment }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        v-else
        class="text-center py-16"
      >
        <div class="size-24 mx-auto rounded-3xl bg-gradient-to-br from-amber-100 to-yellow-100 dark:from-amber-900 dark:to-yellow-900 flex items-center justify-center mb-6">
          <UIcon
            name="i-lucide-star"
            class="size-14 text-amber-500"
          />
        </div>
        <p class="text-xl font-bold text-gray-900 dark:text-white">
          No hay reseñas con esta calificación
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Las reseñas aparecerán aquí cuando los clientes califiquen tu tienda
        </p>
      </div>
    </UCard>

    <!-- Info card -->
    <UCard class="border-2 border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/50">
      <div class="flex items-start gap-4">
        <div class="size-12 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shrink-0">
          <UIcon
            name="i-lucide-info"
            class="size-6 text-white"
          />
        </div>
        <div class="flex-1">
          <h4 class="font-bold text-lg text-gray-900 dark:text-white mb-2">
            Acerca de las reseñas
          </h4>
          <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            Solo los clientes que han realizado compras verificadas en tu tienda pueden dejar reseñas.
            Las reseñas son visibles públicamente y no pueden ser editadas o eliminadas.
            Responder a las reseñas puede ayudar a mejorar la percepción de tu tienda.
          </p>
        </div>
      </div>
    </UCard>
    </div>

    </template>
  </UDashboardPanel>
</template>
