"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Smartphone, 
  Zap, 
  Wifi, 
  Tv, 
  CreditCard, 
  MoreHorizontal,
  Wallet,
  TrendingUp,
  Activity
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"

export default function ClientDashboard() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const stats = [
    { title: "Wallet Balance", value: "IDR 12.450.000", icon: Wallet, color: "text-primary" },
    { title: "Today Revenue", value: "IDR 850.000", icon: TrendingUp, color: "text-green-600" },
    { title: "Active Keys", value: "4 Active", icon: Activity, color: "text-accent" },
  ]

  const services = [
    { name: "Pulsa", icon: Smartphone, color: "bg-blue-50 text-blue-600" },
    { name: "PLN Token", icon: Zap, color: "bg-yellow-50 text-yellow-600" },
    { name: "Data Package", icon: Wifi, color: "bg-purple-50 text-purple-600" },
    { name: "Streaming", icon: Tv, color: "bg-red-50 text-red-600" },
    { name: "E-Wallet", icon: CreditCard, color: "bg-green-50 text-green-600" },
    { name: "Others", icon: MoreHorizontal, color: "bg-gray-50 text-gray-600" },
  ]

  const transactions = [
    { id: "TX-9012", type: "PPOB - PLN", amount: -50000, status: "SUCCESS", date: "Today, 14:20" },
    { id: "TX-9011", type: "TOPUP - Bank", amount: 1000000, status: "SUCCESS", date: "Today, 10:15" },
    { id: "TX-9010", type: "Gateway - QRIS", amount: 25000, status: "PENDING", date: "Yesterday, 18:30" },
    { id: "TX-9009", type: "PPOB - Pulsa", amount: -10000, status: "FAILED", date: "Yesterday, 12:45" },
  ]

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="shadow-none border-border">
            <CardContent className="p-6 flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs md:text-sm text-muted-foreground font-medium">{stat.title}</p>
                <h3 className="point-number text-lg md:text-2xl font-bold">{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl bg-secondary/50 ${stat.color}`}>
                <stat.icon className="h-5 w-5 md:h-6 md:w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-4">
        <h2 className="font-headline text-lg md:text-xl font-bold px-1">Quick Services</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
          {services.map((service, i) => (
            <button key={i} className="flex flex-col items-center justify-center p-4 md:p-6 bg-background border border-border rounded-2xl hover:bg-secondary/30 transition-colors space-y-3 group">
              <div className={`p-3 md:p-4 rounded-2xl transition-transform group-hover:scale-110 ${service.color}`}>
                <service.icon className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              <span className="text-xs md:text-sm font-semibold">{service.name}</span>
            </button>
          ))}
        </div>
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 md:p-6 border-b border-border">
          <CardTitle className="text-lg md:text-xl font-headline font-bold">Recent Transactions</CardTitle>
          <Button variant="outline" size="sm" className="w-full md:w-auto text-xs md:text-sm">View Full History</Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto scrollbar-hide">
            <table className="w-full min-w-[600px] text-sm text-left">
              <thead>
                <tr className="bg-secondary/20 text-muted-foreground border-b border-border">
                  <th className="px-4 md:px-6 py-3 font-medium">Transaction ID</th>
                  <th className="px-4 md:px-6 py-3 font-medium">Type</th>
                  <th className="px-4 md:px-6 py-3 font-medium">Date</th>
                  <th className="px-4 md:px-6 py-3 font-medium">Status</th>
                  <th className="px-4 md:px-6 py-3 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {transactions.map((tx, i) => (
                  <tr key={i} className="hover:bg-secondary/10 transition-colors">
                    <td className="px-4 md:px-6 py-4 font-mono text-xs md:text-sm">{tx.id}</td>
                    <td className="px-4 md:px-6 py-4 font-medium">{tx.type}</td>
                    <td className="px-4 md:px-6 py-4 text-muted-foreground whitespace-nowrap">{tx.date}</td>
                    <td className="px-4 md:px-6 py-4">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold ${
                        tx.status === "SUCCESS" ? "bg-green-100 text-green-700" :
                        tx.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                        "bg-red-100 text-red-700"
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 md:px-6 py-4 text-right">
                      <span className={`point-number font-bold flex items-center justify-end gap-1 ${tx.amount > 0 ? 'text-green-600' : 'text-primary'}`}>
                        {tx.amount > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                        {isClient ? Math.abs(tx.amount).toLocaleString() : Math.abs(tx.amount)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  )
}
