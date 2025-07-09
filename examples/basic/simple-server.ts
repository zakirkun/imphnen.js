// Basic Example - Simple server setup
import { createApp, type Context } from 'imphnen.js';

const app = createApp();

app.get('/', (ctx: Context) => {
  return ctx.text('Hello from imphnen.js!');
});

app.get('/json', (ctx: Context) => {
  return ctx.json({ message: 'Hello JSON!' });
});

app.get('/users/:id', (ctx: Context<{ id: string }>) => {
  return ctx.json({ 
    id: ctx.params.id,
    name: `User ${ctx.params.id}` 
  });
});

console.log('🚀 Basic server running on http://localhost:3001');
await app.listen(3001); 