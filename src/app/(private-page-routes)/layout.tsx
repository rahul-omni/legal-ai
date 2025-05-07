import { RoleProvider } from "@/context/roleContext";
import { TabsProvider } from "@/context/tabsContext";
import type { Metadata } from "next";
import { SessionProvider } from "next-auth/react";
import PrivatePages from "./privatePages";

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
      <RoleProvider>
        <SessionProvider>
          <PrivatePages children={children} />
        </SessionProvider>
      </RoleProvider>
    </TabsProvider>
  );
}
