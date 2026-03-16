<script setup lang="ts">
import type { _Product, Store } from '~/types'

interface ProductCardProps {
  product: _Product
  store: Pick<Store, 'id' | 'name' | 'slug' | 'logoUrl'>
}

const props = defineProps<ProductCardProps>()

const { addToCart: addToCartComposable } = useCart()
const toast = useToast()

const quantity = ref(1)
const adding = ref(false)

const addToCart = async () => {
  adding.value = true
  try {
    addToCartComposable(props.product, quantity.value, props.store)
    toast.add({
      title: 'Producto agregado',
      description: `${props.product.name} se agregó al carrito`,
      color: 'success'
    })
    quantity.value = 1
  } catch {
    toast.add({
      title: 'Error',
      description: 'No se pudo agregar el producto al carrito',
      color: 'error'
    })
  } finally {
    adding.value = false
  }
}

const decrementQuantity = () => {
  if (quantity.value > 1) quantity.value--
}

const incrementQuantity = () => {
  quantity.value++
}
</script>

<template>
  <UCard
    variant="outline"
    class="h-full flex flex-col"
  >
    <div class="flex flex-col gap-4 flex-1">
      <div class="relative aspect-square rounded-lg overflow-hidden bg-elevated">
        <img
          v-if="product.imageUrl"
          :src="product.imageUrl"
          :alt="product.name"
          class="w-full h-full object-cover"
        >
        <div
          v-else
          class="w-full h-full flex items-center justify-center"
        >
          <UIcon
            name="i-lucide-image"
            class="size-12 text-muted"
          />
        </div>

        <UBadge
          v-if="!product.isAvailable"
          class="absolute top-2 right-2"
          color="error"
          variant="soft"
          label="No disponible"
        />
      </div>

      <div class="flex flex-col gap-2 flex-1">
        <h3 class="font-semibold text-lg line-clamp-2">
          {{ product.name }}
        </h3>

        <p
          v-if="product.description"
          class="text-sm text-muted line-clamp-2"
        >
          {{ product.description }}
        </p>

        <div class="flex items-center justify-between mt-auto pt-2">
          <span class="text-2xl font-bold text-primary">
            ${{ parseFloat(product.price).toFixed(2) }}
          </span>
        </div>
      </div>

      <div
        v-if="product.isAvailable"
        class="flex items-center gap-2 pt-2 border-t"
      >
        <div class="flex items-center gap-1 border rounded-lg">
          <UButton
            icon="i-lucide-minus"
            color="neutral"
            variant="ghost"
            size="sm"
            :disabled="quantity <= 1"
            @click="decrementQuantity"
          />
          <span class="px-3 py-1 text-sm font-medium min-w-[2rem] text-center">
            {{ quantity }}
          </span>
          <UButton
            icon="i-lucide-plus"
            color="neutral"
            variant="ghost"
            size="sm"
            @click="incrementQuantity"
          />
        </div>

        <UButton
          icon="i-lucide-shopping-cart"
          color="primary"
          class="flex-1"
          :loading="adding"
          @click="addToCart"
        >
          Agregar
        </UButton>
      </div>
    </div>
  </UCard>
</template>
