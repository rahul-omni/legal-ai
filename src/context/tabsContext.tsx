"use client";

import { FileSystemNodeProps } from "@/types/fileSystem";
import { createContext, useContext, useState, ReactNode, useMemo, useCallback } from "react";

interface TabInfo {
  id: string;
  fileId: string | null;
  name: string;
  content: string;
  isUnsaved: boolean;
}

interface TabsContextType {
  openTabs: TabInfo[];
  activeTabId: string | null;
  openFileInTab: (file: FileSystemNodeProps) => void;
  closeTab: (tabId: string) => void;
  updateTabContent: (tabId: string, content: string) => void;
  setActiveTabId: (tabId: string | null) => void;
  activeTabContent: string; // Direct access to active content
  getTabContent: (tabId: string) => string; // Helper function
  createNewTab: () => void; // ⬅️ NEW
  //updateTabName: (tabId: string, newName: string) => void;
  //updateTabName: (tabId: string, updates: Partial<TabInfo>) => void; //
  updateTabName: (tabId: string, name: string, fileId?: string) => void;


}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export function TabsProvider({ children }: { children: ReactNode }) {
  const [openTabs, setOpenTabs] = useState<TabInfo[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);

  // Derive active content directly
  const activeTabContent = useMemo(() => {
    const tab = openTabs.find(t => t.id === activeTabId);
    return tab?.content || '';
  }, [openTabs, activeTabId]);


  // const getTabContent = (tabId: string) => {
  //   return openTabs.find(t => t.id === tabId)?.content || '';
  // };
  const getTabContent = useCallback((tabId: string) => {
    return openTabs.find(t => t.id === tabId)?.content || '';
  }, [openTabs]);

  const updateTabContent = useCallback((tabId: string, content: string) => {
    setOpenTabs(prev => prev.map(tab =>
      tab.id === tabId
        ? { ...tab, content, isUnsaved: true, lastUpdated: Date.now() }
        : tab
    ));
  }, []);
  const openFileInTab = (file: FileSystemNodeProps) => {
    const existingTab = openTabs.find(tab => tab.fileId === file.id);
    if (existingTab) {
      setActiveTabId(existingTab.id);
      return;
    }

    const newTab: TabInfo = {
      id: `tab-${Date.now()}`,
      fileId: file.id,
      name: file.name,
      content: file.content || '',
      isUnsaved: false
    };

    setOpenTabs(prev => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };

  const closeTab = (tabId: string) => {
    const tabToClose = openTabs.find(tab => tab.id === tabId);
    if (tabToClose?.isUnsaved) {
      const confirmed = window.confirm('You have unsaved changes. Do you want to close this tab?');
      if (!confirmed) return;
    }

    setOpenTabs(prev => prev.filter(tab => tab.id !== tabId));
    if (activeTabId === tabId) {
      const remainingTabs = openTabs.filter(tab => tab.id !== tabId);
      if (remainingTabs.length > 0) {
        const tabIndex = openTabs.findIndex(tab => tab.id === tabId);
        const newActiveTab = remainingTabs[Math.max(0, tabIndex - 1)];
        setActiveTabId(newActiveTab.id);
      } else {
        setActiveTabId(null);
      }
    }
  };

 
  const createNewTab = () => {
    const newTab: TabInfo = {
      id: `temp-${Date.now()}`,
      fileId: null,
      name: "Untitled Document",
      content: "",
      isUnsaved: true,
    };
  
    setOpenTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  };
  
 
  const updateTabName = useCallback((tabId: string, name: string, fileId?: string) => {
    setOpenTabs(prev =>
      prev.map(tab =>
        tab.id === tabId
          ? { ...tab, name, fileId: fileId ?? tab.fileId, isUnsaved: false }
          : tab
      )
    );
  }, []);
  
  return (
    <TabsContext.Provider value={{
      openTabs,
      activeTabId,
      openFileInTab,
      closeTab,
      activeTabContent,
      updateTabName,
      createNewTab,
      updateTabContent,
      getTabContent,
      setActiveTabId,
    }}>
      {children}
    </TabsContext.Provider>
  );
}

export function useTabs() {
  const context = useContext(TabsContext);
  if (context === undefined) {
    throw new Error('useTabs must be used within a TabsProvider');
  }
  return context;
} 