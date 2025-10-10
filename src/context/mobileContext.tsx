"use client";
import React, { createContext, ReactNode, useContext, useEffect, useState } from "react";

interface MobileContextProps {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  screenWidth: number;
  breakpoint: 'mobile' | 'tablet' | 'desktop';
}

const MobileContext = createContext<MobileContextProps | undefined>(undefined);

interface MobileProviderProps {
  children: ReactNode;
}

export const MobileProvider: React.FC<MobileProviderProps> = ({ children }) => {
  const [screenWidth, setScreenWidth] = useState(0);
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [breakpoint, setBreakpoint] = useState<'mobile' | 'tablet' | 'desktop'>('desktop');

  useEffect(() => {
    // Function to update screen size
    const updateScreenSize = () => {
      const width = window.innerWidth;
      setScreenWidth(width);
      
      const mobile = width < 768; // Tailwind's md breakpoint
      const tablet = width >= 768 && width < 1024; // Tailwind's lg breakpoint
      const desktop = width >= 1024;
      
      setIsMobile(mobile);
      setIsTablet(tablet);
      setIsDesktop(desktop);
      
      if (mobile) {
        setBreakpoint('mobile');
      } else if (tablet) {
        setBreakpoint('tablet');
      } else {
        setBreakpoint('desktop');
      }
    };

    // Set initial size
    updateScreenSize();

    // Add event listener
    window.addEventListener('resize', updateScreenSize);

    // Cleanup
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

  const value: MobileContextProps = {
    isMobile,
    isTablet,
    isDesktop,
    screenWidth,
    breakpoint,
  };

  return (
    <MobileContext.Provider value={value}>
      {children}
    </MobileContext.Provider>
  );
};

export const useMobileContext = () => {
  const context = useContext(MobileContext);
  if (!context) {
    throw new Error('useMobileContext must be used within a MobileProvider');
  }
  return context;
};
