import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

export default defineConfig({
  test: {
    projects: [
      // Unit tests - pure logic, no Nuxt runtime
      {
        test: {
          name: 'unit',
          include: ['tests/unit/**/*.{test,spec}.ts'],
          environment: 'node'
        }
      },
      // E2E tests
      {
        test: {
          name: 'e2e',
          include: ['tests/e2e/**/*.{test,spec}.ts'],
          environment: 'node'
        }
      },
      // Nuxt runtime tests - components, pages, composables
      await defineVitestProject({
        test: {
          name: 'nuxt',
          include: ['tests/{components,pages,composables}/**/*.{test,spec}.ts'],
          environment: 'nuxt',
          environmentOptions: {
            nuxt: {
              domEnvironment: 'happy-dom',
              mock: {
                intersectionObserver: true,
                indexedDb: true
              }
            }
          }
        }
      })
    ]
  }
})
