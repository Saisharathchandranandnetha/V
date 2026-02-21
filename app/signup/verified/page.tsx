'use client'

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { CheckCircle2, ArrowRight } from 'lucide-react'

export default function VerifiedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black p-4">
            {/* Background Gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full bg-green-500/10 blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-emerald-500/10 blur-[100px] animate-pulse delay-700" />

            <Card className="w-full max-w-md relative z-10 border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
                <CardHeader className="space-y-3 pb-6">
                    <div className="flex justify-center mb-4">
                        <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center ring-1 ring-green-500/20">
                            <CheckCircle2 className="h-8 w-8 text-green-400" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-center text-white">
                        Email Verified!
                    </CardTitle>
                    <CardDescription className="text-center text-zinc-400 text-base">
                        Your account has been successfully verified.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-sm text-center text-zinc-500">
                        You can now access your V dashboard.
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 border-t border-white/5 pt-6">
                    <Button asChild className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500 text-white border-0 shadow-lg shadow-green-500/25 h-10 font-medium tracking-wide transition-all duration-300 hover:scale-[1.02]">
                        <Link href="/dashboard" className="flex items-center justify-center gap-2">
                            Continue to Dashboard
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
