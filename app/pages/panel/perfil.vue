<script setup lang="ts">
definePageMeta({
  layout: 'panel',
  middleware: 'auth'
})

useSeoMeta({
  title: 'Mi Perfil',
  robots: 'noindex'
})

const toast = useToast()
const { user: sessionUser } = useUserSession()

const ALLERGIES_OPTIONS = [
  'Gluten', 'Lácteos', 'Huevo', 'Maní', 'Frutos secos', 'Mariscos', 'Soja', 'Maíz'
]

const PREFERENCES_OPTIONS = [
  'Vegetariano', 'Vegano', 'Sin gluten', 'Low carb', 'Alto en proteínas', 'Sin picante', 'Sin cebolla', 'Sin ajo'
]

// Fetch profile
const { data: profile, refresh } = await useFetch('/api/profile')

const form = reactive({
  name: profile.value?.name ?? '',
  phone: (profile.value as any)?.phone ?? '',
  deliveryAddress: (profile.value as any)?.deliveryAddress ?? '',
  deliveryNeighborhood: (profile.value as any)?.deliveryNeighborhood ?? '',
  deliveryNotes: (profile.value as any)?.deliveryNotes ?? '',
  allergies: ((profile.value as any)?.allergies as string[]) ?? [],
  preferences: ((profile.value as any)?.preferences as string[]) ?? [],
  deliverySchedule: ((profile.value as any)?.deliverySchedule as { start: string; end: string } | null) ?? null
})

// Local time inputs (bound to form.deliverySchedule)
const scheduleStart = ref((form.deliverySchedule?.start) ?? '')
const scheduleEnd = ref((form.deliverySchedule?.end) ?? '')

watch([scheduleStart, scheduleEnd], ([s, e]) => {
  if (s || e) {
    form.deliverySchedule = { start: s, end: e }
  } else {
    form.deliverySchedule = null
  }
})

// Sync when profile loads
watch(profile, (p) => {
  if (p) {
    form.name = p.name ?? ''
    form.phone = (p as any).phone ?? ''
    form.deliveryAddress = (p as any).deliveryAddress ?? ''
    form.deliveryNeighborhood = (p as any).deliveryNeighborhood ?? ''
    form.deliveryNotes = (p as any).deliveryNotes ?? ''
    form.allergies = ((p as any).allergies as string[]) ?? []
    form.preferences = ((p as any).preferences as string[]) ?? []
    const sched = (p as any).deliverySchedule as { start: string; end: string } | null
    form.deliverySchedule = sched ?? null
    scheduleStart.value = sched?.start ?? ''
    scheduleEnd.value = sched?.end ?? ''
  }
})

const isSaving = ref(false)

const save = async () => {
  isSaving.value = true
  try {
    await $fetch('/api/profile', {
      method: 'PATCH',
      body: form
    })
    await refresh()
    toast.add({ title: 'Perfil actualizado', color: 'success' })
  } catch (e: any) {
    toast.add({ title: 'Error', description: e.data?.message || 'No se pudo guardar', color: 'error' })
  } finally {
    isSaving.value = false
  }
}

const toggleAllergy = (a: string) => {
  const idx = form.allergies.indexOf(a)
  if (idx >= 0) form.allergies.splice(idx, 1)
  else form.allergies.push(a)
}

const togglePreference = (p: string) => {
  const idx = form.preferences.indexOf(p)
  if (idx >= 0) form.preferences.splice(idx, 1)
  else form.preferences.push(p)
}

// Order history
const { data: recentOrders } = await useFetch('/api/orders', {
  query: { limit: 5 }
})

const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado'
}

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'warning',
  confirmed: 'info',
  preparing: 'primary',
  ready: 'success',
  delivered: 'neutral',
  cancelled: 'error'
}

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(amount)

// Subscription management (only for store_owner)
const isStoreOwner = computed(() => sessionUser.value?.role === 'store_owner')

const { data: myStore } = isStoreOwner.value
  ? await useFetch('/api/stores/my')
  : { data: ref(null) }

const storeId = computed(() => (myStore.value as any)?.id ?? null)

const { data: subscription } = (isStoreOwner.value && storeId.value)
  ? await useFetch(() => `/api/subscriptions/store/${storeId.value}`, { watch: [storeId] })
  : { data: ref(null) }

const subscriptionPlanName = computed(() => {
  const sub = subscription.value as any
  if (!sub) return null
  if (typeof sub.plan === 'object' && sub.plan?.name) return sub.plan.name
  if (typeof sub.plan === 'string') return sub.plan
  return 'Plan gratuito'
})

const subscriptionStatus = computed(() => {
  const sub = subscription.value as any
  if (!sub) return null
  return sub.status ?? 'active'
})
</script>

<template>
  <div class="max-w-2xl mx-auto px-6 py-10 space-y-8">

    <!-- Header -->
    <div class="flex items-center gap-4">
      <UAvatar
        :src="sessionUser?.avatarUrl ?? undefined"
        :alt="sessionUser?.name"
        size="xl"
      />
      <div>
        <h1 class="text-2xl font-bold">{{ sessionUser?.name }}</h1>
        <p class="text-neutral-500 text-sm">{{ sessionUser?.email }}</p>
      </div>
    </div>

    <USeparator />

    <!-- Datos personales -->
    <div>
      <h2 class="text-lg font-semibold mb-4">Datos personales</h2>
      <div class="space-y-4">
        <UFormField label="Nombre" name="name">
          <UInput v-model="form.name" placeholder="Tu nombre" class="w-full" />
        </UFormField>
        <UFormField label="Teléfono" name="phone">
          <UInput v-model="form.phone" placeholder="+54 9 351 000-0000" class="w-full" />
        </UFormField>
      </div>
    </div>

    <USeparator />

    <!-- Dirección de entrega -->
    <div>
      <h2 class="text-lg font-semibold mb-4">Dirección de entrega</h2>
      <div class="space-y-4">
        <UFormField label="Dirección" name="deliveryAddress">
          <UInput
            v-model="form.deliveryAddress"
            placeholder="Av. Colón 1234"
            icon="i-lucide-map-pin"
            class="w-full"
          />
        </UFormField>
        <UFormField label="Barrio" name="deliveryNeighborhood">
          <UInput v-model="form.deliveryNeighborhood" placeholder="Nueva Córdoba" class="w-full" />
        </UFormField>
        <UFormField label="Notas de entrega" name="deliveryNotes">
          <UTextarea
            v-model="form.deliveryNotes"
            placeholder="Ej: Timbre 2B, dejar en portería..."
            class="w-full"
            :rows="2"
          />
        </UFormField>
      </div>
    </div>

    <USeparator />

    <!-- Horario de entrega preferido -->
    <div>
      <h2 class="text-lg font-semibold mb-1">Horario de entrega preferido</h2>
      <p class="text-sm text-neutral-500 mb-4">Indicá en qué franja horaria preferís recibir tus pedidos.</p>
      <div class="flex items-center gap-4">
        <UFormField label="Desde" name="scheduleStart" class="flex-1">
          <UInput
            v-model="scheduleStart"
            type="time"
            icon="i-lucide-clock"
            class="w-full"
          />
        </UFormField>
        <div class="pt-5 text-neutral-400 font-medium">hasta</div>
        <UFormField label="Hasta" name="scheduleEnd" class="flex-1">
          <UInput
            v-model="scheduleEnd"
            type="time"
            icon="i-lucide-clock"
            class="w-full"
          />
        </UFormField>
      </div>
    </div>

    <USeparator />

    <!-- Alergias -->
    <div>
      <h2 class="text-lg font-semibold mb-1">Alergias e intolerancias</h2>
      <p class="text-sm text-neutral-500 mb-4">Seleccioná lo que querés que tengamos en cuenta.</p>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="a in ALLERGIES_OPTIONS"
          :key="a"
          :label="a"
          :color="form.allergies.includes(a) ? 'error' : 'neutral'"
          :variant="form.allergies.includes(a) ? 'solid' : 'outline'"
          size="sm"
          @click="toggleAllergy(a)"
        />
      </div>
    </div>

    <USeparator />

    <!-- Preferencias -->
    <div>
      <h2 class="text-lg font-semibold mb-1">Preferencias alimentarias</h2>
      <p class="text-sm text-neutral-500 mb-4">Para mostrarte las viandas más relevantes.</p>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="p in PREFERENCES_OPTIONS"
          :key="p"
          :label="p"
          :color="form.preferences.includes(p) ? 'primary' : 'neutral'"
          :variant="form.preferences.includes(p) ? 'solid' : 'outline'"
          size="sm"
          @click="togglePreference(p)"
        />
      </div>
    </div>

    <USeparator />

    <!-- Historial de pedidos -->
    <div>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold">Historial de pedidos</h2>
        <UButton
          label="Ver todos"
          variant="ghost"
          size="sm"
          icon="i-lucide-arrow-right"
          trailing
          to="/mis-pedidos"
        />
      </div>

      <div v-if="recentOrders && (recentOrders as any[]).length > 0" class="space-y-2">
        <UCard
          v-for="order in (recentOrders as any[])"
          :key="order.id"
          class="hover:bg-neutral-50 dark:hover:bg-neutral-900 transition-colors"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="min-w-0 flex-1">
              <p class="font-medium text-sm truncate">{{ order.store?.name ?? 'Tienda' }}</p>
              <p class="text-xs text-neutral-500 mt-0.5">{{ formatDate(order.createdAt) }}</p>
            </div>
            <div class="flex items-center gap-3 shrink-0">
              <UBadge
                :label="ORDER_STATUS_LABELS[order.status] ?? order.status"
                :color="(ORDER_STATUS_COLORS[order.status] as any) ?? 'neutral'"
                variant="subtle"
                size="sm"
              />
              <span class="text-sm font-semibold">{{ formatCurrency(order.total) }}</span>
            </div>
          </div>
        </UCard>
      </div>

      <div v-else class="text-center py-8 text-neutral-400">
        <UIcon name="i-lucide-shopping-bag" class="w-8 h-8 mx-auto mb-2 opacity-40" />
        <p class="text-sm">Todavía no tenés pedidos.</p>
        <UButton label="Explorar tiendas" variant="ghost" size="sm" to="/panel" class="mt-2" />
      </div>
    </div>

    <!-- Gestión de suscripción (solo store owners) -->
    <template v-if="isStoreOwner && myStore">
      <USeparator />

      <div>
        <h2 class="text-lg font-semibold mb-1">Gestión de suscripción</h2>
        <p class="text-sm text-neutral-500 mb-4">Tu plan actual para {{ (myStore as any)?.name ?? 'tu tienda' }}.</p>

        <UCard>
          <div class="flex items-center justify-between gap-4">
            <div>
              <p class="font-semibold text-base">{{ subscriptionPlanName ?? 'Plan gratuito' }}</p>
              <div class="flex items-center gap-2 mt-1">
                <UBadge
                  :label="subscriptionStatus === 'active' ? 'Activo' : (subscriptionStatus ?? 'Activo')"
                  :color="subscriptionStatus === 'active' ? 'success' : 'warning'"
                  variant="subtle"
                  size="sm"
                />
              </div>
            </div>
            <UButton
              label="Mejorar plan"
              icon="i-lucide-zap"
              color="primary"
              to="/pricing"
            />
          </div>
        </UCard>
      </div>
    </template>

    <USeparator />

    <!-- Save -->
    <div class="flex justify-end">
      <UButton
        label="Guardar cambios"
        icon="i-lucide-save"
        :loading="isSaving"
        @click="save"
      />
    </div>

  </div>
</template>
