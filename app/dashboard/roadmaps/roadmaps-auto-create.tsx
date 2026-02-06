'use client'

import { useEffect, useTransition, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createRoadmap } from './actions'

export function RoadmapsAutoCreate() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [isPending, startTransition] = useTransition()
    const hasTriggeredRef = useRef(false)

    useEffect(() => {
        const shouldAdd = searchParams.get('add') === 'true'
        const sessionKey = 'roadmap-auto-create-triggered'
        // Check if we've already triggered creation in this session
        const alreadyTriggered = sessionStorage.getItem(sessionKey)

        if (shouldAdd && !isPending && !hasTriggeredRef.current && !alreadyTriggered) {
            hasTriggeredRef.current = true
            sessionStorage.setItem(sessionKey, 'true')

            // Immediately clean the URL to prevent any re-triggers
            const newUrl = new URL(window.location.href)
            newUrl.searchParams.delete('add')
            window.history.replaceState({}, '', newUrl.toString())

            startTransition(async () => {
                try {
                    // Create roadmap without server-side redirect
                    const roadmap = await createRoadmap({ title: 'Untitled Roadmap' }, false)

                    // Manually redirect on client side
                    if (roadmap?.id) {
                        router.replace(`/dashboard/roadmaps/${roadmap.id}`)
                    }
                } catch (error) {
                    console.error('Failed to auto-create roadmap:', error)
                }
            })
        }

        // Clean up session storage when component unmounts or when we navigate away
        return () => {
            if (!shouldAdd) {
                // Only clean up if we are not currently in the "adding" state
                // ensuring that if we navigate away properly, we reset for next time
                sessionStorage.removeItem(sessionKey)
            }
        }
    }, [searchParams, isPending])

    return null
}
