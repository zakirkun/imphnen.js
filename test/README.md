# Tests

This directory contains tests for the imphnen.js framework.

## Test Structure

- `unit/` - Unit tests for individual components
- `integration/` - Integration tests for middleware and routing
- `performance/` - Performance and load tests

## Running Tests

### Using Bun (Recommended)
```bash
# Run all tests
bun test

# Run specific test file
bun test test/unit/basic.test.ts

# Run with watch mode
bun test --watch
```

### Using Other Test Runners

You can also use popular testing frameworks:

- **Jest**: `npm test`
- **Vitest**: `vitest`
- **Node.js built-in**: `node --test`

## Test Examples

### Unit Test Example
```typescript
import { createApp } from 'imphnen.js';

const app = createApp();
app.get('/test', (ctx) => ctx.json({ success: true }));
```

### Integration Test Example
```typescript
import { createApp } from 'imphnen.js';
import type { Middleware } from 'imphnen.js';

const authMiddleware: Middleware = async (ctx, next) => {
  // auth logic
  return await next();
};
```

### Performance Test Example
```typescript
const app = createApp({ development: false });
// Configure endpoints for load testing
```

## Performance Testing

For load testing, use tools like:
- **wrk**: `wrk -t12 -c400 -d30s http://localhost:4000/ping`
- **hey**: `hey -n 10000 -c 100 http://localhost:4000/ping`
- **autocannon**: `autocannon -c 100 -d 30 http://localhost:4000/ping`

## Test Best Practices

1. Keep unit tests focused on single functions/components
2. Use integration tests for middleware chains and route combinations
3. Performance tests should run with `development: false`
4. Mock external dependencies in unit tests
5. Test both success and error scenarios 