import { useEffect, useState, useRef } from "react";
import { Card, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Truck,
  Search,
  Plus,
  Package,
  MapPin,
  Calendar,
  MoreVertical,
  X,
  CheckCircle2,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Send,
  Navigation,
  Check,
  User,
  Trash
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

const ALGERIAN_WILAYAS = [
  "Algiers", "Oran", "Constantine", "Sétif", "Annaba", "Blida", "Tlemcen", 
  "Ghardaïa", "Adrar", "Tamanrasset", "Jijel", "Bejaia", "Biskra", "Ouargla"
];

function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "-- Select --",
  emptyMessage = "No options found",
  className = "",
  containerClassName = "w-full"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [hasTyped, setHasTyped] = useState(false);
  const containerRef = useRef(null);

  const selectedOption = options.find(opt => String(opt.value) === String(value));

  useEffect(() => {
    if (!isOpen) {
      setSearchTerm(selectedOption ? selectedOption.label : "");
      setHasTyped(false);
    }
  }, [value, selectedOption, isOpen]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const filteredOptions = options.filter(opt => {
    if (!hasTyped) return true;
    const term = searchTerm.toLowerCase();
    const labelMatch = (opt.label || "").toLowerCase().includes(term);
    const searchMatch = opt.searchText ? (opt.searchText || "").toLowerCase().includes(term) : false;
    return labelMatch || searchMatch;
  });

  return (
    <div ref={containerRef} className={containerClassName} style={{ position: "relative" }}>
      <div className="relative flex items-center w-full">
        <input
          type="text"
          placeholder={placeholder}
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setHasTyped(true);
            setIsOpen(true);
            if (e.target.value === "") {
              onChange("");
            }
          }}
          onFocus={() => setIsOpen(true)}
          className={`w-full px-3 py-2 pr-10 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium ${className}`}
        />
        {searchTerm ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setSearchTerm("");
              onChange("");
              setHasTyped(true);
              setIsOpen(true);
            }}
            className="p-1 text-muted-foreground hover:text-foreground rounded-full hover:bg-muted/50 transition-colors"
            style={{ position: "absolute", right: "28px" }}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(!isOpen);
          }}
          className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors"
          style={{ position: "absolute", right: "10px" }}
        >
          <svg
            className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div 
          className="absolute max-h-48 overflow-y-auto rounded-lg bg-card border border-border shadow-lg py-1.5 z-50 mt-1.5"
          style={{ position: "absolute", top: "100%", left: 0, width: "100%" }}
        >
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2.5 text-xs text-muted-foreground text-center">
              {emptyMessage}
            </div>
          ) : (
            filteredOptions.map((opt) => {
              const isSelected = String(opt.value) === String(value);
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setSearchTerm(opt.label);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-xs font-semibold transition-colors hover:bg-muted/60 flex items-center justify-between ${
                    isSelected ? "bg-primary/10 text-primary font-bold" : "text-foreground"
                  }`}
                >
                  {opt.renderLabel ? opt.renderLabel() : <span>{opt.label}</span>}
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-primary shrink-0 ml-2" />
                  )}
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default function WarehouseDispatches() {
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [dispatches, setDispatches] = useState([]);
  const [gifts, setGifts] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState(null);

  const appleFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  // Mapped options for SearchableSelect
  const giftOptions = gifts.map(g => ({
    value: g.id,
    label: g.name,
    searchText: g.name,
    renderLabel: () => (
      <div className="flex items-center justify-between w-full pr-2 text-left">
        <span>{g.name}</span>
        <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded font-bold border border-primary/20 shrink-0">
          {g.stock} units
        </span>
      </div>
    )
  }));

  const employeeOptions = employees.map(e => ({
    value: e.id,
    label: e.first_name ? `${e.first_name} ${e.last_name}` : e.email,
    searchText: `${e.first_name || ""} ${e.last_name || ""} ${e.email}`.trim(),
    renderLabel: () => (
      <div className="flex flex-col text-left py-0.5">
        <span className="font-semibold text-[12px]">{e.first_name ? `${e.first_name} ${e.last_name}` : e.email}</span>
        {e.first_name && <span className="text-[10px] text-muted-foreground font-mono mt-0.5">{e.email}</span>}
      </div>
    )
  }));

  const wilayaOptions = ALGERIAN_WILAYAS.map(w => ({
    value: w,
    label: w,
    searchText: w
  }));

  const warehouseOptions = warehouses.map(w => ({
    value: w.id,
    label: w.username || w.email.split('@')[0],
    searchText: `${w.username || ""} ${w.email} ${w.location || ""}`.trim(),
    renderLabel: () => (
      <div className="flex flex-col text-left py-0.5">
        <span className="font-semibold text-[11px]">{w.username || w.email.split('@')[0]}</span>
        <span className="text-[9px] text-muted-foreground font-mono mt-0.5">{w.email}</span>
      </div>
    )
  }));

  // Create dispatch form state
  const [newDispatch, setNewDispatch] = useState({
    gift: "",
    employee: "",
    quantity: 1,
    destination_wilaya: "Algiers",
    routeSteps: [] // array of warehouse IDs in order
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch profile
      const profileRes = await api.get("/auth/profile/");
      setProfile(profileRes.data);
      
      // Fetch dispatches
      const dispatchesRes = await api.get("/dispatches/");
      setDispatches(dispatchesRes.data.results || dispatchesRes.data || []);
      
      // Fetch gifts (local inventory)
      const giftsRes = await api.get("/gifts/");
      setGifts((giftsRes.data.results || giftsRes.data || []).filter(g => g.status === "Active" && g.stock > 0));
      
      // Fetch employees
      const empRes = await api.get("/users/?role=EMPLOYEE");
      setEmployees(empRes.data.results || empRes.data || []);
      
      // Fetch other warehouses for transit builder
      const whRes = await api.get("/users/?role=WAREHOUSE");
      const localWarehouses = whRes.data.results || whRes.data || [];
      // Filter out current warehouse from potential transit hubs
      setWarehouses(localWarehouses.filter(w => w.id !== profileRes.data?.id));

    } catch (error) {
      console.error("Failed to load dispatches data:", error);
      toast.error("Failed to load logistics telemetry.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, entriesPerPage]);

  const handleAction = async (dispatchId, action) => {
    try {
      toast.info(`Executing transit action: ${action.toUpperCase()}...`);
      const res = await api.post(`/dispatches/${dispatchId}/action/`, { action });
      setDispatches(prev => prev.map(d => d.id === dispatchId ? res.data : d));
      if (selectedDispatch && selectedDispatch.id === dispatchId) {
        setSelectedDispatch(res.data);
      }
      toast.success(`Shipment successfully updated to: ${res.data.status}`);
      // Refresh local data to catch up stock counts
      fetchData();
    } catch (error) {
      console.error(`Failed to execute action ${action}:`, error);
      toast.error(error.response?.data?.error || `Failed to update transit status.`);
    }
  };

  const handleCreateDispatch = async () => {
    if (!newDispatch.gift) {
      toast.error("Please select a gift item to dispatch.");
      return;
    }
    if (!newDispatch.employee) {
      toast.error("Please select a recipient employee.");
      return;
    }
    if (Number(newDispatch.quantity) <= 0) {
      toast.error("Quantity must be greater than 0.");
      return;
    }
    
    // Find selected gift stock
    const selectedGift = gifts.find(g => g.id === Number(newDispatch.gift));
    if (selectedGift && selectedGift.stock < Number(newDispatch.quantity)) {
      toast.error(`Insufficient stock! Available: ${selectedGift.stock}`);
      return;
    }

    try {
      // Construct the route array for backend JSONField
      // Step 0: Source (us)
      const routeList = [
        {
          warehouse_id: profile.id,
          warehouse_name: profile.username || profile.email.split('@')[0],
          type: "source",
          status: "Completed",
          timestamp: new Date().toISOString()
        }
      ];

      // Step 1..N: Intermediate transit hubs
      newDispatch.routeSteps.forEach((whId, idx) => {
        const whObj = warehouses.find(w => w.id === Number(whId));
        if (whObj) {
          routeList.push({
            warehouse_id: whObj.id,
            warehouse_name: whObj.username || whObj.email.split('@')[0],
            type: idx === newDispatch.routeSteps.length - 1 ? "destination" : "transit",
            status: "Pending",
            timestamp: null
          });
        }
      });

      // Destination warehouse is the last warehouse in route list
      const destWhId = newDispatch.routeSteps.length > 0 
        ? Number(newDispatch.routeSteps[newDispatch.routeSteps.length - 1])
        : profile.id;

      const payload = {
        gift: Number(newDispatch.gift),
        employee: Number(newDispatch.employee),
        quantity: Number(newDispatch.quantity),
        destination_wilaya: newDispatch.destination_wilaya,
        destination_warehouse: destWhId,
        route: routeList
      };

      const res = await api.post("/dispatches/", payload);
      setDispatches(prev => [res.data, ...prev]);
      setShowCreateModal(false);
      // Reset form
      setNewDispatch({
        gift: "", employee: "", quantity: 1, destination_wilaya: "Algiers", routeSteps: []
      });
      toast.success("Dispatch Waybill created & registered on system!");
      fetchData();
    } catch (error) {
      console.error("Failed to create dispatch:", error);
      toast.error(error.response?.data?.quantity || "Failed to register dispatch order.");
    }
  };

  const addRouteStep = () => {
    if (warehouses.length === 0) {
      toast.info("No other logistics warehouses registered on network.");
      return;
    }
    setNewDispatch(prev => ({
      ...prev,
      routeSteps: [...prev.routeSteps, warehouses[0]?.id]
    }));
  };

  const updateRouteStep = (index, val) => {
    setNewDispatch(prev => {
      const steps = [...prev.routeSteps];
      steps[index] = val;
      return { ...prev, routeSteps: steps };
    });
  };

  const removeRouteStep = (index) => {
    setNewDispatch(prev => {
      const steps = [...prev.routeSteps];
      steps.splice(index, 1);
      return { ...prev, routeSteps: steps };
    });
  };

  const handleEmployeeSelect = (empId) => {
    const emp = employees.find(e => e.id === Number(empId));
    if (emp) {
      // Automatically map employee location (wilaya) if match exists, or guess.
      const match = ALGERIAN_WILAYAS.find(w => 
        (emp.location || "").toLowerCase().includes(w.toLowerCase())
      );
      setNewDispatch(prev => ({
        ...prev,
        employee: empId,
        destination_wilaya: match || prev.destination_wilaya
      }));
    }
  };

  // Filters logic
  const filteredDispatches = dispatches.filter(d => {
    if (statusFilter !== "ALL") {
      if (statusFilter === "Active" && (d.status === "Delivered" || d.status === "Cancelled")) return false;
      if (statusFilter !== "Active" && d.status !== statusFilter) return false;
    }
    const q = searchQuery.toLowerCase();
    return (
      (d.tracking_number || "").toLowerCase().includes(q) ||
      (d.gift_name || "").toLowerCase().includes(q) ||
      (d.employee_email || "").toLowerCase().includes(q) ||
      (d.destination_wilaya || "").toLowerCase().includes(q)
    );
  });

  // Pagination
  const totalPages = Math.ceil(filteredDispatches.length / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedDispatches = filteredDispatches.slice(startIndex, startIndex + entriesPerPage);

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending Dispatch":
        return "bg-indigo-50 dark:bg-indigo-950/25 text-indigo-600 dark:text-indigo-400 border border-indigo-100/60 dark:border-indigo-900/30";
      case "In Transit":
        return "bg-amber-50 dark:bg-amber-950/25 text-amber-600 dark:text-amber-400 border border-amber-100/60 dark:border-amber-900/30";
      case "Arrived":
        return "bg-blue-50 dark:bg-blue-950/25 text-blue-600 dark:text-blue-400 border border-blue-100/60 dark:border-blue-900/30";
      case "Delivered":
        return "bg-emerald-50 dark:bg-emerald-950/25 text-emerald-600 dark:text-emerald-400 border border-emerald-100/60 dark:border-emerald-900/30";
      case "Cancelled":
        return "bg-rose-50 dark:bg-rose-950/25 text-rose-600 dark:text-rose-400 border border-rose-100/60 dark:border-rose-900/30";
      default:
        return "bg-gray-100 dark:bg-zinc-800 text-gray-500 dark:text-zinc-400";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
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
            <Truck className="h-5 w-5 text-primary" />
            Dispatch & Logistics Control
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary select-none">
              {dispatches.length} Waybills
            </span>
          </h1>
          <p className="text-[13px] font-medium text-muted-foreground mt-1">
            Build transit routes, dispatch gifts, and track step-by-step check-ins.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tracking/gift..."
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
              <span>Filter: {statusFilter === "ALL" ? "All" : statusFilter === "Active" ? "Active Transits" : statusFilter}</span>
            </button>
            {showStatusFilter && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowStatusFilter(false)} />
                <div className="absolute right-0 mt-1.5 w-40 rounded-lg bg-card border border-border shadow-lg py-1 z-20">
                  {["ALL", "Active", "Pending Dispatch", "In Transit", "Arrived", "Delivered", "Cancelled"].map((s) => (
                    <button key={s} className={`w-full text-left px-4 py-2 text-[12px] font-semibold transition-colors ${statusFilter === s ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
                      onClick={() => { setStatusFilter(s); setShowStatusFilter(false); }}>
                      {s === "ALL" ? "All Waybills" : s === "Active" ? "Active Transits" : s}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Create Button */}
          <button 
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            New Dispatch Order
          </button>
        </div>
      </div>

      {/* Main Grid: List + Timeline Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Side: Table List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-card border border-border rounded-xl shadow-sm overflow-visible">
            <div className="w-full overflow-x-auto">
              <table className="w-full table-fixed border-collapse text-left min-w-[600px]">
                <thead>
                  <tr className="bg-red-50/50 dark:bg-zinc-900 border-b border-red-100/50 dark:border-zinc-800">
                    <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-4 w-[28%] rounded-tl-xl">Tracking ID / Gift</th>
                    <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-4 w-[24%]">Recipient</th>
                    <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-4 w-[16%]">Wilaya</th>
                    <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-4 w-[18%]">Status</th>
                    <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-4 text-right w-[14%] rounded-tr-xl">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDispatches.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="flex flex-col items-center justify-center space-y-3 bg-muted/30">
                          <Truck className="w-10 h-10 stroke-[1.5] text-muted-foreground" />
                          <span className="text-[13px] font-medium text-muted-foreground">No dispatch waybills found.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedDispatches.map((d) => {
                      const isSelected = selectedDispatch?.id === d.id;
                      
                      // Check which actions are active for this warehouse
                      const isSource = d.source_warehouse === profile?.id;
                      const isDestination = d.destination_warehouse === profile?.id;
                      const isCurrent = d.current_warehouse === profile?.id;
                      
                      // Find next pending warehouse step in route
                      const nextStep = (d.route || []).find(step => step.status === "Pending");
                      const isNextHub = nextStep && nextStep.warehouse_id === profile?.id;

                      const canDepart = isCurrent && (d.status === "Pending Dispatch" || d.status === "Arrived") && d.status !== "Delivered";
                      const canArrive = d.status === "In Transit" && isNextHub;
                      const canDeliver = isCurrent && d.status === "Arrived" && isDestination;
                      const canCancel = isSource && d.status !== "Delivered" && d.status !== "Cancelled";

                      return (
                        <tr 
                          key={d.id} 
                          onClick={() => setSelectedDispatch(d)}
                          className={`transition-colors duration-150 border-b border-border/40 last:border-b-0 hover:bg-muted/20 cursor-pointer ${
                            isSelected ? "bg-primary/5 border-l-2 border-l-primary" : ""
                          }`}
                        >
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm shrink-0">
                                <Package className="w-4 h-4 text-primary" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="text-[12px] font-mono font-bold text-foreground truncate">{d.tracking_number}</span>
                                <span className="text-[10px] text-muted-foreground truncate">{d.gift_name} • {d.quantity} units</span>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex flex-col min-w-0">
                              <span className="text-[12px] font-semibold text-foreground truncate">{d.employee_name}</span>
                              <span className="text-[9px] text-muted-foreground truncate font-mono">{d.employee_email}</span>
                            </div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="text-[11px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded">
                              {d.destination_wilaya}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold capitalize ${getStatusBadge(d.status)}`}>
                              {d.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right" onClick={e => e.stopPropagation()}>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none">
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 p-1.5 shadow-lg rounded-xl border border-border bg-card">
                                {canDepart && (
                                  <DropdownMenuItem className="cursor-pointer gap-2 text-xs font-semibold rounded-lg py-1.5 text-blue-600" onClick={() => handleAction(d.id, "depart")}>
                                    <Send className="h-3.5 w-3.5" /><span>Depart Shipment</span>
                                  </DropdownMenuItem>
                                )}
                                {canArrive && (
                                  <DropdownMenuItem className="cursor-pointer gap-2 text-xs font-semibold rounded-lg py-1.5 text-emerald-600" onClick={() => handleAction(d.id, "arrive")}>
                                    <Navigation className="h-3.5 w-3.5" /><span>Check-in (Arrived)</span>
                                  </DropdownMenuItem>
                                )}
                                {canDeliver && (
                                  <DropdownMenuItem className="cursor-pointer gap-2 text-xs font-semibold rounded-lg py-1.5 text-emerald-600" onClick={() => handleAction(d.id, "deliver")}>
                                    <Check className="h-3.5 w-3.5" /><span>Handover to Employee</span>
                                  </DropdownMenuItem>
                                )}
                                {canCancel && (
                                  <>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="cursor-pointer gap-2 text-xs font-semibold rounded-lg py-1.5 text-rose-600" onClick={() => handleAction(d.id, "cancel")}>
                                      <X className="h-3.5 w-3.5" /><span>Cancel Dispatch</span>
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {!canDepart && !canArrive && !canDeliver && !canCancel && (
                                  <DropdownMenuItem disabled className="text-xs font-semibold text-muted-foreground rounded-lg py-1.5">
                                    No Actions Available
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-4 py-3 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground rounded-b-xl">
              <span>Show {entriesPerPage} per page</span>
              <div className="flex items-center gap-1">
                <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} className="p-1 hover:bg-muted rounded disabled:opacity-30 transition-colors">
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} className="p-1 hover:bg-muted rounded disabled:opacity-30 transition-colors">
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Stepper Timeline Panel */}
        <div className="lg:col-span-1">
          {selectedDispatch ? (
            <Card className="rounded-2xl border border-border bg-card shadow-sm p-4 sm:p-5 space-y-4 lg:h-[520px] flex flex-col overflow-y-auto">
              <div className="flex items-center justify-between border-b border-border/50 pb-3">
                <div className="min-w-0">
                  <CardTitle className="text-xs font-mono font-bold text-foreground">{selectedDispatch.tracking_number}</CardTitle>
                  <CardDescription className="text-[10px] text-muted-foreground truncate">{selectedDispatch.gift_name}</CardDescription>
                </div>
                <Badge className={getStatusBadge(selectedDispatch.status)}>
                  {selectedDispatch.status}
                </Badge>
              </div>

              {/* Waybill quick details */}
              <div className="grid grid-cols-2 gap-2.5 text-[10px] font-semibold bg-muted/20 p-2.5 rounded-xl border border-border/50">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Recipient</span>
                  <span className="text-foreground truncate">{selectedDispatch.employee_name}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Target Wilaya</span>
                  <span className="text-foreground">{selectedDispatch.destination_wilaya}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="text-foreground">{selectedDispatch.quantity} units</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Source Hub</span>
                  <span className="text-foreground truncate">{selectedDispatch.source_warehouse_name || "Algiers Hub"}</span>
                </div>
              </div>

              {/* Transit Map Stepper (Algerian multi-warehouse logistics path) */}
              <div className="space-y-4 pt-1">
                <span className="text-[11px] uppercase tracking-wider font-bold text-muted-foreground block">
                  Algerian Logistics Pipeline Track
                </span>
                
                <div className="relative pl-5 space-y-5">
                  {/* Stepper timeline line */}
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />

                  {(selectedDispatch.route || []).map((step, idx) => {
                    const isCompleted = step.status === "Completed" || step.status === "Arrived" || step.status === "Delivered to Employee";
                    const isArrivedCurrent = step.warehouse_id === selectedDispatch.current_warehouse && selectedDispatch.status === "Arrived";
                    const isInTransitNext = step.status === "Pending" && selectedDispatch.status === "In Transit";

                    return (
                      <div key={idx} className="relative flex items-start gap-3 text-xs">
                        {/* Bullet */}
                        <div className={`absolute -left-[23px] w-4 h-4 rounded-full border-2 flex items-center justify-center z-10 transition-colors ${
                          isArrivedCurrent ? "bg-blue-500 border-blue-500 ring-4 ring-blue-500/20 animate-pulse" :
                          step.status === "Delivered to Employee" ? "bg-emerald-500 border-emerald-500" :
                          isCompleted ? "bg-primary border-primary" : "bg-card border-border"
                        }`}>
                          {step.status === "Delivered to Employee" ? (
                            <Check className="h-2 w-2 text-white" />
                          ) : isCompleted ? (
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          ) : null}
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1.5 font-bold">
                            <span className={`text-[11px] truncate ${isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                              {step.warehouse_name}
                            </span>
                            {step.timestamp && (
                              <span className="text-[9px] text-muted-foreground whitespace-nowrap font-normal">
                                {new Date(step.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            )}
                          </div>
                          
                          <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                            {step.status === "Completed" ? "Dispatched" :
                             step.status === "Arrived" ? "Arrived at hub" :
                             step.status === "Delivered to Employee" ? "Handover complete" : "Awaiting check-in"}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {/* Final Destination Employee step */}
                  <div className="relative flex items-start gap-3 text-xs">
                    <div className={`absolute -left-[23px] w-4 h-4 rounded-full border-2 flex items-center justify-center z-10 ${
                      selectedDispatch.status === "Delivered" ? "bg-emerald-500 border-emerald-500 ring-4 ring-emerald-500/15" : "bg-card border-border"
                    }`}>
                      <User className={`h-2.5 w-2.5 ${selectedDispatch.status === "Delivered" ? "text-white" : "text-muted-foreground"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between font-bold">
                        <span className={`text-[11px] ${selectedDispatch.status === "Delivered" ? "text-foreground" : "text-muted-foreground"}`}>
                          Employee Handover
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground font-medium mt-0.5">
                        {selectedDispatch.status === "Delivered" ? "Received & claimed" : "Pending transit delivery"}
                      </p>
                    </div>
                  </div>

                </div>
              </div>
            </Card>
          ) : (
            <div className="h-[250px] lg:h-[520px] border border-dashed border-border rounded-2xl flex flex-col items-center justify-center p-8 text-center bg-muted/10">
              <Navigation className="h-10 w-10 text-muted-foreground/60 stroke-[1.5] animate-pulse" />
              <span className="text-xs font-bold text-muted-foreground mt-3">Logistics Pipeline Viewer</span>
              <span className="text-[10px] text-muted-foreground max-w-xs mt-1">Select any active waybill from the list to display its multi-hub transit timeline.</span>
            </div>
          )}
        </div>
      </div>

      {/* Create Dispatch Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowCreateModal(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200" 
            onClick={e => e.stopPropagation()} style={{ fontFamily: appleFont, maxWidth: "480px" }}>
            
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Truck className="h-4 w-4 text-primary" /> Create Dispatch Waybill
              </h2>
              <button onClick={() => setShowCreateModal(false)} className="p-1 rounded-md hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-6">
              
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1.5">Gift Item (Active Stock) *</label>
                  <SearchableSelect
                    value={newDispatch.gift}
                    onChange={val => setNewDispatch(p => ({ ...p, gift: val }))}
                    options={giftOptions}
                    placeholder="-- Search & select product --"
                    emptyMessage="No matching products"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1.5">Quantity *</label>
                  <input 
                    type="number" 
                    min="1" 
                    value={newDispatch.quantity} 
                    onChange={e => setNewDispatch(p => ({ ...p, quantity: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none font-semibold"
                  />
                </div>
              </div>

              {/* Recipient & Wilaya */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1.5">Recipient Employee *</label>
                  <SearchableSelect
                    value={newDispatch.employee}
                    onChange={handleEmployeeSelect}
                    options={employeeOptions}
                    placeholder="-- Search & select employee --"
                    emptyMessage="No matching employees"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-muted-foreground block mb-1.5">Destination Wilaya *</label>
                  <SearchableSelect
                    value={newDispatch.destination_wilaya}
                    onChange={val => setNewDispatch(p => ({ ...p, destination_wilaya: val }))}
                    options={wilayaOptions}
                    placeholder="-- Search & select wilaya --"
                    emptyMessage="No matching wilayas"
                  />
                </div>
              </div>

              {/* Route Builder */}
              <div className="border border-border/60 rounded-xl p-4 bg-muted/10 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground">
                    Multi-Hub Routing Path
                  </span>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={addRouteStep}
                    className="h-8 rounded-lg text-[10px] font-bold border-border/80 text-primary hover:bg-muted py-0.5 px-3"
                  >
                    + Add Transit Hub
                  </Button>
                </div>

                {newDispatch.routeSteps.length === 0 ? (
                  <p className="text-[11.5px] text-muted-foreground font-semibold py-1">
                    Direct Delivery: Gift moves directly from source to employee.
                  </p>
                ) : (
                  <div className="space-y-3 pr-1">
                    {newDispatch.routeSteps.map((whId, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-[10px] font-bold text-primary font-mono bg-primary/10 w-6 h-6 rounded-full flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        
                        <SearchableSelect
                          value={whId}
                          onChange={val => updateRouteStep(idx, val)}
                          options={warehouseOptions}
                          placeholder="Select transit hub"
                          emptyMessage="No warehouses found"
                          containerClassName="flex-1"
                          className="py-1 text-[11px] font-semibold"
                        />

                        <button 
                          onClick={() => removeRouteStep(idx)}
                          className="p-2 hover:bg-rose-50 text-muted-foreground hover:text-rose-500 rounded-lg transition-colors shrink-0"
                        >
                          <Trash className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <div className="flex justify-end gap-3 pt-5">
              <button 
                onClick={() => setShowCreateModal(false)} 
                className="px-5 py-2.5 rounded-xl text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors border border-border"
              >
                Cancel
              </button>
              <button 
                onClick={handleCreateDispatch} 
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
              >
                Create Waybill
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
