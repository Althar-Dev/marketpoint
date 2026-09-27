"use client";

import React from "react";
import { GalleryManager } from "@/components/gallery-manager";
import { Award } from "lucide-react";

export default function AdminGalleryBadgePage() {
  return (
    <GalleryManager
      category="badge"
      title="Galeri Badge"
      description="Kelola koleksi lencana dan badge promo platform."
      icon={Award}
      folder="gallery/badge"
    />
  );
}
