<script setup lang="ts">
import type { ProductWithStoreAssignments, StoreWithRelations } from '~/types'

definePageMeta({
  layout: 'panel',
  middleware: 'auth'
})

const {
  products,
  limits,
  isLoading,
  canAddProduct,
  productCount,
  productLimit,
  fetchCatalog,
  createProduct,
  updateProduct,
  deleteProduct,
  assignToStores,
  removeFromStore,
  toggleAvailability
} = useCatalog()

// Fetch user's stores
const { data: myStores } = await useFetch<StoreWithRelations[]>('/api/stores/my')

// Modal states
const isProductModalOpen = ref(false)
const isStoreModalOpen = ref(false)
const editingProduct = ref<ProductWithStoreAssignments | null>(null)
const assigningProduct = ref<ProductWithStoreAssignments | null>(null)

// Product form
const productForm = reactive({
  name: '',
  description: '',
  price: '',
  imageUrl: '',
  category: ''
})

const categories = [
  'Comidas',
  'Bebidas',
  'Postres',
  'Snacks',
  'Productos frescos',
  'Productos congelados',
  'Otros'
]

// Store assignment form
const selectedStoreIds = ref<string[]>([])

// Table columns
const columns = [
  { key: 'name', label: 'Producto' },
  { key: 'category', label: 'Categoría' },
  { key: 'price', label: 'Precio' },
  { key: 'stores', label: 'Tiendas' },
  { key: 'actions', label: 'Acciones' }
]

// Fetch catalog on mount
onMounted(() => {
  fetchCatalog()
})

const openAddModal = () => {
  if (!canAddProduct.value) {
    return
  }
  editingProduct.value = null
  productForm.name = ''
  productForm.description = ''
  productForm.price = ''
  productForm.imageUrl = ''
  productForm.category = ''
  isProductModalOpen.value = true
}

const openEditModal = (product: ProductWithStoreAssignments) => {
  editingProduct.value = product
  productForm.name = product.name
  productForm.description = product.description || ''
  productForm.price = product.price
  productForm.imageUrl = product.imageUrl || ''
  productForm.category = product.category || ''
  isProductModalOpen.value = true
}

const saveProduct = async () => {
  const data = {
    name: productForm.name,
    description: productForm.description || undefined,
    price: productForm.price,
    imageUrl: productForm.imageUrl || undefined,
    category: productForm.category || undefined
  }

  if (editingProduct.value) {
    await updateProduct(editingProduct.value.id, data)
  } else {
    await createProduct(data)
  }

  isProductModalOpen.value = false
}

const confirmDelete = async (product: ProductWithStoreAssignments) => {
  if (confirm(`¿Estás seguro de eliminar "${product.name}"? Esta acción no se puede deshacer.`)) {
    await deleteProduct(product.id)
  }
}

const openStoreModal = (product: ProductWithStoreAssignments) => {
  assigningProduct.value = product
  selectedStoreIds.value = product.storeAssignments?.map(a => a.storeId) || []
  isStoreModalOpen.value = true
}

const saveStoreAssignments = async () => {
  if (!assigningProduct.value) return

  const currentStoreIds = assigningProduct.value.storeAssignments?.map(a => a.storeId) || []
  const newStoreIds = selectedStoreIds.value.filter(id => !currentStoreIds.includes(id))
  const removedStoreIds = currentStoreIds.filter(id => !selectedStoreIds.value.includes(id))

  // Add new assignments
  if (newStoreIds.length > 0) {
    await assignToStores(assigningProduct.value.id, newStoreIds)
  }

  // Remove old assignments
  for (const storeId of removedStoreIds) {
    await removeFromStore(assigningProduct.value.id, storeId)
  }

  isStoreModalOpen.value = false
}

const handleToggleAvailability = async (productId: string, storeId: string, currentValue: boolean) => {
  await toggleAvailability(productId, storeId, !currentValue)
}

const getStoreName = (storeId: string) => {
  return myStores.value?.find(s => s.id === storeId)?.name || 'Tienda'
}

const getAssignedStoresCount = (product: ProductWithStoreAssignments) => {
  return product.storeAssignments?.length || 0
}

const getAvailableStoresCount = (product: ProductWithStoreAssignments) => {
  return product.storeAssignments?.filter(a => a.isAvailable).length || 0
}
</script>

<template>
  <div class="p-6 space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold">
          Mi Catálogo
        </h1>
        <p class="text-muted mt-1">
          Gestiona tus productos y asígnalos a tus tiendas
        </p>
      </div>
      <div class="flex items-center gap-4">
        <!-- Limit indicator -->
        <div
          v-if="limits"
          class="text-right"
        >
          <p class="text-sm text-muted">
            {{ productCount }} / {{ productLimit }} productos
          </p>
          <UProgress
            :model-value="(productCount / productLimit) * 100"
            :color="canAddProduct ? 'primary' : 'error'"
            class="w-32 h-2"
          />
        </div>
        <UButton
          color="primary"
          icon="i-lucide-plus"
          :disabled="!canAddProduct"
          @click="openAddModal"
        >
          Agregar producto
        </UButton>
      </div>
    </div>

    <!-- No stores warning -->
    <UAlert
      v-if="myStores && myStores.length === 0"
      color="warning"
      icon="i-lucide-store"
      title="No tienes tiendas"
      description="Crea una tienda para poder asignar productos y venderlos."
    >
      <template #actions>
        <UButton
          to="/crear-tienda"
          color="warning"
          variant="soft"
          size="sm"
        >
          Crear tienda
        </UButton>
      </template>
    </UAlert>

    <!-- Loading state -->
    <div
      v-if="isLoading"
      class="flex items-center justify-center py-12"
    >
      <UIcon
        name="i-lucide-loader-2"
        class="size-8 animate-spin text-muted"
      />
    </div>

    <!-- Products table -->
    <UCard v-else>
      <UTable
        v-if="products.length > 0"
        :columns="columns"
        :rows="products"
      >
        <template #name-data="{ row }">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden">
              <img
                v-if="row.imageUrl"
                :src="row.imageUrl"
                :alt="row.name"
                class="w-full h-full object-cover"
              >
              <UIcon
                v-else
                name="i-lucide-package"
                class="size-6 text-muted"
              />
            </div>
            <div>
              <p class="font-medium">
                {{ row.name }}
              </p>
              <p
                v-if="row.description"
                class="text-sm text-muted line-clamp-1"
              >
                {{ row.description }}
              </p>
            </div>
          </div>
        </template>

        <template #category-data="{ row }">
          <UBadge
            v-if="row.category"
            color="neutral"
            variant="soft"
          >
            {{ row.category }}
          </UBadge>
          <span
            v-else
            class="text-muted"
          >-</span>
        </template>

        <template #price-data="{ row }">
          <span class="font-medium">${{ row.price }}</span>
        </template>

        <template #stores-data="{ row }">
          <div class="flex items-center gap-2">
            <UButton
              color="neutral"
              variant="soft"
              size="xs"
              @click="openStoreModal(row)"
            >
              <UIcon
                name="i-lucide-store"
                class="size-4 mr-1"
              />
              {{ getAvailableStoresCount(row) }}/{{ getAssignedStoresCount(row) }}
            </UButton>
            <!-- Show store availability badges -->
            <div
              v-if="row.storeAssignments?.length"
              class="flex gap-1"
            >
              <UTooltip
                v-for="assignment in row.storeAssignments.slice(0, 3)"
                :key="assignment.storeId"
                :text="`${getStoreName(assignment.storeId)}: ${assignment.isAvailable ? 'Disponible' : 'No disponible'}`"
              >
                <div
                  class="w-2 h-2 rounded-full"
                  :class="assignment.isAvailable ? 'bg-success' : 'bg-muted'"
                />
              </UTooltip>
              <span
                v-if="row.storeAssignments.length > 3"
                class="text-xs text-muted"
              >
                +{{ row.storeAssignments.length - 3 }}
              </span>
            </div>
          </div>
        </template>

        <template #actions-data="{ row }">
          <div class="flex items-center gap-2">
            <UButton
              color="neutral"
              variant="ghost"
              icon="i-lucide-pencil"
              size="sm"
              @click="openEditModal(row)"
            />
            <UButton
              color="error"
              variant="ghost"
              icon="i-lucide-trash-2"
              size="sm"
              @click="confirmDelete(row)"
            />
          </div>
        </template>
      </UTable>

      <div
        v-else
        class="text-center py-12"
      >
        <UIcon
          name="i-lucide-package"
          class="size-12 text-muted mx-auto mb-3"
        />
        <p class="text-muted">
          No hay productos en tu catálogo
        </p>
        <p class="text-sm text-muted mt-1">
          Comienza agregando tu primer producto
        </p>
        <UButton
          color="primary"
          icon="i-lucide-plus"
          class="mt-4"
          :disabled="!canAddProduct"
          @click="openAddModal"
        >
          Agregar producto
        </UButton>
      </div>
    </UCard>

    <!-- Add/Edit Product Modal -->
    <UModal v-model:open="isProductModalOpen">
      <template #header>
        <h3 class="text-lg font-semibold">
          {{ editingProduct ? 'Editar producto' : 'Agregar producto' }}
        </h3>
      </template>

      <div class="space-y-4 p-4">
        <UFormField
          label="Nombre del producto"
          required
        >
          <UInput
            v-model="productForm.name"
            placeholder="Ej: Hamburguesa vegana"
            icon="i-lucide-package"
          />
        </UFormField>

        <UFormField label="Descripción">
          <UTextarea
            v-model="productForm.description"
            placeholder="Describe tu producto..."
            :rows="3"
          />
        </UFormField>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <UFormField
            label="Precio"
            required
          >
            <UInput
              v-model="productForm.price"
              type="number"
              step="0.01"
              placeholder="450.00"
              icon="i-lucide-dollar-sign"
            />
          </UFormField>

          <UFormField label="Categoría">
            <USelect
              v-model="productForm.category"
              :options="categories"
              placeholder="Selecciona una categoría"
            />
          </UFormField>
        </div>

        <UFormField label="URL de imagen">
          <UInput
            v-model="productForm.imageUrl"
            placeholder="https://..."
            icon="i-lucide-image"
          />
        </UFormField>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            @click="isProductModalOpen = false"
          >
            Cancelar
          </UButton>
          <UButton
            color="primary"
            icon="i-lucide-save"
            :disabled="!productForm.name || !productForm.price"
            @click="saveProduct"
          >
            {{ editingProduct ? 'Actualizar' : 'Guardar' }}
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Store Assignment Modal -->
    <UModal v-model:open="isStoreModalOpen">
      <template #header>
        <h3 class="text-lg font-semibold">
          Asignar a tiendas
        </h3>
        <p class="text-sm text-muted mt-1">
          {{ assigningProduct?.name }}
        </p>
      </template>

      <div class="p-4 space-y-4">
        <p
          v-if="!myStores?.length"
          class="text-muted text-center py-4"
        >
          No tienes tiendas para asignar este producto.
        </p>

        <div
          v-else
          class="space-y-3"
        >
          <div
            v-for="store in myStores"
            :key="store.id"
            class="flex items-center justify-between p-3 rounded-lg border border-default"
          >
            <div class="flex items-center gap-3">
              <UCheckbox
                :model-value="selectedStoreIds.includes(store.id)"
                @update:model-value="(val: boolean) => {
                  if (val) {
                    selectedStoreIds.push(store.id)
                  }
                  else {
                    selectedStoreIds = selectedStoreIds.filter(id => id !== store.id)
                  }
                }"
              />
              <div class="flex items-center gap-2">
                <UAvatar
                  v-if="store.logoUrl"
                  :src="store.logoUrl"
                  :alt="store.name"
                  size="sm"
                />
                <UIcon
                  v-else
                  name="i-lucide-store"
                  class="size-5 text-muted"
                />
                <span class="font-medium">{{ store.name }}</span>
              </div>
            </div>

            <!-- Availability toggle for assigned stores -->
            <div
              v-if="assigningProduct?.storeAssignments?.find(a => a.storeId === store.id)"
              class="flex items-center gap-2"
            >
              <span class="text-sm text-muted">Disponible</span>
              <UToggle
                :model-value="assigningProduct?.storeAssignments?.find(a => a.storeId === store.id)?.isAvailable ?? false"
                @update:model-value="handleToggleAvailability(assigningProduct!.id, store.id, assigningProduct?.storeAssignments?.find(a => a.storeId === store.id)?.isAvailable ?? false)"
              />
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            @click="isStoreModalOpen = false"
          >
            Cerrar
          </UButton>
          <UButton
            color="primary"
            @click="saveStoreAssignments"
          >
            Guardar cambios
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
