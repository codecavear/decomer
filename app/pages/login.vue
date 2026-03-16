<script setup lang="ts">
const { t } = useI18n()
const { loggedIn } = useUserSession()
const route = useRoute()
const toast = useToast()

definePageMeta({
  layout: 'auth'
})

useSeoMeta({
  title: 'Iniciar Sesión',
  description: 'Accedé a tu cuenta de DeComer para gestionar tu cuenta de DeComer. Login seguro con Google o email.'
})

// Store redirect URL in cookie for OAuth callback to use
const authRedirectCookie = useCookie('auth_redirect', {
  maxAge: 60 * 5, // 5 minutes
  path: '/',
  sameSite: 'lax'
})

// Set redirect cookie immediately if present in query
const redirectParam = route.query.redirect as string | undefined
if (redirectParam) {
  authRedirectCookie.value = redirectParam
}

// Redirect logged-in users
if (loggedIn.value) {
  // If there's a pending redirect, honor it
  if (authRedirectCookie.value) {
    const redirectTo = authRedirectCookie.value
    authRedirectCookie.value = null
    navigateTo(redirectTo)
  } else {
    navigateTo('/')
  }
}

// Handle error query params
const errorParam = route.query.error as string | undefined
if (errorParam) {
  const errorMessages: Record<string, string> = {
    missing_token: 'El link no es válido',
    invalid_token: 'El link expiró o ya fue usado',
    user_creation_failed: 'Error al crear la cuenta'
  }
  toast.add({
    title: 'Error de autenticación',
    description: errorMessages[errorParam] || 'Ocurrió un error',
    color: 'error'
  })
}

// Magic Link state
const email = ref('')
const loading = ref(false)
const emailSent = ref(false)

async function sendMagicLink() {
  if (!email.value) return

  loading.value = true
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
    loading.value = false
  }
}

const providers = [{
  label: t('auth.continueGoogle'),
  icon: 'i-simple-icons-google',
  to: '/auth/google',
  external: true
}]
</script>

<template>
  <div class="w-full max-w-sm mx-auto">
    <div class="text-center mb-8">
      <UIcon
        name="i-lucide-lock"
        class="w-12 h-12 text-primary mx-auto mb-4"
      />
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
        {{ t('auth.welcomeBack') }}
      </h1>
      <p class="text-gray-600 dark:text-gray-400 mt-2">
        {{ t('auth.signInAccess') }}
      </p>
    </div>

    <!-- Email Sent State -->
    <div
      v-if="emailSent"
      class="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg"
    >
      <UIcon
        name="i-lucide-mail-check"
        class="w-16 h-16 text-green-600 mx-auto mb-4"
      />
      <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        ¡Revisá tu email!
      </h2>
      <p class="text-gray-600 dark:text-gray-400 mb-4">
        Te enviamos un link a <strong>{{ email }}</strong>
      </p>
      <UButton
        variant="ghost"
        @click="emailSent = false"
      >
        Usar otro email
      </UButton>
    </div>

    <!-- Login Form -->
    <div
      v-else
      class="space-y-6"
    >
      <!-- Magic Link Form -->
      <form
        class="space-y-4"
        @submit.prevent="sendMagicLink"
      >
        <UFormField label="Email">
          <UInput
            v-model="email"
            type="email"
            placeholder="tu@email.com"
            size="lg"
            :disabled="loading"
            autocomplete="email"
            required
          />
        </UFormField>
        <UButton
          type="submit"
          block
          size="lg"
          :loading="loading"
          :disabled="!email"
        >
          <UIcon
            name="i-lucide-mail"
            class="w-4 h-4 mr-2"
          />
          Continuar con email
        </UButton>
      </form>

      <!-- Divider -->
      <div class="relative">
        <div class="absolute inset-0 flex items-center">
          <div class="w-full border-t border-gray-200 dark:border-gray-700" />
        </div>
        <div class="relative flex justify-center text-sm">
          <span class="px-4 bg-white dark:bg-gray-900 text-gray-500">
            o
          </span>
        </div>
      </div>

      <!-- Google OAuth -->
      <UButton
        v-for="provider in providers"
        :key="provider.label"
        :to="provider.to"
        :external="provider.external"
        variant="outline"
        block
        size="lg"
      >
        <UIcon
          :name="provider.icon"
          class="w-5 h-5 mr-2"
        />
        {{ provider.label }}
      </UButton>

      <!-- Footer -->
      <p class="text-xs text-center text-gray-500 dark:text-gray-400">
        {{ t('auth.agreementText') }}
      </p>
    </div>
  </div>
</template>
