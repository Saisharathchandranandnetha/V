'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
    const [loading, setLoading] = useState(false)

    const handleGoogleSignIn = async () => {
        setLoading(true)
        await signIn('google', { callbackUrl: '/dashboard' })
    }

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black p-4">
            {/* Background Gradients */}
            <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] rounded-full bg-purple-500/20 blur-[100px] animate-pulse" />
            <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-500/20 blur-[100px] animate-pulse delay-700" />

            <Card className="w-full max-w-md relative z-10 border-white/10 bg-black/40 backdrop-blur-xl shadow-2xl">
                <CardHeader className="space-y-3 pb-8">
                    <div className="flex justify-center mb-2">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <span className="text-xl font-bold text-white">V</span>
                        </div>
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight text-center bg-gradient-to-br from-white to-white/60 bg-clip-text text-transparent">
                        Welcome Back
                    </CardTitle>
                    <CardDescription className="text-center text-zinc-400 text-base">
                        Sign in to your account to continue
                    </CardDescription>
                </CardHeader>
                <CardContent className="pb-4">
                    <Button
                        onClick={handleGoogleSignIn}
                        disabled={loading}
                        className="w-full bg-white/5 border border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white transition-all duration-300 h-12 hover:border-white/20 flex items-center justify-center gap-3"
                        variant="outline"
                    >
                        <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                        </svg>
                        {loading ? 'Signing in...' : 'Continue with Google'}
                    </Button>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 border-t border-white/5 pt-6 mt-2">
                    <p className="text-center text-sm text-zinc-500">
                        By signing in, you agree to our terms of service.
                        <br />
                        New users will have an account created automatically.
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
