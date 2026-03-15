<script setup lang="ts">
const colorMode = useColorMode()
const route = useRoute()
const runtimeConfig = useRuntimeConfig()

const color = computed(() => colorMode.value === 'dark' ? '#020618' : 'white')
const siteUrl = runtimeConfig.public.siteUrl || 'https://decomer.ar'
const canonicalUrl = computed(() => `${siteUrl}${route.path}`)

useHead({
  meta: [
    { charset: 'utf-8' },
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
    { key: 'theme-color', name: 'theme-color', content: color }
  ],
  link: [
    { rel: 'icon', href: '/favicon.ico' },
    { rel: 'canonical', href: canonicalUrl }
  ]
})

useSeoMeta({
  titleTemplate: '%s - DeComer',
  ogImage: '/og-image.png',
  twitterImage: '/og-image.png',
  twitterCard: 'summary_large_image'
})
</script>

<template>
  <UApp>
    <NuxtLoadingIndicator />

    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>

    <UToaster />
  </UApp>
</template>
