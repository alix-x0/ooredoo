"use client"

import {
  BadgeCheck,
  ChevronsUpDown,
  LogOut,
} from "lucide-react"
import { useNavigate } from "react-router-dom"

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

export function NavUser({ user, handleLogout }) {
  const { isMobile } = useSidebar()
  const navigate = useNavigate()

  if (!user) return null

  const displayName = (user.first_name || user.last_name)
    ? `${user.first_name || ""} ${user.last_name || ""}`.trim()
    : user.username || user.email

  const roleLabel = user.role === "ADMIN" ? "Administrator" : user.role === "WAREHOUSE" ? "Warehouse" : user.role

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            className="w-full"
            render={
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground w-full"
              >
                <Avatar className="h-8 w-8 rounded-lg shrink-0">
                  <AvatarImage src={user.profile_picture} alt={user.username} className="object-cover" />
                  <AvatarFallback className="rounded-lg uppercase">
                    {(user.first_name?.charAt(0) || user.username?.charAt(0) || "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight overflow-hidden">
                  <span className="truncate font-semibold">{displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">{roleLabel}</span>
                </div>
                <ChevronsUpDown className="ml-auto size-4" />
              </SidebarMenuButton>
            }
          />
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <div className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg shrink-0">
                  <AvatarImage src={user.profile_picture} alt={user.username} className="object-cover" />
                  <AvatarFallback className="rounded-lg uppercase">
                    {(user.first_name?.charAt(0) || user.username?.charAt(0) || "U")}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight overflow-hidden">
                  <span className="truncate font-semibold">{displayName}</span>
                  <span className="truncate text-xs text-muted-foreground">{roleLabel}</span>
                </div>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <BadgeCheck className="mr-2" />
                Account
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
