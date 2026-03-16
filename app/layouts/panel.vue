<script setup lang="ts">
import type { NavigationMenuItem } from '@nuxt/ui'

const open = ref(false)

const links = [[{
  label: 'Dashboard',
  icon: 'i-lucide-house',
  to: '/panel',
  onSelect: () => { open.value = false }
}, {
  label: 'Productos',
  icon: 'i-lucide-package',
  to: '/panel/productos',
  onSelect: () => { open.value = false }
}, {
  label: 'Pedidos',
  icon: 'i-lucide-shopping-cart',
  to: '/panel/pedidos',
  onSelect: () => { open.value = false }
}, {
  label: 'Resenas',
  icon: 'i-lucide-star',
  to: '/panel/resenas',
  onSelect: () => { open.value = false }
}, {
  label: 'Mi Perfil',
  icon: 'i-lucide-user-circle',
  to: '/panel/perfil',
  onSelect: () => { open.value = false }
}], [{
  label: 'Mi Tienda',
  icon: 'i-lucide-settings',
  to: '/panel/tienda',
  onSelect: () => { open.value = false }
}]] satisfies NavigationMenuItem[][]
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="panel"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <PanelStoreSelector :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <PanelUserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <slot />
  </UDashboardGroup>
</template>
