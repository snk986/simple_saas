import { Toaster } from "@/components/ui/toaster";
import { baseUrl } from "@/lib/i18n/urls";
import "./globals.css";

export const metadata = {
  metadataBase: new URL(baseUrl),
  title: "Calyra AI - Create AI Music from Text",
  description:
    "Create AI songs from prompts, lyrics, and simple ideas with vocals and instruments.",
  openGraph: {
    title: "Calyra AI",
    description:
      "Create AI songs from prompts, lyrics, and simple ideas with vocals and instruments.",
    type: "website",
    url: baseUrl,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className="bg-background text-foreground" suppressHydrationWarning>
        <div className="relative min-h-screen flex flex-col">{children}</div>
        <Toaster />
      </body>
    </html>
  );
}
