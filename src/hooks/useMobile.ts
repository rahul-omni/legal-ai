import { useMobileContext } from '@/context/mobileContext';

export const useMobile = () => {
  const { isMobile, isTablet, isDesktop, screenWidth, breakpoint } = useMobileContext();
  
  return {
    isMobile,
    isTablet,
    isDesktop,
    screenWidth,
    breakpoint,
  };
};
