// Performance/Load tests for imphnen.js framework

import { createApp } from '../../src/index.js';
import type { Context } from '../../src/index.js';

console.log('Setting up performance test server...');

const app = createApp({
  port: 4000,
  development: false // Disable dev mode for performance testing
});

// Simple endpoints for load testing
app.get('/ping', (ctx: Context) => {
  return ctx.text('pong');
});

app.get('/json', (ctx: Context) => {
  return ctx.json({ 
    timestamp: Date.now(),
    message: 'Hello from load test'
  });
});

app.get('/users/:id', (ctx: Context<{ id: string }>) => {
  return ctx.json({
    id: ctx.params.id,
    name: `User ${ctx.params.id}`,
    timestamp: Date.now()
  });
});

app.post('/data', (ctx: Context) => {
  return ctx.json({
    received: ctx.body,
    processed: Date.now()
  });
});

console.log('✅ Performance test server configured on port 4000');
console.log('🚀 To run load tests, use tools like:');
console.log('   - wrk: wrk -t12 -c400 -d30s http://localhost:4000/ping');
console.log('   - hey: hey -n 10000 -c 100 http://localhost:4000/ping');
console.log('   - autocannon: autocannon -c 100 -d 30 http://localhost:4000/ping');

export { app }; 