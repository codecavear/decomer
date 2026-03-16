// Push notification composable
// Handles subscription, permission request, and service worker registration

export function usePush() {
  const isSupported = computed(() =>
    import.meta.client && 'serviceWorker' in navigator && 'PushManager' in window
  )

  const permission = ref<NotificationPermission>('default')
  const isSubscribed = ref(false)

  const checkPermission = () => {
    if (import.meta.client && 'Notification' in window) {
      permission.value = Notification.permission
    }
  }

  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported.value) return false

    const result = await Notification.requestPermission()
    permission.value = result
    return result === 'granted'
  }

  const subscribe = async (): Promise<PushSubscription | null> => {
    if (!isSupported.value) return null

    const granted = await requestPermission()
    if (!granted) return null

    try {
      const registration = await navigator.serviceWorker.ready
      const existing = await registration.pushManager.getSubscription()
      if (existing) {
        isSubscribed.value = true
        return existing
      }

      // VAPID public key — replace with env var in production
      const vapidPublicKey = useRuntimeConfig().public.vapidPublicKey as string
      if (!vapidPublicKey) {
        console.warn('VAPID public key not configured')
        return null
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
      })

      // Save subscription to server
      await $fetch('/api/push/subscribe', {
        method: 'POST',
        body: subscription.toJSON()
      })

      isSubscribed.value = true
      return subscription
    } catch {
      console._error('Push subscription failed:', _error)
      return null
    }
  }

  const unsubscribe = async (): Promise<void> => {
    if (!isSupported.value) return

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        await subscription.unsubscribe()
        await $fetch('/api/push/unsubscribe', { method: 'POST' })
        isSubscribed.value = false
      }
    } catch {
      console._error('Push unsubscribe failed:', _error)
    }
  }

  onMounted(() => {
    checkPermission()
  })

  return {
    isSupported,
    permission: readonly(permission),
    isSubscribed: readonly(isSubscribed),
    requestPermission,
    subscribe,
    unsubscribe
  }
}

// Helper: convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
}
