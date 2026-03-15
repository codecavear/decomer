<script setup lang="ts">
import type { DropdownMenuItem } from '@nuxt/ui'

defineProps<{
  collapsed?: boolean
}>()

const { user, clear } = useUserSession()
const colorMode = useColorMode()

const logout = async () => {
  await $fetch('/auth/logout')
  await clear()
  await navigateTo('/login')
}

const items = computed<DropdownMenuItem[][]>(() => [[{
  type: 'label',
  label: user.value?.name || 'Usuario',
  avatar: user.value?.avatarUrl ? { src: user.value.avatarUrl } : undefined
}], [{
  label: 'Apariencia',
  icon: 'i-lucide-sun-moon',
  children: [{
    label: 'Claro',
    icon: 'i-lucide-sun',
    type: 'checkbox',
    checked: colorMode.value === 'light',
    onSelect(e: Event) {
      e.preventDefault()
      colorMode.preference = 'light'
    }
  }, {
    label: 'Oscuro',
    icon: 'i-lucide-moon',
    type: 'checkbox',
    checked: colorMode.value === 'dark',
    onSelect(e: Event) {
      e.preventDefault()
      colorMode.preference = 'dark'
    }
  }]
}], [{
  label: 'Ver sitio',
  icon: 'i-lucide-external-link',
  to: '/'
}], [{
  label: 'Cerrar sesion',
  icon: 'i-lucide-log-out',
  onSelect: logout
}]])
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{ content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)' }"
  >
    <UButton
      :avatar="user?.avatarUrl ? { src: user.avatarUrl, alt: user.name } : undefined"
      :icon="!user?.avatarUrl ? 'i-lucide-user' : undefined"
      :label="collapsed ? undefined : (user?.name || 'Usuario')"
      :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed'
      }"
    />
  </UDropdownMenu>
</template>
