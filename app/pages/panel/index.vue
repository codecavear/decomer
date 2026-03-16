<script setup lang="ts">
import type { StoreWithRelations, OrderWithRelations } from '~/types'

definePageMeta({
  layout: 'panel',
  middleware: 'auth'
})

const { user } = useUserSession()

// State
const store = ref<StoreWithRelations | null>(null)
const stats = ref([
  { label: 'Pedidos totales', value: '0', icon: 'i-lucide-shopping-cart', color: 'primary' as const },
  { label: 'Pedidos pendientes', value: '0', icon: 'i-lucide-clock', color: 'warning' as const },
  { label: 'Calificación promedio', value: '0.0', icon: 'i-lucide-star', color: 'success' as const },
  { label: 'Total productos', value: '0', icon: 'i-lucide-package', color: 'info' as const }
])
const recentOrders = ref<OrderWithRelations[]>([])
const hasStore = computed(() => !!store.value)
const isLoading = ref(true)

// Fetch store data
const { data: storeData } = await useFetch<StoreWithRelations | null>('/api/stores/my')
store.value = storeData.value

// Fetch stats and orders if store exists
if (store.value) {
  const [statsData, ordersData] = await Promise.all([
    useFetch<{
      totalOrders: number
      pendingOrders: number
      totalProducts: number
      averageRating: string
    }>(`/api/stores/${store.value.id}/stats`),
    useFetch<OrderWithRelations[]>(`/api/orders/store/${store.value.id}`, {
      query: { limit: 5 }
    })
  ])

  if (statsData.data.value) {
    stats.value = [
      { label: 'Pedidos totales', value: String(statsData.data.value.totalOrders), icon: 'i-lucide-shopping-cart', color: 'primary' as const },
      { label: 'Pedidos pendientes', value: String(statsData.data.value.pendingOrders), icon: 'i-lucide-clock', color: 'warning' as const },
      { label: 'Calificación promedio', value: statsData.data.value.averageRating, icon: 'i-lucide-star', color: 'success' as const },
      { label: 'Total productos', value: String(statsData.data.value.totalProducts), icon: 'i-lucide-package', color: 'info' as const }
    ]
  }

  if (ordersData.data.value) {
    recentOrders.value = ordersData.data.value
  }
}

isLoading.value = false

// Helper function to format currency
const formatCurrency = (amount: string | number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0
  }).format(Number(amount))
}

// Helper function to get order status color
const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    pending: 'warning',
    confirmed: 'info',
    preparing: 'info',
    ready: 'success',
    delivered: 'success',
    cancelled: 'error'
  }
  return colors[status] || 'neutral'
}

// Helper function to get order status label
const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    ready: 'Listo',
    delivered: 'Entregado',
    cancelled: 'Cancelado'
  }
  return labels[status] || status
}
</script>

<template>
  <UDashboardPanel id="panel-home">
    <template #header>
      <UDashboardNavbar title="Dashboard">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <!-- Loading state -->
      <div
        v-if="isLoading"
        class="flex items-center justify-center py-12"
      >
        <div class="text-center space-y-3">
          <UIcon
            name="i-lucide-loader-2"
            class="size-8 animate-spin text-primary mx-auto"
          />
          <p class="text-muted">
            Cargando datos...
          </p>
        </div>
      </div>

      <div
        v-else
        class="space-y-6"
      >
        <!-- Header -->
        <div>
          <h1 class="text-2xl font-bold text-highlighted">
            Bienvenido, {{ user?.name }}
          </h1>
          <p class="text-muted mt-1">
            Panel de control de tu tienda
          </p>
        </div>

        <!-- No store CTA -->
        <UCard
          v-if="!hasStore"
          class="overflow-hidden border-2 border-emerald-200 dark:border-emerald-800"
        >
          <div class="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 dark:from-emerald-950 dark:via-green-950 dark:to-teal-950" />
          <div class="relative flex flex-col md:flex-row items-center gap-6">
            <div class="flex-1 space-y-4">
              <div class="flex items-center gap-3">
                <div class="size-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 flex items-center justify-center shadow-lg">
                  <UIcon
                    name="i-lucide-store"
                    class="size-7 text-white"
                  />
                </div>
                <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
                  Crea tu tienda
                </h2>
              </div>
              <p class="text-lg text-gray-600 dark:text-gray-300">
                Empieza a vender tus productos veganos y vegetarianos en DeComer.
                Llega a clientes que buscan opciones sustentables y saludables.
              </p>
              <div class="flex flex-wrap gap-3 pt-2">
                <UButton
                  to="/crear-tienda"
                  color="primary"
                  size="xl"
                  icon="i-lucide-plus"
                  class="shadow-lg hover:shadow-xl hover:scale-105 transition-all font-semibold"
                >
                  Crear mi tienda
                </UButton>
              </div>
            </div>
            <div class="hidden md:block">
              <div class="size-40 rounded-3xl bg-gradient-to-br from-emerald-400/20 via-green-500/20 to-teal-600/20 flex items-center justify-center">
                <UIcon
                  name="i-lucide-store"
                  class="size-28 text-emerald-500/40"
                />
              </div>
            </div>
          </div>
        </UCard>

        <!-- Stats cards -->
        <div
          v-else
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5"
        >
          <UCard
            v-for="stat in stats"
            :key="stat.label"
            class="border-2 border-gray-200 dark:border-gray-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer"
          >
            <div class="flex items-center justify-between">
              <div class="flex-1">
                <p class="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {{ stat.label }}
                </p>
                <p class="text-3xl font-bold mt-2 text-gray-900 dark:text-white">
                  {{ stat.value }}
                </p>
              </div>
              <div class="size-14 rounded-2xl bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 flex items-center justify-center shadow-lg">
                <UIcon
                  :name="stat.icon"
                  class="size-7 text-white"
                />
              </div>
            </div>
          </UCard>
        </div>

        <!-- Recent orders -->
        <UCard
          v-if="hasStore"
          class="border-2 border-gray-200 dark:border-gray-800"
        >
          <template #header>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="size-10 rounded-xl bg-gradient-to-br from-emerald-400 via-green-500 to-teal-600 flex items-center justify-center">
                  <UIcon
                    name="i-lucide-shopping-cart"
                    class="size-5 text-white"
                  />
                </div>
                <h3 class="text-xl font-bold text-gray-900 dark:text-white">
                  Pedidos recientes
                </h3>
              </div>
              <UButton
                to="/panel/pedidos"
                color="primary"
                variant="soft"
                size="sm"
                trailing-icon="i-lucide-arrow-right"
                class="hover:scale-105 transition-transform"
              >
                Ver todos
              </UButton>
            </div>
          </template>

          <div
            v-if="recentOrders.length === 0"
            class="text-center py-16"
          >
            <div class="size-20 mx-auto rounded-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center mb-4">
              <UIcon
                name="i-lucide-shopping-cart"
                class="size-12 text-gray-400 dark:text-gray-600"
              />
            </div>
            <p class="text-lg font-semibold text-gray-900 dark:text-white">
              No hay pedidos recientes
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Los pedidos aparecerán aquí cuando los clientes empiecen a comprar
            </p>
          </div>

          <div
            v-else
            class="space-y-3"
          >
            <div
              v-for="order in recentOrders"
              :key="order.id"
              class="flex items-center justify-between p-4 rounded-2xl border-2 border-gray-200 dark:border-gray-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-lg transition-all duration-200 group"
            >
              <div class="flex items-center gap-4">
                <UAvatar
                  :name="order.user?.name || 'Cliente'"
                  size="lg"
                  class="ring-2 ring-emerald-200 dark:ring-emerald-800"
                />
                <div>
                  <p class="font-semibold text-gray-900 dark:text-white">
                    {{ order.user?.name || 'Cliente' }}
                  </p>
                  <p class="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                    <span class="flex items-center gap-1">
                      <UIcon
                        name="i-lucide-package"
                        class="size-3.5"
                      />
                      {{ order.items?.length || 0 }} items
                    </span>
                    <span>·</span>
                    <span class="font-semibold text-emerald-600 dark:text-emerald-400">{{ formatCurrency(order.totalAmount) }}</span>
                  </p>
                </div>
              </div>
              <div class="flex items-center gap-3">
                <UBadge
                  :color="getStatusColor(order.status)"
                  size="lg"
                >
                  {{ getStatusLabel(order.status) }}
                </UBadge>
                <UButton
                  to="/panel/pedidos"
                  color="neutral"
                  variant="ghost"
                  size="sm"
                  icon="i-lucide-chevron-right"
                  class="group-hover:scale-110 transition-transform"
                />
              </div>
            </div>
          </div>
        </UCard>

        <!-- Quick actions -->
        <div
          v-if="hasStore"
          class="grid grid-cols-1 md:grid-cols-3 gap-5"
        >
          <UCard
            class="border-2 border-gray-200 dark:border-gray-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
            @click="navigateTo('/panel/productos')"
          >
            <div class="flex items-center gap-4">
              <div class="size-14 rounded-2xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <UIcon
                  name="i-lucide-package-plus"
                  class="size-7 text-white"
                />
              </div>
              <div class="flex-1">
                <p class="font-bold text-lg text-gray-900 dark:text-white">
                  Agregar producto
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Añade nuevos productos a tu tienda
                </p>
              </div>
            </div>
          </UCard>

          <UCard
            class="border-2 border-gray-200 dark:border-gray-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
            @click="navigateTo('/panel/pedidos')"
          >
            <div class="flex items-center gap-4">
              <div class="size-14 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <UIcon
                  name="i-lucide-clipboard-check"
                  class="size-7 text-white"
                />
              </div>
              <div class="flex-1">
                <p class="font-bold text-lg text-gray-900 dark:text-white">
                  Gestionar pedidos
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Revisa y actualiza pedidos
                </p>
              </div>
            </div>
          </UCard>

          <UCard
            class="border-2 border-gray-200 dark:border-gray-800 hover:border-emerald-400 dark:hover:border-emerald-600 hover:shadow-xl hover:scale-105 transition-all duration-300 cursor-pointer group"
            @click="navigateTo('/panel/tienda')"
          >
            <div class="flex items-center gap-4">
              <div class="size-14 rounded-2xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <UIcon
                  name="i-lucide-settings"
                  class="size-7 text-white"
                />
              </div>
              <div class="flex-1">
                <p class="font-bold text-lg text-gray-900 dark:text-white">
                  Configurar tienda
                </p>
                <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Edita información de tu tienda
                </p>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>
