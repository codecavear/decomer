import type { Product, Store } from '~/types'

export interface CartItem {
  product: Product
  quantity: number
}

export interface CartStore {
  store: Pick<Store, 'id' | 'name' | 'slug' | 'logoUrl'>
  items: CartItem[]
}

export interface Cart {
  [storeId: string]: CartStore
}

const CART_STORAGE_KEY = 'decomer_cart'

export function useCart() {
  const cart = useState<Cart>('cart', () => ({}))
  const isInitialized = useState<boolean>('cart_initialized', () => false)

  // Load cart from localStorage on mount (client-only)
  if (import.meta.client && !isInitialized.value) {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY)
      if (stored) {
        cart.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error)
    }
    isInitialized.value = true
  }

  // Save cart to localStorage whenever it changes
  const saveCart = () => {
    if (import.meta.client) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart.value))
      } catch (error) {
        console.error('Failed to save cart to localStorage:', error)
      }
    }
  }

  const addToCart = (
    product: Product,
    quantity: number,
    store: Pick<Store, 'id' | 'name' | 'slug' | 'logoUrl'>
  ) => {
    const storeId = product.storeId

    // Initialize store cart if it doesn't exist
    if (!cart.value[storeId]) {
      cart.value[storeId] = {
        store,
        items: []
      }
    }

    // Check if product already exists in cart
    const existingItemIndex = cart.value[storeId]!.items.findIndex(
      item => item.product.id === product.id
    )

    if (existingItemIndex >= 0) {
      // Update quantity of existing item
      cart.value[storeId].items[existingItemIndex].quantity += quantity
    } else {
      // Add new item
      cart.value[storeId].items.push({ product, quantity })
    }

    saveCart()
  }

  const removeFromCart = (storeId: string, productId: string) => {
    if (!cart.value[storeId]) return

    cart.value[storeId].items = cart.value[storeId].items.filter(
      item => item.product.id !== productId
    )

    // Remove store from cart if no items left
    if (cart.value[storeId].items.length === 0) {
      delete cart.value[storeId]
    }

    saveCart()
  }

  const updateQuantity = (storeId: string, productId: string, quantity: number) => {
    if (!cart.value[storeId]) return

    const item = cart.value[storeId].items.find(
      item => item.product.id === productId
    )

    if (item) {
      if (quantity <= 0) {
        removeFromCart(storeId, productId)
      } else {
        item.quantity = quantity
        saveCart()
      }
    }
  }

  const clearCart = (storeId?: string) => {
    if (storeId) {
      delete cart.value[storeId]
    } else {
      cart.value = {}
    }
    saveCart()
  }

  const getCartTotal = (storeId: string): number => {
    if (!cart.value[storeId]) return 0

    return cart.value[storeId].items.reduce((total, item) => {
      return total + Number(item.product.price) * item.quantity
    }, 0)
  }

  const getCartItemsCount = (storeId?: string): number => {
    if (storeId) {
      return cart.value[storeId]?.items.reduce((count, item) => count + item.quantity, 0) || 0
    }

    return Object.values(cart.value).reduce((total, store) => {
      return total + store.items.reduce((count, item) => count + item.quantity, 0)
    }, 0)
  }

  const getAllStoresTotal = (): number => {
    return Object.keys(cart.value).reduce((total, storeId) => {
      return total + getCartTotal(storeId)
    }, 0)
  }

  return {
    cart: readonly(cart),
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    getCartTotal,
    getCartItemsCount,
    getAllStoresTotal
  }
}
