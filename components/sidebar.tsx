"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, RefreshCw, ArrowUpRight, History } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ isOpen, onToggle }: SidebarProps) {
  const router = useRouter();
  const pathname = usePathname();

  const navigationItems = [
    {
      name: "Swap",
      path: "/swap",
      icon: RefreshCw,
      description: "Exchange tokens"
    },
    {
      name: "Convert",
      path: "/convert", 
      icon: ArrowUpRight,
      description: "Convert to fiat"
    },
    {
      name: "Transactions",
      path: "/transaction",
      icon: History,
      description: "View transaction history"
    }
  ];

  const handleNavigation = (path: string) => {
    router.push(path);
    onToggle(); // Close sidebar after navigation
  };

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed top-0 left-0 h-full w-80 bg-background border-r border-border z-50 transform transition-transform duration-300 ease-in-out lg:hidden",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold">Overview</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            className="lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation Items */}
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.path;
            
            return (
              <Button
                key={item.path}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start h-auto p-4 text-left",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-muted"
                )}
                onClick={() => handleNavigation(item.path)}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <div className="flex flex-col items-start">
                    <span className="font-medium">{item.name}</span>
                    <span className={cn(
                      "text-xs",
                      isActive 
                        ? "text-primary-foreground/70" 
                        : "text-muted-foreground"
                    )}>
                      {item.description}
                    </span>
                  </div>
                </div>
              </Button>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="text-xs text-muted-foreground text-center">
            Amigo Exchange
          </div>
        </div>
      </div>
    </>
  );
}

// Hamburger Menu Button Component
export function HamburgerMenu({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="lg:hidden"
    >
      <Menu className="h-5 w-5" />
      <span className="sr-only">Open menu</span>
    </Button>
  );
}
