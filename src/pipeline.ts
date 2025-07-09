// Advanced middleware pipeline with generic typing for imphnen.js

export type MiddlewareState = Record<string, unknown>;

export type ContextWithState<
  TParams extends Record<string, string> = {},
  TQuery extends Record<string, string> = {},
  TBody = unknown,
  TState extends MiddlewareState = {}
> = {
  req: Request;
  params: TParams;
  query: TQuery;
  body: TBody;
  headers: Headers;
  state: TState;
  set: {
    headers: (headers: Record<string, string>) => void;
    status: (status: number) => void;
  };
  json: <T>(data: T) => Response;
  text: (text: string) => Response;
  html: (html: string) => Response;
  redirect: (url: string, status?: number) => Response;
};

// Generic middleware that can modify the state type
export type PipelineMiddleware<
  TParams extends Record<string, string> = {},
  TQuery extends Record<string, string> = {},
  TBody = unknown,
  TInputState extends MiddlewareState = {},
  TOutputState extends MiddlewareState = TInputState
> = (
  ctx: ContextWithState<TParams, TQuery, TBody, TInputState>,
  next: () => Promise<Response>
) => Promise<Response> | Response;

// Handler with state access
export type StateHandler<
  TParams extends Record<string, string> = {},
  TQuery extends Record<string, string> = {},
  TBody = unknown,
  TState extends MiddlewareState = {}
> = (ctx: ContextWithState<TParams, TQuery, TBody, TState>) => Response | Promise<Response>;

// Pipeline composer for type-safe middleware chaining
export class MiddlewarePipeline<
  TParams extends Record<string, string> = {},
  TQuery extends Record<string, string> = {},
  TBody = unknown,
  TState extends MiddlewareState = {}
> {
  private middlewares: PipelineMiddleware<TParams, TQuery, TBody, any, any>[] = [];

  constructor(
    private initialState: TState = {} as TState
  ) {}

  // Add middleware with state transformation
  use<TNewState extends MiddlewareState>(
    middleware: PipelineMiddleware<TParams, TQuery, TBody, TState, TNewState>
  ): MiddlewarePipeline<TParams, TQuery, TBody, TNewState> {
    const newPipeline = new MiddlewarePipeline<TParams, TQuery, TBody, TNewState>();
    newPipeline.middlewares = [...this.middlewares, middleware];
    return newPipeline;
  }

  // Add multiple middlewares
  useMany<TNewState extends MiddlewareState>(
    ...middlewares: PipelineMiddleware<TParams, TQuery, TBody, TState, TNewState>[]
  ): MiddlewarePipeline<TParams, TQuery, TBody, TNewState> {
    let pipeline: any = this;
    for (const middleware of middlewares) {
      pipeline = pipeline.use(middleware);
    }
    return pipeline;
  }

  // Execute the pipeline with a handler
  async execute(
    ctx: ContextWithState<TParams, TQuery, TBody, {}>,
    handler: StateHandler<TParams, TQuery, TBody, TState>
  ): Promise<Response> {
    // Add initial state to context
    const stateCtx = { ...ctx, state: this.initialState };
    
    let index = 0;

    const next = async (): Promise<Response> => {
      if (index < this.middlewares.length) {
        const middleware = this.middlewares[index++];
        if (middleware) {
          return await middleware(stateCtx as any, next);
        }
      }
      return await handler(stateCtx as any);
    };

    return await next();
  }

  // Static factory methods for common patterns
  static create<
    TParams extends Record<string, string> = {},
    TQuery extends Record<string, string> = {},
    TBody = unknown,
    TState extends MiddlewareState = {}
  >(initialState?: TState): MiddlewarePipeline<TParams, TQuery, TBody, TState> {
    return new MiddlewarePipeline(initialState || ({} as TState));
  }
}

// Utility functions for creating typed middleware
export function createStateMiddleware<
  TParams extends Record<string, string> = {},
  TQuery extends Record<string, string> = {},
  TBody = unknown,
  TInputState extends MiddlewareState = {},
  TOutputState extends MiddlewareState = TInputState
>(
  fn: (
    ctx: ContextWithState<TParams, TQuery, TBody, TInputState>,
    next: () => Promise<Response>
  ) => Promise<Response> | Response
): PipelineMiddleware<TParams, TQuery, TBody, TInputState, TOutputState> {
  return fn;
}

// Built-in middleware creators with state typing
export const BuiltinMiddleware = {
  // Authentication middleware that adds user to state
  auth: <TUser = { id: string; email: string }>() =>
    createStateMiddleware<any, any, any, {}, { user: TUser }>(
      async (ctx, next) => {
        const token = ctx.headers.get('authorization');
        
        if (!token || !token.startsWith('Bearer ')) {
          ctx.set.status(401);
          return ctx.json({ error: 'Authentication required' });
        }

        // Mock authentication - in real app, validate JWT
        const user = {
          id: 'user-123',
          email: 'user@example.com'
        } as TUser;

        (ctx.state as any).user = user;
        return await next();
      }
    ),

  // CORS middleware
  cors: (options: {
    origin?: string | string[];
    methods?: string[];
    headers?: string[];
  } = {}) =>
    createStateMiddleware(async (ctx, next) => {
      // Handle preflight
      if (ctx.req.method === 'OPTIONS') {
        const headers = new Headers();
        headers.set('Access-Control-Allow-Origin', 
          Array.isArray(options.origin) ? options.origin.join(', ') : (options.origin || '*')
        );
        headers.set('Access-Control-Allow-Methods', 
          options.methods?.join(', ') || 'GET, POST, PUT, DELETE, PATCH, OPTIONS'
        );
        headers.set('Access-Control-Allow-Headers', 
          options.headers?.join(', ') || 'Content-Type, Authorization'
        );
        return new Response(null, { status: 204, headers });
      }

      const response = await next();
      
      // Add CORS headers to response
      const corsHeaders = new Headers(response.headers);
      corsHeaders.set('Access-Control-Allow-Origin', 
        Array.isArray(options.origin) ? options.origin.join(', ') : (options.origin || '*')
      );
      
      return new Response(response.body, {
        status: response.status,
        headers: corsHeaders
      });
    }),

  // Logging middleware with timing
  logger: (prefix = '') =>
    createStateMiddleware(async (ctx, next) => {
      const start = Date.now();
      const url = new URL(ctx.req.url);
      console.log(`${prefix}→ ${ctx.req.method} ${url.pathname}`);
      
      const response = await next();
      
      const duration = Date.now() - start;
      console.log(`${prefix}← ${ctx.req.method} ${url.pathname} ${response.status} (${duration}ms)`);
      
      return response;
    }),

  // Rate limiting middleware
  rateLimit: (options: { 
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (ctx: any) => string;
  }) => {
    const store = new Map<string, { count: number; resetTime: number }>();
    
    return createStateMiddleware(async (ctx, next) => {
      const key = options.keyGenerator?.(ctx) || 
        ctx.headers.get('x-forwarded-for') || 
        ctx.headers.get('x-real-ip') || 
        'unknown';
      
      const now = Date.now();
      const current = store.get(key);
      
      if (!current || now > current.resetTime) {
        store.set(key, { count: 1, resetTime: now + options.windowMs });
        return await next();
      }
      
      if (current.count >= options.maxRequests) {
        ctx.set.status(429);
        return ctx.json({ 
          error: 'Too many requests',
          retryAfter: Math.ceil((current.resetTime - now) / 1000)
        });
      }
      
      current.count++;
      return await next();
    });
  },

  // Validation middleware
  validate: <TSchema>(schema: {
    body?: (data: unknown) => data is TSchema;
    query?: (data: unknown) => boolean;
    params?: (data: unknown) => boolean;
  }) =>
    createStateMiddleware<any, any, any, {}, { validatedBody: TSchema }>(
      async (ctx, next) => {
        if (schema.body && !schema.body(ctx.body)) {
          ctx.set.status(400);
          return ctx.json({ error: 'Invalid request body' });
        }
        
        if (schema.query && !schema.query(ctx.query)) {
          ctx.set.status(400);
          return ctx.json({ error: 'Invalid query parameters' });
        }
        
        if (schema.params && !schema.params(ctx.params)) {
          ctx.set.status(400);
          return ctx.json({ error: 'Invalid route parameters' });
        }
        
        if (schema.body) {
          (ctx.state as any).validatedBody = ctx.body;
        }
        
        return await next();
      }
    )
}; 