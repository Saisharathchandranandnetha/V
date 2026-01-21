'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Mail, ArrowLeft } from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'

function VerifyEmailContent() {
    const searchParams = useSearchParams()
    const email = searchParams.get('email')

    return (
        <Card className="w-full max-w-md relative z-10 border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
            <CardHeader className="space-y-3 pb-6">
                <div className="flex justify-center mb-4">
                    <div className="h-16 w-16 rounded-full bg-indigo-500/10 flex items-center justify-center ring-1 ring-indigo-500/20">
                        <Mail className="h-8 w-8 text-indigo-400" />
                    </div>
                </div>
                <CardTitle className="text-2xl font-bold tracking-tight text-center text-white">
                    Check your email
                </CardTitle>
                <CardDescription className="text-center text-zinc-400 text-base">
                    We've sent a verification link to
                    {email ? (
                        <span className="block mt-2 font-medium text-white">{email}</span>
                    ) : (
                        <span className="block mt-2">your email address</span>
                    )}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="text-sm text-center text-zinc-500">
                    Click the link in the email to verify your account and sign in.
                </div>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 border-t border-white/5 pt-6">
                <Button asChild variant="ghost" className="w-full text-zinc-400 hover:text-white hover:bg-white/5">
                    <Link href="/login" className="flex items-center gap-2">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Login
                    </Link>
                </Button>
            </CardFooter>
        </Card>
    )
}

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black p-4">
            {/* Background Gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full bg-purple-500/20 blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/20 blur-[100px] animate-pulse delay-700" />

            <Suspense fallback={<div>Loading...</div>}>
                <VerifyEmailContent />
            </Suspense>
        </div>
    )
}
