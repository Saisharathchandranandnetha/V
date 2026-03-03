import { Plus_Jakarta_Sans, Instrument_Sans, Syne } from "next/font/google";
import type { Viewport, Metadata } from 'next';

export const metadata: Metadata = {
  title: {
    default: 'LifeOs',
    template: '%s | LifeOs',
  },
  description: 'Master your habits, tasks, finances, and knowledge in one central hub.',
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#000000',
};

import "./globals.css";
import { BackgroundWrapper } from "@/components/background-wrapper"
import { GlobalNoise } from "@/components/ui/global-noise"
import { Toaster } from "@/components/ui/sonner"
import { CustomCursor } from "@/components/ui/custom-cursor"
import NextTopLoader from 'nextjs-toploader';
import { SpeedInsights } from "@vercel/speed-insights/next";
import { SmoothScrollWrapper } from "@/components/ui/smooth-scroll-wrapper";
import { InteractiveGrid } from "@/components/ui/interactive-grid";
import { auth } from '@/auth'
import { SessionProvider } from 'next-auth/react'
import { headers } from 'next/headers'
import { UAParser } from 'ua-parser-js'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { ThemeProvider } from "@/components/theme-provider";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-jakarta",
  subsets: ["latin"],
  display: 'swap',
});

const instrument = Instrument_Sans({
  variable: "--font-instrument",
  subsets: ["latin"],
  display: 'swap',
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: 'swap',
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers()
  const userAgent = headersList.get('user-agent') || ''
  const parser = new UAParser(userAgent)
  const device = parser.getDevice()
  const deviceType = (device.type === 'mobile' || device.type === 'tablet') ? device.type : 'desktop'

  // Fetch User Settings for Background (NextAuth + Drizzle)
  const session = await auth()
  let customBackground = null

  if (session?.user?.id) {
    const [userData] = await db
      .select({ settings: users.settings })
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1)

    const settings = userData?.settings as Record<string, string> | null
    if (settings?.backgroundImage && settings.backgroundImage.startsWith('http')) {
      customBackground = settings.backgroundImage
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`antialiased ${jakarta.variable} ${instrument.variable} ${syne.variable} font-sans selection:bg-primary/30 relative min-h-screen overflow-x-hidden`}
      >
        <NextTopLoader showSpinner={false} color="oklch(0.65 0.25 260)" />
        <CustomCursor />
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <SmoothScrollWrapper>
              <InteractiveGrid />
              <BackgroundWrapper deviceType={deviceType} customUrl={customBackground}>
                <GlobalNoise />
                {children}
              </BackgroundWrapper>
            </SmoothScrollWrapper>
          </ThemeProvider>
        </SessionProvider>
        <Toaster position="top-right" richColors />
        <SpeedInsights />
      </body>
    </html>
  );
}
