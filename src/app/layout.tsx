import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Fraunces } from "next/font/google";
import "./globals.css";
import { SidebarNav } from "@/components/sidebar-nav";
import { MobileNav } from "@/components/mobile-nav";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

const geistSans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

const fraunces = Fraunces({
  variable: "--font-heading",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Tend — your life, tended to",
  description:
    "One calm place to track relationships, chores, errands, and everything else in life.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Tend",
  },
};

export const viewport: Viewport = {
  themeColor: "#B85C3E",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${fraunces.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-background text-foreground">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <div className="flex min-h-full">
            <SidebarNav />
            <div className="flex min-h-full flex-1 flex-col">
              <main className="flex-1 pb-24 md:pb-8">{children}</main>
            </div>
          </div>
          <MobileNav />
          <Toaster position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
