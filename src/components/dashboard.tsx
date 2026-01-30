"use client";

import React, { useState } from "react";
import { 
  LayoutDashboard, 
  BookOpen, 
  Trophy, 
  Target, 
  Settings, 
  Search,
  ChevronLeft,
  ChevronRight,
  User,
  Bell,
  LogOut
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import StarfieldBackground from "@/components/ui/Starfieldbackground";

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
  badge?: number;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/dashboard" },
  { icon: BookOpen, label: "Lernpfade", href: "/learning-paths" },
  { icon: Target, label: "Quests", href: "/quests", badge: 3 },
  { icon: Trophy, label: "Erfolge", href: "/achievements" },
  { icon: Settings, label: "Tools", href: "/tools" },
];

export default function LMSDashboard({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [activeItem, setActiveItem] = useState("Dashboard");

  return (
    <div className="min-h-screen">
      
      <StarfieldBackground/>

      {/* Plus decoration elements */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute text-cyan-400 text-2xl font-bold"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
          >
            +
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 h-full bg-[#1a1d3d]/80 backdrop-blur-md border-r-4 border-cyan-400/30 transition-all duration-300 ease-in-out z-50",
          collapsed ? "w-20" : "w-64"
        )}
      >
        {/* Logo/Avatar Section */}
        <div className="p-4 border-b-2 border-cyan-400/20">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/50 flex-shrink-0 pixel-corners">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            {!collapsed && (
              <div className="overflow-hidden">
                <p className="text-white font-bold text-lg tracking-wide truncate pixel-text">
                  SIFU
                </p>
                <p className="text-cyan-300 text-xs truncate">Level 99</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeItem === item.label;
            
            return (
              <button
                key={item.label}
                onClick={() => setActiveItem(item.label)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 relative group",
                  isActive
                    ? "bg-cyan-500/20 text-cyan-300 border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20"
                    : "text-gray-300 hover:bg-white/5 hover:text-white border-2 border-transparent"
                )}
              >
                <Icon className={cn("w-6 h-6 flex-shrink-0", isActive && "drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]")} />
                {!collapsed && (
                  <>
                    <span className="font-semibold tracking-wide truncate pixel-text">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                
                {/* Tooltip for collapsed state */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 border-2 border-cyan-400/30">
                    {item.label}
                    {item.badge && (
                      <span className="ml-2 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </nav>

        {/* Collapse Toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 bg-cyan-500 hover:bg-cyan-400 rounded-full flex items-center justify-center shadow-lg shadow-cyan-500/50 transition-all duration-200 border-2 border-[#1a1d3d] hover:scale-110"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-white" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-white" />
          )}
        </button>

        {/* Bottom Section */}
        {!collapsed && (
          <div className="absolute bottom-4 left-3 right-3 p-3 bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-lg border-2 border-cyan-400/20">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-2 bg-cyan-500 rounded-full relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
              </div>
              <span className="text-cyan-300 text-xs font-bold pixel-text">∞ XP</span>
            </div>
            <p className="text-gray-400 text-xs pixel-text">Level up: 1 XP</p>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div
        className={cn(
          "transition-all duration-300",
          collapsed ? "ml-20" : "ml-64"
        )}
      >
        {/* Top Header */}
        <header className="h-16 bg-[#1a1d3d]/60 backdrop-blur-md border-b-2 border-cyan-400/20 sticky top-0 z-40">
          <div className="h-full px-6 flex items-center justify-between">
            {/* Search Bar */}
            <div className="flex-1 max-w-xl">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Suche nach Kursen, Quests, Badges..."
                  className="w-full pl-11 pr-4 py-2.5 bg-[#252852]/50 border-2 border-cyan-400/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400/50 focus:shadow-lg focus:shadow-cyan-500/20 transition-all pixel-text"
                />
              </div>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-3 ml-6">
              {/* Notifications */}
              <button className="relative p-2 hover:bg-white/5 rounded-lg transition-colors group">
                <Bell className="w-6 h-6 text-gray-300 group-hover:text-white transition-colors" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#1a1d3d] animate-pulse" />
              </button>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 p-2 pr-3 hover:bg-white/5 rounded-lg transition-all group">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30 pixel-corners">
                      <span className="text-white font-bold">S</span>
                    </div>
                    <div className="text-left hidden sm:block">
                      <p className="text-white font-semibold text-sm pixel-text">SIFU</p>
                      <p className="text-cyan-300 text-xs">Level 99</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-56 bg-[#1a1d3d] border-2 border-cyan-400/30 text-white pixel-text"
                >
                  <DropdownMenuLabel className="text-cyan-300">Mein Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-cyan-400/20" />
                  <DropdownMenuItem className="focus:bg-cyan-500/20 focus:text-cyan-300 cursor-pointer">
                    <User className="mr-2 h-4 w-4" />
                    Profil
                  </DropdownMenuItem>
                  <DropdownMenuItem className="focus:bg-cyan-500/20 focus:text-cyan-300 cursor-pointer">
                    <Settings className="mr-2 h-4 w-4" />
                    Einstellungen
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-cyan-400/20" />
                  <DropdownMenuItem className="focus:bg-red-500/20 focus:text-red-300 cursor-pointer">
                    <LogOut className="mr-2 h-4 w-4" />
                    Abmelden
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children}
        </main>
      </div>

      <style jsx global>{`
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.5); }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-twinkle {
          animation: twinkle 3s ease-in-out infinite;
        }
        
        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }
        
        .pixel-corners {
          clip-path: polygon(
            0 4px, 4px 4px, 4px 0,
            calc(100% - 4px) 0, calc(100% - 4px) 4px, 100% 4px,
            100% calc(100% - 4px), calc(100% - 4px) calc(100% - 4px), calc(100% - 4px) 100%,
            4px 100%, 4px calc(100% - 4px), 0 calc(100% - 4px)
          );
        }
        
        .pixel-text {
          font-family: 'Courier New', monospace;
          letter-spacing: 0.5px;
        }
        
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        
        .pixel-text {
          font-family: 'Courier New', 'Press Start 2P', monospace;
        }
      `}</style>
    </div>
  );
}
