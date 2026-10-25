"use client";

import { useState, useMemo } from "react";
import {
  renderVerificationCodeEmailHtml,
  renderNewDeviceAlertEmailHtml,
  renderSecurityAlertEmailHtml,
} from "@/lib/auth-mailer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Smartphone,
  Monitor,
  Moon,
  Sun,
  Send,
  Loader2,
  CheckCircle2,
  Shield,
  KeyRound,
  Laptop,
  Lock,
  Phone,
  RefreshCw,
  ExternalLink,
  Mail,
  Copy,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

type TemplateType =
  | "otp_add_email"
  | "otp_change_password"
  | "new_device"
  | "password_changed"
  | "pin_changed"
  | "phone_changed";

export function EmailTemplatePreview() {
  const { toast } = useToast();

  // Template State
  const [template, setTemplate] = useState<TemplateType>("otp_add_email");
  const [deviceMode, setDeviceMode] = useState<"mobile" | "desktop">("mobile");
  const [previewBg, setPreviewBg] = useState<"light" | "dark">("dark");

  // Customizable Props
  const [email, setEmail] = useState("althar.dev@gmail.com");
  const [otpCode, setOtpCode] = useState("249826");
  const [displayName, setDisplayName] = useState("Althar");
  const [deviceName, setDeviceName] = useState("Chrome on Windows 11");
  const [browser, setBrowser] = useState("Chrome 128.0");
  const [os, setOs] = useState("Windows 11");
  const [location, setLocation] = useState("Jakarta, Indonesia");
  const [ipAddress, setIpAddress] = useState("103.145.22.84");
  const [newPhone, setNewPhone] = useState("0812-3456-7890");

  // Test Send State
  const [testEmailRecipient, setTestEmailRecipient] = useState(email);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  // Compute rendered HTML
  const renderedHtml = useMemo(() => {
    switch (template) {
      case "otp_add_email":
        return renderVerificationCodeEmailHtml({
          code: otpCode || "249826",
          email: email || "althar.dev@gmail.com",
          type: "add_email",
          expiresMinutes: 10,
        });

      case "otp_change_password":
        return renderVerificationCodeEmailHtml({
          code: otpCode || "249826",
          email: email || "althar.dev@gmail.com",
          type: "change_password",
          expiresMinutes: 10,
        });

      case "new_device":
        return renderNewDeviceAlertEmailHtml({
          email: email || "althar.dev@gmail.com",
          displayName: displayName || "Pengguna",
          deviceName: deviceName || "Chrome on Windows",
          browser: browser || "Chrome",
          os: os || "Windows",
          location: location || "Jakarta, Indonesia",
          ipAddress: ipAddress || "103.145.22.84",
          deviceType: "desktop",
        });

      case "password_changed":
        return renderSecurityAlertEmailHtml({
          email: email || "althar.dev@gmail.com",
          displayName: displayName || "Pengguna",
          eventType: "password_changed",
        });

      case "pin_changed":
        return renderSecurityAlertEmailHtml({
          email: email || "althar.dev@gmail.com",
          displayName: displayName || "Pengguna",
          eventType: "pin_changed",
        });

      case "phone_changed":
        return renderSecurityAlertEmailHtml({
          email: email || "althar.dev@gmail.com",
          displayName: displayName || "Pengguna",
          eventType: "phone_changed",
          newValue: newPhone || "0812-3456-7890",
        });

      default:
        return "";
    }
  }, [
    template,
    email,
    otpCode,
    displayName,
    deviceName,
    browser,
    os,
    location,
    ipAddress,
    newPhone,
  ]);

  const handleCopyHtml = () => {
    navigator.clipboard.writeText(renderedHtml);
    setCopiedHtml(true);
    setTimeout(() => setCopiedHtml(false), 2000);
    toast({
      title: "HTML Berhasil Disalin",
      description: "Kode HTML template email telah disalin ke clipboard.",
    });
  };

  const handleSendTestEmail = async () => {
    const targetEmail = testEmailRecipient.trim().toLowerCase();
    if (!targetEmail) {
      toast({
        variant: "destructive",
        title: "Alamat Email Diperlukan",
        description: "Masukkan alamat email penerima untuk mengirimkan tes.",
      });
      return;
    }

    setIsSendingTest(true);
    try {
      let endpoint = "/api/auth/send-verification-code";
      let payload: any = { email: targetEmail, type: "add_email" };

      if (template === "otp_change_password") {
        endpoint = "/api/auth/send-verification-code";
        payload = { email: targetEmail, type: "change_password" };
      } else if (template === "new_device") {
        endpoint = "/api/auth/send-new-device-alert";
        payload = {
          email: targetEmail,
          displayName,
          deviceName,
          browser,
          os,
          deviceType: "desktop",
          location,
          ipAddress,
        };
      } else if (
        template === "password_changed" ||
        template === "pin_changed" ||
        template === "phone_changed"
      ) {
        endpoint = "/api/auth/send-security-alert";
        payload = {
          email: targetEmail,
          displayName,
          eventType: template,
          newValue: template === "phone_changed" ? newPhone : undefined,
        };
      }

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal mengirimkan email tes.");
      }

      toast({
        title: "Email Tes Terkirim!",
        description: `Template berhasil dikirimkan ke ${targetEmail}. Silakan periksa inbox Anda.`,
      });
    } catch (err: any) {
      toast({
        variant: "destructive",
        title: "Gagal Mengirim",
        description: err.message || "Terjadi gangguan saat mengirimkan email tes.",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const templateList = [
    {
      id: "otp_add_email" as TemplateType,
      label: "OTP: Penambahan Email",
      category: "Verifikasi",
      icon: Mail,
      badge: "OTP",
    },
    {
      id: "otp_change_password" as TemplateType,
      label: "OTP: Ubah Kata Sandi",
      category: "Verifikasi",
      icon: KeyRound,
      badge: "OTP",
    },
    {
      id: "new_device" as TemplateType,
      label: "Notifikasi Login Perangkat Baru",
      category: "Keamanan",
      icon: Laptop,
      badge: "Alert",
    },
    {
      id: "password_changed" as TemplateType,
      label: "Kata Sandi Berhasil Diperbarui",
      category: "Keamanan",
      icon: Lock,
      badge: "Keamanan",
    },
    {
      id: "pin_changed" as TemplateType,
      label: "PIN Transaksi Berhasil Diatur",
      category: "Keamanan",
      icon: Shield,
      badge: "Keamanan",
    },
    {
      id: "phone_changed" as TemplateType,
      label: "Nomor HP Berhasil Diperbarui",
      category: "Keamanan",
      icon: Phone,
      badge: "Keamanan",
    },
  ];

  return (
    <div className="flex flex-col h-full bg-slate-50 font-body">
      {/* Top Header Bar */}
      <div className="h-14 px-4 sm:px-6 bg-white border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#00AA5B]/10 text-[#00AA5B] flex items-center justify-center font-bold">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              Preview Template Email Resmi
              <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 text-[10px] font-bold py-0 h-5">
                Live Studio
              </Badge>
            </h1>
            <p className="text-[11px] text-muted-foreground hidden sm:block">
              Simulasi tampilan responsif email autentikasi & keamanan MarketPointID
            </p>
          </div>
        </div>

        {/* Viewport Toggles & Actions */}
        <div className="flex items-center gap-2">
          {/* Device Switcher */}
          <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setDeviceMode("mobile")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                deviceMode === "mobile"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Mobile (375px)</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode("desktop")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all",
                deviceMode === "desktop"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Desktop</span>
            </button>
          </div>

          {/* Theme Canvas Switcher */}
          <div className="inline-flex items-center p-0.5 rounded-xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => setPreviewBg("dark")}
              title="Latar Belakang Gelap (Simulasi Gmail Dark Mode)"
              className={cn(
                "p-1.5 rounded-lg text-xs font-bold transition-all",
                previewBg === "dark"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Moon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setPreviewBg("light")}
              title="Latar Belakang Terang"
              className={cn(
                "p-1.5 rounded-lg text-xs font-bold transition-all",
                previewBg === "light"
                  ? "bg-white text-slate-900 shadow-2xs"
                  : "text-slate-500 hover:text-slate-900"
              )}
            >
              <Sun className="w-3.5 h-3.5" />
            </button>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyHtml}
            className="h-8 text-xs font-bold gap-1.5 hidden md:inline-flex"
          >
            {copiedHtml ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copiedHtml ? "Tersalin" : "Salin HTML"}
          </Button>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Template Selector & Customizer Panel */}
        <div className="w-full lg:w-80 xl:w-96 bg-white border-b lg:border-b-0 lg:border-r border-border shrink-0 flex flex-col overflow-y-auto">
          {/* Template Selection */}
          <div className="p-4 border-b border-border/80">
            <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground block mb-2.5">
              Pilih Template Email
            </label>
            <div className="space-y-1.5">
              {templateList.map((item) => {
                const Icon = item.icon;
                const isActive = template === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTemplate(item.id)}
                    className={cn(
                      "w-full text-left p-2.5 rounded-xl border flex items-center justify-between text-xs transition-all active:scale-[0.99]",
                      isActive
                        ? "bg-[#00AA5B]/5 border-[#00AA5B] text-slate-900 shadow-2xs"
                        : "bg-white border-border/70 hover:bg-slate-50 text-slate-700"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <div
                        className={cn(
                          "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                          isActive
                            ? "bg-[#00AA5B] text-white"
                            : "bg-slate-100 text-slate-600"
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="font-bold truncate">{item.label}</span>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[9px] px-1.5 py-0 font-bold shrink-0",
                        isActive
                          ? "border-[#00AA5B]/40 text-[#00AA5B]"
                          : "border-slate-200 text-slate-500"
                      )}
                    >
                      {item.badge}
                    </Badge>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Parameter Editor */}
          <div className="p-4 space-y-4 border-b border-border/80 flex-1">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                Uji Nilai Variabel
              </label>
              <span className="text-[10px] text-[#00AA5B] font-bold">Real-time update</span>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label htmlFor="preview-email" className="text-[11px] font-bold text-slate-700">
                  Email Akun
                </Label>
                <Input
                  id="preview-email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setTestEmailRecipient(e.target.value);
                  }}
                  className="h-8.5 text-xs rounded-xl"
                  placeholder="contoh@gmail.com"
                />
              </div>

              {(template === "otp_add_email" || template === "otp_change_password") && (
                <div className="space-y-1">
                  <Label htmlFor="preview-otp" className="text-[11px] font-bold text-slate-700">
                    Kode OTP (6 Digit)
                  </Label>
                  <Input
                    id="preview-otp"
                    value={otpCode}
                    maxLength={6}
                    onChange={(e) => setOtpCode(e.target.value)}
                    className="h-8.5 text-xs font-mono font-bold tracking-widest text-[#00AA5B] rounded-xl"
                    placeholder="249826"
                  />
                </div>
              )}

              {template !== "otp_add_email" && template !== "otp_change_password" && (
                <div className="space-y-1">
                  <Label htmlFor="preview-name" className="text-[11px] font-bold text-slate-700">
                    Nama Penerima
                  </Label>
                  <Input
                    id="preview-name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-8.5 text-xs rounded-xl"
                    placeholder="Althar"
                  />
                </div>
              )}

              {template === "new_device" && (
                <>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-700">Nama Perangkat</Label>
                    <Input
                      value={deviceName}
                      onChange={(e) => setDeviceName(e.target.value)}
                      className="h-8.5 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-700">Perkiraan Lokasi</Label>
                    <Input
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="h-8.5 text-xs rounded-xl"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[11px] font-bold text-slate-700">Alamat IP</Label>
                    <Input
                      value={ipAddress}
                      onChange={(e) => setIpAddress(e.target.value)}
                      className="h-8.5 text-xs font-mono rounded-xl"
                    />
                  </div>
                </>
              )}

              {template === "phone_changed" && (
                <div className="space-y-1">
                  <Label className="text-[11px] font-bold text-slate-700">Nomor HP Baru</Label>
                  <Input
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="h-8.5 text-xs rounded-xl"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Test Send Card */}
          <div className="p-4 bg-slate-50/80 space-y-2.5">
            <div className="flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5 text-[#00AA5B]" />
              <label className="text-[11px] font-bold text-slate-900">
                Kirim Email Tes ke Kotak Masuk
              </label>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={testEmailRecipient}
                onChange={(e) => setTestEmailRecipient(e.target.value)}
                placeholder="email-anda@gmail.com"
                className="h-8.5 text-xs rounded-xl bg-white"
              />
              <Button
                type="button"
                size="sm"
                disabled={isSendingTest}
                onClick={handleSendTestEmail}
                className="h-8.5 rounded-xl bg-[#00AA5B] hover:bg-[#00AA5B]/90 text-white font-bold text-xs shrink-0"
              >
                {isSendingTest ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  "Kirim"
                )}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Kirim langsung ke Gmail untuk menguji tampilan nyata di aplikasi Android/iOS.
            </p>
          </div>
        </div>

        {/* Right Side: Visual Canvas */}
        <div
          className={cn(
            "flex-1 p-4 sm:p-8 flex items-center justify-center overflow-auto transition-colors duration-200",
            previewBg === "dark" ? "bg-[#111827]" : "bg-[#e2e8f0]"
          )}
        >
          {deviceMode === "mobile" ? (
            /* Mobile Smartphone Simulator Frame (375px wide) */
            <div className="w-[375px] max-w-full bg-white rounded-[38px] shadow-2xl border-[8px] border-slate-900 overflow-hidden flex flex-col h-[740px] shrink-0 relative animate-in zoom-in-95 duration-200">
              {/* Phone Speaker & Camera Notch */}
              <div className="h-6 bg-slate-900 w-full flex items-center justify-center shrink-0">
                <div className="w-16 h-3 bg-slate-800 rounded-full" />
              </div>

              {/* Fake Email App Header */}
              <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-700 shrink-0">
                <span className="truncate">Kotak Masuk • MarketPointID</span>
                <span className="text-[10px] text-muted-foreground">10:35</span>
              </div>

              {/* Email Content Frame */}
              <div className="flex-1 w-full bg-white overflow-y-auto">
                <iframe
                  title="Mobile Email Preview"
                  srcDoc={renderedHtml}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin"
                />
              </div>

              {/* Phone Bottom Home Bar */}
              <div className="h-4 bg-white w-full flex items-center justify-center shrink-0">
                <div className="w-28 h-1 bg-slate-300 rounded-full" />
              </div>
            </div>
          ) : (
            /* Desktop View Frame */
            <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[740px] animate-in zoom-in-95 duration-200">
              {/* Browser/Client Header Bar */}
              <div className="h-9 px-4 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs text-slate-600 shrink-0">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span className="text-[11px] font-mono text-slate-500 ml-2">MarketPointID Email Previewer</span>
                </div>
                <Badge variant="outline" className="text-[9px] font-mono">
                  Width: 580px
                </Badge>
              </div>

              {/* Email Content Frame */}
              <div className="flex-1 w-full bg-white overflow-y-auto">
                <iframe
                  title="Desktop Email Preview"
                  srcDoc={renderedHtml}
                  className="w-full h-full border-0"
                  sandbox="allow-same-origin"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
