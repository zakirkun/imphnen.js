// Main App class for imphnen.js framework with enhanced features

import type { 
  HTTPMethod, 
  Handler, 
  Middleware, 
  RouteDefinition, 
  ImphnenOptions,
  RouteParams,
  UploadedFile,
  ProxyOptions,
  CombinedMiddleware,
  WebSocketHandler,
  WebSocketRoute,
  WebSocketContext
} from './types.js';
import { matchRoute, parseURLParams, parseQuery, parseBody, combineMiddleware, MiddlewareChain, proxyRequest } from './utils.js';
import { createContext } from './context.js';
import { 
  MiddlewarePipeline, 
  BuiltinMiddleware,
} from './pipeline.js';
import type {
  ContextWithState,
  StateHandler,
  PipelineMiddleware,
  MiddlewareState
} from './pipeline.js';

interface PipelineRouteDefinition {
  method: HTTPMethod;
  path: string;
  pipeline: MiddlewarePipeline<any, any, any, any>;
  handler: StateHandler<any, any, any, any>;
}

export class Imphnen {
  private routes: RouteDefinition[] = [];
  private pipelineRoutes: PipelineRouteDefinition[] = [];
  private globalMiddlewares: Middleware[] = [];
  private globalPipeline: MiddlewarePipeline = MiddlewarePipeline.create();
  private options: ImphnenOptions;
  private wsRoutes: WebSocketRoute[] = [];

  constructor(options: ImphnenOptions = {}) {
    this.options = {
      port: 3000,
      hostname: 'localhost',
      development: true,
      cors: false,
      uploads: {
        maxFileSize: 10 * 1024 * 1024, // 10MB default
        maxFiles: 10,
        allowedTypes: ['image/*', 'application/pdf', 'text/*']
      },
      proxy: {
        trustProxy: false,
        timeout: 30000 // 30 seconds
      },
      websocket: {
        maxPayloadLength: 16 * 1024 * 1024, // 16MB default
        idleTimeout: 120, // 2 minutes
        backpressureLimit: 64 * 1024, // 64KB
        compression: false
      },
      ...options
    };
  }

  // Create a pipeline with initial state
  pipeline<TState extends MiddlewareState = {}>(
    initialState?: TState
  ): MiddlewarePipeline<{}, {}, unknown, TState> {
    return MiddlewarePipeline.create(initialState);
  }

  // Add global middleware
  use<TParams extends Record<string, string> = {}, TQuery extends Record<string, string> = {}, TBody = unknown>(
    middleware: Middleware<TParams, TQuery, TBody> | PipelineMiddleware<{}, {}, unknown, {}, any> | CombinedMiddleware<TParams, TQuery, TBody>
  ): this {
    if (Array.isArray(middleware)) {
      // Handle combined middleware array
      this.globalMiddlewares.push(...(middleware as Middleware[]));
    } else if ('execute' in middleware) {
      // Handle pipeline middleware - add to global pipeline
      this.globalPipeline = this.globalPipeline.use(middleware as any);
    } else {
      // Handle regular middleware
      this.globalMiddlewares.push(middleware as Middleware);
    }
    return this;
  }

  // Middleware combination utilities
  combine<TParams extends Record<string, string> = {}, TQuery extends Record<string, string> = {}, TBody = unknown>(
    ...middlewares: Middleware<TParams, TQuery, TBody>[]
  ): Middleware<TParams, TQuery, TBody> {
    return combineMiddleware(...middlewares);
  }

  chain<TParams extends Record<string, string> = {}, TQuery extends Record<string, string> = {}, TBody = unknown>(): MiddlewareChain<TParams, TQuery, TBody> {
    return new MiddlewareChain<TParams, TQuery, TBody>();
  }

  // Pipeline-based routes
  route<
    TPath extends string,
    TState extends MiddlewareState,
    TBody = unknown
  >(
    method: HTTPMethod,
    path: TPath,
    pipeline: MiddlewarePipeline<any, any, TBody, TState>,
    handler: StateHandler<any, any, TBody, TState>
  ): this {
    this.pipelineRoutes.push({
      method,
      path,
      pipeline,
      handler
    });
    return this;
  }

  // WebSocket route registration
  ws<TPath extends string>(
    path: TPath,
    handler: WebSocketHandler<RouteParams<TPath>>
  ): this {
    this.wsRoutes.push({
      path,
      handler: handler as WebSocketHandler<any>
    });
    return this;
  }

  // Proxy routes
  proxy(path: string, options: ProxyOptions): this {
    this.routes.push({
      method: 'GET',
      path,
      handler: async (ctx) => {
        return await ctx.proxy(options);
      },
      middlewares: []
    });

    // Also handle other HTTP methods for proxy
    const proxyMethods: HTTPMethod[] = ['POST', 'PUT', 'DELETE', 'PATCH'];
    proxyMethods.forEach(method => {
      this.routes.push({
        method,
        path,
        handler: async (ctx) => {
          return await ctx.proxy(options);
        },
        middlewares: []
      });
    });

    return this;
  }

  // HTTP method handlers with enhanced overloads
  get<TPath extends string, TState extends MiddlewareState = {}>(
    path: TPath,
    ...args: [
      ...Middleware<any>[],
      Handler<any>
    ] | [
      MiddlewarePipeline<any, {}, unknown, TState>,
      StateHandler<any, {}, unknown, TState>
    ] | [
      StateHandler<any, {}, unknown, {}>
    ]
  ): this {
    if (args.length === 2 && 'execute' in args[0]) {
      // Pipeline + handler
      const [pipeline, handler] = args as [MiddlewarePipeline<any, {}, unknown, TState>, StateHandler<any, {}, unknown, TState>];
      return this.route('GET', path, pipeline, handler);
    } else if (args.length === 1) {
      // Just handler
      const [handler] = args as [Handler<any>];
      return this.addRoute('GET', path, [handler]);
    } else {
      // Middlewares + handler
      const allArgs = args as [...Middleware<any>[], Handler<any>];
      return this.addRoute('GET', path, allArgs);
    }
  }

  post<TPath extends string, TBody = unknown, TState extends MiddlewareState = {}>(
    path: TPath,
    ...args: [
      ...Middleware<any, {}, TBody>[],
      Handler<any, {}, TBody>
    ] | [
      MiddlewarePipeline<any, {}, TBody, TState>,
      StateHandler<any, {}, TBody, TState>
    ] | [
      Handler<any, {}, TBody>
    ]
  ): this {
    if (args.length === 2 && 'execute' in args[0]) {
      // Pipeline + handler
      const [pipeline, handler] = args as [MiddlewarePipeline<any, {}, TBody, TState>, StateHandler<any, {}, TBody, TState>];
      return this.route('POST', path, pipeline, handler);
    } else if (args.length === 1) {
      // Just handler
      const [handler] = args as [Handler<any, {}, TBody>];
      return this.addRoute('POST', path, [handler as Handler]);
    } else {
      // Middlewares + handler
      const allArgs = args as [...Middleware<any, {}, TBody>[], Handler<any, {}, TBody>];
      return this.addRoute('POST', path, allArgs as [...Middleware[], Handler]);
    }
  }

  put<TPath extends string, TBody = unknown, TState extends MiddlewareState = {}>(
    path: TPath,
    ...args: [
      ...Middleware<any, {}, TBody>[],
      Handler<any, {}, TBody>
    ] | [
      MiddlewarePipeline<any, {}, TBody, TState>,
      StateHandler<any, {}, TBody, TState>
    ] | [
      Handler<any, {}, TBody>
    ]
  ): this {
    if (args.length === 2 && 'execute' in args[0]) {
      // Pipeline + handler
      const [pipeline, handler] = args as [MiddlewarePipeline<any, {}, TBody, TState>, StateHandler<any, {}, TBody, TState>];
      return this.route('PUT', path, pipeline, handler);
    } else if (args.length === 1) {
      // Just handler
      const [handler] = args as [Handler<any, {}, TBody>];
      return this.addRoute('PUT', path, [handler as Handler]);
    } else {
      // Middlewares + handler
      const allArgs = args as [...Middleware<any, {}, TBody>[], Handler<any, {}, TBody>];
      return this.addRoute('PUT', path, allArgs as [...Middleware[], Handler]);
    }
  }

  delete<TPath extends string, TState extends MiddlewareState = {}>(
    path: TPath,
    ...args: [
      ...Middleware<any>[],
      Handler<any>
    ] | [
      MiddlewarePipeline<any, {}, unknown, TState>,
      StateHandler<any, {}, unknown, TState>
    ] | [
      StateHandler<any, {}, unknown, {}>
    ]
  ): this {
    if (args.length === 2 && 'execute' in args[0]) {
      const [pipeline, handler] = args as [MiddlewarePipeline<any, {}, unknown, TState>, StateHandler<any, {}, unknown, TState>];
      return this.route('DELETE', path, pipeline, handler);
    } else if (args.length === 1) {
      const [handler] = args as [Handler<any>];
      return this.addRoute('DELETE', path, [handler]);
    } else {
      const allArgs = args as [...Middleware<any>[], Handler<any>];
      return this.addRoute('DELETE', path, allArgs);
    }
  }

  patch<TPath extends string, TBody = unknown, TState extends MiddlewareState = {}>(
    path: TPath,
    ...args: [
      ...Middleware<any, {}, TBody>[],
      Handler<any, {}, TBody>
    ] | [
      MiddlewarePipeline<any, {}, TBody, TState>,
      StateHandler<any, {}, TBody, TState>
    ] | [
      Handler<any, {}, TBody>
    ]
  ): this {
    if (args.length === 2 && 'execute' in args[0]) {
      // Pipeline + handler
      const [pipeline, handler] = args as [MiddlewarePipeline<any, {}, TBody, TState>, StateHandler<any, {}, TBody, TState>];
      return this.route('PATCH', path, pipeline, handler);
    } else if (args.length === 1) {
      // Just handler
      const [handler] = args as [Handler<any, {}, TBody>];
      return this.addRoute('PATCH', path, [handler as Handler]);
    } else {
      // Middlewares + handler
      const allArgs = args as [...Middleware<any, {}, TBody>[], Handler<any, {}, TBody>];
      return this.addRoute('PATCH', path, allArgs as [...Middleware[], Handler]);
    }
  }

  // Helper to add traditional routes
  private addRoute<TPath extends string>(
    method: HTTPMethod,
    path: TPath,
    handlers: [...Middleware[], Handler]
  ): this {
    if (handlers.length === 0) return this;
    
    const handler = handlers[handlers.length - 1] as Handler;
    const middlewares = handlers.slice(0, -1) as Middleware[];
    
    this.routes.push({
      method,
      path,
      handler,
      middlewares
    });
    
    return this;
  }

  // Enhanced request handler with file upload support
  private async handleRequest(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method as HTTPMethod;
    const pathname = url.pathname;

    // Handle CORS if enabled
    if (this.options.cors) {
      if (method === 'OPTIONS') {
        return this.handleCors(request);
      }
    }

    // Find matching pipeline route first
    const pipelineRoute = this.pipelineRoutes.find(r => 
      r.method === method && matchRoute(r.path, pathname)
    );

    if (pipelineRoute) {
      return await this.handlePipelineRoute(pipelineRoute, request, url, pathname, method);
    }

    // Find matching traditional route
    const route = this.routes.find(r => 
      r.method === method && matchRoute(r.path, pathname)
    );

    if (!route) {
      return new Response('Not Found', { status: 404 });
    }

    try {
      // Parse request data with enhanced body and file support
      const params = parseURLParams(route.path, pathname);
      const query = parseQuery(url);
      
      const { body, files } = ['POST', 'PUT', 'PATCH'].includes(method) 
        ? await parseBody(request, this.options.uploads) 
        : { body: null, files: undefined };

      // Create enhanced context
      const ctx = createContext(request, params, query, body, files);

      // Execute middleware chain and handler
      const allMiddlewares = [...this.globalMiddlewares, ...route.middlewares];
      
      return await this.executeMiddlewareChain(
        allMiddlewares,
        route.handler,
        ctx
      );

    } catch (error) {
      console.error('Request handling error:', error);
      
      // Enhanced error handling for file uploads
      if (error instanceof Error && error.message.includes('File upload error')) {
        return new Response(JSON.stringify({ error: error.message }), { 
          status: 400,
          headers: { 'content-type': 'application/json' }
        });
      }
      
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  // WebSocket upgrade handler
  private handleWebSocketUpgrade(request: Request, server: any): Response | undefined {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // Find matching WebSocket route
    const wsRoute = this.wsRoutes.find(route => matchRoute(route.path, pathname));
    
    if (!wsRoute) {
      return undefined; // No WebSocket route found
    }

    // Parse route parameters and query
    const params = parseURLParams(wsRoute.path, pathname);
    const query = parseQuery(url);

    // Upgrade to WebSocket
    const success = server.upgrade(request, {
      data: {
        route: wsRoute,
        params,
        query,
        headers: request.headers,
        url
      }
    });

    return success ? undefined : new Response('WebSocket upgrade failed', { status: 400 });
  }

  private async handlePipelineRoute(
    route: PipelineRouteDefinition,
    request: Request,
    url: URL,
    pathname: string,
    method: HTTPMethod
  ): Promise<Response> {
    try {
      // Parse request data with enhanced support
      const params = parseURLParams(route.path, pathname);
      const query = parseQuery(url);
      
      const { body, files } = ['POST', 'PUT', 'PATCH'].includes(method) 
        ? await parseBody(request, this.options.uploads) 
        : { body: null, files: undefined };

      // Create context with state support
      const baseCtx = createContext(request, params, query, body, files);
      const stateCtx: ContextWithState = {
        ...baseCtx,
        state: {}
      };

      // Execute pipeline
      return await route.pipeline.execute(stateCtx, route.handler);

    } catch (error) {
      console.error('Pipeline request handling error:', error);
      
      if (error instanceof Error && error.message.includes('File upload error')) {
        return new Response(JSON.stringify({ error: error.message }), { 
          status: 400,
          headers: { 'content-type': 'application/json' }
        });
      }
      
      return new Response('Internal Server Error', { status: 500 });
    }
  }

  private async executeMiddlewareChain(
    middlewares: Middleware[],
    handler: Handler,
    ctx: any
  ): Promise<Response> {
    let index = 0;

    const next = async (): Promise<Response> => {
      if (index < middlewares.length) {
        const middleware = middlewares[index++];
        // Ensure middleware exists before calling
        if (!middleware) {
          return await next();
        }
        return await middleware(ctx, next);
      }
      // Ensure handler exists before calling
      if (!handler) {
        throw new Error('No handler provided');
      }
      return await handler(ctx);
    };

    return await next();
  }

  private handleCors(request: Request): Response {
    const corsOptions = typeof this.options.cors === 'object'
      ? this.options.cors
      : {};

    const origin = corsOptions.origin;
    const requestOrigin = request.headers.get('origin');

    let allowOrigin = '*';
    if (typeof origin === 'string') {
      allowOrigin = origin;
    } else if (Array.isArray(origin) && requestOrigin) {
      allowOrigin = origin.includes(requestOrigin) ? requestOrigin : 'null';
    } else if (requestOrigin) {
      allowOrigin = requestOrigin;
    }

    return new Response(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Origin': allowOrigin,
        'Access-Control-Allow-Methods': 
          corsOptions.methods?.join(', ') || 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 
          corsOptions.headers?.join(', ') || 'Content-Type, Authorization'
      }
    });
  }

  // Start the server with WebSocket support
  async listen(port?: number): Promise<void> {
    const serverPort = port || this.options.port || 3000;
    
    const server = Bun.serve({
      port: serverPort,
      hostname: this.options.hostname,
      fetch: (request, server) => {
        // Try WebSocket upgrade first
        const wsResponse = this.handleWebSocketUpgrade(request, server);
        if (wsResponse !== undefined) {
          return wsResponse;
        }
        
        // Handle regular HTTP request
        return this.handleRequest(request);
      },
      websocket: {
        maxPayloadLength: this.options.websocket?.maxPayloadLength,
        idleTimeout: this.options.websocket?.idleTimeout,
        backpressureLimit: this.options.websocket?.backpressureLimit,
        // compression: this.options.websocket?.compression, // Remove if not supported
        
        open: (ws: any) => {
          const data = ws.data as any;
          const ctx: WebSocketContext = {
            ws: ws as any, // Cast to match our interface
            params: data.params,
            query: data.query,
            headers: data.headers,
            url: data.url
          };
          
          if (data.route?.handler?.open) {
            data.route.handler.open(ctx);
          }
        },
        
        message: (ws: any, message: string | Buffer) => {
          const data = ws.data as any;
          const ctx: WebSocketContext = {
            ws: ws as any, // Cast to match our interface
            params: data.params,
            query: data.query,
            headers: data.headers,
            url: data.url
          };
          
          if (data.route?.handler?.message) {
            data.route.handler.message(ctx, message);
          }
        },
        
        close: (ws: any, code?: number, reason?: string) => {
          const data = ws.data as any;
          const ctx: WebSocketContext = {
            ws: ws as any, // Cast to match our interface
            params: data.params,
            query: data.query,
            headers: data.headers,
            url: data.url
          };
          
          if (data.route?.handler?.close) {
            data.route.handler.close(ctx, code, reason);
          }
        }
      },
      development: this.options.development
    });

    console.log(`🚀 Imphnen server running on http://${this.options.hostname}:${serverPort}`);
    console.log(`📁 File uploads: ${this.options.uploads?.maxFileSize ? `Max ${this.options.uploads.maxFileSize} bytes` : 'Disabled'}`);
    console.log(`🔗 Proxy support: ${this.options.proxy ? 'Enabled' : 'Disabled'}`);
    console.log(`🔌 WebSocket support: ${this.wsRoutes.length > 0 ? `${this.wsRoutes.length} routes` : 'No routes'}`);
    
    return new Promise(() => {}); // Keep server running
  }

  // Handler for external use
  handler = (request: Request): Promise<Response> => {
    return this.handleRequest(request);
  };

  // Access to built-in middleware
  static middleware = BuiltinMiddleware;
}

// Factory function for creating app instances
export function createApp(options?: ImphnenOptions): Imphnen {
  return new Imphnen(options);
}

// Alias for backward compatibility
export const createEnhancedApp = createApp;

// Re-export utilities and middleware functionality
export { 
  MiddlewarePipeline, 
  BuiltinMiddleware, 
  createStateMiddleware
} from './pipeline.js';
export { combineMiddleware as combine, MiddlewareChain as Chain } from './utils.js'; 