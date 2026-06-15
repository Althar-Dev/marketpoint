import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { AchievementLedger } from "@/components/dashboard/achievement-ledger"
import { PpobServices } from "@/components/dashboard/ppob-services"

export default function ClientDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-8 md:space-y-12">
        <section>
          <div className="mb-6">
            <h2 className="font-headline text-2xl md:text-3xl font-bold tracking-tight">Client Overview</h2>
            <p className="text-muted-foreground mt-1 text-sm md:text-base">Real-time PPOB & Payment Gateway metrics for your account.</p>
          </div>
          <StatsCards />
        </section>

        <section>
          <PpobServices />
        </section>

        <section className="pb-8 md:pb-12">
          <AchievementLedger />
        </section>
      </div>
    </DashboardLayout>
  )
}
