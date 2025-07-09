# File Upload Guide

This guide covers everything you need to know about implementing file uploads with imphnen.js.

## Quick Start

Enable file uploads in your application:

```typescript
import { createApp } from './src/index.js';

const app = createApp({
  uploads: {
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 10,
    allowedTypes: ['image/*', 'application/pdf']
  }
});

app.post('/upload', async (ctx) => {
  if (!ctx.files?.length) {
    return ctx.json({ error: 'No files uploaded' }, { status: 400 });
  }
  
  return ctx.json({ 
    uploaded: ctx.files.length,
    files: ctx.files.map(f => ({ name: f.name, size: f.size }))
  });
});
```

## Configuration

### Upload Options

```typescript
interface UploadOptions {
  maxFileSize?: number;     // Max size per file (bytes)
  maxFiles?: number;        // Max files per request
  allowedTypes?: string[];  // Allowed MIME types
  destination?: string;     // Upload directory
}
```

### Examples

```typescript
// Basic configuration
const app = createApp({
  uploads: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5
  }
});

// Strict configuration
const app = createApp({
  uploads: {
    maxFileSize: 2 * 1024 * 1024,  // 2MB
    maxFiles: 3,
    allowedTypes: [
      'image/jpeg',
      'image/png',
      'application/pdf'
    ],
    destination: './uploads'
  }
});
```

## File Processing

### Basic File Handling

```typescript
app.post('/upload', async (ctx) => {
  const file = ctx.files?.[0];
  if (!file) {
    return ctx.json({ error: 'No file provided' }, { status: 400 });
  }
  
  // Get file content as buffer
  const buffer = await file.arrayBuffer();
  
  // Save to filesystem
  const filename = `${Date.now()}-${file.name}`;
  await Bun.write(`./uploads/${filename}`, buffer);
  
  return ctx.json({
    success: true,
    filename,
    originalName: file.name,
    size: file.size,
    type: file.type
  });
});
```

### Multiple File Upload

```typescript
app.post('/upload/multiple', async (ctx) => {
  if (!ctx.files?.length) {
    return ctx.json({ error: 'No files provided' }, { status: 400 });
  }
  
  const results = [];
  for (const file of ctx.files) {
    const buffer = await file.arrayBuffer();
    const filename = `${Date.now()}-${Math.random()}-${file.name}`;
    await Bun.write(`./uploads/${filename}`, buffer);
    
    results.push({
      original: file.name,
      saved: filename,
      size: file.size,
      type: file.type
    });
  }
  
  return ctx.json({ files: results });
});
```

## Validation

### File Type Validation

```typescript
app.post('/upload/image', async (ctx) => {
  const file = ctx.files?.[0];
  if (!file) {
    return ctx.json({ error: 'No file provided' }, { status: 400 });
  }
  
  // Validate MIME type
  if (!file.type.startsWith('image/')) {
    return ctx.json({ error: 'Only images allowed' }, { status: 400 });
  }
  
  // Additional validation by extension
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif'];
  const hasValidExtension = allowedExtensions.some(ext => 
    file.name.toLowerCase().endsWith(ext)
  );
  
  if (!hasValidExtension) {
    return ctx.json({ error: 'Invalid file extension' }, { status: 400 });
  }
  
  // Process file...
});
```

### File Size Validation

```typescript
app.post('/upload', async (ctx) => {
  const file = ctx.files?.[0];
  if (!file) {
    return ctx.json({ error: 'No file provided' }, { status: 400 });
  }
  
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (file.size > maxSize) {
    return ctx.json({ 
      error: `File too large. Max size: ${maxSize} bytes` 
    }, { status: 413 });
  }
  
  // Process file...
});
```

## Security

### Path Traversal Prevention

```typescript
import { basename, join } from 'path';

app.post('/upload', async (ctx) => {
  const file = ctx.files?.[0];
  if (!file) {
    return ctx.json({ error: 'No file provided' }, { status: 400 });
  }
  
  // Sanitize filename - prevent path traversal
  const safeName = basename(file.name);
  const timestamp = Date.now();
  const filename = `${timestamp}-${safeName}`;
  
  // Ensure upload directory exists
  const uploadDir = './uploads';
  await mkdir(uploadDir, { recursive: true });
  
  // Save securely
  const filepath = join(uploadDir, filename);
  const buffer = await file.arrayBuffer();
  await Bun.write(filepath, buffer);
  
  return ctx.json({ success: true, filename });
});
```

### Content Validation

```typescript
app.post('/upload/image', async (ctx) => {
  const file = ctx.files?.[0];
  if (!file) {
    return ctx.json({ error: 'No file provided' }, { status: 400 });
  }
  
  // Check file signature (magic bytes)
  const buffer = await file.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  
  // JPEG signature: FF D8 FF
  const isJPEG = bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF;
  
  // PNG signature: 89 50 4E 47
  const isPNG = bytes[0] === 0x89 && bytes[1] === 0x50 && 
                bytes[2] === 0x4E && bytes[3] === 0x47;
  
  if (!isJPEG && !isPNG) {
    return ctx.json({ error: 'Invalid image format' }, { status: 400 });
  }
  
  // Process valid image...
});
```

## Advanced Usage

### Streaming Large Files

```typescript
app.post('/upload/large', async (ctx) => {
  const file = ctx.files?.[0];
  if (!file) {
    return ctx.json({ error: 'No file provided' }, { status: 400 });
  }
  
  const filename = `${Date.now()}-${file.name}`;
  const filepath = `./uploads/${filename}`;
  
  // Stream large file to disk
  const stream = file.stream();
  const writableStream = Bun.file(filepath).writer();
  
  await stream.pipeTo(writableStream);
  
  return ctx.json({
    success: true,
    filename,
    size: file.size
  });
});
```

### Image Processing

```typescript
// Note: This example uses a hypothetical image processing library
app.post('/upload/process', async (ctx) => {
  const file = ctx.files?.[0];
  if (!file || !file.type.startsWith('image/')) {
    return ctx.json({ error: 'Image required' }, { status: 400 });
  }
  
  const buffer = await file.arrayBuffer();
  
  // Process image (resize, compress, etc.)
  // const processedBuffer = await processImage(buffer, {
  //   width: 800,
  //   height: 600,
  //   quality: 85
  // });
  
  const filename = `processed-${Date.now()}.jpg`;
  await Bun.write(`./uploads/${filename}`, buffer);
  
  return ctx.json({
    success: true,
    original: file.name,
    processed: filename
  });
});
```

## File Management

### List Files

```typescript
import { readdir, stat } from 'fs/promises';

app.get('/files', async (ctx) => {
  try {
    const files = await readdir('./uploads');
    const fileList = [];
    
    for (const filename of files) {
      const stats = await stat(`./uploads/${filename}`);
      fileList.push({
        name: filename,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      });
    }
    
    return ctx.json({ files: fileList });
  } catch (error) {
    return ctx.json({ error: 'Failed to list files' }, { status: 500 });
  }
});
```

### Download Files

```typescript
app.get('/download/:filename', async (ctx) => {
  const filename = ctx.params.filename;
  
  // Validate filename (prevent path traversal)
  if (filename.includes('..') || filename.includes('/')) {
    return ctx.json({ error: 'Invalid filename' }, { status: 400 });
  }
  
  const filepath = `./uploads/${filename}`;
  
  try {
    return await ctx.file(filepath, {
      download: true,
      filename: `download-${filename}`
    });
  } catch (error) {
    return ctx.json({ error: 'File not found' }, { status: 404 });
  }
});
```

### Delete Files

```typescript
import { unlink } from 'fs/promises';

app.delete('/files/:filename', async (ctx) => {
  const filename = ctx.params.filename;
  
  // Validate filename
  if (filename.includes('..') || filename.includes('/')) {
    return ctx.json({ error: 'Invalid filename' }, { status: 400 });
  }
  
  const filepath = `./uploads/${filename}`;
  
  try {
    await unlink(filepath);
    return ctx.json({ success: true, message: 'File deleted' });
  } catch (error) {
    return ctx.json({ error: 'File not found' }, { status: 404 });
  }
});
```

## HTML Form Example

```html
<!DOCTYPE html>
<html>
<head>
    <title>File Upload</title>
</head>
<body>
    <h1>Upload Files</h1>
    
    <!-- Single file upload -->
    <form action="/upload" method="post" enctype="multipart/form-data">
        <input type="file" name="file" required>
        <button type="submit">Upload</button>
    </form>
    
    <!-- Multiple file upload -->
    <form action="/upload/multiple" method="post" enctype="multipart/form-data">
        <input type="file" name="files" multiple>
        <button type="submit">Upload Multiple</button>
    </form>
    
    <!-- Image upload with preview -->
    <form id="imageForm" action="/upload/image" method="post" enctype="multipart/form-data">
        <input type="file" id="imageInput" name="image" accept="image/*">
        <img id="preview" style="max-width: 200px; display: none;">
        <button type="submit">Upload Image</button>
    </form>
    
    <script>
        // Image preview
        document.getElementById('imageInput').addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function(e) {
                    const preview = document.getElementById('preview');
                    preview.src = e.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    </script>
</body>
</html>
```

## Error Handling

### Common Upload Errors

```typescript
app.post('/upload', async (ctx) => {
  try {
    if (!ctx.files?.length) {
      return ctx.json({ 
        error: 'No files provided',
        code: 'NO_FILES'
      }, { status: 400 });
    }
    
    const file = ctx.files[0];
    
    // File too large
    if (file.size > 10 * 1024 * 1024) {
      return ctx.json({
        error: 'File too large',
        code: 'FILE_TOO_LARGE',
        maxSize: 10 * 1024 * 1024
      }, { status: 413 });
    }
    
    // Invalid file type
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return ctx.json({
        error: 'Invalid file type',
        code: 'INVALID_TYPE',
        allowed: allowedTypes
      }, { status: 400 });
    }
    
    // Process file...
    const buffer = await file.arrayBuffer();
    const filename = `${Date.now()}-${file.name}`;
    await Bun.write(`./uploads/${filename}`, buffer);
    
    return ctx.json({ success: true, filename });
    
  } catch (error) {
    console.error('Upload error:', error);
    return ctx.json({
      error: 'Upload failed',
      code: 'UPLOAD_ERROR'
    }, { status: 500 });
  }
});
```

## Best Practices

1. **Always validate file types and sizes**
2. **Sanitize filenames to prevent path traversal**
3. **Use unique filenames to prevent conflicts**
4. **Implement proper error handling**
5. **Consider storage location (local vs cloud)**
6. **Monitor disk space usage**
7. **Implement cleanup for temporary files**
8. **Use streaming for large files**
9. **Validate file content, not just MIME type**
10. **Implement proper access controls**

## Production Considerations

### Cloud Storage Integration

```typescript
// Example with cloud storage (pseudo-code)
app.post('/upload/cloud', async (ctx) => {
  const file = ctx.files?.[0];
  if (!file) {
    return ctx.json({ error: 'No file provided' }, { status: 400 });
  }
  
  const buffer = await file.arrayBuffer();
  
  // Upload to cloud storage
  // const url = await cloudStorage.upload(buffer, {
  //   filename: file.name,
  //   contentType: file.type
  // });
  
  return ctx.json({
    success: true,
    // url,
    size: file.size
  });
});
```

### Virus Scanning

```typescript
// Example with virus scanning (pseudo-code)
app.post('/upload/secure', async (ctx) => {
  const file = ctx.files?.[0];
  if (!file) {
    return ctx.json({ error: 'No file provided' }, { status: 400 });
  }
  
  const buffer = await file.arrayBuffer();
  
  // Scan for viruses
  // const scanResult = await virusScanner.scan(buffer);
  // if (!scanResult.clean) {
  //   return ctx.json({ error: 'File contains malware' }, { status: 400 });
  // }
  
  // Process clean file...
});
```

This guide provides comprehensive coverage of file upload functionality in imphnen.js. For more examples, see the [file upload example](../../examples/file-upload/) directory. 