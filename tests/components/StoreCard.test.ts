import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import StoreCard from '~/components/store/StoreCard.vue'

const mockStore = {
  id: 'test-store-1',
  name: 'Green Garden',
  slug: 'green-garden',
  description: 'Test store description',
  status: 'active' as const,
  logoUrl: null,
  ownerId: 'user-1',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  primary_category: 'Almacén Vegano',
  rating: 4.5,
  review_count: 23,
  locations: [
    { city: 'Córdoba', address: 'Av. Colón 1234' }
  ]
}

describe('StoreCard', () => {
  it('should render the store name', async () => {
    const wrapper = await mountSuspended(StoreCard, {
      props: { store: mockStore }
    })
    expect(wrapper.text()).toContain('Green Garden')
  })

  it('should display the category badge', async () => {
    const wrapper = await mountSuspended(StoreCard, {
      props: { store: mockStore }
    })
    expect(wrapper.text()).toContain('Almacén Vegano')
  })

  it('should show the rating', async () => {
    const wrapper = await mountSuspended(StoreCard, {
      props: { store: mockStore }
    })
    expect(wrapper.text()).toContain('4.5')
  })

  it('should show the location city', async () => {
    const wrapper = await mountSuspended(StoreCard, {
      props: { store: mockStore }
    })
    expect(wrapper.text()).toContain('Córdoba')
  })

  it('should have a link to the store page', async () => {
    const wrapper = await mountSuspended(StoreCard, {
      props: { store: mockStore }
    })
    const html = wrapper.html()
    expect(html).toContain('/green-garden')
  })

  it('should render without logo', async () => {
    const wrapper = await mountSuspended(StoreCard, {
      props: { store: { ...mockStore, logoUrl: null } }
    })
    // Should still render the card without crashing
    expect(wrapper.exists()).toBe(true)
    expect(wrapper.text()).toContain('Green Garden')
  })

  it('should format distance in meters when < 1km', async () => {
    const wrapper = await mountSuspended(StoreCard, {
      props: { store: { ...mockStore, distance: 0.5 } }
    })
    expect(wrapper.text()).toContain('500m')
  })

  it('should format distance in km when >= 1km', async () => {
    const wrapper = await mountSuspended(StoreCard, {
      props: { store: { ...mockStore, distance: 2.3 } }
    })
    expect(wrapper.text()).toContain('2.3km')
  })
})
