import { useEffect, useState } from "react";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Search,
  Warehouse,
  MapPin,
  MoreVertical,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  Package,
  Plus,
  Eye,
  X,
  Edit,
  Box,
  TrendingUp
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/custom-toast";

import api from "@/api/api";

export default function WarehouseManagement() {
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [warehouses, setWarehouses] = useState([]);

  const appleFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const [newWarehouse, setNewWarehouse] = useState({
    name: "", location: "", manager: "", capacity: 0, zones: 0, email: "", password: ""
  });

  const fetchWarehouses = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/?role=WAREHOUSE");
      const data = res.data.results || res.data || [];
      // Map API fields to UI fields
      const mapped = data.map(user => ({
        id: user.id,
        name: user.username,
        email: user.email,
        location: user.location || "Location not set",
        manager: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : (user.email || user.username),
        capacity: user.capacity || 5000,
        used: user.used_capacity || 0, 
        status: user.is_active ? "Active" : "Inactive",
        zones: user.zones || 1, 
        lastAudit: "—",
      }));
      setWarehouses(mapped);
    } catch (error) {
      console.error("Failed to fetch warehouses:", error);
      toast.error("Failed to load warehouses.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWarehouses();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, entriesPerPage]);

  const handleCreateWarehouse = async () => {
    if (!newWarehouse.name.trim() || !newWarehouse.email.trim() || !newWarehouse.password.trim()) {
      toast.error("Name, email, and password are required.");
      return;
    }
    try {
      const payload = {
        role: "WAREHOUSE",
        username: newWarehouse.name,
        email: newWarehouse.email,
        password: newWarehouse.password,
        location: newWarehouse.location,
        first_name: newWarehouse.manager.split(" ")[0] || "",
        last_name: newWarehouse.manager.split(" ").slice(1).join(" ") || "",
        capacity: Number(newWarehouse.capacity) || 0,
        zones: Number(newWarehouse.zones) || 1
      };
      await api.post("/users/", payload);
      toast.success(`Warehouse "${newWarehouse.name}" registered.`);
      setShowCreateModal(false);
      setNewWarehouse({ name: "", location: "", manager: "", capacity: 0, zones: 0, email: "", password: "" });
      fetchWarehouses();
    } catch (error) {
      console.error("Failed to create warehouse:", error);
      toast.error("Failed to register warehouse.");
    }
  };

  const handleDeleteWarehouse = async (wh) => {
    if (!window.confirm(`Remove "${wh.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${wh.id}/`);
      setWarehouses(prev => prev.filter(w => w.id !== wh.id));
      toast.success("Warehouse removed.");
    } catch (error) {
      console.error("Failed to delete warehouse:", error);
      toast.error("Failed to remove warehouse.");
    }
  };

  const handleToggleStatus = async (wh) => {
    const nextStatus = wh.status === "Active" ? false : true;
    try {
      await api.patch(`/users/${wh.id}/`, { is_active: nextStatus });
      setWarehouses(prev => prev.map(w => w.id === wh.id ? { ...w, status: nextStatus ? "Active" : "Inactive" } : w));
      toast.success(`"${wh.name}" is now ${nextStatus ? "Active" : "Inactive"}.`);
    } catch (error) {
      console.error("Failed to toggle status:", error);
      toast.error("Failed to update status.");
    }
  };

  const filteredWarehouses = warehouses.filter(wh => {
    if (statusFilter !== "ALL" && wh.status !== statusFilter) return false;
    const q = searchQuery.toLowerCase();
    return (
      wh.name.toLowerCase().includes(q) ||
      wh.location.toLowerCase().includes(q) ||
      wh.manager.toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredWarehouses.length / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedWarehouses = filteredWarehouses.slice(startIndex, startIndex + entriesPerPage);

  const totalCapacity = warehouses.reduce((s, w) => s + w.capacity, 0);
  const totalUsed = warehouses.reduce((s, w) => s + w.used, 0);
  const avgUtilization = totalCapacity > 0 ? Math.round((totalUsed / totalCapacity) * 100) : 0;
  const totalZones = warehouses.reduce((s, w) => s + w.zones, 0);
  const activeCount = warehouses.filter(w => w.status === "Active").length;

  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return { cls: "bg-emerald-50 dark:bg-emerald-950/25 text-emerald-600 dark:text-emerald-400 border border-emerald-100/60 dark:border-emerald-900/30", dot: "bg-emerald-500" };
      case "Warning":
        return { cls: "bg-amber-50 dark:bg-amber-950/25 text-amber-600 dark:text-amber-400 border border-amber-100/60 dark:border-amber-900/30", dot: "bg-amber-500" };
      case "Inactive":
        return { cls: "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700", dot: "bg-gray-400" };
      default:
        return { cls: "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400", dot: "bg-gray-400" };
    }
  };

  const getCapacityColor = (pct) => {
    if (pct >= 90) return "bg-red-500";
    if (pct >= 70) return "bg-amber-500";
    return "bg-emerald-500";
  };

  return (
    <div className="p-4 md:p-6 space-y-5 bg-background h-full animate-in fade-in duration-500" style={{ fontFamily: appleFont }}>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <Warehouse className="h-5 w-5 text-primary" />
            Warehouse Network
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary select-none">
              {warehouses.length} Sites
            </span>
          </h1>
          <p className="text-[13px] font-medium text-muted-foreground mt-1">
            Monitor and manage Ooredoo warehouses across the national network.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
            <input type="text" placeholder="Search warehouses..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 border border-border rounded-lg text-xs bg-background w-44 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground shadow-sm" />
          </div>

          <div className="relative">
            <button onClick={() => setShowStatusFilter(!showStatusFilter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs bg-background font-semibold shadow-sm focus:outline-none transition-colors ${statusFilter !== "ALL" ? "border-primary/50 text-primary" : "border-border text-muted-foreground hover:bg-muted"}`}>
              <span>Status: {statusFilter === "ALL" ? "All" : statusFilter}</span>
            </button>
            {showStatusFilter && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowStatusFilter(false)} />
                <div className="absolute right-0 mt-1.5 w-36 rounded-lg bg-card border border-border shadow-lg py-1 z-20">
                  {["ALL", "Active", "Warning", "Inactive"].map(s => (
                    <button key={s} className={`w-full text-left px-4 py-2 text-[12px] font-semibold transition-colors ${statusFilter === s ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
                      onClick={() => { setStatusFilter(s); setShowStatusFilter(false); }}>
                      {s === "ALL" ? "All" : s}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm">
            <Plus className="w-3.5 h-3.5" /> Add Site
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Sites", value: warehouses.length, icon: Warehouse, color: "text-primary" },
          { label: "Active", value: activeCount, icon: Eye, color: "text-emerald-500" },
          { label: "Avg. Utilization", value: `${avgUtilization}%`, icon: TrendingUp, color: "text-blue-500" },
          { label: "Total Zones", value: totalZones, icon: Box, color: "text-orange-500" },
        ].map((stat, idx) => (
          <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card shadow-sm">
            <div className={`p-2 rounded-lg bg-muted ${stat.color}`}>
              <stat.icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-lg font-bold text-foreground leading-none">{stat.value}</p>
              <p className="text-[10px] font-semibold text-muted-foreground mt-0.5">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-visible animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="w-full">
          {loading ? (
            <div className="p-10 text-center flex flex-col items-center justify-center min-h-[300px]">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-3"></div>
              <span className="text-sm font-medium text-muted-foreground">Loading warehouses...</span>
            </div>
          ) : filteredWarehouses.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center space-y-3 bg-muted/30">
              <Warehouse className="w-10 h-10 stroke-[1.5] text-muted-foreground" />
              <span className="text-[13px] font-medium text-muted-foreground">No warehouses found.</span>
            </div>
          ) : (
            <table className="w-full table-fixed border-collapse text-left">
              <thead>
                <tr className="bg-red-50/50 dark:bg-zinc-900 border-b border-red-100/50 dark:border-zinc-800">
                  <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 w-[28%] rounded-tl-xl">Warehouse</th>
                  <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 w-[18%]">Location</th>
                  <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 w-[14%]">Manager</th>
                  <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 w-[10%]">Status</th>
                  <th className="hidden lg:table-cell text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 w-[18%]">Capacity</th>
                  <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 text-right w-[8%] rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedWarehouses.map((wh) => {
                  const safeCapacity = wh.capacity || 5000;
                  const pct = Math.round((wh.used / safeCapacity) * 100);
                  const statusStyle = getStatusBadge(wh.status);
                  return (
                    <tr key={wh.id} className="transition-colors duration-150 border-b border-border/40 last:border-b-0 hover:bg-muted/30 group">
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
                            <Warehouse className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-semibold text-foreground truncate">{wh.name}</span>
                            <span className="text-[10px] text-muted-foreground">{wh.zones} zones • Last audit: {wh.lastAudit}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground min-w-0">
                          <MapPin className="h-3 w-3 shrink-0 text-primary/60" />
                          <span className="truncate">{wh.location}</span>
                        </div>
                      </td>
                      <td className="py-3 px-6">
                        <span className="text-[12px] font-semibold text-foreground truncate block">{wh.manager}</span>
                      </td>
                      <td className="py-3 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${statusStyle.cls}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          {wh.status}
                        </span>
                      </td>
                      <td className="hidden lg:table-cell py-3 px-6">
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                            <span>{wh.used.toLocaleString()} used</span>
                            <span>{safeCapacity.toLocaleString()} total</span>
                          </div>
                          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${getCapacityColor(pct)}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                          <span className="text-[9px] font-bold text-muted-foreground">
                            {pct}% utilized
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44 p-1.5 shadow-lg rounded-xl border border-border bg-card">
                            <DropdownMenuItem className="cursor-pointer gap-2 text-xs font-semibold rounded-lg py-1.5" onClick={() => handleToggleStatus(wh)}>
                              {wh.status === "Active" ? (
                                <><Eye className="h-3.5 w-3.5 text-amber-500" /><span>Deactivate</span></>
                              ) : (
                                <><Eye className="h-3.5 w-3.5 text-emerald-500" /><span>Activate</span></>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem className="cursor-pointer gap-2 text-xs font-semibold rounded-lg py-1.5 text-red-600 dark:text-red-400" onClick={() => handleDeleteWarehouse(wh)}>
                              <Trash2 className="h-3.5 w-3.5" /><span>Remove</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground rounded-b-xl">
          <div className="flex items-center gap-1.5">
            <span>Show</span>
            <select value={entriesPerPage} onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="border border-border rounded px-1.5 py-0.5 bg-background text-foreground focus:outline-none font-medium">
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
            <span>per page</span>
          </div>
          <div className="flex items-center gap-1">
            <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} className="p-1 hover:bg-muted rounded disabled:opacity-30 transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            {Array.from({ length: totalPages }).map((_, idx) => (
              <button key={idx + 1} onClick={() => setCurrentPage(idx + 1)}
                className={`w-6 h-6 flex items-center justify-center rounded-md font-semibold text-xs transition-colors ${currentPage === idx + 1 ? "bg-primary text-white shadow-sm" : "hover:bg-muted text-muted-foreground"}`}>
                {idx + 1}
              </button>
            ))}
            <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} className="p-1 hover:bg-muted rounded disabled:opacity-30 transition-colors">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Create Warehouse Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()} style={{ fontFamily: appleFont }}>

            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-primary" /> Register New Warehouse
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-md hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Email Address *</label>
                  <input type="email" value={newWarehouse.email} onChange={e => setNewWarehouse(p => ({ ...p, email: e.target.value }))}
                    placeholder="wh@ooredoo.dz"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Password *</label>
                  <input type="password" value={newWarehouse.password} onChange={e => setNewWarehouse(p => ({ ...p, password: e.target.value }))}
                    placeholder="••••••••"
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Warehouse Name (Username) *</label>
                <input type="text" value={newWarehouse.name} onChange={e => setNewWarehouse(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Algiers North Depot"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Location</label>
                <input type="text" value={newWarehouse.location} onChange={e => setNewWarehouse(p => ({ ...p, location: e.target.value }))}
                  placeholder="e.g. Algiers, Rouiba"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Assigned Manager</label>
                <input type="text" value={newWarehouse.manager} onChange={e => setNewWarehouse(p => ({ ...p, manager: e.target.value }))}
                  placeholder="Manager full name"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Capacity (units)</label>
                  <input type="number" min="0" value={newWarehouse.capacity} onChange={e => setNewWarehouse(p => ({ ...p, capacity: e.target.value }))}
                    className="w-full px-2 py-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none font-medium" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Storage Zones</label>
                  <input type="number" min="1" value={newWarehouse.zones} onChange={e => setNewWarehouse(p => ({ ...p, zones: e.target.value }))}
                    className="w-full px-2 py-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none font-medium" />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors border border-border">
                Cancel
              </button>
              <button onClick={handleCreateWarehouse} className="px-4 py-2 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm">
                Register Site
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
