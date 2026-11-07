import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Open_Sans } from "next/font/google";
import { AppProviders } from "@/components/providers/app-providers";
import "./globals.css";

/** The only text family: variable Open Sans (400-800 used). Headings 700-800 with tight tracking. */
const openSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-open-sans",
  display: "swap",
});

/** Monospace for tracking ids and phone numbers only (slashed zero, distinct 1/l). */
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  // Only small tracking ids and phone numbers use it: don't let it compete with Open Sans for the first paint.
  preload: false,
});

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: { default: "Carrivo | Courier and parcel delivery", template: "%s | Carrivo" },
  description: "Book a courier, pay online and follow every parcel from pickup to doorstep.",
  applicationName: "Carrivo",
  openGraph: { type: "website", siteName: "Carrivo" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7f7f6" },
    { media: "(prefers-color-scheme: dark)", color: "#121110" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: next-themes sets the theme class before React hydrates.
    <html lang="en" suppressHydrationWarning className={`${openSans.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
