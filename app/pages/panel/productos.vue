<script setup lang="ts">
interface _Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl?: string
  imagePublicId?: string
  category: string
  isAvailable: boolean
}

definePageMeta({
  layout: 'panel',
  middleware: 'auth'
})

// Load my store first
const { data: storeData } = await useFetch<{ id: string } | null>('/api/stores/my')
const store = storeData.value
if (!store?.id) {
  await navigateTo('/crear-tienda', { replace: true })
}

const storeId = store!.id

// Load products for this store
const { data: productsData, _refresh: refreshProducts } = await useFetch<{ products: _Product[] }>(
  () => `/api/products?storeId=${storeId}&available=false`,
  { default: () => ({ products: [] }) }
)
const products = computed(() => productsData.value?.products ?? [])

// Slideover state
const isSlideoverOpen = ref(false)
const editingProduct = ref<_Product | null>(null)

// _Product form
const productForm = reactive({
  name: '',
  description: '',
  price: null as number | null,
  image: null as File | null,
  imageUrl: null as string | null,
  imagePublicId: null as string | null,
  category: '',
  isAvailable: true
})

const imagePreview = ref<string | null>(null)
const imageFileInput = ref<HTMLInputElement | null>(null)
const isUploading = ref(false)
const isSaving = ref(false)
const productToast = useToast()

const categories = [
  'Comidas',
  'Bebidas',
  'Postres',
  'Snacks',
  'Productos frescos',
  'Productos congelados',
  'Otros'
]

// Table columns
const columns = [
  { key: 'name', label: 'Producto' },
  { key: 'category', label: 'Categoria' },
  { key: 'price', label: 'Precio' },
  { key: 'isAvailable', label: 'Estado' },
  { key: 'actions', label: 'Acciones' }
]

const openAddSlideover = () => {
  editingProduct.value = null
  productForm.name = ''
  productForm.description = ''
  productForm.price = null
  productForm.category = ''
  productForm.isAvailable = true
  productForm.imageUrl = null
  productForm.imagePublicId = null
  imagePreview.value = null
  isSlideoverOpen.value = true
}

const openEditSlideover = (product: _Product) => {
  editingProduct.value = product
  productForm.name = product.name
  productForm.description = product.description ?? ''
  productForm.price = Number(product.price)
  productForm.category = product.category ?? ''
  productForm.isAvailable = product.isAvailable ?? true
  productForm.imageUrl = product.imageUrl || null
  productForm.imagePublicId = product.imagePublicId || null
  productForm.image = null
  imagePreview.value = product.imageUrl || null
  isSlideoverOpen.value = true
}

const triggerFileInput = () => {
  imageFileInput.value?.click()
}

const handleImageSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    productForm.image = file
    const reader = new FileReader()
    reader.onload = (_e) => {
      imagePreview.value = _e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

const uploadImage = async (): Promise<{ url: string, publicId: string } | null> => {
  if (!productForm.image) return null

  isUploading.value = true
  try {
    const formData = new FormData()
    formData.append('image', productForm.image)

    const response = await $fetch('/api/upload/image?folder=products', {
      method: 'POST',
      body: formData
    })

    return { url: response.url, publicId: response.publicId }
  } catch {
    console.error('Error uploading image:', error)
    return null
  } finally {
    isUploading.value = false
  }
}

const saveProduct = async () => {
  if (!productForm.name?.trim()) {
    productToast.add({ title: 'Nombre requerido', color: 'error' })
    return
  }
  if (productForm.price == null || productForm.price <= 0) {
    productToast.add({ title: 'Precio debe ser mayor a 0', color: 'error' })
    return
  }

  isSaving.value = true
  try {
    if (productForm.image) {
      const uploadResult = await uploadImage()
      if (uploadResult) {
        productForm.imageUrl = uploadResult.url
        productForm.imagePublicId = uploadResult.publicId
      }
      productForm.image = null
      if (imageFileInput.value) imageFileInput.value.value = ''
    }

    if (editingProduct.value) {
      await $fetch(`/api/products/${editingProduct.value.id}`, {
        method: 'PATCH',
        body: {
          name: productForm.name,
          description: productForm.description || undefined,
          price: productForm.price,
          category: productForm.category || undefined,
          imageUrl: productForm.imageUrl ?? undefined,
          imagePublicId: productForm.imagePublicId ?? undefined,
          isAvailable: productForm.isAvailable
        }
      })
      productToast.add({ title: 'Producto actualizado', color: 'success' })
    } else {
      await $fetch('/api/products', {
        method: 'POST',
        body: {
          storeId,
          name: productForm.name,
          description: productForm.description || undefined,
          price: productForm.price,
          category: productForm.category || undefined,
          imageUrl: productForm.imageUrl ?? undefined,
          imagePublicId: productForm.imagePublicId ?? undefined
        }
      })
      productToast.add({ title: 'Producto creado', color: 'success' })
    }
    await refreshProducts()
    isSlideoverOpen.value = false
  } catch {
    const error = _e as { data?: { message?: string } }
    productToast.add({ title: 'Error', description: error?.data?.message || 'No se pudo guardar.', color: 'error' })
  } finally {
    isSaving.value = false
  }
}

const deleteProduct = async (productId: string) => {
  if (!confirm('Estas seguro de eliminar este producto?')) return
  try {
    await $fetch(`/api/products/${productId}`, { method: 'DELETE' })
    productToast.add({ title: 'Producto eliminado', color: 'success' })
    await refreshProducts()
  } catch {
    const error = _e as { data?: { message?: string } }
    productToast.add({ title: 'Error', description: error?.data?.message || 'No se pudo eliminar.', color: 'error' })
  }
}

const toggleAvailability = async (product: _Product) => {
  const newValue = !product.isAvailable
  try {
    await $fetch(`/api/products/${product.id}`, {
      method: 'PATCH',
      body: { isAvailable: newValue }
    })
    product.isAvailable = newValue
    productToast.add({ title: newValue ? 'Producto disponible' : 'Producto no disponible', color: 'success' })
  } catch {
    const error = _e as { data?: { message?: string } }
    productToast.add({ title: 'Error', description: error?.data?.message || 'No se pudo actualizar.', color: 'error' })
  } finally {
    await refreshProducts()
  }
}
</script>

<template>
  <UDashboardPanel id="panel-productos">
    <template #header>
      <UDashboardNavbar title="Productos">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UButton
            color="primary"
            icon="i-lucide-plus"
            @click="openAddSlideover"
          >
            Agregar producto
          </UButton>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <UCard class="border-2 border-gray-200 dark:border-gray-800">
        <UTable
          v-if="products.length > 0"
          :columns="columns"
          :rows="products"
        >
          <template #name-data="{ row }">
            <div class="flex items-center gap-3">
              <div class="size-14 rounded-xl overflow-hidden bg-muted flex items-center justify-center shrink-0">
                <img
                  v-if="row.imageUrl"
                  :src="row.imageUrl"
                  :alt="row.name"
                  class="size-full object-cover"
                >
                <UIcon
                  v-else
                  name="i-lucide-package"
                  class="size-7 text-muted"
                />
              </div>
              <div class="min-w-0">
                <p class="font-semibold text-highlighted">
                  {{ row.name }}
                </p>
                <p class="text-sm text-muted line-clamp-1">
                  {{ row.description }}
                </p>
              </div>
            </div>
          </template>

          <template #category-data="{ row }">
            <UBadge
              color="neutral"
              variant="soft"
            >
              {{ row.category }}
            </UBadge>
          </template>

          <template #price-data="{ row }">
            <span class="font-bold text-lg text-emerald-600 dark:text-emerald-400">${{ row.price }}</span>
          </template>

          <template #isAvailable-data="{ row }">
            <USwitch
              :model-value="row.isAvailable"
              @update:model-value="toggleAvailability(row)"
            />
          </template>

          <template #actions-data="{ row }">
            <div class="flex items-center gap-2">
              <UButton
                color="neutral"
                variant="ghost"
                icon="i-lucide-pencil"
                size="sm"
                @click="openEditSlideover(row)"
              />
              <UButton
                color="error"
                variant="ghost"
                icon="i-lucide-trash-2"
                size="sm"
                @click="deleteProduct(row.id)"
              />
            </div>
          </template>
        </UTable>

        <div
          v-else
          class="text-center py-16"
        >
          <div class="size-24 mx-auto rounded-3xl bg-gradient-to-br from-emerald-100 to-teal-100 dark:from-emerald-900 dark:to-teal-900 flex items-center justify-center mb-6">
            <UIcon
              name="i-lucide-package"
              class="size-14 text-emerald-500"
            />
          </div>
          <p class="text-xl font-bold text-highlighted">
            No hay productos agregados
          </p>
          <p class="text-sm text-muted mt-2 mb-6">
            Comienza agregando tu primer producto
          </p>
          <UButton
            color="primary"
            size="xl"
            icon="i-lucide-plus"
            @click="openAddSlideover"
          >
            Agregar producto
          </UButton>
        </div>
      </UCard>

      <!-- Add/Edit _Product Slideover -->
      <USlideover
        v-model:open="isSlideoverOpen"
        :title="editingProduct ? 'Editar producto' : 'Agregar producto'"
        :description="editingProduct ? 'Modifica los datos del producto' : 'Completa los datos del nuevo producto'"
      >
        <template #default>
          <span />
        </template>

        <template #body>
          <div class="space-y-4">
            <UFormField
              label="Nombre del producto"
              required
            >
              <UInput
                v-model="productForm.name"
                placeholder="Ej: Pollo al limón con quinoa"
                icon="i-lucide-package"
              />
            </UFormField>

            <UFormField label="Descripcion">
              <UTextarea
                v-model="productForm.description"
                placeholder="Describe tu producto..."
                :rows="3"
              />
            </UFormField>

            <UFormField
              label="Precio"
              required
            >
              <UInput
                v-model="productForm.price"
                type="number"
                placeholder="450"
                icon="i-lucide-dollar-sign"
              />
            </UFormField>

            <UFormField
              label="Categoria"
              required
            >
              <USelect
                v-model="productForm.category"
                :items="categories"
                placeholder="Selecciona una categoria"
              />
            </UFormField>

            <UFormField label="Imagen del producto">
              <div class="space-y-2">
                <input
                  ref="imageFileInput"
                  type="file"
                  accept="image/*"
                  class="hidden"
                  @change="handleImageSelect"
                >
                <div
                  class="w-full h-40 rounded-lg border-2 border-dashed border-default flex items-center justify-center cursor-pointer hover:border-primary transition-colors"
                  @click="triggerFileInput"
                >
                  <div
                    v-if="!imagePreview"
                    class="text-center"
                  >
                    <UIcon
                      name="i-lucide-image"
                      class="size-10 text-muted mx-auto mb-2"
                    />
                    <p class="text-sm text-muted">
                      Haz clic para subir una imagen
                    </p>
                  </div>
                  <img
                    v-else
                    :src="imagePreview"
                    alt="Preview"
                    class="h-full w-full object-contain rounded-lg"
                  >
                </div>
                <p
                  v-if="isUploading"
                  class="text-sm text-primary"
                >
                  Subiendo imagen...
                </p>
              </div>
            </UFormField>

            <USwitch
              v-model="productForm.isAvailable"
              label="Producto disponible"
            />
          </div>
        </template>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              color="neutral"
              variant="ghost"
              @click="isSlideoverOpen = false"
            >
              Cancelar
            </UButton>
            <UButton
              color="primary"
              icon="i-lucide-save"
              :loading="isSaving"
              @click="saveProduct"
            >
              {{ editingProduct ? 'Actualizar' : 'Guardar' }}
            </UButton>
          </div>
        </template>
      </USlideover>
    </template>
  </UDashboardPanel>
</template>
