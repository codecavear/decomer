import { describe, test, expect } from 'vitest'
import { setup, $fetch } from '@nuxt/test-utils/e2e'

/**
 * E2E Tests - Home Page
 * COD-VEGY-118: Basic E2E tests for DeComer
 */

describe('Home Page E2E', async () => {
  await setup({
    server: true
  })

  test('homepage renders successfully', async () => {
    const html = await $fetch('/')

    expect(html).toBeTruthy()
    expect(typeof html).toBe('string')
    expect(html).toContain('<!DOCTYPE html>')
  })

  test('homepage contains expected elements', async () => {
    const html = await $fetch('/')

    // Should have DeComer branding/content
    expect(html.toLowerCase()).toMatch(/decomer|tienda|vegetariano|vegano/i)
  })

  test('homepage has meta tags for SEO', async () => {
    const html = await $fetch('/')

    // Basic meta tags should be present
    expect(html).toContain('<meta')
    expect(html).toContain('<title')
  })
})
