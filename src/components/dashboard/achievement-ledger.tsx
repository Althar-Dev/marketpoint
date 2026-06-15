"use client"

import { useState, useEffect } from "react"
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
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const filtered = allocations.filter(item => 
    item.activity.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Card className="shadow-none border border-border overflow-hidden">
      <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 md:p-6">
        <CardTitle className="font-headline text-lg md:text-xl">Recent Transactions</CardTitle>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-9 w-full md:w-[200px] lg:w-[300px] bg-background shadow-none h-9 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Badge variant="outline" className="h-9 px-3 gap-2 cursor-pointer hover:bg-secondary transition-colors hidden sm:flex font-medium">
            <Filter className="h-3.5 w-3.5" /> Filter
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto scrollbar-hide">
          <Table className="min-w-[600px] md:min-w-full">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-b">
                <TableHead className="px-4 py-3 text-xs uppercase tracking-wider">Activity</TableHead>
                <TableHead className="px-4 py-3 text-xs uppercase tracking-wider">Date</TableHead>
                <TableHead className="px-4 py-3 text-xs uppercase tracking-wider">Amount</TableHead>
                <TableHead className="px-4 py-3 text-xs uppercase tracking-wider">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((item) => (
                <TableRow key={item.id} className="transition-colors border-b last:border-0 hover:bg-muted/30">
                  <TableCell className="px-4 py-4 font-medium text-sm">{item.activity}</TableCell>
                  <TableCell className="px-4 py-4 text-muted-foreground text-xs whitespace-nowrap">{item.date}</TableCell>
                  <TableCell className="px-4 py-4">
                    <span className={`point-number font-bold flex items-center gap-1 text-sm ${item.points > 0 ? 'text-accent' : 'text-primary'}`}>
                      {item.points > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                      {mounted ? Math.abs(item.points).toLocaleString() : "..."}
                    </span>
                  </TableCell>
                  <TableCell className="px-4 py-4">
                    <Badge variant={item.status === 'Success' ? 'secondary' : 'outline'} className="text-[10px] font-bold uppercase tracking-tighter px-2 py-0">
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
