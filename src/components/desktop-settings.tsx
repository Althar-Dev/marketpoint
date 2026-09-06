"use client";

import { useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Shield, 
  Inbox, 
  ShoppingBag, 
  UserCircle,
  LogOut,
  Store,
  Loader2,
  Camera,
  Lock
} from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { updatePassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";

interface DesktopProfileSettingsProps {
  user: any;
  wallet: any;
  hasShop?: boolean;
  displayName: string;
  setDisplayName: (val: string) => void;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  handleUpdateProfile: () => void;
  handleLogout: () => void;
  updating: boolean;
  onAvatarUpload?: (file: File) => Promise<void>;
  uploadingAvatar?: boolean;
}

export function DesktopSettings({
  user,
  wallet,
  hasShop,
  displayName,
  setDisplayName,
  isEditing,
  setIsEditing,
  handleUpdateProfile,
  handleLogout,
  updating,
  onAvatarUpload,
  uploadingAvatar
}: DesktopProfileSettingsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);

  // Check if user is a Google user without a password
  const providers = user?.providerData?.map((p: any) => p.providerId) || [];
  const isGoogleUser = providers.includes('google.com');
  const hasPassword = providers.includes('password');
  const canCreatePassword = isGoogleUser && !hasPassword;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onAvatarUpload) {
      await onAvatarUpload(file);
    }
  };

  const handleCreatePassword = async () => {
    if (!newPassword || newPassword !== confirmPassword) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Kata sandi tidak cocok atau kosong.",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Gagal",
        description: "Kata sandi minimal 6 karakter.",
      });
      return;
    }

    setIsPasswordLoading(true);
    try {
      await updatePassword(user, newPassword);
      toast({
        title: "Berhasil",
        description: "Kata sandi telah dibuat. Anda sekarang bisa masuk menggunakan email & sandi.",
      });
      setIsPasswordDialogOpen(false);
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Gagal",
        description: error.message || "Gagal membuat kata sandi. Silakan coba masuk ulang.",
      });
    } finally {
      setIsPasswordLoading(false);
    }
  };
  
  return (
    <div className="bg-[#F8FAFC] font-body text-[#212121] min-h-[calc(100vh-64px)]">
      <div className="max-w-screen-xl mx-auto flex gap-6 p-6 items-start">
        
        {/* Sidebar Nav */}
        <aside className="w-[260px] shrink-0 space-y-4 sticky top-20">
          <Card className="border border-border/50 shadow-sm bg-white rounded-xl overflow-hidden p-4 h-auto">
            <div className="flex items-center gap-3 mb-5">
              <Avatar className="h-9 w-9 ring-1 ring-border">
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback className="bg-[#00AA5B] text-white font-bold text-[12px]">
                  {displayName?.substring(0, 1) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-bold text-[12px] truncate">{displayName || "User MarketPoint"}</p>
              </div>
            </div>

            {/* Shop Section */}
            <div className="space-y-3 pt-3 border-t border-border/50">
              <Link href={hasShop ? "/my-shop" : "/my-shop/setup"} className="flex items-center justify-between group cursor-pointer hover:bg-muted/30 p-1 -mx-1 rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#F8FAFC] rounded-full flex items-center justify-center border border-border group-hover:border-[#00AA5B]/30">
                    <Store className="w-2.5 h-2.5 text-muted-foreground group-hover:text-[#00AA5B]" />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground group-hover:text-foreground">Toko Saya</span>
                </div>
                <span className={cn(
                  "text-[10px] font-bold",
                  hasShop ? "text-muted-foreground" : "text-[#00AA5B]"
                )}>
                  {hasShop ? "Kelola Toko" : "Buka Gratis"}
                </span>
              </Link>
              
              <Link href="/wallet" className="flex items-center justify-between group cursor-pointer hover:bg-muted/30 p-1 -mx-1 rounded-lg transition-colors">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#F8FAFC] rounded-full flex items-center justify-center border border-border overflow-hidden p-1">
                    <img src="/assets/icon/wallet.png" className="w-full h-full object-contain" alt="Wallet" />
                  </div>
                  <span className="text-[11px] font-medium text-muted-foreground">Saldo & MCoins</span>
                </div>
                <span className="text-[11px] font-bold">Rp{wallet?.balance?.toLocaleString('id-ID') || 0}</span>
              </Link>
            </div>

            {/* Navigation Menus */}
            <div className="mt-6 pt-3 border-t border-border/50">
              <Accordion type="single" collapsible defaultValue="profil" className="w-full">
                <AccordionItem value="inbox" className="border-none">
                  <AccordionTrigger className="hover:no-underline py-2 text-[12px] font-bold focus:outline-none">
                    <div className="flex items-center gap-2.5">
                      <Inbox className="w-3.5 h-3.5 text-muted-foreground" />
                      Kotak Masuk
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-1 pl-6 space-y-0.5">
                    <p className="text-[11px] text-muted-foreground py-1 px-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">Chat</p>
                    <p className="text-[11px] text-muted-foreground py-1 px-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">Ulasan</p>
                    <p className="text-[11px] text-muted-foreground py-1 px-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">Update</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pembelian" className="border-none">
                  <AccordionTrigger className="hover:no-underline py-2 text-[12px] font-bold focus:outline-none">
                    <div className="flex items-center gap-2.5">
                      <ShoppingBag className="w-3.5 h-3.5 text-muted-foreground" />
                      Pembelian
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-1 pl-6 space-y-0.5">
                    <p className="text-[11px] text-muted-foreground py-1 px-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">Menunggu Pembayaran</p>
                    <p className="text-[11px] text-muted-foreground py-1 px-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">Daftar Transaksi</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="profil" className="border-none">
                  <AccordionTrigger className="hover:no-underline py-2 text-[12px] font-bold focus:outline-none text-[#00AA5B]">
                    <div className="flex items-center gap-2.5">
                      <UserCircle className="w-3.5 h-3.5 text-[#00AA5B]" />
                      Profil Saya
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-1 pl-6 space-y-0.5">
                    <p className="text-[11px] text-[#00AA5B] font-bold py-1 px-2 rounded-lg bg-[#00AA5B]/5 cursor-pointer">Pengaturan</p>
                    <p className="text-[11px] text-muted-foreground py-1 px-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">Wishlist</p>
                    <p className="text-[11px] text-muted-foreground py-1 px-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">Toko Favorit</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="w-full justify-start gap-2.5 mt-6 text-destructive hover:text-destructive hover:bg-destructive/5 rounded-lg text-[11px] font-bold h-9 px-2"
            >
              <LogOut className="w-3.5 h-3.5" /> Keluar Akun
            </Button>
          </Card>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0">
          <Card className="border border-border/50 shadow-sm bg-white rounded-xl overflow-hidden h-auto">
            <div className="p-5 border-b border-border/50 flex items-center gap-2.5">
              <UserCircle className="w-4.5 h-4.5 text-muted-foreground" />
              <h1 className="text-base font-bold tracking-tight">{displayName || "Profil"}</h1>
            </div>

            <Tabs defaultValue="biodata" className="w-full">
              <div className="px-5 border-b border-border/50 bg-white">
                <TabsList className="bg-transparent h-12 p-0 w-full justify-start gap-6 rounded-none border-none">
                  {[
                    { id: "biodata", label: "Biodata Diri" },
                    { id: "rekening", label: "Rekening Bank" },
                    { id: "notifikasi", label: "Notifikasi" },
                    { id: "keamanan", label: "Keamanan" },
                  ].map((tab) => (
                    <TabsTrigger 
                      key={tab.id}
                      value={tab.id}
                      className="px-0 rounded-none h-full border-b-2 border-transparent data-[state=active]:border-[#00AA5B] data-[state=active]:text-[#00AA5B] data-[state=active]:bg-transparent font-bold text-[12px] text-muted-foreground transition-all"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="biodata" className="p-6 mt-0">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column: Profile Pic */}
                  <div className="md:col-span-4 space-y-4">
                    <Card className="p-5 border border-border/50 shadow-none bg-white rounded-xl flex flex-col items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-40 w-40 ring-2 ring-[#F8FAFC] rounded-xl overflow-hidden shadow-sm">
                          <AvatarImage src={user.photoURL || undefined} className="object-cover" />
                          <AvatarFallback className="bg-[#00AA5B] text-white text-4xl font-bold uppercase rounded-none">
                            {displayName?.substring(0, 1) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        {uploadingAvatar && (
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl z-10">
                            <Loader2 className="w-8 h-8 text-white animate-spin" />
                          </div>
                        )}
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*" 
                        onChange={handleFileChange}
                      />
                      <Button 
                        variant="outline" 
                        className="w-full h-9 font-bold text-[12px] rounded-lg border-border/60 hover:bg-muted/50"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadingAvatar}
                      >
                        {uploadingAvatar ? "Mengunggah..." : "Pilih Foto"}
                      </Button>
                      <p className="text-[10px] text-muted-foreground leading-relaxed text-center px-1">
                        Besar file: maksimum 10MB. Ekstensi: .JPG .JPEG .PNG
                      </p>
                    </Card>

                    <div className="space-y-2">
                      {canCreatePassword && (
                        <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
                          <DialogTrigger asChild>
                            <Button variant="outline" className="w-full h-10 font-bold text-[12px] rounded-xl border-[#00AA5B] text-[#00AA5B] hover:bg-[#00AA5B]/5 justify-center gap-2">
                              <Lock className="w-3.5 h-3.5" /> Buat Kata Sandi
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-2xl max-w-sm border-border">
                            <DialogHeader>
                              <DialogTitle className="font-bold text-lg">Buat Kata Sandi</DialogTitle>
                              <DialogDescription className="text-xs">
                                Masukkan kata sandi baru untuk akun Anda agar bisa masuk via email.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">KATA SANDI BARU</label>
                                <Input 
                                  type="password"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  placeholder="Minimal 6 karakter" 
                                  className="h-10 rounded-xl border-border text-sm font-medium" 
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground ml-1 uppercase">KONFIRMASI SANDI</label>
                                <Input 
                                  type="password"
                                  value={confirmPassword}
                                  onChange={(e) => setConfirmPassword(e.target.value)}
                                  placeholder="Ulangi kata sandi" 
                                  className="h-10 rounded-xl border-border text-sm font-medium" 
                                />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button 
                                onClick={handleCreatePassword}
                                disabled={isPasswordLoading || !newPassword}
                                className="w-full h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs"
                              >
                                {isPasswordLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
                                Simpan Kata Sandi
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      <Button variant="outline" className="w-full h-10 font-bold text-[12px] rounded-xl border-border/60 flex items-center justify-center gap-2.5 group">
                        <Shield className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span>PIN MarketPoint</span>
                      </Button>
                    </div>
                  </div>

                  {/* Right Column: Information Forms */}
                  <div className="md:col-span-8 space-y-8">
                    <div className="space-y-5">
                      <h3 className="text-[13px] font-bold text-[#2E3137]">Ubah Biodata Diri</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-12 items-center gap-3">
                          <div className="col-span-3 text-[12px] text-muted-foreground">Nama</div>
                          <div className="col-span-9 flex items-center justify-between">
                            {isEditing ? (
                              <div className="flex items-center gap-2 w-full">
                                <Input 
                                  value={displayName}
                                  onChange={(e) => setDisplayName(e.target.value)}
                                  className="h-8 text-[12px] font-medium border-[#00AA5B] ring-1 ring-[#00AA5B]/10 max-w-[200px]"
                                  autoFocus
                                />
                                <Button onClick={handleUpdateProfile} disabled={updating} size="sm" className="h-8 bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-[10px] font-bold px-3">Simpan</Button>
                                <Button onClick={() => setIsEditing(false)} variant="ghost" size="sm" className="h-8 text-[10px] font-bold px-3">Batal</Button>
                              </div>
                            ) : (
                              <>
                                <span className="text-[12px] font-bold">{displayName || "Belum diatur"}</span>
                                <button onClick={() => setIsEditing(true)} className="text-[11px] font-bold text-[#00AA5B] hover:underline">Ubah</button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-12 items-center gap-3">
                          <div className="col-span-3 text-[12px] text-muted-foreground">Tanggal Lahir</div>
                          <div className="col-span-9">
                            <button className="text-[11px] font-bold text-[#00AA5B] hover:underline">Tambah Tanggal Lahir</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-12 items-center gap-3">
                          <div className="col-span-3 text-[12px] text-muted-foreground">Jenis Kelamin</div>
                          <div className="col-span-9">
                            <button className="text-[11px] font-bold text-[#00AA5B] hover:underline">Tambah Jenis Kelamin</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5 pt-5 border-t border-border/50">
                      <h3 className="text-[13px] font-bold text-[#2E3137]">Ubah Kontak</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-12 items-center gap-3">
                          <div className="col-span-3 text-[12px] text-muted-foreground">Email</div>
                          <div className="col-span-9 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-bold">{user.email}</span>
                              <div className="bg-[#D1FAE5] text-[#059669] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Terverifikasi</div>
                            </div>
                            <button className="text-[11px] font-bold text-[#00AA5B] hover:underline">Ubah</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-12 items-center gap-3">
                          <div className="col-span-3 text-[12px] text-muted-foreground">Nomor HP</div>
                          <div className="col-span-9 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-bold">6288976577650</span>
                              <div className="bg-[#D1FAE5] text-[#059669] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Terverifikasi</div>
                            </div>
                            <button className="text-[11px] font-bold text-[#00AA5B] hover:underline">Ubah</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {["rekening", "notifikasi", "keamanan"].map(tabId => (
                <TabsContent key={tabId} value={tabId} className="p-8 mt-0 text-center">
                   <p className="text-[11px] text-muted-foreground">Halaman {tabId.charAt(0).toUpperCase() + tabId.slice(1)} sedang dalam pengembangan.</p>
                </TabsContent>
              ))}
            </Tabs>
          </Card>
        </main>
      </div>
    </div>
  );
}
