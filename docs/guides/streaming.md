# Streaming Responses

Imphnen.js provides comprehensive support for streaming responses, enabling real-time data transmission, chunked transfers, and Server-Sent Events (SSE). This guide covers all streaming capabilities available in the framework.

## Table of Contents

- [Overview](#overview)
- [Types of Streaming](#types-of-streaming)
- [Manual Streaming](#manual-streaming)
- [Async Generator Streaming](#async-generator-streaming)
- [Chunked Transfer Encoding](#chunked-transfer-encoding)
- [Server-Sent Events (SSE)](#server-sent-events-sse)
- [Configuration Options](#configuration-options)
- [Best Practices](#best-practices)
- [Examples](#examples)
- [Testing](#testing)

## Overview

Streaming responses allow you to send data to clients incrementally rather than waiting for the complete response. This is particularly useful for:

- **Real-time data feeds** - Live updates, notifications, logs
- **Large file transfers** - Progressive downloads with status updates
- **Server-Sent Events** - Browser-compatible real-time communication
- **Progressive rendering** - UI updates as data becomes available
- **Long-running operations** - Task progress, processing status

## Types of Streaming

Imphnen.js supports four main types of streaming:

1. **Manual Streaming** - Full control over when and what data to send
2. **Generator Streaming** - Async generator-based streaming
3. **Chunked Transfer** - HTTP chunked encoding for efficient transmission
4. **Server-Sent Events** - Browser-compatible event streaming

## Manual Streaming

Manual streaming gives you complete control over the streaming process through the `createStream` method.

### Basic Usage

```typescript
import { createApp } from 'imphnen.js';

const app = createApp();

app.get('/stream/manual', async (ctx) => {
  const stream = await ctx.createStream({
    contentType: 'text/plain; charset=utf-8',
    headers: {
      'X-Stream-Type': 'manual'
    }
  });

  // Send data incrementally
  stream.write('Starting process...\n');
  
  for (let i = 1; i <= 5; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    stream.write(`Step ${i} completed\n`);
  }
  
  stream.write('Process finished!\n');
  stream.close();
  
  return stream.response;
});
```

### Stream Control Methods

```typescript
const stream = await ctx.createStream(options);

// Write text or binary data
stream.write('Text data\n');
stream.write(new Uint8Array([1, 2, 3, 4]));

// Write chunked data (HTTP chunked encoding)
stream.writeChunk({ status: 'processing', progress: 50 });

// Write Server-Sent Events
stream.writeSSE({ message: 'Hello', timestamp: Date.now() }, {
  event: 'notification',
  id: 'msg-1'
});

// Close the stream
stream.close();
```

## Async Generator Streaming

Stream data from async generator functions for clean, functional streaming patterns.

### Basic Generator Streaming

```typescript
app.get('/stream/generator', async (ctx) => {
  async function* dataGenerator() {
    for (let i = 1; i <= 10; i++) {
      yield `Data chunk ${i}: ${Math.random().toFixed(4)}\n`;
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    yield 'Stream completed!\n';
  }

  return ctx.streamResponse(dataGenerator(), {
    contentType: 'text/plain; charset=utf-8',
    headers: {
      'X-Generated-Stream': 'true'
    }
  });
});
```

### Binary Generator Streaming

```typescript
app.get('/stream/binary-generator', async (ctx) => {
  async function* binaryGenerator() {
    for (let i = 0; i < 5; i++) {
      const buffer = new Uint8Array(1024);
      crypto.getRandomValues(buffer);
      yield buffer;
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return ctx.streamResponse(binaryGenerator(), {
    contentType: 'application/octet-stream',
    headers: {
      'Content-Disposition': 'attachment; filename="data.bin"'
    }
  });
});
```

## Chunked Transfer Encoding

Use HTTP chunked transfer encoding for efficient data transmission.

### Array-Based Chunking

```typescript
app.get('/stream/chunked', async (ctx) => {
  const chunks = [
    'First chunk of data',
    { message: 'JSON data chunk', timestamp: Date.now() },
    'Final text chunk'
  ];

  return ctx.chunkedResponse(chunks, {
    encoding: 'utf-8',
    headers: {
      'X-Transfer-Type': 'chunked'
    }
  });
});
```

### Manual Chunked Streaming

```typescript
app.get('/stream/manual-chunks', async (ctx) => {
  const stream = await ctx.createStream({
    contentType: 'application/json'
  });

  // Process data in chunks
  const data = Array.from({ length: 100 }, (_, i) => ({ id: i, value: Math.random() }));
  const chunkSize = 10;

  for (let i = 0; i < data.length; i += chunkSize) {
    const chunk = data.slice(i, i + chunkSize);
    stream.writeChunk({
      chunk: i / chunkSize + 1,
      total: Math.ceil(data.length / chunkSize),
      data: chunk
    });
    
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  stream.close();
  return stream.response;
});
```

## Server-Sent Events (SSE)

Browser-compatible real-time event streaming using the EventSource API.

### Basic SSE

```typescript
app.get('/stream/sse', async (ctx) => {
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
    retry: 3000, // Reconnection time in milliseconds
    headers: {
      'X-SSE-Stream': 'events'
    }
  });
});
```

### Custom SSE Events

```typescript
app.get('/stream/custom-sse', async (ctx) => {
  const stream = await ctx.createStream({
    contentType: 'text/event-stream',
    headers: {
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    }
  });

  // Send different event types
  stream.writeSSE({ status: 'connected' }, {
    event: 'connection',
    id: 'conn-1'
  });

  stream.writeSSE({ message: 'Hello from server!' }, {
    event: 'greeting',
    id: 'msg-1'
  });

  stream.writeSSE({ progress: 100, status: 'complete' }, {
    event: 'progress',
    id: 'prog-1'
  });

  // Close after 10 seconds
  setTimeout(() => {
    stream.writeSSE({ status: 'disconnected' }, {
      event: 'connection',
      id: 'conn-2'
    });
    stream.close();
  }, 10000);

  return stream.response;
});
```

### Client-Side SSE

```html
<!DOCTYPE html>
<html>
<head>
    <title>SSE Client</title>
</head>
<body>
    <div id="messages"></div>
    
    <script>
        const eventSource = new EventSource('/stream/sse');
        const messages = document.getElementById('messages');
        
        eventSource.onmessage = function(event) {
            const data = JSON.parse(event.data);
            messages.innerHTML += `<p>Default: ${JSON.stringify(data)}</p>`;
        };
        
        eventSource.addEventListener('greeting', function(event) {
            const data = JSON.parse(event.data);
            messages.innerHTML += `<p>Greeting: ${data.message}</p>`;
        });
        
        eventSource.addEventListener('progress', function(event) {
            const data = JSON.parse(event.data);
            messages.innerHTML += `<p>Progress: ${data.progress}% - ${data.status}</p>`;
        });
        
        eventSource.onerror = function(event) {
            console.error('SSE error:', event);
        };
    </script>
</body>
</html>
```

## Configuration Options

### StreamingOptions

```typescript
interface StreamingOptions {
  contentType?: string;          // MIME type (default: 'text/plain')
  headers?: Record<string, string>; // Additional headers
  bufferSize?: number;           // Buffer size in bytes
  flushInterval?: number;        // Auto-flush interval in ms
}
```

### ChunkOptions

```typescript
interface ChunkOptions {
  encoding?: 'utf-8' | 'base64' | 'hex'; // Text encoding
  headers?: Record<string, string>;      // Additional headers
}
```

### ServerSentEventOptions

```typescript
interface ServerSentEventOptions {
  id?: string;                   // Event ID
  event?: string;                // Event type
  retry?: number;                // Reconnection time in ms
  headers?: Record<string, string>; // Additional headers
}
```

## Best Practices

### 1. Error Handling

Always implement proper error handling for streaming operations:

```typescript
app.get('/stream/safe', async (ctx) => {
  const stream = await ctx.createStream();
  
  try {
    for (let i = 0; i < 10; i++) {
      if (/* some condition */) {
        throw new Error('Processing failed');
      }
      stream.write(`Data ${i}\n`);
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    stream.close();
  } catch (error) {
    stream.write(`Error: ${error.message}\n`);
    stream.close();
  }
  
  return stream.response;
});
```

### 2. Memory Management

For large streams, consider buffering and flow control:

```typescript
app.get('/stream/large-data', async (ctx) => {
  const stream = await ctx.createStream({
    bufferSize: 64 * 1024 // 64KB buffer
  });

  // Process large dataset in chunks
  const batchSize = 1000;
  let offset = 0;
  
  while (offset < totalRecords) {
    const batch = await fetchDataBatch(offset, batchSize);
    
    for (const record of batch) {
      stream.write(JSON.stringify(record) + '\n');
    }
    
    offset += batchSize;
    
    // Allow other operations to run
    await new Promise(resolve => setImmediate(resolve));
  }
  
  stream.close();
  return stream.response;
});
```

### 3. Client Disconnection

Handle client disconnections gracefully:

```typescript
app.get('/stream/resilient', async (ctx) => {
  const stream = await ctx.createStream();
  let isActive = true;
  
  // Cleanup function
  const cleanup = () => {
    isActive = false;
    stream.close();
  };

  // Monitor stream state (if supported by runtime)
  ctx.req.signal?.addEventListener('abort', cleanup);
  
  try {
    while (isActive) {
      stream.write(`Heartbeat: ${Date.now()}\n`);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  } catch (error) {
    console.error('Stream error:', error);
  } finally {
    cleanup();
  }
  
  return stream.response;
});
```

### 4. Performance Optimization

Optimize streaming performance:

```typescript
app.get('/stream/optimized', async (ctx) => {
  const stream = await ctx.createStream({
    contentType: 'application/json',
    bufferSize: 128 * 1024, // Larger buffer for better performance
    flushInterval: 100       // Auto-flush every 100ms
  });

  // Use efficient serialization
  const encoder = new TextEncoder();
  
  for (const item of largeDataSet) {
    // Pre-encode for better performance
    const jsonString = JSON.stringify(item) + '\n';
    const encoded = encoder.encode(jsonString);
    stream.write(encoded);
    
    // Yield control periodically
    if (counter % 100 === 0) {
      await new Promise(resolve => setImmediate(resolve));
    }
  }
  
  stream.close();
  return stream.response;
});
```

## Examples

### Real-time Chat

```typescript
// In-memory chat rooms (for demo purposes)
const chatRooms = new Map<string, Set<WritableStreamDefaultWriter>>();

app.get('/chat/:room', async (ctx) => {
  const room = ctx.params.room;
  const stream = await ctx.createStream({
    contentType: 'text/event-stream'
  });

  // Add client to room
  if (!chatRooms.has(room)) {
    chatRooms.set(room, new Set());
  }
  chatRooms.get(room)!.add(stream);

  // Send welcome message
  stream.writeSSE({
    type: 'welcome',
    message: `Welcome to room ${room}`,
    timestamp: Date.now()
  }, { event: 'message' });

  // Cleanup on disconnect
  ctx.req.signal?.addEventListener('abort', () => {
    chatRooms.get(room)?.delete(stream);
    stream.close();
  });

  return stream.response;
});

app.post('/chat/:room/send', async (ctx) => {
  const room = ctx.params.room;
  const { message, user } = ctx.body as { message: string; user: string };
  
  const chatMessage = {
    user,
    message,
    timestamp: Date.now(),
    room
  };

  // Broadcast to all clients in room
  const clients = chatRooms.get(room);
  if (clients) {
    for (const client of clients) {
      try {
        client.writeSSE(chatMessage, { event: 'message' });
      } catch (error) {
        // Remove disconnected clients
        clients.delete(client);
      }
    }
  }

  return ctx.json({ success: true });
});
```

### Progress Tracking

```typescript
app.get('/task/:id/progress', async (ctx) => {
  const taskId = ctx.params.id;
  
  return ctx.sseResponse(trackTaskProgress(taskId), {
    event: 'progress',
    retry: 1000
  });
});

async function* trackTaskProgress(taskId: string) {
  const totalSteps = 10;
  
  for (let step = 0; step <= totalSteps; step++) {
    yield {
      taskId,
      step,
      total: totalSteps,
      percentage: Math.round((step / totalSteps) * 100),
      message: step === totalSteps ? 'Completed!' : `Processing step ${step}...`,
      timestamp: Date.now()
    };
    
    if (step < totalSteps) {
      await simulateWork(); // Your actual work here
    }
  }
}

async function simulateWork() {
  await new Promise(resolve => setTimeout(resolve, 1000));
}
```

### Log Streaming

```typescript
app.get('/logs/live', async (ctx) => {
  const stream = await ctx.createStream({
    contentType: 'text/plain; charset=utf-8'
  });

  // Watch log file or connect to log source
  const logWatcher = watchLogFile('/var/log/app.log');
  
  logWatcher.on('line', (line) => {
    stream.write(line + '\n');
  });

  logWatcher.on('error', (error) => {
    stream.write(`[ERROR] Log watcher error: ${error.message}\n`);
    stream.close();
  });

  // Cleanup
  ctx.req.signal?.addEventListener('abort', () => {
    logWatcher.stop();
    stream.close();
  });

  return stream.response;
});
```

## Testing

### Testing Streaming Endpoints

```typescript
// test/streaming.test.ts
import { describe, it, expect } from 'bun:test';
import { createApp } from 'imphnen.js';

describe('Streaming', () => {
  const app = createApp();
  
  app.get('/test-stream', async (ctx) => {
    const stream = await ctx.createStream();
    stream.write('chunk1\n');
    stream.write('chunk2\n');
    stream.close();
    return stream.response;
  });

  it('should stream data correctly', async () => {
    const response = await app.handler(new Request('http://localhost/test-stream'));
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    
    let result = '';
    let done = false;
    
    while (!done) {
      const { value, done: readerDone } = await reader.read();
      done = readerDone;
      
      if (value) {
        result += decoder.decode(value, { stream: true });
      }
    }
    
    expect(result).toBe('chunk1\nchunk2\n');
  });

  it('should handle SSE correctly', async () => {
    app.get('/test-sse', async (ctx) => {
      return ctx.sseResponse(async function* () {
        yield { message: 'test1' };
        yield { message: 'test2' };
      }());
    });

    const response = await app.handler(new Request('http://localhost/test-sse'));
    expect(response.headers.get('content-type')).toBe('text/event-stream');
  });
});
```

### Load Testing

```bash
# Using curl for basic streaming tests
curl -N http://localhost:3000/stream/manual

# Using siege for load testing
siege -c 10 -t 30s http://localhost:3000/stream/sse

# Using wrk for performance testing
wrk -t12 -c400 -d30s http://localhost:3000/stream/generator
```

### Browser Testing

```html
<!DOCTYPE html>
<html>
<head>
    <title>Streaming Test</title>
</head>
<body>
    <button onclick="testStreaming()">Test Streaming</button>
    <button onclick="testSSE()">Test SSE</button>
    <pre id="output"></pre>
    
    <script>
        async function testStreaming() {
            const output = document.getElementById('output');
            output.textContent = '';
            
            const response = await fetch('/stream/manual');
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                output.textContent += decoder.decode(value);
            }
        }
        
        function testSSE() {
            const output = document.getElementById('output');
            output.textContent = '';
            
            const eventSource = new EventSource('/stream/sse');
            
            eventSource.onmessage = function(event) {
                output.textContent += event.data + '\n';
            };
            
            eventSource.onerror = function() {
                eventSource.close();
            };
        }
    </script>
</body>
</html>
```

## Conclusion

Imphnen.js provides powerful and flexible streaming capabilities that enable real-time communication, efficient data transfer, and progressive user experiences. Choose the appropriate streaming method based on your use case:

- **Manual streaming** for maximum control
- **Generator streaming** for functional, async patterns
- **Chunked responses** for efficient HTTP transfers
- **Server-Sent Events** for browser-compatible real-time updates

Remember to implement proper error handling, consider memory usage for large streams, and test your streaming endpoints thoroughly in various scenarios. 