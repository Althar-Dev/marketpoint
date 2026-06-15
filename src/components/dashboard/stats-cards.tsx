
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TrendingUp, Award, Zap, History } from "lucide-react"
import { 
  Area, 
  AreaChart, 
  ResponsiveContainer, 
  Tooltip, 
  XAxis, 
  YAxis 
} from "recharts"

const chartData = [
  { day: "Mon", points: 1200 },
  { day: "Tue", points: 1500 },
  { day: "Wed", points: 1400 },
  { day: "Thu", points: 2100 },
  { day: "Fri", points: 1800 },
  { day: "Sat", points: 2400 },
  { day: "Sun", points: 2850 },
]

export function StatsCards() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Total Points</CardTitle>
          <Zap className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="point-number text-4xl font-bold text-primary">2,850</div>
          <p className="text-xs text-accent mt-1 flex items-center gap-1 font-medium">
            <TrendingUp className="h-3 w-3" /> +12% from last week
          </p>
        </CardContent>
      </Card>

      <Card className="glass-card">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Rank</CardTitle>
          <Award className="h-4 w-4 text-accent" />
        </CardHeader>
        <CardContent>
          <div className="point-number text-4xl font-bold">Elite</div>
          <p className="text-xs text-muted-foreground mt-1">Top 5% of all users</p>
        </CardContent>
      </Card>

      <Card className="glass-card md:col-span-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Growth Trend</CardTitle>
        </CardHeader>
        <CardContent className="h-[80px] p-0 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPoints" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="points" 
                stroke="hsl(var(--primary))" 
                fillOpacity={1} 
                fill="url(#colorPoints)" 
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}
