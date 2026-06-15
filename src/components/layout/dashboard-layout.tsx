
"use client"

import * as React from "react"
import Link from "next/link"
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
  SidebarInset,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent
} from "@/components/ui/sidebar"
import { 
  LayoutDashboard, 
  History, 
  Smartphone, 
  LogOut, 
  User,
  Bell,
  Terminal,
  CreditCard,
  Globe,
  Settings
} from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { AppIcon } from "@/components/icon"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background font-body">
        <Sidebar collapsible="icon" className="border-r border-border bg-sidebar shadow-none">
          <SidebarHeader className="h-16 md:h-20 flex items-center justify-center px-4 md:px-6 border-b border-border">
            <Link href="/" className="flex items-center justify-center gap-2 group cursor-pointer w-full">
              <AppIcon size={32} className="shrink-0" />
              <span className="font-headline text-lg md:text-xl font-bold tracking-tight text-foreground group-data-[collapsible=icon]:hidden whitespace-nowrap">
                STS<span className="text-primary">Point</span>
              </span>
            </Link>
          </SidebarHeader>
          
          <SidebarContent className="px-3 py-4 space-y-4">
            <SidebarGroup>
              <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 group-data-[collapsible=icon]:hidden">Overview</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <Link href="/client" className="w-full">
                      <SidebarMenuButton isActive tooltip="Dashboard" className="h-10 text-sm">
                        <LayoutDashboard className="h-4 w-4" />
                        <span className="font-medium">Dashboard</span>
                      </SidebarMenuButton>
                    </Link>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Transaction History" className="h-10 text-sm">
                      <History className="h-4 w-4" />
                      <span className="font-medium">History</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 group-data-[collapsible=icon]:hidden">Merchant Services</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="PPOB Services" className="h-10 text-sm">
                      <Smartphone className="h-4 w-4" />
                      <span className="font-medium">PPOB</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="Payment Gateway" className="h-10 text-sm">
                      <CreditCard className="h-4 w-4" />
                      <span className="font-medium">Gateway</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarGroup>
              <SidebarGroupLabel className="px-4 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 group-data-[collapsible=icon]:hidden">Developer Tools</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="API Management" className="h-10 text-sm">
                      <Terminal className="h-4 w-4" />
                      <span className="font-medium">API Keys</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton tooltip="API Documentation" className="h-10 text-sm">
                      <Globe className="h-4 w-4" />
                      <span className="font-medium">Docs</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-border">
            <SidebarMenu>
              <SidebarMenuItem>
                <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background shadow-none transition-colors hover:bg-secondary/30 group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:border-none group-data-[collapsible=icon]:bg-transparent">
                  <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-xs font-bold truncate">Merchant Admin</p>
                    <p className="text-[10px] text-muted-foreground truncate">Professional Plan</p>
                  </div>
                  <button className="text-muted-foreground hover:text-primary transition-colors group-data-[collapsible=icon]:hidden">
                    <Settings className="h-4 w-4" />
                  </button>
                </div>
              </SidebarMenuItem>
              <SidebarMenuItem className="mt-2">
                <SidebarMenuButton tooltip="Sign Out" className="h-9 text-xs text-muted-foreground hover:text-destructive">
                  <LogOut className="h-4 w-4" />
                  <span className="group-data-[collapsible=icon]:hidden">Sign Out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col bg-background">
          <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-6 border-b border-border sticky top-0 z-40 bg-background/95 backdrop-blur-sm shadow-none">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9" />
              <div className="h-4 w-px bg-border hidden sm:block" />
              <div className="hidden sm:flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-xs font-bold text-muted-foreground">System Status: <span className="text-green-600">Active</span></span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 md:gap-4">
              <button className="relative p-2 rounded-xl hover:bg-secondary transition-all active:scale-95 group">
                <Bell className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-accent rounded-full border-2 border-background" />
              </button>
              
              <div className="flex items-center gap-2 pl-2 pr-4 py-1.5 rounded-xl bg-accent/10 border border-accent/20">
                <div className="h-7 w-7 rounded-lg bg-accent/20 flex items-center justify-center shrink-0">
                  <Globe className="h-4 w-4 text-accent" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-accent/70 font-bold uppercase leading-none mb-0.5">Balance</span>
                  <span className="point-number text-sm md:text-base font-bold text-accent whitespace-nowrap leading-none">IDR 12.450.000</span>
                </div>
              </div>
            </div>
          </header>
          
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  )
}
