import { NextResponse } from "next/server";
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getProductsByShop, createProduct, deleteProduct, updateProduct, getCategories, getProductById, getAllActiveProducts } from "@/lib/database/product";

const r2Client = new S3Client({
  region: "auto",
  endpoint: process.env.R2_ENDPOINT || "",
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
  },
});

async function deleteR2Image(imageUrl: string) {
  try {
    if (!imageUrl || imageUrl.includes("picsum.photos") || imageUrl.includes("placeholder") || !imageUrl.includes("http")) return;
    const url = new URL(imageUrl);
    const key = url.pathname.startsWith("/") ? url.pathname.substring(1) : url.pathname;
    if (!key) return;

    await r2Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET_NAME,
        Key: key,
      })
    );
  } catch (err) {
    console.warn(`[R2 DELETE WARN] Failed to delete image ${imageUrl}:`, err);
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");
    const productId = searchParams.get("id");
    const getCats = searchParams.get("categories");
    const categoryId = searchParams.get("categoryId");

    if (getCats === "true") {
      const categories = await getCategories();
      return NextResponse.json({ success: true, categories });
    }

    if (productId) {
      const product = await getProductById(productId);
      if (!product) {
        return NextResponse.json({ success: false, error: "Produk tidak ditemukan." }, { status: 404 });
      }
      return NextResponse.json({ success: true, product });
    }

    if (shopId) {
      const products = await getProductsByShop(shopId);
      return NextResponse.json({ success: true, products });
    }

    // Default: Return public active products for homepage / market browsing
    const products = await getAllActiveProducts(categoryId ? Number(categoryId) : undefined);
    return NextResponse.json({ success: true, products });
  } catch (error: any) {
    console.error("[API PRODUCTS GET ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil data produk." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { shopId, categoryId, title, price, shortDescription, description, images, files, stockType, stockCount, demoUrl, licenseKeys, attributes } = body;

    if (!shopId || !categoryId || !title || price === undefined) {
      return NextResponse.json(
        { success: false, error: "Field shopId, categoryId, title, dan price wajib diisi." },
        { status: 400 }
      );
    }

    // Check existing products count for shop
    const existingProducts = await getProductsByShop(shopId);

    // Fetch shop subscription maxProducts limit from PostgreSQL
    let maxProducts = 10;
    try {
      const { getShopSubscription } = await import("@/lib/database/subscription");
      const sub = await getShopSubscription(shopId);
      if (sub?.maxProducts !== undefined) {
        maxProducts = sub.maxProducts;
      }
    } catch (e) {
      // Ignore fallback to default
    }

    if (maxProducts !== -1 && existingProducts.length >= maxProducts) {
      return NextResponse.json(
        {
          success: false,
          error: `Batas kuota produk untuk paket berlangganan Anda telah tercapai (Maksimal ${maxProducts} produk). Silakan tingkatkan ke Paket Plus (50), Pro (100), atau Prime (Unlimited) di menu Subscription.`,
        },
        { status: 400 }
      );
    }

    const newProduct = await createProduct({
      shopId,
      categoryId: Number(categoryId),
      title,
      price: Number(price),
      shortDescription,
      description,
      images,
      files,
      stockType,
      stockCount: Number(stockCount || 0),
      demoUrl,
      licenseKeys: Array.isArray(licenseKeys) ? licenseKeys : undefined,
      attributes,
    });

    return NextResponse.json({
      success: true,
      message: "Produk digital berhasil ditambahkan.",
      product: newProduct,
    });
  } catch (error: any) {
    console.error("[API PRODUCTS POST ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menambahkan produk." },
      { status: 500 }
    );
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, shopId, categoryId, title, price, shortDescription, description, images, files, stockType, stockCount, demoUrl, licenseKeys, attributes } = body;

    if (!id || !shopId) {
      return NextResponse.json(
        { success: false, error: "Parameter id dan shopId wajib diisi." },
        { status: 400 }
      );
    }

    const updated = await updateProduct({
      id,
      shopId,
      categoryId: categoryId ? Number(categoryId) : undefined,
      title,
      price: price !== undefined ? Number(price) : undefined,
      shortDescription,
      description,
      stockType,
      stockCount: stockCount !== undefined ? Number(stockCount) : undefined,
      demoUrl,
      images,
      files,
      licenseKeys: Array.isArray(licenseKeys) ? licenseKeys : undefined,
      attributes,
    });

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Produk tidak ditemukan atau tidak milik toko ini." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Produk digital berhasil diperbarui.",
      product: updated,
    });
  } catch (error: any) {
    console.error("[API PRODUCTS PUT ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal memperbarui produk." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const shopId = searchParams.get("shopId");

    if (!id || !shopId) {
      return NextResponse.json(
        { success: false, error: "Parameter id dan shopId wajib disertakan." },
        { status: 400 }
      );
    }

    const deletedProduct = await deleteProduct(id, shopId);
    if (!deletedProduct) {
      return NextResponse.json(
        { success: false, error: "Produk tidak ditemukan atau gagal dihapus." },
        { status: 404 }
      );
    }

    // Delete associated product images from Cloudflare R2 bucket
    if (deletedProduct.images && deletedProduct.images.length > 0) {
      for (const img of deletedProduct.images) {
        if (img.imageUrl) {
          await deleteR2Image(img.imageUrl);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: "Produk dan gambar R2 berhasil dihapus.",
    });
  } catch (error: any) {
    console.error("[API PRODUCTS DELETE ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus produk." },
      { status: 500 }
    );
  }
}
