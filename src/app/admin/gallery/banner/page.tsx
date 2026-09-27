"use client";

import React from "react";
import { GalleryManager } from "@/components/gallery-manager";
import { Image as ImageIcon } from "lucide-react";

export default function AdminGalleryBannerPage() {
  return (
    <GalleryManager
      category="banner"
      title="Galeri Banner"
      description="Kelola koleksi banner promosi dan slider halaman."
      icon={ImageIcon}
      folder="gallery/banner"
    />
  );
}
