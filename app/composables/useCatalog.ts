import type { Product, ProductWithStoreAssignments, StoreProduct, CatalogLimits } from '~/types'

export function useCatalog() {
  const toast = useToast()
  const { loggedIn } = useUserSession()

  const products = useState<ProductWithStoreAssignments[]>('catalog_products', () => [])
  const limits = useState<CatalogLimits | null>('catalog_limits', () => null)
  const isLoading = useState<boolean>('catalog_loading', () => false)
  const isInitialized = useState<boolean>('catalog_initialized', () => false)

  const fetchCatalog = async () => {
    if (!loggedIn.value) {
      products.value = []
      limits.value = null
      return
    }

    if (isLoading.value) return

    isLoading.value = true

    try {
      const [catalogData, limitsData] = await Promise.all([
        $fetch<ProductWithStoreAssignments[]>('/api/catalog'),
        $fetch<CatalogLimits>('/api/catalog/limits')
      ])
      products.value = catalogData
      limits.value = limitsData
      isInitialized.value = true
    } catch (error) {
      console.error('Failed to fetch catalog:', error)
      toast.add({
        title: 'Error',
        description: 'No se pudo cargar el catálogo',
        color: 'error'
      })
    } finally {
      isLoading.value = false
    }
  }

  const fetchLimits = async () => {
    if (!loggedIn.value) return null

    try {
      const data = await $fetch<CatalogLimits>('/api/catalog/limits')
      limits.value = data
      return data
    } catch (error) {
      console.error('Failed to fetch limits:', error)
      return null
    }
  }

  const createProduct = async (productData: {
    name: string
    description?: string
    price: string
    imageUrl?: string
    category?: string
  }) => {
    if (!loggedIn.value) {
      toast.add({
        title: 'Inicia sesión',
        description: 'Debes iniciar sesión para crear productos',
        color: 'info'
      })
      return null
    }

    if (limits.value && !limits.value.canAddProduct) {
      toast.add({
        title: 'Límite alcanzado',
        description: limits.value.message,
        color: 'warning'
      })
      return null
    }

    try {
      const product = await $fetch<ProductWithStoreAssignments>('/api/catalog', {
        method: 'POST',
        body: productData
      })

      products.value = [product, ...products.value]
      await fetchLimits()

      toast.add({
        title: 'Producto creado',
        description: `${product.name} se agregó al catálogo`,
        color: 'success'
      })

      return product
    } catch (error: any) {
      console.error('Failed to create product:', error)
      toast.add({
        title: 'Error',
        description: error.data?.message || 'No se pudo crear el producto',
        color: 'error'
      })
      return null
    }
  }

  const updateProduct = async (
    productId: string,
    productData: {
      name?: string
      description?: string
      price?: string
      imageUrl?: string
      category?: string
    }
  ) => {
    try {
      const product = await $fetch<ProductWithStoreAssignments>(`/api/catalog/${productId}`, {
        method: 'PATCH',
        body: productData
      })

      const index = products.value.findIndex(p => p.id === productId)
      if (index !== -1) {
        products.value[index] = product
      }

      toast.add({
        title: 'Producto actualizado',
        description: `${product.name} se actualizó correctamente`,
        color: 'success'
      })

      return product
    } catch (error: any) {
      console.error('Failed to update product:', error)
      toast.add({
        title: 'Error',
        description: error.data?.message || 'No se pudo actualizar el producto',
        color: 'error'
      })
      return null
    }
  }

  const deleteProduct = async (productId: string) => {
    const product = products.value.find(p => p.id === productId)

    try {
      await $fetch(`/api/catalog/${productId}`, { method: 'DELETE' as const })

      products.value = products.value.filter(p => p.id !== productId)
      await fetchLimits()

      toast.add({
        title: 'Producto eliminado',
        description: product ? `${product.name} se eliminó del catálogo` : 'Producto eliminado',
        color: 'success'
      })

      return true
    } catch (error: any) {
      console.error('Failed to delete product:', error)
      toast.add({
        title: 'Error',
        description: error.data?.message || 'No se pudo eliminar el producto',
        color: 'error'
      })
      return false
    }
  }

  const assignToStores = async (productId: string, storeIds: string[]) => {
    try {
      const assignments = await $fetch<StoreProduct[]>(`/api/catalog/${productId}/stores`, {
        method: 'POST',
        body: { storeIds }
      })

      const index = products.value.findIndex(p => p.id === productId)
      if (index !== -1) {
        products.value[index] = {
          ...products.value[index],
          storeAssignments: assignments
        }
      }

      toast.add({
        title: 'Tiendas asignadas',
        description: `Producto asignado a ${storeIds.length} tienda(s)`,
        color: 'success'
      })

      return assignments
    } catch (error: any) {
      console.error('Failed to assign stores:', error)
      toast.add({
        title: 'Error',
        description: error.data?.message || 'No se pudo asignar a las tiendas',
        color: 'error'
      })
      return null
    }
  }

  const removeFromStore = async (productId: string, storeId: string) => {
    try {
      await $fetch(`/api/catalog/${productId}/stores/${storeId}`, { method: 'DELETE' as const })

      const productIndex = products.value.findIndex(p => p.id === productId)
      if (productIndex !== -1 && products.value[productIndex].storeAssignments) {
        products.value[productIndex].storeAssignments = products.value[
          productIndex
        ].storeAssignments!.filter((a: StoreProduct) => a.storeId !== storeId)
      }

      toast.add({
        title: 'Tienda removida',
        description: 'Producto removido de la tienda',
        color: 'success'
      })

      return true
    } catch (error: any) {
      console.error('Failed to remove from store:', error)
      toast.add({
        title: 'Error',
        description: error.data?.message || 'No se pudo remover de la tienda',
        color: 'error'
      })
      return false
    }
  }

  const toggleAvailability = async (productId: string, storeId: string, isAvailable: boolean) => {
    const productIndex = products.value.findIndex(p => p.id === productId)
    const oldAvailability = products.value[productIndex]?.storeAssignments?.find(
      (a: StoreProduct) => a.storeId === storeId
    )?.isAvailable

    // Optimistic update
    if (productIndex !== -1 && products.value[productIndex].storeAssignments) {
      const assignmentIndex = products.value[productIndex].storeAssignments!.findIndex(
        (a: StoreProduct) => a.storeId === storeId
      )
      if (assignmentIndex !== -1) {
        products.value[productIndex].storeAssignments![assignmentIndex].isAvailable = isAvailable
      }
    }

    try {
      await $fetch(`/api/catalog/${productId}/stores/${storeId}`, {
        method: 'PATCH',
        body: { isAvailable }
      })

      return true
    } catch (error: any) {
      // Revert optimistic update
      if (productIndex !== -1 && products.value[productIndex].storeAssignments) {
        const assignmentIndex = products.value[productIndex].storeAssignments!.findIndex(
          (a: StoreProduct) => a.storeId === storeId
        )
        if (assignmentIndex !== -1 && oldAvailability !== undefined) {
          products.value[productIndex].storeAssignments![assignmentIndex].isAvailable
            = oldAvailability
        }
      }

      console.error('Failed to toggle availability:', error)
      toast.add({
        title: 'Error',
        description: error.data?.message || 'No se pudo cambiar la disponibilidad',
        color: 'error'
      })
      return false
    }
  }

  const getProductById = (productId: string) => {
    return products.value.find(p => p.id === productId)
  }

  const canAddProduct = computed(() => limits.value?.canAddProduct ?? false)

  const productCount = computed(() => limits.value?.products.current ?? 0)

  const productLimit = computed(() => limits.value?.products.limit ?? 100)

  return {
    products: readonly(products),
    limits: readonly(limits),
    isLoading: readonly(isLoading),
    isInitialized: readonly(isInitialized),
    canAddProduct,
    productCount,
    productLimit,
    fetchCatalog,
    fetchLimits,
    createProduct,
    updateProduct,
    deleteProduct,
    assignToStores,
    removeFromStore,
    toggleAvailability,
    getProductById
  }
}
