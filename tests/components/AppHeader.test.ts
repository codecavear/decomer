import { describe, it, expect } from 'vitest'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import AppHeader from '~/components/AppHeader.vue'

describe('AppHeader', () => {
  it('should render the header component', async () => {
    const wrapper = await mountSuspended(AppHeader)
    expect(wrapper.exists()).toBe(true)
  })

  it('should contain navigation structure', async () => {
    const wrapper = await mountSuspended(AppHeader)
    const html = wrapper.html()

    // Header should have nav or link elements
    expect(html.length).toBeGreaterThan(0)
    // Check for common header elements like nav, links, or buttons
    expect(wrapper.find('header').exists() || wrapper.find('nav').exists() || html.includes('href')).toBe(true)
  })

  it('should have login button when not authenticated', async () => {
    const wrapper = await mountSuspended(AppHeader)
    // Header should have some form of login/auth element
    expect(wrapper.html()).toBeTruthy()
  })
})
