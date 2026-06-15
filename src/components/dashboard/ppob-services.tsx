"use client"

import { Card, CardHeader, CardTitle } from "@/components/ui/card"
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
    <div className="space-y-4 md:space-y-6">
      <h2 className="font-headline text-xl md:text-2xl font-bold px-1">PPOB Services</h2>
      <div className="grid gap-3 sm:gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-6">
        {services.map((service) => (
          <Card key={service.id} className="shadow-none border border-border cursor-pointer group hover:border-primary/50 transition-all hover:scale-[1.02] bg-white">
            <CardHeader className="flex flex-col items-center gap-2 p-4 text-center">
              <div className={`p-3 rounded-2xl bg-secondary/50 ${service.color} transition-transform group-hover:scale-110`}>
                <service.icon className="h-5 w-5 md:h-6 md:w-6" />
              </div>
              <div className="space-y-1">
                <CardTitle className="text-xs md:text-sm font-bold truncate">{service.name}</CardTitle>
                <p className="text-[10px] text-muted-foreground hidden sm:block">{service.desc}</p>
              </div>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  )
}
