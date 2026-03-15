import { describe, it, expect } from 'vitest'

describe('Basic utility tests', () => {
  it('should perform basic math', () => {
    expect(1 + 1).toBe(2)
  })

  it('should handle string operations', () => {
    const slug = 'tienda-vegana-123'
    expect(slug).toContain('vegana')
    expect(slug.split('-')).toHaveLength(3)
  })

  it('should validate price formatting', () => {
    const price = 1999.99
    const formatted = new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS'
    }).format(price)
    expect(formatted).toContain('1.999,99')
  })
})

describe('Store data validation', () => {
  interface Store {
    id: string
    name: string
    slug: string
    status: 'pending' | 'active' | 'suspended'
  }

  it('should validate store object structure', () => {
    const store: Store = {
      id: 'abc-123',
      name: 'Tienda Vegana',
      slug: 'tienda-vegana',
      status: 'active'
    }

    expect(store.id).toBeDefined()
    expect(store.name.length).toBeGreaterThan(0)
    expect(store.slug).not.toContain(' ')
    expect(['pending', 'active', 'suspended']).toContain(store.status)
  })

  it('should generate valid slugs', () => {
    const generateSlug = (name: string) =>
      name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')

    expect(generateSlug('Tienda Vegana')).toBe('tienda-vegana')
    expect(generateSlug('Café Orgánico')).toBe('cafe-organico')
    expect(generateSlug('Green & Fresh!')).toBe('green-fresh')
  })
})
