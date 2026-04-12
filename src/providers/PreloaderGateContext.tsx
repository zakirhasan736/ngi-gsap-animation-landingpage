'use client'

import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

type PreloaderGateContextValue = {
  isPreloaderActive: boolean
  setPreloaderActive: (active: boolean) => void
}

const PreloaderGateContext = createContext<PreloaderGateContextValue | null>(null)

export function PreloaderGateProvider({ children }: { children: ReactNode }) {
  const [isPreloaderActive, setPreloaderActive] = useState(false)

  const value = useMemo(() => ({ isPreloaderActive, setPreloaderActive }), [isPreloaderActive])

  return <PreloaderGateContext.Provider value={value}>{children}</PreloaderGateContext.Provider>
}

export function usePreloaderGate() {
  const ctx = useContext(PreloaderGateContext)
  if (!ctx) {
    return {
      isPreloaderActive: false,
      setPreloaderActive: () => {},
    }
  }
  return ctx
}
