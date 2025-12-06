
'use client';

import { useState, useEffect } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    // Ensure this code runs only on the client
    if (typeof window === 'undefined') {
        return;
    }

    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Initial check on mount
    checkIsMobile();

    // Listen for window resize
    window.addEventListener('resize', checkIsMobile);
    
    // Cleanup listener on unmount
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  return isMobile;
}
