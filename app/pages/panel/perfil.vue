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
const { data: profile, _refresh } = await useFetch('/api/profile')

const form = reactive({
  name: profile.value?.name ?? '',
  phone: profile.value?.phone ?? '',
  deliveryAddress: profile.value?.deliveryAddress ?? '',
  deliveryNeighborhood: profile.value?.deliveryNeighborhood ?? '',
  deliveryNotes: profile.value?.deliveryNotes ?? '',
  allergies: (profile.value?.allergies as string[]) ?? [],
  preferences: (profile.value?.preferences as string[]) ?? []
})

interface ProfileData {
  name?: string
  phone?: string
  deliveryAddress?: string
  deliveryNeighborhood?: string
  deliveryNotes?: string
  allergies?: string[]
  preferences?: string[]
}

// Sync when profile loads
watch(profile, (p) => {
  if (p) {
    const profileData = p as ProfileData
    form.name = p.name ?? ''
    form.phone = profileData.phone ?? ''
    form.deliveryAddress = profileData.deliveryAddress ?? ''
    form.deliveryNeighborhood = profileData.deliveryNeighborhood ?? ''
    form.deliveryNotes = profileData.deliveryNotes ?? ''
    form.allergies = profileData.allergies ?? []
    form.preferences = profileData.preferences ?? []
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
    await _refresh()
    toast.add({ title: 'Perfil actualizado', color: 'success' })
  } catch {
    const _error = _e as { data?: { message?: string } }
    toast.add({ title: 'Error', description: _error.data?.message || 'No se pudo guardar', color: '_error' })
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
        <h1 class="text-2xl font-bold">
          {{ sessionUser?.name }}
        </h1>
        <p class="text-neutral-500 text-sm">
          {{ sessionUser?.email }}
        </p>
      </div>
    </div>

    <USeparator />

    <!-- Datos personales -->
    <div>
      <h2 class="text-lg font-semibold mb-4">
        Datos personales
      </h2>
      <div class="space-y-4">
        <UFormField
          label="Nombre"
          name="name"
        >
          <UInput
            v-model="form.name"
            placeholder="Tu nombre"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Teléfono"
          name="phone"
        >
          <UInput
            v-model="form.phone"
            placeholder="+54 9 351 000-0000"
            class="w-full"
          />
        </UFormField>
      </div>
    </div>

    <USeparator />

    <!-- Dirección de entrega -->
    <div>
      <h2 class="text-lg font-semibold mb-4">
        Dirección de entrega
      </h2>
      <div class="space-y-4">
        <UFormField
          label="Dirección"
          name="deliveryAddress"
        >
          <UInput
            v-model="form.deliveryAddress"
            placeholder="Av. Colón 1234"
            icon="i-lucide-map-pin"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Barrio"
          name="deliveryNeighborhood"
        >
          <UInput
            v-model="form.deliveryNeighborhood"
            placeholder="Nueva Córdoba"
            class="w-full"
          />
        </UFormField>
        <UFormField
          label="Notas de entrega"
          name="deliveryNotes"
        >
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

    <!-- Alergias -->
    <div>
      <h2 class="text-lg font-semibold mb-1">
        Alergias _e intolerancias
      </h2>
      <p class="text-sm text-neutral-500 mb-4">
        Seleccioná lo que querés que tengamos en cuenta.
      </p>
      <div class="flex flex-wrap gap-2">
        <UButton
          v-for="a in ALLERGIES_OPTIONS"
          :key="a"
          :label="a"
          :color="form.allergies.includes(a) ? '_error' : 'neutral'"
          :variant="form.allergies.includes(a) ? 'solid' : 'outline'"
          size="sm"
          @click="toggleAllergy(a)"
        />
      </div>
    </div>

    <USeparator />

    <!-- Preferencias -->
    <div>
      <h2 class="text-lg font-semibold mb-1">
        Preferencias alimentarias
      </h2>
      <p class="text-sm text-neutral-500 mb-4">
        Para mostrarte las viandas más relevantes.
      </p>
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
