/**
 * Composable to control cart visibility based on current context.
 * Cart should be hidden on catalog-only store pages.
 * Uses Nuxt's useState for global state sharing between components.
 */
export const useCartVisibility = () => {
  // Global state shared between CartDrawer and store pages
  const isOnCatalogStore = useState('cart-visibility-catalog', () => false)

  // Function to set catalog store state (called from store pages)
  const setIsCatalogStore = (isCatalog: boolean) => {
    isOnCatalogStore.value = isCatalog
  }

  // Should show cart? Only if not on a catalog-only store
  const shouldShowCart = computed(() => !isOnCatalogStore.value)

  return {
    isOnCatalogStore,
    setIsCatalogStore,
    shouldShowCart
  }
}
