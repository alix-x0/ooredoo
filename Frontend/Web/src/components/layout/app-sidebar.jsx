"use client"

import * as React from "react"
import { useLocation, useNavigate } from "react-router-dom"
import {
  LayoutDashboard,
  Settings2,
  Users,
  Search,
  Warehouse,
  Package,
  BarChart3,
  UserCog,
  Gift,
  Truck,
} from "lucide-react"

import { NavMain } from "@/components/layout/nav-main"
import { NavUser } from "@/components/layout/nav-user"
import { TeamSwitcher } from "@/components/layout/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarGroup,
  SidebarGroupContent,
} from "@/components/ui/sidebar"
import api from "@/api/api"
import { ACCESS_TOKEN, USER_ROLE } from "@/constants"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import ooredooLogo from "@/assets/Logo.svg"

export function AppSidebar({ ...props }) {
  const [userInfo, setUserInfo] = React.useState(null)
  const [searchQuery, setSearchQuery] = React.useState("")
  const navigate = useNavigate()
  const location = useLocation()

  React.useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem(ACCESS_TOKEN)
        if (token) {
          const res = await api.get("/auth/profile/")
          setUserInfo(res.data)
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error)
      }
    }
    fetchProfile()
  }, [location.pathname])

  const handleLogout = () => {
    localStorage.clear()
    navigate("/login")
  }

  const role = userInfo?.role || localStorage.getItem(USER_ROLE) || ""

  const navItems = React.useMemo(() => {
    let baseItems = []

    if (role === "ADMIN") {
      baseItems = [
        {
          title: "Dashboard",
          url: "/admin",
          icon: LayoutDashboard,
          isActive: location.pathname === "/admin",
          items: [
            { title: "Overview", url: "/admin" },
            { title: "Analytics", url: "/admin/analytics" },
          ],
        },
        {
          title: "User Management",
          url: "/admin/users",
          icon: Users,
          isActive: location.pathname.startsWith("/admin/users"),
        },
        {
          title: "Warehouses",
          url: "/admin/warehouses",
          icon: Warehouse,
          isActive: location.pathname.startsWith("/admin/warehouses"),
        },
        {
          title: "Gifts",
          url: "/admin/gifts",
          icon: Gift,
          isActive: location.pathname.startsWith("/admin/gifts"),
        },
        {
          title: "Settings",
          url: "/admin/settings",
          icon: Settings2,
          isActive: location.pathname.startsWith("/admin/settings"),
        },
      ]
    } else if (role === "WAREHOUSE") {
      baseItems = [
        {
          title: "Dashboard",
          url: "/warehouse",
          icon: LayoutDashboard,
          isActive: location.pathname === "/warehouse",
          items: [
            { title: "Overview", url: "/warehouse" },
          ],
        },
        {
          title: "Inventory",
          url: "/warehouse/inventory",
          icon: Package,
          isActive: location.pathname.startsWith("/warehouse/inventory"),
        },
        {
          title: "Dispatches",
          url: "/warehouse/dispatches",
          icon: Truck,
          isActive: location.pathname.startsWith("/warehouse/dispatches"),
        },
        {
          title: "Settings",
          url: "/warehouse/settings",
          icon: Settings2,
          isActive: location.pathname.startsWith("/warehouse/settings"),
        },
      ]
    }

    // Filter by search
    if (!searchQuery.trim()) return baseItems

    const query = searchQuery.toLowerCase()
    return baseItems
      .map((item) => {
        const titleMatch = item.title.toLowerCase().includes(query)
        const itemsMatch = item.items?.filter((sub) =>
          sub.title.toLowerCase().includes(query)
        ) || []

        if (titleMatch) return item
        if (itemsMatch.length > 0) return { ...item, items: itemsMatch }
        return null
      })
      .filter(Boolean)
  }, [location.pathname, role, searchQuery])

  const subtitle = role === "ADMIN" ? "Admin Portal" : role === "WAREHOUSE" ? "Warehouse Portal" : "Portal"

  return (
    <Sidebar variant="inset" collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher
          logoSrc={ooredooLogo}
          name="Ooredoo"
          subtitle={subtitle}
        />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup className="py-0 group-data-[collapsible=icon]:hidden">
          <SidebarGroupContent className="relative">
            <Label htmlFor="search" className="sr-only">
              Search
            </Label>
            <Input
              id="search"
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 bg-sidebar-accent/50 border-none shadow-none h-9 mt-2"
            />
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 select-none opacity-50" />
          </SidebarGroupContent>
        </SidebarGroup>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userInfo} handleLogout={handleLogout} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
