'use client';

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ShieldCheck, Terminal, Globe, ArrowRight } from "lucide-react"
import { AppIcon } from "@/components/icon"

export default function LandingPage() {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header 
        className={`px-4 md:px-6 h-20 flex items-center fixed top-0 w-full z-50 transition-all duration-300 ${
          isScrolled 
            ? "bg-background/80 backdrop-blur-md border-b border-border shadow-sm" 
            : "bg-transparent border-transparent"
        }`}
      >
        <Link className="flex items-center justify-center gap-2 group" href="#">
          <div className="transition-transform group-hover:scale-110">
            <AppIcon size={40} />
          </div>
          <span className="font-headline text-lg md:text-xl font-bold tracking-tight">STS<span className="text-primary">Point</span></span>
        </Link>
        <nav className="ml-auto flex gap-3 sm:gap-6 items-center">
          <Link className="hidden sm:block text-sm font-medium hover:text-primary transition-colors" href="#features">Features</Link>
          <Link className="hidden sm:block text-sm font-medium hover:text-primary transition-colors" href="#api">API Docs</Link>
          <Link href="/client">
            <Button variant="outline" size="sm" className="md:size-default border-primary/20 hover:bg-primary/10 text-primary">
              Console
            </Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-16 md:py-24 lg:py-32 xl:py-48 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent -z-10" />
          <div className="container px-4 md:px-6 text-center">
            <div className="space-y-6">
              <h1 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-foreground">
                The Next Gen <span className="text-primary">PPOB</span> & <br className="hidden sm:block" /> Payment Gateway <span className="text-accent">Open API</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground text-base md:text-xl/relaxed lg:text-2xl/relaxed">
                Empower your application with lightning-fast digital transactions and seamless payment integration via our professional-grade Open API.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
                <Link href="/client" className="w-full sm:w-auto">
                  <Button size="lg" className="w-full h-14 px-8 text-lg font-bold gap-2 bg-primary hover:bg-primary/90">
                    Start Integration <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="w-full sm:w-auto h-14 px-8 text-lg border-border">
                  API Documentation
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-20 md:py-24 bg-secondary/50 border-y border-border flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="grid gap-8 md:gap-12 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                  <Terminal className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl md:text-2xl font-headline font-bold">Developer First</h3>
                <p className="text-muted-foreground text-sm md:text-base">Comprehensive SDKs and RESTful API designed for modern engineering teams.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20">
                  <Globe className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-xl md:text-2xl font-headline font-bold">Real-time PPOB</h3>
                <p className="text-muted-foreground text-sm md:text-base">Instant processing for Pulsa, PLN, and 50+ other digital services nationwide.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl md:text-2xl font-headline font-bold">Secure Gateway</h3>
                <p className="text-muted-foreground text-sm md:text-base">Bank-grade security with auto-reconciliation and fraud prevention systems.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="cta" className="w-full py-20 md:py-24 flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="glass-card p-8 md:p-12 rounded-3xl flex flex-col items-center text-center space-y-6">
              <h2 className="text-2xl font-headline font-bold tracking-tight sm:text-3xl md:text-4xl">Ready to scale your transactions?</h2>
              <p className="max-w-[600px] text-sm md:text-base text-muted-foreground">Join 1000+ developers using STSPoint for their daily transactional needs.</p>
              <Link href="/client" className="w-full sm:w-auto">
                <Button size="lg" className="w-full h-12 px-10">Create Free Account</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="py-10 border-t border-border bg-secondary/30 flex justify-center">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <AppIcon size={24} />
            <span className="font-headline font-bold">STSPoint</span>
          </div>
          <p className="text-xs md:text-sm text-muted-foreground">© 2024 STSPoint. All rights reserved.</p>
          <div className="flex gap-4">
            <Link className="text-xs md:text-sm hover:text-primary" href="#">Privacy</Link>
            <Link className="text-xs md:text-sm hover:text-primary" href="#">Terms</Link>
            <Link className="text-xs md:text-sm hover:text-primary" href="#">Status</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
