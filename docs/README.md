# imphnen.js Documentation

Welcome to the comprehensive documentation for the imphnen.js TypeScript web server framework. This documentation covers all aspects of the framework from basic usage to advanced patterns.

## Documentation Structure

### 📚 API Reference
Complete API documentation with examples and type definitions:

- [**Application**](api/application.md) - Core application class methods and configuration
- [**Context**](api/context.md) - Request/response context object and methods
- [**Middleware**](api/middleware.md) - Built-in middleware and usage patterns
- [**Pipeline**](api/pipeline.md) - Advanced pipeline system and state management
- [**Types**](api/types.md) - Complete TypeScript type definitions
- [**Utils**](api/utils.md) - Utility functions and helpers

### 🎯 Feature Guides
In-depth implementation guides for framework features:

- [**Getting Started**](guides/getting-started.md) - Quick start guide and basic setup
- [**File Uploads**](guides/file-uploads.md) - Complete file upload implementation
- [**Proxy Requests**](guides/proxy-requests.md) - Request proxying and forwarding
- [**Static Files**](guides/static-files.md) - Static file serving and management
- [**Authentication**](guides/authentication.md) - Authentication patterns and security
- [**Middleware**](guides/middleware.md) - Middleware development and composition
- [**Pipelines**](guides/pipelines.md) - Advanced pipeline usage and state management
- [**Security**](guides/security.md) - Security best practices and considerations
- [**Deployment**](guides/deployment.md) - Production deployment and configuration

### 💡 Usage Examples
Practical examples with detailed explanations:

- [**Basic Server**](examples/basic-server.md) - Simple server setup and routing
- [**File Upload**](examples/file-upload.md) - File handling examples and patterns
- [**Authentication**](examples/authentication.md) - Auth implementation examples
- [**Middleware**](examples/middleware.md) - Middleware composition examples
- [**Advanced**](examples/advanced.md) - Advanced patterns and techniques

### 📖 Technical Reference
Technical reference and troubleshooting:

- [**Configuration**](reference/configuration.md) - Configuration options and environment setup
- [**Error Handling**](reference/error-handling.md) - Error management and debugging
- [**Performance**](reference/performance.md) - Performance optimization tips
- [**Troubleshooting**](reference/troubleshooting.md) - Common issues and solutions

## Quick Navigation

### New to imphnen.js?
Start with the [Getting Started Guide](guides/getting-started.md) for a quick introduction to the framework.

### Looking for specific features?
- **File Uploads**: [Guide](guides/file-uploads.md) | [Examples](examples/file-upload.md) | [API](api/context.md#file-upload)
- **Authentication**: [Guide](guides/authentication.md) | [Examples](examples/authentication.md) | [API](api/middleware.md#authentication)
- **Middleware**: [Guide](guides/middleware.md) | [Examples](examples/middleware.md) | [API](api/middleware.md)
- **Pipelines**: [Guide](guides/pipelines.md) | [Examples](examples/advanced.md) | [API](api/pipeline.md)

### Need API reference?
Check the [API Reference](api/) section for complete method signatures and type definitions.

### Having issues?
See the [Troubleshooting Guide](reference/troubleshooting.md) for common problems and solutions.

## Framework Overview

imphnen.js is a modern TypeScript web server framework designed for:

- **Type Safety**: End-to-end TypeScript support with route parameter extraction
- **Performance**: Built for Bun runtime with optimized request handling
- **Developer Experience**: Express-like API with modern patterns
- **Security**: Built-in security features and best practices
- **Extensibility**: Flexible middleware and pipeline system

## Key Features

### Core Features
- Route parameter extraction and typing
- Middleware composition with state management
- Built-in CORS, authentication, and validation
- Request/response helpers with full type safety

### File Upload Support
- Multipart/form-data handling
- File size and type validation
- Security features (path traversal prevention)
- Streaming support for large files

### Proxy and Static Files
- Request proxying with header manipulation
- Static file serving with caching
- Download support with custom filenames
- Security and performance optimizations

### Advanced Features
- Pipeline system for complex middleware composition
- State management across middleware chain
- Type-safe route handlers with parameter extraction
- Comprehensive error handling and logging

## Examples and Code Samples

The framework includes comprehensive examples in the `examples/` directory:

```bash
# Run examples
bun run examples/complete-demo.ts              # Full demo (Port 3000)
bun run examples/basic/simple-server.ts        # Basic server (Port 3001)
bun run examples/file-upload/upload-demo.ts    # File upload (Port 3004)
```

## Contributing to Documentation

Documentation improvements are welcome! Each section is organized by topic:

- **API docs** should include complete method signatures and examples
- **Guides** should be practical and include working code samples
- **Examples** should be complete, runnable implementations
- **Reference** should cover edge cases and troubleshooting

## Support and Community

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share patterns
- **Examples**: Contribute real-world usage examples

---

**Next**: Start with the [Getting Started Guide](guides/getting-started.md) or browse the [API Reference](api/). 