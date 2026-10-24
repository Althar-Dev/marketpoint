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
      name: "Browser Web",
      browser: "Chrome",
      os: "Desktop",
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
      location = city ? `${city}` : "Indonesia";
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

export async function registerOrUpdateDevice(db: Firestore, user: User) {
  if (!user || typeof window === "undefined") return null;
  try {
    const deviceId = getOrCreateDeviceId();
    const details = parseClientDevice();
    const deviceRef = doc(db, "users", user.uid, "devices", deviceId);

    const snap = await getDoc(deviceRef);
    if (!snap.exists()) {
      await setDoc(deviceRef, {
        id: deviceId,
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
    } else {
      await updateDoc(deviceRef, {
        name: details.name,
        browser: details.browser,
        os: details.os,
        deviceType: details.deviceType,
        location: details.location,
        lastActiveAt: serverTimestamp(),
        status: "active",
      });
    }
    return deviceId;
  } catch (error) {
    console.error("Error registering device session:", error);
    return null;
  }
}

export async function revokeDevice(db: Firestore, userId: string, deviceId: string) {
  try {
    const deviceRef = doc(db, "users", userId, "devices", deviceId);
    await deleteDoc(deviceRef);
    return true;
  } catch (error) {
    console.error("Error revoking device:", error);
    return false;
  }
}

export async function revokeAllOtherDevices(db: Firestore, userId: string, currentDeviceId: string) {
  try {
    const devicesCol = collection(db, "users", userId, "devices");
    const snap = await getDocs(devicesCol);
    const deletePromises: Promise<void>[] = [];
    snap.docs.forEach((d) => {
      if (d.id !== currentDeviceId) {
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
  } else if (val?.seconds) {
    date = new Date(val.seconds * 1000);
  } else if (typeof val === "string" || typeof val === "number") {
    date = new Date(val);
  } else {
    return "Aktif baru saja";
  }

  const diffMs = Date.now() - date.getTime();
  if (isNaN(diffMs) || diffMs < 0) return "Aktif baru saja";

  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 2) return "Aktif baru saja";
  if (diffMin < 60) return `Aktif ${diffMin} menit yang lalu`;
  if (diffHour < 24) return `Aktif ${diffHour} jam yang lalu`;
  if (diffDay === 1) {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `Kemarin, ${hours}:${minutes}`;
  }
  if (diffDay < 7) return `Aktif ${diffDay} hari yang lalu`;

  const day = date.getDate();
  const months = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Ags", "Sep", "Okt", "Nov", "Des"];
  const month = months[date.getMonth()];
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${month}, ${hours}:${minutes}`;
}
