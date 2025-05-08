"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { ArrowLeft, Shield, AlertTriangle, User, Globe } from "lucide-react"

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
      RunningProcesses: {
        Processes: {
          User: string
          RSS: string
          Stat: string
          Command: string
          TTY: string
          StartTime: string
          CPUUsage: string
          PID: string
          VSZ: string
          MemUsage: string
          CPUTime: string
        }[]
      }
      OpenPorts: {
        Recv_Q: string
        LocalAddress: string
        State: string
        Send_Q: string
        Process: string
        Protocol: string
      }[]
      LastLogins: {
        User: string
        IP: string
        Duration: string
        Terminal: string
        Date: string
        Session: string
      }[]
      IPTablesRules: {
        Rules: string
      }
    }
    ip: string
    timestamp: string
    dockerInfo: {
      DockerSystemEvents: any[]
      DockerContainerStatus: any[]
      DockerErrorLogs: any[]
    }
    tomcatInfo: {
      TomcatLogs: any[]
    }
    nginxInfo: {
      NginxLogs: any[]
    }
    elasticsearchInfo: {
      ElasticsearchShardInfo: any[]
    }
    mySQLInfo: {
      MySQLErrorLog: any[]
    }
  }
  ip: string
  elastic_id: string
  timestamp: string
}

export default function AnomaliesPage() {
  const params = useParams()
  const serverId = params.id as string
  const [serverIp, setServerIp] = useState<string>("")
  const [anomalyData, setAnomalyData] = useState<AnomalyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const fetchServerIp = async () => {
      try {
        const serversResponse = await fetch("https://murat.inseres.com/sunucu/ipAdresleri", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        const serversResult = await serversResponse.json()

        if (serversResult.status === "success") {
          const serverEntries = Object.entries(serversResult.data)
          if (serverEntries.length >= Number.parseInt(serverId) && Number.parseInt(serverId) > 0) {
            const index = Number.parseInt(serverId) - 1
            const [ip, name] = serverEntries[index]
            setServerIp(ip)

            // Now fetch anomaly data
            const anomalyResponse = await fetch("https://murat.inseres.com/sunucu/anomaliDatalar", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ ip }),
            })

            const anomalyResult = await anomalyResponse.json()
            if (anomalyResult.status === "success" && anomalyResult.data && anomalyResult.data.length > 0) {
              setAnomalyData(anomalyResult.data[0])
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchServerIp()
  }, [serverId])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  if (!anomalyData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/dashboard/server/${serverId}`}>
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Güvenlik Anomalileri</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Anomali Bulunamadı</CardTitle>
            <CardDescription>Bu sunucu için herhangi bir güvenlik anomalisi tespit edilmedi.</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Sunucu güvenlik durumu normal görünüyor. Düzenli kontroller devam ediyor.</p>
            <Button variant="outline" className="mt-4" asChild>
              <Link href={`/dashboard/server/${serverId}`}>Sunucu Paneline Dön</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
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

  // Extract invalid users
  const invalidUsers = [
    ...new Set(
      failedLoginAttempts
        .map((log) => {
          const userMatch = log.Message.match(/invalid user (\S+)/)
          return userMatch ? userMatch[1] : null
        })
        .filter(Boolean),
    ),
  ]

  // Find suspicious processes (high CPU or memory usage)
  const suspiciousProcesses = anomalyData.data.systemInfo.RunningProcesses.Processes.filter(
    (process) => Number.parseFloat(process.CPUUsage) > 50 || Number.parseFloat(process.MemUsage) > 50,
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/dashboard/server/${serverId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-red-600" />
          <h1 className="text-3xl font-bold tracking-tight">Güvenlik Anomalileri</h1>
        </div>
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <AlertTriangle className="h-3 w-3 mr-1" /> Kritik
        </Badge>
      </div>

      <Card className="bg-red-50 border-red-200">
        <CardHeader>
          <CardTitle className="text-red-800">Anomali Özeti</CardTitle>
          <CardDescription className="text-red-700">
            {new Date(anomalyData.timestamp).toLocaleString("tr-TR")} tarihinde tespit edildi
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-red-200">
              <div className="text-3xl font-bold text-red-700">{failedLoginAttempts.length}</div>
              <div className="text-sm text-red-600 mt-1">Başarısız Giriş Denemesi</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-red-200">
              <div className="text-3xl font-bold text-red-700">{suspiciousIPs.length}</div>
              <div className="text-sm text-red-600 mt-1">Şüpheli IP Adresi</div>
            </div>
            <div className="flex flex-col items-center justify-center p-4 bg-white rounded-lg border border-red-200">
              <div className="text-3xl font-bold text-red-700">{invalidUsers.length}</div>
              <div className="text-sm text-red-600 mt-1">Geçersiz Kullanıcı</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview" className="space-y-4" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-4 md:w-[600px]">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="login-attempts">Giriş Denemeleri</TabsTrigger>
          <TabsTrigger value="processes">Şüpheli Süreçler</TabsTrigger>
          <TabsTrigger value="connections">Ağ Bağlantıları</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Anomali Tespiti</CardTitle>
              <CardDescription>Tespit edilen güvenlik anomalileri ve potansiyel tehditler</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {failedLoginAttempts.length > 0 && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-red-600" />
                      <h3 className="font-medium text-red-800">Başarısız Giriş Denemeleri</h3>
                    </div>
                    <p className="text-sm text-red-700">
                      {failedLoginAttempts.length} başarısız giriş denemesi tespit edildi. Bu, brute force saldırısı
                      girişimi olabilir.
                    </p>
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white text-red-700 border-red-300 hover:bg-red-100"
                        onClick={() => setActiveTab("login-attempts")}
                      >
                        Detayları Görüntüle
                      </Button>
                    </div>
                  </div>
                )}

                {suspiciousProcesses.length > 0 && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <h3 className="font-medium text-yellow-800">Yüksek Kaynak Kullanımı</h3>
                    </div>
                    <p className="text-sm text-yellow-700">
                      {suspiciousProcesses.length} süreç anormal yüksek kaynak kullanımı gösteriyor. Bu, kötü amaçlı
                      yazılım aktivitesi olabilir.
                    </p>
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                        onClick={() => setActiveTab("processes")}
                      >
                        Detayları Görüntüle
                      </Button>
                    </div>
                  </div>
                )}

                {anomalyData.data.systemInfo.OpenPorts.length > 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Globe className="h-5 w-5 text-blue-600" />
                      <h3 className="font-medium text-blue-800">Açık Portlar</h3>
                    </div>
                    <p className="text-sm text-blue-700">
                      {anomalyData.data.systemInfo.OpenPorts.length} açık port tespit edildi. Beklenmeyen açık portlar
                      güvenlik riski oluşturabilir.
                    </p>
                    <div className="mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-white text-blue-700 border-blue-300 hover:bg-blue-100"
                        onClick={() => setActiveTab("connections")}
                      >
                        Detayları Görüntüle
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="login-attempts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Başarısız Giriş Denemeleri</CardTitle>
              <CardDescription>Şüpheli giriş denemeleri ve hedeflenen kullanıcılar</CardDescription>
            </CardHeader>
            <CardContent>
              {failedLoginAttempts.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Saat</TableHead>
                        <TableHead>Kullanıcı</TableHead>
                        <TableHead>IP Adresi</TableHead>
                        <TableHead>Mesaj</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {failedLoginAttempts.map((log, index) => {
                        const ipMatch = log.Message.match(/from\s+(\d+\.\d+\.\d+\.\d+)/)
                        const userMatch = log.Message.match(/user (\S+)/)

                        return (
                          <TableRow key={index}>
                            <TableCell>{log.Date}</TableCell>
                            <TableCell>{log.Time}</TableCell>
                            <TableCell>
                              {userMatch ? (
                                <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                                  <User className="h-3 w-3 mr-1" /> {userMatch[1]}
                                </Badge>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell>
                              {ipMatch ? (
                                <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                                  <Globe className="h-3 w-3 mr-1" /> {ipMatch[1]}
                                </Badge>
                              ) : (
                                "-"
                              )}
                            </TableCell>
                            <TableCell className="max-w-md truncate">{log.Message}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-4">Başarısız giriş denemesi bulunamadı.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Şüpheli IP Adresleri</CardTitle>
              <CardDescription>Başarısız giriş denemelerinde kullanılan IP adresleri</CardDescription>
            </CardHeader>
            <CardContent>
              {suspiciousIPs.length > 0 ? (
                <div className="grid gap-2 md:grid-cols-3">
                  {suspiciousIPs.map((ip, index) => (
                    <div
                      key={index}
                      className="p-3 border border-yellow-200 bg-yellow-50 rounded-md flex items-center gap-2"
                    >
                      <Globe className="h-4 w-4 text-yellow-600" />
                      <span className="text-yellow-800">{ip}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">Şüpheli IP adresi bulunamadı.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Şüpheli Süreçler</CardTitle>
              <CardDescription>Yüksek kaynak kullanımı gösteren süreçler</CardDescription>
            </CardHeader>
            <CardContent>
              {suspiciousProcesses.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>PID</TableHead>
                        <TableHead>Kullanıcı</TableHead>
                        <TableHead>CPU %</TableHead>
                        <TableHead>Bellek %</TableHead>
                        <TableHead>Başlangıç</TableHead>
                        <TableHead>Komut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {suspiciousProcesses.map((process, index) => (
                        <TableRow key={index}>
                          <TableCell>{process.PID}</TableCell>
                          <TableCell>{process.User}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${
                                Number.parseFloat(process.CPUUsage) > 80
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : Number.parseFloat(process.CPUUsage) > 50
                                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                    : "bg-green-50 text-green-700 border-green-200"
                              }`}
                            >
                              {process.CPUUsage}%
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${
                                Number.parseFloat(process.MemUsage) > 80
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : Number.parseFloat(process.MemUsage) > 50
                                    ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                    : "bg-green-50 text-green-700 border-green-200"
                              }`}
                            >
                              {process.MemUsage}%
                            </Badge>
                          </TableCell>
                          <TableCell>{process.StartTime}</TableCell>
                          <TableCell className="max-w-xs truncate">{process.Command}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-4">Şüpheli süreç bulunamadı.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ağ Bağlantıları</CardTitle>
              <CardDescription>Açık portlar ve aktif ağ bağlantıları</CardDescription>
            </CardHeader>
            <CardContent>
              {anomalyData.data.systemInfo.OpenPorts.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Protokol</TableHead>
                        <TableHead>Yerel Adres</TableHead>
                        <TableHead>Durum</TableHead>
                        <TableHead>Süreç</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {anomalyData.data.systemInfo.OpenPorts.map((port, index) => (
                        <TableRow key={index}>
                          <TableCell>{port.Protocol}</TableCell>
                          <TableCell>{port.LocalAddress}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={`${
                                port.State === "LISTEN"
                                  ? "bg-blue-50 text-blue-700 border-blue-200"
                                  : port.State === "ESTABLISHED"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : "bg-gray-50 text-gray-700 border-gray-200"
                              }`}
                            >
                              {port.State}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">{port.Process}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-4">Açık port bulunamadı.</div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Güvenlik Duvarı Kuralları</CardTitle>
              <CardDescription>IPTables güvenlik duvarı kuralları</CardDescription>
            </CardHeader>
            <CardContent>
              {anomalyData.data.systemInfo.IPTablesRules?.Rules ? (
                <div className="overflow-x-auto">
                  <pre className="bg-gray-100 p-4 rounded-md text-sm font-mono whitespace-pre-wrap">
                    {anomalyData.data.systemInfo.IPTablesRules.Rules}
                  </pre>
                </div>
              ) : (
                <div className="text-center py-4">Güvenlik duvarı kuralı bulunamadı.</div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
