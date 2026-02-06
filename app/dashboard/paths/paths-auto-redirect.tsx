'use client'

import { useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'

export function PathsAutoRedirect() {
    const searchParams = useSearchParams()
    const router = useRouter()

    useEffect(() => {
        if (searchParams.get('add') === 'true') {
            router.replace('/dashboard/paths/new')
        }
    }, [searchParams, router])

    return null
}
