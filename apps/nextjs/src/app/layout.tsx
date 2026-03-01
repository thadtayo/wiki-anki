import type { Metadata, Viewport } from "next";
import { Inter, Merriweather } from "next/font/google";

import { cn } from "@acme/ui";
import { ThemeProvider, ThemeToggle } from "@acme/ui/theme";
import { Toaster } from "@acme/ui/toast";

import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";

import "~/app/styles.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    env.VERCEL_ENV === "production"
      ? "https://wiki-anki.vercel.app"
      : "http://localhost:3000",
  ),
  title: "Wiki Anki",
  description: "Generate Anki flashcards from Wikipedia articles",
  openGraph: {
    title: "Wiki Anki",
    description: "Generate Anki flashcards from Wikipedia articles",
    url: "https://wiki-anki.vercel.app",
    siteName: "Wiki Anki",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8FAFC" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});
const merriweather = Merriweather({
  subsets: ["latin"],
  weight: ["400", "700", "900"],
  variable: "--font-merriweather",
});

export default function RootLayout(props: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          "bg-background text-foreground min-h-screen font-sans antialiased",
          inter.variable,
          merriweather.variable,
        )}
      >
        <ThemeProvider>
          <TRPCReactProvider>{props.children}</TRPCReactProvider>
          <div className="absolute right-4 bottom-4">
            <ThemeToggle />
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
