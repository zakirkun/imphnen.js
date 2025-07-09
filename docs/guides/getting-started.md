# Getting Started with imphnen.js

Welcome to imphnen.js! This guide will help you get up and running with the framework quickly.

## Prerequisites

- **Bun runtime**: imphnen.js is built for Bun. [Install Bun](https://bun.sh/) if you haven't already.
- **TypeScript knowledge**: While not required, TypeScript knowledge helps take advantage of the framework's type safety.

## Installation

### Clone the Repository

```bash
git clone <repository-url>
cd imphnen.js
bun install
```

### Project Structure

After cloning, you'll see this structure:

```
imphnen.js/
├── src/           # Framework source code
├── examples/      # Usage examples
├── docs/          # Documentation
├── test/          # Test suite
├── index.ts       # Main entry point
└── package.json   # Dependencies
```

## Your First Server

Create a simple server file:

```typescript
// server.ts
import { createApp } from './src/index.js';

const app = createApp({
  port: 3000,
  development: true
});

// Simple route
app.get('/', (ctx) => {
  return ctx.json({ message: 'Hello, World!' });
});

// Route with parameters
app.get('/users/:id', (ctx) => {
  return ctx.json({ 
    userId: ctx.params.id,
    message: `Hello, user ${ctx.params.id}!`
  });
});

console.log('Starting server...');
await app.listen();
console.log('Server running on http://localhost:3000');
```

Run your server:

```bash
bun run server.ts
```

Visit `http://localhost:3000` to see your server in action!

## Basic Concepts

### 1. Application Creation

```typescript
import { createApp } from './src/index.js';

const app = createApp({
  port: 3000,           // Server port
  development: true,    // Enable development features
  cors: true           // Enable CORS
});
```

### 2. Route Handlers

```typescript
// GET route
app.get('/hello', (ctx) => {
  return ctx.text('Hello, World!');
});

// POST route
app.post('/data', (ctx) => {
  console.log('Received:', ctx.body);
  return ctx.json({ received: ctx.body });
});

// Route with parameters
app.get('/users/:userId/posts/:postId', (ctx) => {
  const { userId, postId } = ctx.params;
  return ctx.json({ userId, postId });
});
```

### 3. Response Types

```typescript
app.get('/responses', (ctx) => {
  // JSON response
  return ctx.json({ data: 'example' });
  
  // Text response
  return ctx.text('Plain text');
  
  // HTML response
  return ctx.html('<h1>Hello HTML!</h1>');
  
  // Redirect
  return ctx.redirect('/other-page');
});
```

### 4. Middleware

```typescript
// Global middleware
app.use(async (ctx, next) => {
  console.log(`${ctx.req.method} ${new URL(ctx.req.url).pathname}`);
  return await next();
});

// Error handling middleware
app.use(async (ctx, next) => {
  try {
    return await next();
  } catch (error) {
    console.error('Error:', error);
    return ctx.json({ error: 'Something went wrong' }, { status: 500 });
  }
});
```

## Working with Requests

### Query Parameters

```typescript
// URL: /search?q=typescript&limit=10
app.get('/search', (ctx) => {
  const { q, limit } = ctx.query;
  const maxResults = parseInt(limit || '20');
  
  return ctx.json({
    query: q,
    limit: maxResults,
    results: search(q, maxResults)
  });
});
```

### Request Body

```typescript
app.post('/users', async (ctx) => {
  const userData = ctx.body as { name: string; email: string };
  
  // Validate data
  if (!userData.name || !userData.email) {
    return ctx.json({ error: 'Name and email required' }, { status: 400 });
  }
  
  // Create user
  const user = await createUser(userData);
  return ctx.json(user, { status: 201 });
});
```

### Headers

```typescript
app.get('/info', (ctx) => {
  const userAgent = ctx.headers.get('user-agent');
  const authorization = ctx.headers.get('authorization');
  
  return ctx.json({
    userAgent,
    hasAuth: !!authorization
  });
});
```

## Configuration Options

### Development vs Production

```typescript
const app = createApp({
  port: process.env.PORT ? parseInt(process.env.PORT) : 3000,
  development: process.env.NODE_ENV === 'development',
  cors: process.env.NODE_ENV === 'development'
});
```

### CORS Configuration

```typescript
const app = createApp({
  cors: {
    origin: ['https://example.com', 'https://app.example.com'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    headers: ['Content-Type', 'Authorization'],
    credentials: true
  }
});
```

### File Uploads

```typescript
const app = createApp({
  uploads: {
    maxFileSize: 5 * 1024 * 1024,  // 5MB
    maxFiles: 10,
    allowedTypes: ['image/*', 'application/pdf']
  }
});

app.post('/upload', async (ctx) => {
  if (ctx.files?.length) {
    console.log(`Uploaded ${ctx.files.length} files`);
    return ctx.json({ success: true });
  }
  return ctx.json({ error: 'No files' }, { status: 400 });
});
```

## Error Handling

### Global Error Handler

```typescript
app.use(async (ctx, next) => {
  try {
    return await next();
  } catch (error) {
    console.error('Request failed:', error);
    
    if (error.name === 'ValidationError') {
      return ctx.json({ error: error.message }, { status: 400 });
    }
    
    return ctx.json({ error: 'Internal server error' }, { status: 500 });
  }
});
```

### Route-Level Error Handling

```typescript
app.get('/api/data/:id', async (ctx) => {
  try {
    const data = await fetchData(ctx.params.id);
    return ctx.json(data);
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return ctx.json({ error: 'Data not found' }, { status: 404 });
    }
    throw error; // Let global handler deal with it
  }
});
```

## Running Examples

The framework comes with comprehensive examples:

```bash
# Basic server example
bun run examples/basic/simple-server.ts

# Complete demo with all features
bun run examples/complete-demo.ts

# File upload example
bun run examples/file-upload/upload-demo.ts

# Middleware examples
bun run examples/middleware/auth-example.ts
```

## Development Tips

### 1. Use TypeScript

Enable strict type checking in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### 2. Environment Variables

Create a `.env` file for configuration:

```env
PORT=3000
NODE_ENV=development
DATABASE_URL=postgresql://localhost/myapp
```

Load environment variables:

```typescript
const config = {
  port: parseInt(process.env.PORT || '3000'),
  development: process.env.NODE_ENV === 'development',
  databaseUrl: process.env.DATABASE_URL
};

const app = createApp(config);
```

### 3. Code Organization

Structure your application:

```typescript
// routes/users.ts
export const userRoutes = (app: Imphnen) => {
  app.get('/users', getAllUsers);
  app.get('/users/:id', getUserById);
  app.post('/users', createUser);
};

// server.ts
import { userRoutes } from './routes/users.js';

const app = createApp();
userRoutes(app);
await app.listen();
```

### 4. Middleware Organization

```typescript
// middleware/auth.ts
export const authMiddleware = async (ctx: Context, next: () => Promise<Response>) => {
  const token = ctx.headers.get('authorization');
  if (!token) {
    return ctx.json({ error: 'Unauthorized' }, { status: 401 });
  }
  // Validate token...
  return await next();
};

// server.ts
import { authMiddleware } from './middleware/auth.js';

app.use(authMiddleware);
```

## Testing Your Server

### Manual Testing

```bash
# Test with curl
curl http://localhost:3000/
curl -X POST http://localhost:3000/data -d '{"name":"test"}' -H "Content-Type: application/json"
```

### Using the Test Client

The framework includes a test client:

```bash
bun run test/client/test-client.ts
```

## Next Steps

Now that you have a basic server running, explore these topics:

1. **[File Uploads](file-uploads.md)** - Handle file uploads with validation
2. **[Authentication](authentication.md)** - Implement user authentication
3. **[Middleware](middleware.md)** - Build custom middleware
4. **[Pipelines](pipelines.md)** - Advanced middleware composition
5. **[Security](security.md)** - Security best practices

## Common Issues

### TypeScript Errors

If you see TypeScript errors, ensure:
- You're using `./src/index.js` imports (not `.ts`)
- Your `tsconfig.json` is properly configured
- All dependencies are installed

### Port Already in Use

If port 3000 is busy:

```typescript
const app = createApp({ port: 3001 }); // Use different port
```

Or kill the process using the port:

```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>
```

### File Upload Issues

Ensure upload directory exists:

```typescript
import { mkdir } from 'fs/promises';

// Create upload directory
await mkdir('./uploads', { recursive: true });

const app = createApp({
  uploads: { destination: './uploads' }
});
```

## Getting Help

- **Documentation**: Browse the [docs](../README.md) directory
- **Examples**: Check the `examples/` directory
- **Issues**: Report problems on GitHub
- **API Reference**: See [API documentation](../api/)

Happy coding with imphnen.js! 🚀 