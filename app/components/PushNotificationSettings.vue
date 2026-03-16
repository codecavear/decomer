<script setup lang="ts">
const toast = useToast()
const { isSupported, permission, isSubscribed, subscribeToPush, unsubscribe, checkSubscription } = usePushNotifications()

onMounted(() => {
  checkSubscription()
})

const isLoading = ref(false)

const toggle = async () => {
  isLoading.value = true
  try {
    if (isSubscribed.value) {
      const ok = await unsubscribe()
      if (ok) {
        toast.add({ title: $t('pwa.push.disabled'), color: 'neutral', icon: 'i-lucide-bell-off' })
      }
    } else {
      const ok = await subscribeToPush()
      if (ok) {
        toast.add({ title: $t('pwa.push.enabled'), color: 'success', icon: 'i-lucide-bell' })
      } else if (permission.value === 'denied') {
        toast.add({ title: $t('pwa.push.denied'), color: 'error', icon: 'i-lucide-bell-off' })
      }
    }
  } finally {
    isLoading.value = false
  }
}

const { t: $t } = useI18n()
</script>

<template>
  <div v-if="isSupported" class="flex items-start justify-between gap-4">
    <div class="flex-1 min-w-0">
      <p class="font-medium text-sm">
        {{ $t('pwa.push.title') }}
      </p>
      <p class="text-xs text-neutral-500 mt-0.5">
        {{ $t('pwa.push.description') }}
      </p>
      <p v-if="permission === 'denied'" class="text-xs text-red-500 mt-1">
        {{ $t('pwa.push.blockedHint') }}
      </p>
    </div>
    <UButton
      :icon="isSubscribed ? 'i-lucide-bell' : 'i-lucide-bell-off'"
      :color="isSubscribed ? 'primary' : 'neutral'"
      :variant="isSubscribed ? 'solid' : 'outline'"
      :loading="isLoading"
      :disabled="permission === 'denied'"
      size="sm"
      :aria-label="isSubscribed ? $t('pwa.push.disableButton') : $t('pwa.push.enableButton')"
      :label="isSubscribed ? $t('pwa.push.disableButton') : $t('pwa.push.enableButton')"
      @click="toggle"
    />
  </div>
  <p v-else class="text-xs text-neutral-400">
    {{ $t('pwa.push.notSupported') }}
  </p>
</template>
