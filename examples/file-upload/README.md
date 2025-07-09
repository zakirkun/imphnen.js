# File Upload Examples

This directory contains comprehensive examples demonstrating the file upload functionality of the imphnen.js framework.

## Files

- **`upload-demo.ts`** - Complete server-side file upload implementation
- **`upload-client.html`** - Client-side HTML/JavaScript test interface  
- **`README.md`** - This documentation file

## Features Demonstrated

### 🚀 Server Features (`upload-demo.ts`)

1. **Single File Upload** - Upload one file with optional metadata
2. **Multiple File Upload** - Upload multiple files in a single request
3. **Image Upload** - Specialized image handling with validation
4. **API Upload** - RESTful API endpoint for programmatic uploads
5. **File Management** - List, download, and delete uploaded files
6. **File Validation** - Size limits, file type restrictions, and count limits
7. **Security** - Path traversal prevention and filename sanitization

### 🖥️ Client Features (`upload-client.html`)

1. **Interactive Upload Forms** - HTML forms for testing different upload scenarios
2. **Progress Indication** - Visual feedback during uploads
3. **File Management UI** - Browse, download, and delete uploaded files
4. **Error Handling** - User-friendly error messages and validation
5. **Responsive Design** - Modern, mobile-friendly interface

## Configuration

The server is configured with the following upload limits:

```typescript
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
```

## Running the Examples

### Start the Server

```bash
# From project root
cd examples/file-upload
bun run upload-demo.ts
```

The server will start on `http://localhost:3004` and create an `uploads/` directory for storing files.

### Test with the Web Interface

1. Open `upload-client.html` in your browser
2. Or visit `http://localhost:3004` for the built-in form

### Test with cURL

#### Single File Upload
```bash
curl -X POST http://localhost:3004/upload/single \
  -F "file=@example.txt" \
  -F "description=Test file upload"
```

#### Multiple File Upload
```bash
curl -X POST http://localhost:3004/upload/multiple \
  -F "files=@file1.txt" \
  -F "files=@file2.jpg" \
  -F "category=documents"
```

#### Image Upload
```bash
curl -X POST http://localhost:3004/upload/image \
  -F "image=@photo.jpg" \
  -F "alt_text=Profile photo"
```

#### List Files
```bash
curl http://localhost:3004/files
```

#### Download File
```bash
curl http://localhost:3004/files/filename.txt -o downloaded-file.txt
```

#### Delete File
```bash
curl -X DELETE http://localhost:3004/files/filename.txt
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Upload form page |
| `POST` | `/upload/single` | Single file upload |
| `POST` | `/upload/multiple` | Multiple file upload |
| `POST` | `/upload/image` | Image upload with validation |
| `POST` | `/api/upload` | API file upload |
| `GET` | `/files` | List uploaded files |
| `GET` | `/files/:filename` | Download/serve file |
| `DELETE` | `/files/:filename` | Delete file |

## Request/Response Examples

### Single File Upload

**Request:**
```http
POST /upload/single
Content-Type: multipart/form-data

file: (binary data)
description: "Project documentation"
```

**Response:**
```json
{
  "message": "File uploaded successfully",
  "file": {
    "originalName": "docs.pdf",
    "filename": "1645123456789-docs.pdf",
    "size": 2048576,
    "type": "application/pdf",
    "description": "Project documentation",
    "uploadedAt": "2024-01-15T10:30:45.123Z",
    "url": "/files/1645123456789-docs.pdf"
  }
}
```

### Multiple File Upload

**Response:**
```json
{
  "message": "3 files uploaded successfully",
  "category": "documents",
  "files": [
    {
      "originalName": "file1.txt",
      "filename": "1645123456789-abc123-file1.txt",
      "size": 1024,
      "type": "text/plain",
      "url": "/files/1645123456789-abc123-file1.txt"
    }
  ],
  "uploadedAt": "2024-01-15T10:30:45.123Z"
}
```

### File List

**Response:**
```json
{
  "message": "Found 5 files",
  "files": [
    {
      "filename": "1645123456789-docs.pdf",
      "size": 2048576,
      "uploadedAt": "2024-01-15T10:30:45.123Z",
      "url": "/files/1645123456789-docs.pdf"
    }
  ]
}
```

## Error Handling

The server provides detailed error messages for various scenarios:

- **No files uploaded**: `400 Bad Request`
- **File too large**: `400 Bad Request` with size limit info
- **Too many files**: `400 Bad Request` with count limit info
- **Invalid file type**: `400 Bad Request` with allowed types info
- **File not found**: `404 Not Found`
- **Invalid filename**: `400 Bad Request` (security check)

## Security Features

1. **Path Traversal Prevention** - Filenames are sanitized to prevent `../` attacks
2. **File Type Validation** - Only allowed MIME types are accepted
3. **Size Limits** - Configurable maximum file sizes
4. **Count Limits** - Maximum number of files per request
5. **Unique Filenames** - Prevents conflicts and overwrites

## Integration with Your App

To add file upload to your imphnen.js app:

```typescript
import { createApp } from 'imphnen';

const app = createApp({
  uploads: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 3,
    allowedTypes: ['image/*', 'application/pdf']
  }
});

app.post('/upload', async (ctx) => {
  if (!ctx.files || ctx.files.length === 0) {
    return ctx.json({ error: 'No files uploaded' }, { status: 400 });
  }

  // Process uploaded files
  for (const file of ctx.files) {
    console.log(`Uploaded: ${file.name} (${file.size} bytes)`);
    
    // Save file
    const buffer = await file.arrayBuffer();
    // ... save to disk, cloud storage, etc.
  }

  return ctx.json({ 
    message: 'Files uploaded successfully',
    count: ctx.files.length 
  });
});
```

## Notes

- Files are stored in the `uploads/` directory relative to the server
- Filenames are prefixed with timestamps to ensure uniqueness
- The server automatically handles CORS for cross-origin uploads
- All upload endpoints support both form submissions and programmatic requests
- File metadata is preserved and returned in responses

## Troubleshooting

**Server won't start:**
- Check if port 3004 is available
- Ensure write permissions in the directory

**Upload fails:**
- Verify file size is under the limit (5MB)
- Check file type is in the allowed list
- Ensure no more than 5 files per request

**Can't access files:**
- Check if the `uploads/` directory exists
- Verify file permissions 