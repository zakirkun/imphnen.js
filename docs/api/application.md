# Application API Reference

The `Imphnen` class is the core application object that handles routing, middleware, and server lifecycle.

## Factory Functions

### `createApp(options?: ImphnenOptions): Imphnen`

Creates a new application instance with optional configuration.

```typescript
import { createApp } from 'imphnen';

const app = createApp({
  port: 3000,
  cors: true,
  uploads: {
    maxFileSize: 10 * 1024 * 1024,
    maxFiles: 5
  }
});
```

### `createEnhancedApp(options?: ImphnenOptions): Imphnen`

Alias for `createApp` - provides the same enhanced functionality.

### `imphnen(options?: ImphnenOptions): Imphnen`

Convenience alias for `createApp`.

## Configuration Options

### `ImphnenOptions`

```typescript
interface ImphnenOptions {
  port?: number;                    // Server port (default: 3000)
  hostname?: string;                // Server hostname (default: 'localhost')
  development?: boolean;            // Development mode with detailed logging
  cors?: boolean | CorsOptions;     // CORS configuration
  uploads?: UploadOptions;          // File upload settings
  staticFiles?: {                   // Static file serving
    root: string;                   // Root directory
    prefix?: string;                // URL prefix (default: '/')
  };
  proxy?: boolean;                  // Enable proxy features
}
```

#### CORS Options

```typescript
interface CorsOptions {
  origin?: string | string[];       // Allowed origins
  methods?: string[];               // Allowed methods
  headers?: string[];               // Allowed headers
  credentials?: boolean;            // Allow credentials
}
```

#### Upload Options

```typescript
interface UploadOptions {
  maxFileSize?: number;             // Max size per file (bytes)
  maxFiles?: number;                // Max files per request
  allowedTypes?: string[];          // Allowed MIME types or patterns
  destination?: string;             // Upload directory path
}
```

## Core Methods

### `app.use(middleware: Middleware): this`

Adds global middleware to the application.

```typescript
app.use(async (ctx, next) => {
  console.log(`${ctx.req.method} ${new URL(ctx.req.url).pathname}`);
  return await next();
});
```

### `app.listen(port?: number): Promise<void>`

Starts the server on the specified port.

```typescript
await app.listen(3000);
// Server running on http://localhost:3000
```

## HTTP Methods

### `app.get(path: string, handler: Handler): this`

Registers a GET route handler.

```typescript
app.get('/users/:id', (ctx) => {
  return ctx.json({ userId: ctx.params.id });
});
```

### `app.post(path: string, handler: Handler): this`

Registers a POST route handler.

```typescript
app.post('/users', async (ctx) => {
  const userData = ctx.body;
  const user = await createUser(userData);
  return ctx.json(user, { status: 201 });
});
```

### `app.put(path: string, handler: Handler): this`

Registers a PUT route handler.

```typescript
app.put('/users/:id', async (ctx) => {
  const user = await updateUser(ctx.params.id, ctx.body);
  return ctx.json(user);
});
```

### `app.delete(path: string, handler: Handler): this`

Registers a DELETE route handler.

```typescript
app.delete('/users/:id', async (ctx) => {
  await deleteUser(ctx.params.id);
  return ctx.json({ success: true });
});
```

### `app.patch(path: string, handler: Handler): this`

Registers a PATCH route handler.

```typescript
app.patch('/users/:id', async (ctx) => {
  const user = await partialUpdateUser(ctx.params.id, ctx.body);
  return ctx.json(user);
});
```

## Advanced Pipeline Methods

### `app.pipeline(initialState?: MiddlewareState): MiddlewarePipeline`

Creates a new middleware pipeline with optional initial state.

```typescript
const authPipeline = app.pipeline({ isAuthenticated: false })
  .use(async (ctx, next) => {
    const user = await authenticateUser(ctx);
    return await next({ user, isAuthenticated: true });
  });
```

### `app.route(method: HTTPMethod, path: string, pipeline: MiddlewarePipeline, handler: StateHandler): this`

Registers a route with a middleware pipeline.

```typescript
app.route('GET', '/profile', authPipeline, (ctx) => {
  // ctx.state.user is typed and available
  return ctx.json({ profile: ctx.state.user });
});
```

## Static Properties

### `Imphnen.middleware`

Access to built-in middleware functions.

```typescript
const corsMiddleware = Imphnen.middleware.cors({
  origin: ['https://example.com'],
  credentials: true
});

app.use(corsMiddleware);
```

## Route Parameters

### Parameter Extraction

Route parameters are automatically extracted and typed:

```typescript
// Route: /users/:userId/posts/:postId
app.get('/users/:userId/posts/:postId', (ctx) => {
  // ctx.params is typed as { userId: string; postId: string }
  const { userId, postId } = ctx.params;
  return ctx.json({ userId, postId });
});
```

### Wildcard Routes

```typescript
// Catch-all route
app.get('/files/*', (ctx) => {
  const filePath = ctx.params['*']; // Captures remaining path
  return ctx.file(`./uploads/${filePath}`);
});
```

## Middleware Composition

### Global Middleware

```typescript
// Applied to all routes
app.use(async (ctx, next) => {
  ctx.set.headers({ 'X-Powered-By': 'imphnen.js' });
  return await next();
});
```

### Route-Specific Middleware

```typescript
const authMiddleware = async (ctx, next) => {
  if (!ctx.headers.get('authorization')) {
    return ctx.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return await next();
};

app.get('/protected', authMiddleware, (ctx) => {
  return ctx.json({ message: 'Protected resource' });
});
```

### Pipeline Middleware

```typescript
const validationPipeline = app.pipeline()
  .use(async (ctx, next) => {
    // Validate request
    return await next({ validated: true });
  })
  .use(async (ctx, next) => {
    // Additional processing
    return await next();
  });

app.route('POST', '/api/data', validationPipeline, (ctx) => {
  // ctx.state.validated is available
  return ctx.json({ success: true });
});
```

## Error Handling

### Global Error Handler

```typescript
app.use(async (ctx, next) => {
  try {
    return await next();
  } catch (error) {
    console.error('Request error:', error);
    return ctx.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
```

### Route-Level Error Handling

```typescript
app.get('/api/data', async (ctx) => {
  try {
    const data = await fetchData();
    return ctx.json(data);
  } catch (error) {
    return ctx.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
});
```

## Configuration Examples

### Development Setup

```typescript
const app = createApp({
  port: 3000,
  development: true,
  cors: true,
  uploads: {
    maxFileSize: 5 * 1024 * 1024,
    allowedTypes: ['image/*', 'text/*']
  }
});
```

### Production Setup

```typescript
const app = createApp({
  port: process.env.PORT ? parseInt(process.env.PORT) : 8080,
  hostname: '0.0.0.0',
  development: false,
  cors: {
    origin: process.env.ALLOWED_ORIGINS?.split(',') || [],
    credentials: true
  },
  uploads: {
    maxFileSize: 10 * 1024 * 1024,
    maxFiles: 3,
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    destination: '/app/uploads'
  },
  staticFiles: {
    root: '/app/public',
    prefix: '/static'
  }
});
```

## Handler Property

### `app.handler: (request: Request) => Promise<Response>`

The internal request handler function, useful for integration with other servers:

```typescript
const app = createApp();

// Use with Bun server
const server = Bun.serve({
  port: 3000,
  fetch: app.handler
});

// Use with custom server
const customServer = {
  async handleRequest(request: Request) {
    return await app.handler(request);
  }
};
```

## Best Practices

### Application Structure

```typescript
const app = createApp({
  development: process.env.NODE_ENV !== 'production',
  cors: true
});

// Global middleware first
app.use(requestLogger);
app.use(errorHandler);

// Routes organized by feature
app.get('/health', healthCheck);
app.use('/api/users', userRoutes);
app.use('/api/files', fileRoutes);

// Catch-all route last
app.get('*', notFoundHandler);

await app.listen();
```

### Environment Configuration

```typescript
const config = {
  port: parseInt(process.env.PORT || '3000'),
  development: process.env.NODE_ENV === 'development',
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || true,
    credentials: true
  }
};

const app = createApp(config);
``` 