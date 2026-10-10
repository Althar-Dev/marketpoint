import { NextResponse } from "next/server";
import { getDigiFlazzVisualsData, saveDigiFlazzVisualsData } from "@/lib/database/catalog-db";

export async function GET() {
  try {
    let data = await getDigiFlazzVisualsData();
    
    // If not found in catalog.db, attempt to fetch from Firestore settings/digiflazz_visuals via REST API for seamless migration
    if (!data) {
      try {
        const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "marketpoint-app";
        const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/settings/digiflazz_visuals`;
        const res = await fetch(firestoreUrl);
        if (res.ok) {
          const docData = await res.json();
          if (docData && docData.fields) {
            // Helper to parse Firestore REST JSON fields
            const parseFirestoreFields = (fields: any): any => {
              if (!fields) return {};
              const result: any = {};
              for (const [key, valObj] of Object.entries<any>(fields)) {
                if (valObj.stringValue !== undefined) result[key] = valObj.stringValue;
                else if (valObj.integerValue !== undefined) result[key] = Number(valObj.integerValue);
                else if (valObj.doubleValue !== undefined) result[key] = Number(valObj.doubleValue);
                else if (valObj.booleanValue !== undefined) result[key] = valObj.booleanValue;
                else if (valObj.mapValue && valObj.mapValue.fields) {
                  result[key] = parseFirestoreFields(valObj.mapValue.fields);
                }
              }
              return result;
            };
            
            const parsed = parseFirestoreFields(docData.fields);
            if (parsed && (parsed.brands || parsed.categories)) {
              data = parsed;
              // Migrate and persist into SQLite catalog.db immediately so settings are preserved forever!
              await saveDigiFlazzVisualsData(parsed);
            }
          }
        }
      } catch (migrationErr) {
        console.warn("Auto-migration from Firestore skipped:", migrationErr);
      }
    }

    return NextResponse.json({
      success: true,
      data: data || { brands: {}, categories: {}, defaultBgGradient: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)" },
    });
  } catch (error: any) {
    console.error("GET DigiFlazz Visuals Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal mengambil pengaturan visual" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body || typeof body !== "object") {
      return NextResponse.json({ success: false, error: "Payload tidak valid" }, { status: 400 });
    }

    await saveDigiFlazzVisualsData(body);

    return NextResponse.json({
      success: true,
      message: "Pengaturan visual berhasil disimpan di database/catalog.db!",
      data: body,
    });
  } catch (error: any) {
    console.error("POST DigiFlazz Visuals Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Gagal menyimpan pengaturan visual" },
      { status: 500 }
    );
  }
}
