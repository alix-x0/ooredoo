"use client"

import * as React from "react"
import {
  SidebarMenu,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function TeamSwitcher({
  logoSrc,
  name,
  subtitle
}) {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <div className="flex flex-col gap-1.5 px-2 py-1.5 group-data-[collapsible=icon]:flex-row group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:py-2">
          {logoSrc && (
            <>
              {/* Expanded state logo */}
              <div className="flex h-8 w-auto items-center justify-start overflow-hidden flex-shrink-0 group-data-[collapsible=icon]:hidden">
                <img
                  src={logoSrc}
                  alt={name}
                  className="h-7 w-auto object-contain"
                />
              </div>
              {/* Collapsed state logo - beautiful red circle brand icon */}
              <div className="hidden group-data-[collapsible=icon]:flex h-8 w-8 items-center justify-center rounded-full bg-[#e60000] text-white font-extrabold text-base flex-shrink-0 shadow-sm select-none">
                o
              </div>
            </>
          )}
          <div className="flex flex-col text-left group-data-[collapsible=icon]:hidden">
            <span className="text-xs font-semibold text-muted-foreground px-0.5">
              {subtitle}
            </span>
          </div>
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
