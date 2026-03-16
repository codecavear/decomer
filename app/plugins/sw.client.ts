/**
 * sw.client.ts — Service Worker registration plugin
 * Runs only on client side (Nuxt client plugin).
 */
export default defineNuxtPlugin(() => {
  if (!('serviceWorker' in navigator)) return

  navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch((err) => {
    console.error('[sw] Registration failed:', err)
  })
})
