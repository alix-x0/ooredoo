"use client"

import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/layout/app-sidebar"
import { Separator } from "@/components/ui/separator"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Outlet, useLocation } from "react-router-dom"
import { useTheme } from "@/components/theme-provider"
import { Button } from "@/components/ui/button"
import { Sun, Moon } from "lucide-react"

export default function DashboardLayout() {
  const { theme, setTheme } = useTheme()
  const location = useLocation()
  const pathSegments = location.pathname.split("/").filter(Boolean)
  const appleFont = "-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header 
          className="flex h-16 shrink-0 items-center justify-between px-4 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 border-b border-border/40"
          style={{ fontFamily: appleFont }}
        >
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="/">Home</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage className="capitalize">
                    {pathSegments[pathSegments.length - 1]?.replace(/-/g, " ") || "Dashboard"}
                  </BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            >
              {theme === "dark" ? (
                <Sun className="h-[18px] w-[18px] text-amber-500 fill-amber-500/20" />
              ) : (
                <Moon className="h-[18px] w-[18px] text-slate-700 dark:text-slate-300" />
              )}
            </Button>
          </div>
        </header>
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
