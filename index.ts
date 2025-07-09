#!/usr/bin/env bun

// imphnen.js - TypeScript Web Server Framework
// Main entry point for the framework

export * from './src/index.js';

// Re-export main functions for convenience
export { createApp, createEnhancedApp } from './src/index.js';

// Framework information
export const version = '1.0.0';
export const name = 'imphnen.js';

// CLI usage when run directly
if (import.meta.main) {
  console.log(`
🚀 imphnen.js v${version}
TypeScript Web Server Framework with End-to-End Type Safety

📁 Project Structure:
  src/           Framework source code
  examples/      Usage examples organized by type
  test/          Test suite (unit, integration, performance)
  index.d.ts     TypeScript definitions

📖 Examples:
  examples/complete-demo.ts     Full framework demonstration
  examples/basic/               Simple server setups
  examples/middleware/          Authentication & middleware examples
  examples/pipeline/            Advanced state composition

🧪 Testing:
  test/unit/                    Unit tests
  test/integration/             Integration tests
  test/performance/             Load testing
  test/client/                  HTTP test client

🔧 Quick Start:
  bun run examples/complete-demo.ts
  bun run examples/basic/simple-server.ts
  bun run test/client/test-client.ts

📚 Documentation:
  See README.md for detailed usage instructions
  Check examples/ for implementation patterns
  Visit test/ for testing strategies

Happy coding! 🎉
`);
} 