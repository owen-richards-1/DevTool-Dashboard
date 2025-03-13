import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react"

import "./globals.css";

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "DevTool Dashboard",
  description: "A developer tool dashboard to explore GitHub, StackOverflow, and Dev.to insights.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
<html lang="en" className="dark">
  <body className="bg-zinc-900">
  <SessionProvider>
    <Navbar />
      {children}
    <Footer/>
  </SessionProvider>
  </body>
</html>
  );
}
