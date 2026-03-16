<script setup lang="ts">
import type { DeliveryType, StoreContact } from '~/types'

definePageMeta({
  layout: 'default'
})

useSeoMeta({
  title: 'Carrito',
  description: 'Tu carrito de compras en DeComer.',
  robots: 'noindex'
})

const { cart, removeFromCart, updateQuantity, clearCart, getCartTotal } = useCart()
const { loggedIn } = useUserSession()
const { openWhatsAppCheckout, isWhatsAppAvailable } = useWhatsAppCheckout()
const router = useRouter()
const toast = useToast()

// Store contacts cache (fetched on demand)
const storeContacts = ref<Record<string, StoreContact[]>>({})

interface StoreOrder {
  storeId: string
  deliveryType: DeliveryType
  deliveryAddress?: {
    address: string
    city: string
    apartment?: string
    notes?: string
  }
  notes?: string
}

const storeOrders = ref<Record<string, StoreOrder>>({})
const submittingOrders = ref<Record<string, boolean>>({})

// Initialize store orders
watchEffect(() => {
  Object.keys(cart.value).forEach((storeId) => {
    if (!storeOrders.value[storeId]) {
      storeOrders.value[storeId] = {
        storeId,
        deliveryType: 'pickup',
        deliveryAddress: { address: '', city: '' }
      }
    }
  })
})

const cartStores = computed(() => Object.values(cart.value))

const isEmpty = computed(() => cartStores.value.length === 0)

// Fetch store contacts for WhatsApp checkout
const fetchStoreContacts = async (storeSlug: string, storeId: string) => {
  if (storeContacts.value[storeId]) return // Already fetched

  try {
    const store = await $fetch(`/api/stores/${storeSlug}`)
    if (store?.contacts) {
      storeContacts.value[storeId] = store.contacts
    }
  } catch {
    // Silently fail - WhatsApp will use fallback if available
  }
}

// Fetch contacts for all cart stores on mount
onMounted(() => {
  Object.values(cart.value).forEach((storeCart) => {
    fetchStoreContacts(storeCart.store.slug, storeCart.store.id)
  })
})

// Check if WhatsApp is available for a store
const hasWhatsApp = (storeId: string) => {
  return isWhatsAppAvailable(storeContacts.value[storeId])
}

// Handle WhatsApp checkout
const handleWhatsAppCheckout = (storeId: string) => {
  const storeCart = cart.value[storeId]
  const order = storeOrders.value[storeId]

  if (!storeCart || storeCart.items.length === 0) return

  const success = openWhatsAppCheckout(
    {
      storeName: storeCart.store.name,
      storeSlug: storeCart.store.slug,
      items: storeCart.items,
      total: getCartTotal(storeId),
      deliveryType: order?.deliveryType,
      deliveryAddress: order?.deliveryType === 'delivery' ? order.deliveryAddress : undefined,
      notes: order?.notes
    },
    storeContacts.value[storeId]
  )

  if (success) {
    toast.add({
      title: 'WhatsApp abierto',
      description: 'Completa tu pedido en WhatsApp',
      color: 'success'
    })
    // Clear cart after opening WhatsApp
    clearCart(storeId)

    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete storeOrders.value[storeId]
  } else {
    toast.add({
      title: 'WhatsApp no disponible',
      description: 'Esta tienda no tiene WhatsApp configurado',
      color: '_error'
    })
  }
}

const totalAmount = computed(() => {
  return Object.keys(cart.value).reduce((total, storeId) => {
    return total + getCartTotal(storeId)
  }, 0)
})

const handleRemoveItem = (storeId: string, productId: string) => {
  removeFromCart(storeId, productId)
  toast.add({
    title: 'Producto eliminado',
    description: 'El producto ha sido eliminado del carrito',
    color: 'success'
  })
}

const handleUpdateQuantity = (storeId: string, productId: string, newQuantity: number) => {
  updateQuantity(storeId, productId, newQuantity)
}

const handleClearStore = (storeId: string) => {
  clearCart(storeId)
  toast.add({
    title: 'Carrito limpiado',
    description: 'Se eliminaron todos los productos de esta tienda',
    color: 'success'
  })
}

const canCheckoutStore = (storeId: string): boolean => {
  const order = storeOrders.value[storeId]
  if (!order) return false

  if (order.deliveryType === 'delivery') {
    return !!(order.deliveryAddress?.address && order.deliveryAddress?.city)
  }

  return true
}

const confirmOrder = async (storeId: string) => {
  if (!loggedIn.value) {
    toast.add({
      title: 'Inicia sesión',
      description: 'Debes iniciar sesión para realizar un pedido',
      color: 'warning'
    })
    router.push('/login')
    return
  }

  if (!canCheckoutStore(storeId)) {
    toast.add({
      title: 'Información incompleta',
      description: 'Por favor completa la información de entrega',
      color: '_error'
    })
    return
  }

  const storeCart = cart.value[storeId]
  const order = storeOrders.value[storeId]

  if (!storeCart || storeCart.items.length === 0) return

  submittingOrders.value[storeId] = true

  try {
    const orderData = {
      storeId,
      items: storeCart.items.map(item => ({
        productId: item.product.id,
        quantity: item.quantity
      })),
      deliveryType: order.deliveryType,
      deliveryAddress: order.deliveryType === 'delivery' ? order.deliveryAddress : undefined,
      notes: order.notes
    }

    await $fetch('/api/orders', {
      method: 'POST',
      body: orderData
    })

    toast.add({
      title: 'Pedido confirmado',
      description: `Tu pedido en ${storeCart.store.name} ha sido confirmado`,
      color: 'success'
    })

    clearCart(storeId)
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete storeOrders.value[storeId]

    // Navigate to orders page if cart is empty
    if (Object.keys(cart.value).length === 0) {
      router.push('/mis-pedidos')
    }
  } catch {
    toast.add({
      title: 'Error',
      description: _error.data?.message || 'No se pudo confirmar el pedido',
      color: '_error'
    })
  } finally {
    submittingOrders.value[storeId] = false
  }
}
</script>

<template>
  <UContainer class="py-8">
    <div class="flex flex-col gap-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold">
            Carrito de compras
          </h1>
          <p class="text-muted mt-1">
            Revisa tus productos y confirma tu pedido
          </p>
        </div>
        <UButton
          v-if="!isEmpty"
          icon="i-lucide-arrow-left"
          variant="ghost"
          to="/buscar"
        >
          Seguir comprando
        </UButton>
      </div>

      <!-- Empty State -->
      <UEmpty
        v-if="isEmpty"
        icon="i-lucide-shopping-cart"
        title="Tu carrito está vacío"
        description="Agrega productos desde las tiendas para comenzar a comprar"
      >
        <template #actions>
          <UButton
            icon="i-lucide-search"
            color="primary"
            to="/buscar"
          >
            Buscar tiendas
          </UButton>
        </template>
      </UEmpty>

      <!-- Cart Items by Store -->
      <div
        v-else
        class="grid gap-6"
      >
        <UCard
          v-for="storeCart in cartStores"
          :key="storeCart.store.id"
          variant="outline"
        >
          <!-- Store Header -->
          <template #header>
            <div class="flex items-center justify-between">
              <NuxtLink
                :to="`/${storeCart.store.slug}`"
                class="flex items-center gap-3 hover:opacity-80 transition-opacity"
              >
                <div class="size-12 rounded-lg bg-elevated flex items-center justify-center overflow-hidden">
                  <img
                    v-if="storeCart.store.logoUrl"
                    :src="storeCart.store.logoUrl"
                    :alt="storeCart.store.name"
                    class="w-full h-full object-contain"
                  >
                  <UIcon
                    v-else
                    name="i-lucide-store"
                    class="size-6 text-muted"
                  />
                </div>
                <h2 class="text-xl font-semibold">{{ storeCart.store.name }}</h2>
              </NuxtLink>

              <UButton
                icon="i-lucide-trash-2"
                color="_error"
                variant="ghost"
                size="sm"
                @click="handleClearStore(storeCart.store.id)"
              >
                Limpiar
              </UButton>
            </div>
          </template>

          <!-- Cart Items -->
          <div class="flex flex-col gap-4">
            <div
              v-for="item in storeCart.items"
              :key="item.product.id"
              class="flex gap-4 p-4 border rounded-lg"
            >
              <!-- _Product Image -->
              <div class="size-20 rounded-lg overflow-hidden bg-elevated flex-shrink-0">
                <img
                  v-if="item.product.imageUrl"
                  :src="item.product.imageUrl"
                  :alt="item.product.name"
                  class="w-full h-full object-cover"
                >
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center"
                >
                  <UIcon
                    name="i-lucide-image"
                    class="size-8 text-muted"
                  />
                </div>
              </div>

              <!-- _Product Info -->
              <div class="flex-1 flex flex-col gap-2">
                <div>
                  <h3 class="font-semibold">
                    {{ item.product.name }}
                  </h3>
                  <p
                    v-if="item.product.description"
                    class="text-sm text-muted line-clamp-1"
                  >
                    {{ item.product.description }}
                  </p>
                </div>

                <div class="flex items-center justify-between mt-auto">
                  <span class="text-lg font-bold text-primary">
                    ${{ (Number(item.product.price) * item.quantity).toFixed(2) }}
                  </span>

                  <!-- Quantity Controls -->
                  <div class="flex items-center gap-2">
                    <div class="flex items-center gap-1 border rounded-lg">
                      <UButton
                        icon="i-lucide-minus"
                        color="neutral"
                        variant="ghost"
                        size="sm"
                        :disabled="item.quantity <= 1"
                        @click="handleUpdateQuantity(storeCart.store.id, item.product.id, item.quantity - 1)"
                      />
                      <span class="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
                        {{ item.quantity }}
                      </span>
                      <UButton
                        icon="i-lucide-plus"
                        color="neutral"
                        variant="ghost"
                        size="sm"
                        @click="handleUpdateQuantity(storeCart.store.id, item.product.id, item.quantity + 1)"
                      />
                    </div>

                    <UButton
                      icon="i-lucide-trash-2"
                      color="_error"
                      variant="ghost"
                      size="sm"
                      @click="handleRemoveItem(storeCart.store.id, item.product.id)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- Subtotal -->
            <div class="flex justify-between items-center pt-4 border-t">
              <span class="font-semibold">Subtotal</span>
              <span class="text-xl font-bold text-primary">
                ${{ getCartTotal(storeCart.store.id).toFixed(2) }}
              </span>
            </div>

            <!-- Delivery Options -->
            <USeparator />

            <div class="flex flex-col gap-4">
              <h3 class="font-semibold">
                Método de entrega
              </h3>

              <div class="grid grid-cols-2 gap-4">
                <UButton
                  :variant="storeOrders[storeCart.store.id]?.deliveryType === 'pickup' ? 'solid' : 'outline'"
                  :color="storeOrders[storeCart.store.id]?.deliveryType === 'pickup' ? 'primary' : 'neutral'"
                  block
                  @click="storeOrders[storeCart.store.id].deliveryType = 'pickup'"
                >
                  <template #leading>
                    <UIcon name="i-lucide-store" />
                  </template>
                  Retirar en tienda
                </UButton>

                <UButton
                  :variant="storeOrders[storeCart.store.id]?.deliveryType === 'delivery' ? 'solid' : 'outline'"
                  :color="storeOrders[storeCart.store.id]?.deliveryType === 'delivery' ? 'primary' : 'neutral'"
                  block
                  @click="() => { storeOrders[storeCart.store.id].deliveryType = 'delivery'; storeOrders[storeCart.store.id].deliveryAddress ??= { address: '', city: '' } }"
                >
                  <template #leading>
                    <UIcon name="i-lucide-truck" />
                  </template>
                  Delivery
                </UButton>
              </div>

              <!-- Delivery Address Fields -->
              <div
                v-if="storeOrders[storeCart.store.id]?.deliveryType === 'delivery'"
                class="flex flex-col gap-4 p-4 bg-elevated rounded-lg"
              >
                <UInput
                  v-model="storeOrders[storeCart.store.id].deliveryAddress!.address"
                  placeholder="Dirección de entrega"
                  icon="i-lucide-map-pin"
                  required
                />
                <div class="grid grid-cols-2 gap-4">
                  <UInput
                    v-model="storeOrders[storeCart.store.id].deliveryAddress!.city"
                    placeholder="Ciudad"
                    required
                  />
                  <UInput
                    v-model="storeOrders[storeCart.store.id].deliveryAddress!.apartment"
                    placeholder="Piso/Depto (opcional)"
                  />
                </div>
                <UTextarea
                  v-model="storeOrders[storeCart.store.id].deliveryAddress!.notes"
                  placeholder="Referencias (opcional)"
                  :rows="2"
                />
              </div>

              <!-- Order Notes -->
              <UTextarea
                v-model="storeOrders[storeCart.store.id].notes"
                placeholder="Notas del pedido (opcional)"
                :rows="2"
              />

              <!-- Checkout Buttons -->
              <div class="flex flex-col gap-3">
                <!-- WhatsApp Checkout (primary when available) -->
                <UButton
                  v-if="hasWhatsApp(storeCart.store.id)"
                  icon="i-lucide-message-circle"
                  color="primary"
                  size="lg"
                  block
                  @click="handleWhatsAppCheckout(storeCart.store.id)"
                >
                  <template #leading>
                    <svg
                      class="size-5"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                    </svg>
                  </template>
                  Finalizar por WhatsApp - ${{ getCartTotal(storeCart.store.id).toFixed(2) }}
                </UButton>

                <!-- Standard Confirm Button -->
                <UButton
                  icon="i-lucide-check"
                  :color="hasWhatsApp(storeCart.store.id) ? 'neutral' : 'primary'"
                  :variant="hasWhatsApp(storeCart.store.id) ? 'outline' : 'solid'"
                  size="lg"
                  block
                  :loading="submittingOrders[storeCart.store.id]"
                  :disabled="!canCheckoutStore(storeCart.store.id)"
                  @click="confirmOrder(storeCart.store.id)"
                >
                  {{ hasWhatsApp(storeCart.store.id) ? 'Confirmar en la app' : 'Confirmar pedido' }} - ${{ getCartTotal(storeCart.store.id).toFixed(2) }}
                </UButton>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Total Summary -->
        <UCard
          v-if="cartStores.length > 1"
          variant="solid"
          color="primary"
        >
          <div class="flex justify-between items-center">
            <span class="text-lg font-semibold">Total general</span>
            <span class="text-2xl font-bold">
              ${{ totalAmount.toFixed(2) }}
            </span>
          </div>
        </UCard>
      </div>
    </div>
  </UContainer>
</template>
