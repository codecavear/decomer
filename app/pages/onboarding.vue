<script setup lang="ts">
definePageMeta({
  layout: false
})

useSeoMeta({
  title: 'Bienvenido a DeComer',
  robots: 'noindex,nofollow'
})

const router = useRouter()
const toast = useToast()
const { loggedIn } = useUserSession()
const onboarding = useOnboarding()

const {
  step,
  direction,
  selectedPlan,
  address,
  canAdvance,
  isFirst,
  isLast,
  totalSteps,
  next,
  back,
  save,
  isDone,
  STEP_PLAN,
  STEP_ZONE,
  STEP_ACCOUNT,
  STEP_DONE
} = onboarding

// Redirect if already onboarded and logged in
onMounted(() => {
  if (isDone() && loggedIn.value) {
    router.replace('/buscar')
  }
})

// Plans data
const plans = [
  {
    id: 'unico' as const,
    label: 'Solo quiero probar',
    sub: 'Pedido único, mínimo 3 viandas',
    icon: '🧪',
    highlight: false
  },
  {
    id: 'basic' as const,
    label: 'Básico',
    sub: '5 viandas por semana',
    icon: '🥗',
    highlight: false
  },
  {
    id: 'full' as const,
    label: 'Full',
    sub: '10 viandas por semana',
    icon: '💪',
    highlight: true
  },
  {
    id: 'premium' as const,
    label: 'Premium',
    sub: '10 viandas + seguimiento nutricional',
    icon: '⭐',
    highlight: false
  }
]

// Auth state
const email = ref('')
const loadingMagicLink = ref(false)
const emailSent = ref(false)

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

function handleContinue() {
  if (step.value < totalSteps - 1) {
    next()
  } else {
    router.push('/buscar')
  }
}

function handleSkip() {
  save()
  // Jump directly to done screen skipping account creation
  direction.value = 'forward'
  step.value = STEP_DONE
}

function goToMenu() {
  router.push('/buscar')
}

// When user logs in at auth step, advance to done screen
watch([loggedIn, step], ([logged, s]) => {
  if (logged && s === STEP_ACCOUNT) {
    save()
    next()
  }
})
</script>

<template>
  <div class="min-h-screen bg-white dark:bg-neutral-950 flex flex-col">

    <!-- Top bar -->
    <div class="flex items-center justify-between px-5 pt-12 pb-4">
      <!-- Back button -->
      <UButton
        v-if="!isFirst"
        icon="i-lucide-arrow-left"
        color="neutral"
        variant="ghost"
        size="sm"
        class="rounded-full"
        aria-label="Volver"
        @click="back"
      />
      <div v-else class="w-9" />

      <!-- Progress dots -->
      <div class="flex items-center gap-1.5">
        <div
          v-for="i in totalSteps"
          :key="i"
          :class="[
            'rounded-full transition-all duration-300',
            i - 1 === step
              ? 'w-5 h-2 bg-primary-500'
              : i - 1 < step
                ? 'w-2 h-2 bg-primary-300'
                : 'w-2 h-2 bg-neutral-200 dark:bg-neutral-700'
          ]"
        />
      </div>

      <!-- Skip -->
      <UButton
        v-if="step < totalSteps - 1 && step !== STEP_ACCOUNT"
        label="Saltar"
        color="neutral"
        variant="ghost"
        size="sm"
        @click="handleSkip"
      />
      <div v-else class="w-12" />
    </div>

    <!-- Step content with direction-aware animation -->
    <Transition :name="direction === 'forward' ? 'slide-forward' : 'slide-back'" mode="out-in">
      <div
        :key="step"
        class="flex-1 flex flex-col items-center px-6 pt-6 pb-4 max-w-md mx-auto w-full"
      >

        <!-- === SCREEN 1: Welcome === -->
        <template v-if="step === 0">
          <div class="flex-1 flex flex-col items-center justify-center text-center">
            <div class="text-8xl mb-8 select-none leading-none">🌱</div>
            <h1 class="text-3xl font-bold text-neutral-900 dark:text-white mb-4 leading-tight">
              Bienvenido a DeComer
            </h1>
            <p class="text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs">
              La primera app de viandas de Córdoba. Frescas, nunca congeladas.
            </p>
          </div>
        </template>

        <!-- === SCREEN 2: How it works === -->
        <template v-else-if="step === 1">
          <div class="flex-1 flex flex-col items-center justify-center text-center">
            <div class="text-8xl mb-8 select-none leading-none">👨‍🍳</div>
            <h1 class="text-3xl font-bold text-neutral-900 dark:text-white mb-4 leading-tight">
              Lighuen cocina todo
            </h1>
            <p class="text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed mb-10 max-w-xs">
              Cada vianda pasa por las manos de nuestro chef. Cocina real, no una fábrica.
            </p>
            <!-- 3-step visual -->
            <div class="w-full space-y-3">
              <div
                v-for="(item, i) in [
                  { icon: '📋', label: 'Elegís tus viandas del menú' },
                  { icon: '🍳', label: 'Lighuen las cocina fresquitas' },
                  { icon: '🚴', label: 'Te las entregamos al día siguiente' }
                ]"
                :key="i"
                class="flex items-center gap-4 p-4 bg-neutral-50 dark:bg-neutral-900 rounded-2xl text-left"
              >
                <span class="text-2xl">{{ item.icon }}</span>
                <span class="text-sm font-medium text-neutral-700 dark:text-neutral-300">{{ item.label }}</span>
              </div>
            </div>
          </div>
        </template>

        <!-- === SCREEN 3: Choose plan === -->
        <template v-else-if="step === STEP_PLAN">
          <div class="flex-1 flex flex-col w-full">
            <div class="text-center mb-8 pt-4">
              <h1 class="text-3xl font-bold text-neutral-900 dark:text-white mb-3 leading-tight">
                ¿Cómo querés comer?
              </h1>
              <p class="text-base text-neutral-500 dark:text-neutral-400">
                Podés cambiar tu plan cuando quieras.
              </p>
            </div>
            <div class="space-y-3">
              <button
                v-for="plan in plans"
                :key="plan.id"
                :class="[
                  'w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 text-left',
                  selectedPlan === plan.id
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/60 shadow-sm'
                    : 'border-neutral-200 dark:border-neutral-700 hover:border-primary-300 dark:hover:border-primary-700'
                ]"
                @click="selectedPlan = plan.id"
              >
                <span class="text-2xl leading-none">{{ plan.icon }}</span>
                <div class="flex-1 min-w-0">
                  <p
                    :class="[
                      'font-semibold text-sm',
                      selectedPlan === plan.id
                        ? 'text-primary-700 dark:text-primary-400'
                        : 'text-neutral-900 dark:text-white'
                    ]"
                  >
                    {{ plan.label }}
                    <UBadge
                      v-if="plan.highlight"
                      label="Popular"
                      color="primary"
                      size="xs"
                      class="ml-2 align-middle"
                    />
                  </p>
                  <p class="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">{{ plan.sub }}</p>
                </div>
                <UIcon
                  :name="selectedPlan === plan.id ? 'i-lucide-check-circle' : 'i-lucide-circle'"
                  :class="[
                    'w-5 h-5 shrink-0',
                    selectedPlan === plan.id ? 'text-primary-500' : 'text-neutral-300 dark:text-neutral-600'
                  ]"
                />
              </button>
            </div>
          </div>
        </template>

        <!-- === SCREEN 4: Delivery zone === -->
        <template v-else-if="step === STEP_ZONE">
          <div class="flex-1 flex flex-col w-full">
            <div class="text-center mb-8 pt-4">
              <div class="text-7xl mb-6 leading-none">📍</div>
              <h1 class="text-3xl font-bold text-neutral-900 dark:text-white mb-3 leading-tight">
                ¿Dónde te llevamos?
              </h1>
              <p class="text-base text-neutral-500 dark:text-neutral-400">
                Ingresá tu dirección de entrega en Córdoba Capital.
              </p>
            </div>
            <div class="space-y-4">
              <UFormField label="Dirección">
                <UInput
                  v-model="address"
                  placeholder="Ej: Av. Colón 1234"
                  icon="i-lucide-map-pin"
                  size="lg"
                  autocomplete="street-address"
                />
              </UFormField>
              <div class="p-4 bg-neutral-50 dark:bg-neutral-900 rounded-2xl">
                <p class="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  <UIcon name="i-lucide-info" class="w-3.5 h-3.5 inline mr-1 align-text-bottom" />
                  Por ahora entregamos en <strong class="text-neutral-700 dark:text-neutral-300">Córdoba Capital</strong>:
                  Nueva Córdoba, Centro, Cerro, Urca, Cofico, Alberdi, General Paz y alrededores.
                </p>
              </div>
            </div>
          </div>
        </template>

        <!-- === SCREEN 5: Create account === -->
        <template v-else-if="step === STEP_ACCOUNT">
          <div class="flex-1 flex flex-col w-full">
            <div class="text-center mb-8 pt-4">
              <div class="text-7xl mb-6 leading-none">🔑</div>
              <h1 class="text-3xl font-bold text-neutral-900 dark:text-white mb-3 leading-tight">
                Creá tu cuenta
              </h1>
              <p class="text-base text-neutral-500 dark:text-neutral-400">
                Guardamos tu plan y dirección. En un click estás adentro.
              </p>
            </div>

            <!-- Email sent -->
            <div
              v-if="emailSent"
              class="flex-1 flex flex-col items-center justify-center text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-2xl"
            >
              <UIcon name="i-lucide-mail-check" class="w-16 h-16 text-green-600 mx-auto mb-4" />
              <p class="font-semibold text-neutral-900 dark:text-white mb-2 text-lg">¡Revisá tu email!</p>
              <p class="text-sm text-neutral-500 dark:text-neutral-400 mb-6">
                Te enviamos un link a <strong>{{ email }}</strong>
              </p>
              <UButton variant="ghost" size="sm" color="neutral" @click="emailSent = false">
                Usar otro email
              </UButton>
            </div>

            <!-- Auth form -->
            <div v-else class="space-y-4">
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

              <div class="relative py-1">
                <div class="absolute inset-0 flex items-center">
                  <div class="w-full border-t border-neutral-200 dark:border-neutral-700" />
                </div>
                <div class="relative flex justify-center text-sm">
                  <span class="px-4 bg-white dark:bg-neutral-950 text-neutral-400">o</span>
                </div>
              </div>

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

              <p class="text-center pt-2">
                <UButton
                  variant="ghost"
                  size="sm"
                  color="neutral"
                  @click="handleSkip"
                >
                  Continuar sin cuenta
                </UButton>
              </p>

              <p class="text-xs text-center text-neutral-400 pt-1">
                Al continuar, aceptás nuestros
                <NuxtLink to="/terminos" class="underline underline-offset-2 hover:text-neutral-600 dark:hover:text-neutral-300">
                  Términos de Servicio
                </NuxtLink>.
              </p>
            </div>
          </div>
        </template>

        <!-- === SCREEN 6: All done === -->
        <template v-else-if="step === STEP_DONE">
          <div class="flex-1 flex flex-col items-center justify-center text-center">
            <div class="text-8xl mb-8 select-none leading-none">🎉</div>
            <h1 class="text-3xl font-bold text-neutral-900 dark:text-white mb-4 leading-tight">
              Todo listo
            </h1>
            <p class="text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-xs">
              Ya podés ver el menú y armar tu primer pedido.
            </p>
          </div>
        </template>

      </div>
    </Transition>

    <!-- Bottom CTA — hidden on auth and done steps (handled inline or separate) -->
    <div
      v-if="step !== STEP_ACCOUNT && step !== STEP_DONE"
      class="px-6 pb-12 pt-4 max-w-md mx-auto w-full"
    >
      <UButton
        :label="'Continuar'"
        :disabled="!canAdvance"
        size="xl"
        block
        @click="handleContinue"
      />
    </div>
    <div v-else-if="step === STEP_DONE" class="px-6 pb-12 pt-4 max-w-md mx-auto w-full">
      <UButton
        label="Ver menú"
        size="xl"
        block
        @click="goToMenu"
      />
    </div>
    <div v-else class="pb-8" />

  </div>
</template>

<style scoped>
/* Forward: slide in from right, out to left */
.slide-forward-enter-active,
.slide-forward-leave-active,
.slide-back-enter-active,
.slide-back-leave-active {
  transition: all 0.28s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-forward-enter-from {
  opacity: 0;
  transform: translateX(32px);
}
.slide-forward-leave-to {
  opacity: 0;
  transform: translateX(-32px);
}

/* Back: slide in from left, out to right */
.slide-back-enter-from {
  opacity: 0;
  transform: translateX(-32px);
}
.slide-back-leave-to {
  opacity: 0;
  transform: translateX(32px);
}
</style>
