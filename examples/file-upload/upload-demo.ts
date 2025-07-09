// File Upload Example - Comprehensive file upload functionality
import { createApp } from '../../src/index.js';
import type { Context } from '../../src/index.js';
import type { UploadedFile } from '../../src/types.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

const app = createApp({
  port: 3004,
  cors: true,
  uploads: {
    maxFileSize: 5 * 1024 * 1024, // 5MB per file
    maxFiles: 5, // Maximum 5 files per request
    allowedTypes: [
      'image/jpeg',
      'image/png', 
      'image/gif',
      'application/pdf',
      'text/plain',
      'text/csv',
      'application/json'
    ]
  }
});

// Ensure upload directory exists
const UPLOAD_DIR = './uploads';

async function initServer() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true });
    console.log('📁 Upload directory created/verified');
  } catch (error) {
    console.error('Failed to create upload directory:', error);
  }

// Home page with upload form
app.get('/', (ctx: Context) => {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>File Upload Demo</title>
        <style>
            body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
            .upload-form { border: 2px dashed #ccc; padding: 20px; margin: 20px 0; }
            .file-info { background: #f5f5f5; padding: 10px; margin: 10px 0; border-radius: 5px; }
            button { background: #007bff; color: white; padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; }
            button:hover { background: #0056b3; }
            .error { color: red; }
            .success { color: green; }
        </style>
    </head>
    <body>
        <h1>📁 File Upload Demo</h1>
        
        <h2>Single File Upload</h2>
        <form action="/upload/single" method="post" enctype="multipart/form-data" class="upload-form">
            <input type="file" name="file" required>
            <br><br>
            <input type="text" name="description" placeholder="File description (optional)">
            <br><br>
            <button type="submit">Upload Single File</button>
        </form>

        <h2>Multiple File Upload</h2>
        <form action="/upload/multiple" method="post" enctype="multipart/form-data" class="upload-form">
            <input type="file" name="files" multiple required>
            <br><br>
            <input type="text" name="category" placeholder="Category (optional)">
            <br><br>
            <button type="submit">Upload Multiple Files</button>
        </form>

        <h2>Image Upload with Preview</h2>
        <form action="/upload/image" method="post" enctype="multipart/form-data" class="upload-form">
            <input type="file" name="image" accept="image/*" required>
            <br><br>
            <input type="text" name="alt_text" placeholder="Alt text for image">
            <br><br>
            <button type="submit">Upload Image</button>
        </form>

        <div class="file-info">
            <h3>Upload Limits:</h3>
            <ul>
                <li>Max file size: 5MB</li>
                <li>Max files per request: 5</li>
                <li>Allowed types: JPEG, PNG, GIF, PDF, TXT, CSV, JSON</li>
            </ul>
        </div>

        <h2>API Endpoints</h2>
        <ul>
            <li><code>GET /files</code> - List uploaded files</li>
            <li><code>GET /files/:filename</code> - Download file</li>
            <li><code>POST /upload/single</code> - Single file upload</li>
            <li><code>POST /upload/multiple</code> - Multiple file upload</li>
            <li><code>POST /upload/image</code> - Image upload</li>
            <li><code>DELETE /files/:filename</code> - Delete file</li>
        </ul>
    </body>
    </html>
  `;
  
  return ctx.html(html);
});

// Single file upload
app.post('/upload/single', async (ctx: Context) => {
  try {
    if (!ctx.files || ctx.files.length === 0) {
      return ctx.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const file = ctx.files[0];
    if (!file) {
      return ctx.json({ error: 'No file found' }, { status: 400 });
    }

    const body = ctx.body as { fields: { description?: string } };
    
    // Generate unique filename
    const timestamp = Date.now();
    const filename = `${timestamp}-${file.name}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Save file
    const fileBuffer = await file.arrayBuffer();
    await writeFile(filepath, new Uint8Array(fileBuffer));

    const fileInfo = {
      originalName: file.name,
      filename,
      size: file.size,
      type: file.type,
      description: body.fields.description || null,
      uploadedAt: new Date().toISOString(),
      url: `/files/${filename}`
    };

    console.log(`📁 File uploaded: ${file.name} (${file.size} bytes)`);

    return ctx.json({
      message: 'File uploaded successfully',
      file: fileInfo
    });

  } catch (error) {
    console.error('Upload error:', error);
    return ctx.json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
});

// Multiple file upload
app.post('/upload/multiple', async (ctx: Context) => {
  try {
    if (!ctx.files || ctx.files.length === 0) {
      return ctx.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const body = ctx.body as { fields: { category?: string } };
    const uploadedFiles = [];

    for (const file of ctx.files) {
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const filename = `${timestamp}-${randomSuffix}-${file.name}`;
      const filepath = join(UPLOAD_DIR, filename);

      // Save file
      const fileBuffer = await file.arrayBuffer();
      await writeFile(filepath, new Uint8Array(fileBuffer));

      uploadedFiles.push({
        originalName: file.name,
        filename,
        size: file.size,
        type: file.type,
        url: `/files/${filename}`
      });

      console.log(`📁 File uploaded: ${file.name} (${file.size} bytes)`);
    }

    return ctx.json({
      message: `${uploadedFiles.length} files uploaded successfully`,
      category: body.fields.category || null,
      files: uploadedFiles,
      uploadedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Multiple upload error:', error);
    return ctx.json({ 
      error: 'Upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
});

// Image upload with special handling
app.post('/upload/image', async (ctx: Context) => {
  try {
    if (!ctx.files || ctx.files.length === 0) {
      return ctx.json({ error: 'No image uploaded' }, { status: 400 });
    }

    const file = ctx.files[0];
    if (!file) {
      return ctx.json({ error: 'No image file found' }, { status: 400 });
    }

    const body = ctx.body as { fields: { alt_text?: string } };

    // Validate it's an image
    if (!file.type.startsWith('image/')) {
      return ctx.json({ error: 'File must be an image' }, { status: 400 });
    }

    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    const filename = `image-${timestamp}.${extension}`;
    const filepath = join(UPLOAD_DIR, filename);

    // Save file
    const fileBuffer = await file.arrayBuffer();
    await writeFile(filepath, new Uint8Array(fileBuffer));

    const imageInfo = {
      originalName: file.name,
      filename,
      size: file.size,
      type: file.type,
      altText: body.fields.alt_text || file.name,
      dimensions: await getImageDimensions(file),
      uploadedAt: new Date().toISOString(),
      url: `/files/${filename}`,
      thumbnailUrl: `/files/${filename}?thumbnail=true`
    };

    console.log(`🖼️ Image uploaded: ${file.name} (${file.size} bytes)`);

    return ctx.json({
      message: 'Image uploaded successfully',
      image: imageInfo
    });

  } catch (error) {
    console.error('Image upload error:', error);
    return ctx.json({ 
      error: 'Image upload failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
});

// Helper function to get image dimensions (simplified)
async function getImageDimensions(file: UploadedFile): Promise<{ width?: number; height?: number }> {
  try {
    // In a real app, you'd use a proper image processing library
    // This is a placeholder implementation
    return { width: 800, height: 600 }; // Default values
  } catch {
    return {};
  }
}

// List uploaded files
app.get('/files', async (ctx: Context) => {
  try {
    const fs = await import('fs/promises');
    const files = await fs.readdir(UPLOAD_DIR);
    
    const fileList = await Promise.all(
      files.map(async (filename) => {
        const filepath = join(UPLOAD_DIR, filename);
        const stats = await fs.stat(filepath);
        
        return {
          filename,
          size: stats.size,
          uploadedAt: stats.birthtime.toISOString(),
          url: `/files/${filename}`
        };
      })
    );

    return ctx.json({
      message: `Found ${fileList.length} files`,
      files: fileList.sort((a, b) => 
        new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      )
    });

  } catch (error) {
    console.error('Error listing files:', error);
    return ctx.json({ error: 'Failed to list files' }, { status: 500 });
  }
});

// Download/serve files
app.get('/files/:filename', async (ctx: Context<{ filename: string }>) => {
  try {
    const filename = ctx.params.filename;
    const filepath = join(UPLOAD_DIR, filename);
    
    // Security check - prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return ctx.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const query = ctx.query as { download?: string };
    return await ctx.file(filepath, {
      download: query.download === 'true'
    });

  } catch (error) {
    console.error('Error serving file:', error);
    return ctx.json({ error: 'File not found' }, { status: 404 });
  }
});

// Delete file
app.delete('/files/:filename', async (ctx: Context<{ filename: string }>) => {
  try {
    const filename = ctx.params.filename;
    const filepath = join(UPLOAD_DIR, filename);
    
    // Security check
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return ctx.json({ error: 'Invalid filename' }, { status: 400 });
    }

    const fs = await import('fs/promises');
    await fs.unlink(filepath);
    
    console.log(`🗑️ File deleted: ${filename}`);
    
    return ctx.json({
      message: 'File deleted successfully',
      filename
    });

  } catch (error) {
    console.error('Error deleting file:', error);
    return ctx.json({ error: 'Failed to delete file' }, { status: 500 });
  }
});

// File upload with progress (for API clients)
app.post('/api/upload', async (ctx: Context) => {
  try {
    if (!ctx.files || ctx.files.length === 0) {
      return ctx.json({ error: 'No files uploaded' }, { status: 400 });
    }

    const uploadResults = [];
    let totalSize = 0;

    for (const file of ctx.files) {
      totalSize += file.size;
      
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      const filename = `api-${timestamp}-${randomSuffix}-${file.name}`;
      const filepath = join(UPLOAD_DIR, filename);

      const fileBuffer = await file.arrayBuffer();
      await writeFile(filepath, new Uint8Array(fileBuffer));

      uploadResults.push({
        originalName: file.name,
        filename,
        size: file.size,
        type: file.type,
        url: `/files/${filename}`,
        status: 'uploaded'
      });
    }

    return ctx.json({
      success: true,
      message: `${uploadResults.length} files uploaded via API`,
      totalSize,
      files: uploadResults,
      uploadedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('API upload error:', error);
    return ctx.json({
      success: false,
      error: 'Upload failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
});

console.log('File Upload Demo server starting on port 3004...');
console.log('📁 Upload directory:', UPLOAD_DIR);
console.log('🌐 Open http://localhost:3004 to test file uploads');
console.log('');
console.log('Available endpoints:');
console.log('  GET  /                    - Upload form page');
console.log('  POST /upload/single       - Single file upload');
console.log('  POST /upload/multiple     - Multiple file upload');
console.log('  POST /upload/image        - Image upload');
console.log('  POST /api/upload          - API file upload');
console.log('  GET  /files               - List uploaded files');
console.log('  GET  /files/:filename     - Download file');
console.log('  DELETE /files/:filename   - Delete file');

await app.listen();
}

// Start the server
initServer().catch(console.error); 