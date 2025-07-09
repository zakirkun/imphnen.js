// Integration tests for middleware functionality

import { createApp } from '../../src/index.js';
import type { Middleware } from '../../src/index.js';
import type { Context } from '../../src/index.js';

console.log('Testing middleware integration...');

const app = createApp();

// Test middleware
const testMiddleware: Middleware = async (ctx, next) => {
  const response = await next();
  response.headers.set('X-Test-Middleware', 'true');
  return response;
};

const authMiddleware: Middleware = async (ctx, next) => {
  const token = ctx.headers.get('authorization');
  if (!token) {
    return ctx.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return await next();
};

app.use(testMiddleware);

app.get('/public', (ctx: Context) => {
  return ctx.json({ message: 'public endpoint' });
});

app.get('/protected', authMiddleware, (ctx: Context) => {
  return ctx.json({ message: 'protected endpoint' });
});

console.log('✅ Middleware test setup complete');
console.log('🔧 Test endpoints configured:');
console.log('   GET /public (no auth required)');
console.log('   GET /protected (requires Authorization header)');

export { app }; 