import { useState, useEffect } from "react";

/**
 * Returns responsive breakpoint flags.
 * isMobile  : width < 768px   (phones)
 * isTablet  : width < 1024px  (phones + tablets)
 * width     : current window width in px
 */
export function useBreakpoint() {
  const [width, setWidth] = useState(
    typeof window !== "undefined" ? window.innerWidth : 1280
  );

  useEffect(() => {
    function onResize() {
      setWidth(window.innerWidth);
    }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return {
    isMobile: width < 768,
    isTablet: width < 1024,
    width,
  };
}
