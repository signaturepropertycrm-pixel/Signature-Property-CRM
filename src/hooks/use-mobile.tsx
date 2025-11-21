'use client';

import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState(true);

  React.useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Initial check
    checkIsMobile();

    window.addEventListener('resize', checkIsMobile);
    
    // Cleanup listener
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}
