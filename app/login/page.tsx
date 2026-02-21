
import { login } from './actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { SubmitButton } from '@/components/submit-button'

export default async function LoginPage(props: { searchParams: Promise<{ message: string, error: string }> }) {
    const searchParams = await props.searchParams
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
                        Sign in to your V account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-5">
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
                        </div>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" className="text-zinc-300">Password</Label>
                            </div>
                            <Input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="bg-white/5 border-white/10 text-white focus:border-indigo-500/50 focus:bg-white/10 focus:ring-1 focus:ring-indigo-500/50 transition-all duration-300"
                            />
                        </div>

                        {(searchParams.message || searchParams.error) && (
                            <div className={`p-3 text-sm rounded-md border ${searchParams.error ? 'bg-red-500/10 border-red-500/20 text-red-200' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'}`}>
                                {searchParams.error || searchParams.message}
                            </div>
                        )}

                        <div className="flex flex-col gap-3 pt-4">
                            <SubmitButton formAction={login} className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-indigo-500/25 h-10 font-medium tracking-wide transition-all duration-300 hover:scale-[1.02]">
                                Sign In
                            </SubmitButton>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-4 border-t border-white/5 pt-6 mt-2">
                    <p className="text-center text-sm text-zinc-400">
                        Don't have an account?{' '}
                        <a href="/signup" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">
                            Sign Up
                        </a>
                    </p>

                    <div className="relative w-full mt-2">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-white/10" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-black/40 px-2 text-zinc-500 backdrop-blur-xl">Or continue with</span>
                        </div>
                    </div>
                    <Button variant="outline" className="w-full bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white transition-all duration-300 h-10 hover:border-white/20" disabled>
                        Google
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
