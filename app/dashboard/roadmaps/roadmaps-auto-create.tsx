'use client'

import { useEffect, useTransition } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createRoadmap } from './actions'

export function RoadmapsAutoCreate() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [isPending, startTransition] = useTransition()

    useEffect(() => {
        if (searchParams.get('add') === 'true' && !isPending) {
            startTransition(async () => {
                await createRoadmap({ title: 'Untitled Roadmap' })
                // The createRoadmap action should handle the redirect
            })
        }
    }, [searchParams, isPending])

    return null
}
