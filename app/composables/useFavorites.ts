export function useFavorites() {
  const toast = useToast()
  const { loggedIn } = useUserSession()

  const favoriteIds = useState<Set<string>>('favorites', () => new Set())
  const isLoading = useState<boolean>('favorites_loading', () => false)
  const isInitialized = useState<boolean>('favorites_initialized', () => false)

  const fetchFavorites = async () => {
    if (!loggedIn.value) {
      favoriteIds.value = new Set()
      return
    }

    if (isLoading.value) return

    isLoading.value = true

    try {
      const data = await $fetch<{ stores: { id: string }[] }>('/api/favorites')
      favoriteIds.value = new Set(data.stores.map(s => s.id))
      isInitialized.value = true
    } catch {
      console.error('Failed to fetch favorites:', error)
      toast.add({
        title: 'Error',
        description: 'No se pudieron cargar los favoritos',
        color: 'error'
      })
    } finally {
      isLoading.value = false
    }
  }

  const isFavorited = (storeId: string): boolean => {
    return favoriteIds.value.has(storeId)
  }

  const toggleFavorite = async (storeId: string) => {
    if (!loggedIn.value) {
      toast.add({
        title: 'Inicia sesión',
        description: 'Debes iniciar sesión para guardar favoritos',
        color: 'info'
      })
      return
    }

    const wasFavorited = isFavorited(storeId)

    // Optimistic update
    if (wasFavorited) {
      favoriteIds.value.delete(storeId)
    } else {
      favoriteIds.value.add(storeId)
    }

    try {
      if (wasFavorited) {
        await $fetch(`/api/favorites/${storeId}`, {
          method: 'DELETE'
        })
        toast.add({
          title: 'Eliminado',
          description: 'Se quitó de tus favoritos',
          color: 'success'
        })
      } else {
        await $fetch('/api/favorites', {
          method: 'POST',
          body: { storeId }
        })
        toast.add({
          title: 'Guardado',
          description: 'Se agregó a tus favoritos',
          color: 'success'
        })
      }
    } catch {
      // Revert optimistic update on error
      if (wasFavorited) {
        favoriteIds.value.add(storeId)
      } else {
        favoriteIds.value.delete(storeId)
      }

      console.error('Failed to toggle favorite:', error)
      toast.add({
        title: 'Error',
        description: 'No se pudo actualizar el favorito',
        color: 'error'
      })
    }
  }

  // Auto-fetch favorites when user logs in
  if (import.meta.client && loggedIn.value && !isInitialized.value) {
    fetchFavorites()
  }

  return {
    favoriteIds: readonly(favoriteIds),
    isLoading: readonly(isLoading),
    isFavorited,
    toggleFavorite,
    fetchFavorites
  }
}
