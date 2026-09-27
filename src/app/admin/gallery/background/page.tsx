"use client";

import React from "react";
import { GalleryManager } from "@/components/gallery-manager";
import { Palette } from "lucide-react";

export default function AdminGalleryBackgroundPage() {
  return (
    <GalleryManager
      category="background"
      title="Galeri Background"
      description="Kelola koleksi latar belakang dan pola grafik."
      icon={Palette}
      folder="gallery/background"
    />
  );
}
