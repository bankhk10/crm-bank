import type { Metadata } from "next";
import { Geist, Geist_Mono, Prompt } from "next/font/google";
import "./globals.css";
import AuthSessionProvider from "@/components/providers/session-provider";
import { auth } from "@/lib/auth";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const prompt = Prompt({
  weight: ["400", "500", "700"],
  subsets: ["thai", "latin"],
});

export const metadata: Metadata = {
  title: "CS ONE : คร็อพ ซายน์ ตราปืนใหญ่",
  description: "CS ONE : คร็อพ ซายน์ ตราปืนใหญ่",
  icons: {
    icon: "/images/logo.png",
    shortcut: "/images/logo.png",
    apple: "/images/logo.png",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased ${prompt.className}`}
        suppressHydrationWarning
      >
        <AuthSessionProvider session={session}>
          {children}
          <Toaster richColors />
        </AuthSessionProvider>
      </body>
    </html>
  );
}
