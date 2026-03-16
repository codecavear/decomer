// Shared types for frontend components
// These mirror the database schema types but are usable in frontend code

// Enums
export const userRoles = ['user', 'store_owner', 'admin'] as const
export type UserRole = typeof userRoles[number]

export const storeStatuses = ['pending', 'active', 'suspended'] as const
export type StoreStatus = typeof storeStatuses[number]

export const storeTypes = ['catalog', 'pickup', 'delivery', 'pickup_delivery'] as const
export type StoreType = typeof storeTypes[number]

export const contactTypes = ['phone', 'whatsapp', 'email', 'instagram', 'facebook', 'twitter', 'website'] as const
export type ContactType = typeof contactTypes[number]

export const orderStatuses = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'] as const
export type OrderStatus = typeof orderStatuses[number]

export const deliveryTypes = ['pickup', 'delivery'] as const
export type DeliveryType = typeof deliveryTypes[number]

// User types
export interface User {
  id: string
  googleId: string
  email: string
  name: string
  avatarUrl: string | null
  role: UserRole
  createdAt: Date | string
  updatedAt: Date | string
}

// Store types
export interface Store {
  id: string
  ownerId: string
  name: string
  slug: string
  description: string | null
  logoUrl: string | null
  bannerUrl: string | null
  status: StoreStatus
  type: StoreType
  createdAt: Date | string
  updatedAt: Date | string
}

export interface _StoreLocation {
  id: string
  storeId: string
  address: string
  city: string
  country: string
  latitude: string
  longitude: string
  neighborhood: string | null
  apartment: string | null
  isPrimary: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export interface StoreSchedule {
  id: string
  storeId: string
  dayOfWeek: number
  openTime: string | null
  closeTime: string | null
  isClosed: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export interface StoreContact {
  id: string
  storeId: string
  type: ContactType
  value: string
  isPrimary: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export interface StoreWithRelations extends Store {
  locations?: _StoreLocation[]
  schedules?: StoreSchedule[]
  contacts?: StoreContact[]
  owner?: User
}

// Category types
export interface Category {
  id: string
  name: string
  slug: string
  icon: string | null
  parentId: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

// _Product types
export interface _Product {
  id: string
  storeId: string
  name: string
  description: string | null
  price: string
  imageUrl: string | null
  isAvailable: boolean
  category: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface StoreProduct {
  productId: string
  storeId: string
  isAvailable: boolean
  displayOrder: number
  createdAt: Date | string
  updatedAt: Date | string
  store?: {
    id: string
    name: string
    slug: string
  }
}

export interface ProductWithStoreAssignments extends _Product {
  storeAssignments?: StoreProduct[]
}

export interface CatalogLimits {
  plan: string
  products: {
    current: number
    limit: number
    remaining: number
  }
  canAddProduct: boolean
  message: string
}

export interface ProductWithStore extends _Product {
  store?: Store
}

// Review types
export interface Review {
  id: string
  userId: string
  storeId: string
  rating: number
  comment: string | null
  isVerified: boolean
  createdAt: Date | string
  updatedAt: Date | string
}

export interface ReviewWithUser extends Review {
  user?: User
}

// Favorite types
export interface Favorite {
  id: string
  userId: string
  storeId: string
  createdAt: Date | string
}

export interface FavoriteWithStore extends Favorite {
  store?: StoreWithRelations
}

// Order types
export interface DeliveryAddress {
  address: string
  city: string
  neighborhood?: string
  apartment?: string
  instructions?: string
}

export interface Order {
  id: string
  userId: string
  storeId: string
  status: OrderStatus
  totalAmount: string
  deliveryType: DeliveryType
  deliveryAddress: DeliveryAddress | null
  notes: string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface OrderItem {
  id: string
  orderId: string
  productId: string
  quantity: number
  unitPrice: string
  notes: string | null
  createdAt: Date | string
}

export interface OrderItemWithProduct extends OrderItem {
  product?: _Product
}

export interface OrderWithRelations extends Order {
  store?: Store
  items?: OrderItemWithProduct[]
  user?: User
}

// Cart types (frontend only)
export interface CartItem {
  product: _Product
  store: Store
  quantity: number
}

export interface CartStore {
  store: Store
  items: CartItem[]
  subtotal: number
}

// API Response types
export interface StoreListResponse {
  stores: StoreWithRelations[]
  total?: number
  limit: number
  offset: number
}

export interface ReviewStats {
  averageRating: number
  totalReviews: number
  distribution: Record<number, number>
}

// Status badge colors
export const orderStatusColors: Record<OrderStatus, string> = {
  pending: 'warning',
  confirmed: 'info',
  preparing: 'info',
  ready: 'success',
  delivered: 'success',
  cancelled: '_error'
}

// Status labels (Spanish)
export const orderStatusLabels: Record<OrderStatus, string> = {
  pending: 'Pendiente',
  confirmed: 'Confirmado',
  preparing: 'Preparando',
  ready: 'Listo',
  delivered: 'Entregado',
  cancelled: 'Cancelado'
}

// Subscription types
export const subscriptionPlans = ['free', 'pro', 'business'] as const
export type SubscriptionPlanSlug = typeof subscriptionPlans[number]

export const subscriptionStatuses = ['active', 'cancelled', 'past_due', 'trialing'] as const
export type SubscriptionStatus = typeof subscriptionStatuses[number]

export const billingCycles = ['monthly', 'yearly'] as const
export type BillingCycle = typeof billingCycles[number]

export interface SubscriptionPlan {
  id: string
  name: string
  slug: SubscriptionPlanSlug
  description: string | null
  priceMonthly: string
  priceYearly: string
  maxProducts: number
  maxLocations: number
  maxImagesPerProduct: number
  featuresEnabled: string[] | null
  isActive: boolean
  displayOrder: number
  createdAt: Date | string
  updatedAt: Date | string
}

export interface StoreSubscription {
  id: string
  storeId: string
  planId: string
  status: SubscriptionStatus
  billingCycle: BillingCycle
  currentPeriodStart: Date | string
  currentPeriodEnd: Date | string
  cancelAtPeriodEnd: boolean
  externalId: string | null
  externalCustomerId: string | null
  trialStart: Date | string | null
  trialEnd: Date | string | null
  createdAt: Date | string
  updatedAt: Date | string
}

export interface StoreSubscriptionWithPlan extends StoreSubscription {
  plan?: SubscriptionPlan
}

export interface StoreWithSubscription extends StoreWithRelations {
  subscription?: StoreSubscriptionWithPlan
}

// Plan feature constants
export const PLAN_LIMITS = {
  free: {
    maxProducts: 100,
    maxLocations: 1,
    maxImagesPerProduct: 1,
    features: ['basic_analytics']
  },
  pro: {
    maxProducts: 1000,
    maxLocations: 3,
    maxImagesPerProduct: 5,
    features: ['basic_analytics', 'advanced_analytics', 'priority_support', 'custom_hours']
  },
  business: {
    maxProducts: -1, // unlimited
    maxLocations: -1, // unlimited
    maxImagesPerProduct: 10,
    features: ['basic_analytics', 'advanced_analytics', 'priority_support', 'custom_hours', 'api_access', 'white_label']
  }
} as const

// Plan display info
export const PLAN_INFO: Record<SubscriptionPlanSlug, { name: string, description: string }> = {
  free: {
    name: 'Gratis',
    description: 'Para empezar tu tienda vegana'
  },
  pro: {
    name: 'Pro',
    description: 'Para tiendas en crecimiento'
  },
  business: {
    name: 'Business',
    description: 'Para tiendas grandes o cadenas'
  }
}
