import type { Metadata } from "next";
import { App } from "./_app";
import "./globals.css";

export const metadata: Metadata = {
  title: "Legal Document Platform",
  description: "AI-powered legal document platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!typeof window) return null;

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Lobster&family=Montserrat:wght@400;600&family=Open+Sans:wght@400;600&family=Oswald:wght@400;600&family=Pacifico&family=Playfair+Display:wght@400;700&family=Raleway:wght@400;600&family=Roboto+Slab:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <App children={children} />
      </body>
    </html>
  );
}
