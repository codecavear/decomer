/**
 * usePWA — Install prompt composable
 * Handles the `beforeinstallprompt` event and exposes install controls.
 */

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export const usePWA = () => {
  const canInstall = ref(false)
  const isStandalone = ref(false)
  let deferredPrompt: BeforeInstallPromptEvent | null = null

  if (import.meta.client) {
    // Check if already running as standalone PWA
    isStandalone.value =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in window.navigator && (window.navigator as { standalone?: boolean }).standalone === true)

    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      deferredPrompt = e as BeforeInstallPromptEvent
      canInstall.value = true
    })

    window.addEventListener('appinstalled', () => {
      canInstall.value = false
      isStandalone.value = true
      deferredPrompt = null
    })
  }

  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false

    await deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice

    if (outcome === 'accepted') {
      canInstall.value = false
      deferredPrompt = null
      return true
    }

    return false
  }

  return {
    canInstall: readonly(canInstall),
    isStandalone: readonly(isStandalone),
    install,
  }
}
