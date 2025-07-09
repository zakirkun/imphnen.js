// Utility functions for imphnen.js framework
import type { UploadedFile, ProxyOptions, CombinedMiddleware, Middleware, ImphnenOptions } from './types.js';

// Enhanced route parameter parsing with optional parameters support
export function parseURLParams<T extends Record<string, string>>(
  pattern: string,
  pathname: string
): T {
  const patternParts = pattern.split('/');
  const pathParts = pathname.split('/');
  const params: Record<string, string> = {};

  // Handle different lengths for optional parameters
  const minLength = Math.min(patternParts.length, pathParts.length);
  const maxLength = Math.max(patternParts.length, pathParts.length);

  for (let i = 0; i < maxLength; i++) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (!patternPart) continue;

    if (patternPart.startsWith(':')) {
      const paramName = patternPart.slice(1);
      const isOptional = paramName.endsWith('?');
      const cleanParamName = isOptional ? paramName.slice(0, -1) : paramName;
      
      if (pathPart) {
        params[cleanParamName] = decodeURIComponent(pathPart);
      } else if (!isOptional) {
        return {} as T; // Required param missing
      }
    } else if (patternPart !== pathPart && i < minLength) {
      return {} as T;
    }
  }

  return params as T;
}

export function parseQuery<T extends Record<string, string>>(url: URL): T {
  const query: Record<string, string> = {};
  
  for (const [key, value] of url.searchParams.entries()) {
    query[key] = value;
  }
  
  return query as T;
}

export function matchRoute(pattern: string, pathname: string): boolean {
  const patternParts = pattern.split('/');
  const pathParts = pathname.split('/');

  // Handle optional parameters
  const minPatternLength = patternParts.filter(part => 
    !part.startsWith(':') || !part.endsWith('?')
  ).length;
  
  if (pathParts.length < minPatternLength) {
    return false;
  }

  if (pathParts.length > patternParts.length) {
    return false;
  }

  return patternParts.every((part, i) => {
    const pathPart = pathParts[i];
    
    if (part.startsWith(':')) {
      const isOptional = part.endsWith('?');
      return pathPart !== undefined || isOptional;
    }
    
    return part === pathPart;
  });
}

// Enhanced body parsing with file upload support
export async function parseBody(request: Request, options?: ImphnenOptions['uploads']): Promise<{
  body: unknown;
  files?: UploadedFile[];
}> {
  const contentType = request.headers.get('content-type') || '';

  // Handle multipart/form-data (file uploads)
  if (contentType.includes('multipart/form-data')) {
    try {
      const formData = await request.formData();
      const files: UploadedFile[] = [];
      const fields: Record<string, string> = {};

      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          // Validate file if options provided
          if (options) {
            if (options.maxFileSize && value.size > options.maxFileSize) {
              throw new Error(`File ${value.name} exceeds maximum size of ${options.maxFileSize} bytes`);
            }
            
            if (options.allowedTypes && !options.allowedTypes.includes(value.type)) {
              throw new Error(`File type ${value.type} is not allowed`);
            }
          }

          const uploadedFile: UploadedFile = {
            name: value.name,
            type: value.type,
            size: value.size,
            stream: value.stream(),
            arrayBuffer: () => value.arrayBuffer(),
            text: () => value.text(),
            bytes: async () => new Uint8Array(await value.arrayBuffer())
          };
          
          files.push(uploadedFile);
        } else {
          fields[key] = value.toString();
        }
      }

      // Validate file count
      if (options?.maxFiles && files.length > options.maxFiles) {
        throw new Error(`Too many files. Maximum allowed: ${options.maxFiles}`);
      }

      return {
        body: { fields, files },
        files
      };
    } catch (error) {
      throw new Error(`File upload error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Handle JSON
  if (contentType.includes('application/json')) {
    try {
      return { body: await request.json() };
    } catch {
      return { body: null };
    }
  }

  // Handle form data
  if (contentType.includes('application/x-www-form-urlencoded')) {
    try {
      const formData = await request.formData();
      const data: Record<string, string> = {};
      for (const [key, value] of formData.entries()) {
        data[key] = value.toString();
      }
      return { body: data };
    } catch {
      return { body: null };
    }
  }

  // Handle text
  if (contentType.includes('text/')) {
    try {
      return { body: await request.text() };
    } catch {
      return { body: null };
    }
  }

  // Handle binary data
  if (contentType.includes('application/octet-stream') || contentType.includes('application/binary')) {
    try {
      return { body: await request.arrayBuffer() };
    } catch {
      return { body: null };
    }
  }

  return { body: null };
}

// Proxy request implementation
export async function proxyRequest(request: Request, options: ProxyOptions): Promise<Response> {
  const url = new URL(request.url);
  let targetPath = url.pathname + url.search;

  // Apply path rewriting
  if (options.pathRewrite) {
    if (typeof options.pathRewrite === 'function') {
      targetPath = options.pathRewrite(targetPath);
    } else {
      for (const [pattern, replacement] of Object.entries(options.pathRewrite)) {
        targetPath = targetPath.replace(new RegExp(pattern), replacement);
      }
    }
  }

  const targetUrl = new URL(targetPath, options.target);
  
  // Prepare headers
  const headers = new Headers(request.headers);
  
  // Change origin if requested
  if (options.changeOrigin) {
    headers.set('host', targetUrl.host);
    headers.delete('origin');
  }

  // Add custom headers
  if (options.headers) {
    for (const [key, value] of Object.entries(options.headers)) {
      headers.set(key, value);
    }
  }

  // Create proxy request
  const proxyRequest = new Request(targetUrl.toString(), {
    method: request.method,
    headers,
    body: request.body,
    // @ts-ignore - Bun supports these options
    redirect: options.followRedirects ? 'follow' : 'manual'
  });

  // Call onProxyReq hook
  if (options.onProxyReq) {
    options.onProxyReq(proxyRequest, request);
  }

  try {
    // Make the proxy request with timeout
    const controller = new AbortController();
    const timeoutId = options.timeout 
      ? setTimeout(() => controller.abort(), options.timeout)
      : null;

    const response = await fetch(proxyRequest, {
      signal: controller.signal
    });

    if (timeoutId) clearTimeout(timeoutId);

    // Call onProxyRes hook
    if (options.onProxyRes) {
      options.onProxyRes(response, request);
    }

    return response;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      return new Response('Proxy timeout', { status: 504 });
    }
    throw error;
  }
}

// Combined middleware functionality
export function combineMiddleware<
  TParams extends Record<string, string> = {},
  TQuery extends Record<string, string> = {},
  TBody = unknown
>(...middlewares: Middleware<TParams, TQuery, TBody>[]): Middleware<TParams, TQuery, TBody> {
  return async (ctx, next) => {
    let index = 0;

    async function dispatch(i: number): Promise<Response> {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }
      index = i;

      const middleware = middlewares[i];
      if (!middleware) {
        return await next();
      }

      return await middleware(ctx, () => dispatch(i + 1));
    }

    return await dispatch(0);
  };
}

// Utility for creating middleware chains
export class MiddlewareChain<
  TParams extends Record<string, string> = {},
  TQuery extends Record<string, string> = {},
  TBody = unknown
> {
  private middlewares: Middleware<TParams, TQuery, TBody>[] = [];

  add(middleware: Middleware<TParams, TQuery, TBody>): this {
    this.middlewares.push(middleware);
    return this;
  }

  addMany(...middlewares: Middleware<TParams, TQuery, TBody>[]): this {
    this.middlewares.push(...middlewares);
    return this;
  }

  build(): Middleware<TParams, TQuery, TBody> {
    return combineMiddleware(...this.middlewares);
  }

  async execute(ctx: any, finalHandler: any): Promise<Response> {
    const combined = this.build();
    return await combined(ctx, async () => finalHandler(ctx));
  }
}

export function createResponse(
  data: unknown,
  init?: ResponseInit
): Response {
  if (data instanceof Response) {
    return data;
  }

  const headers: Record<string, string> = {};
  
  // Copy headers from init if provided
  if (init?.headers) {
    if (init.headers instanceof Headers) {
      for (const [key, value] of init.headers.entries()) {
        headers[key] = value;
      }
    } else if (Array.isArray(init.headers)) {
      for (const [key, value] of init.headers) {
        headers[key] = value;
      }
    } else {
      Object.assign(headers, init.headers);
    }
  }

  if (typeof data === 'string') {
    if (!headers['content-type']) {
      headers['content-type'] = 'text/plain; charset=utf-8';
    }
    return new Response(data, { ...init, headers });
  }

  if (typeof data === 'object' && data !== null) {
    if (!headers['content-type']) {
      headers['content-type'] = 'application/json; charset=utf-8';
    }
    return new Response(JSON.stringify(data), { ...init, headers });
  }

  return new Response(String(data), { ...init, headers });
}

// File serving utility
export async function serveFile(
  path: string, 
  options?: { contentType?: string; download?: boolean }
): Promise<Response> {
  try {
    const file = Bun.file(path);
    const exists = await file.exists();
    
    if (!exists) {
      return new Response('File not found', { status: 404 });
    }

    const headers: Record<string, string> = {};
    
    if (options?.contentType) {
      headers['content-type'] = options.contentType;
    } else {
      // Auto-detect content type based on extension
      const ext = path.split('.').pop()?.toLowerCase();
      const mimeTypes: Record<string, string> = {
        'html': 'text/html',
        'css': 'text/css',
        'js': 'application/javascript',
        'json': 'application/json',
        'png': 'image/png',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'gif': 'image/gif',
        'svg': 'image/svg+xml',
        'pdf': 'application/pdf',
        'txt': 'text/plain'
      };
      headers['content-type'] = ext && mimeTypes[ext] || 'application/octet-stream';
    }

    if (options?.download) {
      const filename = path.split('/').pop() || 'download';
      headers['content-disposition'] = `attachment; filename="${filename}"`;
    }

    return new Response(file, { headers });
  } catch (error) {
    return new Response('Internal server error', { status: 500 });
  }
} 