<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps({
  error: {
    type: Object as PropType<NuxtError>,
    required: true
  }
})

useHead({
  htmlAttrs: {
    lang: 'es'
  }
})

const is404 = computed(() => props.error?.statusCode === 404)

const pageTitle = computed(() =>
  is404.value ? 'Página no encontrada' : 'Algo salió mal'
)

const pageDescription = computed(() =>
  is404.value
    ? 'Lo sentimos, esta página no existe o fue movida.'
    : 'Ocurrió un error inesperado. Intentá de nuevo más tarde.'
)

useSeoMeta({
  title: pageTitle,
  description: pageDescription
})

const handleError = () => clearError({ redirect: '/' })
</script>

<template>
  <div>
    <AppHeader />

    <UMain>
      <UContainer>
        <div class="flex flex-col items-center justify-center min-h-[60vh] text-center py-20">
          <!-- Status code -->
          <p class="text-8xl font-extrabold text-emerald-500/20 mb-4">
            {{ error?.statusCode || 500 }}
          </p>

          <!-- Icon -->
          <div class="inline-flex p-4 rounded-full bg-emerald-50 dark:bg-emerald-950 mb-6">
            <UIcon
              :name="is404 ? 'i-lucide-map-pin-off' : 'i-lucide-alert-triangle'"
              class="size-12 text-emerald-600 dark:text-emerald-400"
            />
          </div>

          <!-- Title -->
          <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {{ pageTitle }}
          </h1>

          <!-- Description -->
          <p class="text-lg text-gray-600 dark:text-gray-400 max-w-md mb-8">
            {{ pageDescription }}
          </p>

          <!-- Error detail (non-404 only) -->
          <p
            v-if="!is404 && error?.message"
            class="text-sm text-gray-500 dark:text-gray-500 mb-8 max-w-lg"
          >
            {{ error.message }}
          </p>

          <!-- Actions -->
          <div class="flex flex-col sm:flex-row gap-3">
            <UButton
              size="lg"
              color="primary"
              icon="i-lucide-home"
              class="font-semibold"
              @click="handleError"
            >
              Volver al inicio
            </UButton>
            <UButton
              v-if="is404"
              to="/buscar"
              size="lg"
              variant="outline"
              color="primary"
              icon="i-lucide-search"
              class="font-semibold"
            >
              Buscar tiendas
            </UButton>
          </div>
        </div>
      </UContainer>
    </UMain>

    <AppFooter />

    <UToaster />
  </div>
</template>
