import { Navigation } from "@/components/Navigation";
import { ToastContainer } from "@/components/ui/toast";
import { LoadingProvider } from "@/context/loadingContext";
import type { Metadata } from "next";
import "./globals.css";
import { TabsProvider } from "@/context/tabsContext";

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
      <body className="flex">
        <LoadingProvider>
          <TabsProvider>
            <Navigation />
            <main className="flex-1">{children}</main>
            <ToastContainer toasts={[]} />
          </TabsProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
