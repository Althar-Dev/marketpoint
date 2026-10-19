"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Search, 
  Package, 
  Star, 
  Store, 
  Zap,
  ArrowRight,
  ShoppingBag,
  Filter
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function DashboardProductsPage() {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter(p => 
    p.title?.toLowerCase().includes(search.toLowerCase()) || 
    p.categoryName?.toLowerCase().includes(search.toLowerCase())
  );

  if (!mounted) return null;

  return (
    <main className="p-4 md:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[#212121]">Katalog Produk Digital</h2>
          <p className="text-xs text-muted-foreground font-medium mt-0.5">Cari dan temukan aset digital terbaik untuk kebutuhan Anda.</p>
        </div>
      </div>

      <div className="relative max-w-lg">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Cari source code, bot, lisensi..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-11 pl-10 rounded-2xl bg-white border-border shadow-sm text-sm focus:ring-[#00AA5B]/20" 
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-60 w-full rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mb-4 border border-border/60">
            <Package className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-sm font-bold text-slate-700">Produk tidak ditemukan</p>
          <p className="text-xs text-muted-foreground mt-1">Coba kata kunci lain atau cari kategori berbeda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {filtered.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <Card className="group border-border border shadow-2xs rounded-2xl overflow-hidden bg-white hover:shadow-lg transition-all cursor-pointer h-full">
                <div className="relative aspect-square bg-slate-50 overflow-hidden">
                  <img 
                    src={product.images?.[0]?.imageUrl || "https://cdn.marketpoint.id/marketpoint.png"} 
                    alt={product.title} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                  />
                </div>
                <CardContent className="p-3.5 space-y-2">
                  <h4 className="text-[12px] font-bold text-slate-800 line-clamp-2 leading-snug group-hover:text-[#00AA5B] transition-colors">{product.title}</h4>
                  <p className="text-[13px] font-black text-[#00AA5B]">Rp {Number(product.price).toLocaleString('id-ID')}</p>
                  <div className="flex items-center gap-2 pt-1 border-t border-border/40 mt-1">
                    <Star className="w-3 h-3 text-[#FFC400] fill-[#FFC400]" />
                    <span className="text-[10px] font-bold text-slate-600">{product.ratingAvg || "5.0"}</span>
                    <span className="text-[10px] text-muted-foreground ml-auto">{product.salesCount || 0} terjual</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
