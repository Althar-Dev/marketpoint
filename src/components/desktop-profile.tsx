"use client";

import { DesktopSettings } from "./desktop-settings";

// This file is now a simple wrapper for the unified DesktopSettings component
// to maintain backward compatibility in imports if needed.
export function DesktopProfile(props: any) {
  return <DesktopSettings {...props} />;
}
