
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { StatsCards } from "@/components/dashboard/stats-cards"
import { AchievementLedger } from "@/components/dashboard/achievement-ledger"
import { PerksGallery } from "@/components/dashboard/perks-gallery"

export default function Home() {
  return (
    <DashboardLayout>
      <div className="space-y-12">
        <section>
          <div className="mb-6">
            <h2 className="font-headline text-3xl font-bold tracking-tight">System Status</h2>
            <p className="text-muted-foreground mt-1">Real-time performance tracking and point metrics.</p>
          </div>
          <StatsCards />
        </section>

        <section>
          <AchievementLedger />
        </section>

        <section className="pb-12">
          <PerksGallery />
        </section>
      </div>
    </DashboardLayout>
  )
}
