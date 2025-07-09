# WebSocket Support

Imphnen.js provides built-in WebSocket support for real-time communication, built on top of Bun's optimized WebSocket implementation.

## Quick Start

```typescript
import { createApp } from 'imphnen.js';

const app = createApp({
  websocket: {
    maxPayloadLength: 1024 * 1024, // 1MB
    idleTimeout: 120, // 2 minutes
    backpressureLimit: 64 * 1024, // 64KB
  }
});

// Basic WebSocket endpoint
app.ws('/chat', {
  open: (ctx) => {
    console.log('Client connected');
    ctx.ws.send('Welcome!');
  },
  
  message: (ctx, message) => {
    console.log('Received:', message.toString());
    ctx.ws.send(`Echo: ${message}`);
  },
  
  close: (ctx) => {
    console.log('Client disconnected');
  }
});

app.listen(3000);
```

## WebSocket Configuration

Configure WebSocket behavior through the `websocket` option:

```typescript
const app = createApp({
  websocket: {
    maxPayloadLength: 16 * 1024 * 1024, // 16MB max message size
    idleTimeout: 300, // 5 minutes before idle timeout
    backpressureLimit: 128 * 1024, // 128KB backpressure limit
  }
});
```

### Configuration Options

- **`maxPayloadLength`**: Maximum size for incoming messages (default: 16MB)
- **`idleTimeout`**: Seconds before closing idle connections (default: 120)
- **`backpressureLimit`**: Backpressure limit in bytes (default: 64KB)

## WebSocket Handler

The WebSocket handler object supports four optional event handlers:

```typescript
app.ws('/path', {
  open?: (ctx) => void | Promise<void>;
  message?: (ctx, message) => void | Promise<void>;
  close?: (ctx, code?, reason?) => void | Promise<void>;
  error?: (ctx, error) => void | Promise<void>;
});
```

### Handler Parameters

- **`ctx`**: WebSocket context with `ws`, `params`, `query`, `headers`, and `url`
- **`message`**: Incoming message as `string` or `Buffer`
- **`code`**: Close code (optional)
- **`reason`**: Close reason (optional)
- **`error`**: Error object

## Route Parameters

WebSocket routes support the same parameter extraction as HTTP routes:

```typescript
// Route with parameters
app.ws('/room/:roomId', {
  open: (ctx) => {
    const { roomId } = ctx.params; // Type-safe parameter
    console.log(`Joined room: ${roomId}`);
  },
  
  message: (ctx, message) => {
    const { roomId } = ctx.params;
    // Handle room-specific message
  }
});

// Optional parameters
app.ws('/chat/:userId?', {
  open: (ctx) => {
    const { userId } = ctx.params; // Can be undefined
    if (userId) {
      console.log(`User ${userId} connected`);
    }
  }
});
```

## Query Parameters

Access query parameters from the WebSocket connection URL:

```typescript
app.ws('/connect', {
  open: (ctx) => {
    const { token, username } = ctx.query;
    if (!token) {
      ctx.ws.close(4001, 'Authentication required');
      return;
    }
    console.log(`${username} authenticated with token`);
  }
});

// Connect with: ws://localhost:3000/connect?token=abc123&username=alice
```

## WebSocket Context

The WebSocket context provides access to connection details:

```typescript
interface WebSocketContext<TParams = {}> {
  ws: WebSocket;              // WebSocket instance
  params: TParams;            // Route parameters
  query: Record<string, string>; // Query parameters  
  headers: Headers;           // Connection headers
  url: URL;                   // Full connection URL
}
```

### WebSocket Instance Methods

```typescript
app.ws('/api', {
  message: (ctx, message) => {
    // Send text message
    ctx.ws.send('Hello client!');
    
    // Send JSON data
    ctx.ws.send(JSON.stringify({ type: 'response', data: {} }));
    
    // Close connection
    ctx.ws.close(1000, 'Normal closure');
    
    // Check connection state
    if (ctx.ws.readyState === WebSocket.OPEN) {
      ctx.ws.send('Connection is open');
    }
  }
});
```

## Real-Time Chat Example

Here's a complete chat application example:

```typescript
import { createApp } from 'imphnen.js';

const app = createApp({ websocket: {} });
const clients = new Set<WebSocket>();

app.ws('/chat', {
  open: (ctx) => {
    clients.add(ctx.ws);
    broadcast({ type: 'user_joined', count: clients.size });
  },
  
  message: (ctx, message) => {
    const data = JSON.parse(message.toString());
    broadcast({
      type: 'message',
      user: data.user,
      content: data.content,
      timestamp: new Date().toISOString()
    });
  },
  
  close: (ctx) => {
    clients.delete(ctx.ws);
    broadcast({ type: 'user_left', count: clients.size });
  },
  
  error: (ctx, error) => {
    console.error('WebSocket error:', error);
    clients.delete(ctx.ws);
  }
});

function broadcast(data: any) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// Serve chat client
app.get('/', (ctx) => {
  return ctx.html(`
    <!DOCTYPE html>
    <html>
    <body>
      <div id="messages"></div>
      <input type="text" id="input" placeholder="Type message..." />
      <script>
        const ws = new WebSocket('ws://localhost:3000/chat');
        const messages = document.getElementById('messages');
        const input = document.getElementById('input');
        
        ws.onmessage = (event) => {
          const data = JSON.parse(event.data);
          const div = document.createElement('div');
          div.textContent = \`[\${data.timestamp}] \${data.user}: \${data.content}\`;
          messages.appendChild(div);
        };
        
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter' && input.value) {
            ws.send(JSON.stringify({
              user: 'User',
              content: input.value
            }));
            input.value = '';
          }
        });
      </script>
    </body>
    </html>
  `);
});

app.listen(3000);
```

## Best Practices

### Connection Management

```typescript
const connections = new Map<string, WebSocket>();

app.ws('/user/:userId', {
  open: (ctx) => {
    const { userId } = ctx.params;
    
    // Close existing connection for this user
    const existing = connections.get(userId);
    if (existing) {
      existing.close(4000, 'New session started');
    }
    
    connections.set(userId, ctx.ws);
  },
  
  close: (ctx) => {
    const { userId } = ctx.params;
    connections.delete(userId);
  }
});
```

### Message Validation

```typescript
app.ws('/api', {
  message: (ctx, message) => {
    try {
      const data = JSON.parse(message.toString());
      
      // Validate message structure
      if (!data.type || !data.payload) {
        ctx.ws.send(JSON.stringify({
          error: 'Invalid message format'
        }));
        return;
      }
      
      // Handle valid message
      handleMessage(data);
      
    } catch (error) {
      ctx.ws.close(4002, 'Invalid JSON');
    }
  }
});
```

### Rate Limiting

```typescript
const rateLimits = new Map<string, number[]>();

app.ws('/limited', {
  message: (ctx, message) => {
    const clientId = ctx.headers.get('x-client-id') || 'anonymous';
    const now = Date.now();
    
    // Get client's message timestamps
    const timestamps = rateLimits.get(clientId) || [];
    
    // Remove old timestamps (older than 1 minute)
    const recent = timestamps.filter(time => now - time < 60000);
    
    // Check rate limit (max 10 messages per minute)
    if (recent.length >= 10) {
      ctx.ws.close(4003, 'Rate limit exceeded');
      return;
    }
    
    // Add current timestamp
    recent.push(now);
    rateLimits.set(clientId, recent);
    
    // Process message
    handleMessage(message);
  }
});
```

### Error Handling

```typescript
app.ws('/robust', {
  message: async (ctx, message) => {
    try {
      await processMessage(message);
    } catch (error) {
      console.error('Message processing error:', error);
      
      // Send error to client
      ctx.ws.send(JSON.stringify({
        type: 'error',
        message: 'Failed to process message'
      }));
    }
  },
  
  error: (ctx, error) => {
    console.error('WebSocket error:', error);
    
    // Optionally notify monitoring service
    notifyErrorService(error);
    
    // Clean up resources
    cleanupClient(ctx);
  }
});
```

## Testing WebSocket Endpoints

### Using Bun's Test Runner

```typescript
import { test, expect } from 'bun:test';
import { createApp } from 'imphnen.js';

test('WebSocket echo', async () => {
  const app = createApp({ websocket: {} });
  
  app.ws('/echo', {
    message: (ctx, message) => {
      ctx.ws.send(`Echo: ${message}`);
    }
  });
  
  // Start server in test
  const server = await app.listen(0); // Use random port
  
  // Connect WebSocket client
  const ws = new WebSocket('ws://localhost:3000/echo');
  
  await new Promise((resolve) => {
    ws.onopen = () => {
      ws.send('Hello!');
    };
    
    ws.onmessage = (event) => {
      expect(event.data).toBe('Echo: Hello!');
      ws.close();
      resolve(undefined);
    };
  });
});
```

## Integration with HTTP Routes

Combine WebSocket and HTTP endpoints for complete APIs:

```typescript
// HTTP API for chat history
app.get('/api/messages/:roomId', async (ctx) => {
  const { roomId } = ctx.params;
  const messages = await getChatHistory(roomId);
  return ctx.json(messages);
});

// WebSocket for real-time messages
app.ws('/chat/:roomId', {
  open: (ctx) => {
    const { roomId } = ctx.params;
    joinRoom(roomId, ctx.ws);
  },
  
  message: (ctx, message) => {
    const { roomId } = ctx.params;
    const data = JSON.parse(message.toString());
    
    // Save to database
    saveChatMessage(roomId, data);
    
    // Broadcast to room
    broadcastToRoom(roomId, data);
  }
});
```

WebSocket support in imphnen.js provides a powerful foundation for building real-time applications with type safety and excellent performance. 