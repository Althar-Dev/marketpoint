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
        <Sidebar className="border-r border-border bg-sidebar">
          <SidebarHeader className="h-20 flex items-center px-6">
            <Link href="/" className="flex items-center gap-2 group cursor-pointer">
              <div className="transition-transform group-hover:scale-110">
                <AppIcon size={44} />
              </div>
              <span className="font-headline text-2xl font-bold tracking-tight text-foreground">
                STS<span className="text-primary">Point</span>
              </span>
            </Link>
          </SidebarHeader>
          <SidebarContent className="px-4 py-6">
            <SidebarMenu>
              <SidebarMenuItem>
                <Link href="/client">
                  <SidebarMenuButton isActive tooltip="Dashboard" className="h-12 text-lg">
                    <LayoutDashboard className="h-5 w-5" />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="PPOB Services" className="h-12 text-lg">
                  <Smartphone className="h-5 w-5" />
                  <span>PPOB Services</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="Payment Gateway" className="h-12 text-lg">
                  <CreditCard className="h-5 w-5" />
                  <span>Merchant Hub</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="API Management" className="h-12 text-lg">
                  <Terminal className="h-5 w-5" />
                  <span>Open API</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton tooltip="History" className="h-12 text-lg">
                  <History className="h-5 w-5" />
                  <span>Transactions</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/">
                  <SidebarMenuButton tooltip="Back to Landing" className="h-12 text-lg">
                    <Home className="h-5 w-5" />
                    <span>Landing Page</span>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="p-4">
            <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-background">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">Merchant Admin</p>
                <p className="text-xs text-muted-foreground truncate">Verified Partner</p>
              </div>
              <SidebarMenuButton className="w-8 h-8 p-0 flex items-center justify-center">
                <LogOut className="h-4 w-4" />
              </SidebarMenuButton>
            </div>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col bg-background">
          <header className="h-20 flex items-center justify-between px-4 md:px-8 border-b border-border sticky top-0 z-40 bg-background/80 backdrop-blur-md">
            <div className="flex items-center gap-2 md:gap-4">
              <SidebarTrigger />
              <h1 className="font-headline text-sm md:text-xl font-medium text-muted-foreground whitespace-nowrap">Status: <span className="text-green-600 font-bold">Online</span></h1>
            </div>
            <div className="flex items-center gap-2 md:gap-4">
              <button className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 bg-accent rounded-full border-2 border-background" />
              </button>
              <div className="h-8 w-px bg-border hidden md:block" />
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/10 border border-accent/20">
                <Globe className="h-4 w-4 text-accent hidden sm:block" />
                <span className="point-number text-xs md:text-base font-bold text-accent whitespace-nowrap">IDR 12.450.000</span>
              </div>
            </div>
          </header>
          <main className="flex-1 p-4 md:p-8 overflow-y-auto">
            <div className="max-w-7xl mx-auto space-y-8 md:space-y-10">
              {children}
            </div>
          </main>
        </SidebarInset>
      </div>
      <Toaster />
    </SidebarProvider>
  )
}
