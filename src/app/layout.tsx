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
    <html lang="en">
      <body suppressHydrationWarning>
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
