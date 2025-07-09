// Basic unit tests for imphnen.js framework

import { createApp } from '../../src/index.js';
import type { Context } from '../../src/index.js';

// Test helper function
async function makeRequest(app: any, method: string, path: string, body?: any) {
  const request = new Request(`http://localhost:3000${path}`, {
    method,
    body: body ? JSON.stringify(body) : undefined,
    headers: body ? { 'Content-Type': 'application/json' } : {}
  });
  
  // Mock app.fetch if needed - this is a simplified test setup
  return await app.fetch(request);
}

// Basic route tests
console.log('Testing basic routes...');

const app = createApp();

app.get('/test', (ctx: Context) => {
  return ctx.json({ message: 'test' });
});

app.get('/users/:id', (ctx: Context<{ id: string }>) => {
  return ctx.json({ id: ctx.params.id });
});

app.post('/echo', (ctx: Context) => {
  return ctx.json({ received: ctx.body });
});

// Note: These are simplified tests for demonstration
// In a real project, use a proper testing framework like Jest, Vitest, or Bun's built-in test runner

console.log('✅ Basic test setup complete');
console.log('💡 To run proper tests, consider using:');
console.log('   - Bun test runner: bun test');
console.log('   - Jest: npm test');
console.log('   - Vitest: vitest');

export { app }; 