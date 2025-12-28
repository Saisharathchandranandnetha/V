
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex items-center gap-2 font-bold text-xl">
          Nexus
        </div>
        <nav className="flex gap-4">
          <Link href="/login">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/login">
            <Button>Get Started</Button>
          </Link>
        </nav>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-8">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-3xl">
          Build your personal <span className="text-primary">LifeOS</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl">
          Master your habits, tasks, finances, and knowledge in one central hub.
        </p>
        <div className="flex gap-4">
          <Link href="/login">
            <Button size="lg" className="h-12 px-8 text-lg">Enter Nexus</Button>
          </Link>
        </div>
      </main>
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        © 2024 Nexus. All rights reserved.
      </footer>
    </div>
  )
}
