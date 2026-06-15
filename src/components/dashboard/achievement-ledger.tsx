"use client"

import { useState } from "react"
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, ArrowUpRight, ArrowDownRight } from "lucide-react"

const allocations = [
  { id: 1, activity: "Top-up: Pulsa Telkomsel 50k", date: "2024-03-20", points: -50000, type: "Debit", status: "Success" },
  { id: 2, activity: "Wallet Deposit: Bank Transfer", date: "2024-03-18", points: 1000000, type: "Credit", status: "Success" },
  { id: 3, activity: "Payment: PLN Token 100k", date: "2024-03-15", points: -102000, type: "Debit", status: "Success" },
  { id: 4, activity: "Wallet Deposit: QRIS", date: "2024-03-12", points: 250000, type: "Credit", status: "Success" },
  { id: 5, activity: "Top-up: Dana 100k", date: "2024-03-01", points: -101500, type: "Debit", status: "Success" },
  { id: 6, activity: "Refund: Failed Transaction", date: "2024-02-28", points: 50000, type: "Credit", status: "Success" },
]

export function AchievementLedger() {
  const [search, setSearch] = useState("")

  const filtered = allocations.filter(item => 
    item.activity.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <CardTitle className="font-headline text-xl">Recent Transactions</CardTitle>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-9 w-full md:w-[200px] lg:w-[300px] bg-background/50"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Badge variant="outline" className="h-10 px-3 gap-2 cursor-pointer hover:bg-white/5 transition-colors hidden sm:flex">
            <Filter className="h-3 w-3" /> Filter
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0 sm:p-6 sm:pt-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="min-w-[180px]">Activity</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="transition-colors group">
                  <TableCell className="font-medium">{item.activity}</TableCell>
                  <TableCell className="text-muted-foreground whitespace-nowrap">{item.date}</TableCell>
                  <TableCell>
                    <span className={`point-number font-bold flex items-center gap-1 ${item.points > 0 ? 'text-accent' : 'text-primary'}`}>
                      {item.points > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {Math.abs(item.points).toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant={item.status === 'Success' ? 'secondary' : 'outline'} className="text-[10px] uppercase tracking-tighter">
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
