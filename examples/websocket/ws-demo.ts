// WebSocket Demo for imphnen.js
// Example showing real-time chat functionality

import { createApp, type Context } from 'imphnen.js';

const app = createApp({
  port: 3000,
  websocket: {
    maxPayloadLength: 1024 * 1024, // 1MB
    idleTimeout: 120, // 2 minutes
    backpressureLimit: 64 * 1024, // 64KB
  }
});

// Store connected clients (in production, use Redis or database)
const connectedClients = new Set<any>();

// WebSocket chat endpoint
app.ws('/chat', {
  open: (ctx) => {
    console.log('Client connected to chat');
    connectedClients.add(ctx.ws);
    
    // Send welcome message
    ctx.ws.send(JSON.stringify({
      type: 'welcome',
      message: 'Welcome to the chat room!',
      timestamp: new Date().toISOString()
    }));
    
    // Notify other clients
    broadcastToOthers(ctx.ws, {
      type: 'user_joined',
      message: 'A user joined the chat',
      timestamp: new Date().toISOString()
    });
  },
  
  message: (ctx, message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('Received message:', data);
      
      // Broadcast message to all clients
      const broadcastData = {
        type: 'message',
        content: data.content,
        user: data.user || 'Anonymous',
        timestamp: new Date().toISOString()
      };
      
      broadcastToAll(broadcastData);
    } catch (error) {
      console.error('Error parsing message:', error);
      ctx.ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  },
  
  close: (ctx) => {
    console.log('Client disconnected from chat');
    connectedClients.delete(ctx.ws);
    
    // Notify other clients
    broadcastToOthers(ctx.ws, {
      type: 'user_left',
      message: 'A user left the chat',
      timestamp: new Date().toISOString()
    });
  },
  
  error: (ctx, error) => {
    console.error('WebSocket error:', error);
    connectedClients.delete(ctx.ws);
  }
});

// WebSocket room with parameters
app.ws('/room/:roomId', {
  open: (ctx) => {
    const { roomId } = ctx.params;
    console.log(`Client joined room: ${roomId}`);
    
    ctx.ws.send(JSON.stringify({
      type: 'room_joined',
      roomId,
      message: `Welcome to room ${roomId}!`,
      timestamp: new Date().toISOString()
    }));
  },
  
  message: (ctx, message) => {
    const { roomId } = ctx.params;
    const data = JSON.parse(message.toString());
    
    console.log(`Message in room ${roomId}:`, data);
    
    // In a real app, you'd filter by room
    broadcastToAll({
      type: 'room_message',
      roomId,
      content: data.content,
      user: data.user || 'Anonymous',
      timestamp: new Date().toISOString()
    });
  }
});

// Helper functions
function broadcastToAll(data: any) {
  const message = JSON.stringify(data);
  connectedClients.forEach(client => {
    try {
      client.send(message);
    } catch (error) {
      console.error('Error sending message to client:', error);
      connectedClients.delete(client);
    }
  });
}

function broadcastToOthers(sender: any, data: any) {
  const message = JSON.stringify(data);
  connectedClients.forEach(client => {
    if (client !== sender) {
      try {
        client.send(message);
      } catch (error) {
        console.error('Error sending message to client:', error);
        connectedClients.delete(client);
      }
    }
  });
}

// Static HTML page for testing
app.get('/', (ctx: Context) => {
  return ctx.html(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>WebSocket Chat Demo</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        #messages { border: 1px solid #ccc; height: 300px; overflow-y: scroll; padding: 10px; margin: 10px 0; }
        .message { margin: 5px 0; }
        .welcome { color: green; }
        .user_joined, .user_left { color: blue; font-style: italic; }
        .error { color: red; }
        input[type="text"] { width: 70%; padding: 5px; }
        button { padding: 5px 10px; }
      </style>
    </head>
    <body>
      <h1>WebSocket Chat Demo</h1>
      <div id="messages"></div>
      <div>
        <input type="text" id="messageInput" placeholder="Type your message..." />
        <button onclick="sendMessage()">Send</button>
      </div>
      <div>
        <input type="text" id="usernameInput" placeholder="Username" value="User" />
      </div>
      
      <script>
        const ws = new WebSocket('ws://localhost:3000/chat');
        const messages = document.getElementById('messages');
        
        ws.onopen = function() {
          addMessage('Connected to chat!', 'welcome');
        };
        
        ws.onmessage = function(event) {
          const data = JSON.parse(event.data);
          let messageText = '';
          
          switch(data.type) {
            case 'welcome':
            case 'message':
              messageText = \`[\${data.timestamp}] \${data.user || 'System'}: \${data.message || data.content}\`;
              break;
            case 'user_joined':
            case 'user_left':
              messageText = \`[\${data.timestamp}] \${data.message}\`;
              break;
            case 'error':
              messageText = \`Error: \${data.message}\`;
              break;
          }
          
          addMessage(messageText, data.type);
        };
        
        ws.onclose = function() {
          addMessage('Disconnected from chat', 'error');
        };
        
        function addMessage(text, type) {
          const div = document.createElement('div');
          div.textContent = text;
          div.className = 'message ' + type;
          messages.appendChild(div);
          messages.scrollTop = messages.scrollHeight;
        }
        
        function sendMessage() {
          const input = document.getElementById('messageInput');
          const username = document.getElementById('usernameInput').value;
          const message = input.value.trim();
          
          if (message) {
            ws.send(JSON.stringify({
              content: message,
              user: username
            }));
            input.value = '';
          }
        }
        
        document.getElementById('messageInput').addEventListener('keypress', function(e) {
          if (e.key === 'Enter') {
            sendMessage();
          }
        });
      </script>
    </body>
    </html>
  `);
});

// Start server
app.listen(3000).then(() => {
  console.log('🔌 WebSocket chat demo running!');
  console.log('🌐 Open http://localhost:3000 to test');
}); 