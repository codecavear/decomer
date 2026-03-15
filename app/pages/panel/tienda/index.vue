<script setup lang="ts">
definePageMeta({
  layout: 'panel',
  middleware: 'auth'
})

// Redirect to my store's edit page (panel/tienda/[id])
const { data: store } = await useFetch<{ id: string } | null>('/api/stores/my')

if (store.value?.id) {
  await navigateTo(`/panel/tienda/${store.value.id}`, { replace: true })
} else {
  await navigateTo('/crear-tienda', { replace: true })
}
</script>

<template>
  <div class="p-6 flex items-center justify-center">
    <div class="text-center">
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-primary mx-auto"
      />
      <p class="text-muted mt-2">
        Redirigiendo a tu tienda...
      </p>
    </div>
  </div>
</template>
