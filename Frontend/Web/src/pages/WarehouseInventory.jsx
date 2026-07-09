import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Gift,
  Search,
  Plus,
  Package,
  Calendar,
  MoreVertical,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Star,
  Eye,
  X,
  AlertCircle
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

export default function WarehouseInventory() {
  const toast = useToast();
  const [gifts, setGifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [profile, setProfile] = useState(null);
  
  const appleFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  // New gift form state
  const [newGift, setNewGift] = useState({
    name: "", description: "", category: "Merchandise", stock: 0, priority: "Medium"
  });

  // Edit gift form state
  const [editingGift, setEditingGift] = useState(null);

  const fetchGifts = async () => {
    try {
      setLoading(true);
      const res = await api.get("/gifts/");
      setGifts(res.data.results || res.data || []);
    } catch (error) {
      console.error("Failed to fetch gifts:", error);
      toast.error("Failed to load inventory items.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.get("/auth/profile/").then(res => setProfile(res.data)).catch(console.error);
    fetchGifts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, entriesPerPage]);

  const handleCreateGift = async () => {
    if (!newGift.name.trim()) {
      toast.error("Gift name is required.");
      return;
    }
    try {
      const payload = {
        ...newGift,
        stock: Number(newGift.stock) || 0,
        status: "Active"
      };
      const res = await api.post("/gifts/", payload);
      setGifts(prev => [res.data, ...prev]);
      setShowCreateModal(false);
      setNewGift({ name: "", description: "", category: "Merchandise", stock: 0, priority: "Medium" });
      toast.success(`Gift "${res.data.name}" added successfully!`);
    } catch (error) {
      console.error("Failed to create gift:", error);
      toast.error("Failed to add inventory item.");
    }
  };

  const handleUpdateGift = async () => {
    if (!editingGift || !editingGift.name.trim()) {
      toast.error("Gift name is required.");
      return;
    }
    try {
      const payload = {
        name: editingGift.name,
        description: editingGift.description,
        category: editingGift.category,
        stock: Number(editingGift.stock) || 0,
        priority: editingGift.priority,
        status: editingGift.status
      };
      const res = await api.put(`/gifts/${editingGift.id}/`, payload);
      setGifts(prev => prev.map(g => g.id === editingGift.id ? res.data : g));
      setShowEditModal(false);
      setEditingGift(null);
      toast.success(`Gift details updated successfully!`);
    } catch (error) {
      console.error("Failed to update gift:", error);
      toast.error("Failed to save changes.");
    }
  };

  const handleDeleteGift = async (gift) => {
    if (!window.confirm(`Are you sure you want to delete "${gift.name}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/gifts/${gift.id}/`);
      setGifts(prev => prev.filter(g => g.id !== gift.id));
      toast.success("Item deleted from inventory.");
    } catch (error) {
      console.error("Failed to delete gift:", error);
      toast.error("Failed to delete inventory item.");
    }
  };

  const handleToggleStatus = async (gift) => {
    const nextStatus = gift.status === "Active" ? "Paused" : "Active";
    try {
      const res = await api.patch(`/gifts/${gift.id}/`, { status: nextStatus });
      setGifts(prev => prev.map(g => g.id === gift.id ? res.data : g));
      toast.success(`"${gift.name}" status updated to ${nextStatus}.`);
    } catch (error) {
      console.error("Failed to toggle gift status:", error);
      toast.error("Failed to update status.");
    }
  };

  const filteredGifts = gifts.filter(g => {
    if (statusFilter !== "ALL" && g.status !== statusFilter) return false;
    const q = searchQuery.toLowerCase();
    return (
      (g.name || "").toLowerCase().includes(q) ||
      (g.description || "").toLowerCase().includes(q) ||
      (g.category || "").toLowerCase().includes(q)
    );
  });

  const totalPages = Math.ceil(filteredGifts.length / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedGifts = filteredGifts.slice(startIndex, startIndex + entriesPerPage);

  // Stats calculation
  const totalGifts = gifts.length;
  const activeGifts = gifts.filter(g => g.status === "Active").length;
  const outOfStockGifts = gifts.filter(g => g.stock <= 0).length;
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

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-5 bg-background h-full animate-in fade-in duration-500" style={{ fontFamily: appleFont }}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
            <Package className="h-5 w-5 text-primary" />
            Inventory Management
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary select-none">
              {totalGifts} Items
            </span>
          </h1>
          <p className="text-[13px] font-medium text-muted-foreground mt-1">
            Register and manage products in the local warehouse.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 border border-border rounded-lg text-xs bg-background w-44 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground shadow-sm"
            />
          </div>

          {/* Status Filter */}
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

          {/* Create Button */}
          {profile?.username === 'central_hub' && (
            <button 
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Gift Item
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Gift Items", value: totalGifts, icon: Gift, color: "text-primary" },
          { label: "Active Items", value: activeGifts, icon: Star, color: "text-emerald-500" },
          { label: "Out of Stock", value: outOfStockGifts, icon: AlertCircle, color: "text-rose-500" },
          { label: "Total Quantities", value: totalStock.toLocaleString(), icon: Package, color: "text-orange-500" },
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
          {filteredGifts.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center space-y-3 bg-muted/30">
              <Gift className="w-10 h-10 stroke-[1.5] text-muted-foreground" />
              <span className="text-[13px] font-medium text-muted-foreground">No inventory items found.</span>
            </div>
          ) : (
            <table className="w-full table-fixed border-collapse text-left">
              <thead>
                <tr className="bg-red-50/50 dark:bg-zinc-900 border-b border-red-100/50 dark:border-zinc-800">
                  <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 w-[35%] rounded-tl-xl">Item Details</th>
                  <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 w-[15%]">Category</th>
                  <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 w-[12%]">Priority</th>
                  <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 w-[13%]">Status</th>
                  <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 w-[15%]">Stock Quantity</th>
                  <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 text-right w-[10%] rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedGifts.map((gift) => {
                  return (
                    <tr key={gift.id} className="transition-colors duration-150 border-b border-border/40 last:border-b-0 hover:bg-muted/30 group">
                      <td className="py-3 px-6">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
                            <Gift className="w-4 h-4 text-primary" />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-semibold text-foreground truncate">{gift.name}</span>
                            <span className="text-[10px] text-muted-foreground truncate">{gift.description || "No description provided"}</span>
                          </div>
                        </div>
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
                      <td className="py-3 px-6">
                        <div className="flex flex-col gap-0.5">
                          <span className="text-[12px] font-bold text-foreground">{gift.stock} units</span>
                          <span className="text-[9px] text-muted-foreground font-semibold uppercase tracking-wider">{gift.claimed} assigned</span>
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
                            <DropdownMenuItem className="cursor-pointer gap-2 text-xs font-semibold rounded-lg py-1.5" onClick={() => { setEditingGift(gift); setShowEditModal(true); }}>
                              <Edit className="h-3.5 w-3.5 text-blue-500" /><span>Edit Stock</span>
                            </DropdownMenuItem>
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

      {/* Create Gift Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200" 
            onClick={e => e.stopPropagation()} style={{ fontFamily: appleFont }}>
            
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Gift className="h-4 w-4 text-primary" /> Add New Inventory Item
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-md hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Item Name *</label>
                <input type="text" value={newGift.name} onChange={e => setNewGift(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Ooredoo Fiber Router"
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Description</label>
                <textarea value={newGift.description} onChange={e => setNewGift(p => ({ ...p, description: e.target.value }))}
                  placeholder="Details, specs, or contents..."
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary h-20 resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Category</label>
                  <select value={newGift.category} onChange={e => setNewGift(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-2 py-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none font-medium">
                    <option>Merchandise</option>
                    <option>Electronics</option>
                    <option>Awards</option>
                    <option>Telecom</option>
                    <option>Seasonal</option>
                    <option>Onboarding</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Stock</label>
                  <input type="number" min="0" value={newGift.stock} onChange={e => setNewGift(p => ({ ...p, stock: e.target.value }))}
                    className="w-full px-2 py-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none font-medium" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Priority</label>
                  <select value={newGift.priority} onChange={e => setNewGift(p => ({ ...p, priority: e.target.value }))}
                    className="w-full px-2 py-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none font-medium">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowCreateModal(false)} className="px-4 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors border border-border">
                Cancel
              </button>
              <button onClick={handleCreateGift} className="px-4 py-2 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm">
                Add to Inventory
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Gift Modal */}
      {showEditModal && editingGift && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowEditModal(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200" 
            onClick={e => e.stopPropagation()} style={{ fontFamily: appleFont }}>
            
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Edit className="h-4 w-4 text-primary" /> Edit Inventory Item
              </h2>
              <button onClick={() => setShowEditModal(false)} className="p-1 rounded-md hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Item Name *</label>
                <input type="text" value={editingGift.name} onChange={e => setEditingGift(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Description</label>
                <textarea value={editingGift.description || ""} onChange={e => setEditingGift(p => ({ ...p, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary h-20 resize-none" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Category</label>
                  <select value={editingGift.category} onChange={e => setEditingGift(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-2 py-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none font-medium">
                    <option>Merchandise</option>
                    <option>Electronics</option>
                    <option>Awards</option>
                    <option>Telecom</option>
                    <option>Seasonal</option>
                    <option>Onboarding</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Stock Quantity</label>
                  <input type="number" min="0" value={editingGift.stock} onChange={e => setEditingGift(p => ({ ...p, stock: e.target.value }))}
                    className="w-full px-2 py-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none font-medium" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Priority</label>
                  <select value={editingGift.priority} onChange={e => setEditingGift(p => ({ ...p, priority: e.target.value }))}
                    className="w-full px-2 py-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none font-medium">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowEditModal(false)} className="px-4 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors border border-border">
                Cancel
              </button>
              <button onClick={handleUpdateGift} className="px-4 py-2 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
