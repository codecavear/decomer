<script setup lang="ts">
definePageMeta({
  layout: 'default'
})

useSeoMeta({
  title: 'Brand Kit',
  description: 'Recursos de marca, logos, colores y tipografía de Vegy.'
})

const brandName = 'Vegy'
const primaryColor = '#22c55e'
const primaryColorName = 'green'
const bgColor = '#0a0a0a'
const surfaceColor = '#171717'
const fontTitle = 'Nunito'
const fontSubtitle = 'Raleway'

interface Asset {
  name: string
  file: string
}

interface AssetSection {
  title: string
  description: string
  assets: Asset[]
}

const logoAssets: AssetSection = {
  title: 'Logo',
  description: 'Logos para diferentes fondos',
  assets: [
    { name: 'Symbol PNG', file: '/logo-symbol.png' },
    { name: 'Symbol SVG', file: '/favicon.svg' }
  ]
}

const faviconAssets: AssetSection = {
  title: 'Favicons',
  description: 'Íconos para browser y dispositivos',
  assets: [
    { name: 'SVG', file: '/favicon.svg' },
    { name: '96×96', file: '/favicon-96x96.png' },
    { name: '32×32', file: '/favicon-32x32.png' },
    { name: '16×16', file: '/favicon-16x16.png' },
    { name: 'Apple Touch Icon', file: '/apple-touch-icon.png' },
    { name: 'PWA 192px', file: '/web-app-manifest-192x192.png' },
    { name: 'PWA 512px', file: '/web-app-manifest-512x512.png' }
  ]
}

const ogAssets: AssetSection = {
  title: 'Social Preview',
  description: 'Imagen Open Graph para redes sociales',
  assets: [
    { name: 'OG Image PNG', file: '/og-image.png' }
  ]
}

interface ColorItem {
  name: string
  hex: string
  usage: string
}

const colors: ColorItem[] = [
  { name: 'Primary', hex: primaryColor, usage: 'Acentos, botones, links' },
  { name: 'Background', hex: bgColor, usage: 'Fondo de página' },
  { name: 'Surface', hex: surfaceColor, usage: 'Cards, superficies elevadas' },
  { name: 'Text', hex: '#ffffff', usage: 'Texto principal' },
  { name: 'Muted', hex: '#9ca3af', usage: 'Texto secundario' }
]

interface FontItem {
  name: string
  usage: string
  sample: string
}

const fonts: FontItem[] = [
  {
    name: fontTitle,
    usage: 'Títulos, headings',
    sample: 'Vegy - Tiendas veganas cerca tuyo'
  },
  {
    name: fontSubtitle,
    usage: 'Subtítulos, cuerpo',
    sample: 'The quick brown fox jumps over the lazy dog'
  }
]
</script>

<template>
  <UContainer class="py-8 md:py-12">
    <!-- Header -->
    <div class="text-center mb-12">
      <Logo
        size="xl"
        with-text
        class="justify-center mb-6"
      />
      <h1 class="text-3xl md:text-4xl font-bold mb-2">
        Brand Kit
      </h1>
      <p class="text-[var(--ui-text-muted)]">
        Recursos de marca oficiales de {{ brandName }}
      </p>
    </div>

    <!-- Logo Preview -->
    <UCard class="mb-8">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-image"
            class="w-5 h-5"
          />
          <span class="font-semibold">Logo</span>
        </div>
      </template>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div class="flex flex-col items-center gap-3">
          <div class="w-24 h-24 rounded-xl bg-[var(--ui-bg)] flex items-center justify-center border border-[var(--ui-border)]">
            <Logo size="lg" />
          </div>
          <span class="text-sm text-[var(--ui-text-muted)]">Fondo oscuro</span>
        </div>
        <div class="flex flex-col items-center gap-3">
          <div class="w-24 h-24 rounded-xl bg-white flex items-center justify-center">
            <Logo size="lg" />
          </div>
          <span class="text-sm text-[var(--ui-text-muted)]">Fondo claro</span>
        </div>
        <div class="flex flex-col items-center gap-3">
          <div class="w-24 h-24 rounded-xl bg-[var(--ui-bg)] flex items-center justify-center border border-[var(--ui-border)]">
            <Logo
              size="lg"
              with-text
            />
          </div>
          <span class="text-sm text-[var(--ui-text-muted)]">Con texto</span>
        </div>
        <div class="flex flex-col items-center gap-3">
          <div
            class="w-24 h-24 rounded-xl flex items-center justify-center"
            :style="{ background: primaryColor }"
          >
            <UIcon
              name="i-lucide-leaf"
              class="w-12 h-12 text-black"
              style="transform: rotate(119deg);"
            />
          </div>
          <span class="text-sm text-[var(--ui-text-muted)]">Invertido</span>
        </div>
      </div>
    </UCard>

    <!-- Assets Download -->
    <div class="grid md:grid-cols-3 gap-6 mb-8">
      <UCard
        v-for="section in [logoAssets, faviconAssets, ogAssets]"
        :key="section.title"
      >
        <template #header>
          <span class="font-semibold">{{ section.title }}</span>
        </template>
        <p class="text-sm text-[var(--ui-text-muted)] mb-4">
          {{ section.description }}
        </p>
        <div class="space-y-2">
          <a
            v-for="asset in section.assets"
            :key="asset.file"
            :href="asset.file"
            download
            class="flex items-center justify-between p-2 rounded-lg hover:bg-[var(--ui-bg-elevated)] transition-colors"
          >
            <span class="text-sm">{{ asset.name }}</span>
            <UIcon
              name="i-lucide-download"
              class="w-4 h-4 text-[var(--ui-text-muted)]"
            />
          </a>
        </div>
      </UCard>
    </div>

    <!-- Colors -->
    <UCard class="mb-8">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-palette"
            class="w-5 h-5"
          />
          <span class="font-semibold">Colores</span>
        </div>
      </template>

      <div class="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div
          v-for="color in colors"
          :key="color.name"
          class="flex flex-col gap-2"
        >
          <div
            class="w-full h-16 rounded-lg border border-[var(--ui-border)]"
            :style="{ background: color.hex }"
          />
          <div>
            <p class="font-medium text-sm">
              {{ color.name }}
            </p>
            <p class="text-xs text-[var(--ui-text-muted)] font-mono">
              {{ color.hex }}
            </p>
          </div>
        </div>
      </div>
    </UCard>

    <!-- Typography -->
    <UCard class="mb-8">
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-type"
            class="w-5 h-5"
          />
          <span class="font-semibold">Tipografía</span>
        </div>
      </template>

      <div class="space-y-6">
        <div
          v-for="font in fonts"
          :key="font.name"
          class="border-b border-[var(--ui-border)] pb-4 last:border-0"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="font-semibold">{{ font.name }}</span>
            <span class="text-sm text-[var(--ui-text-muted)]">{{ font.usage }}</span>
          </div>
          <p
            class="text-2xl"
            :style="{ fontFamily: `'${font.name}', sans-serif` }"
          >
            {{ font.sample }}
          </p>
        </div>
      </div>
    </UCard>

    <!-- OG Preview -->
    <UCard>
      <template #header>
        <div class="flex items-center gap-2">
          <UIcon
            name="i-lucide-share-2"
            class="w-5 h-5"
          />
          <span class="font-semibold">Social Preview</span>
        </div>
      </template>

      <div class="aspect-[1.91/1] rounded-lg overflow-hidden border border-[var(--ui-border)]">
        <img
          src="/og-image.png"
          alt="OG Image Preview"
          class="w-full h-full object-cover"
        >
      </div>
    </UCard>
  </UContainer>
</template>
