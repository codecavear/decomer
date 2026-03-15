<script setup lang="ts">
useSeoMeta({
  titleTemplate: '',
  title: 'DeComer | Viandas frescas por suscripción en Córdoba',
  ogTitle: 'DeComer — Viandas frescas, nunca congeladas',
  description: 'Viandas saludables, cocinadas hoy, en tu puerta mañana. Sin congelar. Suscripción semanal o pedido único. Delivery en Córdoba Capital.',
  ogDescription: 'Comes bien, nosotros cocinamos. Viandas saludables con delivery en Córdoba. Suscribite o pedí cuando quieras.',
  ogType: 'website',
  ogUrl: 'https://decomer.com.ar',
  ogImage: 'https://decomer.com.ar/og-image.jpg',
  ogLocale: 'es_AR',
  twitterCard: 'summary_large_image',
  twitterTitle: 'DeComer — Viandas frescas por suscripción',
  twitterDescription: 'Comida real, cocinada hoy, en tu puerta mañana. Sin congelar. Córdoba Capital.'
})

useHead({
  script: [
    {
      type: 'application/ld+json',
      innerHTML: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'FoodEstablishment',
        name: 'DeComer',
        description: 'Viandas frescas por suscripción en Córdoba Capital',
        url: 'https://decomer.com.ar',
        servesCuisine: 'Healthy',
        areaServed: 'Córdoba Capital, Argentina'
      })
    }
  ]
})

const activeTag = ref('Todos')
const tags = ['Todos', 'Proteína', 'Vegetariano', 'Low carb', 'Comfort food']

const menuItems = [
  { name: 'Pollo al limón con quinoa', tag: 'Proteína', macros: '38g prot · 42g carb · 12g grasa', kcal: '432 kcal' },
  { name: 'Bowl veggie con hummus y tabulé', tag: 'Vegetariano', macros: '18g prot · 55g carb · 14g grasa', kcal: '418 kcal' },
  { name: 'Lomo con vegetales salteados', tag: 'Low carb', macros: '44g prot · 12g carb · 18g grasa', kcal: '388 kcal' },
  { name: 'Pasta casera con salsa bolognesa', tag: 'Comfort food', macros: '32g prot · 68g carb · 16g grasa', kcal: '548 kcal' },
  { name: 'Salmón con puré de coliflor', tag: 'Proteína', macros: '40g prot · 18g carb · 22g grasa', kcal: '426 kcal' },
  { name: 'Milanesa de soja con ensalada', tag: 'Vegetariano', macros: '24g prot · 38g carb · 10g grasa', kcal: '338 kcal' }
]

const filteredMenu = computed(() =>
  activeTag.value === 'Todos'
    ? menuItems
    : menuItems.filter(m => m.tag === activeTag.value)
)

const plans = [
  {
    name: 'Pedido Único',
    subtitle: 'Para probar',
    price: '$12.000',
    unit: 'por vianda',
    discount: null,
    highlight: false,
    features: ['Sin suscripción', 'Mínimo 3 viandas', 'Envío incluido'],
    cta: 'Pedir ahora'
  },
  {
    name: 'Básico',
    subtitle: '5 viandas/semana',
    price: '$11.400',
    unit: 'por vianda',
    discount: '-5%',
    highlight: false,
    features: ['Entrega 1 vez por semana', 'Elegís del menú semanal', 'Envío incluido'],
    cta: 'Suscribirme'
  },
  {
    name: 'Full',
    subtitle: '10 viandas/semana',
    price: '$10.800',
    unit: 'por vianda',
    discount: '-10%',
    highlight: true,
    features: ['Entrega 2 veces por semana', 'Elegís del menú semanal', 'Envío incluido'],
    cta: 'Suscribirme'
  },
  {
    name: 'Premium',
    subtitle: '10 viandas + nutrición',
    price: '$10.560',
    unit: 'por vianda',
    discount: '-12%',
    highlight: false,
    features: ['Todo lo del Full', 'Perfil nutricional personalizado', 'Ajustamos macros a tus objetivos', 'Envío incluido'],
    cta: 'Suscribirme'
  }
]

const testimonials = [
  { text: 'Por fin una app de viandas que funciona. Pido el domingo, llega el lunes. Así de simple.', name: 'Martina', location: 'Nueva Córdoba' },
  { text: 'Se nota que es fresco. No tiene ese gusto a recalentado de otras viandas.', name: 'Tomás', location: 'Cerro de las Rosas' },
  { text: 'Trabajo desde casa y no tengo tiempo de cocinar. DeComer me salva la semana.', name: 'Lucía', location: 'General Paz' }
]

const faqs = [
  { q: '¿Las viandas vienen congeladas?', a: 'No. Nunca congelamos nada. Cocinamos hoy, te entregamos mañana.' },
  { q: '¿Dónde hacen delivery?', a: 'Córdoba Capital. Barrios: Nueva Córdoba, Centro, Cerro, Urca, Cofico, Alberdi, General Paz, Alto Alberdi, Jardín, y alrededores.' },
  { q: '¿Puedo elegir las viandas?', a: 'Sí. Cada semana publicamos el menú y vos elegís cuáles querés. Si no elegís, te mandamos las más populares.' },
  { q: '¿Cómo caliento las viandas?', a: 'Microondas 3-4 minutos o sartén/horno si preferís. Vienen listas, solo calentar.' },
  { q: '¿Puedo pausar mi suscripción?', a: 'Sí, cuando quieras. Desde la app pausás o cancelás sin drama.' }
]
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-neutral-950">

    <!-- HERO -->
    <section class="relative overflow-hidden pt-24 pb-20 px-6">
      <div class="max-w-5xl mx-auto text-center">
        <UBadge color="primary" variant="subtle" class="mb-6 text-sm">
          📍 Delivery en Córdoba Capital
        </UBadge>

        <h1 class="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-neutral-900 dark:text-white">
          Comes bien.<br>
          <span class="text-primary-500">Nosotros cocinamos.</span>
        </h1>

        <p class="text-xl text-neutral-500 dark:text-neutral-400 mb-10 max-w-2xl mx-auto">
          Viandas frescas, nunca congeladas. En tu puerta cuando las necesités.
        </p>

        <div class="flex flex-col sm:flex-row gap-4 justify-center">
          <UButton
            to="/buscar"
            size="xl"
            label="Ver el menú"
            icon="i-lucide-utensils"
          />
          <UButton
            to="#como-funciona"
            size="xl"
            color="neutral"
            variant="outline"
            label="¿Cómo funciona?"
            icon="i-lucide-circle-play"
          />
        </div>
      </div>
    </section>

    <!-- VALUE PROPS -->
    <section class="py-16 px-6 bg-neutral-50 dark:bg-neutral-900">
      <div class="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
        <div class="text-center">
          <div class="text-4xl mb-4">🍳</div>
          <h3 class="font-bold text-lg mb-2">Cocinado hoy</h3>
          <p class="text-neutral-500 dark:text-neutral-400">Preparamos todo fresco. Nada sale del freezer, todo sale de la cocina.</p>
        </div>
        <div class="text-center">
          <div class="text-4xl mb-4">🚴</div>
          <h3 class="font-bold text-lg mb-2">En tu puerta</h3>
          <p class="text-neutral-500 dark:text-neutral-400">Delivery en Córdoba Capital. Llega frío, listo para calentar y comer.</p>
        </div>
        <div class="text-center">
          <div class="text-4xl mb-4">📅</div>
          <h3 class="font-bold text-lg mb-2">Vos elegís</h3>
          <p class="text-neutral-500 dark:text-neutral-400">Suscripción semanal, mensual o pedido único. Pausás cuando quieras.</p>
        </div>
      </div>
    </section>

    <!-- CÓMO FUNCIONA -->
    <section id="como-funciona" class="py-20 px-6">
      <div class="max-w-4xl mx-auto">
        <div class="text-center mb-14">
          <h2 class="text-4xl font-bold mb-3">Tres pasos. Cero drama.</h2>
        </div>

        <div class="grid md:grid-cols-3 gap-10">
          <div v-for="(step, i) in [
            { n: '01', title: 'Elegís tu plan', desc: '5 o 10 viandas por semana. O pedí cuando quieras, sin compromiso.' },
            { n: '02', title: 'Armás tu semana', desc: 'Mirá el menú y elegí las viandas que querés. Cambiá cada semana.' },
            { n: '03', title: 'Te las llevamos', desc: 'Llegan frescas a tu puerta. Calentá y comé. Eso es todo.' }
          ]" :key="i" class="relative">
            <div class="text-6xl font-bold text-primary-100 dark:text-primary-900 mb-4 select-none">{{ step.n }}</div>
            <h3 class="text-xl font-bold mb-2">{{ step.title }}</h3>
            <p class="text-neutral-500 dark:text-neutral-400">{{ step.desc }}</p>
          </div>
        </div>
      </div>
    </section>

    <!-- DIFERENCIADORES -->
    <section class="py-20 px-6 bg-neutral-50 dark:bg-neutral-900">
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-14">
          <h2 class="text-4xl font-bold">Por qué DeComer</h2>
        </div>

        <div class="grid md:grid-cols-2 gap-6">
          <div v-for="item in [
            { icon: 'i-lucide-snowflake-off', title: 'Nunca congelamos', desc: 'Otras marcas congelan y recalientan. Nosotros cocinamos hoy, entregamos mañana. La diferencia se nota.' },
            { icon: 'i-lucide-smartphone', title: 'Pedí desde la app', desc: 'Nada de WhatsApp ni "te confirmo mañana". Elegí, pagá, listo. Como debería ser en 2026.' },
            { icon: 'i-lucide-chef-hat', title: 'Cocinado por un chef', desc: 'No es una fábrica. Es una cocina con un chef que le pone ganas. Se llama Lighuen.' },
            { icon: 'i-lucide-lock-open', title: 'Sin ataduras', desc: 'Pausá, cancelá, cambiá de plan. Sin penalidades, sin letra chica.' }
          ]" :key="item.title"
            class="flex gap-4 p-6 rounded-2xl bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
            <UIcon :name="item.icon" class="w-6 h-6 text-primary-500 shrink-0 mt-1" />
            <div>
              <h3 class="font-bold mb-1">{{ item.title }}</h3>
              <p class="text-neutral-500 dark:text-neutral-400 text-sm">{{ item.desc }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- MENÚ PREVIEW -->
    <section class="py-20 px-6">
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-10">
          <h2 class="text-4xl font-bold mb-3">Esta semana cocinamos...</h2>
          <p class="text-neutral-500 dark:text-neutral-400">El menú rota cada semana. Siempre hay opciones para todos.</p>
        </div>

        <!-- Tag filter -->
        <div class="flex flex-wrap gap-2 justify-center mb-10">
          <UButton
            v-for="tag in tags"
            :key="tag"
            :label="tag"
            :color="activeTag === tag ? 'primary' : 'neutral'"
            :variant="activeTag === tag ? 'solid' : 'outline'"
            size="sm"
            @click="activeTag = tag"
          />
        </div>

        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="item in filteredMenu"
            :key="item.name"
            class="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-800"
          >
            <UBadge :label="item.tag" color="primary" variant="subtle" class="mb-3" />
            <h4 class="font-semibold mb-2">{{ item.name }}</h4>
            <p class="text-xs text-neutral-400 mb-1">{{ item.macros }}</p>
            <p class="text-xs font-medium text-primary-500">{{ item.kcal }}</p>
          </div>
        </div>

        <div class="text-center mt-10">
          <UButton to="/buscar" label="Ver menú completo" icon="i-lucide-arrow-right" trailing />
        </div>
      </div>
    </section>

    <!-- PLANES -->
    <section class="py-20 px-6 bg-neutral-50 dark:bg-neutral-900">
      <div class="max-w-6xl mx-auto">
        <div class="text-center mb-14">
          <h2 class="text-4xl font-bold mb-3">Elegí tu ritmo</h2>
          <p class="text-neutral-500 dark:text-neutral-400">Más viandas = mejor precio. Envío siempre incluido.</p>
        </div>

        <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div
            v-for="plan in plans"
            :key="plan.name"
            :class="[
              'relative rounded-2xl p-6 border flex flex-col',
              plan.highlight
                ? 'bg-primary-500 border-primary-500 text-white'
                : 'bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700'
            ]"
          >
            <div v-if="plan.highlight" class="absolute -top-3 left-1/2 -translate-x-1/2">
              <UBadge label="⭐ Más popular" color="neutral" class="shadow" />
            </div>

            <div class="mb-4">
              <div class="flex items-center gap-2 mb-1">
                <h3 class="font-bold text-lg">{{ plan.name }}</h3>
                <UBadge v-if="plan.discount" :label="plan.discount" color="primary" variant="subtle" size="xs" :class="plan.highlight ? 'bg-white/20 text-white' : ''" />
              </div>
              <p :class="plan.highlight ? 'text-primary-100' : 'text-neutral-500'" class="text-sm">{{ plan.subtitle }}</p>
            </div>

            <div class="mb-6">
              <span class="text-3xl font-bold">{{ plan.price }}</span>
              <span :class="plan.highlight ? 'text-primary-100' : 'text-neutral-400'" class="text-sm ml-1">{{ plan.unit }}</span>
            </div>

            <ul class="space-y-2 mb-8 flex-1">
              <li v-for="f in plan.features" :key="f" class="flex items-start gap-2 text-sm">
                <UIcon name="i-lucide-check" :class="plan.highlight ? 'text-white' : 'text-primary-500'" class="w-4 h-4 mt-0.5 shrink-0" />
                <span :class="plan.highlight ? 'text-primary-50' : 'text-neutral-600 dark:text-neutral-300'">{{ f }}</span>
              </li>
            </ul>

            <UButton
              :label="plan.cta"
              :color="plan.highlight ? 'neutral' : 'primary'"
              :variant="plan.highlight ? 'solid' : 'outline'"
              block
              to="/login"
            />
          </div>
        </div>

        <p class="text-center text-sm text-neutral-400 mt-6">
          Precios en ARS. Todos los planes incluyen envío en Córdoba Capital. Podés pausar o cancelar cuando quieras.
        </p>
      </div>
    </section>

    <!-- TESTIMONIOS -->
    <section class="py-20 px-6">
      <div class="max-w-5xl mx-auto">
        <div class="text-center mb-14">
          <h2 class="text-4xl font-bold">Lo que dicen</h2>
        </div>

        <div class="grid md:grid-cols-3 gap-6">
          <div
            v-for="t in testimonials"
            :key="t.name"
            class="p-6 rounded-2xl bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700"
          >
            <p class="text-neutral-700 dark:text-neutral-300 mb-4 italic">"{{ t.text }}"</p>
            <div>
              <p class="font-semibold">{{ t.name }}</p>
              <p class="text-sm text-neutral-400">{{ t.location }}</p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- FAQ -->
    <section class="py-20 px-6 bg-neutral-50 dark:bg-neutral-900">
      <div class="max-w-3xl mx-auto">
        <div class="text-center mb-14">
          <h2 class="text-4xl font-bold">Preguntas frecuentes</h2>
        </div>

        <UAccordion :items="faqs.map(f => ({ label: f.q, content: f.a }))" />
      </div>
    </section>

    <!-- CTA FINAL -->
    <section class="py-24 px-6 text-center">
      <div class="max-w-2xl mx-auto">
        <h2 class="text-4xl font-bold mb-4">¿Listo para comer bien?</h2>
        <p class="text-neutral-500 dark:text-neutral-400 mb-10">Primera semana sin compromiso. Cancelás cuando querés.</p>
        <UButton
          to="/login"
          size="xl"
          label="Empezar ahora"
          icon="i-lucide-arrow-right"
          trailing
        />
      </div>
    </section>

  </div>
</template>
