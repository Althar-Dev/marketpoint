
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Smartphone, Zap, CreditCard, Wifi, Tv, Droplets } from "lucide-react"

const services = [
  { id: "pulsa", name: "Pulsa & Data", icon: Smartphone, color: "text-blue-500", desc: "Top up all operators" },
  { id: "pln", name: "Listrik PLN", icon: Zap, color: "text-yellow-500", desc: "Token & Postpaid" },
  { id: "ewallet", name: "E-Wallet", icon: CreditCard, color: "text-purple-500", desc: "Gopay, OVO, Dana" },
  { id: "internet", name: "Internet", icon: Wifi, color: "text-green-500", desc: "Indihome, Biznet" },
  { id: "pdam", name: "PDAM", icon: Droplets, color: "text-cyan-500", desc: "Water bills" },
  { id: "tv", name: "TV Cable", icon: Tv, color: "text-red-500", desc: "Subscription TV" },
]

export function PpobServices() {
  return (
    <div className="space-y-6">
      <h2 className="font-headline text-2xl font-bold">PPOB Services</h2>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id} className="glass-card cursor-pointer group hover:border-primary/50 transition-all hover:scale-[1.02]">
            <CardHeader className="flex flex-row items-center gap-4">
              <div className={`p-3 rounded-xl bg-white/5 ${service.color}`}>
                <service.icon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-lg">{service.name}</CardTitle>
                <p className="text-xs text-muted-foreground">{service.desc}</p>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
