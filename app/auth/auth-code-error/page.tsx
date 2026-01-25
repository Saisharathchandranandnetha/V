import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

export default function AuthCodeErrorPage() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
            <div className="max-w-md w-full text-center space-y-6">
                <div className="flex justify-center">
                    <div className="h-24 w-24 rounded-full bg-red-100 flex items-center justify-center dark:bg-red-900/20">
                        <AlertCircle className="h-12 w-12 text-red-600 dark:text-red-400" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold tracking-tight">Authentication Error</h1>

                <p className="text-muted-foreground">
                    We encountered a problem while trying to sign you in. The verification link may have expired or is invalid.
                </p>

                <div className="pt-6">
                    <Link href="/login" passHref>
                        <Button className="w-full">
                            Back to Login
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    )
}
