'use client'

import { useState, useEffect } from 'react'

export function useIsIOS(): boolean {
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIOSDevice = /iphone|ipad|ipod/.test(userAgent) || 
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    
    setIsIOS(isIOSDevice)
  }, [])

  return isIOS
}

