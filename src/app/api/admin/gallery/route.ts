import { NextResponse } from "next/server";
import {
  getGalleryItems,
  addGalleryItem,
  deleteGalleryItem,
  getGalleryDbFileSize
} from "@/lib/database/gallery-db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;

    const items = await getGalleryItems(category);
    const dbSize = getGalleryDbFileSize();

    return NextResponse.json({
      success: true,
      data: items,
      total: items.length,
      dbSize: dbSize.formatted,
    });
  } catch (error: any) {
    console.error("GET Gallery DB Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, url, category, folder, size, type } = body;

    if (!name || !url || !category) {
      return NextResponse.json(
        { success: false, error: "Missing required fields (name, url, category)" },
        { status: 400 }
      );
    }

    const item = await addGalleryItem({
      name,
      url,
      category,
      folder: folder || `gallery/${category}`,
      size: size || 0,
      type: type || "",
    });

    const dbSize = getGalleryDbFileSize();

    return NextResponse.json({
      success: true,
      data: item,
      dbSize: dbSize.formatted,
    });
  } catch (error: any) {
    console.error("POST Gallery DB Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Missing item id parameter" },
        { status: 400 }
      );
    }

    const deleted = await deleteGalleryItem(id);
    const dbSize = getGalleryDbFileSize();

    return NextResponse.json({
      success: true,
      deleted,
      dbSize: dbSize.formatted,
    });
  } catch (error: any) {
    console.error("DELETE Gallery DB Error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
