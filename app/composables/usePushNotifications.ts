/**
 * usePushNotifications — Web Push composable
 * Handles permission, subscription, and unsubscription.
 */

export const usePushNotifications = () => {
  const permission = ref<NotificationPermission>('default')
  const isSubscribed = ref(false)

  const runtimeConfig = useRuntimeConfig()
  const vapidPublicKey = runtimeConfig.public.vapidPublicKey as string

  if (import.meta.client && 'Notification' in window) {
    permission.value = Notification.permission
  }

  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
    const rawData = atob(base64)
    return Uint8Array.from([...rawData].map(c => c.charCodeAt(0)))
  }

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!import.meta.client || !('Notification' in window)) {
      return 'denied'
    }

    const result = await Notification.requestPermission()
    permission.value = result
    return result
  }

  const subscribeToPush = async (): Promise<boolean> => {
    if (!import.meta.client) return false

    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[push] Push not supported in this browser')
      return false
    }

    const perm = await requestPermission()
    if (perm !== 'granted') return false

    try {
      const registration = await navigator.serviceWorker.ready
      const existing = await registration.pushManager.getSubscription()

      let subscription = existing
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
        })
      }

      const subscriptionJson = subscription.toJSON()
      await $fetch('/api/push/subscribe', {
        method: 'POST',
        body: {
          endpoint: subscriptionJson.endpoint,
          p256dh: subscriptionJson.keys?.p256dh,
          auth: subscriptionJson.keys?.auth
        }
      })

      isSubscribed.value = true
      return true
    } catch (err) {
      console.error('[push] Subscribe failed:', err)
      return false
    }
  }

  const unsubscribe = async (): Promise<boolean> => {
    if (!import.meta.client || !('serviceWorker' in navigator)) return false

    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        isSubscribed.value = false
        return true
      }

      await $fetch('/api/push/unsubscribe', {
        method: 'POST',
        body: { endpoint: subscription.endpoint }
      })

      await subscription.unsubscribe()
      isSubscribed.value = false
      return true
    } catch (err) {
      console.error('[push] Unsubscribe failed:', err)
      return false
    }
  }

  const checkSubscription = async () => {
    if (!import.meta.client || !('serviceWorker' in navigator)) return

    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    isSubscribed.value = !!subscription
  }

  return {
    permission: readonly(permission),
    isSubscribed: readonly(isSubscribed),
    requestPermission,
    subscribeToPush,
    unsubscribe,
    checkSubscription
  }
}
