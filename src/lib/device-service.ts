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

export function parseClientDevice() {
  if (typeof window === "undefined") {
    return {
      name: "Google Chrome • Windows PC",
      browser: "Google Chrome",
      os: "Windows PC",
      deviceType: "desktop" as const,
      location: "Indonesia",
    };
  }

  const ua = navigator.userAgent;

  // Detect Browser
  let browser = "Browser Web";
  if (ua.includes("Edg/")) browser = "Microsoft Edge";
  else if (ua.includes("Chrome/") && !ua.includes("Edg/")) browser = "Google Chrome";
  else if (ua.includes("Safari/") && !ua.includes("Chrome/")) browser = "Apple Safari";
  else if (ua.includes("Firefox/")) browser = "Mozilla Firefox";
  else if (ua.includes("OPR/") || ua.includes("Opera/")) browser = "Opera";
  else if (ua.includes("SamsungBrowser/")) browser = "Samsung Internet";

  // Detect OS & Device Type
  let os = "Desktop";
  let deviceType: "desktop" | "mobile" | "tablet" = "desktop";

  if (ua.includes("Windows NT 10.0") || ua.includes("Windows NT 11.0") || ua.includes("Windows")) {
    os = "Windows PC";
    deviceType = "desktop";
  } else if (ua.includes("Macintosh") || ua.includes("Mac OS X")) {
    os = "macOS";
    deviceType = "desktop";
  } else if (ua.includes("iPad")) {
    os = "iPadOS";
    deviceType = "tablet";
  } else if (ua.includes("iPhone")) {
    os = "iOS (iPhone)";
    deviceType = "mobile";
  } else if (ua.includes("Android")) {
    if (ua.includes("Mobile")) {
      os = "Android Mobile";
      deviceType = "mobile";
    } else {
      os = "Android Tablet";
      deviceType = "tablet";
    }
  } else if (ua.includes("Linux")) {
    os = "Linux";
    deviceType = "desktop";
  }

  // Location heuristic based on client timezone
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
    name: `${browser} • ${os}`,
    browser,
    os,
    deviceType,
    location,
  };
}

export function getDeviceSignature(device: { browser?: string; os?: string; deviceType?: string; name?: string }): string {
  if (device.browser && device.os && device.deviceType) {
    return `${device.browser.toLowerCase().trim()}__${device.os.toLowerCase().trim()}__${device.deviceType.toLowerCase().trim()}`;
  }
  return (device.name || "unknown").toLowerCase().trim();
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
    const details = parseClientDevice();
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
