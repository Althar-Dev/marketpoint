import { NextResponse } from "next/server";
import { S3Client, ListObjectsV2Command, type ListObjectsV2CommandOutput } from "@aws-sdk/client-s3";

// Cache in-memory sederhana untuk menghemat Class B API R2 (TTL 60 detik)
let cachedStorageData: {
  timestamp: number;
  data: any;
} | null = null;

const CACHE_TTL_MS = 60 * 1000; // 1 menit

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const forceRefresh = searchParams.get("force") === "true";

    const now = Date.now();
    if (!forceRefresh && cachedStorageData && now - cachedStorageData.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        cached: true,
        data: cachedStorageData.data,
      });
    }

    const endpoint = process.env.R2_ENDPOINT;
    const accessKeyId = process.env.R2_ACCESS_KEY_ID;
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;
    const bucketName = process.env.R2_BUCKET_NAME || "market";
    const limitGb = parseFloat(process.env.R2_STORAGE_LIMIT_GB || "30");

    if (!endpoint || !accessKeyId || !secretAccessKey) {
      return NextResponse.json(
        {
          success: false,
          error: "Konfigurasi R2 Storage belum lengkap di environment (.env)",
        },
        { status: 500 }
      );
    }

    const r2Client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    let totalBytes = 0;
    let totalFiles = 0;
    let continuationToken: string | undefined = undefined;
    const folderStats: Record<string, { bytes: number; count: number }> = {};

    do {
      const response: ListObjectsV2CommandOutput = await r2Client.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
          ContinuationToken: continuationToken,
        })
      );

      if (response.Contents) {
        for (const item of response.Contents) {
          const size = item.Size || 0;
          totalBytes += size;
          totalFiles++;

          const key = item.Key || "";
          const folder = key.includes("/") ? key.split("/")[0] : "root";
          if (!folderStats[folder]) {
            folderStats[folder] = { bytes: 0, count: 0 };
          }
          folderStats[folder].bytes += size;
          folderStats[folder].count++;
        }
      }

      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    const limitBytes = limitGb * 1024 * 1024 * 1024;
    const freeBytes = Math.max(0, limitBytes - totalBytes);
    const percentage = Math.min(100, Math.max(0, (totalBytes / limitBytes) * 100));

    // Persentase tampilan yang ramah (misal: "0.2%", atau "< 1%" jika > 0 tapi sangat kecil)
    let percentageLabel = "";
    if (percentage === 0) {
      percentageLabel = "0%";
    } else if (percentage < 0.1) {
      percentageLabel = "< 0.1%";
    } else if (percentage < 1) {
      percentageLabel = `${percentage.toFixed(1)}%`;
    } else {
      percentageLabel = `${Math.round(percentage)}%`;
    }

    // Tampilan teks penggunaan
    const usedFormatted = formatBytes(totalBytes, 1);
    const limitFormatted = `${limitGb} GB`;
    const freeFormatted = formatBytes(freeBytes, 1);

    // Format per folder breakdown
    const foldersBreakdown = Object.entries(folderStats).map(([name, stat]) => ({
      name,
      bytes: stat.bytes,
      formatted: formatBytes(stat.bytes, 1),
      count: stat.count,
    })).sort((a, b) => b.bytes - a.bytes);

    const resultData = {
      bucket: bucketName,
      totalFiles,
      totalBytes,
      limitBytes,
      limitGb,
      freeBytes,
      usedFormatted,
      limitFormatted,
      freeFormatted,
      percentage: Number(percentage.toFixed(2)),
      percentageLabel,
      folders: foldersBreakdown,
      lastUpdated: new Date().toISOString(),
    };

    cachedStorageData = {
      timestamp: now,
      data: resultData,
    };

    return NextResponse.json({
      success: true,
      cached: false,
      data: resultData,
    });
  } catch (error: any) {
    console.error("[CLOUD STORAGE API ERROR]", error);
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Gagal mengambil data kuota Cloud Storage",
      },
      { status: 500 }
    );
  }
}
