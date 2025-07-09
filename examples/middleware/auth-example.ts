// Middleware Example - Authentication and logging middleware
import { createApp } from '../../src/index.js';
import type { Middleware } from '../../src/index.js';
import type { Context } from '../../src/index.js';

const app = createApp({
  port: 3002,
  cors: true
});

// Logger middleware
const logger: Middleware = async (ctx, next) => {
  const start = Date.now();
  console.log(`→ ${ctx.req.method} ${new URL(ctx.req.url).pathname}`);
  
  const response = await next();
  
  const duration = Date.now() - start;
  console.log(`← ${ctx.req.method} ${new URL(ctx.req.url).pathname} (${duration}ms)`);
  
  return response;
};

app.use(logger);

// Auth middleware for protected routes
const authMiddleware: Middleware = async (ctx, next) => {
  const authHeader = ctx.req.headers.get('Authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return ctx.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  // Simple token validation (in real app, verify JWT)
  const token = authHeader.slice(7);
  if (token !== 'valid-token') {
    return ctx.json({ error: 'Invalid token' }, { status: 401 });
  }
  
  // Add user info to context (using any for demo purposes)
  (ctx as any).user = { id: '123', name: 'John Doe' };
  
  return await next();
};

// Public routes
app.get('/', (ctx: Context) => {
  return ctx.json({ 
    message: 'Public route',
    timestamp: new Date().toISOString()
  });
});

app.post('/login', async (ctx: Context) => {
  const body = ctx.body as { username?: string; password?: string };
  
  // Simple login check
  if (body?.username === 'admin' && body?.password === 'password') {
    return ctx.json({ 
      token: 'valid-token',
      message: 'Login successful'
    });
  }
  
  return ctx.json({ error: 'Invalid credentials' }, { status: 401 });
});

// Protected routes
app.get('/profile', authMiddleware, (ctx: Context) => {
  return ctx.json({ 
    user: (ctx as any).user,
    message: 'This is a protected route'
  });
});

app.get('/admin', authMiddleware, (ctx: Context) => {
  return ctx.json({ 
    message: 'Admin panel',
    user: (ctx as any).user,
    adminData: ['sensitive', 'information']
  });
});

console.log('Middleware example server starting on port 3002...');
console.log('Try:');
console.log('  GET http://localhost:3002/ (public)');
console.log('  POST http://localhost:3002/login (get token)');
console.log('  GET http://localhost:3002/profile (protected - needs Authorization: Bearer valid-token)');

await app.listen(); 