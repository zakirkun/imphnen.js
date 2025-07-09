// Quick test for streaming functionality
import { createApp, type Context } from 'imphnen.js';

const app = createApp({
  port: 3000,
  development: true
});

// Simple streaming test
app.get('/test', async (ctx: Context) => {
  const stream = await ctx.createStream({
    contentType: 'text/plain; charset=utf-8'
  });

  stream.write('Starting stream...\n');
  
  for (let i = 1; i <= 3; i++) {
    await new Promise(resolve => setTimeout(resolve, 1000));
    stream.write(`Message ${i}\n`);
  }
  
  stream.write('Stream completed!\n');
  stream.close();
  
  return stream.response;
});

// SSE test
app.get('/sse-test', async (ctx: Context) => {
  async function* eventGenerator() {
    for (let i = 1; i <= 3; i++) {
      yield { message: `Event ${i}`, timestamp: Date.now() };
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }

  return ctx.sseResponse(eventGenerator());
});

app.get('/', (ctx: Context) => {
  return ctx.html(`
    <h1>Streaming Test</h1>
    <p><a href="/test">Test basic streaming</a></p>
    <p><a href="/sse-test">Test SSE streaming</a></p>
  `);
});

console.log('🚀 Quick streaming test server starting on http://localhost:3000');
app.listen(3000); 