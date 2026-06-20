"use client"

import { ChevronRight } from "lucide-react"
import { Link } from "react-router-dom"

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar"

export function NavMain({
  items,
  onAction,
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => {
          const hasChildren = Array.isArray(item.items) && item.items.length > 0

          if (!hasChildren) {
            return (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={Boolean(item.isActive)}
                  render={
                    <Link to={item.url} className="flex w-full items-center gap-2">
                      <div className="relative flex items-center justify-center">
                        {item.icon && <item.icon />}
                        {item.badge && (
                          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-primary border-2 border-background" />
                        )}
                      </div>
                      <span>{item.title}</span>
                    </Link>
                  }
                />
              </SidebarMenuItem>
            )
          }

          return (
            <Collapsible
              key={item.title}
              defaultOpen={item.isActive}
              className="group/collapsible w-full"
              render={<SidebarMenuItem />}
            >
              <CollapsibleTrigger
                className="w-full"
                render={
                  <SidebarMenuButton tooltip={item.title} isActive={Boolean(item.isActive)}>
                    {item.icon && <item.icon />}
                    <span>{item.title}</span>
                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                }
              />
              <CollapsibleContent>
                <SidebarMenuSub>
                  {item.items?.map((subItem) => (
                    <SidebarMenuSubItem key={subItem.title}>
                      <SidebarMenuSubButton
                        render={
                          subItem.onClick || subItem.notice ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault()
                                if (subItem.onClick) return subItem.onClick()
                                if (onAction) return onAction(subItem)
                              }}
                              className="w-full text-left"
                            >
                              <span>{subItem.title}</span>
                            </button>
                          ) : (
                            <Link to={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          )
                        }
                      />
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </SidebarMenu>
    </SidebarGroup>
  )
}
