<script setup lang="ts">
import type { OrderWithRelations } from '~/types'

definePageMeta({
  layout: 'panel',
  middleware: 'auth'
})

useSeoMeta({
  title: 'Mi Perfil',
  robots: 'noindex'
})

const {
  profile,
  sessionUser,
  form,
  status: profileStatus,
  isSaving,
  save,
  toggleAllergy,
  togglePreference
} = useProfile()

// ─── Orders ───────────────────────────────────────────────────────────────────
const { data: orders, status: ordersStatus } = await useFetch<OrderWithRelations[]>('/api/orders', {
  query: { limit: 20 },
  key: 'profile-orders'
})

// ─── Subscription plans ───────────────────────────────────────────────────────
const { data: subPlans } = await useFetch('/api/subscriptions/plans', {
  key: 'sub-plans'
})

// ─── Tabs ─────────────────────────────────────────────────────────────────────
const activeTab = ref('personal')

const tabs = [
  { id: 'personal', label: 'Datos', icon: 'i-lucide-user' },
  { id: 'delivery', label: 'Entrega', icon: 'i-lucide-map-pin' },
  { id: 'diet', label: 'Alimentación', icon: 'i-lucide-salad' },
  { id: 'orders', label: 'Pedidos', icon: 'i-lucide-shopping-bag' },
  { id: 'subscription', label: 'Suscripción', icon: 'i-lucide-credit-card' }
]

// ─── Options ──────────────────────────────────────────────────────────────────
const ALLERGY_OPTIONS = [
  { label: 'Gluten', icon: 'i-lucide-wheat' },
  { label: 'Lácteos', icon: 'i-lucide-milk' },
  { label: 'Huevo', icon: 'i-lucide-egg' },
  { label: 'Maní', icon: 'i-lucide-circle-alert' },
  { label: 'Frutos secos', icon: 'i-lucide-circle-alert' },
  { label: 'Mariscos', icon: 'i-lucide-fish' },
  { label: 'Soja', icon: 'i-lucide-leaf' },
  { label: 'Maíz', icon: 'i-lucide-leaf' }
]

const PREFERENCE_OPTIONS = [
  { label: 'Vegetariano', icon: 'i-lucide-leaf' },
  { label: 'Vegano', icon: 'i-lucide-sprout' },
  { label: 'Sin gluten', icon: 'i-lucide-ban' },
  { label: 'Low carb', icon: 'i-lucide-trending-down' },
  { label: 'Alto en proteínas', icon: 'i-lucide-dumbbell' },
  { label: 'Sin picante', icon: 'i-lucide-flame-kindling' },
  { label: 'Sin cebolla', icon: 'i-lucide-circle-x' },
  { label: 'Sin ajo', icon: 'i-lucide-circle-x' }
]

const DELIVERY_HOURS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
  '18:00', '19:00', '20:00', '21:00', '22:00'
]

const deliveryHoursOptions = DELIVERY_HOURS.map(h => ({ label: h, value: h }))

// ─── Order helpers ─────────────────────────────────────────────────────────────
type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

const statusColors: Record<OrderStatus, string> = {
  pending: 'warning',
  confirmed: 'info',
  preparing: 'primary',
  ready: 'success',
  delivered: 'success',
  cancelled: 'error'
}

const statusLabels: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado'
}

const expandedOrders = ref<Set<string>>(new Set())

const toggleOrder = (id: string) => {
  if (expandedOrders.value.has(id)) expandedOrders.value.delete(id)
  else expandedOrders.value.add(id)
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString('es-AR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })

const totalItems = (order: OrderWithRelations) =>
  order.items.reduce((n, i) => n + i.quantity, 0)

// ─── Subscription helpers ──────────────────────────────────────────────────────
const planColors: Record<string, string> = {
  free: 'neutral',
  pro: 'primary',
  business: 'warning'
}

const planLabels: Record<string, string> = {
  free: 'Gratuito',
  pro: 'Pro',
  business: 'Business'
}

// ─── Section save helpers ──────────────────────────────────────────────────────
const savePersonal = () => save({ name: form.name, phone: form.phone })
const saveDelivery = () => save({
  deliveryAddress: form.deliveryAddress,
  deliveryNeighborhood: form.deliveryNeighborhood,
  deliveryNotes: form.deliveryNotes,
  deliveryHoursFrom: form.deliveryHoursFrom,
  deliveryHoursTo: form.deliveryHoursTo
})
const saveDiet = () => save({ allergies: [...form.allergies], preferences: [...form.preferences] })
</script>

<template>
  <UDashboardPanel id="panel-perfil">
    <template #header>
      <UDashboardNavbar title="Mi Perfil">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="max-w-3xl mx-auto space-y-6 py-2">

        <!-- Avatar header -->
        <div class="flex items-center gap-4 px-1">
          <UAvatar
            :src="sessionUser?.avatarUrl ?? undefined"
            :alt="sessionUser?.name ?? 'Usuario'"
            size="xl"
          />
          <div class="min-w-0">
            <h1 class="text-2xl font-bold truncate">
              {{ sessionUser?.name ?? 'Mi perfil' }}
            </h1>
            <p class="text-sm text-muted truncate">
              {{ sessionUser?.email }}
            </p>
          </div>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 overflow-x-auto border-b border-default">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="flex items-center gap-1.5 px-3 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px"
            :class="activeTab === tab.id
              ? 'border-primary text-primary'
              : 'border-transparent text-muted hover:text-default'"
            @click="activeTab = tab.id"
          >
            <UIcon :name="tab.icon" class="size-4 flex-shrink-0" />
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <!-- ── Personal data ──────────────────────────────────────────── -->
        <div v-if="activeTab === 'personal'" class="space-y-6">
          <div>
            <h2 class="text-base font-semibold mb-1">
              Datos personales
            </h2>
            <p class="text-sm text-muted mb-5">
              Tu nombre y teléfono de contacto para los pedidos.
            </p>

            <div v-if="profileStatus === 'pending'" class="space-y-3">
              <USkeleton class="h-10 rounded-lg" />
              <USkeleton class="h-10 rounded-lg" />
              <USkeleton class="h-10 rounded-lg" />
            </div>

            <div v-else class="space-y-4">
              <UFormField label="Nombre completo" name="name">
                <UInput
                  v-model="form.name"
                  placeholder="Tu nombre"
                  icon="i-lucide-user"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Email" name="email">
                <UInput
                  :model-value="sessionUser?.email ?? ''"
                  icon="i-lucide-mail"
                  disabled
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Teléfono" name="phone">
                <UInput
                  v-model="form.phone"
                  placeholder="+54 9 351 000-0000"
                  icon="i-lucide-phone"
                  class="w-full"
                />
              </UFormField>
            </div>
          </div>

          <USeparator />

          <div>
            <h2 class="text-base font-semibold mb-1">
              Notificaciones
            </h2>
            <p class="text-sm text-muted mb-4">
              {{ $t('pwa.push.description') }}
            </p>
            <PushNotificationSettings />
          </div>

          <div class="flex justify-end">
            <UButton
              label="Guardar datos"
              icon="i-lucide-save"
              :loading="isSaving"
              :disabled="profileStatus === 'pending'"
              @click="savePersonal"
            />
          </div>
        </div>

        <!-- ── Delivery ────────────────────────────────────────────────── -->
        <div v-else-if="activeTab === 'delivery'" class="space-y-5">
          <div>
            <h2 class="text-base font-semibold mb-1">
              Dirección de entrega
            </h2>
            <p class="text-sm text-muted mb-5">
              Dónde y cuándo querés recibir tus viandas.
            </p>

            <div v-if="profileStatus === 'pending'" class="space-y-3">
              <USkeleton v-for="i in 4" :key="i" class="h-10 rounded-lg" />
            </div>

            <div v-else class="space-y-4">
              <UFormField label="Dirección" name="deliveryAddress">
                <UInput
                  v-model="form.deliveryAddress"
                  placeholder="Av. Colón 1234"
                  icon="i-lucide-map-pin"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Barrio" name="deliveryNeighborhood">
                <UInput
                  v-model="form.deliveryNeighborhood"
                  placeholder="Nueva Córdoba"
                  icon="i-lucide-building-2"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Notas para el repartidor" name="deliveryNotes">
                <UTextarea
                  v-model="form.deliveryNotes"
                  placeholder="Ej: Timbre 2B, dejar en portería, llamar al llegar..."
                  class="w-full"
                  :rows="3"
                />
              </UFormField>

              <!-- Delivery hours -->
              <div>
                <p class="text-sm font-medium mb-1">
                  Horario preferido de entrega
                </p>
                <p class="text-xs text-muted mb-3">
                  Indicá el rango en el que podés recibir el pedido.
                </p>
                <div class="flex items-end gap-3">
                  <UFormField label="Desde" name="deliveryHoursFrom" class="flex-1">
                    <USelect
                      v-model="form.deliveryHoursFrom"
                      :items="deliveryHoursOptions"
                      placeholder="Hora inicio"
                      class="w-full"
                    />
                  </UFormField>
                  <UIcon
                    name="i-lucide-arrow-right"
                    class="size-4 text-muted mb-2.5 flex-shrink-0"
                  />
                  <UFormField label="Hasta" name="deliveryHoursTo" class="flex-1">
                    <USelect
                      v-model="form.deliveryHoursTo"
                      :items="deliveryHoursOptions"
                      placeholder="Hora fin"
                      class="w-full"
                    />
                  </UFormField>
                </div>
              </div>
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <UButton
              label="Guardar dirección"
              icon="i-lucide-save"
              :loading="isSaving"
              :disabled="profileStatus === 'pending'"
              @click="saveDelivery"
            />
          </div>
        </div>

        <!-- ── Diet / Allergies & Preferences ─────────────────────────── -->
        <div v-else-if="activeTab === 'diet'" class="space-y-6">

          <!-- Allergies -->
          <div>
            <h2 class="text-base font-semibold mb-1">
              Alergias e intolerancias
            </h2>
            <p class="text-sm text-muted mb-4">
              Lo tenemos en cuenta al preparar y recomendarte viandas.
            </p>

            <div v-if="profileStatus === 'pending'" class="flex flex-wrap gap-2">
              <USkeleton v-for="i in 6" :key="i" class="h-8 w-24 rounded-full" />
            </div>

            <div v-else class="flex flex-wrap gap-2">
              <button
                v-for="opt in ALLERGY_OPTIONS"
                :key="opt.label"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                :class="form.allergies.includes(opt.label)
                  ? 'bg-error text-white border-error shadow-sm'
                  : 'border-default text-default hover:border-error hover:text-error bg-transparent'"
                @click="toggleAllergy(opt.label)"
              >
                <UIcon :name="opt.icon" class="size-3.5" />
                {{ opt.label }}
                <UIcon
                  v-if="form.allergies.includes(opt.label)"
                  name="i-lucide-check"
                  class="size-3.5"
                />
              </button>
            </div>
          </div>

          <USeparator />

          <!-- Preferences -->
          <div>
            <h2 class="text-base font-semibold mb-1">
              Preferencias alimentarias
            </h2>
            <p class="text-sm text-muted mb-4">
              Para mostrarte primero las viandas que más te van.
            </p>

            <div v-if="profileStatus === 'pending'" class="flex flex-wrap gap-2">
              <USkeleton v-for="i in 6" :key="i" class="h-8 w-28 rounded-full" />
            </div>

            <div v-else class="flex flex-wrap gap-2">
              <button
                v-for="opt in PREFERENCE_OPTIONS"
                :key="opt.label"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                :class="form.preferences.includes(opt.label)
                  ? 'bg-primary text-white border-primary shadow-sm'
                  : 'border-default text-default hover:border-primary hover:text-primary bg-transparent'"
                @click="togglePreference(opt.label)"
              >
                <UIcon :name="opt.icon" class="size-3.5" />
                {{ opt.label }}
                <UIcon
                  v-if="form.preferences.includes(opt.label)"
                  name="i-lucide-check"
                  class="size-3.5"
                />
              </button>
            </div>
          </div>

          <div class="flex justify-end pt-2">
            <UButton
              label="Guardar preferencias"
              icon="i-lucide-save"
              :loading="isSaving"
              :disabled="profileStatus === 'pending'"
              @click="saveDiet"
            />
          </div>
        </div>

        <!-- ── Order history ──────────────────────────────────────────── -->
        <div v-else-if="activeTab === 'orders'" class="space-y-4">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-base font-semibold mb-0.5">
                Historial de pedidos
              </h2>
              <p class="text-sm text-muted">
                Últimos 20 pedidos realizados.
              </p>
            </div>
            <UButton
              label="Ver todos"
              icon="i-lucide-external-link"
              variant="ghost"
              size="sm"
              to="/mis-pedidos"
            />
          </div>

          <!-- Loading -->
          <div v-if="ordersStatus === 'pending'" class="space-y-3">
            <USkeleton v-for="i in 4" :key="i" class="h-20 rounded-xl" />
          </div>

          <!-- Empty -->
          <UEmpty
            v-else-if="!orders || orders.length === 0"
            icon="i-lucide-shopping-bag"
            title="Sin pedidos todavía"
            description="Cuando hagas tu primer pedido, va a aparecer acá."
          >
            <template #actions>
              <UButton
                icon="i-lucide-search"
                to="/buscar"
                color="primary"
              >
                Ver el menú
              </UButton>
            </template>
          </UEmpty>

          <!-- List -->
          <div v-else class="space-y-3">
            <UCard
              v-for="order in orders"
              :key="order.id"
              variant="outline"
              class="cursor-pointer hover:shadow-sm transition-shadow"
              @click="toggleOrder(order.id)"
            >
              <div class="flex items-start justify-between gap-3">
                <!-- Store info -->
                <div class="flex items-center gap-3 flex-1 min-w-0">
                  <div class="size-10 rounded-lg bg-elevated flex items-center justify-center overflow-hidden flex-shrink-0">
                    <img
                      v-if="order.store.logoUrl"
                      :src="order.store.logoUrl"
                      :alt="order.store.name"
                      class="w-full h-full object-contain"
                    >
                    <UIcon
                      v-else
                      name="i-lucide-store"
                      class="size-5 text-muted"
                    />
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="font-medium truncate">
                      {{ order.store.name }}
                    </p>
                    <p class="text-xs text-muted">
                      {{ formatDate(order.createdAt as string) }} · {{ totalItems(order) }} {{ totalItems(order) === 1 ? 'vianda' : 'viandas' }}
                    </p>
                  </div>
                </div>

                <!-- Status + total -->
                <div class="flex flex-col items-end gap-1.5 flex-shrink-0">
                  <UBadge
                    :label="statusLabels[order.status as OrderStatus]"
                    :color="statusColors[order.status as OrderStatus]"
                    variant="soft"
                    size="sm"
                  />
                  <span class="text-sm font-semibold text-primary">
                    ${{ Number(order.totalAmount).toLocaleString('es-AR') }}
                  </span>
                  <UIcon
                    :name="expandedOrders.has(order.id) ? 'i-lucide-chevron-up' : 'i-lucide-chevron-down'"
                    class="size-4 text-muted"
                  />
                </div>
              </div>

              <!-- Expanded -->
              <div
                v-if="expandedOrders.has(order.id)"
                class="mt-4 pt-4 border-t border-default space-y-3"
                @click.stop
              >
                <div
                  v-for="item in order.items"
                  :key="item.id"
                  class="flex items-center gap-3 p-3 rounded-lg bg-elevated"
                >
                  <div class="size-12 rounded-md overflow-hidden bg-background flex-shrink-0">
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
                        class="size-5 text-muted"
                      />
                    </div>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium truncate">
                      {{ item.product.name }}
                    </p>
                    <p class="text-xs text-muted">
                      {{ item.quantity }} × ${{ Number(item.unitPrice).toLocaleString('es-AR') }}
                    </p>
                  </div>
                  <span class="text-sm font-semibold flex-shrink-0">
                    ${{ (Number(item.unitPrice) * item.quantity).toLocaleString('es-AR') }}
                  </span>
                </div>

                <div class="flex justify-between items-center pt-2 border-t border-default">
                  <span class="text-sm text-muted font-medium">Total</span>
                  <span class="font-bold text-primary">
                    ${{ Number(order.totalAmount).toLocaleString('es-AR') }}
                  </span>
                </div>
              </div>
            </UCard>
          </div>
        </div>

        <!-- ── Subscription ───────────────────────────────────────────── -->
        <div v-else-if="activeTab === 'subscription'" class="space-y-6">
          <div>
            <h2 class="text-base font-semibold mb-1">
              Suscripción
            </h2>
            <p class="text-sm text-muted">
              Tu plan activo y opciones de gestión.
            </p>
          </div>

          <!-- Current status -->
          <UCard variant="outline">
            <div class="flex items-start gap-4">
              <div class="size-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <UIcon name="i-lucide-crown" class="size-6 text-primary" />
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="font-semibold">
                    Plan activo
                  </h3>
                  <UBadge label="Activo" color="success" variant="soft" size="sm" />
                </div>
                <p class="text-sm text-muted mb-3">
                  Para cambiar o cancelar tu suscripción, contactanos por WhatsApp.
                </p>
                <UButton
                  label="Contactar soporte"
                  icon="i-lucide-message-circle"
                  color="primary"
                  variant="outline"
                  size="sm"
                  href="https://wa.me/5493510000000?text=Hola%2C%20quiero%20gestionar%20mi%20suscripci%C3%B3n%20en%20DeComer"
                  target="_blank"
                />
              </div>
            </div>
          </UCard>

          <!-- Plans -->
          <div v-if="subPlans && (subPlans as any[]).length > 0">
            <h3 class="text-sm font-semibold mb-3 text-muted uppercase tracking-wide">
              Planes disponibles
            </h3>
            <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <UCard
                v-for="plan in (subPlans as any[])"
                :key="plan.id"
                variant="outline"
              >
                <div class="space-y-3">
                  <div class="flex items-center justify-between">
                    <h4 class="font-semibold">
                      {{ plan.name }}
                    </h4>
                    <UBadge
                      :label="planLabels[plan.slug] ?? plan.slug"
                      :color="planColors[plan.slug] ?? 'neutral'"
                      variant="soft"
                      size="sm"
                    />
                  </div>

                  <p class="text-xs text-muted line-clamp-2">
                    {{ plan.description }}
                  </p>

                  <div>
                    <span class="text-xl font-bold">${{ Number(plan.priceMonthly).toLocaleString('es-AR') }}</span>
                    <span class="text-xs text-muted">/mes</span>
                  </div>

                  <ul class="space-y-1">
                    <li
                      v-for="feature in (plan.featuresEnabled ?? [])"
                      :key="feature"
                      class="flex items-center gap-2 text-xs text-muted"
                    >
                      <UIcon name="i-lucide-check" class="size-3.5 text-success flex-shrink-0" />
                      {{ feature }}
                    </li>
                  </ul>
                </div>
              </UCard>
            </div>
          </div>

          <!-- No plans fallback -->
          <div v-else>
            <UCard variant="soft" class="text-center py-8">
              <UIcon name="i-lucide-info" class="size-8 text-muted mx-auto mb-3" />
              <p class="text-sm text-muted">
                Visitá la página de
                <NuxtLink to="/pricing" class="text-primary font-medium underline-offset-2 hover:underline">
                  planes
                </NuxtLink>
                para ver las opciones disponibles.
              </p>
            </UCard>
          </div>

          <!-- Actions -->
          <div class="flex flex-wrap gap-3">
            <UButton
              label="Ver planes"
              icon="i-lucide-layers"
              to="/pricing"
              color="primary"
              variant="outline"
            />
            <UButton
              label="Pausar suscripción"
              icon="i-lucide-pause-circle"
              color="neutral"
              variant="outline"
              @click="() => {
                useToast().add({ title: 'Próximamente', description: 'Gestión de suscripciones en desarrollo.', icon: 'i-lucide-info', color: 'info' })
              }"
            />
          </div>
        </div>

      </div>
    </template>
  </UDashboardPanel>
</template>
