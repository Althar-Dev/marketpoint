import { NextResponse } from "next/server";
import { query, initDatabaseSchema } from "@/lib/database/db";

export async function GET() {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "studio-7299066318";
    
    // 1. Fetch real shops from Firestore REST API
    let firestoreShops: any[] = [];
    try {
      const fsRes = await fetch(
        `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/shops`,
        { cache: "no-store" }
      );
      if (fsRes.ok) {
        const fsData = await fsRes.json();
        if (fsData.documents && Array.isArray(fsData.documents)) {
          firestoreShops = fsData.documents.map((doc: any) => {
            const fields = doc.fields || {};
            const docId = doc.name.split("/").pop();
            let city = fields.city?.stringValue || fields.location?.stringValue || fields.district?.stringValue || fields.province?.stringValue || fields.address?.stringValue || "Jakarta Pusat";
            if (typeof city !== "string" || !city.trim()) {
              city = "Jakarta Pusat";
            }
            return {
              id: docId,
              name: fields.shopName?.stringValue || fields.name?.stringValue || docId,
              slug: fields.slug?.stringValue || docId,
              city: city,
              logo: fields.logoUrl?.stringValue || fields.photoURL?.stringValue || fields.logo?.stringValue,
              isVerified: fields.isVerified?.booleanValue ?? true,
              isOfficial: fields.isOfficial?.booleanValue ?? (docId === "marketpoint" || (fields.isOfficialStore?.booleanValue ?? true)),
            };
          });
        }
      }
    } catch (fsErr) {
      console.warn("[FIRESTORE REST API WARN]", fsErr);
    }

    // 2. Fetch distinct shops from PostgreSQL products table
    let dbShops: any[] = [];
    try {
      await initDatabaseSchema();
      const res = await query(`
        SELECT DISTINCT p.shop_id as "slug"
        FROM products p
        WHERE p.status = 'ACTIVE'
      `);
      if (res.rows && Array.isArray(res.rows)) {
        dbShops = res.rows.map((r: any) => {
          const formattedName = r.slug
            .split("-")
            .map((w: string) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ");
          return {
            id: r.slug,
            name: formattedName,
            slug: r.slug,
            city: r.slug === "marketpoint" ? "Jakarta Pusat" : "Jakarta Pusat",
            isVerified: true,
            isOfficial: r.slug === "marketpoint" || r.slug.includes("official")
          };
        });
      }
    } catch (dbErr) {
      console.warn("[DB SHOPS QUERY WARN]", dbErr);
    }

    // Merge Firestore shops & DB shops by unique slug
    const shopsMap = new Map();
    for (const shop of [...firestoreShops, ...dbShops]) {
      if (shop.slug && !shopsMap.has(shop.slug)) {
        shopsMap.set(shop.slug, shop);
      }
    }

    const shops = Array.from(shopsMap.values());
    return NextResponse.json({ success: true, shops });
  } catch (err: any) {
    console.error("[SHOPS API ERROR]", err);
    return NextResponse.json({ success: true, shops: [] });
  }
}
