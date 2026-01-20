"use client"

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useRouter, usePathname, useSearchParams } from "next/navigation"

export function ViewSelector() {
    const router = useRouter()
    const pathname = usePathname()
    const searchParams = useSearchParams()

    // Default to 'active' if no param is set
    const currentView = searchParams.get("view") || "active"

    const onValueChange = (value: string) => {
        const params = new URLSearchParams(searchParams)
        if (value === "active") {
            params.delete("view")
        } else {
            params.set("view", value)
        }

        router.push(`${pathname}?${params.toString()}`)
    }

    return (
        <Tabs defaultValue="active" value={currentView} onValueChange={onValueChange} className="w-[400px]">
            <TabsList>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
            </TabsList>
        </Tabs>
    )
}
