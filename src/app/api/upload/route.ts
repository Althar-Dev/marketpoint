import { NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { checkRateLimit, getClientIp } from '@/lib/rate-limit';
import { verifyAdminRequest } from '@/lib/server-auth';

const r2 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT || '',
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

const ALLOWED_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'svg', 'gif',
  'zip', 'pdf', 'mp4', 'txt'
]);

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

export async function POST(req: Request) {
  try {
    // 1. Rate Limiting
    const clientIp = getClientIp(req);
    const rl = checkRateLimit(`${clientIp}:upload`, { intervalMs: 60_000, maxRequests: 25 });
    if (!rl.success) {
      return NextResponse.json(
        { error: 'Terlalu banyak permintaan unggah file. Silakan tunggu beberapa saat.' },
        { status: 429 }
      );
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const type = (formData.get('type') as string) || '';
    const folderParam = (formData.get('folder') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'File tidak ditemukan dalam permintaan.' }, { status: 400 });
    }

    // 2. Validate File Size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `Ukuran file (${(file.size / (1024 * 1024)).toFixed(1)}MB) melebihi batas maksimum 25MB.` },
        { status: 400 }
      );
    }

    // 3. Validate File Extension
    const rawExtension = file.name.split('.').pop() || '';
    const extension = rawExtension.toLowerCase().trim();

    if (!ALLOWED_EXTENSIONS.has(extension)) {
      return NextResponse.json(
        { error: `Format ekstensi file '.${extension}' tidak diizinkan demi keamanan platform.` },
        { status: 400 }
      );
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

    // 4. Protect gallery folder uploads: Admin only
    if (folder.startsWith('gallery/')) {
      const adminAuth = await verifyAdminRequest(req);
      if (!adminAuth.authorized) {
        return NextResponse.json(
          { error: adminAuth.error || 'Hanya administrator yang diizinkan mengunggah ke galeri sistem.' },
          { status: 403 }
        );
      }
    }

    const uniqueId = crypto.randomUUID();
    const filename = `${folder}/${uniqueId}.${extension}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    await r2.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: filename,
        Body: buffer,
        ContentType: file.type || 'application/octet-stream',
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
