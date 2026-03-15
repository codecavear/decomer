<script setup lang="ts">
import type { Store, StoreLocation, StoreType } from '~/types'

interface StoreSchedule {
  dayOfWeek: number
  openTime: string | null
  closeTime: string | null
  isClosed: boolean
}

interface StoreCardProps {
  store: Store & {
    primary_category?: string
    rating?: number
    review_count?: number
    distance?: number
    type?: StoreType
    locations?: Array<{
      city: string
      address: string
    }>
    schedules?: StoreSchedule[]
  }
}

const props = defineProps<StoreCardProps>()
const { isFavorited, toggleFavorite } = useFavorites()
const { getOpenStatus } = useStoreHours()
const { getStoreType } = useStoreTypes()

const location = computed(() => props.store.locations?.[0])
const openStatus = computed(() => getOpenStatus(props.store.schedules))
const storeType = computed(() => props.store.type ? getStoreType(props.store.type) : null)

const handleFavoriteClick = (e: Event) => {
  e.preventDefault()
  e.stopPropagation()
  toggleFavorite(props.store.id)
}
</script>

<template>
  <NuxtLink
    :to="`/${store.slug}`"
    class="block"
  >
    <UCard
      variant="outline"
      class="hover:shadow-lg transition-shadow cursor-pointer"
    >
      <div class="flex flex-col gap-4">
        <div class="relative">
          <div class="flex items-center justify-center h-32 bg-elevated rounded-lg overflow-hidden">
            <img
              v-if="store.logoUrl"
              :src="store.logoUrl"
              :alt="store.name"
              class="w-full h-full object-contain p-4"
            >
            <UIcon
              v-else
              name="i-lucide-store"
              class="size-16 text-muted"
            />
          </div>
          <UButton
            :icon="isFavorited(store.id) ? 'i-lucide-heart' : 'i-lucide-heart'"
            :color="isFavorited(store.id) ? 'error' : 'neutral'"
            :variant="isFavorited(store.id) ? 'soft' : 'ghost'"
            size="sm"
            class="absolute top-2 right-2"
            :aria-label="isFavorited(store.id) ? `Quitar ${store.name} de favoritos` : `Agregar ${store.name} a favoritos`"
            @click="handleFavoriteClick"
          />
        </div>

        <div class="flex flex-col gap-2">
          <h3 class="font-semibold text-lg truncate">{{ store.name }}</h3>

          <div class="flex items-center gap-2 flex-wrap">
            <UBadge
              v-if="storeType"
              :label="storeType.label"
              :icon="storeType.icon"
              :color="storeType.color"
              variant="soft"
              size="sm"
            />
            <UBadge
              v-if="store.primary_category"
              :label="store.primary_category"
              color="primary"
              variant="soft"
              size="sm"
            />
            <UBadge
              v-if="store.schedules && store.schedules.length > 0"
              :label="openStatus.label"
              :color="openStatus.color"
              variant="subtle"
              size="sm"
            />
          </div>

          <div class="flex items-center gap-3 text-sm text-muted flex-wrap">
            <div
              v-if="store.rating"
              class="flex items-center gap-1"
            >
              <UIcon
                name="i-lucide-star"
                class="size-4 text-warning fill-warning"
              />
              <span class="font-medium">{{ store.rating.toFixed(1) }}</span>
              <span v-if="store.review_count">({{ store.review_count }})</span>
            </div>

            <div
              v-if="location"
              class="flex items-center gap-1"
            >
              <UIcon
                name="i-lucide-map-pin"
                class="size-4"
              />
              <span>{{ location.city }}</span>
            </div>

            <div
              v-if="store.distance !== undefined"
              class="flex items-center gap-1"
            >
              <UIcon
                name="i-lucide-navigation"
                class="size-4"
              />
              <span>{{ formatDistance(store.distance) }}</span>
            </div>
          </div>
        </div>
      </div>
    </UCard>
  </NuxtLink>
</template>
