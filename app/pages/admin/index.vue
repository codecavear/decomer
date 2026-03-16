<script setup lang="ts">
definePageMeta({
  name: 'admin-dashboard',
  middleware: 'auth'
})

const { data: overview } = await useFetch('/api/admin/overview')

const quickActions = [
  {
    label: 'Panel de Cocina',
    icon: 'i-heroicons-fire',
    to: '/admin/kitchen',
    color: 'orange'
  },
  {
    label: 'Gestión de Menú',
    icon: 'i-heroicons-document-text',
    to: '/admin/menu',
    color: 'blue'
  },
  {
    label: 'Clientes',
    icon: 'i-heroicons-users',
    to: '/admin/customers',
    color: 'green'
  },
  {
    label: 'Reportes',
    icon: 'i-heroicons-chart-bar',
    to: '/admin/reports',
    color: 'purple'
  }
]
</script>

<template>
  <UContainer>
    <div class="py-8 space-y-8">
      <div>
        <h1 class="text-3xl font-bold">
          Panel de Administración
        </h1>
        <p class="text-gray-500 dark:text-gray-400">
          DeComer - Gestión integral
        </p>
      </div>

      <!-- Overview Stats -->
      <div
        v-if="overview"
        class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <UCard>
          <div class="flex items-center gap-4">
            <div class="p-3 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
              <UIcon
                name="i-heroicons-shopping-cart"
                class="w-6 h-6 text-orange-600"
              />
            </div>
            <div>
              <p class="text-2xl font-bold">
                {{ overview.todayOrders }}
              </p>
              <p class="text-sm text-gray-500">
                Pedidos hoy
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-4">
            <div class="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <UIcon
                name="i-heroicons-currency-dollar"
                class="w-6 h-6 text-green-600"
              />
            </div>
            <div>
              <p class="text-2xl font-bold">
                {{ overview.weeklyRevenue }}
              </p>
              <p class="text-sm text-gray-500">
                Facturación semanal
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-4">
            <div class="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
              <UIcon
                name="i-heroicons-users"
                class="w-6 h-6 text-blue-600"
              />
            </div>
            <div>
              <p class="text-2xl font-bold">
                {{ overview.activeCustomers }}
              </p>
              <p class="text-sm text-gray-500">
                Clientes activos
              </p>
            </div>
          </div>
        </UCard>

        <UCard>
          <div class="flex items-center gap-4">
            <div class="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <UIcon
                name="i-heroicons-fire"
                class="w-6 h-6 text-purple-600"
              />
            </div>
            <div>
              <p class="text-2xl font-bold">
                {{ overview.pendingOrders }}
              </p>
              <p class="text-sm text-gray-500">
                Pendientes cocina
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Quick Actions -->
      <div>
        <h2 class="text-xl font-semibold mb-4">
          Accesos Rápidos
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UCard
            v-for="action in quickActions"
            :key="action.to"
            :to="action.to"
            class="hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div class="flex items-center gap-4">
              <div :class="`p-4 bg-${action.color}-100 dark:bg-${action.color}-900/20 rounded-lg`">
                <UIcon
                  :name="action.icon"
                  class="w-8 h-8"
                  :class="`text-${action.color}-600`"
                />
              </div>
              <div>
                <p class="text-lg font-semibold">
                  {{ action.label }}
                </p>
              </div>
            </div>
          </UCard>
        </div>
      </div>

      <!-- Recent Activity -->
      <div v-if="overview?.recentOrders">
        <h2 class="text-xl font-semibold mb-4">
          Actividad Reciente
        </h2>
        <UCard>
          <div class="space-y-3">
            <div
              v-for="order in overview.recentOrders"
              :key="order.id"
              class="flex justify-between items-center py-2 border-b last:border-0"
            >
              <div>
                <p class="font-medium">
                  {{ order.userName }}
                </p>
                <p class="text-sm text-gray-500">
                  {{ order.itemCount }} items · ${{ order.totalAmount }}
                </p>
              </div>
              <div class="text-right">
                <UBadge :color="order.status === 'delivered' ? 'green' : 'yellow'">
                  {{ order.status }}
                </UBadge>
                <p class="text-xs text-gray-500 mt-1">
                  {{ new Date(order.createdAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' }) }}
                </p>
              </div>
            </div>
          </div>
        </UCard>
      </div>
    </div>
  </UContainer>
</template>
