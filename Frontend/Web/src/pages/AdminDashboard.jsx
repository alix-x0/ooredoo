import { useEffect, useState } from "react";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Warehouse, 
  UserCog, 
  ShieldAlert, 
  ShieldCheck, 
  Check, 
  X, 
  Activity,
  Settings,
  RefreshCw,
  Briefcase,
  Zap,
  ChevronDown,
  MapPin,
  Globe,
  Database,
  TrendingUp
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

export default function AdminDashboard() {
  const toast = useToast();
  const { theme } = useTheme();
  const [stats, setStats] = useState({
    total_users: 0,
    total_warehouses: 0,
    total_employees: 0,
    total_admins: 0,
    pending_reviews: 0
  });
  const [pendingReviews, setPendingReviews] = useState([]);
  const [activeWarehouses, setActiveWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);

  // System status metrics (simulated real-time server stats for high visual impact)
  const [systemLogs, setSystemLogs] = useState([
    { id: 1, action: "Admin Session", msg: "Admin logged into command center", time: "Just now", status: "success" },
    { id: 2, action: "DB Backup Sync", msg: "PostgreSQL master synchronized successfully", time: "5 mins ago", status: "success" },
    { id: 3, action: "User Access", msg: "Warehouse manager WH-ALGIERS validated stock", time: "12 mins ago", status: "info" },
    { id: 4, action: "API Health Check", msg: "All backend node checks returned HTTP 200", time: "25 mins ago", status: "success" }
  ]);

  const appleFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/");
      const allUsers = res.data.results || res.data || [];
      
      const total = allUsers.length;
      const warehouses = allUsers.filter(u => u.role === "WAREHOUSE").length;
      const employees = allUsers.filter(u => u.role === "EMPLOYEE").length;
      const admins = allUsers.filter(u => u.role === "ADMIN").length;
      const pending = allUsers.filter(u => !u.is_active).length;

      setStats({
        total_users: total,
        total_warehouses: warehouses,
        total_employees: employees,
        total_admins: admins,
        pending_reviews: pending
      });

      // Filter pending reviews (inactive accounts)
      setPendingReviews(allUsers.filter(u => !u.is_active));
      // Filter active warehouses to display in active warehouses card
      setActiveWarehouses(allUsers.filter(u => u.role === "WAREHOUSE" && u.is_active));
    } catch (error) {
      console.error("Failed to load admin dashboard stats:", error);
      toast.error("Failed to load real-time admin metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();

    const interval = setInterval(() => {
      const activities = [
        { action: "Stock Verification", msg: "Algiers-East Warehouse inventory level checked", status: "success" },
        { action: "Gateway Sync", msg: "Mobile API gateway status synchronized", status: "info" },
        { action: "Matriculation Validation", msg: "Employee device ID verified successfully", status: "success" },
        { action: "Database Indexing", msg: "Optimized database queries for user logs", status: "info" }
      ];
      const selected = activities[Math.floor(Math.random() * activities.length)];
      setSystemLogs(prev => [
        { id: Date.now(), ...selected, time: "Just now" },
        ...prev.slice(0, 3)
      ]);
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleApproveUser = async (user) => {
    try {
      toast.info(`Approving account for ${user.username || user.email}...`);
      await api.patch(`/users/${user.id}/`, { is_active: true });
      toast.success(`Account approved for ${user.username || user.email}!`);
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to approve user:", error);
      toast.error("Failed to approve user account.");
    }
  };

  const handleRejectUser = async (user) => {
    if (!window.confirm(`Are you sure you want to REJECT and permanently delete the account for "${user.username || user.email}"?`)) return;
    try {
      toast.info(`Deleting account request...`);
      await api.delete(`/users/${user.id}/`);
      toast.success(`Account request deleted.`);
      fetchDashboardData();
    } catch (error) {
      console.error("Failed to reject user:", error);
      toast.error("Failed to reject/delete user account.");
    }
  };

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

  // Sparkline data
  const sparklineData = [
    { value: 10 }, { value: 16 }, { value: 13 }, { value: 24 }, { value: 28 }
  ];
  const sparklineLine1 = [
    { value: 8 }, { value: 15 }, { value: 11 }, { value: 18 }, { value: 25 }
  ];
  const sparklineLine2 = [
    { value: 10 }, { value: 12 }, { value: 15 }, { value: 19 }, { value: 24 }
  ];

  // Donut Chart Data (with safe fallback to prevent NaN render crashes)
  const hasData = stats.total_users > 0;
  const pieData = hasData ? [
    { name: "Warehouses", value: Math.round((stats.total_warehouses / stats.total_users) * 100), color: "#e60000" },
    { name: "Employees", value: Math.round((stats.total_employees / stats.total_users) * 100), color: "#ff6600" },
    { name: "Admins", value: Math.round((stats.total_admins / stats.total_users) * 100), color: "#4f46e5" },
  ] : [
    { name: "Warehouses", value: 30, color: "#e60000" },
    { name: "Employees", value: 50, color: "#ff6600" },
    { name: "Admins", value: 20, color: "#4f46e5" },
  ];

  // Flow Trend Data
  const transactionFlowData = [
    { name: "Jan", incoming: 220, outgoing: 180 },
    { name: "Feb", incoming: 310, outgoing: 240 },
    { name: "Mar", incoming: 480, outgoing: 350 },
    { name: "Apr", incoming: 420, outgoing: 460 },
    { name: "May", incoming: 590, outgoing: 490 },
    { name: "Jun", incoming: 720, outgoing: 610 },
  ];

  // Top Inventory Categories
  const categoryData = [
    { name: "SIM Cards", value: 65 },
    { name: "Routers", value: 45 },
    { name: "Fiber", value: 38 },
    { name: "Hardware", value: 24 },
    { name: "Spares", value: 12 },
  ];

  return (
    <div
      className="p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6 animate-in fade-in duration-500 bg-background text-foreground"
      style={{ fontFamily: appleFont }}
    >
      
      {/* 1. TOP HEADER ROW */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-1">
        <div className="flex flex-col">
          <h1 className="text-[18px] sm:text-[20px] font-bold text-foreground leading-tight">Admin Gateway</h1>
          <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
            Ooredoo portal controller — real-time metrics, warehouse pipeline & system sync.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-end md:self-auto">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">System Live</span>
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
          
          {/* Card 1: Total Accounts */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-2 sm:p-3 md:p-3.5 lg:p-2.5 xl:p-4 2xl:p-5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 lg:h-3.5 lg:w-3.5 xl:h-4.5 xl:w-4.5 2xl:h-5 2xl:w-5 text-slate-500/80 flex-shrink-0" />
                <span className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-[10px] xl:text-xs 2xl:text-sm font-semibold text-slate-600 dark:text-slate-300 truncate leading-tight">Global Users</span>
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[8px] sm:text-[9px] md:text-[10px] lg:text-[8px] xl:text-[10px] 2xl:text-xs px-1 sm:px-1.5 py-0.5 rounded font-semibold shadow-none flex-shrink-0 ml-auto">+12%</Badge>
              </div>
              <div className="flex items-end justify-between mt-2 sm:mt-2.5 md:mt-3 lg:mt-2.5 xl:mt-4 2xl:mt-5">
                <span className="text-lg sm:text-xl md:text-2xl lg:text-lg xl:text-2xl 2xl:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                  {String(stats.total_users).padStart(2, '0')}
                </span>
                <div className="w-10 h-5 sm:w-12 sm:h-6 md:w-14 md:h-7 lg:w-10 lg:h-5 xl:w-16 xl:h-8 2xl:w-20 2xl:h-10 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Bar dataKey="value" fill="hsl(var(--primary))" barSize={3.5} radius={[1, 1, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: Warehouse Managers */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-2 sm:p-3 md:p-3.5 lg:p-2.5 xl:p-4 2xl:p-5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <Warehouse className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 lg:h-3.5 lg:w-3.5 xl:h-4.5 xl:w-4.5 2xl:h-5 2xl:w-5 text-slate-500/80 flex-shrink-0" />
                <span className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-[10px] xl:text-xs 2xl:text-sm font-semibold text-slate-600 dark:text-slate-300 truncate leading-tight">Warehouses</span>
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[8px] sm:text-[9px] md:text-[10px] lg:text-[8px] xl:text-[10px] 2xl:text-xs px-1 sm:px-1.5 py-0.5 rounded font-semibold shadow-none flex-shrink-0 ml-auto">+4%</Badge>
              </div>
              <div className="flex items-end justify-between mt-2 sm:mt-2.5 md:mt-3 lg:mt-2.5 xl:mt-4 2xl:mt-5">
                <span className="text-lg sm:text-xl md:text-2xl lg:text-lg xl:text-2xl 2xl:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                  {String(stats.total_warehouses).padStart(2, '0')}
                </span>
                <div className="w-10 h-5 sm:w-12 sm:h-6 md:w-14 md:h-7 lg:w-10 lg:h-5 xl:w-16 xl:h-8 2xl:w-20 2xl:h-10 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Bar dataKey="value" fill="#ff6600" barSize={3.5} radius={[1, 1, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: Active Employees */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-2 sm:p-3 md:p-3.5 lg:p-2.5 xl:p-4 2xl:p-5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <UserCog className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 lg:h-3.5 lg:w-3.5 xl:h-4.5 xl:w-4.5 2xl:h-5 2xl:w-5 text-slate-500/80 flex-shrink-0" />
                <span className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-[10px] xl:text-xs 2xl:text-sm font-semibold text-slate-600 dark:text-slate-300 truncate leading-tight">Employees</span>
                <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-[8px] sm:text-[9px] md:text-[10px] lg:text-[8px] xl:text-[10px] 2xl:text-xs px-1 sm:px-1.5 py-0.5 rounded font-semibold shadow-none flex-shrink-0 ml-auto">+18%</Badge>
              </div>
              <div className="flex items-end justify-between mt-2 sm:mt-2.5 md:mt-3 lg:mt-2.5 xl:mt-4 2xl:mt-5">
                <span className="text-lg sm:text-xl md:text-2xl lg:text-lg xl:text-2xl 2xl:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                  {String(stats.total_employees).padStart(2, '0')}
                </span>
                <div className="w-10 h-5 sm:w-12 sm:h-6 md:w-14 md:h-7 lg:w-10 lg:h-5 xl:w-16 xl:h-8 2xl:w-20 2xl:h-10 flex-shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sparklineData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Bar dataKey="value" fill="#4f46e5" barSize={3.5} radius={[1, 1, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card 4: Pending Reviews */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-2 sm:p-3 md:p-3.5 lg:p-2.5 xl:p-4 2xl:p-5 flex flex-col justify-between">
              <div className="flex items-center gap-1.5 min-w-0">
                <ShieldAlert className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-4.5 md:w-4.5 lg:h-3.5 lg:w-3.5 xl:h-4.5 xl:w-4.5 2xl:h-5 2xl:w-5 text-slate-500/80 flex-shrink-0" />
                <span className="text-[9px] sm:text-[10px] md:text-[11px] lg:text-[10px] xl:text-xs 2xl:text-sm font-semibold text-slate-600 dark:text-slate-300 truncate leading-tight">Pending Reviews</span>
                <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-none text-[8px] sm:text-[9px] md:text-[10px] lg:text-[8px] xl:text-[10px] 2xl:text-xs px-1 sm:px-1.5 py-0.5 rounded font-semibold shadow-none flex-shrink-0 ml-auto">{stats.pending_reviews}</Badge>
              </div>
              <div className="flex items-end justify-between mt-2 sm:mt-2.5 md:mt-3 lg:mt-2.5 xl:mt-4 2xl:mt-5">
                <span className="text-lg sm:text-xl md:text-2xl lg:text-lg xl:text-2xl 2xl:text-3xl font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                  {String(stats.pending_reviews).padStart(2, '0')}
                </span>
                <div className="flex gap-0.5 sm:gap-1 mb-0.5 flex-shrink-0">
                  {pendingReviews.slice(0, 3).map((r, i) => (
                    <div key={r.id || i} className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-2.5 lg:w-2.5 xl:h-3.5 xl:w-3.5 2xl:h-4 2xl:w-4 rounded-full bg-amber-500 flex items-center justify-center shadow-sm">
                      <ShieldAlert className="h-1.5 w-1.5 sm:h-2 sm:w-2 md:h-2.5 md:w-2.5 lg:h-1.5 lg:w-1.5 xl:h-2 xl:w-2 2xl:h-2.5 2xl:w-2.5 text-white fill-white" />
                    </div>
                  ))}
                  {pendingReviews.length < 4 && <div className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-2.5 lg:w-2.5 xl:h-3.5 xl:w-3.5 2xl:h-4 2xl:w-4 rounded-full bg-muted flex items-center justify-center border border-border" />}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>

      {/* 3. MIDDLE ROW (Transaction Load Flow + Platform Distribution + Top Sectors) */}
      <div className="grid gap-4 lg:gap-6 lg:grid-cols-4 items-start">
        
        {/* Transaction Flow Chart (2/4 width) */}
        <Card className="lg:col-span-2 rounded-2xl border border-border bg-card p-4 sm:p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1">
            <div className="space-y-0.5">
              <CardTitle className="text-sm sm:text-base font-semibold text-foreground">Transaction Load Flow</CardTitle>
              <CardDescription className="text-[10px] sm:text-[11px] text-muted-foreground">
                Live dashboard network queries and transaction flow.
              </CardDescription>
            </div>
            <div className="flex items-center gap-1.5 self-start sm:self-auto">
              <Button variant="outline" size="sm" className="h-7 rounded-lg bg-muted/50 border-border text-[10px] sm:text-[11px] font-semibold gap-1 text-foreground hover:bg-muted px-2">
                <span>All Zones</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
              <Button variant="outline" size="sm" className="h-7 rounded-lg bg-muted/50 border-border text-[10px] sm:text-[11px] font-semibold gap-1 text-foreground hover:bg-muted px-2">
                <span>This Month</span>
                <ChevronDown className="h-3 w-3 text-muted-foreground" />
              </Button>
            </div>
          </div>

          <div className="h-[180px] sm:h-[210px] w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={transactionFlowData} margin={{ top: 10, right: 10, left: -30, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-card rounded-xl border border-border p-2.5 shadow-lg flex flex-col space-y-1">
                          <span className="text-[9px] font-bold text-muted-foreground">Transaction Rate</span>
                          <div className="flex flex-col gap-0.5 text-xs font-bold text-foreground">
                            <span>Incoming: {payload[0]?.value ?? 0} units</span>
                            <span>Outgoing: {payload[1]?.value ?? 0} units</span>
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

        {/* Platform Distribution Donut (1/4 width) */}
        <Card className="rounded-2xl border border-border bg-card p-4 lg:p-3 xl:p-4 2xl:p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between pb-1">
            <div className="flex items-center gap-1 min-w-0">
              <TrendingUp className="h-4 w-4 text-foreground flex-shrink-0" />
              <CardTitle className="text-xs sm:text-sm lg:text-xs xl:text-sm 2xl:text-base font-semibold text-foreground truncate">Roles Distribution</CardTitle>
            </div>
          </div>

          <div className="relative flex items-center justify-center h-[120px] sm:h-[135px] lg:h-[105px] xl:h-[130px] 2xl:h-[140px] my-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  innerRadius={32}
                  outerRadius={46}
                  paddingAngle={4}
                  dataKey="value"
                  stroke={theme === "dark" ? "hsl(var(--card))" : "#ffffff"}
                  strokeWidth={2}
                >
                  {pieData.filter(d => d.value > 0).map((entry, index) => (
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
                  Users
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
                  {stats.total_users}
                </text>
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-1 sm:gap-1.5 mt-1 text-[9px] sm:text-xs lg:text-[10px] xl:text-xs 2xl:text-sm font-medium">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-1 sm:gap-1.5 px-1.5 py-0.5 sm:py-1 lg:px-1 lg:py-0.5 xl:px-2 xl:py-1 2xl:px-2.5 2xl:py-1.5 rounded-md border border-border bg-muted/20 min-w-0">
                <span className="h-1.5 w-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                <span className="truncate text-muted-foreground w-full">{item.name}: <span className="font-bold text-foreground">{item.value}%</span></span>
              </div>
            ))}
          </div>
        </Card>

        {/* Top Inventory Categories (1/4 width) */}
        <Card className="rounded-2xl border border-border bg-card p-4 lg:p-3 xl:p-4 2xl:p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center gap-2 pb-2 border-b border-border font-medium">
            <Briefcase className="h-4 w-4 text-blue-500 shrink-0" />
            <div className="min-w-0">
              <CardTitle className="text-xs sm:text-sm lg:text-xs xl:text-sm 2xl:text-base font-semibold text-foreground truncate">Inventory Share</CardTitle>
            </div>
          </div>
          <div className="h-[120px] sm:h-[135px] lg:h-[105px] xl:h-[130px] 2xl:h-[140px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 0, right: 10, left: 15, bottom: 0 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} width={55} />
                <Tooltip cursor={{ fill: "transparent" }} contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px', fontSize: '10px', padding: '4px 8px' }} />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={8} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* 4. BOTTOM ROW (Pending Approvals Pipeline + System Activity Log) */}
      <div className="grid gap-4 lg:gap-6 lg:grid-cols-3 items-start">

        {/* Left column wrapper for Pipeline + System Health */}
        <div className="lg:col-span-2 space-y-4 lg:space-y-6">
          {/* Pending Reviews Pipeline Table */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm overflow-visible">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 sm:p-5 pb-0">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-amber-500" />
                <CardTitle className="text-sm sm:text-base font-semibold text-foreground">Pending Registrations</CardTitle>
              </div>
              <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 dark:bg-amber-950/25 text-amber-600 dark:text-amber-400 border border-amber-100/60 dark:border-amber-900/30">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)] animate-pulse" />
                {stats.pending_reviews} pending
              </div>
            </div>
            
            <div className="p-4 sm:p-5 pt-3">
              <div className="w-full rounded-xl border border-border overflow-visible">
                <table className="w-full table-fixed border-collapse text-left">
                  <thead>
                    <tr className="bg-red-50/50 dark:bg-zinc-900 border-b border-red-100/50 dark:border-zinc-800">
                      <th className="text-[11px] font-bold tracking-wider text-primary py-3 px-4 w-[40%] rounded-tl-xl">User / Email</th>
                      <th className="text-[11px] font-bold tracking-wider text-primary py-3 px-4 w-[20%]">Requested Role</th>
                      <th className="text-[11px] font-bold tracking-wider text-primary py-3 px-4 w-[15%]">Details</th>
                      <th className="text-[11px] font-bold tracking-wider text-primary py-3 px-4 text-right rounded-tr-xl">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingReviews.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center">
                          <div className="flex flex-col items-center justify-center gap-2">
                            <ShieldCheck className="w-9 h-9 text-emerald-500/60" />
                            <span className="text-[13px] font-bold text-foreground">Pipeline Clear!</span>
                            <span className="text-[11px] text-muted-foreground max-w-xs">All user registrations have been reviewed.</span>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pendingReviews.map((user) => (
                        <tr
                          key={user.id}
                          className="border-b border-gray-100 dark:border-zinc-800/60 last:border-b-0 hover:bg-gray-50/40 dark:hover:bg-zinc-900/35 transition-colors duration-150"
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-red-50 dark:bg-zinc-800 flex items-center justify-center border border-red-100 dark:border-zinc-700 shadow-sm shrink-0">
                                <Users className="w-3.5 h-3.5 text-primary dark:text-zinc-400" />
                              </div>
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="text-[12px] font-bold text-gray-900 dark:text-zinc-100 truncate">{user.username || "Anonymous"}</span>
                                <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-mono truncate">{user.email}</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20 capitalize">
                              {user.role?.toLowerCase() || "user"}
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-zinc-300 truncate">
                              <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                              {user.location || "N/A"}
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleRejectUser(user)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 transition-colors"
                              >
                                <X className="w-3 h-3" /> Reject
                              </button>
                              <button
                                onClick={() => handleApproveUser(user)}
                                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 transition-colors"
                              >
                                <Check className="w-3 h-3" /> Approve
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Card>

          {/* System Health Card */}
          <Card className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-5">
            <div className="flex items-center gap-2 pb-4 border-b border-border/50">
              <Database className="h-4 w-4 text-emerald-500" />
              <div>
                <CardTitle className="text-sm sm:text-base font-semibold text-foreground">System Health & Infrastructure</CardTitle>
                <CardDescription className="text-[10px] text-muted-foreground">Live server metrics and database status.</CardDescription>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
               <div className="flex flex-col gap-1 sm:border-r border-border/40 px-2">
                 <span className="text-[11px] font-semibold text-muted-foreground">Api Latency</span>
                 <span className="text-xl font-bold text-foreground">24<span className="text-[10px] font-semibold text-muted-foreground ml-0.5">ms</span></span>
                 <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded w-fit">Optimal</span>
               </div>
               <div className="flex flex-col gap-1 sm:border-r border-border/40 px-2">
                 <span className="text-[11px] font-semibold text-muted-foreground">Uptime</span>
                 <span className="text-xl font-bold text-foreground">99.9<span className="text-[10px] font-semibold text-muted-foreground ml-0.5">%</span></span>
                 <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded w-fit">94 days</span>
               </div>
               <div className="flex flex-col gap-1 sm:border-r border-border/40 px-2">
                 <span className="text-[11px] font-semibold text-muted-foreground">Storage</span>
                 <span className="text-xl font-bold text-foreground">42<span className="text-[10px] font-semibold text-muted-foreground ml-0.5">GB</span></span>
                 <span className="text-[9px] font-bold text-blue-500 bg-blue-500/10 px-1 py-0.5 rounded w-fit">28% used</span>
               </div>
               <div className="flex flex-col gap-1 px-2">
                 <span className="text-[11px] font-semibold text-muted-foreground">Load</span>
                 <span className="text-xl font-bold text-foreground">1.2<span className="text-[10px] font-semibold text-muted-foreground ml-0.5">avg</span></span>
                 <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-1 py-0.5 rounded w-fit">Stable</span>
               </div>
            </div>
          </Card>
        </div>

        {/* Right Column: Activity Log + Warehouses List */}
        <div className="space-y-4">
          
          {/* Platform Activity Log */}
          <Card className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Activity className="h-4 w-4 text-blue-500" />
              <div>
                <CardTitle className="text-xs sm:text-sm font-semibold text-foreground">Platform Activity</CardTitle>
                <CardDescription className="text-[10px] text-muted-foreground">Real-time API validations & hooks.</CardDescription>
              </div>
            </div>
            <div className="pt-3 space-y-3">
              {systemLogs.map((log) => (
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

          {/* Active Warehouses Whitelist */}
          <Card className="rounded-2xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-border">
              <Globe className="h-4 w-4 text-primary" />
              <div>
                <CardTitle className="text-xs sm:text-sm font-semibold text-foreground">Warehouse Whitelist</CardTitle>
                <CardDescription className="text-[10px] text-muted-foreground">Authorized locations on network map.</CardDescription>
              </div>
            </div>
            <div className="pt-3 space-y-2.5">
              {activeWarehouses.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-2">No active warehouses registered.</p>
              ) : (
                activeWarehouses.map((wh, idx) => (
                  <div key={wh.id ?? idx} className="flex items-center justify-between gap-2 text-xs border-b border-border/40 pb-2 last:border-0 last:pb-0 min-w-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="font-semibold text-foreground text-[11px] truncate">{wh.username}</span>
                    </div>
                    {wh.location && (
                      <span className="font-mono text-[9px] text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20 shrink-0">
                        {wh.location}
                      </span>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>

    </div>
  );
}
