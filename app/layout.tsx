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

export const metadata: Metadata = {
  title: "LifeOS",
  description: "The ultimate productivity and knowledge hub.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased relative min-h-screen overflow-x-hidden`}
        suppressHydrationWarning
      >
        <NextTopLoader showSpinner={false} />

        {/* Background Wrapper */}
        <div className="fixed inset-0 -z-10">
          {/* Dark Mode Background (Blobs) */}
          <div className="hidden dark:block absolute inset-0 bg-[#0f0c29]">
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-600/30 blur-[100px] animate-blob" />
            <div className="absolute top-[20%] right-[-10%] w-[35%] h-[35%] rounded-full bg-pink-600/30 blur-[100px] animate-blob animation-delay-2000" />
            <div className="absolute bottom-[-10%] left-[20%] w-[45%] h-[45%] rounded-full bg-blue-600/30 blur-[100px] animate-blob animation-delay-4000" />
          </div>

          {/* Light Mode Background (Pastel Diagonals) */}
          <div className="block dark:hidden absolute inset-0 bg-gradient-to-br from-pink-50 via-white to-blue-50 overflow-hidden">
            <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[50%] bg-pink-200/40 blur-[80px] -rotate-12 translate-y-10" />
            <div className="absolute top-[30%] right-[-20%] w-[60%] h-[60%] bg-blue-200/40 blur-[100px] rotate-12" />
            {/* Diagonal Stripes */}
            <div className="absolute -top-[10%] -left-[10%] w-[120%] h-[200px] bg-orange-300/20 blur-[60px] -rotate-45" />
            <div className="absolute top-[40%] left-[-20%] w-[150%] h-[300px] bg-blue-300/20 blur-[80px] -rotate-45" />
          </div>
        </div>

        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
        <SpeedInsights />
      </body>
    </html>
  );
}
