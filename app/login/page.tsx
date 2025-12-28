
import { login, signup } from './actions'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'

export default async function LoginPage(props: { searchParams: Promise<{ message: string, error: string }> }) {
    const searchParams = await props.searchParams
    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-4">
            <Card className="w-full max-w-md shadow-xl border-zinc-200 dark:border-zinc-800">
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl font-bold tracking-tight text-center">LifeOS</CardTitle>
                    <CardDescription className="text-center">
                        Enter your email to sign in or create an account
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" placeholder="m@example.com" required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" name="password" type="password" required />
                        </div>

                        {(searchParams.message || searchParams.error) && (
                            <div className={`p-3 text-sm rounded-md ${searchParams.error ? 'bg-red-50 text-red-500' : 'bg-green-50 text-green-500'}`}>
                                {searchParams.error || searchParams.message}
                            </div>
                        )}

                        <div className="flex flex-col gap-2 pt-2">
                            <Button formAction={login} className="w-full">Sign In</Button>
                            <Button formAction={signup} variant="outline" className="w-full">Sign Up</Button>
                        </div>
                    </form>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <div className="relative w-full">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                        </div>
                    </div>
                    {/* Add Google Auth Button here later or use a Client Component for it */}
                    <Button variant="outline" className="w-full mt-2" disabled>
                        Google (Not Configured)
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}
