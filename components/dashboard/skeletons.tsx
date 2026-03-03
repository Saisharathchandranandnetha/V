import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardHeader, CardContent } from '@/components/ui/card'

export function StatsSkeleton() {
    return (
        <div className="h-full rounded-xl border border-white/5 bg-background shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 p-6 pb-2">
                <Skeleton className="h-4 w-[100px]" />
                <Skeleton className="h-4 w-4" />
            </div>
            <div className="p-6 pt-0">
                <Skeleton className="h-8 w-[60px] mb-2" />
                <Skeleton className="h-3 w-[140px]" />
                <Skeleton className="h-2 w-full mt-4" />
            </div>
        </div>
    )
}

export function QuickLinksSkeleton() {
    return (
        <div className="space-y-4 mt-8">
            <Skeleton className="h-8 w-[150px]" />
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <Skeleton className="col-span-2 md:col-span-2 lg:col-span-2 h-32 rounded-xl" />
                {Array.from({ length: 7 }).map((_, i) => (
                    <Skeleton key={i} className="col-span-1 h-32 rounded-xl" />
                ))}
            </div>
        </div>
    )
}
