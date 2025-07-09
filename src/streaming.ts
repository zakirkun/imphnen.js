// Streaming utilities for imphnen.js

import type { StreamingOptions, ChunkOptions, ServerSentEventOptions } from './types.js';

/**
 * Creates a streaming response with a controller for writing data
 */
export async function createStreamingResponse(
  options: StreamingOptions = {}
): Promise<{
  response: Response;
  write: (chunk: string | Uint8Array) => void;
  close: () => void;
}> {
  const { contentType = 'text/plain', headers = {}, bufferSize = 1024 } = options;
  
  let controller: ReadableStreamDefaultController<Uint8Array>;
  
  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl;
    },
    cancel() {
      // Stream was cancelled
    }
  });

  const response = new Response(stream, {
    headers: {
      'Content-Type': contentType,
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...headers
    }
  });

  const write = (chunk: string | Uint8Array) => {
    if (!controller) {
      throw new Error('Stream controller not initialized');
    }
    
    const data = typeof chunk === 'string' 
      ? new TextEncoder().encode(chunk)
      : chunk;
    
    try {
      controller.enqueue(data);
    } catch (error) {
      console.error('Error writing to stream:', error);
    }
  };

  const close = () => {
    if (controller) {
      try {
        controller.close();
      } catch (error) {
        console.error('Error closing stream:', error);
      }
    }
  };

  return { response, write, close };
}

/**
 * Creates a response from an async generator that yields chunks
 */
export function createStreamResponse(
  generator: AsyncGenerator<string | Uint8Array, void, unknown>,
  options: StreamingOptions = {}
) {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const chunk of generator) {
          if (typeof chunk === 'string') {
            controller.enqueue(new TextEncoder().encode(chunk));
          } else {
            controller.enqueue(chunk);
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    }
  });

  const headers = new Headers({
    'Content-Type': options.contentType || 'text/plain; charset=utf-8',
    'Transfer-Encoding': 'chunked',
    'Cache-Control': 'no-cache',
    ...options.headers
  });

  return new Response(stream, { headers });
}

/**
 * Creates a chunked response using proper HTTP chunked encoding
 */
export function createChunkedResponse(
  options: ChunkOptions = {}
): {
  response: Response;
  writeChunk: (data: any) => void;
  close: () => void;
} {
  const { encoding = 'utf-8', headers = {} } = options;
  
  let controller: ReadableStreamDefaultController<Uint8Array>;
  
  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl;
    },
    cancel() {
      // Stream was cancelled
    }
  });

  const response = new Response(stream, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      ...headers
    }
  });

  const writeChunk = (data: any) => {
    if (!controller) {
      throw new Error('Stream controller not initialized');
    }
    
    let chunk: string;
    
    if (typeof data === 'string') {
      chunk = data;
    } else {
      chunk = JSON.stringify(data);
    }
    
    try {
      // Format as HTTP chunk with size in hex
      const chunkSize = Buffer.byteLength(chunk, encoding as BufferEncoding).toString(16);
      const formattedChunk = `${chunkSize}\r\n${chunk}\r\n`;
      
      controller.enqueue(new TextEncoder().encode(formattedChunk));
    } catch (error) {
      console.error('Error writing chunk:', error);
    }
  };

  const close = () => {
    if (controller) {
      try {
        // Send terminating chunk
        controller.enqueue(new TextEncoder().encode('0\r\n\r\n'));
        controller.close();
      } catch (error) {
        console.error('Error closing chunked stream:', error);
      }
    }
  };

  return { response, writeChunk, close };
}

/**
 * Creates a Server-Sent Events response
 */
export function createSSEResponse(
  options: ServerSentEventOptions = {}
): {
  response: Response;
  writeEvent: (data: any, eventOptions?: ServerSentEventOptions) => void;
  close: () => void;
} {
  const { headers = {} } = options;
  
  let controller: ReadableStreamDefaultController<Uint8Array>;
  
  const stream = new ReadableStream<Uint8Array>({
    start(ctrl) {
      controller = ctrl;
    },
    cancel() {
      // Stream was cancelled
    }
  });

  const response = new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
      ...headers
    }
  });

  const writeEvent = (data: any, eventOptions: ServerSentEventOptions = {}) => {
    if (!controller) {
      throw new Error('Stream controller not initialized');
    }
    
    let sseData = '';
    
    if (eventOptions.id) {
      sseData += `id: ${eventOptions.id}\n`;
    }
    
    if (eventOptions.event) {
      sseData += `event: ${eventOptions.event}\n`;
    }
    
    if (eventOptions.retry) {
      sseData += `retry: ${eventOptions.retry}\n`;
    }
    
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    sseData += `data: ${dataString}\n\n`;
    
    try {
      controller.enqueue(new TextEncoder().encode(sseData));
    } catch (error) {
      console.error('Error writing SSE event:', error);
    }
  };

  const close = () => {
    if (controller) {
      try {
        controller.close();
      } catch (error) {
        console.error('Error closing SSE stream:', error);
      }
    }
  };

  return { response, writeEvent, close };
}

/**
 * Helper to format data as JSON lines (JSONL)
 */
export async function* jsonLines<T>(items: T[]): AsyncGenerator<string, void, unknown> {
  for (const item of items) {
    yield JSON.stringify(item) + '\n';
  }
}

/**
 * Helper to create a delay for streaming demonstrations
 */
export function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Helper to stream large datasets in chunks
 */
export async function* streamArray<T>(
  array: T[],
  chunkSize: number = 100,
  delayMs: number = 0
): AsyncGenerator<T[], void, unknown> {
  for (let i = 0; i < array.length; i += chunkSize) {
    const chunk = array.slice(i, i + chunkSize);
    yield chunk;
    
    if (delayMs > 0) {
      await delay(delayMs);
    }
  }
}

/**
 * Helper to simulate real-time data streaming
 */
export async function* simulateRealTimeData(
  count: number = 10,
  intervalMs: number = 1000
): AsyncGenerator<{ timestamp: string; value: number; id: number }, void, unknown> {
  for (let i = 0; i < count; i++) {
    yield {
      id: i + 1,
      timestamp: new Date().toISOString(),
      value: Math.random() * 100
    };
    
    if (i < count - 1) {
      await delay(intervalMs);
    }
  }
} 