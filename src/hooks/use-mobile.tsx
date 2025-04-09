
import React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Check immediately on mount
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    
    // Add event listener
    mql.addEventListener("change", onChange)
    
    // Clean up
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return isMobile
}
