import { createApp, type Context } from "imphnen.js";

// Create app
const app = createApp({
    port: 3000,
    development: true,
    cors: true,
});

// Redirect to facebook
app.get("/", (ctx: Context) => {
    return ctx.redirect("https://facebook.com/");
});

// Start server
await app.listen(); 