import { Navigation } from "@/components/Navigation";
import { TabsProvider } from "@/context/tabsContext";
import type { Metadata } from "next";

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
    <TabsProvider>
      <div className="flex">
        <Navigation />
        <div className="flex-1">{children}</div>
      </div>
    </TabsProvider>
  );
}
