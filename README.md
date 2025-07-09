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
- 🌊 **Streaming Responses**: Real-time streaming, chunked transfer, and Server-Sent Events (SSE)
- 🔌 **WebSocket Support**: Type-safe WebSocket connections with event handlers
- 📦 **Zero Config**: Works out of the box with sensible defaults
- 🛠️ **Extensible**: Easy to extend with custom middleware and plugins
- 🔒 **Security Features**: Path traversal prevention, file validation, CORS with credentials
- 📖 **Complete Documentation**: Comprehensive docs, examples, and API reference

## Installation

### Prerequisites

Before installing imphnen.js, ensure you have:

- **Bun runtime**: imphnen.js is optimized for Bun. [Install Bun](https://bun.sh/)
- **Node.js 18+**: Alternative runtime support
- **TypeScript**: For full type safety benefits

### Install Framework

#### Option 1: Install from npm (Recommended)

```bash
# Create new project
mkdir my-imphnen-app
cd my-imphnen-app

# Initialize project
bun init

# Install imphnen.js framework
bun add imphnen.js

# Install type definitions (if not included)
bun add -D @types/node
```

#### Option 2: Development Installation

```bash
# Clone the repository for development
git clone https://github.com/zakirkun/imphnen.js
cd imphnen.js
bun install

# Build the framework
bun run build

# Link for local development
bun link

# In your project directory
bun link imphnen.js
```

### Quick Setup

Create your first server:

```typescript
// server.ts
import { createApp } from 'imphnen.js';

const app = createApp({
  port: 3000,
  development: true,
  cors: true
});

app.get('/', (ctx) => {
  return ctx.json({ message: 'Hello from imphnen.js!' });
});

console.log('Starting server...');
await app.listen();
console.log('🚀 Server running on http://localhost:3000');
```

Run your server:

```bash
# With Bun (recommended)
bun run server.ts

# With Node.js + tsx
npx tsx server.ts

# With ts-node
npx ts-node server.ts
```

### Project Structure Setup

For a well-organized project:

```bash
# Create project structure
mkdir src routes middleware utils
touch src/server.ts routes/index.ts middleware/auth.ts
```

```
my-imphnen-app/
├── src/
│   ├── server.ts          # Main server file
│   ├── config.ts          # Configuration
│   └── types.ts           # Custom types
├── routes/
│   ├── index.ts           # Route definitions
│   ├── users.ts           # User routes
│   └── api.ts             # API routes
├── middleware/
│   ├── auth.ts            # Authentication
│   ├── validation.ts      # Request validation
│   └── logging.ts         # Request logging
├── utils/
│   └── helpers.ts         # Utility functions
├── uploads/               # File upload directory
├── public/                # Static files
├── package.json
└── tsconfig.json
```

### Configuration Files

#### TypeScript Configuration

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "allowJs": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src/**/*", "routes/**/*", "middleware/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

#### Package.json Scripts

Add useful scripts to `package.json`:

```json
{
  "name": "my-imphnen-app",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "bun --watch src/server.ts",
    "start": "bun src/server.ts",
    "build": "bun build src/server.ts --outdir dist",
    "test": "bun test",
    "type-check": "tsc --noEmit"
  },
  "dependencies": {
    "imphnen.js": "^1.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

## Quick Start

```bash
# Create project and install
mkdir my-app && cd my-app
bun init
bun add imphnen.js

# Create server file
echo 'import { createApp } from "imphnen.js";

const app = createApp({ port: 3000, cors: true });

app.get("/", (ctx) => ctx.json({ message: "Hello World!" }));

await app.listen();
console.log("🚀 Server running on http://localhost:3000");' > server.ts

# Run server
bun run server.ts
```

Visit `http://localhost:3000` to see your server running!

## Basic Usage

```typescript
import { createApp } from 'imphnen.js';

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

## Streaming Responses

Imphnen.js provides comprehensive streaming support for real-time data transmission and progressive content delivery:

### Manual Streaming Control

```typescript
app.get('/stream/manual', async (ctx) => {
  const stream = await ctx.createStream({
    contentType: 'text/plain; charset=utf-8',
    headers: {
      'X-Custom-Header': 'streaming-demo'
    }
  });

  // Stream data in real-time
  for (let i = 1; i <= 10; i++) {
    stream.write(`Chunk ${i}: ${new Date().toISOString()}\n`);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  stream.close();
  return stream.response;
});
```

### Async Generator Streaming

```typescript
app.get('/stream/generator', async (ctx) => {
  async function* dataGenerator() {
    for (let i = 1; i <= 5; i++) {
      yield `Generated data ${i}: ${Math.random().toFixed(4)}\n`;
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    yield 'Stream completed!\n';
  }

  return ctx.streamResponse(dataGenerator(), {
    contentType: 'text/plain; charset=utf-8',
    headers: { 'X-Stream-Type': 'generator' }
  });
});
```

### Server-Sent Events (SSE)

```typescript
app.get('/stream/events', async (ctx) => {
  async function* eventGenerator() {
    for (let i = 1; i <= 10; i++) {
      yield {
        id: i,
        message: `Event ${i}`,
        timestamp: new Date().toISOString(),
        data: Math.random() * 100
      };
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return ctx.sseResponse(eventGenerator(), {
    retry: 3000,
    headers: { 'X-SSE-Demo': 'true' }
  });
});
```

### Chunked Transfer Encoding

```typescript
app.get('/stream/chunked', async (ctx) => {
  const chunks = [
    'First chunk of data\n',
    { message: 'JSON chunk', timestamp: Date.now() },
    'Final chunk - goodbye!'
  ];

  return ctx.chunkedResponse(chunks, {
    encoding: 'utf-8',
    headers: { 'X-Transfer-Type': 'chunked' }
  });
});
```

### Progress Streaming

```typescript
app.get('/task/:id/progress', async (ctx) => {
  const stream = await ctx.createStream({
    contentType: 'application/json'
  });

  const totalSteps = 20;
  for (let step = 0; step <= totalSteps; step++) {
    const progress = {
      step,
      total: totalSteps,
      percentage: Math.round((step / totalSteps) * 100),
      message: step === totalSteps ? 'Completed!' : `Processing step ${step}...`,
      timestamp: new Date().toISOString()
    };

    stream.write(JSON.stringify(progress) + '\n');
    
    if (step < totalSteps) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  stream.close();
  return stream.response;
});
```

## WebSocket Support

Type-safe WebSocket connections with comprehensive event handling:

### Basic WebSocket Server

```typescript
const app = createApp({
  websocket: {
    maxPayloadLength: 1024 * 1024, // 1MB
    idleTimeout: 30,
    compression: true
  }
});

app.ws('/chat/:room', {
  open: (ctx) => {
    console.log(`Client connected to room: ${ctx.params.room}`);
    ctx.ws.send(JSON.stringify({
      type: 'welcome',
      message: `Welcome to room ${ctx.params.room}`
    }));
  },
  
  message: (ctx, message) => {
    console.log(`Message in ${ctx.params.room}:`, message);
    
    // Broadcast to all clients (implementation depends on your needs)
    const data = JSON.parse(message);
    ctx.ws.send(JSON.stringify({
      type: 'message',
      user: data.user,
      content: data.content,
      timestamp: Date.now()
    }));
  },
  
  close: (ctx, code, reason) => {
    console.log(`Client disconnected from ${ctx.params.room}:`, code, reason);
  },
  
  error: (ctx, error) => {
    console.error(`WebSocket error in ${ctx.params.room}:`, error);
  }
});
```

### Real-time Chat Implementation

```typescript
// In-memory storage for demo (use database in production)
const chatRooms = new Map<string, Set<WebSocket>>();

app.ws('/chat/:room', {
  open: (ctx) => {
    const room = ctx.params.room;
    
    // Add client to room
    if (!chatRooms.has(room)) {
      chatRooms.set(room, new Set());
    }
    chatRooms.get(room)!.add(ctx.ws);
    
    // Send welcome message
    ctx.ws.send(JSON.stringify({
      type: 'system',
      message: `Joined room: ${room}`,
      timestamp: Date.now()
    }));
    
    // Notify others
    const message = {
      type: 'user-joined',
      message: 'A user joined the room',
      timestamp: Date.now()
    };
    
    for (const client of chatRooms.get(room)!) {
      if (client !== ctx.ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    }
  },
  
  message: (ctx, message) => {
    const room = ctx.params.room;
    const data = JSON.parse(message);
    
    const chatMessage = {
      type: 'message',
      user: data.user || 'Anonymous',
      content: data.content,
      timestamp: Date.now()
    };
    
    // Broadcast to all clients in room
    const clients = chatRooms.get(room);
    if (clients) {
      for (const client of clients) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(chatMessage));
        }
      }
    }
  },
  
  close: (ctx) => {
    const room = ctx.params.room;
    const clients = chatRooms.get(room);
    if (clients) {
      clients.delete(ctx.ws);
      
      // Clean up empty rooms
      if (clients.size === 0) {
        chatRooms.delete(room);
      } else {
        // Notify remaining clients
        const message = {
          type: 'user-left',
          message: 'A user left the room',
          timestamp: Date.now()
        };
        
        for (const client of clients) {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(message));
          }
        }
      }
    }
  }
});
```

### WebSocket with Authentication

```typescript
app.ws('/secure/:channel', {
  open: async (ctx) => {
    // Validate authentication from query parameters or headers
    const token = ctx.query.token || ctx.headers.get('authorization');
    
    if (!token) {
      ctx.ws.close(1008, 'Authentication required');
      return;
    }
    
    try {
      const user = await validateToken(token);
      console.log(`Authenticated user ${user.id} connected to ${ctx.params.channel}`);
      
      ctx.ws.send(JSON.stringify({
        type: 'authenticated',
        user: { id: user.id, name: user.name },
        channel: ctx.params.channel
      }));
    } catch (error) {
      ctx.ws.close(1008, 'Invalid token');
    }
  },
  
  message: async (ctx, message) => {
    // Re-validate on each message if needed
    const data = JSON.parse(message);
    
    // Process authenticated message
    console.log('Secure message:', data);
    
    ctx.ws.send(JSON.stringify({
      type: 'ack',
      messageId: data.id,
      timestamp: Date.now()
    }));
  }
});
```

### Client-Side WebSocket Usage

```html
<!DOCTYPE html>
<html>
<head>
    <title>WebSocket Chat</title>
</head>
<body>
    <div id="messages"></div>
    <input type="text" id="messageInput" placeholder="Type a message...">
    <button onclick="sendMessage()">Send</button>
    
    <script>
        const ws = new WebSocket('ws://localhost:3000/chat/general');
        const messages = document.getElementById('messages');
        const messageInput = document.getElementById('messageInput');
        
        ws.onopen = function() {
            console.log('Connected to chat');
        };
        
        ws.onmessage = function(event) {
            const data = JSON.parse(event.data);
            const messageElement = document.createElement('div');
            
            if (data.type === 'message') {
                messageElement.innerHTML = `<strong>${data.user}:</strong> ${data.content}`;
            } else {
                messageElement.innerHTML = `<em>${data.message}</em>`;
            }
            
            messages.appendChild(messageElement);
            messages.scrollTop = messages.scrollHeight;
        };
        
        ws.onerror = function(error) {
            console.error('WebSocket error:', error);
        };
        
        ws.onclose = function(event) {
            console.log('Connection closed:', event.code, event.reason);
        };
        
        function sendMessage() {
            const content = messageInput.value.trim();
            if (content) {
                ws.send(JSON.stringify({
                    user: 'User' + Math.floor(Math.random() * 1000),
                    content: content
                }));
                messageInput.value = '';
            }
        }
        
        messageInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });
    </script>
</body>
</html>
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
import { createApp } from 'imphnen.js';

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
- **Streaming**: Real-time streaming responses with all streaming types
- **WebSocket**: Type-safe WebSocket implementation with chat examples

```bash
# Run specific examples
bun run examples/complete-demo.ts                    # Port 3000 - Full demo
bun run examples/basic/simple-server.ts              # Port 3001 - Basic server
bun run examples/middleware/auth-example.ts          # Port 3002 - Middleware
bun run examples/pipeline/advanced-pipeline.ts      # Port 3003 - Pipelines
bun run examples/file-upload/upload-demo.ts         # Port 3004 - File uploads
bun run examples/streaming/streaming-demo.ts        # Port 3000 - Streaming demo
bun run examples/streaming/quick-test.ts             # Port 3000 - Quick streaming test
bun run examples/websocket/ws-demo.ts                # Port 3000 - WebSocket chat demo
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
- **Streaming**: Real-time data streaming with multiple protocols
- **WebSocket**: Type-safe WebSocket connections with event handling
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
  websocket?: {                     // WebSocket configuration
    maxPayloadLength?: number;      // Max message size (bytes)
    idleTimeout?: number;           // Connection timeout (seconds)
    backpressureLimit?: number;     // Backpressure limit
    compression?: boolean;          // Enable compression
  };
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
  
  // Streaming response methods
  createStream(options?: StreamingOptions): Promise<StreamController>;
  streamResponse(generator: AsyncGenerator<string | Uint8Array>, options?: StreamingOptions): Response;
  chunkedResponse(chunks: (string | Uint8Array)[], options?: ChunkOptions): Response;
  sseResponse(generator: AsyncGenerator<any>, options?: ServerSentEventOptions): Response;
  
  // Header/status utilities
  set: {
    headers(headers: Record<string, string>): void;
    status(status: number): void;
  };
}
```

### WebSocket Context and Types

```typescript
interface WebSocketContext<TParams = Record<string, string>> {
  ws: WebSocket;                    // WebSocket connection
  params: TParams;                  // Route parameters (typed)
  query: Record<string, string>;    // Query parameters
  headers: Headers;                 // Request headers
  url: URL;                         // Request URL
}

interface WebSocketHandler<TParams = Record<string, string>> {
  open?: (ctx: WebSocketContext<TParams>) => void | Promise<void>;
  message?: (ctx: WebSocketContext<TParams>, message: string | Buffer) => void | Promise<void>;
  close?: (ctx: WebSocketContext<TParams>, code?: number, reason?: string) => void | Promise<void>;
  error?: (ctx: WebSocketContext<TParams>, error: Error) => void | Promise<void>;
}

// WebSocket route registration
app.ws<'/chat/:room'>(path, handler); // Type-safe route parameters
```

### Streaming Types and Options

```typescript
interface StreamingOptions {
  contentType?: string;             // MIME type (default: 'text/plain')
  headers?: Record<string, string>; // Additional headers
  bufferSize?: number;              // Buffer size in bytes
  flushInterval?: number;           // Auto-flush interval in ms
}

interface ChunkOptions {
  encoding?: 'utf-8' | 'base64' | 'hex'; // Text encoding
  headers?: Record<string, string>;      // Additional headers
}

interface ServerSentEventOptions {
  id?: string;                      // Event ID
  event?: string;                   // Event type
  retry?: number;                   // Reconnection time in ms
  headers?: Record<string, string>; // Additional headers
}

interface StreamController {
  response: Response;               // Stream response object
  write: (chunk: string | Uint8Array) => void;        // Write data
  writeChunk: (data: any, options?: ChunkOptions) => void;  // Write HTTP chunk
  writeSSE: (data: any, options?: ServerSentEventOptions) => void; // Write SSE event
  close: () => void;                // Close stream
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
- ✅ Real-time streaming responses with manual control, generators, and SSE
- ✅ Type-safe WebSocket support with comprehensive event handling
- ✅ Comprehensive TypeScript type definitions for all features
- ✅ Organized examples by feature with interactive clients and streaming demos
- ✅ Complete test suite with unit, integration, and performance tests
- ✅ Zero TypeScript compilation errors across all code
- ✅ Verified functionality with comprehensive test coverage including streaming
- ✅ Complete documentation in docs/ directory with guides and examples
- ✅ Security features: CORS, file validation, path traversal prevention
- ✅ Performance optimizations for file handling, streaming, and request processing
- ✅ Production deployment ready with error handling and logging
