<script setup lang="ts">
const { t } = useI18n()
</script>

<template>
  <USeparator class="h-px" />

  <UFooter>
    <template #left>
      <p class="text-muted text-sm">
        © {{ new Date().getFullYear() }} Vegy · Hecho por <a
          href="https://codecave.ar/"
          target="_blank"
          class="text-primary hover:underline"
        >CodeCave</a>
      </p>
    </template>

    <template #right>
      <div class="flex items-center gap-4 text-sm text-muted">
        <NuxtLink
          to="/blog"
          class="hover:text-primary transition-colors"
        >Blog</NuxtLink>
        <NuxtLink
          to="/pricing"
          class="hover:text-primary transition-colors"
        >{{ t('nav.pricing') }}</NuxtLink>
        <NuxtLink
          to="/buscar"
          class="hover:text-primary transition-colors"
        >{{ t('nav.search') }}</NuxtLink>
      </div>
    </template>
  </UFooter>
</template>
