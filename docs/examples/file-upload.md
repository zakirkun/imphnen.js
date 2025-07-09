# File Upload Examples

This document provides practical examples of file upload implementations using imphnen.js.

## Basic File Upload Server

```typescript
// upload-server.ts
import { createApp } from '../../src/index.js';
import { mkdir } from 'fs/promises';

const app = createApp({
  port: 3004,
  cors: true,
  uploads: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 10,
    allowedTypes: [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'application/pdf',
      'text/plain'
    ]
  }
});

// Ensure upload directory exists
await mkdir('./uploads', { recursive: true });

// Single file upload
app.post('/upload', async (ctx) => {
  if (!ctx.files?.length) {
    return ctx.json({ error: 'No files uploaded' }, { status: 400 });
  }

  const file = ctx.files[0];
  const buffer = await file.arrayBuffer();
  const filename = `${Date.now()}-${file.name}`;
  
  await Bun.write(`./uploads/${filename}`, buffer);
  
  return ctx.json({
    success: true,
    file: {
      original: file.name,
      saved: filename,
      size: file.size,
      type: file.type
    }
  });
});

await app.listen();
console.log('Upload server running on http://localhost:3004');
```

## Image Upload with Validation

```typescript
// image-upload.ts
import { createApp } from '../../src/index.js';
import { basename } from 'path';

const app = createApp({
  uploads: {
    maxFileSize: 2 * 1024 * 1024, // 2MB for images
    maxFiles: 5,
    allowedTypes: ['image/*']
  }
});

app.post('/upload/image', async (ctx) => {
  const file = ctx.files?.[0];
  if (!file) {
    return ctx.json({ error: 'No image provided' }, { status: 400 });
  }

  // Validate image type
  if (!file.type.startsWith('image/')) {
    return ctx.json({ error: 'Only images allowed' }, { status: 400 });
  }

  // Check file signature for additional security
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  const isValidImage = 
    // JPEG: FF D8 FF
    (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) ||
    // PNG: 89 50 4E 47
    (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4E && bytes[3] === 0x47) ||
    // GIF: 47 49 46 38
    (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38);

  if (!isValidImage) {
    return ctx.json({ error: 'Invalid image format' }, { status: 400 });
  }

  // Generate safe filename
  const ext = file.name.split('.').pop() || 'jpg';
  const safeName = basename(file.name, `.${ext}`).replace(/[^a-zA-Z0-9]/g, '_');
  const filename = `img_${Date.now()}_${safeName}.${ext}`;
  
  await Bun.write(`./uploads/images/${filename}`, buffer);

  return ctx.json({
    success: true,
    image: {
      filename,
      originalName: file.name,
      size: file.size,
      dimensions: await getImageDimensions(buffer), // Helper function
      url: `/images/${filename}`
    }
  });
});

// Helper function to get image dimensions (simplified)
async function getImageDimensions(buffer: ArrayBuffer) {
  // In real implementation, use image processing library
  // This is a placeholder
  return { width: 0, height: 0 };
}
```

## Multiple File Upload with Progress

```typescript
// multi-upload.ts
import { createApp } from '../../src/index.js';

const app = createApp({
  uploads: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 20
  }
});

app.post('/upload/batch', async (ctx) => {
  if (!ctx.files?.length) {
    return ctx.json({ error: 'No files provided' }, { status: 400 });
  }

  const results = [];
  const errors = [];

  for (let i = 0; i < ctx.files.length; i++) {
    const file = ctx.files[i];
    
    try {
      // Validate individual file
      if (file.size > 10 * 1024 * 1024) {
        errors.push({
          file: file.name,
          error: 'File too large',
          index: i
        });
        continue;
      }

      // Process file
      const buffer = await file.arrayBuffer();
      const filename = `batch_${Date.now()}_${i}_${file.name}`;
      await Bun.write(`./uploads/batch/${filename}`, buffer);

      results.push({
        original: file.name,
        saved: filename,
        size: file.size,
        type: file.type,
        index: i
      });

    } catch (error) {
      errors.push({
        file: file.name,
        error: error.message,
        index: i
      });
    }
  }

  return ctx.json({
    success: results.length > 0,
    uploaded: results.length,
    failed: errors.length,
    results,
    errors
  });
});

// Progress endpoint for large uploads
app.get('/upload/progress/:id', (ctx) => {
  const uploadId = ctx.params.id;
  // In real implementation, track upload progress
  return ctx.json({
    uploadId,
    progress: 75, // percentage
    status: 'uploading'
  });
});
```

## Document Upload with Metadata

```typescript
// document-upload.ts
import { createApp } from '../../src/index.js';

const app = createApp({
  uploads: {
    maxFileSize: 50 * 1024 * 1024, // 50MB for documents
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ]
  }
});

interface DocumentMetadata {
  title: string;
  description?: string;
  category: string;
  tags: string[];
}

app.post('/upload/document', async (ctx) => {
  const file = ctx.files?.[0];
  if (!file) {
    return ctx.json({ error: 'No document provided' }, { status: 400 });
  }

  // Parse metadata from form data
  const formData = ctx.body as any;
  const metadata: DocumentMetadata = {
    title: formData.title || file.name,
    description: formData.description,
    category: formData.category || 'general',
    tags: formData.tags ? formData.tags.split(',').map((t: string) => t.trim()) : []
  };

  // Validate metadata
  if (!metadata.title) {
    return ctx.json({ error: 'Document title required' }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const timestamp = Date.now();
  const filename = `doc_${timestamp}_${file.name}`;
  
  // Save file
  await Bun.write(`./uploads/documents/${filename}`, buffer);
  
  // Save metadata
  const docInfo = {
    id: timestamp.toString(),
    filename,
    originalName: file.name,
    size: file.size,
    type: file.type,
    uploadDate: new Date().toISOString(),
    metadata
  };
  
  await Bun.write(
    `./uploads/documents/${filename}.meta.json`,
    JSON.stringify(docInfo, null, 2)
  );

  return ctx.json({
    success: true,
    document: docInfo
  });
});

// Search documents
app.get('/documents/search', async (ctx) => {
  const { q, category, tags } = ctx.query;
  
  // In real implementation, use proper search engine
  // This is a simplified example
  
  return ctx.json({
    query: { q, category, tags },
    results: [] // Placeholder
  });
});
```

## Secure File Upload with Authentication

```typescript
// secure-upload.ts
import { createApp } from '../../src/index.js';

const app = createApp({
  uploads: {
    maxFileSize: 20 * 1024 * 1024,
    maxFiles: 5
  }
});

// Authentication middleware
const authMiddleware = async (ctx: any, next: any) => {
  const token = ctx.headers.get('authorization')?.replace('Bearer ', '');
  
  if (!token) {
    return ctx.json({ error: 'Authentication required' }, { status: 401 });
  }

  // Validate token (simplified)
  if (token !== 'valid-token') {
    return ctx.json({ error: 'Invalid token' }, { status: 401 });
  }

  // Add user info to context
  ctx.user = { id: '123', name: 'John Doe', role: 'user' };
  return await next();
};

// Protected upload endpoint
app.post('/upload/private', authMiddleware, async (ctx: any) => {
  const file = ctx.files?.[0];
  if (!file) {
    return ctx.json({ error: 'No file provided' }, { status: 400 });
  }

  // User-specific directory
  const userDir = `./uploads/users/${ctx.user.id}`;
  await mkdir(userDir, { recursive: true });

  const buffer = await file.arrayBuffer();
  const filename = `${Date.now()}-${file.name}`;
  const filepath = `${userDir}/${filename}`;
  
  await Bun.write(filepath, buffer);

  // Log upload activity
  console.log(`User ${ctx.user.name} uploaded file: ${filename}`);

  return ctx.json({
    success: true,
    file: {
      filename,
      size: file.size,
      owner: ctx.user.id,
      uploadDate: new Date().toISOString()
    }
  });
});

// List user's files
app.get('/files/my', authMiddleware, async (ctx: any) => {
  const userDir = `./uploads/users/${ctx.user.id}`;
  
  try {
    const files = await readdir(userDir);
    const fileList = [];
    
    for (const filename of files) {
      const stats = await stat(`${userDir}/${filename}`);
      fileList.push({
        name: filename,
        size: stats.size,
        created: stats.birthtime
      });
    }
    
    return ctx.json({ files: fileList });
  } catch (error) {
    return ctx.json({ files: [] });
  }
});
```

## Streaming Upload for Large Files

```typescript
// streaming-upload.ts
import { createApp } from '../../src/index.js';

const app = createApp({
  uploads: {
    maxFileSize: 1024 * 1024 * 1024, // 1GB
    maxFiles: 1
  }
});

app.post('/upload/large', async (ctx) => {
  const file = ctx.files?.[0];
  if (!file) {
    return ctx.json({ error: 'No file provided' }, { status: 400 });
  }

  const filename = `large_${Date.now()}_${file.name}`;
  const filepath = `./uploads/large/${filename}`;

  try {
    // Stream file to disk for large uploads
    const stream = file.stream();
    const fileWriter = Bun.file(filepath).writer();
    
    // Track progress
    let bytesWritten = 0;
    const totalSize = file.size;
    
    const transformStream = new TransformStream({
      transform(chunk, controller) {
        bytesWritten += chunk.length;
        const progress = Math.round((bytesWritten / totalSize) * 100);
        
        // In real implementation, broadcast progress via WebSocket
        console.log(`Upload progress: ${progress}%`);
        
        controller.enqueue(chunk);
      }
    });

    await stream
      .pipeThrough(transformStream)
      .pipeTo(fileWriter);

    return ctx.json({
      success: true,
      file: {
        filename,
        size: file.size,
        uploadComplete: true
      }
    });

  } catch (error) {
    console.error('Streaming upload failed:', error);
    return ctx.json({ 
      error: 'Upload failed',
      details: error.message 
    }, { status: 500 });
  }
});
```

## File Upload with Thumbnail Generation

```typescript
// thumbnail-upload.ts
import { createApp } from '../../src/index.js';

const app = createApp({
  uploads: {
    maxFileSize: 10 * 1024 * 1024,
    allowedTypes: ['image/*']
  }
});

app.post('/upload/thumbnail', async (ctx) => {
  const file = ctx.files?.[0];
  if (!file || !file.type.startsWith('image/')) {
    return ctx.json({ error: 'Image file required' }, { status: 400 });
  }

  const buffer = await file.arrayBuffer();
  const timestamp = Date.now();
  const ext = file.name.split('.').pop() || 'jpg';
  const baseName = `img_${timestamp}`;
  
  // Save original
  const originalPath = `./uploads/images/${baseName}.${ext}`;
  await Bun.write(originalPath, buffer);

  // Generate thumbnails (simplified - use image processing library)
  const thumbnails = await generateThumbnails(buffer, baseName, ext);

  return ctx.json({
    success: true,
    image: {
      original: `${baseName}.${ext}`,
      size: file.size,
      thumbnails,
      urls: {
        original: `/images/${baseName}.${ext}`,
        thumbnail: `/images/thumbs/${baseName}_thumb.${ext}`,
        medium: `/images/medium/${baseName}_med.${ext}`
      }
    }
  });
});

// Helper function (simplified)
async function generateThumbnails(buffer: ArrayBuffer, baseName: string, ext: string) {
  // In real implementation, use sharp, jimp, or similar library
  const thumbnails = [
    { size: 'thumbnail', width: 150, height: 150, path: `thumbs/${baseName}_thumb.${ext}` },
    { size: 'medium', width: 400, height: 400, path: `medium/${baseName}_med.${ext}` }
  ];

  // Create thumbnail directories
  await mkdir('./uploads/images/thumbs', { recursive: true });
  await mkdir('./uploads/images/medium', { recursive: true });

  // Generate thumbnails (placeholder - implement with image library)
  for (const thumb of thumbnails) {
    // const resized = await resizeImage(buffer, thumb.width, thumb.height);
    // await Bun.write(`./uploads/images/${thumb.path}`, resized);
  }

  return thumbnails;
}
```

## Complete Upload Application

```typescript
// complete-upload-app.ts
import { createApp } from '../../src/index.js';
import { readdir, stat, unlink, mkdir } from 'fs/promises';

const app = createApp({
  port: 3004,
  cors: true,
  staticFiles: {
    root: './uploads',
    prefix: '/files'
  },
  uploads: {
    maxFileSize: 25 * 1024 * 1024, // 25MB
    maxFiles: 10,
    allowedTypes: [
      'image/*',
      'application/pdf',
      'text/*',
      'application/json'
    ]
  }
});

// Initialize directories
await mkdir('./uploads/images', { recursive: true });
await mkdir('./uploads/documents', { recursive: true });
await mkdir('./uploads/temp', { recursive: true });

// Main upload endpoint
app.post('/api/upload', async (ctx) => {
  if (!ctx.files?.length) {
    return ctx.json({ error: 'No files uploaded' }, { status: 400 });
  }

  const results = [];
  for (const file of ctx.files) {
    try {
      const category = getFileCategory(file.type);
      const buffer = await file.arrayBuffer();
      const filename = generateSafeFilename(file.name);
      const filepath = `./uploads/${category}/${filename}`;
      
      await Bun.write(filepath, buffer);
      
      results.push({
        success: true,
        original: file.name,
        saved: filename,
        category,
        size: file.size,
        type: file.type,
        url: `/files/${category}/${filename}`
      });
    } catch (error) {
      results.push({
        success: false,
        original: file.name,
        error: error.message
      });
    }
  }

  return ctx.json({ results });
});

// List all files
app.get('/api/files', async (ctx) => {
  const categories = ['images', 'documents'];
  const allFiles = [];

  for (const category of categories) {
    try {
      const files = await readdir(`./uploads/${category}`);
      for (const filename of files) {
        const stats = await stat(`./uploads/${category}/${filename}`);
        allFiles.push({
          name: filename,
          category,
          size: stats.size,
          created: stats.birthtime,
          url: `/files/${category}/${filename}`
        });
      }
    } catch (error) {
      // Category directory doesn't exist or other error
    }
  }

  return ctx.json({ files: allFiles });
});

// Delete file
app.delete('/api/files/:category/:filename', async (ctx) => {
  const { category, filename } = ctx.params;
  
  // Validate category
  if (!['images', 'documents'].includes(category)) {
    return ctx.json({ error: 'Invalid category' }, { status: 400 });
  }
  
  // Validate filename (prevent path traversal)
  if (filename.includes('..') || filename.includes('/')) {
    return ctx.json({ error: 'Invalid filename' }, { status: 400 });
  }

  try {
    await unlink(`./uploads/${category}/${filename}`);
    return ctx.json({ success: true, message: 'File deleted' });
  } catch (error) {
    return ctx.json({ error: 'File not found' }, { status: 404 });
  }
});

// File info endpoint
app.get('/api/files/:category/:filename/info', async (ctx) => {
  const { category, filename } = ctx.params;
  const filepath = `./uploads/${category}/${filename}`;

  try {
    const stats = await stat(filepath);
    return ctx.json({
      name: filename,
      category,
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime,
      url: `/files/${category}/${filename}`
    });
  } catch (error) {
    return ctx.json({ error: 'File not found' }, { status: 404 });
  }
});

// Utility functions
function getFileCategory(mimeType: string): string {
  if (mimeType.startsWith('image/')) return 'images';
  return 'documents';
}

function generateSafeFilename(originalName: string): string {
  const timestamp = Date.now();
  const name = originalName.replace(/[^a-zA-Z0-9.-]/g, '_');
  return `${timestamp}_${name}`;
}

// Serve upload form
app.get('/', (ctx) => {
  return ctx.html(`
    <!DOCTYPE html>
    <html>
    <head>
        <title>File Upload Demo</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 40px; }
            .upload-area { border: 2px dashed #ccc; padding: 20px; text-align: center; }
            .file-list { margin-top: 20px; }
            .file-item { padding: 10px; border: 1px solid #eee; margin: 5px 0; }
        </style>
    </head>
    <body>
        <h1>File Upload Demo</h1>
        <div class="upload-area">
            <input type="file" id="fileInput" multiple>
            <button onclick="uploadFiles()">Upload Files</button>
        </div>
        <div id="fileList" class="file-list"></div>
        
        <script>
            async function uploadFiles() {
                const input = document.getElementById('fileInput');
                const formData = new FormData();
                
                for (const file of input.files) {
                    formData.append('files', file);
                }
                
                try {
                    const response = await fetch('/api/upload', {
                        method: 'POST',
                        body: formData
                    });
                    
                    const result = await response.json();
                    console.log('Upload result:', result);
                    loadFileList();
                } catch (error) {
                    console.error('Upload failed:', error);
                }
            }
            
            async function loadFileList() {
                try {
                    const response = await fetch('/api/files');
                    const data = await response.json();
                    
                    const fileList = document.getElementById('fileList');
                    fileList.innerHTML = data.files.map(file => 
                        '<div class="file-item">' +
                        '<strong>' + file.name + '</strong> (' + file.size + ' bytes) - ' +
                        '<a href="' + file.url + '" target="_blank">View</a> | ' +
                        '<button onclick="deleteFile(\\''+file.category+'\\', \\''+file.name+'\\')">Delete</button>' +
                        '</div>'
                    ).join('');
                } catch (error) {
                    console.error('Failed to load files:', error);
                }
            }
            
            async function deleteFile(category, filename) {
                try {
                    await fetch('/api/files/' + category + '/' + filename, {
                        method: 'DELETE'
                    });
                    loadFileList();
                } catch (error) {
                    console.error('Delete failed:', error);
                }
            }
            
            // Load files on page load
            loadFileList();
        </script>
    </body>
    </html>
  `);
});

await app.listen();
console.log('Complete upload application running on http://localhost:3004');
```

These examples demonstrate various file upload scenarios and can be adapted for specific use cases. The complete upload application provides a working interface for testing all functionality. 