<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const { data: stores } = await useFetch('/api/stores/my-stores')

const selectedStore = useCookie<string>('vegy-selected-store')

// Auto-select first store if none selected
watch(stores, (val) => {
  if (val?.length && !selectedStore.value) {
    selectedStore.value = val[0].id
  }
}, { immediate: true })

const currentStore = computed(() => {
  return stores.value?.find(s => s.id === selectedStore.value) || stores.value?.[0]
})

const items = computed<DropdownMenuItem[][]>(() => {
  const storeItems = (stores.value || []).map(store => ({
    label: store.name,
    icon: 'i-lucide-store' as const,
    type: 'checkbox' as const,
    checked: store.id === selectedStore.value,
    onSelect() {
      selectedStore.value = store.id
    }
  }))

  return [storeItems, [{
    label: 'Crear tienda',
    icon: 'i-lucide-circle-plus',
    to: '/crear-tienda'
  }]]
})
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      :label="collapsed ? undefined : (currentStore?.name || 'Seleccionar tienda')"
      :icon="collapsed ? 'i-lucide-store' : undefined"
      :avatar="collapsed ? undefined : { icon: 'i-lucide-store' }"
      :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :class="[!collapsed && 'py-2']"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
    />
  </UDropdownMenu>
</template>
