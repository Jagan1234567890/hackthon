import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "KEYHOLE — Applied Cryptography & Forensic Key Recovery",
  description:
    "Hyper-dark desktop-class cryptographic forensics engine for authorized key-recovery, format unlocking, and digital trust auditing.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[oklch(0.02_0_0)] text-white selection:bg-[oklch(0.62_0.22_295/30%)] selection:text-white">
        {children}
      </body>
    </html>
  );
}
