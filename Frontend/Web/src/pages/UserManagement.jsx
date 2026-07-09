import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { 
  Search, 
  User, 
  Mail,
  UserCheck, 
  UserX, 
  Trash2, 
  Warehouse,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Users,
  Briefcase,
  Shield,
  Plus,
  X,
  Phone,
  Gift
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

export default function UserManagement() {
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [showRoleFilter, setShowRoleFilter] = useState(false);
  
  // Pagination State
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  
  // Create Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    email: "", password: "", first_name: "", last_name: "", phone: "", department: "", job_title: "", home_address: ""
  });

  // Get search params for role filtering
  const [searchParams, setSearchParams] = useSearchParams();
  const roleFilter = searchParams.get("role") || "ALL";

  const appleFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users/");
      setUsers(res.data.results || res.data || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      toast.error("Failed to load user directory.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, entriesPerPage]);

  const handleToggleStatus = async (user) => {
    try {
      const newStatus = !user.is_active;
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: newStatus } : u));
      await api.patch(`/users/${user.id}/`, { is_active: newStatus });
      toast.success(`${user.username || user.email}'s status updated.`);
    } catch (error) {
      console.error("Failed to toggle status:", error);
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: user.is_active } : u));
      toast.error("Failed to update user status.");
    }
  };

  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${user.username || user.email}"? This action cannot be undone.`)) return;
    try {
      await api.delete(`/users/${user.id}/`);
      toast.success("User account deleted successfully.");
      setUsers(prev => prev.filter(u => u.id !== user.id));
    } catch (error) {
      console.error("Failed to delete user:", error);
      toast.error("Failed to delete user account.");
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.email.trim() || !newEmployee.password.trim()) {
      toast.error("Email and Password are required.");
      return;
    }
    try {
      const payload = {
        role: "EMPLOYEE",
        username: newEmployee.email,
        ...newEmployee
      };
      const res = await api.post("/users/", payload);
      toast.success(`Employee account "${res.data.email}" created successfully!`);
      setShowAddModal(false);
      setNewEmployee({
        email: "", password: "", first_name: "", last_name: "", phone: "", department: "", job_title: "", home_address: ""
      });
      fetchUsers();
    } catch (error) {
      console.error("Failed to add employee:", error);
      const errs = error.response?.data;
      let msg = "Failed to create employee account.";
      if (errs) {
        if (errs.email) msg = `Email error: ${errs.email}`;
        else if (errs.username) msg = `Username error: ${errs.username}`;
        else if (errs.password) msg = `Password error: ${errs.password}`;
      }
      toast.error(msg);
    }
  };

  const filteredUsers = users.filter(user => {
    if (!user) return false;
    // Role filter
    if (roleFilter !== "ALL" && user.role !== roleFilter) return false;
    // Search
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = 
      (user.username || "").toLowerCase().includes(searchLower) ||
      (user.email || "").toLowerCase().includes(searchLower) ||
      (user.first_name || "").toLowerCase().includes(searchLower) ||
      (user.last_name || "").toLowerCase().includes(searchLower) ||
      String(user.id).includes(searchLower);
    return matchesSearch;
  });

  // Calculate Pagination
  const totalPages = Math.ceil(filteredUsers.length / entriesPerPage) || 1;
  const startIndex = (currentPage - 1) * entriesPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + entriesPerPage);

  const getStatusStyle = (isActive) => {
    if (isActive) {
      return { bg: "bg-emerald-50 dark:bg-emerald-950/25 text-emerald-600 dark:text-emerald-400 border border-emerald-100/60 dark:border-emerald-900/30", dot: "bg-emerald-500", label: "Active" };
    }
    return { bg: "bg-rose-50 dark:bg-rose-950/25 text-rose-600 dark:text-rose-400 border border-rose-100/60 dark:border-rose-900/30", dot: "bg-rose-500", label: "Inactive" };
  };

  const getRoleStyle = (role) => {
    switch (role) {
      case 'ADMIN':
        return { bg: "bg-purple-50 dark:bg-purple-950/25 text-purple-600 dark:text-purple-400 border border-purple-100/60 dark:border-purple-900/30", label: "Admin", icon: Shield };
      case 'WAREHOUSE':
        return { bg: "bg-blue-50 dark:bg-blue-950/25 text-blue-600 dark:text-blue-400 border border-blue-100/60 dark:border-blue-900/30", label: "Warehouse", icon: Warehouse };
      case 'EMPLOYEE':
        return { bg: "bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border border-gray-200 dark:border-zinc-700", label: "Employee", icon: Briefcase };
      default:
        return { bg: "bg-gray-50 dark:bg-zinc-800 text-gray-600 dark:text-zinc-300 border border-gray-150 dark:border-zinc-700/50", label: role || 'Unknown', icon: User };
    }
  };

  const getHeaderInfo = () => {
    switch (roleFilter) {
      case "EMPLOYEE": return { title: "Employee Directory", desc: "Manage all employee profiles and access permissions." };
      case "WAREHOUSE": return { title: "Warehouse Managers", desc: "Manage warehouse manager accounts and permissions." };
      case "ADMIN": return { title: "Administrators", desc: "Manage administrator accounts." };
      default: return { title: "User Directory", desc: "Comprehensive registry of all platform accounts." };
    }
  };

  const headerInfo = getHeaderInfo();

  // Stats
  const totalCount = users.length;
  const employeeCount = users.filter(u => u.role === "EMPLOYEE").length;
  const warehouseCount = users.filter(u => u.role === "WAREHOUSE").length;
  const activeCount = users.filter(u => u.is_active).length;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-10rem)] w-full">
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
            {headerInfo.title}
            {filteredUsers.length > 0 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary select-none">
                {filteredUsers.length} Users
              </span>
            )}
          </h1>
          <p className="text-[13px] font-medium text-muted-foreground mt-1">
            {headerInfo.desc}
          </p>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="flex items-center gap-2">
          {/* Live Search */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search name, email, ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-1.5 border border-border rounded-lg text-xs bg-background w-48 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary text-foreground shadow-sm"
            />
          </div>

          {/* Role Filter Dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowRoleFilter(!showRoleFilter)}
              className={`flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs bg-background font-semibold shadow-sm focus:outline-none transition-colors ${
                roleFilter !== "ALL"
                  ? "border-primary/50 text-primary"
                  : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Role: {roleFilter === "ALL" ? "All" : roleFilter}</span>
            </button>
            
            {showRoleFilter && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowRoleFilter(false)} />
                <div className="absolute right-0 mt-1.5 w-48 rounded-lg bg-card border border-border shadow-lg py-1 z-20 text-left">
                  {["ALL", "EMPLOYEE", "WAREHOUSE", "ADMIN"].map((role) => (
                    <button
                       key={role}
                       className={`w-full text-left px-4 py-2 text-[12px] font-semibold transition-colors flex items-center gap-2 ${
                         roleFilter === role 
                           ? "bg-primary/10 text-primary" 
                           : "text-muted-foreground hover:bg-muted"
                       }`}
                       onClick={() => {
                         setSearchParams(role === "ALL" ? {} : { role });
                         setShowRoleFilter(false);
                       }}
                    >
                       {role === "ALL" ? "All Roles" : role}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Add Employee Button */}
          <button 
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Users", value: totalCount, icon: Users, color: "text-foreground" },
          { label: "Employees", value: employeeCount, icon: Briefcase, color: "text-blue-500" },
          { label: "Warehouses", value: warehouseCount, icon: Warehouse, color: "text-orange-500" },
          { label: "Active", value: activeCount, icon: UserCheck, color: "text-emerald-500" },
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

      {/* Main Table Container */}
      <div className="bg-card border border-border rounded-xl shadow-sm overflow-visible animate-in fade-in slide-in-from-bottom-2 duration-300">
        
        <div className="w-full">
          {filteredUsers.length === 0 ? (
            <div className="p-10 text-center flex flex-col items-center justify-center space-y-3 bg-muted/30">
              <span className="text-muted-foreground">
                <User className="w-10 h-10 stroke-[1.5]" />
              </span>
              <span className="text-[13px] font-medium text-muted-foreground">
                No users found matching your search or filters.
              </span>
            </div>
          ) : (
            <table className="w-full table-fixed border-collapse text-left">
                <thead>
                  <tr className="bg-red-50/50 dark:bg-zinc-900 border-b border-red-100/50 dark:border-zinc-800">
                    <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 w-[230px] rounded-tl-xl">User Profile</th>
                    <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 text-left w-24">Role</th>
                    <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 text-left w-24">Status</th>
                    <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 text-left w-24">Gifts Given</th>
                    <th className="hidden lg:table-cell text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 text-left">Account Details</th>
                    <th className="text-[11px] font-bold tracking-wider text-primary py-3.5 px-6 text-right w-24 rounded-tr-xl">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((user) => {
                  const statusStyle = getStatusStyle(user.is_active);
                  const roleStyle = getRoleStyle(user.role);
                  const RoleIcon = roleStyle.icon;
                  
                  return (
                    <tr 
                      key={user.id} 
                      className="transition-colors duration-150 border-b border-border/40 last:border-b-0 hover:bg-muted/30 group"
                    >
                      <td className="py-2.5 px-6 text-left">
                        <div className="flex items-center gap-3">
                          {user.profile_picture ? (
                            <img 
                              src={user.profile_picture} 
                              alt={user.username || user.email} 
                              className="w-9 h-9 rounded-full object-cover border border-border shadow-sm"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center border border-border shadow-sm">
                              <RoleIcon className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="text-[13px] font-semibold text-foreground truncate">
                              {user.first_name && user.last_name 
                                ? `${user.first_name} ${user.last_name}` 
                                : user.username || user.email?.split('@')[0]}
                            </span>
                            <span className="text-[11px] font-medium text-muted-foreground font-mono">
                              UID: {user.id}
                            </span>
                          </div>
                        </div>
                      </td>
                      
                      <td className="py-2.5 px-6 text-left">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${roleStyle.bg}`}>
                          {roleStyle.label}
                        </span>
                      </td>

                      <td className="py-2.5 px-6 text-left">
                        <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold ${statusStyle.bg}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${statusStyle.dot}`} />
                          {statusStyle.label}
                        </div>
                      </td>

                      <td className="py-2.5 px-6 text-left">
                        {user.role === 'EMPLOYEE' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-primary/10 text-primary border border-primary/20 shadow-sm">
                            <Gift className="w-3 h-3" />
                            {user.gift_count ?? 0}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px] font-medium pl-2">-</span>
                        )}
                      </td>

                      <td className="hidden lg:table-cell py-2.5 px-6 text-left text-[12px] font-medium text-muted-foreground">
                        <div className="flex flex-col gap-0.5 min-w-0">
                          <span className="flex items-center gap-1.5 min-w-0">
                            <Mail className="h-3 w-3 text-muted-foreground shrink-0" /> 
                            <span className="truncate">{user.email}</span>
                          </span>
                          {user.department && (
                            <span className="flex items-center gap-1.5 text-[11px] text-muted-foreground min-w-0">
                              <Briefcase className="h-3 w-3 shrink-0" /> 
                              <span className="truncate">{user.department}</span>
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-6 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors focus:outline-none">
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48 p-1.5 shadow-lg rounded-xl border border-border bg-card">
                            <div className="px-2 py-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                              Account Actions
                            </div>
                            <DropdownMenuItem
                              className="cursor-pointer gap-2 text-xs font-semibold rounded-lg py-1.5"
                              onClick={() => handleToggleStatus(user)}
                            >
                              {user.is_active ? (
                                <>
                                  <UserX className="h-3.5 w-3.5 text-orange-500" />
                                  <span>Deactivate Account</span>
                                </>
                              ) : (
                                <>
                                  <UserCheck className="h-3.5 w-3.5 text-emerald-500" />
                                  <span>Activate Account</span>
                                </>
                              )}
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="cursor-pointer gap-2 text-xs font-semibold rounded-lg py-1.5 text-red-600 dark:text-red-400 focus:text-red-700 focus:bg-red-50 dark:focus:bg-red-950/30"
                              onClick={() => handleDeleteUser(user)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>Permanently Delete</span>
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

        {/* Pagination Footer */}
        <div className="px-6 py-4 border-t border-border bg-card flex items-center justify-between text-xs text-muted-foreground rounded-b-xl">
          <div className="flex items-center gap-1.5">
            <span>Show</span>
            <select 
              value={entriesPerPage}
              onChange={(e) => setEntriesPerPage(Number(e.target.value))}
              className="border border-border rounded px-1.5 py-0.5 bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-medium"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
            <span>per page</span>
          </div>
          
          <div className="flex items-center gap-1">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              className="p-1 hover:bg-muted rounded text-muted-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            
            {Array.from({ length: totalPages }).map((_, idx) => {
              const pageNum = idx + 1;
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-6 h-6 flex items-center justify-center rounded-md font-semibold text-xs transition-colors ${
                    currentPage === pageNum
                      ? "bg-primary text-white shadow-sm"
                      : "hover:bg-muted text-muted-foreground"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}

            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              className="p-1 hover:bg-muted rounded text-muted-foreground disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setShowAddModal(false)}>
          <div className="bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200" 
            onClick={e => e.stopPropagation()} style={{ fontFamily: appleFont }}>
            
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-foreground flex items-center gap-2">
                <Plus className="h-4 w-4 text-primary" /> Register New Employee
              </h2>
              <button onClick={() => setShowAddModal(false)} className="p-1 rounded-md hover:bg-muted text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">First Name</label>
                  <input type="text" value={newEmployee.first_name} onChange={e => setNewEmployee(p => ({ ...p, first_name: e.target.value }))}
                    placeholder="John"
                    className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-semibold" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Last Name</label>
                  <input type="text" value={newEmployee.last_name} onChange={e => setNewEmployee(p => ({ ...p, last_name: e.target.value }))}
                    placeholder="Doe"
                    className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-semibold" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Email Address *</label>
                <input type="email" value={newEmployee.email} onChange={e => setNewEmployee(p => ({ ...p, email: e.target.value }))}
                  placeholder="john.doe@ooredoo.com"
                  className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-semibold" />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Password *</label>
                <input type="password" value={newEmployee.password} onChange={e => setNewEmployee(p => ({ ...p, password: e.target.value }))}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-semibold" />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
                  <input type="text" value={newEmployee.phone} onChange={e => setNewEmployee(p => ({ ...p, phone: e.target.value }))}
                    placeholder="+213 555 12 34 56"
                    className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-semibold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Department</label>
                  <input type="text" value={newEmployee.department} onChange={e => setNewEmployee(p => ({ ...p, department: e.target.value }))}
                    placeholder="Customer Care"
                    className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-semibold" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Job Title</label>
                  <input type="text" value={newEmployee.job_title} onChange={e => setNewEmployee(p => ({ ...p, job_title: e.target.value }))}
                    placeholder="Support Engineer"
                    className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-semibold" />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-semibold text-muted-foreground block mb-1">Home Address *</label>
                <textarea value={newEmployee.home_address} onChange={e => setNewEmployee(p => ({ ...p, home_address: e.target.value }))}
                  placeholder="e.g. 123 Rue Didouche Mourad, Algiers"
                  className="w-full px-3 py-2 border border-border rounded-lg text-xs bg-background text-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary font-semibold h-16 resize-none" />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded-lg text-xs font-semibold text-muted-foreground hover:bg-muted transition-colors border border-border">
                Cancel
              </button>
              <button onClick={handleAddEmployee} className="px-4 py-2 rounded-lg text-xs font-bold bg-primary text-white hover:bg-primary/90 transition-colors shadow-sm">
                Add Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
