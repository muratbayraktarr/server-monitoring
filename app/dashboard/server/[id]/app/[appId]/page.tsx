"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  Server,
  Database,
  Globe,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Play,
  Square,
  Layers,
  Box,
  Coffee,
  Search,
  HardDrive,
  User,
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

interface Application {
  id: string
  name: string
  icon: string
  status: "running" | "stopped" | "error"
  version: string
  port: number
  description: string
  startTime: string
  memoryUsage: number
  cpuUsage: number
  logs: {
    timestamp: string
    level: "info" | "warning" | "error"
    message: string
  }[]
}

interface OpenPort {
  "Recv-Q": string
  LocalAddress: string
  State: string
  "Send-Q": string
  Process: string
  Protocol: string
}

interface RunningProcess {
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
}

interface LastLogin {
  User: string
  IP: string
  Duration: string
  Terminal: string
  Date: string
  Session: string
}

interface MySQLInfo {
  MySQLVersionAndSettings: {
    Version: string
  }
  MySQLDatabases: string[]
  MySQLErrorLog: string[]
  MySQLUsers: {
    User: string
    Host: string
  }[]
}

interface ElasticsearchInfo {
  ElasticsearchShardInfo: {
    prirep: string
    node: string | null
    docs: string | null
    ip: string | null
    index: string
    shard: string
    state: string
    store: string | null
  }[]
  ElasticsearchNodesInfo: {
    load_5m: string
    "node.role": string
    load_1m: string
    load_15m: string
    ip: string
    "ram.percent": string
    name: string
    cpu: string
    "heap.percent": string
    master: string
  }[]
  ElasticsearchResourceUsage: {
    cluster_name: string
    nodes: Record<
      string,
      {
        jvm: {
          mem: {
            heap_used_percent: number
            heap_used_in_bytes: number
            heap_max_in_bytes: number
          }
          uptime_in_millis: number
        }
        os: {
          mem: {
            used_percent: number
            total_in_bytes: number
          }
          cpu: {
            load_average: {
              "5m": number
              "15m": number
              "1m": number
            }
          }
        }
        name: string
        host: string
      }
    >
  }
  ElasticsearchIndexStats: {
    prim: string
    "pri.store.size": string
    "docs.deleted": string
    health: string
    index: string
    rep: string
    uuid: string
    "store.size": string
    status: string
    "docs.count": string
  }[]
  ElasticsearchClusterHealth: {
    status: string
    cluster_name: string
    active_shards: number
    active_primary_shards: number
    unassigned_shards: number
    number_of_nodes: number
    number_of_data_nodes: number
    active_shards_percent_as_number: number
  }
}

interface SystemMetrics {
  date: string
  freeRam: string
  totalRam: string
  cpuCores: string
  gpustatus: string
  cpuusage: string
  diskTotalSpace: string
  diskFreeSpace: string
}

export default function AppDetailPage() {
  const params = useParams()
  const serverId = params.id as string
  const appId = params.appId as string
  const [app, setApp] = useState<Application | null>(null)
  const [serverIp, setServerIp] = useState<string>("")
  const [openPorts, setOpenPorts] = useState<OpenPort[]>([])
  const [runningProcesses, setRunningProcesses] = useState<RunningProcess[]>([])
  const [lastLogins, setLastLogins] = useState<LastLogin[]>([])
  const [iptablesRules, setIptablesRules] = useState<string[]>([])
  const [mysqlInfo, setMysqlInfo] = useState<MySQLInfo | null>(null)
  const [elasticsearchInfo, setElasticsearchInfo] = useState<ElasticsearchInfo | null>(null)
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("info")
  const [isDataFetched, setIsDataFetched] = useState(false) // Add flag to prevent infinite fetching

  // Define standard applications
  const standardApps = {
    "1": { name: "Docker", icon: "box" },
    "2": { name: "Tomcat", icon: "server" },
    "3": { name: "System", icon: "layers" },
    "4": { name: "Nginx", icon: "globe" },
    "5": { name: "Elasticsearch", icon: "search" },
    "6": { name: "MySQL", icon: "database" },
  }

  useEffect(() => {
    // Skip if data is already fetched or if we're still loading
    if (isDataFetched) return

    const fetchAppDetails = async () => {
      setIsLoading(true)
      try {
        // First, fetch the server list to get the IP address
        const serversResponse = await fetch("https://murat.inseres.com/sunucu/ipAdresleri", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        })

        const serversResult = await serversResponse.json()

        if (serversResult.status === "success" && serversResult.data) {
          // Find the server by ID (index)
          const serverEntries = Object.entries(serversResult.data)
          if (serverEntries.length >= Number.parseInt(serverId) && Number.parseInt(serverId) > 0) {
            const index = Number.parseInt(serverId) - 1
            const [ip, name] = serverEntries[index]
            setServerIp(ip)

            // If this is the System app (id=3), fetch additional data
            if (appId === "3") {
              // Fetch open ports
              try {
                const portsResponse = await fetch("https://murat.inseres.com/sunucu/sunucuOpenPorts", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ ip }),
                })

                const portsResult = await portsResponse.json()
                if (portsResult.status === "success" || portsResult.data) {
                  setOpenPorts(portsResult.data || [])
                }
              } catch (error) {
                console.error("Error fetching open ports:", error)
              }

              // Fetch running processes
              try {
                const processesResponse = await fetch("https://murat.inseres.com/sunucu/sunucuRunningProcesses", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ ip }),
                })

                const processesResult = await processesResponse.json()
                if (processesResult.status === "success" || processesResult.data) {
                  setRunningProcesses(processesResult.data || [])
                }
              } catch (error) {
                console.error("Error fetching running processes:", error)
              }

              // Fetch last logins
              try {
                const loginsResponse = await fetch("https://murat.inseres.com/sunucu/sunucuLastLogins", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ ip }),
                })

                const loginsResult = await loginsResponse.json()
                if (loginsResult.status === "success" || loginsResult.data) {
                  setLastLogins(loginsResult.data || [])
                }
              } catch (error) {
                console.error("Error fetching last logins:", error)
              }

              // Fetch IPTables rules
              try {
                const iptablesResponse = await fetch("https://murat.inseres.com/sunucu/sunucuIPTablesRules", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ ip }),
                })

                const iptablesResult = await iptablesResponse.json()
                if (iptablesResult.status === "success" || iptablesResult.data) {
                  setIptablesRules(iptablesResult.data || [])
                }
              } catch (error) {
                console.error("Error fetching IPTables rules:", error)
              }
            }

            // If this is the MySQL app (id=6), fetch MySQL info
            if (appId === "6") {
              try {
                const mysqlResponse = await fetch("https://murat.inseres.com/sunucu/getMySQLInfo", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: JSON.stringify({ ip }),
                })

                const mysqlResult = await mysqlResponse.json()
                if (mysqlResult.status === "success" && mysqlResult.data) {
                  setMysqlInfo(mysqlResult.data)
                }
              } catch (error) {
                console.error("Error fetching MySQL info:", error)
              }
            }

            // If this is the Elasticsearch app (id=5), fetch Elasticsearch info
            if (appId === "5") {
              try {
                const elasticsearchResponse = await fetch(
                  "https://murat.inseres.com/sunucu/getElasticsearchShardInfo",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ ip }),
                  },
                )

                const elasticsearchResult = await elasticsearchResponse.json()
                if (elasticsearchResult.status === "success" && elasticsearchResult.data) {
                  setElasticsearchInfo(elasticsearchResult.data)
                }
              } catch (error) {
                console.error("Error fetching Elasticsearch info:", error)
              }
            }

            // Fetch system metrics for all apps
            try {
              const metricsResponse = await fetch("https://murat.inseres.com/sunucu/anasayfaSayisalDegerler", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({ ip }),
              })

              const metricsResult = await metricsResponse.json()
              if (metricsResult.status === "success" && metricsResult.data && metricsResult.data.length > 0) {
                setSystemMetrics(metricsResult.data[0])
              }
            } catch (error) {
              console.error("Error fetching system metrics:", error)
            }

            // Create mock app data based on the standard app
            const standardApp = standardApps[appId as keyof typeof standardApps] || {
              name: "Unknown Application",
              icon: "server",
            }

            const mockApp: Application = {
              id: appId,
              name: standardApp.name,
              icon: standardApp.icon,
              status: Math.random() > 0.8 ? "error" : "running",
              version:
                appId === "1"
                  ? "24.0.5"
                  : appId === "2"
                    ? "10.1.13"
                    : appId === "4"
                      ? "1.25.1"
                      : appId === "5"
                        ? "8.11.1"
                        : appId === "6"
                          ? mysqlInfo?.MySQLVersionAndSettings?.Version?.split("Ver ")[1]?.split(" for")[0] || "8.0.42"
                          : "1.0.0",
              port:
                appId === "1"
                  ? 2375
                  : appId === "2"
                    ? 8080
                    : appId === "4"
                      ? 80
                      : appId === "5"
                        ? 9200
                        : appId === "6"
                          ? 3306
                          : 0,
              description:
                appId === "1"
                  ? "Docker konteyner yönetim platformu"
                  : appId === "2"
                    ? "Apache Tomcat Java servlet konteyner"
                    : appId === "3"
                      ? "Sistem bilgileri ve izleme araçları"
                      : appId === "4"
                        ? "Nginx web sunucusu ve ters proxy"
                        : appId === "5"
                          ? "Elasticsearch arama ve analiz motoru"
                          : appId === "6"
                            ? "MySQL veritabanı sunucusu"
                            : "Uygulama açıklaması",
              startTime: new Date(Date.now() - Math.floor(Math.random() * 10000000)).toISOString(),
              memoryUsage: systemMetrics
                ? Math.round(
                    (Number.parseInt(systemMetrics.totalRam) - Number.parseInt(systemMetrics.freeRam)) / 1024 / 1024,
                  )
                : Math.floor(Math.random() * 1000) + 200,
              cpuUsage: systemMetrics ? Number.parseInt(systemMetrics.cpuusage) : Math.floor(Math.random() * 60) + 10,
              logs: [
                {
                  timestamp: new Date(Date.now() - 120000).toISOString(),
                  level: "info",
                  message: `${standardApp.name} başlatıldı.`,
                },
                {
                  timestamp: new Date(Date.now() - 90000).toISOString(),
                  level: "info",
                  message: `Port ${
                    appId === "1"
                      ? "2375"
                      : appId === "2"
                        ? "8080"
                        : appId === "4"
                          ? "80"
                          : appId === "5"
                            ? "9200"
                            : appId === "6"
                              ? "3306"
                              : "0"
                  } dinleniyor.`,
                },
                {
                  timestamp: new Date(Date.now() - 60000).toISOString(),
                  level: "warning",
                  message: `Yüksek bellek kullanımı tespit edildi: ${Math.floor(Math.random() * 80) + 20}%.`,
                },
                {
                  timestamp: new Date(Date.now() - 30000).toISOString(),
                  level: Math.random() > 0.8 ? "error" : "info",
                  message: Math.random() > 0.8 ? `${standardApp.name} hata verdi.` : "Sistem normal çalışıyor.",
                },
              ],
            }

            // If MySQL app, use real error logs if available
            if (appId === "6" && mysqlInfo?.MySQLErrorLog) {
              mockApp.logs = mysqlInfo.MySQLErrorLog.slice(0, 10).map((logEntry) => {
                const timestamp = logEntry.split(" ")[0]
                const level = logEntry.includes("[Warning]")
                  ? "warning"
                  : logEntry.includes("[Error]")
                    ? "error"
                    : "info"
                return {
                  timestamp: new Date(timestamp).toISOString(),
                  level,
                  message: logEntry.split("] ").slice(1).join("] "),
                }
              })
            }

            setApp(mockApp)
          } else {
            console.error("Server not found")
          }
        }
      } catch (error) {
        console.error("Error fetching application details:", error)
      } finally {
        setIsLoading(false)
        setIsDataFetched(true) // Mark data as fetched to prevent infinite loop
      }
    }

    fetchAppDetails()
  }, [serverId, appId, standardApps, isDataFetched]) // Add isDataFetched to dependencies

  // Handle refresh button click
  const handleRefresh = () => {
    setIsDataFetched(false) // Reset the flag to allow fetching again
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "running":
        return (
          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" /> Çalışıyor
          </Badge>
        )
      case "stopped":
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
            <Clock className="h-3 w-3 mr-1" /> Durduruldu
          </Badge>
        )
      case "error":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            <AlertTriangle className="h-3 w-3 mr-1" /> Hata
          </Badge>
        )
      default:
        return (
          <Badge variant="outline">
            <Clock className="h-3 w-3 mr-1" /> Bilinmiyor
          </Badge>
        )
    }
  }

  const getAppIcon = (icon: string) => {
    switch (icon) {
      case "globe":
        return <Globe className="h-5 w-5" />
      case "database":
        return <Database className="h-5 w-5" />
      case "server":
        return <Server className="h-5 w-5" />
      case "search":
        return <Search className="h-5 w-5" />
      case "box":
        return <Box className="h-5 w-5" />
      case "layers":
        return <Layers className="h-5 w-5" />
      case "coffee":
        return <Coffee className="h-5 w-5" />
      case "hard-drive":
        return <HardDrive className="h-5 w-5" />
      default:
        return <Server className="h-5 w-5" />
    }
  }

  const getLogLevelBadge = (level: string) => {
    switch (level) {
      case "info":
        return (
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Bilgi
          </Badge>
        )
      case "warning":
        return (
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            Uyarı
          </Badge>
        )
      case "error":
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
            Hata
          </Badge>
        )
      default:
        return <Badge variant="outline">Bilinmiyor</Badge>
    }
  }

  if (isLoading || !app) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/dashboard/server/${serverId}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex items-center gap-2">
          {getAppIcon(app.icon)}
          <h1 className="text-3xl font-bold tracking-tight">{app.name}</h1>
        </div>
        {app.id !== "3" && getStatusBadge(app.status)}
      </div>

      <div className="flex flex-wrap gap-4">
        <Button variant="outline" className="flex items-center gap-2" onClick={handleRefresh}>
          <RefreshCw className="h-4 w-4" />
          Yenile
        </Button>
        {app.id !== "3" && (
          <Button variant="outline" className="flex items-center gap-2">
            {app.status === "running" ? (
              <>
                <Square className="h-4 w-4" />
                Durdur
              </>
            ) : (
              <>
                <Play className="h-4 w-4" />
                Başlat
              </>
            )}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Uygulama Bilgileri</CardTitle>
          <CardDescription>{app.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              {app.id !== "3" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Versiyon:</span>
                    <span>{app.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Port:</span>
                    <span>{app.port}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Başlangıç Zamanı:</span>
                    <span>{new Date(app.startTime).toLocaleString("tr-TR")}</span>
                  </div>
                </>
              )}
              {app.id === "3" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">IP Adresi:</span>
                    <span>{serverIp}</span>
                  </div>
                  {systemMetrics && (
                    <>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CPU Çekirdekleri:</span>
                        <span>{systemMetrics.cpuCores}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">GPU Durumu:</span>
                        <span>{systemMetrics.gpustatus}</span>
                      </div>
                    </>
                  )}
                </>
              )}
              {app.id === "6" && mysqlInfo && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Veritabanı Sayısı:</span>
                  <span>{mysqlInfo.MySQLDatabases.length}</span>
                </div>
              )}
              {app.id === "5" && elasticsearchInfo && elasticsearchInfo.ElasticsearchClusterHealth && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Küme Durumu:</span>
                  <Badge
                    variant="outline"
                    className={`${
                      elasticsearchInfo.ElasticsearchClusterHealth.status === "green"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : elasticsearchInfo.ElasticsearchClusterHealth.status === "yellow"
                          ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                          : "bg-red-50 text-red-700 border-red-200"
                    }`}
                  >
                    {elasticsearchInfo.ElasticsearchClusterHealth.status}
                  </Badge>
                </div>
              )}
            </div>
            <div className="space-y-2">
              {app.id !== "3" && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Bellek Kullanımı:</span>
                    <span>{app.memoryUsage} MB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CPU Kullanımı:</span>
                    <span>{app.cpuUsage}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Durum:</span>
                    <span>
                      {app.status === "running" ? "Çalışıyor" : app.status === "stopped" ? "Durduruldu" : "Hata"}
                    </span>
                  </div>
                </>
              )}
              {app.id === "3" && systemMetrics && (
                <>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Toplam RAM:</span>
                    <span>{(Number.parseInt(systemMetrics.totalRam) / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Boş RAM:</span>
                    <span>{(Number.parseInt(systemMetrics.freeRam) / 1024 / 1024 / 1024).toFixed(2)} GB</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Disk Alanı:</span>
                    <span>
                      {systemMetrics.diskFreeSpace} GB / {systemMetrics.diskTotalSpace} GB
                    </span>
                  </div>
                </>
              )}
              {app.id === "6" && mysqlInfo && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kullanıcı Sayısı:</span>
                  <span>{mysqlInfo.MySQLUsers.length}</span>
                </div>
              )}
              {app.id === "5" && elasticsearchInfo && elasticsearchInfo.ElasticsearchIndexStats && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">İndeks Sayısı:</span>
                  <span>{elasticsearchInfo.ElasticsearchIndexStats.length}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {app.id === "3" ? (
        <Tabs defaultValue="ports" className="space-y-4" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 md:w-[500px]">
            <TabsTrigger value="ports">Açık Portlar</TabsTrigger>
            <TabsTrigger value="processes">Çalışan Süreçler</TabsTrigger>
            <TabsTrigger value="logins">Son Girişler</TabsTrigger>
            <TabsTrigger value="firewall">Güvenlik Duvarı</TabsTrigger>
          </TabsList>

          <TabsContent value="ports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Açık Portlar</CardTitle>
                <CardDescription>Sunucudaki açık portlar ve bağlantılar</CardDescription>
              </CardHeader>
              <CardContent>
                {openPorts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Protokol</TableHead>
                          <TableHead>Yerel Adres</TableHead>
                          <TableHead>Durum</TableHead>
                          <TableHead>Send-Q</TableHead>
                          <TableHead>Recv-Q</TableHead>
                          <TableHead>Süreç</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {openPorts.map((port, index) => (
                          <TableRow key={index}>
                            <TableCell>{port.Protocol}</TableCell>
                            <TableCell>{port.LocalAddress}</TableCell>
                            <TableCell>{port.State}</TableCell>
                            <TableCell>{port["Send-Q"]}</TableCell>
                            <TableCell>{port["Recv-Q"]}</TableCell>
                            <TableCell className="max-w-xs truncate">{port.Process}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-4">Açık port bulunamadı veya veri alınamadı.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="processes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Çalışan Süreçler</CardTitle>
                <CardDescription>Sunucuda çalışan aktif süreçler</CardDescription>
              </CardHeader>
              <CardContent>
                {runningProcesses.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>PID</TableHead>
                          <TableHead>Kullanıcı</TableHead>
                          <TableHead>CPU %</TableHead>
                          <TableHead>Bellek %</TableHead>
                          <TableHead>VSZ</TableHead>
                          <TableHead>RSS</TableHead>
                          <TableHead>Başlangıç</TableHead>
                          <TableHead>Komut</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {runningProcesses.map((process, index) => (
                          <TableRow key={index}>
                            <TableCell>{process.PID}</TableCell>
                            <TableCell>{process.User}</TableCell>
                            <TableCell>{process.CPUUsage}</TableCell>
                            <TableCell>{process.MemUsage}</TableCell>
                            <TableCell>{process.VSZ}</TableCell>
                            <TableCell>{process.RSS}</TableCell>
                            <TableCell>{process.StartTime}</TableCell>
                            <TableCell className="max-w-xs truncate">{process.Command}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-4">Çalışan süreç bulunamadı veya veri alınamadı.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logins" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Son Girişler</CardTitle>
                <CardDescription>Sunucuya yapılan son giriş kayıtları</CardDescription>
              </CardHeader>
              <CardContent>
                {lastLogins.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kullanıcı</TableHead>
                          <TableHead>IP Adresi</TableHead>
                          <TableHead>Tarih</TableHead>
                          <TableHead>Terminal</TableHead>
                          <TableHead>Oturum</TableHead>
                          <TableHead>Süre</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lastLogins.map((login, index) => (
                          <TableRow key={index}>
                            <TableCell>{login.User}</TableCell>
                            <TableCell>{login.IP}</TableCell>
                            <TableCell>{login.Date}</TableCell>
                            <TableCell>{login.Terminal}</TableCell>
                            <TableCell>{login.Session}</TableCell>
                            <TableCell>{login.Duration}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-4">Giriş kaydı bulunamadı veya veri alınamadı.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="firewall" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Güvenlik Duvarı Kuralları</CardTitle>
                <CardDescription>IPTables güvenlik duvarı kuralları</CardDescription>
              </CardHeader>
              <CardContent>
                {iptablesRules.length > 0 ? (
                  <div className="overflow-x-auto">
                    <pre className="bg-gray-100 p-4 rounded-md text-sm font-mono whitespace-pre-wrap">
                      {iptablesRules.join("\n")}
                    </pre>
                  </div>
                ) : (
                  <div className="text-center py-4">Güvenlik duvarı kuralı bulunamadı veya veri alınamadı.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : app.id === "6" ? (
        <Tabs defaultValue="databases" className="space-y-4">
          <TabsList>
            <TabsTrigger value="databases">Veritabanları</TabsTrigger>
            <TabsTrigger value="users">Kullanıcılar</TabsTrigger>
            <TabsTrigger value="logs">Hata Logları</TabsTrigger>
            <TabsTrigger value="metrics">Metrikler</TabsTrigger>
          </TabsList>

          <TabsContent value="databases" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>MySQL Veritabanları</CardTitle>
                <CardDescription>Sunucudaki MySQL veritabanları</CardDescription>
              </CardHeader>
              <CardContent>
                {mysqlInfo && mysqlInfo.MySQLDatabases && mysqlInfo.MySQLDatabases.length > 0 ? (
                  <div className="grid gap-2 md:grid-cols-3">
                    {mysqlInfo.MySQLDatabases.map((database, index) => (
                      <div
                        key={index}
                        className="p-3 border rounded-md hover:bg-gray-50 transition-colors flex items-center gap-2"
                      >
                        <Database className="h-4 w-4 text-blue-500" />
                        <span>{database}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">Veritabanı bulunamadı veya veri alınamadı.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>MySQL Kullanıcıları</CardTitle>
                <CardDescription>Veritabanı kullanıcıları ve erişim izinleri</CardDescription>
              </CardHeader>
              <CardContent>
                {mysqlInfo && mysqlInfo.MySQLUsers && mysqlInfo.MySQLUsers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Kullanıcı Adı</TableHead>
                          <TableHead>Host</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {mysqlInfo.MySQLUsers.map((user, index) => (
                          <TableRow key={index}>
                            <TableCell className="flex items-center gap-2">
                              <User className="h-4 w-4 text-blue-500" />
                              {user.User}
                            </TableCell>
                            <TableCell>{user.Host}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-4">Kullanıcı bulunamadı veya veri alınamadı.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>MySQL Hata Logları</CardTitle>
                <CardDescription>Son MySQL hata ve uyarı logları</CardDescription>
              </CardHeader>
              <CardContent>
                {mysqlInfo && mysqlInfo.MySQLErrorLog && mysqlInfo.MySQLErrorLog.length > 0 ? (
                  <div className="space-y-4">
                    {mysqlInfo.MySQLErrorLog.map((log, index) => (
                      <div key={index} className="flex flex-col space-y-1 border-b pb-2 last:border-0">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">{log.split(" ")[0]}</span>
                          {log.includes("[Warning]") ? (
                            <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              Uyarı
                            </Badge>
                          ) : log.includes("[Error]") ? (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              Hata
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                              Bilgi
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{log}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">Log kaydı bulunamadı veya veri alınamadı.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performans Metrikleri</CardTitle>
                <CardDescription>MySQL performans grafikleri</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium mb-2">Sorgu Performansı</h3>
                    <div className="h-[200px] bg-gray-100 rounded-md flex items-end p-2">
                      {Array.from({ length: 24 }).map((_, i) => {
                        const height = Math.floor(Math.random() * 80) + 20
                        return (
                          <div key={i} className="flex-1 mx-1" style={{ height: `${height}%` }}>
                            <div
                              className={`w-full h-full rounded-sm ${
                                height > 80 ? "bg-red-500" : height > 60 ? "bg-yellow-500" : "bg-blue-500"
                              }`}
                            ></div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>24 saat önce</span>
                      <span>Şimdi</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Bağlantı Sayısı</h3>
                    <div className="h-[200px] bg-gray-100 rounded-md flex items-end p-2">
                      {Array.from({ length: 24 }).map((_, i) => {
                        const height = Math.floor(Math.random() * 80) + 20
                        return (
                          <div key={i} className="flex-1 mx-1" style={{ height: `${height}%` }}>
                            <div
                              className={`w-full h-full rounded-sm ${
                                height > 80 ? "bg-red-500" : height > 60 ? "bg-yellow-500" : "bg-green-500"
                              }`}
                            ></div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>24 saat önce</span>
                      <span>Şimdi</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : app.id === "5" ? (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
            <TabsTrigger value="indices">İndeksler</TabsTrigger>
            <TabsTrigger value="shards">Shardlar</TabsTrigger>
            <TabsTrigger value="nodes">Düğümler</TabsTrigger>
            <TabsTrigger value="logs">Loglar</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Elasticsearch Küme Durumu</CardTitle>
                <CardDescription>Elasticsearch kümesinin genel durumu</CardDescription>
              </CardHeader>
              <CardContent>
                {elasticsearchInfo?.ElasticsearchClusterHealth ? (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-medium">Küme Durumu:</span>
                      <Badge
                        variant="outline"
                        className={`${
                          elasticsearchInfo.ElasticsearchClusterHealth.status === "green"
                            ? "bg-green-50 text-green-700 border-green-200"
                            : elasticsearchInfo.ElasticsearchClusterHealth.status === "yellow"
                              ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                              : "bg-red-50 text-red-700 border-red-200"
                        }`}
                      >
                        {elasticsearchInfo.ElasticsearchClusterHealth.status === "green"
                          ? "Sağlıklı"
                          : elasticsearchInfo.ElasticsearchClusterHealth.status === "yellow"
                            ? "Uyarı"
                            : "Kritik"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Küme Adı:</span>
                          <span>{elasticsearchInfo.ElasticsearchClusterHealth.cluster_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Düğüm Sayısı:</span>
                          <span>{elasticsearchInfo.ElasticsearchClusterHealth.number_of_nodes}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Veri Düğümü Sayısı:</span>
                          <span>{elasticsearchInfo.ElasticsearchClusterHealth.number_of_data_nodes}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Aktif Shardlar:</span>
                          <span>{elasticsearchInfo.ElasticsearchClusterHealth.active_shards}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Aktif Birincil Shardlar:</span>
                          <span>{elasticsearchInfo.ElasticsearchClusterHealth.active_primary_shards}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Atanmamış Shardlar:</span>
                          <span>{elasticsearchInfo.ElasticsearchClusterHealth.unassigned_shards}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-2">Shard Sağlığı</h3>
                      <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            elasticsearchInfo.ElasticsearchClusterHealth.status === "green"
                              ? "bg-green-500"
                              : elasticsearchInfo.ElasticsearchClusterHealth.status === "yellow"
                                ? "bg-yellow-500"
                                : "bg-red-500"
                          }`}
                          style={{
                            width: `${elasticsearchInfo.ElasticsearchClusterHealth.active_shards_percent_as_number}%`,
                          }}
                        ></div>
                      </div>
                      <div className="mt-1 text-sm text-gray-500 text-right">
                        {elasticsearchInfo.ElasticsearchClusterHealth.active_shards_percent_as_number.toFixed(1)}% aktif
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">Elasticsearch küme bilgisi bulunamadı veya veri alınamadı.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="indices" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>İndeksler</CardTitle>
                <CardDescription>Elasticsearch indeks istatistikleri</CardDescription>
              </CardHeader>
              <CardContent>
                {elasticsearchInfo?.ElasticsearchIndexStats && elasticsearchInfo.ElasticsearchIndexStats.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>İndeks</TableHead>
                          <TableHead>Durum</TableHead>
                          <TableHead>Sağlık</TableHead>
                          <TableHead>Doküman Sayısı</TableHead>
                          <TableHead>Silinen Dokümanlar</TableHead>
                          <TableHead>Boyut</TableHead>
                          <TableHead>Birincil Shardlar</TableHead>
                          <TableHead>Replikalar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {elasticsearchInfo.ElasticsearchIndexStats.map((index, i) => (
                          <TableRow key={i}>
                            <TableCell>{index.index}</TableCell>
                            <TableCell>{index.status}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`${
                                  index.health === "green"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : index.health === "yellow"
                                      ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                      : "bg-red-50 text-red-700 border-red-200"
                                }`}
                              >
                                {index.health}
                              </Badge>
                            </TableCell>
                            <TableCell>{index["docs.count"]}</TableCell>
                            <TableCell>{index["docs.deleted"]}</TableCell>
                            <TableCell>{index["store.size"]}</TableCell>
                            <TableCell>{index.prim}</TableCell>
                            <TableCell>{index.rep}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-4">İndeks bilgisi bulunamadı veya veri alınamadı.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shards" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Shardlar</CardTitle>
                <CardDescription>Elasticsearch shard dağılımı ve durumu</CardDescription>
              </CardHeader>
              <CardContent>
                {elasticsearchInfo?.ElasticsearchShardInfo && elasticsearchInfo.ElasticsearchShardInfo.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>İndeks</TableHead>
                          <TableHead>Shard</TableHead>
                          <TableHead>Tip</TableHead>
                          <TableHead>Durum</TableHead>
                          <TableHead>Doküman Sayısı</TableHead>
                          <TableHead>Boyut</TableHead>
                          <TableHead>Düğüm</TableHead>
                          <TableHead>IP</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {elasticsearchInfo.ElasticsearchShardInfo.map((shard, i) => (
                          <TableRow key={i}>
                            <TableCell>{shard.index}</TableCell>
                            <TableCell>{shard.shard}</TableCell>
                            <TableCell>{shard.prirep === "p" ? "Birincil" : "Replika"}</TableCell>
                            <TableCell>
                              <Badge
                                variant="outline"
                                className={`${
                                  shard.state === "STARTED"
                                    ? "bg-green-50 text-green-700 border-green-200"
                                    : shard.state === "RELOCATING"
                                      ? "bg-blue-50 text-blue-700 border-blue-200"
                                      : shard.state === "INITIALIZING"
                                        ? "bg-yellow-50 text-yellow-700 border-yellow-200"
                                        : "bg-red-50 text-red-700 border-red-200"
                                }`}
                              >
                                {shard.state}
                              </Badge>
                            </TableCell>
                            <TableCell>{shard.docs || "-"}</TableCell>
                            <TableCell>{shard.store || "-"}</TableCell>
                            <TableCell>{shard.node || "-"}</TableCell>
                            <TableCell>{shard.ip || "-"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-4">Shard bilgisi bulunamadı veya veri alınamadı.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="nodes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Düğümler</CardTitle>
                <CardDescription>Elasticsearch düğüm bilgileri ve kaynakları</CardDescription>
              </CardHeader>
              <CardContent>
                {elasticsearchInfo?.ElasticsearchNodesInfo && elasticsearchInfo.ElasticsearchNodesInfo.length > 0 ? (
                  <div className="space-y-6">
                    {elasticsearchInfo.ElasticsearchNodesInfo.map((node, i) => (
                      <div key={i} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <Server className="h-5 w-5 text-blue-500" />
                            <h3 className="text-lg font-medium">
                              {node.name} {node.master === "*" && "(Master)"}
                            </h3>
                          </div>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {node["node.role"]}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">IP Adresi:</span>
                              <span>{node.ip}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">CPU:</span>
                              <span>{node.cpu !== "-1" ? `${node.cpu}%` : "N/A"}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Yük (1m/5m/15m):</span>
                              <span>
                                {node.load_1m} / {node.load_5m} / {node.load_15m}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">RAM Kullanımı:</span>
                              <span>{node["ram.percent"]}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Heap Kullanımı:</span>
                              <span>{node["heap.percent"]}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 space-y-2">
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">RAM Kullanımı</span>
                              <span className="text-sm font-medium">{node["ram.percent"]}%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  Number.parseInt(node["ram.percent"]) > 90
                                    ? "bg-red-500"
                                    : Number.parseInt(node["ram.percent"]) > 70
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                }`}
                                style={{ width: `${node["ram.percent"]}%` }}
                              ></div>
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium">Heap Kullanımı</span>
                              <span className="text-sm font-medium">{node["heap.percent"]}%</span>
                            </div>
                            <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full ${
                                  Number.parseInt(node["heap.percent"]) > 90
                                    ? "bg-red-500"
                                    : Number.parseInt(node["heap.percent"]) > 70
                                      ? "bg-yellow-500"
                                      : "bg-green-500"
                                }`}
                                style={{ width: `${node["heap.percent"]}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">Düğüm bilgisi bulunamadı veya veri alınamadı.</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Elasticsearch Logları</CardTitle>
                <CardDescription>Son aktivite logları</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {app.logs.map((log, index) => (
                    <div key={index} className="flex flex-col space-y-1 border-b pb-2 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{new Date(log.timestamp).toLocaleString("tr-TR")}</span>
                        {getLogLevelBadge(log.level)}
                      </div>
                      <p className="text-sm">{log.message}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      ) : (
        <Tabs defaultValue="logs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="logs">Loglar</TabsTrigger>
            <TabsTrigger value="metrics">Metrikler</TabsTrigger>
          </TabsList>

          <TabsContent value="logs" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Uygulama Logları</CardTitle>
                <CardDescription>Son aktivite logları</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {app.logs.map((log, index) => (
                    <div key={index} className="flex flex-col space-y-1 border-b pb-2 last:border-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-500">{new Date(log.timestamp).toLocaleString("tr-TR")}</span>
                        {getLogLevelBadge(log.level)}
                      </div>
                      <p className="text-sm">{log.message}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Performans Metrikleri</CardTitle>
                <CardDescription>Uygulama performans grafikleri</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-medium mb-2">CPU Kullanımı</h3>
                    <div className="h-[200px] bg-gray-100 rounded-md flex items-end p-2">
                      {Array.from({ length: 24 }).map((_, i) => {
                        const height = Math.floor(Math.random() * 80) + 20
                        return (
                          <div key={i} className="flex-1 mx-1" style={{ height: `${height}%` }}>
                            <div
                              className={`w-full h-full rounded-sm ${
                                height > 80 ? "bg-red-500" : height > 60 ? "bg-yellow-500" : "bg-green-500"
                              }`}
                            ></div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>24 saat önce</span>
                      <span>Şimdi</span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-medium mb-2">Bellek Kullanımı</h3>
                    <div className="h-[200px] bg-gray-100 rounded-md flex items-end p-2">
                      {Array.from({ length: 24 }).map((_, i) => {
                        const height = Math.floor(Math.random() * 80) + 20
                        return (
                          <div key={i} className="flex-1 mx-1" style={{ height: `${height}%` }}>
                            <div
                              className={`w-full h-full rounded-sm ${
                                height > 80 ? "bg-red-500" : height > 60 ? "bg-yellow-500" : "bg-blue-500"
                              }`}
                            ></div>
                          </div>
                        )
                      })}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      <span>24 saat önce</span>
                      <span>Şimdi</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
