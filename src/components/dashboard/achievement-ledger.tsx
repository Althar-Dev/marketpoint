
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
  { id: 1, activity: "Project Milestone: Apollo", date: "2024-03-20", points: 500, type: "Awarded", status: "Verified" },
  { id: 2, activity: "Tech Blog Contribution", date: "2024-03-18", points: 250, type: "Awarded", status: "Verified" },
  { id: 3, activity: "Redemption: mechanical keyboard", date: "2024-03-15", points: -1200, type: "Redeemed", status: "Processed" },
  { id: 4, activity: "Mentorship Session", date: "2024-03-12", points: 150, type: "Awarded", status: "Verified" },
  { id: 5, activity: "Quarterly Performance Bonus", date: "2024-03-01", points: 1000, type: "Awarded", status: "Verified" },
  { id: 6, activity: "Bug Bounty Hunt", date: "2024-02-28", points: 300, type: "Awarded", status: "Verified" },
]

export function AchievementLedger() {
  const [search, setSearch] = useState("")

  const filtered = allocations.filter(item => 
    item.activity.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Card className="glass-card">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline text-xl">Achievement Ledger</CardTitle>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search activities..." 
              className="pl-9 w-[200px] lg:w-[300px] bg-background/50 border-white/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Badge variant="outline" className="h-9 px-3 gap-2 cursor-pointer border-white/10 hover:bg-white/5 transition-colors">
            <Filter className="h-3 w-3" /> Filter
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-white/5 hover:bg-transparent">
              <TableHead className="text-muted-foreground">Activity</TableHead>
              <TableHead className="text-muted-foreground">Date</TableHead>
              <TableHead className="text-muted-foreground">Points</TableHead>
              <TableHead className="text-muted-foreground">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((item) => (
              <TableRow key={item.id} className="border-white/5 hover:bg-white/5 transition-colors group">
                <TableCell className="font-medium">{item.activity}</TableCell>
                <TableCell className="text-muted-foreground">{item.date}</TableCell>
                <TableCell>
                  <span className={`point-number font-bold flex items-center gap-1 ${item.points > 0 ? 'text-accent' : 'text-primary'}`}>
                    {item.points > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {item.points.toLocaleString()}
                  </span>
                </TableCell>
                <TableCell>
                  <Badge variant={item.status === 'Verified' ? 'secondary' : 'outline'} className="text-[10px] uppercase tracking-tighter">
                    {item.status}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
