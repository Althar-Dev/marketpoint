
import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || '',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = (formData.get('type') as string) || '';
    const folderParam = (formData.get('folder') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Determine target folder based on folderParam or type
    let folder = 'products';
    if (folderParam) {
      folder = folderParam.replace(/^\/+|\/+$/g, '');
    } else if (type.startsWith('gallery/')) {
      folder = type;
    } else if (type === 'badge') folder = 'gallery/badge';
    else if (type === 'icon') folder = 'gallery/icon';
    else if (type === 'background') folder = 'gallery/background';
    else if (type === 'banner') folder = 'gallery/banner';
    else if (type === 'avatar') folder = 'avatar';
    else if (type === 'logo') folder = 'logo';
    else if (type === 'products' || type === 'product') folder = 'products';
    
    const extension = file.name.split('.').pop();
    const uniqueId = crypto.randomUUID();
    const filename = `${folder}/${uniqueId}.${extension}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: filename,
        Body: buffer,
        ContentType: file.type,
      })
    );

    // Return the public URL
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${filename}`;

    // Automatically record item into SQLite database/gallery.db if it's a gallery upload
    if (folder.startsWith('gallery/')) {
      const galleryCategory = folder.split('/')[1] || type || 'general';
      try {
        const { addGalleryItem } = await import('@/lib/database/gallery-db');
        await addGalleryItem({
          name: file.name,
          url: publicUrl,
          category: galleryCategory,
          folder: folder,
          size: file.size,
          type: file.type,
        });
      } catch (dbErr) {
        console.warn('Failed to record upload in database/gallery.db:', dbErr);
      }
    }

    return NextResponse.json({ url: publicUrl });
  } catch (error: any) {
    console.error('R2 Upload Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
