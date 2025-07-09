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
  CombinedMiddleware
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
      ...options
    };
  }

  // Create a new pipeline
  pipeline<TState extends MiddlewareState = {}>(
    initialState?: TState
  ): MiddlewarePipeline<{}, {}, unknown, TState> {
    return MiddlewarePipeline.create(initialState);
  }

  // Enhanced middleware registration with support for combined middleware
  use<TParams extends Record<string, string> = {}, TQuery extends Record<string, string> = {}, TBody = unknown>(
    middleware: Middleware<TParams, TQuery, TBody> | PipelineMiddleware<{}, {}, unknown, {}, any> | CombinedMiddleware<TParams, TQuery, TBody>
  ): this {
    if (Array.isArray(middleware)) {
      // Handle combined middleware array
      const combined = combineMiddleware(...middleware);
      this.globalMiddlewares.push(combined as Middleware);
    } else if (typeof middleware === 'function' && middleware.length === 2) {
      // Pipeline middleware
      this.globalPipeline = this.globalPipeline.use(middleware as PipelineMiddleware<{}, {}, unknown, {}, any>);
    } else {
      // Traditional middleware
      this.globalMiddlewares.push(middleware as Middleware);
    }
    return this;
  }

  // Utility method to combine multiple middleware
  combine<TParams extends Record<string, string> = {}, TQuery extends Record<string, string> = {}, TBody = unknown>(
    ...middlewares: Middleware<TParams, TQuery, TBody>[]
  ): Middleware<TParams, TQuery, TBody> {
    return combineMiddleware(...middlewares);
  }

  // Create middleware chain builder
  chain<TParams extends Record<string, string> = {}, TQuery extends Record<string, string> = {}, TBody = unknown>(): MiddlewareChain<TParams, TQuery, TBody> {
    return new MiddlewareChain<TParams, TQuery, TBody>();
  }

  // Register route with pipeline
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

  // Proxy route registration
  proxy(path: string, options: ProxyOptions): this {
    this.get(path, async (ctx: any) => {
      return await ctx.proxy(options);
    });
    
    this.post(path, async (ctx: any) => {
      return await ctx.proxy(options);
    });
    
    this.put(path, async (ctx: any) => {
      return await ctx.proxy(options);
    });
    
    this.delete(path, async (ctx: any) => {
      return await ctx.proxy(options);
    });
    
    this.patch(path, async (ctx: any) => {
      return await ctx.proxy(options);
    });
    
    return this;
  }

  // HTTP method handlers with enhanced type inference and pipeline support
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
    if (args.length === 1) {
      // Single handler
      return this.route('GET', path, MiddlewarePipeline.create<any, {}, unknown, {}>(), args[0] as StateHandler<any, {}, unknown, {}>);
    } else if (args.length === 2 && typeof args[0] === 'object' && 'execute' in args[0]) {
      // Pipeline + handler
      return this.route('GET', path, args[0] as MiddlewarePipeline<any, {}, unknown, TState>, args[1] as StateHandler<any, {}, unknown, TState>);
    } else {
      // Traditional middleware + handler
      return this.addRoute('GET', path, args as [...Middleware[], Handler]);
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
      StateHandler<any, {}, TBody, {}>
    ]
  ): this {
    if (args.length === 1) {
      return this.route('POST', path, MiddlewarePipeline.create<any, {}, TBody, {}>(), args[0] as StateHandler<any, {}, TBody, {}>);
    } else if (args.length === 2 && typeof args[0] === 'object' && 'execute' in args[0]) {
      return this.route('POST', path, args[0] as MiddlewarePipeline<any, {}, TBody, TState>, args[1] as StateHandler<any, {}, TBody, TState>);
    } else {
      return this.addRoute('POST', path, args as [...Middleware[], Handler]);
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
      StateHandler<any, {}, TBody, {}>
    ]
  ): this {
    if (args.length === 1) {
      return this.route('PUT', path, MiddlewarePipeline.create<any, {}, TBody, {}>(), args[0] as StateHandler<any, {}, TBody, {}>);
    } else if (args.length === 2 && typeof args[0] === 'object' && 'execute' in args[0]) {
      return this.route('PUT', path, args[0] as MiddlewarePipeline<any, {}, TBody, TState>, args[1] as StateHandler<any, {}, TBody, TState>);
    } else {
      return this.addRoute('PUT', path, args as [...Middleware[], Handler]);
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
    if (args.length === 1) {
      return this.route('DELETE', path, MiddlewarePipeline.create<any, {}, unknown, {}>(), args[0] as StateHandler<any, {}, unknown, {}>);
    } else if (args.length === 2 && typeof args[0] === 'object' && 'execute' in args[0]) {
      return this.route('DELETE', path, args[0] as MiddlewarePipeline<any, {}, unknown, TState>, args[1] as StateHandler<any, {}, unknown, TState>);
    } else {
      return this.addRoute('DELETE', path, args as [...Middleware[], Handler]);
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
      StateHandler<any, {}, TBody, {}>
    ]
  ): this {
    if (args.length === 1) {
      return this.route('PATCH', path, MiddlewarePipeline.create<any, {}, TBody, {}>(), args[0] as StateHandler<any, {}, TBody, {}>);
    } else if (args.length === 2 && typeof args[0] === 'object' && 'execute' in args[0]) {
      return this.route('PATCH', path, args[0] as MiddlewarePipeline<any, {}, TBody, TState>, args[1] as StateHandler<any, {}, TBody, TState>);
    } else {
      return this.addRoute('PATCH', path, args as [...Middleware[], Handler]);
    }
  }

  private addRoute<TPath extends string>(
    method: HTTPMethod,
    path: TPath,
    handlers: [...Middleware[], Handler]
  ): this {
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
        if (middleware) {
          return await middleware(ctx, next);
        }
      }
      return await handler(ctx);
    };

    return await next();
  }

  private handleCors(request: Request): Response {
    const corsOptions = typeof this.options.cors === 'object' 
      ? this.options.cors 
      : {};

    const headers = new Headers();
    
    const origin = corsOptions.origin;
    const originHeader = Array.isArray(origin) ? origin.join(', ') : (origin || '*');
    
    headers.set('Access-Control-Allow-Origin', originHeader);
    
    headers.set('Access-Control-Allow-Methods', 
      corsOptions.methods?.join(', ') || 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
    );
    
    headers.set('Access-Control-Allow-Headers', 
      corsOptions.headers?.join(', ') || 'Content-Type, Authorization'
    );

    return new Response(null, { status: 204, headers });
  }

  // Start the server
  async listen(port?: number): Promise<void> {
    const serverPort = port || this.options.port || 3000;
    
    const server = Bun.serve({
      port: serverPort,
      hostname: this.options.hostname,
      fetch: (request) => this.handleRequest(request),
      development: this.options.development
    });

    console.log(`🚀 Imphnen server running on http://${this.options.hostname}:${serverPort}`);
    console.log(`📁 File uploads: ${this.options.uploads?.maxFileSize ? `Max ${this.options.uploads.maxFileSize} bytes` : 'Disabled'}`);
    console.log(`🔗 Proxy support: ${this.options.proxy ? 'Enabled' : 'Disabled'}`);
    
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