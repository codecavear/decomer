<script setup lang="ts">
definePageMeta({
  name: 'admin-kitchen',
  middleware: 'auth'
})

const { data: orders, refresh } = await useFetch('/api/admin/kitchen/orders')
const { data: stats } = await useFetch('/api/admin/kitchen/stats')

const toast = useToast()

const ordersByStatus = computed(() => {
  if (!orders.value) return {
    confirmed: [],
    preparing: [],
    ready: []
  }

  return {
    confirmed: orders.value.filter(o => o.status === 'confirmed'),
    preparing: orders.value.filter(o => o.status === 'preparing'),
    ready: orders.value.filter(o => o.status === 'ready')
  }
})

async function updateOrderStatus(orderId: string, newStatus: string) {
  try {
    await $fetch(`/api/admin/kitchen/orders/${orderId}`, {
      method: 'PATCH',
      body: { status: newStatus }
    })
    toast.add({ title: 'Estado actualizado', color: 'green' })
    refresh()
  } catch {
    toast.add({ title: 'Error al actualizar', color: 'red' })
  }
}

const statusColors = {
  confirmed: 'blue',
  preparing: 'yellow',
  ready: 'green'
}

const statusLabels = {
  confirmed: 'Confirmados',
  preparing: 'En Preparación',
  ready: 'Listos'
}
</script>

<template>
  <UContainer>
    <div class="py-8 space-y-8">
      <div>
        <h1 class="text-3xl font-bold">
          Panel de Cocina
        </h1>
        <p class="text-gray-500 dark:text-gray-400">
          Gestión de pedidos del día
        </p>
      </div>

      <!-- Stats -->
      <div
        v-if="stats"
        class="grid grid-cols-1 md:grid-cols-4 gap-4"
      >
        <UCard>
          <div class="text-center">
            <p class="text-3xl font-bold">
              {{ stats.todayOrders }}
            </p>
            <p class="text-sm text-gray-500">
              Pedidos hoy
            </p>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <p class="text-3xl font-bold">
              {{ stats.activeCustomers }}
            </p>
            <p class="text-sm text-gray-500">
              Clientes activos
            </p>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <p class="text-3xl font-bold">
              {{ stats.weeklyRevenue }}
            </p>
            <p class="text-sm text-gray-500">
              Facturación semanal
            </p>
          </div>
        </UCard>
        <UCard>
          <div class="text-center">
            <p class="text-3xl font-bold">
              {{ stats.pendingOrders }}
            </p>
            <p class="text-sm text-gray-500">
              Pendientes
            </p>
          </div>
        </UCard>
      </div>

      <!-- Kanban Board -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div
          v-for="statusKey in ['confirmed', 'preparing', 'ready']"
          :key="statusKey"
        >
          <UCard>
            <template #header>
              <div class="flex items-center justify-between">
                <h3 class="text-lg font-semibold">
                  {{ statusLabels[statusKey] }}
                </h3>
                <UBadge :color="statusColors[statusKey]">
                  {{ ordersByStatus[statusKey].length }}
                </UBadge>
              </div>
            </template>

            <div class="space-y-3">
              <UCard
                v-for="order in ordersByStatus[statusKey]"
                :key="order.id"
                class="hover:shadow-md transition-shadow"
              >
                <div class="space-y-2">
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="font-semibold">
                        #{{ order.id.slice(0, 8) }}
                      </p>
                      <p class="text-sm text-gray-500">
                        {{ order.userName }}
                      </p>
                    </div>
                    <p class="text-sm font-medium">
                      ${{ order.totalAmount }}
                    </p>
                  </div>

                  <div class="text-sm space-y-1">
                    <div
                      v-for="item in order.items"
                      :key="item.id"
                      class="flex justify-between"
                    >
                      <span>{{ item.quantity }}x {{ item.productName }}</span>
                    </div>
                  </div>

                  <div
                    v-if="order.deliveryType === 'delivery'"
                    class="text-xs text-gray-500"
                  >
                    📍 {{ order.deliveryAddress?.street }}
                  </div>

                  <div
                    v-if="order.notes"
                    class="text-xs bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded"
                  >
                    💬 {{ order.notes }}
                  </div>

                  <div class="flex gap-2 pt-2">
                    <UButton
                      v-if="statusKey === 'confirmed'"
                      size="xs"
                      color="yellow"
                      @click="updateOrderStatus(order.id, 'preparing')"
                    >
                      Comenzar
                    </UButton>
                    <UButton
                      v-if="statusKey === 'preparing'"
                      size="xs"
                      color="green"
                      @click="updateOrderStatus(order.id, 'ready')"
                    >
                      Marcar listo
                    </UButton>
                    <UButton
                      v-if="statusKey === 'ready'"
                      size="xs"
                      color="blue"
                      @click="updateOrderStatus(order.id, 'delivered')"
                    >
                      Entregado
                    </UButton>
                  </div>
                </div>
              </UCard>

              <div
                v-if="ordersByStatus[statusKey].length === 0"
                class="text-center py-8 text-gray-400"
              >
                Sin pedidos
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </div>
  </UContainer>
</template>
