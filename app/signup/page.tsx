'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { signup } from '@/app/login/actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { signupSchema } from '@/lib/auth-schemas'
import { z } from 'zod'

export default function SignupPage() {
    const searchParams = useSearchParams()
    const serverError = searchParams.get('error')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

    // Client-side validation wrapper before hitting the server action
    const clientAction = async (formData: FormData) => {
        setError(null)
        setFieldErrors({})

        const rawData = {
            full_name: formData.get('full_name'),
            email: formData.get('email'),
            password: formData.get('password'),
            confirm_password: formData.get('confirm_password'),
            role: formData.get('role'),
        }

        const result = signupSchema.safeParse(rawData)

        if (!result.success) {
            const formattedErrors: Record<string, string> = {}
            result.error.issues.forEach((issue) => {
                const path = issue.path[0] as string
                formattedErrors[path] = issue.message
            })
            setFieldErrors(formattedErrors)

            if (formattedErrors.confirm_password) {
                setError(formattedErrors.confirm_password)
            } else if (Object.keys(formattedErrors).length > 0) {
                setError(Object.values(formattedErrors)[0])
            }
            return
        }

        // Trigger the server action
        await signup(formData)
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
                        Create Account
                    </CardTitle>
                    <CardDescription className="text-center text-zinc-400 text-base">
                        Join V today
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form action={clientAction} className="space-y-5">
                        <div className="space-y-2">
                            <Label htmlFor="full_name" className="text-zinc-300">Full Name</Label>
                            <Input
                                id="full_name"
                                name="full_name"
                                type="text"
                                placeholder="Your Name"
                                required
                                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500/50 focus:bg-white/10 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300"
                            />
                            {fieldErrors.full_name && <p className="text-xs text-red-400 mt-1">{fieldErrors.full_name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-zinc-300">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                                className="bg-white/5 border-white/10 text-white placeholder:text-zinc-500 focus:border-indigo-500/50 focus:bg-white/10 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300"
                            />
                            {fieldErrors.email && <p className="text-xs text-red-400 mt-1">{fieldErrors.email}</p>}
                        </div>
                        <input type="hidden" name="role" value="user" />
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-zinc-300">Password</Label>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-white/5 border-white/10 text-white focus:border-indigo-500/50 focus:bg-white/10 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300"
                            />
                            {fieldErrors.password && <p className="text-xs text-red-400 mt-1">{fieldErrors.password}</p>}
                            <p className="text-xs text-zinc-500">Min 12 chars, uppercase, lowercase, number, symbol.</p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm_password" className="text-zinc-300">Confirm Password</Label>
                            <Input
                                id="confirm_password"
                                name="confirm_password"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value)
                                    if (error) setError(null)
                                }}
                                required
                                className="bg-white/5 border-white/10 text-white focus:border-indigo-500/50 focus:bg-white/10 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300"
                            />
                            {fieldErrors.confirm_password && (
                                <p className="text-sm text-red-400 mt-1 animate-in fade-in slide-in-from-top-1">
                                    {fieldErrors.confirm_password}
                                </p>
                            )}
                        </div>

                        {/* Server-side error from URL */}
                        {serverError && (
                            <p className="text-sm text-red-400 text-center animate-in fade-in slide-in-from-top-1 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                {serverError}
                            </p>
                        )}

                        {error && !fieldErrors.confirm_password && (
                            <p className="text-sm text-red-400 mt-1 text-center animate-in fade-in slide-in-from-top-1">
                                {error}
                            </p>
                        )}

                        <div className="flex flex-col gap-3 pt-4">
                            <Button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-indigo-500/25 h-10 font-medium tracking-wide transition-all duration-300 hover:scale-[1.02]">
                                Sign Up
                            </Button>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 border-t border-white/5 pt-6 mt-2">
                    <p className="text-center text-sm text-zinc-400">
                        Already have an account?{' '}
                        <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                            Sign In
                        </Link>
                    </p>
                </CardFooter>
            </Card>
        </div>
    )
}
