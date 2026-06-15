import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Zap, ShieldCheck, Terminal, Globe, ArrowRight } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="px-4 lg:px-6 h-20 flex items-center border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50">
        <Link className="flex items-center justify-center gap-2 group" href="#">
          <div className="p-1.5 rounded-lg bg-primary group-hover:scale-110 transition-transform">
            <Zap className="h-5 w-5 text-primary-foreground fill-primary-foreground" />
          </div>
          <span className="font-headline text-xl font-bold tracking-tight">STS<span className="text-primary">Point</span></span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6 items-center">
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#features">Features</Link>
          <Link className="text-sm font-medium hover:text-primary transition-colors" href="#api">API Docs</Link>
          <Link href="/client">
            <Button variant="outline" className="border-primary/20 hover:bg-primary/10 text-primary">
              Login to Console
            </Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-24 md:py-32 lg:py-48 flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent -z-10" />
          <div className="container px-4 md:px-6 text-center">
            <div className="space-y-6">
              <h1 className="text-4xl font-headline font-bold tracking-tighter sm:text-5xl md:text-6xl lg:text-7xl text-foreground">
                The Next Gen <span className="text-primary">PPOB</span> & <br/> Payment Gateway <span className="text-accent">Open API</span>
              </h1>
              <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl/relaxed lg:text-2xl/relaxed">
                Empower your application with lightning-fast digital transactions and seamless payment integration via our professional-grade Open API.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Link href="/client">
                  <Button size="lg" className="h-14 px-8 text-lg font-bold gap-2 bg-primary hover:bg-primary/90">
                    Start Integration <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-border">
                  Read API Documentation
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section id="features" className="w-full py-24 bg-secondary/50 border-y border-border flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="grid gap-12 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                  <Terminal className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-headline font-bold">Developer First</h3>
                <p className="text-muted-foreground">Comprehensive SDKs and RESTful API designed for modern engineering teams.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 rounded-2xl bg-accent/10 border border-accent/20">
                  <Zap className="h-8 w-8 text-accent" />
                </div>
                <h3 className="text-2xl font-headline font-bold">Real-time PPOB</h3>
                <p className="text-muted-foreground">Instant processing for Pulsa, PLN, and 50+ other digital services nationwide.</p>
              </div>
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
                  <ShieldCheck className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-2xl font-headline font-bold">Secure Gateway</h3>
                <p className="text-muted-foreground">Bank-grade security with auto-reconciliation and fraud prevention systems.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="cta" className="w-full py-24 flex justify-center">
          <div className="container px-4 md:px-6">
            <div className="glass-card p-12 rounded-3xl flex flex-col items-center text-center space-y-6">
              <h2 className="text-3xl font-headline font-bold tracking-tight sm:text-4xl">Ready to scale your transactions?</h2>
              <p className="max-w-[600px] text-muted-foreground">Join 1000+ developers using STSPoint for their daily transactional needs.</p>
              <Link href="/client">
                <Button size="lg" className="h-12 px-10">Create Free Account</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="py-12 border-t border-border bg-secondary/30 flex justify-center">
        <div className="container px-4 md:px-6 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <span className="font-headline font-bold">STSPoint</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2024 STSPoint. All rights reserved.</p>
          <div className="flex gap-4">
            <Link className="text-sm hover:text-primary" href="#">Privacy</Link>
            <Link className="text-sm hover:text-primary" href="#">Terms</Link>
            <Link className="text-sm hover:text-primary" href="#">Status</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
