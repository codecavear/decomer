# E2E Tests - Vegy

## Tests Created (COD-VEGY-118)

- `home.test.ts` - Homepage rendering and SEO
- `navigation.test.ts` - All main pages accessibility  
- `carrito.test.ts` - Shopping cart page
- `buscar.test.ts` - Search functionality

## Running Tests

```bash
# Unit tests (fast, no server needed)
bun run test:unit

# Component/Page tests (Nuxt environment)
bun run test:nuxt

# E2E tests (requires server + DB)
bun run test:e2e
```

## ⚠️ Known Issues

### Database Connection
The `.env` file points to Railway internal database which is not accessible locally.

**To run E2E tests locally:**

1. Create `.env.test` with local/mock database:
   ```
   DATABASE_URL=postgresql://localhost:5432/vegy_test
   ```

2. Or use SQLite for tests:
   ```
   DATABASE_URL=file:./test.db
   ```

3. Run with test env:
   ```bash
   NODE_ENV=test bun run test:e2e
   ```

### Alternative: Mock DB in Tests
Configure `@nuxt/test-utils` to mock database calls or use `vi.mock()` for drizzle.

## Test Structure

```
tests/
├── components/    # Vue component tests (Nuxt env)
├── e2e/           # End-to-end tests (server required)
├── pages/         # Page integration tests
└── unit/          # Pure unit tests (no Nuxt)
```

## TODO

- [ ] Setup test database configuration
- [ ] Add API endpoint tests (when cart API exists)
- [ ] Add Playwright browser tests for visual testing
- [ ] Add authentication flow tests

---
*Created: 2026-02-12*
*Ticket: COD-VEGY-118*
