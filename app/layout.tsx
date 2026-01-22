import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider"
import NextTopLoader from 'nextjs-toploader';
import { SpeedInsights } from "@vercel/speed-insights/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { UAParser } from 'ua-parser-js'
import { BackgroundWrapper } from "@/components/background-wrapper"
import { Toaster } from "@/components/ui/sonner"

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

  // Fetch User Settings for Background
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  let customBackground = null

  if (user) {
    const { data: userData } = await supabase
      .from('users')
      .select('settings')
      .eq('id', user.id)
      .single()

    if (userData && userData.settings && userData.settings.backgroundImage) {
      const bgImage = userData.settings.backgroundImage
      if (!bgImage.startsWith('http')) {
        const { data } = await supabase.storage
          .from('backgrounds')
          .createSignedUrl(bgImage, 60 * 60 * 24) // 24 hours
        if (data?.signedUrl) {
          customBackground = data.signedUrl
        }
      } else {
        customBackground = bgImage
      }
    }
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative min-h-screen overflow-x-hidden`}
        suppressHydrationWarning
      >
        <NextTopLoader showSpinner={false} />

        <BackgroundWrapper deviceType={deviceType} customUrl={customBackground} />

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <SpeedInsights />
        <Toaster />
      </body>
    </html>
  );
}
