"use client"

import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

interface ServerAlert {
  id: string
  serverName: string
  message: string
  severity: "critical" | "warning" | "info"
  timestamp: string
}

interface ServerData {
  id: string
  name: string
  type: string
  status: string
  ip: string
  hasAlerts: boolean
}

export function AlertBar() {
  const [alerts, setAlerts] = useState<ServerAlert[]>([])
  const [servers, setServers] = useState<ServerData[]>([])

  // Fetch servers to generate alerts
  useEffect(() => {
    const fetchServers = async () => {
      try {
        const response = await fetch("https://murat.inseres.com/sunucu/ipAdresleri", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        const result = await response.json()

        if (result.status === "success") {
          // Transform the API response into our server data format
          const serverData: ServerData[] = Object.entries(result.data).map(([ip, name], index) => {
            // Generate random status for demo purposes
            const statuses = ["online", "warning", "offline"]
            const randomStatusIndex = Math.floor(Math.random() * 10)
            const status = randomStatusIndex < 7 ? "online" : randomStatusIndex < 9 ? "warning" : "offline"

            return {
              id: (index + 1).toString(),
              name: name as string,
              type: "web",
              status,
              ip,
              hasAlerts: status === "warning",
            }
          })

          setServers(serverData)

          // Generate alerts for servers with warning status
          const newAlerts: ServerAlert[] = serverData
            .filter((server) => server.status === "warning" || server.status === "offline")
            .map((server) => {
              const alertMessages = [
                "CPU kullanımı %90'ın üzerinde!",
                "Disk alanı %85 dolu",
                "Bellek kullanımı yüksek",
                "Bağlantı zaman aşımına uğradı",
                "Servis yanıt vermiyor",
              ]

              return {
                id: server.id,
                serverName: server.name,
                message: alertMessages[Math.floor(Math.random() * alertMessages.length)],
                severity: server.status === "offline" ? "critical" : "warning",
                timestamp: new Date().toISOString(),
              }
            })

          setAlerts(newAlerts)
        }
      } catch (error) {
        console.error("Error fetching servers for alerts:", error)
      }
    }

    fetchServers()
  }, [])

  if (alerts.length === 0) {
    return null
  }

  return (
    <div className="bg-gray-100 py-2 border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {alerts.map((alert) => (
            <Alert
              key={alert.id}
              variant={
                alert.severity === "critical" ? "destructive" : alert.severity === "warning" ? "default" : "outline"
              }
              className="flex-shrink-0 w-auto max-w-md"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle className="ml-2">{alert.serverName}</AlertTitle>
              <AlertDescription className="ml-2">{alert.message}</AlertDescription>
            </Alert>
          ))}
        </div>
      </div>
    </div>
  )
}
