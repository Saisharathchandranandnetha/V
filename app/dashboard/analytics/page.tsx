import { getAnalyticsData } from './actions'
import AnalyticsCharts from './analytics-charts'

export default async function AnalyticsPage() {
    const data = await getAnalyticsData()

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">Track your learning progress.</p>
            <AnalyticsCharts data={data} />
        </div>
    )
}
