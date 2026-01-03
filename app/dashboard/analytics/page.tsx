import { getAnalyticsData } from './actions'
import AnalyticsCharts from './analytics-charts'

export default async function AnalyticsPage(props: { searchParams: Promise<{ period?: string, date?: string }> }) {
    const searchParams = await props.searchParams
    const { period, date } = searchParams

    // For custom date: we treat it as start=end
    const startDate = period === 'custom' ? date : undefined
    const endDate = period === 'custom' ? date : undefined

    const data = await getAnalyticsData(period, startDate, endDate)

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                    <p className="text-muted-foreground">Track your learning progress.</p>
                </div>
            </div>

            <AnalyticsCharts data={data} />
        </div>
    )
}
