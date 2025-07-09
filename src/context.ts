// Context implementation for imphnen.js framework

import type { Context as ContextType, UploadedFile, ProxyOptions } from './types.js';
import { createResponse, proxyRequest, serveFile } from './utils.js';

export function createContext<
  TParams extends Record<string, string> = {},
  TQuery extends Record<string, string> = {},
  TBody = unknown
>(
  req: Request,
  params: TParams,
  query: TQuery,
  body: TBody,
  files?: UploadedFile[]
): ContextType<TParams, TQuery, TBody> {
  let responseHeaders = new Headers();
  let responseStatus = 200;

  const context: ContextType<TParams, TQuery, TBody> = {
    req,
    params,
    query,
    body,
    headers: req.headers,
    files,
    
    set: {
      headers: (headers: Record<string, string>) => {
        for (const [key, value] of Object.entries(headers)) {
          responseHeaders.set(key, value);
        }
      },
      status: (status: number) => {
        responseStatus = status;
      }
    },

    json: <T>(data: T, init?: ResponseInit) => {
      const mergedHeaders = new Headers();
      
      // Add response headers
      for (const [key, value] of responseHeaders.entries()) {
        mergedHeaders.set(key, value);
      }
      
      // Set content type
      mergedHeaders.set('content-type', 'application/json; charset=utf-8');
      
      // Add init headers if provided
      if (init?.headers) {
        // Convert HeadersInit to Headers for proper iteration
        if (init.headers instanceof Headers) {
          for (const [key, value] of init.headers.entries()) {
            mergedHeaders.set(key, value);
          }
        } else if (Array.isArray(init.headers)) {
          for (const [key, value] of init.headers) {
            mergedHeaders.set(key, value);
          }
        } else {
          for (const [key, value] of Object.entries(init.headers)) {
            mergedHeaders.set(key, value);
          }
        }
      }
      
      return createResponse(data, {
        status: init?.status || responseStatus,
        headers: mergedHeaders
      });
    },

    text: (text: string, init?: ResponseInit) => {
      const mergedHeaders = new Headers();
      
      // Add response headers
      for (const [key, value] of responseHeaders.entries()) {
        mergedHeaders.set(key, value);
      }
      
      // Set content type
      mergedHeaders.set('content-type', 'text/plain; charset=utf-8');
      
      // Add init headers if provided
      if (init?.headers) {
        // Convert HeadersInit to Headers for proper iteration
        if (init.headers instanceof Headers) {
          for (const [key, value] of init.headers.entries()) {
            mergedHeaders.set(key, value);
          }
        } else if (Array.isArray(init.headers)) {
          for (const [key, value] of init.headers) {
            mergedHeaders.set(key, value);
          }
        } else {
          for (const [key, value] of Object.entries(init.headers)) {
            mergedHeaders.set(key, value);
          }
        }
      }
      
      return createResponse(text, {
        status: init?.status || responseStatus,
        headers: mergedHeaders
      });
    },

    html: (html: string, init?: ResponseInit) => {
      const mergedHeaders = new Headers();
      
      // Add response headers
      for (const [key, value] of responseHeaders.entries()) {
        mergedHeaders.set(key, value);
      }
      
      // Set content type
      mergedHeaders.set('content-type', 'text/html; charset=utf-8');
      
      // Add init headers if provided
      if (init?.headers) {
        // Convert HeadersInit to Headers for proper iteration
        if (init.headers instanceof Headers) {
          for (const [key, value] of init.headers.entries()) {
            mergedHeaders.set(key, value);
          }
        } else if (Array.isArray(init.headers)) {
          for (const [key, value] of init.headers) {
            mergedHeaders.set(key, value);
          }
        } else {
          for (const [key, value] of Object.entries(init.headers)) {
            mergedHeaders.set(key, value);
          }
        }
      }
      
      return createResponse(html, {
        status: init?.status || responseStatus,
        headers: mergedHeaders
      });
    },

    redirect: (url: string, status: number = 302) => {
      return new Response(null, {
        status,
        headers: {
          ...Object.fromEntries(responseHeaders.entries()),
          'Location': url
        }
      });
    },

    // File serving capability
    file: async (path: string, options?: { contentType?: string; download?: boolean }) => {
      const response = await serveFile(path, options);
      
      // Apply any set headers and status
      const headers = new Headers(response.headers);
      for (const [key, value] of responseHeaders.entries()) {
        headers.set(key, value);
      }
      
      return new Response(response.body, {
        status: responseStatus !== 200 ? responseStatus : response.status,
        headers
      });
    },

    // Stream response capability
    stream: (stream: ReadableStream, contentType?: string) => {
      const headers = {
        ...Object.fromEntries(responseHeaders.entries()),
        'content-type': contentType || 'application/octet-stream'
      };
      
      return new Response(stream, {
        status: responseStatus,
        headers
      });
    },

    // Proxy capability
    proxy: async (options: ProxyOptions) => {
      const response = await proxyRequest(req, options);
      
      // Apply any set headers
      const headers = new Headers(response.headers);
      for (const [key, value] of responseHeaders.entries()) {
        headers.set(key, value);
      }
      
      return new Response(response.body, {
        status: responseStatus !== 200 ? responseStatus : response.status,
        headers
      });
    }
  };

  return context;
} 