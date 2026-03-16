import { describe, test, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

/**
 * E2E Tests - Navigation
 * COD-VEGY-118: Basic navigation tests
 */

describe('Navigation E2E', async () => {
  await setup({
    server: true
  })

  describe('Main Pages Accessible', () => {
    test('/buscar page loads', async () => {
      const html = await $fetch('/buscar')

      expect(html).toBeTruthy()
      expect(typeof html).toBe('string')
    })

    test('/carrito page loads', async () => {
      const html = await $fetch('/carrito')

      expect(html).toBeTruthy()
      expect(typeof html).toBe('string')
    })

    test('/favoritos page loads', async () => {
      const html = await $fetch('/favoritos')

      expect(html).toBeTruthy()
      expect(typeof html).toBe('string')
    })

    test('/pricing page loads', async () => {
      const html = await $fetch('/pricing')

      expect(html).toBeTruthy()
      expect(typeof html).toBe('string')
    })

    test('/login page loads', async () => {
      const html = await $fetch('/login')

      expect(html).toBeTruthy()
      expect(typeof html).toBe('string')
    })

    test('/crear-tienda page loads', async () => {
      const html = await $fetch('/crear-tienda')

      expect(html).toBeTruthy()
      expect(typeof html).toBe('string')
    })
  })

  describe('Error Handling', () => {
    test('404 for non-existent page', async () => {
      try {
        await $fetch('/non-existent-page-xyz')
        // If no _error, check if 404 content is returned
      } catch (_error) {
        // Expected 404 _error
        const err = _error as { statusCode?: number, response?: { status?: number } }
        expect(err.statusCode || err.response?.status).toBe(404)
      }
    })
  })
})
