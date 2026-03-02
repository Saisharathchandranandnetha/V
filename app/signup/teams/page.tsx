import { redirect } from 'next/navigation'

// Team accounts now sign in via Google OAuth — same as regular accounts.
export default function TeamsSignupPage() {
    redirect('/login')
}
