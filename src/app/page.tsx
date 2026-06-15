
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { AchievementLedger } from "@/components/dashboard/achievement-ledger"
import { PpobServices } from "@/components/dashboard/ppob-services"

export default function Home() {
  return (
    <DashboardLayout>
      <div className="space-y-12">
        <section>
          <div className="mb-6">
            <h2 className="font-headline text-3xl font-bold tracking-tight">Financial Overview</h2>
            <p className="text-muted-foreground mt-1">Real-time PPOB & Payment Gateway metrics.</p>
          </div>
          <StatsCards />
        </section>

        <section>
          <PpobServices />
        </section>

        <section className="pb-12">
          <AchievementLedger />
        </section>
      </div>
    </DashboardLayout>
  )
}
