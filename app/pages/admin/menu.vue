<script setup lang="ts">
definePageMeta({
  name: 'admin-menu',
  middleware: 'auth'
})

const { data: products, refresh } = await useFetch('/api/admin/menu/products')
const toast = useToast()

const isCreateModalOpen = ref(false)
const editingProduct = ref(null)

const form = reactive({
  name: '',
  description: '',
  price: 0,
  calories: 0,
  protein: 0,
  carbs: 0,
  fat: 0,
  isVegetarian: false,
  isVegan: false,
  isGlutenFree: false,
  isLowCarb: false,
  isAvailable: true
})

function openCreateModal() {
  Object.assign(form, {
    name: '',
    description: '',
    price: 0,
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    isVegetarian: false,
    isVegan: false,
    isGlutenFree: false,
    isLowCarb: false,
    isAvailable: true
  })
  editingProduct.value = null
  isCreateModalOpen.value = true
}

interface Product {
  id: string
  name: string
  description?: string
  price: number
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  isVegetarian: boolean
  isVegan: boolean
  isGlutenFree: boolean
  isLowCarb: boolean
  isAvailable: boolean
}

function openEditModal(product: Product) {
  Object.assign(form, product)
  editingProduct.value = product
  isCreateModalOpen.value = true
}

async function saveProduct() {
  try {
    if (editingProduct.value) {
      await $fetch(`/api/admin/menu/products/${editingProduct.value.id}`, {
        method: 'PATCH',
        body: form
      })
      toast.add({ title: 'Producto actualizado', color: 'green' })
    } else {
      await $fetch('/api/admin/menu/products', {
        method: 'POST',
        body: form
      })
      toast.add({ title: 'Producto creado', color: 'green' })
    }
    isCreateModalOpen.value = false
    refresh()
  } catch {
    toast.add({ title: 'Error al guardar', color: 'red' })
  }
}

async function toggleAvailability(productId: string, isAvailable: boolean) {
  try {
    await $fetch(`/api/admin/menu/products/${productId}`, {
      method: 'PATCH',
      body: { isAvailable }
    })
    toast.add({ title: 'Disponibilidad actualizada', color: 'green' })
    refresh()
  } catch {
    toast.add({ title: 'Error al actualizar', color: 'red' })
  }
}

const productsByCategory = computed(() => {
  if (!products.value) return {}

  return products.value.reduce((acc, product) => {
    const category = product.categoryName || 'Sin categoría'
    if (!acc[category]) acc[category] = []
    acc[category].push(product)
    return acc
  }, {})
})
</script>

<template>
  <UContainer>
    <div class="py-8 space-y-8">
      <div class="flex justify-between items-center">
        <div>
          <h1 class="text-3xl font-bold">
            Gestión de Menú
          </h1>
          <p class="text-gray-500 dark:text-gray-400">
            Productos y categorías
          </p>
        </div>
        <UButton @click="openCreateModal">
          Nuevo Producto
        </UButton>
      </div>

      <!-- Products by Category -->
      <div class="space-y-8">
        <div
          v-for="(categoryProducts, category) in productsByCategory"
          :key="category"
        >
          <h2 class="text-xl font-semibold mb-4">
            {{ category }}
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <UCard
              v-for="product in categoryProducts"
              :key="product.id"
            >
              <div class="space-y-3">
                <div class="flex justify-between items-start">
                  <div class="flex-1">
                    <h3 class="font-semibold">
                      {{ product.name }}
                    </h3>
                    <p class="text-sm text-gray-500 line-clamp-2">
                      {{ product.description }}
                    </p>
                  </div>
                  <UToggle
                    :model-value="product.isAvailable"
                    @update:model-value="toggleAvailability(product.id, $event)"
                  />
                </div>

                <div class="flex gap-2 flex-wrap">
                  <UBadge
                    v-if="product.isVegetarian"
                    size="xs"
                    color="green"
                  >
                    🌱 Veggie
                  </UBadge>
                  <UBadge
                    v-if="product.isVegan"
                    size="xs"
                    color="green"
                  >
                    🌿 Vegan
                  </UBadge>
                  <UBadge
                    v-if="product.isGlutenFree"
                    size="xs"
                    color="yellow"
                  >
                    Sin gluten
                  </UBadge>
                  <UBadge
                    v-if="product.isLowCarb"
                    size="xs"
                    color="blue"
                  >
                    Low carb
                  </UBadge>
                </div>

                <div class="grid grid-cols-4 gap-2 text-xs text-gray-500">
                  <div>
                    <p class="font-semibold">
                      {{ product.calories }}
                    </p>
                    <p>kcal</p>
                  </div>
                  <div>
                    <p class="font-semibold">
                      {{ product.protein }}g
                    </p>
                    <p>proteína</p>
                  </div>
                  <div>
                    <p class="font-semibold">
                      {{ product.carbs }}g
                    </p>
                    <p>carbs</p>
                  </div>
                  <div>
                    <p class="font-semibold">
                      {{ product.fat }}g
                    </p>
                    <p>grasa</p>
                  </div>
                </div>

                <div class="flex justify-between items-center pt-2">
                  <p class="font-bold">
                    ${{ product.price }}
                  </p>
                  <UButton
                    size="xs"
                    variant="ghost"
                    @click="openEditModal(product)"
                  >
                    Editar
                  </UButton>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </div>

      <!-- Create/Edit Modal -->
      <UModal v-model="isCreateModalOpen">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">
              {{ editingProduct ? 'Editar Producto' : 'Nuevo Producto' }}
            </h3>
          </template>

          <div class="space-y-4">
            <UFormGroup
              label="Nombre"
              required
            >
              <UInput v-model="form.name" />
            </UFormGroup>

            <UFormGroup label="Descripción">
              <UTextarea v-model="form.description" />
            </UFormGroup>

            <UFormGroup
              label="Precio"
              required
            >
              <UInput
                v-model.number="form.price"
                type="number"
                step="0.01"
              />
            </UFormGroup>

            <div class="grid grid-cols-2 gap-4">
              <UFormGroup label="Calorías">
                <UInput
                  v-model.number="form.calories"
                  type="number"
                />
              </UFormGroup>
              <UFormGroup label="Proteína (g)">
                <UInput
                  v-model.number="form.protein"
                  type="number"
                />
              </UFormGroup>
              <UFormGroup label="Carbohidratos (g)">
                <UInput
                  v-model.number="form.carbs"
                  type="number"
                />
              </UFormGroup>
              <UFormGroup label="Grasas (g)">
                <UInput
                  v-model.number="form.fat"
                  type="number"
                />
              </UFormGroup>
            </div>

            <div class="space-y-2">
              <UCheckbox
                v-model="form.isVegetarian"
                label="Vegetariano"
              />
              <UCheckbox
                v-model="form.isVegan"
                label="Vegano"
              />
              <UCheckbox
                v-model="form.isGlutenFree"
                label="Sin gluten"
              />
              <UCheckbox
                v-model="form.isLowCarb"
                label="Low carb"
              />
              <UCheckbox
                v-model="form.isAvailable"
                label="Disponible"
              />
            </div>
          </div>

          <template #footer>
            <div class="flex justify-end gap-2">
              <UButton
                color="gray"
                @click="isCreateModalOpen = false"
              >
                Cancelar
              </UButton>
              <UButton @click="saveProduct">
                Guardar
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>
    </div>
  </UContainer>
</template>
