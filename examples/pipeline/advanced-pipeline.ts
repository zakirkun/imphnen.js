// Advanced Pipeline Example - Middleware composition
import { createApp } from '../../src/index.js';
import type { Context, Middleware } from '../../src/index.js';

const app = createApp({
  port: 3003,
  cors: true
});

// Auth middleware
const authMiddleware: Middleware = async (ctx, next) => {
  console.log('Auth middleware - checking authentication');
  const authHeader = ctx.req.headers.get('authorization');
  
  if (!authHeader) {
    ctx.set.status(401);
    return ctx.json({ error: 'Missing authorization header' });
  }
  
  // Simulate auth validation
  const user = { 
    id: '123', 
    name: 'John Doe', 
    role: 'admin',
    permissions: ['read', 'write', 'delete']
  };
  
  // Store user in context for next middleware
  (ctx as any).user = user;
  return await next();
};

// Permission middleware
const permissionMiddleware: Middleware = async (ctx, next) => {
  console.log('Permission middleware - checking permissions');
  
  const user = (ctx as any).user;
  const requiredPermission = 'read';
  
  if (!user?.permissions?.includes(requiredPermission)) {
    ctx.set.status(403);
    return ctx.json({ 
      error: `Missing required permission: ${requiredPermission}` 
    });
  }
  
  (ctx as any).hasReadAccess = true;
  return await next();
};

// Admin middleware
const adminMiddleware: Middleware = async (ctx, next) => {
  const user = (ctx as any).user;
  if (user?.role !== 'admin') {
    ctx.set.status(403);
    return ctx.json({ error: 'Admin access required' });
  }
  
  (ctx as any).adminAccess = {
    granted: true,
    level: 'full',
    grantedAt: Date.now()
  };
  
  return await next();
};

// Routes using middleware composition
app.get('/users/:id', 
  authMiddleware,
  permissionMiddleware,
  (ctx: Context<{ id: string }>) => {
    const user = (ctx as any).user;
    const hasReadAccess = (ctx as any).hasReadAccess;
    
    return ctx.json({
      message: `User data for ID: ${ctx.params.id}`,
      requestedBy: user.name,
      userRole: user.role,
      hasReadAccess,
      userData: {
        id: ctx.params.id,
        name: `User ${ctx.params.id}`,
        email: `user${ctx.params.id}@example.com`
      }
    });
  }
);

app.post('/users/:id/update', 
  authMiddleware,
  permissionMiddleware,
  async (ctx: Context<{ id: string }>) => {
    const updateData = ctx.body;
    const user = (ctx as any).user;
    
    return ctx.json({
      message: `User ${ctx.params.id} updated successfully`,
      updatedBy: user.name,
      updateData,
      timestamp: new Date().toISOString()
    });
  }
);

app.get('/admin/users', 
  authMiddleware,
  adminMiddleware,
  (ctx: Context) => {
    const user = (ctx as any).user;
    const adminAccess = (ctx as any).adminAccess;
    
    return ctx.json({
      message: 'Admin user list',
      adminInfo: adminAccess,
      requestedBy: user.name,
      allUsers: [
        { id: '1', name: 'User 1', status: 'active' },
        { id: '2', name: 'User 2', status: 'inactive' },
        { id: '3', name: 'User 3', status: 'active' }
      ]
    });
  }
);

app.delete('/admin/users/:id', 
  authMiddleware,
  adminMiddleware,
  (ctx: Context<{ id: string }>) => {
    const user = (ctx as any).user;
    const adminAccess = (ctx as any).adminAccess;
    
    return ctx.json({
      message: `User ${ctx.params.id} deleted by admin`,
      deletedBy: user.name,
      adminLevel: adminAccess.level,
      timestamp: new Date().toISOString()
    });
  }
);

// Public route
app.get('/', (ctx: Context) => {
  return ctx.json({ 
    message: 'Pipeline example server',
    endpoints: {
      public: ['/'],
      protected: ['/users/:id', '/users/:id/update'],
      admin: ['/admin/users', '/admin/users/:id']
    },
    note: 'Protected routes require Authorization header'
  });
});

console.log('Pipeline example server starting on port 3003...');
console.log('Routes available:');
console.log('  GET / (public)');
console.log('  GET /users/:id (requires auth)');
console.log('  POST /users/:id/update (requires auth)');
console.log('  GET /admin/users (requires admin auth)');
console.log('  DELETE /admin/users/:id (requires admin auth)');
console.log('');
console.log('Add header: Authorization: Bearer any-token');

await app.listen(); 