import type { Metadata } from "next";
import { Geist, Geist_Mono, Prompt } from "next/font/google";
import "./globals.css";
import AuthSessionProvider from "@/components/providers/session-provider";
import { auth } from "@/lib/auth";

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
  title: "CRM",
  description: "CRM for Bank",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased ${prompt.className}`}
      >
        <AuthSessionProvider session={session}>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}
