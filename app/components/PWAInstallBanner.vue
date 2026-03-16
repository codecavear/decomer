<script setup lang="ts">
const { canInstall, isStandalone, install } = usePWAInstall()

const DISMISS_KEY = 'decomer-pwa-banner-dismissed'
const dismissed = ref(false)

onMounted(() => {
  dismissed.value = localStorage.getItem(DISMISS_KEY) === 'true'
})

const dismiss = () => {
  dismissed.value = true
  localStorage.setItem(DISMISS_KEY, 'true')
}

const handleInstall = async () => {
  const installed = await install()
  if (installed) dismiss()
}

const visible = computed(() => canInstall.value && !isStandalone.value && !dismissed.value)
</script>

<template>
  <Transition
    enter-active-class="transition-all duration-300 ease-out"
    enter-from-class="translate-y-full opacity-0"
    enter-to-class="translate-y-0 opacity-100"
    leave-active-class="transition-all duration-200 ease-in"
    leave-from-class="translate-y-0 opacity-100"
    leave-to-class="translate-y-full opacity-0"
  >
    <div
      v-if="visible"
      class="fixed bottom-0 left-0 right-0 z-50 p-4 md:bottom-6 md:left-auto md:right-6 md:max-w-sm"
    >
      <UCard class="shadow-xl border border-gray-200 dark:border-gray-700">
        <div class="flex items-start gap-3">
          <img
            src="/favicon-192x192.png"
            alt="DeComer"
            class="size-12 rounded-xl flex-shrink-0"
          >
          <div class="flex-1 min-w-0">
            <p class="font-semibold text-sm text-gray-900 dark:text-white">
              {{ $t('pwa.install.title') }}
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {{ $t('pwa.install.description') }}
            </p>
            <div class="flex gap-2 mt-3">
              <UButton
                size="sm"
                color="primary"
                @click="handleInstall"
              >
                {{ $t('pwa.install.button') }}
              </UButton>
              <UButton
                size="sm"
                variant="ghost"
                color="neutral"
                @click="dismiss"
              >
                {{ $t('pwa.install.dismiss') }}
              </UButton>
            </div>
          </div>
          <UButton
            icon="i-lucide-x"
            variant="ghost"
            color="neutral"
            size="xs"
            class="flex-shrink-0 -mt-1 -mr-1"
            :aria-label="$t('pwa.install.dismiss')"
            @click="dismiss"
          />
        </div>
      </UCard>
    </div>
  </Transition>
</template>
