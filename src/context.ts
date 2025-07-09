// Context implementation for imphnen.js framework

import type { Context as ContextType, UploadedFile, ProxyOptions, StreamingOptions, ChunkOptions, ServerSentEventOptions } from './types.js';
import { createResponse, proxyRequest, serveFile } from './utils.js';
import { 
  createStreamingResponse, 
  createStreamResponse, 
  createChunkedResponse, 
  createSSEResponse 
} from './streaming.js';

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
    },

    // Streaming response methods
    createStream: async (options?: StreamingOptions) => {
      const streamOptions = {
        ...options,
        headers: {
          ...Object.fromEntries(responseHeaders.entries()),
          ...(options?.headers || {})
        }
      };
      
      const streamResult = await createStreamingResponse(streamOptions);
      
      return {
        controller: undefined as any, // Legacy compatibility
        response: streamResult.response,
        write: streamResult.write,
        writeChunk: (data: any, chunkOptions?: ChunkOptions) => {
          // For chunked encoding, we need to format the data properly
          let chunk: string;
          if (typeof data === 'string') {
            chunk = data;
          } else {
            chunk = JSON.stringify(data);
          }
          
          const encoding = chunkOptions?.encoding || 'utf-8';
          const chunkSize = Buffer.byteLength(chunk, encoding as BufferEncoding).toString(16);
          const formattedChunk = `${chunkSize}\r\n${chunk}\r\n`;
          
          streamResult.write(formattedChunk);
        },
        writeSSE: (data: any, sseOptions?: ServerSentEventOptions) => {
          let sseData = '';
          
          if (sseOptions?.id) {
            sseData += `id: ${sseOptions.id}\n`;
          }
          
          if (sseOptions?.event) {
            sseData += `event: ${sseOptions.event}\n`;
          }
          
          if (sseOptions?.retry) {
            sseData += `retry: ${sseOptions.retry}\n`;
          }
          
          const dataString = typeof data === 'string' ? data : JSON.stringify(data);
          sseData += `data: ${dataString}\n\n`;
          
          streamResult.write(sseData);
        },
        close: streamResult.close
      };
    },

    streamResponse: (generator: AsyncGenerator<string | Uint8Array, void, unknown>, options?: StreamingOptions) => {
      const streamOptions = {
        ...options,
        headers: {
          ...Object.fromEntries(responseHeaders.entries()),
          ...(options?.headers || {})
        }
      };
      
      return createStreamResponse(generator, streamOptions);
    },

    chunkedResponse: (chunks: (string | Uint8Array)[], options?: ChunkOptions) => {
      const chunkOptions = {
        ...options,
        headers: {
          ...Object.fromEntries(responseHeaders.entries()),
          ...(options?.headers || {})
        }
      };
      
      // Create a chunked response from the array
      const { response, writeChunk, close } = createChunkedResponse(chunkOptions);
      
      // Write all chunks and close
      setTimeout(async () => {
        try {
          for (const chunk of chunks) {
            writeChunk(chunk);
          }
          close();
        } catch (error) {
          console.error('Error writing chunks:', error);
        }
      }, 0);
      
      return response;
    },

    sseResponse: (generator: AsyncGenerator<any, void, unknown>, options?: ServerSentEventOptions) => {
      const sseOptions = {
        ...options,
        headers: {
          ...Object.fromEntries(responseHeaders.entries()),
          ...(options?.headers || {})
        }
      };
      
      // Create SSE response and handle the generator
      const { response, writeEvent, close } = createSSEResponse(sseOptions);
      
      // Process the async generator
      setTimeout(async () => {
        try {
          for await (const data of generator) {
            writeEvent(data, options);
          }
          close();
        } catch (error) {
          console.error('Error processing SSE generator:', error);
          close();
        }
      }, 0);
      
      return response;
    }
  };

  return context;
} 