<script setup lang="ts">
definePageMeta({
  name: 'admin-kitchen',
  middleware: 'auth'
})

const { data: orders, refresh } = await useFetch('/api/admin/kitchen/orders')
const { data: stats } = await useFetch('/api/admin/kitchen/stats')
const { data: groupedProducts } = await useFetch('/api/admin/kitchen/grouped-products')
const { data: menuProducts } = await useFetch('/api/admin/menu/products')

const toast = useToast()
const activeTab = ref('orders')

const ordersByStatus = computed(() => {
  if (!orders.value) return {
    confirmed: [],
    preparing: [],
    ready: [],
    en_route: []
  }

  return {
    confirmed: orders.value.filter(o => o.status === 'confirmed'),
    preparing: orders.value.filter(o => o.status === 'preparing'),
    ready: orders.value.filter(o => o.status === 'ready'),
    en_route: orders.value.filter(o => o.status === 'en_route')
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
  ready: 'green',
  en_route: 'purple'
}

const statusLabels = {
  confirmed: 'Confirmados',
  preparing: 'En Preparación',
  ready: 'Listos',
  en_route: 'En Camino'
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

      <!-- Tabs -->
      <UTabs
        v-model="activeTab"
        :items="[
          { key: 'orders', label: 'Pedidos', icon: 'i-lucide-shopping-cart' },
          { key: 'products', label: 'Viandas a Preparar', icon: 'i-lucide-chef-hat' },
          { key: 'menu', label: 'Menú Semanal', icon: 'i-lucide-calendar' }
        ]"
      />

      <!-- Stats -->
      <div
        v-if="stats && activeTab === 'orders'"
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

      <!-- Kanban Board (Pedidos) -->
      <div
        v-if="activeTab === 'orders'"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        <div
          v-for="statusKey in ['confirmed', 'preparing', 'ready', 'en_route']"
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
                      v-if="statusKey === 'ready' && order.deliveryType === 'delivery'"
                      size="xs"
                      color="purple"
                      @click="updateOrderStatus(order.id, 'en_route')"
                    >
                      En Camino
                    </UButton>
                    <UButton
                      v-if="statusKey === 'ready' && order.deliveryType === 'pickup'"
                      size="xs"
                      color="blue"
                      @click="updateOrderStatus(order.id, 'delivered')"
                    >
                      Entregado
                    </UButton>
                    <UButton
                      v-if="statusKey === 'en_route'"
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

      <!-- Viandas Agrupadas -->
      <div v-if="activeTab === 'products' && groupedProducts">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              Viandas a Preparar - Agrupadas
            </h3>
          </template>

          <div class="divide-y">
            <div
              v-for="product in groupedProducts"
              :key="product.productId"
              class="py-4 flex items-center justify-between"
            >
              <div class="flex items-center gap-4">
                <img
                  v-if="product.productImage"
                  :src="product.productImage"
                  :alt="product.productName"
                  class="w-16 h-16 rounded-lg object-cover"
                >
                <div
                  v-else
                  class="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center"
                >
                  🍱
                </div>
                <div>
                  <p class="font-semibold">
                    {{ product.productName }}
                  </p>
                  <p class="text-sm text-gray-500">
                    {{ product.orderCount }} pedidos
                  </p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-3xl font-bold text-primary">
                  {{ product.totalQuantity }}
                </p>
                <p class="text-xs text-gray-500">
                  unidades
                </p>
              </div>
            </div>

            <div
              v-if="groupedProducts.length === 0"
              class="py-8 text-center text-gray-400"
            >
              No hay viandas por preparar
            </div>
          </div>
        </UCard>
      </div>

      <!-- Menú Semanal -->
      <div v-if="activeTab === 'menu' && menuProducts">
        <div class="space-y-4">
          <div class="flex justify-between items-center">
            <h3 class="text-lg font-semibold">
              Productos del Menú
            </h3>
            <UButton
              icon="i-lucide-plus"
              color="primary"
            >
              Agregar Producto
            </UButton>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <UCard
              v-for="product in menuProducts"
              :key="product.id"
            >
              <div class="space-y-3">
                <img
                  v-if="product.imageUrl"
                  :src="product.imageUrl"
                  :alt="product.name"
                  class="w-full h-48 object-cover rounded-lg"
                >
                <div
                  v-else
                  class="w-full h-48 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center text-4xl"
                >
                  🍱
                </div>

                <div>
                  <div class="flex justify-between items-start">
                    <h4 class="font-semibold">
                      {{ product.name }}
                    </h4>
                    <UBadge :color="product.isAvailable ? 'green' : 'gray'">
                      {{ product.isAvailable ? 'Disponible' : 'No disponible' }}
                    </UBadge>
                  </div>
                  <p class="text-sm text-gray-500 line-clamp-2">
                    {{ product.description }}
                  </p>
                  <p class="text-lg font-bold text-primary mt-2">
                    ${{ product.price }}
                  </p>
                </div>

                <div class="flex gap-2 flex-wrap">
                  <UBadge
                    v-if="product.isVegetarian"
                    size="xs"
                    color="green"
                  >
                    🌱 Vegetariano
                  </UBadge>
                  <UBadge
                    v-if="product.isVegan"
                    size="xs"
                    color="green"
                  >
                    🥬 Vegano
                  </UBadge>
                  <UBadge
                    v-if="product.isGlutenFree"
                    size="xs"
                    color="blue"
                  >
                    🌾 Sin Gluten
                  </UBadge>
                  <UBadge
                    v-if="product.isLowCarb"
                    size="xs"
                    color="purple"
                  >
                    💪 Low Carb
                  </UBadge>
                </div>

                <div
                  v-if="product.calories"
                  class="text-xs text-gray-500 grid grid-cols-4 gap-2"
                >
                  <div>
                    <p class="font-semibold">
                      {{ product.calories }}
                    </p>
                    <p>cal</p>
                  </div>
                  <div v-if="product.protein">
                    <p class="font-semibold">
                      {{ product.protein }}g
                    </p>
                    <p>proteína</p>
                  </div>
                  <div v-if="product.carbs">
                    <p class="font-semibold">
                      {{ product.carbs }}g
                    </p>
                    <p>carbos</p>
                  </div>
                  <div v-if="product.fat">
                    <p class="font-semibold">
                      {{ product.fat }}g
                    </p>
                    <p>grasa</p>
                  </div>
                </div>

                <div class="flex gap-2">
                  <UButton
                    size="xs"
                    icon="i-lucide-edit"
                    variant="soft"
                  >
                    Editar
                  </UButton>
                  <UButton
                    size="xs"
                    icon="i-lucide-trash"
                    color="red"
                    variant="soft"
                  >
                    Eliminar
                  </UButton>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </div>
    </div>
  </UContainer>
</template>
