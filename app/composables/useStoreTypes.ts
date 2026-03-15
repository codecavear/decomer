import type { StoreType } from '~/types'

export const storeTypes = [
  {
    value: 'catalog' as StoreType,
    label: 'Solo Catálogo',
    icon: 'i-lucide-book-open',
    color: 'neutral' as const,
    description: 'Solo muestra productos'
  },
  {
    value: 'pickup' as StoreType,
    label: 'Retiro en Tienda',
    icon: 'i-lucide-store',
    color: 'info' as const,
    description: 'Retiro en el local'
  },
  {
    value: 'delivery' as StoreType,
    label: 'Delivery',
    icon: 'i-lucide-truck',
    color: 'success' as const,
    description: 'Envío a domicilio'
  },
  {
    value: 'pickup_delivery' as StoreType,
    label: 'Retiro y Delivery',
    icon: 'i-lucide-package',
    color: 'primary' as const,
    description: 'Retiro y envío disponibles'
  }
] as const

export function useStoreTypes() {
  const getStoreType = (type: StoreType) => {
    return storeTypes.find(t => t.value === type) || storeTypes[0]
  }

  const getStoreTypeLabel = (type: StoreType) => {
    return getStoreType(type).label
  }

  const getStoreTypeIcon = (type: StoreType) => {
    return getStoreType(type).icon
  }

  const getStoreTypeColor = (type: StoreType) => {
    return getStoreType(type).color
  }

  return {
    storeTypes,
    getStoreType,
    getStoreTypeLabel,
    getStoreTypeIcon,
    getStoreTypeColor
  }
}
