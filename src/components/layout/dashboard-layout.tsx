
"use client"

import * as React from "react"
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
  SidebarProvider,
  SidebarTrigger,
  SidebarInset
} from "@/components/ui/sidebar"
import { 
  LayoutDashboard, 
  History, 
  Gift, 
  Settings, 
  LogOut, 
  Zap,
  User,
  Bell
} from "lucide-react"
import { Toaster } from "@/components/ui/toaster"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r border-white/5">
          <SidebarHeader className="h-20 flex items-center px-6">
            <div className="flex items-center gap-2 group cursor-pointer">
              <div className="p-2 rounded-xl bg-primary shadow-[0_0_20px_rgba(71,137,244,0.4)] transition-transform group-hover:scale-110">
                <Zap className="h-6 w-6 text-white fill-white" />
              </div>
              <span className="font-headline text-2xl font-bold tracking-tight text-foreground">
                STS<span className="text-primary">Point</span>
              </span>
            </div>
          </SidebarHeader>
          <SidebarContent className="px-4 py-6">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton isActive tooltip="Dashboard" className="h-12 text-lg">
                  <LayoutDashboard className="h-5 w-5" />
                  <span>Dashboard</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="History" className="h-12 text-lg">
                  <History className="h-5 w-5" />
                  <span>Ledger</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Perks" className="h-12 text-lg">
                  <Gift className="h-5 w-5" />
                  <span>Perks</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Settings" className="h-12 text-lg">
                  <Settings className="h-5 w-5" />
                  <span>Preferences</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <div className="flex items-center gap-3 p-3 rounded-xl glass-card">
              <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">Alexander Sterling</p>
                <p className="text-xs text-muted-foreground truncate">Elite Member</p>
              </div>
              <SidebarMenuButton className="w-8 h-8 p-0 flex items-center justify-center">
                <LogOut className="h-4 w-4" />
              </SidebarMenuButton>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col bg-background/50 backdrop-blur-sm">
          <header className="h-20 flex items-center justify-between px-8 border-b border-white/5 sticky top-0 z-40 bg-background/80 backdrop-blur-md">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="font-headline text-xl font-medium text-muted-foreground">Main Overview</h1>
            </div>
            <div className="flex items-center gap-4">
              <button className="relative p-2 rounded-lg hover:bg-white/5 transition-colors">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-accent rounded-full border-2 border-background" />
              </button>
              <div className="h-8 w-px bg-white/10" />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
                <Zap className="h-4 w-4 text-accent fill-accent" />
                <span className="point-number font-bold text-accent">2,850 Pts</span>
              </div>
            </div>
          </header>
          <main className="flex-1 p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-10">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  )
}
