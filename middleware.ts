import { auth } from '@/auth'
import { NextResponse } from 'next/server'

export default auth((req) => {
    const isLoggedIn = !!req.auth
    const path = req.nextUrl.pathname

    if (path.startsWith('/dashboard') && !isLoggedIn) {
        return NextResponse.redirect(new URL('/login', req.url))
    }

    if ((path === '/' || path === '/login' || path === '/signup') && isLoggedIn) {
        return NextResponse.redirect(new URL('/dashboard', req.url))
    }
})

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
