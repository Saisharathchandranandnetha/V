import { cn } from "@/lib/utils"
import { Loader2 } from "lucide-react"

interface LoaderProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: "default" | "sm" | "lg" | "xl"
}

export function Loader({ className, size = "default", ...props }: LoaderProps) {
    const sizeClasses = {
        sm: "w-4 h-4",
        default: "w-8 h-8",
        lg: "w-12 h-12",
        xl: "w-16 h-16",
    }

    return (
        <div
            className={cn(
                "flex min-h-[50vh] w-full items-center justify-center p-8",
                className
            )}
            {...props}
        >
            <div className="relative flex flex-col items-center justify-center gap-4">
                {/* Main Spinner */}
                <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-primary/20 blur-xl animate-pulse" />
                    <Loader2
                        className={cn(
                            "animate-spin text-primary relative z-10",
                            sizeClasses[size]
                        )}
                    />
                </div>

                {/* Optional Loading Text */}
                <p className="text-sm text-muted-foreground animate-pulse font-medium">
                    Loading...
                </p>
            </div>
        </div>
    )
}
