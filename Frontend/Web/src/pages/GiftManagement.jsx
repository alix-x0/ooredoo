import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Gift,
  Search,
  Plus,
  Package,
  Users,
  Calendar,
  MoreVertical,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Star,
  Eye,
  X,
  Send,
  UserCheck,
  Undo2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import api from "@/api/api";
import { useToast } from "@/components/ui/custom-toast";

export default function GiftManagement() {
  const toast = useToast();
  const [gifts, setGifts] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("gifts"); // "gifts" or "assignments"
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedGift, setSelectedGift] = useState(null);
  const [selectedGiftId, setSelectedGiftId] = useState("");
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);
  const [giftSearch, setGiftSearch] = useState("");
  const [showGiftDropdown, setShowGiftDropdown] = useState(false);
  
  const appleFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const fetchData = async () => {
    try {
      setLoading(true);
      const [giftsRes, assignmentsRes, employeesRes] = await Promise.all([
        api.get("/gifts/"),
        api.get("/gift-assignments/"),
        api.get("/users/?role=EMPLOYEE")
      ]);
      setGifts(giftsRes.data.results || giftsRes.data || []);
      setAssignments(assignmentsRes.data.results || assignmentsRes.data || []);
      setEmployees(employeesRes.data.results || employeesRes.data || []);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      toast.error("Failed to load gifts and assignment registries.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, entriesPerPage, activeTab]);

  const handleDeleteGift = async (gift) => {
    if (!window.confirm(`Delete "${gift.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/gifts/${gift.id}/`);
      setGifts(prev => prev.filter(g => g.id !== gift.id));
      toast.success("Gift deleted.");
    } catch (error) {
      console.error("Failed to delete gift:", error);
      toast.error("Failed to delete gift.");
    }
  };

  const handleToggleStatus = async (gift) => {
    const nextStatus = gift.status === "Active" ? "Paused" : "Active";
    try {
      const res = await api.patch(`/gifts/${gift.id}/`, { status: nextStatus });
      setGifts(prev => prev.map(g => g.id === gift.id ? res.data : g));
      toast.success(`"${gift.name}" is now ${nextStatus}.`);
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to change status.");
    }
  };

  const openAssignModal = (gift) => {
    setSelectedGift(gift);
    setSelectedEmployeeId("");
    setEmployeeSearch("");
    setShowEmployeeDropdown(false);
    setGiftSearch("");
    setShowGiftDropdown(false);
    if (gift) {
      setSelectedGiftId(gift.id.toString());
    } else {
      setSelectedGiftId("");
    }
    setShowAssignModal(true);
  };

  const handleAssignGift = async () => {
    const giftId = selectedGift ? selectedGift.id : Number(selectedGiftId);
    if (!giftId) {
      toast.error("Please select a gift.");
      return;
    }
    if (!selectedEmployeeId) {
      toast.error("Please select an employee.");
      return;
    }
    try {
      const res = await api.post("/gift-assignments/", {
        gift: giftId,
        employee: Number(selectedEmployeeId)
      });
      toast.success(`Successfully assigned gift to employee!`);
      setShowAssignModal(false);
      setSelectedGift(null);
      setSelectedGiftId("");
      setSelectedEmployeeId("");
      setEmployeeSearch("");
      setShowEmployeeDropdown(false);
      setGiftSearch("");
      setShowGiftDropdown(false);
      fetchData();
    } catch (error) {
      console.error("Failed to assign gift:", error);
      const errMsg = error.response?.data?.gift || "Failed to assign gift.";
      toast.error(typeof errMsg === "string" ? errMsg : JSON.stringify(errMsg));
    }
  };

  const handleRevokeAssignment = async (assignment) => {
    if (!window.confirm(`Revoke assignment of "${assignment.gift_name}" to ${assignment.employee_email}? Stock will be restored.`)) return;
    try {
      await api.delete(`/gift-assignments/${assignment.id}/`);
      toast.success("Assignment revoked and stock returned.");
      fetchData();
    } catch (error) {
      console.error("Failed to revoke assignment:", error);
      toast.error("Failed to revoke assignment.");
    }
  };

  // Filter gifts or assignments
  const filteredGifts = gifts.filter(g => {
    if (statusFilter !== "ALL" && g.status !== statusFilter) return false;
    const q = searchQuery.toLowerCase();
    return (
      (g.name || "").toLowerCase().includes(q) ||
      (g.description || "").toLowerCase().includes(q) ||
      (g.category || "").toLowerCase().includes(q) ||
      (g.warehouse_name || "").toLowerCase().includes(q)
    );
  });

  const filteredAssignments = assignments.filter(a => {
    const q = searchQuery.toLowerCase();
    return (
      (a.gift_name || "").toLowerCase().includes(q) ||
      (a.employee_email || "").toLowerCase().includes(q) ||
      (a.employee_name || "").toLowerCase().includes(q) ||
      (a.assigned_by_email || "").toLowerCase().includes(q)
    );
  });

  const itemsToPaginate = activeTab === "gifts" ? filteredGifts : filteredAssignments;
  const totalPages = Math.ceil(itemsToPaginate.length / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedItems = itemsToPaginate.slice(startIndex, startIndex + entriesPerPage);

  // Stats
  const totalGifts = gifts.length;
  const activeGifts = gifts.filter(g => g.status === "Active").length;
  const totalClaimed = gifts.reduce((sum, g) => sum + (g.claimed || 0), 0);
  const totalStock = gifts.reduce((sum, g) => sum + (g.stock || 0), 0);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Active":
        return "bg-emerald-50 dark:bg-emerald-950/25 text-emerald-600 dark:text-emerald-400 border border-emerald-100/60 dark:border-emerald-900/30";
      case "Paused":
        return "bg-amber-50 dark:bg-amber-950/25 text-amber-600 dark:text-amber-400 border border-amber-100/60 dark:border-amber-900/30";
      case "Archived":
        return "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700";
      default:
        return "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400";
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "High":
        return "bg-red-50 dark:bg-red-950/25 text-red-600 dark:text-red-400 border border-red-100/60 dark:border-red-900/30";
      case "Medium":
        return "bg-blue-50 dark:bg-blue-950/25 text-blue-600 dark:text-blue-400 border border-blue-100/60 dark:border-blue-900/30";
      case "Low":
        return "bg-gray-50 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400 border border-gray-200 dark:border-zinc-700";
      default:
        return "";
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-5 bg-background h-full animate-in fade-in duration-500" style={{ fontFamily: appleFont }}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <Gift className="h-5 w-5 text-primary" />
            Gift Management
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary select-none">
              {totalGifts} Items
            </span>
          </h1>
          <p className="text-[13px] font-medium text-muted-foreground mt-1">
            Track and assign employee gifts and rewards programs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder={activeTab === "gifts" ? "Search gifts..." : "Search assignments..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 border border-border rounded-lg text-xs bg-background w-44 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground shadow-sm"
            />
          </div>

          {/* Status Filter (Only for gifts tab) */}
          {activeTab === "gifts" && (
            <div className="relative">
              <button 
                onClick={() => setShowStatusFilter(!showStatusFilter)}
                className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs bg-background font-semibold shadow-sm focus:outline-none transition-colors ${
                  statusFilter !== "ALL" ? "border-primary/50 text-primary" : "border-border text-muted-foreground hover:bg-muted"
                }`}
              >
                <span>Status: {statusFilter === "ALL" ? "All" : statusFilter}</span>
              </button>
              {showStatusFilter && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowStatusFilter(false)} />
                  <div className="absolute right-0 mt-1.5 w-36 rounded-lg bg-card border border-border shadow-lg py-1 z-20">
                    {["ALL", "Active", "Paused", "Archived"].map((s) => (
                      <button key={s} className={`w-full text-left px-4 py-2 text-[12px] font-semibold transition-colors ${statusFilter === s ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
                        onClick={() => { setStatusFilter(s); setShowStatusFilter(false); }}>
                        {s === "ALL" ? "All Statuses" : s}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Assign Button */}
          <button 
            onClick={() => openAssignModal(null)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Assign Gift
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Gifts", value: totalGifts, icon: Gift, color: "text-primary" },
          { label: "Active Gifts", value: activeGifts, icon: Star, color: "text-emerald-500" },
          { label: "Total Claimed / Given", value: totalClaimed.toLocaleString(), icon: Users, color: "text-blue-500" },
          { label: "In Stock", value: totalStock.toLocaleString(), icon: Package, color: "text-orange-500" },
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

      {/* Tabs */}
      <div className="flex border-b border-border gap-2">
        <button
          onClick={() => setActiveTab("gifts")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === "gifts" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Gift className="w-3.5 h-3.5" />
          Gifts Registry
        </button>
        <button
          onClick={() => setActiveTab("assignments")}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold border-b-2 transition-all ${
            activeTab === "assignments" ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          Assignments History
          {assignments.length > 0 && (
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-extrabold">
              {assignments.length}
            </span>
          )}
        </button>
      </div>

      {/* Main Table Content */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-visible animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="w-full">
          {activeTab === "gifts" ? (
            /* GIFTS REGISTRY VIEW */
            filteredGifts.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center space-y-3 bg-muted/30">
                <Gift className="w-10 h-10 stroke-[1.5] text-muted-foreground" />
                <span className="text-[13px] font-medium text-muted-foreground">No gifts found in database.</span>
              </div>
            ) : (
              <table className="w-full table-fixed border-collapse text-left">
                <thead>
                  <tr className="bg-red-50/50 dark:bg-zinc-900 border-b border-red-100/50 dark:border-zinc-800">
                    <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 w-[28%] rounded-tl-xl">Gift Details</th>
                    <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 w-[14%]">Warehouse / Src</th>
                    <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 w-[12%]">Category</th>
                    <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 w-[10%]">Priority</th>
                    <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 w-[10%]">Status</th>
                    <th className="hidden lg:table-cell text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 w-[16%]">Stock / Claimed</th>
                    <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 text-right w-[10%] rounded-tr-xl">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((gift) => {
                    const claimPercent = gift.stock + gift.claimed > 0 ? Math.round((gift.claimed / (gift.stock + gift.claimed)) * 100) : 0;
                    return (
                      <tr key={gift.id} className="transition-colors duration-150 border-b border-border/40 last:border-b-0 hover:bg-muted/30 group">
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
                              <Gift className="w-4 h-4 text-primary" />
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-[13px] font-semibold text-foreground truncate">{gift.name}</span>
                              <span className="text-[10px] text-muted-foreground truncate">{gift.description}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-6 truncate text-[11px] font-semibold text-muted-foreground font-mono">
                          {gift.warehouse_name || "Admin Direct"}
                        </td>
                        <td className="py-3 px-6">
                          <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">{gift.category}</span>
                        </td>
                        <td className="py-3 px-6">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${getPriorityBadge(gift.priority)}`}>{gift.priority}</span>
                        </td>
                        <td className="py-3 px-6">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${getStatusBadge(gift.status)}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${gift.status === "Active" ? "bg-emerald-500" : gift.status === "Paused" ? "bg-amber-500" : "bg-gray-400"}`} />
                            {gift.status}
                          </span>
                        </td>
                        <td className="hidden lg:table-cell py-3 px-6">
                          <div className="space-y-1.5">
                            <div className="flex justify-between text-[10px] font-semibold text-muted-foreground">
                              <span>{gift.claimed} given</span>
                              <span>{gift.stock} in stock</span>
                            </div>
                            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${claimPercent}%` }} />
                            </div>
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
                              {gift.status === "Active" && gift.stock > 0 && (
                                <DropdownMenuItem className="cursor-pointer gap-2 text-xs font-semibold rounded-lg py-1.5 text-primary focus:text-primary focus:bg-primary/5" onClick={() => openAssignModal(gift)}>
                                  <Send className="h-3.5 w-3.5" /><span>Assign Gift</span>
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem className="cursor-pointer gap-2 text-xs font-semibold rounded-lg py-1.5" onClick={() => handleToggleStatus(gift)}>
                                {gift.status === "Active" ? (
                                  <><Eye className="h-3.5 w-3.5 text-amber-500" /><span>Pause</span></>
                                ) : (
                                  <><Eye className="h-3.5 w-3.5 text-emerald-500" /><span>Activate</span></>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="cursor-pointer gap-2 text-xs font-semibold rounded-lg py-1.5 text-red-600 dark:text-red-400" onClick={() => handleDeleteGift(gift)}>
                                <Trash2 className="h-3.5 w-3.5" /><span>Delete</span>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
          ) : (
            /* ASSIGNMENTS HISTORY VIEW */
            filteredAssignments.length === 0 ? (
              <div className="p-10 text-center flex flex-col items-center justify-center space-y-3 bg-muted/30">
                <Calendar className="w-10 h-10 stroke-[1.5] text-muted-foreground" />
                <span className="text-[13px] font-medium text-muted-foreground">No gift assignments logged yet.</span>
              </div>
            ) : (
              <table className="w-full table-fixed border-collapse text-left">
                <thead>
                  <tr className="bg-red-50/50 dark:bg-zinc-900 border-b border-red-100/50 dark:border-zinc-800">
                    <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 w-[25%] rounded-tl-xl">Assigned Item</th>
                    <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 w-[25%]">Assigned To (Employee)</th>
                    <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 w-[20%]">Assigned By (Admin)</th>
                    <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 w-[20%]">Timestamp</th>
                    <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 text-right w-[10%] rounded-tr-xl">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedItems.map((assign) => {
                    const formattedDate = new Date(assign.assigned_at).toLocaleString();
                    return (
                      <tr key={assign.id} className="transition-colors duration-150 border-b border-border/40 last:border-b-0 hover:bg-muted/30 group">
                        <td className="py-3 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                              <Gift className="w-3.5 h-3.5 text-primary" />
                            </div>
                            <span className="text-[13px] font-semibold text-foreground truncate">{assign.gift_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-6">
                          <div className="flex flex-col min-w-0">
                            <span className="text-[12px] font-semibold text-foreground truncate">{assign.employee_name}</span>
                            <span className="text-[10px] text-muted-foreground truncate font-mono">{assign.employee_email}</span>
                          </div>
                        </td>
                        <td className="py-3 px-6 text-[11px] font-semibold text-muted-foreground font-mono truncate">
                          {assign.assigned_by_email || "System"}
                        </td>
                        <td className="py-3 px-6 text-[11px] font-semibold text-muted-foreground">
                          {formattedDate}
                        </td>
                        <td className="py-3 px-6 text-right">
                          <button
                            onClick={() => handleRevokeAssignment(assign)}
                            className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 dark:hover:bg-red-950/20 transition-colors focus:outline-none"
                            title="Revoke Assignment"
                          >
                            <Undo2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )
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

      {/* Assign Gift Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAssignModal(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200" 
            onClick={e => e.stopPropagation()} style={{ fontFamily: appleFont }}>
            
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Send className="h-4 w-4 text-primary" /> Assign Gift to Employee
              </h2>
              <button onClick={() => setShowAssignModal(false)} className="p-1 rounded-md hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {selectedGift ? (
                <div className="p-3 bg-muted/40 rounded-xl border border-border flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    <Gift className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{selectedGift.name}</h4>
                    <p className="text-[10px] text-muted-foreground font-semibold mt-0.5">{selectedGift.stock} units currently in stock</p>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1.5">Search Gift *</label>
                  <input 
                    type="text"
                    placeholder="Start typing gift name..."
                    value={giftSearch}
                    onFocus={() => setShowGiftDropdown(true)}
                    onBlur={() => setTimeout(() => setShowGiftDropdown(false), 200)}
                    onChange={e => {
                      setGiftSearch(e.target.value);
                      setShowGiftDropdown(true);
                      const activeGifts = gifts.filter(g => g.status === "Active" && g.stock > 0);
                      const match = activeGifts.find(g => `${g.name} (${g.stock} in stock)` === e.target.value);
                      setSelectedGiftId(match ? match.id.toString() : "");
                    }}
                    className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-semibold"
                  />
                  {showGiftDropdown && (
                    <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto overflow-x-hidden">
                      {gifts.filter(g => g.status === "Active" && g.stock > 0).filter(g => {
                        const display = `${g.name} (${g.stock} in stock)`;
                        return display.toLowerCase().includes(giftSearch.toLowerCase());
                      }).map(g => {
                        const display = `${g.name} (${g.stock} in stock)`;
                        return (
                          <div 
                            key={g.id}
                            className="px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-muted text-foreground transition-colors"
                            onClick={() => {
                              setGiftSearch(display);
                              setSelectedGiftId(g.id.toString());
                              setShowGiftDropdown(false);
                            }}
                          >
                            {display}
                          </div>
                        );
                      })}
                      {gifts.filter(g => g.status === "Active" && g.stock > 0).filter(g => {
                        const display = `${g.name} (${g.stock} in stock)`;
                        return display.toLowerCase().includes(giftSearch.toLowerCase());
                      }).length === 0 && (
                        <div className="px-3 py-2 text-xs text-muted-foreground italic">No matching gifts found.</div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="relative">
                <label className="text-[11px] font-bold text-muted-foreground block mb-1.5">Search Employee *</label>
                <input 
                  type="text"
                  placeholder="Start typing name or email..."
                  value={employeeSearch}
                  onFocus={() => setShowEmployeeDropdown(true)}
                  onBlur={() => setTimeout(() => setShowEmployeeDropdown(false), 200)}
                  onChange={e => {
                    setEmployeeSearch(e.target.value);
                    setShowEmployeeDropdown(true);
                    const match = employees.find(emp => {
                      const name = emp.first_name && emp.last_name ? `${emp.first_name} ${emp.last_name}` : emp.username || emp.email.split('@')[0];
                      return `${name} (${emp.email})` === e.target.value;
                    });
                    setSelectedEmployeeId(match ? match.id.toString() : "");
                  }}
                  className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-semibold"
                />
                {showEmployeeDropdown && (
                  <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto overflow-x-hidden">
                    {employees.filter(emp => {
                      const name = emp.first_name && emp.last_name ? `${emp.first_name} ${emp.last_name}` : emp.username || emp.email.split('@')[0];
                      const display = `${name} (${emp.email})`;
                      return display.toLowerCase().includes(employeeSearch.toLowerCase());
                    }).map(emp => {
                      const name = emp.first_name && emp.last_name ? `${emp.first_name} ${emp.last_name}` : emp.username || emp.email.split('@')[0];
                      const display = `${name} (${emp.email})`;
                      return (
                        <div 
                          key={emp.id}
                          className="px-3 py-2 text-xs font-semibold cursor-pointer hover:bg-muted text-foreground transition-colors"
                          onClick={() => {
                            setEmployeeSearch(display);
                            setSelectedEmployeeId(emp.id.toString());
                            setShowEmployeeDropdown(false);
                          }}
                        >
                          {display}
                        </div>
                      );
                    })}
                    {employees.filter(emp => {
                      const name = emp.first_name && emp.last_name ? `${emp.first_name} ${emp.last_name}` : emp.username || emp.email.split('@')[0];
                      const display = `${name} (${emp.email})`;
                      return display.toLowerCase().includes(employeeSearch.toLowerCase());
                    }).length === 0 && (
                      <div className="px-3 py-2 text-xs text-muted-foreground italic">No matching employees found.</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowAssignModal(false)} className="px-4 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors border border-border">
                Cancel
              </button>
              <button onClick={handleAssignGift} className="px-4 py-2 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                Assign Gift
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
