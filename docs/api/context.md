# Context API Reference

The Context object provides access to request data and response methods. It's passed to every route handler and middleware function.

## Context Properties

### `ctx.req: Request`

The original Web API Request object.

```typescript
app.get('/info', (ctx) => {
  const method = ctx.req.method;        // 'GET'
  const url = ctx.req.url;              // Full URL
  const userAgent = ctx.req.headers.get('user-agent');
  
  return ctx.json({ method, url, userAgent });
});
```

### `ctx.params: Record<string, string>`

Route parameters extracted from the URL path. Fully typed when using TypeScript.

```typescript
// Route: /users/:userId/posts/:postId
app.get('/users/:userId/posts/:postId', (ctx) => {
  const { userId, postId } = ctx.params;
  // TypeScript knows these are strings
  return ctx.json({ userId, postId });
});
```

### `ctx.query: Record<string, string>`

Query string parameters parsed from the URL.

```typescript
// URL: /search?q=typescript&limit=10
app.get('/search', (ctx) => {
  const { q, limit } = ctx.query;
  const results = search(q, parseInt(limit || '20'));
  return ctx.json({ results });
});
```

### `ctx.body: unknown`

Parsed request body. Type varies based on Content-Type:

```typescript
app.post('/users', async (ctx) => {
  // JSON body is automatically parsed
  const userData = ctx.body as { name: string; email: string };
  const user = await createUser(userData);
  return ctx.json(user);
});
```

### `ctx.headers: Headers`

Web API Headers object for accessing request headers.

```typescript
app.get('/protected', (ctx) => {
  const auth = ctx.headers.get('authorization');
  if (!auth) {
    return ctx.json({ error: 'Missing authorization' }, { status: 401 });
  }
  
  const contentType = ctx.headers.get('content-type');
  return ctx.json({ auth, contentType });
});
```

### `ctx.files?: UploadedFile[]`

Array of uploaded files (when multipart/form-data is used).

```typescript
app.post('/upload', async (ctx) => {
  if (!ctx.files?.length) {
    return ctx.json({ error: 'No files uploaded' }, { status: 400 });
  }
  
  for (const file of ctx.files) {
    console.log(`File: ${file.name}, Size: ${file.size}, Type: ${file.type}`);
  }
  
  return ctx.json({ uploaded: ctx.files.length });
});
```

## Response Methods

### `ctx.json<T>(data: T, init?: ResponseInit): Response`

Returns a JSON response with automatic Content-Type header.

```typescript
app.get('/users/:id', async (ctx) => {
  const user = await getUser(ctx.params.id);
  
  if (!user) {
    return ctx.json(
      { error: 'User not found' },
      { status: 404 }
    );
  }
  
  return ctx.json(user); // Status 200 by default
});
```

### `ctx.text(text: string, init?: ResponseInit): Response`

Returns a plain text response.

```typescript
app.get('/health', (ctx) => {
  return ctx.text('OK');
});

app.get('/robots.txt', (ctx) => {
  return ctx.text(
    'User-agent: *\nDisallow: /admin/',
    { headers: { 'Content-Type': 'text/plain' } }
  );
});
```

### `ctx.html(html: string, init?: ResponseInit): Response`

Returns an HTML response with proper Content-Type.

```typescript
app.get('/', (ctx) => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head><title>Welcome</title></head>
      <body><h1>Hello World!</h1></body>
    </html>
  `;
  return ctx.html(html);
});
```

### `ctx.redirect(url: string, status?: number): Response`

Returns a redirect response.

```typescript
app.get('/old-path', (ctx) => {
  return ctx.redirect('/new-path', 301); // Permanent redirect
});

app.post('/login', async (ctx) => {
  const success = await authenticate(ctx.body);
  if (success) {
    return ctx.redirect('/dashboard'); // 302 by default
  }
  return ctx.json({ error: 'Invalid credentials' }, { status: 401 });
});
```

### `ctx.file(filePath: string, options?: FileOptions): Promise<Response>`

Serves a file from the filesystem.

```typescript
interface FileOptions {
  download?: boolean;         // Force download
  filename?: string;          // Custom filename for download
}
```

```typescript
app.get('/files/:filename', async (ctx) => {
  const filepath = `./uploads/${ctx.params.filename}`;
  return await ctx.file(filepath);
});

app.get('/download/:filename', async (ctx) => {
  const filepath = `./uploads/${ctx.params.filename}`;
  return await ctx.file(filepath, {
    download: true,
    filename: `download-${ctx.params.filename}`
  });
});
```

### `ctx.proxy(target: string, options?: ProxyOptions): Promise<Response>`

Proxies the request to another server.

```typescript
interface ProxyOptions {
  target: string;                   // Target URL
  changeOrigin?: boolean;           // Change origin header
  headers?: Record<string, string>; // Additional headers
  timeout?: number;                 // Request timeout (ms)
}
```

```typescript
app.get('/api/*', (ctx) => {
  return ctx.proxy('http://backend:8080', {
    changeOrigin: true,
    headers: {
      'X-Forwarded-For': 'proxy',
      'Authorization': ctx.headers.get('authorization') || ''
    },
    timeout: 30000
  });
});
```

## Header and Status Utilities

### `ctx.set.headers(headers: Record<string, string>): void`

Sets response headers.

```typescript
app.get('/data', (ctx) => {
  ctx.set.headers({
    'Cache-Control': 'no-cache',
    'X-Custom-Header': 'value'
  });
  
  return ctx.json({ data: 'example' });
});
```

### `ctx.set.status(status: number): void`

Sets the response status code.

```typescript
app.post('/users', async (ctx) => {
  const user = await createUser(ctx.body);
  ctx.set.status(201); // Created
  return ctx.json(user);
});
```

## File Upload Interface

### `UploadedFile`

```typescript
interface UploadedFile {
  name: string;                     // Original filename
  size: number;                     // File size in bytes
  type: string;                     // MIME type
  arrayBuffer(): Promise<ArrayBuffer>;  // Get file as buffer
  text(): Promise<string>;              // Get file as text
  stream(): ReadableStream;             // Get file as stream
}
```

### File Processing Examples

```typescript
app.post('/upload/image', async (ctx) => {
  const file = ctx.files?.[0];
  if (!file) {
    return ctx.json({ error: 'No file provided' }, { status: 400 });
  }
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    return ctx.json({ error: 'Only images allowed' }, { status: 400 });
  }
  
  // Get file content
  const buffer = await file.arrayBuffer();
  const filename = `${Date.now()}-${file.name}`;
  
  // Save to filesystem
  await Bun.write(`./uploads/${filename}`, buffer);
  
  return ctx.json({
    success: true,
    filename,
    size: file.size,
    type: file.type
  });
});
```

### Multiple File Upload

```typescript
app.post('/upload/multiple', async (ctx) => {
  if (!ctx.files?.length) {
    return ctx.json({ error: 'No files provided' }, { status: 400 });
  }
  
  const results = [];
  for (const file of ctx.files) {
    const buffer = await file.arrayBuffer();
    const filename = `${Date.now()}-${file.name}`;
    await Bun.write(`./uploads/${filename}`, buffer);
    
    results.push({
      original: file.name,
      saved: filename,
      size: file.size,
      type: file.type
    });
  }
  
  return ctx.json({ files: results });
});
```

## State Management (Pipeline Context)

When using pipelines, the context includes a `state` property:

```typescript
interface ContextWithState<TState> extends Context {
  state: TState;
}
```

```typescript
const authPipeline = app.pipeline({ user: null })
  .use(async (ctx, next) => {
    const user = await authenticateUser(ctx);
    return await next({ user });
  });

app.route('GET', '/profile', authPipeline, (ctx) => {
  // ctx.state.user is available and typed
  return ctx.json({ profile: ctx.state.user });
});
```

## Request Body Handling

### JSON Bodies

```typescript
app.post('/api/data', (ctx) => {
  const data = ctx.body as { name: string; value: number };
  console.log(`Received: ${data.name} = ${data.value}`);
  return ctx.json({ success: true });
});
```

### Form Data

```typescript
app.post('/form', (ctx) => {
  // FormData is automatically parsed
  const formData = ctx.body as { username: string; password: string };
  return ctx.json({ received: formData });
});
```

### Raw Body Access

```typescript
app.post('/webhook', async (ctx) => {
  const raw = await ctx.req.text();
  const signature = ctx.headers.get('x-signature');
  
  if (validateSignature(raw, signature)) {
    processWebhook(raw);
    return ctx.text('OK');
  }
  
  return ctx.text('Unauthorized', { status: 401 });
});
```

## Advanced Usage

### Custom Response Headers

```typescript
app.get('/api/data', (ctx) => {
  return ctx.json(
    { data: 'example' },
    {
      headers: {
        'Cache-Control': 'max-age=3600',
        'X-Custom-Header': 'value'
      }
    }
  );
});
```

### Streaming Responses

```typescript
app.get('/stream', (ctx) => {
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue('data chunk 1\n');
      controller.enqueue('data chunk 2\n');
      controller.close();
    }
  });
  
  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain' }
  });
});
```

### Error Responses

```typescript
app.get('/api/data/:id', async (ctx) => {
  try {
    const data = await fetchData(ctx.params.id);
    return ctx.json(data);
  } catch (error) {
    if (error.code === 'NOT_FOUND') {
      return ctx.json(
        { error: 'Data not found' },
        { status: 404 }
      );
    }
    
    return ctx.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
``` 