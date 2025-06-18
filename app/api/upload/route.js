// app/api/upload/route.js
import { NextResponse } from 'next/server';
import fs from 'fs/promises'; // Use promises version
import path from 'path';

export async function POST(request) {
  try {
    console.log('POST request received');
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images and PDFs are allowed.' },
        { status: 400 }
      );
    }

    // Validate file size (e.g., 10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create uploads directory
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    // Sanitize filename and preserve extension
    const fileExtension = path.extname(file.name);
    const baseName = path.basename(file.name, fileExtension).replace(/[^a-zA-Z0-9]/g, '_');
    const fileName = `${Date.now()}-${baseName}${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    // Write file
    await fs.writeFile(filePath, buffer);

    // Read file for base64 encoding
    const fileData = await fs.readFile(filePath);
    
    // Determine MIME type for base64 data URL
    let mimeType = file.type;
    if (!mimeType) {
      // Fallback based on extension
      const ext = fileExtension.toLowerCase();
      const mimeMap = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
        '.pdf': 'application/pdf'
      };
      mimeType = mimeMap[ext] || 'application/octet-stream';
    }

    return NextResponse.json({
      success: true,
      filePath: `/uploads/${fileName}`,
      fileName: fileName,
      fileType: mimeType,
      fileSize: file.size,
      message: 'File uploaded successfully',
      data: `data:${mimeType};base64,${fileData.toString('base64')}`
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error.message },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}