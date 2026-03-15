<script setup lang="ts">
import type { Store, StoreLocation } from '~/types'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

useSeoMeta({
  title: 'Favoritos',
  description: 'Tus tiendas favoritas en DeComer.',
  robots: 'noindex'
})

interface FavoriteStore extends Store {
  locations?: Array<{
    city: string
    address: string
  }>
  favoritedAt?: string
}

const { data, status, refresh } = await useFetch<{ stores: FavoriteStore[] }>('/api/favorites', {
  query: {
    limit: 50
  }
})

const favorites = computed(() => data.value?.stores || [])
const isEmpty = computed(() => favorites.value.length === 0)
const isLoading = computed(() => status.value === 'pending')
</script>

<template>
  <UContainer class="py-8">
    <div class="flex flex-col gap-6">
      <!-- Header -->
      <div>
        <h1 class="text-3xl font-bold">
          Mis favoritos
        </h1>
        <p class="text-muted mt-1">
          Tiendas que has guardado como favoritas
        </p>
      </div>

      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <USkeleton
          v-for="i in 6"
          :key="i"
          class="h-64 rounded-lg"
        />
      </div>

      <!-- Empty State -->
      <UEmpty
        v-else-if="isEmpty"
        icon="i-lucide-heart"
        title="No tienes favoritos"
        description="Guarda tus tiendas favoritas para acceder a ellas rápidamente"
      >
        <template #actions>
          <UButton
            icon="i-lucide-search"
            color="primary"
            to="/buscar"
          >
            Buscar tiendas
          </UButton>
        </template>
      </UEmpty>

      <!-- Favorites Grid -->
      <div
        v-else
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      >
        <StoreCard
          v-for="store in favorites"
          :key="store.id"
          :store="store"
        />
      </div>
    </div>
  </UContainer>
</template>
