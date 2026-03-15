<script setup lang="ts">
import type { OrderStatus, OrderWithRelations } from '~/types'

definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

useSeoMeta({
  title: 'Mis Pedidos',
  description: 'Historial de pedidos en Vegy.',
  robots: 'noindex'
})

const selectedStatus = ref<OrderStatus | 'all'>('all')

const statusOptions = [
  { label: 'Todos', value: 'all' },
  { label: 'Pendiente', value: 'pending' },
  { label: 'Confirmado', value: 'confirmed' },
  { label: 'Preparando', value: 'preparing' },
  { label: 'Listo', value: 'ready' },
  { label: 'Entregado', value: 'delivered' },
  { label: 'Cancelado', value: 'cancelled' }
]

const queryParams = computed(() => {
  const params: any = { limit: 50 }
  if (selectedStatus.value !== 'all') {
    params.status = selectedStatus.value
  }
  return params
})

const { data: orders, status, refresh } = await useFetch<OrderWithRelations[]>('/api/orders', {
  query: queryParams
})

const isEmpty = computed(() => !orders.value || orders.value.length === 0)
const isLoading = computed(() => status.value === 'pending')

const expandedOrders = ref<Set<string>>(new Set())

const toggleOrderExpand = (orderId: string) => {
  if (expandedOrders.value.has(orderId)) {
    expandedOrders.value.delete(orderId)
  } else {
    expandedOrders.value.add(orderId)
  }
}

const isOrderExpanded = (orderId: string) => expandedOrders.value.has(orderId)

const getStatusColor = (status: OrderStatus) => {
  const colors: Record<OrderStatus, string> = {
    pending: 'warning',
    confirmed: 'info',
    preparing: 'primary',
    ready: 'success',
    delivered: 'success',
    cancelled: 'error'
  }
  return colors[status]
}

const getStatusLabel = (status: OrderStatus) => {
  const labels: Record<OrderStatus, string> = {
    pending: 'Pendiente',
    confirmed: 'Confirmado',
    preparing: 'Preparando',
    ready: 'Listo',
    delivered: 'Entregado',
    cancelled: 'Cancelado'
  }
  return labels[status]
}

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const getItemsCount = (order: OrderWithRelations) => {
  return order.items.reduce((count, item) => count + item.quantity, 0)
}
</script>

<template>
  <UContainer class="py-8">
    <div class="flex flex-col gap-6">
      <!-- Header -->
      <div>
        <h1 class="text-3xl font-bold">
          Mis pedidos
        </h1>
        <p class="text-muted mt-1">
          Historial de tus pedidos y su estado actual
        </p>
      </div>

      <!-- Status Filters -->
      <div class="flex gap-2 overflow-x-auto pb-2">
        <UButton
          v-for="option in statusOptions"
          :key="option.value"
          :variant="selectedStatus === option.value ? 'solid' : 'outline'"
          :color="selectedStatus === option.value ? 'primary' : 'neutral'"
          size="sm"
          @click="selectedStatus = option.value as any"
        >
          {{ option.label }}
        </UButton>
      </div>

      <!-- Loading State -->
      <div
        v-if="isLoading"
        class="flex flex-col gap-4"
      >
        <USkeleton
          v-for="i in 5"
          :key="i"
          class="h-32 rounded-lg"
        />
      </div>

      <!-- Empty State -->
      <UEmpty
        v-else-if="isEmpty"
        icon="i-lucide-shopping-bag"
        title="No hay pedidos"
        description="Aún no has realizado ningún pedido"
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

      <!-- Orders List -->
      <div
        v-else
        class="flex flex-col gap-4"
      >
        <UCard
          v-for="order in orders"
          :key="order.id"
          variant="outline"
          class="cursor-pointer hover:shadow-md transition-shadow"
          @click="toggleOrderExpand(order.id)"
        >
          <div class="flex flex-col gap-4">
            <!-- Order Header -->
            <div class="flex items-start justify-between gap-4">
              <div class="flex items-center gap-3 flex-1">
                <div class="size-12 rounded-lg bg-elevated flex items-center justify-center overflow-hidden flex-shrink-0">
                  <img
                    v-if="order.store.logoUrl"
                    :src="order.store.logoUrl"
                    :alt="order.store.name"
                    class="w-full h-full object-contain"
                  >
                  <UIcon
                    v-else
                    name="i-lucide-store"
                    class="size-6 text-muted"
                  />
                </div>

                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold truncate">
                    {{ order.store.name }}
                  </h3>
                  <p class="text-sm text-muted">
                    {{ formatDate(order.createdAt) }}
                  </p>
                  <p class="text-sm text-muted">
                    {{ getItemsCount(order) }} {{ getItemsCount(order) === 1 ? 'producto' : 'productos' }}
                  </p>
                </div>
              </div>

              <div class="flex flex-col items-end gap-2">
                <UBadge
                  :label="getStatusLabel(order.status)"
                  :color="getStatusColor(order.status)"
                  variant="soft"
                />
                <span class="text-lg font-bold text-primary">
                  ${{ Number(order.totalAmount).toFixed(2) }}
                </span>
                <UIcon
                  :name="isOrderExpanded(order.id) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                  class="size-5 text-muted"
                />
              </div>
            </div>

            <!-- Expanded Order Details -->
            <div
              v-if="isOrderExpanded(order.id)"
              class="flex flex-col gap-4 pt-4 border-t"
              @click.stop
            >
              <!-- Order Items -->
              <div class="flex flex-col gap-3">
                <h4 class="font-semibold text-sm">
                  Productos
                </h4>
                <div
                  v-for="item in order.items"
                  :key="item.id"
                  class="flex items-center gap-3 p-3 bg-elevated rounded-lg"
                >
                  <div class="size-16 rounded-lg overflow-hidden bg-background flex-shrink-0">
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
                        class="size-6 text-muted"
                      />
                    </div>
                  </div>

                  <div class="flex-1">
                    <p class="font-medium">
                      {{ item.product.name }}
                    </p>
                    <p class="text-sm text-muted">
                      {{ item.quantity }} x ${{ Number(item.unitPrice).toFixed(2) }}
                    </p>
                    <p
                      v-if="item.notes"
                      class="text-sm text-muted italic"
                    >
                      Nota: {{ item.notes }}
                    </p>
                  </div>

                  <span class="font-semibold">
                    ${{ (Number(item.unitPrice) * item.quantity).toFixed(2) }}
                  </span>
                </div>
              </div>

              <!-- Delivery Info -->
              <div class="flex flex-col gap-2 p-4 bg-elevated rounded-lg">
                <div class="flex items-center gap-2">
                  <UIcon
                    :name="order.deliveryType === 'pickup' ? 'i-lucide-store' : 'i-lucide-truck'"
                    class="size-5"
                  />
                  <span class="font-semibold">
                    {{ order.deliveryType === 'pickup' ? 'Retirar en tienda' : 'Delivery' }}
                  </span>
                </div>

                <div
                  v-if="order.deliveryType === 'delivery' && order.deliveryAddress"
                  class="text-sm text-muted pl-7"
                >
                  <p>{{ (order.deliveryAddress as any).address }}</p>
                  <p>{{ (order.deliveryAddress as any).city }}</p>
                  <p v-if="(order.deliveryAddress as any).apartment">
                    {{ (order.deliveryAddress as any).apartment }}
                  </p>
                  <p
                    v-if="(order.deliveryAddress as any).notes"
                    class="italic mt-1"
                  >
                    {{ (order.deliveryAddress as any).notes }}
                  </p>
                </div>

                <p
                  v-if="order.notes"
                  class="text-sm text-muted pl-7 italic"
                >
                  Notas: {{ order.notes }}
                </p>
              </div>

              <!-- Total -->
              <div class="flex justify-between items-center pt-4 border-t">
                <span class="font-semibold">Total</span>
                <span class="text-xl font-bold text-primary">
                  ${{ Number(order.totalAmount).toFixed(2) }}
                </span>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </UContainer>
</template>
