"use client"

import type React from "react"

import { createContext, useContext, useState } from "react"

interface Anomaly {
  serverId: string
  serverName: string
  serverIp: string
  count: number
  type: string
}

interface AnomalyContextType {
  anomalies: Anomaly[]
  setAnomalies: React.Dispatch<React.SetStateAction<Anomaly[]>>
}

export const AnomalyContext = createContext<AnomalyContextType | undefined>(undefined)

export function AnomalyProvider({ children }: { children: React.ReactNode }) {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([])

  return <AnomalyContext.Provider value={{ anomalies, setAnomalies }}>{children}</AnomalyContext.Provider>
}

export function useAnomalies() {
  const context = useContext(AnomalyContext)
  if (context === undefined) {
    throw new Error("useAnomalies must be used within an AnomalyProvider")
  }
  return context
}
