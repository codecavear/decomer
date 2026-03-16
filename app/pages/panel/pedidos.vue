<script setup lang="ts">
definePageMeta({
  layout: 'panel',
  middleware: 'auth'
})

// Order status types
type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerAvatar?: string
  items: number
  total: number
  status: OrderStatus
  deliveryType: 'pickup' | 'delivery'
  createdAt: string
  notes?: string
}

// Status filter
const statusFilter = ref<OrderStatus | 'all'>('all')

const statusOptions = [
  { value: 'all', label: 'Todos', color: 'neutral' as const },
  { value: 'pending', label: 'Pendiente', color: 'warning' as const },
  { value: 'confirmed', label: 'Confirmado', color: 'info' as const },
  { value: 'preparing', label: 'Preparando', color: 'primary' as const },
  { value: 'ready', label: 'Listo', color: 'success' as const },
  { value: 'delivered', label: 'Entregado', color: 'success' as const },
  { value: 'cancelled', label: 'Cancelado', color: '_error' as const }
]

const allOrders = ref<Order[]>([])

const filteredOrders = computed(() => {
  if (statusFilter.value === 'all') {
    return allOrders.value
  }
  return allOrders.value.filter(order => order.status === statusFilter.value)
})

const expandedOrders = ref<Set<string>>(new Set())

const toggleOrderDetails = (orderId: string) => {
  if (expandedOrders.value.has(orderId)) {
    expandedOrders.value.delete(orderId)
  } else {
    expandedOrders.value.add(orderId)
  }
}

const getStatusColor = (status: OrderStatus) => {
  const option = statusOptions.find(opt => opt.value === status)
  return option?.color || 'neutral'
}

const getStatusLabel = (status: OrderStatus) => {
  const option = statusOptions.find(opt => opt.value === status)
  return option?.label || status
}

const toast = useToast()
const updateOrderStatus = async (order: Order, newStatus: OrderStatus) => {
  try {
    await $fetch(`/api/orders/${order.id}`, {
      method: 'PATCH',
      body: { status: newStatus }
    })
    order.status = newStatus
    toast.add({ title: 'Estado actualizado', color: 'success' })
  } catch (_e: unknown) {
    const _error = _e as { data?: { message?: string } }
    toast.add({ title: 'Error', description: _error?.data?.message || 'No se pudo actualizar', color: '_error' })
  }
}

const getNextStatusActions = (currentStatus: OrderStatus) => {
  const actions: { status: OrderStatus, label: string, color: string }[] = []

  switch (currentStatus) {
    case 'pending':
      actions.push(
        { status: 'confirmed', label: 'Confirmar', color: 'info' },
        { status: 'cancelled', label: 'Cancelar', color: '_error' }
      )
      break
    case 'confirmed':
      actions.push(
        { status: 'preparing', label: 'Preparando', color: 'primary' }
      )
      break
    case 'preparing':
      actions.push(
        { status: 'ready', label: 'Listo', color: 'success' }
      )
      break
    case 'ready':
      actions.push(
        { status: 'delivered', label: 'Entregado', color: 'success' }
      )
      break
  }

  return actions
}
</script>

<template>
  <UDashboardPanel id="panel-pedidos">
    <template #header>
      <UDashboardNavbar title="Pedidos">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="space-y-6">
        <!-- Status filter tabs -->
        <div class="flex flex-wrap gap-3">
          <UButton
            v-for="status in statusOptions"
            :key="status.value"
            :color="statusFilter === status.value ? status.color : 'neutral'"
            :variant="statusFilter === status.value ? 'solid' : 'soft'"
            size="lg"
            class="hover:scale-105 transition-transform font-semibold"
            @click="statusFilter = status.value"
          >
            {{ status.label }}
          </UButton>
        </div>

        <!-- Orders list -->
        <UCard class="border-2 border-gray-200 dark:border-gray-800">
          <div
            v-if="filteredOrders.length > 0"
            class="space-y-4"
          >
            <div
              v-for="order in filteredOrders"
              :key="order.id"
              class="border-2 border-gray-200 dark:border-gray-800 hover:border-emerald-400 dark:hover:border-emerald-600 rounded-2xl overflow-hidden transition-all duration-300 hover:shadow-lg"
            >
              <!-- Order header -->
              <div
                class="flex items-center justify-between p-5 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/50 transition-colors cursor-pointer"
                @click="toggleOrderDetails(order.id)"
              >
                <div class="flex items-center gap-4 flex-1">
                  <UAvatar
                    :name="order.customerName"
                    :src="order.customerAvatar"
                    size="lg"
                    class="ring-2 ring-emerald-200 dark:ring-emerald-800"
                  />
                  <div class="flex-1">
                    <div class="flex items-center gap-3">
                      <p class="font-bold text-lg text-gray-900 dark:text-white">
                        {{ order.customerName }}
                      </p>
                      <span class="text-sm font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-900 px-3 py-1 rounded-full">{{ order.orderNumber }}</span>
                    </div>
                    <div class="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 mt-2">
                      <span class="flex items-center gap-1.5 font-medium">
                        <UIcon
                          name="i-lucide-package"
                          class="size-4 text-emerald-600 dark:text-emerald-400"
                        />
                        {{ order.items }} items
                      </span>
                      <span class="flex items-center gap-1.5 font-medium">
                        <UIcon
                          :name="order.deliveryType === 'delivery' ? 'i-lucide-truck' : 'i-lucide-store'"
                          class="size-4 text-emerald-600 dark:text-emerald-400"
                        />
                        {{ order.deliveryType === 'delivery' ? 'Delivery' : 'Retiro' }}
                      </span>
                      <span class="font-bold text-lg text-emerald-600 dark:text-emerald-400">${{ order.total }}</span>
                    </div>
                  </div>
                </div>

                <div class="flex items-center gap-4">
                  <UBadge
                    :color="getStatusColor(order.status)"
                    size="lg"
                  >
                    {{ getStatusLabel(order.status) }}
                  </UBadge>
                  <div class="size-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                    <UIcon
                      :name="expandedOrders.has(order.id) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                      class="size-5 text-gray-600 dark:text-gray-400"
                    />
                  </div>
                </div>
              </div>

              <!-- Order details (expanded) -->
              <div
                v-if="expandedOrders.has(order.id)"
                class="border-t-2 border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50"
              >
                <div class="p-6 space-y-5">
                  <!-- Order info -->
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p class="text-sm text-muted-foreground">
                        Fecha del pedido
                      </p>
                      <p class="font-medium">
                        {{ new Date(order.createdAt).toLocaleString('es-AR') }}
                      </p>
                    </div>
                    <div>
                      <p class="text-sm text-muted-foreground">
                        Tipo de entrega
                      </p>
                      <p class="font-medium">
                        {{ order.deliveryType === 'delivery' ? 'Delivery' : 'Retiro en tienda' }}
                      </p>
                    </div>
                  </div>

                  <!-- Order notes -->
                  <div v-if="order.notes">
                    <p class="text-sm font-semibold text-gray-600 dark:text-gray-300 mb-2">
                      Notas del cliente
                    </p>
                    <div class="p-4 bg-white dark:bg-gray-800 rounded-xl border-2 border-amber-200 dark:border-amber-800">
                      <div class="flex gap-3">
                        <UIcon
                          name="i-lucide-message-square"
                          class="size-5 text-amber-600 shrink-0 mt-0.5"
                        />
                        <p class="text-sm text-gray-700 dark:text-gray-300">
                          {{ order.notes }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Status actions -->
                  <div
                    v-if="getNextStatusActions(order.status).length > 0"
                    class="flex flex-wrap gap-3"
                  >
                    <p class="text-sm font-semibold text-gray-600 dark:text-gray-300 w-full">
                      Actualizar estado:
                    </p>
                    <UButton
                      v-for="action in getNextStatusActions(order.status)"
                      :key="action.status"
                      :color="action.color as any"
                      variant="soft"
                      size="lg"
                      class="hover:scale-105 transition-transform font-semibold"
                      @click="updateOrderStatus(order, action.status)"
                    >
                      {{ action.label }}
                    </UButton>
                  </div>

                  <div
                    v-else-if="order.status === 'delivered'"
                    class="p-4 bg-green-50 dark:bg-green-950 rounded-xl border-2 border-green-200 dark:border-green-800"
                  >
                    <div class="flex items-center gap-3 text-green-700 dark:text-green-300">
                      <div class="size-10 rounded-xl bg-green-200 dark:bg-green-800 flex items-center justify-center">
                        <UIcon
                          name="i-lucide-check-circle"
                          class="size-6"
                        />
                      </div>
                      <p class="font-semibold text-lg">
                        Pedido completado
                      </p>
                    </div>
                  </div>

                  <div
                    v-else-if="order.status === 'cancelled'"
                    class="p-4 bg-red-50 dark:bg-red-950 rounded-xl border-2 border-red-200 dark:border-red-800"
                  >
                    <div class="flex items-center gap-3 text-red-700 dark:text-red-300">
                      <div class="size-10 rounded-xl bg-red-200 dark:bg-red-800 flex items-center justify-center">
                        <UIcon
                          name="i-lucide-x-circle"
                          class="size-6"
                        />
                      </div>
                      <p class="font-semibold text-lg">
                        Pedido cancelado
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            v-else
            class="text-center py-16"
          >
            <div class="size-24 mx-auto rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 flex items-center justify-center mb-6">
              <UIcon
                name="i-lucide-shopping-cart"
                class="size-14 text-emerald-500"
              />
            </div>
            <p class="text-xl font-bold text-gray-900 dark:text-white">
              No hay pedidos con este estado
            </p>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
              Los pedidos aparecerán aquí cuando los clientes realicen compras
            </p>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
