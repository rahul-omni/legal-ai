import { LoadingProvider } from "@/context/loadingContext";
import { UserProvider } from "@/context/userContext";
import { Toaster } from "react-hot-toast";
import type { Metadata } from "next";
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
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Dancing+Script:wght@400;700&family=Lobster&family=Montserrat:wght@400;600&family=Open+Sans:wght@400;600&family=Oswald:wght@400;600&family=Pacifico&family=Playfair+Display:wght@400;700&family=Raleway:wght@400;600&family=Roboto+Slab:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <Toaster
          position="top-right"
          toastOptions={{ success: { duration: 4000 } }}
        />
        <LoadingProvider>
          <UserProvider>
            <main>{children}</main>
          </UserProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
