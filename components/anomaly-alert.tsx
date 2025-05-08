"use client"

import { useState, useEffect } from "react"
import { AlertTriangle, X, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import Link from "next/link"

interface AnomalyAlertProps {
  serverId: string
  serverIp: string
  onDismiss?: () => void
}

interface AnomalyData {
  anomali: number
  data: {
    systemInfo: {
      RecentSysLogs: {
        Message: string
        Time: string
        Host: string
        Date: string
      }[]
    }
    ip: string
    timestamp: string
  }
}

export function AnomalyAlert({ serverId, serverIp, onDismiss }: AnomalyAlertProps) {
  const [anomalyData, setAnomalyData] = useState<AnomalyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const fetchAnomalyData = async () => {
      try {
        const response = await fetch("https://murat.inseres.com/sunucu/anomaliDatalar", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ ip: serverIp }),
        })

        const result = await response.json()
        if (result.status === "success" && result.data && result.data.length > 0) {
          setAnomalyData(result.data[0])
        }
      } catch (error) {
        console.error("Error fetching anomaly data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (serverIp) {
      fetchAnomalyData()
    }
  }, [serverIp])

  const handleDismiss = () => {
    setDismissed(true)
    if (onDismiss) {
      onDismiss()
    }
  }

  if (dismissed || loading || !anomalyData) {
    return null
  }

  // Extract failed login attempts from logs
  const failedLoginAttempts = anomalyData.data.systemInfo.RecentSysLogs.filter(
    (log) =>
      log.Message.includes("Failed password") ||
      log.Message.includes("authentication failure") ||
      log.Message.includes("Invalid user"),
  )

  // Get unique IPs from failed login attempts
  const suspiciousIPs = [
    ...new Set(
      failedLoginAttempts
        .map((log) => {
          const ipMatch = log.Message.match(/from\s+(\d+\.\d+\.\d+\.\d+)/)
          return ipMatch ? ipMatch[1] : null
        })
        .filter(Boolean),
    ),
  ]

  return (
    <Card className="mb-6 bg-red-50 border-red-200 p-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-red-800">Güvenlik Anomalisi Tespit Edildi!</h3>
            <p className="text-sm text-red-700 mt-1">
              {failedLoginAttempts.length > 0
                ? `${failedLoginAttempts.length} başarısız giriş denemesi tespit edildi. ${suspiciousIPs.length} şüpheli IP adresi.`
                : "Sistem loglarında anormal aktivite tespit edildi."}
            </p>
            <div className="mt-2">
              <Link href={`/dashboard/server/${serverId}/anomalies`}>
                <Button variant="outline" size="sm" className="bg-white text-red-700 border-red-300 hover:bg-red-100">
                  <Shield className="h-4 w-4 mr-1" /> Detayları Görüntüle
                </Button>
              </Link>
            </div>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDismiss}
          className="text-red-700 hover:bg-red-100 hover:text-red-800"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Kapat</span>
        </Button>
      </div>
    </Card>
  )
}
