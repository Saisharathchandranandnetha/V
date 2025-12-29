import { Loader } from "@/components/ui/loader"

export default function DashboardLoading() {
    return (
        <div className="flex h-full w-full items-center justify-center min-h-[50vh]">
            <Loader size="lg" />
        </div>
    )
}
