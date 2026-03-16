<script setup lang="ts">
const route = useRoute()
// Only show cart on pages where shopping makes sense
const showCart = computed(() => {
  const path = route.path
  return !path.startsWith('/login') && !path.startsWith('/pricing') && !path.startsWith('/crear-tienda')
})
</script>

<template>
  <div>
    <AppHeader />

    <UMain>
      <slot />
    </UMain>

    <AppFooter />

    <CartDrawer v-if="showCart" />
    <PWAInstallBanner />
  </div>
</template>
