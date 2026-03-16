<script setup lang="ts">
/// <reference types="@types/google.maps" />
import { z } from 'zod'

definePageMeta({
  layout: 'panel',
  middleware: 'auth'
})

useSeoMeta({
  title: 'Crear Tienda',
  description: 'Crea tu cuenta de DeComer en DeComer'
})

const router = useRouter()
const toast = useToast()

// Wizard steps
const currentStep = ref(1)
const totalSteps = 4

// Store types
const storeTypes = [
  { value: 'catalog', label: 'Solo Catalogo', description: 'Mostrar productos sin pedidos online', icon: 'i-lucide-book-open' },
  { value: 'pickup', label: 'Retiro en Tienda', description: 'Clientes hacen pedidos y retiran', icon: 'i-lucide-store' },
  { value: 'delivery', label: 'Solo Delivery', description: 'Entregas a domicilio', icon: 'i-lucide-truck' },
  { value: 'pickup_delivery', label: 'Retiro + Delivery', description: 'Ambas opciones disponibles', icon: 'i-lucide-package' }
]

// Form state
const formData = reactive({
  // Step 1: Basic Info
  name: '',
  description: '',
  type: 'catalog' as 'catalog' | 'pickup' | 'delivery' | 'pickup_delivery',
  logoUrl: '',
  bannerUrl: '',
  categories: [] as string[],

  // Step 2: Location
  address: '',
  city: '',
  country: 'Argentina',
  latitude: '',
  longitude: '',
  neighborhood: '',
  apartment: '',

  // Step 3: Schedule
  schedules: [
    { dayOfWeek: 0, openTime: '09:00', closeTime: '18:00', isClosed: true },
    { dayOfWeek: 1, openTime: '09:00', closeTime: '18:00', isClosed: false },
    { dayOfWeek: 2, openTime: '09:00', closeTime: '18:00', isClosed: false },
    { dayOfWeek: 3, openTime: '09:00', closeTime: '18:00', isClosed: false },
    { dayOfWeek: 4, openTime: '09:00', closeTime: '18:00', isClosed: false },
    { dayOfWeek: 5, openTime: '09:00', closeTime: '18:00', isClosed: false },
    { dayOfWeek: 6, openTime: '09:00', closeTime: '18:00', isClosed: true }
  ],

  // Step 4: Contacts
  contacts: [
    { type: 'phone', value: '', isPrimary: true }
  ] as Array<{ type: string, value: string, isPrimary: boolean }>
})

// Fetch categories
const { data: categoriesRaw } = await useFetch('/api/categories', {
  default: () => []
})

// Flatten hierarchical categories for display
const categories = computed(() => {
  const result: Array<{ id: string, name: string, slug: string, icon: string | null }> = []
  for (const cat of categoriesRaw.value || []) {
    result.push({ id: cat.id, name: cat.name, slug: cat.slug, icon: cat.icon })
    if (cat.children && cat.children.length > 0) {
      for (const child of cat.children) {
        result.push({ id: child.id, name: child.name, slug: child.slug, icon: child.icon })
      }
    }
  }
  return result
})

// Validation schemas
const step1Schema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  description: z.string().optional().refine(
    val => !val || val.length >= 10,
    'La descripcion debe tener al menos 10 caracteres'
  ),
  categories: z.array(z.string()).min(1, 'Selecciona al menos una categoria')
})

const step2Schema = z.object({
  address: z.string().min(5, 'Busca y selecciona una direccion'),
  city: z.string().min(2, 'Selecciona una direccion para completar la ciudad'),
  latitude: z.string().min(1, 'Selecciona una direccion del buscador para obtener la ubicacion'),
  longitude: z.string().min(1)
})

const step3Schema = z.object({
  schedules: z.array(z.object({
    dayOfWeek: z.number(),
    openTime: z.string().optional(),
    closeTime: z.string().optional(),
    isClosed: z.boolean()
  }))
})

const step4Schema = z.object({
  contacts: z.array(z.object({
    type: z.string(),
    value: z.string().min(1, 'Ingresa un valor'),
    isPrimary: z.boolean()
  })).min(1, 'Agrega al menos un contacto')
})

// Validate current step
const validateStep = (step: number) => {
  try {
    if (step === 1) {
      step1Schema.parse({
        name: formData.name,
        description: formData.description,
        categories: formData.categories
      })
    } else if (step === 2) {
      step2Schema.parse({
        address: formData.address,
        city: formData.city,
        latitude: formData.latitude,
        longitude: formData.longitude
      })
    } else if (step === 3) {
      step3Schema.parse({
        schedules: formData.schedules
      })
    } else if (step === 4) {
      step4Schema.parse({
        contacts: formData.contacts.filter(c => c.value)
      })
    }
    return true
  } catch {
    if (error instanceof z.ZodError) {
      toast.add({
        title: 'Error de validacion',
        description: error.errors[0].message,
        color: 'error'
      })
    }
    return false
  }
}

// Navigation
const nextStep = () => {
  if (validateStep(currentStep.value)) {
    if (currentStep.value < totalSteps) {
      currentStep.value++
    }
  }
}

const prevStep = () => {
  if (currentStep.value > 1) {
    currentStep.value--
  }
}

// Toggle category
const toggleCategory = (slug: string) => {
  const index = formData.categories.indexOf(slug)
  if (index > -1) {
    formData.categories.splice(index, 1)
  } else {
    formData.categories.push(slug)
  }
}

// Add contact
const addContact = () => {
  formData.contacts.push({
    type: 'phone',
    value: '',
    isPrimary: false
  })
}

// Remove contact
const removeContact = (index: number) => {
  if (formData.contacts.length > 1) {
    formData.contacts.splice(index, 1)
  }
}

// Submit
const submitting = ref(false)
const submitStore = async () => {
  if (!validateStep(4)) return

  submitting.value = true
  try {
    await $fetch('/api/stores', {
      method: 'POST',
      body: {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        logoUrl: formData.logoUrl,
        bannerUrl: formData.bannerUrl,
        categories: formData.categories,
        location: {
          address: formData.address,
          city: formData.city,
          country: formData.country,
          latitude: formData.latitude || null,
          longitude: formData.longitude || null,
          neighborhood: formData.neighborhood,
          apartment: formData.apartment
        },
        schedules: formData.schedules,
        contacts: formData.contacts.filter(c => c.value)
      }
    })

    toast.add({
      title: 'Tienda creada',
      description: 'Tu tienda ha sido creada exitosamente',
      color: 'success'
    })

    router.push('/panel')
  } catch (err) {
    const error = err as { data?: { message?: string } }
    toast.add({
      title: 'Error',
      description: error.data?.message || 'No se pudo crear la tienda',
      color: 'error'
    })
  } finally {
    submitting.value = false
  }
}

const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado']

// Address autocomplete (Step 2)
const { attachAutocomplete } = useAddressAutocomplete()
const addressInputRef = ref<HTMLElement | null>(null)
let autocompleteInstance: google.maps.places.Autocomplete | null = null

function onAddressSelect(result: AddressResult) {
  formData.address = result.address
  formData.city = result.city
  formData.country = result.country
  formData.neighborhood = result.neighborhood
  formData.latitude = result.latitude
  formData.longitude = result.longitude
}

watch(currentStep, async (step) => {
  if (step !== 2) return
  await nextTick()
  if (autocompleteInstance) return
  const comp = addressInputRef.value
  const el = (comp as { $el?: HTMLElement })?.$el ?? comp
  const input = el instanceof HTMLInputElement ? el : el?.querySelector?.('input')
  if (input) {
    autocompleteInstance = await attachAutocomplete(input, onAddressSelect)
  }
}, { immediate: true })

const contactTypes = [
  { value: 'phone', label: 'Telefono', icon: 'i-lucide-phone' },
  { value: 'whatsapp', label: 'WhatsApp', icon: 'i-lucide-message-circle' },
  { value: 'email', label: 'Email', icon: 'i-lucide-mail' },
  { value: 'instagram', label: 'Instagram', icon: 'i-lucide-instagram' },
  { value: 'facebook', label: 'Facebook', icon: 'i-lucide-facebook' },
  { value: 'website', label: 'Sitio web', icon: 'i-lucide-link' }
]

const stepLabels = ['Informacion', 'Ubicacion', 'Horarios', 'Contacto']

// Location map preview
const { loadGoogleMaps } = useGoogleMaps()
const locationMapEl = ref<HTMLElement | null>(null)
let locationMap: google.maps.Map | null = null
let locationMarker: google.maps.Marker | null = null

const hasCoords = computed(() => !!formData.latitude && !!formData.longitude)

async function updateLocationMap() {
  if (!hasCoords.value || !locationMapEl.value) return
  try {
    await loadGoogleMaps()
    const center = { lat: Number(formData.latitude), lng: Number(formData.longitude) }

    if (locationMap) {
      locationMap.setCenter(center)
      locationMarker?.setPosition(center)
      return
    }

    locationMap = new google.maps.Map(locationMapEl.value, {
      center,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false
    })

    locationMarker = new google.maps.Marker({
      position: center,
      map: locationMap,
      title: formData.name || 'Tu tienda'
    })
  } catch (err) {
    console.error('Error loading map:', err)
  }
}

watch(() => [formData.latitude, formData.longitude], () => {
  if (hasCoords.value) nextTick(updateLocationMap)
})
</script>

<template>
  <UDashboardPanel id="crear-tienda">
    <template #header>
      <UDashboardNavbar title="Crear Tienda">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <span class="text-sm text-muted">Paso {{ currentStep }} de {{ totalSteps }}</span>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <div class="flex items-center gap-2 w-full">
            <template
              v-for="step in totalSteps"
              :key="step"
            >
              <div
                :class="[
                  'flex items-center justify-center size-8 rounded-full text-sm font-semibold transition-colors shrink-0',
                  step <= currentStep ? 'bg-primary text-white' : 'bg-elevated text-muted'
                ]"
              >
                {{ step }}
              </div>
              <span
                :class="[
                  'text-sm hidden sm:inline',
                  step <= currentStep ? 'text-highlighted font-medium' : 'text-muted'
                ]"
              >
                {{ stepLabels[step - 1] }}
              </span>
              <div
                v-if="step < totalSteps"
                :class="[
                  'flex-1 h-0.5 mx-1',
                  step < currentStep ? 'bg-primary' : 'bg-elevated'
                ]"
              />
            </template>
          </div>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <!-- Step 1: Basic Info -->
      <div
        v-if="currentStep === 1"
        class="space-y-6 max-w-2xl"
      >
        <h2 class="text-xl font-bold">
          Informacion Basica
        </h2>

        <UFormField
          label="Nombre de la tienda"
          required
        >
          <UInput
            v-model="formData.name"
            placeholder="Mi DeComer"
          />
        </UFormField>

        <UFormField label="Descripcion">
          <UTextarea
            v-model="formData.description"
            placeholder="Describe tu tienda, productos y valores..."
            :rows="4"
          />
        </UFormField>

        <UFormField
          label="Tipo de Tienda"
          required
        >
          <div class="grid sm:grid-cols-2 gap-3">
            <label
              v-for="storeType in storeTypes"
              :key="storeType.value"
              class="flex items-start gap-3 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-elevated"
              :class="formData.type === storeType.value ? 'border-primary bg-primary/5' : 'border-default'"
            >
              <URadioGroup
                :model-value="formData.type"
                @update:model-value="formData.type = $event"
              >
                <URadio :value="storeType.value" />
              </URadioGroup>
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <UIcon
                    :name="storeType.icon"
                    class="size-5 text-primary"
                  />
                  <span class="font-medium">{{ storeType.label }}</span>
                </div>
                <p class="text-sm text-muted mt-1">{{ storeType.description }}</p>
              </div>
            </label>
          </div>
        </UFormField>

        <UFormField
          label="Categorias"
          required
        >
          <div class="grid sm:grid-cols-2 gap-3">
            <label
              v-for="category in categories"
              :key="category.id"
              class="flex items-center gap-3 p-4 rounded-lg border cursor-pointer transition-colors hover:bg-elevated"
              :class="formData.categories.includes(category.slug) ? 'border-primary bg-primary/5' : 'border-default'"
            >
              <UCheckbox
                :model-value="formData.categories.includes(category.slug)"
                @update:model-value="toggleCategory(category.slug)"
              />
              <UIcon
                :name="category.icon || 'i-lucide-leaf'"
                class="size-5 text-primary"
              />
              <span class="font-medium">{{ category.name }}</span>
            </label>
          </div>
        </UFormField>
      </div>

      <!-- Step 2: Location -->
      <div
        v-else-if="currentStep === 2"
        class="space-y-6 max-w-2xl"
      >
        <h2 class="text-xl font-bold">
          Donde esta tu tienda?
        </h2>

        <UInput
          ref="addressInputRef"
          v-model="formData.address"
          icon="i-lucide-search"
          size="xl"
          placeholder="Busca tu direccion..."
          autocomplete="off"
        />

        <div
          v-if="hasCoords"
          class="space-y-4"
        >
          <div
            ref="locationMapEl"
            class="w-full h-56 rounded-xl overflow-hidden"
          />

          <div class="flex items-center gap-2 text-sm text-muted">
            <UIcon
              name="i-lucide-map-pin"
              class="size-4 text-primary shrink-0"
            />
            <span>{{ formData.address }}, {{ formData.city }}, {{ formData.country }}</span>
          </div>

          <UFormField label="Depto / Piso (opcional)">
            <UInput
              v-model="formData.apartment"
              placeholder="Ej: 2 B"
            />
          </UFormField>
        </div>
      </div>

      <!-- Step 3: Schedule -->
      <div
        v-else-if="currentStep === 3"
        class="space-y-6 max-w-2xl"
      >
        <h2 class="text-xl font-bold">
          Horarios de Atencion
        </h2>

        <div class="space-y-3">
          <div
            v-for="(schedule, index) in formData.schedules"
            :key="index"
            class="flex items-center gap-4 p-4 rounded-lg border border-default"
          >
            <div class="font-medium min-w-[100px]">
              {{ dayNames[schedule.dayOfWeek] }}
            </div>

            <UCheckbox
              v-model="schedule.isClosed"
              label="Cerrado"
            />

            <div
              v-if="!schedule.isClosed"
              class="flex items-center gap-2 flex-1"
            >
              <UInput
                v-model="schedule.openTime"
                type="time"
                size="sm"
              />
              <span class="text-muted">a</span>
              <UInput
                v-model="schedule.closeTime"
                type="time"
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Step 4: Contacts -->
      <div
        v-else-if="currentStep === 4"
        class="space-y-6 max-w-2xl"
      >
        <div class="flex items-center justify-between">
          <h2 class="text-xl font-bold">
            Informacion de Contacto
          </h2>
          <UButton
            icon="i-lucide-plus"
            variant="outline"
            @click="addContact"
          >
            Agregar
          </UButton>
        </div>

        <div class="space-y-4">
          <div
            v-for="(contact, index) in formData.contacts"
            :key="index"
            class="flex items-end gap-4 p-4 rounded-lg border border-default"
          >
            <UFormField
              label="Tipo"
              class="flex-1"
            >
              <USelect
                v-model="contact.type"
                :items="contactTypes"
                label-key="label"
                value-key="value"
              />
            </UFormField>

            <UFormField
              label="Valor"
              class="flex-[2]"
            >
              <UInput
                v-model="contact.value"
                :placeholder="contact.type === 'email' ? 'correo@ejemplo.com' : contact.type === 'phone' || contact.type === 'whatsapp' ? '+54 9 11 1234-5678' : '@usuario'"
              />
            </UFormField>

            <UCheckbox
              v-model="contact.isPrimary"
              label="Principal"
            />

            <UButton
              icon="i-lucide-trash-2"
              color="error"
              variant="ghost"
              :disabled="formData.contacts.length <= 1"
              @click="removeContact(index)"
            />
          </div>
        </div>
      </div>

      <!-- Navigation Buttons -->
      <div class="flex items-center justify-between pt-8 mt-8 border-t border-default max-w-2xl">
        <UButton
          v-if="currentStep > 1"
          icon="i-lucide-chevron-left"
          variant="outline"
          @click="prevStep"
        >
          Anterior
        </UButton>
        <div v-else />

        <UButton
          v-if="currentStep < totalSteps"
          icon="i-lucide-chevron-right"
          trailing
          @click="nextStep"
        >
          Siguiente
        </UButton>

        <UButton
          v-else
          icon="i-lucide-check"
          :loading="submitting"
          @click="submitStore"
        >
          Crear Tienda
        </UButton>
      </div>
    </template>
  </UDashboardPanel>
</template>
