import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers/Providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "FoodChain AI — Smart Procurement for Street Food Vendors",
  description:
    "AI-powered procurement platform helping street food vendors find the best nearby raw material suppliers. Compare prices, check ratings, and optimize your supply chain.",
  keywords: [
    "food procurement",
    "street food",
    "supplier finder",
    "raw materials",
    "AI",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
