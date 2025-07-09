# imphnen.js

A modern TypeScript web server framework with end-to-end type safety, built for high performance with Bun runtime.

## Features

- 🔧 **End-to-End Type Safety**: Route parameters, request/response bodies, and middleware state are fully typed
- ⚡ **High Performance**: Built for Bun runtime with optimized request handling
- 🎯 **Developer Experience**: Express-like API with modern TypeScript patterns
- 🔐 **Built-in Middleware**: Authentication, CORS, rate limiting, logging, and validation
- 📁 **File Upload Support**: Built-in multipart/form-data handling with comprehensive validation
- 🔄 **Proxy Support**: Request proxying and forwarding capabilities with headers and timeout control
- 📂 **Static File Serving**: Efficient static file delivery with download options
- 🚀 **Advanced Pipelines**: Sophisticated middleware composition with generic state management
- 📦 **Zero Config**: Works out of the box with sensible defaults
- 🛠️ **Extensible**: Easy to extend with custom middleware and plugins
- 🔒 **Security Features**: Path traversal prevention, file validation, CORS with credentials
- 📖 **Complete Documentation**: Comprehensive docs, examples, and API reference

## Quick Start

```bash
# Clone and install
git clone <repository>
cd imphnen.js
bun install

# Run examples
bun run examples/complete-demo.ts              # Full demo (Port 3000)
bun run examples/basic/simple-server.ts        # Basic server (Port 3001)
bun run examples/file-upload/upload-demo.ts    # File upload demo (Port 3004)
```

## Project Structure

```
imphnen.js/
├── src/                          # Framework source code
│   ├── app.ts                    # Main application class (unified)
│   ├── pipeline.ts               # Advanced middleware pipeline system
│   ├── types.ts                  # Core type definitions
│   ├── utils.ts                  # Utility functions
│   ├── context.ts               # Request context handling
│   └── index.ts                 # Main exports
├── examples/                     # Usage examples organized by feature
│   ├── complete-demo.ts          # Full framework demonstration
│   ├── basic/                    # Simple server examples
│   │   └── simple-server.ts      # Basic routing and responses
│   ├── middleware/               # Middleware examples
│   │   └── auth-example.ts       # Authentication & logging
│   ├── pipeline/                 # Advanced pipeline examples
│   │   └── advanced-pipeline.ts  # State composition
│   ├── file-upload/              # File upload examples
│   │   ├── upload-demo.ts        # Complete upload server
│   │   ├── upload-client.html    # Interactive test client
│   │   └── README.md             # Upload documentation
│   └── README.md                 # Examples documentation
├── docs/                         # Comprehensive documentation
│   ├── api/                      # Complete API reference
│   │   ├── application.md        # Application class methods
│   │   ├── context.md            # Context object API
│   │   ├── middleware.md         # Built-in middleware
│   │   ├── pipeline.md           # Pipeline system
│   │   ├── types.md              # Type definitions
│   │   └── utils.md              # Utility functions
│   ├── guides/                   # Feature implementation guides
│   │   ├── getting-started.md    # Quick start guide
│   │   ├── file-uploads.md       # File upload implementation
│   │   ├── proxy-requests.md     # Proxy configuration
│   │   ├── static-files.md       # Static file serving
│   │   ├── authentication.md     # Auth implementation
│   │   ├── middleware.md         # Middleware patterns
│   │   ├── pipelines.md          # Pipeline usage
│   │   ├── security.md           # Security best practices
│   │   └── deployment.md         # Production deployment
│   ├── examples/                 # Documented usage examples
│   │   ├── basic-server.md       # Basic server setup
│   │   ├── file-upload.md        # File handling examples
│   │   ├── authentication.md     # Auth examples
│   │   ├── middleware.md         # Middleware examples
│   │   └── advanced.md           # Advanced patterns
│   ├── reference/                # Technical reference
│   │   ├── configuration.md      # Configuration options
│   │   ├── error-handling.md     # Error management
│   │   ├── performance.md        # Performance optimization
│   │   └── troubleshooting.md    # Common issues
│   └── README.md                 # Documentation index
├── test/                         # Test suite
│   ├── unit/                     # Unit tests
│   ├── integration/              # Integration tests
│   ├── performance/              # Load testing
│   ├── client/                   # HTTP test client
│   └── README.md                 # Testing documentation
├── index.ts                      # Main entry point
├── index.d.ts                    # Complete TypeScript definitions
├── package.json                  # Dependencies
└── README.md                     # This file
```

## Basic Usage

```typescript
import { createApp } from './src/index.js';

const app = createApp({
  port: 3000,
  cors: true,
  development: true,
  uploads: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    allowedTypes: ['image/*', 'application/pdf']
  }
});

// Global middleware
app.use(async (ctx, next) => {
  console.log(`${ctx.req.method} ${new URL(ctx.req.url).pathname}`);
  return await next();
});

// Type-safe routes
app.get('/users/:id', (ctx) => {
  // ctx.params.id is fully typed as string
  return ctx.json({ userId: ctx.params.id });
});

// File upload endpoint
app.post('/upload', async (ctx) => {
  if (!ctx.files || ctx.files.length === 0) {
    return ctx.json({ error: 'No files uploaded' }, { status: 400 });
  }

  // Process uploaded files with full type safety
  const fileInfo = ctx.files.map(file => ({
    name: file.name,
    size: file.size,
    type: file.type
  }));

  return ctx.json({ 
    message: 'Files uploaded successfully',
    files: fileInfo 
  });
});

await app.listen();
```

## File Upload Features

Comprehensive multipart/form-data support with security and validation:

```typescript
const app = createApp({
  uploads: {
    maxFileSize: 5 * 1024 * 1024, // 5MB per file
    maxFiles: 10,                 // Max 10 files per request
    allowedTypes: [               // MIME type validation
      'image/jpeg',
      'image/png', 
      'image/gif',
      'application/pdf',
      'text/plain'
    ],
    destination: './uploads'      // Upload directory
  }
});

app.post('/api/upload', async (ctx) => {
  if (!ctx.files?.length) {
    return ctx.json({ error: 'No files provided' }, { status: 400 });
  }

  const results = [];
  for (const file of ctx.files) {
    // Security: validate file before processing
    if (file.size > 5 * 1024 * 1024) {
      return ctx.json({ error: 'File too large' }, { status: 413 });
    }

    // Process file
    const buffer = await file.arrayBuffer();
    const filename = `${Date.now()}-${file.name}`;
    
    // Save to filesystem, database, or cloud storage
    await Bun.write(`./uploads/${filename}`, buffer);
    
    results.push({
      original: file.name,
      saved: filename,
      size: file.size,
      type: file.type
    });
  }
  
  return ctx.json({ success: true, files: results });
});
```

## Proxy and Static File Features

Built-in proxy support for microservices and API forwarding:

```typescript
const app = createApp({
  staticFiles: {
    root: './public',
    prefix: '/static'
  },
  proxy: true
});

// Proxy API requests to backend service
app.get('/api/*', (ctx) => {
  return ctx.proxy('http://backend-service:8080', {
    changeOrigin: true,
    headers: { 
      'X-Forwarded-For': 'proxy',
      'Authorization': ctx.headers.get('authorization') || ''
    },
    timeout: 30000
  });
});

// Serve static files with download option
app.get('/download/:filename', async (ctx) => {
  return await ctx.file(`./uploads/${ctx.params.filename}`, {
    download: true,
    filename: `download-${ctx.params.filename}`
  });
});

// File management endpoints
app.get('/files', async (ctx) => {
  const files = await readdir('./uploads');
  return ctx.json({ files });
});

app.delete('/files/:filename', async (ctx) => {
  await unlink(`./uploads/${ctx.params.filename}`);
  return ctx.json({ success: true });
});
```

## Advanced Pipeline Usage

Type-safe middleware composition with state management:

```typescript
import { createApp } from './src/index.js';

const app = createApp();

// Create authentication pipeline with state
const authPipeline = app.pipeline({ isAuthenticated: false })
  .use(async (ctx, next) => {
    const token = ctx.headers.get('authorization');
    if (!token) {
      return ctx.json({ error: 'No token provided' }, { status: 401 });
    }
    
    const user = await validateToken(token);
    return await next({ user, isAuthenticated: true });
  })
  .use(async (ctx, next) => {
    console.log(`Authenticated request by ${ctx.state.user.name}`);
    return await next();
  });

// Use pipeline with fully typed routes
app.route('GET', '/profile', authPipeline, (ctx) => {
  // ctx.state.user is fully typed and available
  return ctx.json({ 
    profile: ctx.state.user,
    authenticated: ctx.state.isAuthenticated 
  });
});

// Combine multiple pipelines
const adminPipeline = authPipeline
  .use(async (ctx, next) => {
    if (ctx.state.user.role !== 'admin') {
      return ctx.json({ error: 'Admin required' }, { status: 403 });
    }
    return await next({ isAdmin: true });
  });

app.route('GET', '/admin/users', adminPipeline, (ctx) => {
  // ctx.state has user, isAuthenticated, and isAdmin
  return ctx.json({ users: getAllUsers() });
});
```

## Examples

The `examples/` directory contains comprehensive examples organized by feature:

- **Complete Demo**: Full framework demonstration with all features
- **Basic**: Simple server setups and routing patterns
- **Middleware**: Authentication, logging, and middleware composition
- **Pipeline**: Advanced state composition and transformation
- **File Upload**: Complete file upload implementation with client interface

```bash
# Run specific examples
bun run examples/complete-demo.ts                    # Port 3000 - Full demo
bun run examples/basic/simple-server.ts              # Port 3001 - Basic server
bun run examples/middleware/auth-example.ts          # Port 3002 - Middleware
bun run examples/pipeline/advanced-pipeline.ts      # Port 3003 - Pipelines
bun run examples/file-upload/upload-demo.ts         # Port 3004 - File uploads
```

## Testing

Comprehensive test suite with multiple testing approaches:

```bash
# Run all tests
bun test

# Test specific areas
bun test test/unit/              # Unit tests
bun test test/integration/       # Integration tests
bun test test/performance/       # Performance tests

# Interactive HTTP test client
bun run test/client/test-client.ts
```

## Built-in Middleware

Complete middleware ecosystem for common web development needs:

- **Authentication**: JWT-style token validation with user state
- **CORS**: Cross-origin resource sharing with credentials support
- **Rate Limiting**: Request throttling with custom key generation
- **Logging**: Request/response logging with customizable prefixes
- **Validation**: Request body, query, and parameter validation
- **File Upload**: Multipart/form-data handling with comprehensive validation
- **Static Files**: Efficient static file serving with caching
- **Proxy**: Request forwarding and proxying with header manipulation
- **Error Handling**: Structured error responses with stack traces

## API Reference

### Core Factory Functions

- `createApp(options?)`: Create standard application instance
- `createEnhancedApp(options?)`: Create application with advanced pipeline support
- `imphnen(options?)`: Alias for createApp

### Application Configuration

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

### Enhanced Context Object

The context object provides all request/response functionality:

```typescript
interface Context {
  req: Request;                     // Original request
  params: Record<string, string>;   // Route parameters (typed)
  query: Record<string, string>;    // Query parameters
  body: unknown;                    // Parsed request body
  headers: Headers;                 // Request headers
  files?: UploadedFile[];          // Uploaded files array
  
  // Response methods
  json<T>(data: T, options?: ResponseInit): Response;
  text(text: string, options?: ResponseInit): Response;
  html(html: string, options?: ResponseInit): Response;
  redirect(url: string, status?: number): Response;
  file(path: string, options?: FileOptions): Promise<Response>;
  proxy(target: string, options?: ProxyOptions): Promise<Response>;
  
  // Header/status utilities
  set: {
    headers(headers: Record<string, string>): void;
    status(status: number): void;
  };
}
```

### File Upload Types

```typescript
interface UploadedFile {
  name: string;                     // Original filename
  size: number;                     // File size in bytes
  type: string;                     // MIME type
  arrayBuffer(): Promise<ArrayBuffer>;  // Get file as buffer
  text(): Promise<string>;              // Get file as text
  stream(): ReadableStream;             // Get file as stream
}

interface UploadOptions {
  maxFileSize?: number;             // Max size per file (bytes)
  maxFiles?: number;                // Max files per request
  allowedTypes?: string[];          // Allowed MIME types or patterns
  destination?: string;             // Upload directory path
}
```

### Proxy Configuration

```typescript
interface ProxyOptions {
  target: string;                   // Target URL to proxy to
  changeOrigin?: boolean;           // Change origin header
  headers?: Record<string, string>; // Additional headers
  timeout?: number;                 // Request timeout (ms)
}
```

## Documentation

Comprehensive documentation is available in the `docs/` directory:

- **API Reference**: Complete API documentation with examples
- **Feature Guides**: In-depth implementation guides for each feature
- **Usage Examples**: Practical examples with explanations
- **Best Practices**: Recommended patterns and security practices
- **Reference**: Technical reference and troubleshooting

## Type Safety

Complete TypeScript definitions provide:

- Route parameter extraction and typing
- Middleware state composition
- Request/response body typing
- File upload type safety
- Pipeline state management
- Built-in middleware types
- Configuration option types

## Framework Status

This framework is feature-complete and production-ready:

- ✅ Complete application functionality with file uploads and proxy support
- ✅ Comprehensive TypeScript type definitions for all features
- ✅ Organized examples by feature with interactive clients
- ✅ Complete test suite with unit, integration, and performance tests
- ✅ Zero TypeScript compilation errors across all code
- ✅ Verified functionality with comprehensive test coverage
- ✅ Complete documentation in docs/ directory with guides and examples
- ✅ Security features: CORS, file validation, path traversal prevention
- ✅ Performance optimizations for file handling and request processing
- ✅ Production deployment ready with error handling and logging

## License

[License information]

## Contributing

[Contributing guidelines]
