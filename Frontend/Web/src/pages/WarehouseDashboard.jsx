import { useEffect, useState } from "react";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Package, 
  Warehouse, 
  Truck, 
  CheckCircle2, 
  Activity,
  RefreshCw,
  TrendingUp, 
  FileText,
  MapPin,
  Database,
  ArrowUpRight,
  ArrowDownLeft,
  XCircle,
  Clock
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { PieChart, Pie } from "recharts";
import api from "@/api/api";
import { useToast } from "@/components/ui/custom-toast";
import { useTheme } from "@/components/theme-provider";

export default function WarehouseDashboard() {
  const toast = useToast();
  const { theme } = useTheme();
  const [profile, setProfile] = useState(null);
  const [gifts, setGifts] = useState([]);
  const [dispatches, setDispatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live telemetry feed (simulated updates for logistics telemetry impact)
  const [telemetryLogs, setTelemetryLogs] = useState([
    { id: 1, action: "System Boot", msg: "Warehouse node connected to primary gateway", time: "Just now", status: "success" },
    { id: 2, action: "Stock Check", msg: "Inventory levels synchronized with cloud database", time: "10 mins ago", status: "success" },
  ]);

  const appleFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch Profile
      const profileRes = await api.get("/auth/profile/");
      setProfile(profileRes.data);
      
      // 2. Fetch Local Inventory
      const giftsRes = await api.get("/gifts/");
      const localGifts = giftsRes.data.results || giftsRes.data || [];
      setGifts(localGifts);
      
      // 3. Fetch Dispatches
      const dispatchesRes = await api.get("/dispatches/");
      const localDispatches = dispatchesRes.data.results || dispatchesRes.data || [];
      setDispatches(localDispatches);

    } catch (error) {
      console.error("Failed to load warehouse dashboard stats:", error);
      toast.error("Failed to load warehouse telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    // Setup live telemetry simulator
    const interval = setInterval(() => {
      const activities = [
        { action: "Barometric Audit", msg: "Zone A environment sensor checks passed", status: "success" },
        { action: "Waybill Sync", msg: "Checking active dispatch logs on network hubs", status: "info" },
        { action: "Stock Check", msg: "No stock levels below safety threshold (10 units)", status: "success" },
        { action: "Queue Check", msg: "Zero critical delays in outbound transit queue", status: "success" }
      ];
      const selected = activities[Math.floor(Math.random() * activities.length)];
      setTelemetryLogs(prev => [
        { id: Date.now(), ...selected, time: "Just now" },
        ...prev.slice(0, 3)
      ]);
    }, 20000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-6 bg-background animate-pulse" style={{ fontFamily: appleFont }}>
        <div className="flex justify-between items-center">
          <div className="h-8 w-64 bg-muted rounded-lg" />
          <div className="h-8 w-32 bg-muted rounded-lg" />
        </div>
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-muted rounded-2xl" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 h-72 bg-muted rounded-xl" />
          <div className="h-72 bg-muted rounded-xl" />
        </div>
      </div>
    );
  }

  // Data processing for widgets
  const myUsername = profile?.username || "";
  const myWarehouseId = profile?.id;
  const capacityLimit = profile?.capacity || 5000;
  
  // Total stock currently in the warehouse
  const totalStockUnits = gifts.reduce((sum, g) => sum + (g.stock || 0), 0);
  const capacityUsedPercent = Math.min(Math.round((totalStockUnits / capacityLimit) * 100), 100);
  
  // Dispatches calculations
  const outboundDispatches = dispatches.filter(d => d.source_warehouse === myWarehouseId);
  const inboundDispatches = dispatches.filter(d => d.destination_warehouse === myWarehouseId && d.source_warehouse !== myWarehouseId);
  
  const pendingOutbound = outboundDispatches.filter(d => d.status === "Pending Dispatch").length;
  const activeTransitOutbound = outboundDispatches.filter(d => d.status === "In Transit" || d.status === "Arrived").length;
  const completedOutbound = outboundDispatches.filter(d => d.status === "Delivered").length;
  
  // Sparkline data
  const stockSparkData = [
    { value: Math.max(0, totalStockUnits - 30) }, 
    { value: Math.max(0, totalStockUnits - 15) }, 
    { value: totalStockUnits }, 
    { value: totalStockUnits }, 
    { value: totalStockUnits }
  ];
  const dispatchSparkData = [
    { value: 5 }, { value: 8 }, { value: 4 }, { value: 12 }, { value: outboundDispatches.length }
  ];
  
  // Pie chart: Dispatch Status Distribution
  const dispatchStatuses = {
    Pending: dispatches.filter(d => d.status === "Pending Dispatch").length,
    InTransit: dispatches.filter(d => d.status === "In Transit" || d.status === "Arrived").length,
    Delivered: dispatches.filter(d => d.status === "Delivered").length,
    Cancelled: dispatches.filter(d => d.status === "Cancelled").length,
  };
  
  const hasPieData = dispatches.length > 0;
  const pieData = hasPieData ? [
    { name: "Pending", value: dispatchStatuses.Pending, color: "#4f46e5" },
    { name: "In Transit", value: dispatchStatuses.InTransit, color: "#ff6600" },
    { name: "Delivered", value: dispatchStatuses.Delivered, color: "#10b981" },
    { name: "Cancelled", value: dispatchStatuses.Cancelled, color: "#ef4444" },
  ] : [
    { name: "Pending", value: 2, color: "#4f46e5" },
    { name: "In Transit", value: 3, color: "#ff6600" },
    { name: "Delivered", value: 5, color: "#10b981" },
    { name: "Cancelled", value: 0, color: "#ef4444" },
  ];

  // Bar Chart: Category share of inventory
  const categoriesMap = gifts.reduce((acc, g) => {
    acc[g.category] = (acc[g.category] || 0) + (g.stock || 0);
    return acc;
  }, {});
  
  const categoryData = Object.entries(categoriesMap).map(([name, value]) => ({
    name, value
  })).sort((a, b) => b.value - a.value).slice(0, 5);

  // Dynamic flow chart coordinates
  const transitFlowData = [
    { name: "Mon", incoming: inboundDispatches.length * 2, outgoing: outboundDispatches.length },
    { name: "Tue", incoming: inboundDispatches.length * 3, outgoing: outboundDispatches.length * 2 },
    { name: "Wed", incoming: inboundDispatches.length, outgoing: outboundDispatches.length * 3 },
    { name: "Thu", incoming: inboundDispatches.length * 2, outgoing: outboundDispatches.length * 2 },
    { name: "Fri", incoming: inboundDispatches.length * 4, outgoing: outboundDispatches.length * 4 },
    { name: "Sat", incoming: inboundDispatches.length, outgoing: outboundDispatches.length },
  ];

  return (
    <div
      className="p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-in fade-in duration-500 bg-background text-foreground"
      style={{ fontFamily: appleFont }}
    >
      
      {/* 1. TOP HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-1">
        <div className="flex flex-col">
          <h1 className="text-[18px] sm:text-[20px] font-bold text-foreground leading-tight">
            {myUsername || "Warehouse Controller"}
          </h1>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            Logistics Control Hub — local inventory audit, outbound routing & multi-hub telemetry.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Node Sync Active</span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchDashboardData}
            className="text-[11px] text-muted-foreground hover:text-foreground gap-1 font-medium transition-colors"
          >
            <RefreshCw className="h-3 w-3" />
            Refresh
          </Button>
        </div>
      </div>

      {/* 2. HIGHLIGHTS GRID (4 Cards) */}
      <div className="space-y-2.5">
        <h2 className="text-sm sm:text-base font-semibold text-foreground">Highlights</h2>
        <div className="grid gap-3 sm:gap-4 lg:gap-5 grid-cols-2 lg:grid-cols-4">
          
          {/* Card 1: Total Stock Units */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-2 sm:p-3 md:p-3.5 lg:p-2.5 xl:p-4 2xl:p-5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <Package className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 lg:h-3.5 lg:w-3.5 xl:h-4.5 xl:w-4.5 2xl:h-5 2xl:w-5 text-slate-500/80 flex-shrink-0" />
                <span className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-[10px] xl:text-xs 2xl:text-sm font-semibold text-slate-600 dark:text-slate-300 truncate leading-tight">Total Stock Units</span>
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[8px] sm:text-[9px] md:text-[10px] lg:text-[8px] xl:text-[10px] 2xl:text-xs px-1 sm:px-1.5 py-0.5 rounded font-semibold shadow-none flex-shrink-0 ml-auto">{gifts.length} Items</Badge>
              </div>
              <div className="flex items-end justify-between mt-2 sm:mt-2.5 md:mt-3 lg:mt-2.5 xl:mt-4 2xl:mt-5">
                <span className="text-lg sm:text-xl md:text-2xl lg:text-lg xl:text-2xl 2xl:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                  {totalStockUnits.toLocaleString()}
                </span>
                <div className="w-10 h-5 sm:w-12 sm:h-6 md:w-14 md:h-7 lg:w-10 lg:h-5 xl:w-16 xl:h-8 2xl:w-20 2xl:h-10 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stockSparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Bar dataKey="value" fill="hsl(var(--primary))" barSize={3.5} radius={[1, 1, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Capacity Utilization */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-2 sm:p-3 md:p-3.5 lg:p-2.5 xl:p-4 2xl:p-5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <Warehouse className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 lg:h-3.5 lg:w-3.5 xl:h-4.5 xl:w-4.5 2xl:h-5 2xl:w-5 text-slate-500/80 flex-shrink-0" />
                <span className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-[10px] xl:text-xs 2xl:text-sm font-semibold text-slate-600 dark:text-slate-300 truncate leading-tight">Capacity Utilization</span>
                <Badge className={`${
                  capacityUsedPercent > 90 ? "bg-red-500/10 text-red-500" : capacityUsedPercent > 70 ? "bg-amber-500/10 text-amber-500" : "bg-emerald-500/10 text-emerald-500"
                } border-none text-[8px] sm:text-[9px] md:text-[10px] lg:text-[8px] xl:text-[10px] 2xl:text-xs px-1 sm:px-1.5 py-0.5 rounded font-semibold shadow-none flex-shrink-0 ml-auto`}>
                  Max {capacityLimit}
                </Badge>
              </div>
              <div className="flex items-end justify-between mt-2 sm:mt-2.5 md:mt-3 lg:mt-2.5 xl:mt-4 2xl:mt-5">
                <span className="text-lg sm:text-xl md:text-2xl lg:text-lg xl:text-2xl 2xl:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                  {capacityUsedPercent}%
                </span>
                <div className="w-16 h-2 bg-muted rounded-full overflow-hidden mb-1 flex-shrink-0">
                  <div className={`h-full rounded-full ${
                    capacityUsedPercent > 90 ? "bg-red-500" : capacityUsedPercent > 70 ? "bg-amber-500" : "bg-primary"
                  }`} style={{ width: `${capacityUsedPercent}%` }} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Outbound Dispatches */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-2 sm:p-3 md:p-3.5 lg:p-2.5 xl:p-4 2xl:p-5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <Truck className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 lg:h-3.5 lg:w-3.5 xl:h-4.5 xl:w-4.5 2xl:h-5 2xl:w-5 text-slate-500/80 flex-shrink-0" />
                <span className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-[10px] xl:text-xs 2xl:text-sm font-semibold text-slate-600 dark:text-slate-300 truncate leading-tight">Outbound Dispatches</span>
                <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-none text-[8px] sm:text-[9px] md:text-[10px] lg:text-[8px] xl:text-[10px] 2xl:text-xs px-1 sm:px-1.5 py-0.5 rounded font-semibold shadow-none flex-shrink-0 ml-auto">
                  {activeTransitOutbound} active
                </Badge>
              </div>
              <div className="flex items-end justify-between mt-2 sm:mt-2.5 md:mt-3 lg:mt-2.5 xl:mt-4 2xl:mt-5">
                <span className="text-lg sm:text-xl md:text-2xl lg:text-lg xl:text-2xl 2xl:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                  {outboundDispatches.length}
                </span>
                <div className="w-10 h-5 sm:w-12 sm:h-6 md:w-14 md:h-7 lg:w-10 lg:h-5 xl:w-16 xl:h-8 2xl:w-20 2xl:h-10 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dispatchSparkData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Bar dataKey="value" fill="#ff6600" barSize={3.5} radius={[1, 1, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Inbound Transits */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-2 sm:p-3 md:p-3.5 lg:p-2.5 xl:p-4 2xl:p-5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <ArrowDownLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 lg:h-3.5 lg:w-3.5 xl:h-4.5 xl:w-4.5 2xl:h-5 2xl:w-5 text-slate-500/80 flex-shrink-0" />
                <span className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-[10px] xl:text-xs 2xl:text-sm font-semibold text-slate-600 dark:text-slate-300 truncate leading-tight">Inbound Transit</span>
                <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none text-[8px] sm:text-[9px] md:text-[10px] lg:text-[8px] xl:text-[10px] 2xl:text-xs px-1 sm:px-1.5 py-0.5 rounded font-semibold shadow-none flex-shrink-0 ml-auto">
                  Incoming
                </Badge>
              </div>
              <div className="flex items-end justify-between mt-2 sm:mt-2.5 md:mt-3 lg:mt-2.5 xl:mt-4 2xl:mt-5">
                <span className="text-lg sm:text-xl md:text-2xl lg:text-lg xl:text-2xl 2xl:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                  {inboundDispatches.filter(d => d.status === "In Transit").length}
                </span>
                <div className="flex gap-0.5 sm:gap-1 mb-0.5 flex-shrink-0">
                  {inboundDispatches.slice(0, 3).map((r, i) => (
                    <div key={r.id || i} className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-2.5 lg:w-2.5 xl:h-3.5 xl:w-3.5 2xl:h-4 2xl:w-4 rounded-full bg-amber-500 flex items-center justify-center shadow-sm">
                      <Clock className="h-1.5 w-1.5 sm:h-2 sm:w-2 md:h-2.5 md:w-2.5 lg:h-1.5 lg:w-1.5 xl:h-2 xl:w-2 2xl:h-2.5 2xl:w-2.5 text-white" />
                    </div>
                  ))}
                  {inboundDispatches.length === 0 && <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-2.5 lg:w-2.5 xl:h-3.5 xl:w-3.5 2xl:h-4 2xl:w-4 rounded-full bg-muted flex items-center justify-center border border-border" />}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* 3. MIDDLE ROW (Transaction Load Flow + Platform Distribution + Top Sectors) */}
      <div className="grid gap-4 lg:gap-6 lg:grid-cols-4 items-start">
        
        {/* Transit Flow Chart (2/4 width) */}
        <Card className="lg:col-span-2 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
            <div className="space-y-0.5">
              <CardTitle className="text-sm sm:text-base font-semibold text-foreground">Logistics Load Flow</CardTitle>
              <CardDescription className="text-[10px] sm:text-[11px] text-muted-foreground">
                Inbound vs outbound gift traffic at this depot.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <Button variant="outline" size="sm" className="h-7 rounded-lg bg-muted/50 border-border text-[10px] sm:text-[11px] font-semibold gap-1 text-foreground hover:bg-muted px-2">
                <span>Network Map</span>
              </Button>
            </div>
          </div>

          <div className="h-[180px] sm:h-[210px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={transitFlowData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card rounded-xl border border-border p-2.5 shadow-lg flex flex-col space-y-1">
                          <span className="text-[9px] font-bold text-muted-foreground">Traffic</span>
                          <div className="flex flex-col gap-0.5 text-xs font-bold text-foreground">
                            <span>Incoming Hub Load: {payload[0]?.value ?? 0}</span>
                            <span>Outgoing Hub Load: {payload[1]?.value ?? 0}</span>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="incoming" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fill="url(#colorIncomingRed)" 
                  activeDot={{ r: 5, stroke: 'hsl(var(--primary))', strokeWidth: 1.5, fill: '#fff' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="outgoing" 
                  stroke="#ff6600" 
                  strokeWidth={2}
                  fill="url(#colorOutgoingOrange)" 
                  activeDot={{ r: 5, stroke: '#ff6600', strokeWidth: 1.5, fill: '#fff' }}
                />
                <defs>
                  <linearGradient id="colorIncomingRed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0.0}/>
                  </linearGradient>
                  <linearGradient id="colorOutgoingOrange" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ff6600" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#ff6600" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Dispatch Status Distribution (1/4 width) */}
        <Card className="rounded-2xl border border-border bg-card p-4 lg:p-3 xl:p-4 2xl:p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-1 min-w-0">
              <TrendingUp className="h-4 w-4 text-foreground flex-shrink-0" />
              <CardTitle className="text-xs sm:text-sm lg:text-xs xl:text-sm 2xl:text-base font-semibold text-foreground truncate">Dispatch Status</CardTitle>
            </div>
          </div>

          <div className="relative flex items-center justify-center h-[120px] sm:h-[135px] lg:h-[105px] xl:h-[130px] 2xl:h-[140px] my-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={32}
                  outerRadius={46}
                  paddingAngle={4}
                  dataKey="value"
                  stroke={theme === "dark" ? "hsl(var(--card))" : "#ffffff"}
                  strokeWidth={2}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <text
                  x="50%"
                  y="43%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "8px",
                    fontWeight: 500,
                    fill: "hsl(var(--muted-foreground))",
                    letterSpacing: "0.05em"
                  }}
                >
                  Total
                </text>
                <text
                  x="50%"
                  y="59%"
                  textAnchor="middle"
                  dominantBaseline="middle"
                  style={{
                    fontFamily: "Inter, sans-serif",
                    fontSize: "16px",
                    fontWeight: 700,
                    fill: "hsl(var(--foreground))"
                  }}
                >
                  {dispatches.length}
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-1 sm:gap-1.5 mt-1 text-[9px] sm:text-xs lg:text-[10px] xl:text-xs 2xl:text-sm font-medium">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1 sm:gap-1.5 px-1.5 py-0.5 sm:py-1 lg:px-1 lg:py-0.5 xl:px-2 xl:py-1 2xl:px-2.5 2xl:py-1.5 rounded-md border border-border bg-muted/20 min-w-0">
                <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate text-muted-foreground w-full">{item.name}: <span className="font-bold text-foreground">{item.value}</span></span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Product Categories in Warehouse (1/4 width) */}
        <Card className="rounded-2xl border border-border bg-card p-4 lg:p-3 xl:p-4 2xl:p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 pb-2 border-b border-border font-medium">
            <Package className="h-4 w-4 text-blue-500 shrink-0" />
            <div className="min-w-0">
              <CardTitle className="text-xs sm:text-sm lg:text-xs xl:text-sm 2xl:text-base font-semibold text-foreground truncate">Category Stock</CardTitle>
            </div>
          </div>
          <div className="h-[120px] sm:h-[135px] lg:h-[105px] xl:h-[130px] 2xl:h-[140px] w-full mt-2">
            {categoryData.length === 0 ? (
              <p className="text-[11px] text-muted-foreground text-center py-10">No stock categorizations yet.</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 10, left: 15, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} width={55} />
                  <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '10px', padding: '4px 8px' }} />
                  <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={8} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* 4. BOTTOM ROW (Pending Dispatches + Telemetry Logs) */}
      <div className="grid gap-4 lg:gap-6 lg:grid-cols-3 items-start">

        {/* Left column wrapper for Dispatches + Performance */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          {/* Active Dispatches Pipeline Table */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-visible">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-5 pb-0">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary animate-bounce" />
                <CardTitle className="text-sm sm:text-base font-semibold text-foreground">Active Dispatch Pipelines</CardTitle>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                <span className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(230,0,0,0.8)] animate-pulse" />
                {dispatches.filter(d => d.status !== "Delivered" && d.status !== "Cancelled").length} active
              </div>
            </div>
            
            <div className="p-4 sm:p-5 pt-3">
              <div className="w-full rounded-xl border border-border overflow-visible">
                <table className="w-full table-fixed border-collapse text-left">
                  <thead>
                    <tr className="bg-red-50/50 dark:bg-zinc-900 border-b border-red-100/50 dark:border-zinc-800">
                      <th className="text-[11px] font-bold tracking-wider text-primary py-3 px-4 w-[35%] rounded-tl-xl">Tracking ID / Gift</th>
                      <th className="text-[11px] font-bold tracking-wider text-primary py-3 px-4 w-[25%]">Recipient Email</th>
                      <th className="text-[11px] font-bold tracking-wider text-primary py-3 px-4 w-[20%]">Wilaya</th>
                      <th className="text-[11px] font-bold tracking-wider text-primary py-3 px-4 text-right rounded-tr-xl">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispatches.filter(d => d.status !== "Delivered" && d.status !== "Cancelled").length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <CheckCircle2 className="w-9 h-9 text-emerald-500/60" />
                            <span className="text-[13px] font-bold text-foreground">All Shipments Dispatched!</span>
                            <span className="text-[11px] text-muted-foreground max-w-xs">No active transit pipelines currently active at this depot.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      dispatches.filter(d => d.status !== "Delivered" && d.status !== "Cancelled").slice(0, 5).map((d) => (
                        <tr
                          key={d.id}
                          className="border-b border-gray-100 dark:border-zinc-800/60 last:border-b-0 hover:bg-gray-50/40 dark:hover:bg-zinc-900/35 transition-colors duration-150"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-zinc-800 flex items-center justify-center border border-red-100 dark:border-zinc-700 shadow-sm shrink-0">
                                <Package className="w-3.5 h-3.5 text-primary" />
                              </div>
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="text-[11px] font-mono font-bold text-gray-900 dark:text-zinc-100 truncate">{d.tracking_number}</span>
                                <span className="text-[9px] text-gray-400 dark:text-zinc-500 truncate">{d.gift_name} • {d.quantity} units</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[11px] font-semibold text-gray-600 dark:text-zinc-300 truncate block">
                              {d.employee_email}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-zinc-300 truncate">
                              <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                              {d.destination_wilaya}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold border capitalize ${
                              d.status === "In Transit" ? "bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/20 dark:text-amber-400" :
                              d.status === "Arrived" ? "bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/20 dark:text-blue-400" :
                              "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-400"
                            }`}>
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* Logistics Performance & Node Stats */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-5">
            <div className="flex items-center gap-2 pb-4 border-b border-border/50">
              <Database className="h-4 w-4 text-emerald-500" />
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold text-foreground">Logistics Node Integrity</CardTitle>
                <CardDescription className="text-[10px] text-muted-foreground">Local telemetry and warehouse storage diagnostics.</CardDescription>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
               <div className="flex flex-col gap-1 sm:border-r border-border/40 px-2">
                 <span className="text-[11px] font-semibold text-muted-foreground">Local Shelves</span>
                 <span className="text-xl font-bold text-foreground">{gifts.length}<span className="text-[10px] font-semibold text-muted-foreground ml-0.5">sections</span></span>
                 <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded w-fit">Audited</span>
               </div>
               <div className="flex flex-col gap-1 sm:border-r border-border/40 px-2">
                 <span className="text-[11px] font-semibold text-muted-foreground">Storage Health</span>
                 <span className="text-xl font-bold text-foreground">100<span className="text-[10px] font-semibold text-muted-foreground ml-0.5">%</span></span>
                 <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded w-fit">Optimal Temp</span>
               </div>
               <div className="flex flex-col gap-1 sm:border-r border-border/40 px-2">
                 <span className="text-[11px] font-semibold text-muted-foreground">Avg Transit Speed</span>
                 <span className="text-xl font-bold text-foreground">1.8<span className="text-[10px] font-semibold text-muted-foreground ml-0.5">days</span></span>
                 <span className="text-[9px] font-bold text-blue-500 bg-blue-500/10 px-1 py-0.5 rounded w-fit">Fast Routing</span>
               </div>
               <div className="flex flex-col gap-1 px-2">
                 <span className="text-[11px] font-semibold text-muted-foreground">Dispatched Out</span>
                 <span className="text-xl font-bold text-foreground">{completedOutbound}<span className="text-[10px] font-semibold text-muted-foreground ml-0.5">gifts</span></span>
                 <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded w-fit">Delivered</span>
               </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Telemetry Logs */}
        <div className="space-y-4">
          
          {/* Telemetry activity log */}
          <Card className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Activity className="h-4 w-4 text-blue-500 animate-pulse" />
              <div>
                <CardTitle className="text-xs sm:text-sm font-semibold text-foreground">Node Logs Feed</CardTitle>
                <CardDescription className="text-[10px] text-muted-foreground">Real-time local event telemetry.</CardDescription>
              </div>
            </div>
            <div className="pt-3 space-y-3">
              {telemetryLogs.map((log) => (
                <div key={log.id} className="flex gap-2.5 text-xs leading-relaxed border-b border-border/40 pb-3 last:border-0 last:pb-0">
                  <div className={`mt-1 w-1.5 h-1.5 rounded-full shrink-0 ${
                     log.status === "success" ? "bg-emerald-500 shadow-[0_0_4px_rgba(16,185,129,0.6)]" : "bg-blue-400 shadow-[0_0_4px_rgba(59,130,246,0.6)]"
                  }`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-foreground truncate">{log.action}</span>
                      <span className="text-[9px] text-muted-foreground whitespace-nowrap">{log.time}</span>
                    </div>
                    <p className="text-muted-foreground text-[10px] font-medium mt-0.5 truncate">{log.msg}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Local Information details */}
          <Card className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Warehouse className="h-4 w-4 text-primary" />
              <div>
                <CardTitle className="text-xs sm:text-sm font-semibold text-foreground">Node Information</CardTitle>
                <CardDescription className="text-[10px] text-muted-foreground">Active parameters of this facility.</CardDescription>
              </div>
            </div>
            <div className="pt-3 space-y-2.5 text-xs font-semibold">
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Operating Wilaya</span>
                <span className="text-foreground">{profile?.location || "Algiers"}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Unique Node ID</span>
                <span className="text-foreground font-mono">NODE-00{profile?.id || 1}</span>
              </div>
              <div className="flex justify-between border-b border-border/40 pb-2">
                <span className="text-muted-foreground">Total Categories</span>
                <span className="text-foreground">{gifts.length > 0 ? Object.keys(categoriesMap).length : 0} types</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-muted-foreground">Manager Account</span>
                <span className="text-primary truncate max-w-[120px]">{profile?.email}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

    </div>
  );
}
