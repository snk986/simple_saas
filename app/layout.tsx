import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const baseUrl = process.env.BASE_URL ?? "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: "Hit-Song — Turn Your Story Into a Hit Song",
  description: "Share your story, get professional AI-generated lyrics and music in minutes.",
  openGraph: {
    title: "Hit-Song",
    description: "Share your story, get professional AI-generated lyrics and music in minutes.",
    type: "website",
    url: baseUrl,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-background text-foreground" suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="relative min-h-screen flex flex-col">
            {children}
          </div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
