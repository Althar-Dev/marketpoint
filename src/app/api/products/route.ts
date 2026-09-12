import { NextResponse } from "next/server";
import { getProductsByShop, createProduct, deleteProduct, getCategories, getProductById } from "@/lib/database/product";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId");
    const productId = searchParams.get("id");
    const getCats = searchParams.get("categories");

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

    if (!shopId) {
      return NextResponse.json(
        { success: false, error: "Parameter shopId wajib disertakan." },
        { status: 400 }
      );
    }

    const products = await getProductsByShop(shopId);
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
    const { shopId, categoryId, title, price, shortDescription, description, images, files, stockType, stockCount, demoUrl, licenseKeys } = body;

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

    const deleted = await deleteProduct(id, shopId);
    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Produk tidak ditemukan atau gagal dihapus." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Produk berhasil dihapus.",
    });
  } catch (error: any) {
    console.error("[API PRODUCTS DELETE ERROR]", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menghapus produk." },
      { status: 500 }
    );
  }
}
