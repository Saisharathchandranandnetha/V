'use client'

import { useFormStatus } from 'react-dom'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

export function SubmitButton({ children, formAction, variant = "default", className }: { children: React.ReactNode, formAction: (formData: FormData) => void, variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link", className?: string }) {
    const { pending } = useFormStatus()

    return (
        <Button
            disabled={pending}
            formAction={formAction}
            variant={variant}
            className={className}
        >
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {children}
        </Button>
    )
}
