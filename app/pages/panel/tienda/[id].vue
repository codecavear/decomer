<script setup lang="ts">
interface Location {
  address?: string
  city?: string
  country?: string
  latitude?: number
  longitude?: number
  isPrimary?: boolean
}

interface Schedule {
  dayOfWeek: number
  isClosed: boolean
  openTime?: string
  closeTime?: string
}

interface StoreData {
  name: string
  description?: string
  logoUrl?: string
  logoPublicId?: string
  bannerUrl?: string
  bannerPublicId?: string
  locations?: Location[]
  schedules?: Schedule[]
}

definePageMeta({
  layout: 'panel',
  middleware: 'auth'
})

const route = useRoute()
const storeId = route.params.id as string

// Load store
const { data: storeData, error: storeError } = await useFetch<StoreData>(`/api/stores/${storeId}`)
if (storeError.value || !storeData.value) {
  throw createError({ statusCode: 404, message: 'Tienda no encontrada' })
}
const store = storeData.value

// Editing state
const editingSection = ref<string | null>(null)

const toggleEdit = (section: string) => {
  editingSection.value = editingSection.value === section ? null : section
}

// Store info form
const storeInfo = reactive({
  name: '',
  description: '',
  logo: null as File | null,
  logoUrl: null as string | null,
  logoPublicId: null as string | null,
  banner: null as File | null,
  bannerUrl: null as string | null,
  bannerPublicId: null as string | null
})

const logoPreview = ref<string | null>(store.logoUrl || null)
const bannerPreview = ref<string | null>(store.bannerUrl || null)
const logoFileInput = ref<HTMLInputElement | null>(null)
const bannerFileInput = ref<HTMLInputElement | null>(null)
const isUploadingLogo = ref(false)
const isUploadingBanner = ref(false)
const isSavingInfo = ref(false)
const infoToast = useToast()

// Initialize form from store
storeInfo.name = store.name
storeInfo.description = store.description ?? ''
storeInfo.logoUrl = store.logoUrl ?? null
storeInfo.logoPublicId = store.logoPublicId ?? null
storeInfo.bannerUrl = store.bannerUrl ?? null
storeInfo.bannerPublicId = store.bannerPublicId ?? null

// Location form - initialize from store's primary location
const primaryLocation = store.locations?.find((l: Location) => l.isPrimary) || store.locations?.[0]
const location = reactive({
  address: primaryLocation?.address ?? '',
  city: primaryLocation?.city ?? '',
  country: primaryLocation?.country ?? 'Argentina',
  latitude: primaryLocation?.latitude ? Number(primaryLocation.latitude) : null,
  longitude: primaryLocation?.longitude ? Number(primaryLocation.longitude) : null
})

// Schedule form
const daysOfWeek = [
  { value: 0, label: 'Domingo' },
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' }
]

// Initialize schedule from store data
const storeSchedules = store.schedules || []
const schedule = ref(
  daysOfWeek.map((day) => {
    const existing = storeSchedules.find((s: Schedule) => s.dayOfWeek === day.value)
    return {
      day: day.value,
      label: day.label,
      isClosed: existing ? existing.isClosed : false,
      openTime: existing?.openTime ?? '09:00',
      closeTime: existing?.closeTime ?? '18:00'
    }
  })
)

// Contacts form
const contactTypes = [
  { value: 'phone', label: 'Teléfono', icon: 'i-lucide-phone' },
  { value: 'whatsapp', label: 'WhatsApp', icon: 'i-lucide-message-circle' },
  { value: 'email', label: 'Email', icon: 'i-lucide-mail' },
  { value: 'instagram', label: 'Instagram', icon: 'i-lucide-instagram' },
  { value: 'facebook', label: 'Facebook', icon: 'i-lucide-facebook' }
]

interface Contact {
  type: string
  value: string
  isPrimary: boolean
}

// Initialize contacts from store data
const storeContacts = (store as { contacts?: Contact[] }).contacts || []
const contacts = ref(
  storeContacts.length > 0
    ? storeContacts.map((c: Contact) => ({ type: c.type, value: c.value, isPrimary: c.isPrimary }))
    : [{ type: 'phone', value: '', isPrimary: true }]
)

const addContact = () => {
  contacts.value.push({ type: 'phone', value: '', isPrimary: false })
}

const removeContact = (index: number) => {
  contacts.value.splice(index, 1)
}

const triggerLogoInput = () => {
  logoFileInput.value?.click()
}

const triggerBannerInput = () => {
  bannerFileInput.value?.click()
}

const handleLogoSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    storeInfo.logo = file
    // Create preview
    const reader = new FileReader()
    reader.onload = (_e) => {
      logoPreview.value = _e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const handleBannerSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    storeInfo.banner = file
    // Create preview
    const reader = new FileReader()
    reader.onload = (_e) => {
      bannerPreview.value = _e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const uploadImage = async (file: File): Promise<{ url: string, publicId: string } | null> => {
  try {
    const formData = new FormData()
    formData.append('image', file)

    const response = await $fetch('/api/upload/image', {
      method: 'POST',
      body: formData
    })

    return { url: response.url, publicId: response.publicId }
  } catch {
    console.error('Error uploading image:', error)
    return null
  }
}

const saveInfo = async () => {
  isSavingInfo.value = true
  try {
    // Upload logo if there's a new one
    if (storeInfo.logo) {
      isUploadingLogo.value = true
      const uploadResult = await uploadImage(storeInfo.logo)
      isUploadingLogo.value = false
      if (uploadResult) {
        storeInfo.logoUrl = uploadResult.url
        storeInfo.logoPublicId = uploadResult.publicId
      }
      storeInfo.logo = null
      if (logoFileInput.value) logoFileInput.value.value = ''
    }

    // Upload banner if there's a new one
    if (storeInfo.banner) {
      isUploadingBanner.value = true
      const uploadResult = await uploadImage(storeInfo.banner)
      isUploadingBanner.value = false
      if (uploadResult) {
        storeInfo.bannerUrl = uploadResult.url
        storeInfo.bannerPublicId = uploadResult.publicId
      }
      storeInfo.banner = null
      if (bannerFileInput.value) bannerFileInput.value.value = ''
    }

    await $fetch(`/api/stores/${storeId}`, {
      method: 'PATCH',
      body: {
        name: storeInfo.name,
        description: storeInfo.description || undefined,
        logoUrl: storeInfo.logoUrl ?? undefined,
        logoPublicId: storeInfo.logoPublicId ?? undefined,
        bannerUrl: storeInfo.bannerUrl ?? undefined,
        bannerPublicId: storeInfo.bannerPublicId ?? undefined
      }
    })
    infoToast.add({ title: 'Guardado', description: 'Los datos de la tienda se actualizaron correctamente.', color: 'success' })
  } catch {
    const error = _e as { data?: { message?: string } }
    infoToast.add({ title: 'Error', description: error?.data?.message || 'No se pudieron guardar los cambios.', color: 'error' })
  } finally {
    isSavingInfo.value = false
  }
}

// Location autocomplete
const { attachAutocomplete } = useAddressAutocomplete()
const addressInputRef = ref<HTMLElement | null>(null)
let autocompleteInstance: google.maps.places.Autocomplete | null = null

function onAddressSelect(result: { address: string, city: string, country: string, latitude: string, longitude: string }) {
  location.address = result.address
  location.city = result.city
  location.country = result.country
  location.latitude = Number(result.latitude) || null
  location.longitude = Number(result.longitude) || null
}

watch(editingSection, async (section) => {
  if (section !== 'location') return
  await nextTick()
  if (autocompleteInstance) return
  const comp = addressInputRef.value
  const el = (comp as { $el?: HTMLElement })?.$el ?? comp
  const input = el instanceof HTMLInputElement ? el : el?.querySelector?.('input')
  if (input) {
    autocompleteInstance = await attachAutocomplete(input, onAddressSelect)
  }
})

// Location map
const { loadGoogleMaps } = useGoogleMaps()
const locationMapContainer = ref<HTMLElement | null>(null)
const locationMap = ref<google.maps.Map | null>(null)
const locationMarker = ref<google.maps.Marker | null>(null)

const hasCoordinates = computed(() => location.latitude != null && location.longitude != null)

const initLocationMap = async () => {
  if (!hasCoordinates.value || !locationMapContainer.value) return
  try {
    await loadGoogleMaps()
    const center = { lat: Number(location.latitude), lng: Number(location.longitude) }

    if (locationMap.value) {
      locationMap.value.setCenter(center)
      locationMarker.value?.setPosition(center)
      return
    }

    locationMap.value = new google.maps.Map(locationMapContainer.value, {
      center,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    })

    locationMarker.value = new google.maps.Marker({
      position: center,
      map: locationMap.value,
      title: storeInfo.name
    })
  } catch (err) {
    console.error('Error loading location map:', err)
  }
}

watch([() => location.latitude, () => location.longitude], () => {
  if (hasCoordinates.value) nextTick(initLocationMap)
})

onMounted(() => {
  if (hasCoordinates.value) initLocationMap()
})

const saveLocation = async () => {
  console.log('Saving location...', location)
  // TODO: Implement API call
}

const saveSchedule = async () => {
  console.log('Saving schedule...', schedule.value)
  // TODO: Implement API call
}

const saveContacts = async () => {
  console.log('Saving contacts...', contacts.value)
  // TODO: Implement API call
}
</script>

<template>
  <UDashboardPanel id="panel-tienda">
    <template #header>
      <UDashboardNavbar title="Mi Tienda">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        <!-- Info Card -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-highlighted">
                Informacion basica
              </h3>
              <UButton
                :color="editingSection === 'info' ? 'primary' : 'neutral'"
                variant="ghost"
                :icon="editingSection === 'info' ? 'i-lucide-x' : 'i-lucide-pencil'"
                size="xs"
                @click="toggleEdit('info')"
              >
                {{ editingSection === 'info' ? 'Cerrar' : 'Editar' }}
              </UButton>
            </div>
          </template>

          <div
            v-if="editingSection === 'info'"
            class="space-y-4"
          >
            <UFormField
              label="Nombre de la tienda"
              required
            >
              <UInput
                v-model="storeInfo.name"
                placeholder="Ej: Veggie Market"
                icon="i-lucide-store"
              />
            </UFormField>

            <UFormField label="Descripcion">
              <UTextarea
                v-model="storeInfo.description"
                placeholder="Describe tu tienda..."
                :rows="3"
              />
            </UFormField>

            <div class="grid grid-cols-2 gap-4">
              <UFormField label="Logo">
                <div class="space-y-2">
                  <input
                    ref="logoFileInput"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleLogoSelect"
                  >
                  <div
                    class="size-24 rounded-lg border-2 border-dashed border-default flex items-center justify-center overflow-hidden cursor-pointer"
                    @click="triggerLogoInput"
                  >
                    <img
                      v-if="logoPreview"
                      :src="logoPreview"
                      alt="Logo"
                      class="size-full object-contain"
                    >
                    <UIcon
                      v-else
                      name="i-lucide-image"
                      class="size-8 text-muted"
                    />
                  </div>
                </div>
              </UFormField>

              <UFormField label="Banner">
                <div class="space-y-2">
                  <input
                    ref="bannerFileInput"
                    type="file"
                    accept="image/*"
                    class="hidden"
                    @change="handleBannerSelect"
                  >
                  <div
                    class="w-full h-24 rounded-lg border-2 border-dashed border-default flex items-center justify-center overflow-hidden cursor-pointer"
                    @click="triggerBannerInput"
                  >
                    <img
                      v-if="bannerPreview"
                      :src="bannerPreview"
                      alt="Banner"
                      class="size-full object-contain"
                    >
                    <UIcon
                      v-else
                      name="i-lucide-image"
                      class="size-8 text-muted"
                    />
                  </div>
                </div>
              </UFormField>
            </div>

            <div class="flex justify-end">
              <UButton
                color="primary"
                icon="i-lucide-save"
                :loading="isSavingInfo"
                @click="saveInfo"
              >
                Guardar
              </UButton>
            </div>
          </div>

          <div
            v-else
            class="space-y-2"
          >
            <div class="flex items-center gap-3">
              <div class="size-12 rounded-lg overflow-hidden bg-muted flex items-center justify-center shrink-0">
                <img
                  v-if="logoPreview"
                  :src="logoPreview"
                  alt="Logo"
                  class="size-full object-contain"
                >
                <UIcon
                  v-else
                  name="i-lucide-store"
                  class="size-6 text-muted"
                />
              </div>
              <div>
                <p class="font-semibold text-highlighted">
                  {{ storeInfo.name }}
                </p>
                <p class="text-sm text-muted line-clamp-2">
                  {{ storeInfo.description || 'Sin descripcion' }}
                </p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Location Card -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-highlighted">
                Ubicacion
              </h3>
              <UButton
                :color="editingSection === 'location' ? 'primary' : 'neutral'"
                variant="ghost"
                :icon="editingSection === 'location' ? 'i-lucide-x' : 'i-lucide-pencil'"
                size="xs"
                @click="toggleEdit('location')"
              >
                {{ editingSection === 'location' ? 'Cerrar' : 'Editar' }}
              </UButton>
            </div>
          </template>

          <div
            v-if="editingSection === 'location'"
            class="space-y-4"
          >
            <UFormField
              label="Direccion"
              required
            >
              <UInput
                ref="addressInputRef"
                v-model="location.address"
                icon="i-lucide-search"
                placeholder="Buscar direccion..."
                autocomplete="off"
              />
            </UFormField>

            <div
              v-if="location.address"
              class="flex items-center gap-2 text-sm text-muted"
            >
              <UIcon
                name="i-lucide-map-pin"
                class="size-4 text-primary shrink-0"
              />
              <span>{{ location.address }}, {{ location.city }}, {{ location.country }}</span>
            </div>

            <div
              v-if="hasCoordinates"
              ref="locationMapContainer"
              class="w-full h-48 rounded-lg"
            />

            <div class="flex justify-end">
              <UButton
                color="primary"
                icon="i-lucide-save"
                @click="saveLocation"
              >
                Guardar
              </UButton>
            </div>
          </div>

          <div
            v-else
            class="space-y-3"
          >
            <div class="space-y-1">
              <p class="text-sm text-highlighted">
                {{ location.address || 'Sin direccion' }}
              </p>
              <p class="text-sm text-muted">
                {{ location.city || 'Sin ciudad' }}, {{ location.country }}
              </p>
            </div>

            <div
              v-if="hasCoordinates"
              ref="locationMapContainer"
              class="w-full h-48 rounded-lg"
            />
            <div
              v-else
              class="w-full h-48 rounded-lg bg-muted flex items-center justify-center"
            >
              <div class="text-center">
                <UIcon
                  name="i-lucide-map-pin-off"
                  class="size-8 text-muted mx-auto mb-1"
                />
                <p class="text-xs text-muted">
                  Sin coordenadas
                </p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Schedule Card -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-highlighted">
                Horarios
              </h3>
              <UButton
                :color="editingSection === 'schedule' ? 'primary' : 'neutral'"
                variant="ghost"
                :icon="editingSection === 'schedule' ? 'i-lucide-x' : 'i-lucide-pencil'"
                size="xs"
                @click="toggleEdit('schedule')"
              >
                {{ editingSection === 'schedule' ? 'Cerrar' : 'Editar' }}
              </UButton>
            </div>
          </template>

          <div
            v-if="editingSection === 'schedule'"
            class="space-y-2"
          >
            <div
              v-for="day in schedule"
              :key="day.day"
              class="flex items-center gap-3 p-3 rounded-lg border border-default"
            >
              <div class="w-24 text-sm font-medium text-highlighted">
                {{ day.label }}
              </div>
              <USwitch
                v-model="day.isClosed"
                size="sm"
              />
              <span
                class="text-xs"
                :class="day.isClosed ? 'text-red-500' : 'text-green-500'"
              >
                {{ day.isClosed ? 'Cerrado' : 'Abierto' }}
              </span>
              <div
                v-if="!day.isClosed"
                class="flex items-center gap-1 ml-auto"
              >
                <UInput
                  v-model="day.openTime"
                  type="time"
                  class="w-28"
                  size="sm"
                />
                <span class="text-muted">-</span>
                <UInput
                  v-model="day.closeTime"
                  type="time"
                  class="w-28"
                  size="sm"
                />
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <UButton
                color="primary"
                icon="i-lucide-save"
                @click="saveSchedule"
              >
                Guardar
              </UButton>
            </div>
          </div>

          <div
            v-else
            class="space-y-1"
          >
            <div
              v-for="day in schedule"
              :key="day.day"
              class="flex items-center justify-between text-sm"
            >
              <span class="text-highlighted">{{ day.label }}</span>
              <span :class="day.isClosed ? 'text-red-500' : 'text-muted'">
                {{ day.isClosed ? 'Cerrado' : `${day.openTime} - ${day.closeTime}` }}
              </span>
            </div>
          </div>
        </UCard>

        <!-- Contacts Card -->
        <UCard>
          <template #header>
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-highlighted">
                Contactos
              </h3>
              <UButton
                :color="editingSection === 'contacts' ? 'primary' : 'neutral'"
                variant="ghost"
                :icon="editingSection === 'contacts' ? 'i-lucide-x' : 'i-lucide-pencil'"
                size="xs"
                @click="toggleEdit('contacts')"
              >
                {{ editingSection === 'contacts' ? 'Cerrar' : 'Editar' }}
              </UButton>
            </div>
          </template>

          <div
            v-if="editingSection === 'contacts'"
            class="space-y-3"
          >
            <div
              v-for="(contact, index) in contacts"
              :key="index"
              class="p-3 rounded-lg border border-default space-y-3"
            >
              <div class="grid grid-cols-2 gap-3">
                <UFormField label="Tipo">
                  <USelect
                    v-model="contact.type"
                    :items="contactTypes"
                    value-key="value"
                    label-key="label"
                  />
                </UFormField>
                <UFormField label="Valor">
                  <UInput
                    v-model="contact.value"
                    :placeholder="contact.type === 'phone' || contact.type === 'whatsapp' ? '+54 9 11 1234-5678'
                      : contact.type === 'email' ? 'contacto@tienda.com'
                        : '@usuario'"
                  />
                </UFormField>
              </div>
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <USwitch
                    v-model="contact.isPrimary"
                    size="sm"
                  />
                  <span class="text-xs text-muted">Principal</span>
                </div>
                <UButton
                  v-if="contacts.length > 1"
                  color="error"
                  variant="ghost"
                  icon="i-lucide-trash-2"
                  size="xs"
                  @click="removeContact(index)"
                />
              </div>
            </div>

            <UButton
              color="neutral"
              variant="soft"
              icon="i-lucide-plus"
              size="sm"
              @click="addContact"
            >
              Agregar contacto
            </UButton>

            <div class="flex justify-end">
              <UButton
                color="primary"
                icon="i-lucide-save"
                @click="saveContacts"
              >
                Guardar
              </UButton>
            </div>
          </div>

          <div
            v-else
            class="space-y-2"
          >
            <div
              v-for="(contact, index) in contacts"
              :key="index"
              class="flex items-center gap-2 text-sm"
            >
              <UBadge
                color="neutral"
                variant="soft"
                size="sm"
              >
                {{ contactTypes.find(t => t.value === contact.type)?.label || contact.type }}
              </UBadge>
              <span class="text-highlighted">{{ contact.value || 'Sin valor' }}</span>
              <UBadge
                v-if="contact.isPrimary"
                color="primary"
                variant="soft"
                size="sm"
              >
                Principal
              </UBadge>
            </div>
            <p
              v-if="contacts.length === 0"
              class="text-sm text-muted"
            >
              Sin contactos
            </p>
          </div>
        </UCard>
      </div>
    </template>
  </UDashboardPanel>
</template>
