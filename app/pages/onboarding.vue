<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Bienvenido a DeComer',
  robots: 'noindex'
})

const router = useRouter()
const toast = useToast()
const { loggedIn } = useUserSession()

// Redirect if already onboarded
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
    cta: 'Continuar'
  },
  {
    icon: '🔑',
    title: 'Creá tu cuenta',
    body: 'Guardamos tu plan y dirección. En un click estás adentro.',
    cta: null // handled manually
  },
  {
    icon: '🎉',
    title: '¡Todo listo!',
    body: 'Ya podés ver el menú y armar tu primer pedido.',
    cta: 'Ver menú'
  }
]

const LAST_STEP = steps.length - 1
const AUTH_STEP = 5

// Step data
const selectedPlan = ref<string | null>(null)
const address = ref('')

// Magic link state
const email = ref('')
const loadingMagicLink = ref(false)
const emailSent = ref(false)

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

function saveOnboardingData() {
  if (import.meta.client) {
    if (selectedPlan.value) localStorage.setItem('decomer_selected_plan', selectedPlan.value)
    if (address.value) localStorage.setItem('decomer_address', address.value)
    localStorage.setItem('decomer_onboarding_done', '1')
  }
}

const next = () => {
  if (step.value < LAST_STEP) {
    step.value++
  } else {
    saveOnboardingData()
    router.push('/buscar')
  }
}

const skip = () => {
  saveOnboardingData()
  router.push('/buscar')
}

async function sendMagicLink() {
  if (!email.value) return
  loadingMagicLink.value = true
  try {
    await $fetch('/api/auth/magic-link', {
      method: 'POST',
      body: { email: email.value }
    })
    emailSent.value = true
    toast.add({
      title: '¡Email enviado!',
      description: 'Revisá tu bandeja de entrada',
      color: 'success'
    })
  } catch (error: unknown) {
    const err = error as { data?: { message?: string } }
    toast.add({
      title: 'Error',
      description: err.data?.message || 'No se pudo enviar el email',
      color: 'error'
    })
  } finally {
    loadingMagicLink.value = false
  }
}

// If user already logged in when they reach the auth step, advance automatically
watch([loggedIn, step], ([logged, s]) => {
  if (logged && s === AUTH_STEP) {
    saveOnboardingData()
    step.value = LAST_STEP
  }
})
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

    <!-- Skip button (hide on auth + final step) -->
    <div class="flex justify-end px-6">
      <UButton
        v-if="step < LAST_STEP && step !== AUTH_STEP"
        label="Saltar"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="skip"
      />
    </div>

    <!-- Step content -->
    <Transition name="slide" mode="out-in">
      <div :key="step" class="flex-1 flex flex-col items-center justify-center px-8 text-center max-w-md mx-auto w-full">

        <!-- Icon -->
        <div class="text-7xl mb-8 select-none">{{ steps[step].icon }}</div>

        <!-- Title -->
        <h1 class="text-3xl font-bold mb-4 text-neutral-900 dark:text-white">
          {{ steps[step].title }}
        </h1>

        <!-- Body text -->
        <p v-if="steps[step].body" class="text-lg text-neutral-500 dark:text-neutral-400 mb-10 leading-relaxed">
          {{ steps[step].body }}
        </p>

        <!-- Step 3: Plan selector -->
        <div v-if="step === 3" class="w-full space-y-3 mb-10 text-left">
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
                <UBadge v-if="plan.highlight" label="Popular" color="primary" size="xs" class="ml-2" />
              </p>
              <p class="text-sm text-neutral-500">{{ plan.sub }}</p>
            </div>
            <UIcon
              :name="selectedPlan === plan.id ? 'i-lucide-check-circle' : 'i-lucide-circle'"
              :class="selectedPlan === plan.id ? 'text-primary-500' : 'text-neutral-300'"
              class="w-5 h-5 shrink-0"
            />
          </button>
        </div>

        <!-- Step 4: Address input -->
        <div v-if="step === 4" class="w-full mb-10">
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

        <!-- Step 5: Account creation -->
        <div v-if="step === AUTH_STEP" class="w-full mb-6">

          <!-- Email sent confirmation -->
          <div
            v-if="emailSent"
            class="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-2xl mb-4"
          >
            <UIcon name="i-lucide-mail-check" class="w-12 h-12 text-green-600 mx-auto mb-3" />
            <p class="font-semibold text-neutral-900 dark:text-white mb-1">¡Revisá tu email!</p>
            <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-4">
              Te enviamos un link a <strong>{{ email }}</strong>
            </p>
            <UButton variant="ghost" size="sm" @click="emailSent = false">
              Usar otro email
            </UButton>
          </div>

          <!-- Auth form -->
          <div v-else class="space-y-4 text-left">
            <!-- Magic link form -->
            <form class="space-y-3" @submit.prevent="sendMagicLink">
              <UFormField label="Email">
                <UInput
                  v-model="email"
                  type="email"
                  placeholder="tu@email.com"
                  size="lg"
                  :disabled="loadingMagicLink"
                  autocomplete="email"
                  required
                />
              </UFormField>
              <UButton
                type="submit"
                block
                size="lg"
                :loading="loadingMagicLink"
                :disabled="!email"
              >
                <UIcon name="i-lucide-mail" class="w-4 h-4 mr-2" />
                Continuar con email
              </UButton>
            </form>

            <!-- Divider -->
            <div class="relative py-2">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-neutral-200 dark:border-neutral-700" />
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-4 bg-white dark:bg-neutral-950 text-neutral-400">o</span>
              </div>
            </div>

            <!-- Google OAuth -->
            <UButton
              to="/auth/google"
              external
              variant="outline"
              block
              size="lg"
            >
              <UIcon name="i-simple-icons-google" class="w-5 h-5 mr-2" />
              Continuar con Google
            </UButton>

            <!-- Skip account creation -->
            <p class="text-center">
              <UButton
                variant="ghost"
                size="sm"
                color="neutral"
                @click="skip"
              >
                Continuar sin cuenta
              </UButton>
            </p>

            <p class="text-xs text-center text-neutral-400">
              Al continuar, aceptás nuestros Términos de Servicio.
            </p>
          </div>
        </div>

      </div>
    </Transition>

    <!-- CTA (skip on auth step — buttons are inline) -->
    <div v-if="step !== AUTH_STEP" class="px-8 pb-12 max-w-md mx-auto w-full">
      <UButton
        :label="steps[step].cta ?? ''"
        :disabled="!canContinue"
        size="xl"
        block
        @click="next"
      />
    </div>
    <!-- Spacer on auth step to keep layout consistent -->
    <div v-else class="pb-12" />

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
