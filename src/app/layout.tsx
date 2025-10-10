import { LoadingProvider } from "@/context/loadingContext";
import { UserProvider } from "@/context/userContext";
import { MobileProvider } from "@/context/mobileContext";
import { Toaster } from "react-hot-toast";
import type { Metadata } from "next";
import { Nunito_Sans } from "next/font/google";
import "./globals.css";

const nunitoSans = Nunito_Sans({
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
  variable: "--font-nunito-sans",
  display: "swap",
});

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
      <body className={nunitoSans.className}>
        <Toaster
          position="top-right"
          toastOptions={{ success: { duration: 4000 } }}
        />
        <LoadingProvider>
          <UserProvider>
            <MobileProvider>
              <main>{children}</main>
            </MobileProvider>
          </UserProvider>
        </LoadingProvider>
      </body>
    </html>
  );
}
