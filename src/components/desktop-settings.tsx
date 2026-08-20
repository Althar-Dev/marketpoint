
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  User, 
  MapPinned, 
  CreditCard, 
  Building2, 
  Bell, 
  Sun, 
  Shield, 
  ChevronRight,
  Mail,
  Phone,
  Camera,
  Smartphone,
  CreditCard as CardIcon,
  Coins,
  Inbox,
  ShoppingBag,
  UserCircle,
  ChevronDown
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
import { cn } from "@/lib/utils";

interface DesktopProfileSettingsProps {
  user: any;
  wallet: any;
  displayName: string;
  setDisplayName: (val: string) => void;
  isEditing: boolean;
  setIsEditing: (val: boolean) => void;
  handleUpdateProfile: () => void;
  handleLogout: () => void;
  updating: boolean;
}

export function DesktopSettings({
  user,
  wallet,
  displayName,
  setDisplayName,
  isEditing,
  setIsEditing,
  handleUpdateProfile,
  handleLogout,
  updating
}: DesktopProfileSettingsProps) {
  
  return (
    <div className="bg-[#F8FAFC] font-body text-[#212121]">
      <div className="max-w-screen-xl mx-auto flex gap-6 p-8 items-start">
        
        {/* Sidebar Nav - Sticky to stay in view */}
        <aside className="w-[280px] shrink-0 space-y-4 sticky top-24">
          <Card className="border border-border/50 shadow-sm bg-white rounded-xl overflow-hidden p-4">
            <div className="flex items-center gap-3 mb-6">
              <Avatar className="h-10 w-10 ring-1 ring-border">
                <AvatarImage src={user.photoURL || undefined} />
                <AvatarFallback className="bg-[#00AA5B] text-white font-bold text-sm">
                  {displayName.substring(0, 1) || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="font-bold text-[13px] truncate">{displayName || "User MarketPoint"}</p>
              </div>
            </div>

            {/* Wallet Section */}
            <div className="space-y-4 pt-4 border-t border-border/50">
              <div className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#00AA5B] rounded-full flex items-center justify-center">
                    <Smartphone className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-[12px] font-medium text-muted-foreground">MarketPay</span>
                </div>
                <span className="text-[11px] font-bold text-[#00AA5B]">Aktifkan</span>
              </div>
              <div className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#F8FAFC] rounded-full flex items-center justify-center border border-border">
                    <CardIcon className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <span className="text-[12px] font-medium text-muted-foreground">Market Card</span>
                </div>
                <span className="text-[11px] font-bold text-[#00AA5B]">Daftar</span>
              </div>
              <div className="flex items-center justify-between group cursor-pointer">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#F8FAFC] rounded-full flex items-center justify-center border border-border">
                    <Coins className="w-3 h-3 text-muted-foreground" />
                  </div>
                  <span className="text-[12px] font-medium text-muted-foreground">Saldo</span>
                </div>
                <span className="text-[12px] font-bold">Rp{wallet?.balance?.toLocaleString('id-ID') || 0}</span>
              </div>
            </div>

            {/* Navigation Menus */}
            <div className="mt-8 pt-4 border-t border-border/50">
              <Accordion type="single" collapsible defaultValue="profil" className="w-full">
                <AccordionItem value="inbox" className="border-none">
                  <AccordionTrigger className="hover:no-underline py-2.5 text-[13px] font-bold focus:outline-none">
                    <div className="flex items-center gap-3">
                      <Inbox className="w-4 h-4 text-muted-foreground" />
                      Kotak Masuk
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-2 pl-7 space-y-1">
                    <p className="text-[12px] text-muted-foreground py-1 px-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">Chat</p>
                    <p className="text-[12px] text-muted-foreground py-1 px-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">Diskusi Produk</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="pembelian" className="border-none">
                  <AccordionTrigger className="hover:no-underline py-2.5 text-[13px] font-bold focus:outline-none">
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                      Pembelian
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-2 pl-7 space-y-1">
                    <p className="text-[12px] text-muted-foreground py-1 px-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">Menunggu Pembayaran</p>
                    <p className="text-[12px] text-muted-foreground py-1 px-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">Daftar Transaksi</p>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="profil" className="border-none">
                  <AccordionTrigger className="hover:no-underline py-2.5 text-[13px] font-bold focus:outline-none text-[#00AA5B]">
                    <div className="flex items-center gap-3">
                      <UserCircle className="w-4 h-4 text-[#00AA5B]" />
                      Profil Saya
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-2 pl-7 space-y-1">
                    <p className="text-[12px] text-[#00AA5B] font-bold py-1 px-2 rounded-lg bg-[#00AA5B]/5 cursor-pointer">Pengaturan Profil</p>
                    <p className="text-[12px] text-muted-foreground py-1 px-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">Wishlist</p>
                    <p className="text-[12px] text-muted-foreground py-1 px-2 rounded-lg hover:bg-muted cursor-pointer transition-colors">Ulasan</p>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="w-full justify-start gap-3 mt-8 text-destructive hover:text-destructive hover:bg-destructive/5 rounded-lg text-[12px] font-bold h-10 px-0 pl-1"
            >
              <Shield className="w-4 h-4" /> Keluar Akun
            </Button>
          </Card>
        </aside>

        {/* Main Content Area - height fit content */}
        <main className="flex-1 min-w-0">
          <Card className="border border-border/50 shadow-sm bg-white rounded-xl overflow-hidden h-fit">
            <div className="p-6 border-b border-border/50 flex items-center gap-3">
              <UserCircle className="w-5 h-5 text-muted-foreground" />
              <h1 className="text-lg font-bold tracking-tight">{displayName || "Profil"}</h1>
            </div>

            <Tabs defaultValue="biodata" className="w-full">
              <div className="px-6 border-b border-border/50 bg-white">
                <TabsList className="bg-transparent h-14 p-0 w-full justify-start gap-8 rounded-none border-none">
                  {[
                    { id: "biodata", label: "Biodata Diri" },
                    { id: "alamat", label: "Daftar Alamat" },
                    { id: "pembayaran", label: "Pembayaran" },
                    { id: "rekening", label: "Rekening Bank" },
                    { id: "notifikasi", label: "Notifikasi" },
                    { id: "tampilan", label: "Mode Tampilan" },
                    { id: "keamanan", label: "Keamanan" },
                  ].map((tab) => (
                    <TabsTrigger 
                      key={tab.id}
                      value={tab.id}
                      className="px-0 rounded-none h-full border-b-2 border-transparent data-[state=active]:border-[#00AA5B] data-[state=active]:text-[#00AA5B] data-[state=active]:bg-transparent font-bold text-[13px] text-muted-foreground transition-all"
                    >
                      {tab.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value="biodata" className="p-8 mt-0 h-fit">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
                  
                  {/* Left Column: Profile Pic */}
                  <div className="md:col-span-4 space-y-6">
                    <Card className="p-6 border border-border/50 shadow-none bg-white rounded-xl flex flex-col items-center gap-6">
                      <div className="relative group">
                        <Avatar className="h-48 w-48 ring-4 ring-[#F8FAFC] rounded-2xl overflow-hidden shadow-sm">
                          <AvatarImage src={user.photoURL || undefined} className="object-cover" />
                          <AvatarFallback className="bg-[#00AA5B] text-white text-5xl font-bold uppercase rounded-none">
                            {displayName.substring(0, 1) || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      <Button variant="outline" className="w-full h-10 font-bold text-[13px] rounded-lg border-border/60 hover:bg-muted/50">
                        Pilih Foto
                      </Button>
                      <p className="text-[11px] text-muted-foreground leading-relaxed text-center px-2">
                        Besar file: maksimum 10.000.000 bytes (10 Megabytes). Ekstensi file yang diperbolehkan: .JPG .JPEG .PNG
                      </p>
                    </Card>

                    <div className="space-y-3">
                      <Button variant="outline" className="w-full h-11 font-bold text-[13px] rounded-xl border-border/60 justify-center">
                        Buat Kata Sandi
                      </Button>
                      <Button variant="outline" className="w-full h-11 font-bold text-[13px] rounded-xl border-border/60 flex items-center gap-3 px-6 text-left group">
                        <Shield className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="flex-1">PIN MarketPoint</span>
                      </Button>
                    </div>
                  </div>

                  {/* Right Column: Information Forms */}
                  <div className="md:col-span-8 space-y-12">
                    <div className="space-y-6">
                      <h3 className="text-[14px] font-bold text-[#2E3137]">Ubah Biodata Diri</h3>
                      <div className="space-y-5">
                        <div className="grid grid-cols-12 items-center gap-4">
                          <div className="col-span-3 text-[13px] text-muted-foreground">Nama</div>
                          <div className="col-span-9 flex items-center justify-between">
                            {isEditing ? (
                              <div className="flex items-center gap-2 w-full">
                                <Input 
                                  value={displayName}
                                  onChange={(e) => setDisplayName(e.target.value)}
                                  className="h-9 text-[13px] font-medium border-[#00AA5B] ring-1 ring-[#00AA5B]/10 max-w-[200px]"
                                  autoFocus
                                />
                                <Button onClick={handleUpdateProfile} disabled={updating} size="sm" className="h-8 bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-[11px] font-bold">Simpan</Button>
                                <Button onClick={() => setIsEditing(false)} variant="ghost" size="sm" className="h-8 text-[11px] font-bold">Batal</Button>
                              </div>
                            ) : (
                              <>
                                <span className="text-[13px] font-bold">{displayName || "Belum diatur"}</span>
                                <button onClick={() => setIsEditing(true)} className="text-[13px] font-bold text-[#00AA5B] hover:underline">Ubah</button>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-12 items-center gap-4">
                          <div className="col-span-3 text-[13px] text-muted-foreground">Tanggal Lahir</div>
                          <div className="col-span-9">
                            <button className="text-[13px] font-bold text-[#00AA5B] hover:underline">Tambah Tanggal Lahir</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-12 items-center gap-4">
                          <div className="col-span-3 text-[13px] text-muted-foreground">Jenis Kelamin</div>
                          <div className="col-span-9">
                            <button className="text-[13px] font-bold text-[#00AA5B] hover:underline">Tambah Jenis Kelamin</button>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-6 pt-6 border-t border-border/50">
                      <h3 className="text-[14px] font-bold text-[#2E3137]">Ubah Kontak</h3>
                      <div className="space-y-5">
                        <div className="grid grid-cols-12 items-center gap-4">
                          <div className="col-span-3 text-[13px] text-muted-foreground">Email</div>
                          <div className="col-span-9 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-bold">{user.email}</span>
                              <div className="bg-[#D1FAE5] text-[#059669] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Terverifikasi</div>
                            </div>
                            <button className="text-[13px] font-bold text-[#00AA5B] hover:underline">Ubah</button>
                          </div>
                        </div>
                        <div className="grid grid-cols-12 items-center gap-4">
                          <div className="col-span-3 text-[13px] text-muted-foreground">Nomor HP</div>
                          <div className="col-span-9 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-[13px] font-bold">6288976577650</span>
                              <div className="bg-[#D1FAE5] text-[#059669] text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Terverifikasi</div>
                            </div>
                            <button className="text-[13px] font-bold text-[#00AA5B] hover:underline">Ubah</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
              
              {/* Other tabs content (placeholders) */}
              {["alamat", "pembayaran", "rekening", "notifikasi", "tampilan", "keamanan"].map(tabId => (
                <TabsContent key={tabId} value={tabId} className="p-8 mt-0 flex flex-col items-center justify-center min-h-[300px] text-center opacity-40">
                   <CardIcon className="w-12 h-12 mb-4" />
                   <h4 className="text-sm font-bold">Fitur Belum Tersedia</h4>
                   <p className="text-xs max-w-xs mt-2">Halaman {tabId} sedang dalam pengembangan teknis oleh tim MarketPoint.</p>
                </TabsContent>
              ))}
            </Tabs>
          </Card>
        </main>
      </div>
    </div>
  );
}
