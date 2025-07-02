import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { PrimeReactProvider } from 'primereact/api'
import { ConfirmDialog } from "primereact/confirmdialog";
import SessionProvider from "@/components/providers/SessionProvider";

import "./globals.css";
import 'primereact/resources/themes/lara-light-cyan/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Hallmark Academy",
  description: "Hallmark Academy is an academic institution located in Lafia, Nasarawa State of Nigeria",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider>
          <PrimeReactProvider value={{ unstyled: false }}>
            {children}
            <ConfirmDialog />
          </PrimeReactProvider>
        </SessionProvider>
      </body>
    </html>
  );
}