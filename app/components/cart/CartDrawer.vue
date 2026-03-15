<script setup lang="ts">
const { cart, getCartItemsCount, getAllStoresTotal } = useCart()
const { shouldShowCart } = useCartVisibility()
const router = useRouter()

const isOpen = ref(false)

const hasItems = computed(() => getCartItemsCount() > 0)
const showFloatingButton = computed(() => hasItems.value && shouldShowCart.value)
const itemsCount = computed(() => getCartItemsCount())
const totalAmount = computed(() => getAllStoresTotal())

const cartStores = computed(() => Object.values(cart.value))

const handleViewCart = () => {
  isOpen.value = false
  router.push('/carrito')
}

// Auto-hide on route change
const route = useRoute()
watch(() => route.path, () => {
  isOpen.value = false
})
</script>

<template>
  <!-- Hide entire cart drawer on catalog-only stores -->
  <div v-if="shouldShowCart">
    <!-- Floating Cart Button -->
    <Teleport to="body">
      <Transition
        enter-active-class="transition-all duration-300"
        enter-from-class="translate-x-full opacity-0"
        enter-to-class="translate-x-0 opacity-100"
        leave-active-class="transition-all duration-300"
        leave-from-class="translate-x-0 opacity-100"
        leave-to-class="translate-x-full opacity-0"
      >
        <div
          v-if="showFloatingButton"
          class="fixed bottom-6 right-6 z-40"
        >
          <UButton
            icon="i-lucide-shopping-cart"
            color="primary"
            size="lg"
            class="shadow-lg"
            @click="isOpen = true"
          >
            <template #trailing>
              <UBadge
                :label="itemsCount.toString()"
                color="neutral"
                variant="soft"
                size="xs"
              />
            </template>
            Ver carrito
          </UButton>
        </div>
      </Transition>
    </Teleport>

    <!-- Cart Drawer - only render when open to avoid content showing -->
    <UDrawer
      v-if="isOpen"
      v-model="isOpen"
      side="right"
      class="w-full sm:max-w-md"
    >
      <template #header>
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <UIcon
              name="i-lucide-shopping-cart"
              class="size-5"
            />
            <h2 class="text-lg font-semibold">
              Carrito
            </h2>
            <UBadge
              :label="itemsCount.toString()"
              color="primary"
              variant="soft"
              size="sm"
            />
          </div>
        </div>
      </template>

      <div class="flex flex-col gap-4 p-4 h-full">
        <!-- Empty State -->
        <UEmpty
          v-if="!hasItems"
          icon="i-lucide-shopping-cart"
          title="Carrito vacío"
          description="Agrega productos para comenzar"
          class="my-auto"
        />

        <!-- Cart Items Preview -->
        <div
          v-else
          class="flex-1 overflow-y-auto"
        >
          <div class="flex flex-col gap-4">
            <div
              v-for="storeCart in cartStores"
              :key="storeCart.store.id"
              class="flex flex-col gap-3 p-4 border rounded-lg"
            >
              <!-- Store Name -->
              <div class="flex items-center gap-2 pb-2 border-b">
                <div class="size-8 rounded-lg bg-elevated flex items-center justify-center overflow-hidden">
                  <img
                    v-if="storeCart.store.logoUrl"
                    :src="storeCart.store.logoUrl"
                    :alt="storeCart.store.name"
                    class="w-full h-full object-contain"
                  >
                  <UIcon
                    v-else
                    name="i-lucide-store"
                    class="size-4 text-muted"
                  />
                </div>
                <span class="font-semibold text-sm">{{ storeCart.store.name }}</span>
              </div>

              <!-- Items -->
              <div class="flex flex-col gap-2">
                <div
                  v-for="item in storeCart.items"
                  :key="item.product.id"
                  class="flex items-center gap-3"
                >
                  <div class="size-12 rounded-lg overflow-hidden bg-elevated flex-shrink-0">
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
                        class="size-4 text-muted"
                      />
                    </div>
                  </div>

                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-sm truncate">
                      {{ item.product.name }}
                    </p>
                    <p class="text-xs text-muted">
                      {{ item.quantity }} x ${{ Number(item.product.price).toFixed(2) }}
                    </p>
                  </div>

                  <span class="font-semibold text-sm">
                    ${{ (Number(item.product.price) * item.quantity).toFixed(2) }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer with Total and Action -->
        <div
          v-if="hasItems"
          class="flex flex-col gap-4 pt-4 border-t"
        >
          <div class="flex justify-between items-center">
            <span class="font-semibold">Total</span>
            <span class="text-xl font-bold text-primary">
              ${{ totalAmount.toFixed(2) }}
            </span>
          </div>

          <UButton
            icon="i-lucide-shopping-cart"
            color="primary"
            size="lg"
            block
            @click="handleViewCart"
          >
            Ver carrito completo
          </UButton>
        </div>
      </div>
    </UDrawer>
  </div>
</template>
