export default defineNuxtRouteMiddleware((to) => {
  const { loggedIn } = useUserSession()

  if (!loggedIn.value) {
    // Preserve the intended destination so user returns here after login
    return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
