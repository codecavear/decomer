<script setup lang="ts">
const route = useRoute()
const slug = route.params.slug as string

const { data: post } = await useAsyncData(`post-${slug}`, () =>
  queryCollection('posts').path(`/blog/${slug}`).first()
)

if (!post.value) {
  throw createError({
    statusCode: 404,
    statusMessage: 'Post no encontrado'
  })
}

useSeoMeta({
  title: post.value.title,
  ogTitle: post.value.title,
  description: post.value.description,
  ogDescription: post.value.description,
  ogImage: post.value.image?.src || '/og-image.png',
  ogType: 'article',
  twitterCard: 'summary_large_image'
})

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'Article',
        'headline': post.value.title,
        'description': post.value.description,
        'datePublished': post.value.date,
        'author': {
          '@type': 'Organization',
          'name': 'DeComer'
        },
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

// Get related posts
const { data: relatedPosts } = await useAsyncData('related-posts', () =>
  queryCollection('posts')
    .where('path', '<>', `/blog/${slug}`)
    .order('date', 'DESC')
    .limit(2)
    .all()
)
</script>

<template>
  <div v-if="post">
    <!-- Hero Section -->
    <section class="bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 dark:from-emerald-600 dark:via-green-700 dark:to-teal-800">
      <UContainer class="py-12 lg:py-20">
        <div class="max-w-3xl mx-auto text-center">
          <!-- Breadcrumb -->
          <nav class="mb-6">
            <ul class="flex items-center justify-center gap-2 text-white/80">
              <li>
                <NuxtLink
                  to="/"
                  class="hover:text-white transition-colors"
                >
                  Inicio
                </NuxtLink>
              </li>
              <li>
                <UIcon
                  name="i-lucide-chevron-right"
                  class="size-4"
                />
              </li>
              <li>
                <NuxtLink
                  to="/blog"
                  class="hover:text-white transition-colors"
                >
                  Blog
                </NuxtLink>
              </li>
              <li>
                <UIcon
                  name="i-lucide-chevron-right"
                  class="size-4"
                />
              </li>
              <li class="text-white truncate max-w-[200px]">
                {{ post.title }}
              </li>
            </ul>
          </nav>

          <!-- Badge -->
          <div
            v-if="post.badge?.label"
            class="mb-4"
          >
            <UBadge
              :label="post.badge.label"
              color="white"
              variant="subtle"
              size="lg"
              class="bg-white/20 text-white border-white/30"
            />
          </div>

          <!-- Title -->
          <h1 class="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white mb-6 leading-tight">
            {{ post.title }}
          </h1>

          <!-- Description -->
          <p class="text-lg sm:text-xl text-white/90 mb-8">
            {{ post.description }}
          </p>

          <!-- Meta -->
          <div class="flex items-center justify-center gap-6 text-white/80">
            <div
              v-if="post.authors?.[0]"
              class="flex items-center gap-2"
            >
              <UIcon
                name="i-lucide-user"
                class="size-5"
              />
              <span>{{ post.authors[0].name }}</span>
            </div>
            <div
              v-if="post.date"
              class="flex items-center gap-2"
            >
              <UIcon
                name="i-lucide-calendar"
                class="size-5"
              />
              <span>{{ formatDate(post.date) }}</span>
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Content -->
    <section class="py-12 lg:py-16">
      <UContainer>
        <article class="max-w-3xl mx-auto">
          <div class="prose prose-lg dark:prose-invert prose-emerald max-w-none prose-headings:font-bold prose-a:text-emerald-600 dark:prose-a:text-emerald-400 prose-img:rounded-xl">
            <ContentRenderer :value="post" />
          </div>
        </article>
      </UContainer>
    </section>

    <!-- Author & Share -->
    <section class="py-8 border-t border-gray-200 dark:border-gray-800">
      <UContainer>
        <div class="max-w-3xl mx-auto">
          <div class="flex flex-col sm:flex-row items-center justify-between gap-6">
            <!-- Author -->
            <div
              v-if="post.authors?.[0]"
              class="flex items-center gap-4"
            >
              <div class="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-white font-bold">
                {{ post.authors[0].name.charAt(0) }}
              </div>
              <div>
                <p class="font-semibold text-gray-900 dark:text-white">
                  {{ post.authors[0].name }}
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  Equipo DeComer
                </p>
              </div>
            </div>

            <!-- Share -->
            <div class="flex items-center gap-3">
              <span class="text-sm text-gray-500 dark:text-gray-400">Compartir:</span>
              <UButton
                :to="`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent('https://decomer.ar' + post.path)}`"
                target="_blank"
                color="neutral"
                variant="ghost"
                icon="i-simple-icons-x"
                square
              />
              <UButton
                :to="`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent('https://decomer.ar' + post.path)}&title=${encodeURIComponent(post.title)}`"
                target="_blank"
                color="neutral"
                variant="ghost"
                icon="i-simple-icons-linkedin"
                square
              />
              <UButton
                :to="`https://wa.me/?text=${encodeURIComponent(post.title + ' - https://decomer.ar' + post.path)}`"
                target="_blank"
                color="neutral"
                variant="ghost"
                icon="i-simple-icons-whatsapp"
                square
              />
            </div>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- Related Posts -->
    <section
      v-if="relatedPosts && relatedPosts.length"
      class="py-12 bg-gray-50 dark:bg-gray-900"
    >
      <UContainer>
        <div class="max-w-3xl mx-auto">
          <h2 class="text-2xl font-bold mb-8 text-gray-900 dark:text-white">
            Seguí leyendo
          </h2>
          <div class="grid sm:grid-cols-2 gap-6">
            <NuxtLink
              v-for="related in relatedPosts"
              :key="related.path"
              :to="related.path"
              class="group block"
            >
              <article class="h-full bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-500 transition-all duration-300 hover:shadow-lg p-6">
                <div
                  v-if="related.badge?.label"
                  class="mb-3"
                >
                  <UBadge
                    :label="related.badge.label"
                    color="primary"
                    variant="soft"
                    size="sm"
                  />
                </div>
                <h3 class="font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors mb-2 line-clamp-2">
                  {{ related.title }}
                </h3>
                <p class="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {{ related.description }}
                </p>
              </article>
            </NuxtLink>
          </div>
        </div>
      </UContainer>
    </section>

    <!-- CTA Section -->
    <section class="py-12 bg-gradient-to-r from-emerald-500 to-teal-600">
      <UContainer>
        <div class="max-w-2xl mx-auto text-center">
          <h2 class="text-2xl sm:text-3xl font-bold text-white mb-4">
            ¿Listo para empezar?
          </h2>
          <p class="text-white/90 mb-8">
            Creá tu tienda vegana gratis en minutos y empezá a vender hoy mismo.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 justify-center">
            <UButton
              to="/crear-tienda"
              size="lg"
              color="white"
              icon="i-lucide-rocket"
              class="text-emerald-600"
            >
              Crear mi tienda gratis
            </UButton>
            <UButton
              to="/blog"
              size="lg"
              variant="outline"
              color="white"
            >
              Ver más artículos
            </UButton>
          </div>
        </div>
      </UContainer>
    </section>
  </div>
</template>

<style>
@reference "tailwindcss";

/* Custom prose styles for better readability */
.prose h1 {
  @apply text-3xl;
}

.prose h2 {
  @apply text-2xl mt-10 mb-4;
}

.prose h3 {
  @apply text-xl mt-8 mb-3;
}

.prose p {
  @apply mb-4 leading-relaxed;
}

.prose ul, .prose ol {
  @apply my-4;
}

.prose li {
  @apply mb-2;
}

.prose table {
  @apply my-6 text-sm;
}

.prose th {
  @apply bg-gray-100 dark:bg-gray-800;
}

.prose blockquote {
  @apply border-l-emerald-500 bg-emerald-50 dark:bg-emerald-950/30 py-1;
}
</style>
