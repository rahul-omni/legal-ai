import { ToastContainer } from "@/components/ui/toast";
import { LoadingProvider } from "@/context/loadingContext";
import { UserProvider } from "@/context/userContext";
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
      <body>
        <LoadingProvider>
          <UserProvider>
            <main>{children}</main>
          </UserProvider>
          <ToastContainer toasts={[]} />
        </LoadingProvider>
      </body>
    </html>
  );
}
