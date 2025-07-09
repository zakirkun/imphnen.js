// Type definitions for imphnen.js framework

// Core types
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'OPTIONS';

export type RouteParams<T extends string> = 
  T extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? { [K in Param]: string } & RouteParams<`/${Rest}`>
    : T extends `${infer _Start}:${infer Param}`
    ? { [K in Param]: string }
    : {};

// File Upload types
export interface UploadedFile {
  name: string;
  size: number;
  type: string;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  stream(): ReadableStream;
}

export interface UploadOptions {
  maxFileSize?: number;
  maxFiles?: number;
  allowedTypes?: string[];
  destination?: string;
}

// Proxy types
export interface ProxyOptions {
  target: string;
  changeOrigin?: boolean;
  headers?: Record<string, string>;
  timeout?: number;
}

// Core Context type with enhanced features
export type Context<
  TParams extends Record<string, string> = {},
  TQuery extends Record<string, string> = {},
  TBody = unknown
> = {
  req: Request;
  params: TParams;
  query: TQuery;
  body: TBody;
  headers: Headers;
  files?: UploadedFile[];
  set: {
    headers: (headers: Record<string, string>) => void;
    status: (status: number) => void;
  };
  json: <T>(data: T, init?: ResponseInit) => Response;
  text: (text: string, init?: ResponseInit) => Response;
  html: (html: string, init?: ResponseInit) => Response;
  redirect: (url: string, status?: number) => Response;
  file: (filePath: string, options?: { download?: boolean; filename?: string }) => Promise<Response>;
  proxy: (target: string, options?: ProxyOptions) => Promise<Response>;
};

export type Handler<
  TParams extends Record<string, string> = {},
  TQuery extends Record<string, string> = {},
  TBody = unknown
> = (ctx: Context<TParams, TQuery, TBody>) => Response | Promise<Response>;

export type Middleware<
  TParams extends Record<string, string> = {},
  TQuery extends Record<string, string> = {},
  TBody = unknown
> = (
  ctx: Context<TParams, TQuery, TBody>,
  next: () => Promise<Response>
) => Response | Promise<Response>;

export interface RouteDefinition {
  method: HTTPMethod;
  path: string;
  handler: Handler;
  middlewares: Middleware[];
}

export interface CorsOptions {
  origin?: string | string[];
  methods?: string[];
  headers?: string[];
  credentials?: boolean;
}

export interface ImphnenOptions {
  port?: number;
  hostname?: string;
  development?: boolean;
  cors?: boolean | CorsOptions;
  uploads?: UploadOptions;
  staticFiles?: {
    root: string;
    prefix?: string;
  };
  proxy?: boolean;
}

// Pipeline types
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
  files?: UploadedFile[];
  state: TState;
  set: {
    headers: (headers: Record<string, string>) => void;
    status: (status: number) => void;
  };
  json: <T>(data: T, init?: ResponseInit) => Response;
  text: (text: string, init?: ResponseInit) => Response;
  html: (html: string, init?: ResponseInit) => Response;
  redirect: (url: string, status?: number) => Response;
  file: (filePath: string, options?: { download?: boolean; filename?: string }) => Promise<Response>;
  proxy: (target: string, options?: ProxyOptions) => Promise<Response>;
};

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

export type StateHandler<
  TParams extends Record<string, string> = {},
  TQuery extends Record<string, string> = {},
  TBody = unknown,
  TState extends MiddlewareState = {}
> = (ctx: ContextWithState<TParams, TQuery, TBody, TState>) => Response | Promise<Response>;

// Utility types
export type AnyRouteParams = Record<string, string>;

// Main classes and functions
export declare class MiddlewarePipeline<
  TParams extends Record<string, string> = {},
  TQuery extends Record<string, string> = {},
  TBody = unknown,
  TState extends MiddlewareState = {}
> {
  use<TNewState extends MiddlewareState>(
    middleware: PipelineMiddleware<TParams, TQuery, TBody, TState, TNewState>
  ): MiddlewarePipeline<TParams, TQuery, TBody, TNewState>;
  
  useMany<TNewState extends MiddlewareState>(
    ...middlewares: PipelineMiddleware<TParams, TQuery, TBody, TState, TNewState>[]
  ): MiddlewarePipeline<TParams, TQuery, TBody, TNewState>;
  
  execute(
    ctx: ContextWithState<TParams, TQuery, TBody, {}>,
    handler: StateHandler<TParams, TQuery, TBody, TState>
  ): Promise<Response>;
  
  static create<
    TParams extends Record<string, string> = {},
    TQuery extends Record<string, string> = {},
    TBody = unknown,
    TState extends MiddlewareState = {}
  >(initialState?: TState): MiddlewarePipeline<TParams, TQuery, TBody, TState>;
}

export declare class Imphnen {
  constructor(options?: ImphnenOptions);
  
  pipeline<TState extends MiddlewareState = {}>(
    initialState?: TState
  ): MiddlewarePipeline<{}, {}, unknown, TState>;
  
  use<TParams extends Record<string, string> = {}, TQuery extends Record<string, string> = {}, TBody = unknown>(
    middleware: Middleware<TParams, TQuery, TBody> | PipelineMiddleware<{}, {}, unknown, {}, any>
  ): this;
  
  route<
    TPath extends string,
    TState extends MiddlewareState,
    TBody = unknown
  >(
    method: HTTPMethod,
    path: TPath,
    pipeline: MiddlewarePipeline<RouteParams<TPath>, {}, TBody, TState>,
    handler: StateHandler<RouteParams<TPath>, {}, TBody, TState>
  ): this;
  
  get<TPath extends string, TState extends MiddlewareState = {}>(
    path: TPath,
    ...args: any[]
  ): this;
  
  post<TPath extends string, TBody = unknown, TState extends MiddlewareState = {}>(
    path: TPath,
    ...args: any[]
  ): this;
  
  put<TPath extends string, TBody = unknown, TState extends MiddlewareState = {}>(
    path: TPath,
    ...args: any[]
  ): this;
  
  delete<TPath extends string, TState extends MiddlewareState = {}>(
    path: TPath,
    ...args: any[]
  ): this;
  
  patch<TPath extends string, TBody = unknown, TState extends MiddlewareState = {}>(
    path: TPath,
    ...args: any[]
  ): this;
  
  listen(port?: number): Promise<void>;
  handler: (request: Request) => Promise<Response>;
  
  static middleware: typeof BuiltinMiddleware;
}

export declare function createStateMiddleware<
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
): PipelineMiddleware<TParams, TQuery, TBody, TInputState, TOutputState>;

export declare const BuiltinMiddleware: {
  auth: <TUser = { id: string; email: string }>() => PipelineMiddleware<any, any, any, {}, { user: TUser }>;
  cors: (options?: CorsOptions) => PipelineMiddleware<any, any, any, any, any>;
  logger: (prefix?: string) => PipelineMiddleware<any, any, any, any, any>;
  rateLimit: (options: { 
    windowMs: number;
    maxRequests: number;
    keyGenerator?: (ctx: any) => string;
  }) => PipelineMiddleware<any, any, any, any, any>;
  validate: <TSchema>(schema: {
    body?: (data: unknown) => data is TSchema;
    query?: (data: unknown) => boolean;
    params?: (data: unknown) => boolean;
  }) => PipelineMiddleware<any, any, any, {}, { validatedBody: TSchema }>;
  fileUpload: (options?: UploadOptions) => PipelineMiddleware<any, any, any, any, any>;
  static: (options: { root: string; prefix?: string }) => PipelineMiddleware<any, any, any, any, any>;
  proxy: (options: ProxyOptions) => PipelineMiddleware<any, any, any, any, any>;
};

// Utility functions
export declare function combineMiddleware<T extends MiddlewareState = {}>(
  ...middlewares: PipelineMiddleware<any, any, any, any, T>[]
): PipelineMiddleware<any, any, any, {}, T>;

export declare const combine: typeof combineMiddleware;

export declare type MiddlewareChain<T extends MiddlewareState = {}> = PipelineMiddleware<any, any, any, {}, T>[];

// Main factory functions
export declare function createApp(options?: ImphnenOptions): Imphnen;
export declare const createEnhancedApp: typeof createApp;
export declare const imphnen: typeof createApp; 