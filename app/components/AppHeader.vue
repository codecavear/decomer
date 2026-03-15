<script setup lang="ts">
const { t, locale, locales, setLocale } = useI18n()
const { loggedIn, user, clear } = useUserSession()
const route = useRoute()

const handlePricingClick = () => {
  if (route.path === '/') {
    // If on home page, smooth scroll to pricing section
    const pricingSection = document.getElementById('pricing')
    if (pricingSection) {
      pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  } else {
    // If on another page, navigate to home with hash
    navigateTo('/#pricing')
  }
}

// Handle scroll on mount if coming from another page with #pricing
onMounted(() => {
  if (route.hash === '#pricing') {
    nextTick(() => {
      const pricingSection = document.getElementById('pricing')
      if (pricingSection) {
        pricingSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      }
    })
  }
})

const items = computed(() => [{
  label: t('nav.search'),
  icon: 'i-lucide-search',
  to: '/buscar'
}, {
  label: 'Blog',
  icon: 'i-lucide-newspaper',
  to: '/blog'
}, {
  label: t('nav.pricing'),
  icon: 'i-lucide-tag',
  onSelect: handlePricingClick
}, {
  label: t('nav.favorites'),
  icon: 'i-lucide-heart',
  to: '/favoritos'
}])

const localeItems = computed(() => {
  return (locales.value as Array<{ code: 'es' | 'en', name: string }>).map(l => ({
    label: l.name,
    onSelect: () => setLocale(l.code)
  }))
})

const userMenuItems = computed(() => [[
  {
    label: user.value?.name || 'Mi cuenta',
    icon: 'i-lucide-user',
    disabled: true
  }
], [
  {
    label: t('nav.myOrders'),
    icon: 'i-lucide-shopping-bag',
    to: '/mis-pedidos'
  },
  {
    label: t('nav.favorites'),
    icon: 'i-lucide-heart',
    to: '/favoritos'
  }
], [
  {
    label: t('nav.panel'),
    icon: 'i-lucide-layout-dashboard',
    to: '/panel'
  }
], [
  {
    label: t('nav.logout'),
    icon: 'i-lucide-log-out',
    onSelect: async () => {
      await clear()
      await navigateTo('/')
    }
  }
]])
</script>

<template>
  <UHeader>
    <template #left>
      <NuxtLink
        to="/"
        class="flex items-center gap-2 text-xl font-bold"
      >
        <UIcon
          name="i-lucide-leaf"
          class="w-6 h-6 text-primary"
        />
        Vegy
      </NuxtLink>
    </template>

    <!-- Desktop Navigation -->
    <UNavigationMenu
      :items="items"
      class="hidden lg:flex"
    />

    <template #right>
      <UDropdownMenu :items="[localeItems]">
        <UButton
          icon="i-lucide-globe"
          color="neutral"
          variant="ghost"
          size="sm"
          aria-label="Cambiar idioma"
        />
      </UDropdownMenu>

      <UColorModeButton aria-label="Cambiar tema claro/oscuro" />

      <!-- Logged in: show avatar dropdown -->
      <UDropdownMenu
        v-if="loggedIn"
        :items="userMenuItems"
      >
        <UAvatar
          :src="user?.avatarUrl ?? undefined"
          :alt="user?.name"
          size="sm"
          class="cursor-pointer"
        />
      </UDropdownMenu>

      <!-- Not logged in: show login button -->
      <template v-else>
        <UButton
          icon="i-lucide-log-in"
          color="primary"
          variant="ghost"
          to="/login"
          class="lg:hidden"
        />

        <UButton
          :label="t('nav.login')"
          color="primary"
          to="/login"
          class="hidden lg:inline-flex"
        />
      </template>
    </template>

    <template #body>
      <!-- Mobile Navigation -->
      <UNavigationMenu
        :items="items"
        orientation="vertical"
        class="mb-4"
      />

      <USeparator class="my-6" />

      <div class="flex items-center gap-2 mb-4">
        <UButton
          v-for="l in (locales as Array<{ code: 'es' | 'en'; name: string }>)"
          :key="l.code"
          :label="l.name"
          :color="locale === l.code ? 'primary' : 'neutral'"
          :variant="locale === l.code ? 'solid' : 'ghost'"
          size="sm"
          @click="setLocale(l.code)"
        />
      </div>

      <template v-if="loggedIn">
        <UButton
          :label="t('nav.panel')"
          color="primary"
          to="/panel"
          block
          class="mb-2"
        />
        <UButton
          :label="t('nav.logout')"
          color="neutral"
          variant="outline"
          block
          @click="clear(); navigateTo('/')"
        />
      </template>
      <UButton
        v-else
        :label="t('nav.login')"
        color="primary"
        to="/login"
        block
      />
    </template>
  </UHeader>
</template>
