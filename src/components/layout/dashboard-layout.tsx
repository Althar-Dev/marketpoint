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
  SidebarInset
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
  Home
} from "lucide-react"
import { Toaster } from "@/components/ui/toaster"
import { AppIcon } from "@/components/icon"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <Sidebar className="border-r border-border bg-sidebar shadow-none">
          <SidebarHeader className="h-16 md:h-20 flex items-center px-4 md:px-6">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer">
              <AppIcon size={36} />
              <span className="font-headline text-xl md:text-2xl font-bold tracking-tight text-foreground">
                STS<span className="text-primary">Point</span>
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="px-2 md:px-4 py-4">
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/client">
                  <SidebarMenuButton isActive tooltip="Dashboard" className="h-10 md:h-12 text-base md:text-lg">
                    <LayoutDashboard className="h-5 w-5" />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="PPOB Services" className="h-10 md:h-12 text-base md:text-lg">
                  <Smartphone className="h-5 w-5" />
                  <span>PPOB Services</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Payment Gateway" className="h-10 md:h-12 text-base md:text-lg">
                  <CreditCard className="h-5 w-5" />
                  <span>Merchant Hub</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="API Management" className="h-10 md:h-12 text-base md:text-lg">
                  <Terminal className="h-5 w-5" />
                  <span>Open API</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="History" className="h-10 md:h-12 text-base md:text-lg">
                  <History className="h-5 w-5" />
                  <span>Transactions</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t border-border">
            <div className="flex items-center gap-3 p-2 rounded-lg border border-border bg-background shadow-none">
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">Merchant Admin</p>
                <p className="text-[10px] text-muted-foreground truncate">Verified</p>
              </div>
              <SidebarMenuButton className="w-8 h-8 p-0 flex items-center justify-center shrink-0">
                <LogOut className="h-4 w-4" />
              </SidebarMenuButton>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col bg-background">
          <header className="h-16 md:h-20 flex items-center justify-between px-4 md:px-8 border-b border-border sticky top-0 z-40 bg-background/95 backdrop-blur-sm shadow-none">
            <div className="flex items-center gap-2 md:gap-4">
              <SidebarTrigger />
              <div className="h-6 w-px bg-border hidden sm:block" />
              <h1 className="font-headline text-sm md:text-base font-medium text-muted-foreground whitespace-nowrap hidden sm:block">Status: <span className="text-green-600 font-bold">Online</span></h1>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-accent rounded-full border-2 border-background" />
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
                <Globe className="h-4 w-4 text-accent" />
                <span className="point-number text-sm md:text-base font-bold text-accent whitespace-nowrap">IDR 12.450.000</span>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6 md:space-y-8">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  )
}
