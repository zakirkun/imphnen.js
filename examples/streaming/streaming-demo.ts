// Streaming Response Demo - Complete examples for all streaming types
import { createApp, type Context } from 'imphnen.js';

const app = createApp({
  port: 3000,
  development: true
});

// Example 1: Manual Streaming with createStream
app.get('/stream/manual', async (ctx: Context) => {
  const stream = await ctx.createStream({
    contentType: 'text/plain; charset=utf-8',
    headers: {
      'X-Custom-Header': 'streaming-demo'
    }
  });

  // Simulate real-time data streaming
  let counter = 0;
  const interval = setInterval(() => {
    if (counter < 10) {
      stream.write(`Chunk ${counter + 1}: ${new Date().toISOString()}\n`);
      counter++;
    } else {
      stream.write('Stream completed!\n');
      stream.close();
      clearInterval(interval);
    }
  }, 1000);

  return stream.response;
});

// Example 2: Async Generator Streaming
app.get('/stream/generator', async (ctx: Context) => {
  async function* dataGenerator() {
    for (let i = 1; i <= 5; i++) {
      yield `Generated data ${i}: ${Math.random().toFixed(4)}\n`;
      // Simulate async work
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    yield 'Generator finished!\n';
  }

  return ctx.streamResponse(dataGenerator(), {
    contentType: 'text/plain; charset=utf-8',
    headers: {
      'X-Stream-Type': 'generator'
    }
  });
});

// Example 3: Chunked Transfer Encoding
app.get('/stream/chunked', async (ctx: Context) => {
  const chunks = [
    'First chunk of data\n',
    'Second chunk with JSON: ' + JSON.stringify({ timestamp: Date.now() }) + '\n',
    'Third chunk with more info\n',
    'Final chunk - goodbye!'
  ];

  return ctx.chunkedResponse(chunks, {
    encoding: 'utf-8',
    headers: {
      'X-Transfer-Type': 'chunked'
    }
  });
});

// Example 4: Server-Sent Events (SSE)
app.get('/stream/sse', async (ctx: Context) => {
  async function* sseGenerator() {
    for (let i = 1; i <= 8; i++) {
      yield {
        id: i,
        message: `Event ${i}`,
        timestamp: new Date().toISOString(),
        data: Math.random() * 100
      };
      await new Promise(resolve => setTimeout(resolve, 1200));
    }
  }

  return ctx.sseResponse(sseGenerator(), {
    retry: 3000,
    headers: {
      'X-SSE-Demo': 'true'
    }
  });
});

// Example 5: Real-time Chat Simulation with SSE
app.get('/stream/chat-sse', async (ctx: Context) => {
  const users = ['Alice', 'Bob', 'Charlie', 'Diana'];
  const messages = [
    'Hello everyone!',
    'How is everyone doing?',
    'Great weather today',
    'Anyone up for a coffee?',
    'Sure, sounds good!',
    'What time works for everyone?',
    'How about 3 PM?',
    'Perfect!'
  ];

  async function* chatGenerator() {
    for (let i = 0; i < messages.length; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      yield {
        user,
        message: messages[i],
        timestamp: new Date().toISOString(),
        id: `msg-${i + 1}`
      };
      // Random delay between messages
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
    }
  }

  return ctx.sseResponse(chatGenerator(), {
    event: 'chat-message',
    retry: 5000
  });
});

// Example 6: Progress Streaming with JSON
app.get('/stream/progress', async (ctx: Context) => {
  const stream = await ctx.createStream({
    contentType: 'application/json',
    headers: {
      'X-Progress-Stream': 'true'
    }
  });

  // Simulate a long-running task with progress updates
  const totalSteps = 20;
  for (let step = 0; step <= totalSteps; step++) {
    const progress = {
      step,
      total: totalSteps,
      percentage: Math.round((step / totalSteps) * 100),
      message: step === totalSteps ? 'Task completed!' : `Processing step ${step}...`,
      timestamp: new Date().toISOString()
    };

    stream.write(JSON.stringify(progress) + '\n');
    
    if (step < totalSteps) {
      // Simulate work
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  stream.close();
  return stream.response;
});

// Example 7: Binary Data Streaming
app.get('/stream/binary', async (ctx: Context) => {
  const stream = await ctx.createStream({
    contentType: 'application/octet-stream',
    headers: {
      'Content-Disposition': 'attachment; filename="random-data.bin"'
    }
  });

  // Generate random binary data
  for (let i = 0; i < 100; i++) {
    const buffer = new Uint8Array(1024);
    crypto.getRandomValues(buffer);
    stream.write(buffer);
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  stream.close();
  return stream.response;
});

// Example 8: Live Log Streaming
app.get('/stream/logs', async (ctx: Context) => {
  const logLevels = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
  const services = ['api', 'database', 'cache', 'auth'];
  const operations = ['user_login', 'data_query', 'cache_miss', 'token_refresh'];

  async function* logGenerator() {
    for (let i = 0; i < 50; i++) {
      const level = logLevels[Math.floor(Math.random() * logLevels.length)];
      const service = services[Math.floor(Math.random() * services.length)];
      const operation = operations[Math.floor(Math.random() * operations.length)];
      
      const logEntry = `[${new Date().toISOString()}] ${level} ${service}: ${operation} - Request ID: ${Math.random().toString(36).substr(2, 9)}`;
      
      yield logEntry + '\n';
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }

  return ctx.streamResponse(logGenerator(), {
    contentType: 'text/plain; charset=utf-8',
    headers: {
      'X-Log-Stream': 'true'
    }
  });
});

// Demo HTML page to test all streaming endpoints
app.get('/', (ctx: Context) => {
  return ctx.html(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Imphnen.js Streaming Demo</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', roboto, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        .demo-section { margin: 20px 0; padding: 20px; border: 1px solid #ddd; border-radius: 8px; }
        .demo-section h3 { margin-top: 0; color: #333; }
        .output { background: #f5f5f5; padding: 15px; border-radius: 4px; font-family: 'Courier New', monospace; white-space: pre-wrap; max-height: 300px; overflow-y: auto; margin: 10px 0; }
        button { background: #007bff; color: white; border: none; padding: 10px 20px; border-radius: 4px; cursor: pointer; margin: 5px; }
        button:hover { background: #0056b3; }
        button:disabled { background: #ccc; cursor: not-allowed; }
    </style>
</head>
<body>
    <h1>🌊 Imphnen.js Streaming Response Demo</h1>
    <p>This demo showcases different streaming techniques available in Imphnen.js framework.</p>

    <div class="demo-section">
        <h3>1. Manual Streaming</h3>
        <p>Real-time data streaming with manual control over when data is sent.</p>
        <button onclick="testStream('/stream/manual', 'manual-output')">Start Manual Stream</button>
        <div id="manual-output" class="output"></div>
    </div>

    <div class="demo-section">
        <h3>2. Async Generator Streaming</h3>
        <p>Streaming data from an async generator function.</p>
        <button onclick="testStream('/stream/generator', 'generator-output')">Start Generator Stream</button>
        <div id="generator-output" class="output"></div>
    </div>

    <div class="demo-section">
        <h3>3. Chunked Transfer Encoding</h3>
        <p>HTTP chunked transfer encoding for efficient data transmission.</p>
        <button onclick="testStream('/stream/chunked', 'chunked-output')">Start Chunked Stream</button>
        <div id="chunked-output" class="output"></div>
    </div>

    <div class="demo-section">
        <h3>4. Server-Sent Events (SSE)</h3>
        <p>Real-time events using Server-Sent Events protocol.</p>
        <button onclick="testSSE('/stream/sse', 'sse-output')">Start SSE Stream</button>
        <div id="sse-output" class="output"></div>
    </div>

    <div class="demo-section">
        <h3>5. Chat Simulation (SSE)</h3>
        <p>Simulated real-time chat using Server-Sent Events.</p>
        <button onclick="testSSE('/stream/chat-sse', 'chat-output')">Start Chat Stream</button>
        <div id="chat-output" class="output"></div>
    </div>

    <div class="demo-section">
        <h3>6. Progress Streaming</h3>
        <p>Task progress updates via JSON streaming.</p>
        <button onclick="testStream('/stream/progress', 'progress-output')">Start Progress Stream</button>
        <div id="progress-output" class="output"></div>
    </div>

    <div class="demo-section">
        <h3>7. Log Streaming</h3>
        <p>Live log streaming simulation.</p>
        <button onclick="testStream('/stream/logs', 'logs-output')">Start Log Stream</button>
        <div id="logs-output" class="output"></div>
    </div>

    <script>
        async function testStream(url, outputId) {
            const output = document.getElementById(outputId);
            const button = document.querySelector(\`button[onclick*="\${outputId}"]\`);
            
            output.textContent = '';
            button.disabled = true;
            button.textContent = 'Streaming...';
            
            try {
                const response = await fetch(url);
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                
                let done = false;
                while (!done) {
                    const { value, done: readerDone } = await reader.read();
                    done = readerDone;
                    
                    if (value) {
                        const chunk = decoder.decode(value, { stream: true });
                        output.textContent += chunk;
                        output.scrollTop = output.scrollHeight;
                    }
                }
            } catch (error) {
                output.textContent += \`Error: \${error.message}\`;
            } finally {
                button.disabled = false;
                button.textContent = button.textContent.replace('Streaming...', 'Start Stream').replace('Start Stream Stream', 'Start Stream');
            }
        }
        
        function testSSE(url, outputId) {
            const output = document.getElementById(outputId);
            const button = document.querySelector(\`button[onclick*="\${outputId}"]\`);
            
            output.textContent = '';
            button.disabled = true;
            button.textContent = 'Streaming...';
            
            const eventSource = new EventSource(url);
            
            eventSource.onmessage = function(event) {
                try {
                    const data = JSON.parse(event.data);
                    output.textContent += \`[\${new Date().toLocaleTimeString()}] \${JSON.stringify(data, null, 2)}\\n\`;
                } catch {
                    output.textContent += \`[\${new Date().toLocaleTimeString()}] \${event.data}\\n\`;
                }
                output.scrollTop = output.scrollHeight;
            };
            
            eventSource.addEventListener('chat-message', function(event) {
                const data = JSON.parse(event.data);
                output.textContent += \`[\${data.timestamp}] \${data.user}: \${data.message}\\n\`;
                output.scrollTop = output.scrollHeight;
            });
            
            eventSource.onerror = function() {
                button.disabled = false;
                button.textContent = button.textContent.replace('Streaming...', 'Start SSE Stream');
                eventSource.close();
            };
            
            // Auto-close after stream ends
            setTimeout(() => {
                if (eventSource.readyState !== EventSource.CLOSED) {
                    eventSource.close();
                    button.disabled = false;
                    button.textContent = button.textContent.replace('Streaming...', 'Start SSE Stream');
                }
            }, 30000);
        }
    </script>
</body>
</html>
  `);
});

// Start the server
console.log('🌊 Streaming Demo Server starting...');
console.log('📡 Available endpoints:');
console.log('  • GET / - Demo page with all streaming examples');
console.log('  • GET /stream/manual - Manual streaming control');
console.log('  • GET /stream/generator - Async generator streaming');
console.log('  • GET /stream/chunked - Chunked transfer encoding');
console.log('  • GET /stream/sse - Server-Sent Events');
console.log('  • GET /stream/chat-sse - Chat simulation with SSE');
console.log('  • GET /stream/progress - Progress streaming');
console.log('  • GET /stream/binary - Binary data streaming');
console.log('  • GET /stream/logs - Live log streaming');

app.listen(3000); 