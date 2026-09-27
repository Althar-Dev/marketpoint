"use client";

import React from "react";
import { GalleryManager } from "@/components/gallery-manager";
import { Sparkles } from "lucide-react";

export default function AdminGalleryIconPage() {
  return (
    <GalleryManager
      category="icon"
      title="Galeri Icon"
      description="Kelola koleksi icon logo provider, produk, dan navigasi."
      icon={Sparkles}
      folder="gallery/icon"
    />
  );
}
