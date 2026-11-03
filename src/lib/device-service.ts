/**
 * MarketPointID Real Device & Session Service
 * Manages active user sessions in Firestore users/{uid}/devices/{deviceId}
 */

import {
  Firestore,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { User } from "firebase/auth";

export interface DeviceSession {
  id: string;
  name: string;
  browser: string;
  os: string;
  deviceType: "desktop" | "mobile" | "tablet";
  location: string;
  ipAddress?: string;
  lastActiveAt: any;
  createdAt?: any;
  isCurrentDevice?: boolean;
  status?: "active" | "revoked";
  userAgent?: string;
  allIds?: string[];
  model?: string;
  brand?: string;
}

const DEVICE_STORAGE_KEY = "marketpoint_device_id";

export function getOrCreateDeviceId(): string {
  if (typeof window === "undefined") return "server-session";
  try {
    let id = localStorage.getItem(DEVICE_STORAGE_KEY);
    if (!id) {
      const randomPart = Math.random().toString(36).substring(2, 10);
      id = `dev_${Date.now().toString(36)}_${randomPart}`;
      localStorage.setItem(DEVICE_STORAGE_KEY, id);
    }
    return id;
  } catch {
    return `dev_fallback_${Date.now()}`;
  }
}

export function resolveDeviceMarketingName(rawModel?: string, os?: string): { brand: string; modelName: string } {
  if (!rawModel || rawModel.trim() === "" || rawModel.trim().toUpperCase() === "K") {
    if (os?.includes("Windows")) return { brand: "Microsoft", modelName: os };
    if (os?.includes("macOS") || os?.includes("Mac")) return { brand: "Apple", modelName: "Apple Mac" };
    if (os?.includes("iPhone")) return { brand: "Apple", modelName: "Apple iPhone" };
    if (os?.includes("iPad")) return { brand: "Apple", modelName: "Apple iPad" };
    if (os?.includes("Linux")) return { brand: "Linux", modelName: "Linux PC" };
    return { brand: "Ponsel", modelName: os || "Ponsel Android" };
  }

  const m = rawModel.trim();
  const upper = m.toUpperCase();

  // 1. INFINIX
  if (/^infinix/i.test(m) || /^X\d{3,4}[A-Z]?$/i.test(m)) {
    const codeMatch = upper.match(/X\d{3,4}[A-Z]?/);
    const code = codeMatch ? codeMatch[0] : "";
    const codeNoSuffix = code.replace(/[A-Z]$/, "");

    const infinixDict: Record<string, string> = {
      X6837: "Infinix HOT 40 Pro / NOTE 40",
      X6836: "Infinix NOTE 40 Pro",
      X6850: "Infinix NOTE 40 Pro 5G",
      X6851: "Infinix NOTE 40 Pro+ 5G",
      X6835: "Infinix HOT 40",
      X6833: "Infinix NOTE 30",
      X6833B: "Infinix NOTE 30",
      X6716: "Infinix NOTE 30 Pro",
      X6716B: "Infinix NOTE 30 Pro",
      X6711: "Infinix NOTE 30 5G",
      X6710: "Infinix NOTE 30 VIP",
      X6831: "Infinix HOT 30",
      X669: "Infinix HOT 30i",
      X669C: "Infinix HOT 30i",
      X669D: "Infinix HOT 30i",
      X6832: "Infinix HOT 30 Play",
      X6528: "Infinix SMART 8",
      X6528B: "Infinix SMART 8",
      X6525: "Infinix SMART 8 Pro",
      X6517: "Infinix SMART 7",
      X6516: "Infinix SMART 7 HD",
      X6823: "Infinix HOT 20",
      X6823C: "Infinix HOT 20",
      X6826: "Infinix HOT 20 5G",
      X6825: "Infinix HOT 20s",
      X6871: "Infinix GT 10 Pro",
      X6853: "Infinix GT 20 Pro",
      X6731: "Infinix ZERO 30 5G",
      X6739: "Infinix ZERO 40 5G",
      X6815: "Infinix ZERO 5G",
      X6816: "Infinix HOT 12 Play",
      X6816C: "Infinix HOT 12 Play",
      X6817: "Infinix HOT 12",
      X6812: "Infinix HOT 11s",
      X689: "Infinix HOT 10s",
      X688: "Infinix HOT 10",
      X670: "Infinix NOTE 12",
      X676: "Infinix NOTE 12 Pro",
      X663: "Infinix NOTE 11",
      X698: "Infinix NOTE 11 Pro",
    };

    if (code && infinixDict[code]) return { brand: "Infinix", modelName: infinixDict[code] };
    if (codeNoSuffix && infinixDict[codeNoSuffix]) return { brand: "Infinix", modelName: infinixDict[codeNoSuffix] };
    if (/^infinix/i.test(m)) return { brand: "Infinix", modelName: m };
    return { brand: "Infinix", modelName: `Infinix ${m}` };
  }

  // 2. TECNO
  if (/^tecno/i.test(m) || /^(KJ|LH|CK|LI|BG|KL)\d/i.test(upper)) {
    const tecnoDict: Record<string, string> = {
      KJ5: "Tecno Spark 20",
      KJ6: "Tecno Spark 20 Pro",
      KJ7: "Tecno Spark 20 Pro+",
      LH7: "Tecno Pova 6",
      LH8: "Tecno Pova 6 Pro 5G",
      CK6: "Tecno Camon 30",
      CK7: "Tecno Camon 30 Pro 5G",
      BG6: "Tecno Spark 10",
      BG7: "Tecno Spark 10 Pro",
    };
    const code3 = upper.slice(0, 3);
    if (tecnoDict[code3]) return { brand: "Tecno", modelName: tecnoDict[code3] };
    if (/^tecno/i.test(m)) return { brand: "Tecno", modelName: m };
    return { brand: "Tecno", modelName: `Tecno ${m}` };
  }

  // 3. SAMSUNG
  if (/^SM-[A-Z0-9]+/i.test(m) || /samsung/i.test(m)) {
    const code = upper.replace(/^SAMSUNG\s*/i, "");
    const samsungDict: Record<string, string> = {
      "SM-S928": "Samsung Galaxy S24 Ultra",
      "SM-S926": "Samsung Galaxy S24+",
      "SM-S921": "Samsung Galaxy S24",
      "SM-S918": "Samsung Galaxy S23 Ultra",
      "SM-S916": "Samsung Galaxy S23+",
      "SM-S911": "Samsung Galaxy S23",
      "SM-S908": "Samsung Galaxy S22 Ultra",
      "SM-S901": "Samsung Galaxy S22",
      "SM-A556": "Samsung Galaxy A55 5G",
      "SM-A546": "Samsung Galaxy A54 5G",
      "SM-A536": "Samsung Galaxy A53 5G",
      "SM-A356": "Samsung Galaxy A35 5G",
      "SM-A346": "Samsung Galaxy A34 5G",
      "SM-A256": "Samsung Galaxy A25 5G",
      "SM-A155": "Samsung Galaxy A15 4G",
      "SM-A156": "Samsung Galaxy A15 5G",
      "SM-A145": "Samsung Galaxy A14 4G",
      "SM-A146": "Samsung Galaxy A14 5G",
      "SM-A055": "Samsung Galaxy A05",
      "SM-A057": "Samsung Galaxy A05s",
      "SM-A045": "Samsung Galaxy A04",
      "SM-A047": "Samsung Galaxy A04s",
      "SM-A127": "Samsung Galaxy A12",
      "SM-A137": "Samsung Galaxy A13",
      "SM-F946": "Samsung Galaxy Z Fold 5",
      "SM-F731": "Samsung Galaxy Z Flip 5",
      "SM-F956": "Samsung Galaxy Z Fold 6",
      "SM-F741": "Samsung Galaxy Z Flip 6",
    };
    for (const [prefix, name] of Object.entries(samsungDict)) {
      if (code.startsWith(prefix)) return { brand: "Samsung", modelName: name };
    }
    if (/^SM-[A-Z]/i.test(code)) return { brand: "Samsung", modelName: `Samsung Galaxy (${code})` };
    if (/samsung/i.test(m)) return { brand: "Samsung", modelName: m };
    return { brand: "Samsung", modelName: `Samsung ${m}` };
  }

  // 4. XIAOMI / REDMI / POCO
  const xiaomiDict: Record<string, string> = {
    "23049PCD8G": "POCO F5",
    "2312DRA50G": "Redmi Note 13 Pro 5G",
    "23117RA68G": "Redmi Note 13 4G",
    "22101316G": "POCO X5 Pro 5G",
    "2201117PG": "POCO M4 Pro",
    "2201116SG": "Redmi Note 11 Pro",
    "M2101K6G": "Redmi Note 10 Pro",
    "24069PC21G": "POCO F6",
  };
  if (xiaomiDict[upper]) return { brand: "Xiaomi", modelName: xiaomiDict[upper] };
  if (/^redmi/i.test(m)) return { brand: "Xiaomi", modelName: `Xiaomi ${m}` };
  if (/^poco/i.test(m)) return { brand: "POCO", modelName: upper.startsWith("POCO") ? m : `POCO ${m}` };
  if (/^mi\s/i.test(m)) return { brand: "Xiaomi", modelName: `Xiaomi ${m}` };

  // 5. OPPO
  const oppoDict: Record<string, string> = {
    CPH2579: "OPPO Reno 11 5G",
    CPH2607: "OPPO Reno 12 5G",
    CPH2525: "OPPO Reno 10 5G",
    CPH2477: "OPPO A78 4G",
    CPH2565: "OPPO A79 5G",
    CPH2577: "OPPO A38",
    CPH2467: "OPPO A17",
    CPH2387: "OPPO A57",
    CPH2269: "OPPO A16",
    CPH2239: "OPPO A54",
    CPH2185: "OPPO A15",
  };
  if (/^cph\d+/i.test(m)) {
    const prefix = upper.match(/^CPH\d{4}/)?.[0] || "";
    if (prefix && oppoDict[prefix]) return { brand: "OPPO", modelName: oppoDict[prefix] };
    return { brand: "OPPO", modelName: `OPPO (${m})` };
  }
  if (/^oppo/i.test(m)) return { brand: "OPPO", modelName: m };

  // 6. REALME
  const realmeDict: Record<string, string> = {
    RMX3760: "Realme C53",
    RMX3710: "Realme C55",
    RMX3771: "Realme 11 Pro 5G",
    RMX3840: "Realme 12 Pro+ 5G",
    RMX3834: "Realme 12+ 5G",
    RMX3261: "Realme C21Y",
    RMX3263: "Realme C21Y",
    RMX3511: "Realme C35",
    RMX3612: "Realme 9 Pro+",
  };
  if (/^rmx\d+/i.test(m)) {
    const prefix = upper.match(/^RMX\d{4}/)?.[0] || "";
    if (prefix && realmeDict[prefix]) return { brand: "Realme", modelName: realmeDict[prefix] };
    return { brand: "Realme", modelName: `Realme (${m})` };
  }
  if (/^realme/i.test(m)) return { brand: "Realme", modelName: m };

  // 7. VIVO / iQOO
  const vivoDict: Record<string, string> = {
    V2318: "Vivo Y100",
    V2334: "Vivo Y28",
    V2250: "Vivo V27 5G",
    V2310: "Vivo V29 5G",
    V2344: "Vivo V30 5G",
    V2204: "Vivo Y16",
    V2205: "Vivo Y22",
    V2111: "Vivo Y21",
    V2043: "Vivo Y20",
  };
  if (/^v\d{4}/i.test(m)) {
    const prefix = upper.match(/^V\d{4}/)?.[0] || "";
    if (prefix && vivoDict[prefix]) return { brand: "Vivo", modelName: vivoDict[prefix] };
    return { brand: "Vivo", modelName: `Vivo (${m})` };
  }
  if (/^(vivo|iqoo)/i.test(m)) return { brand: "Vivo", modelName: m };

  // 8. GOOGLE PIXEL
  if (/pixel/i.test(m)) {
    const name = /google/i.test(m) ? m : `Google ${m}`;
    return { brand: "Google", modelName: name };
  }

  // 9. ASUS ROG / ZENFONE
  if (/asus|rog|zenfone/i.test(m)) {
    return { brand: "ASUS", modelName: m.startsWith("ASUS") ? m : `ASUS ${m}` };
  }

  return { brand: "Ponsel", modelName: m };
}

export function parseClientDevice(overrideModel?: string) {
  if (typeof window === "undefined") {
    return {
      name: "Windows PC • Google Chrome",
      model: "Windows PC",
      brand: "Microsoft",
      browser: "Google Chrome",
      os: "Windows PC",
      deviceType: "desktop" as const,
      location: "Indonesia",
    };
  }

  const ua = navigator.userAgent;

  // 1. Detect Browser
  let browser = "Browser Web";
  if (ua.includes("Edg/")) browser = "Microsoft Edge";
  else if (ua.includes("Chrome/") && !ua.includes("Edg/")) browser = "Google Chrome";
  else if (ua.includes("Safari/") && !ua.includes("Chrome/")) browser = "Apple Safari";
  else if (ua.includes("Firefox/")) browser = "Mozilla Firefox";
  else if (ua.includes("OPR/") || ua.includes("Opera/")) browser = "Opera";
  else if (ua.includes("SamsungBrowser/")) browser = "Samsung Internet";

  // 2. Detect OS & Hardware Model
  let os = "Desktop";
  let deviceType: "desktop" | "mobile" | "tablet" = "desktop";
  let rawModel = overrideModel || "";

  if (ua.includes("Windows NT 10.0") || ua.includes("Windows NT 11.0") || ua.includes("Windows")) {
    os = "Windows PC";
    deviceType = "desktop";
    rawModel = "Windows PC";
  } else if (ua.includes("Macintosh") || ua.includes("Mac OS X")) {
    os = "macOS";
    deviceType = "desktop";
    rawModel = "Apple Mac";
  } else if (ua.includes("iPad")) {
    os = "iPadOS";
    deviceType = "tablet";
    rawModel = "Apple iPad";
  } else if (ua.includes("iPhone")) {
    os = "iOS";
    deviceType = "mobile";
    try {
      const w = window.screen.width * (window.devicePixelRatio || 1);
      const h = window.screen.height * (window.devicePixelRatio || 1);
      const minD = Math.min(w, h);
      const maxD = Math.max(w, h);
      if (minD === 1290 && maxD === 2796) rawModel = "Apple iPhone 15 Pro Max / 16 Plus";
      else if (minD === 1179 && maxD === 2556) rawModel = "Apple iPhone 15 / 15 Pro / 16";
      else if (minD === 1284 && maxD === 2778) rawModel = "Apple iPhone 13 Pro Max / 14 Plus";
      else if (minD === 1170 && maxD === 2532) rawModel = "Apple iPhone 12 / 13 / 14";
      else if (minD === 828 && maxD === 1792) rawModel = "Apple iPhone 11 / XR";
      else if (minD === 1242 && maxD === 2688) rawModel = "Apple iPhone 11 Pro Max / XS Max";
      else if (minD === 1125 && maxD === 2436) rawModel = "Apple iPhone X / XS / 11 Pro";
      else if (minD === 750 && maxD === 1334) rawModel = "Apple iPhone SE / 8";
      else rawModel = "Apple iPhone";
    } catch {
      rawModel = "Apple iPhone";
    }
  } else if (ua.includes("Android")) {
    deviceType = ua.includes("Mobile") ? "mobile" : "tablet";
    const androidMatch = ua.match(/Android\s+([0-9\.]+)?\s*;\s*(?:[a-zA-Z]{2}-[a-zA-Z]{2}\s*;\s*)?([^;)]+?)(?:\s+Build|[;)])/i);
    if (androidMatch) {
      os = androidMatch[1] ? `Android ${androidMatch[1]}` : "Android";
      if (!rawModel) {
        const found = androidMatch[2]?.trim().replace(/\/DS$/i, "").trim();
        if (found && found.toUpperCase() !== "K") {
          rawModel = found;
        }
      }
    } else {
      os = "Android";
    }
  } else if (ua.includes("Linux")) {
    os = "Linux";
    deviceType = "desktop";
    rawModel = "Linux PC";
  }

  // 3. Resolve Marketing Name & Brand
  const { brand, modelName } = resolveDeviceMarketingName(rawModel, os);
  const fullName = `${modelName} • ${browser}`;

  // 4. Location heuristic based on client timezone
  let location = "Indonesia";
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    if (tz.includes("Jakarta") || tz === "Asia/Jakarta") location = "Jakarta, Indonesia";
    else if (tz.includes("Makassar") || tz === "Asia/Makassar") location = "Makassar, Indonesia";
    else if (tz.includes("Jayapura") || tz === "Asia/Jayapura") location = "Jayapura, Indonesia";
    else if (tz.includes("Pontianak") || tz === "Asia/Pontianak") location = "Pontianak, Indonesia";
    else if (tz.includes("Bangkok") || tz === "Asia/Bangkok") location = "WIB (Jakarta), Indonesia";
    else if (tz) {
      const city = tz.split("/")[1]?.replace(/_/g, " ") || "";
      location = city ? `${city}, Indonesia` : "Indonesia";
    }
  } catch {
    location = "Indonesia";
  }

  return {
    name: fullName,
    model: modelName,
    brand,
    browser,
    os,
    deviceType,
    location,
  };
}

export async function parseClientDeviceAsync() {
  if (typeof window === "undefined") return parseClientDevice();

  let detectedModel = "";
  // Query Client Hints for exact hardware model (Chrome / Edge / Samsung Internet on Android)
  if ((navigator as any).userAgentData?.getHighEntropyValues) {
    try {
      const hints = await (navigator as any).userAgentData.getHighEntropyValues(["model", "platform", "platformVersion"]);
      if (hints?.model && typeof hints.model === "string" && hints.model.trim()) {
        detectedModel = hints.model.trim();
      }
    } catch {
      // Fallback to UA parsing
    }
  }

  return parseClientDevice(detectedModel || undefined);
}

export function getDeviceSignature(device: { browser?: string; os?: string; deviceType?: string; name?: string; model?: string }): string {
  const modelKey = (device.model || device.name || "").toLowerCase().trim();
  const browserKey = (device.browser || "").toLowerCase().trim();
  const osKey = (device.os || "").toLowerCase().trim();
  const typeKey = (device.deviceType || "").toLowerCase().trim();
  return `${modelKey}__${browserKey}__${osKey}__${typeKey}`;
}

/**
 * Filter out any session matching current device and group duplicate other devices into one
 */
export function groupAndDeduplicateOtherDevices(
  devicesList: DeviceSession[],
  currentDeviceId: string,
  currentDetails: { browser: string; os: string; deviceType: string }
): DeviceSession[] {
  if (!devicesList || devicesList.length === 0) return [];

  const currentSig = getDeviceSignature(currentDetails);

  // 1. Exclude the current device ID AND any session matching the current device signature
  const otherItems = devicesList.filter((d) => {
    if (d.status === "revoked") return false;
    if (d.id === currentDeviceId) return false;
    const dSig = getDeviceSignature(d);
    if (dSig === currentSig) return false; // same device as current device!
    return true;
  });

  // 2. Group other identical devices by signature
  const groupedMap = new Map<string, DeviceSession[]>();
  for (const d of otherItems) {
    const sig = getDeviceSignature(d);
    if (!groupedMap.has(sig)) {
      groupedMap.set(sig, []);
    }
    groupedMap.get(sig)!.push(d);
  }

  // 3. For each group, pick the one with latest lastActiveAt and gather all associated IDs
  const result: DeviceSession[] = [];
  groupedMap.forEach((group) => {
    group.sort((a, b) => {
      const timeA = a.lastActiveAt?.toDate ? a.lastActiveAt.toDate().getTime() : new Date(a.lastActiveAt || 0).getTime();
      const timeB = b.lastActiveAt?.toDate ? b.lastActiveAt.toDate().getTime() : new Date(b.lastActiveAt || 0).getTime();
      return timeB - timeA;
    });

    const newest = group[0];
    result.push({
      ...newest,
      allIds: group.map((item) => item.id),
    });
  });

  return result;
}

export async function registerOrUpdateDevice(db: Firestore, user: User) {
  if (!user || typeof window === "undefined") return null;
  try {
    const details = await parseClientDeviceAsync();
    const currentSig = getDeviceSignature(details);
    const devicesCol = collection(db, "users", user.uid, "devices");

    // Check all existing devices for this user
    const snap = await getDocs(devicesCol);
    let existingMatchDoc: any = null;
    const duplicateDocsToDelete: string[] = [];

    snap.docs.forEach((d) => {
      const data = d.data() as DeviceSession;
      if (data.status !== "revoked" && getDeviceSignature(data) === currentSig) {
        if (!existingMatchDoc) {
          existingMatchDoc = d;
        } else {
          duplicateDocsToDelete.push(d.id);
        }
      }
    });

    let activeDeviceId = "";

    if (existingMatchDoc) {
      // PERANGKAT SUDAH ADA: Gunakan ID yang sama dan update waktunya saja
      activeDeviceId = existingMatchDoc.id;
      try {
        localStorage.setItem(DEVICE_STORAGE_KEY, activeDeviceId);
      } catch {}

      await updateDoc(doc(db, "users", user.uid, "devices", activeDeviceId), {
        name: details.name,
        model: details.model,
        brand: details.brand,
        browser: details.browser,
        os: details.os,
        deviceType: details.deviceType,
        location: details.location,
        lastActiveAt: serverTimestamp(),
        status: "active",
      });

      // Bersihkan dokumen duplikat dari perangkat yang sama di background
      if (duplicateDocsToDelete.length > 0) {
        for (const dupId of duplicateDocsToDelete) {
          deleteDoc(doc(db, "users", user.uid, "devices", dupId)).catch(() => {});
        }
      }
    } else {
      // PERANGKAT BARU: Buat dokumen baru dan kirim notifikasi email
      activeDeviceId = getOrCreateDeviceId();
      const deviceRef = doc(db, "users", user.uid, "devices", activeDeviceId);

      await setDoc(deviceRef, {
        id: activeDeviceId,
        name: details.name,
        model: details.model,
        brand: details.brand,
        browser: details.browser,
        os: details.os,
        deviceType: details.deviceType,
        location: details.location,
        userAgent: navigator.userAgent,
        createdAt: serverTimestamp(),
        lastActiveAt: serverTimestamp(),
        status: "active",
      });

      // Send new device login alert email via no-reply@marketpoint.id
      try {
        let recipientEmail = user.email;
        let recipientName = user.displayName || "Pengguna";

        // If email not found directly on Auth user (e.g. Facebook login), fetch from Firestore
        if (!recipientEmail) {
          const userDocSnap = await getDoc(doc(db, "users", user.uid));
          if (userDocSnap.exists()) {
            const uData = userDocSnap.data();
            recipientEmail = uData?.email;
            if (uData?.displayName) recipientName = uData.displayName;
          }
        }

        const alertKey = `mp_new_dev_alert_${user.uid}_${activeDeviceId}`;
        if (recipientEmail && typeof sessionStorage !== "undefined" && !sessionStorage.getItem(alertKey)) {
          sessionStorage.setItem(alertKey, "1");
          fetch("/api/auth/send-new-device-alert", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: recipientEmail,
              displayName: recipientName,
              deviceName: details.name,
              browser: details.browser,
              os: details.os,
              deviceType: details.deviceType,
              location: details.location,
            }),
          }).catch((fetchErr) => {
            console.warn("Failed to dispatch new device alert:", fetchErr);
          });
        }
      } catch (alertErr) {
        console.warn("Error triggering new device alert:", alertErr);
      }
    }

    return activeDeviceId;
  } catch (error) {
    console.error("Error registering device session:", error);
    return null;
  }
}

export async function revokeDevice(db: Firestore, userId: string, deviceIdOrIds: string | string[]) {
  try {
    const ids = Array.isArray(deviceIdOrIds) ? deviceIdOrIds : [deviceIdOrIds];
    const promises = ids.map((id) => deleteDoc(doc(db, "users", userId, "devices", id)));
    await Promise.all(promises);
    return true;
  } catch (error) {
    console.error("Error revoking device:", error);
    return false;
  }
}

export async function revokeAllOtherDevices(
  db: Firestore,
  userId: string,
  currentDeviceId: string,
  currentDetails?: { browser: string; os: string; deviceType: string }
) {
  try {
    const currentSig = currentDetails ? getDeviceSignature(currentDetails) : "";
    const devicesCol = collection(db, "users", userId, "devices");
    const snap = await getDocs(devicesCol);
    const deletePromises: Promise<void>[] = [];
    snap.docs.forEach((d) => {
      const data = d.data() as DeviceSession;
      const isCurrent = d.id === currentDeviceId || (currentSig && getDeviceSignature(data) === currentSig);
      if (!isCurrent) {
        deletePromises.push(deleteDoc(d.ref));
      }
    });
    await Promise.all(deletePromises);
    return true;
  } catch (error) {
    console.error("Error revoking other devices:", error);
    return false;
  }
}

export function formatLastActive(val: any): string {
  if (!val) return "Aktif baru saja";
  let date: Date;
  if (val instanceof Date) {
    date = val;
  } else if (val?.toDate && typeof val.toDate === "function") {
    date = val.toDate();
  } else if (typeof val === "number" || typeof val === "string") {
    date = new Date(val);
  } else {
    return "Aktif baru saja";
  }

  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMin < 2) return "Sesi Aktif Sekarang";
  if (diffMin < 60) return `Aktif ${diffMin} menit yang lalu`;
  if (diffHours < 24) return `Aktif ${diffHours} jam yang lalu`;
  if (diffDays === 1) return "Aktif kemarin";
  if (diffDays < 7) return `Aktif ${diffDays} hari yang lalu`;

  return `Aktif ${date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  })}`;
}
