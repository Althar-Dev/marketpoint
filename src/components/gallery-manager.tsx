"use client";

import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Upload,
  Image as ImageIcon,
  Copy,
  Check,
  Trash2,
  Loader2,
  Eye,
  Search,
  Award,
  Sparkles,
  Palette,
  Plus,
  CloudUpload,
  FolderOpen,
  Server
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export interface GalleryItem {
  id: string;
  name: string;
  url: string;
  category: "badge" | "banner" | "icon" | "background" | string;
  folder: string;
  size?: number;
  type?: string;
  created_at?: string;
}

interface GalleryManagerProps {
  category: "badge" | "banner" | "icon" | "background";
  title: string;
  description: string;
  icon: React.ElementType;
  folder: string; // e.g. "gallery/badge"
}

export function GalleryManager({
  category,
  title,
  description,
  icon: IconComponent,
  folder
}: GalleryManagerProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mounted, setMounted] = useState(false);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedPreview, setSelectedPreview] = useState<GalleryItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [dbSize, setDbSize] = useState<string>("0 KB");

  useEffect(() => {
    setMounted(true);
    fetchGalleryItems();
  }, [category]);

  // Fetch Gallery items from SQLite database/gallery.db via API /api/admin/gallery
  const fetchGalleryItems = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/gallery?category=${category}`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setItems(data.data);
        if (data.dbSize) setDbSize(data.dbSize);
      }
    } catch (e) {
      console.warn("Gagal mengambil data galeri dari SQLite gallery.db:", e);
    } finally {
      setLoading(false);
    }
  };

  // Upload handler to Cloudflare R2 via /api/upload
  const handleFileUpload = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;

    setUploading(true);
    setUploadProgress(10);

    let successCount = 0;
    const fileArray = Array.from(files);

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];

      // Validate image type
      if (!file.type.startsWith("image/")) {
        toast({
          variant: "destructive",
          title: "File Ditolak",
          description: `Berkas ${file.name} bukan file gambar. Silakan upload PNG, JPG, WEBP, atau SVG.`,
        });
        continue;
      }

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", folder);
        formData.append("type", category);

        setUploadProgress(Math.min(90, 20 + Math.round(((i + 1) / fileArray.length) * 70)));

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();

        if (data.url) {
          successCount++;
        } else {
          throw new Error(data.error || "Gagal mengunggah ke Cloudflare R2");
        }
      } catch (err: any) {
        toast({
          variant: "destructive",
          title: "Gagal Upload",
          description: `Gagal mengunggah ${file.name}: ${err.message}`,
        });
      }
    }

    setUploadProgress(100);
    setUploading(false);

    if (successCount > 0) {
      toast({
        title: "Upload Berhasil!",
        description: `Berhasil mengunggah ${successCount} gambar ke Cloudflare R2 folder '${folder}' & tersimpan di database/gallery.db.`,
      });
      // Refresh items from SQLite database/gallery.db
      await fetchGalleryItems();
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Delete item handler
  const handleDeleteItem = async (item: GalleryItem) => {
    setDeletingId(item.id);
    try {
      const res = await fetch(`/api/admin/gallery?id=${item.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast({
          title: "Item Dihapus",
          description: `Gambar ${item.name} telah dihapus dari database/gallery.db.`,
        });
        await fetchGalleryItems();
      } else {
        throw new Error(data.error || "Gagal menghapus item dari database.");
      }
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Menghapus",
        description: err.message || "Gagal menghapus item dari database.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  // Copy URL to clipboard
  const handleCopyUrl = (url: string, id: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast({
      title: "URL Tersalin!",
      description: "Link CDN Cloudflare R2 telah disalin ke clipboard.",
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter items by search query
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "-";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (!mounted) return null;

  return (
    <main className="p-3 md:p-6 lg:p-8 space-y-5 md:space-y-6 bg-[#F9FAFB] min-h-screen">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h2 className="text-base md:text-lg font-bold tracking-tight text-[#212121] flex items-center gap-2">
              <IconComponent className="w-5 h-5 text-[#00AA5B]" /> {title}
            </h2>
          </div>
          <p className="text-[10px] md:text-[11px] text-muted-foreground font-medium">
            {description} • Tersimpan di SQLite <code className="bg-slate-100 text-purple-700 px-1.5 py-0.5 rounded font-mono font-bold">database/gallery.db</code> & R2 <code className="bg-slate-100 text-[#00AA5B] px-1.5 py-0.5 rounded font-mono font-bold">{folder}</code>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="hidden"
            id={`upload-input-${category}`}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            size="sm"
            className="bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold rounded-xl text-xs h-9 px-4 gap-2 shadow-2xs"
          >
            {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CloudUpload className="w-3.5 h-3.5" />}
            {uploading ? "Mengunggah R2..." : "Upload"}
          </Button>
        </div>
      </div>

      {/* Top 3 Summary Cards (2 cards per row on mobile) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3 md:gap-4">
        <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-3.5 md:p-4 flex flex-col justify-between h-full space-y-1.5 md:space-y-2">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 truncate">
                <ImageIcon className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-600 shrink-0" /> Total Gambar
              </span>
              <Badge variant="outline" className="text-[7px] sm:text-[8px] font-bold px-1.5 sm:px-2 py-0.5 border-blue-200 text-blue-700 bg-blue-50 shrink-0">
                CLOUDFLARE R2
              </Badge>
            </div>
            <div>
              <div className="text-sm sm:text-base md:text-xl font-black text-slate-800 tracking-tight">
                {items.length.toLocaleString("id-ID")} <span className="text-[10px] sm:text-xs font-bold text-muted-foreground">files</span>
              </div>
              <p className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-muted-foreground truncate mt-0.5">
                Koleksi gambar aktif kategori {category}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden">
          <CardContent className="p-3.5 md:p-4 flex flex-col justify-between h-full space-y-1.5 md:space-y-2">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 truncate">
                <FolderOpen className="w-3 h-3 md:w-3.5 md:h-3.5 text-[#00AA5B] shrink-0" /> R2 Directory
              </span>
              <Badge variant="outline" className="text-[7px] sm:text-[8px] font-bold px-1.5 sm:px-2 py-0.5 border-green-200 text-green-700 bg-green-50 shrink-0">
                BUCKET
              </Badge>
            </div>
            <div>
              <div className="text-xs sm:text-sm md:text-base font-bold font-mono text-[#00AA5B] tracking-tight truncate">
                {folder}
              </div>
              <p className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-muted-foreground truncate mt-0.5">
                Jalur penyimpanan publik CDN
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 shadow-sm rounded-xl md:rounded-2xl bg-white overflow-hidden col-span-2 lg:col-span-1">
          <CardContent className="p-3.5 md:p-4 flex flex-col justify-between h-full space-y-1.5 md:space-y-2">
            <div className="flex items-center justify-between gap-1">
              <span className="text-[8px] sm:text-[9px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1 truncate">
                <Server className="w-3 h-3 md:w-3.5 md:h-3.5 text-purple-600 shrink-0" /> Storage Database
              </span>
              <Badge variant="default" className="text-[7px] sm:text-[8px] font-bold px-1.5 sm:px-2 py-0.5 bg-purple-100 text-purple-800 border-purple-200 shrink-0">
                gallery.db
              </Badge>
            </div>
            <div>
              <div className="text-sm sm:text-base md:text-xl font-black text-purple-700 tracking-tight">
                {dbSize}
              </div>
              <p className="text-[8px] sm:text-[9px] md:text-[10px] font-medium text-muted-foreground truncate mt-0.5">
                Ukuran file database/gallery.db
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Gallery Container */}
      <Card className="border-border/50 shadow-sm rounded-2xl bg-white overflow-hidden">
        {/* Toolbar & Drag n Drop Zone */}
        <CardHeader className="p-4 md:p-5 border-b border-border/40 bg-slate-50/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Cari berkas gambar di database/gallery.db (${folder})...`}
                className="h-9 pl-9 rounded-xl bg-white border-border/70 text-xs font-medium focus:ring-[#00AA5B]/20"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/60 hover:text-foreground text-xs font-bold"
                >
                  ×
                </button>
              )}
            </div>

            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="outline"
              size="sm"
              className="h-9 rounded-xl text-xs font-bold border-border/70 text-slate-700 bg-white hover:bg-slate-50 gap-1.5"
            >
              <Plus className="w-3.5 h-3.5 text-[#00AA5B]" /> Tambah Berkas
            </Button>
          </div>

          {/* Upload Dropzone Banner */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files) handleFileUpload(e.dataTransfer.files);
            }}
            className="border-2 border-dashed border-border/70 hover:border-[#00AA5B]/50 rounded-xl p-4 bg-white hover:bg-green-50/20 transition-colors cursor-pointer flex flex-col items-center justify-center text-center space-y-1.5"
          >
            <CloudUpload className="w-6 h-6 text-[#00AA5B] animate-bounce" />
            <p className="text-xs font-bold text-slate-700">
              Klik atau Seret (Drag & Drop) file gambar di sini untuk upload ke R2 <code className="text-[#00AA5B] font-mono">{folder}</code>
            </p>
            <p className="text-[10px] text-muted-foreground">
              Mendukung PNG, SVG, JPG, WEBP hingga 10MB per file • Disimpan ke <code className="text-purple-700 font-mono font-bold">database/gallery.db</code>
            </p>
            {uploading && (
              <div className="w-full max-w-xs bg-slate-100 rounded-full h-2 mt-2 overflow-hidden border border-slate-200">
                <div
                  className="bg-[#00AA5B] h-full transition-all duration-300 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
        </CardHeader>

        {/* Gallery Grid View (2 Columns on Mobile) */}
        <CardContent className="p-4 md:p-6">
          {loading ? (
            <div className="py-16 px-4 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#00AA5B]" />
              <p className="text-xs font-semibold text-slate-600">Memuat galeri dari database/gallery.db...</p>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 px-4 flex flex-col items-center justify-center text-center space-y-3">
              <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                <ImageIcon className="w-7 h-7 text-slate-400" />
              </div>
              <div className="space-y-1 max-w-sm">
                <h3 className="text-sm font-bold text-foreground">
                  {searchQuery ? "Hasil Pencarian Tidak Ditemukan" : `Galeri ${title} Masih Kosong`}
                </h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {searchQuery
                    ? `Tidak ada berkas gambar yang cocok dengan kata kunci "${searchQuery}".`
                    : `Belum ada data di database/gallery.db untuk folder R2 ${folder}. Klik tombol "Upload" untuk menambahkan.`}
                </p>
              </div>
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold rounded-xl text-xs h-9 px-5 gap-2 shadow-2xs mt-2"
              >
                <Plus className="w-4 h-4" /> Upload Gambar Pertama
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
              {filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative rounded-2xl border border-border/60 bg-white hover:border-[#00AA5B]/50 transition-all duration-200 overflow-hidden shadow-2xs hover:shadow-md flex flex-col justify-between"
                >
                  {/* Checkerboard pattern for transparent PNG/SVG preview */}
                  <div
                    className="w-full h-32 md:h-36 relative flex items-center justify-center p-0 overflow-hidden bg-slate-100"
                    style={{
                      backgroundImage: `radial-gradient(#CBD5E1 1px, transparent 1px)`,
                      backgroundSize: "12px 12px",
                    }}
                  >
                    <img
                      src={item.url}
                      alt={item.name}
                      className="w-full h-full object-cover filter drop-shadow-xs transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Hover Overlay Action Bar */}
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-2 backdrop-blur-2xs">
                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => setSelectedPreview(item)}
                        className="w-8 h-8 rounded-xl bg-white text-slate-900 hover:bg-slate-100 shadow-sm"
                        title="Lihat Pratinjau"
                      >
                        <Eye className="w-4 h-4 text-purple-600" />
                      </Button>

                      <Button
                        size="icon"
                        variant="secondary"
                        onClick={() => handleCopyUrl(item.url, item.id)}
                        className="w-8 h-8 rounded-xl bg-white text-slate-900 hover:bg-slate-100 shadow-sm"
                        title="Salin URL CDN R2"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4 text-blue-600" />
                        )}
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="icon"
                            variant="secondary"
                            className="w-8 h-8 rounded-xl bg-white text-red-600 hover:bg-red-50 shadow-sm"
                            title="Hapus Gambar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="rounded-2xl max-w-md bg-white border border-border/80 p-5">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-base font-bold text-slate-900 flex items-center gap-2">
                              <Trash2 className="w-5 h-5 text-red-500" /> Hapus Gambar?
                            </AlertDialogTitle>
                            <AlertDialogDescription className="text-xs text-slate-600 leading-relaxed pt-1">
                              Apakah Anda yakin ingin menghapus berkas <strong className="text-slate-900 font-mono">{item.name}</strong> dari database/gallery.db?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="pt-3 gap-2">
                            <AlertDialogCancel className="rounded-xl text-xs font-bold h-9 bg-slate-100 hover:bg-slate-200 text-slate-700 border-0">
                              Batal
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteItem(item)}
                              className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs h-9 px-4"
                            >
                              Ya, Hapus
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>

                  {/* Card Info Footer */}
                  <div className="p-2.5 border-t border-border/40 bg-white space-y-1">
                    <p className="text-[11px] font-bold text-slate-800 truncate" title={item.name}>
                      {item.name}
                    </p>
                    <div className="flex items-center justify-between text-[9px] text-muted-foreground font-medium">
                      <span>{formatFileSize(item.size)}</span>
                      <button
                        onClick={() => handleCopyUrl(item.url, item.id)}
                        className="text-[#00AA5B] hover:underline font-bold flex items-center gap-0.5"
                      >
                        {copiedId === item.id ? "Tersalin!" : "Salin URL"}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fullscreen Preview Modal */}
      {selectedPreview && (
        <Dialog open={!!selectedPreview} onOpenChange={() => setSelectedPreview(null)}>
          <DialogContent className="rounded-2xl max-w-lg bg-white border border-border/80 p-5">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold text-slate-900 flex items-center justify-between pr-6">
                <span className="truncate">{selectedPreview.name}</span>
                <Badge variant="outline" className="text-[9px] font-mono font-bold bg-slate-50">
                  {folder}
                </Badge>
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 pt-2">
              <div
                className="w-full h-64 rounded-xl flex items-center justify-center p-0 bg-slate-100 border border-border/60 overflow-hidden"
                style={{
                  backgroundImage: `radial-gradient(#CBD5E1 1px, transparent 1px)`,
                  backgroundSize: "16px 16px",
                }}
              >
                <img
                  src={selectedPreview.url}
                  alt={selectedPreview.name}
                  className="max-w-full max-h-full object-contain filter drop-shadow-md"
                />
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">Cloudflare R2 Public CDN URL:</span>
                <div className="flex items-center gap-2">
                  <Input
                    readOnly
                    value={selectedPreview.url}
                    className="h-9 text-xs font-mono bg-slate-50 border-border/60 rounded-xl"
                  />
                  <Button
                    size="sm"
                    onClick={() => handleCopyUrl(selectedPreview.url, selectedPreview.id)}
                    className="h-9 px-3 bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold rounded-xl text-xs gap-1.5 shrink-0"
                  >
                    {copiedId === selectedPreview.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedId === selectedPreview.id ? "Tersalin" : "Salin URL"}
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}
