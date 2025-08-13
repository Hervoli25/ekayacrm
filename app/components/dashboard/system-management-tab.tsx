'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Server, 
  Database, 
  Cpu, 
  MemoryStick, 
  HardDrive,
  Wifi,
  Shield,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Settings,
  Monitor,
  Globe,
  Key,
  RefreshCw,
  Download,
  Upload,
  Power,
  Thermometer
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { CascadeDeleteTool } from '@/components/admin/cascade-delete-tool';

interface SystemMetrics {
  server: {
    uptime: string;
    uptimeSeconds: number;
    status: 'healthy' | 'warning' | 'critical';
    version: string;
    environment: string;
    lastRestart: string;
  };
  performance: {
    cpu: {
      usage: number;
      cores: number;
      model: string;
      temperature?: number;
    };
    memory: {
      usage: number;
      total: number;
      used: number;
      free: number;
      cached: number;
    };
    disk: {
      usage: number;
      total: number;
      used: number;
      free: number;
      iops: number;
    };
    network: {
      status: 'connected' | 'disconnected';
      latency: number;
      bandwidth: {
        download: number;
        upload: number;
      };
      connections: number;
    };
  };
  database: {
    status: 'connected' | 'disconnected';
    connections: {
      active: number;
      idle: number;
      total: number;
      max: number;
    };
    queries: {
      total: number;
      slow: number;
      avgResponseTime: number;
    };
    size: {
      total: number;
      tables: number;
      indexes: number;
    };
  };
  security: {
    ssl: {
      status: 'valid' | 'expired' | 'expiring';
      expiryDate: string;
      issuer: string;
    };
    firewall: {
      status: 'active' | 'inactive';
      rules: number;
      blockedIPs: number;
    };
    auth: {
      activeSessions: number;
      failedLogins24h: number;
      suspiciousActivity: number;
    };
    backups: {
      lastBackup: string;
      status: 'success' | 'failed' | 'running';
      size: number;
      retention: number;
    };
  };
  application: {
    version: string;
    build: string;
    deployment: string;
    environment: 'development' | 'staging' | 'production';
    logs: {
      errors: number;
      warnings: number;
      info: number;
    };
    cache: {
      hitRate: number;
      size: number;
      entries: number;
    };
  };
  history: Array<{
    timestamp: string;
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  }>;
}

export function SystemManagementTab() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds

  useEffect(() => {
    fetchSystemMetrics();
    
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(() => {
        fetchSystemMetrics();
      }, refreshInterval * 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh, refreshInterval]);

  const fetchSystemMetrics = async () => {
    try {
      setLoading(true);
      
      // Mock data - in practice, this would come from system monitoring APIs
      const mockMetrics: SystemMetrics = {
        server: {
          uptime: '15d 4h 32m',
          uptimeSeconds: 1318920,
          status: 'healthy',
          version: 'Node.js 18.17.0',
          environment: 'production',
          lastRestart: new Date(Date.now() - 1318920000).toISOString()
        },
        performance: {
          cpu: {
            usage: 45 + Math.random() * 20,
            cores: 8,
            model: 'Intel Xeon E5-2686 v4',
            temperature: 62 + Math.random() * 10
          },
          memory: {
            usage: 68 + Math.random() * 15,
            total: 16384,
            used: 11059,
            free: 5325,
            cached: 2048
          },
          disk: {
            usage: 32 + Math.random() * 10,
            total: 500000,
            used: 160000,
            free: 340000,
            iops: 1200 + Math.random() * 300
          },
          network: {
            status: 'connected',
            latency: 12 + Math.random() * 8,
            bandwidth: {
              download: 980 + Math.random() * 20,
              upload: 100 + Math.random() * 10
            },
            connections: 145 + Math.floor(Math.random() * 50)
          }
        },
        database: {
          status: 'connected',
          connections: {
            active: 8 + Math.floor(Math.random() * 5),
            idle: 12 + Math.floor(Math.random() * 8),
            total: 20,
            max: 100
          },
          queries: {
            total: 15420 + Math.floor(Math.random() * 1000),
            slow: 3 + Math.floor(Math.random() * 5),
            avgResponseTime: 2.3 + Math.random() * 2
          },
          size: {
            total: 2048,
            tables: 45,
            indexes: 128
          }
        },
        security: {
          ssl: {
            status: 'valid',
            expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            issuer: "Let's Encrypt"
          },
          firewall: {
            status: 'active',
            rules: 127,
            blockedIPs: 2341
          },
          auth: {
            activeSessions: 23 + Math.floor(Math.random() * 10),
            failedLogins24h: 12,
            suspiciousActivity: 2
          },
          backups: {
            lastBackup: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
            status: 'success',
            size: 1024,
            retention: 30
          }
        },
        application: {
          version: '1.2.3',
          build: 'build-456',
          deployment: new Date().toISOString(),
          environment: 'production',
          logs: {
            errors: 3,
            warnings: 15,
            info: 1247
          },
          cache: {
            hitRate: 94.5,
            size: 512,
            entries: 8450
          }
        },
        history: Array.from({ length: 24 }, (_, i) => ({
          timestamp: new Date(Date.now() - (23 - i) * 60 * 60 * 1000).toISOString(),
          cpu: 30 + Math.random() * 40,
          memory: 50 + Math.random() * 30,
          disk: 25 + Math.random() * 15,
          network: 20 + Math.random() * 60
        }))
      };
      
      setMetrics(mockMetrics);
    } catch (error) {
      console.error('Error fetching system metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'active':
      case 'valid':
      case 'success':
        return 'text-green-600';
      case 'warning':
      case 'expiring':
        return 'text-yellow-600';
      case 'critical':
      case 'disconnected':
      case 'inactive':
      case 'expired':
      case 'failed':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'connected':
      case 'active':
      case 'valid':
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning':
      case 'expiring':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'critical':
      case 'disconnected':
      case 'inactive':
      case 'expired':
      case 'failed':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const formatBytes = (bytes: number) => {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  if (loading && !metrics) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Loading system metrics...
        </div>
      </div>
    );
  }

  if (!metrics) return null;

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">System Monitoring</h3>
          <p className="text-sm text-gray-600">Real-time system health and performance metrics</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? (
              <>
                <Power className="h-4 w-4 mr-2" />
                Auto Refresh On
              </>
            ) : (
              <>
                <Power className="h-4 w-4 mr-2" />
                Auto Refresh Off
              </>
            )}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchSystemMetrics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Server Status</p>
                <p className={`text-2xl font-bold ${getStatusColor(metrics.server.status)}`}>
                  {metrics.server.status.toUpperCase()}
                </p>
                <p className="text-xs text-gray-500">Uptime: {metrics.server.uptime}</p>
              </div>
              <div className="flex flex-col items-center">
                {getStatusIcon(metrics.server.status)}
                <Server className="h-8 w-8 text-gray-400 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Database</p>
                <p className={`text-2xl font-bold ${getStatusColor(metrics.database.status)}`}>
                  ONLINE
                </p>
                <p className="text-xs text-gray-500">
                  {metrics.database.connections.active}/{metrics.database.connections.max} connections
                </p>
              </div>
              <div className="flex flex-col items-center">
                {getStatusIcon(metrics.database.status)}
                <Database className="h-8 w-8 text-gray-400 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Network</p>
                <p className={`text-2xl font-bold ${getStatusColor(metrics.performance.network.status)}`}>
                  CONNECTED
                </p>
                <p className="text-xs text-gray-500">
                  {metrics.performance.network.latency.toFixed(1)}ms latency
                </p>
              </div>
              <div className="flex flex-col items-center">
                {getStatusIcon(metrics.performance.network.status)}
                <Wifi className="h-8 w-8 text-gray-400 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Security</p>
                <p className={`text-2xl font-bold ${getStatusColor(metrics.security.ssl.status)}`}>
                  SECURED
                </p>
                <p className="text-xs text-gray-500">
                  SSL expires in 90 days
                </p>
              </div>
              <div className="flex flex-col items-center">
                {getStatusIcon(metrics.security.ssl.status)}
                <Shield className="h-8 w-8 text-gray-400 mt-1" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* CPU */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium">CPU Usage</span>
                </div>
                <span className="text-sm font-bold">{metrics.performance.cpu.usage.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.performance.cpu.usage} className="h-2 mb-1" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{metrics.performance.cpu.cores} cores • {metrics.performance.cpu.model}</span>
                {metrics.performance.cpu.temperature && (
                  <span className="flex items-center">
                    <Thermometer className="h-3 w-3 mr-1" />
                    {metrics.performance.cpu.temperature.toFixed(0)}°C
                  </span>
                )}
              </div>
            </div>

            {/* Memory */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <MemoryStick className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium">Memory Usage</span>
                </div>
                <span className="text-sm font-bold">{metrics.performance.memory.usage.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.performance.memory.usage} className="h-2 mb-1" />
              <div className="text-xs text-gray-500">
                {formatBytes(metrics.performance.memory.used * 1024 * 1024)} / {formatBytes(metrics.performance.memory.total * 1024 * 1024)}
              </div>
            </div>

            {/* Disk */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium">Disk Usage</span>
                </div>
                <span className="text-sm font-bold">{metrics.performance.disk.usage.toFixed(1)}%</span>
              </div>
              <Progress value={metrics.performance.disk.usage} className="h-2 mb-1" />
              <div className="flex justify-between text-xs text-gray-500">
                <span>{formatBytes(metrics.performance.disk.used * 1024 * 1024)} / {formatBytes(metrics.performance.disk.total * 1024 * 1024)}</span>
                <span>{metrics.performance.disk.iops.toFixed(0)} IOPS</span>
              </div>
            </div>

            {/* Network */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center space-x-2">
                  <Globe className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium">Network</span>
                </div>
                <span className="text-sm font-bold">{metrics.performance.network.connections} connections</span>
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span className="flex items-center">
                  <Download className="h-3 w-3 mr-1" />
                  {metrics.performance.network.bandwidth.download.toFixed(0)} Mbps
                </span>
                <span className="flex items-center">
                  <Upload className="h-3 w-3 mr-1" />
                  {metrics.performance.network.bandwidth.upload.toFixed(0)} Mbps
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Performance History Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Performance History (24h)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={metrics.history}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(value) => new Date(value).getHours() + ':00'}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleString()}
                  formatter={(value: number, name: string) => [`${value.toFixed(1)}%`, name]}
                />
                <Area type="monotone" dataKey="cpu" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} name="CPU" />
                <Area type="monotone" dataKey="memory" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.6} name="Memory" />
                <Area type="monotone" dataKey="disk" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.6} name="Disk" />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Database & Application Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2" />
              Database Metrics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Active Connections</p>
                <p className="text-2xl font-bold">{metrics.database.connections.active}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Idle Connections</p>
                <p className="text-2xl font-bold">{metrics.database.connections.idle}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Total Queries</p>
                <p className="text-2xl font-bold">{metrics.database.queries.total.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Slow Queries</p>
                <p className="text-2xl font-bold text-yellow-600">{metrics.database.queries.slow}</p>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Connection Pool</span>
                <span className="text-sm text-gray-600">
                  {metrics.database.connections.total}/{metrics.database.connections.max}
                </span>
              </div>
              <Progress value={(metrics.database.connections.total / metrics.database.connections.max) * 100} className="h-2" />
            </div>
            
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="text-center">
                <p className="text-gray-600">Avg Response</p>
                <p className="font-bold">{metrics.database.queries.avgResponseTime.toFixed(1)}ms</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600">DB Size</p>
                <p className="font-bold">{formatBytes(metrics.database.size.total * 1024 * 1024)}</p>
              </div>
              <div className="text-center">
                <p className="text-gray-600">Tables</p>
                <p className="font-bold">{metrics.database.size.tables}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Monitor className="h-5 w-5 mr-2" />
              Application Info
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Version</p>
                <p className="text-lg font-bold">{metrics.application.version}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Environment</p>
                <Badge className="bg-green-100 text-green-800">
                  {metrics.application.environment.toUpperCase()}
                </Badge>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Cache Hit Rate</span>
                <span className="text-sm font-bold text-green-600">{metrics.application.cache.hitRate}%</span>
              </div>
              <Progress value={metrics.application.cache.hitRate} className="h-2" />
            </div>

            <Separator />

            <div>
              <p className="text-sm font-medium text-gray-600 mb-2">Logs (24h)</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-2 bg-red-50 rounded">
                  <p className="text-lg font-bold text-red-600">{metrics.application.logs.errors}</p>
                  <p className="text-xs text-red-600">Errors</p>
                </div>
                <div className="text-center p-2 bg-yellow-50 rounded">
                  <p className="text-lg font-bold text-yellow-600">{metrics.application.logs.warnings}</p>
                  <p className="text-xs text-yellow-600">Warnings</p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded">
                  <p className="text-lg font-bold text-blue-600">{metrics.application.logs.info}</p>
                  <p className="text-xs text-blue-600">Info</p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-gray-600">Build</p>
                <p className="font-medium">{metrics.application.build}</p>
              </div>
              <div>
                <p className="text-gray-600">Cache Entries</p>
                <p className="font-medium">{metrics.application.cache.entries.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Security & Backup Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Shield className="h-5 w-5 mr-2" />
              Security Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-green-100 rounded">
                  <Key className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">SSL Certificate</p>
                  <p className="text-xs text-gray-600">{metrics.security.ssl.status.toUpperCase()}</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-100 rounded">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Firewall</p>
                  <p className="text-xs text-gray-600">{metrics.security.firewall.status.toUpperCase()}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Active Sessions</span>
                <span className="text-sm font-bold">{metrics.security.auth.activeSessions}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Failed Logins (24h)</span>
                <span className="text-sm font-bold text-yellow-600">{metrics.security.auth.failedLogins24h}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Suspicious Activity</span>
                <span className="text-sm font-bold text-red-600">{metrics.security.auth.suspiciousActivity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Blocked IPs</span>
                <span className="text-sm font-bold">{metrics.security.firewall.blockedIPs.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <HardDrive className="h-5 w-5 mr-2" />
              Backup Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">Last Backup</p>
                <p className="text-xs text-gray-600">
                  {new Date(metrics.security.backups.lastBackup).toLocaleString()}
                </p>
              </div>
              <Badge className={`${getStatusColor(metrics.security.backups.status)} bg-green-100`}>
                {metrics.security.backups.status.toUpperCase()}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-gray-600">Backup Size</p>
                <p className="text-lg font-bold">{formatBytes(metrics.security.backups.size * 1024 * 1024)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Retention</p>
                <p className="text-lg font-bold">{metrics.security.backups.retention} days</p>
              </div>
            </div>

            <div className="space-y-2">
              <Button variant="outline" className="w-full" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download Backup
              </Button>
              <Button variant="outline" className="w-full" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Create Backup Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Database Management Tools - SUPER ADMIN Only */}
      <div className="mt-8">
        <CascadeDeleteTool />
      </div>
    </div>
  );
}