<script setup lang="ts">
const { data: posts } = await useAsyncData('blog-posts', () =>
  queryCollection('posts').order('date', 'DESC').all()
)

useSeoMeta({
  title: 'Blog - Guías para emprendedores veganos',
  ogTitle: 'Blog DeComer - Guías para emprendedores veganos',
  description: 'Recursos, guías y consejos para crear y hacer crecer tu emprendimiento vegano en Argentina.',
  ogDescription: 'Recursos, guías y consejos para crear y hacer crecer tu emprendimiento vegano en Argentina.',
  ogImage: '/og-image.png'
})

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Blog',
        'name': 'Blog DeComer',
        'description': 'Guías para emprendedores veganos en Argentina',
        'url': 'https://decomer.ar/blog',
        'publisher': {
          '@type': 'Organization',
          'name': 'DeComer',
          'url': 'https://decomer.ar'
        }
      })
    }
  ]
})

const formatDate = (date: string | Date) => {
  return new Date(date).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<template>
  <div>
    <!-- Hero Section -->
    <section class="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 dark:from-emerald-600 dark:via-green-700 dark:to-teal-800">
      <UContainer class="py-16 lg:py-24">
        <div class="text-center max-w-3xl mx-auto">
          <h1 class="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6">
            Blog DeComer
          </h1>
          <p class="text-xl text-white/90 mb-8">
            Guías, consejos y recursos para emprendedores veganos en Argentina
          </p>
          <div class="flex flex-wrap justify-center gap-3">
            <UBadge
              color="white"
              variant="subtle"
              size="lg"
              class="bg-white/20 text-white border-white/30"
            >
              Guías prácticas
            </UBadge>
            <UBadge
              color="white"
              variant="subtle"
              size="lg"
              class="bg-white/20 text-white border-white/30"
            >
              Tips de negocio
            </UBadge>
            <UBadge
              color="white"
              variant="subtle"
              size="lg"
              class="bg-white/20 text-white border-white/30"
            >
              Casos de éxito
            </UBadge>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Posts Grid -->
    <section class="py-16 bg-gray-50 dark:bg-gray-900">
      <UContainer>
        <div
          v-if="posts && posts.length"
          class="grid md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <NuxtLink
            v-for="post in posts"
            :key="post.path"
            :to="post.path"
            class="group block"
          >
            <article class="h-full bg-white dark:bg-gray-800 rounded-2xl border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 overflow-hidden">
              <!-- Image placeholder -->
              <div class="h-48 bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 flex items-center justify-center">
                <UIcon
                  name="i-lucide-newspaper"
                  class="size-16 text-emerald-400 dark:text-emerald-600"
                />
              </div>

              <div class="p-6">
                <!-- Badge -->
                <div
                  v-if="post.badge?.label"
                  class="mb-3"
                >
                  <UBadge
                    :label="post.badge.label"
                    color="primary"
                    variant="soft"
                  />
                </div>

                <!-- Title -->
                <h2 class="text-xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2">
                  {{ post.title }}
                </h2>

                <!-- Description -->
                <p class="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                  {{ post.description }}
                </p>

                <!-- Meta -->
                <div class="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                  <span v-if="post.date">
                    {{ formatDate(post.date) }}
                  </span>
                  <span class="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium group-hover:translate-x-1 transition-transform">
                    Leer más
                    <UIcon
                      name="i-lucide-arrow-right"
                      class="size-4"
                    />
                  </span>
                </div>
              </div>
            </article>
          </NuxtLink>
        </div>

        <!-- Empty state -->
        <div
          v-else
          class="text-center py-16"
        >
          <UIcon
            name="i-lucide-file-text"
            class="size-16 text-gray-300 dark:text-gray-600 mx-auto mb-4"
          />
          <h2 class="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
            Próximamente
          </h2>
          <p class="text-gray-500 dark:text-gray-500">
            Estamos preparando contenido increíble para vos.
          </p>
        </div>
      </UContainer>
    </section>

    <!-- CTA Section -->
    <section class="py-16 bg-white dark:bg-gray-950">
      <UContainer>
        <div class="max-w-2xl mx-auto text-center">
          <h2 class="text-2xl sm:text-3xl font-bold mb-4 text-gray-900 dark:text-white">
            ¿Tenés una tienda vegana?
          </h2>
          <p class="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Unite a DeComer y empezá a vender tus productos a una comunidad que ya está buscando lo que ofrecés.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <UButton
              to="/crear-tienda"
              size="lg"
              color="primary"
              icon="i-lucide-plus-circle"
            >
              Crear mi tienda gratis
            </UButton>
            <UButton
              to="/pricing"
              size="lg"
              color="neutral"
              variant="outline"
            >
              Ver planes
            </UButton>
          </div>
        </div>
      </UContainer>
    </section>
  </div>
</template>
