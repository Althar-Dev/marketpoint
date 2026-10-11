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
import { DesktopAccountSidebar } from "@/components/desktop-account-sidebar";
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
        
        <DesktopAccountSidebar
          user={user}
          wallet={wallet}
          hasShop={hasShop}
          displayName={displayName}
          activeItem="profile-settings"
          handleLogout={handleLogout}
        />

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
                  <div className="md:col-span-4 space-y-4">
                    <Card className="p-5 border border-border/50 shadow-none bg-white rounded-xl flex flex-col items-center gap-4">
                      <div className="relative">
                        <Avatar className="h-40 w-40 ring-2 ring-[#F8FAFC] rounded-xl overflow-hidden shadow-sm">
                          <AvatarImage 
                            src={user.photoURL === "/assets/avatar/duck.png" ? "/assets/avatar/duck.jpg" : (user.photoURL || undefined)} 
                            className="object-cover" 
                            referrerPolicy="no-referrer"
                          />
                          <AvatarFallback className="bg-[#00AA5B] text-white text-4xl font-bold rounded-none">
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
                        className="w-full h-9 font-bold text-[12px] rounded-lg border-border/60 hover:bg-muted/50 transition-colors"
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
                            <Button variant="outline" className="w-full h-10 font-bold text-[12px] rounded-xl border-[#00AA5B] text-[#00AA5B] hover:bg-[#00AA5B]/5 justify-center gap-2 transition-all">
                              <Lock className="w-3.5 h-3.5" /> Buat kata sandi
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-2xl max-w-sm border-border">
                            <DialogHeader>
                              <DialogTitle className="font-bold text-lg">Buat kata sandi</DialogTitle>
                              <DialogDescription className="text-xs">
                                Masukkan kata sandi baru untuk akun Anda agar bisa masuk via email.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4 space-y-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground ml-1">Kata sandi baru</label>
                                <Input 
                                  type="password"
                                  value={newPassword}
                                  onChange={(e) => setNewPassword(e.target.value)}
                                  placeholder="Minimal 6 karakter" 
                                  className="h-10 rounded-xl border-border text-sm font-medium" 
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground ml-1">Konfirmasi sandi</label>
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
                                className="w-full h-10 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 font-bold text-white text-xs transition-all"
                              >
                                {isPasswordLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-2" /> : null}
                                Simpan kata sandi
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      <Button variant="outline" className="w-full h-10 font-bold text-[12px] rounded-xl border-border/60 flex items-center justify-center gap-2.5 group transition-all">
                        <Shield className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span>PIN MarketPointID</span>
                      </Button>
                    </div>
                  </div>

                  <div className="md:col-span-8 space-y-8">
                    <div className="space-y-5">
                      <h3 className="text-[13px] font-bold text-[#2E3137]">Ubah biodata diri</h3>
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
                                <Button onClick={handleUpdateProfile} disabled={updating} size="sm" className="h-8 bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-[10px] font-bold px-3 transition-all">Simpan</Button>
                                <Button onClick={() => setIsEditing(false)} variant="ghost" size="sm" className="h-8 text-[10px] font-bold px-3">Batal</Button>
                              </div>
                            ) : (
                              <>
                                <span className="text-[12px] font-bold">{displayName || "Belum diatur"}</span>
                                <button onClick={() => setIsEditing(true)} className="text-[11px] font-bold text-[#00AA5B] hover:underline transition-all">Ubah</button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-12 items-center gap-3">
                          <div className="col-span-3 text-[12px] text-muted-foreground">Tanggal lahir</div>
                          <div className="col-span-9">
                            <button className="text-[11px] font-bold text-[#00AA5B] hover:underline transition-all">Tambah tanggal lahir</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-12 items-center gap-3">
                          <div className="col-span-3 text-[12px] text-muted-foreground">Jenis kelamin</div>
                          <div className="col-span-9">
                            <button className="text-[11px] font-bold text-[#00AA5B] hover:underline transition-all">Tambah jenis kelamin</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-5 pt-5 border-t border-border/50">
                      <h3 className="text-[13px] font-bold text-[#2E3137]">Ubah kontak</h3>
                      <div className="space-y-4">
                        <div className="grid grid-cols-12 items-center gap-3">
                          <div className="col-span-3 text-[12px] text-muted-foreground">Email</div>
                          <div className="col-span-9 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-bold">{user.email}</span>
                              <div className="bg-[#D1FAE5] text-[#059669] text-[9px] font-bold px-1.5 py-0.5 rounded">Terverifikasi</div>
                            </div>
                          </div>
                        </div>
                        <div className="grid grid-cols-12 items-center gap-3">
                          <div className="col-span-3 text-[12px] text-muted-foreground">Nomor HP</div>
                          <div className="col-span-9 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] font-bold">6288976577650</span>
                              <div className="bg-[#D1FAE5] text-[#059669] text-[9px] font-bold px-1.5 py-0.5 rounded">Terverifikasi</div>
                            </div>
                            <button className="text-[11px] font-bold text-[#00AA5B] hover:underline transition-all">Ubah</button>
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
