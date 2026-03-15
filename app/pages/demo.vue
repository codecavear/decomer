<script setup lang="ts">
const { cart, addToCart, clearCart, getCartTotal, getCartItemsCount } = useCart()
const toast = useToast()

useSeoMeta({
  title: 'Demo | La Huerta Verde',
  description: 'Probá cómo funciona Vegy con nuestra tienda de ejemplo. Explorá productos orgánicos y veganos sin registrarte.'
})

// Demo store data - con WhatsApp para probar el flujo
const demoStore = {
  id: 'demo',
  name: 'La Huerta Verde',
  slug: 'demo',
  logoUrl: null,
  whatsapp: '5491123456789', // Cambiar a null para probar fallback
  description: 'Productos orgánicos y veganos directo del productor a tu mesa'
}

// Demo products con imágenes y datos mejorados
const products = ref([
  {
    id: 'demo-1',
    storeId: 'demo',
    name: 'Canasta de Verduras Orgánicas',
    description: 'Surtido semanal de verduras de estación directo del campo. Incluye lechuga, tomate, zanahoria, zapallo y más sorpresas.',
    price: 8500,
    originalPrice: 10200,
    imageUrl: '/images/demo/vegetables.jpg',
    category: 'Canastas',
    isActive: true,
    badge: 'Más vendido',
    badgeColor: 'success' as const
  },
  {
    id: 'demo-2',
    storeId: 'demo',
    name: 'Hamburguesas de Lentejas x4',
    description: 'Hamburguesas caseras de lentejas con especias mediterráneas. Listas para cocinar en 5 minutos.',
    price: 3200,
    originalPrice: null,
    imageUrl: '/images/demo/burger.jpg',
    category: 'Preparados',
    isActive: true,
    badge: 'Nuevo',
    badgeColor: 'info' as const
  },
  {
    id: 'demo-3',
    storeId: 'demo',
    name: 'Leche de Almendras 1L',
    description: 'Leche vegetal de almendras sin azúcar agregada. Producción artesanal, cremosa y nutritiva.',
    price: 2800,
    originalPrice: null,
    imageUrl: '/images/demo/almond-milk.jpg',
    category: 'Bebidas',
    isActive: true,
    badge: null,
    badgeColor: null
  },
  {
    id: 'demo-4',
    storeId: 'demo',
    name: 'Tofu Firme Orgánico 400g',
    description: 'Tofu orgánico de producción local. Ideal para salteados, guisos y preparaciones gourmet.',
    price: 2400,
    originalPrice: 2900,
    imageUrl: '/images/demo/tofu.jpg',
    category: 'Proteínas',
    isActive: true,
    badge: '-17%',
    badgeColor: 'error' as const
  },
  {
    id: 'demo-5',
    storeId: 'demo',
    name: 'Mix de Frutos Secos Premium 500g',
    description: 'Almendras, nueces, castañas de cajú y pasas de uva. Selección premium sin sal agregada.',
    price: 5600,
    originalPrice: null,
    imageUrl: '/images/demo/nuts.jpg',
    category: 'Snacks',
    isActive: true,
    badge: 'Premium',
    badgeColor: 'warning' as const
  },
  {
    id: 'demo-6',
    storeId: 'demo',
    name: 'Pan Integral de Masa Madre',
    description: 'Pan artesanal con harina integral y fermentación natural. Horneado del día, crujiente por fuera, suave por dentro.',
    price: 1800,
    originalPrice: null,
    imageUrl: '/images/demo/bread.jpg',
    category: 'Panadería',
    isActive: false,
    badge: 'Agotado',
    badgeColor: 'neutral' as const
  }
])

const cartItems = computed(() => cart.value['demo']?.items || [])
const cartTotal = computed(() => getCartTotal('demo'))
const cartCount = computed(() => getCartItemsCount('demo'))

const formatPrice = (price: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0
  }).format(price)
}

const handleAddToCart = (product: typeof products.value[0]) => {
  // Adaptar al tipo Product esperado por el carrito
  const cartProduct = {
    ...product,
    isAvailable: product.isActive,
    price: String(product.price),
    createdAt: new Date(),
    updatedAt: new Date()
  }
  addToCart(cartProduct, 1, demoStore)
  toast.add({
    title: '¡Agregado!',
    description: product.name,
    icon: 'i-lucide-check',
    color: 'success'
  })
}

// Checkout modal
const showCheckout = ref(false)
const orderPlaced = ref(false)
const customerName = ref('')
const customerNotes = ref('')

// Generar mensaje de WhatsApp
const generateWhatsAppMessage = () => {
  const items = cartItems.value.map(item =>
    `• ${item.quantity}x ${item.product.name} - ${formatPrice(Number(item.product.price) * item.quantity)}`
  ).join('\n')

  const message = `¡Hola! 👋 Quiero hacer un pedido:

${items}

*Total: ${formatPrice(cartTotal.value)}*

${customerName.value ? `Nombre: ${customerName.value}` : ''}
${customerNotes.value ? `Notas: ${customerNotes.value}` : ''}

Enviado desde Vegy 🌱`

  return encodeURIComponent(message.trim())
}

const whatsappUrl = computed(() => {
  if (!demoStore.whatsapp) return null
  return `https://wa.me/${demoStore.whatsapp}?text=${generateWhatsAppMessage()}`
})

const placeOrder = () => {
  if (demoStore.whatsapp && whatsappUrl.value) {
    // Abrir WhatsApp
    window.open(whatsappUrl.value, '_blank')
    orderPlaced.value = true
    setTimeout(() => {
      clearCart('demo')
      showCheckout.value = false
      orderPlaced.value = false
      customerName.value = ''
      customerNotes.value = ''
      toast.add({
        title: '¡Pedido enviado!',
        description: 'Tu mensaje fue enviado por WhatsApp',
        icon: 'i-lucide-check-circle',
        color: 'success'
      })
    }, 1500)
  } else {
    // Demo sin WhatsApp
    orderPlaced.value = true
    setTimeout(() => {
      clearCart('demo')
      showCheckout.value = false
      orderPlaced.value = false
      toast.add({
        title: '¡Pedido de demostración!',
        description: 'En una tienda real, recibirías confirmación del vendedor',
        icon: 'i-lucide-check-circle',
        color: 'success'
      })
    }, 2000)
  }
}

// Trust badges
const trustBadges = [
  { icon: 'i-lucide-leaf', text: '100% Orgánico' },
  { icon: 'i-lucide-truck', text: 'Envío rápido' },
  { icon: 'i-lucide-shield-check', text: 'Pago seguro' },
  { icon: 'i-lucide-heart', text: '+500 clientes felices' }
]
</script>

<template>
  <div class="min-h-screen bg-background">
    <!-- Demo Banner -->
    <div class="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground py-2.5 sm:py-3">
      <UContainer>
        <div class="flex items-center justify-center gap-2 text-xs sm:text-sm font-medium">
          <UIcon
            name="i-lucide-sparkles"
            class="size-4 animate-pulse"
          />
          <span><strong>Modo Demo</strong> — Probá cómo funciona Vegy sin compromiso</span>
        </div>
      </UContainer>
    </div>

    <!-- Hero Section -->
    <div class="relative overflow-hidden bg-gradient-to-br from-green-500 via-teal-500 to-emerald-600">
      <div class="absolute inset-0 bg-black/10" />
      <div class="absolute inset-0 bg-[url('/images/demo/vegetables.jpg')] bg-cover bg-center opacity-20 mix-blend-overlay" />

      <UContainer class="relative py-8 sm:py-12 lg:py-16">
        <div class="flex flex-col sm:flex-row items-center sm:items-end gap-4 sm:gap-6">
          <div class="size-24 sm:size-28 lg:size-32 rounded-2xl overflow-hidden bg-white shadow-2xl border-4 border-white flex items-center justify-center shrink-0">
            <UIcon
              name="i-lucide-leaf"
              class="size-12 sm:size-14 lg:size-16 text-primary"
            />
          </div>
          <div class="text-center sm:text-left">
            <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">
              {{ demoStore.name }}
            </h1>
            <p class="text-white/90 text-sm sm:text-base mb-3 max-w-md">
              {{ demoStore.description }}
            </p>
            <div class="flex flex-wrap justify-center sm:justify-start gap-2">
              <UBadge
                label="Verdulería"
                color="neutral"
                variant="solid"
                size="sm"
              />
              <UBadge
                label="Orgánicos"
                color="neutral"
                variant="solid"
                size="sm"
              />
              <UBadge
                label="Vegano"
                color="neutral"
                variant="solid"
                size="sm"
              />
              <UBadge
                icon="i-lucide-star"
                label="4.9"
                color="warning"
                variant="solid"
                size="sm"
              />
            </div>
          </div>
        </div>
      </UContainer>
    </div>

    <!-- Trust Badges -->
    <div class="border-b bg-muted/30">
      <UContainer>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4">
          <div
            v-for="badge in trustBadges"
            :key="badge.text"
            class="flex items-center justify-center gap-2 text-xs sm:text-sm text-muted"
          >
            <UIcon
              :name="badge.icon"
              class="size-4 text-primary"
            />
            <span>{{ badge.text }}</span>
          </div>
        </div>
      </UContainer>
    </div>

    <UContainer class="py-6 sm:py-8">
      <div class="grid lg:grid-cols-3 gap-6 lg:gap-8">
        <!-- Products -->
        <div class="lg:col-span-2">
          <div class="flex items-center justify-between mb-4 sm:mb-6">
            <h2 class="text-xl sm:text-2xl font-bold">
              Nuestros Productos
            </h2>
            <UBadge
              :label="`${products.length} productos`"
              color="neutral"
              variant="soft"
            />
          </div>

          <div class="grid grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4">
            <UCard
              v-for="product in products"
              :key="product.id"
              variant="outline"
              class="overflow-hidden group hover:shadow-lg transition-all duration-300"
              :class="{ 'opacity-60': !product.isActive }"
            >
              <!-- Product Image -->
              <div class="relative aspect-square overflow-hidden bg-elevated">
                <img
                  v-if="product.imageUrl"
                  :src="product.imageUrl"
                  :alt="product.name"
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                >
                <div
                  v-else
                  class="w-full h-full flex items-center justify-center"
                >
                  <UIcon
                    name="i-lucide-image"
                    class="size-12 text-muted"
                  />
                </div>

                <!-- Badge -->
                <UBadge
                  v-if="product.badge"
                  :label="product.badge"
                  :color="product.badgeColor || 'primary'"
                  variant="solid"
                  size="xs"
                  class="absolute top-2 left-2 shadow-md"
                />

                <!-- Quick Add Button (desktop) -->
                <div
                  v-if="product.isActive"
                  class="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block"
                >
                  <UButton
                    color="white"
                    block
                    size="sm"
                    icon="i-lucide-shopping-cart"
                    @click="handleAddToCart(product)"
                  >
                    Agregar
                  </UButton>
                </div>
              </div>

              <div class="p-3 sm:p-4">
                <!-- Category -->
                <span class="text-[10px] sm:text-xs text-muted uppercase tracking-wide font-medium">
                  {{ product.category }}
                </span>

                <!-- Name -->
                <h3 class="font-semibold text-sm sm:text-base mt-1 line-clamp-2 leading-tight">
                  {{ product.name }}
                </h3>

                <!-- Description (hidden on mobile) -->
                <p class="hidden sm:block text-xs sm:text-sm text-muted mt-1.5 line-clamp-2">
                  {{ product.description }}
                </p>

                <!-- Price -->
                <div class="flex items-baseline gap-2 mt-2 sm:mt-3">
                  <span class="text-lg sm:text-xl font-bold text-primary">
                    {{ formatPrice(product.price) }}
                  </span>
                  <span
                    v-if="product.originalPrice"
                    class="text-xs sm:text-sm text-muted line-through"
                  >
                    {{ formatPrice(product.originalPrice) }}
                  </span>
                </div>

                <!-- Mobile Add Button -->
                <UButton
                  v-if="product.isActive"
                  color="primary"
                  block
                  size="sm"
                  class="mt-3 sm:hidden"
                  icon="i-lucide-plus"
                  @click="handleAddToCart(product)"
                >
                  Agregar
                </UButton>

                <!-- Desktop Add Button -->
                <UButton
                  v-if="product.isActive"
                  color="primary"
                  variant="soft"
                  block
                  size="sm"
                  class="mt-3 hidden sm:flex"
                  icon="i-lucide-plus"
                  @click="handleAddToCart(product)"
                >
                  Agregar al carrito
                </UButton>

                <!-- Sold out state -->
                <UButton
                  v-if="!product.isActive"
                  color="neutral"
                  variant="soft"
                  block
                  size="sm"
                  class="mt-3"
                  disabled
                >
                  Agotado
                </UButton>
              </div>
            </UCard>
          </div>
        </div>

        <!-- Cart Sidebar -->
        <div class="lg:col-span-1">
          <div class="sticky top-20">
            <UCard
              variant="outline"
              class="shadow-lg"
            >
              <template #header>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <UIcon
                      name="i-lucide-shopping-cart"
                      class="size-5 text-primary"
                    />
                    <span class="font-bold">Tu Pedido</span>
                  </div>
                  <UBadge
                    v-if="cartCount"
                    :label="String(cartCount)"
                    color="primary"
                    size="sm"
                  />
                </div>
              </template>

              <!-- Empty Cart -->
              <div
                v-if="cartItems.length === 0"
                class="py-8 text-center"
              >
                <div class="size-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                  <UIcon
                    name="i-lucide-shopping-bag"
                    class="size-8 text-muted"
                  />
                </div>
                <p class="font-medium">
                  Tu carrito está vacío
                </p>
                <p class="text-sm text-muted mt-1">
                  ¡Agregá productos para comenzar!
                </p>
              </div>

              <!-- Cart Items -->
              <div
                v-else
                class="space-y-3"
              >
                <div
                  v-for="item in cartItems"
                  :key="item.product.id"
                  class="flex items-center gap-3 p-2 rounded-lg bg-muted/30"
                >
                  <div class="size-12 rounded-lg overflow-hidden bg-elevated shrink-0">
                    <img
                      v-if="item.product.imageUrl"
                      :src="item.product.imageUrl"
                      :alt="item.product.name"
                      class="w-full h-full object-cover"
                    >
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium text-sm truncate">
                      {{ item.product.name }}
                    </p>
                    <p class="text-xs text-muted">
                      {{ item.quantity }} × {{ formatPrice(Number(item.product.price)) }}
                    </p>
                  </div>
                  <span class="font-semibold text-sm">
                    {{ formatPrice(Number(item.product.price) * item.quantity) }}
                  </span>
                </div>
              </div>

              <template
                v-if="cartItems.length"
                #footer
              >
                <div class="space-y-4">
                  <!-- Total -->
                  <div class="flex items-center justify-between text-lg font-bold">
                    <span>Total</span>
                    <span class="text-primary text-xl">{{ formatPrice(cartTotal) }}</span>
                  </div>

                  <!-- CTA Button -->
                  <UButton
                    color="primary"
                    block
                    size="xl"
                    :icon="demoStore.whatsapp ? 'i-lucide-message-circle' : 'i-lucide-check'"
                    class="font-bold"
                    @click="showCheckout = true"
                  >
                    {{ demoStore.whatsapp ? 'Pedir por WhatsApp' : 'Finalizar Pedido' }}
                  </UButton>

                  <UButton
                    color="neutral"
                    variant="ghost"
                    block
                    size="sm"
                    @click="clearCart('demo')"
                  >
                    Vaciar carrito
                  </UButton>
                </div>
              </template>
            </UCard>

            <!-- CTA Card -->
            <UCard
              variant="soft"
              color="primary"
              class="mt-4"
            >
              <div class="flex gap-3">
                <div class="size-10 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <UIcon
                    name="i-lucide-rocket"
                    class="size-5 text-primary"
                  />
                </div>
                <div>
                  <p class="font-bold text-sm">
                    ¿Querés tu propia tienda?
                  </p>
                  <p class="text-xs text-muted mt-0.5">
                    Creá tu tienda gratis en minutos y empezá a vender hoy mismo.
                  </p>
                  <UButton
                    to="/crear-tienda"
                    size="xs"
                    variant="link"
                    class="mt-2 p-0 font-semibold"
                    trailing-icon="i-lucide-arrow-right"
                  >
                    Crear mi tienda gratis
                  </UButton>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </div>
    </UContainer>

    <!-- Checkout Modal -->
    <UModal v-model:open="showCheckout">
      <template #content>
        <UCard class="sm:min-w-[400px]">
          <template #header>
            <div class="flex items-center gap-3">
              <div class="size-10 rounded-full bg-primary/10 flex items-center justify-center">
                <UIcon
                  :name="demoStore.whatsapp ? 'i-lucide-message-circle' : 'i-lucide-shopping-bag'"
                  class="size-5 text-primary"
                />
              </div>
              <div>
                <h3 class="font-bold">
                  Confirmar Pedido
                </h3>
                <p class="text-sm text-muted">
                  {{ demoStore.name }}
                </p>
              </div>
            </div>
          </template>

          <div
            v-if="!orderPlaced"
            class="space-y-5"
          >
            <!-- Order Summary -->
            <div class="p-4 rounded-xl bg-muted/30">
              <h4 class="font-semibold text-sm mb-3 flex items-center gap-2">
                <UIcon
                  name="i-lucide-receipt"
                  class="size-4"
                />
                Resumen del pedido
              </h4>
              <div class="space-y-2 text-sm">
                <div
                  v-for="item in cartItems"
                  :key="item.product.id"
                  class="flex justify-between items-center"
                >
                  <span class="text-muted">{{ item.quantity }}× {{ item.product.name }}</span>
                  <span class="font-medium">{{ formatPrice(Number(item.product.price) * item.quantity) }}</span>
                </div>
                <USeparator class="my-2" />
                <div class="flex justify-between font-bold text-base">
                  <span>Total a pagar</span>
                  <span class="text-primary">{{ formatPrice(cartTotal) }}</span>
                </div>
              </div>
            </div>

            <!-- Customer Info (optional) -->
            <div class="space-y-3">
              <UInput
                v-model="customerName"
                placeholder="Tu nombre (opcional)"
                icon="i-lucide-user"
              />
              <UTextarea
                v-model="customerNotes"
                placeholder="Notas del pedido (opcional)"
                :rows="2"
              />
            </div>

            <!-- WhatsApp Flow -->
            <div v-if="demoStore.whatsapp">
              <UAlert
                icon="i-lucide-message-circle"
                color="success"
                title="Pedido por WhatsApp"
                description="Al confirmar, se abrirá WhatsApp con tu pedido listo para enviar al vendedor."
              />
            </div>

            <!-- No WhatsApp Fallback -->
            <div v-else>
              <UAlert
                icon="i-lucide-info"
                color="info"
                title="Modo Demo"
                description="Esta es una demostración. En una tienda real, el vendedor recibirá tu pedido y te contactará para coordinar."
              />
            </div>
          </div>

          <!-- Loading State -->
          <div
            v-else
            class="py-12 text-center"
          >
            <UIcon
              name="i-lucide-loader-2"
              class="size-12 mx-auto mb-4 text-primary animate-spin"
            />
            <p class="font-medium">
              {{ demoStore.whatsapp ? 'Abriendo WhatsApp...' : 'Procesando tu pedido...' }}
            </p>
          </div>

          <template #footer>
            <div class="flex gap-3">
              <UButton
                color="neutral"
                variant="outline"
                :disabled="orderPlaced"
                class="flex-1"
                @click="showCheckout = false"
              >
                Cancelar
              </UButton>
              <UButton
                color="primary"
                :loading="orderPlaced"
                :icon="demoStore.whatsapp ? 'i-lucide-send' : 'i-lucide-check'"
                class="flex-1 font-semibold"
                @click="placeOrder"
              >
                {{ demoStore.whatsapp ? 'Enviar por WhatsApp' : 'Confirmar Pedido' }}
              </UButton>
            </div>
          </template>
        </UCard>
      </template>
    </UModal>

    <!-- Mobile Cart FAB -->
    <Teleport to="body">
      <div
        v-if="cartCount && cartCount > 0"
        class="fixed bottom-4 left-4 right-4 sm:hidden z-50"
      >
        <UButton
          color="primary"
          block
          size="xl"
          class="shadow-2xl font-bold"
          :icon="demoStore.whatsapp ? 'i-lucide-message-circle' : 'i-lucide-shopping-cart'"
          @click="showCheckout = true"
        >
          <span>{{ demoStore.whatsapp ? 'Pedir por WhatsApp' : 'Ver Pedido' }}</span>
          <span class="mx-2">•</span>
          <span>{{ formatPrice(cartTotal) }}</span>
        </UButton>
      </div>
    </Teleport>
  </div>
</template>
