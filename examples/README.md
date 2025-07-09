# Examples

This directory contains usage examples for the imphnen.js framework, organized by implementation type.

## Structure

```
examples/
├── complete-demo.ts          # Full framework demonstration
├── basic/                    # Simple server examples
│   └── simple-server.ts      # Basic routing and responses
├── middleware/               # Middleware examples  
│   └── auth-example.ts       # Authentication & logging
├── pipeline/                 # Advanced pipeline examples
│   └── advanced-pipeline.ts  # State composition & transformation
└── README.md                 # This file
```

## Running Examples

Each example is a standalone server that can be run directly:

```bash
# Complete demo with all features
bun run examples/complete-demo.ts

# Basic server example
bun run examples/basic/simple-server.ts

# Middleware example with authentication
bun run examples/middleware/auth-example.ts

# Advanced pipeline with state composition
bun run examples/pipeline/advanced-pipeline.ts
```

## Example Descriptions

### Complete Demo (`complete-demo.ts`)
Full framework demonstration including:
- Middleware composition
- Type-safe routing with parameters
- JSON responses
- Query parameter handling
- Request logging

**Port**: 3000

### Basic Example (`basic/simple-server.ts`)
Simple server setup showing:
- Basic GET routes
- Route parameters (`:id`)
- Text and JSON responses

**Port**: 3001

### Middleware Example (`middleware/auth-example.ts`)
Authentication and middleware patterns:
- Request logging middleware
- JWT-style authentication
- Protected routes
- Error handling
- Public vs protected endpoints

**Port**: 3002

### Pipeline Example (`pipeline/advanced-pipeline.ts`)
Advanced state composition with pipelines:
- Middleware pipelines with state
- User authentication pipeline
- Permission checking
- Admin-only routes
- State transformation between middleware

**Port**: 3003

## Testing Examples

After starting any example server, you can test it using:

```bash
# Test any running server
bun run test/client/test-client.ts

# Or use curl
curl http://localhost:3000/
curl -H "Authorization: Bearer valid-token" http://localhost:3002/profile
```

## Framework Features Demonstrated

- ✅ **Type Safety**: Full TypeScript with route parameter inference
- ✅ **Middleware**: Composable middleware with proper typing
- ✅ **Pipelines**: Advanced state composition for complex apps
- ✅ **Authentication**: Token-based auth patterns
- ✅ **Error Handling**: Proper HTTP status codes and error responses
- ✅ **Performance**: Optimized for Bun runtime
- ✅ **Developer Experience**: Hot reloading in development mode

## Best Practices

1. **Use TypeScript**: All examples show proper type usage
2. **Middleware Composition**: Layer middleware for reusable functionality  
3. **Error Handling**: Always handle auth failures and validation errors
4. **State Management**: Use pipelines for complex state transformations
5. **Testing**: Each example can be tested with the provided test client 