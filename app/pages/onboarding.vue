<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Bienvenido a DeComer',
  robots: 'noindex'
})

const router = useRouter()
const { loggedIn } = useUserSession()

// Redirect if already onboarded (has session)
// Onboarding is shown once, then skipped via localStorage flag
onMounted(() => {
  if (import.meta.client) {
    const done = localStorage.getItem('decomer_onboarding_done')
    if (done && loggedIn.value) {
      router.replace('/buscar')
    }
  }
})

const step = ref(0)

const steps = [
  {
    icon: '🍳',
    title: 'Bienvenido a DeComer',
    body: 'La primera app de viandas de Córdoba. Frescas, nunca congeladas.',
    cta: 'Continuar'
  },
  {
    icon: '👨‍🍳',
    title: 'Lighuen cocina todo',
    body: 'Cada vianda pasa por las manos de nuestro chef. Cocina real, no una fábrica.',
    cta: 'Continuar'
  },
  {
    icon: '📋',
    title: 'Elegís. Cocinamos. Entregamos.',
    body: 'Mirá el menú, elegí tus viandas favoritas, y nosotros nos encargamos del resto.',
    cta: 'Continuar'
  },
  {
    icon: '🎯',
    title: '¿Cómo querés comer?',
    body: null,
    cta: 'Continuar'
  },
  {
    icon: '📍',
    title: '¿Dónde te llevamos?',
    body: 'Por ahora entregamos en Córdoba Capital.',
    cta: 'Confirmar'
  },
  {
    icon: '🎉',
    title: '¡Todo listo!',
    body: 'Ya podés ver el menú y armar tu primer pedido.',
    cta: 'Ver menú'
  }
]

const selectedPlan = ref<string | null>(null)
const address = ref('')

const plans = [
  { id: 'unico', label: 'Solo quiero probar', sub: 'Pedido único, mínimo 3 viandas' },
  { id: 'basic', label: 'Básico', sub: '5 viandas/semana' },
  { id: 'full', label: 'Full', sub: '10 viandas/semana', highlight: true },
  { id: 'premium', label: 'Premium', sub: '10 viandas + nutrición' }
]

const canContinue = computed(() => {
  if (step.value === 3) return !!selectedPlan.value
  if (step.value === 4) return address.value.trim().length > 5
  return true
})

const next = () => {
  if (step.value < steps.length - 1) {
    step.value++
  } else {
    // Done — save flag and go to menu
    if (import.meta.client) {
      localStorage.setItem('decomer_onboarding_done', '1')
    }
    router.push('/buscar')
  }
}

const skip = () => {
  if (import.meta.client) {
    localStorage.setItem('decomer_onboarding_done', '1')
  }
  router.push('/buscar')
}
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-neutral-950 flex flex-col">
    <!-- Progress dots -->
    <div class="flex justify-center gap-2 pt-10 pb-6">
      <div
        v-for="(_, i) in steps"
        :key="i"
        :class="[
          'h-1.5 rounded-full transition-all duration-300',
          i === step ? 'w-6 bg-primary-500' : i < step ? 'w-3 bg-primary-300' : 'w-3 bg-neutral-200 dark:bg-neutral-700'
        ]"
      />
    </div>

    <!-- Skip button -->
    <div class="flex justify-end px-6">
      <UButton
        v-if="step < steps.length - 1"
        label="Saltar"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="skip"
      />
    </div>

    <!-- Step content -->
    <Transition
      name="slide"
      mode="out-in"
    >
      <div
        :key="step"
        class="flex-1 flex flex-col items-center justify-center px-8 text-center max-w-md mx-auto w-full"
      >
        <!-- Icon -->
        <div class="text-7xl mb-8 select-none">
          {{ steps[step].icon }}
        </div>

        <!-- Title -->
        <h1 class="text-3xl font-bold mb-4 text-neutral-900 dark:text-white">
          {{ steps[step].title }}
        </h1>

        <!-- Body text -->
        <p
          v-if="steps[step].body"
          class="text-lg text-neutral-500 dark:text-neutral-400 mb-10 leading-relaxed"
        >
          {{ steps[step].body }}
        </p>

        <!-- Step 3: Plan selector -->
        <div
          v-if="step === 3"
          class="w-full space-y-3 mb-10 text-left"
        >
          <button
            v-for="plan in plans"
            :key="plan.id"
            :class="[
              'w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all',
              selectedPlan === plan.id
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-950'
                : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300'
            ]"
            @click="selectedPlan = plan.id"
          >
            <div>
              <p :class="['font-semibold', plan.highlight ? 'text-primary-600 dark:text-primary-400' : '']">
                {{ plan.label }}
                <UBadge
                  v-if="plan.highlight"
                  label="Popular"
                  color="primary"
                  size="xs"
                  class="ml-2"
                />
              </p>
              <p class="text-sm text-neutral-500">
                {{ plan.sub }}
              </p>
            </div>
            <UIcon
              :name="selectedPlan === plan.id ? 'i-lucide-check-circle' : 'i-lucide-circle'"
              :class="selectedPlan === plan.id ? 'text-primary-500' : 'text-neutral-300'"
              class="w-5 h-5 shrink-0"
            />
          </button>
        </div>

        <!-- Step 4: Address input -->
        <div
          v-if="step === 4"
          class="w-full mb-10"
        >
          <UInput
            v-model="address"
            placeholder="Ej: Av. Colón 1234, Nueva Córdoba"
            icon="i-lucide-map-pin"
            size="lg"
            class="mb-3"
          />
          <p class="text-xs text-neutral-400">
            Barrios: Nueva Córdoba, Centro, Cerro, Urca, Cofico, Alberdi, General Paz y alrededores.
          </p>
        </div>
      </div>
    </Transition>

    <!-- CTA -->
    <div class="px-8 pb-12 max-w-md mx-auto w-full">
      <UButton
        :label="steps[step].cta"
        :disabled="!canContinue"
        size="xl"
        block
        @click="next"
      />
    </div>
  </div>
</template>

<style scoped>
.slide-enter-active,
.slide-leave-active {
  transition: all 0.25s ease;
}
.slide-enter-from {
  opacity: 0;
  transform: translateX(24px);
}
.slide-leave-to {
  opacity: 0;
  transform: translateX(-24px);
}
</style>
