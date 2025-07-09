// Core type definitions for imphnen.js framework

export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

// Enhanced route parameter parsing with better type inference
export type RouteParams<T extends string> = 
  T extends `${infer _Start}:${infer Param}/${infer Rest}`
    ? { [K in Param]: string } & RouteParams<`/${Rest}`>
    : T extends `${infer _Start}:${infer Param}?/${infer Rest}`
    ? { [K in Param]?: string } & RouteParams<`/${Rest}`>
    : T extends `${infer _Start}:${infer Param}`
    ? { [K in Param]: string }
    : T extends `${infer _Start}:${infer Param}?`
    ? { [K in Param]?: string }
    : {};

// Fallback route params type for complex patterns
export type AnyRouteParams = Record<string, string>;

// WebSocket context with support for both required and optional params
export interface WebSocketContext<TParams extends Record<string, string | undefined> = {}> {
  ws: WebSocket;
  params: TParams;
  query: Record<string, string>;
  headers: Headers;
  url: URL;
}

// WebSocket handler with support for optional params
export type WebSocketHandler<TParams extends Record<string, string | undefined> = {}> = {
  open?: (ctx: WebSocketContext<TParams>) => void | Promise<void>;
  message?: (ctx: WebSocketContext<TParams>, message: string | Buffer) => void | Promise<void>;
  close?: (ctx: WebSocketContext<TParams>, code?: number, reason?: string) => void | Promise<void>;
  error?: (ctx: WebSocketContext<TParams>, error: Error) => void | Promise<void>;
};

// WebSocket route interface
export interface WebSocketRoute {
  path: string;
  handler: WebSocketHandler<any>;
}

// File upload types
export interface UploadedFile {
  name: string;
  type: string;
  size: number;
  stream: ReadableStream<Uint8Array>;
  arrayBuffer(): Promise<ArrayBuffer>;
  text(): Promise<string>;
  bytes(): Promise<Uint8Array>;
}

export type RequestBody = 
  | Record<string, unknown>
  | string
  | ArrayBuffer
  | Uint8Array
  | FormData
  | UploadedFile[]
  | null;

// Generic body type with file upload support
export type ParsedBody<T = unknown> = T extends FormData 
  ? { files: UploadedFile[]; fields: Record<string, string> }
  : T;

// Proxy request options
export interface ProxyOptions {
  target: string;
  changeOrigin?: boolean;
  pathRewrite?: Record<string, string> | ((path: string) => string);
  headers?: Record<string, string>;
  timeout?: number;
  followRedirects?: boolean;
  onProxyReq?: (proxyReq: Request, req: Request) => void;
  onProxyRes?: (proxyRes: Response, req: Request) => void;
}

// Streaming response types
export interface StreamingOptions {
  contentType?: string;
  headers?: Record<string, string>;
  bufferSize?: number;
  flushInterval?: number;
}

export interface ChunkOptions {
  encoding?: 'utf-8' | 'base64' | 'hex';
  headers?: Record<string, string>;
}

export interface ServerSentEventOptions {
  id?: string;
  event?: string;
  retry?: number;
  headers?: Record<string, string>;
}

// Enhanced context with streaming support
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
  // Enhanced file handling
  files?: UploadedFile[];
  // Response helpers
  set: {
    headers: (headers: Record<string, string>) => void;
    status: (status: number) => void;
  };
  json: <T>(data: T, init?: ResponseInit) => Response;
  text: (text: string, init?: ResponseInit) => Response;
  html: (html: string, init?: ResponseInit) => Response;
  redirect: (url: string, status?: number) => Response;
  // File response helpers
  file: (path: string, options?: { contentType?: string; download?: boolean }) => Promise<Response>;
  stream: (stream: ReadableStream, contentType?: string) => Response;
  // Proxy helper
  proxy: (options: ProxyOptions) => Promise<Response>;
  // Streaming response helpers
  createStream: (options?: StreamingOptions) => Promise<{
    controller: ReadableStreamDefaultController<Uint8Array>;
    response: Response;
    write: (chunk: string | Uint8Array) => void;
    writeChunk: (data: any, options?: ChunkOptions) => void;
    writeSSE: (data: any, options?: ServerSentEventOptions) => void;
    close: () => void;
  }>;
  streamResponse: (generator: AsyncGenerator<string | Uint8Array, void, unknown>, options?: StreamingOptions) => Response;
  chunkedResponse: (chunks: (string | Uint8Array)[], options?: ChunkOptions) => Response;
  sseResponse: (generator: AsyncGenerator<any, void, unknown>, options?: ServerSentEventOptions) => Response;
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

// Combined middleware type for chaining
export type CombinedMiddleware<
  TParams extends Record<string, string> = {},
  TQuery extends Record<string, string> = {},
  TBody = unknown
> = Middleware<TParams, TQuery, TBody>[];

export interface RouteDefinition {
  method: HTTPMethod;
  path: string;
  handler: Handler<any>;
  middlewares: Middleware<any>[];
}

export interface ImphnenOptions {
  port?: number;
  hostname?: string;
  development?: boolean;
  cors?: boolean | {
    origin?: string | string[];
    methods?: HTTPMethod[];
    headers?: string[];
  };
  // File upload options
  uploads?: {
    maxFileSize?: number; // in bytes
    maxFiles?: number;
    allowedTypes?: string[];
    destination?: string;
  };
  // Proxy options
  proxy?: {
    trustProxy?: boolean;
    timeout?: number;
  };
  // WebSocket options
  websocket?: {
    maxPayloadLength?: number;
    idleTimeout?: number;
    backpressureLimit?: number;
    compression?: boolean;
  };
} 