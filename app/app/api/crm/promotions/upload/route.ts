import { NextRequest, NextResponse } from 'next/server';

const API_KEY = 'ekhaya-car-wash-secret-key-2024';

export async function POST(request: NextRequest) {
  try {
    const apiKey = request.headers.get('X-API-Key');
    if (apiKey !== API_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPG, PNG, and WebP images are allowed.' 
      }, { status: 400 });
    }

    // Validate file size (max 2MB for base64 storage)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 2MB for optimal performance.' 
      }, { status: 400 });
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64String = buffer.toString('base64');
    const mimeType = file.type;
    
    // Create data URL for direct use
    const dataUrl = `data:${mimeType};base64,${base64String}`;

    // Generate metadata
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const filename = `promotion_${Date.now()}.${fileExtension}`;

    return NextResponse.json({
      success: true,
      mediaUrl: dataUrl, // Base64 data URL for direct storage in DB
      mediaType: fileExtension,
      mimeType: mimeType,
      filename: filename,
      size: file.size,
      base64: base64String, // Raw base64 if needed separately
      uploadedAt: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
}

// No DELETE endpoint needed for base64 storage - images are stored directly in database