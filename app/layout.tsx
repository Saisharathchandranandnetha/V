import { Plus_Jakarta_Sans, Instrument_Sans } from "next/font/google";
import type { Viewport } from 'next';

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
import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'
import { UAParser } from 'ua-parser-js'

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

import { Syne } from "next/font/google";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  display: 'swap',
});

import { ThemeProvider } from "@/components/theme-provider";

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
        className={`antialiased ${jakarta.variable} ${instrument.variable} ${syne.variable} font-sans selection:bg-primary/30 relative min-h-screen overflow-x-hidden`}
      >
        <NextTopLoader showSpinner={false} />
        <CustomCursor />
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
        <Toaster position="top-right" richColors />
        <SpeedInsights />
      </body>
    </html>
  );
}
