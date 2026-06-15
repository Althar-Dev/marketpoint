"use client"

import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { 
  ArrowUpRight, 
  ArrowDownRight, 
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
    { title: "Wallet Balance", value: 12450000, prefix: "IDR ", icon: Wallet, color: "text-primary" },
    { title: "Today Revenue", value: 850000, prefix: "IDR ", icon: TrendingUp, color: "text-green-600" },
    { title: "Active Keys", value: 4, suffix: " Active", icon: Activity, color: "text-accent" },
  ]

  const transactions = [
    { id: "TX-9012", type: "PPOB - PLN", amount: -50000, status: "SUCCESS", date: "Today, 14:20" },
    { id: "TX-9011", type: "TOPUP - Bank", amount: 1000000, status: "SUCCESS", date: "Today, 10:15" },
    { id: "TX-9010", type: "Gateway - QRIS", amount: 25000, status: "PENDING", date: "Yesterday, 18:30" },
    { id: "TX-9009", type: "PPOB - Pulsa", amount: -10000, status: "FAILED", date: "Yesterday, 12:45" },
  ]

  const formatShort = (val: number) => {
    if (val >= 1000000) {
      const formatted = (val / 1000000).toFixed(val % 1000000 === 0 ? 0 : 1).replace('.', ',');
      return `${formatted} JT`;
    }
    if (val >= 1000) {
      const formatted = (val / 1000).toFixed(val % 1000 === 0 ? 0 : 1).replace('.', ',');
      return `${formatted} RB`;
    }
    return val.toString();
  }

  const formatFull = (val: number) => {
    return val.toLocaleString('id-ID');
  }

  return (
    <DashboardLayout>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6">
        {stats.map((stat, i) => (
          <Card key={i} className="shadow-none border-border overflow-hidden">
            <CardContent className="p-4 md:p-6 flex items-center justify-between gap-2">
              <div className="space-y-1 overflow-hidden">
                <p className="text-[10px] md:text-sm text-muted-foreground font-medium truncate">{stat.title}</p>
                <div className="flex items-baseline gap-1">
                  {stat.prefix && <span className="text-[10px] md:text-xs font-bold text-muted-foreground">{stat.prefix}</span>}
                  <h3 className="point-number text-sm md:text-2xl font-bold whitespace-nowrap">
                    {isClient ? (
                      <>
                        <span className="hidden lg:inline">{formatFull(stat.value)}</span>
                        <span className="inline lg:hidden">{formatShort(stat.value)}</span>
                      </>
                    ) : (
                      '---'
                    )}
                  </h3>
                  {stat.suffix && <span className="text-[10px] md:text-xs font-bold text-muted-foreground">{stat.suffix}</span>}
                </div>
              </div>
              <div className={`p-2 md:p-3 rounded-xl bg-secondary/50 shrink-0 ${stat.color}`}>
                <stat.icon className="h-4 w-4 md:h-6 md:w-6" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="shadow-none border-border">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 md:p-6 border-b border-border">
          <CardTitle className="text-lg md:text-xl font-headline font-bold">Recent Transactions</CardTitle>
          <Button variant="outline" size="sm" className="w-full md:w-auto text-xs md:text-sm h-9 md:h-8">View Full History</Button>
        </CardHeader>
        <CardContent className="p-0">
           <div className="block w-full max-w-[calc(100vw-32px)] md:max-w-full overflow-x-auto">
              <table className="w-full min-w-[600px] text-sm text-left table-fixed"> 
                <thead>
                  <tr className="bg-secondary/20 text-muted-foreground border-b border-border">
                    <th className="w-[120px] px-4 md:px-6 py-3 font-medium whitespace-nowrap">Transaction ID</th>
                    <th className="w-[150px] px-4 md:px-6 py-3 font-medium whitespace-nowrap">Type</th>
                    <th className="w-[120px] px-4 md:px-6 py-3 font-medium whitespace-nowrap">Date</th>
                    <th className="w-[100px] px-4 md:px-6 py-3 font-medium whitespace-nowrap">Status</th>
                    <th className="w-[110px] px-4 md:px-6 py-3 font-medium text-right whitespace-nowrap">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {transactions.map((tx, i) => (
                    <tr key={i} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-4 md:px-6 py-4 font-mono text-xs md:text-sm whitespace-nowrap">{tx.id}</td>
                      <td className="px-4 md:px-6 py-4 font-medium whitespace-nowrap">{tx.type}</td>
                      <td className="px-4 md:px-6 py-4 text-muted-foreground whitespace-nowrap">{tx.date}</td>
                      <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] md:text-xs font-bold ${
                          tx.status === "SUCCESS" ? "bg-green-100 text-green-700" :
                          tx.status === "PENDING" ? "bg-yellow-100 text-yellow-700" :
                          "bg-red-100 text-red-700"
                        }`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-4 md:px-6 py-4 text-right whitespace-nowrap">
                        <span className={`point-number font-bold flex items-center justify-end gap-1 ${tx.amount > 0 ? 'text-green-600' : 'text-primary'}`}>
                          {tx.amount > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                          {isClient ? (
                            <>
                              <span className="hidden md:inline">{formatFull(Math.abs(tx.amount))}</span>
                              <span className="inline md:hidden">{formatShort(Math.abs(tx.amount))}</span>
                            </>
                          ) : (
                            Math.abs(tx.amount)
                          )}
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
