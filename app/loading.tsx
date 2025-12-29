import { Loader } from "@/components/ui/loader"

export default function Loading() {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-background/80 backdrop-blur-sm">
            <Loader size="xl" />
        </div>
    )
}
