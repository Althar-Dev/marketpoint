"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, CreditCard, ShieldCheck } from "lucide-react"
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
} from "recharts"

const chartData = [
  { day: "Mon", vol: 4200000 },
  { day: "Tue", vol: 5100000 },
  { day: "Wed", vol: 3800000 },
  { day: "Thu", vol: 6200000 },
  { day: "Fri", vol: 7800000 },
  { day: "Sat", vol: 9200000 },
  { day: "Sun", vol: 8500000 },
]

export function StatsCards() {
  return (
    <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
      <Card className="shadow-none border border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Total Balance</CardTitle>
          <CreditCard className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="point-number text-2xl md:text-3xl font-bold text-primary">Rp 12,45M</div>
          <p className="text-[10px] md:text-xs text-accent mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="h-3 w-3" /> +8% from yesterday
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-none border border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Success Rate</CardTitle>
          <ShieldCheck className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="point-number text-2xl md:text-3xl font-bold">99.8%</div>
          <p className="text-[10px] md:text-xs text-muted-foreground mt-1">SLA compliant</p>
        </CardContent>
      </Card>

      <Card className="shadow-none border border-border sm:col-span-2">
        <CardHeader className="pb-2 space-y-0">
          <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-widest">Transaction Volume (7D)</CardTitle>
        </CardHeader>
        <CardContent className="h-[80px] p-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="vol" 
                stroke="hsl(var(--primary))" 
                fillOpacity={1} 
                fill="url(#colorVol)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
