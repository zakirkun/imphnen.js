// Complete Demo - Full usage example of imphnen.js framework

import { createApp } from '../src/index.js';
import type { Context, Middleware } from '../src/index.js';

const app = createApp({
  port: 3000,
  cors: true,
  development: true
});

// Middleware example
const logger: Middleware = async (ctx, next) => {
  console.log(`${ctx.req.method} ${new URL(ctx.req.url).pathname}`);
  const start = Date.now();
  const response = await next();
  const duration = Date.now() - start;
  console.log(`Request completed in ${duration}ms`);
  return response;
};

app.use(logger);

// Routes with full type safety
app.get('/', (ctx: Context) => {
  return ctx.json({ 
    message: 'Welcome to imphnen.js!',
    framework: 'TypeScript Web Server with End-to-End Type Safety',
    engine: 'Bun'
  });
});

app.get('/users/:id', (ctx: Context<{ id: string }>) => {
  // ctx.params.id is fully typed as string
  return ctx.json({ 
    userId: ctx.params.id,
    type: typeof ctx.params.id // Always string, fully inferred
  });   
});

app.post('/users', async (ctx: Context) => {
  // ctx.body is properly typed based on request
  return ctx.json({ 
    message: 'User created',
    data: ctx.body 
  });
});

app.get('/search', (ctx: Context) => {
  // ctx.query is fully typed - access properties safely
  const query = ctx.query as { q?: string };
  return ctx.json({ 
    query: ctx.query,
    results: `Searching for: ${query.q || 'nothing'}`
  });
});

// Start server
await app.listen(); 